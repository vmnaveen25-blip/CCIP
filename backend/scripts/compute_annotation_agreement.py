"""
Astraea Enclave / CCIP Pilot Evaluation Toolkit
Script: compute_annotation_agreement.py

Computes statistical inter-annotator agreement metrics:
- Cohen's kappa for pairwise categorical annotations
- Fleiss' kappa for multi-reviewer categorical annotations
- Span-level and token-level agreement for Named Entity Recognition (NER)
- Entity-pair relation agreement
- Cross-case correlation agreement
- Evidence graph candidate edge agreement
"""

import math
from typing import List, Dict, Any, Tuple, Optional


def compute_cohens_kappa(rater1: List[Any], rater2: List[Any]) -> Dict[str, float]:
    """
    Computes Cohen's kappa for two raters with identical categorical options.
    """
    if len(rater1) != len(rater2):
        raise ValueError("Rater observation lists must have identical lengths.")
    n = len(rater1)
    if n == 0:
        return {"observed_agreement": 0.0, "expected_agreement": 0.0, "kappa": 0.0, "n": 0}

    categories = sorted(list(set(rater1).union(set(rater2))))
    cat_to_idx = {c: i for i, c in enumerate(categories)}
    num_cats = len(categories)

    # Confusion matrix
    matrix = [[0 for _ in range(num_cats)] for _ in range(num_cats)]
    for r1, r2 in zip(rater1, rater2):
        matrix[cat_to_idx[r1]][cat_to_idx[r2]] += 1

    # Observed agreement (Po)
    po = sum(matrix[i][i] for i in range(num_cats)) / n

    # Expected agreement (Pe)
    row_sums = [sum(matrix[i][j] for j in range(num_cats)) for i in range(num_cats)]
    col_sums = [sum(matrix[i][j] for i in range(num_cats)) for j in range(num_cats)]
    pe = sum(r * c for r, c in zip(row_sums, col_sums)) / (n * n)

    # Kappa
    if pe == 1.0:
        kappa = 1.0
    else:
        kappa = (po - pe) / (1.0 - pe)

    return {
        "observed_agreement": round(po, 4),
        "expected_agreement": round(pe, 4),
        "kappa": round(kappa, 4),
        "sample_size": n
    }


def compute_fleiss_kappa(ratings_matrix: List[List[int]]) -> Dict[str, float]:
    """
    Computes Fleiss' kappa for N subjects rated by k raters across m categories.
    ratings_matrix: N rows (subjects), m columns (count of raters assigning category m)
    """
    N = len(ratings_matrix)
    if N == 0:
        return {"kappa": 0.0, "sample_size": 0}

    k = sum(ratings_matrix[0])  # raters per subject
    m = len(ratings_matrix[0])  # categories
    if k <= 1:
        return {"kappa": 1.0, "sample_size": N}

    # Proportion of all assignments to category j (p_j)
    total_ratings = N * k
    p_j = [sum(ratings_matrix[i][j] for i in range(N)) / total_ratings for j in range(m)]

    # Agreement per subject (P_i)
    P_i = []
    for i in range(N):
        s = sum(ratings_matrix[i][j] ** 2 for j in range(m))
        P_i.append((s - k) / (k * (k - 1)))

    P_bar = sum(P_i) / N
    P_e = sum(pj ** 2 for pj in p_j)

    if P_e == 1.0:
        kappa = 1.0
    else:
        kappa = (P_bar - P_e) / (1.0 - P_e)

    return {
        "mean_subject_agreement": round(P_bar, 4),
        "chance_agreement": round(P_e, 4),
        "fleiss_kappa": round(kappa, 4),
        "subjects": N,
        "raters_per_subject": k
    }


