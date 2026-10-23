import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
from training.shared.evaluation.calibration import optimize_thresholds_per_class
from training.shared.schemas.dataset_schema import VALID_LABELS, LABEL_TO_ID
from training.shared.utils.filesystem import read_jsonl, write_json


def tune_classification_thresholds(
    val_ground_truth_file: str,
    val_probabilities_file: str,
    output_thresholds_file: str = "training/complaint_classifier/configs/thresholds.json",
) -> Dict[str, float]:
    """
    Tune probability thresholds per label using validation set probabilities.
    Saves calibrated thresholds for inference.
    """
    gt_records = list(read_jsonl(val_ground_truth_file))
    prob_records = list(read_jsonl(val_probabilities_file))

    if len(gt_records) != len(prob_records):
        raise ValueError(
            f"Record count mismatch: ground truth {len(gt_records)} vs probabilities {len(prob_records)}"
        )

    num_samples = len(gt_records)
    num_labels = len(VALID_LABELS)

    y_true = np.zeros((num_samples, num_labels), dtype=int)
    y_probs = np.zeros((num_samples, num_labels), dtype=float)

    for i, (gt, prob_rec) in enumerate(zip(gt_records, prob_records)):
        for lbl in gt.get("labels", []):
            if lbl in LABEL_TO_ID:
                y_true[i, LABEL_TO_ID[lbl]] = 1

        probs_dict = prob_rec.get("probabilities", {})
        for lbl, p in probs_dict.items():
            if lbl in LABEL_TO_ID:
                y_probs[i, LABEL_TO_ID[lbl]] = float(p)

    best_thresholds, best_f1s = optimize_thresholds_per_class(
        y_true=y_true,
        y_probs=y_probs,
        label_names=VALID_LABELS,
    )

    output = {
        "calibrated_thresholds": best_thresholds,
        "validation_f1_at_threshold": best_f1s,
    }

    out_path = Path(output_thresholds_file)
    write_json(output, out_path)
    print(f"Optimal thresholds written to {out_path}")
    return best_thresholds


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Tune per-class probability thresholds")
    parser.add_argument("--ground-truth", required=True, help="Path to validation ground truth JSONL")
    parser.add_argument("--probabilities", required=True, help="Path to validation probability predictions JSONL")
    parser.add_argument(
        "--output",
        default="training/complaint_classifier/configs/thresholds.json",
        help="Path to save calibrated thresholds",
    )
    args = parser.parse_args()
    tune_classification_thresholds(args.ground_truth, args.probabilities, args.output)
