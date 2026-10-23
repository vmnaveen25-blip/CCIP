from typing import Any, Dict, List, Union
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
)


def compute_binary_metrics(
    y_true: Union[List[int], np.ndarray],
    y_pred: Union[List[int], np.ndarray],
    y_prob: Union[List[float], np.ndarray] = None,
) -> Dict[str, Any]:
    """Compute binary classification metrics for cybercrime detection."""
    y_t = np.array(y_true)
    y_p = np.array(y_pred)

    metrics = {
        "accuracy": float(accuracy_score(y_t, y_p)),
        "precision": float(precision_score(y_t, y_p, zero_division=0)),
        "recall": float(recall_score(y_t, y_p, zero_division=0)),
        "f1": float(f1_score(y_t, y_p, zero_division=0)),
    }

    if y_prob is not None:
        try:
            metrics["roc_auc"] = float(roc_auc_score(y_t, np.array(y_prob)))
        except ValueError:
            metrics["roc_auc"] = 0.0

    cm = confusion_matrix(y_t, y_p).tolist()
    metrics["confusion_matrix"] = cm
    return metrics
