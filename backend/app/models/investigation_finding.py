from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Float, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class InvestigationFinding(Base):
    __tablename__ = "investigation_findings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    author_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    finding_type = Column(String(100), nullable=False)  # "IOC_MATCH", "SYNTHETIC_MEDIA", "WALLET_CLUSTER", "INFRASTRUCTURE"
    title = Column(String(200), nullable=False)
    summary = Column(Text, nullable=False)
    confidence_score = Column(Float, default=0.0, nullable=False)
    is_validated = Column(Boolean, default=False, nullable=False)
    evidence_refs = Column(JSON, default=list, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    investigation = relationship("Investigation", back_populates="findings")
    author = relationship("User")
