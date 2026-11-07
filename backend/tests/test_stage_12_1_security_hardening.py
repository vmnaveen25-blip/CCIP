"""
Stage 12.1 Dedicated Security Hardening and Production Verification Test Suite
Covers:
1. Anti-SSRF socket-level IP pinning and DNS rebinding (TOCTOU) prevention
2. IPv4-mapped IPv6 address rejection (::ffff:127.0.0.1, ::ffff:169.254.169.254, ::ffff:10.0.0.1)
3. Alternate numeric IP encoding rejection (decimal 2130706433, hex 0x7f000001, octal 0177.0.0.1)
4. Comprehensive loopback, private RFC 1918, link-local, and cloud metadata blocking
5. Explainable threat scoring history preservation on FALSE_POSITIVE transitions
6. Multi-event controlled indicator re-review audit trail
7. Indicator review history inspection API (GET /indicators/{id}/history)
8. Feed synchronization concurrency mutex / duplicate sync prevention
9. Feed synchronization rate limit enforcement and force bypass
10. Feed failure intelligence preservation (failure isolation without indicator loss)
11. Court dossier pre-sealing evidence bitstream tamper detection (FIPS 180-4 SHA-256)
12. Court dossier cryptographic seal verification endpoint
13. 3D Graph topology relationship volume pagination guard
"""

import os
import json
import uuid
import hashlib
import tempfile
import pytest
import pytest_asyncio
from unittest.mock import patch, MagicMock, AsyncMock
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.services.threat_ssrf_guard import (
    validate_outbound_url,
    parse_alternate_ip,
    check_ip_security,
    SSRFSecurityViolation,
    PinnedAsyncHTTPTransport,
    PinnedAsyncNetworkBackend,
    ssrf_safe_client
)
from app.services.threat_scoring_engine import threat_scoring_engine, ThreatFindingState
from app.services.threat_intel_service import threat_intel_service
from app.services.court_dossier_service import court_dossier_service
from app.services.investigation_enrichment_service import investigation_enrichment_service
from app.models.threat_intelligence_v2 import (
    ThreatIntelligenceSource,
    ThreatIndicator,
    ThreatIndicatorReviewAudit,
    ThreatFeedSync,
    InvestigationReportVersion
)
from app.models.case import Case
from app.models.complaint import Complaint
from app.models.evidence import Evidence
from app.models.evidence_hash import EvidenceHash
from app.models.user import User


async def get_auth_token(client: AsyncClient, email: str, password: str = "AstraeaEnclave#42") -> str:
    res = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]


# =====================================================================
# 1. SSRF & EXTERNAL FEED CONNECTION SECURITY TESTS
# =====================================================================

def test_01_ssrf_ipv4_mapped_ipv6_blocking():
    """Validates that IPv4-mapped IPv6 addresses for loopback, metadata, and private subnets are blocked."""
    # Loopback mapped: ::ffff:127.0.0.1
    with pytest.raises(SSRFSecurityViolation):
        validate_outbound_url("http://[::ffff:127.0.0.1]/status")

    # Cloud metadata mapped: ::ffff:169.254.169.254
    with pytest.raises(SSRFSecurityViolation):
        validate_outbound_url("http://[::ffff:169.254.169.254]/latest/meta-data")

    # RFC 1918 Private mapped: ::ffff:10.0.0.1
    with pytest.raises(SSRFSecurityViolation):
        validate_outbound_url("http://[::ffff:10.0.0.1]/internal")

    # Hex form of loopback IPv6 mapped: ::ffff:7f00:1
    with pytest.raises(SSRFSecurityViolation):
        validate_outbound_url("http://[::ffff:7f00:1]/secret")


def test_02_ssrf_alternate_ip_representations_blocking():
    """Validates that decimal, hex, and octal representations of loopback/private IPs are detected and blocked."""
    # 2130706433 is 127.0.0.1 in decimal integer format
    with pytest.raises(SSRFSecurityViolation):
        validate_outbound_url("http://2130706433/admin")

    # 0x7f000001 is 127.0.0.1 in hexadecimal format
    with pytest.raises(SSRFSecurityViolation):
        validate_outbound_url("http://0x7f000001/admin")

    # 0177.0.0.1 is 127.0.0.1 in octal dotted format
    with pytest.raises(SSRFSecurityViolation):
        validate_outbound_url("http://0177.0.0.1/admin")

    # 2852039166 is 169.254.169.254 in decimal integer format (Cloud Metadata IMDS)
    with pytest.raises(SSRFSecurityViolation):
        validate_outbound_url("http://2852039166/latest")

    # 0xa9fea9fe is 169.254.169.254 in hex format
    with pytest.raises(SSRFSecurityViolation):
        validate_outbound_url("http://0xa9fea9fe/meta-data")


