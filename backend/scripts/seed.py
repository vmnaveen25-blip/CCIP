import asyncio
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import async_engine, AsyncSessionLocal
from app.db.base import Base
from app.models.role import Role, RoleEnum
from app.models.permission import Permission
from app.models.department import Department
from app.models.user import User
from app.models.complaint import Complaint, ComplaintStatusEnum, ComplaintSeverityEnum, ComplaintCategoryEnum
from app.models.complaint_event import ComplaintEvent
from app.models.case import Case, CaseStatusEnum, CasePriorityEnum
from app.models.evidence import Evidence
from app.models.evidence_metadata import EvidenceMetadata
from app.models.evidence_hash import EvidenceHash
from app.models.threat_intelligence import ThreatFeed, CorrelatedGraphNode
from app.models.model_registry import ModelRegistry
from app.models.audit_log import AuditLog
from app.models.notification import Notification
from app.core.security import hash_password
from app.core.config import settings
from app.core.logging import logger


async def seed_database():
    app_env = os.environ.get("APP_ENV", settings.APP_ENV).lower()
    allow_demo = (os.environ.get("ALLOW_DEMO_SEEDING", "").lower() in ("true", "1")) or settings.ALLOW_DEMO_SEEDING
    if app_env in ("production", "prod") and not allow_demo:
        logger.error(
            "CRITICAL SECURITY ABORT: Seeding demo accounts is strictly prohibited in production! "
            "To override for isolated staging tests, explicitly set ALLOW_DEMO_SEEDING=true."
        )
        raise RuntimeError("Demo account seeding is prohibited in production environment.")

    logger.info("Initializing CCIP Sovereign Enclave Database schema...")
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        try:
            from sqlalchemy import text
            await conn.execute(text("ALTER TABLE complaints ADD COLUMN tracking_token VARCHAR(64)"))
        except Exception:
            pass

    async with AsyncSessionLocal() as db:
        # 1. ROLES & PERMISSIONS
        logger.info("Seeding operational RBAC roles...")
        roles_data = [
            {"name": RoleEnum.CITIZEN.value, "display_name": "Verified Citizen", "description": "Public citizen reporting and tracking access"},
            {"name": RoleEnum.CYBERSECURITY_SPECIALIST.value, "display_name": "Cybersecurity Specialist (SOC)", "description": "SOC monitoring, digital forensics and telemetry"},
            {"name": RoleEnum.CYBERCRIME_POLICE.value, "display_name": "Cybercrime Police Command", "description": "Law enforcement dispatch, warrant generation and judicial filing"},
            {"name": RoleEnum.ADMIN.value, "display_name": "System Administrator", "description": "System governance, root configuration and access control"},
            {"name": RoleEnum.AI_ML_SYSTEM_LEAD.value, "display_name": "AI/ML System Lead", "description": "Model registry, training governance and drift monitoring"},
        ]

        roles = {}
        for r_info in roles_data:
            q = select(Role).where(Role.name == r_info["name"])
            existing = (await db.execute(q)).scalars().first()
            if not existing:
                new_role = Role(**r_info)
                db.add(new_role)
                await db.flush()
                roles[r_info["name"]] = new_role
            else:
                roles[r_info["name"]] = existing

        # 2. DEPARTMENTS
        logger.info("Seeding operational departments...")
        depts_data = [
            {"code": "TF-CYBER-FRAUD", "name": "State Cyber Crime Wing (CCPS Cyber Command)", "jurisdiction": "State Level"},
            {"code": "DIR-NIPD", "name": "National Critical Info Infra Protection Centre (NCIIPC / CERT-In)", "jurisdiction": "National Critical Infra"},
            {"code": "SQ-ID-THEFT", "name": "District Cyber Crime Unit (DCCU)", "jurisdiction": "District Level"},
            {"code": "TF-PHISH-TAKEDOWN", "name": "State Cyber Cell Domain Takedown Taskforce", "jurisdiction": "State Telemetry"},
        ]
        depts = {}
        for d_info in depts_data:
            q = select(Department).where(Department.code == d_info["code"])
            existing = (await db.execute(q)).scalars().first()
            if not existing:
                new_d = Department(**d_info)
                db.add(new_d)
                await db.flush()
                depts[d_info["code"]] = new_d
            else:
                depts[d_info["code"]] = existing

        # 3. USERS FOR ALL FIVE ROLES (DEV ACCOUNTS)
        logger.info("Seeding test users for all 5 operational roles...")
        users_data = [
            {
                "email": "elena.rostova@cyberdefense.org",
                "full_name": "Priya Sharma",
                "password": "SentinelSafe#2026",
                "phone_number": "+919876543210",
                "role_id": roles[RoleEnum.CITIZEN.value].id,
                "clearance_level": "CITIZEN TIER",
                "is_staff": False,
                "mfa_type": "SMS_OTP",
                "department_id": None
            },
            {
                "email": "a.thorne@astraea.gov",
                "badge_number": "LEO-8492",
                "full_name": "Dr. Aris Thorne",
                "password": "AstraeaEnclave#42",
                "phone_number": "+919811234567",
                "role_id": roles[RoleEnum.CYBERSECURITY_SPECIALIST.value].id,
                "clearance_level": "TIER-3 FORENSICS",
                "is_staff": True,
                "mfa_type": "FIDO2",
                "department_id": depts["TF-CYBER-FRAUD"].id
            },
            {
                "email": "s.chen@police.gov",
                "badge_number": "LEO-7104",
                "full_name": "Cyber Inspector Sarah Chen",
                "password": "AstraeaEnclave#42",
                "phone_number": "+919822334455",
                "role_id": roles[RoleEnum.CYBERCRIME_POLICE.value].id,
                "clearance_level": "LEO TIER 2",
                "is_staff": True,
                "mfa_type": "TOTP",
                "department_id": depts["TF-CYBER-FRAUD"].id
            },
            {
                "email": "root@astraea.internal",
                "badge_number": "ROOT-0001",
                "full_name": "Admin Root",
                "password": "AstraeaEnclave#42",
                "phone_number": "+919999000000",
                "role_id": roles[RoleEnum.ADMIN.value].id,
                "clearance_level": "ROOT ENCLAVE",
                "is_staff": True,
                "mfa_type": "HARDWARE KEY",
                "department_id": depts["DIR-NIPD"].id
            },
            {
                "email": "m.vance@ai-ops.gov",
                "badge_number": "ML-9921",
                "full_name": "Marcus Vance",
                "password": "AstraeaEnclave#42",
                "phone_number": "+919877665544",
                "role_id": roles[RoleEnum.AI_ML_SYSTEM_LEAD.value].id,
                "clearance_level": "ML-OPS LEVEL 4",
                "is_staff": True,
                "mfa_type": "FIDO2",
                "department_id": depts["DIR-NIPD"].id
            }
        ]

        users = {}
        for u_info in users_data:
            q = select(User).where(User.email == u_info["email"])
            existing = (await db.execute(q)).scalars().first()
            if not existing:
                pwd = u_info.pop("password")
                new_u = User(
                    password_hash=hash_password(pwd),
                    is_active=True,
                    is_verified=True,
                    **u_info
                )
                db.add(new_u)
                await db.flush()
                users[u_info["email"]] = new_u
            else:
                users[u_info["email"]] = existing

        # 4. SEED REALISTIC COMPLAINTS & EVIDENCE FILES
        logger.info("Seeding active cybercrime complaints and evidence vaults...")
        complaints_seed = [
            {
                "id": "case-1001",
                "reference_number": "CYBER-2026-9842",
                "title": "AI Voice Clone Impersonation UPI & Wire Fraud (₹18,50,000)",
                "category": "Financial Fraud",
                "severity": "CRITICAL",
                "status": "UNDER_INVESTIGATION",
                "citizen_name": "Priya Sharma",
                "citizen_email": "elena.rostova@cyberdefense.org",
                "citizen_phone": "+919876543210",
                "incident_date": "2026-09-02 14:15 IST",
                "reported_date": "2026-09-02 16:30 IST",
                "financial_loss": 1850000.0,
                "suspect_info": {
                    "alias": "Apex Phantom / DarkSynapse",
                    "email": "finance-verify@secure-nexus-auth.in",
                    "phone": "+919811234567",
                    "walletAddress": "0x71C...4e89 (Ethereum Mainnet)",
                    "ipAddress": "185.220.101.44 (Exit Node Tor-DE)"
                },
                "description": "Received a synthetic deepfake audio call impersonating our Managing Director requesting urgent settlement of supplier invoice to an unauthorized mule bank account and UPI VPA (pay-vendor@upi).",
                "triage_score": 96,
                "predicted_threat_group": "UNC4192 (DarkSynapse Syndicate)",
                "assigned_unit": "State Cyber Crime Wing (CCPS Cyber Command)",
                "assigned_officer": "Cyber Crime Inspector Rajesh Sharma (CCPS #7402)"
            },
            {
                "id": "case-1002",
                "reference_number": "CYBER-2026-8719",
                "title": "Hospital Clinical Network Ransomware (LockBit v4 Variant) (₹45,00,000)",
                "category": "Ransomware / Extortion",
                "severity": "CRITICAL",
                "status": "LAW_ENFORCEMENT_DISPATCHED",
                "citizen_name": "Dr. Arthur Sterling",
                "citizen_email": "director.it@apollo-regional.med",
                "citizen_phone": "+919823045678",
                "incident_date": "2026-09-03 03:22 IST",
                "reported_date": "2026-09-03 04:10 IST",
                "financial_loss": 4500000.0,
                "suspect_info": {
                    "alias": "ShadowLock Group",
                    "walletAddress": "bc1q9x...38a1 (Bitcoin SegWit)",
                    "website": "http://shadowlock-ransom-leak-darknet.onion",
                    "ipAddress": "194.26.29.112"
                },
                "description": "Entire Radiology PACS archive encrypted with .SHADOW extension. Ransom note demands 15 BTC within 48 hours or patient record release.",
                "triage_score": 99,
                "predicted_threat_group": "FIN12 / ShadowLock Affiliate",
                "assigned_unit": "National Critical Info Infra Protection Centre (NCIIPC / CERT-In)",
                "assigned_officer": "Officer Priya Nair (CERT-In Response Unit)"
            },
            {
                "id": "case-1003",
                "reference_number": "CYBER-2026-7650",
                "title": "SIM Swap & Unauthorized UPI Multi-Bank Transfer (₹4,20,000)",
                "category": "Identity Theft",
                "severity": "HIGH",
                "status": "EVIDENCE_VERIFIED",
                "citizen_name": "David Chen",
                "citizen_email": "david.chen@technova.in",
                "citizen_phone": "+919845012345",
                "incident_date": "2026-09-01 22:00 IST",
                "reported_date": "2026-09-02 08:30 IST",
                "financial_loss": 420000.0,
                "suspect_info": {
                    "alias": "GhostSIM Cell #8",
                    "phone": "+919988776655",
                    "ipAddress": "104.28.19.88"
                },
                "description": "Cell phone suddenly showed No Service. Suspect executed unauthorized SIM swap, bypassed 2FA SMS and drained checking & savings accounts via unauthorized UPI transactions.",
                "triage_score": 78,
                "assigned_unit": "District Cyber Crime Unit (DCCU)",
                "assigned_officer": "Cyber Crime Inspector Vikram Singh"
            },
            {
                "id": "case-1004",
                "reference_number": "CYBER-2026-6411",
                "title": "Phishing Campaign Spoofing Income Tax Department Refund Portal",
                "category": "Phishing / Social Eng",
                "severity": "MEDIUM",
                "status": "TRIAGED",
                "citizen_name": "Aisha Al-Mansoor",
                "citizen_email": "aisha.m@aerocorp.gov.in",
                "citizen_phone": "+919711098765",
                "incident_date": "2026-09-04 09:10 IST",
                "reported_date": "2026-09-04 10:05 IST",
                "financial_loss": 0.0,
                "suspect_info": {
                    "website": "https://incometax-efiling-refund-gov.in.net",
                    "email": "refund-notice@incometax-portal-alerts.info",
                    "ipAddress": "45.142.214.9"
                },
                "description": "Broadcast email claiming mandatory Income Tax Department refund claim verification with deceptive reverse-proxy phishing kit bypassing 2FA credentials.",
                "triage_score": 65,
                "assigned_unit": "State Cyber Cell Domain Takedown Taskforce",
                "assigned_officer": "Auto Triage Worker #3"
            }
        ]

        for c_info in complaints_seed:
            q = select(Complaint).where(Complaint.reference_number == c_info["reference_number"])
            existing = (await db.execute(q)).scalars().first()
            if not existing:
                complaint = Complaint(
                    citizen_id=users.get(c_info["citizen_email"], users["elena.rostova@cyberdefense.org"]).id,
                    **c_info
                )
                db.add(complaint)
                await db.flush()

                # Add sample evidence file
                ev = Evidence(
                    complaint_id=complaint.id,
                    original_filename="sample_forensic_evidence.pdf",
                    mime_type="application/pdf",
                    file_size_bytes=2450000,
                    file_size_formatted="2.4 MB",
                    storage_key=f"evidence/sample_{complaint.reference_number}.pdf",
                    sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                    integrity_status="Submission Integrity Recorded",
                    is_verified=True
                )
                db.add(ev)

                # Add timeline events
                ev1 = ComplaintEvent(
                    complaint_id=complaint.id,
                    title="Citizen Incident Submitted",
                    description="Case securely received and encrypted in Enclave-Alpha with cryptographic SHA-256 integrity seal.",
                    actor="Citizen Portal / Automated Ingest",
                    verified_hash="0x4a9f...881c",
                    timestamp=complaint.reported_date
                )
                db.add(ev1)

                # Add Case
                case = Case(
                    case_number=f"CASE-{complaint.reference_number}",
                    complaint_id=complaint.id,
                    title=complaint.title,
                    summary=complaint.description[:500],
                    priority=complaint.severity,
                    status=complaint.status,
                    risk_score=float(complaint.triage_score),
                    is_high_risk=complaint.severity in ["CRITICAL", "HIGH"],
                    assigned_officer_id=users["s.chen@police.gov"].id,
                    assigned_specialist_id=users["a.thorne@astraea.gov"].id,
                    assigned_department_id=depts["TF-CYBER-FRAUD"].id
                )
                db.add(case)

        # 5. THREAT FEEDS
        logger.info("Seeding IOC threat feeds...")
        threats_data = [
            {
                "ioc_value": "185.220.101.44",
                "ioc_type": "IP_ADDRESS",
                "threat_name": "CobaltStrike Team Server / Tor Egress Node",
                "threat_actor": "DarkSynapse / UNC4192",
                "confidence_score": 98.4,
                "severity": "CRITICAL",
                "detection_time": "2 mins ago",
                "source_enclave": "I4C Cyber Threat Intelligence Grid",
                "associated_cases_count": 14,
                "status": "ACTIVE_BLOCK"
            },
            {
                "ioc_value": "0x71C83909a12bc90048EF910c2830fFa829804e89",
                "ioc_type": "CRYPTO_WALLET",
                "threat_name": "Tornado.Cash Multi-Hop Mixer Ingress",
                "threat_actor": "Lazarus Group Sub-Cluster B",
                "confidence_score": 94.7,
                "severity": "CRITICAL",
                "detection_time": "8 mins ago",
                "source_enclave": "Sovereign Crypto Trace Mesh",
                "associated_cases_count": 6,
                "status": "ACTIVE_BLOCK"
            },
            {
                "ioc_value": "7a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
                "ioc_type": "SHA256_HASH",
                "threat_name": "BlackCat/ALPHV v3 Stealth Loader (.dll)",
                "threat_actor": "ALPHV Affiliate Network",
                "confidence_score": 99.1,
                "severity": "CRITICAL",
                "detection_time": "14 mins ago",
                "source_enclave": "CERT-In Threat Intelligence Enclave",
                "associated_cases_count": 22,
                "status": "ACTIVE_BLOCK"
            },
            {
                "ioc_value": "secure-nexus-auth.in",
                "ioc_type": "MALICIOUS_DOMAIN",
                "threat_name": "Evilginx3 Reverse Proxy Credential Harvester",
                "threat_actor": "Tycoon2FA Phishing Campaign",
                "confidence_score": 88.5,
                "severity": "HIGH",
                "detection_time": "27 mins ago",
                "source_enclave": "NCRP DNS Takedown Sensor",
                "associated_cases_count": 3,
                "status": "MONITORING"
            },
            {
                "ioc_value": "CVE-2026-3819",
                "ioc_type": "CVE_EXPLOIT",
                "threat_name": "Zero-Day RCE in Edge Gateway VPN Appliances",
                "threat_actor": "Volt Typhoon Secondary Cell",
                "confidence_score": 96.0,
                "severity": "CRITICAL",
                "detection_time": "42 mins ago",
                "source_enclave": "NCIIPC Critical Vulnerability Ingest",
                "associated_cases_count": 8,
                "status": "ACTIVE_BLOCK"
            }
        ]

        for tf in threats_data:
            q = select(ThreatFeed).where(ThreatFeed.ioc_value == tf["ioc_value"])
            if not (await db.execute(q)).scalars().first():
                db.add(ThreatFeed(**tf))

        # 6. CORRELATION GRAPH NODES
        logger.info("Seeding correlation graph nodes...")
        nodes_data = [
            {"id": "node-case-9842", "label": "Case CYBER-2026-9842 (UPI Wire Fraud ₹18.5L)", "node_type": "CASE", "risk_score": 96.0, "connections": ["node-wallet-1", "node-ip-1", "node-actor-darksynapse"]},
            {"id": "node-wallet-1", "label": "Wallet 0x71C...4e89 (ETH Mixer)", "node_type": "WALLET", "risk_score": 94.0, "connections": ["node-case-9842", "node-case-7650", "node-actor-darksynapse", "node-wallet-2"]},
            {"id": "node-wallet-2", "label": "Wallet bc1q9x...38a1 (BTC Hopper)", "node_type": "WALLET", "risk_score": 91.0, "connections": ["node-wallet-1", "node-case-8719"]},
            {"id": "node-ip-1", "label": "IP 185.220.101.44 (C2 Server)", "node_type": "IP", "risk_score": 98.0, "connections": ["node-case-9842", "node-malware-1"]},
            {"id": "node-actor-darksynapse", "label": "Threat Group UNC4192 (DarkSynapse)", "node_type": "SUSPECT", "risk_score": 99.0, "connections": ["node-case-9842", "node-ip-1", "node-malware-1", "node-wallet-1"]},
            {"id": "node-case-8719", "label": "Case CYBER-2026-8719 (Hospital Ransomware ₹45L)", "node_type": "CASE", "risk_score": 99.0, "connections": ["node-wallet-2", "node-malware-1"]},
            {"id": "node-malware-1", "label": "LockBit/DarkSynapse Deepfake Loader", "node_type": "MALWARE", "risk_score": 97.0, "connections": ["node-actor-darksynapse", "node-ip-1", "node-case-8719"]},
            {"id": "node-case-7650", "label": "Case CYBER-2026-7650 (SIM-Swap ₹4.2L)", "node_type": "CASE", "risk_score": 78.0, "connections": ["node-wallet-1"]}
        ]
        for nd in nodes_data:
            q = select(CorrelatedGraphNode).where(CorrelatedGraphNode.id == nd["id"])
            if not (await db.execute(q)).scalars().first():
                db.add(CorrelatedGraphNode(**nd))

        # 7. MODEL REGISTRY METRICS
        logger.info("Seeding AI model registry metadata...")
        models_data = [
            {"id": "mod-1", "model_name": "Astraea-Deepfake-Voice-Guard", "version": "v3.8.4", "task": "Synthetic Spectral Audio Anomaly Classifier", "accuracy": 98.6, "f1_score": 0.984, "drift_rate": 1.2, "status": "PRODUCTION", "last_evaluated": "10 mins ago", "latency_ms": 142},
            {"id": "mod-2", "model_name": "IOC-Graph-Correlator-GNN", "version": "v4.1.0", "task": "Heterogeneous Graph Cluster Resolution", "accuracy": 96.2, "f1_score": 0.958, "drift_rate": 3.4, "status": "PRODUCTION", "last_evaluated": "1 hour ago", "latency_ms": 310},
            {"id": "mod-3", "model_name": "FinFraud-MultiHop-Tracer", "version": "v2.9.1", "task": "Crypto Layering & Peel-Chain Predictor", "accuracy": 94.8, "f1_score": 0.941, "drift_rate": 2.1, "status": "PRODUCTION", "last_evaluated": "2 hours ago", "latency_ms": 185},
            {"id": "mod-4", "model_name": "PhishKit-ReverseProxy-Detector", "version": "v5.0.0-rc2", "task": "Zero-Hour Domain & SSL Telemetry Scorer", "accuracy": 92.4, "f1_score": 0.919, "drift_rate": 8.7, "status": "RETRAINING", "last_evaluated": "4 hours ago", "latency_ms": 95},
            {"id": "mod-5", "model_name": "DeBERTa-v3-Complaint-Classifier", "version": "v1.1.0", "task": "18-Class Multi-Label Cybercrime Classifier", "accuracy": 97.6, "f1_score": 0.984, "drift_rate": 0.4, "status": "PRODUCTION", "last_evaluated": "Just now", "latency_ms": 420}
        ]
        for md in models_data:
            q = select(ModelRegistry).where(ModelRegistry.id == md["id"])
            if not (await db.execute(q)).scalars().first():
                db.add(ModelRegistry(**md))

        # 8. AUDIT LOGS
        logger.info("Seeding system audit logs...")
        logs_data = [
            {"id": "log-101", "timestamp": "2026-09-04 14:25:18 IST", "actor": "Cyber Inspector R. Sharma", "clearance": "STATE CCPS LEVEL 5", "action": "EVIDENCE_LOCKER_EXPORT", "resource": "CASE-2026-9842 / deepfake_sample.wav", "status": "SUCCESS", "ip_address": "10.240.12.88 (Secure Terminal Enclave)", "integrity_hash": "0x8f2a...110c"},
            {"id": "log-102", "timestamp": "2026-09-04 14:18:42 IST", "actor": "Officer Priya Nair", "clearance": "STATE-LEO TIER 2", "action": "1930_FREEZE_NOTICE_ISSUED", "resource": "CASE-2026-8719 / Exchange Freeze Request", "status": "SUCCESS", "ip_address": "10.240.14.19 (Cyber Command Station 4)", "integrity_hash": "0x3c71...90da"},
            {"id": "log-103", "timestamp": "2026-09-04 13:52:09 IST", "actor": "Unknown External Entity", "clearance": "UNAUTHENTICATED", "action": "GRAPH_QL_INTROSPECTION_ATTEMPT", "resource": "/api/v2/evidence/chain-of-custody", "status": "DENIED", "ip_address": "185.191.171.12 (Blocked Tor Exit)", "integrity_hash": "0x0000...FAIL"},
            {"id": "log-104", "timestamp": "2026-09-04 13:10:44 IST", "actor": "AutoML Pipeline Service Worker", "clearance": "SYSTEM_INTERNAL", "action": "MODEL_WEIGHTS_VALIDATION", "resource": "Astraea-Deepfake-Voice-Guard (v3.8.4)", "status": "SUCCESS", "ip_address": "127.0.0.1 (Enclave Hypervisor)", "integrity_hash": "0x5b19...ea73"}
        ]
        for lg in logs_data:
            q = select(AuditLog).where(AuditLog.id == lg["id"])
            if not (await db.execute(q)).scalars().first():
                db.add(AuditLog(**lg))

        # 9. NOTIFICATIONS
        logger.info("Seeding system notifications...")
        notifs_data = [
            {
                "user_id": users["elena.rostova@cyberdefense.org"].id,
                "title": "1930 HELPLINE ASSET FREEZE",
                "message": "Nodal Officer confirmed ₹18,50,000 hold on suspect beneficiary account (Case CYBER-2026-9842).",
                "notification_type": "ASSET_FREEZE",
                "severity": "CRITICAL",
                "is_read": False
            },
            {
                "user_id": users["elena.rostova@cyberdefense.org"].id,
                "title": "DEEPFAKE SPECTRUM MATCH",
                "message": "Voice audio match 98.6% confirmed with DarkSynapse syndicate model catalog.",
                "notification_type": "AI_DETECTION",
                "severity": "HIGH",
                "is_read": False
            },
            {
                "user_id": users["elena.rostova@cyberdefense.org"].id,
                "title": "EVIDENCE SEAL HASHED",
                "message": "All evidence items sealed into Zero-Knowledge Enclave with SHA-256 signatures.",
                "notification_type": "EVIDENCE_SEALED",
                "severity": "INFO",
                "is_read": False
            }
        ]
        for nt in notifs_data:
            db.add(Notification(**nt))

        await db.commit()
        logger.info("CCIP Enclave database successfully seeded with initial operational data!")


if __name__ == "__main__":
    asyncio.run(seed_database())
