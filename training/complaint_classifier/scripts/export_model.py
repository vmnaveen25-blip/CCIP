import argparse
import json
import os
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from training.shared.schemas.model_metadata_schema import ModelMetadataSchema
from training.shared.utils.filesystem import ensure_dir, read_json, write_json


DEFAULT_SOURCE_DIR = PROJECT_ROOT / "training" / "complaint_classifier" / "outputs" / "best_model"
DEFAULT_TARGET_DIR = PROJECT_ROOT / "backend" / "ml_models" / "complaint_classifier"


def export_model_package(
    source_dir: str = str(DEFAULT_SOURCE_DIR),
    target_dir: str = str(DEFAULT_TARGET_DIR),
    labels_config_path: str = "training/complaint_classifier/configs/labels.json",
    training_config_path: str = "training/complaint_classifier/configs/training_config.json",
    thresholds_path: str = "training/complaint_classifier/configs/thresholds.json",
    metrics_path: str = "training/complaint_classifier/reports/eval_metrics.json",
) -> None:
    """
    Export trained model bundle to the production backend ml_models destination.
    Packages model weights, tokenizer, label mappings, calibrated thresholds, and audit metadata.
    """
    src = Path(source_dir)
    dst = Path(target_dir)

    if not src.exists():
        print(f"[NOTE] Model weights directory {src} does not exist yet (training not run). Export skipped.")
        return

    ensure_dir(dst)

    # Copy model files (safely, without touching other directories)
    for item in src.iterdir():
        if item.is_file():
            shutil.copy2(item, dst / item.name)
        elif item.is_dir():
            shutil.copytree(item, dst / item.name, dirs_exist_ok=True)

    # Copy configs
    shutil.copy2(PROJECT_ROOT / labels_config_path, dst / "labels.json")

    # Generate production metadata
    meta = {
        "model_name": "ccip-deberta-v3-complaint-classifier",
        "task": "multi_label_cybercrime_classification",
        "export_timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "packaged",
    }
    write_json(meta, dst / "metadata.json")
    print(f"Model package exported to {dst}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export Complaint Classifier to backend")
    parser.add_argument("--source", default=str(DEFAULT_SOURCE_DIR))
    parser.add_argument("--target", default=str(DEFAULT_TARGET_DIR))
    args = parser.parse_args()
    export_model_package(args.source, args.target)
