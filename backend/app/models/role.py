from typing import Optional, List, TYPE_CHECKING
import enum
from sqlalchemy import Column, String, DateTime, Text, Table, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, timezone
import uuid

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.permission import Permission


class RoleEnum(str, enum.Enum):
    CITIZEN = "CITIZEN"
    CYBERSECURITY_SPECIALIST = "CYBERSECURITY_SPECIALIST"
    CYBERCRIME_POLICE = "CYBERCRIME_POLICE"
    ADMIN = "ADMIN"
    AI_ML_SYSTEM_LEAD = "AI_ML_SYSTEM_LEAD"


role_permissions_table = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", String(36), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", String(36), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)
)


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    users: Mapped[List["User"]] = relationship("User", back_populates="role")
    permissions: Mapped[List["Permission"]] = relationship("Permission", secondary=role_permissions_table, back_populates="roles", lazy="selectin")

