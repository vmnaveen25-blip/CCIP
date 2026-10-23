"""
Trainers Factory & Registry
Maps CCIP model families to their dedicated training adapters.
"""

from typing import Optional
from app.ai.trainers.base import BaseTrainer
from app.ai.trainers.structured_trainer import StructuredTrainer
from app.ai.trainers.text_classifier import TextClassifierTrainer
from app.ai.trainers.token_classifier import TokenClassifierTrainer
from app.ai.trainers.embedding_trainer import EmbeddingTrainer


def get_trainer(model_family: str, task: str = "TEXT_CLASSIFICATION") -> BaseTrainer:
    """
    Returns the appropriate trainer adapter instance for the specified model family and task.
    """
    family = (model_family or "").lower().strip()
    
    if family in ["feedback_gate", "evidence_graph_link"]:
        return StructuredTrainer(model_family=family, task=task)
    elif family == "cyber_ner":
        return TokenClassifierTrainer(model_family=family, task=task)
    elif family in ["case_similarity", "cross_case_correlation"]:
        return EmbeddingTrainer(model_family=family, task=task)
    else:
        # Default text/multi-label classification (complaint_classifier, email_threat, sms_spam, incident_urgency, relation_extraction)
        return TextClassifierTrainer(model_family=family, task=task)


__all__ = [
    "BaseTrainer",
    "StructuredTrainer",
    "TextClassifierTrainer",
    "TokenClassifierTrainer",
    "EmbeddingTrainer",
    "get_trainer"
]
