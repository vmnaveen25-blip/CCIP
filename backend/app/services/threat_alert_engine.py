"""
Investigator Threat Alert Engine
Provides actionable security alerts with automated deduplication, suppression windows,
and integration with internal sovereign notification dispatch.
"""

import hashlib
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc

from app.core.logging import logger
from app.models.threat_intelligence_v2 import ThreatAlert, ThreatIndicator
from app.services.notification_service import notification_service


class ThreatAlertCategory:
    CRITICAL_INFRASTRUCTURE = "CRITICAL_INFRASTRUCTURE"
    NEW_PHISHING = "NEW_PHISHING"
    MALWARE_HASH_MATCH = "MALWARE_HASH_MATCH"
    CROSS_CASE_IOC_MATCH = "CROSS_CASE_IOC_MATCH"
    EXPIRING_INTEL = "EXPIRING_INTEL"
    HIGH_CONFIDENCE_REPORT = "HIGH_CONFIDENCE_REPORT"
    NEW_RELATIONSHIP = "NEW_RELATIONSHIP"


class ThreatAlertEngine:
    DEFAULT_SUPPRESSION_HOURS = 24

    @staticmethod
    def generate_suppression_hash(category: str, indicator_type: str, normalized_val: str, case_id: Optional[str] = None) -> str:
        """Computes a deterministic hash for deduplication suppression windows."""
        raw = f"{category}:{indicator_type.upper()}:{normalized_val.lower()}:{case_id or 'GLOBAL'}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    async def evaluate_indicator_for_alerts(
        self,
        db: AsyncSession,
        indicator: ThreatIndicator,
        score_result: Dict[str, Any],
        related_case_id: Optional[str] = None,
        evidence_refs: Optional[List[str]] = None
    ) -> Optional[ThreatAlert]:
        """Evaluates an indicator and generates a deduplicated alert if thresholds are met."""
        composite_score = score_result.get("composite_score", 0.0)
        severity = score_result.get("severity", "MEDIUM")

        # Determine alert category
        if indicator.indicator_type in ("MD5", "SHA1", "SHA256"):
            category = ThreatAlertCategory.MALWARE_HASH_MATCH
            action = "Immediately quarantine corresponding evidentiary files and execute memory forensics."
        elif indicator.threat_category.upper() == "PHISHING":
            category = ThreatAlertCategory.NEW_PHISHING
            action = "Block domain on DNS sinkhole and check victim credential compromises."
        elif related_case_id:
            category = ThreatAlertCategory.CROSS_CASE_IOC_MATCH
            action = f"Cross-reference indicators with active investigation '{related_case_id}'."
        elif composite_score >= 85.0:
            category = ThreatAlertCategory.CRITICAL_INFRASTRUCTURE
            action = "Trigger high-priority triage review and inspect firewall boundary logs."
        else:
            category = ThreatAlertCategory.HIGH_CONFIDENCE_REPORT
            action = "Review indicator correlation in threat intelligence workspace."

        suppression_hash = self.generate_suppression_hash(
            category=category,
            indicator_type=indicator.indicator_type,
            normalized_val=indicator.normalized_value,
            case_id=related_case_id
        )

        # Check suppression window
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=self.DEFAULT_SUPPRESSION_HOURS)
        existing_alert_q = select(ThreatAlert).where(
            and_(
                ThreatAlert.suppression_hash == suppression_hash,
                ThreatAlert.detection_time >= cutoff_time
            )
        )
        res = await db.execute(existing_alert_q)
        existing = res.scalars().first()
        if existing:
            logger.info(f"Alert suppressed: Duplicate detected within {self.DEFAULT_SUPPRESSION_HOURS}h window (Hash: {suppression_hash[:8]}).")
            return None

        # Create new alert
        alert = ThreatAlert(
            alert_category=category,
            severity=severity,
            indicator_id=indicator.id,
            indicator_type=indicator.indicator_type,
            indicator_value=indicator.defanged_value,
            related_case_id=related_case_id,
            source_name=indicator.source_name,
            evidence_references=evidence_refs or [],
            confidence=indicator.confidence_score,
            reason=f"High-threat detection ({composite_score}/100) from {indicator.source_name}: {score_result.get('explanation', '')}",
            recommended_action=action,
            detection_time=datetime.now(timezone.utc),
            review_status="NEW",
            suppression_hash=suppression_hash
        )
        db.add(alert)
        await db.commit()
        await db.refresh(alert)

        # Dispatch internal notification via notification_service
        try:
            from app.models.user import User
            # Broadcast to staff and specialists
            staff_q = select(User).where(User.is_active == True)
            staff_res = await db.execute(staff_q)
            users = staff_res.scalars().all()
            for u in users:
                if u.role and u.role.name in ("CYBERSECURITY_SPECIALIST", "CYBERCRIME_POLICE", "ADMIN"):
                    await notification_service.create_notification(
                        db=db,
                        user_id=u.id,
                        title=f"THREAT ALERT: {category} ({severity})",
                        message=f"Defanged IOC: {indicator.defanged_value}. Action: {action}",
                        notification_type="SYSTEM",
                        severity="HIGH" if severity in ("CRITICAL", "HIGH") else "MEDIUM",
                        related_case_id=related_case_id,
                        metadata_json={
                            "alert_id": alert.id,
                            "category": category,
                            "composite_score": composite_score,
                            "indicator_type": indicator.indicator_type
                        }
                    )
        except Exception as e:
            logger.warning(f"Failed to dispatch alert notifications: {str(e)}")

        return alert


threat_alert_engine = ThreatAlertEngine()

