"""
Investigation Knowledge Service for CCIP / Astraea Enclave.
Authoritative CCIP Standard Operating Procedures (SOPs) and regulatory guidance.
Provides grounded procedural context ONLY when explicitly relevant to an investigator's query.
"""

from typing import Dict, List, Optional


APPROVED_SOPS: List[Dict[str, str]] = [
    {
        "id": "CCIP-SOP-FIN-01",
        "title": "Financial Interdiction & 1930 / I4C NCRP Procedures",
        "keywords": ["1930", "ncrp", "freeze", "lien", "bank", "mule", "interdiction", "recall", "stop payment"],
        "content": (
            "PROCEDURAL GUIDELINE [CCIP_KNOWLEDGE_BASE: CCIP-SOP-FIN-01]:\n"
            "- Initiate urgent financial interdiction via 1930 / I4C NCRP portal to transmit automated lien requests to nodal bank officers.\n"
            "- Under RBI Cyber Security Framework and Section 91 CrPC / Section 94 BNSS, requisition beneficiary account statements, KYC documents, and IP transaction logs within 24 hours of lien placement.\n"
            "- Multi-tier mule layering requires tracing outbound IMPS/NEFT/RTGS hops to place secondary holds before cash withdrawal at ATM/PoS."
        )
    },
    {
        "id": "CCIP-SOP-TEL-02",
        "title": "Telecommunications & ISP Preservation Orders (Section 91 CrPC / 94 BNSS)",
        "keywords": ["cdr", "ipdr", "telecom", "preservation", "section 91", "section 94", "bnss", "crpc", "tower", "imei", "sim"],
        "content": (
            "PROCEDURAL GUIDELINE [CCIP_KNOWLEDGE_BASE: CCIP-SOP-TEL-02]:\n"
            "- Serve formal notice under Section 91 CrPC / Section 94 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 to Telecom Service Providers (TSPs).\n"
            "- Mandatory retention period under DoT license conditions requires preservation of Call Detail Records (CDR), IP Detail Records (IPDR), and Customer Acquisition Forms (CAF).\n"
            "- For device-level tracing, requisition Central Equipment Identity Register (CEIR) handset status and linked IMSI history."
        )
    },
    {
        "id": "CCIP-SOP-EVD-03",
        "title": "Digital Evidence Integrity & Section 65B IEA / Section 63 BSA Certification",
        "keywords": ["65b", "bsa", "evidence act", "certificate", "chain of custody", "hash", "sha-256", "forensic integrity"],
        "content": (
            "PROCEDURAL GUIDELINE [CCIP_KNOWLEDGE_BASE: CCIP-SOP-EVD-03]:\n"
            "- Calculate cryptographic SHA-256 integrity hashes for all extracted logs, screenshots, PCAP network captures, and financial statements immediately upon ingestion.\n"
            "- Prepare electronic certificate under Section 65B of the Indian Evidence Act, 1872 / Section 63 of Bharatiya Sakshya Adhiniyam (BSA), 2023 signed by the forensic examiner.\n"
            "- Maintain immutable chain of custody logs documenting evidence custodian, acquisition timestamp, and cryptographic verification status."
        )
    },
    {
        "id": "CCIP-SOP-REG-04",
        "title": "CERT-In Incident Reporting Directives (Rule 12)",
        "keywords": ["cert-in", "cert", "reporting", "disclosure", "6-hour", "mandatory reporting", "statutory notice"],
        "content": (
            "PROCEDURAL GUIDELINE [CCIP_KNOWLEDGE_BASE: CCIP-SOP-REG-04]:\n"
            "- Under CERT-In Directions 2022 (Rule 12), designated cyber security incidents must be reported to the Indian Computer Emergency Response Team within the mandatory 6-hour window of detection.\n"
            "- Incident disclosure package must include: attack vector, impacted IP ranges/domains, SHA-256 hashes of malicious payloads, and observed indicators of compromise (IOCs)."
        )
    }
]


class InvestigationKnowledgeService:
    """
    RAG service for approved internal CCIP SOPs.
    Only retrieves procedural documentation when question context demands it.
    """

    def retrieve_relevant_sops(self, question: str) -> List[Dict[str, str]]:
        q_lower = question.lower()
        matched_sops: List[Dict[str, str]] = []

        for sop in APPROVED_SOPS:
            if any(kw in q_lower for kw in sop["keywords"]):
                matched_sops.append(sop)

        return matched_sops

    def format_sop_context(self, question: str) -> Optional[str]:
        matched = self.retrieve_relevant_sops(question)
        if not matched:
            return None
        
        blocks = [s["content"] for s in matched]
        return "\n\n".join(blocks)

    def get_status(self) -> Dict[str, any]:
        """Return truthful knowledge base and generative copilot status."""
        from app.core.config import settings
        has_gemini = bool(getattr(settings, "GEMINI_API_KEY", None))
        return {
            "is_available": has_gemini,
            "provider": "Google Gemini" if has_gemini else "Sovereign Knowledge/SOP RAG",
            "model": getattr(settings, "GEMINI_MODEL", "gemini-1.5-pro") if has_gemini else "Deterministic SOP RAG",
            "sops_loaded": len(APPROVED_SOPS)
        }


investigation_knowledge_service = InvestigationKnowledgeService()
