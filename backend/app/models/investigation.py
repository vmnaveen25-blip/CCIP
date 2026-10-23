from sqlalchemy import Column, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_specialist_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String(255), nullable=False)
    hypothesis = Column(Text, nullable=True)
    status = Column(String(50), default="ACTIVE", nullable=False, index=True)  # "ACTIVE", "IN_REVIEW", "COMPLETED", "SUSPENDED"
    findings_summary = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    case = relationship("Case", back_populates="investigations")
    lead_specialist = relationship("User", foreign_keys=[lead_specialist_id])
    actions = relationship("InvestigationAction", back_populates="investigation", cascade="all, delete-orphan", order_by="InvestigationAction.created_at")
    findings = relationship("InvestigationFinding", back_populates="investigation", cascade="all, delete-orphan")
