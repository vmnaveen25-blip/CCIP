from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class SourceDatasetConfig(BaseModel):
    name: str
    hf_path: Optional[str] = None
    data_files: Optional[str] = None
    split: str = "train"
    synthetic: bool = False
    language: str = "en"
    description: str


SUPPORTED_SOURCES: Dict[str, SourceDatasetConfig] = {
    "Shade63/scam-classification-multiclass": SourceDatasetConfig(
        name="Shade63/scam-classification-multiclass",
        hf_path="Shade63/scam-classification-multiclass",
        data_files="sentinel_dataset_multiclass.csv",
        split="train",
        synthetic=False,
        language="en",
        description="Curated sentinel scam multiclass dataset including legitimate and fraud categories.",
    ),
    "ysangam/Indian_Cyber_Scam_PhoneCall_Hinglish_Dataset": SourceDatasetConfig(
        name="ysangam/Indian_Cyber_Scam_PhoneCall_Hinglish_Dataset",
        hf_path="ysangam/Indian_Cyber_Scam_PhoneCall_Hinglish_Dataset",
        split="train",
        synthetic=True,
        language="hi-en",
        description="Simulated Hinglish phone call transcripts with scam categories and legitimate conversations.",
    ),
    "sidddd625/adaption-fraud-and-cyber-safety": SourceDatasetConfig(
        name="sidddd625/adaption-fraud-and-cyber-safety",
        hf_path="sidddd625/adaption-fraud-and-cyber-safety",
        split="train",
        synthetic=True,
        language="multilingual",
        description="Indian cyber fraud and safety citizen scenarios with detailed subdomains.",
    ),
    "anmolshrivastav/scam-hum-india": SourceDatasetConfig(
        name="anmolshrivastav/scam-hum-india",
        hf_path="anmolshrivastav/scam-hum-india",
        split="train",
        synthetic=False,
        language="en",
        description="Indian SMS ham vs spam dataset with scam alerts and real messages.",
    ),
    "vnovaai/INDIA_FRAUD_DETECTION_JSONL_V1": SourceDatasetConfig(
        name="vnovaai/INDIA_FRAUD_DETECTION_JSONL_V1",
        hf_path="vnovaai/INDIA_FRAUD_DETECTION_JSONL_V1",
        split="train",
        synthetic=True,
        language="en",
        description="Fraud scenarios with step breakdowns covering modern Indian scam vectors.",
    ),
}
