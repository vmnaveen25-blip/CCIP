import datetime
import secrets
import hashlib
from typing import Any, Dict, Optional, Tuple
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError

from app.core.config import settings

# Argon2id password hasher with high security parameters
ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,  # 64 MB
    parallelism=4,
    hash_len=32,
    salt_len=16
)


def hash_password(password: str) -> str:
    """Hash a plaintext password using Argon2id."""
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against an Argon2id hash."""
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def needs_rehash(hashed_password: str) -> bool:
    """Check if the password hash needs to be upgraded."""
    try:
        return ph.check_needs_rehash(hashed_password)
    except Exception:
        return True


def create_access_token(data: Dict[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Generate a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    token_type = to_encode.get("type", "access")
    to_encode.update({"exp": expire, "iat": datetime.datetime.now(datetime.timezone.utc), "type": token_type})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> Tuple[str, str]:
    """
    Generate a secure refresh token.
    Returns: (raw_token_for_client, hashed_token_for_db)
    """
    random_secret = secrets.token_urlsafe(48)
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    to_encode.update({
        "exp": expire,
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "jti": random_secret,
        "type": "refresh"
    })
    raw_token = jwt.encode(to_encode, settings.JWT_REFRESH_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    token_hash = hash_token_string(raw_token)
    return raw_token, token_hash


def decode_token(token: str, is_refresh: bool = False, expected_type: Optional[str] = None) -> Dict[str, Any]:
    """Decode and validate a JWT access, refresh, or custom token."""
    secret = settings.JWT_REFRESH_SECRET_KEY if is_refresh else settings.JWT_SECRET_KEY
    if not expected_type:
        expected_type = "refresh" if is_refresh else "access"
    payload = jwt.decode(token, secret, algorithms=[settings.JWT_ALGORITHM])
    if expected_type and payload.get("type") != expected_type:
        raise jwt.InvalidTokenError(f"Expected token type '{expected_type}', got '{payload.get('type')}'")
    return payload


def hash_token_string(token: str) -> str:
    """Compute SHA-256 hash of a token string for safe database storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def compute_sha256_hex(data: bytes) -> str:
    """Compute SHA-256 hex digest of arbitrary binary data."""
    return hashlib.sha256(data).hexdigest()


def generate_secure_otp(length: int = 6) -> str:
    """Generate a cryptographically secure numeric OTP string."""
    return "".join(secrets.choice("0123456789") for _ in range(length))


def hash_otp(otp: str, salt: str) -> str:
    """Hash an OTP code with a salt for secure database verification."""
    return hashlib.sha256((otp + ":" + salt).encode("utf-8")).hexdigest()


def validate_password_strength(password: str) -> Tuple[bool, Optional[str]]:
    """
    Validate password complexity:
    - At least 8 characters long
    - Contains at least 1 uppercase letter
    - Contains at least 1 lowercase letter
    - Contains at least 1 digit
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters in length."
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter."
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter."
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number."
    return True, None
