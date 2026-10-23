import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_evidence_listing_and_download(client: AsyncClient):
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "a.thorne@astraea.gov",
        "password": "AstraeaEnclave#42"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.get("/api/v1/evidence", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

@pytest.mark.asyncio
async def test_police_escalations_endpoint(client: AsyncClient):
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "s.chen@police.gov",
        "password": "AstraeaEnclave#42"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.get("/api/v1/police/escalations", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

@pytest.mark.asyncio
async def test_admin_departments_create_and_list(client: AsyncClient):
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "root@astraea.internal",
        "password": "AstraeaEnclave#42"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create department
    res = await client.post(
        "/api/v1/admin/departments",
        headers=headers,
        json={
            "name": "Darknet Forensics Taskforce",
            "code": "DFU",
            "unit_type": "SPECIALIST_UNIT"
        }
    )
    assert res.status_code in (200, 201)
    data = res.json()
    assert data["name"] == "Darknet Forensics Taskforce"
    assert data["code"] == "DFU"

    # List departments
    res_list = await client.get("/api/v1/admin/departments", headers=headers)
    assert res_list.status_code == 200
    assert len(res_list.json()) >= 1

@pytest.mark.asyncio
async def test_mlops_datasets_and_learning_buffer(client: AsyncClient):
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "m.vance@ai-ops.gov",
        "password": "AstraeaEnclave#42"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create dataset entry
    res = await client.post(
        "/api/v1/mlops/datasets",
        headers=headers,
        json={
            "name": "Deepfake_Acoustic_Corpus_2026.tar",
            "version": "v1.0",
            "dataset_type": "VOICE_ACOUSTICS",
            "metadata": {"sample_count": 5000}
        }
    )
    assert res.status_code in (200, 201)

    # List datasets
    res_ds = await client.get("/api/v1/mlops/datasets", headers=headers)
    assert res_ds.status_code == 200
    assert len(res_ds.json()) >= 1

    # Continuous learning buffer
    res_buf = await client.get("/api/v1/mlops/continuous-learning-buffer", headers=headers)
    assert res_buf.status_code == 200
    buf_data = res_buf.json()
    assert "currentCount" in buf_data or "current_count" in buf_data
    assert "threshold" in buf_data
    assert "status" in buf_data

@pytest.mark.asyncio
async def test_investigation_dossier_by_case(client: AsyncClient):
    # Police login to get a case ID
    police_login = await client.post("/api/v1/auth/login", json={
        "email": "s.chen@police.gov",
        "password": "AstraeaEnclave#42"
    })
    p_headers = {"Authorization": f"Bearer {police_login.json()['access_token']}"}

    cases_resp = await client.get("/api/v1/cases", headers=p_headers)
    cases = cases_resp.json()
    case_id = cases[0]["id"]

    # Specialist login
    spec_login = await client.post("/api/v1/auth/login", json={
        "email": "a.thorne@astraea.gov",
        "password": "AstraeaEnclave#42"
    })
    s_headers = {"Authorization": f"Bearer {spec_login.json()['access_token']}"}

    # Fetch investigation dossier by case_id
    inv_res = await client.get(f"/api/v1/investigations/by-case/{case_id}", headers=s_headers)
    assert inv_res.status_code == 200
    inv_data = inv_res.json()
    assert inv_data["case_id"] == case_id
    assert "actions" in inv_data
    assert "findings" in inv_data
