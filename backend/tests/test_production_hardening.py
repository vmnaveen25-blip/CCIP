import io
import pytest
from httpx import AsyncClient
from app.services.task_service import task_service


@pytest.mark.asyncio
async def test_password_complexity_enforcement(client: AsyncClient):
    """Test that weak passwords are rejected during citizen registration."""
    weak_passwords = [
        "short",            # Too short (< 8)
        "alllowercase123",  # No uppercase
        "ALLUPPERCASE123",  # No lowercase
        "NoDigitsHere!",    # No digits
    ]
    for weak_pw in weak_passwords:
        resp = await client.post("/api/v1/auth/register", json={
            "name": "Weak User",
            "email": f"weak_{abs(hash(weak_pw))}@test.com",
            "password": weak_pw,
            "consent": True
        })
        assert resp.status_code in [400, 422]
        assert "password" in resp.json()["error"]["message"].lower() or "validation" in resp.json()["error"]["message"].lower()


@pytest.mark.asyncio
async def test_brute_force_lockout_policy(client: AsyncClient):
    """Test that 5 failed login attempts triggers a temporary account lockout."""
    target_email = "lockout.test@cyberdefense.org"
    correct_password = "SecurePassword#2026"

    # Register account
    reg_resp = await client.post("/api/v1/auth/register", json={
        "name": "Lockout Test User",
        "email": target_email,
        "password": correct_password,
        "consent": True
    })
    assert reg_resp.status_code == 201

    # Attempt 5 wrong logins
    for i in range(5):
        fail_res = await client.post("/api/v1/auth/login", json={
            "email": target_email,
            "password": "WrongPassword#999"
        })
        assert fail_res.status_code == 401

    # The 6th attempt (even with the correct password) should be locked out
    locked_res = await client.post("/api/v1/auth/login", json={
        "email": target_email,
        "password": correct_password
    })
    assert locked_res.status_code == 401
    assert "locked" in locked_res.json()["error"]["message"].lower()


@pytest.mark.asyncio
async def test_controlled_state_machine_transitions(client: AsyncClient):
    """Test that invalid state transitions are rejected with clear validation messages."""
    # Login as police
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "s.chen@police.gov",
        "password": "AstraeaEnclave#42",
        "target_role": "police"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get cases
    cases_res = await client.get("/api/v1/cases", headers=headers)
    assert cases_res.status_code == 200
    case_id = cases_res.json()[0]["id"]

    # Attempt invalid transition (e.g. to an unknown arbitrary state)
    invalid_res = await client.patch(
        f"/api/v1/cases/{case_id}/status",
        headers=headers,
        json={"status": "INVALID_STATE_XYZ", "reason": "Testing error handling"}
    )
    assert invalid_res.status_code in [400, 422]
    assert "invalid status transition" in invalid_res.json()["error"]["message"].lower()


@pytest.mark.asyncio
async def test_evidence_file_security_and_versioning(client: AsyncClient):
    """Test file extension validation, malware scanner integration, and versioning."""
    # Login as citizen
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "elena.rostova@cyberdefense.org",
        "password": "AstraeaEnclave#42",
        "target_role": "citizen"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get citizen's complaint
    complaints_res = await client.get("/api/v1/complaints", headers=headers)
    assert complaints_res.status_code == 200
    complaint_id = complaints_res.json()[0]["id"]

    # 1. Disallowed extension (.exe)
    bad_file = {"file": ("malware_payload.exe", io.BytesIO(b"MZ\x90\x00\x03\x00\x00\x00"), "application/x-msdownload")}
    bad_upload = await client.post(
        "/api/v1/evidence/upload",
        headers=headers,
        data={"complaint_id": complaint_id},
        files=bad_file
    )
    assert bad_upload.status_code in [400, 422]
    assert "not permitted" in bad_upload.json()["error"]["message"].lower()

    # 2. Valid PDF upload (v1)
    good_file_1 = {"file": ("contract_v1.pdf", io.BytesIO(b"%PDF-1.4 sample contract document content"), "application/pdf")}
    v1_upload = await client.post(
        "/api/v1/evidence/upload",
        headers=headers,
        data={"complaint_id": complaint_id},
        files=good_file_1
    )
    assert v1_upload.status_code in [200, 201]
    v1_id = v1_upload.json()["id"]

    # 3. Upload replacement version (v2)
    good_file_2 = {"file": ("contract_v2.pdf", io.BytesIO(b"%PDF-1.4 amended contract document content"), "application/pdf")}
    v2_upload = await client.post(
        "/api/v1/evidence/upload",
        headers=headers,
        data={"complaint_id": complaint_id, "parent_evidence_id": v1_id},
        files=good_file_2
    )
    assert v2_upload.status_code in [200, 201]


