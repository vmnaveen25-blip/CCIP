from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class ComplaintEvent(Base):
    __tablename__ = "complaint_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    actor = Column(String(150), nullable=False)
    verified_hash = Column(String(64), nullable=True)
    timestamp = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    complaint = relationship("Complaint", back_populates="events")
