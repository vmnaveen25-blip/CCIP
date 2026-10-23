from typing import List, Optional
from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import jwt

from app.db.database import get_db
from app.models.user import User
from app.models.role import RoleEnum
from app.core.security import decode_token
from app.core.exceptions import AuthenticationError, PermissionDeniedError
from app.core.logging import logger

security_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Extract and authenticate user from Authorization Bearer header or auth cookie."""
    token = None
    if credentials:
        token = credentials.credentials
    elif "access_token" in request.cookies:
        token = request.cookies.get("access_token")

    if not token:
        raise AuthenticationError("Authorization credentials were not provided")

    try:
        payload = decode_token(token, is_refresh=False)
        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Token payload missing subject identifier")
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Access token has expired", code="TOKEN_EXPIRED")
    except Exception as e:
        raise AuthenticationError(f"Invalid authentication token: {str(e)}")

    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalars().first()

    if not user:
        raise AuthenticationError("Authenticated user account not found")

    if not user.is_active or user.is_deleted:
        raise PermissionDeniedError("Account is inactive, suspended, or deactivated")

    # Set user context on request state
    request.state.user = user
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    return current_user


def require_role(allowed_roles: List[RoleEnum]):
    """Enforce that the authenticated user possesses one of the allowed operational roles."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role_name = current_user.role.name if current_user.role else ""
        allowed_role_names = [r.value for r in allowed_roles]
        
        if user_role_name not in allowed_role_names:
            logger.warning(
                f"Access denied for user {current_user.email} (Role: {user_role_name}) "
                f"to resource requiring {allowed_role_names}"
            )
            raise PermissionDeniedError(
                f"Role '{user_role_name}' is not authorized to access this operational resource"
            )
        return current_user

    return role_checker


# Convenient role dependencies
require_citizen = require_role([RoleEnum.CITIZEN, RoleEnum.ADMIN])
require_specialist = require_role([RoleEnum.CYBERSECURITY_SPECIALIST, RoleEnum.ADMIN])
require_police = require_role([RoleEnum.CYBERCRIME_POLICE, RoleEnum.ADMIN])
require_aiml = require_role([RoleEnum.AI_ML_SYSTEM_LEAD, RoleEnum.ADMIN])
require_aiml_lead_only = require_role([RoleEnum.AI_ML_SYSTEM_LEAD])
require_admin = require_role([RoleEnum.ADMIN])
require_staff = require_role([
    RoleEnum.CYBERSECURITY_SPECIALIST,
    RoleEnum.CYBERCRIME_POLICE,
    RoleEnum.AI_ML_SYSTEM_LEAD,
    RoleEnum.ADMIN
])
