"""
Citizen Timeline & Lifecycle Service
Generates citizen-authorized vertical complaint and case tracking timelines.
Enforces strict zero-leakage data boundaries:
- No model confidence or internal investigator intelligence
- No investigator private notes, suspect intelligence, or police operational details
- Deterministic and truthful mapping from real Complaint and Case database state
"""

import datetime
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc
from sqlalchemy.orm import selectinload

from app.models.complaint import Complaint, ComplaintStatusEnum
from app.models.complaint_event import ComplaintEvent
from app.models.case import Case, CaseStatusEnum
from app.models.case_status_history import CaseStatusHistory
from app.models.evidence import Evidence
from app.models.user import User
from app.models.role import RoleEnum
from app.core.exceptions import NotFoundError, PermissionDeniedError
from app.schemas.citizen_timeline import (
    CitizenTimelineResponse,
    TimelineStageItem,
    ProgressSchema,
    EvidenceSummarySchema,
    AllowedActionsSchema
)


class CitizenTimelineService:
    # 10 Authorized Citizen Lifecycle Stages in chronological order
    STAGES_CONFIG = [
        {
            "stage": "COMPLAINT_SUBMITTED",
            "title": "Complaint Submitted",
            "description": "Your complaint has been successfully received.",
            "backend_statuses": ["DRAFT", "SUBMITTED", "OPEN"],
            "rank": 1
        },
        {
            "stage": "INITIAL_REVIEW",
            "title": "Initial Review",
            "description": "Your complaint is being reviewed by the cybercrime team.",
            "backend_statuses": ["UNDER_REVIEW"],
            "rank": 2
        },
        {
            "stage": "INTELLIGENCE_ANALYSIS",
            "title": "Intelligence Analysis",
            "description": "The complaint has been analyzed for threat indicators and supporting information.",
            "backend_statuses": ["TRIAGED", "VALIDATED"],
            "rank": 3
        },
        {
            "stage": "CASE_CREATED",
            "title": "Case Created",
            "description": "Your complaint has been converted into an investigation case.",
            "backend_statuses": ["CASE_CREATED"],
            "rank": 4
        },
        {
            "stage": "ASSIGNED",
            "title": "Assigned for Investigation",
            "description": "The case has been assigned to the appropriate investigation team.",
            "backend_statuses": ["ASSIGNED"],
            "rank": 5
        },
        {
            "stage": "UNDER_INVESTIGATION",
            "title": "Investigation in Progress",
            "description": "Investigation activities are currently in progress.",
            "backend_statuses": ["UNDER_INVESTIGATION"],
            "rank": 6
        },
        {
            "stage": "EVIDENCE_VERIFIED",
            "title": "Evidence Verification",
            "description": "Submitted evidence has passed integrity verification.",
            "backend_statuses": ["EVIDENCE_VERIFIED"],
            "rank": 7,
            "integrity_seal": "SHA-256 Integrity Seal Verified"
        },
        {
            "stage": "APPROPRIATE_ACTION_INITIATED",
            "title": "Appropriate Action Initiated",
            "description": "The case has progressed to the appropriate action stage.",
            "backend_statuses": ["LAW_ENFORCEMENT_DISPATCHED"],
            "rank": 8
        },
        {
            "stage": "RESOLVED",
            "title": "Resolved",
            "description": "The investigation has reached a resolution.",
            "backend_statuses": ["RESOLVED"],
            "rank": 9
        },
        {
            "stage": "CLOSED",
            "title": "Closed",
            "description": "The case has been formally closed.",
            "backend_statuses": ["CLOSED"],
            "rank": 10
        }
    ]

    STATUS_TO_RANK: Dict[str, int] = {
        "DRAFT": 1,
        "OPEN": 1,
        "SUBMITTED": 1,
        "UNDER_REVIEW": 2,
        "TRIAGED": 3,
        "VALIDATED": 3,
        "CASE_CREATED": 4,
        "ASSIGNED": 5,
        "UNDER_INVESTIGATION": 6,
        "EVIDENCE_VERIFIED": 7,
        "LAW_ENFORCEMENT_DISPATCHED": 8,
        "RESOLVED": 9,
        "CLOSED": 10
    }

    STATUS_DISPLAY_MAP: Dict[str, str] = {
        "DRAFT": "Draft Saved",
        "OPEN": "Complaint Received",
        "SUBMITTED": "Complaint Submitted",
        "UNDER_REVIEW": "Initial Review in Progress",
        "TRIAGED": "Intelligence Triaged",
        "VALIDATED": "Analysis Validated",
        "CASE_CREATED": "Investigation Case Created",
        "ASSIGNED": "Assigned to Investigation Team",
        "UNDER_INVESTIGATION": "Investigation in Progress",
        "EVIDENCE_VERIFIED": "Evidence Integrity Verified",
        "LAW_ENFORCEMENT_DISPATCHED": "Appropriate Action Initiated",
        "RESOLVED": "Investigation Resolved",
        "CLOSED": "Case Closed",
        "CANCELLED": "Complaint Cancelled"
    }

    @classmethod
    async def get_citizen_timeline(
        cls,
        db: AsyncSession,
        complaint_id: str,
        current_user: Optional[User] = None
    ) -> CitizenTimelineResponse:
        """
        Builds the unified, citizen-safe lifecycle timeline.
        Enforces complaint ownership and eliminates sensitive intelligence.
        """
        # Fetch complaint with eager relationships
        q = select(Complaint).where(
            or_(Complaint.id == complaint_id, Complaint.reference_number == complaint_id)
        ).options(
            selectinload(Complaint.events),
            selectinload(Complaint.evidence_files),
            selectinload(Complaint.case).selectinload(Case.status_history),
            selectinload(Complaint.case).selectinload(Case.evidence_files)
        )
        res = await db.execute(q)
        complaint = res.scalars().first()

        if not complaint:
            raise NotFoundError(f"Complaint '{complaint_id}' not found.")

        # Enforce Citizen Ownership Boundary
        if current_user and current_user.role and current_user.role.name == RoleEnum.CITIZEN.value:
            is_owner = False
            if complaint.citizen_id and complaint.citizen_id == current_user.id:
                is_owner = True
            elif complaint.citizen_email and complaint.citizen_email.strip().lower() == current_user.email.strip().lower():
                is_owner = True

            if not is_owner:
                raise PermissionDeniedError("Access to another citizen's complaint timeline is prohibited.")

        raw_status = complaint.status or "SUBMITTED"
        case = complaint.case
        case_ref = case.case_number if case else None

        # Determine if case was cancelled or reopened
        is_cancelled: bool = bool(raw_status == "CANCELLED" or (case is not None and case.status == "CANCELLED"))
        cancellation_reason: Optional[str] = None
        is_reopened: bool = False
        reopen_timestamp: Optional[str] = None

        # Check complaint events and case status history for cancellation/reopen signals
        all_events = list(complaint.events or [])
        status_histories = list(case.status_history or []) if case else []

        for ev in all_events:
            title_lower = (ev.title or "").lower()
            desc_lower = (ev.description or "").lower()
            if "cancel" in title_lower or "cancel" in desc_lower:
                if not cancellation_reason:
                    cancellation_reason = ev.description
            if "reopen" in title_lower or "reopen" in desc_lower:
                is_reopened = True
                reopen_timestamp = ev.timestamp

        for sh in status_histories:
            if sh.new_status == "CANCELLED" and sh.reason:
                cancellation_reason = sh.reason
            if sh.previous_status in ["RESOLVED", "CLOSED"] and sh.new_status in ["UNDER_INVESTIGATION", "ASSIGNED", "CASE_CREATED"]:
                is_reopened = True
                if not reopen_timestamp and sh.created_at:
                    reopen_timestamp = sh.created_at.strftime("%d %b %Y, %I:%M %p")

        # Map current effective rank
        effective_status = raw_status
        if effective_status == "OPEN":
            effective_status = "SUBMITTED"

        current_rank = cls.STATUS_TO_RANK.get(effective_status, 1)

        # Build timeline stages
        timeline_items: List[TimelineStageItem] = []
        completed_count = 0

        # Map timestamps from events or complaint timestamps
        # Helper to find relevant event timestamp
        def find_event_timestamp(keywords: List[str]) -> Optional[str]:
            for ev in all_events:
                txt = f"{ev.title} {ev.description}".lower()
                if any(kw.lower() in txt for kw in keywords):
                    return ev.timestamp
            return None

        # Submitted date formatted
        submitted_at_str = ""
        if complaint.reported_date:
            submitted_at_str = complaint.reported_date
        elif complaint.created_at:
            submitted_at_str = complaint.created_at.strftime("%d %b %Y, %I:%M %p")
        else:
            submitted_at_str = "Recently"

        updated_at_str = ""
        if complaint.updated_at:
            updated_at_str = complaint.updated_at.strftime("%d %b %Y, %I:%M %p")
        else:
            updated_at_str = submitted_at_str

        for stage_cfg in cls.STAGES_CONFIG:
            s_rank = stage_cfg["rank"]
            s_key = stage_cfg["stage"]
            s_title = stage_cfg["title"]
            s_desc = stage_cfg["description"]
            s_seal = stage_cfg.get("integrity_seal")

            # Determine state
            if is_cancelled:
                if s_rank < current_rank:
                    item_state = "COMPLETED"
                    completed_count += 1
                elif s_rank == current_rank:
                    item_state = "CANCELLED"
                else:
                    item_state = "PENDING"
            else:
                if s_rank < current_rank:
                    item_state = "COMPLETED"
                    completed_count += 1
                elif s_rank == current_rank:
                    if raw_status in ["CLOSED", "RESOLVED"] and s_rank == 10:
                        item_state = "COMPLETED"
                        completed_count += 1
                    else:
                        item_state = "CURRENT"
                else:
                    item_state = "PENDING"

            # Resolve timestamp
            item_ts: Optional[str] = None
            if s_rank == 1:
                item_ts = submitted_at_str
            elif item_state in ["COMPLETED", "CURRENT", "CANCELLED"]:
                # Try finding matching event
                matching_ts = find_event_timestamp(stage_cfg["backend_statuses"] + [s_title])
                item_ts = matching_ts or updated_at_str

            details_text: Optional[str] = None
            if s_key == "CASE_CREATED" and case_ref:
                details_text = f"Official Case Reference: {case_ref}"
            elif s_key == "EVIDENCE_VERIFIED":
                details_text = "All submitted digital evidence has passed SHA-256 cryptographic verification."

            timeline_items.append(TimelineStageItem(
                stage=s_key,
                title=s_title,
                description=s_desc,
                state=item_state,
                timestamp=item_ts,
                details=details_text,
                integrity_seal=s_seal
            ))

        # If reopened, insert special event after the stage where investigation resumed
        if is_reopened:
            reopen_item = TimelineStageItem(
                stage="CASE_REOPENED",
                title="Case Reopened",
                description="New information required the investigation to continue.",
                state="REOPENED",
                timestamp=reopen_timestamp or updated_at_str,
                details="Investigation reopened under official supervision."
            )
            # Insert before the current active stage or at stage 6
            insert_idx = min(len(timeline_items), 5)
            timeline_items.insert(insert_idx, reopen_item)

        # Evidence Summary calculation
        all_evidence = list(complaint.evidence_files or [])
        if case and case.evidence_files:
            existing_ids = {e.id for e in all_evidence}
            for ce in case.evidence_files:
                if ce.id not in existing_ids:
                    all_evidence.append(ce)

        ev_count = len(all_evidence)
        if ev_count == 0:
            integrity_status = "NO_EVIDENCE"
            integrity_label = "No Evidence Attached"
        else:
            all_verified = all(getattr(e, "is_verified", False) for e in all_evidence)
            if all_verified:
                integrity_status = "VERIFIED"
                integrity_label = "SHA-256 Integrity Seal Verified"
            else:
                integrity_status = "PENDING"
                integrity_label = "Integrity Verification Pending"

        # Latest Update message (citizen-safe)
        latest_update_msg = cls._generate_latest_update(raw_status, cancellation_reason, is_reopened)

        # Allowed actions
        can_add_evidence = raw_status not in ["CLOSED", "CANCELLED"]
        disabled_reason = None if can_add_evidence else "Evidence submission is closed for concluded or cancelled cases."

        return CitizenTimelineResponse(
            complaint_id=complaint.id,
            complaint_reference=complaint.reference_number,
            case_reference=case_ref,
            current_status=raw_status,
            current_status_display=cls.STATUS_DISPLAY_MAP.get(raw_status, "Under Processing"),
            submitted_at=submitted_at_str,
            updated_at=updated_at_str,
            progress=ProgressSchema(
                completed=completed_count,
                total=10
            ),
            timeline=timeline_items,
            evidence_summary=EvidenceSummarySchema(
                count=ev_count,
                integrity_status=integrity_status,
                integrity_label=integrity_label
            ),
            latest_update=latest_update_msg,
            is_cancelled=is_cancelled,
            cancellation_reason=cancellation_reason,
            is_reopened=is_reopened,
            allowed_actions=AllowedActionsSchema(
                view_details=True,
                add_evidence=can_add_evidence,
                view_evidence=True,
                contact_support=True,
                add_evidence_disabled_reason=disabled_reason
            )
        )

    @classmethod
    def _generate_latest_update(cls, status: str, cancellation_reason: Optional[str], is_reopened: bool) -> str:
        """Generates citizen-safe, helpful guidance based solely on current status."""
        if status == "CANCELLED":
            msg = "This incident report has been cancelled."
            if cancellation_reason:
                msg += f" Reason: {cancellation_reason}"
            return msg

        if is_reopened:
            return "Your case was reopened for further examination. Investigation activities are actively underway."

        updates = {
            "DRAFT": "Complaint draft saved. Complete submission to initiate official triage.",
            "OPEN": "Your complaint has been successfully received and queued for review.",
            "SUBMITTED": "Your complaint has been successfully received and queued for review.",
            "UNDER_REVIEW": "Cybercrime officers are conducting an initial assessment of your report.",
            "TRIAGED": "Threat indicators have been parsed. Your report is pending formal case creation.",
            "VALIDATED": "Supporting information has been validated. Investigation dossier is being assembled.",
            "CASE_CREATED": "An official cyber investigation case has been opened for your complaint.",
            "ASSIGNED": "Your case has been allocated to a specialized cybercrime investigation unit.",
            "UNDER_INVESTIGATION": "Your case is currently under investigation. No action is required from you at this time.",
            "EVIDENCE_VERIFIED": "Submitted evidence files have been cryptographically verified and cataloged.",
            "LAW_ENFORCEMENT_DISPATCHED": "The case has progressed to the appropriate action stage.",
            "RESOLVED": "The cybercrime investigation has reached a resolution. You may review the case summary.",
            "CLOSED": "The case has been formally closed. Thank you for your cooperation."
        }
        return updates.get(status, "Your complaint is being processed in the enclave.")


citizen_timeline_service = CitizenTimelineService()
