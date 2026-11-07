from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, timezone
import uuid

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.complaint import Complaint
    from app.models.user import User


class CitizenConsent(Base):
    """
    Immutable cryptographic consent record for Citizen Cybercrime complaints.
    Complies with statutory digital data protection mandates and evidentiary requirements.
    """
    __tablename__ = "citizen_consents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id: Mapped[str] = mapped_column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    citizen_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    consent_type: Mapped[str] = mapped_column(String(100), default="STATUTORY_INVESTIGATION_CONSENT", nullable=False)
    terms_version: Mapped[str] = mapped_column(String(50), default="2026.1-DPDP", nullable=False)
    terms_hash: Mapped[str] = mapped_column(String(64), nullable=False)  # SHA-256 hash of consent declaration text
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    data_processing_accepted: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    evidence_submission_accepted: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    truthfulness_declared: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    complaint: Mapped["Complaint"] = relationship("Complaint", back_populates="consents", foreign_keys=[complaint_id])
    citizen: Mapped[Optional["User"]] = relationship("User", foreign_keys=[citizen_id])
