from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, timezone
import uuid

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.role import Role
    from app.models.department import Department
    from app.models.session import UserSession
    from app.models.refresh_token import RefreshToken
    from app.models.complaint import Complaint
    from app.models.case import Case
    from app.models.notification import Notification
    from app.models.audit_log import AuditLog


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone_number: Mapped[Optional[str]] = mapped_column(String(30), unique=True, nullable=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # nullable for OAuth users
    badge_number: Mapped[Optional[str]] = mapped_column(String(50), unique=True, nullable=True, index=True)  # For police / specialists
    clearance_level: Mapped[str] = mapped_column(String(50), default="CITIZEN TIER", nullable=False)
    
    role_id: Mapped[str] = mapped_column(String(36), ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False)
    department_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_staff: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    mfa_type: Mapped[str] = mapped_column(String(50), default="NONE", nullable=False)  # "NONE", "TOTP", "FIDO2", "SMS_OTP"
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    google_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True, index=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    lockout_until: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    role: Mapped[Optional["Role"]] = relationship("Role", back_populates="users", lazy="selectin")
    department: Mapped[Optional["Department"]] = relationship("Department", back_populates="users", lazy="selectin")
    sessions: Mapped[List["UserSession"]] = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    complaints: Mapped[List["Complaint"]] = relationship("Complaint", back_populates="citizen", foreign_keys="Complaint.citizen_id")
    assigned_cases: Mapped[List["Case"]] = relationship("Case", back_populates="assigned_officer", foreign_keys="Case.assigned_officer_id")
    specialist_cases: Mapped[List["Case"]] = relationship("Case", back_populates="assigned_specialist", foreign_keys="Case.assigned_specialist_id")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="user", foreign_keys="AuditLog.user_id")
