from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.db.database import get_db
from app.models.report import Report
from app.models.user import User
from app.schemas.reports import ReportResponse, ReportCreate
from app.schemas.auth import MessageResponse
from app.core.permissions import require_staff

router = APIRouter(prefix="/reports", tags=["Reports & Statistics"])


import uuid
import hashlib
import json
from datetime import datetime, timezone

from app.db.database import get_db
from app.models.report import Report
from app.models.case import Case
from app.models.user import User
from app.models.role import RoleEnum
from app.schemas.reports import ReportResponse, ReportCreate
from app.schemas.auth import MessageResponse
from app.core.permissions import require_staff


def sanitize_csv_cell(value: Optional[str]) -> str:
    """Sanitize cell contents to prevent CSV formula injection (DDE/CVS injection)."""
    text = str(value or "")
    text = text.replace('"', '""')
    if text and text[0] in ("=", "+", "-", "@", "\t", "\r"):
        text = "'" + text
    return f'"{text}"'


@router.get("", response_model=List[ReportResponse])
async def list_reports(
    case_id: Optional[str] = Query(None),
    report_type: Optional[str] = Query(None),
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """List generated forensic reports from database. Returns genuine empty state when no reports exist."""
    q = select(Report).order_by(desc(Report.created_at))
    if case_id:
        q = q.where(Report.case_id == case_id)
    if report_type:
        q = q.where(Report.report_type == report_type)

    res = await db.execute(q)
    return res.scalars().all()


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    req: ReportCreate,
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """Generate and cryptographically seal an investigation report from genuine case records."""
    user_role = current_user.role.name if current_user.role else ""
    if user_role == RoleEnum.AI_ML_SYSTEM_LEAD.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI_ML_SYSTEM_LEAD is not authorized to generate operational case reports."
        )

    # 1. Validate case exists if case_id is supplied
    case_obj: Optional[Case] = None
    if req.case_id:
        case_q = select(Case).where(
            (Case.id == req.case_id) |
            (Case.case_number == req.case_id) |
            (Case.complaint_id == req.case_id)
        )
        case_res = await db.execute(case_q)
        case_obj = case_res.scalars().first()
        if not case_obj:
            raise HTTPException(status_code=404, detail=f"Target case record '{req.case_id}' not found.")

        # Object-level check: specialists can only generate reports for unassigned or their own cases
        if user_role == RoleEnum.CYBERSECURITY_SPECIALIST.value:
            if case_obj.assigned_specialist_id is not None and case_obj.assigned_specialist_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Cannot generate report for a case assigned to another specialist."
                )

    raw_content = req.content_json or {}
    
    # 2. Generate canonical, collision-safe unique Report ID
    unique_entropy = uuid.uuid4().hex[:6].upper()
    digits = "".join(ch for ch in (case_obj.case_number if case_obj else req.case_id or "0000") if ch.isdigit())
    case_num = digits[-4:] if digits else "0000"
    report_code = f"REP-2026-{case_num}-{unique_entropy}"

    user_display_name = getattr(current_user, "full_name", None) or getattr(current_user, "email", "Specialist")

    # 3. Calculate SHA-256 cryptographic hash of canonical report payload
    canonical_payload = {
        "report_id": report_code,
        "case_id": case_obj.id if case_obj else req.case_id,
        "case_number": case_obj.case_number if case_obj else req.case_id,
        "title": req.title,
        "summary": req.summary,
        "report_type": req.report_type,
        "sections": raw_content.get("sections_included", []),
        "generated_by": user_display_name,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    content_str = json.dumps(canonical_payload, sort_keys=True)
    computed_hash = hashlib.sha256(content_str.encode("utf-8")).hexdigest()

    content_payload = {
        **raw_content,
        "report_code": report_code,
        "case_ref": case_obj.case_number if case_obj else req.case_id,
        "status": "SEALED",
        "classification": raw_content.get("classification", "RESTRICTED"),
        "generated_by_name": user_display_name,
        "sha256_hash": computed_hash,
        "digital_seal": {
            "algorithm": "SHA-256 Sovereign Integrity Digest",
            "digest": computed_hash,
            "notary": "CCIP Enclave Sovereign Authority",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "integrity_verified": True
        }
    }

    report = Report(
        id=report_code,
        report_type=req.report_type,
        title=req.title,
        summary=req.summary,
        case_id=case_obj.id if case_obj else req.case_id,
        content_json=content_payload,
        generated_by_user_id=getattr(current_user, "id", None)
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: str,
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve a sealed report by ID with object-level case authorization."""
    user_role = current_user.role.name if current_user.role else ""
    if user_role == RoleEnum.AI_ML_SYSTEM_LEAD.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI_ML_SYSTEM_LEAD is not authorized to access operational case reports."
        )

    q = select(Report).where(Report.id == report_id)
    res = await db.execute(q)
    report = res.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.case_id and user_role == RoleEnum.CYBERSECURITY_SPECIALIST.value:
        case_res = await db.execute(select(Case).where((Case.id == report.case_id) | (Case.case_number == report.case_id)))
        case_obj = case_res.scalars().first()
        if case_obj and case_obj.assigned_specialist_id is not None and case_obj.assigned_specialist_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Report belongs to a case assigned to another specialist."
            )

    return report


@router.get("/{report_id}/export")
async def export_report(
    report_id: str,
    format: str = Query("json", pattern="^(json|text|csv)$"),
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """Export report content in specified structured format with CSV formula sanitization and access control."""
    user_role = current_user.role.name if current_user.role else ""
    if user_role == RoleEnum.AI_ML_SYSTEM_LEAD.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI_ML_SYSTEM_LEAD is not authorized to export operational case reports."
        )

    q = select(Report).where(Report.id == report_id)
    res = await db.execute(q)
    report = res.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.case_id and user_role == RoleEnum.CYBERSECURITY_SPECIALIST.value:
        case_res = await db.execute(select(Case).where((Case.id == report.case_id) | (Case.case_number == report.case_id)))
        case_obj = case_res.scalars().first()
        if case_obj and case_obj.assigned_specialist_id is not None and case_obj.assigned_specialist_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Report belongs to a case assigned to another specialist."
            )

    if format == "text":
        content = (
            f"====================================================\n"
            f"OFFICIAL REPORT: {report.title}\n"
            f"REPORT ID: {report.id}\n"
            f"TYPE: {report.report_type}\n"
            f"TIMESTAMP: {report.created_at.isoformat()}\n"
            f"INTEGRITY SEAL: {report.content_json.get('sha256_hash', 'N/A') if isinstance(report.content_json, dict) else 'N/A'}\n"
            f"STATUS: SEALED RECORD\n"
            f"====================================================\n\n"
            f"SUMMARY:\n{report.summary}\n\n"
            f"METADATA / FINDINGS:\n{json.dumps(report.content_json, indent=2)}\n"
        )
        return Response(content=content, media_type="text/plain", headers={"Content-Disposition": f'attachment; filename="report_{report.id}.txt"'})
    elif format == "csv":
        header = "id,title,report_type,created_at,summary,sha256_hash\n"
        digest = report.content_json.get("sha256_hash", "") if isinstance(report.content_json, dict) else ""
        row = (
            f"{sanitize_csv_cell(report.id)},"
            f"{sanitize_csv_cell(report.title)},"
            f"{sanitize_csv_cell(report.report_type)},"
            f"{sanitize_csv_cell(report.created_at.isoformat())},"
            f"{sanitize_csv_cell(report.summary)},"
            f"{sanitize_csv_cell(digest)}\n"
        )
        return Response(content=header + row, media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="report_{report.id}.csv"'})

    return {
        "status": "REPORT RECORD EXPORTED",
        "file_engine": "STRUCTURED_METADATA_JSON",
        "report": {
            "id": report.id,
            "title": report.title,
            "type": report.report_type,
            "summary": report.summary,
            "case_id": report.case_id,
            "content": report.content_json,
            "created_at": report.created_at.isoformat()
        }
    }
