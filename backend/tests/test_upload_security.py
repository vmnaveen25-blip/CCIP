import io
import time
import pytest
import jwt
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.security import create_access_token
from app.models.user import User
from app.models.role import RoleEnum, Role
from app.models.complaint import Complaint


@pytest.mark.asyncio
async def test_unauthenticated_requests_strictly_rejected(client: AsyncClient, db_session: AsyncSession):
    """Verify missing credentials strictly return 401 Unauthorized and NEVER grant admin access."""
    # 1. Privileged admin endpoint
    res1 = await client.get("/api/v1/admin/knowledge-materials")
    assert res1.status_code == 401
    assert "Authorization credentials were not provided" in res1.text

    # 2. Case dossier endpoint
    res2 = await client.get("/api/v1/cases")
    assert res2.status_code == 401

    # 3. Evidence upload for non-existent complaint strictly returns 404
    empty_file = io.BytesIO(b"%PDF-1.4 Minimal PDF header")
    res_404 = await client.post(
        "/api/v1/evidence/upload",
        data={"complaint_id": "nonexistent-complaint-uuid"},
        files={"file": ("test.pdf", empty_file, "application/pdf")}
    )
    assert res_404.status_code == 404

    # 4. Evidence upload for existing complaint without tracking token or auth strictly returns 401
    q = select(Complaint).limit(1)
    res_c = await db_session.execute(q)
    complaint = res_c.scalars().first()
    assert complaint is not None

    file_obj = io.BytesIO(b"%PDF-1.4 Minimal PDF header")
    res3 = await client.post(
        "/api/v1/evidence/upload",
        data={"complaint_id": complaint.id},
        files={"file": ("test.pdf", file_obj, "application/pdf")}
    )
    assert res3.status_code == 401
    assert "Authentication or valid complaint tracking token required" in res3.text


