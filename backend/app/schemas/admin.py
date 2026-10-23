from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.schemas.reports import SystemAuditLogResponse, SystemHealthResponse


class AdminConfigUpdateRequest(BaseModel):
    key: str
    value: Any


class DepartmentCreateRequest(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    jurisdiction: Optional[str] = None


class RolePermissionUpdateRequest(BaseModel):
    role_id: str
    permission_ids: List[str]
