"""
Cyber Relation Extraction Transformer Adapter
Model: ccip-cyber-relation-distilroberta-v1 (RobertaForSequenceClassification)
Sovereign Enclave Offline Inference Engine
Predicts semantic relationships between pairs of extracted cyber entities using entity marker tokens:
[E1] entity_a [/E1] and [E2] entity_b [/E2].
"""

import os
import json
import threading
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

from app.core.logging import logger

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
DEFAULT_MODEL_DIR = BACKEND_DIR / "ml_models" / "relation_extraction"


class RelationExtractionAdapter:
    """
    Thread-safe, lazy-loaded transformer adapter for cyber entity relationship classification.
    Strictly offline (local_files_only=True) on CPU.
    """

    DEFAULT_RELATIONS = [
        "TRANSFERRED_TO",
        "CONTACTED_VIA",
        "IMPERSONATES",
        "ASSOCIATED_WITH_BANK",
        "PAID_AMOUNT",
        "USES_ACCOUNT",
        "SENT_MESSAGE_TO",
        "OWNS_OR_CONTROLS",
        "NO_RELATION"
    ]

    def __init__(self, model_dir: Optional[Path] = None):
        self._model_dir: Path = Path(model_dir) if model_dir else DEFAULT_MODEL_DIR
        self._lock = threading.Lock()
        self._model = None
        self._tokenizer = None
        self._metadata: Optional[Dict[str, Any]] = None
        self._metrics: Optional[Dict[str, Any]] = None
        self._labels_map: Dict[int, str] = {}
        self._is_loaded = False
        self._load_failed = False
        self._last_error: Optional[str] = None
        self.model_name = "ccip-cyber-relation-distilroberta-v1"
        self.version = "1.0.0"

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
                raise FileNotFoundError(f"Relation extraction model assets missing in {self._model_dir}")
            try:
                logger.info(f"Loading Relation Extraction model from {self._model_dir} (local_files_only=True)...")
                self._tokenizer = AutoTokenizer.from_pretrained(
                    str(self._model_dir),
                    local_files_only=True
                )
                self._model = AutoModelForSequenceClassification.from_pretrained(
                    str(self._model_dir),
                    local_files_only=True
                )
                self._model.eval()

                labels_path = self._model_dir / "labels.json"
                if labels_path.is_file():
                    with open(labels_path, "r", encoding="utf-8") as f:
                        ldata = json.load(f)
                    id2lbl = ldata.get("id2label", {})
                    self._labels_map = {int(k): v for k, v in id2lbl.items()}
                else:
                    self._labels_map = {i: lbl for i, lbl in enumerate(self.DEFAULT_RELATIONS)}

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
                logger.info("Relation Extraction model loaded successfully.")
            except Exception as e:
                self._load_failed = True
                self._last_error = str(e)
                logger.error(f"Failed to load Relation Extraction model: {e}")
                raise

    def predict_relation(
        self,
        text: str,
        entity_a: str,
        entity_b: str,
        entity_a_type: Optional[str] = None,
        entity_b_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Formats text with [E1] entity_a [/E1] and [E2] entity_b [/E2] markers and predicts relation.
        Provides explicit rule-based heuristic fallback if transformer model weights are offline.
        """
        if not self.is_available():
            rel_type = "ASSOCIATED_WITH"
            conf = 0.65
            if entity_a_type and entity_b_type:
                ea = entity_a_type.upper()
                eb = entity_b_type.upper()
                if ("PHONE" in ea and "PERSON" in eb) or ("PHONE" in eb and "PERSON" in ea):
                    rel_type = "USED_BY"
                    conf = 0.75
                elif ("WALLET" in ea or "CRYPTO" in ea) and ("BANK" in eb or "ACCOUNT" in eb):
                    rel_type = "TRANSACTED_WITH"
                    conf = 0.70
                elif ("DOMAIN" in ea and "IP" in eb) or ("IP" in ea and "DOMAIN" in eb):
                    rel_type = "RESOLVES_TO"
                    conf = 0.80

            return {
                "model_name": "rule-based-entity-cooccurrence-fallback",
                "model_version": "1.0.0",
                "relation_type": rel_type,
                "confidence": conf,
                "probabilities": {rel_type: conf, "NO_RELATION": 1.0 - conf},
                "engine_type": "RULE_BASED_HEURISTIC",
                "model_available": False,
                "fallback_mode": True,
                "advisory_warning": "Syntactic entity co-occurrence heuristic (Transformer weights offline) — human verification required.",
                "metrics": self._metrics or {}
            }

        self._ensure_loaded()

        # Contextual marker insertion:
        # If entity strings are in text, wrap first occurrences; otherwise prefix text with explicit markers.
        text_lower = text.lower()
        pos_a = text_lower.find(entity_a.lower())
        pos_b = text_lower.find(entity_b.lower())

        if pos_a != -1 and pos_b != -1 and pos_a != pos_b:
            if pos_a < pos_b:
                marked_text = (
                    text[:pos_a] + f"[E1]{entity_a}[/E1]" +
                    text[pos_a + len(entity_a):pos_b] + f"[E2]{entity_b}[/E2]" +
                    text[pos_b + len(entity_b):]
                )
            else:
                marked_text = (
                    text[:pos_b] + f"[E2]{entity_b}[/E2]" +
                    text[pos_b + len(entity_b):pos_a] + f"[E1]{entity_a}[/E1]" +
                    text[pos_a + len(entity_a):]
                )
        else:
            marked_text = f"[E1]{entity_a}[/E1] and [E2]{entity_b}[/E2]. Context: {text}"

        inputs = self._tokenizer(
            marked_text,
            padding=True,
            truncation=True,
            max_length=192,
            return_tensors="pt"
        )
        with torch.no_grad():
            outputs = self._model(**inputs)
            probs = torch.softmax(outputs.logits, dim=-1)[0].tolist()

        best_idx = int(torch.argmax(outputs.logits, dim=-1)[0].item())
        predicted_relation = self._labels_map.get(best_idx, "NO_RELATION")
        confidence = round(probs[best_idx], 4)

        all_probs = {self._labels_map.get(i, f"REL_{i}"): round(p, 4) for i, p in enumerate(probs)}

        return {
            "model_name": self.model_name,
            "model_version": self.version,
            "entity_a": entity_a,
            "entity_b": entity_b,
            "relation_type": predicted_relation,
            "confidence": confidence,
            "probabilities": all_probs,
            "advisory_warning": "Relation extraction provides candidate semantic links; it does not establish proof of conspiracy, identity, or ownership without investigator verification.",
            "metrics": self._metrics or {}
        }


relation_extraction_adapter = RelationExtractionAdapter()
