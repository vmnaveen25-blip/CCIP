from sqlalchemy import Column, String, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="INFO", nullable=False)  # "ASSET_FREEZE", "EVIDENCE_SEALED", "STATUS_CHANGE", "DISPATCH"
    severity = Column(String(50), default="INFO", nullable=False)  # "CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"
    
    related_complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="SET NULL"), nullable=True)
    related_case_id = Column(String(36), ForeignKey("cases.id", ondelete="SET NULL"), nullable=True)
    metadata_json = Column(JSON, default=dict, nullable=False)
    
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="notifications")
    related_complaint = relationship("Complaint")
    related_case = relationship("Case")
