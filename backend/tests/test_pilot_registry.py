"""
Phase M Pilot Registry Test Suite
Validates dataset registration, status transitions, and role-based access control.
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
async def test_pilot_registry_crud(client: AsyncClient):
    # 1. Login as AI_ML_SYSTEM_LEAD
    aiml_token = await get_token(client, "m.vance@ai-ops.gov")
    headers = {"Authorization": f"Bearer {aiml_token}"}

    # 2. Register new dataset
    payload = {
        "name": "De-identified Historical Incident Dataset (2025-Q4)",
        "source_type": "MODE_B_DEIDENTIFIED_HISTORICAL",
        "authorization_basis": "Legal Oversight Directive 2026-M-01",
        "retention_policy": "180_DAYS_EPHEMERAL",
        "storage_location_ref": "storage_vault/pilot_eval_data/test_split_a.jsonl",
        "total_records": 150,
        "pii_scrubbed": True
    }
    create_res = await client.post("/api/v1/pilot/datasets", headers=headers, json=payload)
    assert create_res.status_code == 201, create_res.text
    dataset = create_res.json()
    dataset_id = dataset["id"]
    assert dataset["name"] == payload["name"]
    assert dataset["status"] == "APPROVED"

    # 3. List datasets as Specialist
    spec_token = await get_token(client, "a.thorne@astraea.gov")
    list_res = await client.get("/api/v1/pilot/datasets", headers={"Authorization": f"Bearer {spec_token}"})
    assert list_res.status_code == 200
    datasets = list_res.json()
    assert any(d["id"] == dataset_id for d in datasets)

    # 4. Update status to ACTIVE as AI_ML_SYSTEM_LEAD
    update_res = await client.patch(
        f"/api/v1/pilot/datasets/{dataset_id}/status?status=ACTIVE",
        headers=headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "ACTIVE"

    # 5. Police inspector can view the active dataset
    police_token = await get_token(client, "s.chen@police.gov")
    police_res = await client.get("/api/v1/pilot/datasets", headers={"Authorization": f"Bearer {police_token}"})
    assert police_res.status_code == 200
    assert any(d["id"] == dataset_id and d["status"] == "ACTIVE" for d in police_res.json())
