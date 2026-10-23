"""
Incident Urgency Transformer Adapter
Model: ccip-incident-urgency-distilroberta-v3 (DistilRobertaForSequenceClassification)
Sovereign Enclave Offline Inference Engine
Evaluates incident operational urgency (LOW, MEDIUM, HIGH, CRITICAL).
STRICT ADVISORY SIGNAL ONLY: Requires human investigator review.
"""

import os
import json
import threading
from pathlib import Path
from typing import Dict, Any, List, Optional

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

from app.core.logging import logger

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
DEFAULT_MODEL_DIR = BACKEND_DIR / "ml_models" / "incident_urgency"


class IncidentUrgencyAdapter:
    """
    Thread-safe, lazy-loaded transformer adapter for incident narrative urgency.
    Strictly offline (local_files_only=True) on CPU.
    """

    LABELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

    def __init__(self, model_dir: Optional[Path] = None):
        self._model_dir: Path = Path(model_dir) if model_dir else DEFAULT_MODEL_DIR
        self._lock = threading.Lock()
        self._model = None
        self._tokenizer = None
        self._metadata: Optional[Dict[str, Any]] = None
        self._metrics: Optional[Dict[str, Any]] = None
        self._is_loaded = False
        self._load_failed = False
        self._last_error: Optional[str] = None
        self.model_name = "ccip-incident-urgency-distilroberta-v3"
        self.version = "3.0.0"

    @property
    def model_dir(self) -> Path:
        return self._model_dir

    def is_available(self) -> bool:
        weights_file = self._model_dir / "model.safetensors"
        config_file = self._model_dir / "config.json"
        tok_file = self._model_dir / "tokenizer.json"
        return self._model_dir.is_dir() and weights_file.is_file() and config_file.is_file() and tok_file.is_file()

    def _ensure_loaded(self):
        if self._is_loaded:
            return
        with self._lock:
            if self._is_loaded:
                return
            if not self.is_available():
                raise FileNotFoundError(f"Incident urgency model assets missing in {self._model_dir}")
            try:
                logger.info(f"Loading Incident Urgency model from {self._model_dir} (local_files_only=True)...")
                self._tokenizer = AutoTokenizer.from_pretrained(
                    str(self._model_dir),
                    local_files_only=True
                )
                self._model = AutoModelForSequenceClassification.from_pretrained(
                    str(self._model_dir),
                    local_files_only=True
                )
                self._model.eval()

                meta_path = self._model_dir / "metadata.json"
                if meta_path.is_file():
                    with open(meta_path, "r", encoding="utf-8") as f:
                        self._metadata = json.load(f)
                    self.version = self._metadata.get("version", "3.0.0")

                metrics_path = self._model_dir / "metrics.json"
                if metrics_path.is_file():
                    with open(metrics_path, "r", encoding="utf-8") as f:
                        self._metrics = json.load(f)

                self._is_loaded = True
                logger.info("Incident Urgency model loaded successfully.")
            except Exception as e:
                self._load_failed = True
                self._last_error = str(e)
                logger.error(f"Failed to load Incident Urgency model: {e}")
                raise

    def predict_urgency(self, text: str) -> Dict[str, Any]:
        """
        Evaluates narrative urgency.
        Returns label, confidence, probabilities, and advisory warnings.
        """
        if not text or not text.strip():
            return {
                "model_name": self.model_name,
                "urgency_level": "LOW",
                "confidence": 1.0,
                "probabilities": {"LOW": 1.0, "MEDIUM": 0.0, "HIGH": 0.0, "CRITICAL": 0.0},
                "advisory_only": True,
                "human_review_required": True,
                "warning": "Empty input narrative evaluated as default LOW urgency."
            }

        self._ensure_loaded()
        inputs = self._tokenizer(
            text.strip(),
            padding=True,
            truncation=True,
            max_length=256,
            return_tensors="pt"
        )
        with torch.no_grad():
            outputs = self._model(**inputs)
            probs = torch.softmax(outputs.logits, dim=-1)[0].tolist()

        label_probs = {}
        for idx, lbl in enumerate(self.LABELS):
            label_probs[lbl] = round(probs[idx] if idx < len(probs) else 0.0, 4)

        best_idx = int(torch.argmax(outputs.logits, dim=-1)[0].item())
        predicted_label = self.LABELS[best_idx] if best_idx < len(self.LABELS) else "LOW"
        confidence = round(probs[best_idx], 4)

        return {
            "model_name": self.model_name,
            "model_version": self.version,
            "urgency_level": predicted_label,
            "confidence": confidence,
            "probabilities": label_probs,
            "advisory_only": True,
            "human_review_required": True,
            "advisory_warning": "AI incident urgency is an operational triage recommendation only; it does not measure suspect risk, person culpability, or dictate enforcement action.",
            "metrics": self._metrics or {}
        }


incident_urgency_adapter = IncidentUrgencyAdapter()
