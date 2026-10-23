"""
Document Processing Model for CCIP / Astraea Enclave
Maintains provenance, processing status, OCR audit trails, redacted text,
and Gemini contextual intelligence for uploaded evidence files.
"""

from typing import Optional, Dict, Any, TYPE_CHECKING
from sqlalchemy import Column, String, DateTime, Float, Integer, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, timezone
import uuid

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.evidence import Evidence


class DocumentProcessingResult(Base):
    __tablename__ = "document_processing_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evidence_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("evidence.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    complaint_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    case_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)

    # Status tracking: UPLOADED, VALIDATING, PROCESSING, OCR_REQUIRED, COMPLETED, PARTIALLY_COMPLETED, NEEDS_REVIEW, FAILED
    processing_status: Mapped[str] = mapped_column(String(50), default="UPLOADED", nullable=False, index=True)
    detected_format: Mapped[str] = mapped_column(String(50), default="UNKNOWN", nullable=False)
    
    # Document metrics
    page_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    character_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ocr_applied: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ocr_engine: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Preserved text & privacy-redacted text
    extracted_text: Mapped[str] = mapped_column(Text, default="", nullable=False)
    redacted_text: Mapped[str] = mapped_column(Text, default="", nullable=False)

    # Gemini contextual intelligence & explanation
    gemini_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    gemini_analysis_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    gemini_status: Mapped[str] = mapped_column(String(50), default="NOT_ATTEMPTED", nullable=False)

    # Error handling & audit metrics
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    processing_duration_ms: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    evidence: Mapped["Evidence"] = relationship("Evidence", back_populates="document_processing")
