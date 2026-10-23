from typing import Any, Dict, Optional
from app.ai.base import BaseAIAdapter


class URLAnalyzer(BaseAIAdapter):
    @property
    def adapter_name(self) -> str:
        return "URLAnalyzer"

    @property
    def is_available(self) -> bool:
        return False

    async def analyze_url(self, url: str) -> Dict[str, Any]:
        if not self.is_available:
            return self.default_unavailable_response("Phishing URL & Domain Analysis")
        raise NotImplementedError("Trained URL analysis model not connected")


url_analyzer = URLAnalyzer()
