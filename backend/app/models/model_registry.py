from sqlalchemy import Column, String, DateTime, Text, Float, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class ModelRegistry(Base):
    __tablename__ = "model_registry"

    id = Column(String(50), primary_key=True, default=lambda: f"mod-{uuid.uuid4().hex[:8]}")
    model_name = Column(String(150), nullable=False, index=True)
    version = Column(String(50), nullable=False)
    task = Column(String(200), nullable=False)
    
    accuracy = Column(Float, default=95.0, nullable=False)
    f1_score = Column(Float, default=0.95, nullable=False)
    drift_rate = Column(Float, default=1.0, nullable=False)
    status = Column(String(50), default="PRODUCTION", nullable=False, index=True)  # "PRODUCTION", "STAGING", "DEGRADED", "RETRAINING"
    
    last_evaluated = Column(String(100), nullable=False)
    latency_ms = Column(Integer, default=120, nullable=False)
    framework = Column(String(50), default="PyTorch / Transformers", nullable=False)
    description = Column(Text, nullable=True)
    parameters_count = Column(String(50), default="350M", nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    training_runs = relationship("TrainingRun", back_populates="model", cascade="all, delete-orphan")
    validation_runs = relationship("ValidationRun", back_populates="model", cascade="all, delete-orphan")
    deployments = relationship("DeploymentVersion", back_populates="model", cascade="all, delete-orphan")
    drift_events = relationship("DriftEvent", back_populates="model", cascade="all, delete-orphan")
