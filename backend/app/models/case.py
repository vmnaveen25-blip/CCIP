import enum
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class CasePriorityEnum(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class CaseStatusEnum(str, enum.Enum):
    OPEN = "OPEN"
    CASE_CREATED = "CASE_CREATED"
    UNDER_REVIEW = "UNDER_REVIEW"
    VALIDATED = "VALIDATED"
    ASSIGNED = "ASSIGNED"
    UNDER_INVESTIGATION = "UNDER_INVESTIGATION"
    EVIDENCE_VERIFIED = "EVIDENCE_VERIFIED"
    LAW_ENFORCEMENT_DISPATCHED = "LAW_ENFORCEMENT_DISPATCHED"
    PENDING_VALIDATION = "PENDING_VALIDATION"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


class Case(Base):
    __tablename__ = "cases"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_number = Column(String(50), unique=True, nullable=False, index=True)
    complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=True)
    priority = Column(String(50), default="MEDIUM", nullable=False, index=True)
    status = Column(String(50), default="CASE_CREATED", nullable=False, index=True)
    risk_score = Column(Float, default=50.0, nullable=False)

    assigned_department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    assigned_officer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_specialist_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    is_high_risk = Column(Boolean, default=False, nullable=False, index=True)
    is_escalated = Column(Boolean, default=False, nullable=False, index=True)
    escalation_reason = Column(Text, nullable=True)

    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    closed_at = Column(DateTime, nullable=True)

    # Relationships
    complaint = relationship("Complaint", back_populates="case")
    assigned_department = relationship("Department", back_populates="cases")
    assigned_officer = relationship("User", back_populates="assigned_cases", foreign_keys=[assigned_officer_id])
    assigned_specialist = relationship("User", back_populates="specialist_cases", foreign_keys=[assigned_specialist_id])
    
    assignments = relationship("CaseAssignment", back_populates="case", cascade="all, delete-orphan")
    status_history = relationship("CaseStatusHistory", back_populates="case", cascade="all, delete-orphan", order_by="CaseStatusHistory.created_at")
    investigations = relationship("Investigation", back_populates="case", cascade="all, delete-orphan")
    evidence_files = relationship("Evidence", back_populates="case")
    entities = relationship("CyberEntity", back_populates="case", cascade="all, delete-orphan")
