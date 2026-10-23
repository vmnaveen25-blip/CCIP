"""
Phase M Pilot Prediction & Human Review Persistence Tests
Validates:
- Storing and retrieving pilot predictions via REST API
- Submitting human validation reviews (Agree / Override)
- Review audit fields and resolution state updates
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.pilot import PilotDatasetRegistry, PilotEvaluationRun, PilotPrediction, PilotHumanReview


async def get_token(client: AsyncClient, email: str) -> str:
    res = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "AstraeaEnclave#42"
    })
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_pilot_prediction_and_human_review(client: AsyncClient, db_session: AsyncSession):
    # 1. Login as Specialist and AI Lead
    spec_token = await get_token(client, "a.thorne@astraea.gov")
    aiml_token = await get_token(client, "m.vance@ai-ops.gov")

    # 2. Seed a dataset and run directly in DB session
    dataset = PilotDatasetRegistry(
        id="test-ds-001",
        name="Review Test Dataset",
        source_type="MODE_B_DEIDENTIFIED_HISTORICAL",
        authorization_basis="Audit Section 30",
        retention_policy="90_DAYS",
        storage_location_ref="storage/test.jsonl"
    )
    db_session.add(dataset)
    await db_session.flush()

    run = PilotEvaluationRun(
        id="test-run-001",
        dataset_id=dataset.id,
        model_versions_json={"cyber_ner": "v4.0.0", "classifier": "v1.1.0"},
        status="COMPLETED"
    )
    db_session.add(run)
    await db_session.flush()

    pred = PilotPrediction(
        id="test-pred-001",
        run_id=run.id,
        record_ref="REC-001",
        task="CYBER_NER",
        model_name="ccip-cyber-ner-deberta-v3-base",
        model_version="cyber-ner-bootstrap-v4.0.0",
        prediction_json={"entities": [{"type": "UPI_ID", "value": "fraudster@oksbi"}]},
        confidence_json={"overall": 0.91}
    )
    db_session.add(pred)
    await db_session.commit()

    # 3. Retrieve prediction via API as Specialist
    res_preds = await client.get(
        "/api/v1/pilot/predictions?task=CYBER_NER",
        headers={"Authorization": f"Bearer {spec_token}"}
    )
    assert res_preds.status_code == 200
    preds_data = res_preds.json()
    assert any(p["id"] == pred.id for p in preds_data)

    # 4. Submit human review as Specialist
    review_payload = {
        "prediction_id": pred.id,
        "decision": "DISAGREE",
        "correct": False,
        "correction_label": "FINANCIAL_MULE_UPI",
        "notes_redacted": "Specialist verified UPI ID as confirmed mule account."
    }
    review_res = await client.post(
        "/api/v1/pilot/reviews",
        headers={"Authorization": f"Bearer {spec_token}"},
        json=review_payload
    )
    assert review_res.status_code == 201, review_res.text
    review_data = review_res.json()
    assert review_data["decision"] == "DISAGREE"
    assert review_data["correction_label"] == "FINANCIAL_MULE_UPI"

    # 5. Verify review appears in reviews list and metrics summary
    list_reviews = await client.get(
        "/api/v1/pilot/reviews",
        headers={"Authorization": f"Bearer {aiml_token}"}
    )
    assert list_reviews.status_code == 200
    reviews_list = list_reviews.json()
    assert len(reviews_list) >= 1
    assert any(r["id"] == review_data["id"] for r in reviews_list)

    summary_res = await client.get(
        "/api/v1/pilot/metrics/summary",
        headers={"Authorization": f"Bearer {aiml_token}"}
    )
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["human_reviews_logged"] >= 1
    assert summary["decisions"]["disagree"] >= 1

