"""
Investigation Assistant Chat & Streaming API Router.
Provides real-time SSE token streaming, conversation persistence,
question-aware case grounding, dynamic inquiries, and RBAC protection.
"""

import asyncio
import json
import logging
import time
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_, or_
from sqlalchemy.orm import selectinload

from app.db.database import get_db, AsyncSessionLocal
from app.models.user import User
from app.models.role import RoleEnum
from app.models.case import Case
from app.models.investigation_chat import InvestigationConversation, InvestigationMessage
from app.core.permissions import require_role
from app.core.exceptions import PermissionDeniedError, NotFoundError
from app.ai.adapters.generative_llm import generative_llm_adapter, GenerativeLLMUnavailableError
from app.services.investigation_context_service import investigation_context_service

logger = logging.getLogger(__name__)

# RBAC: Authorized cyber specialists, police, and system administrators
require_investigation_staff = require_role([
    RoleEnum.CYBERSECURITY_SPECIALIST,
    RoleEnum.CYBERCRIME_POLICE,
    RoleEnum.ADMIN
])

router = APIRouter(prefix="/investigation-assistant", tags=["AI Investigation Assistant Copilot"])


# ---------------------------------------------------------
# Schemas
# ---------------------------------------------------------

class CreateConversationRequest(BaseModel):
    case_id: Optional[str] = None
    title: Optional[str] = None


class StreamChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    case_id: str
    message: str = Field(..., min_length=1)


