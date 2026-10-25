"""
Centralized Machine Learning Model Path & Configuration Module
Sovereign Enclave AI/ML Asset Registry
"""

from pathlib import Path
from typing import Dict, Any, Optional
import json

# Resolve backend root directory (backend/) safely using relative anchors
BACKEND_DIR: Path = Path(__file__).resolve().parent.parent.parent

# Base directory for all trained machine learning models
ML_MODELS_DIR: Path = BACKEND_DIR / "ml_models"

# Specific Model Directories
EMAIL_MODEL_PATH: Path = ML_MODELS_DIR / "email_threat"
SMS_MODEL_PATH: Path = ML_MODELS_DIR / "sms_spam"
URL_MODEL_PATH: Path = ML_MODELS_DIR / "url_phishing"
COMPLAINT_MODEL_PATH: Path = ML_MODELS_DIR / "complaint_classifier"
CYBER_NER_PATH: Path = ML_MODELS_DIR / "cyber_ner"

# Key Artifact Locations
CASE_SIMILARITY_PATH: Path = ML_MODELS_DIR / "case_similarity"
INCIDENT_URGENCY_PATH: Path = ML_MODELS_DIR / "incident_urgency"
RELATION_EXTRACTION_PATH: Path = ML_MODELS_DIR / "relation_extraction"
CROSS_CASE_CORRELATION_PATH: Path = ML_MODELS_DIR / "cross_case_correlation"
EVIDENCE_GRAPH_LINK_PATH: Path = ML_MODELS_DIR / "evidence_graph_link"
FEEDBACK_GATE_PATH: Path = ML_MODELS_DIR / "feedback_gate"

EMAIL_MODEL_WEIGHTS: Path = EMAIL_MODEL_PATH / "model.safetensors"
EMAIL_MODEL_CONFIG: Path = EMAIL_MODEL_PATH / "config.json"
EMAIL_MODEL_METADATA: Path = EMAIL_MODEL_PATH / "metadata.json"

SMS_MODEL_WEIGHTS: Path = SMS_MODEL_PATH / "model.safetensors"
SMS_MODEL_CONFIG: Path = SMS_MODEL_PATH / "config.json"
SMS_MODEL_METADATA: Path = SMS_MODEL_PATH / "metadata.json"

URL_MODEL_WEIGHTS: Path = URL_MODEL_PATH / "phishing_model.pkl"
URL_MODEL_FEATURES: Path = URL_MODEL_PATH / "feature_names.pkl"
URL_MODEL_EXTRACTOR: Path = URL_MODEL_PATH / "feature_extractor.py"

COMPLAINT_MODEL_WEIGHTS: Path = COMPLAINT_MODEL_PATH / "model.safetensors"
COMPLAINT_MODEL_CONFIG: Path = COMPLAINT_MODEL_PATH / "config.json"
COMPLAINT_MODEL_METADATA: Path = COMPLAINT_MODEL_PATH / "metadata.json"
COMPLAINT_MODEL_LABELS: Path = COMPLAINT_MODEL_PATH / "labels.json"
COMPLAINT_MODEL_THRESHOLDS: Path = COMPLAINT_MODEL_PATH / "thresholds.json"
COMPLAINT_MODEL_METRICS: Path = COMPLAINT_MODEL_PATH / "metrics.json"

CYBER_NER_WEIGHTS: Path = CYBER_NER_PATH / "model.safetensors"
CYBER_NER_CONFIG: Path = CYBER_NER_PATH / "config.json"
CYBER_NER_METADATA: Path = CYBER_NER_PATH / "metadata.json"
CYBER_NER_LABELS: Path = CYBER_NER_PATH / "labels.json"
CYBER_NER_METRICS: Path = CYBER_NER_PATH / "metrics.json"


