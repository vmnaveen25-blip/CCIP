"""
Hybrid Cyber Entity Extraction Engine
Mode: HYBRID_RULES_PLUS_TRANSFORMER (with graceful RULES_ONLY_DEGRADED fallback)

Combines deterministic regex/pattern-based extraction with transformer neural NER
(DeBERTa-v3 token classification) using strict authority boundaries, overlap resolution,
normalization, and explicit provenance tracking.
"""

from typing import List, Dict, Any, Optional, Tuple, Set

from app.ai.extractors.cyber_entity_extractor import (
    cyber_entity_extractor,
    ExtractedEntity,
    CyberEntityExtractor
)
from app.ai.adapters.cyber_ner_transformer import (
    cyber_ner_transformer,
    CyberNERTransformer
)
from app.core.logging import logger


# Structured types where the deterministic engine is authoritative
STRUCTURED_AUTHORITY_TYPES: Set[str] = {
    "URL",
    "DOMAIN",
    "EMAIL_ADDRESS",
    "IP_ADDRESS",
    "IFSC_CODE",
    "FILE_HASH",
    "CRYPTO_WALLET"
}

# Contextual types where transformer primarily augments
TRANSFORMER_AUGMENT_TYPES: Set[str] = {
    "PERSON_NAME",
    "BANK_NAME",
    "ORGANIZATION",
    "PLATFORM_NAME",
    "SOCIAL_HANDLE",
    "AMOUNT",
    "UPI_ID",
    "PHONE_NUMBER",
    "BANK_ACCOUNT",
    "UTR",
    "TRANSACTION_ID"
}


