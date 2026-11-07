import io
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from reportlab.pdfgen import canvas
from app.models.knowledge_material import KnowledgeMaterial, KnowledgeChunk


def _build_valid_text_pdf() -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    c.drawString(72, 720, "Cyber Crime Intelligence Advisory: Standard operating procedures for investigating unauthorized banking debits and phone fraud.")
    c.save()
    return buf.getvalue()

VALID_TEXT_PDF = _build_valid_text_pdf()

# PDF with valid structure but zero text characters (simulating a pure scanned image document)
SCANNED_IMAGE_PDF = (
    b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
    b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n"
    b"xref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n"
    b"trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n185\n%%EOF"
)


@pytest.mark.asyncio
async def test_valid_text_pdf_ingestion(client: AsyncClient, db_session: AsyncSession):
    """Verify clean text PDF is parsed, semantic chunks generated, and status set to AVAILABLE."""
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "root@astraea.internal", "password": "AstraeaEnclave#42", "target_role": "ADMIN"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    file_obj = io.BytesIO(VALID_TEXT_PDF)
    res = await client.post(
        "/api/v1/admin/knowledge-materials",
        headers=headers,
        data={"title": "Valid Banking Advisory PDF", "category": "Citizen Guide"},
        files={"file": ("valid_advisory.pdf", file_obj, "application/pdf")}
    )
    assert res.status_code == 201
    doc_id = res.json()["document"]["id"]

    # Trigger synchronous processing in service
    from app.services.knowledge_materials_service import knowledge_materials_service
    await knowledge_materials_service.process_document(doc_id, db=db_session)

    # Verify database state
    q = select(KnowledgeMaterial).where(KnowledgeMaterial.id == doc_id)
    mat_res = await db_session.execute(q)
    material = mat_res.scalars().first()

    assert material is not None
    assert material.processing_status == "AVAILABLE"
    assert material.chatbot_status == "AVAILABLE"
    assert material.chunks_count > 0

    # Verify chunks exist
    chunks_q = select(KnowledgeChunk).where(KnowledgeChunk.material_id == doc_id)
    chunks_res = await db_session.execute(chunks_q)
    chunks = chunks_res.scalars().all()
    assert len(chunks) == material.chunks_count
    assert any("Cyber Crime Intelligence Advisory" in c.chunk_text for c in chunks)


@pytest.mark.asyncio
async def test_scanned_pdf_marked_ocr_required_no_synthetic_chunks(client: AsyncClient, db_session: AsyncSession):
    """Verify scanned/image-only PDF is marked OCR_REQUIRED and NEVER generates synthetic chunks."""
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "root@astraea.internal", "password": "AstraeaEnclave#42", "target_role": "ADMIN"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    file_obj = io.BytesIO(SCANNED_IMAGE_PDF)
    res = await client.post(
        "/api/v1/admin/knowledge-materials",
        headers=headers,
        data={"title": "Scanned Handwritten FIR", "category": "Citizen Safety"},
        files={"file": ("scanned_fir.pdf", file_obj, "application/pdf")}
    )
    assert res.status_code == 201
    doc_id = res.json()["document"]["id"]

    from app.services.knowledge_materials_service import knowledge_materials_service
    await knowledge_materials_service.process_document(doc_id, db=db_session)

    q = select(KnowledgeMaterial).where(KnowledgeMaterial.id == doc_id)
    mat_res = await db_session.execute(q)
    material = mat_res.scalars().first()

    assert material is not None
    assert material.processing_status == "OCR_REQUIRED"
    assert material.chatbot_status == "DISABLED"
    assert material.chunks_count == 0
    assert "OCR processing required" in (material.error_message or "")

    # Assert 0 chunks in database
    chunks_q = select(KnowledgeChunk).where(KnowledgeChunk.material_id == doc_id)
    chunks_res = await db_session.execute(chunks_q)
    chunks = chunks_res.scalars().all()
    assert len(chunks) == 0


@pytest.mark.asyncio
async def test_empty_and_unsupported_files_rejected(client: AsyncClient):
    """Verify 0-byte files and unsupported extensions are rejected at upload validation."""
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "root@astraea.internal", "password": "AstraeaEnclave#42", "target_role": "ADMIN"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. 0-byte file
    empty_file = io.BytesIO(b"")
    res_empty = await client.post(
        "/api/v1/admin/knowledge-materials",
        headers=headers,
        data={"title": "Empty File"},
        files={"file": ("empty.pdf", empty_file, "application/pdf")}
    )
    assert res_empty.status_code == 400

    # 2. Unsupported extension
    script_file = io.BytesIO(b"#!/bin/bash\necho hello")
    res_ext = await client.post(
        "/api/v1/admin/knowledge-materials",
        headers=headers,
        data={"title": "Shell Script"},
        files={"file": ("exploit.sh", script_file, "text/x-shellscript")}
    )
    assert res_ext.status_code == 400
    assert "Unsupported file format" in res_ext.text


@pytest.mark.asyncio
async def test_malware_eicar_signature_quarantined(client: AsyncClient, db_session: AsyncSession):
    """Verify file containing malware signature is quarantined, disabled, and not indexed."""
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "root@astraea.internal", "password": "AstraeaEnclave#42", "target_role": "ADMIN"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    eicar_sig = b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"
    malware_doc = io.BytesIO(b"Security Advisory\n" + eicar_sig)

    res = await client.post(
        "/api/v1/admin/knowledge-materials",
        headers=headers,
        data={"title": "Malware Injected Document", "category": "Technical Advisory"},
        files={"file": ("eicar_threat.txt", malware_doc, "text/plain")}
    )
    assert res.status_code == 201
    doc_data = res.json()["document"]
    assert doc_data["processing_status"] == "QUARANTINED"
    assert doc_data["chatbot_status"] == "DISABLED"