def get_model_status() -> Dict[str, Dict[str, Any]]:
    """
    Inspects availability and integrity of local trained model assets.
    Does not load models into memory.
    """
    return {
        "email_threat": {
            "path": str(EMAIL_MODEL_PATH),
            "available": EMAIL_MODEL_WEIGHTS.is_file() and EMAIL_MODEL_CONFIG.is_file(),
            "weights_size_bytes": EMAIL_MODEL_WEIGHTS.stat().st_size if EMAIL_MODEL_WEIGHTS.is_file() else 0,
            "architecture": "DistilBertForSequenceClassification"
        },
        "sms_spam": {
            "path": str(SMS_MODEL_PATH),
            "available": SMS_MODEL_WEIGHTS.is_file() and SMS_MODEL_CONFIG.is_file(),
            "weights_size_bytes": SMS_MODEL_WEIGHTS.stat().st_size if SMS_MODEL_WEIGHTS.is_file() else 0,
            "architecture": "DistilBertForSequenceClassification"
        },
        "url_phishing": {
            "path": str(URL_MODEL_PATH),
            "available": URL_MODEL_WEIGHTS.is_file() and URL_MODEL_FEATURES.is_file(),
            "weights_size_bytes": URL_MODEL_WEIGHTS.stat().st_size if URL_MODEL_WEIGHTS.is_file() else 0,
            "architecture": "XGBClassifier"
        },
        "complaint_classifier": {
            "path": str(COMPLAINT_MODEL_PATH),
            "available": COMPLAINT_MODEL_WEIGHTS.is_file() and COMPLAINT_MODEL_CONFIG.is_file(),
            "weights_size_bytes": COMPLAINT_MODEL_WEIGHTS.stat().st_size if COMPLAINT_MODEL_WEIGHTS.is_file() else 0,
            "architecture": "DebertaV2ForSequenceClassification",
            "version": (load_model_metadata("complaint_classifier") or {}).get("dataset_version", "1.1.0")
        },
        "cyber_ner": {
            "path": str(CYBER_NER_PATH),
            "available": CYBER_NER_WEIGHTS.is_file() and CYBER_NER_CONFIG.is_file(),
            "weights_size_bytes": CYBER_NER_WEIGHTS.stat().st_size if CYBER_NER_WEIGHTS.is_file() else 0,
            "architecture": "DebertaV2ForTokenClassification",
            "version": (load_model_metadata("cyber_ner") or {}).get("version", "cyber-ner-bootstrap-v4.0.0")
        },
        "case_similarity": {
            "path": str(CASE_SIMILARITY_PATH),
            "available": (CASE_SIMILARITY_PATH / "model.safetensors").is_file() and (CASE_SIMILARITY_PATH / "config.json").is_file(),
            "weights_size_bytes": (CASE_SIMILARITY_PATH / "model.safetensors").stat().st_size if (CASE_SIMILARITY_PATH / "model.safetensors").is_file() else 0,
            "architecture": "BertModel (sentence-transformers/all-MiniLM-L6-v2)",
            "version": (load_model_metadata("case_similarity") or {}).get("version", "1.0.0")
        },
        "incident_urgency": {
            "path": str(INCIDENT_URGENCY_PATH),
            "available": (INCIDENT_URGENCY_PATH / "model.safetensors").is_file() and (INCIDENT_URGENCY_PATH / "config.json").is_file(),
            "weights_size_bytes": (INCIDENT_URGENCY_PATH / "model.safetensors").stat().st_size if (INCIDENT_URGENCY_PATH / "model.safetensors").is_file() else 0,
            "architecture": "RobertaForSequenceClassification (distilroberta-base)",
            "version": (load_model_metadata("incident_urgency") or {}).get("version", "3.0.0")
        },
        "relation_extraction": {
            "path": str(RELATION_EXTRACTION_PATH),
            "available": (RELATION_EXTRACTION_PATH / "model.safetensors").is_file() and (RELATION_EXTRACTION_PATH / "config.json").is_file(),
            "weights_size_bytes": (RELATION_EXTRACTION_PATH / "model.safetensors").stat().st_size if (RELATION_EXTRACTION_PATH / "model.safetensors").is_file() else 0,
            "architecture": "RobertaForSequenceClassification (distilroberta-base)",
            "version": (load_model_metadata("relation_extraction") or {}).get("version", "1.0.0")
        },
        "cross_case_correlation": {
            "path": str(CROSS_CASE_CORRELATION_PATH),
            "available": (CROSS_CASE_CORRELATION_PATH / "model.safetensors").is_file() and (CROSS_CASE_CORRELATION_PATH / "config.json").is_file(),
            "weights_size_bytes": (CROSS_CASE_CORRELATION_PATH / "model.safetensors").stat().st_size if (CROSS_CASE_CORRELATION_PATH / "model.safetensors").is_file() else 0,
            "architecture": "RobertaForSequenceClassification (distilroberta-base)",
            "version": (load_model_metadata("cross_case_correlation") or {}).get("version", "1.0.0")
        },
        "evidence_graph_link": {
            "path": str(EVIDENCE_GRAPH_LINK_PATH),
            "available": (EVIDENCE_GRAPH_LINK_PATH / "evidence_graph_link_model.pt").is_file() and (EVIDENCE_GRAPH_LINK_PATH / "feature_schema.json").is_file(),
            "weights_size_bytes": (EVIDENCE_GRAPH_LINK_PATH / "evidence_graph_link_model.pt").stat().st_size if (EVIDENCE_GRAPH_LINK_PATH / "evidence_graph_link_model.pt").is_file() else 0,
            "architecture": "EvidenceGraphLinkMLP (PyTorch 80-dim)",
            "version": (load_model_metadata("evidence_graph_link") or {}).get("version", "1.0.0")
        },
        "feedback_gate": {
            "path": str(FEEDBACK_GATE_PATH),
            "available": (FEEDBACK_GATE_PATH / "feedback_gate_model.pt").is_file() and (FEEDBACK_GATE_PATH / "feature_schema.json").is_file(),
            "weights_size_bytes": (FEEDBACK_GATE_PATH / "feedback_gate_model.pt").stat().st_size if (FEEDBACK_GATE_PATH / "feedback_gate_model.pt").is_file() else 0,
            "architecture": "FeedbackGateMLP (PyTorch 17-dim + Deterministic Hard Gates)",
            "version": (load_model_metadata("feedback_gate") or {}).get("version", "1.0.0")
        }
    }



