"""
Investigation Context Service for CCIP / Astraea Enclave.
Performs question-aware, authorized retrieval of case dossiers, cyber entities,
relations, evidence metadata, cross-case correlations, and event timelines.
"""

import logging
from typing import Any, Dict, List, Optional, Set
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc
from sqlalchemy.orm import selectinload

from app.models.case import Case
from app.models.complaint import Complaint
from app.models.complaint_event import ComplaintEvent
from app.models.cyber_entity import CyberEntity
from app.models.cyber_entity_relation import CyberEntityRelation
from app.models.case_correlation import CaseCorrelation
from app.models.evidence import Evidence
from app.models.evidence_metadata import EvidenceMetadata
from app.models.investigation_finding import InvestigationFinding
from app.services.investigation_knowledge_service import investigation_knowledge_service

logger = logging.getLogger(__name__)


class InvestigationContextService:
    """
    Assembles authorized, question-grounded context blocks for LLM reasoning.
    Defends against prompt injection and enforces data minimization.
    """

    async def get_case_record(self, db: AsyncSession, case_identifier: str) -> Optional[Case]:
        """Resolve case by UUID or human-readable case_number."""
        stmt = select(Case).where(
            or_(
                Case.id == case_identifier,
                Case.case_number == case_identifier,
                Case.complaint_id == case_identifier
            )
        )
        res = await db.execute(stmt)
        return res.scalars().first()

    async def retrieve_case_context(
        self,
        db: AsyncSession,
        case_identifier: str,
        question: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieves question-relevant case context.
        Encloses raw data in <CASE_EVIDENCE_DATA> boundaries.
        """
        case = await self.get_case_record(db, case_identifier)
        if not case:
            return {
                "context_text": f"No case record found matching identifier '{case_identifier}'.",
                "sources": [],
                "entity_count": 0,
                "relation_count": 0,
                "evidence_count": 0,
                "correlation_count": 0,
                "case_number": case_identifier,
                "case_title": "Unknown Case"
            }

        case_id = case.id
        complaint_id = case.complaint_id
        q_lower = (question or "").lower()

        sources: Set[str] = {"CASE"}

        # 1. Fetch Complaint Details
        complaint_stmt = select(Complaint).where(Complaint.id == complaint_id)
        c_res = await db.execute(complaint_stmt)
        complaint = c_res.scalars().first()
        if complaint:
            sources.add("COMPLAINT")

        # 2. Fetch Cyber Entities
        entity_stmt = select(CyberEntity).where(
            or_(
                CyberEntity.case_id == case_id,
                CyberEntity.complaint_id == complaint_id
            )
        )
        e_res = await db.execute(entity_stmt)
        entities = e_res.scalars().all()
        if entities:
            sources.add("ENTITIES")

        # 3. Fetch Entity Relations
        relation_stmt = select(CyberEntityRelation).where(
            or_(
                CyberEntityRelation.case_id == case_id,
                CyberEntityRelation.complaint_id == complaint_id
            )
        )
        r_res = await db.execute(relation_stmt)
        relations = r_res.scalars().all()
        if relations:
            sources.add("RELATIONS")

        # 4. Fetch Evidence Metadata (Safe metadata only - NO binary payloads)
        evidence_stmt = select(Evidence).where(
            or_(
                Evidence.case_id == case_id,
                Evidence.complaint_id == complaint_id
            )
        )
        ev_res = await db.execute(evidence_stmt)
        evidence_items = ev_res.scalars().all()
        if evidence_items:
            sources.add("EVIDENCE_METADATA")

        # 5. Fetch Case Correlations
        corr_stmt = select(CaseCorrelation).where(
            or_(
                CaseCorrelation.case_a_id == case_id,
                CaseCorrelation.case_b_id == case_id
            )
        )
        corr_res = await db.execute(corr_stmt)
        correlations = corr_res.scalars().all()
        if correlations:
            sources.add("CORRELATIONS")

        # 6. Fetch Lifecycle / Events for Timeline
        events_stmt = select(ComplaintEvent).where(
            ComplaintEvent.complaint_id == complaint_id
        ).order_by(ComplaintEvent.created_at)
        events_res = await db.execute(events_stmt)
        events = events_res.scalars().all()
        if events:
            sources.add("TIMELINE")

        # Build Entity Mapping for ID resolving
        entity_by_id = {ent.id: ent for ent in entities}

        # Format Structured Case Block
        lines: List[str] = [
            "<CASE_EVIDENCE_DATA>",
            f"[Case: {case.case_number}] Title: {case.title}",
            f"Status: {case.status} | Priority: {case.priority} | Risk Score: {case.risk_score}",
            f"Created At: {case.created_at.isoformat() if case.created_at else 'N/A'}"
        ]

        if complaint:
            lines.append(f"Category: {complaint.category.value if hasattr(complaint.category, 'value') else complaint.category}")
            lines.append(f"Severity: {complaint.severity.value if hasattr(complaint.severity, 'value') else complaint.severity}")
            if complaint.description:
                # Truncate narrative if excessively large, sanitize delimiters
                clean_desc = complaint.description.replace("<CASE_EVIDENCE_DATA>", "").replace("</CASE_EVIDENCE_DATA>", "").strip()
                lines.append(f"Complaint Narrative: {clean_desc[:2000]}")
            suspect_info = getattr(complaint, "suspect_info", None) or getattr(complaint, "suspect_details", None)
            if suspect_info:
                lines.append(f"Suspect Info: {str(suspect_info)[:500]}")

        # Intent Discrimination / Question-Aware Filtering
        is_payment_query = any(k in q_lower for k in ["upi", "bank", "account", "payment", "vpa", "ifsc", "money", "transfer"])
        is_crypto_query = any(k in q_lower for k in ["wallet", "crypto", "btc", "eth", "usdt", "peel", "mixer", "blockchain"])
        is_telecom_query = any(k in q_lower for k in ["phone", "mobile", "sim", "call", "sms", "imsi", "telecom"])
        is_infra_query = any(k in q_lower for k in ["domain", "ip", "url", "email", "server", "host", "c2", "infrastructure"])
        is_timeline_query = any(k in q_lower for k in ["timeline", "chronological", "when", "date", "time", "history", "order"])
        is_corr_query = any(k in q_lower for k in ["correlat", "similar", "link", "connect", "other case", "shared", "repeat"])

        # Prioritized Entities Listing
        if entities:
            lines.append("\nFORENSIC CYBER ENTITIES:")
            for ent in entities:
                ent_type_upper = ent.entity_type.upper()
                relevance_flag = ""
                if (is_payment_query and ("UPI" in ent_type_upper or "BANK" in ent_type_upper or "ACCOUNT" in ent_type_upper)) or \
                   (is_crypto_query and ("CRYPTO" in ent_type_upper or "WALLET" in ent_type_upper)) or \
                   (is_telecom_query and ("PHONE" in ent_type_upper or "SIM" in ent_type_upper or "MOBILE" in ent_type_upper)) or \
                   (is_infra_query and ("IP" in ent_type_upper or "DOMAIN" in ent_type_upper or "URL" in ent_type_upper or "EMAIL" in ent_type_upper)):
                    relevance_flag = " [QUERY_RELEVANT]"

                lines.append(
                    f"- [Entity: {ent.id[:8]}] Type: {ent.entity_type} | Value: `{ent.normalized_value}` "
                    f"| Confidence: {ent.confidence:.2f} | Source: {ent.source_type}{relevance_flag}"
                )

        # Entity Relations
        if relations:
            lines.append("\nENTITY RELATIONSHIPS:")
            for rel in relations:
                src = entity_by_id.get(rel.source_entity_id)
                tgt = entity_by_id.get(rel.target_entity_id)
                src_val = f"`{src.normalized_value}` ({src.entity_type})" if src else rel.source_entity_id[:8]
                tgt_val = f"`{tgt.normalized_value}` ({tgt.entity_type})" if tgt else rel.target_entity_id[:8]
                lines.append(f"- [Relation: {rel.id[:8]}] {src_val} --[{rel.relation_type}]--> {tgt_val}")

        # Evidence Files & Hashes
        if evidence_items:
            lines.append("\nDIGITAL EVIDENCE ARTIFACTS:")
            for ev in evidence_items:
                ev_hash = getattr(ev, "sha256_hash", None) or getattr(ev, "file_hash", None)
                h = ev_hash[:16] + "..." if ev_hash and len(ev_hash) > 16 else (ev_hash or "PENDING_HASH")
                fname = getattr(ev, "original_filename", None) or getattr(ev, "file_name", "artifact")
                mtype = getattr(ev, "mime_type", None) or getattr(ev, "file_type", "application/octet-stream")
                lines.append(
                    f"- [Evidence: {ev.id[:8]}] Filename: `{fname}` | Hash: `SHA256:{h}` | MIME: {mtype}"
                )

        # Cross-Case Correlations
        if correlations:
            lines.append("\nCROSS-CASE CORRELATIONS (Analytical Indicators - Human Review Required):")
            for c in correlations:
                other_id = c.case_b_id if c.case_a_id == case_id else c.case_a_id
                lines.append(
                    f"- [Correlation: {c.id[:8]}] Linked Case Ref: `{other_id[:8]}` | Label: {c.label} "
                    f"| Similarity: {c.similarity_score:.2f} | Shared Entities: {c.shared_entity_count} "
                    f"| Types: {c.shared_entity_types_json} | Status: {c.status}"
                )

        # Event History / Timeline
        if events:
            lines.append("\nCHRONOLOGICAL INCIDENT & LIFECYCLE EVENTS:")
            for ev in events:
                ts = getattr(ev, "timestamp", None) or (ev.created_at.strftime('%Y-%m-%d %H:%M:%S UTC') if getattr(ev, "created_at", None) else 'Unknown')
                title = getattr(ev, "title", None) or getattr(ev, "event_type", "Event")
                desc = getattr(ev, "description", None) or getattr(ev, "notes", "")
                lines.append(f"- [{ts}] {title}: {desc}")

        lines.append("</CASE_EVIDENCE_DATA>")

        # Check for matching procedural guidelines (RAG)
        sop_context = investigation_knowledge_service.format_sop_context(question or "")
        if sop_context:
            sources.add("CCIP_KNOWLEDGE_BASE")
            lines.append("\n" + sop_context)

        context_text = "\n".join(lines)

        return {
            "context_text": context_text,
            "sources": sorted(list(sources)),
            "entity_count": len(entities),
            "relation_count": len(relations),
            "evidence_count": len(evidence_items),
            "correlation_count": len(correlations),
            "case_number": case.case_number,
            "case_title": case.title
        }

    async def get_dynamic_suggestions(self, db: AsyncSession, case_identifier: str) -> List[str]:
        """
        Dynamically crafts 4-5 investigative inquiries grounded in the case's real entities.
        Replaces static template questions.
        """
        case = await self.get_case_record(db, case_identifier)
        if not case:
            return [
                "Summarize verified indicators in this case",
                "Construct a chronological incident timeline",
                "What investigative actions should be verified next?"
            ]

        case_id = case.id
        complaint_id = case.complaint_id

        # Fetch entities
        stmt = select(CyberEntity).where(
            or_(CyberEntity.case_id == case_id, CyberEntity.complaint_id == complaint_id)
        ).limit(20)
        res = await db.execute(stmt)
        entities = res.scalars().all()

        # Fetch correlations
        c_stmt = select(CaseCorrelation).where(
            or_(CaseCorrelation.case_a_id == case_id, CaseCorrelation.case_b_id == case_id)
        ).limit(5)
        c_res = await db.execute(c_stmt)
        correlations = c_res.scalars().all()

        suggestions: List[str] = []

        # Find UPI / Bank entities
        upi_entities = [e for e in entities if "UPI" in e.entity_type.upper() or "BANK" in e.entity_type.upper()]
        if upi_entities:
            val = upi_entities[0].normalized_value
            suggestions.append(f"Explain the payment flow involving identifier `{val}`")
            suggestions.append(f"Which other complaints contain payment identifier `{val}`?")

        # Find Phone entities
        phone_entities = [e for e in entities if "PHONE" in e.entity_type.upper() or "MOBILE" in e.entity_type.upper()]
        if phone_entities:
            p_val = phone_entities[0].normalized_value
            suggestions.append(f"Summarize communication records linked to `{p_val}`")

        # Find Domain / IP entities
        domain_entities = [e for e in entities if "DOMAIN" in e.entity_type.upper() or "IP" in e.entity_type.upper()]
        if domain_entities:
            d_val = domain_entities[0].normalized_value
            suggestions.append(f"Which infrastructure indicators connect through `{d_val}`?")

        # Find Crypto entities
        crypto_entities = [e for e in entities if "CRYPTO" in e.entity_type.upper() or "WALLET" in e.entity_type.upper()]
        if crypto_entities:
            c_val = crypto_entities[0].normalized_value
            suggestions.append(f"Analyze peel chain and exchange deposit clusters for `{c_val[:12]}...`")

        # Correlations
        if correlations:
            suggestions.append("Explain the evidence supporting the strongest cross-case correlation")

        # Universal analytical suggestions
        if len(suggestions) < 4:
            suggestions.append("Summarize the verified indicators in this case")
        if len(suggestions) < 4:
            suggestions.append("Build a chronological incident timeline from evidence timestamps")
        if len(suggestions) < 4:
            suggestions.append("What evidence should the investigator verify next?")

        return suggestions[:5]


investigation_context_service = InvestigationContextService()
