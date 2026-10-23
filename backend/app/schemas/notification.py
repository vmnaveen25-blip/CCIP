from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    message: str
    notification_type: str
    severity: str
    related_complaint_id: Optional[str] = None
    related_case_id: Optional[str] = None
    is_read: bool
    created_at: datetime
    timestamp_formatted: Optional[str] = None


class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    notification_type: str = "INFO"
    severity: str = "INFO"
    related_complaint_id: Optional[str] = None
    related_case_id: Optional[str] = None
