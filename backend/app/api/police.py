from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.models.case import Case, CaseStatusEnum, CasePriorityEnum
from app.models.complaint import Complaint
from app.models.user import User
from app.models.role import RoleEnum
from app.models.department import Department
from app.schemas.case import CaseResponse, CaseAssignmentRequest
from app.schemas.complaint import ComplaintFrontendSchema
from app.schemas.auth import MessageResponse
from app.core.permissions import require_police
from app.services.complaint_service import complaint_service

router = APIRouter(prefix="/police", tags=["Cybercrime Police Command"])


@router.get("/dashboard-stats")
async def get_police_dashboard_stats(
    current_user: User = Depends(require_police),
    db: AsyncSession = Depends(get_db)
):
    """Aggregate statistics for Police Command Dashboard."""
    total_cases = await db.scalar(select(func.count(Case.id))) or 0
    active_cases = await db.scalar(select(func.count(Case.id)).where(Case.status != CaseStatusEnum.CLOSED.value)) or 0
    critical_cases = await db.scalar(select(func.count(Case.id)).where(Case.priority == CasePriorityEnum.CRITICAL.value)) or 0
    escalated_cases = await db.scalar(select(func.count(Case.id)).where(Case.is_escalated == True)) or 0
    resolved_cases = await db.scalar(select(func.count(Case.id)).where(Case.status == CaseStatusEnum.RESOLVED.value)) or 0

    return {
        "totalCases": total_cases,
        "activeCases": active_cases,
        "criticalCases": critical_cases,
        "escalatedCases": escalated_cases,
        "resolvedCases": resolved_cases,
        "interpolSync": "CONNECTED",
        "warrantsActive": 6
    }


@router.get("/officer-workload")
async def get_officer_workload(
    current_user: User = Depends(require_police),
    db: AsyncSession = Depends(get_db)
):
    """List officer caseload and assignment status."""
    query = select(User).where(User.is_staff == True).options(selectinload(User.assigned_cases), selectinload(User.role), selectinload(User.department))
    res = await db.execute(query)
    officers = res.scalars().all()

    workload = []
    for off in officers:
        active_count = len([c for c in off.assigned_cases if c.status != CaseStatusEnum.CLOSED.value])
        workload.append({
            "id": off.id,
            "name": off.full_name,
            "badge": off.badge_number or f"LEO-{off.id[:4].upper()}",
            "unit": off.department.name if off.department else "Cyber Command Squad",
            "activeCases": active_count,
            "status": "BUSY" if active_count >= 5 else "AVAILABLE",
            "clearance": off.clearance_level
        })
    return workload


@router.get("/high-risk-cases", response_model=List[ComplaintFrontendSchema])
async def get_high_risk_cases(
    current_user: User = Depends(require_police),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all high-risk and critical priority cases."""
    q = select(Complaint).where(
        Complaint.severity.in_(["CRITICAL", "HIGH"])
    ).options(selectinload(Complaint.events), selectinload(Complaint.evidence_files)).order_by(desc(Complaint.created_at))
    res = await db.execute(q)
    complaints = res.scalars().all()
    return [complaint_service.map_to_frontend_schema(c) for c in complaints]


@router.get("/inter-unit-coordination")
async def get_inter_unit_coordination(
    current_user: User = Depends(require_police),
    db: AsyncSession = Depends(get_db)
):
    """Inter-agency and multi-jurisdictional active coordination matrix."""
    departments = (await db.execute(select(Department))).scalars().all()
    return [
        {
            "id": d.id,
            "unitName": d.name,
            "code": d.code,
            "jurisdiction": d.jurisdiction or "National",
            "activeCoordinatedCases": 3,
            "liaisonOfficer": "Agent Jenkins",
            "status": "ACTIVE_SYNC"
        }
        for d in departments
    ]


@router.get("/escalations")
async def get_police_escalations(
    current_user: User = Depends(require_police),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all escalated cases with statutory dispatch metadata."""
    q = select(Case).where(Case.is_escalated == True).options(selectinload(Case.assigned_officer), selectinload(Case.complaint)).order_by(desc(Case.updated_at))
    res = await db.execute(q)
    cases = res.scalars().all()
    return [
        {
            "id": c.id,
            "caseRef": c.case_number,
            "title": c.title,
            "reason": c.escalation_reason or "Inter-agency priority escalation request",
            "level": "Command Dispatch & Federal Coordination",
            "status": "DISPATCHED" if c.assigned_officer_id else "PENDING_ASSIGNMENT",
            "priority": c.priority,
            "assignedOfficer": c.assigned_officer.full_name if c.assigned_officer else "Unassigned",
            "updatedAt": c.updated_at.isoformat() if c.updated_at else c.created_at.isoformat()
        }
        for c in cases
    ]

