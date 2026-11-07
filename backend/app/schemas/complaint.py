from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, model_validator


class SuspectInfoSchema(BaseModel):
    alias: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    walletAddress: Optional[str] = None
    ipAddress: Optional[str] = None
    bankAccount: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_suspect_keys(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "wallet_address" in data and "walletAddress" not in data:
                data["walletAddress"] = data["wallet_address"]
            if "ip_address" in data and "ipAddress" not in data:
                data["ipAddress"] = data["ip_address"]
            if "bank_account" in data and "bankAccount" not in data:
                data["bankAccount"] = data["bank_account"]
        return data


class EvidenceFileSchema(BaseModel):
    name: str
    size: str
    type: str
    sha256Hash: str
    verified: bool = True
    url: Optional[str] = None


class TimelineEventSchema(BaseModel):
    timestamp: str
    title: str
    description: str
    actor: str
    verifiedHash: Optional[str] = None


class PublicMilestoneSchema(BaseModel):
    title: str
    stage: str
    state: str  # "COMPLETED", "CURRENT", "PENDING"
    timestamp: Optional[str] = None


class CitizenConsentSchema(BaseModel):
    termsVersion: Optional[str] = "2026.1-DPDP"
    dataProcessingAccepted: bool = True
    evidenceSubmissionAccepted: bool = True
    truthfulnessDeclared: bool = True


class ReportIndicatorSchema(BaseModel):
    type: str  # PHONE, EMAIL, URL, DOMAIN, CRYPTO_WALLET, BANK_UTR, IP
    value: str
    source: Optional[str] = "CITIZEN_SUBMISSION"
    confidence: Optional[float] = 1.0


class ComplaintPublicTrackingResponse(BaseModel):
    referenceNumber: str
    id: Optional[str] = None
    title: str = "Cybercrime Incident Record"
    status: str
    statusLabel: str
    category: str
    reportedDate: str
    incidentDate: Optional[str] = None
    lastUpdated: Optional[str] = None
    timeline: Optional[List[PublicMilestoneSchema]] = None
    trackingVerified: bool = False
    evidenceCount: Optional[int] = None
    verificationMessage: Optional[str] = None


class ComplaintFrontendSchema(BaseModel):
    id: str
    referenceNumber: str
    trackingToken: Optional[str] = None
    title: str
    category: str
    subcategory: Optional[str] = None
    severity: str
    status: str
    citizenName: str
    citizenEmail: str
    citizenPhone: str
    incidentDate: str
    reportedDate: str
    financialLoss: Optional[float] = 0.0
    currency: Optional[str] = "INR"
    jurisdiction: Optional[str] = None
    isOngoing: Optional[bool] = False
    paymentProvider: Optional[str] = None
    transactionReference: Optional[str] = None
    suspectInfo: Optional[SuspectInfoSchema] = None
    description: str
    evidenceFiles: List[EvidenceFileSchema] = []
    indicators: Optional[List[ReportIndicatorSchema]] = []
    aiTriageScore: int = 50
    aiPredictedThreatGroup: Optional[str] = None
    triageExecutionMode: Optional[str] = "HEURISTIC_FALLBACK"
    triageProvenance: Optional[Dict[str, Any]] = None
    assignedUnit: Optional[str] = None
    assignedOfficer: Optional[str] = None
    timeline: List[TimelineEventSchema] = []


class ComplaintCreateRequest(BaseModel):
    title: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    severity: Optional[str] = "MEDIUM"
    citizenName: Optional[str] = None
    citizenEmail: Optional[str] = None
    citizenPhone: Optional[str] = None
    incidentDate: str
    financialLoss: Optional[float] = 0.0
    currency: Optional[str] = "INR"
    jurisdiction: Optional[str] = None
    isOngoing: Optional[bool] = False
    paymentProvider: Optional[str] = None
    transactionDate: Optional[str] = None
    transactionReference: Optional[str] = None
    contactChannel: Optional[str] = None
    suspectInfo: Optional[SuspectInfoSchema] = None
    description: str
    evidenceFiles: Optional[List[EvidenceFileSchema]] = []
    indicators: Optional[List[ReportIndicatorSchema]] = []
    consent: Optional[CitizenConsentSchema] = None
    idempotencyKey: Optional[str] = None
    isDraft: Optional[bool] = False

    @model_validator(mode="before")
    @classmethod
    def normalize_keys(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Support snake_case keys transparently
            if "incident_date" in data and "incidentDate" not in data:
                data["incidentDate"] = data["incident_date"]
            if "loss_amount" in data and "financialLoss" not in data:
                data["financialLoss"] = data["loss_amount"]
            if "financial_loss" in data and "financialLoss" not in data:
                data["financialLoss"] = data["financial_loss"]
            if "citizen_name" in data and "citizenName" not in data:
                data["citizenName"] = data["citizen_name"]
            if "citizen_email" in data and "citizenEmail" not in data:
                data["citizenEmail"] = data["citizen_email"]
            if "citizen_phone" in data and "citizenPhone" not in data:
                data["citizenPhone"] = data["citizen_phone"]
            if "is_ongoing" in data and "isOngoing" not in data:
                data["isOngoing"] = data["is_ongoing"]
            if "payment_provider" in data and "paymentProvider" not in data:
                data["paymentProvider"] = data["payment_provider"]
            if "transaction_date" in data and "transactionDate" not in data:
                data["transactionDate"] = data["transaction_date"]
            if "transaction_reference" in data and "transactionReference" not in data:
                data["transactionReference"] = data["transaction_reference"]
            if "contact_channel" in data and "contactChannel" not in data:
                data["contactChannel"] = data["contact_channel"]
            if "suspect_info" in data and "suspectInfo" not in data:
                data["suspectInfo"] = data["suspect_info"]
            if "evidence_files" in data and "evidenceFiles" not in data:
                data["evidenceFiles"] = data["evidence_files"]
            if "is_draft" in data and "isDraft" not in data:
                data["isDraft"] = data["is_draft"]
            if "idempotency_key" in data and "idempotencyKey" not in data:
                data["idempotencyKey"] = data["idempotency_key"]
        return data


class ComplaintUpdateRequest(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    financialLoss: Optional[float] = None
    suspectInfo: Optional[SuspectInfoSchema] = None
    description: Optional[str] = None
    assignedUnit: Optional[str] = None
    assignedOfficer: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_update_keys(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "financial_loss" in data and "financialLoss" not in data:
                data["financialLoss"] = data["financial_loss"]
            if "suspect_info" in data and "suspectInfo" not in data:
                data["suspectInfo"] = data["suspect_info"]
            if "assigned_unit" in data and "assignedUnit" not in data:
                data["assignedUnit"] = data["assigned_unit"]
            if "assigned_officer" in data and "assignedOfficer" not in data:
                data["assignedOfficer"] = data["assigned_officer"]
        return data
