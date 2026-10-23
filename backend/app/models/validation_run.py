from sqlalchemy import Column, String, DateTime, Text, Float, Integer, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class ValidationRun(Base):
    __tablename__ = "validation_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(String(50), ForeignKey("model_registry.id", ondelete="CASCADE"), nullable=False, index=True)
    dataset_id = Column(String(36), ForeignKey("datasets.id", ondelete="SET NULL"), nullable=True)
    
    status = Column(String(50), default="PASSED", nullable=False)  # "PASSED", "FAILED", "WARNING"
    accuracy = Column(Float, default=98.6, nullable=False)
    f1_score = Column(Float, default=0.984, nullable=False)
    precision = Column(Float, default=0.982, nullable=False)
    recall = Column(Float, default=0.987, nullable=False)
    confusion_matrix = Column(JSON, default=dict, nullable=False)
    
    is_approved = Column(Boolean, default=True, nullable=False)
    approved_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    validated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    model = relationship("ModelRegistry", back_populates="validation_runs")
    dataset = relationship("Dataset")
    approved_by = relationship("User")


class DeploymentVersion(Base):
    __tablename__ = "deployment_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(String(50), ForeignKey("model_registry.id", ondelete="CASCADE"), nullable=False, index=True)
    environment = Column(String(50), default="PRODUCTION", nullable=False)  # "PRODUCTION", "STAGING", "CANARY"
    version_tag = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    traffic_percentage = Column(Integer, default=100, nullable=False)
    deployed_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    deployed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    model = relationship("ModelRegistry", back_populates="deployments")
    deployed_by = relationship("User")


class DriftEvent(Base):
    __tablename__ = "drift_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(String(50), ForeignKey("model_registry.id", ondelete="CASCADE"), nullable=False, index=True)
    drift_type = Column(String(50), default="CONCEPT_DRIFT", nullable=False)  # "CONCEPT_DRIFT", "DATA_DRIFT", "ACCURACY_DROP"
    drift_score = Column(Float, default=1.2, nullable=False)
    threshold = Column(Float, default=5.0, nullable=False)
    status = Column(String(50), default="MONITORED", nullable=False)  # "MONITORED", "TRIGGERED_RETRAINING", "RESOLVED"
    details = Column(Text, nullable=True)
    detected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    model = relationship("ModelRegistry", back_populates="drift_events")
