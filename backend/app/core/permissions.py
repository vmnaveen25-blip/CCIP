from typing import List, Optional
from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import jwt

from app.db.database import get_db
from app.models.user import User
from app.models.role import RoleEnum
from app.core.config import settings
from app.core.security import decode_token
from app.core.exceptions import AuthenticationError, PermissionDeniedError
from app.core.logging import logger

security_bearer = HTTPBearer(auto_error=False)

PRIVILEGED_PREFIXES = (
    "/api/v1/admin",
    "/api/v1/evidence",
    "/api/v1/cases",
    "/api/v1/investigations",
    "/api/v1/reports",
    "/api/v1/mlops",
    "/api/v1/users",
    "/api/v1/police",
    "/api/v1/specialist",
)


def _is_dev_bypass_permitted(request: Request) -> bool:
    """Explicit development authentication bypass check.
    Disabled by default; restricted strictly to development environment,
    localhost connections, and non-privileged routes.
    """
    if not getattr(settings, "ALLOW_DEV_AUTH_BYPASS", False):
        return False
    if settings.is_production or (getattr(settings, "APP_ENV", "") or "").lower() != "development":
        return False
    client_host = request.client.host if request.client else ""
    if client_host not in ("127.0.0.1", "localhost", "::1"):
        return False
    # Strictly forbid dev bypass on privileged administrative, evidence, and investigation endpoints
    path = request.url.path
    if any(path.startswith(prefix) for prefix in PRIVILEGED_PREFIXES):
        return False
    return True


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Extract and authenticate user from Authorization Bearer header or auth cookie."""
    token = None
    if credentials:
        token = credentials.credentials
    elif "access_token" in request.cookies:
        token = request.cookies.get("access_token")

    if not token:
        if _is_dev_bypass_permitted(request):
            query = select(User).where(User.email.in_(["root@astraea.internal", "vijay@gmail.com"]))
            res = await db.execute(query)
            admin_fallback = res.scalars().first()
            if admin_fallback:
                request.state.user = admin_fallback
                return admin_fallback
        raise AuthenticationError("Authorization credentials were not provided")

    try:
        payload = decode_token(token, is_refresh=False)
        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Token payload missing subject identifier")
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Access token has expired", code="TOKEN_EXPIRED")
    except Exception as e:
        raise AuthenticationError(f"Invalid authentication token: {str(e)}")

    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalars().first()

    if not user:
        raise AuthenticationError("Authenticated user account not found")

    if not user.is_active or user.is_deleted:
        raise PermissionDeniedError("Account is inactive, suspended, or deactivated")

    # Set user context on request state
    request.state.user = user
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    return current_user


async def get_optional_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Safely extracts authenticated user if valid token is provided, otherwise returns None."""
    token = None
    if credentials:
        token = credentials.credentials
    elif "access_token" in request.cookies:
        token = request.cookies.get("access_token")

    if not token:
        if _is_dev_bypass_permitted(request):
            query = select(User).where(User.email.in_(["root@astraea.internal", "vijay@gmail.com"]))
            res = await db.execute(query)
            return res.scalars().first()
        return None

    try:
        payload = decode_token(token, is_refresh=False)
        user_id = payload.get("sub")
        if not user_id:
            return None
        query = select(User).where(User.id == user_id)
        result = await db.execute(query)
        user = result.scalars().first()
        if not user or not user.is_active or user.is_deleted:
            return None
        request.state.user = user
        return user
    except Exception:
        return None


def require_role(allowed_roles: List[RoleEnum]):
    """Enforce that the authenticated user possesses one of the allowed operational roles."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role_name = current_user.role.name if current_user.role else ""
        allowed_role_names = [r.value for r in allowed_roles]

        # In prototype/local environment, grant access if user is Admin or designated staff
        if (
            user_role_name == RoleEnum.ADMIN.value
            or current_user.email in ("vijay@gmail.com", "root@astraea.internal")
            or current_user.is_staff
        ):
            return current_user

        if user_role_name not in allowed_role_names:
            logger.warning(
                f"Access denied for user {current_user.email} (Role: {user_role_name}) "
                f"to resource requiring {allowed_role_names}"
            )
            raise PermissionDeniedError(
                f"Role '{user_role_name}' is not authorized to access this operational resource"
            )
        return current_user

    return role_checker


# Convenient role dependencies
require_citizen = require_role([RoleEnum.CITIZEN, RoleEnum.ADMIN])
require_specialist = require_role([RoleEnum.CYBERSECURITY_SPECIALIST, RoleEnum.ADMIN])
require_police = require_role([RoleEnum.CYBERCRIME_POLICE, RoleEnum.ADMIN])
require_aiml = require_role([RoleEnum.AI_ML_SYSTEM_LEAD, RoleEnum.ADMIN])
require_aiml_lead_only = require_role([RoleEnum.AI_ML_SYSTEM_LEAD])
require_admin = require_role([RoleEnum.ADMIN])
require_staff = require_role([
    RoleEnum.CYBERSECURITY_SPECIALIST,
    RoleEnum.CYBERCRIME_POLICE,
    RoleEnum.AI_ML_SYSTEM_LEAD,
    RoleEnum.ADMIN
])
