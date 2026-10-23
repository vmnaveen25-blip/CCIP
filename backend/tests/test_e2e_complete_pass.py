import pytest
import io
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_e2e_scenario_1_citizen_lifecycle(client: AsyncClient):
    """
    SCENARIO 1:
    Citizen Register -> Login -> Create Complaint -> Upload Evidence -> View Complaint -> Telemetry Check -> Logout
    """
    email = "test.citizen.e2e@cybercrime.org"
    password = "CitizenPass123!Secure"

    # 1. Register
    reg_res = await client.post("/api/v1/auth/register", json={
        "name": "Elena Rostova",
        "email": email,
        "phone": "+919876512345",
        "password": password,
        "consent": True
    })
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert reg_data["user"]["email"] == email

    # 2. Login
    login_res = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 3. Create / File Complaint
    complaint_res = await client.post("/api/v1/complaints", headers=auth_headers, json={
        "title": "Unauthorized SIM-Swap Wire Transfer",
        "category": "Financial Fraud",
        "severity": "HIGH",
        "citizenName": "Elena Rostova",
        "citizenEmail": email,
        "citizenPhone": "+919876512345",
        "incidentDate": "2026-09-04",
        "financialLoss": 25000.0,
        "suspectInfo": {
            "walletAddress": "0x71C2341234567890abcdef1234567890abcdef12",
            "phone": "+919876598765"
        },
        "description": "Attacker initiated unauthorized SIM-swap on carrier network."
    })
    assert complaint_res.status_code == 201
    complaint = complaint_res.json()
    complaint_id = complaint["id"]
    ref_number = complaint["referenceNumber"]
    assert complaint["status"] in ["SUBMITTED", "UNDER_INVESTIGATION", "TRIAGED"]

    # 4. Upload Evidence File (SHA-256 integrity calculation)
    fake_file_bytes = b"PDF-1.4 Fake bank statement indicating unauthorized outgoing wire transfer."
    files = {"file": ("bank_statement.pdf", io.BytesIO(fake_file_bytes), "application/pdf")}
    upload_res = await client.post(
        "/api/v1/evidence/upload",
        headers=auth_headers,
        data={"complaint_id": complaint_id},
        files=files
    )
    assert upload_res.status_code in [200, 201]
    evidence_data = upload_res.json()
    hash_val = evidence_data.get("sha256Hash") or evidence_data.get("sha256_hash")
    assert hash_val is not None
    assert len(hash_val) == 64

    # 5. Track Complaint by Reference Number
    track_res = await client.get(f"/api/v1/complaints/track/{ref_number}")
    assert track_res.status_code == 200
    assert track_res.json()["id"] == complaint_id

    # 6. Verify Telemetry Time-Series & Stats reflect the new record
    tel_res = await client.get("/api/v1/complaints/telemetry/timeseries")
    assert tel_res.status_code == 200
    assert "data" in tel_res.json()
    assert len(tel_res.json()["data"]) >= 1

    cat_res = await client.get("/api/v1/complaints/stats/categories")
    assert cat_res.status_code == 200
    assert len(cat_res.json()["categories"]) >= 1

    # 7. Logout
    logout_res = await client.post("/api/v1/auth/logout", headers=auth_headers)
    assert logout_res.status_code == 200


@pytest.mark.asyncio
async def test_e2e_scenario_2_police_lifecycle(client: AsyncClient):
    """
    SCENARIO 2:
    Police Login -> View Complaints -> Assign Case to Detective -> Update Status
    """
    # 1. Police Login
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "s.chen@police.gov",
        "password": "AstraeaEnclave#42",
        "mfa_code": "000000",
        "target_role": "police"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 2. View Cases / Dockets
    cases_res = await client.get("/api/v1/cases", headers=auth_headers)
    assert cases_res.status_code == 200
    cases = cases_res.json()
    assert len(cases) > 0
    target_case_id = cases[0]["id"]

    # 3. Assign Case
    assign_res = await client.post(
        f"/api/v1/cases/{target_case_id}/assign",
        headers=auth_headers,
        json={"notes": "Assigned to Det. Inspector Sarah Chen for priority triage."}
    )
    assert assign_res.status_code == 200

    # 4. Update Status
    status_res = await client.patch(
        f"/api/v1/cases/{target_case_id}/status",
        headers=auth_headers,
        json={"status": "UNDER_INVESTIGATION", "reason": "Active blockchain tracking initiated."}
    )
    assert status_res.status_code == 200
    assert "transitioned" in status_res.json()["message"].lower() or "updated" in status_res.json()["message"].lower()


