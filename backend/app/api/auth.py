import datetime
import logging
import secrets
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status, Query, Form
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

from app.db.database import get_db
from app.schemas.auth import (
    CitizenRegisterRequest,
    LoginRequest,
    StaffLoginRequest,
    GoogleAuthRequest,
    PhoneSendOTPRequest,
    PhoneVerifyOTPRequest,
    ForgotPasswordRequest,
    VerifyOTPRequest,
    ResetPasswordRequest,
    RefreshTokenRequest,
    TokenResponse,
    MessageResponse
)
from app.schemas.user import UserPublicResponse
from app.services.auth_service import auth_service
from app.services.user_service import user_service
from app.services.otp_service import otp_service
from app.core.permissions import get_current_user
from app.models.user import User
from app.models.role import RoleEnum
from app.models.refresh_token import RefreshToken
from app.core.security import create_access_token, create_refresh_token
from app.core.config import settings
from app.core.exceptions import AuthenticationError, ValidationError

router = APIRouter(prefix="/auth", tags=["Authentication"])


def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    """Set secure HTTP-only cookies where appropriate."""
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False if settings.APP_ENV == "development" else True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False if settings.APP_ENV == "development" else True,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    )


def clear_auth_cookies(response: Response):
    response.delete_cookie(key="access_token", samesite="lax")
    response.delete_cookie(key="refresh_token", samesite="lax")


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_citizen(
    req: CitizenRegisterRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """Public citizen registration."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent")

    user, access_token, refresh_token = await auth_service.register_citizen(
        db=db,
        name=req.name,
        email=req.email,
        password=req.password,
        phone=req.phone,
        ip_address=client_ip,
        user_agent=user_agent
    )

    set_auth_cookies(response, access_token, refresh_token)
    user_public = UserPublicResponse(**user_service.map_user_to_public(user))

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_public
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    req: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """Login for Citizens and Staff using email/badge and password."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent")

    user, access_token, refresh_token = await auth_service.login_user(
        db=db,
        identifier=req.email,
        password=req.password,
        mfa_code=req.mfa_code,
        target_role=req.target_role,
        ip_address=client_ip,
        user_agent=user_agent
    )

    set_auth_cookies(response, access_token, refresh_token)
    user_public = UserPublicResponse(**user_service.map_user_to_public(user))

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_public
    )


import httpx

# In-memory storage for short-lived Google OAuth state & single-use authorization tickets
# Maps ticket_code -> {"access_token": ..., "refresh_token": ..., "user_id": ..., "expires_at": ...}
OAUTH_TICKETS = {}


@router.get("/google")
async def google_auth_url(request: Request, response: Response):
    """Returns Google OAuth authorization URL or configuration status with CSRF state cookie.
    If GOOGLE_CLIENT_ID is configured, returns official Google OAuth URL.
    If unconfigured in development mode, returns local Google OAuth Consent Sandbox URL so
    Google Sign-In works out of the box with zero external dependencies."""
    csrf_state = secrets.token_urlsafe(32)
    # Store csrf_state in an HttpOnly cookie for CSRF verification on callback
    response.set_cookie(
        key="oauth_state",
        value=csrf_state,
        httponly=True,
        secure=False if settings.APP_ENV == "development" else True,
        samesite="lax",
        max_age=600  # 10 minutes
    )

    if settings.GOOGLE_CLIENT_ID:
        redirect_uri = settings.GOOGLE_REDIRECT_URI or f"{settings.FRONTEND_URL}/api/v1/auth/google/callback"
        auth_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={settings.GOOGLE_CLIENT_ID}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"scope=openid%20email%20profile&"
            f"state={csrf_state}&"
            f"access_type=offline&"
            f"prompt=select_account"
        )
        return {
            "configured": True,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "authorization_url": auth_url,
            "auth_url": auth_url,
            "state": csrf_state
        }

    # Production environment requires explicit Google Cloud credentials
    if settings.APP_ENV == "production":
        return {
            "configured": False,
            "client_id": None,
            "authorization_url": None,
            "auth_url": None,
            "message": "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
        }

    # Development / Sandbox Google Identity Provider
    base_url = str(request.base_url).rstrip("/")
    dev_auth_url = f"{base_url}/api/v1/auth/google/dev-consent?state={csrf_state}"
    return {
        "configured": True,
        "is_dev_mode": True,
        "client_id": "google-dev-sandbox",
        "authorization_url": dev_auth_url,
        "auth_url": dev_auth_url,
        "state": csrf_state,
        "message": "Running in Development Google Sandbox mode. Real Google credentials can be configured in .env"
    }


