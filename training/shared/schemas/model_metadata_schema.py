from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ModelMetadataSchema(BaseModel):
    model_name: str
    base_model: str
    task: str
    pipeline_version: str
    mapping_version: str
    normalization_version: str
    labels: List[str]
    thresholds: Dict[str, float]
    metrics: Dict[str, Any]
    training_samples: int
    validation_samples: int
    test_samples: int
    created_at: str
    notes: Optional[str] = None
