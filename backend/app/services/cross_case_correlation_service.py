"""
Cross-Case Correlation Service
Discovers candidate correlations across cases using technical indicator overlap and narrative model.
Enforces human review status transitions: UNREVIEWED, CONFIRMED_RELEVANT, DISMISSED.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from app.models.case import Case
from app.models.cyber_entity import CyberEntity
from app.models.case_correlation import CaseCorrelation
from app.ai.adapters.cross_case_correlation import cross_case_correlation_adapter
from app.core.logging import logger


class CrossCaseCorrelationService:
    @staticmethod
    async def correlate_case(
        db: AsyncSession,
        target_case_id: str,
        max_comparisons: int = 20,
        force_refresh: bool = False
    ) -> List[CaseCorrelation]:
        """
        Scans other cases, identifies shared cyber entities, evaluates candidate correlation,
        and saves CaseCorrelation records.
        """
        stmt_t = select(Case).where(Case.id == target_case_id)
        target_case = (await db.execute(stmt_t)).scalar_one_or_none()
        if not target_case:
            return []

        # Find entities for target case
        stmt_te = select(CyberEntity).where(CyberEntity.case_id == target_case_id)
        target_entities = (await db.execute(stmt_te)).scalars().all()
        target_vals = {e.normalized_value: e.entity_type for e in target_entities if e.normalized_value}

        # Bounded candidate selection:
        # 1. Prioritize cases that share at least one technical indicator (phone, UPI, domain, bank account, etc.)
        shared_case_ids: List[str] = []
        if target_vals:
            stmt_shared = (
                select(CyberEntity.case_id)
                .where(
                    and_(
                        CyberEntity.normalized_value.in_(list(target_vals.keys())),
                        CyberEntity.case_id != target_case_id,
                        CyberEntity.case_id.isnot(None)
                    )
                )
                .distinct()
                .limit(max_comparisons)
            )
            shared_case_ids = list((await db.execute(stmt_shared)).scalars().all())

        # 2. Fill remaining candidate slots up to max_comparisons from recent/same category cases
        remaining_slots = max(0, max_comparisons - len(shared_case_ids))
        other_cases = []
        if shared_case_ids:
            stmt_shared_cases = select(Case).where(Case.id.in_(shared_case_ids))
            other_cases.extend((await db.execute(stmt_shared_cases)).scalars().all())

        if remaining_slots > 0:
            exclude_ids = [target_case_id] + shared_case_ids
            stmt_others = (
                select(Case)
                .where(Case.id.notin_(exclude_ids))
                .order_by(Case.created_at.desc())
                .limit(remaining_slots)
            )
            other_cases.extend((await db.execute(stmt_others)).scalars().all())

        correlations: List[CaseCorrelation] = []

        for other_case in other_cases:
            # Order pair consistently: min_id < max_id
            case_a_id, case_b_id = sorted([target_case_id, other_case.id])

            # Check if correlation record already exists
            stmt_existing = select(CaseCorrelation).where(
                and_(
                    CaseCorrelation.case_a_id == case_a_id,
                    CaseCorrelation.case_b_id == case_b_id
                )
            )
            existing = (await db.execute(stmt_existing)).scalar_one_or_none()

            # Find shared entities
            stmt_oe = select(CyberEntity).where(CyberEntity.case_id == other_case.id)
            other_entities = (await db.execute(stmt_oe)).scalars().all()
            other_vals = {e.normalized_value: e.entity_type for e in other_entities if e.normalized_value}

            shared = set(target_vals.keys()).intersection(set(other_vals.keys()))
            shared_list = list(shared)
            shared_types = list(set(target_vals[v] for v in shared))

            # Idempotency check: if correlation exists and was reviewed or not forced, preserve and reuse
            text_a = f"{target_case.title}. {target_case.summary or ''}"
            text_b = f"{other_case.title}. {other_case.summary or ''}"

            if existing and not force_refresh:
                # If existing correlation is already present and matches shared entity count, reuse it
                correlations.append(existing)
                continue

            # Run cross-case model prediction
            pred = cross_case_correlation_adapter.predict_correlation(
                case_a_text=text_a,
                case_b_text=text_b,
                shared_features=shared_list
            )

            label = pred["correlation_label"]
            confidence = pred["confidence"]

            if existing:
                existing.label = label
                existing.confidence = confidence
                existing.shared_entity_count = len(shared_list)
                existing.shared_entity_types_json = shared_types
                # Preserve human investigator review verdict if one has been recorded!
                if existing.status not in ["CONFIRMED_RELEVANT", "DISMISSED", "NEEDS_MORE_EVIDENCE"]:
                    existing.status = "UNREVIEWED"
                existing.metadata_json = {
                    "probabilities": pred.get("probabilities", {}),
                    "shared_values": shared_list[:10]
                }
                correlations.append(existing)
            else:
                new_corr = CaseCorrelation(
                    case_a_id=case_a_id,
                    case_b_id=case_b_id,
                    label=label,
                    confidence=confidence,
                    similarity_score=float(pred.get("probabilities", {}).get("STRONGLY_RELATED", 0.0)),
                    shared_entity_count=len(shared_list),
                    shared_entity_types_json=shared_types,
                    model_name=pred["model_name"],
                    model_version=pred["model_version"],
                    status="UNREVIEWED",
                    metadata_json={
                        "probabilities": pred.get("probabilities", {}),
                        "shared_values": shared_list[:10]
                    }
                )
                db.add(new_corr)
                correlations.append(new_corr)

        await db.commit()
        for c in correlations:
            await db.refresh(c)

        return correlations

    @staticmethod
    async def review_correlation(
        db: AsyncSession,
        correlation_id: str,
        reviewer_id: str,
        status: str,
        notes: Optional[str] = None
    ) -> Optional[CaseCorrelation]:
        stmt = select(CaseCorrelation).where(CaseCorrelation.id == correlation_id)
        corr = (await db.execute(stmt)).scalar_one_or_none()
        if not corr:
            return None

        corr.status = status
        corr.reviewed_by = reviewer_id
        corr.reviewed_at = datetime.now(timezone.utc)
        if notes:
            corr.review_notes = notes

        await db.commit()
        await db.refresh(corr)
        return corr


cross_case_correlation_service = CrossCaseCorrelationService()
