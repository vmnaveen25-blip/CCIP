from typing import Any, Dict, Optional
from app.ai.base import BaseAIAdapter


class SimilarityEngine(BaseAIAdapter):
    @property
    def adapter_name(self) -> str:
        return "SimilarityEngine"

    @property
    def is_available(self) -> bool:
        return False

    async def find_similar_cases(self, text_embedding: Any) -> Dict[str, Any]:
        if not self.is_available:
            return self.default_unavailable_response("Vector Similarity Clustering")
        raise NotImplementedError("Trained embedding model not connected")


similarity_engine = SimilarityEngine()
