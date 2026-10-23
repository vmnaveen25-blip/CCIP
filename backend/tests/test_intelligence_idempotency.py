import pytest
from sqlalchemy import select
from app.models.case import Case
from app.models.complaint import Complaint
from app.models.cyber_entity import CyberEntity
from app.models.cyber_entity_relation import CyberEntityRelation
from app.models.case_correlation import CaseCorrelation
from app.services.intelligence_orchestrator import intelligence_orchestrator
from app.services.cross_case_correlation_service import cross_case_correlation_service


@pytest.mark.asyncio
async def test_intelligence_refresh_idempotency_and_caching(db_session):
    """Verifies that calling intelligence refresh twice on the same case reuses cached results and prevents duplicate relations/entities."""
    # Create complaint
    comp = Complaint(
        reference_number="CYBER-IDEMP-001",
        title="UPI Scam Idempotency Test",
        category="Financial Fraud",
        severity="MEDIUM",
        status="UNDER_INVESTIGATION",
        citizen_name="Pooja Patel",
        citizen_email="pooja.patel@example.com",
        incident_date="2026-09-12 11:00 UTC",
        reported_date="2026-09-12 11:15 UTC",
        financial_loss=30000.0,
        description="Transferred Rs 30000 to fraud UPI scammer@oksbi on GooglePay."
    )
    db_session.add(comp)
    await db_session.flush()

    case = Case(
        case_number="CASE-IDEMP-001",
        complaint_id=comp.id,
        title="UPI Scam Idempotency Case",
        priority="MEDIUM",
        status="UNDER_INVESTIGATION"
    )
    db_session.add(case)
    await db_session.commit()

    # First Refresh (Cold execution)
    res1 = await intelligence_orchestrator.refresh_case_intelligence(db_session, case.id, force_refresh=False)
    assert res1["stages"]["entity_extraction"]["status"] == "SUCCESS"
    assert res1["stages"]["relation_extraction"]["status"] == "SUCCESS"
    assert res1["stages"]["incident_urgency"]["status"] == "SUCCESS"
    assert res1["stages"]["evidence_graph"]["status"] == "SUCCESS"

    # Count entities and relations in database
    ents_1 = (await db_session.execute(select(CyberEntity).where(CyberEntity.case_id == case.id))).scalars().all()
    rels_1 = (await db_session.execute(select(CyberEntityRelation).where(CyberEntityRelation.case_id == case.id))).scalars().all()
    count_ents_1 = len(ents_1)
    count_rels_1 = len(rels_1)
    assert count_ents_1 > 0

    # Second Refresh (Should hit cache and not duplicate)
    res2 = await intelligence_orchestrator.refresh_case_intelligence(db_session, case.id, force_refresh=False)
    assert res2["stages"]["entity_extraction"]["cached"] is True
    assert res2["stages"]["relation_extraction"]["cached"] is True

    ents_2 = (await db_session.execute(select(CyberEntity).where(CyberEntity.case_id == case.id))).scalars().all()
    rels_2 = (await db_session.execute(select(CyberEntityRelation).where(CyberEntityRelation.case_id == case.id))).scalars().all()

    # Assert exact counts remain equal (zero duplication)
    assert len(ents_2) == count_ents_1
    assert len(rels_2) == count_rels_1


@pytest.mark.asyncio
async def test_cross_case_correlation_preserves_investigator_verdict(db_session):
    """Verifies that an investigator's review verdict (e.g. CONFIRMED_RELEVANT) is never overwritten by subsequent automated correlation scans."""
    comp_a = Complaint(
        reference_number="CYBER-CORR-A",
        title="Investment Scam Syndicate Part 1",
        category="Investment Fraud",
        severity="HIGH",
        status="UNDER_INVESTIGATION",
        citizen_name="Rajesh Kumar",
        citizen_email="rajesh@example.com",
        incident_date="2026-09-12 10:00 UTC",
        reported_date="2026-09-12 10:15 UTC",
        financial_loss=100000.0,
        description="Scam Part 1"
    )
    comp_b = Complaint(
        reference_number="CYBER-CORR-B",
        title="Investment Scam Syndicate Part 2",
        category="Investment Fraud",
        severity="HIGH",
        status="UNDER_INVESTIGATION",
        citizen_name="Suresh Kumar",
        citizen_email="suresh@example.com",
        incident_date="2026-09-12 10:30 UTC",
        reported_date="2026-09-12 10:45 UTC",
        financial_loss=200000.0,
        description="Scam Part 2"
    )
    db_session.add(comp_a)
    db_session.add(comp_b)
    await db_session.flush()

    case_a = Case(case_number="CASE-CORR-A", complaint_id=comp_a.id, title="Investment Scam Syndicate Part 1", priority="HIGH")
    case_b = Case(case_number="CASE-CORR-B", complaint_id=comp_b.id, title="Investment Scam Syndicate Part 2", priority="HIGH")
    db_session.add(case_a)
    db_session.add(case_b)
    await db_session.flush()

    # Add shared cyber entity
    ent_a = CyberEntity(case_id=case_a.id, entity_type="UPI_ID", raw_value="syndicate@upi", normalized_value="syndicate@upi")
    ent_b = CyberEntity(case_id=case_b.id, entity_type="UPI_ID", raw_value="syndicate@upi", normalized_value="syndicate@upi")
    db_session.add(ent_a)
    db_session.add(ent_b)
    await db_session.commit()

    # Initial correlation
    corrs = await cross_case_correlation_service.correlate_case(db_session, case_a.id, force_refresh=True)
    assert len(corrs) >= 1
    target_corr = corrs[0]
    assert target_corr.status == "UNREVIEWED"

    # Human investigator confirms correlation
    reviewed = await cross_case_correlation_service.review_correlation(
        db=db_session,
        correlation_id=target_corr.id,
        reviewer_id="user-police-01",
        status="CONFIRMED_RELEVANT",
        notes="Shared UPI and matching investment pitch confirmed by officer."
    )
    assert reviewed.status == "CONFIRMED_RELEVANT"

    # Run correlation again with force_refresh=True
    corrs_again = await cross_case_correlation_service.correlate_case(db_session, case_a.id, force_refresh=True)
    assert len(corrs_again) >= 1
    # VERIFY: Investigator status was PRESERVED and not reset to UNREVIEWED!
    assert corrs_again[0].status == "CONFIRMED_RELEVANT"
