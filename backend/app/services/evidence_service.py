import os
import re
import datetime
import mimetypes
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import UploadFile

from app.models.evidence import Evidence
from app.models.evidence_metadata import EvidenceMetadata
from app.models.evidence_hash import EvidenceHash
from app.models.evidence_access_log import EvidenceAccessLog
from app.models.complaint import Complaint
from app.models.user import User
from app.models.role import RoleEnum
from app.services.storage_service import storage_service
from app.services.audit_service import audit_service
from app.services.malware_service import malware_scanner
from app.core.exceptions import NotFoundError, PermissionDeniedError, ValidationError, AuthenticationError
from app.core.logging import logger
from app.services.document_processor_service import document_processor

ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "webp", "docx", "doc", "txt", "json", "zip", "csv", "log", "pcap", "pcapng"}
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal and unsafe character execution."""
    clean = os.path.basename(filename)
    clean = re.sub(r'[^a-zA-Z0-9_.-]', '_', clean)
    return clean[:200] if clean else "evidence_file.bin"


class EvidenceService:
    @staticmethod
    async def upload_evidence(
        db: AsyncSession,
        complaint_id: str,
        file: UploadFile,
        tracking_token: Optional[str] = None,
        parent_evidence_id: Optional[str] = None,
        current_user: Optional[User] = None,
        ip_address: Optional[str] = "127.0.0.1",
        user_agent: Optional[str] = None
    ) -> Evidence:
        """Process and store uploaded evidence with SHA-256 submission integrity seal."""
        # Verify complaint exists
        q = select(Complaint).where(Complaint.id == complaint_id).options(selectinload(Complaint.case))
        res = await db.execute(q)
        complaint = res.scalars().first()
        if not complaint:
            raise NotFoundError(f"Complaint {complaint_id} not found")

        # Strict authorization: Authenticated user with permission OR valid high-entropy complaint tracking token
        if current_user:
            role_name = current_user.role.name if current_user.role else ""
            if role_name == RoleEnum.CITIZEN.value:
                is_owner = (complaint.citizen_id and complaint.citizen_id == current_user.id) or (
                    complaint.citizen_email and complaint.citizen_email.lower() == current_user.email.lower()
                )
                if not is_owner:
                    raise PermissionDeniedError("Cannot upload evidence to another citizen's case")
            elif role_name == RoleEnum.AI_ML_SYSTEM_LEAD.value:
                raise PermissionDeniedError("AI/ML System Lead role is not authorized to upload operational evidence")
            elif role_name not in (RoleEnum.CYBERSECURITY_SPECIALIST.value, RoleEnum.CYBERCRIME_POLICE.value, RoleEnum.ADMIN.value):
                raise PermissionDeniedError("Unauthorized role for evidence upload")
        else:
            # Anonymous / guest upload requires valid complaint tracking_token
            if not tracking_token or not complaint.tracking_token or tracking_token.strip() != complaint.tracking_token.strip():
                raise AuthenticationError("Authentication or valid complaint tracking token required to attach evidence to this complaint")

        raw_filename = file.filename or "evidence_file"
        filename = sanitize_filename(raw_filename)
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise ValidationError(f"File extension '.{ext}' is not permitted. Allowed extensions: {sorted(list(ALLOWED_EXTENSIONS))}")

        content = await file.read()
        if not content:
            raise ValidationError("Cannot upload empty file")
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise ValidationError("File exceeds maximum permissible size of 50 MB")

        # Scan for malware
        scan_status, scan_details = await malware_scanner.scan_bytes(content, filename)
        if scan_status == "INFECTED":
            raise ValidationError(f"File upload rejected: security engine detected threat signatures ({scan_details})")

        is_verified = (scan_status == "CLEAN")
        integrity_status = "Submission Integrity Recorded" if is_verified else f"Quarantined: Malware Scan {scan_status}"

        # Save to storage
        storage_key, sha256_hash, file_size_bytes, formatted_size = await storage_service.save_file(
            file_content=content,
            original_filename=filename
        )

        mime_type = file.content_type or mimetypes.guess_type(filename)[0] or "application/octet-stream"

        # Determine version
        version = 1
        if parent_evidence_id:
            parent_q = select(Evidence).where(Evidence.id == parent_evidence_id)
            parent_res = await db.execute(parent_q)
            parent_ev = parent_res.scalars().first()
            if parent_ev:
                version = (parent_ev.version or 1) + 1

        evidence = Evidence(
            complaint_id=complaint.id,
            case_id=complaint.case.id if complaint.case is not None else None,
            uploaded_by_user_id=current_user.id if current_user else None,
            original_filename=filename,
            mime_type=mime_type,
            file_size_bytes=file_size_bytes,
            file_size_formatted=formatted_size,
            storage_key=storage_key,
            sha256_hash=sha256_hash,
            integrity_status=integrity_status,
            is_verified=is_verified,
            version=version,
            parent_evidence_id=parent_evidence_id,
            malware_scan_status=scan_status
        )
        db.add(evidence)
        await db.commit()
        await db.refresh(evidence)

        # Add metadata & hash records
        meta = EvidenceMetadata(
            evidence_id=evidence.id,
            file_extension=ext,
            custom_tags=["citizen_upload", "sha256_sealed", f"malware_{scan_status.lower()}"]
        )
        db.add(meta)

        ev_hash = EvidenceHash(
            evidence_id=evidence.id,
            hash_algorithm="SHA-256",
            hash_value=sha256_hash
        )
        db.add(ev_hash)
        await db.commit()

        # Audit log
        await audit_service.log_event(
            db=db,
            actor=current_user.full_name if current_user else "Citizen Self-Service (Token Verified)",
            action="EVIDENCE_UPLOAD",
            resource=f"evidence:{evidence.id} ({filename} v{version})",
            clearance=current_user.clearance_level if current_user else "CITIZEN TIER",
            user_id=current_user.id if current_user else None,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={"sha256": sha256_hash, "file_size": formatted_size, "version": version, "verified": is_verified}
        )

        # Trigger document processing pipeline ONLY if clean (unscanned or quarantined files are held safely)
        if is_verified:
            try:
                await document_processor.process_evidence(db=db, evidence_id=evidence.id)
            except Exception as e:
                logger.error(f"Automated document processing failed for evidence {evidence.id}: {e}", exc_info=True)

        return evidence

    @staticmethod
    async def get_evidence_file(
        db: AsyncSession,
        evidence_id: str,
        current_user: Optional[User] = None,
        ip_address: Optional[str] = "127.0.0.1",
        user_agent: Optional[str] = None
    ) -> Tuple[Evidence, bytes]:
        """Fetch evidence record and its raw binary bytes, logging access in audit trail."""
        if not current_user:
            raise AuthenticationError("Authentication required to access evidence files")

        q = select(Evidence).where(Evidence.id == evidence_id)
        res = await db.execute(q)
        evidence = res.scalars().first()
        if not evidence:
            raise NotFoundError("Evidence record not found")

        # Role privacy checks
        if current_user and current_user.role:
            role_name = current_user.role.name
            if role_name == RoleEnum.AI_ML_SYSTEM_LEAD.value:
                raise PermissionDeniedError("AI/ML System Lead role is not authorized to download raw evidentiary files")
            elif role_name == RoleEnum.CITIZEN.value:
                is_owner = False
                if evidence.uploaded_by_user_id and evidence.uploaded_by_user_id == current_user.id:
                    is_owner = True
                elif evidence.complaint_id:
                    comp_q = select(Complaint).where(Complaint.id == evidence.complaint_id)
                    comp_res = await db.execute(comp_q)
                    comp = comp_res.scalars().first()
                    if comp and (comp.citizen_id == current_user.id or (comp.citizen_email and comp.citizen_email.lower() == current_user.email.lower())):
                        is_owner = True
                if not is_owner:
                    raise PermissionDeniedError("Unauthorized access to evidence vault item")

        # Log access
        access_log = EvidenceAccessLog(
            evidence_id=evidence.id,
            accessed_by_user_id=current_user.id if current_user else None,
            action_type="DOWNLOAD",
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(access_log)
        await db.commit()

        file_bytes = await storage_service.get_file_bytes(evidence.storage_key)

        # Recalculate SHA-256 integrity verification
        import hashlib
        calculated_sha = hashlib.sha256(file_bytes).hexdigest()
        if calculated_sha.lower() != evidence.sha256_hash.lower():
            logger.critical(
                f"INTEGRITY MISMATCH DETECTED for evidence {evidence.id}! "
                f"Expected: {evidence.sha256_hash}, Found: {calculated_sha}"
            )
            evidence.integrity_status = "INTEGRITY_MISMATCH"
            evidence.is_verified = False
            await db.commit()
            await audit_service.log_event(
                db=db,
                actor="SYSTEM_INTEGRITY_MONITOR",
                action="EVIDENCE_TAMPERING_DETECTED",
                resource=f"evidence:{evidence.id}",
                clearance="SYSTEM",
                user_id=current_user.id if current_user else None,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={"expected_sha": evidence.sha256_hash, "calculated_sha": calculated_sha}
            )
            raise ValidationError("Evidentiary integrity check failed: stored binary checksum mismatch.")

        return evidence, file_bytes


evidence_service = EvidenceService()
