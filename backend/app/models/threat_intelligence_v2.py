import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import Column, String, DateTime, Text, Float, Integer, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.db.base import Base


class ThreatIntelligenceSource(Base):
    """Configuration, credentials reference, and operational health of threat intel feeds."""
    __tablename__ = "threat_intelligence_sources"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False)
    provider_code = Column(String(50), nullable=False, index=True)  # "ALIENVAULT_OTX", "URLHAUS", "ABUSEIPDB", "MISP", "STIX_TAXII", "VIRUSTOTAL", "CUSTOM"
    feed_type = Column(String(50), nullable=False)  # "STIX_2", "TAXII_2", "MISP_REST", "REST_API", "CSV_FEED", "JSON_FEED"
    api_endpoint = Column(String(500), nullable=False)
    auth_method = Column(String(50), default="NONE", nullable=False)  # "NONE", "API_KEY", "BEARER_TOKEN", "BASIC_AUTH"
    credential_reference = Column(String(100), nullable=True)  # Environment variable name holding secret
    license_restrictions = Column(String(255), default="Operational intelligence use authorized", nullable=False)
    is_enabled = Column(Boolean, default=True, nullable=False, index=True)
    source_reliability = Column(Float, default=0.80, nullable=False)  # 0.0 to 1.0 (Admiralty System B2 standard)
    sync_interval_minutes = Column(Integer, default=60, nullable=False)
    
    # Operational Telemetry
    last_sync_at = Column(DateTime, nullable=True)
    last_sync_status = Column(String(50), default="NEVER", nullable=False)  # "SUCCESS", "FAILED", "RUNNING", "NEVER"
    last_failure_reason = Column(Text, nullable=True)
    consecutive_failures = Column(Integer, default=0, nullable=False)
    indicators_count = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class ThreatFeedSync(Base):
    """Audit log of scheduled and manual feed synchronizations."""
    __tablename__ = "threat_feed_syncs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_id = Column(String(36), ForeignKey("threat_intelligence_sources.id"), nullable=False, index=True)
    sync_type = Column(String(50), default="MANUAL", nullable=False)  # "SCHEDULED", "MANUAL", "INCREMENTAL"
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="RUNNING", nullable=False)  # "SUCCESS", "FAILED", "PARTIAL"
    indicators_imported = Column(Integer, default=0, nullable=False)
    indicators_updated = Column(Integer, default=0, nullable=False)
    indicators_skipped = Column(Integer, default=0, nullable=False)
    error_message = Column(Text, nullable=True)
    raw_summary_json = Column(JSON, default=dict, nullable=False)


