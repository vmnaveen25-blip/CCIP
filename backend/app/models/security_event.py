from typing import Optional, Any, TYPE_CHECKING
from sqlalchemy import String, DateTime, Text, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, timezone
import uuid

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class SecurityEvent(Base):
    """
    Dedicated Enclave Security Event Registry for administrative threat monitoring,
    brute-force detection, BOLA/IDOR attempt tracking, and authorization violations.
    """
    __tablename__ = "security_events_registry"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Category: AUTH_FAILURE, BRUTE_FORCE_LOCKOUT, RATE_LIMIT_EXCEEDED, BOLA_ATTEMPT, SUSPICIOUS_UPLOAD, PRIVILEGE_ESCALATION
    event_category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(50), default="WARNING", nullable=False, index=True)  # LOW, MEDIUM, WARNING, HIGH, CRITICAL
    
    source_ip: Mapped[str] = mapped_column(String(45), nullable=False, index=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    endpoint: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    method: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    
    action_taken: Mapped[str] = mapped_column(String(100), default="LOGGED", nullable=False)  # LOGGED, BLOCKED, IP_THROTTLED, SESSION_REVOKED
    details: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationship
    user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[user_id])
