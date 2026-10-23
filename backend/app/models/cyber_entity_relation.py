from typing import Optional, Dict, Any
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class CyberEntityRelation(Base):
    __tablename__ = "cyber_entity_relations"

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

    source_entity_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("cyber_entities.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    target_entity_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("cyber_entities.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    relation_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.85, nullable=False)
    source: Mapped[str] = mapped_column(String(50), default="TRANSFORMER", nullable=False)  # TRANSFORMER, RULE_INFERRED, HYBRID
    model_name: Mapped[str] = mapped_column(String(100), default="ccip-cyber-relation-extraction-v1", nullable=False)
    model_version: Mapped[str] = mapped_column(String(50), default="1.0.0", nullable=False)

    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint("complaint_id", "source_entity_id", "target_entity_id", "relation_type", name="uq_cyber_entity_relation"),
    )

    source_entity = relationship("CyberEntity", foreign_keys=[source_entity_id])
    target_entity = relationship("CyberEntity", foreign_keys=[target_entity_id])
    complaint = relationship("Complaint")
    case = relationship("Case")
