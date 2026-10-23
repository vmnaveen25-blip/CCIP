from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.models.user import User
from app.models.role import RoleEnum
from app.models.complaint import Complaint
from app.models.case import Case
from app.models.cyber_entity import CyberEntity
from app.schemas.entity import (
    CyberEntityResponse,
    EntityExtractionRequest,
    EntityExtractionResponse,
    EntityExtractionItem
)
from app.services.entity_service import entity_service
from app.core.permissions import get_current_user, require_staff, get_current_active_user


router = APIRouter(tags=["Cyber Entity Extraction (Cyber NER)"])


@router.post(
    "/ai/entities/extract",
    response_model=EntityExtractionResponse,
    summary="Direct Cyber Entity Extraction on raw narrative text"
)
async def extract_cyber_entities_from_text(
    req: EntityExtractionRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Analyzes raw text and returns structured cyber entities.
    Truthfully identifies operational runtime mode:
    - HYBRID_RULES_PLUS_TRANSFORMER when DeBERTa NER is online
    - RULES_ONLY_DEGRADED if transformer artifacts are absent or unavailable
    Accessible to all authenticated enclave clearance holders.
    """
    extracted = entity_service.extract_from_text(req.text)
    mode = entity_service.get_runtime_mode()
    is_trans_avail = entity_service.is_transformer_available()

    items = [
        EntityExtractionItem(
            entity_type=e.entity_type,
            raw_value=e.raw_value,
            normalized_value=e.normalized_value,
            confidence=e.confidence,
            start_offset=e.start_offset,
            end_offset=e.end_offset,
            occurrence_count=e.occurrence_count,
            source=e.source,
            deterministic_validated=e.deterministic_validated,
            metadata=e.metadata
        )
        for e in extracted
    ]
    return EntityExtractionResponse(
        status="SUCCESS",
        mode=mode,
        extractor="HYBRID_CYBER_NER_V1" if mode == "HYBRID_RULES_PLUS_TRANSFORMER" else "CYBER_ENTITY_EXTRACTOR_V1",
        transformer_available=is_trans_avail,
        model="ccip-cyber-ner-deberta-v3-base" if is_trans_avail else None,
        model_version="cyber-ner-bootstrap-v4.0.0" if is_trans_avail else None,
        count=len(items),
        entities=items
    )


@router.get(
    "/complaints/{complaint_id}/entities",
    response_model=List[CyberEntityResponse],
    summary="Retrieve extracted cyber entities for a complaint"
)
async def get_complaint_entities(
    complaint_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve persisted cyber entities for a complaint.
    Enforces strict RBAC:
    - Citizens may only inspect entities for complaints they personally filed.
    - AI Lead is strictly blocked from operational complaint data.
    - Specialist / Police / Admin staff have authorized access.
    """
    role_name = current_user.role.name if current_user.role else ""

    if role_name == RoleEnum.AI_ML_SYSTEM_LEAD.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI_ML_SYSTEM_LEAD clearance is restricted from inspecting operational incident records."
        )

    # Fetch complaint
    comp_q = select(Complaint).where(
        (Complaint.id == complaint_id) | (Complaint.reference_number == complaint_id)
    )
    res = await db.execute(comp_q)
    complaint = res.scalars().first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint record not found")

    # Citizen ownership check
    if role_name == RoleEnum.CITIZEN.value:
        if complaint.citizen_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Citizens are strictly isolated to entities extracted from their own submitted complaints."
            )

    entities = await entity_service.get_entities_by_complaint(db, complaint.id)
    return entities


@router.get(
    "/cases/{case_id}/entities",
    response_model=List[CyberEntityResponse],
    summary="Retrieve extracted cyber entities for a case docket"
)
async def get_case_entities(
    case_id: str,
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve persisted cyber entities associated with an active case docket.
    Restricted to authorized staff (Specialist, Police, Admin).
    """
    entities = await entity_service.get_entities_by_case(db, case_id)
    return entities


@router.post(
    "/complaints/{complaint_id}/extract-entities",
    response_model=List[CyberEntityResponse],
    summary="Trigger on-demand entity re-extraction for a complaint"
)
async def trigger_complaint_entity_extraction(
    complaint_id: str,
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """
    Re-analyzes complaint narrative and persists any newly identified cyber entities.
    Restricted to staff (Specialist, Police, Admin).
    """
    comp_q = select(Complaint).where(
        (Complaint.id == complaint_id) | (Complaint.reference_number == complaint_id)
    )
    res = await db.execute(comp_q)
    complaint = res.scalars().first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint record not found")

    entities = await entity_service.extract_and_persist_for_complaint(db, complaint)
    await db.commit()
    return entities
