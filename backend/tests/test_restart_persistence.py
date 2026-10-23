import os
import tempfile
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select

from app.db.base import Base
from app.models.case import Case
from app.models.complaint import Complaint
from app.models.cyber_entity import CyberEntity
from app.models.cyber_entity_relation import CyberEntityRelation
from app.models.case_correlation import CaseCorrelation
from app.models.evidence_graph import EvidenceGraphNode, EvidenceGraphEdge
from app.models.investigation import Investigation
from app.models.investigation_finding import InvestigationFinding
from app.models.learning_candidate import LearningCandidate


@pytest.mark.asyncio
async def test_restart_persistence_full_lifecycle():
    """Simulates a complete backend shutdown and cold restart, verifying zero data loss across all intelligence tables."""
    # Create temporary SQLite file for the test
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp_file:
        db_path = tmp_file.name

    db_url = f"sqlite+aiosqlite:///{db_path}"

    try:
        # Phase 1: Initialize First Engine (Before Restart)
        engine_1 = create_async_engine(db_url)
        async with engine_1.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        SessionLocal1 = async_sessionmaker(bind=engine_1, class_=AsyncSession, expire_on_commit=False)

        async with SessionLocal1() as session:
            # 1. Create Complaint
            comp = Complaint(
                reference_number="CYBER-PERSIST-001",
                title="Sovereign Enclave Persistence Verification",
                category="Investment Fraud",
                severity="HIGH",
                status="UNDER_INVESTIGATION",
                citizen_name="Aarav Mehta",
                citizen_email="aarav.mehta@example.com",
                incident_date="2026-09-12 10:00 UTC",
                reported_date="2026-09-12 10:15 UTC",
                financial_loss=450000.0,
                description="Defrauded via Telegram trading group."
            )
            session.add(comp)
            await session.flush()

            # 2. Create Case
            case = Case(
                case_number="CASE-PERSIST-001",
                complaint_id=comp.id,
                title="Sovereign Enclave Persistence Case",
                priority="HIGH",
                status="UNDER_INVESTIGATION"
            )
            session.add(case)
            await session.flush()

            # 3. Store Entities
            ent_upi = CyberEntity(
                case_id=case.id,
                complaint_id=comp.id,
                entity_type="UPI_ID",
                raw_value="fraudster@upi",
                normalized_value="fraudster@upi",
                confidence=1.0,
                source_type="DETERMINISTIC"
            )
            ent_bank = CyberEntity(
                case_id=case.id,
                complaint_id=comp.id,
                entity_type="BANK_NAME",
                raw_value="State Bank of India",
                normalized_value="STATE BANK OF INDIA",
                confidence=0.95,
                source_type="TRANSFORMER"
            )
            session.add(ent_upi)
            session.add(ent_bank)
            await session.flush()

            # 4. Store Relation
            rel = CyberEntityRelation(
                case_id=case.id,
                complaint_id=comp.id,
                source_entity_id=ent_upi.id,
                target_entity_id=ent_bank.id,
                relation_type="ASSOCIATED_WITH_BANK",
                confidence=0.91,
                source="TRANSFORMER",
                model_name="ccip-cyber-relation-extraction-v1",
                model_version="1.0.0"
            )
            session.add(rel)

            # 5. Store Investigation Finding
            inv = Investigation(
                case_id=case.id,
                title="Investigation for Persistence Case",
                status="ACTIVE"
            )
            session.add(inv)
            await session.flush()

            finding = InvestigationFinding(
                investigation_id=inv.id,
                finding_type="INTELLIGENCE_REFRESH",
                title="Multi-stage refresh",
                summary="Multi-stage intelligence refresh executed successfully.",
                confidence_score=92.5
            )
            session.add(finding)

            # 6. Store Case Correlation
            corr = CaseCorrelation(
                case_a_id=case.id,
                case_b_id="case-partner-999",
                label="STRONGLY_RELATED",
                confidence=0.88,
                similarity_score=0.92,
                shared_entity_count=1,
                shared_entity_types_json=["UPI_ID"],
                model_name="ccip-cross-case-correlation-v1",
                model_version="1.0.0",
                status="CONFIRMED_RELEVANT"
            )
            session.add(corr)

            # 7. Store Evidence Graph Node & Edge
            g_node = EvidenceGraphNode(
                case_id=case.id,
                node_type="UPI_ID",
                canonical_value="fraudster@upi",
                display_label="UPI: fraudster@upi"
            )
            session.add(g_node)
            await session.flush()

            g_edge = EvidenceGraphEdge(
                case_id=case.id,
                source_node_id=g_node.id,
                target_node_id=g_node.id,
                edge_type="SELF_LOOP",
                confidence=1.0,
                source="DETERMINISTIC",
                review_status="VERIFIED"
            )
            session.add(g_edge)

            # 8. Store Learning Candidate
            cand = LearningCandidate(
                case_id=case.id,
                target_model="incident_urgency",
                decision="APPROVE_CANDIDATE",
                gate_source="NEURAL_GATE",
                reason="All 5 hard gates passed; high data quality.",
                model_version="1.0.0",
                review_status="PENDING"
            )
            session.add(cand)

            await session.commit()

        # Phase 2: COMPLETE SHUTDOWN OF BACKEND
        await engine_1.dispose()

        # Phase 3: COLD RESTART (New Engine & Session Factory)
        engine_2 = create_async_engine(db_url)
        SessionLocal2 = async_sessionmaker(bind=engine_2, class_=AsyncSession, expire_on_commit=False)

        async with SessionLocal2() as session:
            # Verify Complaint
            res_comp = (await session.execute(select(Complaint).where(Complaint.reference_number == "CYBER-PERSIST-001"))).scalar_one_or_none()
            assert res_comp is not None
            assert res_comp.citizen_name == "Aarav Mehta"
            assert res_comp.financial_loss == 450000.0

            # Verify Case
            res_case = (await session.execute(select(Case).where(Case.case_number == "CASE-PERSIST-001"))).scalar_one_or_none()
            assert res_case is not None
            assert res_case.title == "Sovereign Enclave Persistence Case"

            # Verify Entities
            ents = (await session.execute(select(CyberEntity).where(CyberEntity.case_id == res_case.id))).scalars().all()
            assert len(ents) == 2
            ent_types = [e.entity_type for e in ents]
            assert "UPI_ID" in ent_types
            assert "BANK_NAME" in ent_types

            # Verify Relations
            rels = (await session.execute(select(CyberEntityRelation).where(CyberEntityRelation.case_id == res_case.id))).scalars().all()
            assert len(rels) == 1
            assert rels[0].relation_type == "ASSOCIATED_WITH_BANK"
            assert rels[0].confidence == 0.91

            # Verify Investigation Finding
            findings = (await session.execute(select(InvestigationFinding).join(Investigation).where(Investigation.case_id == res_case.id))).scalars().all()
            assert len(findings) == 1
            assert "Multi-stage intelligence" in findings[0].summary

            # Verify Case Correlation
            corrs = (await session.execute(select(CaseCorrelation).where(CaseCorrelation.case_a_id == res_case.id))).scalars().all()
            assert len(corrs) == 1
            assert corrs[0].label == "STRONGLY_RELATED"
            assert corrs[0].status == "CONFIRMED_RELEVANT"

            # Verify Evidence Graph
            nodes = (await session.execute(select(EvidenceGraphNode).where(EvidenceGraphNode.case_id == res_case.id))).scalars().all()
            assert len(nodes) == 1
            assert nodes[0].canonical_value == "fraudster@upi"

            edges = (await session.execute(select(EvidenceGraphEdge).where(EvidenceGraphEdge.case_id == res_case.id))).scalars().all()
            assert len(edges) == 1
            assert edges[0].review_status == "VERIFIED"

            # Verify Learning Candidate
            candidates = (await session.execute(select(LearningCandidate).where(LearningCandidate.case_id == res_case.id))).scalars().all()
            assert len(candidates) == 1
            assert candidates[0].decision == "APPROVE_CANDIDATE"

        await engine_2.dispose()

    finally:
        if os.path.exists(db_path):
            try:
                os.remove(db_path)
            except OSError:
                pass
