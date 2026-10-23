import pytest
from unittest.mock import patch
from app.ai.extractors.hybrid_entity_extractor import HybridEntityExtractor
from app.ai.adapters.cyber_ner_transformer import CyberNERTransformer
from app.ai.adapters.case_similarity import CaseSimilarityAdapter
from app.ai.adapters.incident_urgency import IncidentUrgencyAdapter
from app.ai.adapters.relation_extraction import RelationExtractionAdapter
from app.ai.adapters.cross_case_correlation import CrossCaseCorrelationAdapter
from app.ai.adapters.evidence_graph_link import EvidenceGraphLinkAdapter
from app.ai.adapters.feedback_gate import FeedbackGateAdapter


def test_cyber_ner_rules_only_degraded_mode():
    """Validates that when transformer assets are unavailable, Cyber NER gracefully falls back to RULES_ONLY_DEGRADED."""
    with patch.object(CyberNERTransformer, "is_available", return_value=False):
        extractor = HybridEntityExtractor()
        assert extractor.mode == "RULES_ONLY_DEGRADED"
        assert extractor.is_transformer_available is False

        # Should still cleanly extract deterministic structured indicators
        sample_text = (
            "Complainant received scam call from phone +919876543210. "
            "Transferred Rs 50000 to UPI fraud@oksbi and visited phishing site https://fake-sbi-portal.com. "
            "Reported from IP 192.168.1.1."
        )
        entities = extractor.extract(sample_text)
        assert len(entities) >= 3

        types = [e.entity_type for e in entities]
        assert "PHONE_NUMBER" in types
        assert "UPI_ID" in types
        assert "URL" in types or "DOMAIN" in types

        # Check provenance truthfully marks DETERMINISTIC
        for e in entities:
            assert e.metadata["source"] == "DETERMINISTIC"


def test_feedback_gate_degraded_hard_gates_remain_active():
    """Validates that even if neural model weights are missing, deterministic hard gates still execute."""
    with patch.object(FeedbackGateAdapter, "_ensure_loaded", side_effect=FileNotFoundError("Mocked missing weights")):
        gate = FeedbackGateAdapter()
        # Hard gate 1: Unauthorized reviewer must still trigger REJECT without needing neural model
        res = gate.evaluate_candidate({
            "reviewer_authorized": False,
            "evidence_integrity_verified": True,
            "audit_complete": True,
            "appeal_or_reopen_pending": False,
            "case_finalized": True
        })
        assert res["decision"] == "REJECT"
        assert res["gate_source"] == "HARD_RULES_OVERRIDE"

        # Hard gate 2: Unverified evidence must still trigger REJECT
        res2 = gate.evaluate_candidate({
            "reviewer_authorized": True,
            "evidence_integrity_verified": False,
            "audit_complete": True,
            "appeal_or_reopen_pending": False,
            "case_finalized": True
        })
        assert res2["decision"] == "REJECT"
        assert res2["gate_source"] == "HARD_RULES_OVERRIDE"


def test_case_similarity_degraded_availability_check():
    """Validates truthful reporting of missing assets for case similarity."""
    with patch.object(CaseSimilarityAdapter, "is_available", return_value=False):
        adapter = CaseSimilarityAdapter()
        assert adapter.is_available() is False
        with pytest.raises(FileNotFoundError):
            adapter.score_text_pair("Text A", "Text B")


def test_incident_urgency_degraded_availability_check():
    """Validates truthful reporting of missing assets for incident urgency."""
    with patch.object(IncidentUrgencyAdapter, "is_available", return_value=False):
        adapter = IncidentUrgencyAdapter()
        assert adapter.is_available() is False
        with pytest.raises(FileNotFoundError):
            adapter.predict_urgency("Urgent text")


def test_relation_extraction_degraded_availability_check():
    """Validates truthful reporting of missing assets for relation extraction."""
    with patch.object(RelationExtractionAdapter, "is_available", return_value=False):
        adapter = RelationExtractionAdapter()
        assert adapter.is_available() is False
        with pytest.raises(FileNotFoundError):
            adapter.predict_relation("Text", "EntityA", "EntityB")


def test_cross_case_correlation_degraded_availability_check():
    """Validates truthful reporting of missing assets for cross-case correlation."""
    with patch.object(CrossCaseCorrelationAdapter, "is_available", return_value=False):
        adapter = CrossCaseCorrelationAdapter()
        assert adapter.is_available() is False
        with pytest.raises(FileNotFoundError):
            adapter.predict_correlation("Text A", "Text B", [])


def test_evidence_graph_link_degraded_availability_check():
    """Validates truthful reporting of missing assets for evidence graph link."""
    with patch.object(EvidenceGraphLinkAdapter, "is_available", return_value=False):
        adapter = EvidenceGraphLinkAdapter()
        assert adapter.is_available() is False
        with pytest.raises(FileNotFoundError):
            adapter.predict_link([0.1] * 80)
