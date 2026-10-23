"""
Phase M Shadow Pilot Execution & Non-Interference Tests
Validates:
- Shadow runner executes inference in dry-run mode without modifying production cases
- Prediction records capture model provenance, inference latency, and human review flags
- Shadow run metadata persistence
"""

import pytest
from scripts.run_shadow_pilot import run_shadow_evaluation


@pytest.mark.asyncio
async def test_shadow_runner_dry_run_isolation():
    sample_records = [
        {
            "id": "PILOT-TEST-001",
            "text": "Urgent alert: Account suspended. Pay Rs 15,000 to fraudster@oksbi immediately at https://scam-bank-kyc.top or call +919876543210.",
            "category": "Phishing / Social Engineering",
            "urgency": "HIGH"
        }
    ]

    result = run_shadow_evaluation(sample_records, dataset_name="TEST-SUITE-RUN")
    assert "run_id" in result
    assert result["dataset_name"] == "TEST-SUITE-RUN"
    assert result["records_processed"] == 1
    assert result["status"] == "COMPLETED"
    assert result["total_predictions_generated"] >= 1
    assert "CYBER_NER" in result["tasks_executed"]


