from typing import Any, Dict, List, Union
import numpy as np
from sklearn.metrics import (
    f1_score,
    precision_score,
    recall_score,
    hamming_loss,
    accuracy_score,
)


def compute_multilabel_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    label_names: List[str],
) -> Dict[str, Any]:
    """
    Compute multi-label metrics:
    - Exact Match Ratio (Subset Accuracy)
    - Hamming Loss
    - Micro / Macro / Weighted F1, Precision, Recall
    - Per-class Precision, Recall, F1, Support
    """
    y_t = np.array(y_true)
    y_p = np.array(y_pred)

    exact_match = float(accuracy_score(y_t, y_p))
    hl = float(hamming_loss(y_t, y_p))

    micro_p = float(precision_score(y_t, y_p, average="micro", zero_division=0))
    micro_r = float(recall_score(y_t, y_p, average="micro", zero_division=0))
    micro_f1 = float(f1_score(y_t, y_p, average="micro", zero_division=0))

    macro_p = float(precision_score(y_t, y_p, average="macro", zero_division=0))
    macro_r = float(recall_score(y_t, y_p, average="macro", zero_division=0))
    macro_f1 = float(f1_score(y_t, y_p, average="macro", zero_division=0))

    weighted_f1 = float(f1_score(y_t, y_p, average="weighted", zero_division=0))

    per_class = {}
    for i, label in enumerate(label_names):
        col_true = y_t[:, i]
        col_pred = y_p[:, i]
        support = int(np.sum(col_true))
        p = float(precision_score(col_true, col_pred, zero_division=0))
        r = float(recall_score(col_true, col_pred, zero_division=0))
        f = float(f1_score(col_true, col_pred, zero_division=0))
        per_class[label] = {
            "precision": p,
            "recall": r,
            "f1": f,
            "support": support,
        }

    return {
        "exact_match_ratio": exact_match,
        "hamming_loss": hl,
        "micro_precision": micro_p,
        "micro_recall": micro_r,
        "micro_f1": micro_f1,
        "macro_precision": macro_p,
        "macro_recall": macro_r,
        "macro_f1": macro_f1,
        "weighted_f1": weighted_f1,
        "per_class": per_class,
    }
