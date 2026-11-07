from typing import Optional, Any, TYPE_CHECKING
from sqlalchemy import String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, timezone
import uuid

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class AdministrativeApproval(Base):
    """
    Dual-Authorization Governance Record (Separation of Duties).
    Enforces two-person integrity control for sensitive administrative operations.
    """
    __tablename__ = "administrative_approvals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Action categories: BULK_USER_SUSPEND, EVIDENCE_EXPORT, EVIDENCE_PURGE, AI_CONFIG_OVERRIDE, KNOWLEDGE_SCOPE_CHANGE
    action_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    resource_id: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    
    requested_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    approved_by_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    status: Mapped[str] = mapped_column(String(50), default="PENDING", nullable=False, index=True)  # PENDING, APPROVED, REJECTED, EXPIRED, EXECUTED
    justification: Mapped[str] = mapped_column(Text, nullable=False)
    review_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    payload_snapshot: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    audit_event_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    decided_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    # Relationships
    requested_by: Mapped["User"] = relationship("User", foreign_keys=[requested_by_id])
    approved_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[approved_by_id])
