import { Complaint, ThreatFeedItem, CorrelatedNode, ModelMetric, SystemAuditLog } from '../types';

export const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'case-7102',
    referenceNumber: 'CYBER-2026-7102',
    title: 'UPI / QR Code Payment Scam Report',
    category: 'OTP / QR Code Scam',
    severity: 'HIGH',
    status: 'SUBMITTED',
    citizenName: 'Naveen',
    citizenEmail: 'naveen@gmail.com',
    citizenPhone: '+91 98765 43210',
    incidentDate: '12 Jun 2026, 10:24 AM',
    reportedDate: '12 Jun 2026, 10:24 AM',
    financialLoss: 25000,
    suspectInfo: {
      alias: 'Fake Bank Verification Agent',
      phone: '+91 98765 43210',
      email: 'fraud@okaxis',
      website: 'http://fake-bank-verify.in',
      ipAddress: '185.220.101.44',
    },
    description: 'I received a call from a person claiming to be from a bank who said my account would be blocked. They asked for my OTP and I shared it. Later I found that an amount was debited from my account without my authorization.',
    evidenceFiles: [
      {
        name: 'debit_sms_screenshot.png',
        size: '1.2 MB',
        type: 'image/png',
        sha256Hash: 'a7c49b...38f2',
        verified: true
      },
      {
        name: 'bank_statement_extract.pdf',
        size: '640 KB',
        type: 'application/pdf',
        sha256Hash: '5e8848...15d0',
        verified: true
      }
    ],
    aiTriageScore: 84,
    aiPredictedThreatGroup: 'UNC4192 (DarkSynapse / Banking Trojans)',
    assignedUnit: 'Cybercell Metro',
    assignedOfficer: 'Naveen (You)',
    timeline: [
      {
        timestamp: '12 Jun 2026, 10:24 AM',
        title: 'Incident Submitted via Citizen Portal',
        description: 'Citizen Naveen submitted complaint with debit transaction and phishing details.',
        actor: 'Citizen Portal / Automated Ingest',
        verifiedHash: '0x3b8a...12c4'
      },
      {
        timestamp: '12 Jun 2026, 10:25 AM',
        title: 'Automated Cyber Entity Extraction',
        description: 'Extracted 5 indicators: Mobile (+91 98765 43210), UPI ID (fraud@okaxis), Account (XXXX 6789), Phishing URL (http://fake-bank-verify.in), IP (185.220.101.44).',
        actor: 'CCIP Entity Extraction Pipeline',
        verifiedHash: '0x992b...7e11'
      },
      {
        timestamp: '12 Jun 2026, 11:00 AM',
        title: 'Assigned to Specialist Unit',
        description: 'Case allocated to Cybercell Metro. Assigned investigator: Naveen.',
        actor: 'Dispatch Nodal Supervisor',
        verifiedHash: '0x4a9f...881c'
      },
      {
        timestamp: '13 Jun 2026, 09:15 AM',
        title: 'Level 2 Triage Assessment Confirmed',
        description: 'Urgency flag verified. Cross-case correlation identified shared mule accounts.',
        actor: 'Naveen (You)',
        verifiedHash: '0x7e12...b499'
      }
    ]
  },
  {
    id: 'case-1001',
    referenceNumber: 'CYBER-2026-9842',
    title: 'AI Voice Clone Impersonation UPI & Wire Fraud (₹18,50,000)',
    category: 'UPI Fraud',
    severity: 'CRITICAL',
    status: 'UNDER_INVESTIGATION',
    citizenName: 'Priya Sharma',
    citizenEmail: 'priya.sharma@cyberdefense.in',
    citizenPhone: '+91 98765 43210',
    incidentDate: '2026-09-02 14:15 IST',
    reportedDate: '2026-09-02 16:30 IST',
    financialLoss: 1850000,
    suspectInfo: {
      alias: 'Apex Phantom / DarkSynapse',
      email: 'finance-verify@secure-nexus-auth.in',
      phone: '+91 98112 34567',
      walletAddress: '0x71C...4e89 (Ethereum Mainnet)',
      ipAddress: '185.220.101.44 (Exit Node Tor-DE)',
    },
    description: 'Received a synthetic deepfake audio call impersonating our Managing Director requesting urgent settlement of supplier invoice to an unauthorized mule bank account and UPI VPA (pay-vendor@upi).',
    evidenceFiles: [
      {
        name: 'voice_call_recording_deepfake_sample.wav',
        size: '14.2 MB',
        type: 'audio/wav',
        sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        verified: true
      },
      {
        name: 'forged_supplier_wire_invoice.pdf',
        size: '2.4 MB',
        type: 'application/pdf',
        sha256Hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        verified: true
      },
      {
        name: 'email_headers_spf_dkim_fail.eml',
        size: '128 KB',
        type: 'message/rfc822',
        sha256Hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        verified: true
      }
    ],
    aiTriageScore: 96,
    aiPredictedThreatGroup: 'UNC4192 (DarkSynapse Syndicate)',
    assignedUnit: 'State Cyber Crime Wing (CCPS Cyber Command)',
    assignedOfficer: 'Cyber Crime Inspector Rajesh Sharma (CCPS #7402)',
    timeline: [
      {
        timestamp: '2026-09-02 16:30:11 IST',
        title: 'Citizen Incident Submitted',
        description: 'Case securely received and encrypted in Enclave-Alpha with cryptographic SHA-256 integrity seal.',
        actor: 'Citizen Portal / Automated Ingest',
        verifiedHash: '0x4a9f...881c'
      },
      {
        timestamp: '2026-09-02 16:31:04 IST',
        title: 'AI Neural Triage Assessment',
        description: 'Threat classifier scored urgency at 96/100 (Critical). Multi-hop correlation detected 4 matching UPI VPAs and mule bank accounts across 3 open cases.',
        actor: 'Astraea Heuristic Engine v4.2',
        verifiedHash: '0x7e12...b499'
      },
      {
        timestamp: '2026-09-02 17:45:00 IST',
        title: '1930 Helpline Emergency Freeze Dispatched',
        description: 'I4C / 1930 emergency notice dispatched to State Bank of India & HDFC Nodal Officers to freeze un-laundered funds in beneficiary account.',
        actor: 'Cyber Intelligence Officer Jenkins',
        verifiedHash: '0x992b...318e'
      },
      {
        timestamp: '2026-09-03 10:15:22 IST',
        title: 'Forensic Audio Spectral Analysis Completed',
        description: 'Confirmed synthetic artifact frequencies at 8.4kHz consistent with VALL-E 2 / RVC v3 voice synthesis architecture.',
        actor: 'Digital Forensics Lab',
        verifiedHash: '0x18ab...cc09'
      }
    ]
  },
  {
    id: 'case-1002',
    referenceNumber: 'CYBER-2026-8719',
    title: 'Hospital Clinical Network Ransomware (LockBit v4 Variant) (₹45,00,000)',
    category: 'Malware / Ransomware',
    severity: 'CRITICAL',
    status: 'LAW_ENFORCEMENT_DISPATCHED',
    citizenName: 'Dr. Arthur Sterling',
    citizenEmail: 'director.it@apollo-regional.med',
    citizenPhone: '+91 98230 45678',
    incidentDate: '2026-09-03 03:22 IST',
    reportedDate: '2026-09-03 04:10 IST',
    financialLoss: 4500000,
    suspectInfo: {
      alias: 'ShadowLock Group',
      walletAddress: 'bc1q9x...38a1 (Bitcoin SegWit)',
      website: 'http://shadowlock-ransom-leak-darknet.onion',
      ipAddress: '194.26.29.112'
    },
    description: 'Entire Radiology PACS archive encrypted with .SHADOW extension. Ransom note demands 15 BTC within 48 hours or patient record release.',
    evidenceFiles: [
      {
        name: 'RESTORE_MY_FILES_README.txt',
        size: '18 KB',
        type: 'text/plain',
        sha256Hash: 'd5b4a92c817293a105820982341908bcda910283741920839182309182309182',
        verified: true
      },
      {
        name: 'memory_dump_lsass_extract.dmp',
        size: '148 MB',
        type: 'application/octet-stream',
        sha256Hash: 'a1b2c3d4e5f6071829304152637485960718293a4b5c6d7e8f90123456789abc',
        verified: true
      }
    ],
    aiTriageScore: 99,
    aiPredictedThreatGroup: 'FIN12 / ShadowLock Affiliate',
    assignedUnit: 'National Critical Info Infra Protection Centre (NCIIPC / CERT-In)',
    assignedOfficer: 'Officer Priya Nair (CERT-In Response Unit)',
    timeline: [
      {
        timestamp: '2026-09-03 04:10:00 IST',
        title: 'Critical Infrastructure Breach Ingested',
        description: 'Hospital IT filed high-urgency telemetry. Automatic escalation triggered to CERT-In and State Cyber Cell.',
        actor: 'Emergency Rapid Ingest'
      },
      {
        timestamp: '2026-09-03 04:30:00 IST',
        title: 'CERT-In & NCRP Advisory Alert',
        description: 'IOCs propagated to state health network gateway firewalls.',
        actor: 'Threat Intelligence Mesh'
      }
    ]
  },
  {
    id: 'case-1003',
    referenceNumber: 'CYBER-2026-7650',
    title: 'SIM Swap & Unauthorized UPI Multi-Bank Transfer (₹4,20,000)',
    category: 'SIM Swap Fraud',
    severity: 'HIGH',
    status: 'EVIDENCE_VERIFIED',
    citizenName: 'David Chen',
    citizenEmail: 'david.chen@technova.in',
    citizenPhone: '+91 98450 12345',
    incidentDate: '2026-09-01 22:00 IST',
    reportedDate: '2026-09-02 08:30 IST',
    financialLoss: 420000,
    suspectInfo: {
      alias: 'GhostSIM Cell #8',
      phone: '+91 99887 76655',
      ipAddress: '104.28.19.88'
    },
    description: 'Cell phone suddenly showed No Service. Suspect executed unauthorized SIM swap, bypassed 2FA SMS and drained checking & savings accounts via unauthorized UPI transactions.',
    evidenceFiles: [
      {
        name: 'carrier_unauthorized_swap_receipt.png',
        size: '1.8 MB',
        type: 'image/png',
        sha256Hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        verified: true
      }
    ],
    aiTriageScore: 78,
    assignedUnit: 'District Cyber Crime Unit (DCCU)',
    assignedOfficer: 'Cyber Crime Inspector Vikram Singh',
    timeline: [
      {
        timestamp: '2026-09-02 08:30:00 IST',
        title: 'Complaint Registered',
        description: 'Case categorized as Telecommunications Fraud & Unauthorized Account Takeover.',
        actor: 'Citizen Portal'
      }
    ]
  },
  {
    id: 'case-1004',
    referenceNumber: 'CYBER-2026-6411',
    title: 'Phishing Campaign Spoofing Income Tax Department Refund Portal',
    category: 'Phishing Attack',
    severity: 'MEDIUM',
    status: 'TRIAGED',
    citizenName: 'Aisha Al-Mansoor',
    citizenEmail: 'aisha.m@aerocorp.gov.in',
    citizenPhone: '+91 97110 98765',
    incidentDate: '2026-09-04 09:10 IST',
    reportedDate: '2026-09-04 10:05 IST',
    financialLoss: 0,
    suspectInfo: {
      website: 'https://incometax-efiling-refund-gov.in.net',
      email: 'refund-notice@incometax-portal-alerts.info',
      ipAddress: '45.142.214.9'
    },
    description: 'Broadcast email claiming mandatory Income Tax Department refund claim verification with deceptive reverse-proxy phishing kit bypassing 2FA credentials.',
    evidenceFiles: [
      {
        name: 'phishing_payload_lure.html',
        size: '48 KB',
        type: 'text/html',
        sha256Hash: '9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
        verified: true
      }
    ],
    aiTriageScore: 65,
    assignedUnit: 'State Cyber Cell Domain Takedown Taskforce',
    assignedOfficer: 'Auto Triage Worker #3',
    timeline: [
      {
        timestamp: '2026-09-04 10:05:00 IST',
        title: 'Takedown Notice Issued',
        description: 'Abuse report automatically dispatched to Registrar and CERT-In DNS takedown coordinator.',
        actor: 'Auto Triage Worker #3'
      }
    ]
  }
];

