from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class LineageStep(BaseModel):
    step_name: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    input_records: int
    output_records: int
    parameters: Dict[str, Any] = Field(default_factory=dict)
    notes: Optional[str] = None


class DatasetLineage(BaseModel):
    pipeline_version: str
    mapping_version: str
    normalization_version: str
    steps: List[LineageStep] = Field(default_factory=list)
