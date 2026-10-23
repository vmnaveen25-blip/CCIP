from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class ModelMetricFrontendSchema(BaseModel):
    id: str
    modelName: str
    version: str
    task: str
    accuracy: float
    f1Score: float
    driftRate: float
    status: str
    lastEvaluated: str
    latencyMs: int


class ModelRegistrationRequest(BaseModel):
    model_name: str
    version: str
    task: str
    framework: Optional[str] = "PyTorch / Transformers"
    parameters_count: Optional[str] = "350M"
    description: Optional[str] = None


class RetrainTriggerRequest(BaseModel):
    model_id: str
    dataset_id: Optional[str] = None
    epochs: Optional[int] = 20
    learning_rate: Optional[float] = 0.0001


class DatasetCreateRequest(BaseModel):
    name: str
    category: Optional[str] = "VOICE_ACOUSTICS"
    dataset_type: Optional[str] = None
    version: Optional[str] = "v1.0"
    samples_count: Optional[int] = 0
    size_bytes: Optional[int] = 0
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class DeploymentRollbackRequest(BaseModel):
    model_id: str
    target_version: str
    environment: str = "PRODUCTION"


# -----------------------------------------------------------------------------
# Controlled Training Workspace Schemas
# -----------------------------------------------------------------------------

class TrainingJobCreateRequest(BaseModel):
    model_family: str
    base_model: str
    target_model_name: str
    target_model_version: str
    dataset_id: Optional[str] = None
    dataset_version: Optional[str] = "v1.0"
    training_task: str = "MULTI_LABEL_CLASSIFICATION"
    config_json: Dict[str, Any] = Field(default_factory=dict)
    quality_gate_config_json: Dict[str, Any] = Field(default_factory=dict)
    notes: Optional[str] = None


class TrainingJobUpdateRequest(BaseModel):
    config_json: Optional[Dict[str, Any]] = None
    quality_gate_config_json: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    target_model_version: Optional[str] = None


class TrainingJobResponse(BaseModel):
    id: str
    job_reference: str
    model_family: str
    base_model: str
    target_model_name: str
    target_model_version: str
    dataset_id: Optional[str] = None
    dataset_version: str
    training_task: str
    status: str
    runtime_type: str
    runtime_target: str
    config_json: Dict[str, Any]
    quality_gate_config_json: Dict[str, Any]
    metrics_json: Dict[str, Any]
    quality_gate_result_json: Dict[str, Any]
    artifact_path_ref: Optional[str] = None
    artifact_hash_sha256: Optional[str] = None
    log_path_ref: Optional[str] = None
    checkpoint_path_ref: Optional[str] = None
    notes: Optional[str] = None
    failure_reason: Optional[str] = None
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class TrainingCandidateRegisterRequest(BaseModel):
    notes: Optional[str] = None


class TrainingApprovalSubmitRequest(BaseModel):
    notes: str = Field(..., min_length=5, description="Governance review notes justifying candidate deployment")
