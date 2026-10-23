from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.models.case import Case, CaseStatusEnum
from app.models.complaint import Complaint
from app.models.threat_intelligence import ThreatFeed, CorrelatedGraphNode
from app.models.investigation import Investigation
from app.models.investigation_finding import InvestigationFinding
from app.models.user import User
from app.schemas.complaint import ComplaintFrontendSchema
from app.schemas.intelligence import ThreatFeedResponse, CorrelatedNodeResponse
from app.schemas.investigation import InvestigationFindingResponse
from app.core.permissions import require_specialist
from app.services.complaint_service import complaint_service
from app.ai.adapters.investigation_assistant import investigation_assistant

router = APIRouter(prefix="/specialist", tags=["Cybersecurity Specialist SOC"])


@router.get("/assigned-cases", response_model=List[ComplaintFrontendSchema])
async def get_specialist_assigned_cases(
    current_user: User = Depends(require_specialist),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve cases under active specialist investigation."""
    q = select(Complaint).options(
        selectinload(Complaint.events),
        selectinload(Complaint.evidence_files)
    ).order_by(desc(Complaint.created_at))
    res = await db.execute(q)
    complaints = res.scalars().all()
    return [complaint_service.map_to_frontend_schema(c) for c in complaints]


@router.get("/threat-intelligence", response_model=List[ThreatFeedResponse])
async def get_threat_intelligence(
    current_user: User = Depends(require_specialist),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve real-time IOC threat feeds from telemetry enclaves."""
    q = select(ThreatFeed).order_by(desc(ThreatFeed.created_at))
    res = await db.execute(q)
    feeds = res.scalars().all()
    return [
        ThreatFeedResponse(
            id=f.id,
            iocValue=f.ioc_value,
            iocType=f.ioc_type,
            threatName=f.threat_name,
            threatActor=f.threat_actor,
            confidenceScore=f.confidence_score,
            severity=f.severity,
            detectionTime=f.detection_time,
            sourceEnclave=f.source_enclave,
            associatedCasesCount=f.associated_cases_count,
            status=f.status
        )
        for f in feeds
    ]


@router.get("/correlation-nodes", response_model=List[CorrelatedNodeResponse])
async def get_correlation_nodes(
    current_user: User = Depends(require_specialist),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve cross-case correlation graph nodes (wallets, IPs, malware, victims)."""
    q = select(CorrelatedGraphNode)
    res = await db.execute(q)
    nodes = res.scalars().all()
    return [
        CorrelatedNodeResponse(
            id=n.id,
            label=n.label,
            type=n.node_type,
            riskScore=n.risk_score,
            connections=n.connections or []
        )
        for n in nodes
    ]


@router.get("/validation-queue")
async def get_validation_queue(
    current_user: User = Depends(require_specialist),
    db: AsyncSession = Depends(get_db)
):
    """List pending forensic findings awaiting specialist validation."""
    q = select(InvestigationFinding).where(InvestigationFinding.is_validated == False).options(selectinload(InvestigationFinding.author))
    res = await db.execute(q)
    findings = res.scalars().all()
    return [
        {
            "id": f.id,
            "title": f.title,
            "summary": f.summary,
            "findingType": f.finding_type,
            "confidenceScore": f.confidence_score,
            "isValidated": f.is_validated,
            "evidenceRefs": f.evidence_refs,
            "createdAt": f.created_at
        }
        for f in findings
    ]


from pydantic import BaseModel

class SpecialistTriageActionRequest(BaseModel):
    action: str  # "ACCEPT", "MODIFY", "REJECT"
    category: Optional[str] = None
    confidence: Optional[float] = None
    notes: Optional[str] = None
    model_version: Optional[str] = "DeBERTa-v3-Cyber-v1"


@router.post("/cases/{case_id}/triage-action")
async def apply_specialist_triage_action(
    case_id: str,
    req: SpecialistTriageActionRequest,
    current_user: User = Depends(require_specialist),
    db: AsyncSession = Depends(get_db)
):
    """
    Records specialist human-in-the-loop decision on AI triage prediction.
    AI results are strictly advisory; specialist explicitly accepts, modifies, or rejects.
    Creates an investigation finding, updates complaint categorization if accepted/modified,
    logs an audit event, and updates complaint status to TRIAGED or UNDER_REVIEW.
    """
    from app.services.audit_service import audit_service
    from app.models.investigation import Investigation
    from app.models.investigation_finding import InvestigationFinding
    from app.models.complaint_event import ComplaintEvent

    # Resolve case / complaint
    q = select(Case).where((Case.id == case_id) | (Case.case_number == case_id)).options(
        selectinload(Case.complaint),
        selectinload(Case.investigations)
    )
    res = await db.execute(q)
    c = res.scalars().first()
    if not c:
        # Fallback check directly in complaints table
        comp_q = select(Complaint).where((Complaint.id == case_id) | (Complaint.reference_number == case_id))
        comp_res = await db.execute(comp_q)
        complaint = comp_res.scalars().first()
        if not complaint:
            raise HTTPException(status_code=404, detail="Case or Complaint not found")
        # Ensure linked case exists
        case_res = await db.execute(select(Case).where(Case.complaint_id == complaint.id))
        c = case_res.scalars().first()
    else:
        complaint = c.complaint

    # Get or create active investigation dossier
    inv_q = select(Investigation).where(Investigation.case_id == c.id)
    inv_res = await db.execute(inv_q)
    investigation = inv_res.scalars().first()
    if not investigation:
        investigation = Investigation(
            case_id=c.id,
            lead_specialist_id=current_user.id,
            title=f"Forensic Analysis: {c.title}",
            status="ACTIVE",
            hypothesis=f"Human-in-the-loop specialist triage initiated by {current_user.full_name}."
        )
        db.add(investigation)
        await db.flush()

    # Record finding based on specialist advisory decision
    finding_summary = (
        f"AI Triage Decision: {req.action}. "
        f"Category: {req.category or complaint.category}. "
        f"Model: {req.model_version} (Confidence: {req.confidence or 0.0}). "
        f"Notes: {req.notes or 'No specialist notes provided.'}"
    )

    finding = InvestigationFinding(
        investigation_id=investigation.id,
        author_user_id=current_user.id,
        finding_type="AI_TRIAGE_EVALUATION",
        title=f"Specialist Triage Action: {req.action}",
        summary=finding_summary,
        confidence_score=req.confidence or 0.90,
        is_validated=(req.action in ["ACCEPT", "MODIFY"]),
        evidence_refs=[]
    )
    db.add(finding)

    # If specialist accepted or modified category, update complaint category
    if req.action in ["ACCEPT", "MODIFY"] and req.category:
        complaint.category = req.category

    # Update status to TRIAGED
    prev_status = complaint.status
    complaint.status = "TRIAGED"
    c.status = "TRIAGED"

    # Add timeline event to complaint
    timeline_ev = ComplaintEvent(
        complaint_id=complaint.id,
        title=f"Forensic Triage Completed ({req.action})",
        description=finding_summary,
        actor=f"Specialist ({current_user.full_name})",
        verified_hash=None,
        timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    )
    db.add(timeline_ev)

    await db.commit()

    # Log immutable audit trail
    await audit_service.log_event(
        db=db,
        actor=current_user.full_name,
        action="SPECIALIST_AI_TRIAGE_DECISION",
        resource=f"case:{c.id}",
        user_id=current_user.id,
        metadata_json={
            "action": req.action,
            "category": req.category,
            "previous_status": prev_status,
            "new_status": "TRIAGED",
            "model_version": req.model_version,
            "specialist": current_user.email
        }
    )

    return {
        "status": "SUCCESS",
        "case_id": c.id,
        "complaint_id": complaint.id,
        "action": req.action,
        "category": complaint.category,
        "new_status": "TRIAGED",
        "finding_id": finding.id
    }


@router.post("/ai-assistant")
async def specialist_ai_copilot(
    prompt: Dict[str, Any],
    current_user: User = Depends(require_specialist)
):
    """
    AI Investigation Assistant endpoint.
    Returns clean adapter response indicating model connection status.
    """
    user_prompt = prompt.get("prompt", "")
    case_context = prompt.get("context", {})
    return await investigation_assistant.generate_response(user_prompt, case_context)

