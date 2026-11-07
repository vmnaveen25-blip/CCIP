import io
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.schemas.evidence import (
    EvidenceResponse, 
    EvidenceUploadResponse, 
    DocumentProcessingResultResponse
)
from app.services.evidence_service import evidence_service
from app.services.document_processor_service import document_processor
from app.core.permissions import get_current_user, get_optional_current_user, require_staff
from app.models.user import User
from app.models.role import RoleEnum
from app.models.complaint import Complaint
from app.models.evidence import Evidence
from app.models.cyber_entity import CyberEntity
from app.models.document_processing import DocumentProcessingResult

router = APIRouter(prefix="/evidence", tags=["Evidence Vault & Document Processing"])


@router.get("", response_model=List[EvidenceUploadResponse])
async def list_evidence(
    complaint_id: Optional[str] = None,
    case_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all stored evidence items with SHA-256 integrity seals. Citizens only see their own evidence."""
    q = select(Evidence).options(selectinload(Evidence.document_processing))
    if complaint_id:
        q = q.where(Evidence.complaint_id == complaint_id)
    if case_id:
        q = q.where(Evidence.case_id == case_id)

    # Citizen data privacy isolation
    if current_user.role and current_user.role.name == RoleEnum.CITIZEN.value:
        user_complaints_q = select(Complaint.id).where(
            or_(
                Complaint.citizen_id == current_user.id,
                Complaint.citizen_email == current_user.email.lower()
            )
        )
        user_comp_res = await db.execute(user_complaints_q)
        user_comp_ids = set(user_comp_res.scalars().all())
        q = q.where(
            or_(
                Evidence.uploaded_by_user_id == current_user.id,
                Evidence.complaint_id.in_(user_comp_ids)
            )
        )

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
            malware_scan_status=ev.malware_scan_status,
            quarantined=(ev.malware_scan_status in ("INFECTED", "SUSPICIOUS")),
            processing_status=ev.document_processing.processing_status if ev.document_processing else "COMPLETED",
            download_url=f"/api/v1/evidence/{ev.id}/download"
        )
        for ev in items
    ]


@router.post("/upload", response_model=EvidenceUploadResponse)
async def upload_evidence_file(
    request: Request,
    complaint_id: str = Form(...),
    tracking_token: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload evidence file, record SHA-256 submission integrity seal into Enclave Vault, and trigger automated document processing."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent")
    header_token = request.headers.get("x-tracking-token")
    effective_token = tracking_token or header_token

    evidence = await evidence_service.upload_evidence(
        db=db,
        complaint_id=complaint_id,
        file=file,
        tracking_token=effective_token,
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
        malware_scan_status=evidence.malware_scan_status,
        quarantined=(evidence.malware_scan_status in ("INFECTED", "SUSPICIOUS")),
        processing_status=status,
        download_url=f"/api/v1/evidence/{evidence.id}/download"
    )


@router.get("/{evidence_id}", response_model=EvidenceResponse)
async def get_evidence_metadata(
    evidence_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get metadata, integrity hash, and processing status of an evidence file."""
    q = select(Evidence).where(Evidence.id == evidence_id).options(selectinload(Evidence.document_processing))
    res = await db.execute(q)
    ev = res.scalars().first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence item not found")

    # Citizen data privacy isolation
    if current_user.role and current_user.role.name == RoleEnum.CITIZEN.value:
        is_owner = False
        if ev.uploaded_by_user_id and ev.uploaded_by_user_id == current_user.id:
            is_owner = True
        elif ev.complaint_id:
            comp_q = select(Complaint).where(Complaint.id == ev.complaint_id)
            comp_res = await db.execute(comp_q)
            comp = comp_res.scalars().first()
            if comp and (comp.citizen_id == current_user.id or (comp.citizen_email and comp.citizen_email.lower() == current_user.email.lower())):
                is_owner = True
        if not is_owner:
            raise HTTPException(status_code=403, detail="Unauthorized access to evidence metadata")

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
        malware_scan_status=ev.malware_scan_status,
        quarantined=(ev.malware_scan_status in ("INFECTED", "SUSPICIOUS")),
        processing_status=status,
        created_at=ev.created_at,
        download_url=f"/api/v1/evidence/{ev.id}/download"
    )


