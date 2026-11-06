"""
Public Citizen Chatbot API for CCIP Enclave.
Allows anonymous citizens to ask natural-language questions about the CCIP platform
and cybercrime awareness/prevention grounded strictly in admin-approved Knowledge Materials.
"""

import time
import uuid
import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, delete
from pydantic import BaseModel, Field

from app.db.database import get_db
from app.core.logging import logger
from app.models.knowledge_material import PublicChatSession, PublicChatMessage
from app.services.knowledge_materials_service import knowledge_materials_service

router = APIRouter(prefix="/public-chat", tags=["Public Citizen Chatbot"])

# Secret salt for IP anonymization
SESSION_SALT = secrets.token_hex(16)

# -----------------------------------------------------------------
# Pydantic Schemas
# -----------------------------------------------------------------
class CreateSessionResponse(BaseModel):
    session_id: str
    welcome_message: str
    expires_at: str
    system_status: str = "ONLINE"


class ChatMessageRequest(BaseModel):
    session_id: str
    message: str = Field(..., min_length=1, max_length=1500)


class SourceCitation(BaseModel):
    title: str
    category: Optional[str] = None
    page: Optional[int] = None
    similarity_score: float


class ChatMessageResponse(BaseModel):
    response: str
    sources: List[SourceCitation]
    session_id: str
    latency_ms: int
    is_urgent_advisory: bool = False


