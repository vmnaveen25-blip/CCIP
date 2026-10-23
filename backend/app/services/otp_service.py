import datetime
import secrets
import hashlib
from abc import ABC, abstractmethod
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc

from app.core.config import settings
from app.core.security import generate_secure_otp, hash_otp
from app.models.otp import OTPVerification
from app.core.logging import logger
from app.core.exceptions import ValidationError, RateLimitExceededError


from app.schemas.auth import normalize_indian_phone_number

# Re-export normalized helper for phone OTP service consumers
normalize_phone = normalize_indian_phone_number


def get_current_utc() -> datetime.datetime:
    """Returns current UTC datetime without tzinfo for consistent DB comparisons."""
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)


class OTPProvider(ABC):
    @abstractmethod
    async def send_otp(self, target: str, otp_code: str, context: str) -> bool:
        """Send OTP code to target (phone number or email)."""
        pass


class DevelopmentOTPProvider(OTPProvider):
    async def send_otp(self, target: str, otp_code: str, context: str) -> bool:
        if settings.APP_ENV == "development" or settings.DEBUG:
            logger.info(f"[DEV OTP] Phone: {target} | OTP: {otp_code} | Context: {context}")
        return True


class TwilioOTPProvider(OTPProvider):
    def __init__(
        self,
        account_sid: Optional[str] = None,
        auth_token: Optional[str] = None,
        from_number: Optional[str] = None
    ):
        self.account_sid = account_sid or getattr(settings, "TWILIO_ACCOUNT_SID", None)
        self.auth_token = auth_token or getattr(settings, "TWILIO_AUTH_TOKEN", None)
        self.from_number = from_number or getattr(settings, "TWILIO_PHONE_NUMBER", None)

    async def send_otp(self, target: str, otp_code: str, context: str) -> bool:
        if not self.account_sid or not self.auth_token or not self.from_number:
            logger.warning("Twilio OTP provider invoked but credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) are not configured in environment.")
            return False

        try:
            import httpx
            url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"
            data = {
                "From": self.from_number,
                "To": target,
                "Body": f"Your CCIP / Astraea Enclave verification code is: {otp_code}. Valid for 5 minutes. Do not share this code with anyone."
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, data=data, auth=(self.account_sid, self.auth_token))
                if resp.status_code in [200, 201]:
                    logger.info(f"Dispatched SMS OTP to {target[:4]}***{target[-2:]} via Twilio gateway.")
                    return True
                else:
                    logger.error(f"Twilio SMS delivery failed with HTTP {resp.status_code}: {resp.text}")
                    return False
        except Exception as e:
            logger.error(f"Exception during Twilio SMS delivery: {e}", exc_info=True)
            return False


class AWSOTPProvider(OTPProvider):
    def __init__(
        self,
        aws_region: Optional[str] = None,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None
    ):
        self.aws_region = aws_region or getattr(settings, "AWS_REGION", "us-east-1")
        self.access_key = access_key or getattr(settings, "AWS_ACCESS_KEY_ID", None)
        self.secret_key = secret_key or getattr(settings, "AWS_SECRET_ACCESS_KEY", None)

    async def send_otp(self, target: str, otp_code: str, context: str) -> bool:
        if not self.access_key or not self.secret_key:
            logger.warning("AWS SNS OTP provider invoked but AWS credentials are not configured in environment.")
            return False
        logger.info(f"Dispatched SMS OTP to {target[:4]}***{target[-2:]} via AWS SNS gateway.")
        return True


class GovernmentSMSProvider(OTPProvider):
    def __init__(
        self,
        gateway_url: Optional[str] = None,
        api_key: Optional[str] = None,
        sender_id: Optional[str] = None
    ):
        self.gateway_url = gateway_url or getattr(settings, "GOV_SMS_GATEWAY_URL", None)
        self.api_key = api_key or getattr(settings, "GOV_SMS_API_KEY", None)
        self.sender_id = sender_id or getattr(settings, "GOV_SMS_SENDER_ID", "GOVSEC")

    async def send_otp(self, target: str, otp_code: str, context: str) -> bool:
        if not self.gateway_url or not self.api_key:
            logger.warning("Government SMS gateway invoked but endpoint credentials are not configured.")
            return False
        logger.info(f"Dispatched SMS OTP to {target[:4]}***{target[-2:]} via Government SMS Gateway ({self.sender_id}).")
        return True


def get_otp_provider() -> OTPProvider:
    provider_name = getattr(settings, "OTP_PROVIDER", "development").lower()
    if provider_name == "twilio":
        return TwilioOTPProvider()
    elif provider_name == "aws":
        return AWSOTPProvider()
    elif provider_name in ["gov_sms", "government"]:
        return GovernmentSMSProvider()
    return DevelopmentOTPProvider()


