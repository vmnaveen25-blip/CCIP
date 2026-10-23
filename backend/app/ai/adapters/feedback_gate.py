"""
Feedback Reliability Gate Adapter
Model: ccip-feedback-gate-v1 (PyTorch 17-dim MLP + Deterministic Governance Hard Gates)
Sovereign Enclave Offline Inference Engine
Qualifies closed case outcomes into a controlled continual-learning queue.
Labels: REJECT, REQUIRES_REVIEW, APPROVE_CANDIDATE.

MANDATORY HARD GATES (Strict Deterministic Overrides):
1. reviewer_authorized == False -> REJECT
2. evidence_integrity_verified == False -> REJECT
3. audit_complete == False -> REQUIRES_REVIEW
4. appeal_or_reopen_pending == True -> REQUIRES_REVIEW
5. case_finalized == False -> REQUIRES_REVIEW
"""

import os
import json
import threading
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import torch
import torch.nn as nn

from app.core.logging import logger

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
DEFAULT_MODEL_DIR = BACKEND_DIR / "ml_models" / "feedback_gate"


class FeedbackGateMLP(nn.Module):
    """Exact PyTorch neural architecture for 17-dim feedback gate classifier."""
    def __init__(self, input_dim: int = 17, hidden_1: int = 96, hidden_2: int = 48, output_dim: int = 3):
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