export const MOCK_THREAT_FEEDS: ThreatFeedItem[] = [
  {
    id: 'ioc-901',
    iocValue: '185.220.101.44',
    iocType: 'IP_ADDRESS',
    threatName: 'CobaltStrike Team Server / Tor Egress Node',
    threatActor: 'DarkSynapse / UNC4192',
    confidenceScore: 98.4,
    severity: 'CRITICAL',
    detectionTime: '2 mins ago',
    sourceEnclave: 'I4C Cyber Threat Intelligence Grid',
    associatedCasesCount: 14,
    status: 'ACTIVE_BLOCK'
  },
  {
    id: 'ioc-902',
    iocValue: '0x71C83909a12bc90048EF910c2830fFa829804e89',
    iocType: 'CRYPTO_WALLET',
    threatName: 'Tornado.Cash Multi-Hop Mixer Ingress',
    threatActor: 'Lazarus Group Sub-Cluster B',
    confidenceScore: 94.7,
    severity: 'CRITICAL',
    detectionTime: '8 mins ago',
    sourceEnclave: 'Sovereign Crypto Trace Mesh',
    associatedCasesCount: 6,
    status: 'ACTIVE_BLOCK'
  },
  {
    id: 'ioc-903',
    iocValue: '7a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    iocType: 'SHA256_HASH',
    threatName: 'BlackCat/ALPHV v3 Stealth Loader (.dll)',
    threatActor: 'ALPHV Affiliate Network',
    confidenceScore: 99.1,
    severity: 'CRITICAL',
    detectionTime: '14 mins ago',
    sourceEnclave: 'CERT-In Threat Intelligence Enclave',
    associatedCasesCount: 22,
    status: 'ACTIVE_BLOCK'
  },
  {
    id: 'ioc-904',
    iocValue: 'secure-nexus-auth.in',
    iocType: 'MALICIOUS_DOMAIN',
    threatName: 'Evilginx3 Reverse Proxy Credential Harvester',
    threatActor: 'Tycoon2FA Phishing Campaign',
    confidenceScore: 88.5,
    severity: 'HIGH',
    detectionTime: '27 mins ago',
    sourceEnclave: 'NCRP DNS Takedown Sensor',
    associatedCasesCount: 3,
    status: 'MONITORING'
  },
  {
    id: 'ioc-905',
    iocValue: 'CVE-2026-3819',
    iocType: 'CVE_EXPLOIT',
    threatName: 'Zero-Day RCE in Edge Gateway VPN Appliances',
    threatActor: 'Volt Typhoon Secondary Cell',
    confidenceScore: 96.0,
    severity: 'CRITICAL',
    detectionTime: '42 mins ago',
    sourceEnclave: 'NCIIPC Critical Vulnerability Ingest',
    associatedCasesCount: 8,
    status: 'ACTIVE_BLOCK'
  }
];

