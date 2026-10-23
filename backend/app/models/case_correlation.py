from typing import Optional, Dict, Any, List
from sqlalchemy import Column, String, DateTime, Float, Integer, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class CaseCorrelation(Base):
    __tablename__ = "case_cross_correlations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_a_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    case_b_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    label: Mapped[str] = mapped_column(String(50), default="UNRELATED", nullable=False, index=True)  # UNRELATED, POSSIBLY_RELATED, STRONGLY_RELATED
    confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    similarity_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    shared_entity_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    shared_entity_types_json: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    
    model_name: Mapped[str] = mapped_column(String(100), default="ccip-cross-case-correlation-v1", nullable=False)
    model_version: Mapped[str] = mapped_column(String(50), default="1.0.0", nullable=False)

    status: Mapped[str] = mapped_column(String(50), default="UNREVIEWED", nullable=False, index=True)  # UNREVIEWED, CONFIRMED_RELEVANT, DISMISSED, NEEDS_MORE_EVIDENCE
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    review_notes: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

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

    __table_args__ = (
        UniqueConstraint("case_a_id", "case_b_id", name="uq_case_cross_correlation_pair"),
    )

    case_a = relationship("Case", foreign_keys=[case_a_id])
    case_b = relationship("Case", foreign_keys=[case_b_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
