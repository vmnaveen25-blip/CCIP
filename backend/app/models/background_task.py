import enum
from sqlalchemy import Column, String, DateTime, Text, JSON, Float
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class TaskStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class BackgroundTask(Base):
    __tablename__ = "background_tasks"

    id = Column(String(50), primary_key=True, default=lambda: f"task-{uuid.uuid4().hex[:12]}")
    task_name = Column(String(150), nullable=False, index=True)
    task_type = Column(String(100), nullable=False, index=True)  # "EMAIL_DISPATCH", "OTP_DELIVERY", "REPORT_GENERATION", "EVIDENCE_INTEGRITY", "MALWARE_SCAN", "TELEMETRY_AGGREGATION"
    status = Column(String(50), default=TaskStatusEnum.PENDING.value, nullable=False, index=True)
    
    payload = Column(JSON, default=dict, nullable=False)
    result = Column(JSON, default=dict, nullable=True)
    error_message = Column(Text, nullable=True)
    
    progress_percentage = Column(Float, default=0.0, nullable=False)
    initiated_by_user_id = Column(String(36), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
