from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class EvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    complaint_id: str
    case_id: Optional[str] = None
    original_filename: str
    mime_type: str
    file_size_formatted: str
    file_size_bytes: int
    sha256_hash: str
    integrity_status: str
    is_verified: bool
    malware_scan_status: Optional[str] = "CLEAN"
    quarantined: Optional[bool] = False
    processing_status: Optional[str] = "COMPLETED"
    created_at: datetime
    download_url: Optional[str] = None


class EvidenceUploadResponse(BaseModel):
    id: str
    name: str
    size: str
    type: str
    sha256Hash: str
    verified: bool
    integrity_status: str
    malware_scan_status: Optional[str] = "CLEAN"
    quarantined: Optional[bool] = False
    processing_status: Optional[str] = "PROCESSING"
    download_url: str


class DocumentProcessingResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    evidence_id: str
    complaint_id: str
    case_id: Optional[str] = None
    processing_status: str
    detected_format: str
    page_count: int
    character_count: int
    ocr_applied: bool
    ocr_engine: Optional[str] = None
    extracted_text: str
    redacted_text: str
    gemini_summary: Optional[str] = None
    gemini_analysis_json: Dict[str, Any] = {}
    gemini_status: str
    error_message: Optional[str] = None
    processing_duration_ms: float
    created_at: datetime
    updated_at: datetime
    extracted_entities: List[Dict[str, Any]] = []

