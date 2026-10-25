from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.schemas.case import (
    CaseResponse,
    CaseAssignmentRequest,
    CaseStatusUpdateRequest,
    CasePriorityUpdateRequest,
    CaseEscalationRequest,
    CaseReopenRequest
)
from app.schemas.auth import MessageResponse
from app.models.case import Case, CaseStatusEnum, CasePriorityEnum
from app.models.case_assignment import CaseAssignment
from app.models.case_status_history import CaseStatusHistory
from app.models.user import User
from app.models.role import RoleEnum
from app.models.complaint import Complaint, ComplaintStatusEnum
from app.core.permissions import get_current_user, require_staff, require_admin
from app.services.complaint_service import complaint_service

router = APIRouter(prefix="/cases", tags=["Case Management"])


@router.get("", response_model=List[CaseResponse])
async def list_cases(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    is_high_risk: Optional[bool] = Query(None),
    is_escalated: Optional[bool] = Query(None),
    assigned_to_me: Optional[bool] = Query(False),
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """List operational cases. Scoped by role, assignment, and object-level authorization."""
    user_role = current_user.role.name if current_user.role else ""

    q = select(Case).options(
        selectinload(Case.complaint).selectinload(Complaint.events),
        selectinload(Case.complaint).selectinload(Complaint.evidence_files),
        selectinload(Case.assigned_officer),
        selectinload(Case.assigned_specialist),
        selectinload(Case.assigned_department)
    ).order_by(desc(Case.created_at))

    if status:
        q = q.where(Case.status == status)
    if priority:
        q = q.where(Case.priority == priority)
    if is_high_risk is not None:
        q = q.where(Case.is_high_risk == is_high_risk)
    if is_escalated is not None:
        q = q.where(Case.is_escalated == is_escalated)

    if assigned_to_me:
        q = q.where(
            (Case.assigned_officer_id == current_user.id) |
            (Case.assigned_specialist_id == current_user.id)
        )
    elif user_role == RoleEnum.CYBERSECURITY_SPECIALIST.value:
        # Specialists are scoped to their assigned cases or unassigned triage intake
        q = q.where(
            (Case.assigned_specialist_id == current_user.id) |
            (Case.assigned_specialist_id.is_(None))
        )

    res = await db.execute(q)
    cases = res.scalars().all()

    results = []
    for c in cases:
        complaint_dict = complaint_service.map_to_frontend_schema(c.complaint) if c.complaint else None

        # Mask citizen PII and raw narratives for AI/ML Lead role
        case_summary = c.summary
        if user_role == RoleEnum.AI_ML_SYSTEM_LEAD.value:
            case_summary = "[REDACTED - Citizen Narrative Redacted for AI Lead Role]"
            if complaint_dict:
                complaint_dict["description"] = "[REDACTED - AI/ML System Lead role restricted from raw citizen narratives]"
                if "citizenName" in complaint_dict:
                    complaint_dict["citizenName"] = "[REDACTED]"
                if "citizenEmail" in complaint_dict:
                    complaint_dict["citizenEmail"] = "[REDACTED]"
                if "citizenPhone" in complaint_dict:
                    complaint_dict["citizenPhone"] = "[REDACTED]"

        results.append(
            CaseResponse(
                id=c.id,
                case_number=c.case_number,
                complaint_id=c.complaint_id,
                title=c.title,
                summary=case_summary,
                priority=c.priority,
                status=c.status,
                risk_score=c.risk_score,
                is_high_risk=c.is_high_risk,
                is_escalated=c.is_escalated,
                escalation_reason=c.escalation_reason,
                assigned_department=c.assigned_department.name if c.assigned_department else None,
                assigned_officer=c.assigned_officer.full_name if c.assigned_officer else None,
                assigned_specialist=c.assigned_specialist.full_name if c.assigned_specialist else None,
                created_at=c.created_at,
                updated_at=c.updated_at,
                complaint=complaint_dict
            )
        )
    return results


@router.post("/from-complaint/{complaint_id}", response_model=CaseResponse, status_code=status.HTTP_200_OK)
async def create_case_from_complaint(
    complaint_id: str,
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """
    Idempotently creates or activates an official Case docket from a submitted/validated complaint.
    Guarantees exactly one case per complaint and prevents duplicate case creation on repeated requests.
    """
    # Find complaint
    comp_q = select(Complaint).where(
        (Complaint.id == complaint_id) | (Complaint.reference_number == complaint_id)
    ).options(
        selectinload(Complaint.events),
        selectinload(Complaint.evidence_files)
    )
    comp_res = await db.execute(comp_q)
    complaint = comp_res.scalars().first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint record not found")

    # Check for existing linked case (idempotent lookup)
    existing_case_q = select(Case).where(Case.complaint_id == complaint.id).options(
        selectinload(Case.complaint).selectinload(Complaint.events),
        selectinload(Case.complaint).selectinload(Complaint.evidence_files),
        selectinload(Case.assigned_officer),
        selectinload(Case.assigned_specialist),
        selectinload(Case.assigned_department)
    )
    existing_case_res = await db.execute(existing_case_q)
    existing_case = existing_case_res.scalars().first()

    if existing_case:
        # Advance case status to CASE_CREATED if in pre-case states (OPEN, SUBMITTED, UNDER_REVIEW, TRIAGED, VALIDATED)
        if existing_case.status in [CaseStatusEnum.OPEN.value, "TRIAGED", "SUBMITTED", "VALIDATED", "UNDER_REVIEW"]:
            existing_case.status = CaseStatusEnum.CASE_CREATED.value
            complaint.status = ComplaintStatusEnum.CASE_CREATED.value
            await db.commit()
            await db.refresh(existing_case)

        complaint_dict = complaint_service.map_to_frontend_schema(existing_case.complaint) if existing_case.complaint else None
        return CaseResponse(
            id=existing_case.id,
            case_number=existing_case.case_number,
            complaint_id=existing_case.complaint_id,
            title=existing_case.title,
            summary=existing_case.summary,
            priority=existing_case.priority,
            status=existing_case.status,
            risk_score=existing_case.risk_score,
            is_high_risk=existing_case.is_high_risk,
            is_escalated=existing_case.is_escalated,
            escalation_reason=existing_case.escalation_reason,
            assigned_department=existing_case.assigned_department.name if existing_case.assigned_department else None,
            assigned_officer=existing_case.assigned_officer.full_name if existing_case.assigned_officer else None,
            assigned_specialist=existing_case.assigned_specialist.full_name if existing_case.assigned_specialist else None,
            created_at=existing_case.created_at,
            updated_at=existing_case.updated_at,
            complaint=complaint_dict
        )

    # Create new linked case
    new_case = Case(
        case_number=f"CASE-{complaint.reference_number}",
        complaint_id=complaint.id,
        title=complaint.title,
        summary=complaint.description[:500],
        priority=complaint.severity,
        status=CaseStatusEnum.CASE_CREATED.value,
        risk_score=float(complaint.triage_score),
        is_high_risk=complaint.severity in ["CRITICAL", "HIGH"]
    )
    db.add(new_case)
    complaint.status = ComplaintStatusEnum.CASE_CREATED.value

    # Timeline event
    from app.models.complaint_event import ComplaintEvent
    ev = ComplaintEvent(
        complaint_id=complaint.id,
        title="Official Case Docket Created",
        description=f"Operational case {new_case.case_number} created and assigned to active command registry.",
        actor=f"{current_user.role.name if current_user.role else 'Staff'} ({current_user.full_name})",
        verified_hash=None,
        timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    )
    db.add(ev)

    # Audit log
    from app.services.audit_service import audit_service
    await audit_service.log_event(
        db=db,
        actor=current_user.full_name,
        action="CASE_CREATION_FROM_COMPLAINT",
        resource=f"complaint:{complaint.id}",
        user_id=current_user.id,
        metadata_json={
            "case_number": new_case.case_number,
            "complaint_ref": complaint.reference_number,
            "creator": current_user.email
        }
    )

    await db.commit()
    await db.refresh(new_case)

    # Re-fetch for response
    refetched_q = select(Case).where(Case.id == new_case.id).options(
        selectinload(Case.complaint).selectinload(Complaint.events),
        selectinload(Case.complaint).selectinload(Complaint.evidence_files),
        selectinload(Case.assigned_officer),
        selectinload(Case.assigned_specialist),
        selectinload(Case.assigned_department)
    )
    res_final = await db.execute(refetched_q)
    final_case = res_final.scalars().first()

    complaint_dict = complaint_service.map_to_frontend_schema(final_case.complaint) if final_case.complaint else None
    return CaseResponse(
        id=final_case.id,
        case_number=final_case.case_number,
        complaint_id=final_case.complaint_id,
        title=final_case.title,
        summary=final_case.summary,
        priority=final_case.priority,
        status=final_case.status,
        risk_score=final_case.risk_score,
        is_high_risk=final_case.is_high_risk,
        is_escalated=final_case.is_escalated,
        escalation_reason=final_case.escalation_reason,
        assigned_department=final_case.assigned_department.name if final_case.assigned_department else None,
        assigned_officer=final_case.assigned_officer.full_name if final_case.assigned_officer else None,
        assigned_specialist=final_case.assigned_specialist.full_name if final_case.assigned_specialist else None,
        created_at=final_case.created_at,
        updated_at=final_case.updated_at,
        complaint=complaint_dict
    )


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: str,
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """Get complete case file with linked complaint and evidence items. Enforces object-level access."""
    user_role = current_user.role.name if current_user.role else ""
    q = select(Case).where((Case.id == case_id) | (Case.case_number == case_id)).options(
        selectinload(Case.complaint).selectinload(Complaint.events),
        selectinload(Case.complaint).selectinload(Complaint.evidence_files),
        selectinload(Case.assigned_officer),
        selectinload(Case.assigned_specialist),
        selectinload(Case.assigned_department)
    )
    res = await db.execute(q)
    c = res.scalars().first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    # Object-level authorization for specialists: cannot access cases assigned to another specialist
    if user_role == RoleEnum.CYBERSECURITY_SPECIALIST.value:
        if c.assigned_specialist_id is not None and c.assigned_specialist_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Case docket is assigned to another specialist."
            )

    complaint_dict = complaint_service.map_to_frontend_schema(c.complaint) if c.complaint else None

    # Mask citizen PII and raw narratives for AI/ML Lead role
    case_summary = c.summary
    if user_role == RoleEnum.AI_ML_SYSTEM_LEAD.value:
        case_summary = "[REDACTED - Citizen Narrative Redacted for AI Lead Role]"
        if complaint_dict:
            complaint_dict["description"] = "[REDACTED - AI/ML System Lead role restricted from raw citizen narratives]"
            if "citizenName" in complaint_dict:
                complaint_dict["citizenName"] = "[REDACTED]"
            if "citizenEmail" in complaint_dict:
                complaint_dict["citizenEmail"] = "[REDACTED]"
            if "citizenPhone" in complaint_dict:
                complaint_dict["citizenPhone"] = "[REDACTED]"

    return CaseResponse(
        id=c.id,
        case_number=c.case_number,
        complaint_id=c.complaint_id,
        title=c.title,
        summary=case_summary,
        priority=c.priority,
        status=c.status,
        risk_score=c.risk_score,
        is_high_risk=c.is_high_risk,
        is_escalated=c.is_escalated,
        escalation_reason=c.escalation_reason,
        assigned_department=c.assigned_department.name if c.assigned_department else None,
        assigned_officer=c.assigned_officer.full_name if c.assigned_officer else None,
        assigned_specialist=c.assigned_specialist.full_name if c.assigned_specialist else None,
        created_at=c.created_at,
        updated_at=c.updated_at,
        complaint=complaint_dict
    )


@router.post("/{case_id}/assign", response_model=MessageResponse)
async def assign_case(
    case_id: str,
    req: CaseAssignmentRequest,
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """Assign case to investigating officer, forensic specialist, or department unit."""
    user_role = current_user.role.name if current_user.role else ""
    if user_role == RoleEnum.AI_ML_SYSTEM_LEAD.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI_ML_SYSTEM_LEAD is not authorized to assign or reassign cases."
        )

    q = select(Case).where((Case.id == case_id) | (Case.case_number == case_id))
    res = await db.execute(q)
    c = res.scalars().first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    if user_role == RoleEnum.CYBERSECURITY_SPECIALIST.value:
        if c.assigned_specialist_id is not None and c.assigned_specialist_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Specialists cannot reassign cases assigned to other personnel without supervisor authorization."
            )

    if req.officer_id:
        c.assigned_officer_id = req.officer_id
    if req.specialist_id:
        c.assigned_specialist_id = req.specialist_id
    if req.department_id:
        c.assigned_department_id = req.department_id

    c.status = CaseStatusEnum.ASSIGNED.value
    target_user_id = req.officer_id or req.specialist_id or current_user.id
    role_type = "OFFICER" if req.officer_id else "SPECIALIST"

    assignment_log = CaseAssignment(
        case_id=c.id,
        assigned_to_user_id=target_user_id,
        assigned_by_user_id=current_user.id,
        role_type=role_type,
        notes=req.notes
    )
    db.add(assignment_log)

    # Also update linked complaint status and assigned officer if complaint exists
    if c.complaint_id:
        comp_q = select(Complaint).where(Complaint.id == c.complaint_id)
        comp_res = await db.execute(comp_q)
        comp = comp_res.scalars().first()
        if comp:
            comp.status = CaseStatusEnum.ASSIGNED.value
            # Fetch assigned user name
            target_user_res = await db.execute(select(User).where(User.id == target_user_id))
            target_user = target_user_res.scalars().first()
            if target_user:
                comp.assigned_officer = f"{target_user.full_name} ({role_type})"

            from app.models.complaint_event import ComplaintEvent
            ev = ComplaintEvent(
                complaint_id=comp.id,
                title=f"Assigned to {role_type.title()}",
                description=f"Case docket assigned to {target_user.full_name if target_user else 'Assigned Staff'}. Notes: {req.notes or 'None'}",
                actor=f"{current_user.role.name if current_user.role else 'Staff'} ({current_user.full_name})",
                verified_hash=None,
                timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
            )
            db.add(ev)

    # Notify assigned user
    from app.services.notification_service import notification_service
    await notification_service.create_notification(
        db=db,
        user_id=target_user_id,
        title=f"New Case Assignment: {c.case_number}",
        message=f"You have been assigned to case {c.case_number} ({c.title}) as {role_type}. Notes: {req.notes or 'No notes provided.'}",
        notification_type="CASE_ASSIGNMENT",
        severity="HIGH" if c.is_high_risk else "MEDIUM",
        related_case_id=c.id,
        related_complaint_id=c.complaint_id
    )

    # Log audit event
    from app.services.audit_service import audit_service
    await audit_service.log_event(
        db=db,
        actor=current_user.full_name,
        action="CASE_ASSIGNMENT",
        resource=f"case:{c.id}",
        user_id=current_user.id,
        metadata_json={
            "case_number": c.case_number,
            "assigned_to": target_user_id,
            "role_type": role_type,
            "notes": req.notes
        }
    )

    await db.commit()
    return MessageResponse(message=f"Case {c.case_number} successfully assigned.")


