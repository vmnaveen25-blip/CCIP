from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SourceManifestEntry(BaseModel):
    source_name: str
    hf_path: Optional[str] = None
    revision: Optional[str] = None
    split: str
    downloaded_rows: int
    accepted_rows: int
    rejected_rows: int
    synthetic: bool
    language: str
    checksum: Optional[str] = None


class DatasetManifest(BaseModel):
    manifest_version: str = "1.0.0"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    sources: List[SourceManifestEntry] = Field(default_factory=list)
    total_downloaded: int = 0
    total_accepted: int = 0
    total_rejected: int = 0
    synthetic_ratio: float = 0.0