export const MOCK_CORRELATION_NODES: CorrelatedNode[] = [
  { id: 'node-case-9842', label: 'Case CYBER-2026-9842 (UPI Wire Fraud ₹18.5L)', type: 'CASE', riskScore: 96, connections: ['node-wallet-1', 'node-infra-1', 'node-actor-1', 'node-case-99104'] },
  { id: 'node-wallet-1', label: 'Wallet 0x71C...4e89 (ETH Mixer)', type: 'WALLET', riskScore: 94, connections: ['node-case-9842', 'node-case-99104', 'node-actor-1', 'node-wallet-2'] },
  { id: 'node-wallet-2', label: 'Wallet bc1q9x...38a1 (BTC Hopper)', type: 'WALLET', riskScore: 91, connections: ['node-wallet-1', 'node-case-8719'] },
  { id: 'node-infra-1', label: 'C2 Gateway 185.220.101.44 (CobaltStrike C2)', type: 'IP', riskScore: 98, connections: ['node-case-9842', 'node-actor-1', 'node-malware-1'] },
  { id: 'node-ip-1', label: 'IP 185.220.101.44 (C2 Server)', type: 'IP', riskScore: 98, connections: ['node-case-9842', 'node-malware-1'] },
  { id: 'node-actor-1', label: 'Threat Syndicate LAZARUS / DarkSynapse (UNC4192)', type: 'SUSPECT', riskScore: 99, connections: ['node-case-9842', 'node-wallet-1', 'node-infra-1', 'node-malware-1'] },
  { id: 'node-actor-darksynapse', label: 'Threat Group UNC4192 (DarkSynapse)', type: 'SUSPECT', riskScore: 99, connections: ['node-case-9842', 'node-ip-1', 'node-malware-1', 'node-wallet-1'] },
  { id: 'node-case-99104', label: 'Case CYBER-2026-99104 (SIM-Swap Phishing ₹12.8L)', type: 'CASE', riskScore: 88, connections: ['node-wallet-1', 'node-case-9842'] },
  { id: 'node-case-8719', label: 'Case CYBER-2026-8719 (Hospital Ransomware ₹45L)', type: 'CASE', riskScore: 99, connections: ['node-wallet-2', 'node-malware-1'] },
  { id: 'node-malware-1', label: 'LockBit/DarkSynapse Deepfake Loader', type: 'MALWARE', riskScore: 97, connections: ['node-actor-1', 'node-infra-1', 'node-case-8719'] },
  { id: 'node-case-7650', label: 'Case CYBER-2026-7650 (SIM-Swap ₹4.2L)', type: 'CASE', riskScore: 78, connections: ['node-wallet-1'] }
];

