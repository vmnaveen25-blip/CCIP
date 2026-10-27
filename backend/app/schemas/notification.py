from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: Optional[str] = None
    title: str
    message: str
    notification_type: str
    type: Optional[str] = None
    severity: str
    related_complaint_id: Optional[str] = None
    related_case_id: Optional[str] = None
    action_link: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    is_read: bool
    created_at: datetime
    timestamp_formatted: Optional[str] = None


class NotificationCreate(BaseModel):
    user_id: Optional[str] = None
    title: str
    message: str
    notification_type: str = "INFO"
    severity: str = "INFO"
    related_complaint_id: Optional[str] = None
    related_case_id: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