class MessageSchema(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    metadata_json: Dict[str, Any] = {}
    created_at: datetime


class ConversationSchema(BaseModel):
    id: str
    case_id: Optional[str]
    created_by: Optional[str]
    title: str
    status: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0


class ConversationDetailSchema(ConversationSchema):
    messages: List[MessageSchema] = []


# ---------------------------------------------------------
# Endpoints
# ---------------------------------------------------------

@router.get("/status", summary="Get runtime status of local generative assistant")
async def get_assistant_runtime_status(
    current_user: User = Depends(require_investigation_staff)
):
    """
    Returns truthful status of the local sovereign LLM runtime.
    No fake 98% confidence score.
    """
    health = await generative_llm_adapter.check_availability()
    return {
        "status": "LOCAL MODEL CONNECTED" if health.get("available") else "AI_ASSISTANT_UNAVAILABLE",
        "available": health.get("available", False),
        "model": health.get("model", "qwen2.5:7b"),
        "provider": health.get("provider", "local"),
        "base_url": health.get("base_url", "http://127.0.0.1:11434"),
        "sovereign_enclave": True,
        "mode": "SOVEREIGN_OFFLINE_LOCAL_LLM",
        "message": "Local AI generative runtime active." if health.get("available") else "Generative investigation assistant is currently unavailable. Existing case intelligence remains accessible."
    }


@router.post("/conversations", response_model=ConversationSchema, summary="Create a new investigation chat session")
async def create_conversation(
    req: CreateConversationRequest,
    current_user: User = Depends(require_investigation_staff),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a persistent investigation conversation associated with a case.
    """
    case_id = None
    if req.case_id:
        case = await investigation_context_service.get_case_record(db, req.case_id)
        if case:
            case_id = case.id

    conv = InvestigationConversation(
        id=str(uuid.uuid4()),
        case_id=case_id,
        created_by=current_user.id,
        title=req.title or "New Investigation Chat",
        status="ACTIVE"
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)

    return ConversationSchema(
        id=conv.id,
        case_id=conv.case_id,
        created_by=conv.created_by,
        title=conv.title,
        status=conv.status,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        message_count=0
    )


@router.get("/conversations", response_model=List[ConversationSchema], summary="List investigation chat sessions")
async def list_conversations(
    case_id: Optional[str] = None,
    current_user: User = Depends(require_investigation_staff),
    db: AsyncSession = Depends(get_db)
):
    """
    Lists active conversations for the authenticated investigator, optionally filtered by case.
    """
    stmt = select(InvestigationConversation).options(
        selectinload(InvestigationConversation.messages)
    ).where(
        InvestigationConversation.created_by == current_user.id,
        InvestigationConversation.status == "ACTIVE"
    )

    if case_id:
        case = await investigation_context_service.get_case_record(db, case_id)
        target_case_id = case.id if case else case_id
        stmt = stmt.where(InvestigationConversation.case_id == target_case_id)

    stmt = stmt.order_by(desc(InvestigationConversation.updated_at))
    res = await db.execute(stmt)
    convs = res.scalars().all()

    return [
        ConversationSchema(
            id=c.id,
            case_id=c.case_id,
            created_by=c.created_by,
            title=c.title,
            status=c.status,
            created_at=c.created_at,
            updated_at=c.updated_at,
            message_count=len(c.messages)
        )
        for c in convs
    ]


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailSchema, summary="Get conversation details and messages")
async def get_conversation_detail(
    conversation_id: str,
    current_user: User = Depends(require_investigation_staff),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves full message history of an authorized investigation conversation.
    """
    stmt = select(InvestigationConversation).options(
        selectinload(InvestigationConversation.messages)
    ).where(InvestigationConversation.id == conversation_id)

    res = await db.execute(stmt)
    conv = res.scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    if conv.created_by != current_user.id and current_user.role.name != RoleEnum.ADMIN.value:
        raise HTTPException(status_code=403, detail="Unauthorized to view this conversation.")

    return ConversationDetailSchema(
        id=conv.id,
        case_id=conv.case_id,
        created_by=conv.created_by,
        title=conv.title,
        status=conv.status,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        message_count=len(conv.messages),
        messages=[
            MessageSchema(
                id=m.id,
                conversation_id=m.conversation_id,
                role=m.role,
                content=m.content,
                metadata_json=m.metadata_json or {},
                created_at=m.created_at
            )
            for m in conv.messages
        ]
    )


@router.post("/conversations/{conversation_id}/archive", summary="Archive a conversation")
async def archive_conversation(
    conversation_id: str,
    current_user: User = Depends(require_investigation_staff),
    db: AsyncSession = Depends(get_db)
):
    """
    Marks conversation status as ARCHIVED according to retention rules.
    """
    stmt = select(InvestigationConversation).where(InvestigationConversation.id == conversation_id)
    res = await db.execute(stmt)
    conv = res.scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    if conv.created_by != current_user.id and current_user.role.name != RoleEnum.ADMIN.value:
        raise HTTPException(status_code=403, detail="Unauthorized to modify this conversation.")

    conv.status = "ARCHIVED"
    conv.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "ARCHIVED", "id": conversation_id}


@router.post("/chat/stream", summary="Stream investigative reasoning token-by-token via SSE")
async def stream_investigation_chat(
    req: StreamChatRequest,
    raw_request: Request,
    current_user: User = Depends(require_investigation_staff),
    db: AsyncSession = Depends(get_db)
):
    """
    Real-time Server-Sent Events (SSE) streaming endpoint.
    Streams tokens as they are produced by the local LLM runtime.
    Saves user and assistant messages in database upon completion.
    """
    case = await investigation_context_service.get_case_record(db, req.case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{req.case_id}' not found.")

    conversation_id = req.conversation_id
    conversation = None

    if conversation_id:
        stmt = select(InvestigationConversation).where(InvestigationConversation.id == conversation_id)
        res = await db.execute(stmt)
        conversation = res.scalars().first()

    if not conversation:
        # Create new conversation with title from initial question
        auto_title = req.message.strip()[:40]
        if len(req.message.strip()) > 40:
            auto_title += "..."
        conversation = InvestigationConversation(
            id=str(uuid.uuid4()),
            case_id=case.id,
            created_by=current_user.id,
            title=auto_title,
            status="ACTIVE"
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)

    conversation_id = conversation.id

    # 1. Save User Message
    user_msg = InvestigationMessage(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role="USER",
        content=req.message.strip(),
        metadata_json={
            "case_id": case.id,
            "case_number": case.case_number,
            "user_id": current_user.id
        }
    )
    db.add(user_msg)
    conversation.updated_at = datetime.now(timezone.utc)
    await db.commit()

    # 2. Retrieve Question-Aware Context
    context_data = await investigation_context_service.retrieve_case_context(
        db, case.id, question=req.message
    )

    # 3. Retrieve recent conversation history (last 6 messages) for multi-turn coherence
    history_stmt = select(InvestigationMessage).where(
        InvestigationMessage.conversation_id == conversation_id,
        InvestigationMessage.id != user_msg.id
    ).order_by(desc(InvestigationMessage.created_at)).limit(6)
    h_res = await db.execute(history_stmt)
    history_messages = list(reversed(h_res.scalars().all()))

    # Build prompt messages list
    llm_messages: List[Dict[str, str]] = []

    # Grounded evidence injection
    llm_messages.append({
        "role": "user",
        "content": (
            "CASE INVESTIGATION DOSSIER & RETRIEVED INTELLIGENCE:\n\n"
            f"{context_data['context_text']}\n\n"
            "Treat the above data as authentic CCIP case context. "
            "Now respond to the investigator's questions strictly using this evidence."
        )
    })
    llm_messages.append({
        "role": "assistant",
        "content": (
            f"Understood. I am loaded with the verified case intelligence for {case.case_number} ({case.title}). "
            "I will ground all answers in this context, clearly distinguish facts from inferences, and cite CCIP evidence tags."
        )
    })

    # Add historical turns
    for h in history_messages:
        role_key = "user" if h.role == "USER" else "assistant"
        llm_messages.append({"role": role_key, "content": h.content})

    # Add the current question
    llm_messages.append({"role": "user", "content": req.message.strip()})

    # SSE Generator
    async def sse_event_stream():
        start_time = time.time()
        token_count = 0
        accumulated_chunks = []
        is_cancelled = False

        # Event: Conversation context
        init_event = {
            "conversation_id": conversation_id,
            "case_id": case.id,
            "case_number": case.case_number,
            "sources": context_data["sources"],
            "entity_count": context_data["entity_count"],
            "relation_count": context_data["relation_count"],
            "evidence_count": context_data["evidence_count"],
            "correlation_count": context_data["correlation_count"]
        }
        yield f"event: retrieval\ndata: {json.dumps(init_event)}\n\n"

        # Stream tokens
        try:
            async for token in generative_llm_adapter.stream_chat(llm_messages):
                try:
                    if await asyncio.wait_for(raw_request.is_disconnected(), timeout=0.001):
                        logger.info(f"[SSE Stream] Client disconnected for conversation {conversation_id}. Aborting.")
                        is_cancelled = True
                        break
                except asyncio.TimeoutError:
                    pass
                except Exception:
                    pass

                token_count += 1
                accumulated_chunks.append(token)
                yield f"event: token\ndata: {json.dumps({'text': token})}\n\n"

        except GenerativeLLMUnavailableError:
            logger.warning("[SSE Stream] Local generative LLM unavailable.")
            err_data = {
                "code": "AI_ASSISTANT_UNAVAILABLE",
                "message": "Generative investigation assistant is currently unavailable. Existing case intelligence remains accessible."
            }
            yield f"event: error\ndata: {json.dumps(err_data)}\n\n"
            return
        except Exception as exc:
            logger.error(f"[SSE Stream] Error during inference streaming: {exc}")
            err_data = {
                "code": "AI_ASSISTANT_UNAVAILABLE",
                "message": "Generative investigation assistant is currently unavailable. Existing case intelligence remains accessible."
            }
            yield f"event: error\ndata: {json.dumps(err_data)}\n\n"
            return

        total_latency = int((time.time() - start_time) * 1000)
        final_text = "".join(accumulated_chunks)
        final_status = "CANCELLED" if is_cancelled else "COMPLETE"

        # Persist assistant response in database
        assistant_msg = InvestigationMessage(
            id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            role="ASSISTANT",
            content=final_text if final_text else "(Generation cancelled by investigator)",
            metadata_json={
                "model": generative_llm_adapter.model,
                "provider": generative_llm_adapter.provider,
                "case_id": case.id,
                "status": final_status,
                "context_sources": context_data["sources"],
                "token_count": token_count,
                "latency_ms": total_latency,
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
        )
        db.add(assistant_msg)
        
        # Touch conversation
        touch_stmt = select(InvestigationConversation).where(InvestigationConversation.id == conversation_id)
        c_res = await db.execute(touch_stmt)
        conv_obj = c_res.scalars().first()
        if conv_obj:
            conv_obj.updated_at = datetime.now(timezone.utc)
            
        await db.commit()

        complete_data = {
            "message_id": assistant_msg.id,
            "conversation_id": conversation_id,
            "status": final_status,
            "token_count": token_count,
            "latency_ms": total_latency,
            "sources": context_data["sources"]
        }
        yield f"event: complete\ndata: {json.dumps(complete_data)}\n\n"

    return StreamingResponse(
        sse_event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


# ---------------------------------------------------------
# Dynamic Suggestions
# ---------------------------------------------------------

@router.get("/suggestions/{case_id}", summary="Get dynamic case-grounded inquiries")
async def get_case_assistant_suggestions(
    case_id: str,
    current_user: User = Depends(require_investigation_staff),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns dynamic, entity-grounded suggested inquiries for a specific case.
    Replaces static canned questions.
    """
    suggestions = await investigation_context_service.get_dynamic_suggestions(db, case_id)
    return {
        "case_id": case_id,
        "suggestions": suggestions
    }
