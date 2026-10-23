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
from training.shared.evaluation.classification_metrics import compute_binary_metrics
from training.shared.evaluation.multilabel_metrics import compute_multilabel_metrics
from training.shared.schemas.dataset_schema import VALID_LABELS, LABEL_TO_ID
from training.shared.utils.filesystem import read_json, read_jsonl, write_json


def evaluate_predictions(
    ground_truth_file: str,
    predictions_file: str,
    output_report_file: str = "training/complaint_classifier/reports/eval_metrics.json",
) -> Dict[str, Any]:
    """
    Evaluate multi-label complaint classifier predictions against ground-truth records.
    Computes subset accuracy, hamming loss, macro/micro F1, per-class F1, and binary cybercrime metrics.
    """
    gt_records = list(read_jsonl(ground_truth_file))
    pred_records = list(read_jsonl(predictions_file))

    if len(gt_records) != len(pred_records):
        raise ValueError(
            f"Record count mismatch: ground truth has {len(gt_records)} rows, predictions has {len(pred_records)}"
        )

    num_samples = len(gt_records)
    num_labels = len(VALID_LABELS)

    y_true_binary = []
    y_pred_binary = []
    y_prob_binary = []

    y_true_labels = np.zeros((num_samples, num_labels), dtype=int)
    y_pred_labels = np.zeros((num_samples, num_labels), dtype=int)

    for i, (gt, pred) in enumerate(zip(gt_records, pred_records)):
        y_true_binary.append(gt["is_cybercrime"])
        y_pred_binary.append(int(pred.get("is_cybercrime", 0)))
        y_prob_binary.append(float(pred.get("is_cybercrime_probability", pred.get("is_cybercrime", 0))))

        for lbl in gt.get("labels", []):
            if lbl in LABEL_TO_ID:
                y_true_labels[i, LABEL_TO_ID[lbl]] = 1

        for lbl in pred.get("labels", []):
            if lbl in LABEL_TO_ID:
                y_pred_labels[i, LABEL_TO_ID[lbl]] = 1

    binary_metrics = compute_binary_metrics(y_true_binary, y_pred_binary, y_prob_binary)
    multilabel_metrics = compute_multilabel_metrics(y_true_labels, y_pred_labels, VALID_LABELS)

    combined_report = {
        "num_evaluated_samples": num_samples,
        "binary_cybercrime_detection": binary_metrics,
        "multilabel_classification": multilabel_metrics,
    }

    out_path = Path(output_report_file)
    write_json(combined_report, out_path)
    print(f"Evaluation metrics written to {out_path}")
    return combined_report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate Complaint Classifier predictions")
    parser.add_argument("--ground-truth", required=True, help="Path to ground truth JSONL (e.g. test.jsonl)")
    parser.add_argument("--predictions", required=True, help="Path to model predictions JSONL")
    parser.add_argument(
        "--output",
        default="training/complaint_classifier/reports/eval_metrics.json",
        help="Path to save evaluation report",
    )
    args = parser.parse_args()
    evaluate_predictions(args.ground_truth, args.predictions, args.output)
