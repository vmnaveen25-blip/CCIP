from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class LabelPrediction(BaseModel):
    label: str
    probability: float
    threshold: float
    predicted: bool


class ClassifierPrediction(BaseModel):
    is_cybercrime_probability: float
    is_cybercrime: bool
    labels: List[str]
    label_predictions: Dict[str, LabelPrediction]
    metadata: Optional[Dict[str, Any]] = None
