from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ReportCreate(BaseModel):
    report_type: str
    title: str
    summary: Optional[str] = None
    case_id: Optional[str] = None
    content_json: Optional[Dict[str, Any]] = None


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    report_type: str
    title: str
    summary: Optional[str] = None
    case_id: Optional[str] = None
    content_json: Optional[Dict[str, Any]] = None
    file_path: Optional[str] = None
    created_at: datetime


class SystemAuditLogResponse(BaseModel):
    id: str
    timestamp: str
    actor: str
    clearance: str
    action: str
    resource: str
    status: str
    ipAddress: str
    hash: str
    metadata_json: Optional[Dict[str, Any]] = None


class SystemHealthResponse(BaseModel):
    status: str  # "HEALTHY", "DEGRADED", "UNHEALTHY"
    timestamp: str
    latency_ms: float
    services: Dict[str, Any]
