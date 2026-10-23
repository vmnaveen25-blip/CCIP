from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Column, String, DateTime, BigInteger, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, timezone
import uuid

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.complaint import Complaint
    from app.models.case import Case
    from app.models.user import User
    from app.models.evidence_metadata import EvidenceMetadata
    from app.models.evidence_hash import EvidenceHash
    from app.models.evidence_access_log import EvidenceAccessLog
    from app.models.document_processing import DocumentProcessingResult


class Evidence(Base):
    __tablename__ = "evidence"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id: Mapped[str] = mapped_column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    case_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("cases.id", ondelete="SET NULL"), nullable=True, index=True)
    uploaded_by_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    file_size_formatted: Mapped[str] = mapped_column(String(50), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(500), nullable=False, unique=True)
    
    sha256_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    integrity_status: Mapped[str] = mapped_column(String(100), default="Submission Integrity Recorded", nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)  # Hash verified on submission
    version: Mapped[int] = mapped_column(BigInteger, default=1, nullable=False)
    parent_evidence_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("evidence.id", ondelete="SET NULL"), nullable=True)
    malware_scan_status: Mapped[str] = mapped_column(String(50), default="NOT_SCANNED", nullable=False)  # "NOT_SCANNED", "CLEAN", "SUSPICIOUS", "INFECTED"
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    complaint: Mapped[Optional["Complaint"]] = relationship("Complaint", back_populates="evidence_files")
    case: Mapped[Optional["Case"]] = relationship("Case", back_populates="evidence_files")
    uploaded_by: Mapped[Optional["User"]] = relationship("User")
    metadata_records: Mapped[Optional["EvidenceMetadata"]] = relationship("EvidenceMetadata", back_populates="evidence", cascade="all, delete-orphan", uselist=False)
    hashes: Mapped[List["EvidenceHash"]] = relationship("EvidenceHash", back_populates="evidence", cascade="all, delete-orphan")
    access_logs: Mapped[List["EvidenceAccessLog"]] = relationship("EvidenceAccessLog", back_populates="evidence", cascade="all, delete-orphan")
    document_processing: Mapped[Optional["DocumentProcessingResult"]] = relationship("DocumentProcessingResult", back_populates="evidence", cascade="all, delete-orphan", uselist=False)


