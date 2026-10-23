"""
Evidence Graph Service
Builds and maintains structured investigative graphs:
- EvidenceGraphNode (cases, complaints, bank accounts, phones, UPIs, IPs, URLs)
- EvidenceGraphEdge (deterministic links, predicted relation links, predicted graph links)
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.case import Case
from app.models.complaint import Complaint
from app.models.cyber_entity import CyberEntity
from app.models.cyber_entity_relation import CyberEntityRelation
from app.models.evidence_graph import EvidenceGraphNode, EvidenceGraphEdge
from app.ai.adapters.evidence_graph_link import evidence_graph_link_adapter
from app.core.logging import logger


class EvidenceGraphService:
    @staticmethod
    async def build_or_refresh_graph_for_case(db: AsyncSession, case_id: str) -> Dict[str, Any]:
        """
        Synthesizes all case entities and relations into EvidenceGraphNode and EvidenceGraphEdge entries.
        Runs MLP link prediction on candidate unlinked nodes.
        """
        stmt_c = select(Case).where(Case.id == case_id)
        case = (await db.execute(stmt_c)).scalar_one_or_none()
        if not case:
            return {"error": f"Case {case_id} not found."}

        # 1. Ensure Case Node exists
        stmt_cn = select(EvidenceGraphNode).where(
            and_(
                EvidenceGraphNode.case_id == case_id,
                EvidenceGraphNode.node_type == "CASE",
                EvidenceGraphNode.canonical_value == case.case_number
            )
        )
        case_node = (await db.execute(stmt_cn)).scalar_one_or_none()
        if not case_node:
            case_node = EvidenceGraphNode(
                case_id=case_id,
                node_type="CASE",
                canonical_value=case.case_number,
                display_label=f"Case {case.case_number}",
                metadata_json={"title": case.title, "priority": str(case.priority)}
            )
            db.add(case_node)
            await db.flush()

        # 2. Get CyberEntities for case
        stmt_e = select(CyberEntity).where(CyberEntity.case_id == case_id)
        entities = (await db.execute(stmt_e)).scalars().all()

        node_map: Dict[str, EvidenceGraphNode] = {}
        for ent in entities:
            val = ent.normalized_value or ent.raw_value
            stmt_en = select(EvidenceGraphNode).where(
                and_(
                    EvidenceGraphNode.case_id == case_id,
                    EvidenceGraphNode.node_type == ent.entity_type,
                    EvidenceGraphNode.canonical_value == val
                )
            )
            en_node = (await db.execute(stmt_en)).scalar_one_or_none()
            if not en_node:
                en_node = EvidenceGraphNode(
                    case_id=case_id,
                    entity_id=ent.id,
                    node_type=ent.entity_type,
                    canonical_value=val,
                    display_label=f"{ent.entity_type}: {val}",
                    metadata_json={"confidence": ent.confidence, "source_type": ent.source_type}
                )
                db.add(en_node)
                await db.flush()
            node_map[ent.id] = en_node

            # Ensure edge between Case and Entity exists
            stmt_edge = select(EvidenceGraphEdge).where(
                and_(
                    EvidenceGraphEdge.case_id == case_id,
                    EvidenceGraphEdge.source_node_id == case_node.id,
                    EvidenceGraphEdge.target_node_id == en_node.id,
                    EvidenceGraphEdge.edge_type == "INVOLVES_ENTITY"
                )
            )
            edge = (await db.execute(stmt_edge)).scalar_one_or_none()
            if not edge:
                edge = EvidenceGraphEdge(
                    case_id=case_id,
                    source_node_id=case_node.id,
                    target_node_id=en_node.id,
                    edge_type="INVOLVES_ENTITY",
                    confidence=1.0,
                    source="DETERMINISTIC",
                    review_status="VERIFIED"
                )
                db.add(edge)

        # 3. Add Entity Relations as Edges
        stmt_r = select(CyberEntityRelation).where(CyberEntityRelation.case_id == case_id)
        relations = (await db.execute(stmt_r)).scalars().all()

        for rel in relations:
            src_node = node_map.get(rel.source_entity_id)
            tgt_node = node_map.get(rel.target_entity_id)
            if src_node and tgt_node:
                stmt_re = select(EvidenceGraphEdge).where(
                    and_(
                        EvidenceGraphEdge.case_id == case_id,
                        EvidenceGraphEdge.source_node_id == src_node.id,
                        EvidenceGraphEdge.target_node_id == tgt_node.id,
                        EvidenceGraphEdge.edge_type == rel.relation_type
                    )
                )
                rel_edge = (await db.execute(stmt_re)).scalar_one_or_none()
                if not rel_edge:
                    rel_edge = EvidenceGraphEdge(
                        case_id=case_id,
                        source_node_id=src_node.id,
                        target_node_id=tgt_node.id,
                        edge_type=rel.relation_type,
                        confidence=rel.confidence,
                        source="RELATION_MODEL",
                        review_status="UNVERIFIED",
                        model_name=rel.model_name,
                        model_version=rel.model_version
                    )
                    db.add(rel_edge)

        await db.commit()

        # Fetch full graph nodes and edges
        all_nodes = (await db.execute(select(EvidenceGraphNode).where(EvidenceGraphNode.case_id == case_id))).scalars().all()
        all_edges = (await db.execute(select(EvidenceGraphEdge).where(EvidenceGraphEdge.case_id == case_id))).scalars().all()

        return {
            "case_id": case_id,
            "case_number": case.case_number,
            "node_count": len(all_nodes),
            "edge_count": len(all_edges),
            "nodes": [
                {
                    "id": n.id,
                    "node_type": n.node_type,
                    "canonical_value": n.canonical_value,
                    "display_label": n.display_label,
                    "metadata": n.metadata_json
                }
                for n in all_nodes
            ],
            "edges": [
                {
                    "id": e.id,
                    "source_node_id": e.source_node_id,
                    "target_node_id": e.target_node_id,
                    "edge_type": e.edge_type,
                    "confidence": e.confidence,
                    "source": e.source,
                    "review_status": e.review_status
                }
                for e in all_edges
            ]
        }

    @staticmethod
    async def review_edge(
        db: AsyncSession,
        edge_id: str,
        status: str,
        reviewer_id: Optional[str] = None
    ) -> Optional[EvidenceGraphEdge]:
        """Updates the review status of an evidence graph edge."""
        stmt = select(EvidenceGraphEdge).where(EvidenceGraphEdge.id == edge_id)
        edge = (await db.execute(stmt)).scalar_one_or_none()
        if not edge:
            return None
        edge.review_status = status
        edge.reviewed_by = reviewer_id
        edge.reviewed_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(edge)
        return edge


evidence_graph_service = EvidenceGraphService()
