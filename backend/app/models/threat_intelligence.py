from sqlalchemy import Column, String, DateTime, Text, Float, Integer, ForeignKey, Table, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.base import Base


class ThreatFeed(Base):
    __tablename__ = "threat_intelligence"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ioc_value = Column(String(500), nullable=False, index=True)
    ioc_type = Column(String(50), nullable=False, index=True)  # "IP_ADDRESS", "SHA256_HASH", "MALICIOUS_DOMAIN", "CRYPTO_WALLET", "CVE_EXPLOIT"
    threat_name = Column(String(200), nullable=False)
    threat_actor = Column(String(200), nullable=False, index=True)
    confidence_score = Column(Float, default=90.0, nullable=False)
    severity = Column(String(50), default="HIGH", nullable=False, index=True)  # "CRITICAL", "HIGH", "MEDIUM", "LOW"
    detection_time = Column(String(100), nullable=False)
    source_enclave = Column(String(150), nullable=False)
    associated_cases_count = Column(Integer, default=0, nullable=False)
    status = Column(String(50), default="ACTIVE_BLOCK", nullable=False, index=True)  # "ACTIVE_BLOCK", "MONITORING", "TRIAGED", "RESOLVED"
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class CorrelatedGraphNode(Base):
    __tablename__ = "case_correlations"

    id = Column(String(50), primary_key=True)  # e.g. "node-case-9842"
    label = Column(String(200), nullable=False)
    node_type = Column(String(50), nullable=False)  # "CASE", "SUSPECT", "WALLET", "IP", "MALWARE", "VICTIM"
    risk_score = Column(Float, default=50.0, nullable=False)
    connections = Column(JSON, default=list, nullable=False)  # list of node ids
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
