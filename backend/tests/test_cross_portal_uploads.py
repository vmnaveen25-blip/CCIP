import io
import asyncio
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from reportlab.pdfgen import canvas
from app.models.knowledge_material import KnowledgeMaterial
from app.models.evidence import Evidence
from app.models.complaint import Complaint


def _build_sample_pdf() -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    c.drawString(72, 720, "National Cyber Security Policy: Cross-portal upload verification test document content.")
    c.save()
    return buf.getvalue()

VALID_SAMPLE_PDF = _build_sample_pdf()


@pytest.mark.asyncio
async def test_cross_portal_uploads_end_to_end(client: AsyncClient, db_session: AsyncSession):
    """Test uploads across Admin Knowledge Base, Citizen Intake, and Investigator Vault."""
    # 1. Admin Portal Upload
    admin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "root@astraea.internal", "password": "AstraeaEnclave#42", "target_role": "ADMIN"}
    )
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    km_file = io.BytesIO(VALID_SAMPLE_PDF)
    km_res = await client.post(
        "/api/v1/admin/knowledge-materials",
        headers=admin_headers,
        data={"title": "Cross Portal Test Doc", "category": "Legal Advisory"},
        files={"file": ("cross_portal.pdf", km_file, "application/pdf")}
    )
    assert km_res.status_code == 201
    assert km_res.json()["status"] == "SUCCESS"

    # 2. Citizen Intake Complaint & Evidence Upload with Tracking Token
    complaint_payload = {
        "title": "Unauthorized SIM Swap Fraud",
        "description": "Lost cellular connectivity and money debited from bank account.",
        "category": "Identity Theft",
        "incidentDate": "2026-11-06T10:00:00Z",
        "financialLoss": 50000.0,
        "citizenName": "Citizen Ramesh",
        "citizenEmail": "ramesh@example.com",
        "citizenPhone": "+919876543210"
    }
    comp_res = await client.post("/api/v1/complaints", json=complaint_payload)
    assert comp_res.status_code == 201
    comp_data = comp_res.json()
    complaint_id = comp_data["id"]
    tracking_token = comp_data.get("tracking_token") or comp_data.get("trackingToken")
    assert tracking_token is not None

    # Guest citizen uploads evidence using authentic tracking token
    evidence_pdf = io.BytesIO(b"%PDF-1.4 Citizen Bank Statement Attachment 0123456789")
    ev_res = await client.post(
        "/api/v1/evidence/upload",
        data={"complaint_id": complaint_id, "tracking_token": tracking_token},
        files={"file": ("bank_statement.pdf", evidence_pdf, "application/pdf")}
    )
    assert ev_res.status_code == 200
    assert ev_res.json()["name"] == "bank_statement.pdf"
    assert ev_res.json()["verified"] is True

    # 3. Investigator Portal Upload
    spec_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "a.thorne@astraea.gov", "password": "AstraeaEnclave#42", "target_role": "CYBERSECURITY_SPECIALIST"}
    )
    spec_token = spec_login.json()["access_token"]
    spec_headers = {"Authorization": f"Bearer {spec_token}"}

    forensic_log = io.BytesIO(b"2026-11-07 11:00:00 TCP SYN 192.168.1.100 -> 10.0.0.1:443")
    forensic_res = await client.post(
        "/api/v1/evidence/upload",
        headers=spec_headers,
        data={"complaint_id": complaint_id},
        files={"file": ("firewall_triage.log", forensic_log, "text/plain")}
    )
    assert forensic_res.status_code == 200
    assert forensic_res.json()["name"] == "firewall_triage.log"


@pytest.mark.asyncio
async def test_duplicate_upload_idempotency(client: AsyncClient, db_session: AsyncSession):
    """Verify uploading the exact same file twice preserves single storage record and updates timestamp."""
    admin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "root@astraea.internal", "password": "AstraeaEnclave#42", "target_role": "ADMIN"}
    )
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    file1 = io.BytesIO(VALID_SAMPLE_PDF)
    res1 = await client.post(
        "/api/v1/admin/knowledge-materials",
        headers=admin_headers,
        data={"title": "Idempotent Document V1", "category": "General Awareness"},
        files={"file": ("idempotent_doc.pdf", file1, "application/pdf")}
    )
    assert res1.status_code == 201
    doc_id_1 = res1.json()["document"]["id"]

    # Re-upload identical bytes with updated title
    file2 = io.BytesIO(VALID_SAMPLE_PDF)
    res2 = await client.post(
        "/api/v1/admin/knowledge-materials",
        headers=admin_headers,
        data={"title": "Idempotent Document V2 Renamed", "category": "General Awareness"},
        files={"file": ("idempotent_doc.pdf", file2, "application/pdf")}
    )
    assert res2.status_code == 201
    doc_id_2 = res2.json()["document"]["id"]

    # Must match the exact same document ID without creating a duplicate record
    assert doc_id_1 == doc_id_2

    # Verify only 1 record exists with this hash
    import hashlib
    h = hashlib.sha256(VALID_SAMPLE_PDF).hexdigest()
    stmt = select(KnowledgeMaterial).where(KnowledgeMaterial.file_hash == h)
    res = await db_session.execute(stmt)
    records = res.scalars().all()
    assert len(records) == 1
    assert records[0].title == "Idempotent Document V2 Renamed"


@pytest.mark.asyncio
async def test_concurrent_simultaneous_uploads(client: AsyncClient, db_session: AsyncSession):
    """Verify system handles multiple simultaneous uploads without file lock or DB race conditions."""
    admin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "root@astraea.internal", "password": "AstraeaEnclave#42", "target_role": "ADMIN"}
    )
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    async def upload_task(idx: int):
        content = f"Concurrent Upload Document #{idx} unique payload".encode("utf-8")
        f = io.BytesIO(content)
        return await client.post(
            "/api/v1/admin/knowledge-materials",
            headers=admin_headers,
            data={"title": f"Concurrent Document {idx}", "category": "Citizen Safety"},
            files={"file": (f"concurrent_{idx}.txt", f, "text/plain")}
        )

    tasks = [upload_task(i) for i in range(5)]
    responses = await asyncio.gather(*tasks)

    for r in responses:
        assert r.status_code == 201
        assert r.json()["status"] == "SUCCESS"
