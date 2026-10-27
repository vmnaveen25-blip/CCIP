"""
Threat Triage API Router
Exposes:
- POST /api/v1/triage/evaluate: Full Masked Payload Delivery + Readiness Gate + Triage Execution + Provenance Tagging
- GET /api/v1/triage/readiness: Live inspection of Neural Provisioned, Loaded, and Responsive Gates
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.core.permissions import get_current_user, require_staff
from app.services.threat_triage_service import threat_triage_service
from app.ai.adapters.threat_triage_engine import threat_triage_engine

router = APIRouter(prefix="/triage", tags=["Threat Triage Engine"])


class TriageEvaluationRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw complaint narrative to be masked and triaged")
    financial_loss: Optional[float] = Field(0.0, ge=0.0, description="Reported financial loss amount in INR")
    incident_date: Optional[str] = Field(None, description="Reported incident timestamp")


@router.post("/evaluate", summary="Execute Server-Side Masked Threat Triage with Provenance Tagging")
async def evaluate_threat_triage(
    req: TriageEvaluationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Evaluates incident narrative through:
    1. Server-Side Masking Module [5]: Redacts sensitive citizen PII & credentials.
    2. Masked Payload Delivery: Forwards redacted narrative to Threat-Triage Engine [6].
    3. Readiness Gate Evaluation: Checks provisioned, loaded, and responsive neural status.
    4. Neural or Heuristic Execution: Predicts threat category and priority.
    5. Provenance Tagging: Tags execution mode (NEURAL vs. HEURISTIC_FALLBACK) for transparent oversight.
    """
    clean_text = req.text.strip()
    if not clean_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Complaint narrative cannot be empty."
        )

    result = await threat_triage_service.process_and_triage_narrative(
        raw_narrative=clean_text,
        financial_loss=req.financial_loss or 0.0,
        incident_date=req.incident_date
    )
    return result


@router.get("/readiness", summary="Inspect Threat-Triage Neural Readiness Gate Status")
async def get_triage_readiness(
    current_user: User = Depends(get_current_user)
):
    """
    Readiness Gate Evaluation:
    Inspects whether neural model weights are provisioned, loaded, and responsive.
    Reports real-time gate diagnostics (PASS_NEURAL_READY vs DEGRADED_HEURISTIC_ACTIVE).
    """
    readiness = threat_triage_engine.evaluate_readiness_gate(force_refresh=True)
    return {
        "engine_name": threat_triage_engine.ENGINE_NAME,
        "engine_version": threat_triage_engine.ENGINE_VERSION,
        "readiness_gate": readiness
    }
