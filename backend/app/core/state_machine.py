from typing import List, Dict, Optional, Tuple
from app.models.role import RoleEnum
from app.models.case import CaseStatusEnum
from app.models.complaint import ComplaintStatusEnum
from app.core.exceptions import ValidationError, PermissionDeniedError

# Valid status transitions graph
ALLOWED_TRANSITIONS: Dict[str, List[str]] = {
    "DRAFT": ["SUBMITTED", "CANCELLED", "CLOSED"],
    "SUBMITTED": ["UNDER_REVIEW", "TRIAGED", "VALIDATED", "CASE_CREATED", "CANCELLED", "CLOSED"],
    "UNDER_REVIEW": ["TRIAGED", "VALIDATED", "CASE_CREATED", "CLOSED"],
    "TRIAGED": ["UNDER_REVIEW", "VALIDATED", "CASE_CREATED", "CLOSED"],
    "VALIDATED": ["CASE_CREATED", "ASSIGNED", "CLOSED"],
    "CASE_CREATED": ["ASSIGNED", "UNDER_INVESTIGATION", "CLOSED"],
    "OPEN": ["CASE_CREATED", "UNDER_REVIEW", "CLOSED"],  # Retained for legacy DB compatibility
    "ASSIGNED": ["UNDER_INVESTIGATION", "CLOSED"],
    "UNDER_INVESTIGATION": ["EVIDENCE_VERIFIED", "LAW_ENFORCEMENT_DISPATCHED", "RESOLVED", "CLOSED", "ASSIGNED"],
    "EVIDENCE_VERIFIED": ["LAW_ENFORCEMENT_DISPATCHED", "UNDER_INVESTIGATION", "RESOLVED", "CLOSED"],
    "LAW_ENFORCEMENT_DISPATCHED": ["UNDER_INVESTIGATION", "RESOLVED", "CLOSED"],
    "PENDING_VALIDATION": ["VALIDATED", "RESOLVED", "UNDER_INVESTIGATION", "CLOSED"],
    "RESOLVED": ["CLOSED"],
    "CLOSED": [],  # Terminal in standard mutation. Reopening strictly requires POST /cases/{id}/reopen
    "CANCELLED": []  # Terminal state for cancelled/withdrawn complaints
}


def validate_status_transition(current_status: str, target_status: str, user_role: str) -> None:
    """Validate that the state transition is valid and the user has the authority to execute it."""
    curr = current_status.upper()
    target = target_status.upper()

    if curr == target:
        return  # No-op

    allowed_targets = ALLOWED_TRANSITIONS.get(curr, [])
    if target not in allowed_targets:
        if curr == "CLOSED":
            raise ValidationError(
                "Case is CLOSED and cannot be modified via standard status update. "
                "Reopening requires privileged POST /cases/{case_id}/reopen action."
            )
        raise ValidationError(
            f"Invalid status transition from '{curr}' to '{target}'. Allowed target statuses: {allowed_targets}"
        )

    # 1. Citizen Role: Strictly limited to DRAFT -> SUBMITTED or DRAFT -> CANCELLED
    if user_role == RoleEnum.CITIZEN.value:
        if curr == "DRAFT" and target in ["SUBMITTED", "CANCELLED"]:
            return
        raise PermissionDeniedError("Citizens may only transition complaints from DRAFT to SUBMITTED or CANCELLED.")

    # 2. AI Lead Role: Strictly read-only on operational workflows
    elif user_role == RoleEnum.AI_ML_SYSTEM_LEAD.value:
        raise PermissionDeniedError("AI_ML_SYSTEM_LEAD does not have authority to alter operational case status.")

    # 3. Cybersecurity Specialist: Technical review, triage, validation, evidence verification
    elif user_role == RoleEnum.CYBERSECURITY_SPECIALIST.value:
        specialist_allowed_targets = [
            "UNDER_REVIEW", "TRIAGED", "VALIDATED", "CASE_CREATED",
            "UNDER_INVESTIGATION", "EVIDENCE_VERIFIED"
        ]
        if target not in specialist_allowed_targets:
            raise PermissionDeniedError(
                f"Specialists are not authorized to set status to '{target}'. Permitted: {specialist_allowed_targets}"
            )

    # 4. Cybercrime Police: Case creation, assignment, investigation, law enforcement action, resolution, closure
    elif user_role == RoleEnum.CYBERCRIME_POLICE.value:
        police_allowed_targets = [
            "UNDER_REVIEW", "CASE_CREATED", "ASSIGNED", "UNDER_INVESTIGATION", "EVIDENCE_VERIFIED",
            "LAW_ENFORCEMENT_DISPATCHED", "RESOLVED", "CLOSED"
        ]
        if target not in police_allowed_targets:
            raise PermissionDeniedError(
                f"Police officers are not authorized to set status to '{target}'. Permitted: {police_allowed_targets}"
            )
        # Re-opening a CLOSED case requires administrative override
        if curr == "CLOSED":
            raise PermissionDeniedError("Reopening a CLOSED case requires administrative override.")

    # 5. Admin Role: Can execute valid state machine transitions with oversight
    elif user_role == RoleEnum.ADMIN.value:
        if curr == "CLOSED":
            raise ValidationError(
                "Closed cases cannot be modified via standard status update. "
                "Use administrative endpoint POST /cases/{case_id}/reopen."
            )

    else:
        raise PermissionDeniedError(f"Role '{user_role}' is not authorized to transition case status.")
