"""
Citizen AI Assistant API Router
Provides public pre-incident threat analysis and portal assistance.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.services.citizen_assistant_service import citizen_assistant_service
from app.core.logging import logger

router = APIRouter(prefix="/ai/citizen", tags=["Citizen AI Assistant"])


class CitizenAssistRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000, description="URL, SMS message, Email body, or portal question")
    query_type: str = Field("auto", description="auto, url, sms, email, portal_help")


@router.post("/assist")
async def assist_citizen(payload: CitizenAssistRequest):
    """
    Public pre-incident threat analysis and portal guidance endpoint.
    Routes to local enclave models (url_phishing, sms_spam, email_threat) or portal guidance.
    """
    result = citizen_assistant_service.assist_citizen(payload.content, query_type=payload.query_type)
    if not result.get("success", False):
        raise HTTPException(status_code=400, detail=result.get("error", "Analysis failed."))
    return result
