import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  GitBranch, 
  ChevronDown, 
  Check, 
  Layers, 
  Plus, 
  ChevronRight, 
  Info, 
  Activity, 
  ShieldCheck, 
  BarChart3, 
  History, 
  Database, 
  Sliders, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  RotateCcw, 
  Play, 
  Cpu, 
  Clock, 
  ArrowRight,
  ExternalLink,
  Terminal,
  Zap,
  Lock,
  Search
} from 'lucide-react';
import { ModelMetric } from '../../types';
import { apiClient } from '../../api/client';

export interface ModelVersionItem {
  version: string;
  badge: 'CURRENT' | 'STABLE' | 'LEGACY' | 'CANDIDATE';
  date: string;
  notes: string;
  accuracy: string;
  accuracyVal: number;
  f1Score: string;
  f1Val: number;
  driftRate: string;
  driftVal: number;
  status: 'DEPLOYED' | 'NOT DEPLOYED' | 'ARCHIVED';
  environment: 'Production' | 'Staging' | 'Canary (50%)' | 'Cold Storage';
  datasetName: string;
  datasetHash: string;
  artifactPath: string;
  approvedBy: string;
  precision: string;
  recall: string;
  latencyMs: string;
}

export interface ModelProfile {
  id: string;
  name: string;
  purpose: string;
  modelType: string;
  baseFramework: string;
  statusBadge: string;
  versions: ModelVersionItem[];
  configuration: {
    decisionThreshold: string;
    batchSize: string;
    maxSeqLength: string;
    tokenizer: string;
    quantization: string;
  };
  relatedCases: {
    caseId: string;
    title: string;
    prediction: string;
    confidence: string;
    timestamp: string;
    validated: boolean;
  }[];
}

interface AIMLModelVersionsViewProps {
  models?: ModelMetric[];
  initialModelId?: string;
  onSelectTab: (tab: string) => void;
}

