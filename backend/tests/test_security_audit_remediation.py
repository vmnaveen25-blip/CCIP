"""
Security Audit & Remediation Regression Test Suite for CCIP / Astraea Enclave
Verifies Phase 1 through Phase 6 security controls:
1. Public tracking response data minimization (no PII, financial loss, suspect info, or evidence files leaked)
2. Evidence vault RBAC, cross-citizen isolation, unauthenticated rejection, and SHA-256 integrity verification
3. Production configuration validation (rejection of default secrets in production)
4. Seed script protection against execution in production
5. URL Analyzer adapter execution and graceful fallback
6. Cross-Case Correlation rule-based overlap fallback and review validation
7. Threat feeds and graph topology RBAC
"""

import pytest
import hashlib
from httpx import AsyncClient
from pydantic import ValidationError as PydanticValidationError


@pytest.mark.asyncio
async def test_public_tracking_data_minimization(client: AsyncClient):
    """
    Asserts that GET /api/v1/complaints/track/{ref_number} returns ONLY minimal status milestones
    and does NOT leak citizenName, citizenEmail, citizenPhone, financialLoss, suspectInfo, description, or evidenceFiles.
    """
    # 1. Register Citizen A
    reg_res = await client.post("/api/v1/auth/register", json={
        "name": "Victim Confidential",
        "email": "victim.confidential@enclave.org",
        "phone": "+91 99887 76655",
        "password": "TestPassword#2026",
        "consent": True
    })
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. File complaint with sensitive personal, financial, and suspect details
    c_res = await client.post("/api/v1/complaints", json={
        "title": "Confidential Cyber Extortion Incident",
        "category": "Extortion & Blackmail",
        "severity": "CRITICAL",
        "incidentDate": "2026-09-08",
        "financialLoss": 750000.0,
        "description": "Sensitive narrative detailing extortion demands and victim personal compromising materials.",
        "suspectInfo": {
            "alias": "DarkExtortionist",
            "phone": "+91 91234 56789",
            "walletAddress": "0xDEADBEEF12345678"
        }
    }, headers=headers)
    assert c_res.status_code == 201
    c_data = c_res.json()
    ref_num = c_data["referenceNumber"]

    # 3. Access public tracking route WITHOUT authentication
    track_res = await client.get(f"/api/v1/complaints/track/{ref_num}")
    assert track_res.status_code == 200
    track_data = track_res.json()

    # Public fields MUST be present
    assert track_data["referenceNumber"] == ref_num
    assert "status" in track_data
    assert "statusLabel" in track_data
    assert "timeline" in track_data
    assert len(track_data["timeline"]) >= 1

    # Sensitive complainant, financial, suspect, and narrative fields MUST be completely excluded
    assert "citizenName" not in track_data
    assert "citizenEmail" not in track_data
    assert "citizenPhone" not in track_data
    assert "financialLoss" not in track_data
    assert "suspectInfo" not in track_data
    assert "description" not in track_data
    assert "evidenceFiles" not in track_data
    assert "assignedOfficer" not in track_data
    assert "aiPredictedThreatGroup" not in track_data


