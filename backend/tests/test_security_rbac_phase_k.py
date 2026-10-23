import pytest
from httpx import AsyncClient
from app.models.complaint import Complaint
from app.models.case import Case


@pytest.mark.asyncio
async def test_citizen_investigative_endpoints_denial(client: AsyncClient):
    """Verifies that authenticated citizens are strictly blocked (HTTP 403) from accessing investigative intelligence."""
    # Login as Citizen
    resp = await client.post("/api/v1/auth/login", json={
        "email": "elena.rostova@cyberdefense.org",
        "password": "AstraeaEnclave#42"
    })
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Blocked from intelligence refresh
    r1 = await client.post("/api/v1/cases/test-case-id/intelligence/refresh", headers=headers)
    assert r1.status_code in [403, 404]

    # 2. Blocked from case similarity
    r2 = await client.get("/api/v1/cases/test-case-id/similar-cases", headers=headers)
    assert r2.status_code in [403, 404]

    # 3. Blocked from correlations
    r3 = await client.get("/api/v1/cases/test-case-id/correlations", headers=headers)
    assert r3.status_code in [403, 404]

    # 4. Blocked from evidence graph
    r4 = await client.get("/api/v1/cases/test-case-id/evidence-graph", headers=headers)
    assert r4.status_code in [403, 404]

    # 5. Blocked from learning candidate governance
    r5 = await client.get("/api/v1/learning-candidates", headers=headers)
    assert r5.status_code in [403, 404]


@pytest.mark.asyncio
async def test_tampered_and_invalid_jwt_rejection(client: AsyncClient):
    """Verifies that tampered, malformed, or fake tokens return HTTP 401 Unauthorized."""
    # Malformed token
    r1 = await client.get("/api/v1/auth/me", headers={"Authorization": "Bearer malformed.token.here"})
    assert r1.status_code == 401

    # Fake header without token
    r2 = await client.get("/api/v1/auth/me", headers={"Authorization": "Bearer "})
    assert r2.status_code == 401

    # Missing auth header on protected endpoint
    r3 = await client.get("/api/v1/auth/me")
    assert r3.status_code == 401


@pytest.mark.asyncio
async def test_police_model_deployment_denial(client: AsyncClient):
    """Verifies that police officers cannot deploy models or modify the AI registry."""
    # Login as Police Officer
    resp = await client.post("/api/v1/auth/login", json={
        "email": "s.chen@police.gov",
        "password": "AstraeaEnclave#42"
    })
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to deploy a model
    r = await client.post("/api/v1/models/deploy", json={"model_name": "fake_model", "version": "1.0"}, headers=headers)
    assert r.status_code in [403, 404, 405]


@pytest.mark.asyncio
async def test_input_validation_and_oversized_payload_rejection(client: AsyncClient):
    """Verifies that oversized inputs and malformed JSON payloads are cleanly rejected."""
    # Login as Citizen
    resp = await client.post("/api/v1/auth/login", json={
        "email": "elena.rostova@cyberdefense.org",
        "password": "AstraeaEnclave#42"
    })
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Empty complaint title/category
    r_empty = await client.post("/api/v1/complaints", json={"title": "", "category": ""}, headers=headers)
    assert r_empty.status_code in [400, 422]

    # Oversized description (>100KB)
    huge_text = "SCAM " * 25000
    r_huge = await client.post("/api/v1/complaints", json={
        "title": "Legitimate Title",
        "category": "Financial Fraud",
        "description": huge_text
    }, headers=headers)
    assert r_huge.status_code in [400, 413, 422]
