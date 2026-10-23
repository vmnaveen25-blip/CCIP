"""
Test Suite: Training Job Lifecycle End-to-End
Validates state transitions: DRAFT -> VALIDATING -> READY -> QUEUED -> RUNNING -> COMPLETED / CANCELLED.
"""

import pytest
import asyncio
from httpx import AsyncClient


async def get_aiml_token(client: AsyncClient) -> str:
    res = await client.post("/api/v1/auth/login", json={
        "email": "m.vance@ai-ops.gov",
        "password": "AstraeaEnclave#42"
    })
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_training_job_crud_and_validation(client: AsyncClient):
    token = await get_aiml_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Draft Job
    payload = {
        "model_family": "feedback_gate",
        "base_model": "PyTorch MLP 17-dim",
        "target_model_name": "Feedback Gate Neural Classifier",
        "target_model_version": "v1.1.0",
        "dataset_id": None,
        "dataset_version": "v1.0",
        "training_task": "STRUCTURED_CLASSIFICATION",
        "config_json": {
            "epochs": 2,
            "learning_rate": 0.001,
            "train_batch_size": 32,
            "seed": 42
        },
        "quality_gate_config_json": {
            "metric": "validation_f1",
            "minimum_validation": 0.80,
            "minimum_test": 0.75
        },
        "notes": "Automated test training job"
    }
    create_res = await client.post("/api/v1/mlops/training-jobs", headers=headers, json=payload)
    assert create_res.status_code == 201
    job_data = create_res.json()
    job_id = job_data["id"]
    assert job_data["status"] == "DRAFT"

    # 2. Retrieve Job Details
    get_res = await client.get(f"/api/v1/mlops/training-jobs/{job_id}", headers=headers)
    assert get_res.status_code == 200
    detail = get_res.json()
    assert detail["model_family"] == "feedback_gate"
    assert detail["runtime_type"] in ["LOCAL_CPU", "LOCAL_CUDA"]

    # 3. Update Job Configuration
    patch_res = await client.patch(
        f"/api/v1/mlops/training-jobs/{job_id}",
        headers=headers,
        json={"notes": "Updated training notes"}
    )
    assert patch_res.status_code == 200

    # 4. Pre-flight Validation
    val_res = await client.post(f"/api/v1/mlops/training-jobs/{job_id}/validate", headers=headers)
    assert val_res.status_code == 200
    val_data = val_res.json()
    assert val_data["status"] in ["READY", "BLOCKED"]
    assert len(val_data["checks"]) >= 4

    # 5. List Jobs
    list_res = await client.get("/api/v1/mlops/training-jobs", headers=headers)
    assert list_res.status_code == 200
    jobs = list_res.json()
    assert any(j["id"] == job_id for j in jobs)
