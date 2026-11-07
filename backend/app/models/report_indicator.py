from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, timezone
import uuid

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.complaint import Complaint


class ReportIndicator(Base):
    """
    Normalized, structured Indicators of Compromise (IOCs) submitted by citizens
    or extracted automatically during AI preliminary triage.
    """
    __tablename__ = "report_indicators"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id: Mapped[str] = mapped_column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    
    indicator_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # PHONE, EMAIL, URL, DOMAIN, CRYPTO_WALLET, BANK_UTR, IP
    raw_value: Mapped[str] = mapped_column(String(500), nullable=False)
    normalized_value: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    
    source: Mapped[str] = mapped_column(String(50), default="CITIZEN_SUBMISSION", nullable=False)  # CITIZEN_SUBMISSION, AI_EXTRACTION, EVIDENCE_OCR
    confidence: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    context_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, default=dict, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    complaint: Mapped["Complaint"] = relationship("Complaint", back_populates="indicators", foreign_keys=[complaint_id])
