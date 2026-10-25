import pytest
from app.ai.adapters.case_similarity import case_similarity_adapter
from app.ai.adapters.incident_urgency import incident_urgency_adapter
from app.ai.adapters.relation_extraction import relation_extraction_adapter
from app.ai.adapters.cross_case_correlation import cross_case_correlation_adapter
from app.ai.adapters.evidence_graph_link import evidence_graph_link_adapter
from app.ai.adapters.feedback_gate import feedback_gate_adapter


def test_case_similarity_adapter():
    assert case_similarity_adapter.is_available() in [True, False]
    # Test identical or very similar texts
    t1 = "Victim received fraudulent call regarding electricity power cutoff and paid 25000 INR on UPI."
    t2 = "Complainant was threatened with power disconnection by fake electricity board officer."
    res = case_similarity_adapter.score_text_pair(t1, t2)

    assert "similarity_score" in res
    assert 0.0 <= res["similarity_score"] <= 1.0
    assert "advisory_warning" in res
    assert "not establish a common offender" in res["advisory_warning"] or "does not establish" in res["advisory_warning"]


def test_incident_urgency_adapter():
    assert incident_urgency_adapter.is_available() in [True, False]
    text = "EMERGENCY: Immediate unauthorized wire transfer of 50 lakhs occurring right now! Victim is having a panic attack, suicide threat mentioned."
    res = incident_urgency_adapter.predict_urgency(text)

    assert res["urgency_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert res["advisory_only"] is True
    assert res["human_review_required"] is True
    assert "advisory_warning" in res


def test_relation_extraction_adapter():
    assert relation_extraction_adapter.is_available() in [True, False]
    text = "Rahul Sharma transferred rupees 50000 to fraud account scammer@oksbi on GooglePay."
    res = relation_extraction_adapter.predict_relation(
        text=text,
        entity_a="Rahul Sharma",
        entity_b="scammer@oksbi",
        entity_a_type="PERSON_NAME",
        entity_b_type="UPI_ID"
    )

    assert res["relation_type"] in relation_extraction_adapter.DEFAULT_RELATIONS or "USED_BY" in res["relation_type"] or "ASSOCIATED_WITH" in res["relation_type"]
    assert 0.0 <= res["confidence"] <= 1.0
    assert "advisory_warning" in res


def test_cross_case_correlation_adapter():
    assert cross_case_correlation_adapter.is_available() in [True, False]
    case_a = "Victim reported loss of 80000 via fake FedEx parcel customs scam."
    case_b = "Victim coerced into transferring funds for clearing illegal customs package."
    res = cross_case_correlation_adapter.predict_correlation(
        case_a_text=case_a,
        case_b_text=case_b,
        shared_features=["+919876543210", "fake-fedex.in"]
    )

    assert res["correlation_label"] in ["UNRELATED", "POSSIBLY_RELATED", "STRONGLY_RELATED"]
    assert "advisory_warning" in res
    assert "does not establish a common offender" in res["advisory_warning"] or "does not establish legal guilt" in res["advisory_warning"]


def test_evidence_graph_link_adapter():
    assert evidence_graph_link_adapter.is_available() in [True, False]
    # Test 80-dim feature vector
    vec = [0.1] * 80
    res = evidence_graph_link_adapter.predict_link(vec)
    assert res["prediction"] in ["NO_LINK", "CANDIDATE_LINK"]
    assert "confidence" in res
    assert "advisory_warning" in res


def test_feedback_gate_five_deterministic_hard_gates():
    assert feedback_gate_adapter.is_available() in [True, False]

    # Base valid feature snapshot
    base_valid = {
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
    feat_1 = dict(base_valid, reviewer_authorized=False)
    res_1 = feedback_gate_adapter.evaluate(feat_1)
    assert res_1["decision"] == "REJECT"
    assert res_1["gate_source"] == "HARD_RULES_OVERRIDE"
    assert "Reviewer is not authorized" in res_1["reason"]

    # Hard Gate 2: evidence_integrity_verified == False -> REJECT
    feat_2 = dict(base_valid, evidence_integrity_verified=False)
    res_2 = feedback_gate_adapter.evaluate(feat_2)
    assert res_2["decision"] == "REJECT"
    assert res_2["gate_source"] == "HARD_RULES_OVERRIDE"
    assert "Cryptographic evidence chain-of-custody" in res_2["reason"]

    # Hard Gate 3: audit_complete == False -> REQUIRES_REVIEW
    feat_3 = dict(base_valid, audit_complete=False)
    res_3 = feedback_gate_adapter.evaluate(feat_3)
    assert res_3["decision"] == "REQUIRES_REVIEW"
    assert res_3["gate_source"] == "HARD_RULES_OVERRIDE"
    assert "Case audit log has not been completed" in res_3["reason"]

    # Hard Gate 4: appeal_or_reopen_pending == True -> REQUIRES_REVIEW
    feat_4 = dict(base_valid, appeal_or_reopen_pending=True)
    res_4 = feedback_gate_adapter.evaluate(feat_4)
    assert res_4["decision"] == "REQUIRES_REVIEW"
    assert res_4["gate_source"] == "HARD_RULES_OVERRIDE"
    assert "Legal appeal or case reopening" in res_4["reason"]

    # Hard Gate 5: case_finalized == False -> REQUIRES_REVIEW
    feat_5 = dict(base_valid, case_finalized=False)
    res_5 = feedback_gate_adapter.evaluate(feat_5)
    assert res_5["decision"] == "REQUIRES_REVIEW"
    assert res_5["gate_source"] == "HARD_RULES_OVERRIDE"
    assert "Investigation has not reached final case closure" in res_5["reason"]

    # All Hard Gates Passed -> Neural Gate evaluated
    res_neural = feedback_gate_adapter.evaluate(base_valid)
    assert res_neural["gate_source"] in ["NEURAL_GATE", "DEGRADED_HEURISTIC_GATE"]
    assert res_neural["hard_gate_passed"] is True
    assert res_neural["decision"] in ["APPROVE_CANDIDATE", "REQUIRES_REVIEW", "REJECT"]
