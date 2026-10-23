"""
Phase M Annotation Workflow & Agreement Tests
Validates inter-annotator agreement metrics:
- Cohen's Kappa calculation
- Fleiss' Kappa multi-annotator calculation
- Exact and partial span F1 matching
"""

import pytest
from scripts.compute_annotation_agreement import (
    compute_cohens_kappa,
    compute_fleiss_kappa,
    compute_ner_span_agreement
)


def test_cohens_kappa_perfect_agreement():
    r1 = ["PHISHING", "UPI_FRAUD", "CRYPTO_SCAM", "PHISHING"]
    r2 = ["PHISHING", "UPI_FRAUD", "CRYPTO_SCAM", "PHISHING"]
    res = compute_cohens_kappa(r1, r2)
    assert res["observed_agreement"] == 1.0
    assert res["kappa"] == 1.0


def test_cohens_kappa_moderate_agreement():
    r1 = ["PHISHING", "UPI_FRAUD", "CRYPTO_SCAM", "PHISHING", "MALWARE"]
    r2 = ["PHISHING", "PHISHING", "CRYPTO_SCAM", "PHISHING", "PHISHING"]
    res = compute_cohens_kappa(r1, r2)
    assert 0.0 < res["kappa"] < 1.0
    assert res["sample_size"] == 5


def test_fleiss_kappa_calculation():
    matrix = [
        [3, 0],
        [0, 3],
        [2, 1]
    ]
    res = compute_fleiss_kappa(matrix)
    assert res["subjects"] == 3
    assert res["raters_per_subject"] == 3
    assert res["fleiss_kappa"] > 0.5


def test_ner_span_agreement_exact_and_partial():
    doc1 = [
        [
            {"start": 10, "end": 22, "label": "PHONE_NUMBER"},
            {"start": 30, "end": 45, "label": "UPI_ID"}
        ]
    ]
    doc2_exact = [
        [
            {"start": 10, "end": 22, "label": "PHONE_NUMBER"},
            {"start": 30, "end": 45, "label": "UPI_ID"}
        ]
    ]
    res_exact = compute_ner_span_agreement(doc1, doc2_exact)
    assert res_exact["exact_span_f1"] == 1.0
    assert res_exact["partial_span_f1"] == 1.0

    # Partial overlap
    doc2_partial = [
        [
            {"start": 12, "end": 22, "label": "PHONE_NUMBER"},
            {"start": 30, "end": 45, "label": "UPI_ID"}
        ]
    ]
    res_partial = compute_ner_span_agreement(doc1, doc2_partial)
    assert res_partial["exact_span_f1"] < 1.0
    assert res_partial["partial_span_f1"] == 1.0

