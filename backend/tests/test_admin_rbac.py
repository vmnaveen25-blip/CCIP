import pytest
from httpx import AsyncClient
from app.ai.adapters.complaint_classifier import complaint_classifier
from app.ai.adapters.investigation_assistant import investigation_assistant
from app.ai.adapters.url_analyzer import url_analyzer


@pytest.mark.asyncio
async def test_ai_adapters_safe_not_available():
    """Ensure AI adapter interfaces cleanly return NOT_AVAILABLE without fabricating predictions."""
    res1 = await complaint_classifier.classify("Wire transfer fraud narrative text")
    assert res1["status"] in ["NOT_AVAILABLE", "SUCCESS"]

    res2 = await url_analyzer.analyze_url("https://malicious-phish-domain.cc")
    assert res2["status"] == "NOT_AVAILABLE"

    res3 = await investigation_assistant.generate_response("How to trace BitcoinSegWit transaction?")
    assert res3["status"] in ["NOT_AVAILABLE", "MODEL CONNECTED", "AI_ASSISTANT_UNAVAILABLE"]


@pytest.mark.asyncio
async def test_citizen_forbidden_from_admin_and_police_apis(client: AsyncClient):
    # Register citizen
    reg_resp = await client.post("/api/v1/auth/register", json={
        "name": "Standard Citizen",
        "email": "standard.citizen@privacy.org",
        "password": "CitizenPassword#2026",
        "consent": True
    })
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to access admin users list -> should be 403 Forbidden
    admin_resp = await client.get("/api/v1/admin/users", headers=headers)
    assert admin_resp.status_code == 403

    # Attempt to access police dashboard stats -> should be 403 Forbidden
    police_resp = await client.get("/api/v1/police/dashboard-stats", headers=headers)
    assert police_resp.status_code == 403

    # Attempt to access MLOps model registry -> should be 403 Forbidden
    mlops_resp = await client.get("/api/v1/mlops/models", headers=headers)
    assert mlops_resp.status_code == 403