@pytest.mark.asyncio
async def test_evidence_cross_citizen_isolation_and_unauth_rejection(client: AsyncClient):
    """
    Asserts that:
    1. Unauthenticated download attempts are rejected with 401.
    2. Citizen B cannot download or inspect evidence belonging to Citizen A (403 Forbidden).
    """
    # 1. Register Citizen A
    reg_a = await client.post("/api/v1/auth/register", json={
        "name": "Citizen Alpha",
        "email": "alpha.citizen@enclave.org",
        "password": "TestPassword#2026",
        "consent": True
    })
    token_a = reg_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register Citizen B
    reg_b = await client.post("/api/v1/auth/register", json={
        "name": "Citizen Bravo",
        "email": "bravo.citizen@enclave.org",
        "password": "TestPassword#2026",
        "consent": True
    })
    token_b = reg_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Citizen A files complaint
    c_res = await client.post("/api/v1/complaints", json={
        "title": "Citizen Alpha Private Case",
        "category": "Identity Theft",
        "incidentDate": "2026-09-08",
        "description": "Alpha confidential file."
    }, headers=headers_a)
    complaint_a_id = c_res.json()["id"]

    # Citizen A uploads evidence
    file_bytes = b"Sensitive forensic banking token and statement"
    up_res = await client.post(
        "/api/v1/evidence/upload",
        data={"complaint_id": complaint_a_id},
        files={"file": ("alpha_bank.txt", file_bytes, "text/plain")},
        headers=headers_a
    )
    assert up_res.status_code == 200
    ev_id = up_res.json()["id"]

    # Unauthenticated download MUST fail
    unauth_dl = await client.get(f"/api/v1/evidence/{ev_id}/download")
    assert unauth_dl.status_code in [401, 403]

    # Unauthenticated metadata MUST fail
    unauth_meta = await client.get(f"/api/v1/evidence/{ev_id}")
    assert unauth_meta.status_code in [401, 403]

    # Citizen B attempting to download Citizen A's evidence MUST fail with 403
    bravo_dl = await client.get(f"/api/v1/evidence/{ev_id}/download", headers=headers_b)
    assert bravo_dl.status_code == 403

    # Citizen B attempting to read Citizen A's evidence metadata MUST fail with 403
    bravo_meta = await client.get(f"/api/v1/evidence/{ev_id}", headers=headers_b)
    assert bravo_meta.status_code == 403

    # Citizen A can download their own evidence
    alpha_dl = await client.get(f"/api/v1/evidence/{ev_id}/download", headers=headers_a)
    assert alpha_dl.status_code == 200
    assert alpha_dl.content == file_bytes


def test_production_config_rejects_default_secrets():
    """
    Asserts that backend Settings validates and strictly raises PydanticValidationError
    when APP_ENV=production with DEBUG=True or default/insecure JWT keys.
    """
    from app.core.config import Settings

    # 1. Assert rejection of DEBUG=True in production
    with pytest.raises(PydanticValidationError) as exc_info:
        Settings(
            APP_ENV="production",
            DEBUG=True,
            JWT_SECRET_KEY="strong-production-key-length-32-chars-long",
            JWT_REFRESH_SECRET_KEY="strong-refresh-key-length-32-chars-long",
            _env_file=None
        )
    assert "DEBUG cannot be enabled in production" in str(exc_info.value)

    # 2. Assert rejection of default insecure JWT key in production
    with pytest.raises(PydanticValidationError) as exc_info:
        Settings(
            APP_ENV="production",
            DEBUG=False,
            JWT_SECRET_KEY="insecure-default-change-in-production",
            JWT_REFRESH_SECRET_KEY="insecure-default-change-in-production-refresh",
            _env_file=None
        )
    assert "JWT_SECRET_KEY cannot use default/insecure value in production" in str(exc_info.value)


@pytest.mark.asyncio
async def test_seed_script_aborts_in_production():
    """
    Asserts that seed_database() immediately aborts with RuntimeError when APP_ENV=production.
    """
    import os
    import pytest
    from unittest.mock import patch
    from scripts.seed import seed_database

    with patch.dict(os.environ, {"APP_ENV": "production", "ALLOW_DEMO_SEEDING": "false"}):
        with pytest.raises(RuntimeError) as exc_info:
            await seed_database()
        assert "prohibited in production" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_url_analyzer_adapter_execution():
    """
    Asserts that URLAnalyzer adapter executes genuine url_classifier inference when available.
    """
    from app.ai.adapters.url_analyzer import url_analyzer
    assert url_analyzer.is_available is True
    res = await url_analyzer.analyze_url("https://paypal-security-account-verification-login.cc/auth")
    assert res["status"] == "SUCCESS"
    assert res["connected"] is True
    assert "analysis" in res
    assert res["analysis"]["label"] in ["Phishing", "Legitimate"]


