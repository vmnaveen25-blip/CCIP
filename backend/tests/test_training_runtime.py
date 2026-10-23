"""
Test Suite: Truthful Training Runtime Detection & Telemetry
Verifies that hardware compute telemetry honestly reports local CPU host stats
and does NOT fabricate an A100 GPU cluster or fictitious hardware accelerators.
"""

import pytest
from app.services.training_runtime_service import get_runtime_telemetry


def test_truthful_runtime_telemetry():
    telemetry = get_runtime_telemetry()

    assert "runtime_type" in telemetry
    assert telemetry["runtime_type"] in ["LOCAL_CPU", "LOCAL_CUDA"]

    # On this local Windows environment, CUDA is False
    assert isinstance(telemetry["cuda_available"], bool)
    if not telemetry["cuda_available"]:
        assert telemetry["gpu_count"] == 0
        assert telemetry["gpu_name"] is None
        assert telemetry["gpu_status"] == "NOT_AVAILABLE"
        assert "DISTRIBUTED_A100_CLUSTER" in telemetry["unsupported_execution_modes"]

    # System resources must be real positive measurements
    assert telemetry["cpu_count"] >= 1
    assert telemetry["cpu_physical"] >= 1
    assert telemetry["total_ram_gb"] > 0
    assert telemetry["available_ram_gb"] > 0
    assert telemetry["disk_total_gb"] > 0
    assert telemetry["disk_free_gb"] > 0

    # Software versions must be strings
    assert len(telemetry["python_version"]) > 0
    assert len(telemetry["torch_version"]) > 0
    assert len(telemetry["transformers_version"]) > 0

    # Must explain honest compute reality
    assert "explanation" in telemetry
    assert "A100" not in (telemetry["gpu_name"] or "")
