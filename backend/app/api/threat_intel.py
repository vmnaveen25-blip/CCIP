"""
Threat Intelligence API Router
Exposes endpoints for Feed Sources, Indicators, Alerts, 3D Graph, and Case Enrichment.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, func
from pydantic import BaseModel, Field

from app.db.database import get_db
from app.models.user import User
from app.models.threat_intelligence_v2 import (
    ThreatIntelligenceSource,
    ThreatFeedSync,
    ThreatIndicator,
    ThreatIndicatorReviewAudit,
    ThreatCampaign,
    ThreatAlert,
    IntelligenceRelationship
)
from app.core.permissions import get_current_user, require_staff, require_admin, require_specialist
from app.services.threat_intel_service import threat_intel_service
from app.services.investigation_enrichment_service import investigation_enrichment_service
from app.services.threat_ioc_service import ioc_normalization_service
from app.services.threat_scoring_engine import threat_scoring_engine, ThreatFindingState


router = APIRouter(prefix="/threat-intel", tags=["Threat Intelligence & Analysis"])


# Pydantic Schemas
class SourceCreateRequest(BaseModel):
    name: str = Field(..., max_length=200)
    provider_code: str = Field(..., description="ALIENVAULT_OTX, URLHAUS, ABUSEIPDB, MISP, STIX_TAXII, VIRUSTOTAL, CUSTOM")
    feed_type: str = Field(..., description="STIX_2, TAXII_2, MISP_REST, REST_API, CSV_FEED, JSON_FEED")
    api_endpoint: str = Field(..., max_length=500)
    auth_method: str = Field("NONE", description="NONE, API_KEY, BEARER_TOKEN, BASIC_AUTH")
    credential_reference: Optional[str] = Field(None, description="Environment variable holding secret; never raw key")
    license_restrictions: str = "Authorized intelligence use only"
    source_reliability: float = Field(0.85, ge=0.0, le=1.0)
    sync_interval_minutes: int = Field(60, ge=5, le=1440)
    is_enabled: bool = True


class SourceUpdateRequest(BaseModel):
    name: Optional[str] = None
    api_endpoint: Optional[str] = None
    is_enabled: Optional[bool] = None
    sync_interval_minutes: Optional[int] = None
    source_reliability: Optional[float] = None


class FindingStateUpdateRequest(BaseModel):
    finding_state: str = Field(..., description="HUMAN_REVIEWED, CONFIRMED, FALSE_POSITIVE, EXPIRED")
    notes: Optional[str] = None


class AlertReviewRequest(BaseModel):
    review_status: str = Field(..., description="INVESTIGATING, RESOLVED, FALSE_POSITIVE, SUPPRESSED")
    notes: Optional[str] = None


class ManualIndicatorCreateRequest(BaseModel):
    indicator_value: str
    indicator_type: Optional[str] = None
    threat_category: str = "MALWARE"
    confidence_score: float = Field(80.0, ge=0.0, le=100.0)
    reputation_verdict: str = "SUSPICIOUS"
    associated_threat_actor: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


# --- Endpoints ---

@router.get("/sources")
async def list_sources(
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """Lists configured threat intelligence feeds and their operational health."""
    await threat_intel_service.seed_default_sources(db)
    q = select(ThreatIntelligenceSource).order_by(desc(ThreatIntelligenceSource.created_at))
    res = await db.execute(q)
    sources = res.scalars().all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "provider_code": s.provider_code,
            "feed_type": s.feed_type,
            "api_endpoint": s.api_endpoint,
            "auth_method": s.auth_method,
            "credential_reference": s.credential_reference,
            "license_restrictions": s.license_restrictions,
            "is_enabled": s.is_enabled,
            "source_reliability": s.source_reliability,
            "sync_interval_minutes": s.sync_interval_minutes,
            "last_sync_at": s.last_sync_at.isoformat() if s.last_sync_at else None,
            "last_sync_status": s.last_sync_status,
            "last_failure_reason": s.last_failure_reason,
            "consecutive_failures": s.consecutive_failures,
            "indicators_count": s.indicators_count
        }
        for s in sources
    ]


@router.post("/sources", status_code=status.HTTP_201_CREATED)
async def create_source(
    req: SourceCreateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Registers a new threat intelligence source. Restricted to Administrator."""
    src = ThreatIntelligenceSource(
        name=req.name,
        provider_code=req.provider_code.upper(),
        feed_type=req.feed_type.upper(),
        api_endpoint=req.api_endpoint,
        auth_method=req.auth_method.upper(),
        credential_reference=req.credential_reference,
        license_restrictions=req.license_restrictions,
        source_reliability=req.source_reliability,
        sync_interval_minutes=req.sync_interval_minutes,
        is_enabled=req.is_enabled
    )
    db.add(src)
    await db.commit()
    await db.refresh(src)
    return {"message": "Threat intelligence source registered successfully.", "source_id": src.id}


