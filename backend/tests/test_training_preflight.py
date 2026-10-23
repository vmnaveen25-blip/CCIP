"""
Test Suite: Training Pre-flight Validation & Quality Gate Verification
"""

import pytest
from app.ai.trainers import get_trainer
from app.ai.trainers.structured_trainer import StructuredTrainer
from app.ai.trainers.text_classifier import TextClassifierTrainer


def test_structured_trainer_preflight():
    trainer = get_trainer("feedback_gate", "STRUCTURED_CLASSIFICATION")
    assert isinstance(trainer, StructuredTrainer)
    assert trainer.supports_local_cpu_training() is True

    checks = trainer.validate_preflight({"epochs": 5, "learning_rate": 0.001})
    check_names = [c["name"] for c in checks]
    assert "model_selected" in check_names
    assert "dataset_approved" in check_names
    assert "label_compatibility" in check_names
    assert "runtime_available" in check_names
    assert "disk_space" in check_names
    assert all(c["status"] == "PASS" for c in checks)


def test_text_classifier_preflight_warns_on_cpu():
    trainer = get_trainer("complaint_classifier", "MULTI_LABEL_CLASSIFICATION")
    assert isinstance(trainer, TextClassifierTrainer)

    checks = trainer.validate_preflight({"epochs": 4})
    runtime_check = [c for c in checks if c["name"] == "runtime_available"][0]
    # Since host is CPU-only, runtime check must return WARN or PASS depending on CUDA
    import torch
    if not torch.cuda.is_available():
        assert runtime_check["status"] == "WARN"
        assert "CPU-only" in runtime_check["message"]


def test_quality_gate_evaluation():
    trainer = get_trainer("feedback_gate", "STRUCTURED_CLASSIFICATION")

    # Case 1: All pass
    metrics_pass = {"validation_f1": 0.92, "test_f1": 0.88}
    gates = {"metric": "validation_f1", "minimum_validation": 0.80, "minimum_test": 0.75}
    res_pass = trainer.evaluate_quality_gates(metrics_pass, gates)
    assert res_pass["status"] == "PASS"

    # Case 2: Validation fails threshold
    metrics_fail = {"validation_f1": 0.72, "test_f1": 0.70}
    res_fail = trainer.evaluate_quality_gates(metrics_fail, gates)
    assert res_fail["status"] == "FAIL"

    # Case 3: Challenge set failure
    gates_challenge = {
        "metric": "validation_f1",
        "minimum_validation": 0.80,
        "minimum_test": 0.75,
        "challenge_set_required": True,
        "minimum_challenge": 0.65
    }
    metrics_challenge_fail = {
        "validation_f1": 0.92,
        "test_f1": 0.88,
        "challenge_score": 0.45
    }
    res_chal = trainer.evaluate_quality_gates(metrics_challenge_fail, gates_challenge)
    assert res_chal["status"] == "FAIL"
