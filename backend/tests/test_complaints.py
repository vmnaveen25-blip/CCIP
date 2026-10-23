import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_complaint_filing_and_tracking(client: AsyncClient):
    # Register citizen
    reg_resp = await client.post("/api/v1/auth/register", json={
        "name": "Maria Silva",
        "email": "maria.silva@investigation.org",
        "phone": "+91 98765 99811",
        "password": "TestPassword#2026",
        "consent": True
    })
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # File complaint
    complaint_payload = {
        "title": "Crypto Scam Impersonation Wire",
        "category": "Crypto Scam",
        "severity": "HIGH",
        "incidentDate": "2026-09-04",
        "financialLoss": 15000.0,
        "description": "Victim was lured to fake liquidity pool smart contract draining USDT balance.",
        "suspectInfo": {
            "walletAddress": "0xABC...1234",
            "website": "https://liquidity-yield-auth.cc"
        }
    }
    create_resp = await client.post("/api/v1/complaints", json=complaint_payload, headers=headers)
    assert create_resp.status_code == 201
    c_data = create_resp.json()
    assert "referenceNumber" in c_data
    assert c_data["title"] == "Crypto Scam Impersonation Wire"
    assert c_data["financialLoss"] == 15000.0
    ref_num = c_data["referenceNumber"]

    # Track by reference number
    track_resp = await client.get(f"/api/v1/complaints/track/{ref_num}")
    assert track_resp.status_code == 200
    assert track_resp.json()["referenceNumber"] == ref_num
    assert len(track_resp.json()["timeline"]) >= 1

    # List own complaints
    list_resp = await client.get("/api/v1/complaints", headers=headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 1


@pytest.mark.asyncio
async def test_evidence_upload_and_sha256(client: AsyncClient):
    # Register citizen
    reg_resp = await client.post("/api/v1/auth/register", json={
        "name": "Evidence Test User",
        "email": "evidence.test@enclave.org",
        "password": "TestPassword#2026",
        "consent": True
    })
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create complaint
    c_resp = await client.post("/api/v1/complaints", json={
        "title": "Evidence Upload Test Case",
        "category": "Financial Fraud",
        "incidentDate": "2026-09-04",
        "description": "Test case for SHA256 integrity seal upload."
    }, headers=headers)
    complaint_id = c_resp.json()["id"]

    # Upload evidence file
    file_content = b"Mock forensic packet capture log payload"
    upload_resp = await client.post(
        "/api/v1/evidence/upload",
        data={"complaint_id": complaint_id},
        files={"file": ("capture.pcap", file_content, "application/vnd.tcpdump.pcap")},
        headers=headers
    )
    assert upload_resp.status_code == 200
    ev_data = upload_resp.json()
    assert "sha256Hash" in ev_data
    assert len(ev_data["sha256Hash"]) == 64
    assert ev_data["integrity_status"] == "Submission Integrity Recorded"
    evidence_id = ev_data["id"]

    # Download evidence stream
    dl_resp = await client.get(f"/api/v1/evidence/{evidence_id}/download", headers=headers)
    assert dl_resp.status_code == 200
    assert dl_resp.content == file_content
    assert dl_resp.headers.get("X-Integrity-Status") == "Submission Integrity Recorded"
