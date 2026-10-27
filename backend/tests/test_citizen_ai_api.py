import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_citizen_ai_assist_url_phishing_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "query_type": "url",
            "content": "http://verify-bank-security-login.top/account"
        }
        res = await ac.post("/api/v1/ai/citizen/assist", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["modality"] == "url"
        assert "risk_level" in data
        assert "explainable_reasons" in data
        assert len(data["explainable_reasons"]) > 0
        assert "recommended_actions" in data
        assert "can_prefill_complaint" in data


@pytest.mark.asyncio
async def test_citizen_ai_assist_sms_smishing_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "query_type": "sms",
            "content": "Dear customer, your SBI NetBanking is suspended. Enter OTP immediately on: http://sbi-update.xyz"
        }
        res = await ac.post("/api/v1/ai/citizen/assist", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["modality"] == "sms"
        assert "risk_level" in data
        assert len(data["explainable_reasons"]) > 0


@pytest.mark.asyncio
async def test_citizen_ai_assist_portal_guidance_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "query_type": "portal_help",
            "content": "How do I file a cybercrime complaint on CCIP?"
        }
        res = await ac.post("/api/v1/ai/citizen/assist", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["modality"] == "portal_help"
        assert "guidance_steps" in data
        assert len(data["guidance_steps"]) >= 4


@pytest.mark.asyncio
async def test_citizen_ai_assist_email_threat_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "query_type": "email",
            "content": "URGENT: Outstanding wire invoice #99182 requires immediate payment to avoid termination of services. Please remit payment to our updated overseas vendor banking coordinates immediately."
        }
        res = await ac.post("/api/v1/ai/citizen/assist", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["modality"] == "email"
        assert data["risk_level"] == "HIGH_RISK"
        assert len(data["explainable_reasons"]) > 0


@pytest.mark.asyncio
async def test_citizen_ai_assist_userinfo_phishing_url():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "query_type": "url",
            "content": "www.wertyu@.tech/ai.com"
        }
        res = await ac.post("/api/v1/ai/citizen/assist", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["modality"] == "url"
        assert data["risk_level"] == "HIGH_RISK"
        assert any("@" in r or "userinfo" in r.lower() or "rfc" in r.lower() for r in data["explainable_reasons"])


@pytest.mark.asyncio
async def test_citizen_ai_assist_empty_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "query_type": "url",
            "content": ""
        }
        res = await ac.post("/api/v1/ai/citizen/assist", json=payload)
        assert res.status_code == 422

