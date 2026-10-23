from sqlalchemy import Column, String, DateTime, Text, BigInteger, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(150), unique=True, nullable=False, index=True)
    category = Column(String(100), nullable=False)  # "VOICE_SPECTROGRAMS", "PHISHING_URLS", "GRAPH_IOCS", "TRANSACTION_CHAINS"
    version = Column(String(50), default="v1.0", nullable=False)
    samples_count = Column(BigInteger, default=0, nullable=False)
    size_bytes = Column(BigInteger, default=0, nullable=False)
    description = Column(Text, nullable=True)
    storage_path = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
