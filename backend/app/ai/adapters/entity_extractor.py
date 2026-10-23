from typing import Any, Dict, Optional, List
from app.ai.base import BaseAIAdapter
from app.ai.extractors.hybrid_entity_extractor import hybrid_entity_extractor


class EntityExtractor(BaseAIAdapter):
    @property
    def adapter_name(self) -> str:
        return "CyberEntityExtractor"

    @property
    def is_available(self) -> bool:
        return True

    @property
    def mode(self) -> str:
        return hybrid_entity_extractor.mode

    async def extract_entities(self, text: str) -> Dict[str, Any]:
        """
        Extract cyber entities using the hybrid extraction pipeline
        (Deterministic rules + DeBERTa Transformer NER).
        Gracefully falls back to RULES_ONLY_DEGRADED if transformer is offline.
        """
        if not text or not text.strip():
            return {
                "status": "SUCCESS",
                "mode": self.mode,
                "extractor": hybrid_entity_extractor.extractor_name,
                "transformer_available": hybrid_entity_extractor.is_transformer_available,
                "count": 0,
                "entities": []
            }

        extracted = hybrid_entity_extractor.extract(text)
        return {
            "status": "SUCCESS",
            "mode": self.mode,
            "extractor": hybrid_entity_extractor.extractor_name,
            "transformer_available": hybrid_entity_extractor.is_transformer_available,
            "count": len(extracted),
            "entities": [e.to_dict() for e in extracted]
        }


entity_extractor = EntityExtractor()

