from typing import Any, Dict, List, Tuple
import numpy as np
from sklearn.metrics import f1_score, precision_recall_curve


def optimize_thresholds_per_class(
    y_true: np.ndarray,
    y_probs: np.ndarray,
    label_names: List[str],
    min_threshold: float = 0.1,
    max_threshold: float = 0.9,
    step: float = 0.02,
) -> Tuple[Dict[str, float], Dict[str, float]]:
    """
    Find optimal classification threshold for each label that maximizes F1 score.
    Returns:
        best_thresholds: Dict[str, float]
        best_f1_scores: Dict[str, float]
    """
    threshold_grid = np.arange(min_threshold, max_threshold + step, step)
    best_thresholds: Dict[str, float] = {}
    best_f1_scores: Dict[str, float] = {}

    for i, label in enumerate(label_names):
        col_true = y_true[:, i]
        col_prob = y_probs[:, i]

        best_f1 = 0.0
        best_th = 0.5  # default

        # If no positive instances, leave at default
        if np.sum(col_true) == 0:
            best_thresholds[label] = 0.5
            best_f1_scores[label] = 0.0
            continue

        for th in threshold_grid:
            preds = (col_prob >= th).astype(int)
            f1 = f1_score(col_true, preds, zero_division=0)
            if f1 > best_f1:
                best_f1 = float(f1)
                best_th = float(th)

        best_thresholds[label] = round(best_th, 4)
        best_f1_scores[label] = round(best_f1, 4)

    return best_thresholds, best_f1_scores