class HybridExtractedEntity:
    """Unified entity representation containing provenance and offset data."""

    def __init__(
        self,
        entity_type: str,
        raw_value: str,
        normalized_value: str,
        confidence: float,
        start_offset: int,
        end_offset: int,
        extractor: str,
        extraction_mode: str,
        source: str,
        deterministic_validated: bool = False,
        occurrence_count: int = 1,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.entity_type = entity_type
        self.raw_value = raw_value
        self.normalized_value = normalized_value
        self.confidence = round(float(confidence), 2)
        self.start_offset = start_offset
        self.end_offset = end_offset
        self.extractor = extractor
        self.extraction_mode = extraction_mode
        self.source = source  # "DETERMINISTIC", "TRANSFORMER", "HYBRID_MERGED"
        self.deterministic_validated = deterministic_validated
        self.occurrence_count = occurrence_count
        self.metadata = metadata or {}
        self.metadata["source"] = self.source
        self.metadata["deterministic_validated"] = self.deterministic_validated

    def to_dict(self) -> Dict[str, Any]:
        return {
            "entity_type": self.entity_type,
            "raw_value": self.raw_value,
            "normalized_value": self.normalized_value,
            "confidence": self.confidence,
            "start_offset": self.start_offset,
            "end_offset": self.end_offset,
            "occurrence_count": self.occurrence_count,
            "extractor": self.extractor,
            "extraction_mode": self.extraction_mode,
            "metadata": self.metadata
        }


class HybridEntityExtractor:
    """
    Coordinates deterministic regex indicator extraction and neural transformer NER.
    Provides graceful degradation to rule-based extraction when the model is unavailable.
    """

    def __init__(
        self,
        deterministic_engine: Optional[CyberEntityExtractor] = None,
        transformer_engine: Optional[CyberNERTransformer] = None
    ):
        self._deterministic = deterministic_engine or cyber_entity_extractor
        self._transformer = transformer_engine or cyber_ner_transformer
        self.extractor_name = "HYBRID_CYBER_NER_V1"

    @property
    def mode(self) -> str:
        """Truthfully returns runtime extraction mode."""
        if self._transformer.is_available():
            return "HYBRID_RULES_PLUS_TRANSFORMER"
        return "RULES_ONLY_DEGRADED"

    @property
    def is_transformer_available(self) -> bool:
        return self._transformer.is_available()

    def extract(self, text: str) -> List[HybridExtractedEntity]:
        """
        Executes hybrid extraction pipeline:
        1. Run deterministic extractor
        2. Run transformer extractor (if available)
        3. Merge, resolve conflicts, and deduplicate
        4. Return unified list with rich provenance
        """
        if not text or not text.strip():
            return []

        current_mode = self.mode

        # 1. Deterministic extraction (Always runs)
        det_entities = self._deterministic.extract(text)

        # 2. Transformer extraction (Runs if available)
        trans_entities: List[Dict[str, Any]] = []
        if self._transformer.is_available():
            try:
                trans_entities = self._transformer.extract(text)
            except Exception as e:
                logger.error(f"Transformer extraction failed, falling back to rules: {e}", exc_info=True)
                current_mode = "RULES_ONLY_DEGRADED"

        # 3. Merge and conflict resolution
        return self._merge_and_resolve(
            text=text,
            deterministic_items=det_entities,
            transformer_items=trans_entities,
            runtime_mode=current_mode
        )

    def _merge_and_resolve(
        self,
        text: str,
        deterministic_items: List[ExtractedEntity],
        transformer_items: List[Dict[str, Any]],
        runtime_mode: str
    ) -> List[HybridExtractedEntity]:
        """
        Applies hybrid authority and conflict resolution rules:
        - Rule A: Same type + same normalized value -> merge with HYBRID_MERGED provenance
        - Rule B: Deterministic structured entity overlaps transformer entity -> deterministic wins
        - Rule C/D: Overlapping conflicting spans -> structured/format-validated patterns win
        - Deduplication & occurrence counting
        """
        # Convert deterministic entities to intermediate dicts
        det_records = []
        for d in deterministic_items:
            det_records.append({
                "entity_type": d.entity_type,
                "raw_value": d.raw_value,
                "normalized_value": d.normalized_value,
                "confidence": d.confidence,
                "start_offset": d.start_offset,
                "end_offset": d.end_offset,
                "occurrence_count": d.occurrence_count,
                "source": "DETERMINISTIC",
                "deterministic_validated": True,
                "metadata": d.metadata.copy() if d.metadata else {}
            })

        # Process transformer items
        trans_records = []
        for t in transformer_items:
            trans_records.append({
                "entity_type": t["entity_type"],
                "raw_value": t["raw_value"],
                "normalized_value": t["normalized_value"],
                "confidence": t["confidence"],
                "start_offset": t["start_offset"],
                "end_offset": t["end_offset"],
                "occurrence_count": t.get("occurrence_count", 1),
                "source": "TRANSFORMER",
                "deterministic_validated": False,
                "metadata": {
                    "transformer_confidence": t["confidence"],
                    "extractor_version": t.get("extractor_version", "cyber-ner-bootstrap-v4.0.0")
                }
            })

        # Rule A: Check for exact (entity_type, normalized_value) matches between deterministic and transformer
        merged_deterministic: List[Dict[str, Any]] = []
        matched_trans_indices = set()

        for d in det_records:
            d_type = d["entity_type"]
            d_norm = d["normalized_value"]

            # Look for matching transformer entities
            matched_confs: List[float] = []
            for idx, t in enumerate(trans_records):
                if idx in matched_trans_indices:
                    continue
                if t["entity_type"] == d_type and (
                    t["normalized_value"] == d_norm
                    or self._fuzzy_val_match(d_norm, t["normalized_value"])
                ):
                    matched_confs.append(t["confidence"])
                    matched_trans_indices.add(idx)

            if matched_confs:
                # Merge into HYBRID_MERGED record
                combined_conf = max(d["confidence"], max(matched_confs))
                combined_meta = d["metadata"].copy()
                combined_meta["transformer_detected"] = True
                combined_meta["transformer_matches"] = len(matched_confs)

                merged_deterministic.append({
                    "entity_type": d_type,
                    "raw_value": d["raw_value"],
                    "normalized_value": d_norm,
                    "confidence": round(combined_conf, 2),
                    "start_offset": d["start_offset"],
                    "end_offset": d["end_offset"],
                    "occurrence_count": d["occurrence_count"],
                    "source": "HYBRID_MERGED",
                    "deterministic_validated": True,
                    "metadata": combined_meta
                })
            else:
                merged_deterministic.append(d)

        # Rule B, C, D: Evaluate remaining transformer records for span overlap with deterministic entities
        remaining_trans_records = []
        for idx, t in enumerate(trans_records):
            if idx in matched_trans_indices:
                continue

            t_start = t["start_offset"]
            t_end = t["end_offset"]
            t_type = t["entity_type"]

            has_conflict = False
            for d in merged_deterministic:
                d_start = d["start_offset"]
                d_end = d["end_offset"]
                d_type = d["entity_type"]

                # Check for overlap: max(start) < min(end)
                if max(t_start, d_start) < min(t_end, d_end):
                    # Spans overlap!
                    if d_type in STRUCTURED_AUTHORITY_TYPES:
                        # Rule B: Structured deterministic match wins completely
                        has_conflict = True
                        break

                    if d_type == t_type:
                        # Same type, overlapping span: deterministic wins
                        has_conflict = True
                        break

                    # Conflicting types on overlapping span:
                    # Deterministic regex has format validation (e.g. Phone, Account, UPI)
                    # so deterministic wins unless transformer is augmenting a non-competing concept
                    has_conflict = True
                    break

            if not has_conflict:
                remaining_trans_records.append(t)

        # Combine all survivors
        all_candidates = merged_deterministic + remaining_trans_records

        # Deduplicate across candidate list by (entity_type, normalized_value)
        final_entities_map: Dict[Tuple[str, str], HybridExtractedEntity] = {}

        for item in all_candidates:
            key = (item["entity_type"], item["normalized_value"])
            if key in final_entities_map:
                existing = final_entities_map[key]
                existing.occurrence_count += item["occurrence_count"]
                if item["confidence"] > existing.confidence:
                    existing.confidence = item["confidence"]
                if item["source"] == "HYBRID_MERGED" or (existing.source != item["source"]):
                    existing.source = "HYBRID_MERGED"
                    existing.metadata["source"] = "HYBRID_MERGED"
                if item.get("deterministic_validated", False):
                    existing.deterministic_validated = True
                    existing.metadata["deterministic_validated"] = True
            else:
                final_entities_map[key] = HybridExtractedEntity(
                    entity_type=item["entity_type"],
                    raw_value=item["raw_value"],
                    normalized_value=item["normalized_value"],
                    confidence=item["confidence"],
                    start_offset=item["start_offset"],
                    end_offset=item["end_offset"],
                    extractor=self.extractor_name if runtime_mode == "HYBRID_RULES_PLUS_TRANSFORMER" else "CYBER_ENTITY_EXTRACTOR_V1",
                    extraction_mode=runtime_mode,
                    source=item["source"],
                    deterministic_validated=item.get("deterministic_validated", False),
                    occurrence_count=item["occurrence_count"],
                    metadata=item.get("metadata", {})
                )

        return list(final_entities_map.values())

    def _fuzzy_val_match(self, val1: str, val2: str) -> bool:
        """Check if two normalized values match after cleaning."""
        v1 = val1.strip().lower().replace(" ", "").replace("-", "")
        v2 = val2.strip().lower().replace(" ", "").replace("-", "")
        return v1 == v2


# Singleton instance
hybrid_entity_extractor = HybridEntityExtractor()
