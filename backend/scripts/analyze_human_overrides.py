"""
Astraea Enclave / CCIP Pilot Evaluation Toolkit
Script: analyze_human_overrides.py

Analyzes human investigator overrides recorded in `PilotHumanReview`:
- Overall and per-model override rates (Disagreements with AI predictions)
- Per-class override vulnerability
- High-confidence model errors (confidence > 0.85 but overturned by human)
- Low-confidence human overrides (confidence < 0.60 overturned)
- Error category taxonomy correlation
"""

from typing import List, Dict, Any
from collections import defaultdict


def analyze_override_records(
    predictions: List[Dict[str, Any]],
    reviews: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Computes statistical human override analytics across matched pilot prediction/review pairs.
    """
    # Index reviews by prediction_id
    reviews_by_pid = {r["prediction_id"]: r for r in reviews}

    total_reviewed = len(reviews)
    if total_reviewed == 0:
        return {
            "total_reviews": 0,
            "overall_override_rate_pct": 0.0,
            "model_breakdown": {},
            "status": "NO_REVIEW_DATA"
        }

    total_agreed = 0
    total_overridden = 0
    total_unsure = 0

    model_stats = defaultdict(lambda: {"total": 0, "agreed": 0, "overridden": 0, "unsure": 0, "high_conf_errors": 0, "low_conf_overrides": 0})
    task_stats = defaultdict(lambda: {"total": 0, "overridden": 0})
    override_reason_cats = defaultdict(int)

    for pred in predictions:
        pid = pred["id"]
        if pid not in reviews_by_pid:
            continue

        rev = reviews_by_pid[pid]
        decision = rev.get("decision", "UNSURE")
        model = pred.get("model_name", "unknown")
        task = pred.get("task", "unknown")
        conf_dict = pred.get("confidence_json", {})
        conf = conf_dict.get("confidence") or conf_dict.get("top_score") or conf_dict.get("overall_confidence") or 0.5

        m_entry = model_stats[model]
        m_entry["total"] += 1
        task_stats[task]["total"] += 1

        if decision == "AGREE":
            total_agreed += 1
            m_entry["agreed"] += 1
        elif decision == "DISAGREE":
            total_overridden += 1
            m_entry["overridden"] += 1
            task_stats[task]["overridden"] += 1

            # High confidence error
            if conf >= 0.85:
                m_entry["high_conf_errors"] += 1
                override_reason_cats["HIGH_CONFIDENCE_FALSE_ALARM"] += 1
            elif conf < 0.60:
                m_entry["low_conf_overrides"] += 1
                override_reason_cats["MARGINAL_CONFIDENCE_ATTENUATION"] += 1
            else:
                override_reason_cats["STANDARD_DISAGREEMENT"] += 1

            if rev.get("notes_redacted"):
                note = rev.get("notes_redacted", "").lower()
                if "boundary" in note or "span" in note:
                    override_reason_cats["ENTITY_BOUNDARY_CORRECTION"] += 1
                elif "hinglish" in note or "language" in note:
                    override_reason_cats["LINGUISTIC_CODE_MIX_ERROR"] += 1
        else:
            total_unsure += 1
            m_entry["unsure"] += 1

    overall_override_rate = round((total_overridden / total_reviewed) * 100, 2)
    overall_agreement_rate = round((total_agreed / total_reviewed) * 100, 2)

    model_summary = {}
    for m, s in model_stats.items():
        override_pct = round((s["overridden"] / s["total"] * 100), 2) if s["total"] > 0 else 0.0
        model_summary[m] = {
            "total_reviews": s["total"],
            "agreed": s["agreed"],
            "overridden": s["overridden"],
            "unsure": s["unsure"],
            "override_rate_pct": override_pct,
            "high_conf_errors": s["high_conf_errors"],
            "low_conf_overrides": s["low_conf_overrides"]
        }

    task_summary = {}
    for t, s in task_stats.items():
        task_summary[t] = {
            "total_reviews": s["total"],
            "overridden": s["overridden"],
            "override_rate_pct": round((s["overridden"] / s["total"] * 100), 2) if s["total"] > 0 else 0.0
        }

    return {
        "total_reviews_analyzed": total_reviewed,
        "overall_agreement_rate_pct": overall_agreement_rate,
        "overall_override_rate_pct": overall_override_rate,
        "total_agreed": total_agreed,
        "total_overridden": total_overridden,
        "total_unsure": total_unsure,
        "per_model_analytics": model_summary,
        "per_task_analytics": task_summary,
        "override_reasons_distribution": dict(override_reason_cats)
    }


def run_benchmark_override_audit():
    """Demonstration run for override analysis."""
    preds = [
        {"id": "p1", "model_name": "ccip-cyber-ner-deberta-v3-base", "task": "CYBER_NER", "confidence_json": {"overall_confidence": 0.88}},
        {"id": "p2", "model_name": "ccip-cyber-ner-deberta-v3-base", "task": "CYBER_NER", "confidence_json": {"overall_confidence": 0.52}},
        {"id": "p3", "model_name": "ccip-complaint-classifier-deberta-v3-base", "task": "COMPLAINT_CLASSIFIER", "confidence_json": {"confidence": 0.94}},
        {"id": "p4", "model_name": "ccip-incident-urgency-distilroberta", "task": "INCIDENT_URGENCY", "confidence_json": {"confidence": 0.91}},
        {"id": "p5", "model_name": "ccip-url-phishing-xgboost", "task": "URL_PHISHING", "confidence_json": {"confidence": 0.99}},
    ]
    revs = [
        {"prediction_id": "p1", "decision": "DISAGREE", "correct": False, "notes_redacted": "Entity boundary missed IFSC prefix"},
        {"prediction_id": "p2", "decision": "DISAGREE", "correct": False, "notes_redacted": "Hinglish transliteration missed"},
        {"prediction_id": "p3", "decision": "AGREE", "correct": True},
        {"prediction_id": "p4", "decision": "AGREE", "correct": True},
        {"prediction_id": "p5", "decision": "AGREE", "correct": True},
    ]
    analytics = analyze_override_records(preds, revs)
    return analytics


if __name__ == "__main__":
    import json
    res = run_benchmark_override_audit()
    print("=== Human Override Analytics Report ===")
    print(json.dumps(res, indent=2))