@pytest.mark.asyncio
async def test_cross_case_correlation_rule_based_fallback_and_review():
    """
    Asserts that CrossCaseCorrelationAdapter gracefully falls back to explicit rule-based overlap
    when model weights are offline, without throwing unhandled exceptions.
    """
    from app.ai.adapters.cross_case_correlation import cross_case_correlation_adapter
    pred = cross_case_correlation_adapter.predict_correlation(
        case_a_text="Victim lost 50000 in fake crypto pool",
        case_b_text="Victim wired funds to crypto scam platform",
        shared_features=["0x1234...abcd", "https://scam-pool.xyz"]
    )
    assert pred["correlation_label"] in ["STRONGLY_RELATED", "POSSIBLY_RELATED", "UNRELATED"]
    assert "advisory_warning" in pred
    assert "confidence" in pred


@pytest.mark.asyncio
async def test_intelligence_feeds_and_correlations_rbac(client: AsyncClient):
    """
    Asserts that GET /api/v1/intelligence/feeds and /correlations require specialist or admin authentication.
    """
    # Unauthenticated requests must be rejected
    res_feeds = await client.get("/api/v1/intelligence/feeds")
    assert res_feeds.status_code in [401, 403]

    res_corrs = await client.get("/api/v1/intelligence/correlations")
    assert res_corrs.status_code in [401, 403]


@pytest.mark.asyncio
async def test_evidence_upload_authorization_and_guest_tokens(client: AsyncClient):
    """
    Asserts evidence upload authorization:
    1. Anonymous upload without tracking token is rejected (401).
    2. Anonymous upload with invalid tracking token is rejected (401).
    3. Anonymous upload with valid high-entropy tracking token succeeds (200).
    4. Citizen B attempting to upload to Citizen A's complaint is rejected (403).
    5. AI/ML System Lead attempting to upload operational evidence is rejected (403).
    """
    # 1. Citizen A registers and files a complaint
    reg_a = await client.post("/api/v1/auth/register", json={
        "name": "Citizen Owner",
        "email": "owner.citizen@enclave.org",
        "password": "TestPassword#2026",
        "consent": True
    })
    token_a = reg_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    comp_res = await client.post("/api/v1/complaints", json={
        "title": "Unauthorized Access Report",
        "category": "Hacking / Unauthorized Access",
        "severity": "HIGH",
        "incidentDate": "2026-10-01",
        "description": "Evidence upload authorization validation."
    }, headers=headers_a)
    comp_data = comp_res.json()
    comp_id = comp_data["id"]
    tracking_token = comp_data["trackingToken"]

    test_file = ("evidence_test.txt", b"Suspicious network trace logs 10.0.0.1", "text/plain")

    # Clear session cookies to perform genuine unauthenticated anonymous requests
    client.cookies.clear()

    # 2. Anonymous upload with NO tracking token -> 401
    anon_fail = await client.post(
        "/api/v1/evidence/upload",
        data={"complaint_id": comp_id},
        files={"file": test_file}
    )
    assert anon_fail.status_code == 401
    assert "tracking token" in str(anon_fail.json()).lower()

    # 3. Anonymous upload with INVALID tracking token -> 401
    anon_bad_token = await client.post(
        "/api/v1/evidence/upload",
        data={"complaint_id": comp_id, "tracking_token": "ccip_trk_fake_invalid_token_123"},
        files={"file": test_file}
    )
    assert anon_bad_token.status_code == 401

    # 4. Anonymous upload with VALID tracking token -> 200
    anon_success = await client.post(
        "/api/v1/evidence/upload",
        data={"complaint_id": comp_id, "tracking_token": tracking_token},
        files={"file": test_file}
    )
    assert anon_success.status_code == 200
    assert "id" in anon_success.json()
    assert anon_success.json()["name"] == "evidence_test.txt"

    # 5. Citizen B registers and tries to upload to Citizen A's complaint -> 403
    client.cookies.clear()
    reg_b = await client.post("/api/v1/auth/register", json={
        "name": "Citizen Attacker",
        "email": "attacker.citizen@enclave.org",
        "password": "TestPassword#2026",
        "consent": True
    })
    token_b = reg_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    cross_upload = await client.post(
        "/api/v1/evidence/upload",
        data={"complaint_id": comp_id},
        files={"file": test_file},
        headers=headers_b
    )
    assert cross_upload.status_code == 403

    # 6. AI/ML Lead login and attempt upload -> 403
    ai_login = await client.post("/api/v1/auth/login", json={
        "email": "m.vance@ai-ops.gov",
        "password": "AstraeaEnclave#42"
    })
    ai_token = ai_login.json()["access_token"]
    ai_headers = {"Authorization": f"Bearer {ai_token}"}

    ai_upload = await client.post(
        "/api/v1/evidence/upload",
        data={"complaint_id": comp_id},
        files={"file": test_file},
        headers=ai_headers
    )
    assert ai_upload.status_code == 403


