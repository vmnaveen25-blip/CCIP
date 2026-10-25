"""
Intelligence V2 API Router
Exposes endpoints for Case Similarity, Incident Urgency, Relation Extraction,
Cross-Case Correlation, Evidence Graph, Feedback Gate, and Learning Candidates.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.models.user import User
from app.models.case import Case
from app.models.case_correlation import CaseCorrelation
from app.models.cyber_entity_relation import CyberEntityRelation
from app.models.learning_candidate import LearningCandidate
from app.services.case_similarity_service import case_similarity_service
from app.services.incident_urgency_service import incident_urgency_service
from app.services.relation_extraction_service import relation_extraction_service
from app.services.cross_case_correlation_service import cross_case_correlation_service
from app.services.evidence_graph_service import evidence_graph_service
from app.services.feedback_gate_service import feedback_gate_service
from app.services.intelligence_orchestrator import intelligence_orchestrator
from app.core.permissions import get_current_user, require_staff, require_admin, require_aiml


router = APIRouter(prefix="", tags=["Multi-Model Intelligence"])


# Pydantic Schemas
class CorrelationReviewRequest(BaseModel):
    status: str = Field(..., description="CONFIRMED_RELEVANT, DISMISSED, NEEDS_MORE_EVIDENCE")
    notes: Optional[str] = None


class FeedbackGateEvaluateRequest(BaseModel):
    case_id: str
    target_model: str
    features: Dict[str, Any]
    source_finding_id: Optional[str] = None


class LearningCandidateReviewRequest(BaseModel):
    status: str = Field(..., description="APPROVED_FOR_DATASET, REJECTED, QUARANTINED")
    notes: Optional[str] = None


# Endpoints
@router.post("/cases/{case_id}/intelligence/refresh")
async def refresh_case_intelligence(
    case_id: str,
    force_refresh: bool = Query(False, description="Force re-evaluation of all intelligence stages"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Refreshes all intelligence stages for a case. Restricted to authorized investigators and staff."""
    res = await intelligence_orchestrator.refresh_case_intelligence(db, case_id, force_refresh=force_refresh)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res


