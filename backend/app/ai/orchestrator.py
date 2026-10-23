from typing import Any, Dict, Optional
from app.ai.adapters.complaint_classifier import complaint_classifier
from app.ai.adapters.entity_extractor import entity_extractor
from app.ai.adapters.url_analyzer import url_analyzer
from app.ai.adapters.risk_analyzer import risk_analyzer
from app.ai.adapters.similarity_engine import similarity_engine
from app.ai.adapters.correlation_engine import correlation_engine
from app.ai.adapters.investigation_assistant import investigation_assistant


class AIOrchestrator:
    """
    Central coordinator for all AI capabilities across CCIP.
    Safely coordinates inference pipelines when trained models are plugged in.
    """

    def __init__(self):
        self.classifier = complaint_classifier
        self.entity_extractor = entity_extractor
        self.url_analyzer = url_analyzer
        self.risk_analyzer = risk_analyzer
        self.similarity_engine = similarity_engine
        self.correlation_engine = correlation_engine
        self.assistant = investigation_assistant

    async def get_orchestrator_status(self) -> Dict[str, Any]:
        return {
            "status": "NOT_AVAILABLE",
            "message": "AI analysis service is not connected.",
            "models_loaded": 0,
            "adapters": {
                "classifier": self.classifier.is_available,
                "entity_extractor": self.entity_extractor.is_available,
                "url_analyzer": self.url_analyzer.is_available,
                "risk_analyzer": self.risk_analyzer.is_available,
                "similarity_engine": self.similarity_engine.is_available,
                "correlation_engine": self.correlation_engine.is_available,
                "assistant": self.assistant.is_available
            }
        }


ai_orchestrator = AIOrchestrator()
