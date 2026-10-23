"""
Relation Extraction Service
Predicts and persists relationships between cyber entities extracted from a complaint or case.
Idempotently saves to cyber_entity_relations table.
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.case import Case
from app.models.cyber_entity import CyberEntity
from app.models.cyber_entity_relation import CyberEntityRelation
from app.models.complaint import Complaint
from app.ai.adapters.relation_extraction import relation_extraction_adapter
from app.core.logging import logger


class RelationExtractionService:
    @staticmethod
    async def extract_and_persist_relations_for_complaint(
        db: AsyncSession,
        complaint_id: str,
        case_id: Optional[str] = None,
        confidence_threshold: float = 0.50
    ) -> List[CyberEntityRelation]:
        """
        Gathers extracted cyber entities for a complaint, pairs relevant candidates,
        predicts relations with the transformer model, and persists non-trivial relations.
        """
        # Fetch complaint
        stmt_c = select(Complaint).where(Complaint.id == complaint_id)
        res_c = await db.execute(stmt_c)
        complaint = res_c.scalar_one_or_none()
        if not complaint:
            logger.warning(f"Complaint {complaint_id} not found for relation extraction.")
            return []

        if not case_id:
            stmt_case = select(Case.id).where(Case.complaint_id == complaint_id)
            case_id = (await db.execute(stmt_case)).scalar_one_or_none()

        # Fetch entities
        stmt_e = select(CyberEntity).where(CyberEntity.complaint_id == complaint_id)
        res_e = await db.execute(stmt_e)
        entities = res_e.scalars().all()

        if len(entities) < 2:
            return []

        text = f"{complaint.title}\n{complaint.description or ''}"
        created_relations: List[CyberEntityRelation] = []

        # Candidate pairing (limit max pairs to avoid combinatorial explosion)
        max_entities = min(len(entities), 12)
        subset = entities[:max_entities]

        for i in range(len(subset)):
            for j in range(len(subset)):
                if i == j:
                    continue
                ent_a = subset[i]
                ent_b = subset[j]

                # Run model prediction
                pred = relation_extraction_adapter.predict_relation(
                    text=text,
                    entity_a=ent_a.normalized_value or ent_a.raw_value,
                    entity_b=ent_b.normalized_value or ent_b.raw_value,
                    entity_a_type=ent_a.entity_type,
                    entity_b_type=ent_b.entity_type
                )

                rel_type = pred["relation_type"]
                conf = pred["confidence"]

                if rel_type != "NO_RELATION" and conf >= confidence_threshold:
                    # Check if exists
                    check_stmt = select(CyberEntityRelation).where(
                        and_(
                            CyberEntityRelation.complaint_id == complaint_id,
                            CyberEntityRelation.source_entity_id == ent_a.id,
                            CyberEntityRelation.target_entity_id == ent_b.id,
                            CyberEntityRelation.relation_type == rel_type
                        )
                    )
                    existing = (await db.execute(check_stmt)).scalar_one_or_none()
                    if not existing:
                        rel = CyberEntityRelation(
                            complaint_id=complaint_id,
                            case_id=case_id,
                            source_entity_id=ent_a.id,
                            target_entity_id=ent_b.id,
                            relation_type=rel_type,
                            confidence=conf,
                            source="TRANSFORMER",
                            model_name=pred["model_name"],
                            model_version=pred["model_version"],
                            metadata_json={
                                "probabilities": pred.get("probabilities", {}),
                                "source_entity_type": ent_a.entity_type,
                                "target_entity_type": ent_b.entity_type
                            }
                        )
                        db.add(rel)
                        created_relations.append(rel)

        if created_relations:
            await db.commit()
            for r in created_relations:
                await db.refresh(r)

        return created_relations


relation_extraction_service = RelationExtractionService()
