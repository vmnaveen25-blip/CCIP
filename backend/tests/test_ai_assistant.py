import os
import pytest
from unittest.mock import patch
from app.core.config import settings
from app.ai.adapters.investigation_assistant import InvestigationAssistant, investigation_assistant


@pytest.mark.asyncio
async def test_ai_assistant_initialization_with_env_key():
    """Verify that assistant initializes properly from environment without hardcoding secrets."""
    with patch.object(settings, "AI_ASSISTANT_API_KEY", "test_valid_dummy_key_1234567890"), \
         patch.dict(os.environ, {"AI_ASSISTANT_API_KEY": "test_valid_dummy_key_1234567890"}):
        assistant = InvestigationAssistant()
        assert assistant.is_available is True
        status = assistant.get_status()
        assert status["status"] in ["ACTIVE", "MODEL CONNECTED"]
        assert status["connected"] is True
        assert status["key_configured"] is True
        # Verify secret is masked
        assert status["masked_key"].startswith("test_v")
        assert status["masked_key"].endswith("7890")
        assert "..." in status["masked_key"]
        assert "test_valid_dummy_key_1234567890" not in str(status["masked_key"])


@pytest.mark.asyncio
async def test_ai_assistant_missing_key_graceful_validation():
    """Verify that assistant logs a clear error and fails gracefully when key is missing."""
    with patch.object(settings, "AI_ASSISTANT_API_KEY", None), \
         patch.object(settings, "GEMINI_API_KEY", None), \
         patch.dict(os.environ, {"AI_ASSISTANT_API_KEY": "", "GEMINI_API_KEY": ""}, clear=True):
        assistant = InvestigationAssistant()
        assert assistant.is_available is False
        status = assistant.get_status()
        assert status["status"] in ["UNCONFIGURED", "MODEL NOT CONNECTED"]
        assert status["connected"] is False
        assert status["key_configured"] is False
        assert status["masked_key"] == "UNCONFIGURED"

        # Calling generate_response when unconfigured returns graceful error dictionary without crashing
        res = await assistant.generate_response("Test prompt")
        assert res["status"] in ["NOT_AVAILABLE", "MODEL NOT CONNECTED"]
        assert "error" in res


@pytest.mark.asyncio
async def test_ai_assistant_endpoints(client):
    """Verify the /api/v1/ai/assistant/status and /api/v1/ai/assistant/query endpoints."""
    # Status endpoint
    status_res = await client.get("/api/v1/ai/assistant/status")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert "status" in status_data
    assert "masked_key" in status_data
    # Ensure full secret is never exposed
    assert "AQ.Ab8RN6L7xF8dpA7JUswZ9nrgkEnvZhQNRCLw0-T2Gc3Tk_qRVQ" not in status_res.text

    # Query endpoint
    query_res = await client.post(
        "/api/v1/ai/assistant/query",
        json={"text": "Evaluate phishing threat campaign"}
    )
    assert query_res.status_code == 200
    query_data = query_res.json()
    assert query_data["status"] in ["SUCCESS", "MODEL CONNECTED"]
    assert "response" in query_data
