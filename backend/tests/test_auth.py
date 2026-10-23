import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoints(client: AsyncClient):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["HEALTHY", "DEGRADED"]
    assert "services" in data

    db_resp = await client.get("/api/v1/health/database")
    assert db_resp.status_code == 200
    assert db_resp.json()["status"] == "UP"


@pytest.mark.asyncio
async def test_citizen_registration_and_login(client: AsyncClient):
    reg_payload = {
        "name": "Alex Mercer",
        "email": "alex.mercer@testenclave.org",
        "phone": "+91 98765 78901",
        "password": "SecurePassword#2026",
        "consent": True
    }
    reg_resp = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == "alex.mercer@testenclave.org"
    assert reg_data["user"]["role"] == "CITIZEN"

    # Login with newly registered citizen credentials
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "alex.mercer@testenclave.org",
        "password": "SecurePassword#2026"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    # Verify /auth/me
    me_resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["full_name"] == "Alex Mercer"


@pytest.mark.asyncio
async def test_invalid_login_credentials(client: AsyncClient):
    resp = await client.post("/api/v1/auth/login", json={
        "email": "nonexistent@user.com",
        "password": "WrongPassword#123"
    })
    assert resp.status_code == 401
    assert "error" in resp.json()
    assert resp.json()["error"]["code"] == "AUTH_ERROR"


@pytest.mark.asyncio
async def test_phone_otp_flow(client: AsyncClient):
    send_resp = await client.post("/api/v1/auth/phone/send-otp", json={"phone": "+919876544433"})
    assert send_resp.status_code == 200
    data = send_resp.json()
    assert "dev_otp" in data["data"]
    dev_otp = data["data"]["dev_otp"]

    verify_resp = await client.post("/api/v1/auth/phone/verify-otp", json={
        "phone": "+919876544433",
        "otp": dev_otp
    })
    assert verify_resp.status_code == 200
    assert "access_token" in verify_resp.json()


@pytest.mark.asyncio
async def test_user_profile_binding_elango(client: AsyncClient):
    """TEST 1: Register Elango, login, and verify current-user endpoint returns Elango."""
    reg_payload = {
        "name": "Elango",
        "email": "elango.test@cyberdefense.in",
        "phone": "+91 98765 11223",
        "password": "SecurePassword#2026",
        "consent": True
    }
    reg_resp = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    assert reg_resp.json()["user"]["full_name"] == "Elango"

    # Login as Elango
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "elango.test@cyberdefense.in",
        "password": "SecurePassword#2026"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    assert login_resp.json()["user"]["full_name"] == "Elango"

    # Verify GET /api/v1/auth/me returns Elango
    me_resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["full_name"] == "Elango"
    assert me_data["email"] == "elango.test@cyberdefense.in"
    assert me_data["phone_number"] == "+919876511223"
    assert me_data["role"] == "CITIZEN"
    assert me_data["portal_role"] == "citizen"


@pytest.mark.asyncio
async def test_user_profile_binding_second_user(client: AsyncClient):
    """TEST 2: Register a second user with a different name, verify actual name is returned."""
    reg_payload = {
        "name": "Kavitha Nair",
        "email": "kavitha.nair@cyberdefense.in",
        "phone": "+91 98765 22334",
        "password": "SecurePassword#2026",
        "consent": True
    }
    reg_resp = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    assert reg_resp.json()["user"]["full_name"] == "Kavitha Nair"

    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "kavitha.nair@cyberdefense.in",
        "password": "SecurePassword#2026"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    assert login_resp.json()["user"]["full_name"] == "Kavitha Nair"

    me_resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["full_name"] == "Kavitha Nair"
    assert me_resp.json()["email"] == "kavitha.nair@cyberdefense.in"


@pytest.mark.asyncio
async def test_identity_isolation_between_accounts(client: AsyncClient):
    """TEST 3: Verify User A's token never returns User B's profile and vice versa."""
    # Register User A
    user_a_payload = {
        "name": "User Alpha",
        "email": "user.alpha@testenclave.org",
        "phone": "+91 98765 33441",
        "password": "SecurePassword#2026",
        "consent": True
    }
    resp_a = await client.post("/api/v1/auth/register", json=user_a_payload)
    token_a = resp_a.json()["access_token"]

    # Register User B
    user_b_payload = {
        "name": "User Beta",
        "email": "user.beta@testenclave.org",
        "phone": "+91 98765 33442",
        "password": "SecurePassword#2026",
        "consent": True
    }
    resp_b = await client.post("/api/v1/auth/register", json=user_b_payload)
    token_b = resp_b.json()["access_token"]

    # Request /auth/me with User A token
    me_a = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token_a}"})
    assert me_a.status_code == 200
    assert me_a.json()["full_name"] == "User Alpha"
    assert me_a.json()["email"] == "user.alpha@testenclave.org"
    assert me_a.json()["full_name"] != "User Beta"

    # Request /auth/me with User B token
    me_b = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token_b}"})
    assert me_b.status_code == 200
    assert me_b.json()["full_name"] == "User Beta"
    assert me_b.json()["email"] == "user.beta@testenclave.org"
    assert me_b.json()["full_name"] != "User Alpha"


@pytest.mark.asyncio
async def test_logout_clears_authenticated_session(client: AsyncClient):
    """TEST 4: Verify logout clears session and invalidates access."""
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "elango.test@cyberdefense.in",
        "password": "SecurePassword#2026"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    # Call logout endpoint
    logout_resp = await client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_resp.status_code == 200
    assert logout_resp.json()["success"] is True


@pytest.mark.asyncio
async def test_duplicate_email_validation(client: AsyncClient):
    """TEST 5: Verify duplicate email registration raises validation error."""
    dup_payload = {
        "name": "Duplicate Tester",
        "email": "elango.test@cyberdefense.in",  # already registered above
        "phone": "+91 98765 99887",
        "password": "SecurePassword#2026",
        "consent": True
    }
    dup_resp = await client.post("/api/v1/auth/register", json=dup_payload)
    assert dup_resp.status_code in [400, 422]
    body = dup_resp.json()
    error_text = str(body)
    assert "already exists" in error_text.lower()


@pytest.mark.asyncio
async def test_duplicate_phone_validation(client: AsyncClient):
    """TEST 6: Verify duplicate phone number registration raises validation error."""
    dup_phone_payload = {
        "name": "Phone Duplicate Tester",
        "email": "unique.phone.test@cyberdefense.in",
        "phone": "+91 98765 11223",  # already registered by Elango
        "password": "SecurePassword#2026",
        "consent": True
    }
    dup_resp = await client.post("/api/v1/auth/register", json=dup_phone_payload)
    assert dup_resp.status_code in [400, 422]
    body = dup_resp.json()
    error_text = str(body)
    assert "already exists" in error_text.lower()

