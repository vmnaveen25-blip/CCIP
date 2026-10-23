from typing import Optional, Dict, Any
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class LearningCandidate(Base):
    __tablename__ = "learning_candidates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    source_finding_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("investigation_findings.id", ondelete="SET NULL"), nullable=True)

    target_model: Mapped[str] = mapped_column(String(100), nullable=False, index=True)  # e.g., incident_urgency, case_similarity, relation_extraction
    decision: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # REJECT, REQUIRES_REVIEW, APPROVE_CANDIDATE
    gate_source: Mapped[str] = mapped_column(String(50), default="HARD_RULES_OVERRIDE", nullable=False)  # HARD_RULES_OVERRIDE, NEURAL_GATE
    reason: Mapped[str] = mapped_column(Text, nullable=False)

    confidence: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    model_name: Mapped[str] = mapped_column(String(100), default="ccip-feedback-gate-v1", nullable=False)
    model_version: Mapped[str] = mapped_column(String(50), default="1.0.0", nullable=False)

    feature_snapshot_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Human oversight of candidate queue (AI Lead only)
    review_status: Mapped[str] = mapped_column(String(50), default="PENDING", nullable=False, index=True)  # PENDING, APPROVED_FOR_DATASET, REJECTED, QUARANTINED
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    review_notes: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    case = relationship("Case", foreign_keys=[case_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
