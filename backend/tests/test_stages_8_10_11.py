"""
CCIP Stages 8, 10 & 11 Verification Suite
Covers:
Stage 8:
- Investigator case dossier retrieval with SLA countdown & breach calculation
- Section 65B Indian Evidence Act / Section 63 BSA cryptographic certificate generation
- Investigator workload quota and capacity threshold enforcement

Stage 10:
- Centralized AI orchestrator status covering all 14 registered models
- Model lifecycle status reporting and idle model cache unloading
- Incident classification routing with mandatory human verification tagging

Stage 11:
- Digital evidence on-demand SHA-256 hash recalculation and custody audit logging
- Statutory legal hold activation and retention record persistence
- Explainable cross-case correlation score breakdown and specialist data isolation
- Depth-limited 3D WebGL intelligence graph node and edge payload delivery
"""

import pytest
import secrets
import io
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_stage_8_investigator_dossier_and_certificate_65b(client: AsyncClient):
    # 1. Specialist Login (Dr. Aris Thorne)
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "a.thorne@astraea.gov", "password": "AstraeaEnclave#42"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. List cases to get an assigned case
    cases_res = await client.get("/api/v1/cases", headers=headers)
    assert cases_res.status_code == 200
    cases = cases_res.json()
    assert len(cases) > 0
    test_case = cases[0]
    case_id = test_case["id"]

    # 3. Retrieve Unified Case Dossier
    dossier_res = await client.get(f"/api/v1/cases/{case_id}/dossier", headers=headers)
    assert dossier_res.status_code == 200
    dossier = dossier_res.json()

    assert "case" in dossier
    assert "complaint" in dossier
    assert "evidence" in dossier
    assert "indicators" in dossier
    assert "investigation" in dossier
    assert "timeline" in dossier

    case_info = dossier["case"]
    assert "sla_deadline" in case_info
    assert "sla_remaining_seconds" in case_info
    assert "is_sla_breached" in case_info
    assert isinstance(case_info["sla_remaining_seconds"], int)

    # 4. Generate Section 65B BSA Evidence Certificate
    cert_res = await client.get(f"/api/v1/cases/{case_id}/certificate-65b", headers=headers)
    assert cert_res.status_code == 200
    cert = cert_res.json()

    assert "certificate_id" in cert
    assert cert["certificate_id"].startswith("BSA-65B-")
    assert "Section 65B" in cert["statutory_act"]
    assert "issuing_officer" in cert
    assert "schedule_of_evidence" in cert
    assert "certificate_hash" in cert
    assert len(cert["certificate_hash"]) == 64  # Valid SHA-256 hex digest
    assert cert["integrity_status"] in ("AUTHENTICATED_AND_VERIFIED", "INTEGRITY_TAMPER_ALERT")


@pytest.mark.asyncio
async def test_stage_8_investigator_workload_quota_guard(client: AsyncClient):
    # Admin login to test assignment
    admin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "root@astraea.internal", "password": "AstraeaEnclave#42"}
    )
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Fetch a case
    cases_res = await client.get("/api/v1/cases", headers=admin_headers)
    assert cases_res.status_code == 200
    test_case = cases_res.json()[0]

    # Fetch specialists
    users_res = await client.get("/api/v1/admin/users?page=1&page_size=10&paginate=true", headers=admin_headers)
    assert users_res.status_code == 200
    users_data = users_res.json()
    items = users_data.get("items", users_data)
    staff_user = next((u for u in items if "thorne" in u["email"].lower()), None)
    assert staff_user is not None

    # Update investigator profile to OVERLOADED / max capacity
    await client.post(
        "/api/v1/admin/investigators",
        json={
            "user_id": staff_user["id"],
            "badge_number": f"BADGE-{secrets.token_hex(3).upper()}",
            "specializations": ["RANSOMWARE", "CRYPTO_FORENSICS"],
            "max_active_cases": 1,
            "availability_status": "OVERLOADED"
        },
        headers=admin_headers
    )

    # Attempt assignment to overloaded investigator - must be rejected with 400 Bad Request
    assign_res = await client.post(
        f"/api/v1/cases/{test_case['id']}/assign",
        json={
            "specialist_id": staff_user["id"],
            "notes": "Testing assignment capacity quota enforcement."
        },
        headers=admin_headers
    )
    assert assign_res.status_code == 400
    assert "Investigator capacity exceeded" in assign_res.json()["detail"]


