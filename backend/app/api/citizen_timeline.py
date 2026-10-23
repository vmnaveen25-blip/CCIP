"""
Citizen Complaint Lifecycle Timeline Router
Provides authorized, citizen-safe tracking timelines for complaints and cases.
Strictly isolated from internal law enforcement intelligence and model metrics.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.core.permissions import get_current_user
from app.schemas.citizen_timeline import CitizenTimelineResponse
from app.services.citizen_timeline_service import citizen_timeline_service

router = APIRouter(prefix="/citizen", tags=["Citizen Status Timeline"])


@router.get("/complaints/{complaint_id}/timeline", response_model=CitizenTimelineResponse)
async def get_complaint_citizen_timeline(
    complaint_id: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve citizen-safe vertical lifecycle timeline for a complaint.
    Enforces ownership check: citizens can only view their own complaints.
    Eliminates all internal model confidences, investigator notes, and suspect intelligence.
    """
    return await citizen_timeline_service.get_citizen_timeline(
        db=db,
        complaint_id=complaint_id,
        current_user=current_user
    )
