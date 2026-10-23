from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class EvidenceMetadata(Base):
    __tablename__ = "evidence_metadata"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evidence_id = Column(String(36), ForeignKey("evidence.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    file_extension = Column(String(20), nullable=True)
    custom_tags = Column(JSON, default=list, nullable=False)
    exif_data = Column(JSON, default=dict, nullable=False)
    extracted_headers = Column(JSON, default=dict, nullable=False)
    device_info = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    evidence = relationship("Evidence", back_populates="metadata_records")
