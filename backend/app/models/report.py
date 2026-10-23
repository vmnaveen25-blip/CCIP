from sqlalchemy import Column, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_type = Column(String(50), nullable=False, index=True)  # "INVESTIGATION_SUMMARY", "EXECUTIVE_STATISTICS", "LAW_ENFORCEMENT_DISPATCH", "THREAT_INTELLIGENCE"
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=True)
    generated_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="SET NULL"), nullable=True)
    
    content_json = Column(JSON, default=dict, nullable=False)
    file_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    generated_by = relationship("User")
    case = relationship("Case")
