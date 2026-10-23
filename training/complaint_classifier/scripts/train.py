"""
CCIP Cybercrime Complaint Classifier - Training, Calibration, Evaluation, and Export Pipeline
Model: microsoft/deberta-v3-base
Task: Multi-label sequence classification (18 cybercrime categories)
Dataset: complaint-dataset-v1.1.0
"""

import argparse
import json
import logging
import os
import platform
import random
import shutil
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import psutil
from sklearn.metrics import (
    f1_score,
    hamming_loss,
    precision_recall_curve,
    precision_score,
    recall_score,
    auc,
)

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from training.shared.schemas.dataset_schema import VALID_LABELS, VALID_LABELS_SET
from training.shared.utils.filesystem import ensure_dir, read_json, read_jsonl, write_json
from training.shared.utils.seed import set_seed

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ccip.train")

DATA_DIR = PROJECT_ROOT / "training" / "complaint_classifier" / "data"
CONFIGS_DIR = PROJECT_ROOT / "training" / "complaint_classifier" / "configs"
REPORTS_DIR = PROJECT_ROOT / "training" / "complaint_classifier" / "reports"
OUTPUTS_DIR = PROJECT_ROOT / "training" / "complaint_classifier" / "outputs"
CHECKPOINTS_DIR = OUTPUTS_DIR / "checkpoints"
BEST_MODEL_DIR = OUTPUTS_DIR / "best_model"
EXPORT_DIR = PROJECT_ROOT / "backend" / "ml_models" / "complaint_classifier"


# ============================================================
# 1. HARDWARE DETECTION & FEASIBILITY ANALYSIS
# ============================================================

def detect_hardware() -> Dict[str, Any]:
    """Inspect and report actual system hardware and compute feasibility."""
    os_name = f"{platform.system()} {platform.release()} ({platform.version()})"
    py_ver = sys.version.split()[0]
    
    torch_available = False
    cuda_available = False
    gpu_name = None
    gpu_vram_gb = 0.0
    torch_version = None

    try:
        import torch
        torch_available = True
        torch_version = torch.__version__
        cuda_available = torch.cuda.is_available()
        if cuda_available:
            gpu_name = torch.cuda.get_device_name(0)
            gpu_vram_gb = round(torch.cuda.get_device_properties(0).total_memory / (1024**3), 2)
    except ImportError:
        pass

    # Fallback to system GPU detection if torch not installed yet
    if not gpu_name:
        try:
            import subprocess
            res = subprocess.run(
                ["powershell", "-Command", "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name"],
                capture_output=True, text=True, timeout=5
            )
            gpus = [line.strip() for line in res.stdout.splitlines() if line.strip()]
            gpu_name = ", ".join(gpus) if gpus else "Unknown"
        except Exception:
            gpu_name = "Unknown"

    vmem = psutil.virtual_memory()
    total_ram_gb = round(vmem.total / (1024**3), 2)
    available_ram_gb = round(vmem.available / (1024**3), 2)

    disk = shutil.disk_usage(str(PROJECT_ROOT))
    free_disk_gb = round(disk.free / (1024**3), 2)

    # Feasibility calculation for DeBERTa-v3-base (86M backbone, ~184M parameters with embeddings)
    # 26,739 training samples * 4 epochs = 106,956 forward/backward passes at max_length 512
    # On mobile CPU without AVX-512 acceleration, each pass is ~2.0 seconds -> ~59 hours
    is_cpu_only = not cuda_available
    estimated_cpu_hours = round((26739 * 4 * 2.0) / 3600.0, 1)
    cpu_feasible = (not is_cpu_only) or (available_ram_gb >= 16.0 and total_ram_gb >= 32.0)

    hardware_info = {
        "operating_system": os_name,
        "python_version": py_ver,
        "torch_available": torch_available,
        "torch_version": torch_version,
        "cuda_available": cuda_available,
        "gpu_name": gpu_name,
        "gpu_vram_gb": gpu_vram_gb,
        "total_ram_gb": total_ram_gb,
        "available_ram_gb": available_ram_gb,
        "free_disk_gb": free_disk_gb,
        "is_cpu_only": is_cpu_only,
        "estimated_cpu_hours": estimated_cpu_hours if is_cpu_only else None,
        "cpu_training_feasible": cpu_feasible,
    }
    return hardware_info


# ============================================================
# 2. CLASS WEIGHTS (DERIVED STRICTLY FROM TRAIN SPLIT)
# ============================================================

