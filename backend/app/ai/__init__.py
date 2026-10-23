from app.ai.base import BaseAIAdapter
from app.ai.orchestrator import ai_orchestrator, AIOrchestrator
from app.ai.adapters.complaint_classifier import complaint_classifier, ComplaintClassifier
from app.ai.adapters.entity_extractor import entity_extractor, EntityExtractor
from app.ai.adapters.url_analyzer import url_analyzer, URLAnalyzer
from app.ai.adapters.risk_analyzer import risk_analyzer, RiskAnalyzer
from app.ai.adapters.similarity_engine import similarity_engine, SimilarityEngine
from app.ai.adapters.correlation_engine import correlation_engine, CorrelationEngine
from app.ai.adapters.investigation_assistant import investigation_assistant, InvestigationAssistant

from app.ai.model_manager import model_manager, ModelManager
from app.ai.email_classifier import email_classifier, EmailThreatClassifier
from app.ai.sms_classifier import sms_classifier, SMSClassifier
from app.ai.url_classifier import url_classifier, URLPhishingClassifier

__all__ = [
    "BaseAIAdapter",
    "AIOrchestrator",
    "ai_orchestrator",
    "ComplaintClassifier",
    "complaint_classifier",
    "EntityExtractor",
    "entity_extractor",
    "URLAnalyzer",
    "url_analyzer",
    "RiskAnalyzer",
    "risk_analyzer",
    "SimilarityEngine",
    "similarity_engine",
    "CorrelationEngine",
    "correlation_engine",
    "InvestigationAssistant",
    "investigation_assistant",
    "model_manager",
    "ModelManager",
    "email_classifier",
    "EmailThreatClassifier",
    "sms_classifier",
    "SMSClassifier",
    "url_classifier",
    "URLPhishingClassifier",
]
