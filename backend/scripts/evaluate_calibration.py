"""
Astraea Enclave / CCIP Pilot Evaluation Toolkit
Script: evaluate_calibration.py

Calculates statistical model calibration measures:
- Expected Calibration Error (ECE) across N confidence bins
- Maximum Calibration Error (MCE)
- Brier Score (mean squared error of probability forecasts)
- Reliability Diagram bin statistics (accuracy vs. confidence)

Guarantees:
- Pure statistical confidence evaluation.
- Never equates confidence with "probability of legal guilt".
"""

from typing import List, Dict, Any, Tuple


def compute_calibration_metrics(
    probabilities: List[float],
    labels: List[int],
    num_bins: int = 10
) -> Dict[str, Any]:
    """
    Computes ECE, MCE, Brier Score, and reliability bin assignments.
    probabilities: predicted probability of positive class [0.0, 1.0]
    labels: ground-truth binary outcomes (0 or 1)
    """
    if len(probabilities) != len(labels):
        raise ValueError("Probabilities and labels must have equal length.")
    N = len(probabilities)
    if N == 0:
        return {"ece": 0.0, "mce": 0.0, "brier_score": 0.0, "bins": []}

    # Brier score: (1/N) * sum((prob - label)^2)
    brier_score = sum((p - l) ** 2 for p, l in zip(probabilities, labels)) / N

    # Binning
    bin_size = 1.0 / num_bins
    bins_data = []
    ece = 0.0
    mce = 0.0

    for b in range(num_bins):
        bin_lower = b * bin_size
        bin_upper = (b + 1) * bin_size

        # Find items in bin
        bin_indices = [
            i for i, p in enumerate(probabilities)
            if (bin_lower <= p < bin_upper) or (b == num_bins - 1 and p == bin_upper)
        ]

        count = len(bin_indices)
        if count > 0:
            avg_conf = sum(probabilities[i] for i in bin_indices) / count
            avg_acc = sum(labels[i] for i in bin_indices) / count
            abs_diff = abs(avg_acc - avg_conf)

            ece += (count / N) * abs_diff
            if abs_diff > mce:
                mce = abs_diff

            bins_data.append({
                "bin_index": b,
                "range": [round(bin_lower, 2), round(bin_upper, 2)],
                "count": count,
                "average_confidence": round(avg_conf, 4),
                "accuracy": round(avg_acc, 4),
                "calibration_gap": round(abs_diff, 4)
            })
        else:
            bins_data.append({
                "bin_index": b,
                "range": [round(bin_lower, 2), round(bin_upper, 2)],
                "count": 0,
                "average_confidence": 0.0,
                "accuracy": 0.0,
                "calibration_gap": 0.0
            })

    return {
        "sample_size": N,
        "brier_score": round(brier_score, 4),
        "expected_calibration_error_ece": round(ece, 4),
        "maximum_calibration_error_mce": round(mce, 4),
        "bins": bins_data
    }


def run_benchmark_calibration_audit() -> Dict[str, Any]:
    """Runs a demonstration calibration test across threat detectors."""
    # Synthetic validation scenario (well-calibrated model vs overconfident model)
    probs_well = [0.1, 0.2, 0.25, 0.5, 0.55, 0.7, 0.85, 0.9, 0.95, 0.98]
    labels_well = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1]
    res_well = compute_calibration_metrics(probs_well, labels_well, num_bins=5)

    probs_overconf = [0.95, 0.92, 0.89, 0.96, 0.99, 0.91, 0.98, 0.93]
    labels_overconf = [1, 1, 0, 1, 0, 1, 0, 1] # 3 false alarms with >90% conf
    res_overconf = compute_calibration_metrics(probs_overconf, labels_overconf, num_bins=5)

    return {
        "calibrated_model": res_well,
        "overconfident_uncalibrated_model": res_overconf
    }


if __name__ == "__main__":
    import json
    res = run_benchmark_calibration_audit()
    print("=== Model Calibration Evaluation Complete ===")
    print(json.dumps(res, indent=2))