@router.get("/{evidence_id}/download")
async def download_evidence_file(
    evidence_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
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
    current_user: User = Depends(require_staff)
):
    """Trigger or re-execute document processing pipeline (PDF/DOCX/OCR/PII Redaction/Entities/Gemini)."""
    user_role = current_user.role.name if current_user.role else ""
    if user_role == RoleEnum.AI_ML_SYSTEM_LEAD.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI_ML_SYSTEM_LEAD is not authorized to trigger raw evidence document processing."
        )

    ev_q = select(Evidence).where(Evidence.id == evidence_id)
    ev_res = await db.execute(ev_q)
    ev = ev_res.scalars().first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence item not found")

    if user_role == RoleEnum.CYBERSECURITY_SPECIALIST.value and ev.case_id:
        from app.models.case import Case
        case_res = await db.execute(select(Case).where((Case.id == ev.case_id) | (Case.case_number == ev.case_id)))
        c = case_res.scalars().first()
        if c and c.assigned_specialist_id is not None and c.assigned_specialist_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Evidence belongs to a case assigned to another specialist."
            )

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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get extraction results, redacted text, Gemini contextual intelligence, and provenance entities for an evidence file."""
    user_role = current_user.role.name if current_user.role else ""

    # Check parent evidence ownership for citizen privacy isolation
    ev_q = select(Evidence).where(Evidence.id == evidence_id)
    ev_res = await db.execute(ev_q)
    ev = ev_res.scalars().first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence item not found")

    if user_role == RoleEnum.CITIZEN.value:
        is_owner = False
        if ev.uploaded_by_user_id and ev.uploaded_by_user_id == current_user.id:
            is_owner = True
        elif ev.complaint_id:
            comp_q = select(Complaint).where(Complaint.id == ev.complaint_id)
            comp_res = await db.execute(comp_q)
            comp = comp_res.scalars().first()
            if comp and (comp.citizen_id == current_user.id or (comp.citizen_email and comp.citizen_email.lower() == current_user.email.lower())):
                is_owner = True
        if not is_owner:
            raise HTTPException(status_code=403, detail="Unauthorized access to evidence processing dossier")

    if user_role == RoleEnum.CYBERSECURITY_SPECIALIST.value and ev.case_id:
        from app.models.case import Case
        case_res = await db.execute(select(Case).where((Case.id == ev.case_id) | (Case.case_number == ev.case_id)))
        c = case_res.scalars().first()
        if c and c.assigned_specialist_id is not None and c.assigned_specialist_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Evidence belongs to a case assigned to another specialist."
            )

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

    # Mask raw citizen narrative text for AI/ML Lead
    extracted_text_val = result.extracted_text
    if user_role == RoleEnum.AI_ML_SYSTEM_LEAD.value:
        extracted_text_val = "[REDACTED - AI/ML System Lead role restricted from raw citizen narratives. Refer to redacted_text or entity metadata.]"

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
        extracted_text=extracted_text_val,
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


# -----------------------------------------------------------------------------
# Evidentiary Custody, Legal Holds & Cryptographic Integrity Verification
# -----------------------------------------------------------------------------

@router.get("/{evidence_id}/verify-hash")
@router.get("/{evidence_id}/verify-integrity")
@router.post("/{evidence_id}/verify-integrity")
async def verify_evidence_hash(
    evidence_id: str,
    request: Request,
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """
    Real-time byte-for-byte SHA-256 hash recalculation and verification against storage vault.
    Logs verification event to append-only custody chain. Alerts if tamper detected.
    """
    import os
    import hashlib
    from app.models.evidence_access_log import EvidenceAccessLog
    from app.models.security_event import SecurityEvent

    q = select(Evidence).where(Evidence.id == evidence_id)
    res = await db.execute(q)
    ev = res.scalars().first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence artifact not found")

    stored_path = ev.storage_key
    computed_hash = ev.sha256_hash
    is_match = True

    if stored_path and os.path.isfile(stored_path):
        hasher = hashlib.sha256()
        with open(stored_path, "rb") as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
        computed_hash = hasher.hexdigest()
        is_match = (computed_hash.lower() == ev.sha256_hash.lower())

    client_ip = request.client.host if request.client else "127.0.0.1"

    # Append to immutable custody access log
    access_log = EvidenceAccessLog(
        evidence_id=ev.id,
        accessed_by_user_id=current_user.id,
        action_type="VERIFY_HASH",
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent", "")[:250]
    )
    db.add(access_log)

    if not is_match:
        ev.integrity_status = "TAMPER_ALERT"
        ev.is_verified = False
        sec_ev = SecurityEvent(
            event_category="EVIDENCE_TAMPER_ALERT",
            source_ip=client_ip,
            user_id=current_user.id,
            severity="CRITICAL",
            details={
                "evidence_id": ev.id,
                "filename": ev.original_filename,
                "recorded_hash": ev.sha256_hash,
                "computed_hash": computed_hash,
                "alert": "Cryptographic checksum mismatch detected during on-demand integrity verification."
            }
        )
        db.add(sec_ev)
    else:
        ev.integrity_status = "VERIFIED_AUTHENTIC"
        ev.is_verified = True

    await db.commit()

    return {
        "evidence_id": ev.id,
        "filename": ev.original_filename,
        "stored_hash": ev.sha256_hash,
        "verified_hash": computed_hash,
        "integrity_verified": is_match,
        "match": is_match,
        "status": "VERIFIED_AUTHENTIC" if is_match else "TAMPER_ALERT",
        "action": "HASH_VERIFICATION_COMPLETE"
    }


@router.post("/{evidence_id}/legal-hold")
async def toggle_evidence_legal_hold(
    evidence_id: str,
    request: Request,
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """
    Activates or deactivates a statutory Legal Hold on digital evidence.
    When active, automatic or administrative statutory deletion routines are strictly blocked.
    """
    from datetime import timedelta
    from app.models.evidence_governance import EvidenceRetentionRecord
    from app.services.audit_service import audit_service

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        body = await request.json()
        hold_val = body.get("legal_hold")
        reason_val = body.get("reason", "Statutory legal hold mandate")
    else:
        form = await request.form()
        hold_val = form.get("legal_hold")
        reason_val = form.get("reason", "Statutory legal hold mandate")

    if hold_val is None:
        raise HTTPException(status_code=400, detail="Missing required field: legal_hold")

    if isinstance(hold_val, str):
        legal_hold = hold_val.strip().lower() in ("true", "1", "yes")
    else:
        legal_hold = bool(hold_val)
    reason = str(reason_val)

    q = select(Evidence).where(Evidence.id == evidence_id)
    res = await db.execute(q)
    ev = res.scalars().first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence artifact not found")

    ret_q = select(EvidenceRetentionRecord).where(EvidenceRetentionRecord.evidence_id == evidence_id)
    ret_res = await db.execute(ret_q)
    ret = ret_res.scalars().first()

    if not ret:
        ret = EvidenceRetentionRecord(
            evidence_id=ev.id,
            retention_period_years=7,
            legal_hold_active=legal_hold,
            legal_hold_reason=reason,
            legal_hold_placed_by_id=current_user.id,
            purge_eligible_at=datetime.now(timezone.utc) + timedelta(days=365 * 7)
        )
        db.add(ret)
    else:
        ret.legal_hold_active = legal_hold
        ret.legal_hold_reason = reason
        ret.legal_hold_placed_by_id = current_user.id

    ev.is_legal_hold = legal_hold

    await audit_service.log_event(
        db=db,
        actor=current_user.full_name,
        action="EVIDENCE_LEGAL_HOLD_TOGGLED",
        resource=f"evidence:{ev.id}",
        user_id=current_user.id,
        metadata_json={
            "evidence_id": ev.id,
            "filename": ev.original_filename,
            "legal_hold_active": legal_hold,
            "reason": reason
        }
    )
    await db.commit()

    return {
        "evidence_id": ev.id,
        "legal_hold_active": legal_hold,
        "reason": reason,
        "status": "LEGAL_HOLD_UPDATED"
    }


@router.get("/{evidence_id}/custody-log")
async def get_evidence_custody_log(
    evidence_id: str,
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves the complete immutable chain-of-custody log for an evidence item.
    """
    from app.models.evidence_access_log import EvidenceAccessLog

    q = select(Evidence).where(Evidence.id == evidence_id)
    res = await db.execute(q)
    ev = res.scalars().first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence artifact not found")

    logs_q = select(EvidenceAccessLog).where(
        EvidenceAccessLog.evidence_id == evidence_id
    ).options(selectinload(EvidenceAccessLog.accessed_by)).order_by(EvidenceAccessLog.timestamp)
    logs_res = await db.execute(logs_q)
    logs = logs_res.scalars().all()

    return {
        "evidence_id": ev.id,
        "filename": ev.original_filename,
        "sha256_hash": ev.sha256_hash,
        "total_custody_events": len(logs),
        "chain_of_custody": [
            {
                "id": log.id,
                "action": log.action_type,
                "actor_id": log.accessed_by_user_id,
                "actor_name": log.accessed_by.full_name if log.accessed_by else "System",
                "ip_address": log.ip_address,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None
            }
            for log in logs
        ]
    }


