"""
Pydantic Schemas for Citizen Complaint Lifecycle & Status Timeline
Enforces strict citizen data isolation and zero leakage of internal intelligence.
"""

from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class TimelineStageItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    stage: str = Field(..., description="Stage identifier e.g. COMPLAINT_SUBMITTED")
    title: str = Field(..., description="Human-readable stage title")
    description: str = Field(..., description="Citizen-friendly description")
    state: str = Field(..., description="COMPLETED | CURRENT | PENDING | CANCELLED | REOPENED")
    timestamp: Optional[str] = Field(None, description="Formatted timestamp if available")
    details: Optional[str] = Field(None, description="Optional expandable detail")
    integrity_seal: Optional[str] = Field(None, description="e.g. SHA-256 Integrity Seal Verified")


class ProgressSchema(BaseModel):
    completed: int
    total: int


class EvidenceSummarySchema(BaseModel):
    count: int
    integrity_status: str  # "VERIFIED" | "PENDING" | "NO_EVIDENCE"
    integrity_label: str   # "SHA-256 Integrity Seal Verified" | "Integrity Verification Pending" | "No Evidence Attached"


class AllowedActionsSchema(BaseModel):
    view_details: bool = True
    add_evidence: bool = True
    view_evidence: bool = True
    contact_support: bool = True
    add_evidence_disabled_reason: Optional[str] = None


class CitizenTimelineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    complaint_id: str
    complaint_reference: str
    case_reference: Optional[str] = None
    current_status: str
    current_status_display: str
    submitted_at: str
    updated_at: str
    progress: ProgressSchema
    timeline: List[TimelineStageItem]
    evidence_summary: EvidenceSummarySchema
    latest_update: str
    is_cancelled: bool = False
    cancellation_reason: Optional[str] = None
    is_reopened: bool = False
    allowed_actions: AllowedActionsSchema
