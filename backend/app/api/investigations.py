from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.models.investigation import Investigation
from app.models.investigation_action import InvestigationAction
from app.models.investigation_finding import InvestigationFinding
from app.models.user import User
from app.schemas.investigation import (
    InvestigationResponse,
    InvestigationActionCreate,
    InvestigationActionResponse,
    InvestigationFindingCreate,
    InvestigationFindingResponse
)
from app.schemas.auth import MessageResponse
from app.core.permissions import require_specialist

router = APIRouter(prefix="/investigations", tags=["Investigations"])


@router.get("", response_model=List[InvestigationResponse])
async def list_investigations(
    case_id: Optional[str] = Query(None),
    current_user: User = Depends(require_specialist),
    db: AsyncSession = Depends(get_db)
):
    """List forensic investigations."""
    q = select(Investigation).options(
        selectinload(Investigation.actions),
        selectinload(Investigation.findings)
    ).order_by(desc(Investigation.created_at))

    if case_id:
        q = q.where(Investigation.case_id == case_id)

    res = await db.execute(q)
    return res.scalars().all()


@router.get("/by-case/{case_id}", response_model=InvestigationResponse)
async def get_or_create_investigation_by_case(
    case_id: str,
    current_user: User = Depends(require_specialist),
    db: AsyncSession = Depends(get_db)
):
    """Get active investigation record for case, creating an initial dossier if not present."""
    from app.models.case import Case
    from app.models.role import RoleEnum

    case_res = await db.execute(select(Case).where((Case.id == case_id) | (Case.case_number == case_id)))
    c = case_res.scalars().first()
    if not c:
        raise HTTPException(status_code=404, detail="Case record not found")

    user_role = current_user.role.name if current_user.role else ""
    if user_role == RoleEnum.CYBERSECURITY_SPECIALIST.value:
        if c.assigned_specialist_id is not None and c.assigned_specialist_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Case is assigned to another specialist."
            )

    q = select(Investigation).where(Investigation.case_id == c.id).options(
        selectinload(Investigation.actions),
        selectinload(Investigation.findings)
    )
    res = await db.execute(q)
    inv = res.scalars().first()
    if not inv:
        inv = Investigation(
            case_id=c.id,
            lead_specialist_id=current_user.id,
            title=f"Forensic Investigation for Case {c.case_number or c.id[:8]}",
            status="ACTIVE",
            hypothesis="Active specialist forensic analysis initiated."
        )
        db.add(inv)
        await db.commit()
        await db.refresh(inv, ["actions", "findings"])
    return inv


@router.post("/{investigation_id}/actions", response_model=InvestigationActionResponse)
async def add_investigation_action(
    investigation_id: str,
    req: InvestigationActionCreate,
    current_user: User = Depends(require_specialist),
    db: AsyncSession = Depends(get_db)
):
    """Record forensic investigation action or pivot in case ledger."""
    from app.models.case import Case
    from app.models.role import RoleEnum

    inv_q = select(Investigation).where(Investigation.id == investigation_id)
    inv_res = await db.execute(inv_q)
    inv = inv_res.scalars().first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation record not found")

    user_role = current_user.role.name if current_user.role else ""
    if user_role == RoleEnum.CYBERSECURITY_SPECIALIST.value and inv.case_id:
        case_res = await db.execute(select(Case).where(Case.id == inv.case_id))
        c = case_res.scalars().first()
        if c and c.assigned_specialist_id is not None and c.assigned_specialist_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Investigation belongs to a case assigned to another specialist."
            )

    action = InvestigationAction(
        investigation_id=investigation_id,
        performed_by_user_id=current_user.id,
        action_type=req.action_type,
        title=req.title,
        details=req.details,
        results=req.results or {}
    )
    db.add(action)
    await db.commit()
    await db.refresh(action)
    return action


@router.post("/{investigation_id}/findings", response_model=InvestigationFindingResponse)
async def add_investigation_finding(
    investigation_id: str,
    req: InvestigationFindingCreate,
    current_user: User = Depends(require_specialist),
    db: AsyncSession = Depends(get_db)
):
    """Document new case finding for specialist peer validation."""
    from app.models.case import Case
    from app.models.role import RoleEnum

    inv_q = select(Investigation).where(Investigation.id == investigation_id)
    inv_res = await db.execute(inv_q)
    inv = inv_res.scalars().first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation record not found")

    user_role = current_user.role.name if current_user.role else ""
    if user_role == RoleEnum.CYBERSECURITY_SPECIALIST.value and inv.case_id:
        case_res = await db.execute(select(Case).where(Case.id == inv.case_id))
        c = case_res.scalars().first()
        if c and c.assigned_specialist_id is not None and c.assigned_specialist_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Investigation belongs to a case assigned to another specialist."
            )

    finding = InvestigationFinding(
        investigation_id=investigation_id,
        author_user_id=current_user.id,
        finding_type=req.finding_type,
        title=req.title,
        summary=req.summary,
        confidence_score=req.confidence_score,
        is_validated=False,
        evidence_refs=req.evidence_refs or []
    )
    db.add(finding)
    await db.commit()
    await db.refresh(finding)
    return finding
