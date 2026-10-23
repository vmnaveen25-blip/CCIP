from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.role import Role, RoleEnum
from app.models.department import Department
from app.core.security import hash_password
from app.core.exceptions import ValidationError, NotFoundError


class UserService:
    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
        query = select(User).where(User.id == user_id).options(selectinload(User.role), selectinload(User.department))
        result = await db.execute(query)
        return result.scalars().first()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        query = select(User).where(User.email == email.lower()).options(selectinload(User.role), selectinload(User.department))
        result = await db.execute(query)
        return result.scalars().first()

    @staticmethod
    async def get_by_phone(db: AsyncSession, phone: str) -> Optional[User]:
        query = select(User).where(User.phone_number == phone).options(selectinload(User.role), selectinload(User.department))
        result = await db.execute(query)
        return result.scalars().first()

    @staticmethod
    async def get_by_google_id(db: AsyncSession, google_id: str) -> Optional[User]:
        query = select(User).where(User.google_id == google_id).options(selectinload(User.role), selectinload(User.department))
        result = await db.execute(query)
        return result.scalars().first()

    @staticmethod
    async def get_by_badge(db: AsyncSession, badge: str) -> Optional[User]:
        query = select(User).where(User.badge_number == badge).options(selectinload(User.role), selectinload(User.department))
        result = await db.execute(query)
        return result.scalars().first()

    @staticmethod
    async def get_by_identifier(db: AsyncSession, identifier: str) -> Optional[User]:
        """Lookup by email, phone number, or badge number / staff ID."""
        user = await UserService.get_by_email(db, identifier)
        if not user:
            from app.schemas.auth import normalize_indian_phone_number
            try:
                norm_phone = normalize_indian_phone_number(identifier)
                if norm_phone:
                    user = await UserService.get_by_phone(db, norm_phone)
            except Exception:
                pass
            if not user:
                user = await UserService.get_by_phone(db, identifier)
        if not user:
            user = await UserService.get_by_badge(db, identifier)
        if not user:
            ident_clean = identifier.strip().lower()
            query = select(User).where(
                (func.lower(User.full_name) == ident_clean) |
                (func.lower(User.email).like(f"{ident_clean}@%"))
            ).options(selectinload(User.role), selectinload(User.department))
            res = await db.execute(query)
            user = res.scalars().first()
        return user

    @staticmethod
    async def link_google_account(db: AsyncSession, user: User, google_id: str, avatar_url: Optional[str] = None) -> User:
        user.google_id = google_id
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
        user.is_verified = True
        await db.commit()
        await db.refresh(user, ["role", "department"])
        return user

    @staticmethod
    async def get_all_users(db: AsyncSession, skip: int = 0, limit: int = 50) -> List[User]:
        query = select(User).options(selectinload(User.role), selectinload(User.department)).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_users_paginated(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        role: Optional[str] = None,
        status: Optional[str] = None,
        department_id: Optional[str] = None,
        verification_status: Optional[str] = None
    ) -> Tuple[List[User], int]:
        """Query users with multi-field search, filters, and total record count."""
        base_query = select(User).options(selectinload(User.role), selectinload(User.department))
        count_query = select(func.count(User.id))

        filters = []

        if search and search.strip():
            term = f"%{search.strip().lower()}%"
            filters.append(
                or_(
                    func.lower(User.full_name).like(term),
                    func.lower(User.email).like(term),
                    func.lower(User.phone_number).like(term),
                    func.lower(User.badge_number).like(term),
                    User.department.has(func.lower(Department.name).like(term))
                )
            )

        if role and role.strip():
            target_role = role.strip()
            filters.append(User.role.has(Role.name == target_role))

        if department_id and department_id.strip():
            filters.append(User.department_id == department_id.strip())

        if status and status.strip():
            s = status.strip().upper()
            if s == "ACTIVE":
                filters.append(and_(User.is_active.is_(True), User.is_deleted.is_(False)))
            elif s == "SUSPENDED":
                filters.append(and_(User.is_active.is_(False), User.is_deleted.is_(False)))
            elif s == "DISABLED":
                filters.append(User.is_deleted.is_(True))
            elif s == "PENDING":
                filters.append(and_(User.is_verified.is_(False), User.is_staff.is_(False), User.is_deleted.is_(False)))

        if verification_status and verification_status.strip():
            vs = verification_status.strip().upper()
            if vs == "EMAIL_VERIFIED":
                filters.append(User.is_verified.is_(True))
            elif vs == "PHONE_VERIFIED":
                filters.append(User.phone_number.isnot(None))
            elif vs == "GOOGLE_LINKED":
                filters.append(User.google_id.isnot(None))
            elif vs == "UNVERIFIED":
                filters.append(User.is_verified.is_(False))

        if filters:
            base_query = base_query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))

        count_res = await db.execute(count_query)
        total_count = count_res.scalar() or 0

        query = base_query.order_by(User.created_at.desc()).offset(skip).limit(limit)
        res = await db.execute(query)
        users = list(res.scalars().all())

        return users, total_count

    @staticmethod
    def map_user_to_public(user: User) -> dict:
        role_name = user.role.name if user.role else "CITIZEN"
        
        # Map backend Role to frontend portal role
        role_map = {
            RoleEnum.CITIZEN.value: "citizen",
            RoleEnum.CYBERSECURITY_SPECIALIST.value: "specialist",
            RoleEnum.CYBERCRIME_POLICE.value: "police",
            RoleEnum.ADMIN.value: "admin",
            RoleEnum.AI_ML_SYSTEM_LEAD.value: "aiml"
        }
        portal_role = role_map.get(role_name, "citizen")

        account_status = "ACTIVE"
        if getattr(user, "is_deleted", False):
            account_status = "DISABLED"
        elif not user.is_active:
            account_status = "SUSPENDED"
        elif not user.is_verified and not getattr(user, "is_staff", False):
            account_status = "PENDING"

        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "phone_number": user.phone_number,
            "badge_number": user.badge_number,
            "clearance_level": user.clearance_level,
            "role": role_name,
            "portal_role": portal_role,
            "department_id": user.department_id,
            "department": user.department.name if user.department else None,
            "account_status": account_status,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "is_staff": user.is_staff,
            "mfa_type": user.mfa_type,
            "mfa_enabled": getattr(user, "mfa_enabled", False),
            "google_id": user.google_id,
            "is_google_linked": bool(user.google_id),
            "avatar_url": user.avatar_url,
            "last_login_at": user.last_login_at,
            "created_at": user.created_at,
            "updated_at": getattr(user, "updated_at", None)
        }


user_service = UserService()
