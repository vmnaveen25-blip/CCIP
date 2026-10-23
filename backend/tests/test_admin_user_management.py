"""
Admin User Management and Governance Test Suite
Validates:
- Admin can list all users with search, filters, and pagination
- Non-admin roles (CITIZEN, SPECIALIST, POLICE) are strictly denied (HTTP 403)
- Provisioning staff users with proper clearances and audit trail
- Role changes produce tamper-evident audit log entries
- Account lifecycle actions: suspend, activate, disable
- Disabled/suspended users are prevented from authenticating
- Zero sensitive data (password hash, JWT secrets, MFA secrets) in API payloads
"""

import pytest
from httpx import AsyncClient


async def get_token(client: AsyncClient, email: str, password: str = "AstraeaEnclave#42") -> str:
    res = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password
    })
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_admin_can_list_users(client: AsyncClient):
    token = await get_token(client, "root@astraea.internal")
    res = await client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 4
    assert "X-Total-Count" in res.headers
    assert int(res.headers["X-Total-Count"]) >= 4


@pytest.mark.asyncio
async def test_non_admin_denied_user_management(client: AsyncClient):
    # Elena Rostova (Citizen)
    citizen_token = await get_token(client, "elena.rostova@cyberdefense.org")
    res = await client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert res.status_code == 403

    # Specialist (Dr. Aris Thorne)
    spec_token = await get_token(client, "a.thorne@astraea.gov")
    res2 = await client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {spec_token}"}
    )
    assert res2.status_code == 403

    # Police (Det. Inspector Sarah Chen)
    police_token = await get_token(client, "s.chen@police.gov")
    res3 = await client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {police_token}"}
    )
    assert res3.status_code == 403


