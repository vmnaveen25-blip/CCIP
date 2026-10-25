"""
Cross-Case Correlation Transformer Adapter
Model: ccip-cross-case-correlation-distilroberta-v1 (RobertaForSequenceClassification)
Sovereign Enclave Offline Inference Engine
Evaluates candidate cross-case linkages with paired inputs:
[CASE_A] narrative_a [CASE_B] narrative_b [SHARED_FEATURES] shared_overlap_summary
Labels: UNRELATED, POSSIBLY_RELATED, STRONGLY_RELATED.
STRICT ADVISORY SEMANTICS: Does NOT establish a common offender or criminal syndicate.
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
DEFAULT_MODEL_DIR = BACKEND_DIR / "ml_models" / "cross_case_correlation"


class CrossCaseCorrelationAdapter:
    """
    Thread-safe, lazy-loaded transformer adapter for paired case correlation.
    Strictly offline (local_files_only=True) on CPU.
    """

    LABELS = ["UNRELATED", "POSSIBLY_RELATED", "STRONGLY_RELATED"]

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
        self.model_name = "ccip-cross-case-correlation-distilroberta-v1"
        self.version = "1.0.0"

    @property
    def model_dir(self) -> Path:
        return self._model_dir

    def is_available(self) -> bool:
        weights_file = self._model_dir / "model.safetensors"
        bin_file = self._model_dir / "pytorch_model.bin"
        has_weights = weights_file.is_file() or bin_file.is_file()
        config_file = self._model_dir / "config.json"
        tok_file = self._model_dir / "tokenizer.json"
        return self._model_dir.is_dir() and has_weights and config_file.is_file() and tok_file.is_file()

    def _ensure_loaded(self):
        if self._is_loaded:
            return
        with self._lock:
            if self._is_loaded:
                return
            if not self.is_available():
                raise FileNotFoundError(f"Cross-case correlation model assets missing in {self._model_dir}")
            try:
                logger.info(f"Loading Cross-Case Correlation model from {self._model_dir} (local_files_only=True)...")
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
                    self.version = self._metadata.get("version", "1.0.0")

                metrics_path = self._model_dir / "metrics.json"
                if metrics_path.is_file():
                    with open(metrics_path, "r", encoding="utf-8") as f:
                        self._metrics = json.load(f)

                self._is_loaded = True
                logger.info("Cross-Case Correlation model loaded successfully.")
            except Exception as e:
                self._load_failed = True
                self._last_error = str(e)
                logger.error(f"Failed to load Cross-Case Correlation model: {e}")
                raise

    def predict_correlation(
        self,
        case_a_text: str,
        case_b_text: str,
        shared_features: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Evaluates narrative pair and shared features.
        Returns correlation label, probabilities, confidence, and strict advisory notice.
        If transformer model assets are offline, returns explicitly labeled rule-based overlap.
        """
        if not self.is_available():
            shared_count = len(shared_features) if shared_features else 0
            if shared_count >= 2:
                label = "STRONGLY_RELATED"
                conf = 0.82
            elif shared_count == 1:
                label = "POSSIBLY_RELATED"
                conf = 0.58
            else:
                label = "UNRELATED"
                conf = 0.20

            return {
                "model_name": "rule-based-indicator-overlap-fallback",
                "model_version": "1.0.0",
                "correlation_label": label,
                "confidence": conf,
                "probabilities": {
                    "STRONGLY_RELATED": conf if label == "STRONGLY_RELATED" else 0.1,
                    "POSSIBLY_RELATED": conf if label == "POSSIBLY_RELATED" else 0.2,
                    "UNRELATED": conf if label == "UNRELATED" else 0.1
                },
                "shared_features": shared_features or [],
                "engine_type": "RULE_BASED_OVERLAP",
                "model_available": False,
                "advisory_warning": "Deterministic technical indicator overlap heuristic (Transformer weights offline) — does not establish legal guilt or common syndicate.",
                "metrics": self._metrics or {}
            }

        self._ensure_loaded()
        shared_str = ", ".join(shared_features) if shared_features else "none"
        formatted_input = (
            f"[CASE_A] {case_a_text.strip()[:300]} "
            f"[CASE_B] {case_b_text.strip()[:300]} "
            f"[SHARED_FEATURES] {shared_str}"
        )

        inputs = self._tokenizer(
            formatted_input,
            padding=True,
            truncation=True,
            max_length=256,
            return_tensors="pt"
        )
        with torch.no_grad():
            outputs = self._model(**inputs)
            probs = torch.softmax(outputs.logits, dim=-1)[0].tolist()

        best_idx = int(torch.argmax(outputs.logits, dim=-1)[0].item())
        predicted_label = self.LABELS[best_idx] if best_idx < len(self.LABELS) else "UNRELATED"
        confidence = round(probs[best_idx], 4)

        all_probs = {self.LABELS[i]: round(p, 4) for i, p in enumerate(probs)}

        return {
            "model_name": self.model_name,
            "model_version": self.version,
            "correlation_label": predicted_label,
            "confidence": confidence,
            "probabilities": all_probs,
            "shared_features": shared_features or [],
            "advisory_warning": "AI candidate correlation — semantic and indicator overlap does not establish a common offender, conspiracy, or legal guilt.",
            "metrics": self._metrics or {}
        }


cross_case_correlation_adapter = CrossCaseCorrelationAdapter()
