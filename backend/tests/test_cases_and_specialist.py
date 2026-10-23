import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_staff_login_and_case_lifecycle(client: AsyncClient):
    # Staff login as Cybercrime Police
    police_login = await client.post("/api/v1/auth/login", json={
        "email": "s.chen@police.gov",
        "password": "AstraeaEnclave#42"
    })
    assert police_login.status_code == 200
    p_token = police_login.json()["access_token"]
    p_headers = {"Authorization": f"Bearer {p_token}"}

    # List cases
    cases_resp = await client.get("/api/v1/cases", headers=p_headers)
    assert cases_resp.status_code == 200
    cases = cases_resp.json()
    assert len(cases) >= 1
    case_id = cases[0]["id"]

    # Assign case
    assign_resp = await client.post(
        f"/api/v1/cases/{case_id}/assign",
        json={"notes": "Priority cyber incident assigned to triage taskforce"},
        headers=p_headers
    )
    assert assign_resp.status_code == 200
    assert assign_resp.json()["success"] == True

    # Transition case status
    status_resp = await client.patch(
        f"/api/v1/cases/{case_id}/status",
        json={"status": "UNDER_INVESTIGATION", "reason": "Active forensic packet inspection"},
        headers=p_headers
    )
    assert status_resp.status_code == 200

    # Escalate case
    esc_resp = await client.post(
        f"/api/v1/cases/{case_id}/escalate",
        json={"is_escalated": True, "escalation_reason": "High financial wire fraud volume"},
        headers=p_headers
    )
    assert esc_resp.status_code == 200

    # Police dashboard statistics
    stats_resp = await client.get("/api/v1/police/dashboard-stats", headers=p_headers)
    assert stats_resp.status_code == 200
    assert "totalCases" in stats_resp.json()
    assert "interpolSync" in stats_resp.json()


@pytest.mark.asyncio
async def test_specialist_endpoints_and_threat_feeds(client: AsyncClient):
    # Specialist login
    spec_login = await client.post("/api/v1/auth/login", json={
        "email": "a.thorne@astraea.gov",
        "password": "AstraeaEnclave#42"
    })
    assert spec_login.status_code == 200
    s_token = spec_login.json()["access_token"]
    s_headers = {"Authorization": f"Bearer {s_token}"}

    # Threat Intelligence feed
    threats_resp = await client.get("/api/v1/specialist/threat-intelligence", headers=s_headers)
    assert threats_resp.status_code == 200
    threats = threats_resp.json()
    assert len(threats) >= 1

    # Correlation nodes
    corr_resp = await client.get("/api/v1/specialist/correlation-nodes", headers=s_headers)
    assert corr_resp.status_code == 200
    nodes = corr_resp.json()
    assert len(nodes) >= 1

    # AI assistant query (clean adapter)
    ai_resp = await client.post(
        "/api/v1/specialist/ai-assistant",
        json={"prompt": "Correlate wallet with DarkSynapse syndicate", "context": {}},
        headers=s_headers
    )
    assert ai_resp.status_code == 200
    assert ai_resp.json()["status"] in ["NOT_AVAILABLE", "MODEL CONNECTED"]


@pytest.mark.asyncio
async def test_admin_governance_and_audit_trail(client: AsyncClient):
    # Admin root login
    admin_login = await client.post("/api/v1/auth/login", json={
        "email": "root@astraea.internal",
        "password": "AstraeaEnclave#42"
    })
    assert admin_login.status_code == 200
    a_token = admin_login.json()["access_token"]
    a_headers = {"Authorization": f"Bearer {a_token}"}

    # Admin users list
    users_resp = await client.get("/api/v1/admin/users", headers=a_headers)
    assert users_resp.status_code == 200
    users = users_resp.json()
    assert len(users) >= 4

    # Admin audit trail
    audit_resp = await client.get("/api/v1/admin/audit-logs", headers=a_headers)
    assert audit_resp.status_code == 200
    logs = audit_resp.json()
    assert len(logs) >= 1
    assert "hash" in logs[0]
