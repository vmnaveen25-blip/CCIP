from typing import Any, Dict, Optional
from app.ai.base import BaseAIAdapter


class CorrelationEngine(BaseAIAdapter):
    @property
    def adapter_name(self) -> str:
        return "CorrelationEngine"

    @property
    def is_available(self) -> bool:
        return False

    async def correlate_nodes(self, node_id: str) -> Dict[str, Any]:
        if not self.is_available:
            return self.default_unavailable_response("Graph Correlation Engine")
        raise NotImplementedError("Trained GNN model not connected")


correlation_engine = CorrelationEngine()