@router.get("/cases/{case_id}/similar-cases")
async def get_similar_cases(
    case_id: str,
    limit: int = Query(5, ge=1, le=20),
    threshold: Optional[float] = Query(None, ge=0.0, le=1.0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Returns candidate similar cases using semantic embeddings."""
    res = await case_similarity_service.find_similar_cases_for_case(db, case_id, limit=limit, threshold=threshold)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res


@router.get("/cases/{case_id}/urgency")
async def get_case_urgency(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Evaluates narrative urgency for a case."""
    res = await incident_urgency_service.evaluate_case_urgency(db, case_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res


@router.get("/complaints/{complaint_id}/relations")
async def get_complaint_relations(
    complaint_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Returns cyber entity relations for a complaint."""
    from sqlalchemy import select
    stmt = select(CyberEntityRelation).where(CyberEntityRelation.complaint_id == complaint_id)
    rels = (await db.execute(stmt)).scalars().all()
    return [
        {
            "id": r.id,
            "source_entity_id": r.source_entity_id,
            "target_entity_id": r.target_entity_id,
            "relation_type": r.relation_type,
            "confidence": r.confidence,
            "source": r.source,
            "metadata": r.metadata_json
        }
        for r in rels
    ]


@router.post("/complaints/{complaint_id}/extract-relations")
async def extract_complaint_relations(
    complaint_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Triggers relation extraction between cyber entities for a complaint."""
    rels = await relation_extraction_service.extract_and_persist_relations_for_complaint(db, complaint_id)
    return {
        "complaint_id": complaint_id,
        "extracted_count": len(rels),
        "relations": [
            {
                "id": r.id,
                "source_entity_id": r.source_entity_id,
                "target_entity_id": r.target_entity_id,
                "relation_type": r.relation_type,
                "confidence": r.confidence
            }
            for r in rels
        ]
    }


@router.get("/cases/{case_id}/correlations")
async def get_case_correlations(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Returns cross-case correlation candidate records for a case with case-level access enforcement."""
    from sqlalchemy import select, or_
    from app.models.role import RoleEnum

    user_role = current_user.role.name if current_user.role else ""
    if user_role == RoleEnum.CYBERSECURITY_SPECIALIST.value:
        case_res = await db.execute(select(Case).where((Case.id == case_id) | (Case.case_number == case_id)))
        c = case_res.scalars().first()
        if c and c.assigned_specialist_id is not None and c.assigned_specialist_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Case is assigned to another specialist."
            )

    stmt = select(CaseCorrelation).where(
        or_(CaseCorrelation.case_a_id == case_id, CaseCorrelation.case_b_id == case_id)
    )
    corrs = (await db.execute(stmt)).scalars().all()
    return [
        {
            "id": c.id,
            "case_a_id": c.case_a_id,
            "case_b_id": c.case_b_id,
            "label": c.label,
            "confidence": c.confidence,
            "similarity_score": c.similarity_score,
            "shared_entity_count": c.shared_entity_count,
            "shared_entity_types": c.shared_entity_types_json,
            "status": c.status,
            "reviewed_by": c.reviewed_by,
            "metadata": c.metadata_json
        }
        for c in corrs
    ]


@router.post("/case-correlations/{correlation_id}/review")
async def review_case_correlation(
    correlation_id: str,
    payload: CorrelationReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Reviews and confirms/dismisses a candidate correlation. Restricted to authorized investigators."""
    from app.models.role import RoleEnum
    user_role = current_user.role.name if current_user.role else ""
    if user_role == RoleEnum.AI_ML_SYSTEM_LEAD.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI_ML_SYSTEM_LEAD is not authorized to review operational cross-case correlations."
        )

    corr = await cross_case_correlation_service.review_correlation(
        db=db,
        correlation_id=correlation_id,
        reviewer_id=current_user.id,
        status=payload.status,
        notes=payload.notes
    )
    if not corr:
        raise HTTPException(status_code=404, detail="Correlation not found.")
    return {"status": "SUCCESS", "id": corr.id, "review_status": corr.status}


@router.get("/cases/{case_id}/evidence-graph")
async def get_case_evidence_graph(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Returns full multi-hop evidence graph (nodes and edges) for a case with case-level access enforcement."""
    from app.models.role import RoleEnum
    user_role = current_user.role.name if current_user.role else ""
    if user_role == RoleEnum.CYBERSECURITY_SPECIALIST.value:
        case_res = await db.execute(select(Case).where((Case.id == case_id) | (Case.case_number == case_id)))
        c = case_res.scalars().first()
        if c and c.assigned_specialist_id is not None and c.assigned_specialist_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Case is assigned to another specialist."
            )

    res = await evidence_graph_service.build_or_refresh_graph_for_case(db, case_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res


@router.post("/ai/feedback-gate/evaluate")
async def evaluate_feedback_gate(
    payload: FeedbackGateEvaluateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Evaluates case feedback using deterministic hard gates and neural scoring."""
    candidate = await feedback_gate_service.evaluate_and_enqueue_candidate(
        db=db,
        case_id=payload.case_id,
        target_model=payload.target_model,
        feature_dict=payload.features,
        source_finding_id=payload.source_finding_id
    )
    return {
        "candidate_id": candidate.id,
        "decision": candidate.decision,
        "gate_source": candidate.gate_source,
        "reason": candidate.reason,
        "review_status": candidate.review_status,
        "confidence": candidate.confidence
    }


@router.get("/learning-candidates")
async def list_learning_candidates(
    status: Optional[str] = None,
    target_model: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_aiml)
):
    """Lists learning candidates for AI Lead / Admin controlled review."""
    candidates = await feedback_gate_service.list_candidates(db, status=status, target_model=target_model, limit=limit)
    return [
        {
            "id": c.id,
            "case_id": c.case_id,
            "target_model": c.target_model,
            "decision": c.decision,
            "gate_source": c.gate_source,
            "reason": c.reason,
            "review_status": c.review_status,
            "created_at": c.created_at.isoformat() if c.created_at else None
        }
        for c in candidates
    ]


@router.post("/learning-candidates/{candidate_id}/review")
async def review_learning_candidate(
    candidate_id: str,
    payload: LearningCandidateReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_aiml)
):
    """Reviews and approves/rejects a continual-learning candidate dataset entry."""
    cand = await feedback_gate_service.review_candidate(
        db=db,
        candidate_id=candidate_id,
        reviewer_id=current_user.id,
        new_status=payload.status,
        notes=payload.notes
    )
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    return {"status": "SUCCESS", "id": cand.id, "review_status": cand.review_status}
