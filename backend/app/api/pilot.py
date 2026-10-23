from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
import uuid

from app.db.database import get_db
from app.models.pilot import (
    PilotDatasetRegistry,
    PilotEvaluationRun,
    PilotPrediction,
    PilotHumanReview
)
from app.models.user import User
from app.schemas.pilot import (
    PilotDatasetCreate,
    PilotDatasetResponse,
    PilotRunCreate,
    PilotRunResponse,
    PilotPredictionCreate,
    PilotPredictionResponse,
    PilotReviewCreate,
    PilotReviewResponse
)
from app.core.permissions import require_staff, require_aiml
from app.core.logging import logger

router = APIRouter(prefix="/pilot", tags=["Pilot Evaluation & Validation"])


# --- Datasets ---
@router.get("/datasets", response_model=List[PilotDatasetResponse])
async def list_pilot_datasets(
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """List approved pilot datasets registered in the enclave."""
    q = select(PilotDatasetRegistry).order_by(desc(PilotDatasetRegistry.created_at))
    res = await db.execute(q)
    return res.scalars().all()


@router.post("/datasets", response_model=PilotDatasetResponse, status_code=status.HTTP_201_CREATED)
async def register_pilot_dataset(
    req: PilotDatasetCreate,
    current_user: User = Depends(require_aiml),
    db: AsyncSession = Depends(get_db)
):
    """Register a new pilot evaluation dataset under governance authorization."""
    # Check duplicate name
    existing = await db.execute(select(PilotDatasetRegistry).where(PilotDatasetRegistry.name == req.name))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Dataset with name '{req.name}' is already registered."
        )

    dataset = PilotDatasetRegistry(
        id=str(uuid.uuid4()),
        name=req.name,
        source_type=req.source_type.value,
        source_description=req.source_description,
        authorization_basis=req.authorization_basis,
        deidentified=req.deidentified,
        contains_pii=req.contains_pii,
        allowed_purposes_json=req.allowed_purposes,
        retention_policy=req.retention_policy,
        storage_location_ref=req.storage_location_ref,
        created_by=current_user.id,
        created_at=datetime.now(timezone.utc),
        expires_at=req.expires_at,
        status="APPROVED"
    )
    db.add(dataset)
    await db.commit()
    await db.refresh(dataset)
    logger.info(f"Pilot dataset registered: {dataset.name} ({dataset.source_type}) by {current_user.email}")
    return dataset


