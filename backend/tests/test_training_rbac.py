"""
Test Suite: Role-Based Access Control for ML Training Operations
Validates that only AI_ML_SYSTEM_LEAD can create/start/cancel training jobs,
ADMIN can view governance state, and other operational roles are strictly denied.
"""

import pytest
from httpx import AsyncClient


async def get_token(client: AsyncClient, email: str) -> str:
    res = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "AstraeaEnclave#42"
    })
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_training_rbac_permissions(client: AsyncClient):
    # 1. Login all roles
    aiml_token = await get_token(client, "m.vance@ai-ops.gov")
    admin_token = await get_token(client, "root@astraea.internal")
    police_token = await get_token(client, "s.chen@police.gov")
    spec_token = await get_token(client, "a.thorne@astraea.gov")
    citizen_token = await get_token(client, "elena.rostova@cyberdefense.org")

    headers_aiml = {"Authorization": f"Bearer {aiml_token}"}
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    headers_police = {"Authorization": f"Bearer {police_token}"}
    headers_spec = {"Authorization": f"Bearer {spec_token}"}
    headers_citizen = {"Authorization": f"Bearer {citizen_token}"}

    # 2. Runtime status: AI_ML_SYSTEM_LEAD and ADMIN can read
    res = await client.get("/api/v1/mlops/training-runtime/status", headers=headers_aiml)
    assert res.status_code == 200
    assert "runtime_type" in res.json()

    res = await client.get("/api/v1/mlops/training-runtime/status", headers=headers_admin)
    assert res.status_code == 200

    # Unauthorized roles denied runtime telemetry
    res = await client.get("/api/v1/mlops/training-runtime/status", headers=headers_police)
    assert res.status_code == 403

    res = await client.get("/api/v1/mlops/training-runtime/status", headers=headers_spec)
    assert res.status_code == 403

    res = await client.get("/api/v1/mlops/training-runtime/status", headers=headers_citizen)
    assert res.status_code == 403

    # 3. Create training job: AI_ML_SYSTEM_LEAD permitted
    payload = {
        "model_family": "feedback_gate",
        "base_model": "PyTorch MLP",
        "target_model_name": "Feedback Gate Neural Classifier",
        "target_model_version": "v1.1.0",
        "training_task": "STRUCTURED_CLASSIFICATION",
        "config_json": {"epochs": 2, "learning_rate": 0.001}
    }
    create_res = await client.post("/api/v1/mlops/training-jobs", headers=headers_aiml, json=payload)
    assert create_res.status_code == 201, create_res.text
    job_id = create_res.json()["id"]

    # Other roles denied creation
    res = await client.post("/api/v1/mlops/training-jobs", headers=headers_police, json=payload)
    assert res.status_code == 403

    res = await client.post("/api/v1/mlops/training-jobs", headers=headers_citizen, json=payload)
    assert res.status_code == 403

    res = await client.post("/api/v1/mlops/training-jobs", headers=headers_spec, json=payload)
    assert res.status_code == 403
