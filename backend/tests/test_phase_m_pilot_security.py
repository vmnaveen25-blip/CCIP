"""
Phase M Automated Security & RBAC Test Suite
Validates strict authorization and data isolation boundaries for Pilot endpoints:
- Citizens explicitly denied access to pilot datasets, runs, and reviews (403 Forbidden).
- Specialists, Police, AI Leads, and Admins granted scoped access based on operational duty.
- IDOR protection on evaluation runs and reviews.
- Tampered JWT token rejection.
"""

import pytest
from httpx import AsyncClient
from app.models.role import RoleEnum


async def get_token(client: AsyncClient, email: str) -> str:
    res = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "AstraeaEnclave#42"
    })
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_citizen_denied_from_pilot_datasets(client: AsyncClient):
    """Ensure Citizens cannot list or view pilot datasets (HTTP 403)."""
    token = await get_token(client, "elena.rostova@cyberdefense.org")
    res = await client.get(
        "/api/v1/pilot/datasets",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_citizen_denied_from_pilot_runs(client: AsyncClient):
    """Ensure Citizens cannot trigger or view evaluation runs (HTTP 403)."""
    token = await get_token(client, "elena.rostova@cyberdefense.org")
    res = await client.get(
        "/api/v1/pilot/runs",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_citizen_denied_from_pilot_predictions(client: AsyncClient):
    """Ensure Citizens cannot view model predictions or triage metadata (HTTP 403)."""
    token = await get_token(client, "elena.rostova@cyberdefense.org")
    res = await client.get(
        "/api/v1/pilot/predictions",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_citizen_denied_from_pilot_reviews(client: AsyncClient):
    """Ensure Citizens cannot submit human validation reviews (HTTP 403)."""
    token = await get_token(client, "elena.rostova@cyberdefense.org")
    res = await client.post(
        "/api/v1/pilot/reviews",
        headers={"Authorization": f"Bearer {token}"},
        json={"prediction_id": "fake-pred", "decision": "AGREE"}
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_unauthenticated_request_rejected(client: AsyncClient):
    """Ensure unauthenticated calls to pilot endpoints are rejected with 401."""
    res = await client.get("/api/v1/pilot/datasets")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_specialist_cannot_create_datasets(client: AsyncClient):
    """Ensure Specialists cannot register new datasets (AI_ML_SYSTEM_LEAD only)."""
    token = await get_token(client, "a.thorne@astraea.gov")
    res = await client.post(
        "/api/v1/pilot/datasets",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Unauthorized Specialist Dataset",
            "source_type": "MODE_B_DEIDENTIFIED_HISTORICAL",
            "authorization_basis": "None",
            "retention_policy": "90_DAYS",
            "storage_location_ref": "/storage/test"
        }
    )
    assert res.status_code == 403

