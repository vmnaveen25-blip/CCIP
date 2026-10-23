"""
Case Similarity Service
Identifies similar cases and complaints across the enclave using the 384-d semantic embedding model.
Enforces non-accusatory advisory warnings.
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.case import Case
from app.models.complaint import Complaint
from app.models.investigation import Investigation
from app.models.investigation_finding import InvestigationFinding
from app.ai.adapters.case_similarity import case_similarity_adapter
from app.core.logging import logger


class CaseSimilarityService:
    @staticmethod
    async def find_similar_cases_for_case(
        db: AsyncSession,
        target_case_id: str,
        limit: int = 5,
        threshold: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Scans other cases in the enclave, computes cosine similarity between case descriptions,
        and returns top similar cases.
        """
        stmt = select(Case).where(Case.id == target_case_id)
        result = await db.execute(stmt)
        target_case = result.scalar_one_or_none()

        if not target_case:
            return {"error": f"Target case {target_case_id} not found."}

        target_text = f"{target_case.title}\n{target_case.summary or ''}"
        if not target_text.strip():
            return {"case_id": target_case_id, "similar_cases": [], "total_scanned": 0}

        # Query other cases with bounded candidate selection
        stmt_others = (
            select(Case)
            .where(Case.id != target_case_id)
            .order_by(Case.created_at.desc())
            .limit(50)  # Bounded enclave candidate scan limit
        )
        res_others = await db.execute(stmt_others)
        other_cases = res_others.scalars().all()

        scored_matches = []
        eff_threshold = threshold if threshold is not None else case_similarity_adapter._threshold

        for c in other_cases:
            c_text = f"{c.title}\n{c.summary or ''}"
            if not c_text.strip():
                continue
            pair_eval = case_similarity_adapter.score_text_pair(target_text, c_text)
            sim_score = pair_eval["similarity_score"]
            if sim_score >= eff_threshold:
                scored_matches.append({
                    "case_id": c.id,
                    "case_number": c.case_number,
                    "title": c.title,
                    "category": getattr(c, "priority", "MEDIUM"),
                    "status": c.status.value if hasattr(c.status, "value") else str(c.status),
                    "priority": c.priority.value if hasattr(c.priority, "value") else str(c.priority),
                    "similarity_score": sim_score,
                    "is_candidate_match": True,
                    "created_at": c.created_at.isoformat() if c.created_at else None
                })

        scored_matches.sort(key=lambda x: x["similarity_score"], reverse=True)
        top_matches = scored_matches[:limit]

        return {
            "target_case_id": target_case_id,
            "target_case_number": target_case.case_number,
            "threshold": eff_threshold,
            "total_scanned": len(other_cases),
            "matches_found": len(top_matches),
            "similar_cases": top_matches,
            "advisory_warning": "Semantic similarity indicates narrative and category overlap; it does not establish a common offender, criminal syndicate, or legal guilt."
        }


case_similarity_service = CaseSimilarityService()