@pytest.mark.asyncio
async def test_e2e_scenario_3_specialist_lifecycle(client: AsyncClient):
    """
    SCENARIO 3:
    Specialist Login -> View Assigned Cases -> Query AI Assistant Adapter (truthful verification) -> Generate Report Record
    """
    # 1. Specialist Login
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "a.thorne@astraea.gov",
        "password": "AstraeaEnclave#42",
        "mfa_code": "000000",
        "target_role": "specialist"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 2. View Assigned Cases & Threat Feeds
    assigned_res = await client.get("/api/v1/specialist/assigned-cases", headers=auth_headers)
    assert assigned_res.status_code == 200
    cases = assigned_res.json()
    assert len(cases) > 0
    case_id = cases[0]["id"]

    threats_res = await client.get("/api/v1/specialist/threat-intelligence", headers=auth_headers)
    assert threats_res.status_code == 200

    # 3. Query AI Assistant Adapter (verifying truthful adapter readiness without fake AI claims)
    ai_res = await client.post(
        "/api/v1/specialist/ai-assistant",
        headers=auth_headers,
        json={"prompt": "Trace wallet peel chain", "context": {"case_id": case_id}}
    )
    assert ai_res.status_code == 200
    ai_data = ai_res.json()
    assert ai_data["status"] in ["NOT_AVAILABLE", "MODEL CONNECTED"]

    # 4. Generate Official Report Record
    report_res = await client.post(
        "/api/v1/reports",
        headers=auth_headers,
        json={
            "report_type": "FORENSIC_SUMMARY",
            "title": "Forensic Telemetry & Judicial Summary",
            "summary": "Cryptographic evidence sealed and peel chain traced to mixer.",
            "case_id": case_id,
            "content_json": {"analyst": "Dr. Aris Thorne", "status": "SEALED"}
        }
    )
    assert report_res.status_code == 201
    assert report_res.json()["report_type"] == "FORENSIC_SUMMARY"


@pytest.mark.asyncio
async def test_e2e_scenario_4_admin_lifecycle(client: AsyncClient):
    """
    SCENARIO 4:
    Admin Login -> List Personnel Directory -> Inspect System Health -> Audit Logs
    """
    # 1. Admin Login
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "root@astraea.internal",
        "password": "AstraeaEnclave#42",
        "mfa_code": "000000",
        "target_role": "admin"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 2. List Users
    users_res = await client.get("/api/v1/admin/users", headers=auth_headers)
    assert users_res.status_code == 200
    assert len(users_res.json()) >= 4

    # 3. Inspect System Health
    health_res = await client.get("/api/v1/admin/system-health", headers=auth_headers)
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "HEALTHY"

    # 4. View Audit Logs
    audit_res = await client.get("/api/v1/admin/audit-logs", headers=auth_headers)
    assert audit_res.status_code == 200
    assert len(audit_res.json()) > 0


@pytest.mark.asyncio
async def test_e2e_scenario_5_aiml_lead_lifecycle(client: AsyncClient):
    """
    SCENARIO 5:
    AI/ML Lead Login -> Inspect Model Registry -> Trigger Retraining Pipeline Job (infrastructure test)
    """
    # 1. AI/ML Lead Login
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "m.vance@ai-ops.gov",
        "password": "AstraeaEnclave#42",
        "mfa_code": "000000",
        "target_role": "aiml"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 2. Get AI Models Registry
    models_res = await client.get("/api/v1/mlops/models", headers=auth_headers)
    assert models_res.status_code == 200
    models = models_res.json()
    assert isinstance(models, list)
    assert len(models) > 0
    model_id = models[0]["id"]

    # 3. Trigger Retraining Pipeline Job
    retrain_res = await client.post(
        "/api/v1/mlops/retrain",
        headers=auth_headers,
        json={"model_id": model_id}
    )
    assert retrain_res.status_code == 200
    assert "retraining" in retrain_res.json()["message"].lower()