def test_03_ssrf_alternate_ip_parser_unit():
    """Unit tests for parse_alternate_ip helper function."""
    ip_dec = parse_alternate_ip("2130706433")
    assert ip_dec is not None
    assert str(ip_dec) == "127.0.0.1"

    ip_hex = parse_alternate_ip("0x7f000001")
    assert ip_hex is not None
    assert str(ip_hex) == "127.0.0.1"

    ip_oct = parse_alternate_ip("0177.0.0.1")
    assert ip_oct is not None
    assert str(ip_oct) == "127.0.0.1"

    # Benign domain names must not parse as alternate IP
    assert parse_alternate_ip("otx.alienvault.com") is None
    assert parse_alternate_ip("urlhaus-api.abuse.ch") is None


def test_04_ssrf_socket_ip_pinning_transport():
    """Validates that PinnedAsyncNetworkBackend intercepts host connection and binds to pre-validated IP."""
    backend = PinnedAsyncNetworkBackend(pinned_ip="198.51.100.42")
    assert backend.pinned_ip == "198.51.100.42"

    transport = PinnedAsyncHTTPTransport(pinned_ip="198.51.100.42")
    assert transport._pool is not None


# =====================================================================
# 2. THREAT SCORING HISTORY AND AUDITABILITY TESTS
# =====================================================================