export const MOCK_AI_MODELS: ModelMetric[] = [
  {
    id: 'mod-1',
    modelName: 'URL Phishing Detector',
    version: 'v1.0.0',
    task: 'Zero-Hour Domain, URL Structure & Lexical Threat Scoring',
    accuracy: 97.8,
    f1Score: 0.975,
    driftRate: 0.8,
    status: 'READY',
    lastEvaluated: 'Active Local Deployment',
    latencyMs: 18
  },
  {
    id: 'mod-2',
    modelName: 'Complaint Classifier',
    version: 'v1.0.0',
    task: 'DeBERTa-v3 18-Category Cybercrime Legal Triage & Jurisdiction',
    accuracy: 86.7,
    f1Score: 0.852,
    driftRate: 1.1,
    status: 'READY',
    lastEvaluated: 'Active Local Deployment',
    latencyMs: 65
  },
  {
    id: 'mod-3',
    modelName: 'Email Threat Classifier',
    version: 'v1.0.0',
    task: 'DistilBERT Binary Sequence Classification (Threat / Safe)',
    accuracy: 98.36,
    f1Score: 0.9783,
    driftRate: 0.6,
    status: 'READY',
    lastEvaluated: 'Active Local Deployment',
    latencyMs: 38
  },
  {
    id: 'mod-4',
    modelName: 'SMS Spam Classifier',
    version: 'v1.0.0',
    task: 'DistilBERT Binary Smishing & SMS Fraud Detection',
    accuracy: 98.84,
    f1Score: 0.9514,
    driftRate: 0.4,
    status: 'READY',
    lastEvaluated: 'Active Local Deployment',
    latencyMs: 24
  },
  {
    id: 'mod-5',
    modelName: 'Investigation Assistant',
    version: 'v2.0.0',
    task: 'Astraea Sovereign Forensic Reasoning Engine (Sovereign Enclave)',
    accuracy: 98.4,
    f1Score: 0.981,
    driftRate: 0.0,
    status: 'AVAILABLE_WITH_LIMITATIONS',
    lastEvaluated: 'Sovereign Enclave Offline Mode',
    latencyMs: 42
  }
];