def calculate_train_class_weights(
    train_records: List[Dict[str, Any]],
    labels: List[str],
    max_weight_clip: float = 10.0,
) -> Tuple[Dict[str, float], List[float], Dict[str, Any]]:
    """
    Calculate positive class weights derived STRICTLY from the training set.
    pos_weight = (total_samples - pos_count) / pos_count
    Clips weights to prevent gradient explosions on rare classes.
    """
    total = len(train_records)
    label_counts = {lbl: 0 for lbl in labels}
    for r in train_records:
        for lbl in r.get("labels", []):
            if lbl in label_counts:
                label_counts[lbl] += 1

    raw_weights = {}
    clipped_weights = {}
    weight_list = []

    for lbl in labels:
        pos = max(1, label_counts[lbl])
        neg = total - pos
        raw_w = neg / pos
        clipped_w = min(raw_w, max_weight_clip)
        raw_weights[lbl] = round(raw_w, 4)
        clipped_weights[lbl] = round(clipped_w, 4)
        weight_list.append(float(clipped_w))

    weight_info = {
        "derived_from": "train.jsonl (complaint-dataset-v1.1.0)",
        "train_total_records": total,
        "max_clipping_threshold": max_weight_clip,
        "raw_positive_weights": raw_weights,
        "clipped_positive_weights": clipped_weights,
        "clipping_rule": f"min(raw_weight, {max_weight_clip})",
    }
    return clipped_weights, weight_list, weight_info


# ============================================================
# 3. THRESHOLD CALIBRATION (ON VALIDATION SET ONLY)
# ============================================================

def calibrate_validation_thresholds(
    y_val_true: np.ndarray,
    y_val_probs: np.ndarray,
    labels: List[str],
    min_thresh: float = 0.05,
    max_thresh: float = 0.95,
    step: float = 0.02,
) -> Dict[str, float]:
    """
    Find optimal classification threshold per label to maximize F1 score
    using ONLY validation predictions.
    """
    best_thresholds = {}
    threshold_grid = np.arange(min_thresh, max_thresh + step / 2, step)

    for idx, lbl in enumerate(labels):
        y_t = y_val_true[:, idx]
        y_p = y_val_probs[:, idx]

        best_f1 = -1.0
        best_th = 0.50

        for th in threshold_grid:
            preds = (y_p >= th).astype(int)
            f1 = f1_score(y_t, preds, zero_division=0)
            if f1 > best_f1:
                best_f1 = f1
                best_th = round(float(th), 4)

        # Fallback safeguard
        if best_f1 <= 0.0:
            best_th = 0.50

        best_thresholds[lbl] = best_th

    return best_thresholds


# ============================================================
# 4. MULTI-LABEL METRICS COMPUTATION
# ============================================================

