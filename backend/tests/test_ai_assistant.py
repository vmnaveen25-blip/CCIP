"""
Investigation Assistant Adapter and Endpoints Unit & Integration Tests.
Asserts exact contracts for local sovereign LLM runtime, connected states,
unavailable fallback states, and API endpoints without tautologies.
"""

import os
import pytest
from unittest.mock import patch, AsyncMock
from app.core.config import settings
from app.ai.adapters.investigation_assistant import (
    InvestigationAssistant,
    GenerativeLLMUnavailableError,
    investigation_assistant,
    generative_llm_adapter
)


@pytest.mark.asyncio
async def test_ai_assistant_initialization_and_synchronous_status():
    """Verify that assistant initializes with sovereign local LLM provider contract."""
    assistant = InvestigationAssistant()
    assert assistant.is_available is True
    assert assistant.adapter_name == "InvestigationAssistant"
    
    status = assistant.get_status()
    assert status["adapter"] == "InvestigationAssistant"
    assert status["connected"] is True
    assert status["status"] == "LOCAL AI / CASE GROUNDED"
    assert status["engine"] == "local_sovereign_llm"
    assert status["provider"] == "local"
    assert "model" in status
    assert "base_url" in status


@pytest.mark.asyncio
async def test_ai_assistant_async_status_contracts():
    """Verify truthful async status reporting for both connected and unavailable states."""
    assistant = InvestigationAssistant()

    # 1. Connected state contract
    with patch.object(generative_llm_adapter, "check_availability", new_callable=AsyncMock) as mock_check:
        mock_check.return_value = {"available": True, "model": "qwen2.5:7b"}
        status_conn = await assistant.get_status_async()
        assert status_conn["connected"] is True
        assert status_conn["status"] == "LOCAL MODEL CONNECTED"
        assert "DEPLOYED" in status_conn["weights"]
        assert status_conn["engine"] == "local_sovereign_llm"

    # 2. Unavailable state contract (TPA-001: strictly asserts connected is False)
    with patch.object(generative_llm_adapter, "check_availability", new_callable=AsyncMock) as mock_check:
        mock_check.return_value = {"available": False, "reason": "Connection refused"}
        status_unavail = await assistant.get_status_async()
        assert status_unavail["connected"] is False
        assert status_unavail["status"] == "AI_ASSISTANT_UNAVAILABLE"
        assert status_unavail["weights"] == "UNAVAILABLE"
        assert "currently unavailable" in status_unavail["message"]


@pytest.mark.asyncio
async def test_ai_assistant_generation_contracts():
    """Verify exact response semantics for success, runtime unavailability, and validation."""
    assistant = InvestigationAssistant()

    # 1. Successful generation contract
    with patch.object(generative_llm_adapter, "generate_chat", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = "Phishing domain identified: hxxp://evil-login.xyz"
        res = await assistant.generate_response(
            "Analyze suspicious URL",
            case_context={"incident_type": "Phishing", "sender": "spoofed@bank.com"}
        )
        assert res["status"] == "MODEL CONNECTED"
        assert res["connected"] is True
        assert res["source"] == "local_generative_llm"
        assert res["response"] == "Phishing domain identified: hxxp://evil-login.xyz"

    # 2. Unavailable runtime contract (TPA-001: strictly asserts NOT_AVAILABLE and connected is False)
    with patch.object(generative_llm_adapter, "generate_chat", new_callable=AsyncMock) as mock_gen:
        mock_gen.side_effect = GenerativeLLMUnavailableError("Local LLM runtime unreachable")
        res_unavail = await assistant.generate_response("Analyze case evidence")
        assert res_unavail["status"] == "NOT_AVAILABLE"
        assert res_unavail["code"] == "AI_ASSISTANT_UNAVAILABLE"
        assert res_unavail["connected"] is False
        assert res_unavail["source"] == "unavailable"
        assert "currently unavailable" in res_unavail["response"]

    # 3. Empty prompt validation contract
    res_empty = await assistant.generate_response("   ")
    assert res_empty["status"] == "ERROR"
    assert res_empty["message"] == "Prompt cannot be empty."


@pytest.mark.asyncio
async def test_ai_assistant_endpoints(client):
    """Verify HTTP contracts for /assistant/status and /assistant/query endpoints."""
    # 1. Status endpoint contract
    status_res = await client.get("/api/v1/ai/assistant/status")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["status"] == "LOCAL AI / CASE GROUNDED"
    assert status_data["connected"] is True
    assert status_data["engine"] == "local_sovereign_llm"

    # 2. Query endpoint - successful generation contract
    with patch("app.ai.adapters.investigation_assistant.generative_llm_adapter.generate_chat", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = "Threat assessment: High-confidence credential harvester."
        query_res = await client.post(
            "/api/v1/ai/assistant/query",
            json={"text": "Evaluate phishing threat campaign", "context": {"case_id": "CASE-9842"}}
        )
        assert query_res.status_code == 200
        query_data = query_res.json()
        assert query_data["status"] == "MODEL CONNECTED"
        assert query_data["connected"] is True
        assert query_data["response"] == "Threat assessment: High-confidence credential harvester."

    # 3. Query endpoint - unavailable runtime contract
    with patch("app.ai.adapters.investigation_assistant.generative_llm_adapter.generate_chat", new_callable=AsyncMock) as mock_gen:
        mock_gen.side_effect = GenerativeLLMUnavailableError("Ollama daemon offline")
        query_res_unavail = await client.post(
            "/api/v1/ai/assistant/query",
            json={"text": "Evaluate phishing threat campaign"}
        )
        assert query_res_unavail.status_code == 200
        unavail_data = query_res_unavail.json()
        assert unavail_data["status"] == "NOT_AVAILABLE"
        assert unavail_data["code"] == "AI_ASSISTANT_UNAVAILABLE"
        assert unavail_data["connected"] is False
        assert "currently unavailable" in unavail_data["response"]

    # 4. Query endpoint - empty text validation
    empty_res = await client.post("/api/v1/ai/assistant/query", json={"text": ""})
    assert empty_res.status_code == 422
    assert empty_res.json()["error"] == "INVALID_INPUT"