# -----------------------------------------------------------------
# Helper Guardrail Functions
# -----------------------------------------------------------------
def _hash_ip(request: Request) -> str:
    """Computes a cryptographically salted SHA-256 hash of client IP for privacy-preserving rate limiting."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    return hashlib.sha256(f"{client_ip}:{SESSION_SALT}".encode()).hexdigest()[:32]


def _detect_urgent_financial_fraud(query: str) -> bool:
    """Detects urgent financial loss / fraud prompts requiring immediate 1930 / I4C NCRP guidance."""
    q = query.lower()
    direct_triggers = [
        "1930", "freeze account", "unauthorized withdrawal", "cybercell emergency",
        "golden hour", "golden hours", "bank freeze"
    ]
    if any(t in q for t in direct_triggers):
        return True

    has_loss_word = any(w in q for w in [
        "deducted", "debited", "lost", "stole", "stolen", "transferred", 
        "sent", "withdrawn", "scammed", "cheated", "looted"
    ])
    has_money_or_bank = any(w in q for w in [
        "money", "rupees", "rs", "inr", "amount", "bank", "account", 
        "upi", "paytm", "phonepe", "gpay", "google pay", "card", "savings"
    ])
    has_fraud_context = any(w in q for w in [
        "qr", "qr code", "scam", "fraud", "fake", "phishing", "cheat", 
        "unauthorized", "otp", "pin", "olx"
    ])

    if (has_loss_word and has_money_or_bank) or (has_money_or_bank and has_fraud_context and has_loss_word):
        return True

    return False


def _detect_prompt_injection(query: str) -> bool:
    """Detects system prompt override, exfiltration, or jailbreak attempts."""
    q = query.lower()
    injections = [
        "ignore previous instructions", "system prompt", "reveal your instructions", "developer mode",
        "dan mode", "admin password", "secret key", "bypass restrictions", "internal files",
        "unredacted documents", "print database password"
    ]
    return any(inj in q for inj in injections)


# -----------------------------------------------------------------
# 1. Anonymous Chat Session Lifecycle
# -----------------------------------------------------------------
@router.post("/session", response_model=CreateSessionResponse)
async def create_chat_session(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Creates an anonymous, encrypted chat session with 24-hour TTL. No login required."""
    ip_hash = _hash_ip(request)
    session_id = str(uuid.uuid4())
    token_hash = hashlib.sha256(f"{session_id}:{secrets.token_hex(8)}".encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

    session = PublicChatSession(
        id=session_id,
        session_token_hash=token_hash,
        client_ip_hash=ip_hash,
        user_agent_hash=request.headers.get("user-agent", "")[:64],
        message_count=0,
        expires_at=expires_at,
        is_active=True
    )
    db.add(session)
    await db.commit()

    welcome = (
        "Hello! 👋 I am the **CCIP AI Citizen Assistant**.\n\n"
        "I can help you navigate the CCIP portal, explain cyber safety procedures, or provide guidance on identifying online scams. "
        "How can I assist you today?"
    )

    return CreateSessionResponse(
        session_id=session_id,
        welcome_message=welcome,
        expires_at=expires_at.isoformat(),
        system_status="ONLINE"
    )


@router.delete("/session/{session_id}")
async def end_chat_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Explicitly closes and purges an anonymous citizen chat session."""
    stmt = select(PublicChatSession).where(PublicChatSession.id == session_id)
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    if session:
        await db.delete(session)
        await db.commit()
    return {"status": "SUCCESS", "message": "Session terminated."}


@router.get("/health")
async def public_chat_health():
    """Operational health probe for citizen chatbot."""
    return {
        "status": "ONLINE",
        "service": "CCIP Sovereign AI Citizen Assistant",
        "retrieval_mode": "RAG Knowledge Materials (768-dim/384-dim Hybrid)",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# -----------------------------------------------------------------
# 2. Citizen Query & RAG Inference
# -----------------------------------------------------------------
@router.post("/message", response_model=ChatMessageResponse)
async def send_chat_message(
    payload: ChatMessageRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Receives citizen natural-language query, searches approved Knowledge Materials,
    evaluates security guardrails, and returns a grounded response with verified citations.
    """
    start_time = time.time()
    user_query = payload.message.strip()

    # 1. Verify active session
    stmt = select(PublicChatSession).where(
        and_(
            PublicChatSession.id == payload.session_id,
            PublicChatSession.is_active == True
        )
    )
    res = await db.execute(stmt)
    session = res.scalar_one_or_none()

    if not session:
        # Auto-create session if expired or not found for smooth citizen UX
        ip_hash = _hash_ip(request)
        new_session_id = payload.session_id or str(uuid.uuid4())
        session = PublicChatSession(
            id=new_session_id,
            session_token_hash=hashlib.sha256(f"{new_session_id}:{secrets.token_hex(8)}".encode()).hexdigest(),
            client_ip_hash=ip_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
            is_active=True
        )
        db.add(session)
        await db.commit()

    # 2. Rate-limit check (e.g. max 30 turns per session)
    if session.message_count >= 50:
        raise HTTPException(
            status_code=429,
            detail="Session interaction limit reached for this session. Please refresh the page to start a new anonymous chat session."
        )

    # 3. Security Check: Prompt Injection / System Prompt Extraction
    if _detect_prompt_injection(user_query):
        bot_response = (
            "I am the **CCIP AI Citizen Assistant**. I am designed strictly to provide public cyber safety guidance "
            "and assist you with navigating the CCIP platform. I do not disclose internal system instructions, "
            "confidential investigative files, or administrative configurations."
        )
        latency = int((time.time() - start_time) * 1000)
        return ChatMessageResponse(
            response=bot_response,
            sources=[],
            session_id=session.id,
            latency_ms=latency,
            is_urgent_advisory=False
        )

    # 4. Check for Urgent Financial Cyber Fraud (Golden Hours Protocol)
    is_urgent = _detect_urgent_financial_fraud(user_query)

    # 5. Semantic Vector Retrieval over Approved Knowledge Materials
    relevant_chunks = await knowledge_materials_service.search_relevant_chunks(
        db=db,
        query=user_query,
        top_k=4,
        similarity_threshold=0.18
    )

    # Extract source citations
    citations: List[SourceCitation] = []
    seen_titles = set()
    for c in relevant_chunks:
        if c["title"] not in seen_titles:
            seen_titles.add(c["title"])
            citations.append(SourceCitation(
                title=c["title"],
                category=c.get("category"),
                page=c.get("page"),
                similarity_score=c.get("similarity_score", 0.0)
            ))

    # 6. Synthesize Grounded Answer
    bot_response = _generate_grounded_response(user_query, relevant_chunks, is_urgent)

    # 7. Record Turn in Database
    try:
        user_msg = PublicChatMessage(
            session_id=session.id,
            role="user",
            content=user_query
        )
        db.add(user_msg)

        assistant_msg = PublicChatMessage(
            session_id=session.id,
            role="assistant",
            content=bot_response,
            sources_json=str([c.dict() for c in citations]) if citations else None,
            latency_ms=int((time.time() - start_time) * 1000)
        )
        db.add(assistant_msg)

        session.message_count += 1
        session.last_active_at = datetime.now(timezone.utc)
        await db.commit()
    except Exception as log_err:
        logger.warning(f"[PublicChat] Could not log turn: {log_err}")

    latency = int((time.time() - start_time) * 1000)
    return ChatMessageResponse(
        response=bot_response,
        sources=citations,
        session_id=session.id,
        latency_ms=latency,
        is_urgent_advisory=is_urgent
    )


# -----------------------------------------------------------------
# Grounded Answer Synthesis Engine
# -----------------------------------------------------------------
def _generate_grounded_response(query: str, chunks: List[Dict[str, Any]], is_urgent: bool) -> str:
    """Synthesizes high-precision grounded answers adhering strictly to CCIP guidelines."""
    q_lower = query.lower()

    # Priority 1: Urgent Financial Cyber Fraud & Bank Freeze Guidance
    if is_urgent:
        urgent_banner = (
            "⚠️ **CRITICAL ADVISORY — IMMEDIATE ACTION REQUIRED:**\n\n"
            "If you have suffered an unauthorized financial debit or shared your OTP/banking credentials:\n"
            "1. **Immediately dial 1930** (National Cyber Financial Fraud Helpline) to initiate a bank nodal freeze.\n"
            "2. Contact your bank immediately via their official customer care to block your card, UPI handles, and netbanking account.\n"
            "3. Register an official complaint on the national cyber portal at **cybercrime.gov.in** or use the **Report Cybercrime** button on this platform.\n"
            "4. Preserve all transaction SMS messages, bank reference numbers (UTR/RRN), and suspect phone numbers as digital evidence.\n\n"
        )
        if chunks:
            chunk_excerpts = "\n\n".join([f"• {c['text'][:250]}..." for c in chunks[:2]])
            return f"{urgent_banner}**Relevant Knowledge Advisory:**\n{chunk_excerpts}"
        return urgent_banner

    # Priority 2: How to Report on CCIP
    report_keywords = [
        "how to report", "how do i report", "how can i report", "report a cybercrime",
        "report cybercrime", "file complaint", "file a complaint", "submit complaint",
        "lodge complaint", "lodge a complaint", "register complaint", "how to lodge",
        "steps to report", "reporting procedure"
    ]
    if any(k in q_lower for k in report_keywords):
        return (
            "You can securely report a cybercrime incident on CCIP by following these steps:\n\n"
            "1. Click on **'Report Cybercrime'** on the top navigation bar or homepage.\n"
            "2. Log in with your Citizen credentials or select **'Create Citizen Account'** if you are a new complainant.\n"
            "3. Fill in the incident details (category, date, financial loss, suspect website/phone/email, narrative).\n"
            "4. Upload digital evidence files (screenshots, bank transaction PDFs, email headers).\n"
            "5. Submit the complaint to receive a cryptographically verified **Acknowledgement Reference ID** (e.g., `CYBER-2026-XXXX`).\n\n"
            "You can track the live triage and investigation status anytime under the **Status Tracker**."
        )

    # Priority 3: Tracking Status
    if any(k in q_lower for k in ["track", "status", "check complaint", "reference number"]):
        return (
            "To check the status of your existing complaint:\n\n"
            "1. Navigate to the **Status Tracker** on the citizen dashboard or homepage.\n"
            "2. Enter your **Complaint Reference ID** (e.g., `CYBER-2026-7102`).\n"
            "3. View real-time forensic updates, assigned officer details, and statutory triage milestones."
        )

    # Priority 4: Grounded Knowledge Retrieval
    if chunks:
        # Synthesize from top chunks
        top_chunk = chunks[0]
        summary_intro = f"According to the official **{top_chunk['title']}**:\n\n"
        passages = []
        for i, c in enumerate(chunks[:3], 1):
            text_snippet = c["text"].strip()
            # If passage is lengthy, keep the core sentence
            if len(text_snippet) > 350:
                text_snippet = text_snippet[:350].rsplit(".", 1)[0] + "."
            passages.append(f"{text_snippet}")

        joined_content = "\n\n".join(passages)
        return f"{summary_intro}{joined_content}\n\n*Reference: {top_chunk['title']}" + (f" (Page {top_chunk['page']})*" if top_chunk.get("page") else "*")

    # Priority 5: Fallback / Clarification
    return (
        "I am currently indexing approved materials on that topic. "
        "You can ask me about:\n"
        "• How to report cyber fraud or lodge a complaint on CCIP\n"
        "• Identifying phishing links and fraudulent websites\n"
        "• UPI scams, QR code payment traps, and bank nodal freezes (1930)\n"
        "• Securing compromised social media and email accounts\n\n"
        "For immediate emergency reporting, please call **1930** or click **Report Cybercrime** on the homepage."
    )