@router.patch("/{case_id}/status", response_model=MessageResponse)
async def update_case_status(
    case_id: str,
    req: CaseStatusUpdateRequest,
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """Transition case status and record in audit timeline."""
    from app.core.state_machine import validate_status_transition
    user_role = current_user.role.name if current_user.role else ""

    q = select(Case).where((Case.id == case_id) | (Case.case_number == case_id))
    res = await db.execute(q)
    c = res.scalars().first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    if user_role == RoleEnum.CYBERSECURITY_SPECIALIST.value:
        if c.assigned_specialist_id is not None and c.assigned_specialist_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Specialists cannot alter the status of a case assigned to another specialist."
            )

    validate_status_transition(c.status, req.status, user_role)

    prev = c.status
    c.status = req.status

    # Also update linked complaint status if exists
    if c.complaint_id:
        comp_q = select(Complaint).where(Complaint.id == c.complaint_id)
        comp_res = await db.execute(comp_q)
        comp = comp_res.scalars().first()
        if comp:
            comp.status = req.status

    history = CaseStatusHistory(
        case_id=c.id,
        previous_status=prev,
        new_status=req.status,
        changed_by_user_id=current_user.id,
        reason=req.reason
    )
    db.add(history)

    # Timeline event on linked complaint
    if c.complaint_id and comp:
        from app.models.complaint_event import ComplaintEvent
        import secrets
        timeline_title = f"Case Status Updated to {req.status}"
        if req.status == "UNDER_INVESTIGATION":
            timeline_title = "Official Investigation Active"
        elif req.status == "EVIDENCE_VERIFIED":
            timeline_title = "Technical Evidence Authenticated"
        elif req.status == "LAW_ENFORCEMENT_DISPATCHED":
            timeline_title = "Law Enforcement Action Recorded"
        elif req.status == "RESOLVED":
            timeline_title = "Incident Cleared & Resolved"
        elif req.status == "CLOSED":
            timeline_title = "Case File Archived & Closed"

        ev = ComplaintEvent(
            complaint_id=comp.id,
            title=timeline_title,
            description=req.reason or f"Status changed from {prev} to {req.status} by {current_user.full_name}.",
            actor=f"{user_role} ({current_user.full_name})",
            verified_hash=f"0x{secrets.token_hex(4)}...{secrets.token_hex(4)}",
            timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        )
        db.add(ev)

        # Notify Citizen if citizen user exists
        if comp.citizen_id:
            from app.services.notification_service import notification_service
            await notification_service.create_notification(
                db=db,
                user_id=comp.citizen_id,
                title=f"Incident Update: {comp.reference_number}",
                message=f"Your complaint status has progressed to: {req.status}. Reason: {req.reason or 'Progressing according to investigation guidelines.'}",
                notification_type="STATUS_CHANGE",
                severity="INFO",
                related_complaint_id=comp.id,
                related_case_id=c.id
            )

    # Record immutable audit log
    from app.services.audit_service import audit_service
    await audit_service.log_event(
        db=db,
        actor=current_user.full_name,
        action="CASE_STATUS_TRANSITION",
        resource=f"case:{c.id}",
        user_id=current_user.id,
        metadata_json={
            "case_number": c.case_number,
            "previous_status": prev,
            "new_status": req.status,
            "role": user_role,
            "reason": req.reason
        }
    )

    await db.commit()
    return MessageResponse(message=f"Case status transitioned from {prev} to {req.status}.")