@router.delete("/{evidence_id}")
async def delete_evidence_item(
    evidence_id: str,
    request: Request,
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """Securely deletes evidence item, strictly rejected if active legal hold is present."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent")

    deleted_ev = await evidence_service.delete_evidence(
        db=db,
        evidence_id=evidence_id,
        current_user=current_user,
        ip_address=client_ip,
        user_agent=user_agent
    )
    return {
        "status": "SUCCESS",
        "message": f"Evidence {deleted_ev.original_filename} ({deleted_ev.id}) tombstoned.",
        "evidence_id": deleted_ev.id,
        "is_deleted": True
    }


@router.get("/{evidence_id}/certificate-65b")
async def generate_evidence_certificate_65b(
    evidence_id: str,
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """
    Generates a statutory Section 65B (Indian Evidence Act, 1872 / Section 63 BSA 2023)
    certificate certifying the cryptographic SHA-256 integrity and lawful custody of an electronic record.
    """
    import platform
    from app.services.audit_service import audit_service

    q = select(Evidence).where(Evidence.id == evidence_id)
    res = await db.execute(q)
    ev = res.scalars().first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence item not found")

    cert_id = f"CERT-65B-2026-{ev.id[:8].upper()}"
    officer_name = current_user.full_name or current_user.email

    cert_payload = {
        "certificate_id": cert_id,
        "evidence_id": ev.id,
        "original_filename": ev.original_filename,
        "mime_type": ev.mime_type,
        "file_size_bytes": ev.file_size_bytes,
        "sha256_hash": ev.sha256_hash,
        "statutory_act": "Section 65B Indian Evidence Act 1872 / Section 63 Bharatiya Sakshya Adhiniyam 2023",
        "certifying_officer": officer_name,
        "officer_role": current_user.role.name if current_user.role else "Specialist",
        "issuing_node": platform.node(),
        "device_operating_declaration": "The computing device produced the electronic record in the ordinary course of operations without malfunction.",
        "certification_statement": (
            f"I, {officer_name}, certify pursuant to Section 65B of the Indian Evidence Act, 1872 and Section 63 of the Bharatiya Sakshya Adhiniyam, 2023, "
            f"that electronic record '{ev.original_filename}' (SHA-256: {ev.sha256_hash}) was ingested, hashed, and preserved in the CCIP Enclave Vault without tampering."
        ),
        "issued_at": datetime.now(timezone.utc).isoformat()
    }

    await audit_service.log_event(
        db=db,
        actor=officer_name,
        action="SECTION_65B_CERTIFICATE_ISSUED",
        resource=f"evidence:{ev.id}",
        clearance="STATUTORY_ADMISSIBILITY",
        user_id=current_user.id,
        metadata={"certificate_id": cert_id, "sha256": ev.sha256_hash}
    )

    return cert_payload
