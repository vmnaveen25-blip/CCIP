from sqlalchemy import Column, String, DateTime, Text, JSON
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class SystemEvent(Base):
    __tablename__ = "system_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type = Column(String(100), nullable=False, index=True)
    component = Column(String(100), nullable=False, index=True)
    severity = Column(String(50), default="INFO", nullable=False)  # "INFO", "WARNING", "ERROR", "CRITICAL"
    message = Column(Text, nullable=False)
    payload = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
