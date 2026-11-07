from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, DateTime, Text, Integer, ForeignKey, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, timezone
import uuid

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.evidence import Evidence
    from app.models.user import User


class EvidenceRetentionRecord(Base):
    """
    Statutory digital evidence retention and legal hold governance record.
    Prevents unauthorized premature purging of digital forensic artifacts.
    """
    __tablename__ = "evidence_retention_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evidence_id: Mapped[str] = mapped_column(String(36), ForeignKey("evidence.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    retention_period_years: Mapped[int] = mapped_column(Integer, default=7, nullable=False)
    legal_hold_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    legal_hold_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    legal_hold_placed_by_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    purge_eligible_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    evidence: Mapped["Evidence"] = relationship("Evidence", backref="retention_record", foreign_keys=[evidence_id])
    placed_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[legal_hold_placed_by_id])


class EvidenceAccessRequest(Base):
    """
    Formal request and authorization ticket for extracting, exporting,
    or presenting sealed evidence in judicial proceedings.
    """
    __tablename__ = "evidence_access_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evidence_id: Mapped[str] = mapped_column(String(36), ForeignKey("evidence.id", ondelete="CASCADE"), nullable=False, index=True)
    requester_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    purpose: Mapped[str] = mapped_column(String(100), default="COURT_DISCLOSURE", nullable=False)  # COURT_DISCLOSURE, INTER_AGENCY_TRANSFER, FORENSIC_DEEP_DIVE
    justification: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="PENDING", nullable=False, index=True)  # PENDING, APPROVED, REJECTED, EXPIRED
    
    approver_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    decided_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    evidence: Mapped["Evidence"] = relationship("Evidence", foreign_keys=[evidence_id])
    requester: Mapped["User"] = relationship("User", foreign_keys=[requester_id])
    approver: Mapped[Optional["User"]] = relationship("User", foreign_keys=[approver_id])
