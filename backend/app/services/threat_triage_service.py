"""
Threat Triage Orchestration Service
Glues together:
- Server-Side Sensitive-Information Masking Module [5]
- Reliability-Gated AI and Heuristic Fallback Threat-Triage Engine [6]
- Case Queue Prioritization & Timeline Provenance Sealing
"""

from typing import Dict, Any, Optional
from datetime import datetime, timezone
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.case import Case
from app.models.complaint import Complaint
from app.models.complaint_event import ComplaintEvent
from app.services.server_side_masking_service import server_side_masking_service
from app.ai.adapters.threat_triage_engine import threat_triage_engine
from app.core.logging import logger


class ThreatTriageService:
    """
    Coordinates Server-Side Masking -> Reliability-Gated Triage Engine -> Case Queue Update.
    """

    @classmethod
    async def process_and_triage_narrative(
        cls,
        raw_narrative: str,
        financial_loss: float = 0.0,
        incident_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Pure pipeline execution:
        1. Masking Module [5] redacts sensitive identity and credentials.
        2. Delivers masked payload to Threat Triage Engine [6].
        3. Triage Engine evaluates Readiness Gate and routes to Neural or Heuristic execution.
        4. Returns provenance-tagged result.
        """
        # Step 1: Server-Side Sensitive-Information Masking Module [5]
        masked_payload = server_side_masking_service.mask_complaint_narrative(
            raw_narrative=raw_narrative,
            preserve_iocs=True
        )

        # Step 2: Masked Payload Delivery to Reliability-Gated Triage Engine [6]
        triage_result = threat_triage_engine.triage_masked_payload(
            masked_payload=masked_payload,
            financial_loss=financial_loss,
            incident_date=incident_date
        )

        # Embed masking payload delivery metadata into top-level response
        triage_result["masked_payload_delivery"] = {
            "is_masked": masked_payload["is_masked"],
            "redaction_counts": masked_payload["redaction_counts"],
            "preserved_indicators_count": len(masked_payload["preserved_indicators"]),
            "masking_module": masked_payload["masking_metadata"]["module"],
            "masked_narrative": masked_payload["masked_narrative"]
        }

        return triage_result

    @classmethod
    async def triage_complaint_and_update_case(
        cls,
        db: AsyncSession,
        complaint_id: str,
        actor_name: str = "Astraea Threat-Triage Engine [6]"
    ) -> Dict[str, Any]:
        """
        Executes end-to-end triage on an existing complaint in the database:
        1. Retrieves complaint narrative.
        2. Masks narrative with Module [5].
        3. Triages masked narrative with Engine [6].
        4. Updates Case priority, risk_score, and triage queue rank.
        5. Updates Complaint triage_score and severity.
        6. Seals a timeline event with transparent provenance.
        """
        q = select(Complaint).where(Complaint.id == complaint_id).options(
            selectinload(Complaint.case),
            selectinload(Complaint.events)
        )
        res = await db.execute(q)
        complaint = res.scalar_one_or_none()
        if not complaint:
            raise ValueError(f"Complaint {complaint_id} not found.")

        raw_narrative = f"{complaint.title}\n{complaint.description or ''}"
        triage_result = await cls.process_and_triage_narrative(
            raw_narrative=raw_narrative,
            financial_loss=complaint.financial_loss or 0.0,
            incident_date=complaint.incident_date
        )

        # Update Complaint fields
        complaint.triage_score = triage_result["triage_score"]
        complaint.severity = triage_result["priority"]
        # Update category if triage classified a recognized category with high confidence
        if triage_result.get("category_confidence", 0) >= 0.70 and triage_result.get("threat_category"):
            complaint.category = triage_result["threat_category"]

        # Update or create linked Case for Case Queue Prioritization [8]
        case = complaint.case
        if not case:
            case_q = select(Case).where(Case.complaint_id == complaint.id)
            case_res = await db.execute(case_q)
            case = case_res.scalar_one_or_none()

        if case:
            case.priority = triage_result["priority"]
            case.risk_score = float(triage_result["triage_score"])
            case.is_high_risk = triage_result["is_high_risk"]
            case.updated_at = datetime.now(timezone.utc)
            logger.info(
                f"[ThreatTriageService] Case {case.case_number} priority queue updated: "
                f"Priority={case.priority}, RiskScore={case.risk_score}, Mode={triage_result['execution_mode']}"
            )

        # Append sealed timeline event documenting provenance
        exec_mode = triage_result["execution_mode"]
        redaction_summary = triage_result["masked_payload_delivery"]["redaction_counts"]
        redaction_str = ", ".join(f"{k}: {v}" for k, v in redaction_summary.items() if v > 0) or "None (Clean)"

        timeline_event = ComplaintEvent(
            complaint_id=complaint.id,
            title=f"Forensic Threat Triage Executed ({exec_mode})",
            description=(
                f"Server-Side Masking [5] redacted sensitive items ({redaction_str}). "
                f"Reliability-Gated Triage Engine [6] executed in mode: {exec_mode}. "
                f"Readiness Gate: {triage_result['readiness_gate']['status']}. "
                f"Assigned Priority: {triage_result['priority']} (Triage Score: {triage_result['triage_score']}/100, "
                f"Category: {triage_result['threat_category']}). Priority queue updated."
            ),
            actor=actor_name,
            verified_hash=None,
            timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        )
        db.add(timeline_event)

        await db.commit()

        return {
            "status": "SUCCESS",
            "complaint_id": complaint.id,
            "case_id": case.id if case else None,
            "case_number": case.case_number if case else None,
            "triage_result": triage_result
        }


threat_triage_service = ThreatTriageService()
