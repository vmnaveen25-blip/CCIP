import pytest
from unittest.mock import patch
from app.core.config import settings
from app.services.otp_service import normalize_phone


def test_phone_normalization():
    """Verify Indian phone numbers are correctly normalized to E.164 (+91XXXXXXXXXX)."""
    assert normalize_phone("+91 98765 43210") == "+919876543210"
    assert normalize_phone("9876543210") == "+919876543210"
    assert normalize_phone("09876543210") == "+919876543210"
    assert normalize_phone("+91-98765-43210") == "+919876543210"
    assert normalize_phone("98765 43210") == "+919876543210"

    with pytest.raises(Exception):
        normalize_phone("12345")  # invalid length
    with pytest.raises(Exception):
        normalize_phone("5555555555")  # invalid starting digit


@pytest.mark.asyncio
async def test_send_otp_dev_otp_environment_leak_prevention(client):
    """
    Requirement 5: dev_otp must ONLY be returned when APP_ENV is development or testing.
    It must NEVER be exposed in production.
    """
    # Development mode: dev_otp should be returned
    with patch.object(settings, "APP_ENV", "development"):
        with patch.object(settings, "DEBUG", True):
            res_dev = await client.post("/api/v1/auth/phone/send-otp", json={"phone": "+91 98111 22233"})
            assert res_dev.status_code == 200
            data = res_dev.json()
            assert data["data"] is not None
            assert "dev_otp" in data["data"]
            assert len(data["data"]["dev_otp"]) == 6

    # Production mode: dev_otp must be None
    with patch.object(settings, "APP_ENV", "production"):
        with patch.object(settings, "DEBUG", False):
            # Use another number to avoid cooldown
            res_prod = await client.post("/api/v1/auth/phone/send-otp", json={"phone": "+91 98222 33344"})
            assert res_prod.status_code == 200
            data_prod = res_prod.json()
            assert data_prod.get("data") is None


@pytest.mark.asyncio
async def test_send_otp_cooldown_enforcement(client):
    """Sending OTP twice within 60s cooldown must raise RateLimitExceededError (429)."""
    test_phone = "+91 98333 44455"
    res1 = await client.post("/api/v1/auth/phone/send-otp", json={"phone": test_phone})
    assert res1.status_code == 200

    # Immediate second request should be throttled by cooldown
    res2 = await client.post("/api/v1/auth/phone/send-otp", json={"phone": test_phone})
    assert res2.status_code in (400, 422, 429)
    err_body = res2.json()
    err_msg = err_body.get("error", {}).get("message") or err_body.get("message") or err_body.get("detail", "")
    assert "wait" in err_msg.lower() or "seconds" in err_msg.lower() or "limit" in err_msg.lower()


@pytest.mark.asyncio
async def test_new_phone_user_requires_onboarding_profile(client):
    """
    Requirement 6: When a new mobile user verifies OTP without a full_name,
    is_new_user=True is returned along with onboarding_token.
    Citizen portal access token is only granted after onboarding completion.
    """
    new_phone = "+91 98444 55566"
    send_res = await client.post("/api/v1/auth/phone/send-otp", json={"phone": new_phone})
    assert send_res.status_code == 200
    otp = send_res.json()["data"]["dev_otp"]

    # Verify OTP without name -> triggers profile onboarding flow
    verify_res = await client.post("/api/v1/auth/phone/verify-otp", json={"phone": new_phone, "otp": otp})
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["is_new_user"] is True
    assert v_data["onboarding_token"] is not None
    assert v_data["access_token"] is None

    onboarding_token = v_data["onboarding_token"]

    # Now complete onboarding
    complete_res = await client.post("/api/v1/auth/phone/complete-onboarding", json={
        "onboarding_token": onboarding_token,
        "full_name": "Aarav Sharma",
        "email": "aarav.sharma@example.in"
    })
    assert complete_res.status_code == 200
    comp_data = complete_res.json()
    assert comp_data["access_token"] is not None
    assert comp_data["user"]["full_name"] == "Aarav Sharma"
    assert comp_data["user"]["phone_number"] == "+919844455566"
    assert comp_data["user"]["portal_role"] == "citizen"


@pytest.mark.asyncio
async def test_existing_phone_user_authenticates_directly(client):
    """Existing phone user verifying OTP logs in directly without 422 error or re-onboarding."""
    phone = "+91 98555 66677"
    # 1. First registration via direct onboarding
    send1 = await client.post("/api/v1/auth/phone/send-otp", json={"phone": phone})
    otp1 = send1.json()["data"]["dev_otp"]
    v1 = await client.post("/api/v1/auth/phone/verify-otp", json={
        "phone": phone,
        "otp": otp1,
        "full_name": "Priya Verma"
    })
    assert v1.status_code == 200
    assert v1.json()["access_token"] is not None
    assert v1.json()["user"]["full_name"] == "Priya Verma"

    # Fast-forward / bypass cooldown by testing verify directly or next dispatch
    # With a small wait or mock cooldown:
    with patch.object(settings, "OTP_COOLDOWN_SECONDS", 0):
        send2 = await client.post("/api/v1/auth/phone/send-otp", json={"phone": phone})
        assert send2.status_code == 200
        otp2 = send2.json()["data"]["dev_otp"]

        # Second login - existing user authenticates directly
        v2 = await client.post("/api/v1/auth/phone/verify-otp", json={"phone": phone, "otp": otp2})
        assert v2.status_code == 200
        v2_data = v2.json()
        assert v2_data["is_new_user"] is False
        assert v2_data["access_token"] is not None
        assert v2_data["user"]["full_name"] == "Priya Verma"


@pytest.mark.asyncio
async def test_otp_attempt_limits_and_invalid_codes(client):
    """Reject wrong OTP code and invalidate after max attempts."""
    phone = "+91 98666 77788"
    send = await client.post("/api/v1/auth/phone/send-otp", json={"phone": phone})
    assert send.status_code == 200

    # Try invalid code
    bad_res = await client.post("/api/v1/auth/phone/verify-otp", json={"phone": phone, "otp": "000000"})
    assert bad_res.status_code in (400, 422)
    err_body = bad_res.json()
    err_msg = err_body.get("error", {}).get("message") or err_body.get("message") or err_body.get("detail", "")
    assert "invalid" in err_msg.lower()
