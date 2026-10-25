import asyncio
from typing import Any, Dict
from app.ai.base import BaseAIAdapter
from app.core.model_config import URL_MODEL_WEIGHTS, URL_MODEL_FEATURES


class URLAnalyzer(BaseAIAdapter):
    @property
    def adapter_name(self) -> str:
        return "URLAnalyzer"

    @property
    def is_available(self) -> bool:
        return URL_MODEL_WEIGHTS.is_file() and URL_MODEL_FEATURES.is_file()

    async def analyze_url(self, url: str) -> Dict[str, Any]:
        if not self.is_available:
            return self.default_unavailable_response("Phishing URL & Domain Analysis")

        try:
            from app.ai.url_classifier import url_classifier
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(None, url_classifier.predict, url)
            return {
                "status": "SUCCESS",
                "connected": True,
                "adapter": self.adapter_name,
                "analysis": result
            }
        except Exception as e:
            return {
                "status": "ERROR",
                "connected": True,
                "adapter": self.adapter_name,
                "message": f"URL analysis execution failed: {str(e)}"
            }


url_analyzer = URLAnalyzer()
