from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class EvidenceHash(Base):
    __tablename__ = "evidence_hashes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evidence_id = Column(String(36), ForeignKey("evidence.id", ondelete="CASCADE"), nullable=False, index=True)
    hash_algorithm = Column(String(20), default="SHA-256", nullable=False)
    hash_value = Column(String(128), nullable=False, index=True)
    calculated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    evidence = relationship("Evidence", back_populates="hashes")
