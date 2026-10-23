import pytest
from sqlalchemy import select
from app.models.case import Case
from app.models.complaint import Complaint
from app.models.cyber_entity import CyberEntity
from app.models.cyber_entity_relation import CyberEntityRelation
from app.models.evidence_graph import EvidenceGraphNode, EvidenceGraphEdge
from app.services.evidence_graph_service import evidence_graph_service


@pytest.mark.asyncio
async def test_evidence_graph_construction_and_provenance(db_session):
    """Verifies that evidence graph nodes and edges reflect real database entities without hallucinations."""
    # 1. Create a test complaint and case
    comp = Complaint(
        reference_number="CYBER-GRAPH-001",
        title="Crypto Extortion",
        category="Cyber Extortion",
        citizen_name="Elena",
        citizen_email="elena@example.com",
        incident_date="2026-09-12 10:00 UTC",
        reported_date="2026-09-12 10:00 UTC",
        description="Extortion on Telegram"
    )
    db_session.add(comp)
    await db_session.flush()

    case = Case(
        case_number="CASE-GRAPH-TEST-001",
        complaint_id=comp.id,
        title="Telegram Crypto Extortion Graph Test",
        priority="HIGH",
        status="UNDER_INVESTIGATION"
    )
    db_session.add(case)
    await db_session.flush()

    # 2. Add real cyber entities to case
    ent_person = CyberEntity(
        case_id=case.id,
        entity_type="PERSON_NAME",
        raw_value="Rohit Varma",
        normalized_value="Rohit Varma",
        confidence=0.92,
        source_type="TRANSFORMER"
    )
    ent_upi = CyberEntity(
        case_id=case.id,
        entity_type="UPI_ID",
        raw_value="extortionist@ybl",
        normalized_value="extortionist@ybl",
        confidence=1.0,
        source_type="DETERMINISTIC"
    )
    db_session.add(ent_person)
    db_session.add(ent_upi)
    await db_session.flush()

    # 3. Add an entity relation
    rel = CyberEntityRelation(
        case_id=case.id,
        source_entity_id=ent_person.id,
        target_entity_id=ent_upi.id,
        relation_type="USES_ACCOUNT",
        confidence=0.88,
        source="TRANSFORMER",
        model_name="ccip-cyber-relation-extraction-v1",
        model_version="1.0.0"
    )
    db_session.add(rel)
    await db_session.commit()

    # 4. Build graph
    res = await evidence_graph_service.build_or_refresh_graph_for_case(db_session, case.id)
    assert res["case_id"] == case.id
    assert res["node_count"] >= 3  # Case node + Person node + UPI node
    assert res["edge_count"] >= 3  # 2 Case->Entity + 1 Relation

    # Verify nodes
    node_types = [n["node_type"] for n in res["nodes"]]
    assert "CASE" in node_types
    assert "PERSON_NAME" in node_types
    assert "UPI_ID" in node_types

    # Verify edge provenance
    sources = [e["source"] for e in res["edges"]]
    assert "DETERMINISTIC" in sources
    assert "RELATION_MODEL" in sources

    # Check that relation edge has review_status UNVERIFIED
    rel_edges = [e for e in res["edges"] if e["source"] == "RELATION_MODEL"]
    assert len(rel_edges) >= 1
    assert rel_edges[0]["review_status"] == "UNVERIFIED"

    # 5. Review edge (Investigator confirmation)
    edge_to_review = rel_edges[0]["id"]
    reviewed_edge = await evidence_graph_service.review_edge(
        db=db_session,
        edge_id=edge_to_review,
        status="VERIFIED"
    )
    assert reviewed_edge is not None
    assert reviewed_edge.review_status == "VERIFIED"


@pytest.mark.asyncio
async def test_evidence_graph_duplicate_prevention(db_session):
    """Verifies that repeated graph builds do not generate duplicate nodes or edges."""
    comp2 = Complaint(
        reference_number="CYBER-GRAPH-002",
        title="Duplicate Test",
        category="Identity Theft",
        citizen_name="Elena",
        citizen_email="elena@example.com",
        incident_date="2026-09-12 10:00 UTC",
        reported_date="2026-09-12 10:00 UTC",
        description="Phone extortion"
    )
    db_session.add(comp2)
    await db_session.flush()

    case = Case(
        case_number="CASE-GRAPH-TEST-002",
        complaint_id=comp2.id,
        title="Duplicate Test Case",
        priority="LOW",
        status="UNDER_INVESTIGATION"
    )
    db_session.add(case)
    await db_session.flush()

    ent = CyberEntity(
        case_id=case.id,
        entity_type="PHONE_NUMBER",
        raw_value="+919876543210",
        normalized_value="+919876543210",
        confidence=1.0,
        source_type="DETERMINISTIC"
    )
    db_session.add(ent)
    await db_session.commit()

    # Build graph first time
    res1 = await evidence_graph_service.build_or_refresh_graph_for_case(db_session, case.id)
    n1 = res1["node_count"]
    e1 = res1["edge_count"]

    # Build graph second time
    res2 = await evidence_graph_service.build_or_refresh_graph_for_case(db_session, case.id)
    n2 = res2["node_count"]
    e2 = res2["edge_count"]

    assert n1 == n2
    assert e1 == e2