@router.get("/datasets/{dataset_id}", response_model=PilotDatasetResponse)
async def get_pilot_dataset(
    dataset_id: str,
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve specific pilot dataset metadata."""
    res = await db.execute(select(PilotDatasetRegistry).where(PilotDatasetRegistry.id == dataset_id))
    dataset = res.scalars().first()
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pilot dataset not found.")
    return dataset


@router.patch("/datasets/{dataset_id}/status", response_model=PilotDatasetResponse)
async def update_pilot_dataset_status(
    dataset_id: str,
    status: str = Query(...),
    current_user: User = Depends(require_aiml),
    db: AsyncSession = Depends(get_db)
):
    """Update dataset lifecycle status."""
    res = await db.execute(select(PilotDatasetRegistry).where(PilotDatasetRegistry.id == dataset_id))
    dataset = res.scalars().first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Pilot dataset not found.")
    dataset.status = status
    await db.commit()
    await db.refresh(dataset)
    return dataset


# --- Evaluation Runs ---
@router.post("/runs", response_model=PilotRunResponse, status_code=status.HTTP_201_CREATED)
async def create_pilot_run(
    req: PilotRunCreate,
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """Record a shadow or supervised pilot evaluation run."""
    # Verify dataset exists
    ds_res = await db.execute(select(PilotDatasetRegistry).where(PilotDatasetRegistry.id == req.dataset_id))
    dataset = ds_res.scalars().first()
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specified dataset not found.")

    run = PilotEvaluationRun(
        id=str(uuid.uuid4()),
        dataset_id=req.dataset_id,
        started_at=datetime.now(timezone.utc),
        model_versions_json=req.model_versions,
        status="RUNNING",
        created_by=current_user.id
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)
    return run


@router.get("/runs", response_model=List[PilotRunResponse])
async def list_pilot_runs(
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """List all recorded pilot evaluation runs."""
    q = select(PilotEvaluationRun).order_by(desc(PilotEvaluationRun.started_at))
    res = await db.execute(q)
    return res.scalars().all()


@router.patch("/runs/{run_id}/complete", response_model=PilotRunResponse)
async def complete_pilot_run(
    run_id: str,
    status_str: str = "COMPLETED",
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """Mark a pilot run as completed or failed."""
    res = await db.execute(select(PilotEvaluationRun).where(PilotEvaluationRun.id == run_id))
    run = res.scalars().first()
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pilot run not found.")
    run.status = status_str
    run.finished_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(run)
    return run


# --- Predictions ---
@router.post("/predictions", response_model=PilotPredictionResponse, status_code=status.HTTP_201_CREATED)
async def record_pilot_prediction(
    req: PilotPredictionCreate,
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """Record an individual model inference output generated during pilot validation."""
    pred = PilotPrediction(
        id=str(uuid.uuid4()),
        run_id=req.run_id,
        record_ref=req.record_ref,
        task=req.task,
        model_name=req.model_name,
        model_version=req.model_version,
        prediction_json=req.prediction_json,
        confidence_json=req.confidence_json,
        created_at=datetime.now(timezone.utc)
    )
    db.add(pred)
    await db.commit()
    await db.refresh(pred)
    return pred


@router.get("/predictions", response_model=List[PilotPredictionResponse])
async def list_pilot_predictions(
    task: Optional[str] = None,
    run_id: Optional[str] = None,
    model_name: Optional[str] = None,
    limit: int = Query(50, le=200),
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve pilot predictions with optional filtering."""
    q = select(PilotPrediction)
    if task:
        q = q.where(PilotPrediction.task == task)
    if run_id:
        q = q.where(PilotPrediction.run_id == run_id)
    if model_name:
        q = q.where(PilotPrediction.model_name == model_name)
    q = q.order_by(desc(PilotPrediction.created_at)).limit(limit)
    res = await db.execute(q)
    return res.scalars().all()


# --- Human Reviews ---
@router.post("/reviews", response_model=PilotReviewResponse, status_code=status.HTTP_201_CREATED)
async def submit_pilot_human_review(
    req: PilotReviewCreate,
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """Submit a human-in-the-loop validation review for a pilot prediction."""
    # Verify prediction exists
    p_res = await db.execute(select(PilotPrediction).where(PilotPrediction.id == req.prediction_id))
    pred = p_res.scalars().first()
    if not pred:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target prediction not found.")

    review = PilotHumanReview(
        id=str(uuid.uuid4()),
        prediction_id=req.prediction_id,
        reviewer_id=current_user.id,
        decision=req.decision.value,
        correct=req.correct,
        correction_label=req.correction_label,
        notes_redacted=req.notes_redacted,
        reviewed_at=datetime.now(timezone.utc)
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    logger.info(f"Human review logged for prediction {pred.id} ({req.decision.value}) by {current_user.email}")
    return review


@router.get("/reviews", response_model=List[PilotReviewResponse])
async def list_pilot_human_reviews(
    limit: int = Query(50, le=200),
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """List recent human validation reviews."""
    q = select(PilotHumanReview).order_by(desc(PilotHumanReview.reviewed_at)).limit(limit)
    res = await db.execute(q)
    return res.scalars().all()


@router.get("/metrics/summary")
async def get_pilot_metrics_summary(
    current_user: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db)
):
    """Aggregate summary statistics across pilot runs, predictions, and human reviews."""
    total_datasets = (await db.execute(select(func.count(PilotDatasetRegistry.id)))).scalar() or 0
    total_runs = (await db.execute(select(func.count(PilotEvaluationRun.id)))).scalar() or 0
    total_predictions = (await db.execute(select(func.count(PilotPrediction.id)))).scalar() or 0
    total_reviews = (await db.execute(select(func.count(PilotHumanReview.id)))).scalar() or 0

    agreed = (await db.execute(select(func.count(PilotHumanReview.id)).where(PilotHumanReview.decision == "AGREE"))).scalar() or 0
    disagreed = (await db.execute(select(func.count(PilotHumanReview.id)).where(PilotHumanReview.decision == "DISAGREE"))).scalar() or 0
    unsure = (await db.execute(select(func.count(PilotHumanReview.id)).where(PilotHumanReview.decision == "UNSURE"))).scalar() or 0

    agreement_rate = round((agreed / total_reviews * 100), 2) if total_reviews > 0 else 0.0
    override_rate = round((disagreed / total_reviews * 100), 2) if total_reviews > 0 else 0.0

    return {
        "status": "PILOT_MONITORING_ACTIVE",
        "datasets_count": total_datasets,
        "evaluation_runs_count": total_runs,
        "predictions_logged": total_predictions,
        "human_reviews_logged": total_reviews,
        "decisions": {
            "agree": agreed,
            "disagree": disagreed,
            "unsure": unsure
        },
        "agreement_rate_pct": agreement_rate,
        "override_rate_pct": override_rate
    }
