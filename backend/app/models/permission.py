from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    module = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    roles = relationship("Role", secondary="role_permissions", back_populates="permissions")