@pytest.mark.asyncio
async def test_admin_users_search(client: AsyncClient):
    token = await get_token(client, "root@astraea.internal")
    
    # Search by Elena
    res = await client.get(
        "/api/v1/admin/users?search=Elena",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    users = res.json()
    assert len(users) >= 1
    assert any("elena" in u["email"].lower() for u in users)

    # Search by email domain
    res2 = await client.get(
        "/api/v1/admin/users?search=astraea.internal",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res2.status_code == 200
    assert len(res2.json()) >= 1


@pytest.mark.asyncio
async def test_admin_users_filter_by_role(client: AsyncClient):
    token = await get_token(client, "root@astraea.internal")
    
    res = await client.get(
        "/api/v1/admin/users?role=ADMIN",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    users = res.json()
    assert len(users) >= 1
    for u in users:
        assert u["role"] == "ADMIN"


@pytest.mark.asyncio
async def test_admin_users_pagination(client: AsyncClient):
    token = await get_token(client, "root@astraea.internal")
    
    res = await client.get(
        "/api/v1/admin/users?page=1&page_size=2&paginate=true",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert "total_pages" in data
    assert data["page"] == 1
    assert data["page_size"] == 2
    assert len(data["items"]) <= 2
    assert data["total"] >= 4


@pytest.mark.asyncio
async def test_admin_provision_staff_user(client: AsyncClient):
    token = await get_token(client, "root@astraea.internal")

    # Fetch a real department id
    dept_res = await client.get(
        "/api/v1/admin/departments",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert dept_res.status_code == 200
    depts = dept_res.json()
    dept_id = depts[0]["id"] if depts else None

    payload = {
        "email": "agent.kavita@cyberdefense.org",
        "full_name": "Kavita Sharma",
        "password": "SecurePassword123#",
        "role": "CYBERSECURITY_SPECIALIST",
        "phone_number": "+91 99887 76655",
        "badge_number": "SPEC-9988",
        "clearance_level": "TIER 3",
        "department_id": dept_id,
        "is_staff": True
    }

    res = await client.post(
        "/api/v1/admin/users",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 201
    created = res.json()
    assert created["email"] == "agent.kavita@cyberdefense.org"
    assert created["role"] == "CYBERSECURITY_SPECIALIST"
    assert created["badge_number"] == "SPEC-9988"
    assert created["is_staff"] is True
    assert created["account_status"] == "ACTIVE"

    # Verify audit log was created via admin endpoint
    audit_res = await client.get(
        f"/api/v1/admin/users/{created['id']}/audit",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert audit_res.status_code == 200
    actions = [a["action"] for a in audit_res.json()]
    assert "USER_PROVISIONED" in actions


@pytest.mark.asyncio
async def test_admin_get_user_details(client: AsyncClient):
    token = await get_token(client, "root@astraea.internal")

    # Get a known user
    users_res = await client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {token}"})
    user_id = users_res.json()[0]["id"]

    res = await client.get(
        f"/api/v1/admin/users/{user_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == user_id
    assert "email" in data
    assert "role" in data
    assert "account_status" in data


@pytest.mark.asyncio
async def test_admin_update_user_and_role_change_audit(client: AsyncClient):
    token = await get_token(client, "root@astraea.internal")

    # Create a user to test role update
    payload = {
        "email": "temp.analyst@cyberdefense.org",
        "full_name": "Temporary Analyst",
        "password": "SecurePassword123#",
        "role": "CITIZEN",
        "phone_number": "+91 91122 33445"
    }
    create_res = await client.post(
        "/api/v1/admin/users",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert create_res.status_code == 201
    user_id = create_res.json()["id"]

    # Change role to CYBERSECURITY_SPECIALIST
    update_res = await client.patch(
        f"/api/v1/admin/users/{user_id}",
        json={
            "role": "CYBERSECURITY_SPECIALIST",
            "clearance_level": "TIER 3",
            "phone_number": "+91 91122 33449"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["role"] == "CYBERSECURITY_SPECIALIST"
    assert updated["clearance_level"] == "TIER 3"

    # Verify audit log was recorded for role change
    audit_res = await client.get(
        f"/api/v1/admin/users/{user_id}/audit",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert audit_res.status_code == 200
    actions = [a["action"] for a in audit_res.json()]
    assert "USER_ROLE_CHANGED" in actions


@pytest.mark.asyncio
async def test_admin_suspend_and_activate_user(client: AsyncClient):
    token = await get_token(client, "root@astraea.internal")

    # Create user
    payload = {
        "email": "suspendable@cyberdefense.org",
        "full_name": "Suspendable User",
        "password": "SecurePassword123#",
        "role": "CITIZEN",
        "phone_number": "+91 97766 55443"
    }
    create_res = await client.post(
        "/api/v1/admin/users",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    user_id = create_res.json()["id"]

    # 1. Suspend
    suspend_res = await client.post(
        f"/api/v1/admin/users/{user_id}/suspend",
        json={"reason": "Suspected credential compromise"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert suspend_res.status_code == 200
    assert suspend_res.json()["is_active"] is False
    assert suspend_res.json()["account_status"] == "SUSPENDED"

    # Suspended user cannot log in
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "suspendable@cyberdefense.org",
        "password": "SecurePassword123#"
    })
    assert login_res.status_code == 403

    # 2. Activate
    activate_res = await client.post(
        f"/api/v1/admin/users/{user_id}/activate",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert activate_res.status_code == 200
    assert activate_res.json()["is_active"] is True
    assert activate_res.json()["account_status"] == "ACTIVE"

    # User can now log in
    login_res2 = await client.post("/api/v1/auth/login", json={
        "email": "suspendable@cyberdefense.org",
        "password": "SecurePassword123#"
    })
    assert login_res2.status_code == 200


@pytest.mark.asyncio
async def test_disabled_user_behavior(client: AsyncClient):
    token = await get_token(client, "root@astraea.internal")

    # Create user
    payload = {
        "email": "disableable@cyberdefense.org",
        "full_name": "Disableable User",
        "password": "SecurePassword123#",
        "role": "CITIZEN",
        "phone_number": "+91 96655 44332"
    }
    create_res = await client.post(
        "/api/v1/admin/users",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    user_id = create_res.json()["id"]

    # Disable
    disable_res = await client.post(
        f"/api/v1/admin/users/{user_id}/disable",
        json={"reason": "Personnel offboarding"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert disable_res.status_code == 200
    assert disable_res.json()["account_status"] == "DISABLED"
    assert disable_res.json()["is_active"] is False

    # Login fails
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "disableable@cyberdefense.org",
        "password": "SecurePassword123#"
    })
    assert login_res.status_code == 403


@pytest.mark.asyncio
async def test_admin_get_user_audit_history(client: AsyncClient):
    token = await get_token(client, "root@astraea.internal")

    # Create and update user to generate multiple audit logs
    payload = {
        "email": "audit.target@cyberdefense.org",
        "full_name": "Audit Target User",
        "password": "SecurePassword123#",
        "role": "CITIZEN",
        "phone_number": "+91 95544 33221"
    }
    create_res = await client.post(
        "/api/v1/admin/users",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    user_id = create_res.json()["id"]

    await client.post(
        f"/api/v1/admin/users/{user_id}/suspend",
        json={"reason": "Audit verification test"},
        headers={"Authorization": f"Bearer {token}"}
    )

    audit_res = await client.get(
        f"/api/v1/admin/users/{user_id}/audit",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert isinstance(logs, list)
    assert len(logs) >= 2
    actions = [l["action"] for l in logs]
    assert "USER_PROVISIONED" in actions
    assert "USER_SUSPENDED" in actions


@pytest.mark.asyncio
async def test_no_sensitive_data_returned(client: AsyncClient):
    token = await get_token(client, "root@astraea.internal")

    res = await client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    raw_text = res.text.lower()

    # Verify zero password hashes, secrets, tokens
    forbidden_tokens = ["password_hash", "$argon2", "jwt_secret", "refresh_token", "otp_secret"]
    for tok in forbidden_tokens:
        assert tok not in raw_text
