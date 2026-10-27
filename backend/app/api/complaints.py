from typing import List, Optional
import datetime
from datetime import timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.schemas.complaint import (
    ComplaintCreateRequest,
    ComplaintUpdateRequest,
    ComplaintFrontendSchema,
    ComplaintPublicTrackingResponse,
    TimelineEventSchema
)
from app.schemas.auth import MessageResponse
from app.services.complaint_service import complaint_service
from app.core.permissions import get_current_user, get_optional_current_user, require_citizen
from app.models.user import User
from app.models.complaint import Complaint, ComplaintStatusEnum
from app.models.complaint_event import ComplaintEvent

router = APIRouter(prefix="/complaints", tags=["Complaints"])


@router.post("", response_model=ComplaintFrontendSchema, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    req: ComplaintCreateRequest,
    request: Request,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """File a new cybercrime complaint or save as draft."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent")

    complaint = await complaint_service.create_complaint(
        db=db,
        data=req,
        current_user=current_user,
        ip_address=client_ip,
        user_agent=user_agent
    )
    return complaint_service.map_to_frontend_schema(complaint)


@router.get("", response_model=List[ComplaintFrontendSchema])
async def list_complaints(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List complaints. Enforces strict citizen ownership isolation."""
    complaints = await complaint_service.get_all_complaints(
        db=db,
        current_user=current_user,
        category=category,
        status=status,
        search=search,
        skip=skip,
        limit=limit
    )
    return [complaint_service.map_to_frontend_schema(c) for c in complaints]


@router.get("/telemetry/timeseries")
async def get_complaint_telemetry(db: AsyncSession = Depends(get_db)):
    """Calculate real monthly submitted and resolved complaint counts from database."""
    res = await db.execute(select(Complaint))
    all_complaints = res.scalars().all()

    monthly_map = {}
    for c in all_complaints:
        if c.created_at:
            m_key = c.created_at.strftime("%Y-%m")
        else:
            m_key = "2026-09"

        if m_key not in monthly_map:
            monthly_map[m_key] = {"month": m_key, "submitted": 0, "resolved": 0}

        monthly_map[m_key]["submitted"] += 1
        if c.status in ["RESOLVED", "CLOSED"]:
            monthly_map[m_key]["resolved"] += 1

    sorted_data = [monthly_map[k] for k in sorted(monthly_map.keys())]
    if not sorted_data:
        sorted_data = [{"month": "2026-09", "submitted": 0, "resolved": 0}]

    return {
        "period": "monthly",
        "data": sorted_data
    }


@router.get("/stats/regions")
async def get_complaint_regions_stats(db: AsyncSession = Depends(get_db)):
    """Return actual complaint distribution by assigned unit or region."""
    res = await db.execute(select(Complaint))
    all_complaints = res.scalars().all()
    total = len(all_complaints)

    region_counts = {}
    for c in all_complaints:
        region = c.assigned_unit or "General Ingestion"
        region_counts[region] = region_counts.get(region, 0) + 1

    regions_list = []
    for r_name, count in region_counts.items():
        percentage = round((count / total * 100), 1) if total > 0 else 0.0
        regions_list.append({
            "name": r_name,
            "count": count,
            "percentage": percentage
        })

    return {"regions": regions_list}


@router.get("/stats/categories")
async def get_complaint_categories_stats(db: AsyncSession = Depends(get_db)):
    """Return actual complaint category distribution calculated from database."""
    res = await db.execute(select(Complaint))
    all_complaints = res.scalars().all()
    total = len(all_complaints)

    cat_counts = {}
    for c in all_complaints:
        cat = c.category or "Other"
        cat_counts[cat] = cat_counts.get(cat, 0) + 1

    categories_list = []
    for cat_name, count in cat_counts.items():
        percentage = round((count / total * 100), 1) if total > 0 else 0.0
        categories_list.append({
            "category": cat_name,
            "count": count,
            "percentage": percentage
        })

    return {"categories": categories_list}


@router.get("/track/{reference_number}", response_model=ComplaintPublicTrackingResponse)
async def track_complaint(
    reference_number: str,
    request: Request,
    token: Optional[str] = Query(None, description="Cryptographic tracking verification token"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Public/Citizen tracking endpoint. Returns strictly minimal milestone data without exposing sensitive complainant, financial, suspect, or evidence details."""
    complaint = await complaint_service.get_for_tracking(db, reference_number)
    verified = False

    # 1. Check tracking token in query param or header
    header_token = request.headers.get("x-tracking-token")
    active_token = token or header_token
    if active_token and getattr(complaint, "tracking_token", None):
        import hmac
        verified = hmac.compare_digest(str(active_token).strip(), str(complaint.tracking_token).strip())

    # 2. Check authenticated citizen owner or staff role
    if not verified and current_user:
        user_role = current_user.role.name if current_user.role else ""
        if user_role in ["CYBERSECURITY_SPECIALIST", "CYBERCRIME_POLICE", "ADMIN"]:
            verified = True
        elif complaint.citizen_id and current_user.id == complaint.citizen_id:
            verified = True
        elif complaint.citizen_email and current_user.email.lower() == complaint.citizen_email.lower():
            verified = True

    return complaint_service.map_to_public_tracking_schema(complaint, verified=verified)


@router.get("/{complaint_id}", response_model=ComplaintFrontendSchema)
async def get_complaint(
    complaint_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get single complaint by ID or Reference Number. Enforces authentication and citizen ownership isolation."""
    complaint = await complaint_service.get_by_id(db, complaint_id, current_user=current_user)
    return complaint_service.map_to_frontend_schema(complaint)


@router.patch("/{complaint_id}", response_model=ComplaintFrontendSchema)
async def update_complaint(
    complaint_id: str,
    req: ComplaintUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update complaint details or draft."""
    complaint = await complaint_service.get_by_id(db, complaint_id, current_user=current_user)
    
    if req.title:
        complaint.title = req.title
    if req.category:
        complaint.category = req.category
    if req.severity:
        complaint.severity = req.severity
    if req.status and req.status != complaint.status:
        from app.core.state_machine import validate_status_transition
        from app.models.case import Case
        user_role = current_user.role.name if current_user.role else ""
        validate_status_transition(complaint.status, req.status, user_role)
        prev_status = complaint.status
        complaint.status = req.status

        # Synchronize linked case if exists
        case_res = await db.execute(select(Case).where(Case.complaint_id == complaint.id))
        linked_c = case_res.scalars().first()
        if linked_c:
            linked_c.status = req.status

        # Add event to complaint timeline
        ev = ComplaintEvent(
            complaint_id=complaint.id,
            title=f"Status Updated: {req.status}",
            description=f"Complaint transitioned from {prev_status} to {req.status} by {current_user.full_name}.",
            actor=f"{user_role} ({current_user.full_name})",
            verified_hash=None,
            timestamp=datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        )
        db.add(ev)

        # Audit log event
        from app.services.audit_service import audit_service
        await audit_service.log_event(
            db=db,
            actor=current_user.full_name,
            action="COMPLAINT_STATUS_TRANSITION",
            resource=f"complaint:{complaint.id}",
            user_id=current_user.id,
            metadata_json={
                "complaint_ref": complaint.reference_number,
                "previous_status": prev_status,
                "new_status": req.status,
                "role": user_role
            }
        )

        # Notify citizen owner of status transition
        try:
            if complaint.citizen_id:
                from app.services.notification_service import notification_service
                await notification_service.create_notification(
                    db=db,
                    user_id=complaint.citizen_id,
                    title=f"CASE STATUS UPDATE: {req.status}",
                    message=f"Complaint #{complaint.reference_number} has transitioned to {req.status} by {current_user.full_name}.",
                    notification_type="STATUS_CHANGE",
                    severity="INFO",
                    related_complaint_id=complaint.id
                )
        except Exception:
            pass

    if req.financialLoss is not None:
        complaint.financial_loss = req.financialLoss
    if req.suspectInfo:
        complaint.suspect_info = req.suspectInfo.model_dump()
    if req.description:
        complaint.description = req.description
    if req.assignedUnit:
        complaint.assigned_unit = req.assignedUnit
    if req.assignedOfficer:
        complaint.assigned_officer = req.assignedOfficer

    await db.commit()
    await db.refresh(complaint)
    return complaint_service.map_to_frontend_schema(complaint)


@router.get("/{complaint_id}/timeline", response_model=List[TimelineEventSchema])
async def get_complaint_timeline(
    complaint_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get chronological status events and integrity seals for a complaint."""
    complaint = await complaint_service.get_by_id(db, complaint_id, current_user=current_user)
    return [
        TimelineEventSchema(
            timestamp=ev.timestamp,
            title=ev.title,
            description=ev.description,
            actor=ev.actor,
            verifiedHash=ev.verified_hash
        )
        for ev in complaint.events
    ]
