from sqlalchemy import Column, String, DateTime, Text, Float, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class TrainingRun(Base):
    __tablename__ = "training_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(String(50), ForeignKey("model_registry.id", ondelete="CASCADE"), nullable=False, index=True)
    dataset_id = Column(String(36), ForeignKey("datasets.id", ondelete="SET NULL"), nullable=True)
    initiated_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    status = Column(String(50), default="COMPLETED", nullable=False)  # "QUEUED", "RUNNING", "COMPLETED", "FAILED"
    epochs = Column(Integer, default=20, nullable=False)
    batch_size = Column(Integer, default=32, nullable=False)
    learning_rate = Column(Float, default=0.0001, nullable=False)
    loss = Column(Float, default=0.042, nullable=False)
    accuracy = Column(Float, default=98.6, nullable=False)
    hyperparameters = Column(JSON, default=dict, nullable=False)
    
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime, nullable=True)

    model = relationship("ModelRegistry", back_populates="training_runs")
    dataset = relationship("Dataset")
    initiated_by = relationship("User")