class FeedbackGateAdapter:
    """
    Thread-safe, lazy-loaded PyTorch adapter for continual-learning qualification.
    Enforces deterministic hard gates that strictly override model inference.
    """

    FEATURE_DIM = 17
    LABELS = ["REJECT", "REQUIRES_REVIEW", "APPROVE_CANDIDATE"]

    FEATURE_NAMES = [
        "evidence_integrity_verified",
        "reviewer_authorized",
        "case_finalized",
        "appeal_or_reopen_pending",
        "audit_complete",
        "provenance_completeness",
        "reviewer_count_norm",
        "reviewer_agreement_ratio",
        "source_diversity_norm",
        "supporting_evidence_norm",
        "contradiction_rate",
        "entity_consistency",
        "human_model_agreement",
        "manual_verification_ratio",
        "feedback_age_norm",
        "cross_case_support_norm",
        "data_quality_score"
    ]

    def __init__(self, model_dir: Optional[Path] = None):
        self._model_dir: Path = Path(model_dir) if model_dir else DEFAULT_MODEL_DIR
        self._lock = threading.Lock()
        self._model: Optional[FeedbackGateMLP] = None
        self._metadata: Optional[Dict[str, Any]] = None
        self._metrics: Optional[Dict[str, Any]] = None
        self._is_loaded = False
        self._load_failed = False
        self._last_error: Optional[str] = None
        self.model_name = "ccip-feedback-gate-v1"
        self.version = "1.0.0"

    @property
    def model_dir(self) -> Path:
        return self._model_dir

    def is_available(self) -> bool:
        weights_file = self._model_dir / "feedback_gate_model.pt"
        schema_file = self._model_dir / "feature_schema.json"
        return self._model_dir.is_dir() and weights_file.is_file() and schema_file.is_file()

    def _ensure_loaded(self):
        if self._is_loaded:
            return
        with self._lock:
            if self._is_loaded:
                return
            if not self.is_available():
                raise FileNotFoundError(f"Feedback gate model missing in {self._model_dir}")
            try:
                logger.info(f"Loading Feedback Gate MLP from {self._model_dir}...")
                model_file = self._model_dir / "feedback_gate_model.pt"
                checkpoint = torch.load(str(model_file), map_location="cpu", weights_only=False)

                arch = checkpoint.get("architecture", {})
                in_dim = arch.get("input_dim", self.FEATURE_DIM)
                h1 = arch.get("hidden_1", 96)
                h2 = arch.get("hidden_2", 48)
                out_dim = arch.get("output_dim", 3)

                self._model = FeedbackGateMLP(in_dim, h1, h2, out_dim)
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
                logger.info("Feedback Gate MLP loaded successfully.")
            except Exception as e:
                self._load_failed = True
                self._last_error = str(e)
                logger.error(f"Failed to load Feedback Gate MLP: {e}")
                raise

    def check_hard_gates(self, features: Dict[str, Any]) -> Optional[Tuple[str, str]]:
        """
        Evaluates the 5 mandatory deterministic hard gates:
        Returns (decision, reason) if a hard gate triggers; otherwise None.
        """
        reviewer_auth = bool(features.get("reviewer_authorized", False))
        evidence_integrity = bool(features.get("evidence_integrity_verified", False))
        case_finalized = bool(features.get("case_finalized", False))
        appeal_pending = bool(features.get("appeal_or_reopen_pending", False))
        audit_complete = bool(features.get("audit_complete", False))

        if not reviewer_auth:
            return ("REJECT", "Hard gate triggered: Reviewer is not authorized for feedback qualification.")

        if not evidence_integrity:
            return ("REJECT", "Hard gate triggered: Cryptographic evidence chain-of-custody integrity check failed.")

        if not audit_complete:
            return ("REQUIRES_REVIEW", "Hard gate triggered: Case audit log has not been completed.")

        if appeal_pending:
            return ("REQUIRES_REVIEW", "Hard gate triggered: Legal appeal or case reopening is currently pending.")

        if not case_finalized:
            return ("REQUIRES_REVIEW", "Hard gate triggered: Investigation has not reached final case closure.")

        return None

    def evaluate(self, feature_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates feedback reliability.
        Applies deterministic hard gates first; if all pass, runs neural MLP.
        """
        hard_gate_result = self.check_hard_gates(feature_dict)
        if hard_gate_result is not None:
            decision, reason = hard_gate_result
            return {
                "model_name": self.model_name,
                "model_version": self.version,
                "decision": decision,
                "gate_source": "HARD_RULES_OVERRIDE",
                "reason": reason,
                "confidence": 1.0,
                "hard_gate_passed": False,
                "probabilities": {
                    "REJECT": 1.0 if decision == "REJECT" else 0.0,
                    "REQUIRES_REVIEW": 1.0 if decision == "REQUIRES_REVIEW" else 0.0,
                    "APPROVE_CANDIDATE": 0.0
                },
                "feature_snapshot": feature_dict,
                "advisory_warning": "Eligible for controlled dataset review. No automatic retraining.",
                "metrics": self._metrics or {}
            }

        # Hard gates passed, run neural MLP
        self._ensure_loaded()
        vec = []
        for name in self.FEATURE_NAMES:
            val = feature_dict.get(name, 0.0)
            if isinstance(val, bool):
                vec.append(1.0 if val else 0.0)
            else:
                try:
                    vec.append(float(val))
                except (ValueError, TypeError):
                    vec.append(0.0)

        x = torch.tensor([vec], dtype=torch.float32)
        with torch.no_grad():
            logits = self._model(x)
            probs = torch.softmax(logits, dim=-1)[0].tolist()

        best_idx = int(torch.argmax(logits, dim=-1)[0].item())
        decision = self.LABELS[best_idx]
        confidence = round(probs[best_idx], 4)

        reasons = {
            "APPROVE_CANDIDATE": "All deterministic hard gates satisfied and data quality scores exceed threshold.",
            "REQUIRES_REVIEW": "Hard gates satisfied but neural feature quality indicates secondary specialist review required.",
            "REJECT": "Neural scoring identified excessive contradiction or low agreement."
        }

        return {
            "model_name": self.model_name,
            "model_version": self.version,
            "decision": decision,
            "gate_source": "NEURAL_GATE",
            "reason": reasons.get(decision, "Neural gate evaluated candidate."),
            "confidence": confidence,
            "hard_gate_passed": True,
            "probabilities": {
                "REJECT": round(probs[0], 4),
                "REQUIRES_REVIEW": round(probs[1], 4),
                "APPROVE_CANDIDATE": round(probs[2], 4)
            },
            "feature_snapshot": feature_dict,
            "advisory_warning": "Eligible for controlled dataset review. No automatic retraining.",
            "metrics": self._metrics or {}
        }

    # Alias for API consistency
    evaluate_candidate = evaluate


feedback_gate_adapter = FeedbackGateAdapter()