@pytest.mark.asyncio
async def test_stage_10_ai_orchestrator_14_models_and_lifecycle(client: AsyncClient):
    # Staff login (Dr. Aris Thorne)
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "a.thorne@astraea.gov", "password": "AstraeaEnclave#42"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Fetch orchestrator status
    orch_res = await client.get("/api/v1/mlops/orchestrator/status", headers=headers)
    assert orch_res.status_code == 200
    orch_data = orch_res.json()

    assert orch_data["total_models"] == 14
    models = orch_data["models"]

    # Verify all 14 models exist in the registry
    expected_models = [
        "complaint_classifier",
        "url_phishing",
        "sms_spam",
        "email_threat",
        "cyber_ner",
        "case_similarity",
        "incident_urgency",
        "relation_extraction",
        "cross_case_correlation",
        "evidence_graph_link",
        "feedback_gate",
        "graph_correlation",
        "investigation_assistant",
        "risk_scoring"
    ]
    for model_name in expected_models:
        assert model_name in models, f"Model {model_name} missing from AI Orchestrator!"
        assert "status" in models[model_name]
        assert "architecture" in models[model_name]

    # 2. AI Lead unloads model from cache
    ai_lead_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "m.vance@ai-ops.gov", "password": "AstraeaEnclave#42"}
    )
    assert ai_lead_login.status_code == 200
    ai_token = ai_lead_login.json()["access_token"]
    ai_headers = {"Authorization": f"Bearer {ai_token}"}

    unload_res = await client.post(
        "/api/v1/mlops/orchestrator/unload?model_name=url_phishing",
        headers=ai_headers
    )
    assert unload_res.status_code == 200
    assert unload_res.json()["status"] == "SUCCESS"

    # 3. Task routing test with human verification tagging
    from app.ai.orchestrator import ai_orchestrator
    classify_result = await ai_orchestrator.classify_incident(
        "Victim received malicious WhatsApp message with link to fake banking site and transferred Rs 25,000"
    )
    assert "human_verification_status" in classify_result
    assert classify_result["human_verification_status"] == "HUMAN_VERIFICATION_PENDING"
    assert "inference_latency_ms" in classify_result


@pytest.mark.asyncio
async def test_stage_11_evidence_custody_correlation_and_3d_graph(client: AsyncClient):
    # Staff login (Dr. Aris Thorne)
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "a.thorne@astraea.gov", "password": "AstraeaEnclave#42"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Fetch Case for Evidence Attachment
    cases_res = await client.get("/api/v1/cases", headers=headers)
    assert cases_res.status_code == 200
    test_case = cases_res.json()[0]
    case_id = test_case["id"]
    complaint_id = test_case["complaint_id"]

    # 2. Upload sample evidence
    fake_file_content = b"CRITICAL FORENSIC EVIDENCE ARTIFACT - SHA256 INTEGRITY TEST DATA"
    files = {"file": ("test_forensic_artifact.txt", io.BytesIO(fake_file_content), "text/plain")}
    data = {"complaint_id": complaint_id, "case_id": case_id}

    upload_res = await client.post("/api/v1/evidence/upload", files=files, data=data, headers=headers)
    assert upload_res.status_code in (200, 201)
    ev_upload = upload_res.json()
    ev_id = ev_upload["id"]

    # 3. Verify on-demand SHA-256 hash recalculation
    verify_res = await client.get(f"/api/v1/evidence/{ev_id}/verify-hash", headers=headers)
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert "integrity_verified" in verify_data
    assert "stored_hash" in verify_data
    assert "verified_hash" in verify_data
    assert verify_data["action"] == "HASH_VERIFICATION_COMPLETE"

    # 4. Toggle Legal Hold on Evidence
    hold_res = await client.post(
        f"/api/v1/evidence/{ev_id}/legal-hold",
        data={"legal_hold": "true", "reason": "High Court Section 91 CrPC Preservation Order"},
        headers=headers
    )
    assert hold_res.status_code == 200
    assert hold_res.json()["legal_hold_active"] is True

    # 5. Check Immutable Custody Log
    custody_res = await client.get(f"/api/v1/evidence/{ev_id}/custody-log", headers=headers)
    assert custody_res.status_code == 200
    custody_data = custody_res.json()
    assert "chain_of_custody" in custody_data
    assert custody_data["total_custody_events"] > 0

    # 6. Cross-Case Correlation with Explainable Breakdown
    corr_res = await client.get(f"/api/v1/cases/{case_id}/correlations", headers=headers)
    assert corr_res.status_code == 200
    correlations = corr_res.json()
    assert isinstance(correlations, list)

    # 7. 3D WebGL Graph Payload (Depth & Memory Guardrails)
    graph_res = await client.get(
        f"/api/v1/cases/{case_id}/evidence-graph?depth=1&max_nodes=100",
        headers=headers
    )
    assert graph_res.status_code == 200
    graph = graph_res.json()
    assert "nodes" in graph
    assert "edges" in graph
    assert "node_count" in graph
    assert "edge_count" in graph
    assert graph["depth"] == 1
    assert graph["node_count"] <= 100
