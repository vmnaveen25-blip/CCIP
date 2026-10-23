from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.complaint import ComplaintFrontendSchema


class CaseAssignmentRequest(BaseModel):
    officer_id: Optional[str] = None
    specialist_id: Optional[str] = None
    department_id: Optional[str] = None
    notes: Optional[str] = None


class CaseStatusUpdateRequest(BaseModel):
    status: str
    reason: Optional[str] = None


class CasePriorityUpdateRequest(BaseModel):
    priority: str
    reason: Optional[str] = None


class CaseEscalationRequest(BaseModel):
    is_escalated: bool = True
    escalation_reason: str


class CaseReopenRequest(BaseModel):
    reason: str


class CaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    case_number: str
    complaint_id: str
    title: str
    summary: Optional[str] = None
    priority: str
    status: str
    risk_score: float
    is_high_risk: bool
    is_escalated: bool
    escalation_reason: Optional[str] = None
    assigned_department: Optional[str] = None
    assigned_officer: Optional[str] = None
    assigned_specialist: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    complaint: Optional[ComplaintFrontendSchema] = None
