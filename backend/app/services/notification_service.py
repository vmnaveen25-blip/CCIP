import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.notification import Notification
from app.models.user import User
from app.models.complaint import Complaint
from app.models.case import Case
from app.core.logging import logger


class NotificationService:
    @staticmethod
    async def create_notification(
        db: AsyncSession,
        user_id: str,
        title: str,
        message: str,
        notification_type: str = "INFO",
        severity: str = "INFO",
        related_complaint_id: Optional[str] = None,
        related_case_id: Optional[str] = None,
        metadata_json: Optional[Dict[str, Any]] = None
    ) -> Notification:
        """Create and commit a notification record for a specific user."""
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            severity=severity,
            related_complaint_id=related_complaint_id,
            related_case_id=related_case_id,
            metadata_json=metadata_json or {},
            is_read=False
        )
        db.add(notif)
        await db.commit()
        await db.refresh(notif)
        logger.info(f"Notification [{notif.id}] dispatched to user {user_id}: {title}")

        # Real-time WebSocket dispatch
        try:
            from app.services.websocket_manager import ws_manager
            unread_count = await NotificationService.get_unread_count(db, user_id)
            payload = {
                "type": "NOTIFICATION",
                "data": {
                    "id": notif.id,
                    "title": notif.title,
                    "message": notif.message,
                    "notification_type": notif.notification_type,
                    "severity": notif.severity,
                    "related_complaint_id": notif.related_complaint_id,
                    "related_case_id": notif.related_case_id,
                    "metadata_json": notif.metadata_json or {},
                    "is_read": False,
                    "created_at": notif.created_at.isoformat() if notif.created_at else None,
                    "unread_count": unread_count
                }
            }
            await ws_manager.send_personal_message(payload, user_id)
        except Exception as ws_err:
            logger.warning(f"WebSocket broadcast skipped for user {user_id}: {ws_err}")

        return notif

    @staticmethod
    async def get_unread_count(db: AsyncSession, user_id: str) -> int:
        """Return the count of unread notifications for the given user."""
        q = select(func.count(Notification.id)).where(
            and_(Notification.user_id == user_id, Notification.is_read == False)
        )
        res = await db.execute(q)
        return res.scalar() or 0


notification_service = NotificationService()
