"""
Evidence Graph Link Prediction MLP Adapter
Model: ccip-evidence-graph-link-v1 (PyTorch 80-dim MLP)
Sovereign Enclave Offline Inference Engine
Predicts whether two graph nodes have an investigative link candidate:
Labels: NO_LINK (0), CANDIDATE_LINK (1).
"""

import os
import json
import threading
from pathlib import Path
from typing import Dict, Any, List, Optional

import torch
import torch.nn as nn

from app.core.logging import logger

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
DEFAULT_MODEL_DIR = BACKEND_DIR / "ml_models" / "evidence_graph_link"


class EvidenceGraphLinkMLP(nn.Module):
    """Exact PyTorch neural architecture for 80-dim evidence graph link classifier."""
    def __init__(self, input_dim: int = 80, hidden_1: int = 128, hidden_2: int = 64, output_dim: int = 2):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_1),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(hidden_1, hidden_2),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(hidden_2, output_dim)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


class EvidenceGraphLinkAdapter:
    """
    Thread-safe, lazy-loaded PyTorch adapter for evidence graph link prediction.
    Strictly offline (local_files_only=True) on CPU.
    """

    FEATURE_DIM = 80
    LABELS = ["NO_LINK", "CANDIDATE_LINK"]

    def __init__(self, model_dir: Optional[Path] = None):
        self._model_dir: Path = Path(model_dir) if model_dir else DEFAULT_MODEL_DIR
        self._lock = threading.Lock()
        self._model: Optional[EvidenceGraphLinkMLP] = None
        self._metadata: Optional[Dict[str, Any]] = None
        self._metrics: Optional[Dict[str, Any]] = None
        self._feature_schema: Optional[Dict[str, Any]] = None
        self._node_types: List[str] = []
        self._is_loaded = False
        self._load_failed = False
        self._last_error: Optional[str] = None
        self.model_name = "ccip-evidence-graph-link-v1"
        self.version = "1.0.0"

    @property
    def model_dir(self) -> Path:
        return self._model_dir

    def is_available(self) -> bool:
        weights_file = self._model_dir / "evidence_graph_link_model.pt"
        schema_file = self._model_dir / "feature_schema.json"
        return self._model_dir.is_dir() and weights_file.is_file() and schema_file.is_file()

    def _ensure_loaded(self):
        if self._is_loaded:
            return
        with self._lock:
            if self._is_loaded:
                return
            if not self.is_available():
                raise FileNotFoundError(f"Evidence graph link model missing in {self._model_dir}")
            try:
                logger.info(f"Loading Evidence Graph Link MLP from {self._model_dir}...")
                schema_path = self._model_dir / "feature_schema.json"
                with open(schema_path, "r", encoding="utf-8") as f:
                    self._feature_schema = json.load(f)
                self._node_types = self._feature_schema.get("node_types", [])

                model_file = self._model_dir / "evidence_graph_link_model.pt"
                checkpoint = torch.load(str(model_file), map_location="cpu", weights_only=False)

                arch = checkpoint.get("architecture", {})
                in_dim = arch.get("input_dim", self.FEATURE_DIM)
                h1 = arch.get("hidden_1", 128)
                h2 = arch.get("hidden_2", 64)
                out_dim = arch.get("output_dim", 2)

                self._model = EvidenceGraphLinkMLP(in_dim, h1, h2, out_dim)
                self._model.load_state_dict(checkpoint["state_dict"])
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
                logger.info("Evidence Graph Link MLP loaded successfully.")
            except Exception as e:
                self._load_failed = True
                self._last_error = str(e)
                logger.error(f"Failed to load Evidence Graph Link MLP: {e}")
                raise

    def predict_link(self, feature_vector: List[float]) -> Dict[str, Any]:
        """Evaluates an 80-dimensional feature vector and predicts CANDIDATE_LINK likelihood."""
        self._ensure_loaded()
        if len(feature_vector) != self.FEATURE_DIM:
            # Pad or truncate gracefully
            if len(feature_vector) < self.FEATURE_DIM:
                feature_vector = feature_vector + [0.0] * (self.FEATURE_DIM - len(feature_vector))
            else:
                feature_vector = feature_vector[:self.FEATURE_DIM]

        x = torch.tensor([feature_vector], dtype=torch.float32)
        with torch.no_grad():
            logits = self._model(x)
            probs = torch.softmax(logits, dim=-1)[0].tolist()

        best_idx = int(torch.argmax(logits, dim=-1)[0].item())
        label = self.LABELS[best_idx]
        confidence = round(probs[best_idx], 4)

        return {
            "model_name": self.model_name,
            "model_version": self.version,
            "prediction": label,
            "is_candidate_link": (label == "CANDIDATE_LINK"),
            "confidence": confidence,
            "probabilities": {
                "NO_LINK": round(probs[0], 4),
                "CANDIDATE_LINK": round(probs[1], 4)
            },
            "advisory_warning": "Evidence graph candidate links are hypothesis suggestions for human investigator verification only.",
            "metrics": self._metrics or {}
        }


evidence_graph_link_adapter = EvidenceGraphLinkAdapter()
