"""
Intelligence Orchestrator
Coordinates multi-stage intelligence refresh with stage isolation and fault tolerance:
1. Cyber NER & Entity Extraction
2. Cyber Relation Extraction
3. Incident Urgency Evaluation
4. Case Similarity Discovery
5. Cross-Case Correlation
6. Evidence Graph Construction
"""

from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.case import Case
from app.models.complaint import Complaint
from app.models.cyber_entity import CyberEntity
from app.services.entity_service import EntityService
from app.services.relation_extraction_service import relation_extraction_service
from app.services.incident_urgency_service import incident_urgency_service
from app.services.case_similarity_service import case_similarity_service
from app.services.cross_case_correlation_service import cross_case_correlation_service
from app.services.evidence_graph_service import evidence_graph_service
from app.core.logging import logger


class IntelligenceOrchestrator:
    @staticmethod
    async def refresh_case_intelligence(
        db: AsyncSession,
        case_id: str,
        force_refresh: bool = False
    ) -> Dict[str, Any]:
        """
        Executes end-to-end intelligence pipeline for a case.
        Each stage is isolated with try/except blocks so failures in one model do not break the pipeline.
        Supports caching and idempotency: avoids rerunning expensive transformer inference on unchanged data.
        """
        stmt_c = select(Case).where(Case.id == case_id)
        case = (await db.execute(stmt_c)).scalar_one_or_none()
        if not case:
            return {"error": f"Case {case_id} not found."}

        results = {
            "case_id": case_id,
            "case_number": case.case_number,
            "force_refresh": force_refresh,
            "stages": {}
        }

        # Stage 1: Entity Extraction from Complaints
        complaints = []
        try:
            if case.complaint_id:
                stmt_complaint = select(Complaint).where(Complaint.id == case.complaint_id)
                comp_obj = (await db.execute(stmt_complaint)).scalar_one_or_none()
                if comp_obj:
                    complaints.append(comp_obj)
            total_entities = 0
            cached_count = 0
            for comp in complaints:
                # Check if entities already exist and force_refresh is not requested
                stmt_existing_ents = select(CyberEntity).where(CyberEntity.complaint_id == comp.id)
                existing_ents = (await db.execute(stmt_existing_ents)).scalars().all()
                if existing_ents and not force_refresh:
                    total_entities += len(existing_ents)
                    cached_count += 1
                else:
                    ents = await EntityService.extract_and_persist_for_complaint(db, comp, case=case)
                    total_entities += len(ents)
            results["stages"]["entity_extraction"] = {
                "status": "SUCCESS",
                "entities_extracted": total_entities,
                "cached": cached_count > 0 and not force_refresh
            }
        except Exception as e:
            logger.error(f"Stage 1 error for case {case_id}: {e}")
            results["stages"]["entity_extraction"] = {"status": "FAILED", "error": str(e)}

        # Stage 2: Cyber Relation Extraction
        try:
            from app.models.cyber_entity_relation import CyberEntityRelation
            total_relations = 0
            cached_rels = 0
            for comp in complaints:
                stmt_existing_rels = select(CyberEntityRelation).where(CyberEntityRelation.complaint_id == comp.id)
                existing_rels = (await db.execute(stmt_existing_rels)).scalars().all()
                if existing_rels and not force_refresh:
                    total_relations += len(existing_rels)
                    cached_rels += 1
                else:
                    rels = await relation_extraction_service.extract_and_persist_relations_for_complaint(db, comp.id, case_id=case.id)
                    total_relations += len(rels)
            results["stages"]["relation_extraction"] = {
                "status": "SUCCESS",
                "relations_extracted": total_relations,
                "cached": cached_rels > 0 and not force_refresh
            }
        except Exception as e:
            logger.error(f"Stage 2 error for case {case_id}: {e}")
            results["stages"]["relation_extraction"] = {"status": "FAILED", "error": str(e)}

        # Stage 3: Incident Urgency
        try:
            urgency_res = await incident_urgency_service.evaluate_case_urgency(db, case_id)
            results["stages"]["incident_urgency"] = {"status": "SUCCESS", "data": urgency_res}
        except Exception as e:
            logger.error(f"Stage 3 error for case {case_id}: {e}")
            results["stages"]["incident_urgency"] = {"status": "FAILED", "error": str(e)}

        # Stage 4: Case Similarity
        try:
            similarity_res = await case_similarity_service.find_similar_cases_for_case(db, case_id, limit=5)
            results["stages"]["case_similarity"] = {"status": "SUCCESS", "matches_found": similarity_res.get("matches_found", 0)}
        except Exception as e:
            logger.error(f"Stage 4 error for case {case_id}: {e}")
            results["stages"]["case_similarity"] = {"status": "FAILED", "error": str(e)}

        # Stage 5: Cross-Case Correlation
        try:
            corr_res = await cross_case_correlation_service.correlate_case(db, case_id, force_refresh=force_refresh)
            results["stages"]["cross_case_correlation"] = {"status": "SUCCESS", "correlations_evaluated": len(corr_res)}
        except Exception as e:
            logger.error(f"Stage 5 error for case {case_id}: {e}")
            results["stages"]["cross_case_correlation"] = {"status": "FAILED", "error": str(e)}

        # Stage 6: Evidence Graph Link & Construction
        try:
            graph_res = await evidence_graph_service.build_or_refresh_graph_for_case(db, case_id)
            results["stages"]["evidence_graph"] = {
                "status": "SUCCESS",
                "node_count": graph_res.get("node_count", 0),
                "edge_count": graph_res.get("edge_count", 0)
            }
        except Exception as e:
            logger.error(f"Stage 6 error for case {case_id}: {e}")
            results["stages"]["evidence_graph"] = {"status": "FAILED", "error": str(e)}

        return results


intelligence_orchestrator = IntelligenceOrchestrator()
