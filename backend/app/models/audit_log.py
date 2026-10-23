from sqlalchemy import Column, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    actor = Column(String(150), nullable=False)
    clearance = Column(String(50), default="UNAUTHENTICATED", nullable=False)
    action = Column(String(100), nullable=False, index=True)
    resource = Column(String(255), nullable=False, index=True)
    status = Column(String(50), default="SUCCESS", nullable=False, index=True)  # "SUCCESS", "DENIED", "FLAGGED"
    ip_address = Column(String(60), nullable=True)
    user_agent = Column(Text, nullable=True)
    integrity_hash = Column(String(64), nullable=False)
    metadata_json = Column(JSON, default=dict, nullable=False)
    
    timestamp = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    user = relationship("User", back_populates="audit_logs", foreign_keys=[user_id])
