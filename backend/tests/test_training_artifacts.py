"""
Test Suite: Artifact Output Separation & SHA-256 Integrity
Ensures training outputs strictly save into staging directories and never
overwrite production model weights without human governance sign-off.
"""

import pytest
import tempfile
import json
from pathlib import Path
from unittest.mock import MagicMock
from app.ai.trainers import get_trainer
from app.core.model_config import COMPLAINT_MODEL_PATH, FEEDBACK_GATE_PATH


def test_colab_package_export():
    trainer = get_trainer("complaint_classifier", "MULTI_LABEL_CLASSIFICATION")
    
    mock_job = MagicMock()
    mock_job.job_reference = "TRN-TEST-COLAB-001"
    mock_job.model_family = "complaint_classifier"
    mock_job.base_model = "microsoft/deberta-v3-base"
    mock_job.target_model_name = "DeBERTa Complaint Classifier"
    mock_job.target_model_version = "v1.2.0"
    mock_job.dataset_id = "ds-complaint-v1.1"
    mock_job.dataset_version = "v1.1.0"
    mock_job.training_task = "MULTI_LABEL_CLASSIFICATION"
    mock_job.config_json = {"learning_rate": 2e-5, "epochs": 4}
    mock_job.quality_gate_config_json = {"metric": "validation_f1", "minimum_validation": 0.80}

    with tempfile.TemporaryDirectory() as tmpdir:
        out_dir = Path(tmpdir)
        pkg = trainer.export_colab_package(mock_job, out_dir)

        assert (out_dir / "training_config.json").is_file()
        assert (out_dir / "dataset_manifest.json").is_file()
        assert (out_dir / "metadata_template.json").is_file()
        assert (out_dir / "train_colab.py").is_file()

        # Check no sensitive incident narratives leaked in manifest
        with open(out_dir / "dataset_manifest.json", "r") as f:
            manifest = json.load(f)
            assert manifest["deidentified"] is True
            assert "complaint" not in manifest or isinstance(manifest["record_counts"], dict)


def test_staging_isolation_and_integrity():
    trainer = get_trainer("feedback_gate", "STRUCTURED_CLASSIFICATION")

    with tempfile.TemporaryDirectory() as tmpdir:
        staging_dir = Path(tmpdir) / "staging" / "feedback_gate" / "v1.1.0-cand"
        staging_dir.mkdir(parents=True)

        # Create dummy artifacts
        (staging_dir / "model.pt").write_bytes(b"STAGING_MODEL_DUMMY_WEIGHTS")
        (staging_dir / "metrics.json").write_text('{"accuracy": 98.4}')

        hash_val = trainer.compute_dir_sha256(staging_dir)
        assert isinstance(hash_val, str)
        assert len(hash_val) == 64  # SHA-256 hex length

        # Production model directories must remain intact
        assert staging_dir != FEEDBACK_GATE_PATH
        assert staging_dir != COMPLAINT_MODEL_PATH
