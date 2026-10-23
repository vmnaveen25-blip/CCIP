from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class PilotSourceTypeEnum(str, Enum):
    MODE_A_PUBLIC_BENCHMARK = "MODE_A_PUBLIC_BENCHMARK"
    MODE_B_DEIDENTIFIED_HISTORICAL = "MODE_B_DEIDENTIFIED_HISTORICAL"
    MODE_C_SHADOW_PILOT = "MODE_C_SHADOW_PILOT"
    MODE_D_SUPERVISED_PILOT = "MODE_D_SUPERVISED_PILOT"


class PilotDatasetStatusEnum(str, Enum):
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    REVOKED = "REVOKED"


class PilotRunStatusEnum(str, Enum):
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class PilotReviewDecisionEnum(str, Enum):
    AGREE = "AGREE"
    DISAGREE = "DISAGREE"
    UNSURE = "UNSURE"


# --- Dataset Schemas ---
class PilotDatasetCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=150)
    source_type: PilotSourceTypeEnum
    source_description: Optional[str] = None
    authorization_basis: str = Field(..., min_length=3, max_length=255)
    deidentified: bool = True
    contains_pii: bool = False
    allowed_purposes: List[str] = Field(default_factory=list)
    retention_policy: str = Field(..., min_length=3, max_length=255)
    storage_location_ref: str = Field(..., min_length=3, max_length=500)
    expires_at: Optional[datetime] = None


class PilotDatasetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    name: str
    source_type: str
    source_description: Optional[str] = None
    authorization_basis: str
    deidentified: bool
    contains_pii: bool
    allowed_purposes: List[str] = Field(default_factory=list, alias="allowed_purposes_json")
    retention_policy: str
    storage_location_ref: str
    created_by: Optional[str] = None
    created_at: datetime
    expires_at: Optional[datetime] = None
    status: str


# --- Evaluation Run Schemas ---
class PilotRunCreate(BaseModel):
    dataset_id: str
    model_versions: Dict[str, str] = Field(default_factory=dict)


class PilotRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    dataset_id: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    model_versions: Dict[str, Any] = Field(default_factory=dict, alias="model_versions_json")
    status: str
    created_by: Optional[str] = None


# --- Prediction Schemas ---
class PilotPredictionCreate(BaseModel):
    run_id: str
    record_ref: str
    task: str
    model_name: str
    model_version: str
    prediction_json: Dict[str, Any] = Field(default_factory=dict)
    confidence_json: Dict[str, Any] = Field(default_factory=dict)


class PilotPredictionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    run_id: str
    record_ref: str
    task: str
    model_name: str
    model_version: str
    prediction_json: Dict[str, Any] = Field(default_factory=dict)
    confidence_json: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


# --- Human Review Schemas ---
class PilotReviewCreate(BaseModel):
    prediction_id: str
    decision: PilotReviewDecisionEnum
    correct: Optional[bool] = None
    correction_label: Optional[str] = None
    notes_redacted: Optional[str] = None


class PilotReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    prediction_id: str
    reviewer_id: Optional[str] = None
    decision: str
    correct: Optional[bool] = None
    correction_label: Optional[str] = None
    notes_redacted: Optional[str] = None
    reviewed_at: datetime
