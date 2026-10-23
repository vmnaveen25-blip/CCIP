from sqlalchemy import Column, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class InvestigationAction(Base):
    __tablename__ = "investigation_actions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    performed_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    action_type = Column(String(100), nullable=False)  # "FORENSIC_ACQUISITION", "IOC_PIVOT", "SPECTRAL_ANALYSIS", "CHAIN_ANALYSIS"
    title = Column(String(200), nullable=False)
    details = Column(Text, nullable=False)
    results = Column(JSON, default=dict, nullable=False)
    status = Column(String(50), default="COMPLETED", nullable=False)  # "PENDING", "IN_PROGRESS", "COMPLETED"
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    investigation = relationship("Investigation", back_populates="actions")
    performed_by = relationship("User")
