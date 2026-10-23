"""
Cyber NER Transformer Adapter
Model: ccip-cyber-ner-deberta-v3-base (DebertaV2ForTokenClassification)
Sovereign Enclave Offline Transformer Inference Engine
"""

import os
import re
import json
import threading
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

from app.core.logging import logger
from app.core.config import settings


# Target model directory
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
DEFAULT_MODEL_DIR = BACKEND_DIR / "ml_models" / "cyber_ner"


class CyberNERTransformer:
    """
    Thread-safe, lazy-loaded transformer adapter for local DeBERTa token classification.
    Runs strictly offline (local_files_only=True) on CPU.
    Never loads weights on module import.
    """

    def __init__(self, model_dir: Optional[Path] = None):
        self._model_dir: Path = Path(model_dir) if model_dir else DEFAULT_MODEL_DIR
        self._lock = threading.Lock()
        self._model = None
        self._tokenizer = None
        self._metadata: Optional[Dict[str, Any]] = None
        self._metrics: Optional[Dict[str, Any]] = None
        self._id2label: Dict[int, str] = {}
        self._is_loaded = False
        self._load_failed = False
        self._last_error: Optional[str] = None
        self.extractor_name = "DEBERTA_CYBER_NER_V4"
        self.version = "cyber-ner-bootstrap-v4.0.0"

    @property
    def model_dir(self) -> Path:
        return self._model_dir

    def is_available(self) -> bool:
        """Checks if required local model files exist without loading weights into memory."""
        weights_file = self._model_dir / "model.safetensors"
        config_file = self._model_dir / "config.json"
        tok_file = self._model_dir / "tokenizer.json"
        tok_cfg = self._model_dir / "tokenizer_config.json"
        return (
            self._model_dir.is_dir()
            and weights_file.is_file()
            and config_file.is_file()
            and (tok_file.is_file() or tok_cfg.is_file())
        )

    def load(self) -> bool:
        """Lazy-loads model weights and tokenizer in a thread-safe manner."""
        if self._is_loaded:
            return True

        if not self.is_available():
            self._last_error = f"Model artifacts not found in {self._model_dir}"
            return False

        with self._lock:
            if self._is_loaded:
                return True

            try:
                logger.info(f"Loading Cyber NER Transformer from {self._model_dir} on CPU (local_files_only=True)...")
                import torch
                from transformers import AutoTokenizer, AutoModelForTokenClassification

                self._tokenizer = AutoTokenizer.from_pretrained(
                    str(self._model_dir),
                    local_files_only=True
                )
                self._model = AutoModelForTokenClassification.from_pretrained(
                    str(self._model_dir),
                    local_files_only=True
                )
                self._model.eval()

                # Extract id2label mapping
                raw_id2label = getattr(self._model.config, "id2label", {})
                self._id2label = {int(k): v for k, v in raw_id2label.items()}

                # Read metadata and metrics
                meta_file = self._model_dir / "metadata.json"
                if meta_file.is_file():
                    with open(meta_file, "r", encoding="utf-8") as f:
                        self._metadata = json.load(f)
                        if "version" in self._metadata:
                            self.version = self._metadata["version"]

                metrics_file = self._model_dir / "metrics.json"
                if metrics_file.is_file():
                    with open(metrics_file, "r", encoding="utf-8") as f:
                        self._metrics = json.load(f)

                self._is_loaded = True
                self._load_failed = False
                self._last_error = None
                logger.info("Cyber NER Transformer loaded and cached successfully.")
                return True

            except Exception as e:
                self._load_failed = True
                self._is_loaded = False
                self._last_error = str(e)
                logger.error(f"Failed to load Cyber NER Transformer: {e}", exc_info=True)
                return False

    def unload(self) -> None:
        """Unloads model weights from memory (used for test teardown / reload)."""
        with self._lock:
            self._model = None
            self._tokenizer = None
            self._is_loaded = False
            self._load_failed = False
            self._last_error = None
            logger.info("Cyber NER Transformer unloaded from memory.")

    def get_metadata(self) -> Dict[str, Any]:
        """Returns loaded model metadata or loads from disk if available."""
        if self._metadata:
            return self._metadata

        meta_file = self._model_dir / "metadata.json"
        if meta_file.is_file():
            try:
                with open(meta_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {
            "model_name": "ccip-cyber-ner-deberta-v3-base",
            "base_model": "microsoft/deberta-v3-base",
            "task": "token-classification",
            "version": self.version,
            "max_length": 256
        }

    def get_metrics(self) -> Dict[str, Any]:
        """Returns held-out and challenge metrics loaded from disk."""
        if self._metrics:
            return self._metrics

        metrics_file = self._model_dir / "metrics.json"
        if metrics_file.is_file():
            try:
                with open(metrics_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {}

    def health_status(self) -> Dict[str, Any]:
        """Returns runtime diagnostic status."""
        available = self.is_available()
        meta = self.get_metadata()
        metrics = self.get_metrics()

        if not available:
            status = "UNAVAILABLE"
        elif self._is_loaded:
            status = "READY"
        elif self._load_failed:
            status = "FAILED"
        else:
            status = "AVAILABLE_WITH_LIMITATIONS"

        return {
            "name": "Cyber NER Transformer",
            "model_name": meta.get("model_name", "ccip-cyber-ner-deberta-v3-base"),
            "base_model": meta.get("base_model", "microsoft/deberta-v3-base"),
            "version": self.version,
            "status": status,
            "available": available,
            "loaded": self._is_loaded,
            "device": "cpu",
            "threshold": settings.CYBER_NER_CONFIDENCE_THRESHOLD,
            "validation_scope": "BOOTSTRAP / HELD-OUT SYNTHETIC + SMALL MANUAL CHALLENGE SET",
            "last_error": self._last_error,
            "metrics": metrics,
            "limitations": meta.get("limitations", [
                "Bootstrap model trained primarily on controlled synthetic complaint-style text.",
                "Held-out template families reduce leakage but do not replace real field validation."
            ])
        }

    def extract(self, text: str, threshold: Optional[float] = None) -> List[Dict[str, Any]]:
        """
        Executes real token-classification inference on text and performs BIO decoding.
        Returns extracted entities with character offsets, confidence, and source provenance.
        """
        if not text or not text.strip():
            return []

        if not self.load():
            logger.warning(f"Cyber NER Transformer unavailable: {self._last_error}")
            return []

        import torch

        conf_threshold = threshold if threshold is not None else settings.CYBER_NER_CONFIDENCE_THRESHOLD
        max_length = int(self.get_metadata().get("max_length", 256))

        try:
            inputs = self._tokenizer(
                text,
                return_offsets_mapping=True,
                return_tensors="pt",
                truncation=True,
                max_length=max_length
            )
            offset_mapping = inputs.pop("offset_mapping")[0].tolist()

            with torch.inference_mode():
                outputs = self._model(**inputs)
                logits = outputs.logits[0]  # [seq_len, num_labels]
                probs = torch.softmax(logits, dim=-1)
                pred_ids = torch.argmax(probs, dim=-1).tolist()
                confidences = [probs[i, p].item() for i, p in enumerate(pred_ids)]

            return self._decode_bio(text, offset_mapping, pred_ids, confidences, conf_threshold)

        except Exception as e:
            logger.error(f"Error during Cyber NER inference: {e}", exc_info=True)
            return []

    def _decode_bio(
        self,
        text: str,
        offset_mapping: List[Tuple[int, int]],
        pred_ids: List[int],
        confidences: List[float],
        threshold: float
    ) -> List[Dict[str, Any]]:
        """
        Robust BIO sequence decoding state machine.
        Handles:
        - B-TYPE, I-TYPE, O
        - Orphan I-TYPE (promoted safely to span start)
        - Mid-span type switches
        - Special tokens (offsets [0, 0] or non-text)
        - Subwords via character offset expansion
        - Confidence aggregation via mean token probability
        """
        spans = []
        current_type = None
        current_start = None
        current_end = None
        current_confs: List[float] = []

        def flush_span():
            nonlocal current_type, current_start, current_end, current_confs
            if current_type is not None and current_start is not None and current_end is not None:
                mean_conf = sum(current_confs) / len(current_confs) if current_confs else 0.0
                spans.append((current_type, current_start, current_end, mean_conf))
            current_type = None
            current_start = None
            current_end = None
            current_confs = []

        for (start, end), pid, conf in zip(offset_mapping, pred_ids, confidences):
            # Special tokens ([CLS], [SEP], [PAD]) have start == end
            if start == end:
                continue

            label = self._id2label.get(pid, "O")

            if label == "O":
                flush_span()
            elif label.startswith("B-"):
                flush_span()
                current_type = label[2:]
                current_start = start
                current_end = end
                current_confs = [conf]
            elif label.startswith("I-"):
                ent_type = label[2:]
                if current_type == ent_type:
                    # Contiguous continuation of matching span
                    current_end = end
                    current_confs.append(conf)
                else:
                    # Malformed: I- without preceding B- or switch to different type
                    flush_span()
                    current_type = ent_type
                    current_start = start
                    current_end = end
                    current_confs = [conf]
            else:
                flush_span()

        flush_span()

        # Build clean entity records with normalization and apply confidence threshold on the entity span
        results: List[Dict[str, Any]] = []
        for ent_type, s_idx, e_idx, mean_conf in spans:
            if mean_conf < threshold:
                continue
            raw_val = text[s_idx:e_idx].strip()
            if not raw_val:
                continue

            norm_val = self._normalize_entity_value(ent_type, raw_val)
            results.append({
                "entity_type": ent_type,
                "raw_value": raw_val,
                "normalized_value": norm_val,
                "confidence": round(float(mean_conf), 4),
                "start_offset": s_idx,
                "end_offset": e_idx,
                "extractor": self.extractor_name,
                "extractor_version": self.version,
                "source": "TRANSFORMER",
                "occurrence_count": 1
            })

        return results

    def _normalize_entity_value(self, entity_type: str, raw_val: str) -> str:
        """Normalizes contextual entity strings safely."""
        val = raw_val.strip()
        if entity_type == "PHONE_NUMBER":
            digits = re.sub(r'\D', '', val)
            if len(digits) >= 10:
                core_10 = digits[-10:]
                if core_10[0] in "6789":
                    return f"+91{core_10}"
            return val.replace(" ", "")

        elif entity_type == "UPI_ID":
            return val.lower()

        elif entity_type == "BANK_NAME":
            return val.lower()

        elif entity_type == "SOCIAL_HANDLE":
            clean = val.strip()
            if not clean.startswith("@"):
                clean = f"@{clean}"
            return clean.lower()

        elif entity_type == "AMOUNT":
            # Extract digits and decimals if present
            num_clean = re.sub(r'[^\d.]', '', val)
            try:
                f_val = float(num_clean)
                return f"INR {f_val:,.2f}"
            except ValueError:
                return val

        elif entity_type in ["TRANSACTION_ID", "UTR"]:
            return val.upper()

        elif entity_type == "BANK_ACCOUNT":
            return re.sub(r'\D', '', val) or val

        elif entity_type in ["ORGANIZATION", "PLATFORM_NAME"]:
            return val

        elif entity_type == "PERSON_NAME":
            # Preserve capitalization for names (never destructively lowercased)
            return val

        return val


# Singleton instance
cyber_ner_transformer = CyberNERTransformer()