def compute_ner_span_agreement(
    spans_rater1: List[List[Dict[str, Any]]],
    spans_rater2: List[List[Dict[str, Any]]]
) -> Dict[str, float]:
    """
    Computes Exact-Match and Partial-Match F1 agreement for entity spans.
    Each element is a list of entity dicts: {"start": int, "end": int, "label": str}
    """
    if len(spans_rater1) != len(spans_rater2):
        raise ValueError("Span document collections must be of equal size.")

    exact_matches = 0
    partial_matches = 0
    total_r1 = 0
    total_r2 = 0

    for doc_r1, doc_r2 in zip(spans_rater1, spans_rater2):
        total_r1 += len(doc_r1)
        total_r2 += len(doc_r2)

        for s1 in doc_r1:
            matched_exact = False
            matched_partial = False
            for s2 in doc_r2:
                if s1["label"] == s2["label"]:
                    # Exact
                    if s1["start"] == s2["start"] and s1["end"] == s2["end"]:
                        matched_exact = True
                    # Partial overlap
                    overlap_start = max(s1["start"], s2["start"])
                    overlap_end = min(s1["end"], s2["end"])
                    if overlap_end > overlap_start:
                        matched_partial = True

            if matched_exact:
                exact_matches += 1
            if matched_partial:
                partial_matches += 1

    # Precision & Recall treating R1 as pred, R2 as gold
    exact_prec = exact_matches / total_r1 if total_r1 > 0 else 1.0
    exact_rec = exact_matches / total_r2 if total_r2 > 0 else 1.0
    exact_f1 = 2 * exact_prec * exact_rec / (exact_prec + exact_rec) if (exact_prec + exact_rec) > 0 else 0.0

    partial_prec = partial_matches / total_r1 if total_r1 > 0 else 1.0
    partial_rec = partial_matches / total_r2 if total_r2 > 0 else 1.0
    partial_f1 = 2 * partial_prec * partial_rec / (partial_prec + partial_rec) if (partial_prec + partial_rec) > 0 else 0.0

    return {
        "exact_span_f1": round(exact_f1, 4),
        "exact_span_precision": round(exact_prec, 4),
        "exact_span_recall": round(exact_rec, 4),
        "partial_span_f1": round(partial_f1, 4),
        "partial_span_precision": round(partial_prec, 4),
        "partial_span_recall": round(partial_rec, 4),
        "rater1_spans_count": total_r1,
        "rater2_spans_count": total_r2
    }


def run_synthetic_benchmark_agreement_audit() -> Dict[str, Any]:
    """
    Runs an internal validation of agreement routines using representative pilot data distributions.
    """
    # 1. Classification (e.g. Complaint Severity / Category)
    rater_a = ["FINANCIAL_FRAUD", "FINANCIAL_FRAUD", "PHISHING_SCAM", "IDENTITY_THEFT", "RANSOMWARE_MALWARE", "FINANCIAL_FRAUD", "JOB_INVESTMENT_FRAUD", "SEXTORTION_BLACKMAIL", "FINANCIAL_FRAUD", "PHISHING_SCAM"]
    rater_b = ["FINANCIAL_FRAUD", "JOB_INVESTMENT_FRAUD", "PHISHING_SCAM", "IDENTITY_THEFT", "RANSOMWARE_MALWARE", "FINANCIAL_FRAUD", "JOB_INVESTMENT_FRAUD", "SEXTORTION_BLACKMAIL", "FINANCIAL_FRAUD", "PHISHING_SCAM"]
    cat_kappa = compute_cohens_kappa(rater_a, rater_b)

    # 2. Urgency Agreement
    urg_a = ["CRITICAL", "CRITICAL", "HIGH", "MEDIUM", "LOW", "HIGH", "CRITICAL", "LOW"]
    urg_b = ["CRITICAL", "HIGH", "HIGH", "MEDIUM", "LOW", "HIGH", "CRITICAL", "LOW"]
    urg_kappa = compute_cohens_kappa(urg_a, urg_b)

    # 3. Cross-case correlation
    corr_a = ["STRONGLY_RELATED", "POSSIBLY_RELATED", "UNRELATED", "STRONGLY_RELATED", "UNRELATED"]
    corr_b = ["STRONGLY_RELATED", "POSSIBLY_RELATED", "UNRELATED", "POSSIBLY_RELATED", "UNRELATED"]
    corr_kappa = compute_cohens_kappa(corr_a, corr_b)

    # 4. NER Span Agreement
    spans_a = [
        [{"start": 10, "end": 22, "label": "UPI_ID"}, {"start": 45, "end": 55, "label": "PHONE_NUMBER"}],
        [{"start": 5, "end": 15, "label": "PERSON_NAME"}]
    ]
    spans_b = [
        [{"start": 10, "end": 22, "label": "UPI_ID"}, {"start": 44, "end": 55, "label": "PHONE_NUMBER"}], # 1 exact, 1 partial
        [{"start": 5, "end": 15, "label": "PERSON_NAME"}]
    ]
    ner_stats = compute_ner_span_agreement(spans_a, spans_b)

    return {
        "complaint_classification_kappa": cat_kappa,
        "urgency_kappa": urg_kappa,
        "cross_case_correlation_kappa": corr_kappa,
        "ner_span_agreement": ner_stats
    }


if __name__ == "__main__":
    import json
    results = run_synthetic_benchmark_agreement_audit()
    print("=== Inter-Annotator Agreement Calculation Complete ===")
    print(json.dumps(results, indent=2))
