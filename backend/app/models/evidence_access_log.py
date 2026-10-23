from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class EvidenceAccessLog(Base):
    __tablename__ = "evidence_access_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evidence_id = Column(String(36), ForeignKey("evidence.id", ondelete="CASCADE"), nullable=False, index=True)
    accessed_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action_type = Column(String(50), nullable=False)  # "VIEW", "DOWNLOAD", "VERIFY_HASH", "INTEGRITY_CHECK"
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    evidence = relationship("Evidence", back_populates="access_logs")
    accessed_by = relationship("User")
