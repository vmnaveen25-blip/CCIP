import datetime
import hashlib
import json
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.core.logging import logger


class AuditService:
    @staticmethod
    async def log_event(
        db: AsyncSession,
        actor: str,
        action: str,
        resource: str,
        clearance: str = "UNAUTHENTICATED",
        status: str = "SUCCESS",
        user_id: Optional[str] = None,
        ip_address: Optional[str] = "127.0.0.1",
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        metadata_json: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        """Create a cryptographically sealed tamper-evident audit record."""
        now = datetime.datetime.now(datetime.timezone.utc)
        timestamp_str = now.strftime("%Y-%m-%d %H:%M:%S UTC")
        meta = metadata_json if metadata_json is not None else (metadata or {})

        # Compute tamper-evident hash
        raw_signature = f"{timestamp_str}:{actor}:{clearance}:{action}:{resource}:{status}:{ip_address}:{json.dumps(meta, sort_keys=True)}"
        integrity_hash = f"0x{hashlib.sha256(raw_signature.encode('utf-8')).hexdigest()[:16]}"

        audit_entry = AuditLog(
            user_id=user_id,
            actor=actor,
            clearance=clearance,
            action=action,
            resource=resource,
            status=status,
            ip_address=ip_address,
            user_agent=user_agent,
            integrity_hash=integrity_hash,
            metadata_json=meta,
            timestamp=timestamp_str,
            created_at=now
        )
        db.add(audit_entry)
        await db.commit()
        return audit_entry


audit_service = AuditService()
