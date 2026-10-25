"""
Case Similarity Transformer Adapter
Model: ccip-case-similarity-minilm-v1 (sentence-transformers/all-MiniLM-L6-v2)
Sovereign Enclave Offline Inference Engine
Computes 384-dimensional dense semantic embeddings and cosine similarities for complaint/case pairs.
"""

import os
import json
import threading
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModel

from app.core.logging import logger

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
DEFAULT_MODEL_DIR = BACKEND_DIR / "ml_models" / "case_similarity"


class CaseSimilarityAdapter:
    """
    Thread-safe, lazy-loaded transformer adapter for case semantic similarity.
    Runs strictly offline (local_files_only=True) on CPU.
    """

    DEFAULT_THRESHOLD = 0.55
    EMBEDDING_DIM = 384

    def __init__(self, model_dir: Optional[Path] = None):
        self._model_dir: Path = Path(model_dir) if model_dir else DEFAULT_MODEL_DIR
        self._lock = threading.Lock()
        self._model = None
        self._tokenizer = None
        self._metadata: Optional[Dict[str, Any]] = None
        self._metrics: Optional[Dict[str, Any]] = None
        self._threshold = self.DEFAULT_THRESHOLD
        self._is_loaded = False
        self._load_failed = False
        self._last_error: Optional[str] = None
        self.model_name = "ccip-case-similarity-minilm-v1"
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
                raise FileNotFoundError(f"Case similarity model assets missing in {self._model_dir}")
            try:
                logger.info(f"Loading Case Similarity transformer from {self._model_dir} (local_files_only=True)...")
                self._tokenizer = AutoTokenizer.from_pretrained(
                    str(self._model_dir),
                    local_files_only=True
                )
                self._model = AutoModel.from_pretrained(
                    str(self._model_dir),
                    local_files_only=True
                )
                self._model.eval()

                meta_path = self._model_dir / "metadata.json"
                if meta_path.is_file():
                    with open(meta_path, "r", encoding="utf-8") as f:
                        self._metadata = json.load(f)
                    self._threshold = float(self._metadata.get("threshold", self.DEFAULT_THRESHOLD))
                    self.version = self._metadata.get("version", "1.0.0")

                metrics_path = self._model_dir / "metrics.json"
                if metrics_path.is_file():
                    with open(metrics_path, "r", encoding="utf-8") as f:
                        self._metrics = json.load(f)

                self._is_loaded = True
                logger.info("Case Similarity transformer loaded successfully.")
            except Exception as e:
                self._load_failed = True
                self._last_error = str(e)
                logger.error(f"Failed to load Case Similarity transformer: {e}")
                raise

    def get_embedding(self, text: str) -> List[float]:
        """Encodes text into a normalized 384-dimensional embedding vector."""
        if not text or not text.strip():
            return [0.0] * self.EMBEDDING_DIM

        if not self.is_available():
            import hashlib
            vec = [0.0] * self.EMBEDDING_DIM
            words = text.lower().split()
            if not words:
                return vec
            for w in words:
                h = int(hashlib.md5(w.encode()).hexdigest(), 16) % self.EMBEDDING_DIM
                vec[h] += 1.0
            norm = sum(x * x for x in vec) ** 0.5
            if norm > 0:
                vec = [x / norm for x in vec]
            return vec

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
            # Mean pooling with attention mask
            token_embeddings = outputs.last_hidden_state
            attention_mask = inputs["attention_mask"].unsqueeze(-1).expand(token_embeddings.size()).float()
            sum_embeddings = torch.sum(token_embeddings * attention_mask, 1)
            sum_mask = torch.clamp(attention_mask.sum(1), min=1e-9)
            mean_pooled = sum_embeddings / sum_mask
            # L2 normalize
            normalized = F.normalize(mean_pooled, p=2, dim=1)
            return normalized[0].tolist()

    def score_text_pair(self, text_a: str, text_b: str) -> Dict[str, Any]:
        """
        Computes cosine similarity between two texts.
        Advisory warning: Semantic similarity does not establish a common offender.
        """
        if not self.is_available():
            emb_a = self.get_embedding(text_a)
            emb_b = self.get_embedding(text_b)
            dot = sum(a * b for a, b in zip(emb_a, emb_b))
            score = max(0.0, min(1.0, dot))
            return {
                "model_name": "deterministic-ngram-similarity-fallback",
                "model_version": "1.0.0",
                "similarity_score": round(score, 4),
                "threshold": round(self._threshold, 4),
                "is_candidate_match": score >= self._threshold,
                "engine_type": "DETERMINISTIC_HEURISTIC",
                "model_available": False,
                "fallback_mode": True,
                "advisory_warning": "N-gram indicator overlap similarity (SentenceTransformer weights offline) — advisory only; does not establish common syndicate or offender identity.",
                "metrics": self._metrics or {}
            }

        self._ensure_loaded()
        emb_a = torch.tensor([self.get_embedding(text_a)], dtype=torch.float32)
        emb_b = torch.tensor([self.get_embedding(text_b)], dtype=torch.float32)

        cosine_sim = float(F.cosine_similarity(emb_a, emb_b).item())
        # Clamp to [0.0, 1.0]
        score = max(0.0, min(1.0, (cosine_sim + 1.0) / 2.0 if cosine_sim < 0 else cosine_sim))
        is_match = score >= self._threshold

        return {
            "model_name": self.model_name,
            "model_version": self.version,
            "similarity_score": round(score, 4),
            "threshold": round(self._threshold, 4),
            "is_candidate_match": is_match,
            "advisory_warning": "Semantic similarity indicates narrative and category overlap; it does not establish a common offender, criminal syndicate, or legal guilt.",
            "metrics": self._metrics or {}
        }


case_similarity_adapter = CaseSimilarityAdapter()
