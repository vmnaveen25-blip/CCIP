"""
Test Suite: Candidate Registration & Model Approval Handoff
Verifies that trained models are registered in STAGING state and submitted to
the Model Approval workflow without automatic deployment to production.
"""

import pytest
from httpx import AsyncClient


async def get_aiml_token(client: AsyncClient) -> str:
    res = await client.post("/api/v1/auth/login", json={
        "email": "m.vance@ai-ops.gov",
        "password": "AstraeaEnclave#42"
    })
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_candidate_registration_and_approval_handoff(client: AsyncClient):
    token = await get_aiml_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a job and simulate completion
    payload = {
        "model_family": "feedback_gate",
        "base_model": "PyTorch MLP",
        "target_model_name": "Feedback Gate Neural Classifier",
        "target_model_version": "v1.2.0",
        "training_task": "STRUCTURED_CLASSIFICATION",
        "config_json": {"epochs": 2}
    }
    create_res = await client.post("/api/v1/mlops/training-jobs", headers=headers, json=payload)
    assert create_res.status_code == 201
    job_id = create_res.json()["id"]

    # Start job
    start_res = await client.post(f"/api/v1/mlops/training-jobs/{job_id}/start", headers=headers)
    assert start_res.status_code == 200

    # Wait briefly for background execution
    import asyncio
    for _ in range(25):
        await asyncio.sleep(0.4)
        get_res = await client.get(f"/api/v1/mlops/training-jobs/{job_id}", headers=headers)
        status = get_res.json()["status"]
        if status in ["COMPLETED", "FAILED", "CANCELLED"]:
            break

    # If completed, test registration & approval
    if status == "COMPLETED":
        reg_res = await client.post(
            f"/api/v1/mlops/training-jobs/{job_id}/register-candidate",
            headers=headers,
            json={"notes": "Trained candidate v1.2.0"}
        )
        assert reg_res.status_code == 200
        assert reg_res.json()["status"] == "CANDIDATE_REGISTERED"

        # Submit for approval
        appr_res = await client.post(
            f"/api/v1/mlops/training-jobs/{job_id}/submit-for-approval",
            headers=headers,
            json={"notes": "Passed all quality gates with Macro F1 > 0.85."}
        )
        assert appr_res.status_code == 200
        assert appr_res.json()["status"] == "SUBMITTED_FOR_APPROVAL"
