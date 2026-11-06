"""
Knowledge Material and Public Chat Models for CCIP Enclave.
Authoritative models for Knowledge Materials, semantic vector chunks,
and anonymous citizen chat sessions/messages.
"""

from datetime import datetime, timezone
import uuid
from typing import Optional, List, Dict, Any

from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    Boolean,
    Text,
    ForeignKey,
    LargeBinary
)
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.db.base import Base


class KnowledgeMaterial(Base):
    """Uploaded knowledge document for RAG processing and chatbot assistance."""
    __tablename__ = "knowledge_materials"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(10), nullable=False)  # PDF, DOCX, TXT, MD
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    file_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)  # SHA-256
    category: Mapped[str] = mapped_column(String(100), default="General Awareness")
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    uploaded_by: Mapped[str] = mapped_column(String(100), default="System Administrator")
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Ingestion & Chatbot Lifecycle Status
    processing_status: Mapped[str] = mapped_column(String(20), default="PROCESSING")  # PENDING, PROCESSING, AVAILABLE, FAILED
    chatbot_status: Mapped[str] = mapped_column(String(20), default="AVAILABLE")       # AVAILABLE, DISABLED
    chunks_count: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Cascade relationship to chunks
    chunks: Mapped[List["KnowledgeChunk"]] = relationship("KnowledgeChunk", back_populates="material", cascade="all, delete-orphan")


class KnowledgeChunk(Base):
    """Semantic text chunk with dense vector embedding for vector similarity retrieval."""
    __tablename__ = "knowledge_chunks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    material_id: Mapped[str] = mapped_column(String(36), ForeignKey("knowledge_materials.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    token_count: Mapped[int] = mapped_column(Integer, default=0)
    page_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    section_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Raw float32 vector stored as bytes (or JSON string for portable querying)
    embedding_vector: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    metadata_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    material: Mapped["KnowledgeMaterial"] = relationship("KnowledgeMaterial", back_populates="chunks")


class PublicChatSession(Base):
    """Ephemeral anonymous chat session for public citizens."""
    __tablename__ = "public_chat_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    client_ip_hash: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    user_agent_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    message_count: Mapped[int] = mapped_column(Integer, default=0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_active_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    messages: Mapped[List["PublicChatMessage"]] = relationship("PublicChatMessage", back_populates="session", cascade="all, delete-orphan")


class PublicChatMessage(Base):
    """Message turns inside an anonymous public chat session."""
    __tablename__ = "public_chat_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("public_chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # 'user', 'assistant', 'system'
    content: Mapped[str] = mapped_column(Text, nullable=False)
    sources_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON-serialized source citations
    latency_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    session: Mapped["PublicChatSession"] = relationship("PublicChatSession", back_populates="messages")

