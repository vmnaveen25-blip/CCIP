"""
Citizen Complaint Lifecycle Timeline Test Suite
Validates:
- Citizen can retrieve their own complaint timeline
- Citizen is denied access to another citizen's timeline (HTTP 403)
- Correct 10-stage lifecycle mapping and completed/current/pending status calculations
- Reopen timeline event insertion
- Cancelled complaint state handling
- Strict data isolation boundary: zero internal intelligence, model names, or confidence leaked
- Evidence integrity wording verification (no "court admissible" claims)
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.complaint import Complaint, ComplaintStatusEnum
from app.models.case import Case, CaseStatusEnum
from app.models.complaint_event import ComplaintEvent
from app.models.case_status_history import CaseStatusHistory
from app.models.evidence import Evidence


async def get_token(client: AsyncClient, email: str) -> str:
    res = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "AstraeaEnclave#42"
    })
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_citizen_can_view_own_timeline(client: AsyncClient, db_session: AsyncSession):
    # Elena Rostova (seeded citizen)
    token = await get_token(client, "elena.rostova@cyberdefense.org")

    # Complaint CYBER-2026-9842 is seeded in conftest.py under Elena Rostova
    res = await client.get(
        "/api/v1/citizen/complaints/CYBER-2026-9842/timeline",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200, res.text
    data = res.json()

    assert data["complaint_reference"] == "CYBER-2026-9842"
    assert "current_status" in data
    assert "progress" in data
    assert data["progress"]["total"] == 10
    assert isinstance(data["progress"]["completed"], int)

    # Verify timeline stages
    timeline = data["timeline"]
    assert len(timeline) >= 10
    stage_names = [item["stage"] for item in timeline]
    assert "COMPLAINT_SUBMITTED" in stage_names
    assert "INITIAL_REVIEW" in stage_names
    assert "INTELLIGENCE_ANALYSIS" in stage_names
    assert "CASE_CREATED" in stage_names
    assert "ASSIGNED" in stage_names
    assert "UNDER_INVESTIGATION" in stage_names
    assert "EVIDENCE_VERIFIED" in stage_names
    assert "APPROPRIATE_ACTION_INITIATED" in stage_names
    assert "RESOLVED" in stage_names
    assert "CLOSED" in stage_names

    # Verify evidence summary
    assert "evidence_summary" in data
    assert "integrity_status" in data["evidence_summary"]

    # Verify citizen actions
    assert "allowed_actions" in data
    assert data["allowed_actions"]["view_details"] is True


@pytest.mark.asyncio
async def test_citizen_denied_another_citizens_timeline(client: AsyncClient, db_session: AsyncSession):
    # Seed a private complaint belonging to someone else
    other_complaint = Complaint(
        reference_number="CYBER-SECRET-7777",
        title="Unauthorized Private Incident",
        category="Financial Fraud",
        severity="HIGH",
        status="UNDER_INVESTIGATION",
        citizen_name="Bob Victim",
        citizen_email="bob.victim@external.org",
        incident_date="2026-09-01 10:00 UTC",
        reported_date="2026-09-01 11:00 UTC",
        financial_loss=50000.0,
        description="Private complaint text."
    )
    db_session.add(other_complaint)
    await db_session.commit()

    # Elena Rostova tries to access Bob's complaint
    token = await get_token(client, "elena.rostova@cyberdefense.org")
    res = await client.get(
        f"/api/v1/citizen/complaints/{other_complaint.id}/timeline",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_status_mapping_and_progress_calculation(client: AsyncClient, db_session: AsyncSession):
    token = await get_token(client, "elena.rostova@cyberdefense.org")

    # Create a complaint currently at UNDER_INVESTIGATION
    c = Complaint(
        reference_number="CYBER-STAGE-6001",
        title="UPI Phishing Investigation",
        category="Financial Fraud",
        severity="HIGH",
        status="UNDER_INVESTIGATION",
        citizen_name="Elena Rostova",
        citizen_email="elena.rostova@cyberdefense.org",
        incident_date="2026-09-10 12:00 UTC",
        reported_date="2026-09-10 13:00 UTC",
        financial_loss=12000.0,
        description="Investigation in progress test."
    )
    db_session.add(c)
    await db_session.commit()

    res = await client.get(
        f"/api/v1/citizen/complaints/{c.id}/timeline",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()

    # 5 prior stages completed (1..5), 6th is CURRENT, 7..10 are PENDING
    assert data["progress"]["completed"] == 5
    assert data["progress"]["total"] == 10

    stage_map = {item["stage"]: item["state"] for item in data["timeline"]}
    assert stage_map["COMPLAINT_SUBMITTED"] == "COMPLETED"
    assert stage_map["INITIAL_REVIEW"] == "COMPLETED"
    assert stage_map["INTELLIGENCE_ANALYSIS"] == "COMPLETED"
    assert stage_map["CASE_CREATED"] == "COMPLETED"
    assert stage_map["ASSIGNED"] == "COMPLETED"
    assert stage_map["UNDER_INVESTIGATION"] == "CURRENT"
    assert stage_map["EVIDENCE_VERIFIED"] == "PENDING"
    assert stage_map["APPROPRIATE_ACTION_INITIATED"] == "PENDING"
    assert stage_map["RESOLVED"] == "PENDING"
    assert stage_map["CLOSED"] == "PENDING"


@pytest.mark.asyncio
async def test_reopen_timeline_event(client: AsyncClient, db_session: AsyncSession):
    token = await get_token(client, "elena.rostova@cyberdefense.org")

    c = Complaint(
        reference_number="CYBER-REOPEN-9001",
        title="Reopened Case Test",
        category="Financial Fraud",
        severity="MEDIUM",
        status="UNDER_INVESTIGATION",
        citizen_name="Elena Rostova",
        citizen_email="elena.rostova@cyberdefense.org",
        incident_date="2026-09-08 12:00 UTC",
        reported_date="2026-09-08 13:00 UTC",
        financial_loss=10000.0,
        description="Reopen test complaint."
    )
    db_session.add(c)
    await db_session.flush()

    ev = ComplaintEvent(
        complaint_id=c.id,
        title="Case Reopened by Supervisor",
        description="New information required the investigation to continue.",
        actor="Admin Supervisor",
        timestamp="2026-09-12 14:00 UTC"
    )
    db_session.add(ev)
    await db_session.commit()

    res = await client.get(
        f"/api/v1/citizen/complaints/{c.id}/timeline",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["is_reopened"] is True

    reopen_stages = [item for item in data["timeline"] if item["state"] == "REOPENED"]
    assert len(reopen_stages) == 1
    assert reopen_stages[0]["title"] == "Case Reopened"
    assert "New information" in reopen_stages[0]["description"]


@pytest.mark.asyncio
async def test_cancelled_timeline(client: AsyncClient, db_session: AsyncSession):
    token = await get_token(client, "elena.rostova@cyberdefense.org")

    c = Complaint(
        reference_number="CYBER-CANCEL-3001",
        title="Cancelled Complaint Test",
        category="Financial Fraud",
        severity="LOW",
        status="CANCELLED",
        citizen_name="Elena Rostova",
        citizen_email="elena.rostova@cyberdefense.org",
        incident_date="2026-09-09 12:00 UTC",
        reported_date="2026-09-09 13:00 UTC",
        financial_loss=0.0,
        description="Cancelled test complaint."
    )
    db_session.add(c)
    await db_session.flush()

    ev = ComplaintEvent(
        complaint_id=c.id,
        title="Complaint Cancelled",
        description="Duplicate entry lodged in error.",
        actor="Citizen Request",
        timestamp="2026-09-09 15:00 UTC"
    )
    db_session.add(ev)
    await db_session.commit()

    res = await client.get(
        f"/api/v1/citizen/complaints/{c.id}/timeline",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["is_cancelled"] is True
    assert "Duplicate entry" in data["cancellation_reason"]
    assert data["allowed_actions"]["add_evidence"] is False


@pytest.mark.asyncio
async def test_evidence_integrity_wording_and_zero_leakage(client: AsyncClient, db_session: AsyncSession):
    token = await get_token(client, "elena.rostova@cyberdefense.org")

    c = Complaint(
        reference_number="CYBER-EVID-4001",
        title="Evidence Integrity Test",
        category="Financial Fraud",
        severity="MEDIUM",
        status="EVIDENCE_VERIFIED",
        citizen_name="Elena Rostova",
        citizen_email="elena.rostova@cyberdefense.org",
        incident_date="2026-09-10 10:00 UTC",
        reported_date="2026-09-10 11:00 UTC",
        financial_loss=15000.0,
        description="Testing integrity seal."
    )
    db_session.add(c)
    await db_session.flush()

    ev1 = Evidence(
        complaint_id=c.id,
        original_filename="bank_statement.pdf",
        mime_type="application/pdf",
        file_size_bytes=204800,
        file_size_formatted="200 KB",
        storage_key="storage/enc_bank_statement.pdf",
        sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        is_verified=True,
        uploaded_by_user_id=None
    )
    db_session.add(ev1)
    await db_session.commit()

    res = await client.get(
        f"/api/v1/citizen/complaints/{c.id}/timeline",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()

    # Evidence integrity label check
    assert data["evidence_summary"]["integrity_status"] == "VERIFIED"
    assert data["evidence_summary"]["integrity_label"] == "SHA-256 Integrity Seal Verified"
    assert data["evidence_summary"]["count"] == 1

    # CRITICAL: Verify NEVER contains "court admissible"
    raw_json_str = res.text.lower()
    assert "court admissible" not in raw_json_str

    # Strict Data Boundary: Verify zero internal intelligence fields are leaked
    forbidden_keys = [
        "cross_case",
        "similar_cases",
        "confidence_score",
        "model_name",
        "deberta",
        "xgboost",
        "lightgbm",
        "correlation_confidence",
        "evidence_graph",
        "suspect_intel",
        "investigator_notes"
    ]
    for key in forbidden_keys:
        assert key not in raw_json_str
