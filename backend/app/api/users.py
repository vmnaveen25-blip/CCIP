from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.user import UserPublicResponse, UserUpdateRequest
from app.services.user_service import user_service
from app.core.permissions import get_current_user
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile", response_model=UserPublicResponse)
async def get_profile(
    current_user: User = Depends(get_current_user)
):
    """Retrieve profile of the currently logged-in user."""
    return UserPublicResponse(**user_service.map_user_to_public(current_user))


@router.patch("/profile", response_model=UserPublicResponse)
async def update_profile(
    req: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update profile details for the currently logged-in user."""
    if req.full_name:
        current_user.full_name = req.full_name
    if req.phone_number:
        current_user.phone_number = req.phone_number

    await db.commit()
    await db.refresh(current_user, ["role", "department"])
    return UserPublicResponse(**user_service.map_user_to_public(current_user))