def load_model_metadata(model_type: str) -> Optional[Dict[str, Any]]:
    """Loads metadata.json or version.txt for a specific model if present."""
    if model_type == "email_threat" and EMAIL_MODEL_METADATA.is_file():
        with open(EMAIL_MODEL_METADATA, "r", encoding="utf-8") as f:
            return json.load(f)
    elif model_type == "sms_spam" and SMS_MODEL_METADATA.is_file():
        with open(SMS_MODEL_METADATA, "r", encoding="utf-8") as f:
            return json.load(f)
    elif model_type == "complaint_classifier" and COMPLAINT_MODEL_METADATA.is_file():
        with open(COMPLAINT_MODEL_METADATA, "r", encoding="utf-8") as f:
            return json.load(f)
    elif model_type == "cyber_ner" and CYBER_NER_METADATA.is_file():
        with open(CYBER_NER_METADATA, "r", encoding="utf-8") as f:
            return json.load(f)
    elif model_type == "case_similarity" and (CASE_SIMILARITY_PATH / "metadata.json").is_file():
        with open(CASE_SIMILARITY_PATH / "metadata.json", "r", encoding="utf-8") as f:
            return json.load(f)
    elif model_type == "incident_urgency" and (INCIDENT_URGENCY_PATH / "metadata.json").is_file():
        with open(INCIDENT_URGENCY_PATH / "metadata.json", "r", encoding="utf-8") as f:
            return json.load(f)
    elif model_type == "relation_extraction" and (RELATION_EXTRACTION_PATH / "metadata.json").is_file():
        with open(RELATION_EXTRACTION_PATH / "metadata.json", "r", encoding="utf-8") as f:
            return json.load(f)
    elif model_type == "cross_case_correlation" and (CROSS_CASE_CORRELATION_PATH / "metadata.json").is_file():
        with open(CROSS_CASE_CORRELATION_PATH / "metadata.json", "r", encoding="utf-8") as f:
            return json.load(f)
    elif model_type == "evidence_graph_link" and (EVIDENCE_GRAPH_LINK_PATH / "metadata.json").is_file():
        with open(EVIDENCE_GRAPH_LINK_PATH / "metadata.json", "r", encoding="utf-8") as f:
            return json.load(f)
    elif model_type == "feedback_gate" and (FEEDBACK_GATE_PATH / "metadata.json").is_file():
        with open(FEEDBACK_GATE_PATH / "metadata.json", "r", encoding="utf-8") as f:
            return json.load(f)
    elif model_type == "url_phishing":
        version_file = URL_MODEL_PATH / "version.txt"
        if version_file.is_file():
            with open(version_file, "r", encoding="utf-8") as f:
                return {"version_info": f.read()}
    return None


