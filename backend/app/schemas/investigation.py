from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class InvestigationActionCreate(BaseModel):
    action_type: str
    title: str
    details: str
    results: Optional[Dict[str, Any]] = None


class InvestigationActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    action_type: str
    title: str
    details: str
    results: Dict[str, Any]
    status: str
    created_at: datetime


class InvestigationFindingCreate(BaseModel):
    finding_type: str
    title: str
    summary: str
    confidence_score: float = 0.0
    evidence_refs: Optional[List[str]] = []


class InvestigationFindingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    finding_type: str
    title: str
    summary: str
    confidence_score: float
    is_validated: bool
    evidence_refs: List[str]
    created_at: datetime


class InvestigationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    case_id: str
    title: str
    hypothesis: Optional[str] = None
    status: str
    findings_summary: Optional[str] = None
    actions: List[InvestigationActionResponse] = []
    findings: List[InvestigationFindingResponse] = []
    created_at: datetime
    updated_at: datetime
