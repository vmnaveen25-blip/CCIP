from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class ThreatFeedResponse(BaseModel):
    id: str
    iocValue: str
    iocType: str
    threatName: str
    threatActor: str
    confidenceScore: float
    severity: str
    detectionTime: str
    sourceEnclave: str
    associatedCasesCount: int
    status: str


class ThreatFeedCreate(BaseModel):
    iocValue: str
    iocType: str
    threatName: str
    threatActor: str
    confidenceScore: float = 90.0
    severity: str = "HIGH"
    sourceEnclave: str
    status: str = "ACTIVE_BLOCK"


class CorrelatedNodeResponse(BaseModel):
    id: str
    label: str
    type: str
    riskScore: float
    connections: List[str]


class CorrelatedNodeCreate(BaseModel):
    id: str
    label: str
    type: str
    riskScore: float
    connections: List[str]