export const MOCK_AUDIT_LOGS: SystemAuditLog[] = [
  {
    id: 'log-101',
    timestamp: '2026-09-04 14:25:18 IST',
    actor: 'Cyber Inspector R. Sharma',
    clearance: 'STATE CCPS LEVEL 5',
    action: 'EVIDENCE_LOCKER_EXPORT',
    resource: 'CASE-2026-9842 / deepfake_sample.wav',
    status: 'SUCCESS',
    ipAddress: '10.240.12.88 (Secure Terminal Enclave)',
    hash: '0x8f2a...110c'
  },
  {
    id: 'log-102',
    timestamp: '2026-09-04 14:18:42 IST',
    actor: 'Officer Priya Nair',
    clearance: 'STATE-LEO TIER 2',
    action: '1930_FREEZE_NOTICE_ISSUED',
    resource: 'CASE-2026-8719 / Exchange Freeze Request',
    status: 'SUCCESS',
    ipAddress: '10.240.14.19 (Cyber Command Station 4)',
    hash: '0x3c71...90da'
  },
  {
    id: 'log-103',
    timestamp: '2026-09-04 13:52:09 IST',
    actor: 'Unknown External Entity',
    clearance: 'UNAUTHENTICATED',
    action: 'GRAPH_QL_INTROSPECTION_ATTEMPT',
    resource: '/api/v2/evidence/chain-of-custody',
    status: 'DENIED',
    ipAddress: '185.191.171.12 (Blocked Tor Exit)',
    hash: '0x0000...FAIL'
  },
  {
    id: 'log-104',
    timestamp: '2026-09-04 13:10:44 IST',
    actor: 'AutoML Pipeline Service Worker',
    clearance: 'SYSTEM_INTERNAL',
    action: 'MODEL_WEIGHTS_VALIDATION',
    resource: 'Astraea-Deepfake-Voice-Guard (v3.8.4)',
    status: 'SUCCESS',
    ipAddress: '127.0.0.1 (Enclave Hypervisor)',
    hash: '0x5b19...ea73'
  }
];
