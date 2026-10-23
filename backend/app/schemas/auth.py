import re
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator


def normalize_indian_phone_number(v: Optional[str]) -> Optional[str]:
    if not v:
        return None
    # Strip whitespace, hyphens, parens, periods
    clean = re.sub(r'[\s\-\(\)\.]', '', v)
    # 10 digits starting with [6-9]
    if re.fullmatch(r'[6-9]\d{9}', clean):
        return f"+91{clean}"
    # 12 digits starting with 91[6-9]
    if re.fullmatch(r'91[6-9]\d{9}', clean):
        return f"+{clean}"
    # +91 followed by 10 digits starting with [6-9]
    if re.fullmatch(r'\+91[6-9]\d{9}', clean):
        return clean
    # 11 digits starting with 0[6-9]
    if re.fullmatch(r'0[6-9]\d{9}', clean):
        return f"+91{clean[1:]}"
    raise ValueError("Invalid Indian mobile number. Please enter a 10-digit mobile number starting with 6, 7, 8, or 9 (e.g. +91 98765 43210).")


class TokenResponse(BaseModel):
    access_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: Optional[int] = 1800
    user: Optional["UserPublicResponse"] = None
    is_new_user: bool = False
    onboarding_token: Optional[str] = None
    message: Optional[str] = None


class CitizenRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=30)
    password: str = Field(..., min_length=8)
    consent: bool = Field(True)

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        return normalize_indian_phone_number(v)


class LoginRequest(BaseModel):
    email: str  # can be email, badge_number, or staff ID
    password: str
    remember_me: Optional[bool] = False
    mfa_code: Optional[str] = None
    target_role: Optional[str] = None


class StaffLoginRequest(BaseModel):
    staff_id: str  # e.g. LEO-8492 or staff email
    password: str
    mfa_code: Optional[str] = None
    target_role: Optional[str] = None


class GoogleAuthRequest(BaseModel):
    code: Optional[str] = None
    credential: Optional[str] = None  # Google Identity Services / One-Tap ID token
    id_token: Optional[str] = None
    state: Optional[str] = None
    redirect_uri: Optional[str] = None


class GoogleExchangeRequest(BaseModel):
    auth_ticket: Optional[str] = Field(None, min_length=16, description="One-time single-use authorization ticket")
    auth_code: Optional[str] = Field(None, min_length=16, description="One-time single-use authorization code")

    @property
    def ticket(self) -> str:
        return self.auth_ticket or self.auth_code or ""


class PhoneSendOTPRequest(BaseModel):
    phone: str = Field(..., min_length=8, max_length=25)

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        norm = normalize_indian_phone_number(v)
        if not norm:
            raise ValueError("Mobile number is required.")
        return norm


class PhoneVerifyOTPRequest(BaseModel):
    phone: str
    otp: str = Field(..., min_length=6, max_length=6)
    full_name: Optional[str] = Field(None, max_length=150)
    email: Optional[EmailStr] = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        norm = normalize_indian_phone_number(v)
        if not norm:
            raise ValueError("Mobile number is required.")
        return norm


class PhoneCompleteOnboardingRequest(BaseModel):
    onboarding_token: str
    full_name: str = Field(..., min_length=2, max_length=150)
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    consent: bool = Field(True)

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        return normalize_indian_phone_number(v)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)


class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = None


class MessageResponse(BaseModel):
    message: str
    success: bool = True
    data: Optional[dict] = None


from app.schemas.user import UserPublicResponse
TokenResponse.model_rebuild()
