import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, update, desc

from app.db.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationResponse, NotificationCreate
from app.schemas.auth import MessageResponse
from app.core.permissions import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    unread_only: bool = Query(False),
    notification_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve operational broadcasts and incident notifications for the authenticated user."""
    q = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        q = q.where(Notification.is_read == False)
    if notification_type and notification_type != "ALL":
        q = q.where(Notification.notification_type == notification_type)
    if severity and severity != "ALL":
        q = q.where(Notification.severity == severity)
    if search and search.strip():
        term = f"%{search.strip()}%"
        q = q.where(
            or_(
                Notification.title.ilike(term),
                Notification.message.ilike(term)
            )
        )
    q = q.order_by(desc(Notification.created_at)).offset(skip).limit(limit)

    res = await db.execute(q)
    notifications = res.scalars().all()
    return notifications


@router.get("/unread-count")
async def get_unread_notification_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve total count of unread notifications."""
    from app.services.notification_service import notification_service
    count = await notification_service.get_unread_count(db, current_user.id)
    return {"unread_count": count}


@router.patch("/{notification_id}/read", response_model=MessageResponse)
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a single notification as read."""
    q = select(Notification).where(
        and_(Notification.id == notification_id, Notification.user_id == current_user.id)
    )
    res = await db.execute(q)
    notif = res.scalars().first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    notif.read_at = datetime.datetime.now(datetime.timezone.utc)
    await db.commit()

    # Broadcast updated count via WebSocket
    try:
        from app.services.websocket_manager import ws_manager
        from app.services.notification_service import notification_service
        count = await notification_service.get_unread_count(db, current_user.id)
        await ws_manager.send_personal_message(
            {"type": "NOTIFICATION_COUNT", "data": {"unread_count": count}},
            current_user.id
        )
    except Exception:
        pass

    return MessageResponse(message="Notification marked as read.")


@router.post("/read-all", response_model=MessageResponse)
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark all unread notifications for current user as read."""
    stmt = (
        update(Notification)
        .where(and_(Notification.user_id == current_user.id, Notification.is_read == False))
        .values(is_read=True, read_at=datetime.datetime.now(datetime.timezone.utc))
    )
    await db.execute(stmt)
    await db.commit()

    # Broadcast updated count via WebSocket
    try:
        from app.services.websocket_manager import ws_manager
        await ws_manager.send_personal_message(
            {"type": "NOTIFICATION_COUNT", "data": {"unread_count": 0}},
            current_user.id
        )
    except Exception:
        pass

    return MessageResponse(message="All notifications marked as read.")


@router.delete("/{notification_id}", response_model=MessageResponse)
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Dismiss / archive an individual notification."""
    q = select(Notification).where(
        and_(Notification.id == notification_id, Notification.user_id == current_user.id)
    )
    res = await db.execute(q)
    notif = res.scalars().first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    await db.delete(notif)
    await db.commit()
    return MessageResponse(message="Notification removed.")
