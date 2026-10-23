from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class CaseAssignment(Base):
    __tablename__ = "case_assignments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_to_user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    role_type = Column(String(50), nullable=False)  # "OFFICER", "SPECIALIST", "REVIEWER"
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    case = relationship("Case", back_populates="assignments")
    assigned_to = relationship("User", foreign_keys=[assigned_to_user_id])
    assigned_by = relationship("User", foreign_keys=[assigned_by_user_id])