class ThreatIndicator(Base):
    """Normalized Indicator of Compromise (IOC) with multi-factor scoring and provenance."""
    __tablename__ = "threat_indicators"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    indicator_type = Column(String(50), nullable=False, index=True)  # "IPV4", "IPV6", "DOMAIN", "URL", "MD5", "SHA1", "SHA256", "EMAIL", "CRYPTO_WALLET"
    original_value = Column(String(1000), nullable=False)
    normalized_value = Column(String(1000), nullable=False, index=True)
    defanged_value = Column(String(1000), nullable=False)
    
    first_seen = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    last_seen = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    source_id = Column(String(36), ForeignKey("threat_intelligence_sources.id"), nullable=True, index=True)
    source_name = Column(String(200), default="MANUAL_SUBMISSION", nullable=False)
    external_reference = Column(String(500), nullable=True)
    threat_category = Column(String(100), default="MALWARE", nullable=False)  # "PHISHING", "C2", "MALWARE", "RANSOMWARE", "EXPLOIT", "BOTNET", "FRAUD"
    
    confidence_score = Column(Float, default=70.0, nullable=False)  # 0 to 100
    reputation_verdict = Column(String(50), default="SUSPICIOUS", nullable=False)  # "MALICIOUS", "SUSPICIOUS", "NEUTRAL", "BENIGN"
    composite_threat_score = Column(Float, default=50.0, nullable=False)  # 0 to 100
    score_breakdown_json = Column(JSON, default=dict, nullable=False)
    historical_scores_json = Column(JSON, default=list, nullable=False)  # Preserves audit trail of previous scores and overrides
    
    finding_state = Column(String(50), default="UNVERIFIED", nullable=False, index=True)  # "UNVERIFIED", "OBSERVED", "EXTERNALLY_REPORTED", "AI_SUGGESTED", "HUMAN_REVIEWED", "CONFIRMED", "FALSE_POSITIVE", "EXPIRED"
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=True)
    
    mitre_techniques_json = Column(JSON, default=list, nullable=False)
    associated_threat_actor = Column(String(200), nullable=True)
    tags_json = Column(JSON, default=list, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class ThreatCampaign(Base):
    """Coordinated threat actor campaign tracking."""
    __tablename__ = "threat_campaigns"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False, unique=True)
    threat_actor = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    targeted_sectors = Column(JSON, default=list, nullable=False)
    first_detected = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    status = Column(String(50), default="ACTIVE", nullable=False)  # "ACTIVE", "MONITORING", "DORMANT", "NEUTRALIZED"
    confidence = Column(Float, default=85.0, nullable=False)
    mitre_techniques = Column(JSON, default=list, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class ThreatAlert(Base):
    """Investigator-focused actionable alerts with deduplication window."""
    __tablename__ = "threat_alerts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    alert_category = Column(String(100), nullable=False, index=True)  # "CRITICAL_INFRASTRUCTURE", "NEW_PHISHING", "MALWARE_HASH_MATCH", "CROSS_CASE_IOC_MATCH", "EXPIRING_INTEL", "HIGH_CONFIDENCE_REPORT", "NEW_RELATIONSHIP"
    severity = Column(String(50), default="HIGH", nullable=False, index=True)  # "CRITICAL", "HIGH", "MEDIUM", "LOW"
    indicator_id = Column(String(36), nullable=True, index=True)
    indicator_type = Column(String(50), nullable=False)
    indicator_value = Column(String(1000), nullable=False)
    related_case_id = Column(String(50), nullable=True, index=True)
    source_name = Column(String(200), default="INTERNAL_DETECTION", nullable=False)
    evidence_references = Column(JSON, default=list, nullable=False)
    confidence = Column(Float, default=80.0, nullable=False)
    reason = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    detection_time = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    review_status = Column(String(50), default="NEW", nullable=False, index=True)  # "NEW", "INVESTIGATING", "RESOLVED", "FALSE_POSITIVE", "SUPPRESSED"
    suppression_hash = Column(String(64), nullable=False, index=True)  # SHA-256 for deduplication
    reviewed_by = Column(String(200), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class IntelligenceRelationship(Base):
    """Cross-entity graph relationship with auditable provenance."""
    __tablename__ = "intelligence_relationships"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_entity_id = Column(String(100), nullable=False, index=True)
    source_entity_type = Column(String(50), nullable=False, index=True)  # "INVESTIGATION", "EVIDENCE", "IP_ADDRESS", "DOMAIN", "URL", "FILE_HASH", "EMAIL", "WALLET", "MALWARE_FAMILY", "THREAT_CAMPAIGN", "INTELLIGENCE_SOURCE"
    target_entity_id = Column(String(100), nullable=False, index=True)
    target_entity_type = Column(String(50), nullable=False, index=True)
    relationship_type = Column(String(50), nullable=False, index=True)  # "OBSERVED_IN", "REPORTED_BY", "ASSOCIATED_WITH", "RESOLVES_TO", "HOSTED_ON", "EXTRACTED_FROM", "SHARED_INDICATOR", "ATTRIBUTED_TO_SOURCE", "SUGGESTED_CORRELATION", "CONFIRMED_RELATIONSHIP"
    confidence = Column(Float, default=75.0, nullable=False)
    provenance_type = Column(String(50), default="EXTERNAL_INTEL", nullable=False)  # "EXTERNAL_INTEL", "INTERNAL_EVIDENCE", "AI_SUGGESTION", "HUMAN_CONFIRMED"
    provenance_source = Column(String(200), nullable=False)
    provenance_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    evidence_reference = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    verified_by = Column(String(200), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class InvestigationReportVersion(Base):
    """Immutable, versioned court-ready investigation reports with digital custody seal."""
    __tablename__ = "investigation_report_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(50), nullable=False, index=True)
    report_code = Column(String(100), nullable=False, unique=True, index=True)
    version_number = Column(Integer, default=1, nullable=False)
    title = Column(String(300), nullable=False)
    summary = Column(Text, nullable=False)
    structured_payload_json = Column(JSON, nullable=False)  # Full Section A-F breakdown and evidence inventory
    sha256_digest = Column(String(64), nullable=False)  # Cryptographic seal
    signed_by_user_id = Column(String(36), nullable=False)
    signer_name = Column(String(200), nullable=False)
    signer_designation = Column(String(200), nullable=False)
    is_sealed = Column(Boolean, default=True, nullable=False)
    sealed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class ThreatIndicatorReviewAudit(Base):
    """
    Immutable audit trail of investigator reviews, score overrides, and false-positive transitions.
    Guarantees complete forensic provenance for intelligence scoring adjustments.
    """
    __tablename__ = "threat_indicator_review_audits"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    indicator_id = Column(String(36), ForeignKey("threat_indicators.id"), nullable=False, index=True)
    previous_state = Column(String(50), nullable=False)
    new_state = Column(String(50), nullable=False)
    previous_score = Column(Float, nullable=False)
    new_score = Column(Float, nullable=False)
    previous_breakdown_json = Column(JSON, default=dict, nullable=False)
    new_breakdown_json = Column(JSON, default=dict, nullable=False)
    override_reason = Column(Text, nullable=True)
    reviewed_by_user_id = Column(String(36), nullable=False)
    reviewer_email = Column(String(200), nullable=False)
    reviewed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


