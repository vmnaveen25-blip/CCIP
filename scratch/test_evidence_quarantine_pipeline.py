import sys
import os
sys.path.insert(0, os.path.abspath('backend'))

import asyncio
import io
import hashlib
from fastapi import UploadFile
from sqlalchemy import select

from app.db.session import AsyncSessionLocal as async_session_factory
from app.models.complaint import Complaint
from app.models.user import User
from app.models.role import Role, RoleEnum
from app.models.evidence import Evidence
from app.services.evidence_service import evidence_service
from app.services.storage_service import storage_service
from app.services.malware_service import malware_scanner
from app.core.exceptions import ValidationError, PermissionDeniedError


async def run_pipeline_test():
    print("=" * 60)
    print("TESTING EVIDENCE INTAKE, QUARANTINE & DISPOSITION PIPELINE")
    print("=" * 60)

    from app.db.database import async_engine
    from app.db.base import Base
    import app.models.user
    import app.models.role
    import app.models.complaint
    import app.models.case
    import app.models.evidence
    import app.models.evidence_hash
    import app.models.evidence_metadata
    import app.models.evidence_access_log
    import app.models.document_processing
    import app.models.audit_log

    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as db:
        # 1. Setup test complaint and investigator user
        comp_q = select(Complaint).limit(1)
        res = await db.execute(comp_q)
        complaint = res.scalars().first()

        if not complaint:
            complaint = Complaint(
                title="Test Financial Fraud Incident",
                description="Testing evidence upload and quarantine pipeline",
                category="Financial Fraud",
                reference_number="CCIP/2026/FIN-9999",
                tracking_token="CCIP-TEST-TOKEN-123456",
                citizen_name="Naveen Kumar",
                citizen_email="naveen.citizen@gov.in",
                incident_date="2026-10-27 10:00 UTC",
                reported_date="2026-10-27 10:30 UTC"
            )
            db.add(complaint)
            await db.commit()
            await db.refresh(complaint)
        print(f"Using test complaint: ID={complaint.id}, Reference={complaint.reference_number}")

        # Ensure investigator and forensic roles exist
        police_role_q = select(Role).where(Role.name == RoleEnum.CYBERCRIME_POLICE.value)
        pres = await db.execute(police_role_q)
        police_role = pres.scalars().first()
        if not police_role:
            police_role = Role(
                name=RoleEnum.CYBERCRIME_POLICE.value,
                display_name="Cybercrime Police Officer",
                description="Law enforcement case investigator"
            )
            db.add(police_role)
            await db.commit()
            await db.refresh(police_role)

        forensic_role_q = select(Role).where(Role.name == RoleEnum.CYBERSECURITY_SPECIALIST.value)
        fres = await db.execute(forensic_role_q)
        forensic_role = fres.scalars().first()
        if not forensic_role:
            forensic_role = Role(
                name=RoleEnum.CYBERSECURITY_SPECIALIST.value,
                display_name="Cybersecurity Specialist",
                description="Forensics and malware reverse engineering"
            )
            db.add(forensic_role)
            await db.commit()
            await db.refresh(forensic_role)

        # Investigator user
        user_q = select(User).where(User.email == "investigator.raj@police.gov.in")
        ures = await db.execute(user_q)
        user = ures.scalars().first()
        if not user:
            user = User(
                email="investigator.raj@police.gov.in",
                full_name="Inspector Raj Sharma",
                badge_number="CCIP-INSP-402",
                clearance_level="LAW ENFORCEMENT TIER 2",
                role_id=police_role.id,
                is_active=True,
                is_verified=True,
                is_staff=True
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        # Forensic specialist user
        forensic_q = select(User).where(User.email == "forensics.maya@cert.gov.in")
        fures = await db.execute(forensic_q)
        forensic_user = fures.scalars().first()
        if not forensic_user:
            forensic_user = User(
                email="forensics.maya@cert.gov.in",
                full_name="Forensic Analyst Maya Sen",
                badge_number="CERT-FOR-901",
                clearance_level="SPECIALIST TIER 3",
                role_id=forensic_role.id,
                is_active=True,
                is_verified=True,
                is_staff=True
            )
            db.add(forensic_user)
            await db.commit()
            await db.refresh(forensic_user)

        # ---------------------------------------------------------
        # STAGE 1 & 2: Constraint Validation
        # ---------------------------------------------------------
        print("\n--- STAGE 1 & 2: Validating constraints (MIME/Extension/Size) ---")
        
        # Test disallowed extension
        bad_file = UploadFile(filename="malicious_payload.exe", file=io.BytesIO(b"binary data"))
        try:
            await evidence_service.upload_evidence(
                db=db,
                complaint_id=complaint.id,
                file=bad_file,
                tracking_token=complaint.tracking_token
            )
            print("[FAIL] Disallowed extension check FAILED (should have rejected .exe)")
        except ValidationError as e:
            print(f"[PASS] Disallowed extension correctly rejected: {e.detail}")

        # Test empty file
        empty_file = UploadFile(filename="empty_doc.txt", file=io.BytesIO(b""))
        try:
            await evidence_service.upload_evidence(
                db=db,
                complaint_id=complaint.id,
                file=empty_file,
                tracking_token=complaint.tracking_token
            )
            print("[FAIL] Empty file check FAILED (should have rejected empty payload)")
        except ValidationError as e:
            print(f"[PASS] Empty file correctly rejected: {e.detail}")

        # ---------------------------------------------------------
        # STAGE 1, 3, 4, 5: Clean Evidence Upload & Disposition
        # ---------------------------------------------------------
        print("\n--- STAGE 1, 3, 4, 5: Clean Evidence Ingestion & Disposition ---")
        clean_content = b"Transaction Slip Ref: TXN-9988221, Amount: Rs 45,000 sent to cyber fraudster VPA"
        expected_sha = hashlib.sha256(clean_content).hexdigest()

        clean_file = UploadFile(filename="transaction_receipt.txt", file=io.BytesIO(clean_content))
        clean_ev = await evidence_service.upload_evidence(
            db=db,
            complaint_id=complaint.id,
            file=clean_file,
            tracking_token=complaint.tracking_token,
            current_user=user
        )

        print(f"[PASS] Clean Evidence Uploaded: ID={clean_ev.id}")
        print(f"  - Original Filename: {clean_ev.original_filename}")
        print(f"  - Storage Key: {clean_ev.storage_key} (Clean folder: {'evidence/' in clean_ev.storage_key})")
        print(f"  - SHA-256 Digest: {clean_ev.sha256_hash}")
        assert clean_ev.sha256_hash == expected_sha, "SHA-256 calculation mismatch!"
        print(f"  - Integrity Digest Verified: matches {expected_sha}")
        print(f"  - Malware Scan Status: {clean_ev.malware_scan_status}")
        assert clean_ev.malware_scan_status == "CLEAN", "Malware scan should be CLEAN"
        print(f"  - Is Verified (Disposition): {clean_ev.is_verified}")
        assert clean_ev.is_verified is True, "Clean file must be marked verified"
        print(f"  - Integrity Status: {clean_ev.integrity_status}")

        # Verify investigator access to clean file
        ev_rec, file_bytes = await evidence_service.get_evidence_file(
            db=db,
            evidence_id=clean_ev.id,
            current_user=user
        )
        assert file_bytes == clean_content, "Retrieved file bytes mismatch!"
        print("[PASS] Verified clean file successfully accessible to investigator")

        # ---------------------------------------------------------
        # STAGE 2, 3, 4, 5: Quarantine Isolation for Flagged Malware
        # ---------------------------------------------------------
        print("\n--- STAGE 2, 3, 4, 5: Malware Detection, Quarantine Isolation & Restricted Disposition ---")
        eicar_signature = b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"
        infected_content = b"Header info\n" + eicar_signature + b"\nFooter info"
        infected_sha = hashlib.sha256(infected_content).hexdigest()

        infected_file = UploadFile(filename="suspicious_attachment.txt", file=io.BytesIO(infected_content))
        quarantined_ev = await evidence_service.upload_evidence(
            db=db,
            complaint_id=complaint.id,
            file=infected_file,
            tracking_token=complaint.tracking_token,
            current_user=user
        )

        print(f"[PASS] Flagged Evidence Uploaded to Quarantine: ID={quarantined_ev.id}")
        print(f"  - Storage Key: {quarantined_ev.storage_key} (Quarantine folder: {'quarantine/' in quarantined_ev.storage_key})")
        assert "quarantine/" in quarantined_ev.storage_key, "Infected payload must be stored in quarantine folder!"
        print(f"  - SHA-256 Digest: {quarantined_ev.sha256_hash}")
        assert quarantined_ev.sha256_hash == infected_sha, "Infected SHA-256 mismatch!"
        print(f"  - Malware Scan Status: {quarantined_ev.malware_scan_status}")
        assert quarantined_ev.malware_scan_status == "INFECTED", "Malware scan must detect INFECTED!"
        print(f"  - Is Verified (Disposition): {quarantined_ev.is_verified}")
        assert quarantined_ev.is_verified is False, "Quarantined file must NOT be marked verified!"
        print(f"  - Integrity Status: {quarantined_ev.integrity_status}")

        # Test Access Control Disposition on Quarantined File
        # 1. Standard investigator should be blocked with PermissionDeniedError
        try:
            await evidence_service.get_evidence_file(
                db=db,
                evidence_id=quarantined_ev.id,
                current_user=user
            )
            print("[FAIL] Standard investigator should have been denied access to quarantined file!")
            assert False, "Quarantine protection bypassed!"
        except PermissionDeniedError as pe:
            print(f"[PASS] Standard investigator correctly blocked from quarantined malware: {pe.detail}")

        # 2. Forensic specialist is authorized to retrieve the quarantined payload for analysis
        q_rec, q_bytes = await evidence_service.get_evidence_file(
            db=db,
            evidence_id=quarantined_ev.id,
            current_user=forensic_user
        )
        assert q_bytes == infected_content, "Retrieved quarantined file bytes mismatch!"
        print("[PASS] Authorized forensic specialist successfully retrieved quarantined file for analysis")

        print("\n" + "=" * 60)
        print("ALL 5 EVIDENCE INGESTION & QUARANTINE PIPELINE STAGES PASSED!")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_pipeline_test())
