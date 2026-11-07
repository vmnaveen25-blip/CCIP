import io
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.case import Case
from app.models.complaint import Complaint
from app.models.evidence import Evidence
from app.models.user import User
from app.models.role import Role, RoleEnum
from app.core.security import create_access_token


@pytest.mark.asyncio
async def test_evidence_custody_sha256_and_section_65b(client: AsyncClient, db_session: AsyncSession):
    """Verify evidence upload generates immutable SHA-256 hash and compliant Section 65B certificate."""
    # Login as admin
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "root@astraea.internal", "password": "AstraeaEnclave#42", "target_role": "ADMIN"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch a valid complaint
    q = select(Complaint).limit(1)
    res = await db_session.execute(q)
    complaint = res.scalars().first()
    assert complaint is not None

    evidence_content = b"%PDF-1.4 Digital Forensic Packet Capture Evidence File Bytes 0123456789"
    file_obj = io.BytesIO(evidence_content)

    upload_res = await client.post(
        "/api/v1/evidence/upload",
        headers=headers,
        data={"complaint_id": complaint.id},
        files={"file": ("packet_capture.pdf", file_obj, "application/pdf")}
    )
    assert upload_res.status_code == 200
    evidence_id = upload_res.json()["id"]

    # Verify SHA-256
    import hashlib
    expected_sha = hashlib.sha256(evidence_content).hexdigest()
    assert upload_res.json()["sha256Hash"] == expected_sha

    # Generate Section 65B Certificate
    cert_res = await client.get(f"/api/v1/evidence/{evidence_id}/certificate-65b", headers=headers)
    assert cert_res.status_code == 200
    cert = cert_res.json()
    assert cert["evidence_id"] == evidence_id
    assert cert["sha256_hash"] == expected_sha
    assert "Section 65B" in cert["certification_statement"]

    # Verify Tamper Integrity Endpoint
    verify_res = await client.post(f"/api/v1/evidence/{evidence_id}/verify-integrity", headers=headers)
    assert verify_res.status_code == 200
    assert "VERIFIED" in verify_res.json()["status"]
    assert verify_res.json()["match"] is True


@pytest.mark.asyncio
async def test_investigator_cross_case_isolation_blocked(client: AsyncClient, db_session: AsyncSession):
    """Verify an investigator cannot access evidence belonging to another officer's assigned case."""
    # Create Specialist A and Specialist B
    role_q = select(Role).where(Role.name == RoleEnum.CYBERSECURITY_SPECIALIST.value)
    r_res = await db_session.execute(role_q)
    spec_role = r_res.scalars().first()

    spec_a = User(
        id="spec-officer-a-uuid",
        email="specialist_a@cybercell.gov.in",
        full_name="Specialist A",
        password_hash="hash",
        role_id=spec_role.id if spec_role else None,
        is_active=True
    )
    spec_b = User(
        id="spec-officer-b-uuid",
        email="specialist_b@cybercell.gov.in",
        full_name="Specialist B",
        password_hash="hash",
        role_id=spec_role.id if spec_role else None,
        is_active=True
    )
    db_session.add(spec_a)
    db_session.add(spec_b)
    await db_session.commit()

    # Create Case assigned strictly to Specialist A
    comp = Complaint(
        id="comp-assigned-a-01",
        reference_number="CCIP-2026-ISOLATION-A",
        title="Restricted Investigation A",
        description="Confidential case for Specialist A",
        category="State Sponsored",
        citizen_name="Specialist Case Complainant",
        citizen_email="specialist_case@state.gov",
        incident_date="2026-11-06 10:00:00 UTC",
        reported_date="2026-11-06 11:00:00 UTC",
        status="UNDER_INVESTIGATION"
    )
    db_session.add(comp)
    await db_session.commit()

    case_a = Case(
        id="case-assigned-a-01",
        case_number="CASE-2026-SPEC-A",
        complaint_id=comp.id,
        title="Restricted Investigation A",
        priority="CRITICAL",
        status="UNDER_INVESTIGATION",
        assigned_specialist_id=spec_a.id
    )
    db_session.add(case_a)
    await db_session.commit()

    # Evidence attached to Case A
    evidence_a = Evidence(
        id="ev-restricted-a-01",
        complaint_id=comp.id,
        case_id=case_a.id,
        original_filename="restricted_logs.pdf",
        mime_type="application/pdf",
        file_size_bytes=1024,
        file_size_formatted="1.0 KB",
        storage_key="evidence/ev_restricted_a.pdf",
        sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        integrity_status="VERIFIED",
        is_verified=True
    )
    db_session.add(evidence_a)
    await db_session.commit()

    # Specialist B token
    token_b = create_access_token(data={"sub": spec_b.id, "email": spec_b.email, "role": RoleEnum.CYBERSECURITY_SPECIALIST.value})
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Specialist B attempts to download evidence from Case A
    res = await client.get(f"/api/v1/evidence/{evidence_a.id}/download", headers=headers_b)
    assert res.status_code == 403
    assert "assigned to another officer" in res.text


@pytest.mark.asyncio
async def test_legal_hold_deletion_guard(client: AsyncClient, db_session: AsyncSession):
    """Verify evidence under statutory legal hold cannot be deleted until hold is released."""
    # Admin login
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "root@astraea.internal", "password": "AstraeaEnclave#42", "target_role": "ADMIN"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create evidence item
    ev = Evidence(
        id="ev-legal-hold-test-01",
        complaint_id="comp-assigned-a-01",
        original_filename="court_exhibit_1.pdf",
        mime_type="application/pdf",
        file_size_bytes=2048,
        file_size_formatted="2.0 KB",
        storage_key="evidence/ev_court_exhibit.pdf",
        sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        integrity_status="VERIFIED",
        is_verified=True,
        is_legal_hold=False
    )
    db_session.add(ev)
    await db_session.commit()

    # 1. Apply Legal Hold
    hold_res = await client.post(
        f"/api/v1/evidence/{ev.id}/legal-hold",
        headers=headers,
        json={"legal_hold": True, "reason": "High Court Preservation Order"}
    )
    assert hold_res.status_code == 200
    assert hold_res.json()["legal_hold_active"] is True

    # 2. Attempt Deletion while Legal Hold is Active -> Must be rejected with 403
    del_res = await client.delete(f"/api/v1/evidence/{ev.id}", headers=headers)
    assert del_res.status_code == 403
    assert "statutory legal hold" in del_res.text.lower()

    # 3. Release Legal Hold
    release_res = await client.post(
        f"/api/v1/evidence/{ev.id}/legal-hold",
        headers=headers,
        json={"legal_hold": False, "reason": "Adjudication Complete"}
    )
    assert release_res.status_code == 200
    assert release_res.json()["legal_hold_active"] is False

    # 4. Deletion Now Succeeds
    del_ok_res = await client.delete(f"/api/v1/evidence/{ev.id}", headers=headers)
    assert del_ok_res.status_code == 200
    assert del_ok_res.json()["is_deleted"] is True
