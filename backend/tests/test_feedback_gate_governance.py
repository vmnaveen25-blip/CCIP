import pytest
from app.ai.adapters.feedback_gate import feedback_gate_adapter
from app.services.feedback_gate_service import feedback_gate_service
from app.models.learning_candidate import LearningCandidate
from app.models.complaint import Complaint
from app.models.case import Case


def test_feedback_gate_adapter_five_deterministic_hard_gates():
    """Validates that all 5 deterministic hard gates strictly override neural inference."""
    assert feedback_gate_adapter.is_available() is True

    base_features = {
        "reviewer_authorized": True,
        "evidence_integrity_verified": True,
        "audit_complete": True,
        "appeal_or_reopen_pending": False,
        "case_finalized": True,
        "provenance_completeness": 0.95,
        "reviewer_count_norm": 0.8,
        "reviewer_agreement_ratio": 1.0,
        "source_diversity_norm": 0.7,
        "supporting_evidence_norm": 0.9,
        "contradiction_rate": 0.0,
        "entity_consistency": 0.95,
        "human_model_agreement": 0.9,
        "manual_verification_ratio": 1.0,
        "feedback_age_norm": 0.2,
        "cross_case_support_norm": 0.6,
        "data_quality_score": 0.92
    }

    # Hard Gate 1: reviewer_authorized == False -> REJECT
    f1 = dict(base_features, reviewer_authorized=False)
    r1 = feedback_gate_adapter.evaluate(f1)
    assert r1["decision"] == "REJECT"
    assert r1["gate_source"] == "HARD_RULES_OVERRIDE"
    assert "Reviewer is not authorized" in r1["reason"]

    # Hard Gate 2: evidence_integrity_verified == False -> REJECT
    f2 = dict(base_features, evidence_integrity_verified=False)
    r2 = feedback_gate_adapter.evaluate(f2)
    assert r2["decision"] == "REJECT"
    assert r2["gate_source"] == "HARD_RULES_OVERRIDE"
    assert "integrity" in r2["reason"].lower()

    # Hard Gate 3: audit_complete == False -> REQUIRES_REVIEW
    f3 = dict(base_features, audit_complete=False)
    r3 = feedback_gate_adapter.evaluate(f3)
    assert r3["decision"] == "REQUIRES_REVIEW"
    assert r3["gate_source"] == "HARD_RULES_OVERRIDE"
    assert "audit" in r3["reason"].lower()

    # Hard Gate 4: appeal_or_reopen_pending == True -> REQUIRES_REVIEW
    f4 = dict(base_features, appeal_or_reopen_pending=True)
    r4 = feedback_gate_adapter.evaluate(f4)
    assert r4["decision"] == "REQUIRES_REVIEW"
    assert r4["gate_source"] == "HARD_RULES_OVERRIDE"
    assert "appeal" in r4["reason"].lower()

    # Hard Gate 5: case_finalized == False -> REQUIRES_REVIEW
    f5 = dict(base_features, case_finalized=False)
    r5 = feedback_gate_adapter.evaluate(f5)
    assert r5["decision"] == "REQUIRES_REVIEW"
    assert r5["gate_source"] == "HARD_RULES_OVERRIDE"
    assert "closure" in r5["reason"].lower() or "final" in r5["reason"].lower()

    # All pass -> neural evaluation executes
    r_pass = feedback_gate_adapter.evaluate(base_features)
    assert r_pass["decision"] in ["APPROVE_CANDIDATE", "REQUIRES_REVIEW", "REJECT"]
    assert r_pass["gate_source"] in ["HARD_RULES_OVERRIDE", "NEURAL_GATE"]
    assert "advisory_warning" in r_pass
    assert "No automatic retraining" in r_pass["advisory_warning"]


@pytest.mark.asyncio
async def test_feedback_gate_governance_service(db_session):
    """Validates candidate enrollment and governance review lifecycle."""
    comp1 = Complaint(
        reference_number="CYBER-GOV-01",
        title="Gov Test 1",
        category="Financial Fraud",
        citizen_name="Test User",
        citizen_email="test@user.com",
        incident_date="2026-09-12 10:00 UTC",
        reported_date="2026-09-12 10:15 UTC",
        description="Test narrative 1"
    )
    db_session.add(comp1)
    await db_session.flush()

    case1 = Case(case_number="CASE-GOV-01", complaint_id=comp1.id, title="Gov Case 1", priority="MEDIUM")
    db_session.add(case1)
    await db_session.flush()

    # Enqueue a candidate with hard gate 1 triggered (unauthorized reviewer)
    cand_rejected = await feedback_gate_service.evaluate_and_enqueue_candidate(
        db=db_session,
        case_id=case1.id,
        target_model="incident_urgency",
        feature_dict={
            "reviewer_authorized": False,
            "evidence_integrity_verified": True,
            "audit_complete": True,
            "appeal_or_reopen_pending": False,
            "case_finalized": True,
            "data_quality_score": 0.9
        }
    )
    assert cand_rejected.decision == "REJECT"
    assert cand_rejected.gate_source == "HARD_RULES_OVERRIDE"
    assert cand_rejected.review_status == "REJECTED"

    # Enqueue a valid candidate
    comp2 = Complaint(
        reference_number="CYBER-GOV-02",
        title="Gov Test 2",
        category="Financial Fraud",
        citizen_name="Test User 2",
        citizen_email="test2@user.com",
        incident_date="2026-09-12 10:00 UTC",
        reported_date="2026-09-12 10:15 UTC",
        description="Test narrative 2"
    )
    db_session.add(comp2)
    await db_session.flush()

    case2 = Case(case_number="CASE-GOV-02", complaint_id=comp2.id, title="Gov Case 2", priority="HIGH")
    db_session.add(case2)
    await db_session.flush()

    cand_valid = await feedback_gate_service.evaluate_and_enqueue_candidate(
        db=db_session,
        case_id=case2.id,
        target_model="incident_urgency",
        feature_dict={
            "reviewer_authorized": True,
            "evidence_integrity_verified": True,
            "audit_complete": True,
            "appeal_or_reopen_pending": False,
            "case_finalized": True,
            "provenance_completeness": 0.95,
            "reviewer_count_norm": 0.8,
            "reviewer_agreement_ratio": 1.0,
            "source_diversity_norm": 0.7,
            "supporting_evidence_norm": 0.9,
            "contradiction_rate": 0.0,
            "entity_consistency": 0.95,
            "human_model_agreement": 0.9,
            "manual_verification_ratio": 1.0,
            "feedback_age_norm": 0.2,
            "cross_case_support_norm": 0.6,
            "data_quality_score": 0.95
        }
    )
    assert cand_valid.review_status == "PENDING"

    # Governance action: Approve candidate for dataset review
    approved = await feedback_gate_service.review_candidate(
        db=db_session,
        candidate_id=cand_valid.id,
        reviewer_id="user-aiml-lead-01",
        new_status="APPROVED_FOR_DATASET",
        notes="Approved for curated offline evaluation split only."
    )
    assert approved.review_status == "APPROVED_FOR_DATASET"
    assert approved.reviewed_by == "user-aiml-lead-01"
