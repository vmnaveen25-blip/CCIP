from typing import Optional, List, Any, Dict
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


class RoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    display_name: str
    description: Optional[str] = None


class DepartmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    code: str
    name: str
    jurisdiction: Optional[str] = None


class UserPublicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: str
    full_name: str
    phone_number: Optional[str] = None
    badge_number: Optional[str] = None
    clearance_level: str
    role: str  # e.g. "CITIZEN", "CYBERSECURITY_SPECIALIST", "CYBERCRIME_POLICE", "ADMIN", "AI_ML_SYSTEM_LEAD"
    portal_role: str  # mapped for frontend e.g. "citizen", "specialist", "police", "admin", "aiml"
    department_id: Optional[str] = None
    department: Optional[str] = None
    account_status: str = "ACTIVE"  # "ACTIVE", "SUSPENDED", "DISABLED", "PENDING"
    is_active: bool
    is_verified: bool
    is_staff: bool
    mfa_type: str
    mfa_enabled: bool = False
    google_id: Optional[str] = None
    is_google_linked: bool = False
    avatar_url: Optional[str] = None
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class PaginatedUsersResponse(BaseModel):
    items: List[UserPublicResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class UserAuditLogResponse(BaseModel):
    id: str
    timestamp: str
    actor: str
    clearance: str
    action: str
    resource: str
    status: str
    ip_address: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    integrity_hash: Optional[str] = None


class UserCreateRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: str
    phone_number: Optional[str] = None
    badge_number: Optional[str] = None
    clearance_level: Optional[str] = "CITIZEN TIER"
    department_id: Optional[str] = None
    is_staff: bool = False
    account_status: Optional[str] = "ACTIVE"


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    badge_number: Optional[str] = None
    clearance_level: Optional[str] = None
    department_id: Optional[str] = None
    is_active: Optional[bool] = None
    account_status: Optional[str] = None
    role: Optional[str] = None
