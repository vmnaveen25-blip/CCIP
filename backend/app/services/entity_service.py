import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.cyber_entity import CyberEntity
from app.models.complaint import Complaint
from app.models.case import Case
from app.ai.extractors.hybrid_entity_extractor import hybrid_entity_extractor, HybridExtractedEntity
from app.core.logging import logger


class EntityService:
    @staticmethod
    def extract_from_text(text: str) -> List[HybridExtractedEntity]:
        """Runs the hybrid extractor (deterministic + transformer NER) on raw text."""
        return hybrid_entity_extractor.extract(text)

    @staticmethod
    def get_runtime_mode() -> str:
        """Returns the current operational mode of the entity extraction pipeline."""
        return hybrid_entity_extractor.mode

    @staticmethod
    def is_transformer_available() -> bool:
        """Checks if the transformer NER model is available in the local enclave."""
        return hybrid_entity_extractor.is_transformer_available

    @staticmethod
    async def extract_and_persist_for_complaint(
        db: AsyncSession,
        complaint: Complaint,
        case: Optional[Case] = None,
        additional_text: Optional[str] = None
    ) -> List[CyberEntity]:
        """
        Extracts entities from complaint narrative and metadata using the hybrid pipeline,
        deduplicates against existing records, and saves new entities to the database with rich provenance.
        """
        # Collect narrative text pieces
        text_fragments = [
            complaint.title or "",
            complaint.description or ""
        ]
        if additional_text:
            text_fragments.append(additional_text)

        # Include structured suspect_info if present
        if complaint.suspect_info and isinstance(complaint.suspect_info, dict):
            for k, v in complaint.suspect_info.items():
                if isinstance(v, str) and v.strip():
                    text_fragments.append(f"{k}: {v}")

        full_text = "\n".join([t for t in text_fragments if t.strip()])
        if not full_text.strip():
            return []

        extracted_items = hybrid_entity_extractor.extract(full_text)
        if not extracted_items:
            return []

        # Fetch existing entities for this complaint to deduplicate
        existing_q = select(CyberEntity).where(CyberEntity.complaint_id == complaint.id)
        existing_res = await db.execute(existing_q)
        existing_entities = existing_res.scalars().all()

        existing_map = {
            (e.entity_type, e.normalized_value): e
            for e in existing_entities
        }

        # Resolve case_id without triggering synchronous lazy load on async session
        target_case_id = case.id if case else None
        if not target_case_id:
            case_q = select(Case.id).where(Case.complaint_id == complaint.id)
            case_res = await db.execute(case_q)
            target_case_id = case_res.scalar_one_or_none()

        persisted_records: List[CyberEntity] = []

        for item in extracted_items:
            key = (item.entity_type, item.normalized_value)
            case_id = target_case_id

            if key in existing_map:
                # Update occurrence count and enrich provenance
                rec = existing_map[key]
                rec.occurrence_count += item.occurrence_count
                if item.confidence > rec.confidence:
                    rec.confidence = item.confidence
                if not rec.case_id and case_id:
                    rec.case_id = case_id
                # Merge metadata
                if item.metadata and isinstance(rec.metadata_json, dict):
                    updated_meta = rec.metadata_json.copy()
                    updated_meta.update(item.metadata)
                    rec.metadata_json = updated_meta
                persisted_records.append(rec)
            else:
                new_rec = CyberEntity(
                    complaint_id=complaint.id,
                    case_id=case_id,
                    entity_type=item.entity_type,
                    raw_value=item.raw_value[:500],
                    normalized_value=item.normalized_value[:500],
                    confidence=item.confidence,
                    source_type="COMPLAINT_NARRATIVE",
                    source_id=complaint.id,
                    extractor=item.extractor,
                    extraction_mode=item.extraction_mode,
                    start_offset=item.start_offset,
                    end_offset=item.end_offset,
                    occurrence_count=item.occurrence_count,
                    metadata_json=item.metadata
                )
                db.add(new_rec)
                persisted_records.append(new_rec)

        await db.flush()
        return persisted_records

    @staticmethod
    async def get_entities_by_complaint(
        db: AsyncSession,
        complaint_id: str
    ) -> List[CyberEntity]:
        """Retrieve all extracted cyber entities linked to a complaint."""
        q = select(CyberEntity).where(
            (CyberEntity.complaint_id == complaint_id)
        ).order_by(CyberEntity.entity_type, CyberEntity.created_at)
        res = await db.execute(q)
        return res.scalars().all()

    @staticmethod
    async def get_entities_by_case(
        db: AsyncSession,
        case_id: str
    ) -> List[CyberEntity]:
        """Retrieve all extracted cyber entities linked to a case docket."""
        # Find case first to check linked complaint
        case_res = await db.execute(select(Case).where((Case.id == case_id) | (Case.case_number == case_id)))
        c = case_res.scalars().first()
        if not c:
            return []

        q = select(CyberEntity).where(
            (CyberEntity.case_id == c.id) | (CyberEntity.complaint_id == c.complaint_id)
        ).order_by(CyberEntity.entity_type, CyberEntity.created_at)
        res = await db.execute(q)
        return res.scalars().all()


entity_service = EntityService()