@pytest.mark.asyncio
async def test_invalid_and_expired_tokens_rejected(client: AsyncClient):
    """Verify malformed and expired tokens return 401 and do not fall back to admin."""
    # 1. Garbage token
    bad_headers = {"Authorization": "Bearer this_is_a_completely_garbage_token"}
    res = await client.get("/api/v1/admin/knowledge-materials", headers=bad_headers)
    assert res.status_code == 401
    assert "Invalid authentication token" in res.text

    # 2. Expired token
    expired_payload = {
        "sub": "user-test-id",
        "email": "attacker@test.com",
        "exp": int(time.time()) - 3600,  # 1 hour ago
        "type": "access"
    }
    expired_jwt = jwt.encode(expired_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    exp_headers = {"Authorization": f"Bearer {expired_jwt}"}
    res_exp = await client.get("/api/v1/admin/knowledge-materials", headers=exp_headers)
    assert res_exp.status_code == 401
    assert "Access token has expired" in res_exp.text


@pytest.mark.asyncio
async def test_citizen_attempting_administrator_access(client: AsyncClient, db_session: AsyncSession):
    """Verify citizen role cannot access administrative or staff upload routes."""
    citizen_q = select(User).where(User.email == "citizen_tester@example.com")
    res = await db_session.execute(citizen_q)
    citizen = res.scalars().first()
    if not citizen:
        role_q = select(Role).where(Role.name == RoleEnum.CITIZEN.value)
        role_res = await db_session.execute(role_q)
        cit_role = role_res.scalars().first()
        citizen = User(
            id="cit-tester-uuid-01",
            email="citizen_tester@example.com",
            full_name="Citizen Tester",
            password_hash="argon2_hashed_placeholder",
            role_id=cit_role.id if cit_role else None,
            is_active=True
        )
        db_session.add(citizen)
        await db_session.commit()
        await db_session.refresh(citizen)

    token = create_access_token(data={"sub": citizen.id, "email": citizen.email, "role": RoleEnum.CITIZEN.value})
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to upload knowledge material (admin only)
    pdf_bytes = io.BytesIO(b"%PDF-1.4 Fake Admin Upload")
    res = await client.post(
        "/api/v1/admin/knowledge-materials",
        headers=headers,
        data={"title": "Privilege Escalation Attempt", "category": "Legal Advisory"},
        files={"file": ("priv_esc.pdf", pdf_bytes, "application/pdf")}
    )
    assert res.status_code == 403
    assert "not authorized" in res.text.lower()


@pytest.mark.asyncio
async def test_cross_citizen_idor_evidence_upload_blocked(client: AsyncClient, db_session: AsyncSession):
    """Verify a citizen cannot upload evidence to another citizen's complaint."""
    # Create Citizen A and Complaint A
    comp_a = Complaint(
        id="comp-citizen-a-01",
        reference_number="CCIP-2026-AAAA",
        title="Citizen A Complaint",
        description="Loss of funds via phishing",
        category="Financial Fraud",
        citizen_name="Victim A",
        citizen_email="victim_a@example.com",
        incident_date="2026-11-06 10:00:00 UTC",
        reported_date="2026-11-06 11:00:00 UTC",
        citizen_id="victim-citizen-a-uuid",
        tracking_token="TOKEN-A-SECRET-1234",
        status="SUBMITTED"
    )
    db_session.add(comp_a)
    await db_session.commit()

    # Create Citizen B (Attacker)
    attacker_role_q = select(Role).where(Role.name == RoleEnum.CITIZEN.value)
    role_res = await db_session.execute(attacker_role_q)
    cit_role = role_res.scalars().first()
    attacker = User(
        id="attacker-citizen-b-uuid",
        email="attacker_b@example.com",
        full_name="Attacker B",
        password_hash="placeholder_hash",
        role_id=cit_role.id if cit_role else None,
        is_active=True
    )
    db_session.add(attacker)
    await db_session.commit()

    token_b = create_access_token(data={"sub": attacker.id, "email": attacker.email, "role": RoleEnum.CITIZEN.value})
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Citizen B attempts to attach evidence to Complaint A
    dummy_pdf = io.BytesIO(b"%PDF-1.4 Attacker file")
    res = await client.post(
        "/api/v1/evidence/upload",
        headers=headers_b,
        data={"complaint_id": comp_a.id},
        files={"file": ("injected_evidence.pdf", dummy_pdf, "application/pdf")}
    )
    assert res.status_code == 403
    assert "Cannot upload evidence to another citizen's case" in res.text


@pytest.mark.asyncio
async def test_mime_spoofing_and_path_traversal(client: AsyncClient, db_session: AsyncSession):
    """Verify executable disguised as PDF is rejected, and path traversal in filename is sanitized."""
    # Admin login
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "root@astraea.internal", "password": "AstraeaEnclave#42", "target_role": "ADMIN"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Executable disguised as PDF
    mz_executable = io.BytesIO(b"MZ\x90\x00\x03\x00\x00\x00Windows Executable Binary Payload")
    res_mime = await client.post(
        "/api/v1/admin/knowledge-materials",
        headers=headers,
        data={"title": "Spoofed Executable", "category": "Citizen Guide"},
        files={"file": ("malicious.pdf", mz_executable, "application/pdf")}
    )
    assert res_mime.status_code == 400
    assert "Binary executable masquerading as PDF rejected" in res_mime.text or "MIME verification failed" in res_mime.text

    # 2. Path traversal in filename
    valid_pdf_content = (
        b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n"
        b"4 0 obj\n<< /Length 55 >>\nstream\nBT /F1 12 Tf 72 712 Td (Safe Path Traversal Sanitization Test Content Here) Tj ET\nendstream\nendobj\n"
        b"xref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000210 00000 n \n"
        b"trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n316\n%%EOF"
    )
    traversal_file = io.BytesIO(valid_pdf_content)
    res_trav = await client.post(
        "/api/v1/admin/knowledge-materials",
        headers=headers,
        data={"title": "Path Traversal Test", "category": "Technical Advisory"},
        files={"file": ("../../../../etc/passwd.pdf", traversal_file, "application/pdf")}
    )
    assert res_trav.status_code == 201
    stored_name = res_trav.json()["document"]["title"]
    assert ".." not in stored_name