@router.post("/{case_id}/escalate", response_model=MessageResponse)
async def escalate_case(
    case_id: str,
    req: CaseEscalationRequest,
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """Escalate critical or high-risk case to Command Dispatch."""
    q = select(Case).where((Case.id == case_id) | (Case.case_number == case_id))
    res = await db.execute(q)
    c = res.scalars().first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    c.is_escalated = req.is_escalated
    c.escalation_reason = req.escalation_reason
    c.priority = CasePriorityEnum.CRITICAL.value
    await db.commit()
    return MessageResponse(message=f"Case {c.case_number} marked as ESCALATED.")


@router.post("/{case_id}/reopen", response_model=MessageResponse)
async def reopen_case(
    case_id: str,
    req: CaseReopenRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Privileged administrative action to reopen a CLOSED case docket.
    Strictly restricted to Administrator / Supervisor credentials.
    Mandatory reason, immutable audit log, timeline event, and citizen/officer notification.
    """
    if not req.reason or len(req.reason.strip()) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A mandatory, detailed justification (at least 5 characters) is required to reopen a closed case."
        )

    q = select(Case).where((Case.id == case_id) | (Case.case_number == case_id))
    res = await db.execute(q)
    c = res.scalars().first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    if c.status != CaseStatusEnum.CLOSED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reopen case with status '{c.status}'. Case must be in CLOSED status."
        )

    prev_status = c.status
    c.status = CaseStatusEnum.UNDER_INVESTIGATION.value
    c.closed_at = None

    # Synchronize linked complaint
    comp = None
    if c.complaint_id:
        comp_q = select(Complaint).where(Complaint.id == c.complaint_id)
        comp_res = await db.execute(comp_q)
        comp = comp_res.scalars().first()
        if comp:
            comp.status = ComplaintStatusEnum.UNDER_INVESTIGATION.value

    # Record status history
    history = CaseStatusHistory(
        case_id=c.id,
        previous_status=prev_status,
        new_status=c.status,
        changed_by_user_id=current_user.id,
        reason=f"Administrative Reopen: {req.reason.strip()}"
    )
    db.add(history)

    # Append sealed complaint event
    if comp:
        from app.models.complaint_event import ComplaintEvent
        import secrets
        ev = ComplaintEvent(
            complaint_id=comp.id,
            title="Case Formally Reopened by Administrative Directive",
            description=f"Investigation reactivated by command oversight. Justification: {req.reason.strip()}",
            actor=f"Admin ({current_user.full_name})",
            verified_hash=f"0x{secrets.token_hex(4)}...{secrets.token_hex(4)}",
            timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        )
        db.add(ev)

        # Notify citizen
        if comp.citizen_id:
            from app.services.notification_service import notification_service
            await notification_service.create_notification(
                db=db,
                user_id=comp.citizen_id,
                title=f"Case Reopened: {c.case_number}",
                message=f"Your closed case {c.case_number} has been administratively reopened for further inquiry. Reason: {req.reason.strip()}",
                notification_type="STATUS_CHANGE",
                severity="HIGH",
                related_complaint_id=comp.id,
                related_case_id=c.id
            )

    # If assigned officer exists, notify officer
    if c.assigned_officer_id:
        from app.services.notification_service import notification_service
        await notification_service.create_notification(
            db=db,
            user_id=c.assigned_officer_id,
            title=f"Reassigned / Reopened Docket: {c.case_number}",
            message=f"Case {c.case_number} has been reopened by Admin {current_user.full_name}. Reason: {req.reason.strip()}",
            notification_type="CASE_ASSIGNMENT",
            severity="HIGH",
            related_case_id=c.id,
            related_complaint_id=c.complaint_id
        )

    # Immutable audit log
    from app.services.audit_service import audit_service
    await audit_service.log_event(
        db=db,
        actor=current_user.full_name,
        action="CASE_REOPENED",
        resource=f"case:{c.id}",
        user_id=current_user.id,
        metadata_json={
            "case_number": c.case_number,
            "previous_status": prev_status,
            "new_status": c.status,
            "reason": req.reason.strip(),
            "admin": current_user.email
        }
    )

    await db.commit()
    return MessageResponse(message=f"Case {c.case_number} successfully reopened to UNDER_INVESTIGATION.")


@router.get("/{case_id}/assistant/suggestions", summary="Get case-grounded assistant suggestions")
async def get_case_assistant_suggestions(
    case_id: str,
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve dynamic, entity-grounded assistant suggestions for a case."""
    from app.services.investigation_context_service import investigation_context_service
    suggestions = await investigation_context_service.get_dynamic_suggestions(db, case_id)
    return {
        "case_id": case_id,
        "suggestions": suggestions
    }

