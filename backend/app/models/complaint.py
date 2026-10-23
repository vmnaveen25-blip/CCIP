from typing import Optional, List, Any, TYPE_CHECKING
import enum
from sqlalchemy import Column, String, DateTime, Text, Float, Integer, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, timezone
import uuid

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.complaint_event import ComplaintEvent
    from app.models.evidence import Evidence
    from app.models.case import Case
    from app.models.cyber_entity import CyberEntity


class ComplaintStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    TRIAGED = "TRIAGED"
    VALIDATED = "VALIDATED"
    CASE_CREATED = "CASE_CREATED"
    ASSIGNED = "ASSIGNED"
    UNDER_INVESTIGATION = "UNDER_INVESTIGATION"
    EVIDENCE_VERIFIED = "EVIDENCE_VERIFIED"
    LAW_ENFORCEMENT_DISPATCHED = "LAW_ENFORCEMENT_DISPATCHED"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


class ComplaintSeverityEnum(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ComplaintCategoryEnum(str, enum.Enum):
    FINANCIAL_FRAUD = "Financial Fraud"
    RANSOMWARE = "Ransomware / Extortion"
    IDENTITY_THEFT = "Identity Theft"
    PHISHING = "Phishing / Social Eng"
    CRYPTO_SCAM = "Crypto Scam"
    UNAUTHORIZED_ACCESS = "Unauthorized Access"


class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    citizen_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(50), default="MEDIUM", nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), default="SUBMITTED", nullable=False, index=True)

    citizen_name: Mapped[str] = mapped_column(String(150), nullable=False)
    citizen_email: Mapped[str] = mapped_column(String(255), nullable=False)
    citizen_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    incident_date: Mapped[str] = mapped_column(String(100), nullable=False)
    reported_date: Mapped[str] = mapped_column(String(100), nullable=False)
    financial_loss: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    suspect_info: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # Initial deterministic workflow scoring (no fake AI models claimed)
    triage_score: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    predicted_threat_group: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    assigned_unit: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    assigned_officer: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)

    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    citizen: Mapped[Optional["User"]] = relationship("User", back_populates="complaints", foreign_keys=[citizen_id], lazy="selectin")
    events: Mapped[List["ComplaintEvent"]] = relationship("ComplaintEvent", back_populates="complaint", cascade="all, delete-orphan", order_by="ComplaintEvent.created_at", lazy="selectin")
    evidence_files: Mapped[List["Evidence"]] = relationship("Evidence", back_populates="complaint", cascade="all, delete-orphan", lazy="selectin")
    case: Mapped[Optional["Case"]] = relationship("Case", back_populates="complaint", uselist=False, lazy="selectin")
    entities: Mapped[List["CyberEntity"]] = relationship("CyberEntity", back_populates="complaint", cascade="all, delete-orphan", lazy="selectin")

