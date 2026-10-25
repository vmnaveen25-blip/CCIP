from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.db.database import get_db
from app.models.threat_intelligence import ThreatFeed, CorrelatedGraphNode
from app.schemas.intelligence import (
    ThreatFeedResponse,
    ThreatFeedCreate,
    CorrelatedNodeResponse,
    CorrelatedNodeCreate
)
from app.schemas.auth import MessageResponse
from app.core.permissions import require_specialist
from app.models.user import User

router = APIRouter(prefix="/intelligence", tags=["Threat Intelligence"])


@router.get("/feeds", response_model=List[ThreatFeedResponse])
async def get_threat_feeds(
    current_user: User = Depends(require_specialist),
    db: AsyncSession = Depends(get_db)
):
    """Get active IOC indicators and threat feeds. Restricted to authorized specialists and admins."""
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


@router.post("/feeds", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_threat_feed(
    req: ThreatFeedCreate,
    current_user: User = Depends(require_specialist),
    db: AsyncSession = Depends(get_db)
):
    """Publish a verified IOC into the sovereign telemetry grid."""
    feed = ThreatFeed(
        ioc_value=req.iocValue,
        ioc_type=req.iocType,
        threat_name=req.threatName,
        threat_actor=req.threatActor,
        confidence_score=req.confidenceScore,
        severity=req.severity,
        detection_time="Just now",
        source_enclave=req.sourceEnclave,
        status=req.status
    )
    db.add(feed)
    await db.commit()
    return MessageResponse(message="IOC broadcasted to firewall and SIEM sensors.")


@router.get("/correlations", response_model=List[CorrelatedNodeResponse])
async def get_correlations(
    current_user: User = Depends(require_specialist),
    db: AsyncSession = Depends(get_db)
):
    """Get graph nodes and cross-case connection topology."""
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