@router.patch("/sources/{source_id}")
async def update_source(
    source_id: str,
    req: SourceUpdateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Updates threat intelligence source configuration. Restricted to Administrator."""
    q = select(ThreatIntelligenceSource).where(ThreatIntelligenceSource.id == source_id)
    res = await db.execute(q)
    src = res.scalars().first()
    if not src:
        raise HTTPException(status_code=404, detail="Source not found.")

    if req.name is not None:
        src.name = req.name
    if req.api_endpoint is not None:
        src.api_endpoint = req.api_endpoint
    if req.is_enabled is not None:
        src.is_enabled = req.is_enabled
    if req.sync_interval_minutes is not None:
        src.sync_interval_minutes = req.sync_interval_minutes
    if req.source_reliability is not None:
        src.source_reliability = req.source_reliability

    await db.commit()
    return {"message": "Source updated successfully.", "source_id": src.id}


@router.post("/sources/{source_id}/sync")
async def trigger_source_sync(
    source_id: str,
    force: bool = Query(False, description="Bypass the 120-second minimum sync cooldown window"),
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """Triggers manual ingestion and normalization cycle for a feed with rate limit and concurrency safeguards."""
    sync_rec = await threat_intel_service.sync_source(db, source_id, sync_type="MANUAL", force=force)
    return {
        "sync_id": sync_rec.id,
        "status": sync_rec.status,
        "imported": sync_rec.indicators_imported,
        "updated": sync_rec.indicators_updated,
        "error": sync_rec.error_message
    }


@router.get("/indicators")
async def list_indicators(
    ioc_type: Optional[str] = Query(None),
    finding_state: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """Searches and filters normalized indicators."""
    q = select(ThreatIndicator).order_by(desc(ThreatIndicator.composite_threat_score))
    if ioc_type:
        q = q.where(ThreatIndicator.indicator_type == ioc_type.upper())
    if finding_state:
        q = q.where(ThreatIndicator.finding_state == finding_state.upper())
    if search:
        term = f"%{search.strip().lower()}%"
        q = q.where(
            or_(
                ThreatIndicator.normalized_value.like(term),
                ThreatIndicator.defanged_value.like(term),
                ThreatIndicator.associated_threat_actor.like(term)
            )
        )

    q = q.offset(skip).limit(limit)
    res = await db.execute(q)
    indicators = res.scalars().all()
    return [
        {
            "id": ind.id,
            "indicator_type": ind.indicator_type,
            "defanged_value": ind.defanged_value,
            "original_value": ind.original_value,
            "normalized_value": ind.normalized_value,
            "threat_category": ind.threat_category,
            "confidence_score": ind.confidence_score,
            "reputation_verdict": ind.reputation_verdict,
            "composite_threat_score": ind.composite_threat_score,
            "score_breakdown": ind.score_breakdown_json,
            "finding_state": ind.finding_state,
            "source_name": ind.source_name,
            "associated_threat_actor": ind.associated_threat_actor,
            "first_seen": ind.first_seen.isoformat(),
            "last_seen": ind.last_seen.isoformat()
        }
        for ind in indicators
    ]


@router.post("/indicators", status_code=status.HTTP_201_CREATED)
async def create_manual_indicator(
    req: ManualIndicatorCreateRequest,
    current_user: User = Depends(require_specialist),
    db: AsyncSession = Depends(get_db)
):
    """Manually registers an indicator with canonical normalization and explainable scoring."""
    norm = ioc_normalization_service.normalize_ioc(req.indicator_value, req.indicator_type)
    if not norm["normalized_value"]:
        raise HTTPException(status_code=400, detail="Invalid indicator format.")

    score_res = threat_scoring_engine.calculate_composite_score(
        source_reliability=0.95,  # Specialist submission
        reported_confidence=req.confidence_score,
        reputation_verdict=req.reputation_verdict,
        last_seen=None,
        independent_sources_count=1,
        is_human_reviewed=True
    )

    ind = ThreatIndicator(
        indicator_type=norm["ioc_type"],
        original_value=norm["original_value"],
        normalized_value=norm["normalized_value"],
        defanged_value=norm["defanged_value"],
        source_name=f"Manual Submission ({current_user.email})",
        threat_category=req.threat_category.upper(),
        confidence_score=req.confidence_score,
        reputation_verdict=req.reputation_verdict.upper(),
        composite_threat_score=score_res["composite_score"],
        score_breakdown_json=score_res["breakdown"],
        finding_state=score_res["finding_state"],
        associated_threat_actor=req.associated_threat_actor,
        tags_json=req.tags
    )
    db.add(ind)
    await db.commit()
    await db.refresh(ind)
    return {"message": "Indicator created successfully.", "indicator_id": ind.id, "defanged_value": ind.defanged_value}


@router.patch("/indicators/{indicator_id}/finding-state")
async def update_indicator_finding_state(
    indicator_id: str,
    req: FindingStateUpdateRequest,
    current_user: User = Depends(require_specialist),
    db: AsyncSession = Depends(get_db)
):
    """Updates finding state (e.g. FALSE_POSITIVE, CONFIRMED) with audit trail and recalculates scores while preserving historical intelligence."""
    q = select(ThreatIndicator).where(ThreatIndicator.id == indicator_id)
    res = await db.execute(q)
    ind = res.scalars().first()
    if not ind:
        raise HTTPException(status_code=404, detail="Indicator not found.")

    state = req.finding_state.upper()
    if state not in ThreatFindingState.ALL_STATES:
        raise HTTPException(status_code=400, detail=f"Invalid state '{state}'. Must be one of {ThreatFindingState.ALL_STATES}")

    previous_state = ind.finding_state
    previous_score = ind.composite_threat_score
    previous_breakdown = ind.score_breakdown_json or {}

    ind.finding_state = state
    is_false_pos = (state == ThreatFindingState.FALSE_POSITIVE)
    is_confirmed = (state in (ThreatFindingState.CONFIRMED, ThreatFindingState.HUMAN_REVIEWED))

    # Recalculate score with history preservation
    new_score = threat_scoring_engine.calculate_composite_score(
        source_reliability=0.85,
        reported_confidence=ind.confidence_score,
        reputation_verdict=ind.reputation_verdict,
        last_seen=ind.last_seen,
        independent_sources_count=1,
        is_human_reviewed=is_confirmed,
        is_false_positive=is_false_pos,
        preserved_original_score=previous_score,
        preserved_original_breakdown=previous_breakdown
    )
    ind.composite_threat_score = new_score["composite_score"]
    ind.score_breakdown_json = new_score["breakdown"]

    # Record historical score entry in indicator json list
    history_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "previous_state": previous_state,
        "new_state": state,
        "previous_score": previous_score,
        "new_score": new_score["composite_score"],
        "previous_breakdown": previous_breakdown,
        "new_breakdown": new_score["breakdown"],
        "override_reason": req.notes or "Investigator finding state review",
        "reviewer_id": current_user.id,
        "reviewer_email": current_user.email
    }
    history_list = list(ind.historical_scores_json or [])
    history_list.append(history_entry)
    ind.historical_scores_json = history_list

    # Record immutable relational audit entry
    audit_record = ThreatIndicatorReviewAudit(
        indicator_id=ind.id,
        previous_state=previous_state,
        new_state=state,
        previous_score=previous_score,
        new_score=new_score["composite_score"],
        previous_breakdown_json=previous_breakdown,
        new_breakdown_json=new_score["breakdown"],
        override_reason=req.notes or "Investigator finding state review",
        reviewed_by_user_id=current_user.id,
        reviewer_email=current_user.email,
        reviewed_at=datetime.now(timezone.utc)
    )
    db.add(audit_record)

    await db.commit()
    await db.refresh(ind)
    return {
        "message": f"Indicator finding state updated to {state}.",
        "indicator_id": ind.id,
        "new_composite_score": ind.composite_threat_score,
        "historical_records_count": len(ind.historical_scores_json)
    }


@router.get("/indicators/{indicator_id}/history")
async def get_indicator_review_history(
    indicator_id: str,
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves the complete explainable scoring audit trail and investigator review history for an indicator."""
    q = select(ThreatIndicator).where(ThreatIndicator.id == indicator_id)
    res = await db.execute(q)
    ind = res.scalars().first()
    if not ind:
        raise HTTPException(status_code=404, detail="Indicator not found.")

    audit_q = select(ThreatIndicatorReviewAudit).where(
        ThreatIndicatorReviewAudit.indicator_id == indicator_id
    ).order_by(desc(ThreatIndicatorReviewAudit.reviewed_at))
    audit_res = await db.execute(audit_q)
    audits = audit_res.scalars().all()

    return {
        "indicator_id": ind.id,
        "normalized_value": ind.normalized_value,
        "defanged_value": ind.defanged_value,
        "current_state": ind.finding_state,
        "current_score": ind.composite_threat_score,
        "current_breakdown": ind.score_breakdown_json,
        "historical_scores": ind.historical_scores_json or [],
        "audits": [
            {
                "id": a.id,
                "previous_state": a.previous_state,
                "new_state": a.new_state,
                "previous_score": a.previous_score,
                "new_score": a.new_score,
                "override_reason": a.override_reason,
                "reviewer_email": a.reviewer_email,
                "reviewed_at": a.reviewed_at.isoformat()
            }
            for a in audits
        ]
    }


@router.get("/alerts")
async def list_alerts(
    severity: Optional[str] = Query(None),
    review_status: Optional[str] = Query(None),
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """Lists threat intelligence alerts with deduplication status."""
    q = select(ThreatAlert).order_by(desc(ThreatAlert.detection_time))
    if severity:
        q = q.where(ThreatAlert.severity == severity.upper())
    if review_status:
        q = q.where(ThreatAlert.review_status == review_status.upper())

    res = await db.execute(q)
    alerts = res.scalars().all()
    return [
        {
            "id": a.id,
            "category": a.alert_category,
            "severity": a.severity,
            "indicator_type": a.indicator_type,
            "indicator_value": a.indicator_value,
            "related_case_id": a.related_case_id,
            "source_name": a.source_name,
            "confidence": a.confidence,
            "reason": a.reason,
            "recommended_action": a.recommended_action,
            "detection_time": a.detection_time.isoformat(),
            "review_status": a.review_status
        }
        for a in alerts
    ]


@router.patch("/alerts/{alert_id}/review")
async def review_alert(
    alert_id: str,
    req: AlertReviewRequest,
    current_user: User = Depends(require_specialist),
    db: AsyncSession = Depends(get_db)
):
    """Reviews and resolves a threat alert."""
    q = select(ThreatAlert).where(ThreatAlert.id == alert_id)
    res = await db.execute(q)
    alert = res.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")

    alert.review_status = req.review_status.upper()
    alert.reviewed_by = current_user.email
    alert.reviewed_at = func.now()
    await db.commit()
    return {"message": "Alert status updated successfully.", "alert_id": alert.id}


@router.get("/graph")
async def get_intelligence_graph(
    case_id: Optional[str] = Query(None),
    limit: int = Query(150, ge=10, le=300, description="Maximum relationships returned to prevent browser DOM lag"),
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """Returns 3D entity relationship graph topology with pagination and node volume guards."""
    return await investigation_enrichment_service.get_3d_graph_topology(db, case_id=case_id, user=current_user, limit=limit)


@router.post("/cases/{case_id}/enrich")
async def enrich_case_intelligence(
    case_id: str,
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """Executes automated enrichment for an authorized case against the threat database."""
    return await investigation_enrichment_service.enrich_case(db, case_id=case_id, user=current_user)

