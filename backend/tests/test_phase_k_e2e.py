import pytest
import io
import hashlib
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_complete_phase_k_five_role_e2e_pipeline(client: AsyncClient):
    """
    Phase K End-to-End Five-Role Pipeline Integration Test:
    1. Citizen: Cyber Shield Threat Screening -> Complaint Submission -> Evidence Upload (SHA-256 Seal)
    2. Cybersecurity Specialist: Entity & Relation Extraction -> Triage -> Case Creation -> Urgency Evaluation
    3. Cybercrime Police: Case Assignment -> Cross-Case Correlation -> Evidence Graph -> Full Lifecycle to CLOSED
    4. Admin: Platform Governance -> Case Reopen with Audit Trail
    5. AI/ML System Lead: Model Registry Inspection -> Feedback Gate Evaluation -> Learning Candidate Governance
    """

    # -------------------------------------------------------------
    # STEP 1: CITIZEN FLOW (Cyber Shield + Filing + Evidence)
    # -------------------------------------------------------------
    # A. Citizen Threat Check on Cyber Shield
    shield_resp = await client.post("/api/v1/ai/citizen/assist", json={
        "query_type": "url",
        "content": "https://secure-sbi-update-kyc.in/login.php"
    })
    assert shield_resp.status_code == 200
    shield_data = shield_resp.json()
    assert shield_data["success"] is True
    assert "risk_level" in shield_data
    assert "recommended_actions" in shield_data

    # B. Citizen Login
    cit_login = await client.post("/api/v1/auth/login", json={
        "email": "elena.rostova@cyberdefense.org",
        "password": "AstraeaEnclave#42"
    })
    assert cit_login.status_code == 200
    cit_token = cit_login.json()["access_token"]
    cit_headers = {"Authorization": f"Bearer {cit_token}"}

    # C. File Complaint (Scenario A: Telegram Investment Fraud)
    complaint_payload = {
        "title": "Telegram High-Yield Investment Fraud",
        "category": "Financial Fraud",
        "severity": "HIGH",
        "citizenName": "Elena Rostova",
        "citizenEmail": "elena.rostova@cyberdefense.org",
        "citizenPhone": "+919876543210",
        "incidentDate": "2026-09-12",
        "financialLoss": 150000.0,
        "description": "Victim contacted on Telegram by user @invest_guru promising 30% daily returns. Transferred Rs 150,000 to UPI scammer@oksbi on GooglePay. Domain used: https://fake-invest-portal.biz.",
        "suspectInfo": {
            "upi_id": "scammer@oksbi",
            "telegram": "@invest_guru",
            "domain": "fake-invest-portal.biz"
        }
    }
    comp_res = await client.post("/api/v1/complaints", headers=cit_headers, json=complaint_payload)
    assert comp_res.status_code == 201
    comp_data = comp_res.json()
    complaint_id = comp_data["id"]
    complaint_ref = comp_data.get("reference_number") or comp_data.get("referenceNumber")
    assert complaint_ref.startswith("CYBER-")

    # D. Upload Evidence with SHA-256 seal
    evidence_content = b"BANK_TRANSACTION_RECEIPT_UTR_88492019482910"
    expected_sha256 = hashlib.sha256(evidence_content).hexdigest()

    upload_res = await client.post(
        "/api/v1/evidence/upload",
        headers=cit_headers,
        data={"complaint_id": complaint_id},
        files={"file": ("receipt.pdf", io.BytesIO(evidence_content), "application/pdf")}
    )
    assert upload_res.status_code in [200, 201]
    ev_data = upload_res.json()
    assert (ev_data.get("sha256Hash") or ev_data.get("sha256_hash")) == expected_sha256

    # -------------------------------------------------------------
    # STEP 2: CYBERSECURITY SPECIALIST FLOW
    # -------------------------------------------------------------
    spec_login = await client.post("/api/v1/auth/login", json={
        "email": "a.thorne@astraea.gov",
        "password": "AstraeaEnclave#42"
    })
    assert spec_login.status_code == 200
    spec_token = spec_login.json()["access_token"]
    spec_headers = {"Authorization": f"Bearer {spec_token}"}

    # Extract cyber entities & relations for the complaint
    rel_res = await client.post(f"/api/v1/complaints/{complaint_id}/extract-relations", headers=spec_headers)
    assert rel_res.status_code == 200
    assert "relations" in rel_res.json()

    # Create Case from Complaint
    case_res = await client.post(f"/api/v1/cases/from-complaint/{complaint_id}", headers=spec_headers)
    assert case_res.status_code == 200
    case_data = case_res.json()
    case_id = case_data.get("id")
    assert case_id is not None

    # Specialist triggers multi-stage intelligence refresh
    refresh_res = await client.post(f"/api/v1/cases/{case_id}/intelligence/refresh", headers=spec_headers)
    assert refresh_res.status_code == 200
    ref_data = refresh_res.json()
    assert ref_data["stages"]["incident_urgency"]["status"] == "SUCCESS"
    assert ref_data["stages"]["evidence_graph"]["status"] == "SUCCESS"

    # -------------------------------------------------------------
    # STEP 3: CYBERCRIME POLICE FLOW (Investigation & Lifecycle)
    # -------------------------------------------------------------
    police_login = await client.post("/api/v1/auth/login", json={
        "email": "s.chen@police.gov",
        "password": "AstraeaEnclave#42"
    })
    assert police_login.status_code == 200
    police_token = police_login.json()["access_token"]
    police_headers = {"Authorization": f"Bearer {police_token}"}

    # Police reviews evidence graph
    graph_res = await client.get(f"/api/v1/cases/{case_id}/evidence-graph", headers=police_headers)
    assert graph_res.status_code == 200
    assert graph_res.json()["node_count"] >= 1

    # Police reviews correlations
    corr_res = await client.get(f"/api/v1/cases/{case_id}/correlations", headers=police_headers)
    assert corr_res.status_code == 200

    # Advance Case Lifecycle through authoritative states
    # 1. UNDER_INVESTIGATION
    s1 = await client.patch(f"/api/v1/cases/{case_id}/status", headers=police_headers, json={"status": "UNDER_INVESTIGATION"})
    assert s1.status_code == 200

    # 2. EVIDENCE_VERIFIED
    s2 = await client.patch(f"/api/v1/cases/{case_id}/status", headers=police_headers, json={"status": "EVIDENCE_VERIFIED"})
    assert s2.status_code == 200

    # 3. LAW_ENFORCEMENT_DISPATCHED
    s3 = await client.patch(f"/api/v1/cases/{case_id}/status", headers=police_headers, json={"status": "LAW_ENFORCEMENT_DISPATCHED"})
    assert s3.status_code == 200

    # 4. RESOLVED
    s4 = await client.patch(f"/api/v1/cases/{case_id}/status", headers=police_headers, json={"status": "RESOLVED"})
    assert s4.status_code == 200

    # 5. CLOSED
    s5 = await client.patch(f"/api/v1/cases/{case_id}/status", headers=police_headers, json={"status": "CLOSED"})
    assert s5.status_code == 200

    # -------------------------------------------------------------
    # STEP 4: ADMIN FLOW (Reopen Case with Audit Trail)
    # -------------------------------------------------------------
    admin_login = await client.post("/api/v1/auth/login", json={
        "email": "root@astraea.internal",
        "password": "AstraeaEnclave#42"
    })
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin reopens the closed case
    reopen_res = await client.post(f"/api/v1/cases/{case_id}/reopen", headers=admin_headers, json={
        "reason": "New supplemental financial transaction records received from beneficiary bank."
    })
    assert reopen_res.status_code == 200
    assert "successfully reopened" in reopen_res.json()["message"]
    c_check = await client.get(f"/api/v1/cases/{case_id}", headers=admin_headers)
    assert c_check.status_code == 200
    assert c_check.json()["status"] == "UNDER_INVESTIGATION"

    # -------------------------------------------------------------
    # STEP 5: AI/ML SYSTEM LEAD FLOW (Governance & Feedback Gate)
    # -------------------------------------------------------------
    aiml_login = await client.post("/api/v1/auth/login", json={
        "email": "m.vance@ai-ops.gov",
        "password": "AstraeaEnclave#42"
    })
    assert aiml_login.status_code == 200
    aiml_token = aiml_login.json()["access_token"]
    aiml_headers = {"Authorization": f"Bearer {aiml_token}"}

    # AI Lead inspects models
    models_res = await client.get("/api/v1/mlops/models", headers=aiml_headers)
    assert models_res.status_code == 200

    # AI Lead views learning candidate queue
    cand_list = await client.get("/api/v1/learning-candidates", headers=aiml_headers)
    assert cand_list.status_code == 200
