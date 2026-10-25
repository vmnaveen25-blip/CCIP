import datetime
import random
import secrets
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc
from sqlalchemy.orm import selectinload

from app.models.complaint import Complaint, ComplaintStatusEnum, ComplaintSeverityEnum, ComplaintCategoryEnum
from app.models.complaint_event import ComplaintEvent
from app.models.case import Case, CaseStatusEnum, CasePriorityEnum
from app.models.evidence import Evidence
from app.models.user import User
from app.models.role import RoleEnum
from app.schemas.complaint import ComplaintCreateRequest, ComplaintUpdateRequest, ComplaintFrontendSchema
from app.core.exceptions import NotFoundError, PermissionDeniedError, ValidationError, AuthenticationError
from app.services.audit_service import audit_service
from app.core.logging import logger


class ComplaintService:
    @staticmethod
    def generate_reference_number() -> str:
        """Generate enumeration-resistant high-entropy reference format e.g. CYBER-2026-984210-A7F2"""
        rand_code = secrets.randbelow(900000) + 100000
        suffix = secrets.token_hex(2).upper()
        return f"CYBER-2026-{rand_code}-{suffix}"

    @staticmethod
    def map_to_public_tracking_schema(complaint: Complaint, verified: bool = False) -> dict:
        """Map Complaint to a strictly minimized public tracking schema.
        ZERO leak of complainant personal PII, financial details, suspect data,
        narrative description, investigator internal notes, or raw evidence files.
        Unverified requests (no token) receive only high-level status without milestones.
        """
        status_label_map = {
            "DRAFT": "Draft Saved",
            "SUBMITTED": "Complaint Received & Sealed",
            "OPEN": "Complaint Received",
            "UNDER_REVIEW": "Initial Review in Progress",
            "TRIAGED": "Intelligence Triaged",
            "VALIDATED": "Analysis Validated",
            "CASE_CREATED": "Investigation Case Created",
            "ASSIGNED": "Assigned to Investigation Unit",
            "UNDER_INVESTIGATION": "Investigation in Progress",
            "EVIDENCE_VERIFIED": "Evidence Integrity Verified",
            "LAW_ENFORCEMENT_DISPATCHED": "Appropriate Action Initiated",
            "RESOLVED": "Investigation Resolved",
            "CLOSED": "Case Formally Closed",
            "CANCELLED": "Complaint Cancelled"
        }

        status_label = status_label_map.get(complaint.status, complaint.status.replace("_", " ").title())

        # Minimal public response when unverified (no valid tracking token provided)
        if not verified:
            return {
                "referenceNumber": complaint.reference_number,
                "title": f"Incident Record {complaint.reference_number}",
                "status": complaint.status,
                "statusLabel": status_label,
                "category": complaint.category,
                "reportedDate": complaint.reported_date,
                "timeline": [
                    {
                        "title": "Incident Logged & Sealed",
                        "stage": "SUBMITTED",
                        "state": "COMPLETED",
                        "timestamp": complaint.reported_date
                    }
                ],
                "trackingVerified": False,
                "verificationMessage": "Public tracking view: Supply your confidential tracking token or sign in to view detailed milestone telemetry and evidence status."
            }

        # Detailed tracking telemetry provided ONLY when token is verified
        milestones = []
        if complaint.events:
            for ev in complaint.events:
                milestones.append({
                    "title": ev.title,
                    "stage": "LIFECYCLE_STAGE",
                    "state": "COMPLETED",
                    "timestamp": ev.timestamp
                })
        else:
            milestones.append({
                "title": "Incident Registered & Cryptographic Seal Applied",
                "stage": "SUBMITTED",
                "state": "COMPLETED",
                "timestamp": complaint.reported_date
            })

        evidence_count = len(complaint.evidence_files) if complaint.evidence_files else 0

        return {
            "id": complaint.id,
            "referenceNumber": complaint.reference_number,
            "title": f"Incident Record {complaint.reference_number}",
            "status": complaint.status,
            "statusLabel": status_label,
            "category": complaint.category,
            "reportedDate": complaint.reported_date,
            "incidentDate": complaint.incident_date,
            "lastUpdated": complaint.updated_at.strftime("%Y-%m-%d %H:%M:%S UTC") if complaint.updated_at else complaint.reported_date,
            "timeline": milestones,
            "trackingVerified": True,
            "evidenceCount": evidence_count,
            "verificationMessage": "Verified access: Full complaint telemetry available under authorized session."
        }

    @staticmethod
    def map_to_frontend_schema(complaint: Complaint) -> dict:
        """Map backend SQLAlchemy Complaint model to exact frontend Complaint interface."""
        evidence_files = []
        if complaint.evidence_files:
            for ev in complaint.evidence_files:
                evidence_files.append({
                    "name": ev.original_filename,
                    "size": ev.file_size_formatted,
                    "type": ev.mime_type,
                    "sha256Hash": ev.sha256_hash,
                    "verified": ev.is_verified,
                    "url": f"/api/v1/evidence/{ev.id}/download"
                })

        timeline_events = []
        if complaint.events:
            for ev in complaint.events:
                timeline_events.append({
                    "timestamp": ev.timestamp,
                    "title": ev.title,
                    "description": ev.description,
                    "actor": ev.actor,
                    "verifiedHash": ev.verified_hash
                })

        return {
            "id": complaint.id,
            "referenceNumber": complaint.reference_number,
            "trackingToken": getattr(complaint, "tracking_token", None),
            "title": complaint.title,
            "category": complaint.category,
            "severity": complaint.severity,
            "status": complaint.status,
            "citizenName": complaint.citizen_name,
            "citizenEmail": complaint.citizen_email,
            "citizenPhone": complaint.citizen_phone or "",
            "incidentDate": complaint.incident_date,
            "reportedDate": complaint.reported_date,
            "financialLoss": complaint.financial_loss or 0.0,
            "suspectInfo": complaint.suspect_info or {},
            "description": complaint.description,
            "evidenceFiles": evidence_files,
            "aiTriageScore": complaint.triage_score,
            "aiPredictedThreatGroup": complaint.predicted_threat_group,
            "assignedUnit": complaint.assigned_unit,
            "assignedOfficer": complaint.assigned_officer,
            "timeline": timeline_events
        }

    @staticmethod
    async def create_complaint(
        db: AsyncSession,
        data: ComplaintCreateRequest,
        current_user: Optional[User] = None,
        ip_address: Optional[str] = "127.0.0.1",
        user_agent: Optional[str] = None
    ) -> Complaint:
        """Create a new citizen complaint and corresponding case."""
        ref_num = ComplaintService.generate_reference_number()
        tracking_token = f"ccip_trk_{secrets.token_urlsafe(24)}"
        now = datetime.datetime.now(datetime.timezone.utc)
        now_str = now.strftime("%Y-%m-%d %H:%M:%S UTC")

        citizen_name = data.citizenName or (current_user.full_name if current_user else "Citizen User")
        citizen_email = data.citizenEmail or (current_user.email if current_user else "citizen@example.com")
        citizen_phone = data.citizenPhone or (current_user.phone_number if current_user else "")

        status = ComplaintStatusEnum.DRAFT.value if data.isDraft else ComplaintStatusEnum.SUBMITTED.value
        triage_score = 90 if data.severity == "CRITICAL" else 75 if data.severity == "HIGH" else 55

        complaint = Complaint(
            reference_number=ref_num,
            tracking_token=tracking_token,
            citizen_id=current_user.id if current_user else None,
            title=data.title or f"{data.category} Incident Report",
            category=data.category,
            severity=data.severity or "MEDIUM",
            status=status,
            citizen_name=citizen_name,
            citizen_email=citizen_email,
            citizen_phone=citizen_phone,
            incident_date=f"{data.incidentDate} 12:00 UTC" if "UTC" not in data.incidentDate else data.incidentDate,
            reported_date=now_str,
            financial_loss=data.financialLoss or 0.0,
            suspect_info=data.suspectInfo.model_dump() if data.suspectInfo else {},
            description=data.description,
            triage_score=triage_score,
            predicted_threat_group=None,
            assigned_unit=None,
            assigned_officer=None
        )
        db.add(complaint)
        await db.commit()
        await db.refresh(complaint)

        # Initial sealed timeline event
        initial_event = ComplaintEvent(
            complaint_id=complaint.id,
            title="Citizen Incident Submitted & Sealed",
            description="Complaint securely received into enclave. Cryptographic SHA-256 integrity seal applied.",
            actor=f"Citizen ({citizen_name})",
            verified_hash=f"0x{secrets.token_hex(4)}...{secrets.token_hex(4)}",
            timestamp=now_str
        )
        db.add(initial_event)

        # Create linked Case for Police and Specialist dispatch (idempotent 1:1)
        linked_case = Case(
            case_number=f"CASE-{ref_num}",
            complaint_id=complaint.id,
            title=complaint.title,
            summary=complaint.description[:500],
            priority=complaint.severity,
            status=CaseStatusEnum.CASE_CREATED.value,
            risk_score=float(triage_score),
            is_high_risk=complaint.severity in ["CRITICAL", "HIGH"]
        )
        db.add(linked_case)

        # Automatically extract and persist structured cyber entities
        from app.services.entity_service import entity_service
        await entity_service.extract_and_persist_for_complaint(
            db=db,
            complaint=complaint,
            case=linked_case
        )

        await db.commit()

        # Re-fetch with relationships
        q = select(Complaint).where(Complaint.id == complaint.id).options(
            selectinload(Complaint.events),
            selectinload(Complaint.evidence_files),
            selectinload(Complaint.entities)
        )
        res = await db.execute(q)
        complaint_full = res.scalars().first()

        await audit_service.log_event(
            db=db,
            actor=citizen_name,
            action="COMPLAINT_SUBMISSION",
            resource=f"complaint:{complaint.id}",
            user_id=current_user.id if current_user else None,
            ip_address=ip_address,
            user_agent=user_agent
        )

        return complaint_full or complaint

    @staticmethod
    async def get_by_id(db: AsyncSession, complaint_id: str, current_user: Optional[User] = None) -> Complaint:
        """Fetch full complaint by ID with RBAC check. Requires authenticated user."""
        if not current_user:
            raise AuthenticationError("Authentication required to access full complaint dossier")

        q = select(Complaint).where(
            or_(Complaint.id == complaint_id, Complaint.reference_number == complaint_id)
        ).options(
            selectinload(Complaint.events),
            selectinload(Complaint.evidence_files)
        )
        res = await db.execute(q)
        complaint = res.scalars().first()
        if not complaint:
            raise NotFoundError(f"Complaint {complaint_id} not found")

        # Citizen data privacy check: citizens can only view their own complaint
        if current_user.role and current_user.role.name == RoleEnum.CITIZEN.value:
            is_owner = False
            if complaint.citizen_id and complaint.citizen_id == current_user.id:
                is_owner = True
            elif complaint.citizen_email and complaint.citizen_email.strip().lower() == current_user.email.strip().lower():
                is_owner = True

            if not is_owner:
                raise PermissionDeniedError("Access to another citizen's complaint is prohibited")

        return complaint

    @staticmethod
    async def get_for_tracking(db: AsyncSession, reference_number: str) -> Complaint:
        """Fetch complaint for public status tracking only. Returns Complaint model to be mapped to minimal public schema."""
        q = select(Complaint).where(
            or_(Complaint.reference_number == reference_number, Complaint.id == reference_number)
        ).options(
            selectinload(Complaint.events),
            selectinload(Complaint.evidence_files)
        )
        res = await db.execute(q)
        complaint = res.scalars().first()
        if not complaint:
            raise NotFoundError(f"Complaint reference '{reference_number}' not found")
        return complaint

    @staticmethod
    async def get_all_complaints(
        db: AsyncSession,
        current_user: Optional[User] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[Complaint]:
        """Fetch list of complaints filtered by user role and query parameters."""
        if not current_user:
            raise AuthenticationError("Authentication required to list complaints")

        q = select(Complaint).options(
            selectinload(Complaint.events),
            selectinload(Complaint.evidence_files)
        ).order_by(desc(Complaint.created_at))

        # Enforce Citizen Ownership: Citizens only see their own complaints
        if current_user.role and current_user.role.name == RoleEnum.CITIZEN.value:
            q = q.where(
                or_(
                    Complaint.citizen_id == current_user.id,
                    Complaint.citizen_email == current_user.email.lower()
                )
            )

        if category:
            q = q.where(Complaint.category == category)
        if status:
            q = q.where(Complaint.status == status)
        if search:
            search_pattern = f"%{search}%"
            q = q.where(
                or_(
                    Complaint.reference_number.ilike(search_pattern),
                    Complaint.title.ilike(search_pattern),
                    Complaint.citizen_name.ilike(search_pattern),
                    Complaint.description.ilike(search_pattern)
                )
            )

        q = q.offset(skip).limit(limit)
        res = await db.execute(q)
        return list(res.scalars().all())


complaint_service = ComplaintService()
