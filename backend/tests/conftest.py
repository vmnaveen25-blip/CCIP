import asyncio
import os
import sys
from pathlib import Path
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Enforce in-memory SQLite isolation before any app module imports
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["SYNC_DATABASE_URL"] = "sqlite:///:memory:"

from app.main import app
from app.db.base import Base
from app.db.database import get_db
from app.core.config import settings
from scripts.seed import seed_database

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSessionLocal = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def init_test_db():
    import app.models  # Ensure all SQLAlchemy model classes are registered
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed default roles and test users into the test in-memory database
    from app.models.role import Role, RoleEnum
    from app.models.department import Department
    from app.models.user import User
    from app.models.case import Case
    from app.models.complaint import Complaint
    from app.models.threat_intelligence import ThreatFeed, CorrelatedGraphNode
    from app.models.audit_log import AuditLog
    from app.core.security import hash_password

    async with TestSessionLocal() as db:
        roles_data = [
            {"name": RoleEnum.CITIZEN.value, "display_name": "Verified Citizen", "description": "Citizen"},
            {"name": RoleEnum.CYBERSECURITY_SPECIALIST.value, "display_name": "Specialist", "description": "Specialist"},
            {"name": RoleEnum.CYBERCRIME_POLICE.value, "display_name": "Police", "description": "Police"},
            {"name": RoleEnum.ADMIN.value, "display_name": "Admin", "description": "Admin"},
            {"name": RoleEnum.AI_ML_SYSTEM_LEAD.value, "display_name": "AI Lead", "description": "AI Lead"},
        ]
        roles = {}
        for r in roles_data:
            role = Role(**r)
            db.add(role)
            await db.flush()
            roles[r["name"]] = role

        dept = Department(code="TF-CYBER-FRAUD", name="Federal Cyber Fraud Task Force", jurisdiction="National")
        db.add(dept)
        await db.flush()

        test_users = [
            {"email": "elena.rostova@cyberdefense.org", "full_name": "Elena Rostova", "role_id": roles[RoleEnum.CITIZEN.value].id, "clearance_level": "CITIZEN TIER", "is_staff": False},
            {"email": "a.thorne@astraea.gov", "full_name": "Dr. Aris Thorne", "badge_number": "LEO-8492", "role_id": roles[RoleEnum.CYBERSECURITY_SPECIALIST.value].id, "clearance_level": "TIER-3 FORENSICS", "is_staff": True},
            {"email": "s.chen@police.gov", "full_name": "Det. Inspector Sarah Chen", "badge_number": "LEO-7104", "role_id": roles[RoleEnum.CYBERCRIME_POLICE.value].id, "clearance_level": "LEO TIER 2", "is_staff": True},
            {"email": "root@astraea.internal", "full_name": "Admin Root", "badge_number": "ROOT-0001", "role_id": roles[RoleEnum.ADMIN.value].id, "clearance_level": "ROOT ENCLAVE", "is_staff": True},
            {"email": "m.vance@ai-ops.gov", "full_name": "Marcus Vance", "badge_number": "ML-9921", "role_id": roles[RoleEnum.AI_ML_SYSTEM_LEAD.value].id, "clearance_level": "ML-OPS LEVEL 4", "is_staff": True}
        ]
        for u in test_users:
            u_obj = User(
                password_hash=hash_password("AstraeaEnclave#42"),
                is_active=True,
                is_verified=True,
                department_id=dept.id,
                **u
            )
            db.add(u_obj)
        
        # Add sample complaint and case
        complaint = Complaint(
            reference_number="CYBER-2026-9842",
            title="Wire Fraud Incident",
            category="Financial Fraud",
            severity="CRITICAL",
            status="UNDER_INVESTIGATION",
            citizen_name="Elena Rostova",
            citizen_email="elena.rostova@cyberdefense.org",
            incident_date="2026-09-02 14:15 UTC",
            reported_date="2026-09-02 16:30 UTC",
            financial_loss=185000.0,
            description="Wire fraud sample case."
        )
        db.add(complaint)
        await db.flush()

        case = Case(
            case_number="CASE-CYBER-2026-9842",
            complaint_id=complaint.id,
            title="Wire Fraud Incident",
            priority="CRITICAL",
            status="UNDER_INVESTIGATION",
            risk_score=96.0
        )
        db.add(case)

        # Threat feed
        tf = ThreatFeed(
            ioc_value="185.220.101.44",
            ioc_type="IP_ADDRESS",
            threat_name="CobaltStrike Team Server",
            threat_actor="DarkSynapse",
            confidence_score=98.4,
            severity="CRITICAL",
            detection_time="2 mins ago",
            source_enclave="US-CYBERCOM",
            status="ACTIVE_BLOCK"
        )
        db.add(tf)

        # Correlation node
        cn = CorrelatedGraphNode(
            id="node-case-9842",
            label="Case CYBER-2026-9842",
            node_type="CASE",
            risk_score=96.0,
            connections=["node-ip-1"]
        )
        db.add(cn)

        # Audit log
        al = AuditLog(
            actor="Cmdr. S. Jenkins",
            clearance="SIGINT LEVEL 5",
            action="EVIDENCE_LOCKER_EXPORT",
            resource="CASE-2026-9842",
            status="SUCCESS",
            ip_address="10.240.12.88",
            integrity_hash="0x8f2a...110c",
            timestamp="2026-09-04 14:25:18 UTC"
        )
        db.add(al)

        from app.models.model_registry import ModelRegistry
        mr = ModelRegistry(
            id="mod-test-model-1",
            model_name="VoiceGuard Neural Biometrics",
            version="v2.4.1",
            task="Deepfake Audio Forensics",
            accuracy=98.7,
            f1_score=0.984,
            drift_rate=0.4,
            status="PRODUCTION",
            last_evaluated="2026-09-04 12:00 UTC",
            latency_ms=85,
            framework="PyTorch",
            parameters_count="350M"
        )
        db.add(mr)

        await db.commit()

    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest_asyncio.fixture
async def db_session():
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client():
    async def override_get_db():
        async with TestSessionLocal() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