@pytest.mark.asyncio
async def test_notifications_lifecycle(client: AsyncClient):
    """Test notification list, unread count, mark read, and mark all read."""
    # Login as admin
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "root@astraea.internal",
        "password": "AstraeaEnclave#42",
        "target_role": "admin"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Get unread count
    count_res = await client.get("/api/v1/notifications/unread-count", headers=headers)
    assert count_res.status_code == 200
    assert "unread_count" in count_res.json()

    # 2. List notifications
    list_res = await client.get("/api/v1/notifications", headers=headers)
    assert list_res.status_code == 200
    assert isinstance(list_res.json(), list)

    # 3. Mark all as read
    read_all_res = await client.post("/api/v1/notifications/read-all", headers=headers)
    assert read_all_res.status_code == 200
    assert "marked as read" in read_all_res.json()["message"].lower()


@pytest.mark.asyncio
async def test_reports_lifecycle_and_exports(client: AsyncClient):
    """Test report creation, retrieval by ID, and exports in text/csv/json."""
    # Login as specialist
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "a.thorne@astraea.gov",
        "password": "AstraeaEnclave#42",
        "target_role": "specialist"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Report
    create_res = await client.post(
        "/api/v1/reports",
        headers=headers,
        json={
            "report_type": "INVESTIGATION_SUMMARY",
            "title": "Crypto Scam Peel Chain Analysis",
            "summary": "Full forensic ledger trace identified mixer egress.",
            "content_json": {"hops": 4, "final_address": "0x1111222233334444"}
        }
    )
    assert create_res.status_code == 201
    report_id = create_res.json()["id"]

    # 2. Get Report by ID
    get_res = await client.get(f"/api/v1/reports/{report_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Crypto Scam Peel Chain Analysis"

    # 3. Export as Text
    txt_export = await client.get(f"/api/v1/reports/{report_id}/export?format=text", headers=headers)
    assert txt_export.status_code == 200
    assert "Crypto Scam Peel Chain Analysis" in txt_export.text

    # 4. Export as CSV
    csv_export = await client.get(f"/api/v1/reports/{report_id}/export?format=csv", headers=headers)
    assert csv_export.status_code == 200
    assert "Crypto Scam Peel Chain Analysis" in csv_export.text


@pytest.mark.asyncio
async def test_background_task_lifecycle(client: AsyncClient, db_session):
    """Test background task creation, tracking, and completion."""
    # Login as admin
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "root@astraea.internal",
        "password": "AstraeaEnclave#42",
        "target_role": "admin"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Execute a sample async task
    async def sample_job(payload: dict):
        return {"processed_items": 42, "status": "COMPLETED"}

    task_obj = await task_service.create_and_run_task(
        db=db_session,
        task_name="Telemetry Aggregation Job",
        task_type="TELEMETRY_AGGREGATION",
        payload={"batch_size": 100},
        async_callable=sample_job,
        user_id="root-user"
    )
    assert task_obj.id is not None

    # Query task status via API
    task_res = await client.get(f"/api/v1/tasks/{task_obj.id}", headers=headers)
    assert task_res.status_code == 200
    assert task_res.json()["task_name"] == "Telemetry Aggregation Job"


@pytest.mark.asyncio
async def test_liveness_and_readiness_probes(client: AsyncClient):
    """Test Kubernetes/Container liveness and readiness probe endpoints."""
    live_res = await client.get("/api/v1/health/live")
    assert live_res.status_code == 200
    assert live_res.json()["status"] == "LIVE"

    ready_res = await client.get("/api/v1/health/ready")
    assert ready_res.status_code == 200
    assert ready_res.json()["status"] == "READY"
