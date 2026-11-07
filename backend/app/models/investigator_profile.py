from typing import Optional, List, Any, TYPE_CHECKING
from sqlalchemy import String, DateTime, Text, Integer, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, timezone
import uuid

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class InvestigatorProfile(Base):
    """
    Investigator governance profile tracking forensic specialization,
    operational clearance, workload capacity, and current assignment status.
    """
    __tablename__ = "investigator_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    badge_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    designation: Mapped[str] = mapped_column(String(100), default="Cybercrime Investigator", nullable=False)
    jurisdiction_zone: Mapped[str] = mapped_column(String(100), default="State Cyber Cell Headquarters", nullable=False)
    
    # Specializations (e.g., ["FINANCIAL_FRAUD", "RANSOMWARE", "CRYPTO_TRACING", "SOCIAL_MEDIA_HARASSMENT"])
    specializations: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    
    max_active_cases: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    current_active_cases: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    availability_status: Mapped[str] = mapped_column(String(50), default="AVAILABLE", nullable=False, index=True)  # AVAILABLE, ON_LEAVE, ENGAGED, SUSPENDED
    clearance_level: Mapped[str] = mapped_column(String(50), default="SECRET", nullable=False)  # RESTRICTED, CONFIDENTIAL, SECRET, TOP_SECRET
    
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationship
    user: Mapped["User"] = relationship("User", backref="investigator_profile", foreign_keys=[user_id])
