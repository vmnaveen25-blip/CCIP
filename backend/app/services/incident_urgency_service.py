"""
Incident Urgency Service
Evaluates narrative urgency for complaints and cases.
Advisory triage signal only; requires human investigator review.
"""

from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.case import Case
from app.models.complaint import Complaint
from app.ai.adapters.incident_urgency import incident_urgency_adapter
from app.core.logging import logger


class IncidentUrgencyService:
    @staticmethod
    async def evaluate_complaint_urgency(db: AsyncSession, complaint_id: str) -> Dict[str, Any]:
        stmt = select(Complaint).where(Complaint.id == complaint_id)
        res = await db.execute(stmt)
        complaint = res.scalar_one_or_none()
        if not complaint:
            return {"error": f"Complaint {complaint_id} not found."}

        text = f"{complaint.title}\n{complaint.description or ''}"
        urgency_result = incident_urgency_adapter.predict_urgency(text)
        return {
            "complaint_id": complaint_id,
            "complaint_number": complaint.complaint_number,
            **urgency_result
        }

    @staticmethod
    async def evaluate_case_urgency(db: AsyncSession, case_id: str) -> Dict[str, Any]:
        stmt = select(Case).where(Case.id == case_id)
        res = await db.execute(stmt)
        case = res.scalar_one_or_none()
        if not case:
            return {"error": f"Case {case_id} not found."}

        text = f"{case.title}\n{case.summary or ''}"
        urgency_result = incident_urgency_adapter.predict_urgency(text)
        return {
            "case_id": case_id,
            "case_number": case.case_number,
            **urgency_result
        }


incident_urgency_service = IncidentUrgencyService()