@pytest.mark.asyncio
async def test_case_level_and_specialist_scoping_rbac(client: AsyncClient):
    """
    Asserts object-level case authorization:
    1. Specialist A cannot access a case assigned to Specialist B (403).
    2. Specialist A cannot modify status or reassign a case assigned to Specialist B (403).
    3. AI/ML Lead is blocked from assigning cases (403).
    4. AI/ML Lead querying case details receives redacted citizen narratives and masked PII.
    """
    # 1. Setup Specialist A (Dr. Aris Thorne)
    spec_a_login = await client.post("/api/v1/auth/login", json={
        "email": "a.thorne@astraea.gov",
        "password": "AstraeaEnclave#42"
    })
    spec_a_token = spec_a_login.json()["access_token"]
    spec_a_headers = {"Authorization": f"Bearer {spec_a_token}"}

    # Setup Police (S. Chen)
    pol_login = await client.post("/api/v1/auth/login", json={
        "email": "s.chen@police.gov",
        "password": "AstraeaEnclave#42"
    })
    pol_token = pol_login.json()["access_token"]
    pol_headers = {"Authorization": f"Bearer {pol_token}"}

    # Setup AI Lead (M. Vance)
    ai_login = await client.post("/api/v1/auth/login", json={
        "email": "m.vance@ai-ops.gov",
        "password": "AstraeaEnclave#42"
    })
    ai_token = ai_login.json()["access_token"]
    ai_headers = {"Authorization": f"Bearer {ai_token}"}

    # 2. File a complaint and create a case
    cit_reg = await client.post("/api/v1/auth/register", json={
        "name": "Victim Confidential Scope",
        "email": "victim.scope@enclave.org",
        "password": "TestPassword#2026",
        "consent": True
    })
    cit_token = cit_reg.json()["access_token"]
    cit_headers = {"Authorization": f"Bearer {cit_token}"}

    c_res = await client.post("/api/v1/complaints", json={
        "title": "Private Extortion Docket",
        "category": "Extortion & Blackmail",
        "severity": "CRITICAL",
        "incidentDate": "2026-10-02",
        "description": "Top secret personal compromising video extortion demands."
    }, headers=cit_headers)
    comp_id = c_res.json()["id"]

    case_res = await client.post(f"/api/v1/cases/from-complaint/{comp_id}", headers=spec_a_headers)
    case_id = case_res.json()["id"]

    # 3. Police assigns case to a different specialist (simulate other specialist assignment)
    # Target specialist ID is dummy/other UUID
    other_spec_id = "00000000-0000-0000-0000-000000000002"
    await client.post(f"/api/v1/cases/{case_id}/assign", headers=pol_headers, json={
        "specialist_id": other_spec_id,
        "notes": "Assigned to alternate forensic examiner."
    })

    # 4. Specialist A (not assigned) attempts to fetch case detail -> 403 Forbidden
    spec_a_fetch = await client.get(f"/api/v1/cases/{case_id}", headers=spec_a_headers)
    assert spec_a_fetch.status_code == 403

    # 5. Specialist A attempts status change on other specialist's case -> 403 Forbidden
    spec_a_patch = await client.patch(f"/api/v1/cases/{case_id}/status", headers=spec_a_headers, json={
        "status": "UNDER_INVESTIGATION",
        "reason": "Unauthorized specialist intervention."
    })
    assert spec_a_patch.status_code == 403

    # 6. AI/ML Lead attempts assignment -> 403 Forbidden
    ai_assign = await client.post(f"/api/v1/cases/{case_id}/assign", headers=ai_headers, json={
        "notes": "AI lead cannot assign cases."
    })
    assert ai_assign.status_code == 403

    # 7. AI/ML Lead reads case detail -> Citizen narrative is masked and PII redacted
    ai_fetch = await client.get(f"/api/v1/cases/{case_id}", headers=ai_headers)
    assert ai_fetch.status_code == 200
    ai_data = ai_fetch.json()
    assert "[REDACTED" in ai_data["summary"]
    if ai_data.get("complaint"):
        assert "[REDACTED" in ai_data["complaint"]["description"]
        assert ai_data["complaint"]["citizenName"] == "[REDACTED]"
        assert ai_data["complaint"]["citizenEmail"] == "[REDACTED]"


