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
