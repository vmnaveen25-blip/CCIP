import pytest
import datetime
import httpx
from unittest.mock import patch, AsyncMock
from app.core.config import settings
from app.api.auth import OAUTH_TICKETS


@pytest.mark.asyncio
async def test_google_auth_url_unconfigured(client):
    """When GOOGLE_CLIENT_ID is empty in production, return configured=False gracefully."""
    with patch.object(settings, "GOOGLE_CLIENT_ID", ""):
        with patch.object(settings, "APP_ENV", "production"):
            res = await client.get("/api/v1/auth/google")
            assert res.status_code == 200
            data = res.json()
            assert data["configured"] is False
            assert data["authorization_url"] is None
            assert "not configured" in data["message"]


@pytest.mark.asyncio
async def test_google_auth_dev_sandbox_flow(client):
    """In development without GOOGLE_CLIENT_ID, dev sandbox enables 1-click Google Sign-In."""
    with patch.object(settings, "GOOGLE_CLIENT_ID", ""):
        with patch.object(settings, "APP_ENV", "development"):
            res = await client.get("/api/v1/auth/google")
            assert res.status_code == 200
            data = res.json()
            assert data["configured"] is True
            assert data["is_dev_mode"] is True
            assert "dev-consent" in data["authorization_url"]
            state = data["state"]

            # 1. Dev consent page renders HTML
            consent_res = await client.get(f"/api/v1/auth/google/dev-consent?state={state}")
            assert consent_res.status_code == 200
            assert "Sign in with Google" in consent_res.text
            assert "vijay@gmail.com" in consent_res.text

            # 2. Submitting account to dev callback validates CSRF and issues auth_ticket
            client.cookies.set("oauth_state", state)
            callback_res = await client.post(
                "/api/v1/auth/google/dev-callback",
                data={
                    "state": state,
                    "email": "vijay@gmail.com",
                    "name": "Vijay",
                    "google_id": "google_dev_vijay_test"
                },
                follow_redirects=False
            )
            assert callback_res.status_code in (302, 307)
            location = callback_res.headers["location"]
            assert "auth_ticket=" in location
            assert "portal=citizen" in location


@pytest.mark.asyncio
async def test_google_auth_url_configured(client):
    """When GOOGLE_CLIENT_ID is set, return authorization URL and set oauth_state cookie."""
    with patch.object(settings, "GOOGLE_CLIENT_ID", "test-google-client-id.apps.googleusercontent.com"):
        res = await client.get("/api/v1/auth/google")
        assert res.status_code == 200
        data = res.json()
        assert data["configured"] is True
        assert "accounts.google.com" in data["authorization_url"]
        assert "client_id=test-google-client-id.apps.googleusercontent.com" in data["authorization_url"]
        assert data["state"] is not None
        # Verify CSRF state cookie is present in response headers
        set_cookie = res.headers.get("set-cookie", "")
        assert "oauth_state=" in set_cookie


@pytest.mark.asyncio
async def test_google_verify_id_token_success(client):
    """Direct POST /auth/google with valid mock ID token creates user and returns tokens."""
    mock_tokeninfo = {
        "iss": "https://accounts.google.com",
        "aud": "test-google-client-id.apps.googleusercontent.com",
        "sub": "google-user-123456789",
        "email": "verified.citizen@gmail.com",
        "email_verified": "true",
        "name": "Verified Google Citizen",
        "picture": "https://lh3.googleusercontent.com/a/avatar123",
        "exp": int((datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)).timestamp())
    }

    with patch.object(settings, "GOOGLE_CLIENT_ID", "test-google-client-id.apps.googleusercontent.com"):
        with patch("app.api.auth._verify_google_id_token", new_callable=AsyncMock) as mock_verify:
            mock_verify.return_value = mock_tokeninfo

            res = await client.post(
                "/api/v1/auth/google",
                json={"credential": "mock-valid-google-jwt-token"}
            )
            assert res.status_code == 200
            data = res.json()
            assert data["access_token"] is not None
            assert data["user"]["email"] == "verified.citizen@gmail.com"
            assert data["user"]["full_name"] == "Verified Google Citizen"
            assert data["user"]["avatar_url"] == "https://lh3.googleusercontent.com/a/avatar123"

            # Check that cookies were set
            set_cookie = res.headers.get("set-cookie", "")
            assert "access_token=" in set_cookie