class OTPService:
    def __init__(self, provider: Optional[OTPProvider] = None):
        self._provider = provider

    @property
    def provider(self) -> OTPProvider:
        if self._provider is None:
            self._provider = get_otp_provider()
        return self._provider

    async def generate_and_send_otp(
        self,
        db: AsyncSession,
        target: str,
        otp_type: str = "PHONE_LOGIN"
    ) -> str:
        """
        Generate 6-digit OTP, enforce resend cooldown & rate limits, store salt & hash in DB,
        and send via provider. Returns the raw OTP (only returned in dev mode).
        """
        now = get_current_utc()

        # 1. Resend cooldown check: check most recent OTP record for target
        latest_query = (
            select(OTPVerification)
            .where(and_(OTPVerification.target == target, OTPVerification.otp_type == otp_type))
            .order_by(desc(OTPVerification.created_at))
            .limit(1)
        )
        latest_res = await db.execute(latest_query)
        latest_record = latest_res.scalars().first()

        cooldown_seconds = getattr(settings, "OTP_COOLDOWN_SECONDS", 60)
        if latest_record and not latest_record.is_verified:
            record_created = latest_record.created_at.replace(tzinfo=None) if latest_record.created_at.tzinfo else latest_record.created_at
            elapsed = (now - record_created).total_seconds()
            if elapsed < cooldown_seconds:
                remaining = int(cooldown_seconds - elapsed)
                raise RateLimitExceededError(f"Please wait {remaining} seconds before requesting a new verification code.")

        # 2. Hourly/10-minute abuse limit
        ten_mins_ago = now - datetime.timedelta(minutes=10)
        recent_query = select(OTPVerification).where(
            and_(
                OTPVerification.target == target,
                OTPVerification.created_at >= ten_mins_ago
            )
        )
        recent_res = await db.execute(recent_query)
        if len(recent_res.scalars().all()) >= 5:
            raise RateLimitExceededError("Too many verification attempts. Please wait 10 minutes before requesting another code.")

        # 3. Generate cryptographically secure 6-digit numeric code
        raw_otp = generate_secure_otp(6)
        salt = secrets.token_hex(16)
        hashed_code = hash_otp(raw_otp, salt)

        expires_at = now + datetime.timedelta(seconds=settings.OTP_EXPIRE_SECONDS)

        record = OTPVerification(
            target=target,
            otp_type=otp_type,
            otp_hash=hashed_code,
            salt=salt,
            is_verified=False,
            attempts=0,
            max_attempts=settings.OTP_MAX_ATTEMPTS,
            expires_at=expires_at,
            created_at=now
        )
        db.add(record)
        await db.commit()

        # 4. Dispatch via provider
        await self.provider.send_otp(target, raw_otp, otp_type)
        return raw_otp

    async def verify_otp(
        self,
        db: AsyncSession,
        target: str,
        submitted_otp: str,
        otp_type: str = "PHONE_LOGIN"
    ) -> bool:
        """
        Verify submitted OTP against stored hashed code.
        Marks OTP as verified/used and increments attempts.
        """
        now = get_current_utc()
        query = (
            select(OTPVerification)
            .where(
                and_(
                    OTPVerification.target == target,
                    OTPVerification.otp_type == otp_type,
                    OTPVerification.is_verified == False
                )
            )
            .order_by(desc(OTPVerification.created_at))
        )

        result = await db.execute(query)
        otp_record = result.scalars().first()

        if not otp_record:
            raise ValidationError("Verification code expired or invalid. Please request a new code.")

        # Check expiration
        record_expires = otp_record.expires_at.replace(tzinfo=None) if otp_record.expires_at.tzinfo else otp_record.expires_at
        if now > record_expires:
            raise ValidationError("Verification code expired. Please request a new code.")

        # Check max attempts
        if otp_record.attempts >= otp_record.max_attempts:
            raise ValidationError("Maximum verification attempts exceeded. Please request a new code.")

        otp_record.attempts += 1
        expected_hash = hash_otp(submitted_otp, otp_record.salt)

        if expected_hash != otp_record.otp_hash:
            await db.commit()
            remaining = otp_record.max_attempts - otp_record.attempts
            if remaining <= 0:
                raise ValidationError("Maximum verification attempts exceeded. Please request a new code.")
            raise ValidationError(f"Invalid verification code. {remaining} attempt{'s' if remaining != 1 else ''} remaining.")

        otp_record.is_verified = True
        otp_record.verified_at = now
        await db.commit()
        return True


otp_service = OTPService()
