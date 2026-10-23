from typing import Optional, Dict, Any
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class EvidenceGraphNode(Base):
    __tablename__ = "evidence_graph_nodes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    node_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # COMPLAINT, CASE, SUSPECT, PHONE_NUMBER, UPI_ID, BANK_ACCOUNT, IP_ADDRESS, URL, CRYPTO_WALLET
    canonical_value: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    display_label: Mapped[str] = mapped_column(String(200), nullable=False)
    
    complaint_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=True, index=True)
    case_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=True, index=True)
    entity_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("cyber_entities.id", ondelete="SET NULL"), nullable=True, index=True)

    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint("node_type", "canonical_value", "case_id", name="uq_evidence_graph_node_per_case"),
    )


class EvidenceGraphEdge(Base):
    __tablename__ = "evidence_graph_edges"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=True, index=True)
    
    source_node_id: Mapped[str] = mapped_column(String(36), ForeignKey("evidence_graph_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    target_node_id: Mapped[str] = mapped_column(String(36), ForeignKey("evidence_graph_nodes.id", ondelete="CASCADE"), nullable=False, index=True)

    edge_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.80, nullable=False)
    source: Mapped[str] = mapped_column(String(50), default="DETERMINISTIC", nullable=False)  # DETERMINISTIC, RELATION_MODEL, CORRELATION_MODEL, GRAPH_LINK_MODEL, INVESTIGATOR_CONFIRMED
    
    review_status: Mapped[str] = mapped_column(String(50), default="UNVERIFIED", nullable=False, index=True)  # UNVERIFIED, VERIFIED, REJECTED
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    model_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    model_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint("case_id", "source_node_id", "target_node_id", "edge_type", name="uq_evidence_graph_edge_case"),
    )

    source_node = relationship("EvidenceGraphNode", foreign_keys=[source_node_id])
    target_node = relationship("EvidenceGraphNode", foreign_keys=[target_node_id])
    case = relationship("Case", foreign_keys=[case_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
