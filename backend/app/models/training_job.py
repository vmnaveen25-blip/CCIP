"""
TrainingJob Model: Sovereign Enclave ML Training Lifecycle Management
Defines complete lifecycle states, hyperparameters, dataset linkages,
runtime targets, metrics, checkpoints, and artifact integrity records.
"""

from typing import Optional, Dict, Any
from sqlalchemy import Column, String, DateTime, Text, Float, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class TrainingJob(Base):
    __tablename__ = "training_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_reference: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    
    # Model target specification
    model_family: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    base_model: Mapped[str] = mapped_column(String(200), nullable=False)
    target_model_name: Mapped[str] = mapped_column(String(200), nullable=False)
    target_model_version: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Dataset linkage
    dataset_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("datasets.id", ondelete="SET NULL"), nullable=True, index=True)
    dataset_version: Mapped[str] = mapped_column(String(50), default="v1.0", nullable=False)
    
    # Task taxonomy
    training_task: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    # Options: TEXT_CLASSIFICATION, MULTI_LABEL_CLASSIFICATION, TOKEN_CLASSIFICATION,
    # SENTENCE_EMBEDDING, PAIR_CLASSIFICATION, STRUCTURED_CLASSIFICATION, GRAPH_LINK_CLASSIFICATION
    
    # State machine
    status: Mapped[str] = mapped_column(String(50), default="DRAFT", nullable=False, index=True)
    # Options: DRAFT, VALIDATING, READY, QUEUED, RUNNING, PAUSED, COMPLETED, FAILED, CANCELLED, BLOCKED
    
    # Runtime context
    runtime_type: Mapped[str] = mapped_column(String(50), default="LOCAL_CPU", nullable=False)
    # Options: LOCAL_CPU, LOCAL_CUDA, COLAB_EXTERNAL, REMOTE_GPU, NOT_CONFIGURED
    runtime_target: Mapped[str] = mapped_column(String(150), default="Local Sovereign Enclave", nullable=False)
    
    # Configurations
    config_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    quality_gate_config_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    # Output metrics & results
    metrics_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    quality_gate_result_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    # Artifacts & Checkpoints
    artifact_path_ref: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    artifact_hash_sha256: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    log_path_ref: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    checkpoint_path_ref: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Governance & Notes
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    failure_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Execution Timestamps
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    failed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
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

    dataset = relationship("Dataset")
    creator = relationship("User", foreign_keys=[created_by])
    approver = relationship("User", foreign_keys=[approved_by])
