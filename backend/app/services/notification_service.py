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

    @staticmethod
    async def seed_default_user_notifications(db: AsyncSession, user_id: str) -> List[Notification]:
        """Ensure initial operational enclave notifications and security advisories exist for a user."""
        existing = await db.execute(
            select(func.count(Notification.id)).where(Notification.user_id == user_id)
        )
        if (existing.scalar() or 0) > 0:
            return []

        default_notifs = [
            {
                "user_id": user_id,
                "title": "1930 HELPLINE ASSET FREEZE ACTIVE",
                "message": "National Financial Cyber Fraud Reporting System (1930) operational. Bank nodal freeze intervention window active for financial distress reporting.",
                "notification_type": "ASSET_FREEZE",
                "severity": "CRITICAL",
                "is_read": False,
                "metadata_json": {"source": "NATIONAL_ENCLAVE_NODAL", "helpline": "1930"}
            },
            {
                "user_id": user_id,
                "title": "AI CYBER DEFENSE SHIELD ACTIVE",
                "message": "Astraea neural threat scanning, deepfake audio classification, and Zero-Knowledge evidence sealing are active for your citizen profile.",
                "notification_type": "AI_DETECTION",
                "severity": "INFO",
                "is_read": False,
                "metadata_json": {"models": ["SpectrogramCNN", "DistilRoBERTa", "XGBoost"]}
            },
            {
                "user_id": user_id,
                "title": "ADVISORY: HIGH-FREQUENCY UPI & APK SCAMS",
                "message": "CERT-In national cyber bulletin: Active campaigns detected using fake electricity disconnection alerts and malicious APK install links. Do not share OTPs.",
                "notification_type": "ADVISORY",
                "severity": "HIGH",
                "is_read": False,
                "metadata_json": {"bulletin_id": "CERT-IN-2026-09A", "category": "UPI Fraud"}
            }
        ]

        created = []
        for nd in default_notifs:
            notif = Notification(**nd)
            db.add(notif)
            created.append(notif)

        await db.commit()
        for notif in created:
            await db.refresh(notif)

        logger.info(f"Seeded {len(created)} default enclave notifications for user {user_id}")
        return created

    @staticmethod
    async def broadcast_enclave_alert(
        db: AsyncSession,
        title: str,
        message: str,
        notification_type: str = "BROADCAST",
        severity: str = "HIGH",
        metadata_json: Optional[Dict[str, Any]] = None
    ) -> int:
        """Broadcast an enclave-wide security bulletin or emergency notice to all registered users."""
        users_res = await db.execute(select(User.id).where(User.is_active == True))
        user_ids = users_res.scalars().all()
        count = 0
        for uid in user_ids:
            notif = Notification(
                user_id=uid,
                title=title,
                message=message,
                notification_type=notification_type,
                severity=severity,
                metadata_json=metadata_json or {},
                is_read=False
            )
            db.add(notif)
            count += 1
        await db.commit()

        # Send WebSocket broadcast
        try:
            from app.services.websocket_manager import ws_manager
            await ws_manager.broadcast({
                "type": "ALERT",
                "data": {
                    "title": title,
                    "message": message,
                    "severity": severity,
                    "notification_type": notification_type
                }
            })
        except Exception as ws_err:
            logger.warning(f"Broadcast WebSocket alert error: {ws_err}")

        return count


notification_service = NotificationService()