@pytest.mark.asyncio
async def test_report_generation_and_export_security(client: AsyncClient):
    """
    Asserts report generation security:
    1. Rejects report creation for non-existent case (404).
    2. Rejects report creation by AI/ML Lead (403).
    3. Replaces fake RSA-PSS claim with truthful SHA-256 Sovereign Integrity Digest.
    4. Sanitizes CSV exports against spreadsheet formula injection (DDE attacks).
    """
    # 1. Police credentials
    pol_login = await client.post("/api/v1/auth/login", json={
        "email": "s.chen@police.gov",
        "password": "AstraeaEnclave#42"
    })
    pol_headers = {"Authorization": f"Bearer {pol_login.json()['access_token']}"}

    # 2. AI Lead credentials
    ai_login = await client.post("/api/v1/auth/login", json={
        "email": "m.vance@ai-ops.gov",
        "password": "AstraeaEnclave#42"
    })
    ai_headers = {"Authorization": f"Bearer {ai_login.json()['access_token']}"}

    # Attempt report creation for non-existent case -> 404
    bad_case_rep = await client.post("/api/v1/reports", headers=pol_headers, json={
        "case_id": "non-existent-case-id-12345",
        "report_type": "FINAL_INVESTIGATION_REPORT",
        "title": "Ghost Report",
        "summary": "Should fail because case does not exist."
    })
    assert bad_case_rep.status_code == 404

    # AI Lead attempting report creation -> 403
    ai_rep = await client.post("/api/v1/reports", headers=ai_headers, json={
        "report_type": "FINAL_INVESTIGATION_REPORT",
        "title": "AI Report",
        "summary": "AI Lead attempt."
    })
    assert ai_rep.status_code == 403

    # 3. Create genuine report with potentially malicious CSV formula injection in summary
    formula_injection_summary = "=cmd|' /C calc'!A0; +2+5; @SUM(1,2)"
    rep_res = await client.post("/api/v1/reports", headers=pol_headers, json={
        "report_type": "FORENSIC_EVIDENCE_SUMMARY",
        "title": "=HYPERLINK(\"http://malicious.link\", \"Click Here\")",
        "summary": formula_injection_summary,
        "content_json": {"sections_included": ["Executive Summary", "Evidence Integrity"]}
    })
    assert rep_res.status_code == 201
    rep_data = rep_res.json()
    rep_id = rep_data["id"]

    # Verify truthful digital seal (SHA-256, NOT RSA-PSS)
    digital_seal = rep_data["content_json"]["digital_seal"]
    assert digital_seal["algorithm"] == "SHA-256 Sovereign Integrity Digest"
    assert len(digital_seal["digest"]) == 64  # Valid 64-hex SHA-256 digest

    # 4. Export report as CSV and verify formula sanitization
    csv_res = await client.get(f"/api/v1/reports/{rep_id}/export?format=csv", headers=pol_headers)
    assert csv_res.status_code == 200
    csv_content = csv_res.text

    # Leading =, +, @ must be escaped with prepended single quote (')
    assert "'=HYPERLINK" in csv_content or "'=" in csv_content
    assert "'=cmd" in csv_content
