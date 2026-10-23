import io
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.schemas.evidence import (
    EvidenceResponse, 
    EvidenceUploadResponse, 
    DocumentProcessingResultResponse
)
from app.services.evidence_service import evidence_service
from app.services.document_processor_service import document_processor
from app.core.permissions import get_current_user
from app.models.user import User
from app.models.evidence import Evidence
from app.models.cyber_entity import CyberEntity
from app.models.document_processing import DocumentProcessingResult

router = APIRouter(prefix="/evidence", tags=["Evidence Vault & Document Processing"])


@router.get("", response_model=List[EvidenceUploadResponse])
async def list_evidence(
    complaint_id: Optional[str] = None,
    case_id: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all stored evidence items with SHA-256 integrity seals and processing statuses."""
    q = select(Evidence).options(selectinload(Evidence.document_processing))
    if complaint_id:
        q = q.where(Evidence.complaint_id == complaint_id)
    if case_id:
        q = q.where(Evidence.case_id == case_id)
    res = await db.execute(q)
    items = res.scalars().all()
    
    return [
        EvidenceUploadResponse(
            id=ev.id,
            name=ev.original_filename,
            size=ev.file_size_formatted,
            type=ev.mime_type,
            sha256Hash=ev.sha256_hash,
            verified=ev.is_verified,
            integrity_status=ev.integrity_status,
            processing_status=ev.document_processing.processing_status if ev.document_processing else "COMPLETED",
            download_url=f"/api/v1/evidence/{ev.id}/download"
        )
        for ev in items
    ]


@router.post("/upload", response_model=EvidenceUploadResponse)
async def upload_evidence_file(
    request: Request,
    complaint_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload evidence file, record SHA-256 submission integrity seal into Enclave Vault, and trigger automated document processing."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent")

    evidence = await evidence_service.upload_evidence(
        db=db,
        complaint_id=complaint_id,
        file=file,
        current_user=current_user,
        ip_address=client_ip,
        user_agent=user_agent
    )

    # Reload with document processing record
    q = select(Evidence).where(Evidence.id == evidence.id).options(selectinload(Evidence.document_processing))
    res = await db.execute(q)
    ev_loaded = res.scalars().first() or evidence

    status = ev_loaded.document_processing.processing_status if ev_loaded.document_processing else "COMPLETED"

    return EvidenceUploadResponse(
        id=evidence.id,
        name=evidence.original_filename,
        size=evidence.file_size_formatted,
        type=evidence.mime_type,
        sha256Hash=evidence.sha256_hash,
        verified=evidence.is_verified,
        integrity_status=evidence.integrity_status,
        processing_status=status,
        download_url=f"/api/v1/evidence/{evidence.id}/download"
    )


@router.get("/{evidence_id}", response_model=EvidenceResponse)
async def get_evidence_metadata(
    evidence_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get metadata, integrity hash, and processing status of an evidence file."""
    q = select(Evidence).where(Evidence.id == evidence_id).options(selectinload(Evidence.document_processing))
    res = await db.execute(q)
    ev = res.scalars().first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence item not found")

    status = ev.document_processing.processing_status if ev.document_processing else "COMPLETED"

    return EvidenceResponse(
        id=ev.id,
        complaint_id=ev.complaint_id,
        case_id=ev.case_id,
        original_filename=ev.original_filename,
        mime_type=ev.mime_type,
        file_size_formatted=ev.file_size_formatted,
        file_size_bytes=ev.file_size_bytes,
        sha256_hash=ev.sha256_hash,
        integrity_status=ev.integrity_status,
        is_verified=ev.is_verified,
        processing_status=status,
        created_at=ev.created_at,
        download_url=f"/api/v1/evidence/{ev.id}/download"
    )


@router.get("/{evidence_id}/download")
async def download_evidence_file(
    evidence_id: str,
    request: Request,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Securely stream file content with tamper audit log recording."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent")

    evidence, file_bytes = await evidence_service.get_evidence_file(
        db=db,
        evidence_id=evidence_id,
        current_user=current_user,
        ip_address=client_ip,
        user_agent=user_agent
    )

    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type=evidence.mime_type,
        headers={
            "Content-Disposition": f'attachment; filename="{evidence.original_filename}"',
            "X-Content-SHA256": evidence.sha256_hash,
            "X-Integrity-Status": evidence.integrity_status
        }
    )


