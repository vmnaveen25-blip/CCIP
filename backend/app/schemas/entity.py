from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class CyberEntityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    complaint_id: Optional[str] = None
    case_id: Optional[str] = None
    entity_type: str
    raw_value: str
    normalized_value: str
    confidence: float
    source_type: str
    extractor: str
    extraction_mode: str
    start_offset: Optional[int] = None
    end_offset: Optional[int] = None
    occurrence_count: int = 1
    metadata_json: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class EntityExtractionRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=50000, description="Raw cyber narrative or evidence text to extract indicators from")


class EntityExtractionItem(BaseModel):
    entity_type: str
    raw_value: str
    normalized_value: str
    confidence: float
    start_offset: int
    end_offset: int
    occurrence_count: int = 1
    source: Optional[str] = None
    deterministic_validated: Optional[bool] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class EntityExtractionResponse(BaseModel):
    status: str = "SUCCESS"
    mode: str = "HYBRID_RULES_PLUS_TRANSFORMER"
    extractor: str = "HYBRID_CYBER_NER_V1"
    transformer_available: bool = True
    model: Optional[str] = "ccip-cyber-ner-deberta-v3-base"
    model_version: Optional[str] = "cyber-ner-bootstrap-v4.0.0"
    count: int
    entities: List[EntityExtractionItem]
