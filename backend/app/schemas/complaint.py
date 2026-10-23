from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class SuspectInfoSchema(BaseModel):
    alias: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    walletAddress: Optional[str] = None
    ipAddress: Optional[str] = None


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


class ComplaintFrontendSchema(BaseModel):
    id: str
    referenceNumber: str
    title: str
    category: str
    severity: str
    status: str
    citizenName: str
    citizenEmail: str
    citizenPhone: str
    incidentDate: str
    reportedDate: str
    financialLoss: Optional[float] = 0.0
    suspectInfo: Optional[SuspectInfoSchema] = None
    description: str
    evidenceFiles: List[EvidenceFileSchema] = []
    aiTriageScore: int = 50
    aiPredictedThreatGroup: Optional[str] = None
    assignedUnit: Optional[str] = None
    assignedOfficer: Optional[str] = None
    timeline: List[TimelineEventSchema] = []


class ComplaintCreateRequest(BaseModel):
    title: Optional[str] = None
    category: str
    severity: Optional[str] = "MEDIUM"
    citizenName: Optional[str] = None
    citizenEmail: Optional[str] = None
    citizenPhone: Optional[str] = None
    incidentDate: str
    financialLoss: Optional[float] = 0.0
    suspectInfo: Optional[SuspectInfoSchema] = None
    description: str
    evidenceFiles: Optional[List[EvidenceFileSchema]] = []
    isDraft: Optional[bool] = False


class ComplaintUpdateRequest(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    financialLoss: Optional[float] = None
    suspectInfo: Optional[SuspectInfoSchema] = None
    description: Optional[str] = None
    assignedUnit: Optional[str] = None
    assignedOfficer: Optional[str] = None
