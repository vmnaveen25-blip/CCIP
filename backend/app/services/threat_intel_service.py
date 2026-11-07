"""
Threat Intelligence Core Service
Orchestrates feed synchronization, idempotent indicator persistence,
feed health monitoring, scoring updates, and alert triggering.
"""

import uuid
import asyncio
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, func

from app.core.logging import logger
from app.core.exceptions import CCIPException
from app.models.threat_intelligence_v2 import (
    ThreatIntelligenceSource,
    ThreatFeedSync,
    ThreatIndicator,
    ThreatCampaign,
    ThreatAlert,
    IntelligenceRelationship
)
from app.services.threat_ioc_service import ioc_normalization_service
from app.services.threat_scoring_engine import threat_scoring_engine, ThreatFindingState
from app.services.threat_feed_adapters import (
    BaseThreatFeedAdapter,
    StixTaxiiAdapter,
    MispAdapter,
    AlienVaultOtxAdapter,
    UrlhausAdapter,
    AbuseIpdbAdapter,
    VirusTotalAdapter,
    FeedIngestionResult
)
from app.services.threat_alert_engine import threat_alert_engine


class ThreatIntelService:
    _sync_locks: Dict[str, asyncio.Lock] = {}

    ADAPTER_MAP = {
        "STIX_TAXII": StixTaxiiAdapter,
        "MISP": MispAdapter,
        "ALIENVAULT_OTX": AlienVaultOtxAdapter,
        "URLHAUS": UrlhausAdapter,
        "ABUSEIPDB": AbuseIpdbAdapter,
        "VIRUSTOTAL": VirusTotalAdapter,
    }

    async def seed_default_sources(self, db: AsyncSession):
        """Seeds default threat intelligence sources into the database if none exist."""
        q = select(func.count(ThreatIntelligenceSource.id))
        res = await db.execute(q)
        count = res.scalar() or 0
        if count > 0:
            return

        logger.info("Seeding default sovereign threat intelligence sources...")
        defaults = [
            ThreatIntelligenceSource(
                name="AlienVault Open Threat Exchange (OTX)",
                provider_code="ALIENVAULT_OTX",
                feed_type="REST_API",
                api_endpoint="https://otx.alienvault.com/api/v1/pulses/subscribed",
                credential_reference="OTX_API_KEY",
                license_restrictions="Non-commercial threat sharing",
                source_reliability=0.85,
                sync_interval_minutes=60,
                is_enabled=True
            ),
            ThreatIntelligenceSource(
                name="abuse.ch URLhaus Malware Telemetry",
                provider_code="URLHAUS",
                feed_type="JSON_FEED",
                api_endpoint="https://urlhaus-api.abuse.ch/v1/urls/recent/",
                credential_reference=None,
                license_restrictions="Open cyber defense intelligence",
                source_reliability=0.90,
                sync_interval_minutes=30,
                is_enabled=True
            ),
            ThreatIntelligenceSource(
                name="AbuseIPDB Botnet & Attacker Blacklist",
                provider_code="ABUSEIPDB",
                feed_type="REST_API",
                api_endpoint="https://api.abuseipdb.com/api/v2/blacklist",
                credential_reference="ABUSEIPDB_API_KEY",
                license_restrictions="Authorized sovereign SIEM telemetry",
                source_reliability=0.88,
                sync_interval_minutes=120,
                is_enabled=True
            ),
            ThreatIntelligenceSource(
                name="National Cyber Coordination Enclave (STIX 2.1)",
                provider_code="STIX_TAXII",
                feed_type="STIX_2",
                api_endpoint="https://cti.cybercoord.gov.in/taxii2/collections/public-indicators/objects",
                credential_reference="TAXII_AUTH_TOKEN",
                license_restrictions="Government sovereign defense only",
                source_reliability=0.95,
                sync_interval_minutes=15,
                is_enabled=True
            ),
            ThreatIntelligenceSource(
                name="Law Enforcement MISP Inter-Agency Node",
                provider_code="MISP",
                feed_type="MISP_REST",
                api_endpoint="https://misp.lawenforcement.internal/events/restSearch",
                credential_reference="MISP_AUTH_KEY",
                license_restrictions="Restricted Law Enforcement Network",
                source_reliability=0.95,
                sync_interval_minutes=30,
                is_enabled=True
            )
        ]
        for src in defaults:
            db.add(src)
        await db.commit()
        logger.info("Default threat intelligence sources successfully initialized.")

    def get_adapter_for_source(self, source: ThreatIntelligenceSource) -> BaseThreatFeedAdapter:
        """Instantiates the appropriate connector adapter for a given source."""
        adapter_cls = self.ADAPTER_MAP.get(source.provider_code, BaseThreatFeedAdapter)
        if adapter_cls is BaseThreatFeedAdapter:
            # Fallback to STIX or Generic
            adapter_cls = StixTaxiiAdapter
        return adapter_cls(
            source_id=source.id,
            name=source.name,
            endpoint=source.api_endpoint,
            credential_ref=source.credential_reference,
            reliability=source.source_reliability
        )

    async def sync_source(self, db: AsyncSession, source_id: str, sync_type: str = "MANUAL", force: bool = False) -> ThreatFeedSync:
        """
        Executes a synchronization cycle for a specific source.
        Enforces per-source concurrency mutex and minimum rate limits to prevent duplicate runs.
        Guarantees that feed ingest errors never erase previously persisted indicators.
        """
        q = select(ThreatIntelligenceSource).where(ThreatIntelligenceSource.id == source_id)
        res = await db.execute(q)
        source = res.scalars().first()
        if not source:
            raise CCIPException(message=f"Threat intelligence source '{source_id}' not found.", status_code=404, code="SOURCE_NOT_FOUND")

        # Concurrency guard: check if sync is already running
        if source_id not in self._sync_locks:
            self._sync_locks[source_id] = asyncio.Lock()
        lock = self._sync_locks[source_id]

        if lock.locked():
            raise CCIPException(
                message=f"Synchronization for feed '{source.name}' is already actively running. Concurrent duplicate runs rejected.",
                status_code=409,
                code="SYNC_ALREADY_IN_PROGRESS"
            )

        # Rate limit guard: minimum 120s between manual runs unless force=True
        if sync_type == "MANUAL" and not force:
            if source.last_sync_at:
                last_dt = source.last_sync_at
                if last_dt.tzinfo is None:
                    last_dt = last_dt.replace(tzinfo=timezone.utc)
                elapsed = (datetime.now(timezone.utc) - last_dt).total_seconds()
                if elapsed < 120:
                    raise CCIPException(
                        message=f"Feed '{source.name}' was synced {int(elapsed)}s ago. Minimum interval between manual syncs is 120s (pass force=True to bypass).",
                        status_code=429,
                        code="SYNC_RATE_LIMITED"
                    )

        async with lock:
            # Create sync audit record
            sync_record = ThreatFeedSync(
                source_id=source.id,
                sync_type=sync_type,
                started_at=datetime.now(timezone.utc),
                status="RUNNING"
            )
            db.add(sync_record)
            source.last_sync_status = "RUNNING"
            await db.commit()
            await db.refresh(sync_record)

            adapter = self.get_adapter_for_source(source)
            ingest_res: FeedIngestionResult = await adapter.fetch_feed()

            sync_record.completed_at = datetime.now(timezone.utc)
            if not ingest_res.success:
                sync_record.status = "FAILED"
                sync_record.error_message = ingest_res.error_message
                source.last_sync_status = "FAILED"
                source.last_failure_reason = ingest_res.error_message
                source.consecutive_failures += 1
                await db.commit()
                return sync_record

        # Idempotently persist normalized indicators
        imported = 0
        updated = 0
        skipped = 0

        for item in ingest_res.indicators:
            norm_val = item["normalized_value"]
            ioc_type = item["indicator_type"]

            # Query existing indicator
            check_q = select(ThreatIndicator).where(
                and_(
                    ThreatIndicator.normalized_value == norm_val,
                    ThreatIndicator.indicator_type == ioc_type
                )
            )
            check_res = await db.execute(check_q)
            existing: Optional[ThreatIndicator] = check_res.scalars().first()

            score_res = threat_scoring_engine.calculate_composite_score(
                source_reliability=source.source_reliability,
                reported_confidence=item["confidence_score"],
                reputation_verdict=item["reputation_verdict"],
                last_seen=item.get("last_seen"),
                independent_sources_count=1,
                is_correlated_with_case_evidence=False,
                is_human_reviewed=False,
                is_false_positive=False
            )

            if existing:
                # Update existing indicator
                existing.last_seen = item.get("last_seen", datetime.now(timezone.utc))
                existing.confidence_score = max(existing.confidence_score, item["confidence_score"])
                existing.composite_threat_score = max(existing.composite_threat_score, score_res["composite_score"])
                existing.score_breakdown_json = score_res["breakdown"]
                if item.get("associated_threat_actor") and not existing.associated_threat_actor:
                    existing.associated_threat_actor = item["associated_threat_actor"]
                updated += 1
            else:
                new_indicator = ThreatIndicator(
                    indicator_type=ioc_type,
                    original_value=item["original_value"],
                    normalized_value=norm_val,
                    defanged_value=item["defanged_value"],
                    first_seen=item.get("first_seen", datetime.now(timezone.utc)),
                    last_seen=item.get("last_seen", datetime.now(timezone.utc)),
                    source_id=source.id,
                    source_name=source.name,
                    external_reference=item.get("external_reference"),
                    threat_category=item.get("threat_category", "MALWARE"),
                    confidence_score=item["confidence_score"],
                    reputation_verdict=item["reputation_verdict"],
                    composite_threat_score=score_res["composite_score"],
                    score_breakdown_json=score_res["breakdown"],
                    finding_state=score_res["finding_state"],
                    mitre_techniques_json=item.get("mitre_techniques", []),
                    associated_threat_actor=item.get("associated_threat_actor"),
                    tags_json=item.get("tags", [])
                )
                db.add(new_indicator)
                imported += 1

                # Check if high severity alert should be dispatched
                if score_res["composite_score"] >= 80.0:
                    await threat_alert_engine.evaluate_indicator_for_alerts(
                        db=db,
                        indicator=new_indicator,
                        score_result=score_res
                    )

        sync_record.status = "SUCCESS"
        sync_record.indicators_imported = imported
        sync_record.indicators_updated = updated
        sync_record.indicators_skipped = skipped
        sync_record.raw_summary_json = {
            "rate_limit_remaining": ingest_res.rate_limit_remaining,
            "total_processed": len(ingest_res.indicators)
        }

        source.last_sync_at = datetime.now(timezone.utc)
        source.last_sync_status = "SUCCESS"
        source.last_failure_reason = None
        source.consecutive_failures = 0
        source.indicators_count += imported

        await db.commit()
        await db.refresh(sync_record)
        return sync_record


threat_intel_service = ThreatIntelService()

