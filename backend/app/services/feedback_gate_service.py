"""
Feedback Gate Service
Controlled continual-learning qualification service.
Applies deterministic governance hard gates and neural scoring to qualify closed case feedback into LearningCandidate records.
Strict human oversight by AI Lead.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.case import Case
from app.models.learning_candidate import LearningCandidate
from app.ai.adapters.feedback_gate import feedback_gate_adapter
from app.core.logging import logger


class FeedbackGateService:
    @staticmethod
    async def evaluate_and_enqueue_candidate(
        db: AsyncSession,
        case_id: str,
        target_model: str,
        feature_dict: Dict[str, Any],
        source_finding_id: Optional[str] = None
    ) -> LearningCandidate:
        """
        Evaluates candidate case outcome using the feedback gate adapter.
        Creates and persists a LearningCandidate record with gate outcome and reason.
        """
        eval_res = feedback_gate_adapter.evaluate(feature_dict)

        candidate = LearningCandidate(
            case_id=case_id,
            source_finding_id=source_finding_id,
            target_model=target_model,
            decision=eval_res["decision"],
            gate_source=eval_res["gate_source"],
            reason=eval_res["reason"],
            confidence=eval_res["confidence"],
            model_name=eval_res["model_name"],
            model_version=eval_res["model_version"],
            feature_snapshot_json=feature_dict,
            review_status="PENDING" if eval_res["decision"] == "APPROVE_CANDIDATE" else "REJECTED",
            metadata_json={
                "probabilities": eval_res.get("probabilities", {}),
                "hard_gate_passed": eval_res.get("hard_gate_passed", False)
            }
        )

        db.add(candidate)
        await db.commit()
        await db.refresh(candidate)
        return candidate

    @staticmethod
    async def list_candidates(
        db: AsyncSession,
        status: Optional[str] = None,
        target_model: Optional[str] = None,
        limit: int = 50
    ) -> List[LearningCandidate]:
        stmt = select(LearningCandidate)
        if status:
            stmt = stmt.where(LearningCandidate.review_status == status)
        if target_model:
            stmt = stmt.where(LearningCandidate.target_model == target_model)
        stmt = stmt.order_by(LearningCandidate.created_at.desc()).limit(limit)
        res = await db.execute(stmt)
        return res.scalars().all()

    @staticmethod
    async def review_candidate(
        db: AsyncSession,
        candidate_id: str,
        reviewer_id: str,
        new_status: str,  # APPROVED_FOR_DATASET, REJECTED, QUARANTINED
        notes: Optional[str] = None
    ) -> Optional[LearningCandidate]:
        stmt = select(LearningCandidate).where(LearningCandidate.id == candidate_id)
        cand = (await db.execute(stmt)).scalar_one_or_none()
        if not cand:
            return None

        cand.review_status = new_status
        cand.reviewed_by = reviewer_id
        cand.reviewed_at = datetime.now(timezone.utc)
        if notes:
            cand.review_notes = notes

        await db.commit()
        await db.refresh(cand)
        return cand


feedback_gate_service = FeedbackGateService()