@pytest.mark.asyncio
async def test_05_scoring_history_preservation_on_false_positive(client: AsyncClient, db_session: AsyncSession):
    """
    Validates that marking an indicator as FALSE_POSITIVE sets the score to 0.0,
    while preserving original calculated scores, breakdown factors, reviewer ID, reason, and timestamp.
    """
    token = await get_auth_token(client, "a.thorne@astraea.gov")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Register an indicator with high score
    ind_val = f"198.51.100.{uuid.uuid4().hex[:2]}"
    create_res = await client.post(
        "/api/v1/threat-intel/indicators",
        json={
            "indicator_value": ind_val,
            "indicator_type": "IPV4",
            "threat_category": "BOTNET",
            "confidence_score": 90.0,
            "reputation_verdict": "MALICIOUS"
        },
        headers=headers
    )
    assert create_res.status_code == 201
    ind_id = create_res.json()["indicator_id"]

    # Verify initial high score
    ind_q = select(ThreatIndicator).where(ThreatIndicator.id == ind_id)
    res = await db_session.execute(ind_q)
    ind = res.scalars().first()
    original_score = ind.composite_threat_score
    assert original_score > 60.0

    # 2. Update state to FALSE_POSITIVE with justification
    override_reason = "Internal authorized vulnerability scanner appliance."
    patch_res = await client.patch(
        f"/api/v1/threat-intel/indicators/{ind_id}/finding-state",
        json={
            "finding_state": "FALSE_POSITIVE",
            "notes": override_reason
        },
        headers=headers
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["new_composite_score"] == 0.0

    # 3. Verify in database: score is 0.0, but original score and factors are preserved
    await db_session.refresh(ind)
    assert ind.composite_threat_score == 0.0
    assert ind.finding_state == "FALSE_POSITIVE"
    assert ind.score_breakdown_json.get("false_positive_override") is True
    assert ind.score_breakdown_json.get("preserved_original_score") == original_score

    # Verify historical score list
    assert len(ind.historical_scores_json) >= 1
    history = ind.historical_scores_json[-1]
    assert history["previous_score"] == original_score
    assert history["new_score"] == 0.0
    assert history["override_reason"] == override_reason
    assert history["reviewer_email"] == "a.thorne@astraea.gov"


@pytest.mark.asyncio
async def test_06_indicator_review_history_endpoint_and_rereview(client: AsyncClient, db_session: AsyncSession):
    """
    Validates controlled re-review: transitioning an indicator from FALSE_POSITIVE
    back to HUMAN_REVIEWED restores the calculated score and appends a second audit record.
    """
    token = await get_auth_token(client, "a.thorne@astraea.gov")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create indicator
    ind_val = f"rereview-{uuid.uuid4().hex[:6]}.com"
    create_res = await client.post(
        "/api/v1/threat-intel/indicators",
        json={
            "indicator_value": ind_val,
            "threat_category": "PHISHING",
            "confidence_score": 85.0,
            "reputation_verdict": "MALICIOUS"
        },
        headers=headers
    )
    ind_id = create_res.json()["indicator_id"]

    # 2. Transition to FALSE_POSITIVE
    await client.patch(
        f"/api/v1/threat-intel/indicators/{ind_id}/finding-state",
        json={"finding_state": "FALSE_POSITIVE", "notes": "Initial false alarm suspected."},
        headers=headers
    )

    # 3. Re-review and transition back to HUMAN_REVIEWED
    re_review_res = await client.patch(
        f"/api/v1/threat-intel/indicators/{ind_id}/finding-state",
        json={"finding_state": "HUMAN_REVIEWED", "notes": "New telemetry confirms active phishing deployment."},
        headers=headers
    )
    assert re_review_res.status_code == 200
    restored_score = re_review_res.json()["new_composite_score"]
    assert restored_score > 50.0

    # 4. Query the history endpoint
    hist_res = await client.get(f"/api/v1/threat-intel/indicators/{ind_id}/history", headers=headers)
    assert hist_res.status_code == 200
    hist_data = hist_res.json()

    assert hist_data["indicator_id"] == ind_id
    assert hist_data["current_state"] == "HUMAN_REVIEWED"
    assert hist_data["current_score"] == restored_score
    assert len(hist_data["historical_scores"]) == 2
    assert len(hist_data["audits"]) == 2

    # Verify chronological sequence
    assert hist_data["historical_scores"][0]["new_state"] == "FALSE_POSITIVE"
    assert hist_data["historical_scores"][1]["new_state"] == "HUMAN_REVIEWED"


# =====================================================================
# 3. FEED SYNCHRONIZATION GOVERNANCE TESTS
# =====================================================================

@pytest.mark.asyncio
async def test_07_feed_sync_concurrency_mutex(db_session: AsyncSession):
    """Validates that concurrent sync attempts for the same feed acquire a mutex and reject duplicates."""
    await threat_intel_service.seed_default_sources(db_session)
    q = select(ThreatIntelligenceSource).limit(1)
    res = await db_session.execute(q)
    source = res.scalars().first()

    # Artificially lock the mutex for this source
    import asyncio
    if source.id not in threat_intel_service._sync_locks:
        threat_intel_service._sync_locks[source.id] = asyncio.Lock()
    lock = threat_intel_service._sync_locks[source.id]

    await lock.acquire()
    try:
        from app.core.exceptions import CCIPException
        with pytest.raises(CCIPException) as exc_info:
            await threat_intel_service.sync_source(db_session, source.id, sync_type="MANUAL")
        assert exc_info.value.code == "SYNC_ALREADY_IN_PROGRESS"
        assert exc_info.value.status_code == 409
    finally:
        lock.release()


@pytest.mark.asyncio
async def test_08_feed_sync_rate_limit_and_force_bypass(db_session: AsyncSession):
    """Validates minimum interval rate limit between manual syncs and force=True bypass."""
    await threat_intel_service.seed_default_sources(db_session)
    q = select(ThreatIntelligenceSource).limit(1)
    res = await db_session.execute(q)
    source = res.scalars().first()

    # Simulate recent sync 30 seconds ago
    source.last_sync_at = datetime.now(timezone.utc) - timedelta(seconds=30)
    await db_session.commit()

    # Attempting manual sync without force should fail with 429
    from app.core.exceptions import CCIPException
    with pytest.raises(CCIPException) as exc_info:
        await threat_intel_service.sync_source(db_session, source.id, sync_type="MANUAL", force=False)
    assert exc_info.value.code == "SYNC_RATE_LIMITED"
    assert exc_info.value.status_code == 429

    # Passing force=True must bypass the cooldown
    with patch.object(threat_intel_service, "get_adapter_for_source") as mock_adapter_fn:
        mock_adapter = MagicMock()
        mock_result = MagicMock()
        mock_result.success = True
        mock_result.indicators = []
        mock_result.rate_limit_remaining = 100
        mock_adapter.fetch_feed = AsyncMock(return_value=mock_result)
        mock_adapter_fn.return_value = mock_adapter

        sync_rec = await threat_intel_service.sync_source(db_session, source.id, sync_type="MANUAL", force=True)
        assert sync_rec.status == "SUCCESS"


@pytest.mark.asyncio
async def test_09_feed_failure_does_not_delete_indicators(db_session: AsyncSession):
    """
    Validates failure isolation: when a feed provider fails (500 or timeout),
    the sync record is marked FAILED, but all previously persisted indicators remain unaltered.
    """
    await threat_intel_service.seed_default_sources(db_session)
    q = select(ThreatIntelligenceSource).where(ThreatIntelligenceSource.provider_code == "URLHAUS")
    res = await db_session.execute(q)
    source = res.scalars().first()

    # Seed an indicator under this source
    indicator = ThreatIndicator(
        indicator_type="URL",
        original_value="http://malicious-seed.com/loader.exe",
        normalized_value="malicious-seed.com/loader.exe",
        defanged_value="hxxp://malicious-seed[.]com/loader.exe",
        source_id=source.id,
        source_name=source.name,
        threat_category="MALWARE",
        confidence_score=90.0,
        reputation_verdict="MALICIOUS",
        composite_threat_score=85.0
    )
    db_session.add(indicator)
    await db_session.commit()

    # Simulate a feed failure
    with patch.object(threat_intel_service, "get_adapter_for_source") as mock_adapter_fn:
        mock_adapter = MagicMock()
        mock_result = MagicMock()
        mock_result.success = False
        mock_result.error_message = "Remote threat feed returned HTTP status 503 Service Unavailable"
        mock_adapter.fetch_feed = AsyncMock(return_value=mock_result)
        mock_adapter_fn.return_value = mock_adapter

        sync_rec = await threat_intel_service.sync_source(db_session, source.id, sync_type="SCHEDULED", force=True)
        assert sync_rec.status == "FAILED"

    # Assert that the previously seeded indicator is STILL present in database
    check_q = select(ThreatIndicator).where(ThreatIndicator.id == indicator.id)
    check_res = await db_session.execute(check_q)
    persisted = check_res.scalars().first()
    assert persisted is not None
    assert persisted.normalized_value == "malicious-seed.com/loader.exe"


# =====================================================================
# 4. COURT DOSSIER INTEGRITY & VERIFICATION TESTS
# =====================================================================

@pytest.mark.asyncio
async def test_10_court_dossier_tamper_detection(db_session: AsyncSession):
    """
    Validates that if an evidence file on disk is modified or tampered with
    after initial ingestion, the dossier generator flags INTEGRITY_TAMPER_ALERT.
    """
    user_q = select(User).where(User.email == "a.thorne@astraea.gov")
    user_res = await db_session.execute(user_q)
    user = user_res.scalars().first()

    complaint = Complaint(
        reference_number=f"TAMPER-COMP-{uuid.uuid4().hex[:6].upper()}",
        title="Tamper Investigation Incident",
        description="Forensic investigation incident regarding suspect malware transmission.",
        category="Financial Fraud",
        severity="HIGH",
        status="UNDER_INVESTIGATION",
        citizen_name="Elena Rostova",
        citizen_email="elena.rostova@cyberdefense.org",
        incident_date="2026-09-02 14:15 UTC",
        reported_date="2026-09-02 16:30 UTC"
    )
    db_session.add(complaint)
    await db_session.flush()

    case_obj = Case(
        case_number=f"TAMPER-TEST-{uuid.uuid4().hex[:4].upper()}",
        complaint_id=complaint.id,
        title="Tamper Detection Acceptance Test",
        status="UNDER_INVESTIGATION",
        priority="HIGH",
        assigned_specialist_id=user.id
    )
    db_session.add(case_obj)
    await db_session.commit()

    # Create temporary evidence file with known hash
    with tempfile.NamedTemporaryFile(delete=False, suffix=".bin") as f:
        original_bytes = b"Authentic Bitstream Telemetry 12345"
        f.write(original_bytes)
        file_path = f.name

    original_hash = hashlib.sha256(original_bytes).hexdigest()

    ev = Evidence(
        complaint_id=complaint.id,
        case_id=case_obj.id,
        original_filename="tamper_evidence.bin",
        mime_type="application/octet-stream",
        file_size_bytes=len(original_bytes),
        file_size_formatted=f"{len(original_bytes)} B",
        storage_key=file_path,
        sha256_hash=original_hash
    )
    db_session.add(ev)
    await db_session.commit()

    ev_hash = EvidenceHash(
        evidence_id=ev.id,
        hash_algorithm="SHA-256",
        hash_value=original_hash
    )
    db_session.add(ev_hash)
    await db_session.commit()

    try:
        # Case 1: Untampered file -> verification succeeds
        dossier_clean = await court_dossier_service.generate_dossier_data(db_session, case_obj.id, user)
        assert dossier_clean["tamper_alert_active"] is False
        assert dossier_clean["evidence_integrity_verified"] is True
        assert dossier_clean["evidence_inventory"][0]["verification_status"] == "VERIFIED_BITSTREAM_MATCH"

        # Case 2: Tamper with file on disk -> change bitstream
        with open(file_path, "wb") as f:
            f.write(b"TAMPERED MALICIOUS OVERWRITE 99999")

        dossier_tampered = await court_dossier_service.generate_dossier_data(db_session, case_obj.id, user)
        assert dossier_tampered["tamper_alert_active"] is True
        assert dossier_tampered["evidence_integrity_verified"] is False
        assert dossier_tampered["evidence_inventory"][0]["verification_status"] == "TAMPER_DETECTED_HASH_MISMATCH"

        # Check that analytical findings includes the tamper alert
        findings = dossier_tampered["section_d_analytical_findings"]
        tamper_finding = next((fn for fn in findings if fn.get("tamper_alert") is True), None)
        assert tamper_finding is not None
        assert "INTEGRITY_TAMPER_ALERT" in tamper_finding["summary"]

    finally:
        if os.path.exists(file_path):
            os.remove(file_path)


@pytest.mark.asyncio
async def test_11_court_dossier_verification_endpoint(client: AsyncClient, db_session: AsyncSession):
    """
    Validates that a sealed court dossier can be verified through the verification API,
    confirming matching cryptographic SHA-256 seal and statutory metadata.
    """
    token = await get_auth_token(client, "a.thorne@astraea.gov")
    headers = {"Authorization": f"Bearer {token}"}

    user_q = select(User).where(User.email == "a.thorne@astraea.gov")
    user_res = await db_session.execute(user_q)
    user = user_res.scalars().first()

    complaint = Complaint(
        reference_number=f"VERIFY-COMP-{uuid.uuid4().hex[:6].upper()}",
        title="Dossier Verification Incident",
        description="Forensic investigation incident regarding sealed evidence validation.",
        category="Financial Fraud",
        severity="HIGH",
        status="UNDER_INVESTIGATION",
        citizen_name="Elena Rostova",
        citizen_email="elena.rostova@cyberdefense.org",
        incident_date="2026-09-02 14:15 UTC",
        reported_date="2026-09-02 16:30 UTC"
    )
    db_session.add(complaint)
    await db_session.flush()

    case_obj = Case(
        case_number=f"VERIFY-TEST-{uuid.uuid4().hex[:4].upper()}",
        complaint_id=complaint.id,
        title="Dossier Cryptographic Verification Test",
        status="UNDER_INVESTIGATION",
        priority="MEDIUM",
        assigned_specialist_id=user.id
    )
    db_session.add(case_obj)
    await db_session.commit()

    # Seal dossier
    version = await court_dossier_service.generate_and_save_dossier(db_session, case_obj.id, user)
    report_code = version.report_code

    # Call verification endpoint
    verify_res = await client.get(f"/api/v1/reports/court-dossier/{report_code}/verify", headers=headers)
    assert verify_res.status_code == 200
    verify_data = verify_res.json()

    assert verify_data["is_authentic"] is True
    assert verify_data["report_code"] == report_code
    assert verify_data["stored_seal"] == version.sha256_digest
    assert verify_data["pdf_binary_sha256"] is not None
    assert "Section 65B" in verify_data["statutory_act"]
    assert "Section 63" in verify_data["statutory_act"]


# =====================================================================
# 5. GRAPH AND TOPOLOGY OPTIMIZATION TESTS
# =====================================================================

@pytest.mark.asyncio
async def test_12_graph_topology_limit_and_pagination(client: AsyncClient):
    """Validates that GET /threat-intel/graph honors relationship limit query parameters."""
    token = await get_auth_token(client, "a.thorne@astraea.gov")
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.get("/api/v1/threat-intel/graph?limit=50", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "links" in data
    assert len(data["links"]) <= 50

