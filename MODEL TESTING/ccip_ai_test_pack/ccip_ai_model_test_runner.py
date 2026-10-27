#!/usr/bin/env python3
"""CCIP AI Model API test runner.

Uses only Python standard library. Writes a privacy-conscious CSV and JSON report.
It does not store raw request content, full response bodies, tokens, complaint text,
case narratives, or extracted entity values. Run against local/staging CCIP only.
"""
from __future__ import annotations
import argparse
import csv
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BASE_URL = os.getenv("CCIP_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
TOKEN = os.getenv("CCIP_BEARER_TOKEN", "").strip()
CASE_ID = os.getenv("CCIP_TEST_CASE_ID", "").strip()
COMPLAINT_ID = os.getenv("CCIP_TEST_COMPLAINT_ID", "").strip()
EVIDENCE_ID = os.getenv("CCIP_TEST_EVIDENCE_ID", "").strip()

FIELDS = [
    "run_timestamp_utc", "test_id", "component", "condition", "method", "endpoint",
    "http_status", "test_status", "runtime_status", "model_name", "available",
    "model_available", "fallback_mode", "prediction_or_decision", "confidence_values_json",
    "threshold_values_json", "similarity_score_values_json", "probabilities_json",
    "latency_ms", "notes", "response_shape_summary"
]

# Synthetic examples only. Never replace these with real citizen/suspect data.
EMAIL_CASES = [
    ("EMAIL-POS", "phishing-like", {"text": "Urgent: your bank account is suspended. Verify your password at https://secure-bank-login.example.com immediately."}),
    ("EMAIL-NEG", "benign", {"text": "Hello, the weekly team meeting is scheduled for Tuesday at 10 AM. Please review the attached agenda."}),
    ("EMAIL-AMB", "ambiguous", {"text": "Your invoice is ready. Please review the attached invoice and contact support if you have questions."}),
    ("EMAIL-EMPTY", "invalid-empty", {"text": ""}),
]
SMS_CASES = [
    ("SMS-POS", "smishing-like", {"text": "Your bank account will be blocked today. Share the OTP now at https://bank-verify.example.com."}),
    ("SMS-NEG", "benign", {"text": "Your parcel has been delivered. Thank you for using our service."}),
    ("SMS-AMB", "ambiguous", {"text": "Hi, please call me when you are available."}),
    ("SMS-EMPTY", "invalid-empty", {"text": ""}),
]
URL_CASES = [
    ("URL-POS", "suspicious-lookalike", {"url": "https://secure-paypal-login.example.com/verify/account"}),
    ("URL-NEG", "benign-example-domain", {"url": "https://example.com/"}),
    ("URL-IP", "ip-address-host", {"url": "http://192.0.2.10/login"}),
    ("URL-INVALID", "invalid-url", {"url": "not a url"}),
]
COMPLAINT_CASES = [
    ("COMP-POS", "cybercrime-upi-fraud", {"text": "I received a fake bank support call and transferred INR 25000 to fraudster@oksbi. UTR number 123456789012."}),
    ("COMP-NEG", "benign-control", {"text": "I want to ask about the opening hours of the public library this weekend."}),
    ("COMP-AMB", "ambiguous", {"text": "I received a message about a payment but I am not sure whether it is genuine."}),
    ("COMP-EMPTY", "invalid-empty", {"text": ""}),
]
ENTITY_TEXT = (
    "Synthetic test only: suspicious URL https://secure-bank-login.example.com/path; "
    "contact test.user@example.com; IP 192.0.2.44; UPI fraud@oksbi; "
    "transaction UTR number 123456789012; alleged loss INR 25000."
)


def walk(obj: Any, out: dict[str, list[Any] | Any]) -> None:
    """Collect schema/status fields while deliberately not saving arbitrary text."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            kl = k.lower()
            if kl in {"status", "state", "mode", "model_name", "model", "architecture", "available", "files_available", "loaded", "model_available", "fallback_mode", "threshold", "confidence", "confidencescore", "confidence_score", "probability", "similarity_score", "prediction", "urgency_level", "correlation_label", "decision", "is_cybercrime", "transformer_available", "count", "matches_found", "total_scanned", "is_candidate_match", "error", "code", "message_type"}:
                out.setdefault(kl, []).append(v)
            if kl in {"probabilities", "prediction_probabilities"} and isinstance(v, (dict, list)):
                out.setdefault("probabilities", []).append(v)
            # Avoid storing raw field values or narrative/text fields. Traverse nested model structures only.
            if isinstance(v, (dict, list)):
                walk(v, out)
    elif isinstance(obj, list):
        for item in obj:
            if isinstance(item, (dict, list)):
                walk(item, out)


def unique_json(values: list[Any]) -> str:
    if not values:
        return ""
    # preserve order, but avoid duplicate values from nested traversals
    cleaned = []
    for v in values:
        if v not in cleaned:
            cleaned.append(v)
    return json.dumps(cleaned, ensure_ascii=False, separators=(",", ":"))


def summarize_response(data: Any) -> tuple[dict[str, Any], str]:
    collected: dict[str, Any] = {}
    walk(data, collected)
    mapping = {
        "runtime_status": "status",
        "model_name": "model_name",
        "available": "available",
        "model_available": "model_available",
        "fallback_mode": "fallback_mode",
        "prediction_or_decision": "prediction",
        "confidence_values_json": "confidence",
        "threshold_values_json": "threshold",
        "similarity_score_values_json": "similarity_score",
        "probabilities_json": "probabilities",
    }
    row: dict[str, Any] = {}
    for dest, src in mapping.items():
        vals = collected.get(src, [])
        if dest in {"runtime_status", "model_name", "available", "model_available", "fallback_mode", "prediction_or_decision"}:
            if vals:
                row[dest] = str(vals[0]) if dest not in {"available", "model_available", "fallback_mode"} else str(vals[0]).lower()
        elif vals:
            row[dest] = unique_json(vals)
    shape = []
    if isinstance(data, dict):
        shape = sorted(list(data.keys()))
        if isinstance(data.get("models"), dict):
            row["response_shape_summary"] = "top-level keys=" + ",".join(shape) + "; models=" + ",".join(sorted(data["models"].keys()))
        elif isinstance(data.get("entities"), list):
            types = sorted({str(x.get("entity_type", "")) for x in data["entities"] if isinstance(x, dict)})
            row["response_shape_summary"] = "top-level keys=" + ",".join(shape) + "; entity_types=" + ",".join(types) + f"; entity_count={len(data['entities'])}"
        elif isinstance(data.get("similar_cases"), list):
            row["response_shape_summary"] = "top-level keys=" + ",".join(shape) + f"; similarity_result_count={len(data['similar_cases'])}"
        elif isinstance(data.get("relations"), list):
            row["response_shape_summary"] = "top-level keys=" + ",".join(shape) + f"; relation_count={len(data['relations'])}"
        else:
            row["response_shape_summary"] = "top-level keys=" + ",".join(shape)
    elif isinstance(data, list):
        row["response_shape_summary"] = f"array length={len(data)}"
    else:
        row["response_shape_summary"] = type(data).__name__
    return row, row.get("response_shape_summary", "")


def determine_status(http_status: int | None, data: Any, error: str = "") -> tuple[str, str]:
    if http_status is None:
        return "UNREACHABLE", error or "No HTTP response"
    if http_status in (401, 403):
        return "AUTH_REQUIRED_OR_FORBIDDEN", error or f"HTTP {http_status}; check staff token/role"
    if http_status >= 500:
        return "FAIL_HTTP_5XX", error or f"HTTP {http_status}"
    if http_status >= 400:
        return "INPUT_OR_ROUTE_ERROR", error or f"HTTP {http_status}"
    vals: dict[str, Any] = {}
    walk(data, vals)
    statuses = [str(x).upper() for x in vals.get("status", [])]
    available = [str(x).lower() for x in vals.get("available", []) + vals.get("files_available", [])]
    fallbacks = [str(x).lower() for x in vals.get("fallback_mode", [])]
    flat = " ".join(statuses)
    if any(s in flat for s in ["MODEL_NOT_DEPLOYED", "UNAVAILABLE", "AI_ASSISTANT_UNAVAILABLE", "RUNTIME_DEPENDENCY_MISSING", "LOAD_FAILED"]):
        return "BLOCKED_OR_UNAVAILABLE", "Endpoint responded, but model/runtime reports unavailable"
    if "true" in fallbacks or "false" in available or any("RULES_ONLY_DEGRADED" in s for s in statuses):
        return "RESPONDED_DEGRADED_FALLBACK", "A fallback/rules-only mode is active; do not label this neural inference"
    if isinstance(data, dict) and data.get("error"):
        return "FAIL_APPLICATION_ERROR", str(data.get("error"))[:160]
    if not isinstance(data, (dict, list)):
        return "RESPONDED_UNCLASSIFIED", "HTTP success; response type needs inspection"
    return "RESPONDED_NEEDS_LABEL_CHECK", "Validate prediction against labelled fixture; HTTP success alone is not model accuracy"


def api_call(test_id: str, component: str, condition: str, method: str, endpoint: str,
             payload: Any = None, token_required: bool = False, timeout: float = 30.0,
             skip_reason: str = "") -> dict[str, Any]:
    ts = datetime.now(timezone.utc).isoformat()
    base = {
        "run_timestamp_utc": ts, "test_id": test_id, "component": component,
        "condition": condition, "method": method, "endpoint": endpoint,
        "http_status": "", "test_status": "", "runtime_status": "", "model_name": "",
        "available": "", "model_available": "", "fallback_mode": "",
        "prediction_or_decision": "", "confidence_values_json": "", "threshold_values_json": "",
        "similarity_score_values_json": "", "probabilities_json": "", "latency_ms": "",
        "notes": "", "response_shape_summary": ""
    }
    if skip_reason:
        base["test_status"] = "SKIPPED"
        base["notes"] = skip_reason
        return base
    if token_required and not TOKEN:
        base["test_status"] = "SKIPPED"
        base["notes"] = "Set CCIP_BEARER_TOKEN to a valid test/staff token"
        return base
    headers = {"Accept": "application/json"}
    if payload is not None:
        headers["Content-Type"] = "application/json"
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    req = urllib.request.Request(BASE_URL + endpoint, data=(json.dumps(payload).encode("utf-8") if payload is not None else None), headers=headers, method=method.upper())
    start = time.perf_counter()
    data: Any = None
    http_status = None
    error = ""
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            http_status = resp.status
            body = resp.read()
            try:
                data = json.loads(body.decode("utf-8")) if body else {}
            except Exception:
                # For SSE or plain-text endpoints, retain only a safe response descriptor.
                data = {"response_type": resp.headers.get("Content-Type", "non-json"), "body_length": len(body)}
    except urllib.error.HTTPError as e:
        http_status = e.code
        body = e.read()
        try:
            parsed = json.loads(body.decode("utf-8")) if body else {}
            data = parsed
            error = str(parsed.get("detail") or parsed.get("message") or parsed.get("error") or f"HTTP {e.code}")[:180] if isinstance(parsed, dict) else f"HTTP {e.code}"
        except Exception:
            error = f"HTTP {e.code}; non-JSON error body"
            data = {}
    except Exception as e:
        error = f"{type(e).__name__}: {e}"[:180]
    elapsed = round((time.perf_counter() - start) * 1000, 2)
    base["http_status"] = http_status if http_status is not None else ""
    base["latency_ms"] = elapsed
    if http_status is not None:
        summary, _ = summarize_response(data)
        base.update(summary)
        outcome, note = determine_status(http_status, data, error)
        base["test_status"] = outcome
        base["notes"] = note
    else:
        base["test_status"] = "UNREACHABLE"
        base["notes"] = error or "No response"
    return base


def main() -> int:
    global BASE_URL, CASE_ID, COMPLAINT_ID, EVIDENCE_ID
    parser = argparse.ArgumentParser(description="Run CCIP AI model status and inference smoke tests against local/staging API.")
    parser.add_argument("--base-url", default=BASE_URL, help="Base URL, e.g. http://127.0.0.1:8000")
    parser.add_argument("--out-dir", default="ccip_ai_test_results", help="Output directory for CSV/JSON reports")
    parser.add_argument("--case-id", default=CASE_ID, help="Existing synthetic test case ID (enables case model tests)")
    parser.add_argument("--complaint-id", default=COMPLAINT_ID, help="Existing synthetic test complaint ID (enables relation tests)")
    parser.add_argument("--evidence-id", default=EVIDENCE_ID, help="Existing synthetic evidence ID (optional processing test)")
    parser.add_argument("--include-mutating", action="store_true", help="Allow tests that write candidate/relation/evidence records; use STAGING ONLY")
    args = parser.parse_args()
    BASE_URL = args.base_url.rstrip("/")
    CASE_ID, COMPLAINT_ID, EVIDENCE_ID = args.case_id.strip(), args.complaint_id.strip(), args.evidence_id.strip()
    if not BASE_URL.startswith(("http://", "https://")):
        print("ERROR: --base-url must begin with http:// or https://", file=sys.stderr)
        return 2

    rows: list[dict[str, Any]] = []
    # Model inventory: record each model separately, so an unavailable model is not hidden
    # by an overall top-level status such as "healthy".
    inv_row = api_call("STAT-001", "Model Manager", "inventory/status", "GET", "/api/v1/ai/models/status")
    rows.append(inv_row)
    try:
        inv_req = urllib.request.Request(BASE_URL + "/api/v1/ai/models/status", headers={"Accept": "application/json"}, method="GET")
        with urllib.request.urlopen(inv_req, timeout=20.0) as resp:
            inv_data = json.loads(resp.read().decode("utf-8"))
        models = inv_data.get("models", {}) if isinstance(inv_data, dict) else {}
        for model_key, model_info in models.items():
            if not isinstance(model_info, dict):
                continue
            loaded = model_info.get("loaded", "")
            model_status = model_info.get("status", model_info.get("state", "UNKNOWN"))
            avail = model_info.get("available", model_info.get("files_available", ""))
            status_upper = str(model_status).upper()
            if status_upper in {"UNAVAILABLE", "MODEL_NOT_DEPLOYED", "FAILED", "LOAD_FAILED"} or avail is False:
                outcome = "BLOCKED_OR_UNAVAILABLE"
            elif model_info.get("metrics_source") == "NOT_EVALUATED":
                outcome = "ASSET_STATUS_REPORTED_METRICS_NOT_EVALUATED"
            else:
                outcome = "STATUS_REPORTED_NEEDS_INFERENCE_CHECK"
            rows.append({
                "run_timestamp_utc": datetime.now(timezone.utc).isoformat(),
                "test_id": "INV-" + str(model_key).upper().replace("-", "_"),
                "component": str(model_key), "condition": "runtime model inventory", "method": "GET",
                "endpoint": "/api/v1/ai/models/status", "http_status": 200, "test_status": outcome,
                "runtime_status": model_status, "model_name": model_info.get("architecture", model_key),
                "available": avail, "model_available": avail, "fallback_mode": "", "prediction_or_decision": "",
                "confidence_values_json": "", "threshold_values_json": json.dumps(model_info.get("threshold", "")),
                "similarity_score_values_json": "", "probabilities_json": "", "latency_ms": "",
                "notes": "loaded=" + str(loaded) + "; metrics_source=" + str(model_info.get("metrics_source", "not supplied")) +
                         "; precision=" + str(model_info.get("precision", "")) + "; recall=" + str(model_info.get("recall", "")) +
                         "; f1=" + str(model_info.get("f1_score", "")) + "; accuracy=" + str(model_info.get("accuracy", "")),
                "response_shape_summary": "per-model status record"
            })
    except Exception as e:
        rows.append({"run_timestamp_utc": datetime.now(timezone.utc).isoformat(), "test_id": "INV-ERROR", "component": "Model inventory", "condition": "inventory parsing", "method": "GET", "endpoint": "/api/v1/ai/models/status", "http_status": "", "test_status": "INVENTORY_FETCH_FAILED", "runtime_status": "", "model_name": "", "available": "", "model_available": "", "fallback_mode": "", "prediction_or_decision": "", "confidence_values_json": "", "threshold_values_json": "", "similarity_score_values_json": "", "probabilities_json": "", "latency_ms": "", "notes": f"{type(e).__name__}: {e}"[:180], "response_shape_summary": ""})
    # Main model endpoints: positive, negative, ambiguous and invalid-input conditions.
    for test_id, condition, payload in EMAIL_CASES:
        rows.append(api_call(test_id, "Email Threat / DistilBERT", condition, "POST", "/api/v1/ai/test/email", payload))
    for test_id, condition, payload in SMS_CASES:
        rows.append(api_call(test_id, "SMS Spam / DistilBERT", condition, "POST", "/api/v1/ai/test/sms", payload))
    for test_id, condition, payload in URL_CASES:
        rows.append(api_call(test_id, "URL Phishing / XGBoost", condition, "POST", "/api/v1/ai/test/url", payload))
    for test_id, condition, payload in COMPLAINT_CASES:
        rows.append(api_call(test_id, "Complaint Classification / DeBERTa", condition, "POST", "/api/v1/ai/test/complaint", payload))

    # Public citizen assistance routes are routed by modality and may call the above classifiers.
    citizen_cases = [
        ("CITIZEN-URL", "url", "https://secure-paypal-login.example.com/verify/account"),
        ("CITIZEN-SMS", "sms", "Your bank account will be blocked. Share OTP at https://bank-verify.example.com."),
        ("CITIZEN-EMAIL", "email", "Urgent bank verification required. Open https://secure-bank-login.example.com."),
        ("CITIZEN-HELP", "portal_help", "How do I file and track a cybercrime complaint?"),
    ]
    for tid, modality, content in citizen_cases:
        rows.append(api_call(tid, "Citizen Assistant / Router", modality, "POST", "/api/v1/ai/citizen/assist", {"content": content, "query_type": modality}))

    # Hybrid cyber entity extraction requires an authenticated test user.
    rows.append(api_call("NER-001", "Cyber Entity Extraction / Hybrid NER", "synthetic indicators present", "POST", "/api/v1/ai/entities/extract", {"text": ENTITY_TEXT}, token_required=True))
    rows.append(api_call("NER-002", "Cyber Entity Extraction / Hybrid NER", "no indicators", "POST", "/api/v1/ai/entities/extract", {"text": "A routine appointment has been moved to Friday morning."}, token_required=True))
    rows.append(api_call("LLM-STATUS", "Investigation LLM / Local runtime", "runtime health", "GET", "/api/v1/investigation-assistant/status", token_required=True))
    rows.append(api_call("LLM-QUERY", "Investigation Assistant / Local LLM", "synthetic query availability", "POST", "/api/v1/ai/assistant/query", {"text": "Give a short checklist for validating a suspicious URL. Do not invent a confidence percentage."}))

    if CASE_ID:
        rows.append(api_call("SIM-001", "Case Similarity / MiniLM", "case vs stored cases", "GET", f"/api/v1/cases/{CASE_ID}/similar-cases", token_required=True))
        rows.append(api_call("URG-001", "Incident Urgency / DistilRoBERTa or fallback", "case narrative urgency", "GET", f"/api/v1/cases/{CASE_ID}/urgency", token_required=True))
        rows.append(api_call("CORR-GET", "Cross-Case Correlation / DistilRoBERTa or fallback", "existing correlation records", "GET", f"/api/v1/cases/{CASE_ID}/correlations", token_required=True))
        rows.append(api_call("GRAPH-001", "Evidence Graph / Link MLP or persisted graph", "case graph read/build", "GET", f"/api/v1/cases/{CASE_ID}/evidence-graph", token_required=True, skip_reason="Requires --include-mutating because this route may rebuild/persist the evidence graph." if not args.include_mutating else ""))
        rows.append(api_call("INTEL-REFRESH", "Intelligence Orchestrator", "all case intelligence stages", "POST", f"/api/v1/cases/{CASE_ID}/intelligence/refresh?force_refresh=true", token_required=True, skip_reason="Writes/rebuilds intelligence records; pass --include-mutating on STAGING to run." if not args.include_mutating else ""))
        # Feedback gate test intentionally hits a deterministic hard-gate path; it creates a LearningCandidate.
        rows.append(api_call("FEEDBACK-HARD-GATE", "Feedback Gate / MLP + governance rules", "unauthorized reviewer must be rejected", "POST", "/api/v1/ai/feedback-gate/evaluate", {"case_id": CASE_ID, "target_model": "url_phishing", "features": {"reviewer_authorized": False, "evidence_integrity_verified": True, "audit_complete": True, "case_finalized": True, "appeal_or_reopen_pending": False}}, token_required=True, skip_reason="Creates a LearningCandidate record; pass --include-mutating on STAGING to run." if not args.include_mutating else ""))
    else:
        for tid, comp, cond, endpoint in [
            ("SIM-001", "Case Similarity / MiniLM", "case vs stored cases", "/cases/{case_id}/similar-cases"),
            ("URG-001", "Incident Urgency / DistilRoBERTa or fallback", "case narrative urgency", "/cases/{case_id}/urgency"),
            ("CORR-GET", "Cross-Case Correlation / DistilRoBERTa or fallback", "existing correlation records", "/cases/{case_id}/correlations"),
            ("GRAPH-001", "Evidence Graph / Link MLP", "case graph", "/cases/{case_id}/evidence-graph"),
            ("INTEL-REFRESH", "Intelligence Orchestrator", "all case intelligence stages", "/cases/{case_id}/intelligence/refresh?force_refresh=true"),
            ("FEEDBACK-HARD-GATE", "Feedback Gate / MLP + governance rules", "unauthorized reviewer must be rejected", "/ai/feedback-gate/evaluate"),
        ]:
            rows.append({"run_timestamp_utc": datetime.now(timezone.utc).isoformat(), "test_id": tid, "component": comp, "condition": cond, "method": "N/A", "endpoint": endpoint, "http_status": "", "test_status": "SKIPPED", "runtime_status": "", "model_name": "", "available": "", "model_available": "", "fallback_mode": "", "prediction_or_decision": "", "confidence_values_json": "", "threshold_values_json": "", "similarity_score_values_json": "", "probabilities_json": "", "latency_ms": "", "notes": "Set CCIP_TEST_CASE_ID or pass --case-id with a synthetic staging case." , "response_shape_summary": ""})

    if COMPLAINT_ID:
        rows.append(api_call("REL-001", "Relation Extraction / DistilRoBERTa or fallback", "complaint entity pairs", "POST", f"/api/v1/complaints/{COMPLAINT_ID}/extract-relations", token_required=True, skip_reason="Persists inferred relations; pass --include-mutating on STAGING to run." if not args.include_mutating else ""))
    else:
        rows.append({"run_timestamp_utc": datetime.now(timezone.utc).isoformat(), "test_id": "REL-001", "component": "Relation Extraction / DistilRoBERTa or fallback", "condition": "complaint entity pairs", "method": "N/A", "endpoint": "/api/v1/complaints/{complaint_id}/extract-relations", "http_status": "", "test_status": "SKIPPED", "runtime_status": "", "model_name": "", "available": "", "model_available": "", "fallback_mode": "", "prediction_or_decision": "", "confidence_values_json": "", "threshold_values_json": "", "similarity_score_values_json": "", "probabilities_json": "", "latency_ms": "", "notes": "Set CCIP_TEST_COMPLAINT_ID or pass --complaint-id with a synthetic complaint; requires --include-mutating on STAGING.", "response_shape_summary": ""})

    if EVIDENCE_ID:
        rows.append(api_call("GEMINI-DOC", "Gemini Document Intelligence / redacted text", "process synthetic evidence", "POST", f"/api/v1/evidence/{EVIDENCE_ID}/process", token_required=True, skip_reason="Modifies document-processing records and may call a paid/external API; pass --include-mutating on STAGING to run." if not args.include_mutating else ""))
    else:
        rows.append({"run_timestamp_utc": datetime.now(timezone.utc).isoformat(), "test_id": "GEMINI-DOC", "component": "Gemini Document Intelligence / redacted text", "condition": "process synthetic evidence", "method": "N/A", "endpoint": "/api/v1/evidence/{evidence_id}/process", "http_status": "", "test_status": "SKIPPED", "runtime_status": "", "model_name": "", "available": "", "model_available": "", "fallback_mode": "", "prediction_or_decision": "", "confidence_values_json": "", "threshold_values_json": "", "similarity_score_values_json": "", "probabilities_json": "", "latency_ms": "", "notes": "Set CCIP_TEST_EVIDENCE_ID to synthetic evidence; requires --include-mutating on STAGING.", "response_shape_summary": ""})

    outdir = Path(args.out_dir)
    outdir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    csv_path = outdir / f"ccip_ai_model_results_{stamp}.csv"
    json_path = outdir / f"ccip_ai_model_results_{stamp}.json"
    with csv_path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    with json_path.open("w", encoding="utf-8") as f:
        json.dump({"run_timestamp_utc": datetime.now(timezone.utc).isoformat(), "base_url": BASE_URL, "tests": rows}, f, indent=2, ensure_ascii=False)
    counts: dict[str, int] = {}
    for r in rows:
        key = r.get("test_status", "UNKNOWN")
        counts[key] = counts.get(key, 0) + 1
    print("CCIP AI model smoke test completed")
    print(f"Base URL: {BASE_URL}")
    print("Result counts: " + json.dumps(counts, sort_keys=True))
    print(f"CSV:  {csv_path.resolve()}")
    print(f"JSON: {json_path.resolve()}")
    print("Reminder: status/score smoke tests do not establish accuracy. Use labelled evaluation sets for accuracy, precision, recall, F1, calibration, false positives/negatives.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
