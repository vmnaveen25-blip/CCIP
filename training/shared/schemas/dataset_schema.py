from typing import Any, Dict, List, Optional, Set
from pydantic import BaseModel, Field, field_validator, model_validator


VALID_LABELS: List[str] = [
    "PHISHING",
    "UPI_FRAUD",
    "BANKING_FRAUD",
    "CARD_FRAUD",
    "INVESTMENT_SCAM",
    "JOB_SCAM",
    "LOAN_APP_FRAUD",
    "DIGITAL_ARREST",
    "IDENTITY_THEFT",
    "ACCOUNT_TAKEOVER",
    "SOCIAL_MEDIA_CRIME",
    "ONLINE_SHOPPING_FRAUD",
    "SEXTORTION",
    "CYBERSTALKING",
    "MALWARE_RANSOMWARE",
    "CRYPTO_FRAUD",
    "BUSINESS_EMAIL_COMPROMISE",
    "OTHER",
]

VALID_LABELS_SET: Set[str] = set(VALID_LABELS)
LABEL_TO_ID: Dict[str, int] = {label: i for i, label in enumerate(VALID_LABELS)}
ID_TO_LABEL: Dict[int, str] = {i: label for i, label in enumerate(VALID_LABELS)}


class NormalizedRecord(BaseModel):
    id: str = Field(..., description="Stable deterministic ID")
    text: str = Field(..., description="Normalized complaint/message text")
    is_cybercrime: int = Field(..., description="Binary indicator: 1 for cybercrime, 0 for legitimate")
    labels: List[str] = Field(default_factory=list, description="List of assigned cybercrime labels")
    source: str = Field(..., description="Name of the source dataset")
    source_label: str = Field(..., description="Original raw label/value from source")
    language: str = Field(default="en", description="Language code")
    synthetic: bool = Field(default=False, description="Whether the sample was synthetically generated")

    # Provenance fields
    source_revision: Optional[str] = Field(default=None, description="Source commit or revision")
    source_split: Optional[str] = Field(default=None, description="Original dataset split name")
    source_row_id: Optional[str] = Field(default=None, description="Original row index or identifier")
    mapping_version: Optional[str] = Field(default="1.0.0", description="Version of the mapping logic used")
    template_group: Optional[str] = Field(default=None, description="Template fingerprint hash")
    duplicate_group: Optional[str] = Field(default=None, description="Group ID for exact/near duplicates")

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        v_stripped = v.strip()
        if not v_stripped:
            raise ValueError("Text cannot be empty or whitespace only")
        return v_stripped

    @field_validator("is_cybercrime")
    @classmethod
    def validate_is_cybercrime(cls, v: int) -> int:
        if v not in (0, 1):
            raise ValueError(f"is_cybercrime must be 0 or 1, got {v}")
        return v

    @field_validator("labels")
    @classmethod
    def validate_labels(cls, v: List[str]) -> List[str]:
        deduped = []
        for label in v:
            if label not in VALID_LABELS_SET:
                raise ValueError(f"Invalid label '{label}'. Must be one of: {sorted(VALID_LABELS_SET)}")
            if label not in deduped:
                deduped.append(label)
        return deduped

    @model_validator(mode="after")
    def validate_legitimacy_and_other(self) -> "NormalizedRecord":
        if self.is_cybercrime == 0:
            if len(self.labels) > 0:
                raise ValueError(
                    f"Legitimate records (is_cybercrime=0) must have empty labels list, got: {self.labels}"
                )
        else:
            if len(self.labels) == 0:
                raise ValueError("Cybercrime records (is_cybercrime=1) must have at least one label")
        return self

    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump(exclude_none=True)
