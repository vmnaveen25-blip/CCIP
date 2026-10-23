import datetime
import secrets
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError


from app.models.user import User
from app.models.role import Role, RoleEnum
from app.models.session import UserSession
from app.models.refresh_token import RefreshToken
from app.models.password_reset import PasswordResetRequest
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_token_string,
    generate_secure_otp,
    hash_otp,
    validate_password_strength
)
from app.core.config import settings
from app.core.exceptions import AuthenticationError, ValidationError, PermissionDeniedError
from app.services.user_service import user_service
from app.services.otp_service import otp_service
from app.services.audit_service import audit_service
from app.core.logging import logger


class AuthService:
    @staticmethod
    async def register_citizen(
        db: AsyncSession,
        name: str,
        email: str,
        password: str,
        phone: Optional[str] = None,
        ip_address: Optional[str] = "127.0.0.1",
        user_agent: Optional[str] = None
    ) -> Tuple[User, str, str]:
        """Register a new citizen account."""
        email_clean = email.strip().lower()
        existing = await user_service.get_by_email(db, email_clean)
        if existing:
            raise ValidationError("An account with this email address already exists")

        # Validate unique mobile number
        if phone:
            clean_phone = phone.strip()
            existing_phone = await user_service.get_by_phone(db, clean_phone)
            if existing_phone:
                raise ValidationError("An account with this mobile number already exists. Please use a different number or sign in.")

        # Validate password strength
        is_valid, err_msg = validate_password_strength(password)
        if not is_valid:
            raise ValidationError(err_msg or "Password does not meet minimum security requirements.")

        # Fetch or auto-create Citizen Role
        role_q = select(Role).where(Role.name == RoleEnum.CITIZEN.value)
        role_res = await db.execute(role_q)
        citizen_role = role_res.scalars().first()
        if not citizen_role:
            citizen_role = Role(
                name=RoleEnum.CITIZEN.value,
                display_name="Verified Citizen",
                description="Public citizen reporting and tracking access"
            )
            db.add(citizen_role)
            await db.flush()

        user = User(
            email=email_clean,
            phone_number=phone,
            full_name=name.strip(),
            password_hash=hash_password(password),
            role_id=citizen_role.id,
            clearance_level="CITIZEN TIER",
            is_active=True,
            is_verified=True,
            is_staff=False,
            mfa_type="SMS_OTP" if phone else "NONE"
        )
        db.add(user)
        try:
            await db.commit()
            await db.refresh(user, ["role"])
        except IntegrityError:
            await db.rollback()
            raise ValidationError("An account with this email address or mobile number already exists.")


        # Create session tokens
        access_token = create_access_token({"sub": user.id, "role": citizen_role.name, "email": user.email})
        raw_refresh, token_hash = create_refresh_token({"sub": user.id})

        # Save refresh token
        expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        rf_record = RefreshToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at)
        db.add(rf_record)
        await db.commit()

        # Audit log
        await audit_service.log_event(
            db=db,
            actor=user.full_name,
            action="CITIZEN_REGISTRATION",
            resource=f"user:{user.id}",
            clearance="CITIZEN TIER",
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent
        )

        return user, access_token, raw_refresh

    @staticmethod
    async def login_user(
        db: AsyncSession,
        identifier: str,
        password: str,
        mfa_code: Optional[str] = None,
        target_role: Optional[str] = None,
        ip_address: Optional[str] = "127.0.0.1",
        user_agent: Optional[str] = None
    ) -> Tuple[User, str, str]:
        """Authenticate user (Citizen or Staff) with credentials."""
        user = await user_service.get_by_identifier(db, identifier.strip())
        if not user or not user.password_hash:
            await audit_service.log_event(
                db=db,
                actor=identifier,
                action="LOGIN_FAILURE",
                resource="auth/login",
                status="DENIED",
                ip_address=ip_address,
                user_agent=user_agent
            )
            raise AuthenticationError("Invalid login credentials")

        now_utc = datetime.datetime.now(datetime.timezone.utc)

        # Check temporary account lockout
        if user.lockout_until:
            # Handle naive datetime from SQLite or aware datetime
            lockout_time = user.lockout_until
            if lockout_time.tzinfo is None:
                lockout_time = lockout_time.replace(tzinfo=datetime.timezone.utc)
            if lockout_time > now_utc:
                remaining_sec = int((lockout_time - now_utc).total_seconds())
                minutes = max(1, (remaining_sec + 59) // 60)
                raise AuthenticationError(
                    f"Account is temporarily locked due to excessive failed attempts. Please retry in {minutes} minutes."
                )
            else:
                # Lockout expired, reset counter
                user.lockout_until = None
                user.failed_login_attempts = 0

        if not verify_password(password, user.password_hash):
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            if user.failed_login_attempts >= 5:
                user.lockout_until = now_utc + datetime.timedelta(minutes=15)
                await audit_service.log_event(
                    db=db,
                    actor=user.email,
                    action="ACCOUNT_TEMPORARILY_LOCKED",
                    resource="auth/login",
                    status="LOCKED",
                    user_id=user.id,
                    ip_address=ip_address,
                    user_agent=user_agent
                )
            else:
                await audit_service.log_event(
                    db=db,
                    actor=user.email,
                    action="LOGIN_PASSWORD_MISMATCH",
                    resource="auth/login",
                    status="DENIED",
                    user_id=user.id,
                    ip_address=ip_address,
                    user_agent=user_agent
                )
            await db.commit()
            raise AuthenticationError("Invalid login credentials")

        if not user.is_active or user.is_deleted:
            raise PermissionDeniedError("Account is inactive, suspended, or deactivated")

        # Successful login: reset failed attempts
        user.failed_login_attempts = 0
        user.lockout_until = None
        user.last_login_at = now_utc
        await db.commit()

        role_name = user.role.name if user.role else "CITIZEN"

        access_token = create_access_token({"sub": user.id, "role": role_name, "email": user.email})
        raw_refresh, token_hash = create_refresh_token({"sub": user.id})

        expires_at = now_utc + datetime.timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        rf_record = RefreshToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at)
        db.add(rf_record)
        await db.commit()

        await audit_service.log_event(
            db=db,
            actor=user.full_name,
            action="LOGIN_SUCCESS",
            resource=f"user:{user.id}",
            clearance=user.clearance_level,
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent
        )

        return user, access_token, raw_refresh

    @staticmethod
    async def refresh_access_token(
        db: AsyncSession,
        raw_refresh_token: str
    ) -> Tuple[str, str, User]:
        """Rotate and issue a new access token from a valid refresh token."""
        try:
            payload = decode_token(raw_refresh_token, is_refresh=True)
            user_id = payload.get("sub")
            if not user_id or not isinstance(user_id, str):
                raise AuthenticationError("Invalid refresh token payload")
        except Exception:
            raise AuthenticationError("Invalid or expired refresh token")

        token_hash = hash_token_string(raw_refresh_token)
        query = select(RefreshToken).where(
            and_(
                RefreshToken.token_hash == token_hash,
                RefreshToken.is_revoked == False,
                RefreshToken.expires_at > datetime.datetime.now(datetime.timezone.utc)
            )
        )
        res = await db.execute(query)
        stored_token = res.scalars().first()

        if not stored_token:
            raise AuthenticationError("Refresh token revoked or expired")

        # Revoke old refresh token (Token rotation)
        stored_token.is_revoked = True
        stored_token.revoked_at = datetime.datetime.now(datetime.timezone.utc)

        user = await user_service.get_by_id(db, user_id)
        if not user or not user.is_active:
            raise AuthenticationError("User account inactive or not found")

        role_name = user.role.name if user.role else "CITIZEN"
        new_access = create_access_token({"sub": user.id, "role": role_name, "email": user.email})
        new_raw_refresh, new_token_hash = create_refresh_token({"sub": user.id})

        new_expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        new_rf = RefreshToken(user_id=user.id, token_hash=new_token_hash, expires_at=new_expires_at)
        db.add(new_rf)
        await db.commit()

        return new_access, new_raw_refresh, user

    @staticmethod
    async def logout_user(db: AsyncSession, user_id: str, raw_refresh_token: Optional[str] = None) -> bool:
        """Revoke user refresh tokens and terminate active sessions."""
        if raw_refresh_token:
            token_hash = hash_token_string(raw_refresh_token)
            q = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
            res = await db.execute(q)
            tok = res.scalars().first()
            if tok:
                tok.is_revoked = True
                tok.revoked_at = datetime.datetime.now(datetime.timezone.utc)

        # Mark sessions inactive
        sess_q = select(UserSession).where(and_(UserSession.user_id == user_id, UserSession.is_active == True))
        sess_res = await db.execute(sess_q)
        for s in sess_res.scalars().all():
            s.is_active = False

        await db.commit()
        return True

    @staticmethod
    async def request_password_reset(
        db: AsyncSession,
        email: str,
        ip_address: Optional[str] = "127.0.0.1"
    ) -> bool:
        """Issue a 6-digit password reset OTP."""
        user = await user_service.get_by_email(db, email.strip().lower())
        if not user:
            # Prevent email enumeration: return true silently
            return True

        otp_code = await otp_service.generate_and_send_otp(db, user.email, "PASSWORD_RESET")
        
        await audit_service.log_event(
            db=db,
            actor=user.email,
            action="PASSWORD_RESET_REQUESTED",
            resource=f"user:{user.id}",
            user_id=user.id,
            ip_address=ip_address
        )
        return True

    @staticmethod
    async def reset_password_with_otp(
        db: AsyncSession,
        email: str,
        otp: str,
        new_password: str,
        ip_address: Optional[str] = "127.0.0.1"
    ) -> bool:
        """Verify OTP and update user password."""
        user = await user_service.get_by_email(db, email.strip().lower())
        if not user:
            raise ValidationError("Invalid email address")

        is_valid, err_msg = validate_password_strength(new_password)
        if not is_valid:
            raise ValidationError(err_msg or "Password does not meet minimum security requirements.")

        await otp_service.verify_otp(db, user.email, otp, "PASSWORD_RESET")

        user.password_hash = hash_password(new_password)
        user.failed_login_attempts = 0
        user.lockout_until = None
        await db.commit()

        # Revoke all existing refresh tokens
        rf_q = select(RefreshToken).where(and_(RefreshToken.user_id == user.id, RefreshToken.is_revoked == False))
        rf_res = await db.execute(rf_q)
        for t in rf_res.scalars().all():
            t.is_revoked = True

        await audit_service.log_event(
            db=db,
            actor=user.email,
            action="PASSWORD_RESET_SUCCESS",
            resource=f"user:{user.id}",
            user_id=user.id,
            ip_address=ip_address
        )
        return True

    @staticmethod
    async def authenticate_or_register_google_user(
        db: AsyncSession,
        google_id: str,
        email: str,
        full_name: str,
        avatar_url: Optional[str] = None,
        ip_address: Optional[str] = "127.0.0.1",
        user_agent: Optional[str] = None
    ) -> Tuple[User, str, str]:
        """
        Authenticate an existing Google user, link to existing email account,
        or register a new verified citizen user.
        """
        email_clean = email.strip().lower()

        # 1. Lookup by Google ID
        user = await user_service.get_by_google_id(db, google_id)

        # 2. If not found by Google ID, lookup by email to link accounts
        if not user:
            user = await user_service.get_by_email(db, email_clean)
            if user:
                # Link existing email account to Google ID
                user = await user_service.link_google_account(db, user, google_id, avatar_url)
                logger.info(f"Linked existing account '{email_clean}' to Google ID '{google_id}'")

        # 3. If still not found, create new verified citizen account
        if not user:
            role_q = select(Role).where(Role.name == RoleEnum.CITIZEN.value)
            role_res = await db.execute(role_q)
            citizen_role = role_res.scalars().first()
            if not citizen_role:
                citizen_role = Role(
                    name=RoleEnum.CITIZEN.value,
                    display_name="Verified Citizen",
                    description="Public citizen reporting and tracking access"
                )
                db.add(citizen_role)
                await db.flush()

            user = User(
                email=email_clean,
                full_name=full_name.strip() if full_name else "Google Citizen",
                google_id=google_id,
                avatar_url=avatar_url,
                role_id=citizen_role.id,
                clearance_level="CITIZEN TIER",
                is_active=True,
                is_verified=True,
                is_staff=False,
                password_hash=None,
                mfa_type="NONE"
            )
            db.add(user)
            await db.commit()
            await db.refresh(user, ["role", "department"])
            logger.info(f"Created new citizen account via Google Sign-In: {email_clean}")

        # Update last login timestamp
        user.last_login_at = datetime.datetime.now(datetime.timezone.utc)
        user.failed_login_attempts = 0
        user.lockout_until = None
        await db.commit()

        # Generate session tokens
        role_name = user.role.name if user.role else "CITIZEN"
        access_token = create_access_token({"sub": user.id, "role": role_name, "email": user.email})
        raw_refresh, token_hash = create_refresh_token({"sub": user.id})

        expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        rf = RefreshToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at)
        db.add(rf)
        await db.commit()

        await audit_service.log_event(
            db=db,
            actor=user.email,
            action="GOOGLE_LOGIN_SUCCESS",
            resource=f"user:{user.id}",
            user_id=user.id,
            ip_address=ip_address
        )

        return user, access_token, raw_refresh

    @staticmethod
    async def authenticate_or_register_phone_user(
        db: AsyncSession,
        phone: str,
        full_name: Optional[str] = None,
        email: Optional[str] = None,
        ip_address: Optional[str] = "127.0.0.1",
        user_agent: Optional[str] = None
    ) -> Tuple[Optional[User], Optional[str], Optional[str], bool, Optional[str]]:
        """
        Authenticate existing phone user, or onboard new citizen user.
        Returns: (user, access_token, refresh_token, is_new_user, onboarding_token)
        """
        from app.schemas.auth import normalize_indian_phone_number
        norm_phone = normalize_indian_phone_number(phone) or phone.strip()

        # 1. Existing user check
        user = await user_service.get_by_phone(db, norm_phone)
        if user:
            user.last_login_at = datetime.datetime.now(datetime.timezone.utc)
            user.failed_login_attempts = 0
            user.lockout_until = None
            await db.commit()

            role_name = user.role.name if user.role else "CITIZEN"
            access_token = create_access_token({"sub": user.id, "role": role_name, "email": user.email})
            raw_refresh, token_hash = create_refresh_token({"sub": user.id})

            expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
            rf = RefreshToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at)
            db.add(rf)
            await db.commit()

            await audit_service.log_event(
                db=db,
                actor=user.phone_number or user.email,
                action="PHONE_OTP_LOGIN_SUCCESS",
                resource=f"user:{user.id}",
                user_id=user.id,
                ip_address=ip_address
            )
            return user, access_token, raw_refresh, False, None

        # 2. New user: if full_name is provided, complete registration directly
        if full_name and full_name.strip():
            role_q = select(Role).where(Role.name == RoleEnum.CITIZEN.value)
            role_res = await db.execute(role_q)
            citizen_role = role_res.scalars().first()
            if not citizen_role:
                citizen_role = Role(
                    name=RoleEnum.CITIZEN.value,
                    display_name="Verified Citizen",
                    description="Public citizen reporting and tracking access"
                )
                db.add(citizen_role)
                await db.flush()

            clean_digits = norm_phone.replace("+", "").replace(" ", "")
            assigned_email = email.strip().lower() if email else f"citizen.{clean_digits}@enclave.local"

            # Check if email is already taken
            existing_email_user = await user_service.get_by_email(db, assigned_email)
            if existing_email_user:
                assigned_email = f"citizen.{clean_digits}.{secrets.token_hex(3)}@enclave.local"

            user = User(
                email=assigned_email,
                phone_number=norm_phone,
                full_name=full_name.strip(),
                password_hash=None,
                role_id=citizen_role.id,
                clearance_level="CITIZEN TIER",
                is_active=True,
                is_verified=True,
                is_staff=False,
                mfa_type="SMS_OTP",
                mfa_enabled=True,
                last_login_at=datetime.datetime.now(datetime.timezone.utc)
            )
            db.add(user)
            await db.commit()
            await db.refresh(user, ["role", "department"])

            role_name = user.role.name if user.role else "CITIZEN"
            access_token = create_access_token({"sub": user.id, "role": role_name, "email": user.email})
            raw_refresh, token_hash = create_refresh_token({"sub": user.id})

            expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
            rf = RefreshToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at)
            db.add(rf)
            await db.commit()

            await audit_service.log_event(
                db=db,
                actor=user.phone_number or user.email,
                action="PHONE_OTP_REGISTRATION_SUCCESS",
                resource=f"user:{user.id}",
                user_id=user.id,
                ip_address=ip_address
            )
            return user, access_token, raw_refresh, False, None

        # 3. New user without full_name: generate short-lived signed onboarding token
        onboarding_token = create_access_token(
            {"sub": norm_phone, "type": "phone_onboarding"},
            expires_delta=datetime.timedelta(minutes=15)
        )
        return None, None, None, True, onboarding_token

    @staticmethod
    async def complete_phone_onboarding(
        db: AsyncSession,
        onboarding_token: str,
        full_name: str,
        email: Optional[str] = None,
        ip_address: Optional[str] = "127.0.0.1",
        user_agent: Optional[str] = None
    ) -> Tuple[User, str, str]:
        """Verify onboarding token and finalize profile for new phone user."""
        from app.core.security import decode_token

        try:
            payload = decode_token(onboarding_token, expected_type="phone_onboarding")
        except Exception:
            raise AuthenticationError("Invalid or expired phone verification session. Please request a new verification code.")

        if not payload or not payload.get("sub"):
            raise AuthenticationError("Invalid or expired phone verification session. Please request a new verification code.")

        norm_phone = payload["sub"]

        # Check if phone already registered
        existing = await user_service.get_by_phone(db, norm_phone)
        if existing:
            raise ValidationError("An account with this mobile number already exists.")

        res_user, res_access, res_refresh, _, _ = await AuthService.authenticate_or_register_phone_user(
            db=db,
            phone=norm_phone,
            full_name=full_name,
            email=email,
            ip_address=ip_address,
            user_agent=user_agent
        )
        if not res_user or not res_access or not res_refresh:
            raise AuthenticationError("Failed to complete phone user onboarding.")

        return res_user, res_access, res_refresh


auth_service = AuthService()