@pytest.mark.asyncio
async def test_google_verify_expired_or_unverified_email(client):
    """Reject tokens with unverified emails or expired signatures."""
    with patch.object(settings, "GOOGLE_CLIENT_ID", "test-google-client-id.apps.googleusercontent.com"):
        with patch("httpx.AsyncClient.get") as mock_get:
            # Unverified email
            from unittest.mock import MagicMock
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {
                "iss": "https://accounts.google.com",
                "aud": "test-google-client-id.apps.googleusercontent.com",
                "sub": "unverified-user",
                "email": "unverified@gmail.com",
                "email_verified": "false",
                "exp": int((datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)).timestamp())
            }
            mock_get.return_value = mock_resp

            res = await client.post(
                "/api/v1/auth/google",
                json={"credential": "unverified-email-token"}
            )
            assert res.status_code == 401


@pytest.mark.asyncio
async def test_google_callback_csrf_protection_and_no_token_in_url(client):
    """
    Test that GET /google/callback:
    1. Validates CSRF state from cookie.
    2. Does NOT expose JWT access token in URL query string (?access_token=... is forbidden).
    3. Uses short-lived auth_ticket and redirects safely.
    """
    mock_tokeninfo = {
        "iss": "https://accounts.google.com",
        "aud": "test-client-id",
        "sub": "oauth-redirect-sub",
        "email": "oauth.redirect@gmail.com",
        "email_verified": "true",
        "name": "OAuth Redirect User",
        "exp": int((datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)).timestamp())
    }

    with patch.object(settings, "GOOGLE_CLIENT_ID", "test-client-id"):
        with patch.object(settings, "GOOGLE_CLIENT_SECRET", "test-secret"):
            from unittest.mock import MagicMock
            real_post = client.post

            token_resp = MagicMock()
            token_resp.status_code = 200
            token_resp.json.return_value = {"id_token": "valid-id-token"}

            # Patch post specifically inside auth.py or via side_effect
            original_async_post = httpx.AsyncClient.post
            async def mock_async_post(self, url, *args, **kwargs):
                if "oauth2.googleapis.com" in str(url):
                    return token_resp
                return await original_async_post(self, url, *args, **kwargs)

            with patch("httpx.AsyncClient.post", side_effect=mock_async_post, autospec=True):
                with patch("app.api.auth._verify_google_id_token", new_callable=AsyncMock) as mock_verify:
                    mock_verify.return_value = mock_tokeninfo

                    # Attempt callback with mismatched state (CSRF attack)
                    client.cookies.set("oauth_state", "legit-state")
                    res_csrf_fail = await client.get(
                        "/api/v1/auth/google/callback?code=mock-code&state=attack-state",
                        follow_redirects=False
                    )
                    assert res_csrf_fail.status_code == 307 or res_csrf_fail.status_code == 302
                    assert "auth_error=csrf_validation_failed" in res_csrf_fail.headers["location"]

                    # Callback with matching CSRF state
                    client.cookies.set("oauth_state", "legit-state")
                    res_success = await client.get(
                        "/api/v1/auth/google/callback?code=mock-code&state=legit-state",
                        follow_redirects=False
                    )
                    assert res_success.status_code in (302, 307)
                    redirect_location = res_success.headers["location"]
                    
                    # STRICT REQUIREMENT: access_token MUST NOT be in URL query parameters!
                    assert "access_token" not in redirect_location
                    assert "auth_ticket=" in redirect_location
                    assert "portal=citizen" in redirect_location

                    # Extract auth_ticket
                    from urllib.parse import urlparse, parse_qs
                    parsed = urlparse(redirect_location)
                    params = parse_qs(parsed.query)
                    auth_ticket = params["auth_ticket"][0]
                    assert auth_ticket in OAUTH_TICKETS

                    # Exchange the single-use auth_ticket
                    exchange_res = await client.post(
                        "/api/v1/auth/google/exchange",
                        json={"auth_ticket": auth_ticket}
                    )
                    ex_data = exchange_res.json()
                    assert exchange_res.status_code == 200, f"Exchange failed: {exchange_res.status_code} - {ex_data}"
                    assert ex_data.get("access_token") is not None, f"No access_token: {ex_data}"
                    assert ex_data["user"]["email"] == "oauth.redirect@gmail.com"

                    # Ticket cannot be reused (single-use)
                    reuse_res = await client.post(
                        "/api/v1/auth/google/exchange",
                        json={"auth_ticket": auth_ticket}
                    )
                    assert reuse_res.status_code == 401
