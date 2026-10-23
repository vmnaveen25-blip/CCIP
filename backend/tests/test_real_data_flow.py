import pytest
from httpx import AsyncClient
from app.ai.model_manager import model_manager

@pytest.mark.asyncio
async def test_health_truthful_checks(client: AsyncClient):
    # Base health check
    res = await client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "services" in data
    assert "database" in data["services"]
    assert data["services"]["database"] in ("UP", "DOWN")

    # Truthful redis health check
    res_redis = await client.get("/api/v1/health/redis")
    assert res_redis.status_code == 200
    data_redis = res_redis.json()
    assert data_redis["status"] in ("NOT_CONFIGURED", "HEALTHY", "UNAVAILABLE")

    # Truthful database health check
    res_db = await client.get("/api/v1/health/database")
    assert res_db.status_code == 200
    data_db = res_db.json()
    assert data_db["status"] == "UP"
    assert "latency_ms" in data_db

    # Truthful storage health check
    res_storage = await client.get("/api/v1/health/storage")
    assert res_storage.status_code == 200
    data_storage = res_storage.json()
    assert data_storage["is_writable"] is True

@pytest.mark.asyncio
async def test_model_status_real_metrics(client: AsyncClient):
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "a.thorne@astraea.gov",
        "password": "AstraeaEnclave#42"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.get("/api/v1/ai/models/status", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    assert "complaint_classifier" in data["models"]
    assert "investigation_assistant" in data["models"]

    # verify classifier parsed metrics
    classifier = data["models"]["complaint_classifier"]
    assert "accuracy" in classifier
    assert "f1_score" in classifier
    assert classifier["status"] in ("LOADED", "READY", "STANDBY", "READY_FOR_LAZY_LOAD")

@pytest.mark.asyncio
async def test_citizen_dashboard_summary_isolation(client: AsyncClient):
    # Login citizen user
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "elena.rostova@cyberdefense.org",
        "password": "AstraeaEnclave#42"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch citizen dashboard summary
    res = await client.get("/api/v1/citizen/dashboard-summary", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_complaints" in data
    assert "under_investigation" in data
    assert "resolved_cases" in data
    assert "recent_complaints" in data
    assert isinstance(data["recent_complaints"], list)

@pytest.mark.asyncio
async def test_specialist_dashboard_summary(client: AsyncClient):
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "a.thorne@astraea.gov",
        "password": "AstraeaEnclave#42"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.get("/api/v1/specialist/dashboard-summary", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "assigned_cases" in data
    assert "under_investigation" in data
    assert "critical_cases" in data
    assert "total_iocs" in data
    assert "evidence_count" in data

@pytest.mark.asyncio
async def test_police_dashboard_summary(client: AsyncClient):
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "s.chen@police.gov",
        "password": "AstraeaEnclave#42"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.get("/api/v1/police/dashboard-summary", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "totalCases" in data
    assert "activeCases" in data
    assert "criticalCases" in data
    assert "escalatedCases" in data
    assert "officersCount" in data

@pytest.mark.asyncio
async def test_admin_dashboard_summary(client: AsyncClient):
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "root@astraea.internal",
        "password": "AstraeaEnclave#42"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.get("/api/v1/admin/dashboard-summary", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_users" in data
    assert "active_users" in data
    assert "total_departments" in data
    assert "total_audit_logs" in data
    assert "roles_breakdown" in data

@pytest.mark.asyncio
async def test_ai_dashboard_summary(client: AsyncClient):
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "a.thorne@astraea.gov",
        "password": "AstraeaEnclave#42"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.get("/api/v1/ai/dashboard-summary", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_models" in data
    assert "models_available" in data
    assert "models_loaded" in data
    assert "models" in data
    assert "complaint_classifier" in data["models"]