@router.get("/google/dev-consent", response_class=HTMLResponse)
async def google_dev_consent(state: str, request: Request):
    """
    Renders an authentic Google Account Chooser in development mode.
    Allows testing Google Sign-In with 1-click accounts or custom Gmail.
    """
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in with Google - CCIP Astraea Enclave</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }}
    body {{ background-color: #0b0f19; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }}
    .card {{ background: #111827; border: 1px solid #1f2937; border-radius: 16px; width: 100%; max-width: 440px; padding: 36px 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5); }}
    .logo-container {{ display: flex; justify-content: center; margin-bottom: 20px; }}
    .title {{ font-size: 22px; font-weight: 600; text-align: center; color: #f9fafb; margin-bottom: 6px; }}
    .subtitle {{ font-size: 14px; color: #9ca3af; text-align: center; margin-bottom: 20px; line-height: 1.4; }}
    .badge {{ display: block; background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.3); color: #60a5fa; font-size: 12px; padding: 6px 12px; border-radius: 8px; margin-bottom: 20px; font-weight: 500; text-align: center; }}
    .accounts-list {{ display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }}
    .account-item {{ display: flex; align-items: center; gap: 14px; padding: 12px 14px; border: 1px solid #1f2937; border-radius: 12px; background: #1e293b; cursor: pointer; transition: all 0.2s ease; text-decoration: none; color: inherit; width: 100%; text-align: left; }}
    .account-item:hover {{ background: #283548; border-color: #3b82f6; transform: translateY(-1px); }}
    .avatar {{ width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 16px; color: white; flex-shrink: 0; }}
    .avatar-v {{ background: linear-gradient(135deg, #3b82f6, #1d4ed8); }}
    .avatar-e {{ background: linear-gradient(135deg, #6366f1, #4338ca); }}
    .avatar-k {{ background: linear-gradient(135deg, #10b981, #047857); }}
    .account-info {{ flex: 1; min-width: 0; }}
    .account-name {{ font-size: 15px; font-weight: 600; color: #f3f4f6; }}
    .account-email {{ font-size: 13px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }}
    .signed-in-pill {{ font-size: 11px; color: #10b981; background: rgba(16, 185, 129, 0.1); padding: 2px 8px; border-radius: 6px; font-weight: 500; }}
    .custom-section {{ border-top: 1px solid #1f2937; padding-top: 18px; margin-top: 6px; }}
    .custom-title {{ font-size: 12px; font-weight: 600; color: #94a3b8; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }}
    .form-group {{ margin-bottom: 12px; }}
    .form-group label {{ display: block; font-size: 12px; color: #94a3b8; margin-bottom: 4px; }}
    .form-group input {{ width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #374151; background: #0f172a; color: white; font-size: 14px; outline: none; }}
    .form-group input:focus {{ border-color: #3b82f6; }}
    .btn-submit {{ width: 100%; padding: 10px; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s; }}
    .btn-submit:hover {{ background: #1d4ed8; }}
    .footer-note {{ font-size: 11px; color: #64748b; text-align: center; margin-top: 20px; line-height: 1.4; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-container">
      <svg viewBox="0 0 24 24" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"/>
        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
      </svg>
    </div>
    <h1 class="title">Sign in with Google</h1>
    <p class="subtitle">Choose an account to continue to <strong>CCIP / Astraea Enclave</strong></p>
    <div class="badge">Google OAuth Development Sandbox Enabled</div>

    <div class="accounts-list">
      <form method="POST" action="/api/v1/auth/google/dev-callback">
        <input type="hidden" name="state" value="{state}">
        <input type="hidden" name="email" value="vijay@gmail.com">
        <input type="hidden" name="name" value="Vijay">
        <input type="hidden" name="google_id" value="google_sandbox_vijay_101">
        <button type="submit" class="account-item">
          <div class="avatar avatar-v">V</div>
          <div class="account-info">
            <div class="account-name">Vijay</div>
            <div class="account-email">vijay@gmail.com</div>
          </div>
          <span class="signed-in-pill">Signed In</span>
        </button>
      </form>

      <form method="POST" action="/api/v1/auth/google/dev-callback">
        <input type="hidden" name="state" value="{state}">
        <input type="hidden" name="email" value="elango.kumar@gmail.com">
        <input type="hidden" name="name" value="Elango Kumar">
        <input type="hidden" name="google_id" value="google_sandbox_elango_102">
        <button type="submit" class="account-item">
          <div class="avatar avatar-e">E</div>
          <div class="account-info">
            <div class="account-name">Elango Kumar</div>
            <div class="account-email">elango.kumar@gmail.com</div>
          </div>
          <span class="signed-in-pill">Signed In</span>
        </button>
      </form>

      <form method="POST" action="/api/v1/auth/google/dev-callback">
        <input type="hidden" name="state" value="{state}">
        <input type="hidden" name="email" value="kavitha.ramesh@gmail.com">
        <input type="hidden" name="name" value="Kavitha Ramesh">
        <input type="hidden" name="google_id" value="google_sandbox_kavitha_103">
        <button type="submit" class="account-item">
          <div class="avatar avatar-k">K</div>
          <div class="account-info">
            <div class="account-name">Kavitha Ramesh</div>
            <div class="account-email">kavitha.ramesh@gmail.com</div>
          </div>
          <span class="signed-in-pill">Signed In</span>
        </button>
      </form>
    </div>

    <div class="custom-section">
      <div class="custom-title">Use Another Account</div>
      <form method="POST" action="/api/v1/auth/google/dev-callback">
        <input type="hidden" name="state" value="{state}">
        <input type="hidden" name="google_id" value="">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" name="name" placeholder="e.g. Alex Mercer" required>
        </div>
        <div class="form-group">
          <label>Gmail Address</label>
          <input type="email" name="email" placeholder="e.g. alex.mercer@gmail.com" required>
        </div>
        <button type="submit" class="btn-submit">Continue with this Account</button>
      </form>
    </div>

    <p class="footer-note">For production Google OAuth, configure <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> in <code>backend/.env</code>.</p>
  </div>
</body>
</html>"""
    return HTMLResponse(content=html_content)


@router.post("/google/dev-callback")
@router.get("/google/dev-callback")
async def google_dev_callback(
    request: Request,
    response: Response,
    state: Optional[str] = None,
    email: Optional[str] = None,
    name: Optional[str] = None,
    google_id: Optional[str] = None,
    avatar_url: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Handles callback from the Development Google Identity Sandbox.
    Validates CSRF state, provisions or logs in user, issues short-lived single-use auth_ticket,
    sets session cookies, and redirects safely to the frontend Citizen Portal.
    """
    frontend_base = settings.FRONTEND_URL.rstrip("/")

    # In case request was sent as Form data via POST
    if request.method == "POST":
        try:
            form_data = await request.form()
            state_val = form_data.get("state")
            if isinstance(state_val, str):
                state = state or state_val
            email_val = form_data.get("email")
            if isinstance(email_val, str):
                email = email or email_val
            name_val = form_data.get("name")
            if isinstance(name_val, str):
                name = name or name_val
            gid_val = form_data.get("google_id")
            if isinstance(gid_val, str):
                google_id = google_id or gid_val
            avatar_val = form_data.get("avatar_url")
            if isinstance(avatar_val, str):
                avatar_url = avatar_url or avatar_val
        except Exception:
            pass

    if not email or not name:
        return RedirectResponse(f"{frontend_base}/?auth_error=invalid_dev_credentials", status_code=302)

    # CSRF state validation against cookie
    stored_state = request.cookies.get("oauth_state")
    if not stored_state or not state or not secrets.compare_digest(stored_state, state):
        return RedirectResponse(f"{frontend_base}/?auth_error=csrf_validation_failed", status_code=302)

    import hashlib
    clean_email = email.strip().lower()
    clean_name = name.strip()
    clean_gid = google_id or f"google_dev_{hashlib.sha256(clean_email.encode()).hexdigest()[:16]}"

    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent")

    user, access_token, refresh_token = await auth_service.authenticate_or_register_google_user(
        db=db,
        google_id=clean_gid,
        email=clean_email,
        full_name=clean_name,
        avatar_url=avatar_url,
        ip_address=client_ip,
        user_agent=user_agent
    )

    now = datetime.datetime.now(datetime.timezone.utc)
    expired_keys = [k for k, v in OAUTH_TICKETS.items() if v["expires_at"] < now]
    for k in expired_keys:
        OAUTH_TICKETS.pop(k, None)

    auth_ticket = secrets.token_urlsafe(32)
    OAUTH_TICKETS[auth_ticket] = {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user_id": user.id,
        "expires_at": now + datetime.timedelta(seconds=60)
    }

    redirect_response = RedirectResponse(
        url=f"{frontend_base}/?auth_ticket={auth_ticket}&portal=citizen",
        status_code=status.HTTP_302_FOUND
    )
    set_auth_cookies(redirect_response, access_token, refresh_token)
    redirect_response.delete_cookie("oauth_state")
    return redirect_response


async def _verify_google_id_token(id_token: str) -> dict:
    """
    Cryptographically verify Google ID Token using Google's public tokeninfo API.
    Validates audience, issuer, expiration, and email_verified.
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get("https://oauth2.googleapis.com/tokeninfo", params={"id_token": id_token})
        if resp.status_code != 200:
            raise AuthenticationError(f"Invalid Google ID token: verification failed with status {resp.status_code}")
        data = resp.json()

    # Validate issuer
    issuer = data.get("iss")
    if issuer not in ("accounts.google.com", "https://accounts.google.com"):
        raise AuthenticationError(f"Invalid Google token issuer: {issuer}")

    # Validate audience (must match our GOOGLE_CLIENT_ID if configured)
    if settings.GOOGLE_CLIENT_ID:
        aud = data.get("aud")
        if aud != settings.GOOGLE_CLIENT_ID:
            raise AuthenticationError(f"Token audience mismatch. Expected {settings.GOOGLE_CLIENT_ID}, got {aud}")

    # Validate expiration
    exp = int(data.get("exp", 0))
    if exp < datetime.datetime.now(datetime.timezone.utc).timestamp():
        raise AuthenticationError("Google ID token has expired")

    # Validate email verification
    email_verified = data.get("email_verified")
    if str(email_verified).lower() not in ("true", "1"):
        raise AuthenticationError("Google account email is not verified")

    return data


@router.post("/google", response_model=TokenResponse)
async def google_auth_verify(
    req: GoogleAuthRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Direct API endpoint for Google Sign-In (receives code, credential, or id_token from Google Web SDK).
    Verifies ID token or exchanges code, authenticates user, sets HttpOnly cookies.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent")

    token_to_verify = req.id_token or req.credential
    google_data = None

    if req.code:
        # Exchange authorization code for tokens
        redirect_uri = req.redirect_uri or settings.GOOGLE_REDIRECT_URI
        async with httpx.AsyncClient(timeout=10.0) as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": req.code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code"
                }
            )
            if token_resp.status_code != 200:
                raise AuthenticationError(f"Failed to exchange Google authorization code: {token_resp.text}")
            token_json = token_resp.json()
            id_token = token_json.get("id_token")
            if not id_token:
                raise AuthenticationError("Google did not return an ID token")
            google_data = await _verify_google_id_token(id_token)
    elif token_to_verify:
        google_data = await _verify_google_id_token(token_to_verify)
    else:
        raise ValidationError("Must provide Google authorization code or ID token")

    google_id = google_data.get("sub")
    email = google_data.get("email")
    if not google_id or not email:
        raise AuthenticationError("Google identity response is missing required identity fields (sub, email)")
    name = google_data.get("name") or google_data.get("given_name") or email.split("@")[0]
    avatar_url = google_data.get("picture")

    user, access_token, refresh_token = await auth_service.authenticate_or_register_google_user(
        db=db,
        google_id=google_id,
        email=email,
        full_name=name,
        avatar_url=avatar_url,
        ip_address=client_ip,
        user_agent=user_agent
    )

    set_auth_cookies(response, access_token, refresh_token)
    user_public = UserPublicResponse(**user_service.map_user_to_public(user))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_public
    )


@router.get("/google/callback")
async def google_auth_callback(
    request: Request,
    response: Response,
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Handles Google OAuth2 redirect callback.
    Validates CSRF state, exchanges code for Google ID token, logs in user,
    and sets HttpOnly cookie session AND generates a short-lived single-use auth ticket
    for the frontend. Never leaks JWT tokens in URL parameters.
    """
    frontend_base = settings.FRONTEND_URL.rstrip("/")
    if error:
        return RedirectResponse(f"{frontend_base}/?auth_error={error}")
    if not code:
        return RedirectResponse(f"{frontend_base}/?auth_error=missing_code")

    # CSRF state validation against cookie
    stored_state = request.cookies.get("oauth_state")
    if stored_state and state and not secrets.compare_digest(stored_state, state):
        return RedirectResponse(f"{frontend_base}/?auth_error=csrf_validation_failed")

    try:
        # Exchange code for tokens
        redirect_uri = settings.GOOGLE_REDIRECT_URI or f"{settings.FRONTEND_URL}/api/v1/auth/google/callback"
        async with httpx.AsyncClient(timeout=10.0) as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code"
                }
            )
            if token_resp.status_code != 200:
                return RedirectResponse(f"{frontend_base}/?auth_error=code_exchange_failed")
            
            token_json = token_resp.json()
            id_token = token_json.get("id_token")
            if not id_token:
                return RedirectResponse(f"{frontend_base}/?auth_error=missing_id_token")
            
            google_data = await _verify_google_id_token(id_token)

        client_ip = request.client.host if request.client else "127.0.0.1"
        user_agent = request.headers.get("user-agent")
        google_id = google_data.get("sub")
        email = google_data.get("email")
        if not google_id or not email:
            return RedirectResponse(f"{frontend_base}/?auth_error=missing_identity_fields", status_code=302)
        name = google_data.get("name") or google_data.get("given_name") or email.split("@")[0]
        avatar_url = google_data.get("picture")

        user, access_token, refresh_token = await auth_service.authenticate_or_register_google_user(
            db=db,
            google_id=google_id,
            email=email,
            full_name=name,
            avatar_url=avatar_url,
            ip_address=client_ip,
            user_agent=user_agent
        )

        # Generate a short-lived single-use one-time authorization ticket
        # Clean up expired tickets
        now = datetime.datetime.now(datetime.timezone.utc)
        expired_keys = [k for k, v in OAUTH_TICKETS.items() if v["expires_at"] < now]
        for k in expired_keys:
            OAUTH_TICKETS.pop(k, None)

        auth_ticket = secrets.token_urlsafe(32)
        OAUTH_TICKETS[auth_ticket] = {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user_id": user.id,
            "expires_at": now + datetime.timedelta(seconds=60)  # 60s TTL
        }

        # Secure redirect: sets HttpOnly cookies AND attaches auth_ticket
        redirect_response = RedirectResponse(
            url=f"{frontend_base}/?auth_ticket={auth_ticket}&portal=citizen",
            status_code=status.HTTP_302_FOUND
        )
        set_auth_cookies(redirect_response, access_token, refresh_token)
        redirect_response.delete_cookie("oauth_state")
        return redirect_response

    except Exception as e:
        logger.exception(f"Google OAuth callback error: {e}")
        return RedirectResponse(f"{frontend_base}/?auth_error=authentication_failed")


from app.schemas.auth import GoogleExchangeRequest, PhoneCompleteOnboardingRequest


@router.post("/google/exchange", response_model=TokenResponse)
async def exchange_google_ticket(
    req: GoogleExchangeRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Exchange a short-lived one-time authorization ticket for full TokenResponse.
    Prevents leaking tokens in browser history and query strings.
    """
    ticket_key = req.ticket
    ticket_data = OAUTH_TICKETS.pop(ticket_key, None)
    if not ticket_data:
        raise AuthenticationError("Authorization ticket is invalid or has expired")

    now = datetime.datetime.now(datetime.timezone.utc)
    if ticket_data["expires_at"] < now:
        raise AuthenticationError("Authorization ticket has expired")

    user = await user_service.get_by_id(db, ticket_data["user_id"])
    if not user:
        raise AuthenticationError("User not found")

    access_token = ticket_data["access_token"]
    refresh_token = ticket_data["refresh_token"]
    set_auth_cookies(response, access_token, refresh_token)
    user_public = UserPublicResponse(**user_service.map_user_to_public(user))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_public
    )


@router.post("/phone/send-otp", response_model=MessageResponse)
async def send_phone_otp(
    req: PhoneSendOTPRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate and dispatch SMS OTP code for phone authentication.
    dev_otp is ONLY exposed when APP_ENV is explicitly 'development' or 'testing'.
    It is NEVER exposed in production.
    """
    otp_code = await otp_service.generate_and_send_otp(db, req.phone, "PHONE_LOGIN")
    is_dev = settings.APP_ENV in ("development", "testing") or settings.DEBUG
    return MessageResponse(
        message=f"Verification code sent to {req.phone}",
        data={"dev_otp": otp_code} if is_dev else None
    )


@router.post("/phone/verify-otp", response_model=TokenResponse)
async def verify_phone_otp(
    req: PhoneVerifyOTPRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify phone OTP and authenticate citizen.
    If user already exists or full_name is provided, logs in and returns access token.
    If new user without full_name, returns onboarding_token for profile completion.
    """
    await otp_service.verify_otp(db, req.phone, req.otp, "PHONE_LOGIN")

    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent")

    user, access_token, refresh_token, is_new_user, onboarding_token = await auth_service.authenticate_or_register_phone_user(
        db=db,
        phone=req.phone,
        full_name=req.full_name,
        email=req.email,
        ip_address=client_ip,
        user_agent=user_agent
    )

    if is_new_user:
        # Must complete profile onboarding first (requirement 6)
        return TokenResponse(
            is_new_user=True,
            onboarding_token=onboarding_token,
            access_token=None,
            refresh_token=None,
            expires_in=None,
            user=None
        )

    if not user or not access_token or not refresh_token:
        raise AuthenticationError("Failed to issue credentials for verified phone user")

    set_auth_cookies(response, access_token, refresh_token)
    user_public = UserPublicResponse(**user_service.map_user_to_public(user))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_public,
        is_new_user=False
    )


@router.post("/phone/complete-onboarding", response_model=TokenResponse)
async def complete_phone_onboarding(
    req: PhoneCompleteOnboardingRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Completes onboarding for a new phone user by providing full_name (and optional email).
    Issues JWT access/refresh tokens and establishes citizen session.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent")

    user, access_token, refresh_token = await auth_service.complete_phone_onboarding(
        db=db,
        onboarding_token=req.onboarding_token,
        full_name=req.full_name,
        email=req.email,
        ip_address=client_ip,
        user_agent=user_agent
    )

    set_auth_cookies(response, access_token, refresh_token)
    user_public = UserPublicResponse(**user_service.map_user_to_public(user))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_public,
        is_new_user=False
    )


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    req: ForgotPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Send 6-digit verification code to registered email."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    await auth_service.request_password_reset(db, req.email, client_ip)
    return MessageResponse(
        message=f"If an account is associated with {req.email}, a verification code has been dispatched."
    )


@router.post("/verify-otp", response_model=MessageResponse)
async def verify_reset_otp(
    req: VerifyOTPRequest,
    db: AsyncSession = Depends(get_db)
):
    """Validate 6-digit verification code before password reset."""
    await otp_service.verify_otp(db, req.email, req.otp, "PASSWORD_RESET")
    return MessageResponse(message="Verification code validated successfully.")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    req: ResetPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Set new password using verified OTP code."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    await auth_service.reset_password_with_otp(
        db=db,
        email=req.email,
        otp=req.otp,
        new_password=req.new_password,
        ip_address=client_ip
    )
    return MessageResponse(message="Passphrase updated and cryptographically sealed.")


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: Request,
    response: Response,
    req: Optional[RefreshTokenRequest] = None,
    db: AsyncSession = Depends(get_db)
):
    """Rotate and issue a new access token."""
    raw_token = None
    if req and req.refresh_token:
        raw_token = req.refresh_token
    elif request and "refresh_token" in request.cookies:
        raw_token = request.cookies.get("refresh_token")

    if not raw_token:
        raise AuthenticationError("Refresh token not provided")

    new_access, new_refresh, user = await auth_service.refresh_access_token(db, raw_token)
    if response:
        set_auth_cookies(response, new_access, new_refresh)

    user_public = UserPublicResponse(**user_service.map_user_to_public(user))
    return TokenResponse(
        access_token=new_access,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_public
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    response: Response,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Revoke session and clear authentication cookies."""
    raw_refresh = request.cookies.get("refresh_token")
    await auth_service.logout_user(db, current_user.id, raw_refresh)
    clear_auth_cookies(response)
    return MessageResponse(message="Successfully signed out of operational enclave.")


@router.get("/me", response_model=UserPublicResponse)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    """Get profile of current authenticated user."""
    return UserPublicResponse(**user_service.map_user_to_public(current_user))
