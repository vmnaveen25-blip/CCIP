from typing import Optional, Dict, Any
from sqlalchemy import Column, String, DateTime, Float, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class CyberEntity(Base):
    __tablename__ = "cyber_entities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("complaints.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    case_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    entity_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    raw_value: Mapped[str] = mapped_column(String(500), nullable=False)
    normalized_value: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.90, nullable=False)

    source_type: Mapped[str] = mapped_column(String(50), default="COMPLAINT_NARRATIVE", nullable=False)
    source_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    extractor: Mapped[str] = mapped_column(String(100), default="CYBER_ENTITY_EXTRACTOR_V1", nullable=False)
    extraction_mode: Mapped[str] = mapped_column(String(50), default="HYBRID_RULE_BASED", nullable=False)

    start_offset: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    end_offset: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    occurrence_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

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
    complaint = relationship("Complaint", back_populates="entities")
    case = relationship("Case", back_populates="entities")