def load_model_metrics(model_type: str) -> Dict[str, Any]:
    """Loads genuine evaluation metrics (accuracy, F1, precision, recall) from persisted disk artifacts."""
    metrics = {
        "accuracy": None,
        "f1_score": None,
        "precision": None,
        "recall": None
    }
    try:
        if model_type == "email_threat":
            metrics_file = EMAIL_MODEL_PATH / "metrics.json"
            if metrics_file.is_file():
                with open(metrics_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    acc = data.get("test_accuracy")
                    metrics["accuracy"] = round(float(acc) * 100, 2) if acc is not None else None
                    f1 = data.get("test_f1")
                    metrics["f1_score"] = round(float(f1), 4) if f1 is not None else None
                    prec = data.get("test_suspicious_precision")
                    metrics["precision"] = round(float(prec), 4) if prec is not None else None
                    rec = data.get("test_suspicious_recall")
                    metrics["recall"] = round(float(rec), 4) if rec is not None else None
        elif model_type == "sms_spam":
            metrics_file = SMS_MODEL_PATH / "metrics.json"
            if metrics_file.is_file():
                with open(metrics_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    acc = data.get("eval_accuracy")
                    metrics["accuracy"] = round(float(acc) * 100, 2) if acc is not None else None
                    f1 = data.get("eval_f1")
                    metrics["f1_score"] = round(float(f1), 4) if f1 is not None else None
                    prec = data.get("eval_spam_precision")
                    metrics["precision"] = round(float(prec), 4) if prec is not None else None
                    rec = data.get("eval_spam_recall")
                    metrics["recall"] = round(float(rec), 4) if rec is not None else None
        elif model_type == "complaint_classifier":
            metrics_file = COMPLAINT_MODEL_PATH / "metrics.json"
            if metrics_file.is_file():
                with open(metrics_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    test_data = data.get("test", {})
                    acc = test_data.get("subset_accuracy")
                    metrics["accuracy"] = round(float(acc) * 100, 2) if acc is not None else None
                    f1 = test_data.get("macro_f1")
                    metrics["f1_score"] = round(float(f1), 4) if f1 is not None else None
                    prec = test_data.get("macro_precision")
                    metrics["precision"] = round(float(prec), 4) if prec is not None else None
                    rec = test_data.get("macro_recall")
                    metrics["recall"] = round(float(rec), 4) if rec is not None else None
        elif model_type == "url_phishing":
            version_file = URL_MODEL_PATH / "version.txt"
            if version_file.is_file():
                with open(version_file, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                    for line in lines:
                        if ":" in line:
                            k, v = line.split(":", 1)
                            k = k.strip().lower()
                            v = v.strip()
                            try:
                                val = float(v)
                                if k == "accuracy":
                                    metrics["accuracy"] = round(val * 100, 2)
                                elif k in ["f1 score", "f1_score", "f1"]:
                                    metrics["f1_score"] = round(val, 4)
                                elif k == "precision":
                                    metrics["precision"] = round(val, 4)
                                elif k == "recall":
                                    metrics["recall"] = round(val, 4)
                            except ValueError:
                                pass
        elif model_type == "cyber_ner":
            metrics_file = CYBER_NER_PATH / "metrics.json"
            if metrics_file.is_file():
                with open(metrics_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    val_data = data.get("validation", {})
                    heldout_data = data.get("heldout_test", {})
                    challenge_data = data.get("challenge", {})
                    acc = val_data.get("token_accuracy")
                    metrics["accuracy"] = round(float(acc) * 100, 2) if acc is not None else None
                    f1 = val_data.get("entity_f1")
                    metrics["f1_score"] = round(float(f1), 4) if f1 is not None else None
                    prec = val_data.get("entity_precision")
                    metrics["precision"] = round(float(prec), 4) if prec is not None else None
                    rec = val_data.get("entity_recall")
                    metrics["recall"] = round(float(rec), 4) if rec is not None else None
                    metrics["validation_f1"] = round(float(val_data["entity_f1"]), 4) if "entity_f1" in val_data else None
                    metrics["heldout_test_f1"] = round(float(heldout_data["entity_f1"]), 4) if "entity_f1" in heldout_data else None
                    metrics["challenge_f1"] = round(float(challenge_data["f1"]), 4) if "f1" in challenge_data else None
        elif model_type in ["case_similarity", "incident_urgency", "relation_extraction", "cross_case_correlation", "evidence_graph_link", "feedback_gate"]:
            target_dir = ML_MODELS_DIR / model_type
            metrics_file = target_dir / "metrics.json"
            if metrics_file.is_file():
                with open(metrics_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    val_data = data.get("validation", data)
                    if "accuracy" in val_data:
                        metrics["accuracy"] = round(float(val_data["accuracy"]) * 100, 2)
                    elif "test_accuracy" in val_data:
                        metrics["accuracy"] = round(float(val_data["test_accuracy"]) * 100, 2)
                    if "macro_f1" in val_data:
                        metrics["f1_score"] = round(float(val_data["macro_f1"]), 4)
                    elif "f1" in val_data:
                        metrics["f1_score"] = round(float(val_data["f1"]), 4)
                    if "macro_precision" in val_data:
                        metrics["precision"] = round(float(val_data["macro_precision"]), 4)
                    elif "precision" in val_data:
                        metrics["precision"] = round(float(val_data["precision"]), 4)
                    if "macro_recall" in val_data:
                        metrics["recall"] = round(float(val_data["macro_recall"]), 4)
                    elif "recall" in val_data:
                        metrics["recall"] = round(float(val_data["recall"]), 4)
    except Exception:
        pass
    return metrics


