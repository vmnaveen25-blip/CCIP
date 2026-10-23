from sqlalchemy import Column, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class InvestigationConversation(Base):
    """
    Persistent investigation chat session bound to a case and specialist.
    """
    __tablename__ = "investigation_conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=True, index=True)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title = Column(String(255), nullable=False, default="New Investigation Chat")
    status = Column(String(50), nullable=False, default="ACTIVE")  # ACTIVE, ARCHIVED
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    case = relationship("Case")
    creator = relationship("User")
    messages = relationship(
        "InvestigationMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="InvestigationMessage.created_at"
    )


class InvestigationMessage(Base):
    """
    Individual message in an investigation conversation.
    """
    __tablename__ = "investigation_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(
        String(36),
        ForeignKey("investigation_conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    role = Column(String(20), nullable=False)  # USER, ASSISTANT, SYSTEM
    content = Column(Text, nullable=False)
    metadata_json = Column(JSON, default=dict, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    conversation = relationship("InvestigationConversation", back_populates="messages")