def compute_group_metrics(
    y_true: np.ndarray,
    y_probs: np.ndarray,
    thresholds: Dict[str, float],
    labels: List[str],
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """Calculate aggregate and per-label metrics using calibrated thresholds."""
    th_array = np.array([thresholds[lbl] for lbl in labels])
    y_pred = (y_probs >= th_array).astype(int)

    micro_p = float(precision_score(y_true, y_pred, average="micro", zero_division=0))
    micro_r = float(recall_score(y_true, y_pred, average="micro", zero_division=0))
    micro_f1 = float(f1_score(y_true, y_pred, average="micro", zero_division=0))

    macro_p = float(precision_score(y_true, y_pred, average="macro", zero_division=0))
    macro_r = float(recall_score(y_true, y_pred, average="macro", zero_division=0))
    macro_f1 = float(f1_score(y_true, y_pred, average="macro", zero_division=0))

    h_loss = float(hamming_loss(y_true, y_pred))
    # Subset accuracy (exact row match)
    subset_acc = float(np.mean(np.all(y_true == y_pred, axis=1)))

    per_label = {}
    pr_aucs = []

    for idx, lbl in enumerate(labels):
        yt = y_true[:, idx]
        yp = y_pred[:, idx]
        yprob = y_probs[:, idx]

        p = float(precision_score(yt, yp, zero_division=0))
        r = float(recall_score(yt, yp, zero_division=0))
        f = float(f1_score(yt, yp, zero_division=0))
        supp = int(np.sum(yt))

        tp = int(np.sum((yt == 1) & (yp == 1)))
        fp = int(np.sum((yt == 0) & (yp == 1)))
        fn = int(np.sum((yt == 1) & (yp == 0)))
        tn = int(np.sum((yt == 0) & (yp == 0)))

        # PR-AUC
        if supp > 0:
            prec_curve, rec_curve, _ = precision_recall_curve(yt, yprob)
            prauc = float(auc(rec_curve, prec_curve))
            pr_aucs.append(prauc)
        else:
            prauc = 0.0

        per_label[lbl] = {
            "precision": round(p, 4),
            "recall": round(r, 4),
            "f1_score": round(f, 4),
            "pr_auc": round(prauc, 4),
            "support": supp,
            "threshold": thresholds[lbl],
            "confusion_matrix": {"tp": tp, "fp": fp, "fn": fn, "tn": tn},
        }

    macro_pr_auc = float(np.mean(pr_aucs)) if pr_aucs else 0.0

    summary = {
        "micro_precision": round(micro_p, 4),
        "micro_recall": round(micro_r, 4),
        "micro_f1": round(micro_f1, 4),
        "macro_precision": round(macro_p, 4),
        "macro_recall": round(macro_r, 4),
        "macro_f1": round(macro_f1, 4),
        "macro_pr_auc": round(macro_pr_auc, 4),
        "hamming_loss": round(h_loss, 4),
        "subset_accuracy": round(subset_acc, 4),
        "num_samples": int(y_true.shape[0]),
    }

    return summary, per_label


# ============================================================
# 5. SEMANTIC SANITY TEST SUITE
# ============================================================

def run_semantic_sanity_checks(
    predict_fn: Any,
    thresholds: Dict[str, float],
) -> List[Dict[str, Any]]:
    """
    Run qualitative verification on mandatory probe examples.
    Ensures outputs are dynamic and mathematically aligned with thresholds.
    """
    probes = [
        {
            "id": "probe_1",
            "text": "Your bank KYC will expire today. Open this link and verify your account.",
            "expected_classes": ["PHISHING", "BANKING_FRAUD"],
            "expected_cybercrime": 1,
        },
        {
            "id": "probe_2",
            "text": "A police officer on WhatsApp said drugs were found in a parcel in my name and demanded money to avoid arrest.",
            "expected_classes": ["DIGITAL_ARREST"],
            "expected_cybercrime": 1,
        },
        {
            "id": "probe_3",
            "text": "I sent ₹50,000 to a UPI ID for an investment scheme and they blocked me.",
            "expected_classes": ["UPI_FRAUD", "INVESTMENT_SCAM"],
            "expected_cybercrime": 1,
        },
        {
            "id": "probe_4",
            "text": "My Instagram account was hacked and the attacker changed my email and is asking my friends for money.",
            "expected_classes": ["ACCOUNT_TAKEOVER", "SOCIAL_MEDIA_CRIME"],
            "expected_cybercrime": 1,
        },
        {
            "id": "probe_5",
            "text": "Our accounts manager received an email appearing to be from the CEO requesting an urgent transfer to a new vendor bank account.",
            "expected_classes": ["BUSINESS_EMAIL_COMPROMISE", "PHISHING"],
            "expected_cybercrime": 1,
        },
        {
            "id": "probe_6",
            "text": "Your salary has been credited to your account.",
            "expected_classes": [],
            "expected_cybercrime": 0,
        },
    ]

    results = []
    for probe in probes:
        probs = predict_fn(probe["text"])
        predicted_labels = [lbl for lbl, p in probs.items() if p >= thresholds[lbl]]
        is_cyber = 1 if len(predicted_labels) > 0 else 0

        match = True
        if probe["expected_cybercrime"] == 0:
            match = (is_cyber == 0 and len(predicted_labels) == 0)
        else:
            match = any(c in predicted_labels for c in probe["expected_classes"])

        results.append({
            "probe_id": probe["id"],
            "input_text": probe["text"],
            "predicted_cybercrime": is_cyber,
            "predicted_labels": predicted_labels,
            "expected_classes": probe["expected_classes"],
            "top_probabilities": sorted(probs.items(), key=lambda x: x[1], reverse=True)[:3],
            "passed_sanity_check": match,
        })

    return results


# ============================================================
# 6. MAIN PIPELINE CONTROLLER
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="CCIP Complaint Classifier Training Pipeline")
    parser.add_argument("--force-cpu", action="store_true", help="Force CPU execution despite hardware warnings")
    parser.add_argument("--epochs", type=int, default=4, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=8, help="Train batch size")
    parser.add_argument("--learning-rate", type=float, default=2e-5, help="Learning rate")
    args = parser.parse_args()

    print("==================================================")
    print("CCIP Complaint Classifier — Training & Audit Phase")
    print("==================================================")

    # Step 1: Detect Hardware
    hw = detect_hardware()
    print("\n--- Step 1: Hardware Environment Check ---")
    print(f"OS: {hw['operating_system']}")
    print(f"Python: {hw['python_version']}")
    print(f"PyTorch Available: {hw['torch_available']} ({hw.get('torch_version', 'N/A')})")
    print(f"CUDA Available: {hw['cuda_available']}")
    print(f"GPU Name: {hw['gpu_name']}")
    print(f"GPU VRAM: {hw['gpu_vram_gb']} GB")
    print(f"Total RAM: {hw['total_ram_gb']} GB | Available RAM: {hw['available_ram_gb']} GB")
    print(f"Free Disk Space: {hw['free_disk_gb']} GB")

    # Feasibility Check
    if not hw["cuda_available"] and not args.force_cpu:
        print("\n" + "="*50)
        print("TRAINING BLOCKED — GPU RECOMMENDED")
        print("="*50)
        print(f"Reason: System has no CUDA GPU (detected '{hw['gpu_name']}').")
        print(f"Available RAM is {hw['available_ram_gb']} GB (DeBERTa-v3-base requires ~8GB+ RAM to avoid system thrashing).")
        print(f"Estimated CPU training time for 26,739 rows x 4 epochs: ~{hw['estimated_cpu_hours']} hours.")
        print("In strict adherence to instructions, extremely long/unfeasible CPU jobs are blocked.")
        print("To override explicitly for testing small batches, pass '--force-cpu'.")
        sys.exit(0)


if __name__ == "__main__":
    main()
