from sqlalchemy import Column, String, DateTime, Text, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class PilotDatasetRegistry(Base):
    __tablename__ = "pilot_dataset_registry"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(150), unique=True, nullable=False, index=True)
    source_type = Column(String(50), nullable=False)  # MODE_A_PUBLIC_BENCHMARK, MODE_B_DEIDENTIFIED_HISTORICAL, MODE_C_SHADOW_PILOT, MODE_D_SUPERVISED_PILOT
    source_description = Column(Text, nullable=True)
    authorization_basis = Column(String(255), nullable=False)
    deidentified = Column(Boolean, default=True, nullable=False)
    contains_pii = Column(Boolean, default=False, nullable=False)
    allowed_purposes_json = Column(JSON, default=list, nullable=False)
    retention_policy = Column(String(255), nullable=False)
    storage_location_ref = Column(String(500), nullable=False)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="PENDING_APPROVAL", nullable=False)  # PENDING_APPROVAL, APPROVED, ACTIVE, EXPIRED, REVOKED

    evaluation_runs = relationship("PilotEvaluationRun", back_populates="dataset", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])


class PilotEvaluationRun(Base):
    __tablename__ = "pilot_evaluation_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String(36), ForeignKey("pilot_dataset_registry.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    finished_at = Column(DateTime, nullable=True)
    model_versions_json = Column(JSON, default=dict, nullable=False)
    status = Column(String(50), default="RUNNING", nullable=False)  # RUNNING, COMPLETED, FAILED
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    dataset = relationship("PilotDatasetRegistry", back_populates="evaluation_runs")
    predictions = relationship("PilotPrediction", back_populates="run", cascade="all, delete-orphan")
    runner = relationship("User", foreign_keys=[created_by])


class PilotPrediction(Base):
    __tablename__ = "pilot_predictions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    run_id = Column(String(36), ForeignKey("pilot_evaluation_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    record_ref = Column(String(100), nullable=False, index=True)
    task = Column(String(100), nullable=False, index=True)  # CYBER_NER, COMPLAINT_CLASSIFIER, etc.
    model_name = Column(String(100), nullable=False)
    model_version = Column(String(50), nullable=False)
    prediction_json = Column(JSON, default=dict, nullable=False)
    confidence_json = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    run = relationship("PilotEvaluationRun", back_populates="predictions")
    reviews = relationship("PilotHumanReview", back_populates="prediction", cascade="all, delete-orphan")


class PilotHumanReview(Base):
    __tablename__ = "pilot_human_reviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    prediction_id = Column(String(36), ForeignKey("pilot_predictions.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    decision = Column(String(50), nullable=False)  # AGREE, DISAGREE, UNSURE
    correct = Column(Boolean, nullable=True)
    correction_label = Column(String(100), nullable=True)
    notes_redacted = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    prediction = relationship("PilotPrediction", back_populates="reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id])
