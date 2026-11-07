import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_public_chat_session_and_message_flow(client):
    """Verify anonymous public citizen assistant flow without login credentials."""
    # 1. Health check probe
    health_resp = await client.get("/api/v1/public-chat/health")
    assert health_resp.status_code == 200
    health_data = health_resp.json()
    assert health_data["status"] in ("ONLINE", "DEGRADED", "AVAILABLE")

    # 2. Create anonymous session
    session_resp = await client.post("/api/v1/public-chat/session")
    assert session_resp.status_code == 200
    session_data = session_resp.json()
    assert "session_id" in session_data
    session_id = session_data["session_id"]
    session_token = session_resp.cookies.get("ccip_chat_session") or session_data.get("session_token") or session_id

    # 3. Query with emergency 1930 / financial fraud keywords
    urgency_msg = {
        "session_id": session_id,
        "session_token": session_token,
        "message": "I lost 50000 rupees in a UPI QR code scam 30 minutes ago, how to freeze?"
    }
    urgency_resp = await client.post("/api/v1/public-chat/message", json=urgency_msg)
    assert urgency_resp.status_code == 200
    urgency_data = urgency_resp.json()
    assert urgency_data["is_urgent_advisory"] is True
    assert "1930" in urgency_data["response"]

    # 4. Standard cyber safety advisory query
    faq_msg = {
        "session_id": session_id,
        "session_token": session_token,
        "message": "How do I report a cybercrime incident on CCIP?"
    }
    faq_resp = await client.post("/api/v1/public-chat/message", json=faq_msg)
    assert faq_resp.status_code == 200
    faq_data = faq_resp.json()
    assert len(faq_data["response"]) > 20

    # 5. Delete session
    del_resp = await client.delete(
        f"/api/v1/public-chat/session/{session_id}",
        headers={"X-Session-Token": session_token}
    )
    assert del_resp.status_code == 200