@router.post("/{evidence_id}/process", response_model=DocumentProcessingResultResponse)
async def process_evidence_document(
    evidence_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Trigger or re-execute document processing pipeline (PDF/DOCX/OCR/PII Redaction/Entities/Gemini)."""
    result = await document_processor.process_evidence(db=db, evidence_id=evidence_id)

    # Fetch associated cyber entities
    entities_q = select(CyberEntity).where(
        CyberEntity.source_id == evidence_id,
        CyberEntity.source_type == "DOCUMENT"
    )
    ent_res = await db.execute(entities_q)
    entities = ent_res.scalars().all()

    return DocumentProcessingResultResponse(
        id=result.id,
        evidence_id=result.evidence_id,
        complaint_id=result.complaint_id,
        case_id=result.case_id,
        processing_status=result.processing_status,
        detected_format=result.detected_format,
        page_count=result.page_count,
        character_count=result.character_count,
        ocr_applied=result.ocr_applied,
        ocr_engine=result.ocr_engine,
        extracted_text=result.extracted_text,
        redacted_text=result.redacted_text,
        gemini_summary=result.gemini_summary,
        gemini_analysis_json=result.gemini_analysis_json or {},
        gemini_status=result.gemini_status,
        error_message=result.error_message,
        processing_duration_ms=result.processing_duration_ms,
        created_at=result.created_at,
        updated_at=result.updated_at,
        extracted_entities=[
            {
                "id": e.id,
                "entity_type": e.entity_type,
                "raw_value": e.raw_value,
                "normalized_value": e.normalized_value,
                "confidence": e.confidence,
                "start_offset": e.start_offset,
                "end_offset": e.end_offset,
                "occurrence_count": e.occurrence_count,
                "metadata": e.metadata_json
            }
            for e in entities
        ]
    )


@router.get("/{evidence_id}/processing-result", response_model=DocumentProcessingResultResponse)
async def get_evidence_processing_result(
    evidence_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get extraction results, redacted text, Gemini contextual intelligence, and provenance entities for an evidence file."""
    q = select(DocumentProcessingResult).where(DocumentProcessingResult.evidence_id == evidence_id)
    res = await db.execute(q)
    result = res.scalars().first()

    if not result:
        # If not yet processed, trigger processing on-demand
        result = await document_processor.process_evidence(db=db, evidence_id=evidence_id)

    # Fetch associated cyber entities
    entities_q = select(CyberEntity).where(
        CyberEntity.source_id == evidence_id,
        CyberEntity.source_type == "DOCUMENT"
    )
    ent_res = await db.execute(entities_q)
    entities = ent_res.scalars().all()

    return DocumentProcessingResultResponse(
        id=result.id,
        evidence_id=result.evidence_id,
        complaint_id=result.complaint_id,
        case_id=result.case_id,
        processing_status=result.processing_status,
        detected_format=result.detected_format,
        page_count=result.page_count,
        character_count=result.character_count,
        ocr_applied=result.ocr_applied,
        ocr_engine=result.ocr_engine,
        extracted_text=result.extracted_text,
        redacted_text=result.redacted_text,
        gemini_summary=result.gemini_summary,
        gemini_analysis_json=result.gemini_analysis_json or {},
        gemini_status=result.gemini_status,
        error_message=result.error_message,
        processing_duration_ms=result.processing_duration_ms,
        created_at=result.created_at,
        updated_at=result.updated_at,
        extracted_entities=[
            {
                "id": e.id,
                "entity_type": e.entity_type,
                "raw_value": e.raw_value,
                "normalized_value": e.normalized_value,
                "confidence": e.confidence,
                "start_offset": e.start_offset,
                "end_offset": e.end_offset,
                "occurrence_count": e.occurrence_count,
                "metadata": e.metadata_json
            }
            for e in entities
        ]
    )