export const AIMLModelVersionsView: React.FC<AIMLModelVersionsViewProps> = ({
  models,
  initialModelId,
  onSelectTab
}) => {
  // Comprehensive models database with versions matching reference design
  const [modelProfiles, setModelProfiles] = useState<Record<string, ModelProfile>>({
    'url-phishing': {
      id: 'url-phishing',
      name: 'URL Phishing Detector',
      purpose: 'Zero-Hour Domain, URL Structure & Lexical Threat Scoring',
      modelType: 'XGBoost Classifier',
      baseFramework: 'PYTORCH 2.3',
      statusBadge: 'ACTIVE MODEL',
      configuration: {
        decisionThreshold: '0.50 (Calibrated with isotonic regression)',
        batchSize: '64 requests / batch',
        maxSeqLength: '256 characters (URL Tokenizer)',
        tokenizer: 'Byte-Pair Lexical URL Tokenizer',
        quantization: 'FP16 ONNX Runtime Engine'
      },
      relatedCases: [
        { caseId: 'CR-2026-8821', title: 'SBI Yono APK Smishing Campaign', prediction: 'PHISHING (0.984)', confidence: '98.4%', timestamp: '2026-10-22 14:12', validated: true },
        { caseId: 'CR-2026-7492', title: 'Fake Electricity Bill Disconnection Portal', prediction: 'MALICIOUS_DOMAIN (0.972)', confidence: '97.2%', timestamp: '2026-10-21 09:40', validated: true },
        { caseId: 'CR-2026-6104', title: 'Aadhaar Biometric Update Phishing Gateway', prediction: 'CREDENTIAL_HARVESTER (0.991)', confidence: '99.1%', timestamp: '2026-10-20 18:25', validated: true }
      ],
      versions: [
        {
          version: 'v2.1',
          badge: 'CURRENT',
          date: '12 Jun 2026, 10:24 AM',
          notes: 'Fine-tuned on 12k recent voice samples with GAN vocoder detection.',
          accuracy: '98.9%',
          accuracyVal: 98.9,
          f1Score: '0.982',
          f1Val: 98.2,
          driftRate: '0.2%',
          driftVal: 2.0,
          status: 'DEPLOYED',
          environment: 'Production',
          datasetName: 'CERT-In Phishing Corpus 2026 (v4.2)',
          datasetHash: '9a8b1c4d7e2f3a5b6c8d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
          artifactPath: 's3://ccip-models-enclave/url-phishing/v2.1/model.onnx',
          approvedBy: 'Dr. Aris Thorne (Sovereign Validator)',
          precision: '99.1%',
          recall: '98.7%',
          latencyMs: '18ms'
        },
        {
          version: 'v2.0',
          badge: 'STABLE',
          date: '18 Apr 2026, 02:15 PM',
          notes: 'Added spectral FFT residual feature extraction layer.',
          accuracy: '97.4%',
          accuracyVal: 97.4,
          f1Score: '0.969',
          f1Val: 96.9,
          driftRate: '0.8%',
          driftVal: 8.0,
          status: 'NOT DEPLOYED',
          environment: 'Staging',
          datasetName: 'CERT-In Phishing Corpus 2026 (v3.9)',
          datasetHash: '7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c',
          artifactPath: 's3://ccip-models-enclave/url-phishing/v2.0/model.onnx',
          approvedBy: 'Naveen (Lead Operator)',
          precision: '97.8%',
          recall: '97.0%',
          latencyMs: '21ms'
        },
        {
          version: 'v1.4',
          badge: 'LEGACY',
          date: '10 Jan 2026, 09:40 AM',
          notes: 'Initial baseline acoustic classification model.',
          accuracy: '94.8%',
          accuracyVal: 94.8,
          f1Score: '0.938',
          f1Val: 93.8,
          driftRate: '1.5%',
          driftVal: 15.0,
          status: 'ARCHIVED',
          environment: 'Cold Storage',
          datasetName: 'Historical Threat Logs 2025 (v1.0)',
          datasetHash: '3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
          artifactPath: 's3://ccip-models-enclave/url-phishing/v1.4/model.bin',
          approvedBy: 'Archived by Compliance Policy',
          precision: '95.2%',
          recall: '94.4%',
          latencyMs: '32ms'
        }
      ]
    },
    'email-threat': {
      id: 'email-threat',
      name: 'Email Threat Classifier',
      purpose: 'DistilBERT Binary Sequence Classification (Threat / Safe)',
      modelType: 'DistilBERT Transformer',
      baseFramework: 'HUGGINGFACE 4.40',
      statusBadge: 'ACTIVE MODEL',
      configuration: {
        decisionThreshold: '0.01133 (High-Recall Threat Isolation)',
        batchSize: '32 emails / batch',
        maxSeqLength: '512 tokens',
        tokenizer: 'DistilBERT Fast WordPiece Tokenizer',
        quantization: 'INT8 Quantized Dynamic Engine'
      },
      relatedCases: [
        { caseId: 'CR-2026-9120', title: 'CEO Impersonation Wire Transfer BEC', prediction: 'SPEAR_PHISHING (0.994)', confidence: '99.4%', timestamp: '2026-10-23 08:15', validated: true },
        { caseId: 'CR-2026-8051', title: 'Tax Refund Malicious Excel Macro Attachment', prediction: 'MALWARE_DROPPER (0.988)', confidence: '98.8%', timestamp: '2026-10-21 16:40', validated: true }
      ],
      versions: [
        {
          version: 'v1.0.0',
          badge: 'CURRENT',
          date: '09 Jun 2026, 18:40 UTC',
          notes: 'DistilBERT multi-header threat sequence classifier with SPF/DKIM feature alignment.',
          accuracy: '98.36%',
          accuracyVal: 98.36,
          f1Score: '0.983',
          f1Val: 98.3,
          driftRate: '0.6%',
          driftVal: 6.0,
          status: 'DEPLOYED',
          environment: 'Production',
          datasetName: 'Sovereign Enclave Threat Feed Headers (v1.9)',
          datasetHash: '87e209ab14bcdef0123456789abcdef0123456789abcdef0123456789abcdef0',
          artifactPath: 's3://ccip-models-enclave/email-threat/v1.0.0/pytorch_model.bin',
          approvedBy: 'Dr. Aris Thorne (Sovereign Validator)',
          precision: '98.6%',
          recall: '98.1%',
          latencyMs: '34ms'
        },
        {
          version: 'v0.9.4',
          badge: 'STABLE',
          date: '14 Apr 2026, 12:10 UTC',
          notes: 'Candidate release with calibrated false-positive suppression on corporate billing receipts.',
          accuracy: '97.10%',
          accuracyVal: 97.10,
          f1Score: '0.968',
          f1Val: 96.8,
          driftRate: '0.9%',
          driftVal: 9.0,
          status: 'NOT DEPLOYED',
          environment: 'Staging',
          datasetName: 'Sovereign Enclave Threat Feed Headers (v1.5)',
          datasetHash: '12a34b56c78def0123456789abcdef0123456789abcdef0123456789abcdef01',
          artifactPath: 's3://ccip-models-enclave/email-threat/v0.9.4/pytorch_model.bin',
          approvedBy: 'Naveen (Lead Operator)',
          precision: '97.5%',
          recall: '96.7%',
          latencyMs: '38ms'
        },
        {
          version: 'v0.5.0',
          badge: 'LEGACY',
          date: '05 Jan 2026, 10:00 UTC',
          notes: 'Initial prototype trained on public spam corpus with naive Bayes benchmark.',
          accuracy: '92.40%',
          accuracyVal: 92.40,
          f1Score: '0.915',
          f1Val: 91.5,
          driftRate: '2.1%',
          driftVal: 21.0,
          status: 'ARCHIVED',
          environment: 'Cold Storage',
          datasetName: 'Enron & Public Phishing Corpus (v0.8)',
          datasetHash: '45c67d89e01f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
          artifactPath: 's3://ccip-models-enclave/email-threat/v0.5.0/model.bin',
          approvedBy: 'Archived by Model Governance',
          precision: '93.0%',
          recall: '91.8%',
          latencyMs: '45ms'
        }
      ]
    },
    'sms-scam': {
      id: 'sms-scam',
      name: 'SMS Scam Classifier',
      purpose: 'DistilBERT Binary Smishing & SMS Fraud Detection',
      modelType: 'DistilBERT Smishing Head',
      baseFramework: 'PYTORCH 2.3',
      statusBadge: 'ACTIVE MODEL',
      configuration: {
        decisionThreshold: '0.2685 (Calibrated for Smishing Suppression)',
        batchSize: '128 texts / batch',
        maxSeqLength: '160 characters (Standard Indian SMS)',
        tokenizer: 'Smishing Special Tokenizer with Phone/URL Replacers',
        quantization: 'FP16 TensorRT Engine'
      },
      relatedCases: [
        { caseId: 'CR-2026-9430', title: 'Electricity Bill Disconnection Smishing', prediction: 'SMISHING (0.988)', confidence: '98.8%', timestamp: '2026-10-23 11:00', validated: true },
        { caseId: 'CR-2026-8912', title: 'Part-Time Telegram Job Scam Invitation', prediction: 'TELEGRAM_FRAUD (0.979)', confidence: '97.9%', timestamp: '2026-10-22 17:30', validated: true }
      ],
      versions: [
        {
          version: 'v1.0.0',
          badge: 'CURRENT',
          date: '07 Jun 2026, 11:10 UTC',
          notes: 'DistilBERT fast smishing tokenizer fine-tuned on 45,000 anonymized 1930 helpline reports.',
          accuracy: '98.84%',
          accuracyVal: 98.84,
          f1Score: '0.988',
          f1Val: 98.8,
          driftRate: '0.4%',
          driftVal: 4.0,
          status: 'DEPLOYED',
          environment: 'Production',
          datasetName: '1930 Helpline Citizen SMS Reports (v3.1)',
          datasetHash: '34a1789c8ef0123456789abcdef0123456789abcdef0123456789abcdef01234',
          artifactPath: 's3://ccip-models-enclave/sms-scam/v1.0.0/model.onnx',
          approvedBy: 'Dr. Aris Thorne (Sovereign Validator)',
          precision: '99.0%',
          recall: '98.7%',
          latencyMs: '22ms'
        },
        {
          version: 'v0.9.1',
          badge: 'STABLE',
          date: '19 Mar 2026, 15:45 UTC',
          notes: 'Added regex preprocessing for Indian 10-digit mobile number masks.',
          accuracy: '97.50%',
          accuracyVal: 97.50,
          f1Score: '0.971',
          f1Val: 97.1,
          driftRate: '0.7%',
          driftVal: 7.0,
          status: 'NOT DEPLOYED',
          environment: 'Staging',
          datasetName: '1930 Helpline Citizen SMS Reports (v2.4)',
          datasetHash: '56b23cd45e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
          artifactPath: 's3://ccip-models-enclave/sms-scam/v0.9.1/model.onnx',
          approvedBy: 'Naveen (Lead Operator)',
          precision: '97.9%',
          recall: '97.1%',
          latencyMs: '24ms'
        },
        {
          version: 'v0.4.0',
          badge: 'LEGACY',
          date: '12 Dec 2025, 08:30 UTC',
          notes: 'Baseline keyword blacklist classifier.',
          accuracy: '90.80%',
          accuracyVal: 90.80,
          f1Score: '0.895',
          f1Val: 89.5,
          driftRate: '2.4%',
          driftVal: 24.0,
          status: 'ARCHIVED',
          environment: 'Cold Storage',
          datasetName: 'Raw Telecom SMS Sample (v1.0)',
          datasetHash: '78d45ef67a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
          artifactPath: 's3://ccip-models-enclave/sms-scam/v0.4.0/model.bin',
          approvedBy: 'Archived by Operator',
          precision: '91.5%',
          recall: '90.1%',
          latencyMs: '30ms'
        }
      ]
    },
    'complaint-classifier': {
      id: 'complaint-classifier',
      name: 'Cybercrime Complaint Classifier',
      purpose: 'DeBERTa-v3 18-Category Cybercrime Legal Triage & Jurisdiction',
      modelType: 'DeBERTa-v3 Multi-Label',
      baseFramework: 'TRANSFORMERS 4.39',
      statusBadge: 'ACTIVE MODEL',
      configuration: {
        decisionThreshold: 'Per-Label Calibrated (18 classes, avg 0.45)',
        batchSize: '16 complaints / batch',
        maxSeqLength: '1024 tokens',
        tokenizer: 'DeBERTa-v3 Multi-Lingual Tokenizer',
        quantization: 'FP16 PyTorch JIT Trace'
      },
      relatedCases: [
        { caseId: 'CR-2026-9812', title: 'Unauthorized SIM Swap & UPI Drain', prediction: 'FINANCIAL_FRAUD_SIM_SWAP (0.978)', confidence: '97.8%', timestamp: '2026-10-23 15:20', validated: true },
        { caseId: 'CR-2026-9210', title: 'Deepfake Video Extortion on WhatsApp', prediction: 'CYBER_EXTORTION_DEEPFAKE (0.985)', confidence: '98.5%', timestamp: '2026-10-22 19:10', validated: true }
      ],
      versions: [
        {
          version: 'complaint-dataset-v1.1.0',
          badge: 'CURRENT',
          date: '04 Jun 2026, 09:15 UTC',
          notes: 'DeBERTa-v3 large multi-label triage fine-tuned on 18 national cybercrime categories with legal act mappings.',
          accuracy: '96.79%',
          accuracyVal: 96.79,
          f1Score: '0.977',
          f1Val: 97.7,
          driftRate: '1.1%',
          driftVal: 11.0,
          status: 'DEPLOYED',
          environment: 'Production',
          datasetName: 'National Cybercrime Portal Anonymized Intake (v2.8)',
          datasetHash: 'f4b2e81a390d4567890123456789abcdef0123456789abcdef0123456789abcd',
          artifactPath: 's3://ccip-models-enclave/complaint-classifier/v1.1.0/pytorch_model.bin',
          approvedBy: 'Dr. Aris Thorne (Sovereign Validator)',
          precision: '97.1%',
          recall: '96.5%',
          latencyMs: '65ms'
        },
        {
          version: 'complaint-dataset-v1.0.0',
          badge: 'STABLE',
          date: '10 Mar 2026, 14:00 UTC',
          notes: 'Baseline 18-class triage model with focal loss optimization.',
          accuracy: '95.10%',
          accuracyVal: 95.10,
          f1Score: '0.952',
          f1Val: 95.2,
          driftRate: '1.4%',
          driftVal: 14.0,
          status: 'NOT DEPLOYED',
          environment: 'Staging',
          datasetName: 'National Cybercrime Portal Anonymized Intake (v2.0)',
          datasetHash: '12e34f56a78b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
          artifactPath: 's3://ccip-models-enclave/complaint-classifier/v1.0.0/pytorch_model.bin',
          approvedBy: 'Naveen (Lead Operator)',
          precision: '95.8%',
          recall: '94.9%',
          latencyMs: '70ms'
        },
        {
          version: 'v0.3-prototype',
          badge: 'LEGACY',
          date: '15 Nov 2025, 11:30 UTC',
          notes: 'Rule-augmented keyword classifier for primary 6 complaint genres.',
          accuracy: '88.90%',
          accuracyVal: 88.90,
          f1Score: '0.880',
          f1Val: 88.0,
          driftRate: '3.0%',
          driftVal: 30.0,
          status: 'ARCHIVED',
          environment: 'Cold Storage',
          datasetName: 'Intake Prototype Sample (v0.5)',
          datasetHash: '98a76b54c32d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f',
          artifactPath: 's3://ccip-models-enclave/complaint-classifier/v0.3/model.bin',
          approvedBy: 'Archived by Operator',
          precision: '89.5%',
          recall: '87.4%',
          latencyMs: '82ms'
        }
      ]
    },
    'cyber-ner': {
      id: 'cyber-ner',
      name: 'Cyber NER Transformer',
      purpose: 'DeBERTa-v3 Token Classification (11 Cyber Entity Classes, 23 BIO Labels)',
      modelType: 'DeBERTa-v3 Token Classifier',
      baseFramework: 'SPACY / HUGGINGFACE',
      statusBadge: 'ACTIVE MODEL',
      configuration: {
        decisionThreshold: '0.70 (Token BIO Softmax Cutoff)',
        batchSize: '32 passages / batch',
        maxSeqLength: '512 tokens',
        tokenizer: 'Byte-Level BPE with Special Regex Entity Markers',
        quantization: 'ONNX Runtime Optimized'
      },
      relatedCases: [
        { caseId: 'CR-2026-8821', title: 'Extracted 14 Indicators from Victim WhatsApp Chat', prediction: '14 ENTITIES (UPI, IP, Mobile, Hash)', confidence: '96.8%', timestamp: '2026-10-22 14:15', validated: true }
      ],
      versions: [
        {
          version: 'cyber-ner-bootstrap-v4.0.0',
          badge: 'CURRENT',
          date: '03 Jun 2026, 16:30 UTC',
          notes: 'DeBERTa-v3 token classification for 11 cyber entities: UPI, crypto, IP, email, phone, bank, hash.',
          accuracy: '95.52%',
          accuracyVal: 95.52,
          f1Score: '0.955',
          f1Val: 95.5,
          driftRate: '1.2%',
          driftVal: 12.0,
          status: 'DEPLOYED',
          environment: 'Production',
          datasetName: 'Cyber Threat Intelligence Entity Corpus (v4.0)',
          datasetHash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
          artifactPath: 's3://ccip-models-enclave/cyber-ner/v4.0.0/model.onnx',
          approvedBy: 'Dr. Aris Thorne (Sovereign Validator)',
          precision: '96.1%',
          recall: '95.0%',
          latencyMs: '48ms'
        },
        {
          version: 'cyber-ner-v3.1.0',
          badge: 'STABLE',
          date: '20 Mar 2026, 10:15 UTC',
          notes: 'Added support for IPv6 CIDR and obfuscated telegram handles.',
          accuracy: '94.20%',
          accuracyVal: 94.20,
          f1Score: '0.939',
          f1Val: 93.9,
          driftRate: '1.5%',
          driftVal: 15.0,
          status: 'NOT DEPLOYED',
          environment: 'Staging',
          datasetName: 'Cyber Threat Intelligence Entity Corpus (v3.2)',
          datasetHash: '2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
          artifactPath: 's3://ccip-models-enclave/cyber-ner/v3.1.0/model.onnx',
          approvedBy: 'Naveen (Lead Operator)',
          precision: '94.8%',
          recall: '93.5%',
          latencyMs: '52ms'
        },
        {
          version: 'cyber-ner-v2.0.0',
          badge: 'LEGACY',
          date: '10 Jan 2026, 12:00 UTC',
          notes: 'Initial SpaCy pipeline with regex heuristics.',
          accuracy: '89.50%',
          accuracyVal: 89.50,
          f1Score: '0.887',
          f1Val: 88.7,
          driftRate: '2.6%',
          driftVal: 26.0,
          status: 'ARCHIVED',
          environment: 'Cold Storage',
          datasetName: 'Entity Extraction Seed (v1.0)',
          datasetHash: '3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
          artifactPath: 's3://ccip-models-enclave/cyber-ner/v2.0.0/model.bin',
          approvedBy: 'Archived by Operator',
          precision: '90.2%',
          recall: '88.1%',
          latencyMs: '60ms'
        }
      ]
    },
    'case-similarity': {
      id: 'case-similarity',
      name: 'Case Similarity Transformer',
      purpose: 'all-MiniLM-L6-v2 384-d Dense Semantic Embeddings (Cosine Threshold: 0.55)',
      modelType: 'Dense Bi-Encoder',
      baseFramework: 'SENTENCE-TRANSFORMERS',
      statusBadge: 'ACTIVE MODEL',
      configuration: {
        decisionThreshold: '0.55 (Cosine Similarity Cluster Cutoff)',
        batchSize: '64 pairs / batch',
        maxSeqLength: '384 tokens',
        tokenizer: 'WordPiece Subword Tokenizer',
        quantization: 'FP16 PyTorch Vector Engine'
      },
      relatedCases: [
        { caseId: 'CR-2026-8821', title: 'Correlated with CR-2026-7492 (0.78 Cosine)', prediction: 'HIGH_CORRELATION', confidence: '88.4%', timestamp: '2026-10-22 14:18', validated: true }
      ],
      versions: [
        {
          version: 'case-similarity-bootstrap-v1.0.0',
          badge: 'CURRENT',
          date: '01 Jun 2026, 10:00 UTC',
          notes: 'all-MiniLM-L6-v2 fine-tuned on cross-case incident narratives for cybercrime cluster discovery.',
          accuracy: '92.5%',
          accuracyVal: 92.5,
          f1Score: '0.925',
          f1Val: 92.5,
          driftRate: '0.5%',
          driftVal: 5.0,
          status: 'DEPLOYED',
          environment: 'Production',
          datasetName: 'Cross-Case Incident Narrative Pairs (v1.0)',
          datasetHash: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
          artifactPath: 's3://ccip-models-enclave/case-similarity/v1.0.0/model.pt',
          approvedBy: 'Dr. Aris Thorne (Sovereign Validator)',
          precision: '93.2%',
          recall: '91.8%',
          latencyMs: '28ms'
        },
        {
          version: 'case-similarity-v0.8.0',
          badge: 'STABLE',
          date: '15 Mar 2026, 11:20 UTC',
          notes: 'Pre-trained sentence transformer without domestic FIR domain adaptation.',
          accuracy: '89.1%',
          accuracyVal: 89.1,
          f1Score: '0.884',
          f1Val: 88.4,
          driftRate: '0.9%',
          driftVal: 9.0,
          status: 'NOT DEPLOYED',
          environment: 'Staging',
          datasetName: 'Cross-Case Incident Narrative Pairs (v0.5)',
          datasetHash: '8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d',
          artifactPath: 's3://ccip-models-enclave/case-similarity/v0.8.0/model.pt',
          approvedBy: 'Naveen (Lead Operator)',
          precision: '90.0%',
          recall: '88.2%',
          latencyMs: '30ms'
        },
        {
          version: 'case-similarity-v0.2.0',
          badge: 'LEGACY',
          date: '12 Dec 2025, 14:00 UTC',
          notes: 'TF-IDF Vector Space Model baseline.',
          accuracy: '82.4%',
          accuracyVal: 82.4,
          f1Score: '0.810',
          f1Val: 81.0,
          driftRate: '2.0%',
          driftVal: 20.0,
          status: 'ARCHIVED',
          environment: 'Cold Storage',
          datasetName: 'Legacy Incident Bag-of-Words (v1.0)',
          datasetHash: '7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c',
          artifactPath: 's3://ccip-models-enclave/case-similarity/v0.2.0/model.bin',
          approvedBy: 'Archived by Operator',
          precision: '83.5%',
          recall: '80.5%',
          latencyMs: '15ms'
        }
      ]
    },
    'incident-urgency': {
      id: 'incident-urgency',
      name: 'Incident Urgency Classifier',
      purpose: 'DistilRoBERTa-v3 Narrative Urgency Triage (LOW, MEDIUM, HIGH, CRITICAL)',
      modelType: 'DistilRoBERTa-v3 4-Class',
      baseFramework: 'PYTORCH 2.3',
      statusBadge: 'ACTIVE MODEL',
      configuration: {
        decisionThreshold: 'Argmax Probability with Priority Boost for Financial Velocity',
        batchSize: '32 complaints / batch',
        maxSeqLength: '512 tokens',
        tokenizer: 'DistilRoBERTa Byte-Level Tokenizer',
        quantization: 'FP16 PyTorch Trace Engine'
      },
      relatedCases: [
        { caseId: 'CR-2026-9812', title: 'Unauthorized Transfer of INR 12 Lakhs within 15 mins', prediction: 'CRITICAL (0.962)', confidence: '96.2%', timestamp: '2026-10-23 15:21', validated: true }
      ],
      versions: [
        {
          version: 'incident-urgency-v1.0.0',
          badge: 'CURRENT',
          date: '28 May 2026, 15:45 UTC',
          notes: 'DistilRoBERTa-v3 narrative urgency triage for rapid police & bank freeze dispatch.',
          accuracy: '89.75%',
          accuracyVal: 89.75,
          f1Score: '0.898',
          f1Val: 89.8,
          driftRate: '0.7%',
          driftVal: 7.0,
          status: 'DEPLOYED',
          environment: 'Production',
          datasetName: 'Emergency Triage Dispatch Logs (v1.2)',
          datasetHash: '4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b',
          artifactPath: 's3://ccip-models-enclave/incident-urgency/v1.0.0/model.pt',
          approvedBy: 'Dr. Aris Thorne (Sovereign Validator)',
          precision: '90.4%',
          recall: '89.1%',
          latencyMs: '26ms'
        },
        {
          version: 'incident-urgency-v0.7.0',
          badge: 'STABLE',
          date: '10 Apr 2026, 13:30 UTC',
          notes: '3-tier priority categorization (Low, Medium, High).',
          accuracy: '87.20%',
          accuracyVal: 87.20,
          f1Score: '0.865',
          f1Val: 86.5,
          driftRate: '1.1%',
          driftVal: 11.0,
          status: 'NOT DEPLOYED',
          environment: 'Staging',
          datasetName: 'Emergency Triage Dispatch Logs (v0.8)',
          datasetHash: '5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c',
          artifactPath: 's3://ccip-models-enclave/incident-urgency/v0.7.0/model.pt',
          approvedBy: 'Naveen (Lead Operator)',
          precision: '88.1%',
          recall: '86.4%',
          latencyMs: '29ms'
        },
        {
          version: 'incident-urgency-v0.3.0',
          badge: 'LEGACY',
          date: '02 Feb 2026, 09:15 UTC',
          notes: 'Heuristic keyword based threshold rules.',
          accuracy: '81.50%',
          accuracyVal: 81.50,
          f1Score: '0.798',
          f1Val: 79.8,
          driftRate: '2.3%',
          driftVal: 23.0,
          status: 'ARCHIVED',
          environment: 'Cold Storage',
          datasetName: 'Rule Matrix v1',
          datasetHash: '6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d',
          artifactPath: 's3://ccip-models-enclave/incident-urgency/v0.3.0/rules.json',
          approvedBy: 'Archived by Operator',
          precision: '82.0%',
          recall: '80.0%',
          latencyMs: '10ms'
        }
      ]
    },
    'investigation-assistant': {
      id: 'investigation-assistant',
      name: 'Investigation Assistant',
      purpose: 'Astraea Sovereign Forensic Reasoning Engine (Sovereign Enclave)',
      modelType: 'Rules & Inference Engine',
      baseFramework: 'ASTRAEA SOVEREIGN CORE',
      statusBadge: 'ACTIVE MODEL',
      configuration: {
        decisionThreshold: 'Deterministic Multi-Step Forensic Rules & Graph Correlator',
        batchSize: 'Real-time Stream Engine',
        maxSeqLength: 'Full Case Dossier Graph',
        tokenizer: 'Multi-Signal Evidence Tokenizer',
        quantization: 'Native Deterministic Assembly'
      },
      relatedCases: [
        { caseId: 'CYBER-2026-7102', title: 'UPI / QR Code Payment Scam', prediction: 'SYNDICATE_MULE_CORRELATED', confidence: '98.4%', timestamp: '2026-10-24 11:30', validated: true },
        { caseId: 'CYBER-2026-7033', title: 'Mule Account Syndicated Network', prediction: 'ORGANIZED_CRIME_TIER1', confidence: '99.2%', timestamp: '2026-10-23 16:45', validated: true }
      ],
      versions: [
        {
          version: 'v2.0.0',
          badge: 'CURRENT',
          date: '11 Jun 2026, 04:50 UTC',
          notes: 'Astraea multi-signal reasoning pipeline with real-time evidence graph link correlation.',
          accuracy: '98.40%',
          accuracyVal: 98.40,
          f1Score: '0.984',
          f1Val: 98.4,
          driftRate: '0.0%',
          driftVal: 0.0,
          status: 'DEPLOYED',
          environment: 'Production',
          datasetName: 'IT Act 2000 Statutory Directives + CERT-In Rules 2022',
          datasetHash: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
          artifactPath: 's3://ccip-models-enclave/investigation-assistant/v2.0.0/rules_engine.json',
          approvedBy: 'CCIP Sovereign System Authority',
          precision: '99.2%',
          recall: '97.6%',
          latencyMs: '12ms'
        },
        {
          version: 'v1.4.0',
          badge: 'STABLE',
          date: '02 Mar 2026, 11:20 UTC',
          notes: 'Deterministic case triage rules with statutory jurisdiction routing.',
          accuracy: '97.10%',
          accuracyVal: 97.10,
          f1Score: '0.965',
          f1Val: 96.5,
          driftRate: '0.0%',
          driftVal: 0.0,
          status: 'NOT DEPLOYED',
          environment: 'Staging',
          datasetName: 'IT Act 2000 Statutory Directives (v1.2)',
          datasetHash: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
          artifactPath: 's3://ccip-models-enclave/investigation-assistant/v1.4.0/rules_engine.json',
          approvedBy: 'Naveen (Lead Operator)',
          precision: '97.5%',
          recall: '96.0%',
          latencyMs: '15ms'
        }
      ]
    }
  });

  // Active selection
  const [selectedModelId, setSelectedModelId] = useState<string>(initialModelId || 'url-phishing');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'lineage' | 'evaluation' | 'deployment' | 'dataset' | 'config' | 'cases'>('lineage');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Selected Version for Detail Drawer
  const [inspectingVersion, setInspectingVersion] = useState<ModelVersionItem | null>(null);

  // Add Version Modal
  const [isAddVersionModalOpen, setIsAddVersionModalOpen] = useState(false);
  const [newVersionForm, setNewVersionForm] = useState({
    version: '',
    badge: 'CANDIDATE' as ModelVersionItem['badge'],
    notes: '',
    accuracy: '98.5%',
    f1Score: '0.981',
    driftRate: '0.3%',
    datasetName: 'Sovereign Enclave Curated Batch 2026',
    artifactPath: 's3://ccip-models-enclave/candidates/'
  });
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const activeProfile = modelProfiles[selectedModelId] || modelProfiles['url-phishing'];

  const modelOptions = [
    { id: 'url-phishing', label: 'URL Phishing Detector' },
    { id: 'email-threat', label: 'Email Threat Classifier' },
    { id: 'sms-scam', label: 'SMS Scam Classifier' },
    { id: 'complaint-classifier', label: 'Cybercrime Complaint Classifier' },
    { id: 'cyber-ner', label: 'Cyber NER Transformer' },
    { id: 'case-similarity', label: 'Case Similarity Transformer' },
    { id: 'incident-urgency', label: 'Incident Urgency Classifier' }
  ];

  const handleSelectModel = (id: string) => {
    setSelectedModelId(id);
    setIsDropdownOpen(false);
  };

  const handleAddVersionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionForm.version.trim() || !newVersionForm.notes.trim()) return;

    const newVer: ModelVersionItem = {
      version: newVersionForm.version.trim(),
      badge: newVersionForm.badge,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      notes: newVersionForm.notes.trim(),
      accuracy: newVersionForm.accuracy,
      accuracyVal: parseFloat(newVersionForm.accuracy) || 98.0,
      f1Score: newVersionForm.f1Score,
      f1Val: parseFloat(newVersionForm.f1Score) * 100 || 98.0,
      driftRate: newVersionForm.driftRate,
      driftVal: parseFloat(newVersionForm.driftRate) * 10 || 3.0,
      status: 'NOT DEPLOYED',
      environment: 'Staging',
      datasetName: newVersionForm.datasetName,
      datasetHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      artifactPath: newVersionForm.artifactPath + newVersionForm.version.trim() + '/model.onnx',
      approvedBy: 'Awaiting Validator Sign-Off',
      precision: '98.2%',
      recall: '97.9%',
      latencyMs: '22ms'
    };

    setModelProfiles(prev => ({
      ...prev,
      [selectedModelId]: {
        ...prev[selectedModelId],
        versions: [newVer, ...prev[selectedModelId].versions]
      }
    }));

    setIsAddVersionModalOpen(false);
    setFeedbackMessage(`CANDIDATE VERSION ${newVer.version} registered for ${activeProfile.name}. Awaiting evaluation & sign-off.`);
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const handleDeployVersion = (version: ModelVersionItem) => {
    setModelProfiles(prev => {
      const currentList = prev[selectedModelId].versions.map(v => {
        if (v.version === version.version) {
          return { ...v, status: 'DEPLOYED' as const, badge: 'CURRENT' as const, environment: 'Production' as const };
        } else if (v.status === 'DEPLOYED') {
          return { ...v, status: 'NOT DEPLOYED' as const, badge: 'STABLE' as const, environment: 'Staging' as const };
        }
        return v;
      });
      return {
        ...prev,
        [selectedModelId]: {
          ...prev[selectedModelId],
          versions: currentList
        }
      };
    });

    setFeedbackMessage(`DEPLOYMENT SUCCESSFUL: ${activeProfile.name} is now serving production traffic with ${version.version}.`);
    setInspectingVersion(null);
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  return (
    <div className="flex flex-col gap-5 text-content-primary animate-in fade-in duration-200">
      {/* 1. BREADCRUMB */}
      <div className="flex items-center gap-2 text-xs font-mono text-[#8fa396]">
        <span>Model Versions</span>
        <span className="text-slate-600">/</span>
        <span className="text-slate-300 font-bold">Model Details</span>
      </div>

      {feedbackMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-mono">{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. TOP DUAL CARDS */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-4 relative transition-all ${isDropdownOpen ? 'z-50' : 'z-20'}`}>
        {/* Left Card: Select Model */}
        <div className={`lg:col-span-4 rounded-2xl bg-[#0c1310]/95 border border-emerald-900/40 p-5 flex flex-col justify-between shadow-xl relative ${isDropdownOpen ? 'z-50' : 'z-20'}`}>
          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <GitBranch className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Select Model</h2>
              <p className="text-xs text-[#8fa396] mt-0.5">Choose a model to view its versions and details</p>
            </div>
          </div>

          {/* Custom Select Dropdown matching reference image */}
          <div ref={dropdownRef} className="relative z-50">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-[#121c17] border border-emerald-900/40 hover:border-emerald-500/60 rounded-xl px-3.5 py-2.5 text-xs text-white font-sans flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="font-semibold text-slate-100">{activeProfile.name}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl bg-[#0a140f] border border-[#00e676]/60 shadow-[0_15px_50px_rgba(0,0,0,0.95)] overflow-hidden py-1 divide-y divide-emerald-900/30 font-sans max-h-72 overflow-y-auto">
                {modelOptions.map((opt) => {
                  const isSelected = opt.id === selectedModelId;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectModel(opt.id)}
                      className={`w-full px-3.5 py-2.5 text-xs text-left flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected ? 'bg-emerald-950/70 text-emerald-400 font-bold' : 'text-slate-300 hover:bg-[#16231d] hover:text-white'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Model Details & Tabs */}
        <div className="lg:col-span-8 rounded-2xl bg-[#0c1310]/95 border border-emerald-900/40 p-5 flex flex-col justify-between shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-900/30">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <Activity className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-base font-bold text-white tracking-tight">{activeProfile.name}</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/50 text-emerald-400 text-[10px] font-mono font-bold tracking-wider">
                    {activeProfile.statusBadge}
                  </span>
                </div>
                <p className="text-xs text-[#8fa396] mt-1 leading-relaxed">
                  {activeProfile.purpose}
                </p>
              </div>
            </div>

            {/* Spec boxes */}
            <div className="flex items-center gap-4 self-start sm:self-auto font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-[#121c17] border border-emerald-900/40">
                <span className="text-[10px] text-[#8fa396] block uppercase font-semibold">MODEL TYPE</span>
                <span className="text-white font-bold text-xs">{activeProfile.modelType}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#121c17] border border-emerald-900/40">
                <span className="text-[10px] text-[#8fa396] block uppercase font-semibold">BASE FRAMEWORK</span>
                <span className="text-white font-bold text-xs">{activeProfile.baseFramework}</span>
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-6 overflow-x-auto pt-3 text-xs font-mono scrollbar-none">
            {[
              { id: 'lineage', label: 'Version Lineage' },
              { id: 'evaluation', label: 'Evaluation Metrics' },
              { id: 'deployment', label: 'Deployment History' },
              { id: 'dataset', label: 'Dataset & Training' },
              { id: 'config', label: 'Configuration' },
              { id: 'cases', label: 'Related Cases' }
            ].map(tab => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`pb-1 whitespace-nowrap transition-colors relative cursor-pointer ${
                    isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. MAIN SECTION: VERSION LINEAGE & METRIC PROGRESSION */}
      {activeSubTab === 'lineage' && (
        <div className="rounded-2xl bg-[#0c1310]/95 border border-emerald-900/40 p-6 flex flex-col gap-6 shadow-xl backdrop-blur-md relative z-10">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Layers className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">Version Lineage & Metric Progression</h3>
                <p className="text-xs text-[#8fa396]">Track all versions, their improvements, and deployment status.</p>
              </div>
            </div>

            <button
              onClick={() => setIsAddVersionModalOpen(true)}
              className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-[#07130e] text-xs font-bold font-mono tracking-wide flex items-center gap-2 shadow-[0_0_20px_rgba(0,230,118,0.35)] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3] text-black" />
              <span>Add New Version</span>
            </button>
          </div>

          {/* Vertical Timeline with Version Rows matching reference image */}
          <div className="relative pl-6 sm:pl-8 space-y-4 font-sans">
            {/* Connecting Vertical Line */}
            <div className="absolute left-[11px] sm:left-[15px] top-6 bottom-6 w-0.5 bg-emerald-900/40" />

            {activeProfile.versions.map((ver, idx) => {
              const isDeployed = ver.status === 'DEPLOYED';
              const isStable = ver.badge === 'STABLE';
              const isCurrent = ver.badge === 'CURRENT';

              // Dot styling
              const dotColor = isCurrent 
                ? 'bg-[#00e676] ring-4 ring-emerald-500/20' 
                : isStable 
                ? 'bg-amber-400 ring-4 ring-amber-500/20' 
                : 'bg-slate-500 ring-4 ring-slate-500/20';

              return (
                <div key={ver.version} className="relative group">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[19px] sm:-left-[23px] top-6 w-3 h-3 rounded-full ${dotColor} z-10 transition-transform group-hover:scale-125`} />

                  {/* Version Row Card */}
                  <div 
                    onClick={() => setInspectingVersion(ver)}
                    className="p-4 sm:p-5 rounded-2xl bg-[#101914] border border-emerald-900/30 hover:border-emerald-500/50 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer"
                  >
                    {/* Left: Version Tag, Badge, Date & Notes */}
                    <div className="flex-1 min-w-[280px]">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-base font-bold font-mono ${isCurrent ? 'text-emerald-400' : 'text-slate-100'}`}>
                          {ver.version}
                        </span>

                        {ver.badge === 'CURRENT' && (
                          <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold">
                            CURRENT
                          </span>
                        )}
                        {ver.badge === 'STABLE' && (
                          <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-400 text-[10px] font-mono font-bold">
                            STABLE
                          </span>
                        )}
                        {ver.badge === 'LEGACY' && (
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 text-[10px] font-mono font-bold">
                            LEGACY
                          </span>
                        )}
                        {ver.badge === 'CANDIDATE' && (
                          <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 text-[10px] font-mono font-bold">
                            CANDIDATE
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-mono text-slate-400 mt-1">
                        {ver.date}
                      </div>

                      <p className="text-xs text-slate-300 mt-2 font-sans leading-relaxed max-w-xl">
                        {ver.notes}
                      </p>
                    </div>

                    {/* Middle: Metrics with Progress Bars */}
                    <div className="flex flex-wrap items-center gap-5 sm:gap-6 font-mono text-xs">
                      {/* Accuracy */}
                      <div>
                        <div className="text-[11px] text-slate-400">Accuracy</div>
                        <div className="text-slate-100 font-bold text-xs mt-0.5">{ver.accuracy}</div>
                        <div className="w-24 bg-slate-800/80 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div 
                            className="bg-[#00e676] h-full rounded-full transition-all duration-500" 
                            style={{ width: `${ver.accuracyVal}%` }} 
                          />
                        </div>
                      </div>

                      {/* F1 Score */}
                      <div>
                        <div className="text-[11px] text-slate-400">F1 Score</div>
                        <div className="text-slate-100 font-bold text-xs mt-0.5">{ver.f1Score}</div>
                        <div className="w-24 bg-slate-800/80 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div 
                            className="bg-[#00e676] h-full rounded-full transition-all duration-500" 
                            style={{ width: `${ver.f1Val}%` }} 
                          />
                        </div>
                      </div>

                      {/* Drift Rate */}
                      <div>
                        <div className="text-[11px] text-slate-400">Drift Rate</div>
                        <div className="text-slate-100 font-bold text-xs mt-0.5">{ver.driftRate}</div>
                        <div className="w-20 bg-slate-800/80 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div 
                            className="bg-rose-400 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, ver.driftVal * 5)}%` }} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right: Status Pill & Chevron Action */}
                    <div className="flex items-center gap-3 self-end lg:self-auto shrink-0">
                      {isDeployed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/50 text-emerald-400 font-mono text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          DEPLOYED
                        </span>
                      ) : ver.status === 'ARCHIVED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-700/60 text-slate-400 font-mono text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                          ARCHIVED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-700/60 text-slate-400 font-mono text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                          NOT DEPLOYED
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectingVersion(ver);
                        }}
                        className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/60 text-slate-400 hover:text-white hover:border-emerald-500 transition-colors"
                        title="View Version Details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Info Banner matching reference */}
          <div className="p-3.5 rounded-xl bg-[#09110d] border border-emerald-900/40 flex items-center gap-3 text-xs text-[#8fa396] font-sans">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Versions are listed from latest to earliest. Select a different model from the dropdown above to view its versions, metrics, and related information.
            </span>
          </div>
        </div>
      )}

      {/* 4. SUB-TAB: EVALUATION METRICS */}
      {activeSubTab === 'evaluation' && (
        <div className="rounded-2xl bg-[#0c1310]/95 border border-emerald-900/40 p-6 flex flex-col gap-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-900/30">
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wide">
                Evaluation Metrics & Benchmarks • {activeProfile.name}
              </h3>
              <p className="text-xs text-[#8fa396] mt-0.5">Formal validation runs conducted inside Sovereign Enclave test partitions.</p>
            </div>
            <span className="px-2.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-bold">
              100% AUDIT READY
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center font-mono">
            <div className="p-4 rounded-xl bg-[#121c17] border border-emerald-900/40">
              <span className="text-[10px] text-[#8fa396] block uppercase">ACCURACY</span>
              <span className="text-lg font-bold text-emerald-400">{activeProfile.versions[0]?.accuracy || '98.9%'}</span>
            </div>
            <div className="p-4 rounded-xl bg-[#121c17] border border-emerald-900/40">
              <span className="text-[10px] text-[#8fa396] block uppercase">F1 SCORE</span>
              <span className="text-lg font-bold text-white">{activeProfile.versions[0]?.f1Score || '0.982'}</span>
            </div>
            <div className="p-4 rounded-xl bg-[#121c17] border border-emerald-900/40">
              <span className="text-[10px] text-[#8fa396] block uppercase">PRECISION</span>
              <span className="text-lg font-bold text-white">{activeProfile.versions[0]?.precision || '99.1%'}</span>
            </div>
            <div className="p-4 rounded-xl bg-[#121c17] border border-emerald-900/40">
              <span className="text-[10px] text-[#8fa396] block uppercase">INFERENCE LATENCY</span>
              <span className="text-lg font-bold text-emerald-400">{activeProfile.versions[0]?.latencyMs || '18ms'}</span>
            </div>
          </div>

          {/* Confusion Matrix representation */}
          <div className="p-5 rounded-xl bg-[#121c17] border border-emerald-900/40">
            <span className="text-xs font-bold text-white uppercase font-mono block mb-3">Confusion Matrix Test Run (Test Set n=5,000)</span>
            <div className="grid grid-cols-2 gap-3 max-w-md font-mono text-xs text-center">
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                <span className="text-[10px] text-slate-400 block">TRUE POSITIVE</span>
                <span className="text-emerald-400 font-bold text-base">2,468 (98.7%)</span>
              </div>
              <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20">
                <span className="text-[10px] text-slate-400 block">FALSE NEGATIVE (Missed)</span>
                <span className="text-rose-400 font-bold text-base">32 (1.3%)</span>
              </div>
              <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20">
                <span className="text-[10px] text-slate-400 block">FALSE POSITIVE (Alarm)</span>
                <span className="text-rose-400 font-bold text-base">22 (0.9%)</span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                <span className="text-[10px] text-slate-400 block">TRUE NEGATIVE</span>
                <span className="text-emerald-400 font-bold text-base">2,478 (99.1%)</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => onSelectTab('validation')}
              className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center gap-2"
            >
              <Terminal className="w-4 h-4" />
              <span>Test Live in AI Detection Lab</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. SUB-TAB: DEPLOYMENT HISTORY */}
      {activeSubTab === 'deployment' && (
        <div className="rounded-2xl bg-[#0c1310]/95 border border-emerald-900/40 p-6 flex flex-col gap-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-900/30">
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wide">
                Production Deployment & Rollback Log • {activeProfile.name}
              </h3>
              <p className="text-xs text-[#8fa396] mt-0.5">Immutable record of environmental promotions and container releases.</p>
            </div>
            <span className="px-2.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-bold">
              ENCLAVE PROMOTION GATE
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {activeProfile.versions.map((ver, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#121c17] border border-emerald-900/40 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-white font-bold">{ver.version}</span>
                    <span className="text-slate-400 ml-2 font-sans text-xs">• Environment: {ver.environment}</span>
                    <p className="text-[11px] text-[#8fa396] font-sans mt-0.5">Approved by: {ver.approvedBy}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    ver.status === 'DEPLOYED' 
                      ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-400' 
                      : 'bg-slate-900 border border-slate-700 text-slate-400'
                  }`}>
                    {ver.status}
                  </span>

                  {ver.status !== 'DEPLOYED' && (
                    <button
                      onClick={() => handleDeployVersion(ver)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:text-white transition-colors"
                    >
                      Rollback to this
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. SUB-TAB: DATASET & TRAINING */}
      {activeSubTab === 'dataset' && (
        <div className="rounded-2xl bg-[#0c1310]/95 border border-emerald-900/40 p-6 flex flex-col gap-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-900/30">
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wide">
                Dataset Provenance & Training Run Lineage • {activeProfile.name}
              </h3>
              <p className="text-xs text-[#8fa396] mt-0.5">Training data sources, normalization run IDs, and cryptographic hashes.</p>
            </div>
            <button
              onClick={() => onSelectTab('model-training')}
              className="text-xs text-emerald-400 hover:underline font-mono flex items-center gap-1"
            >
              <span>Model Training Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold uppercase">Training Corpus</span>
                <span className="text-emerald-400 text-[10px] font-bold">CRYPTO-SIGNATURE VERIFIED</span>
              </div>
              <p className="text-white font-sans text-xs">{activeProfile.versions[0]?.datasetName}</p>
              <div className="pt-2 border-t border-emerald-900/30 text-[11px] text-[#8fa396] break-all">
                SHA-256 HASH: {activeProfile.versions[0]?.datasetHash}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#121c17] border border-emerald-900/40 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-[#8fa396] block uppercase">Training Epochs</span>
                <span className="text-white font-bold">10 Epochs (Early Stopped @ Epoch 8)</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8fa396] block uppercase">Learning Rate</span>
                <span className="text-white font-bold">2e-5 with Cosine Decay</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8fa396] block uppercase">Hardware Enclave</span>
                <span className="text-emerald-400 font-bold">NVIDIA H100 (48GB VRAM)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. SUB-TAB: CONFIGURATION */}
      {activeSubTab === 'config' && (
        <div className="rounded-2xl bg-[#0c1310]/95 border border-emerald-900/40 p-6 flex flex-col gap-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-900/30">
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wide">
                Runtime Model Configuration • {activeProfile.name}
              </h3>
              <p className="text-xs text-[#8fa396] mt-0.5">Calibrated decision cutoffs, tokenization boundaries, and inference limits.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-1">
              <span className="text-[10px] text-[#8fa396] uppercase">Calibrated Decision Threshold</span>
              <span className="text-white font-bold block">{activeProfile.configuration.decisionThreshold}</span>
            </div>

            <div className="p-4 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-1">
              <span className="text-[10px] text-[#8fa396] uppercase">Inference Batch Size</span>
              <span className="text-white font-bold block">{activeProfile.configuration.batchSize}</span>
            </div>

            <div className="p-4 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-1">
              <span className="text-[10px] text-[#8fa396] uppercase">Max Sequence / Token Length</span>
              <span className="text-white font-bold block">{activeProfile.configuration.maxSeqLength}</span>
            </div>

            <div className="p-4 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-1">
              <span className="text-[10px] text-[#8fa396] uppercase">Tokenizer Engine</span>
              <span className="text-white font-bold block">{activeProfile.configuration.tokenizer}</span>
            </div>
          </div>
        </div>
      )}

      {/* 8. SUB-TAB: RELATED CASES */}
      {activeSubTab === 'cases' && (
        <div className="rounded-2xl bg-[#0c1310]/95 border border-emerald-900/40 p-6 flex flex-col gap-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-900/30">
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wide">
                Investigation Cases Inferred by {activeProfile.name}
              </h3>
              <p className="text-xs text-[#8fa396] mt-0.5">Traceable provenance linking actual complaint findings to this model version.</p>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {activeProfile.relatedCases.map((c, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#121c17] border border-emerald-900/40 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">{c.caseId}</span>
                    <span className="text-white font-sans text-xs">{c.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#8fa396] mt-1">
                    <span>Prediction: <strong className="text-slate-200">{c.prediction}</strong></span>
                    <span>•</span>
                    <span>Confidence: <strong className="text-emerald-400">{c.confidence}</strong></span>
                    <span>•</span>
                    <span>{c.timestamp}</span>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                  VERIFIED BY SPECIALIST
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. MODAL: ADD NEW VERSION */}
      {isAddVersionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0a100d] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
            <div className="px-6 py-4 border-b border-emerald-900/40 flex items-center justify-between bg-[#0e1713]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Register New Model Version</h3>
                  <p className="text-xs font-mono text-emerald-400">TARGET: {activeProfile.name}</p>
                </div>
              </div>

              <button
                onClick={() => setIsAddVersionModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVersionSubmit} className="p-6 space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Version Identifier *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. v2.2.0-rc1"
                    value={newVersionForm.version}
                    onChange={(e) => setNewVersionForm({ ...newVersionForm, version: e.target.value })}
                    className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Lifecycle State</label>
                  <select
                    value={newVersionForm.badge}
                    onChange={(e) => setNewVersionForm({ ...newVersionForm, badge: e.target.value as any })}
                    className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="CANDIDATE">CANDIDATE</option>
                    <option value="STABLE">STABLE</option>
                    <option value="CURRENT">CURRENT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Change Summary & Release Notes *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Updated lexical feature extractor with 5k zero-hour domain patterns..."
                  value={newVersionForm.notes}
                  onChange={(e) => setNewVersionForm({ ...newVersionForm, notes: e.target.value })}
                  className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Test Accuracy</label>
                  <input
                    type="text"
                    value={newVersionForm.accuracy}
                    onChange={(e) => setNewVersionForm({ ...newVersionForm, accuracy: e.target.value })}
                    className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">F1 Score</label>
                  <input
                    type="text"
                    value={newVersionForm.f1Score}
                    onChange={(e) => setNewVersionForm({ ...newVersionForm, f1Score: e.target.value })}
                    className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Drift Rate</label>
                  <input
                    type="text"
                    value={newVersionForm.driftRate}
                    onChange={(e) => setNewVersionForm({ ...newVersionForm, driftRate: e.target.value })}
                    className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Training Dataset Reference</label>
                <input
                  type="text"
                  value={newVersionForm.datasetName}
                  onChange={(e) => setNewVersionForm({ ...newVersionForm, datasetName: e.target.value })}
                  className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-[11px] leading-relaxed">
                <span className="font-bold">GOVERNANCE DIRECTIVE:</span> New versions must undergo benchmark evaluation in AI Detection Lab and supervisor sign-off before production traffic switch.
              </div>

              <div className="pt-3 border-t border-emerald-900/40 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddVersionModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono transition-all"
                >
                  Save Candidate Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. MODAL: VERSION DETAIL INSPECTION DRAWER */}
      {inspectingVersion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0a100d] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
            <div className="px-6 py-4 border-b border-emerald-900/40 flex items-center justify-between bg-[#0e1713]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    {activeProfile.name} • {inspectingVersion.version}
                  </h3>
                  <p className="text-xs font-mono text-emerald-400">
                    RELEASED {inspectingVersion.date} • {inspectingVersion.environment}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectingVersion(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono text-slate-300">
              <div className="p-3.5 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-1 font-sans">
                <span className="text-[10px] text-[#8fa396] font-mono uppercase block">Release Notes</span>
                <p className="text-white text-xs leading-relaxed">{inspectingVersion.notes}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[10px] text-[#8fa396] block">ACCURACY</span>
                  <span className="text-emerald-400 font-bold text-sm">{inspectingVersion.accuracy}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[10px] text-[#8fa396] block">F1 SCORE</span>
                  <span className="text-white font-bold text-sm">{inspectingVersion.f1Score}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[10px] text-[#8fa396] block">DRIFT RATE</span>
                  <span className="text-rose-400 font-bold text-sm">{inspectingVersion.driftRate}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-2">
                <div>
                  <span className="text-[10px] text-[#8fa396] block uppercase">Dataset Provenance</span>
                  <span className="text-white font-sans text-xs">{inspectingVersion.datasetName}</span>
                </div>
                <div className="text-[10px] text-[#8fa396] break-all border-t border-emerald-900/30 pt-1.5">
                  HASH: {inspectingVersion.datasetHash}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121c17] border border-emerald-900/40 grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-[#8fa396] block">Validator Sign-Off:</span>
                  <span className="text-slate-200">{inspectingVersion.approvedBy}</span>
                </div>
                <div>
                  <span className="text-[#8fa396] block">Inference Latency:</span>
                  <span className="text-emerald-400">{inspectingVersion.latencyMs}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-emerald-900/40 bg-[#0e1713] flex items-center justify-between font-mono text-xs">
              <button
                onClick={() => {
                  setInspectingVersion(null);
                  onSelectTab('validation');
                }}
                className="text-emerald-400 hover:underline flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Test in Lab</span>
              </button>

              <div className="flex items-center gap-2">
                {inspectingVersion.status !== 'DEPLOYED' && (
                  <button
                    onClick={() => handleDeployVersion(inspectingVersion)}
                    className="px-4 py-2 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-black font-bold font-mono transition-all"
                  >
                    Deploy to Production
                  </button>
                )}
                <button
                  onClick={() => setInspectingVersion(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
