from typing import Any, Dict, Optional
from app.ai.base import BaseAIAdapter


class RiskAnalyzer(BaseAIAdapter):
    @property
    def adapter_name(self) -> str:
        return "RiskAnalyzer"

    @property
    def is_available(self) -> bool:
        return False

    async def calculate_risk(self, incident_data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_available:
            return self.default_unavailable_response("Risk Severity Analysis")
        raise NotImplementedError("Trained risk model not connected")


risk_analyzer = RiskAnalyzer()
