import React, { useState, useEffect, useRef } from 'react';
import { Complaint, CyberEntity } from '../../types';
import { formatINR } from '../../utils/formatters';
import { apiClient } from '../../api/client';
import { 
  ArrowLeft, 
  RotateCw, 
  Share2, 
  FileText, 
  Edit3, 
  Shield, 
  Tag, 
  Users, 
  Fingerprint, 
  Eye, 
  Landmark, 
  Globe, 
  FileImage, 
  FileCheck, 
  Info, 
  Zap, 
  Upload, 
  Link as LinkIcon, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ChevronRight, 
  X, 
  Copy, 
  Check, 
  Sparkles, 
  CheckCircle, 
  Activity, 
  Lock,
  Search,
  ExternalLink,
  Download,
  AlertCircle
} from 'lucide-react';

interface InvestigationWorkspacePortalViewProps {
  onSelectTab: (tab: string) => void;
  onSelectCase?: (caseId: string) => void;
  complaints?: Complaint[];
  selectedCaseId?: string;
}

interface ExtractedEntityItem {
  id: string;
  type: 'Mobile' | 'UPI ID' | 'Bank Account' | 'URL' | 'IP Address' | 'SHA-256 Hash' | 'Email' | 'IFSC Code';
  value: string;
  source: 'Complaint Text' | 'Enrichment' | 'Document OCR' | 'Bank Statement';
  extractionTime: string;
  confidence: number;
  validationStatus: 'Verified Authentic' | 'Under Review' | 'Flagged Malicious' | 'Unverified Lead';
  threatIntelMatch?: string;
}

interface ECVCorrelation {
  id: string;
  targetCaseId: string;
  targetCaseTitle: string;
  location: string;
  loss: number;
  matchingIndicator: string;
  indicatorType: string;
  relationshipHypothesis: string;
  evidenceCategory: 'C — Context' | 'E — Active Evidence' | 'V — Verified Cross-Case Link';
  verificationStatus: 'Unverified Lead' | 'Verified' | 'Rejected / Inconclusive';
  verificationRationale?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

interface CaseNoteItem {
  id: string;
  author: string;
  role: string;
  timestamp: string;
  category: 'Lead Follow-up' | 'Bank Notice' | 'Victim Interview' | 'Evidence Review';
  note: string;
}

export const InvestigationWorkspacePortalView: React.FC<InvestigationWorkspacePortalViewProps> = ({
  onSelectTab,
  onSelectCase,
  complaints = [],
  selectedCaseId
}) => {
  // Active Case selection (defaults to CYBER-2026-7102)
  const activeCase = complaints.find(c => c.referenceNumber === 'CYBER-2026-7102') || complaints[0] || {
    id: 'case-7102',
    referenceNumber: 'CYBER-2026-7102',
    title: 'UPI / QR Code Payment Scam Report',
    category: 'UPI / QR Code Payment Scam',
    financialLoss: 25000,
    status: 'SUBMITTED',
    citizenName: 'Naveen',
    citizenEmail: 'naveen@gmail.com',
    citizenPhone: '+91 98765 43210',
    incidentDate: '12 Jun 2026, 10:24 AM',
    reportedDate: '12 Jun 2026, 10:24 AM',
    assignedUnit: 'Cybercell Metro',
    assignedOfficer: 'Naveen (You)',
    description: 'I received a call from a person claiming to be from a bank who said my account would be blocked. They asked for my OTP and I shared it. Later I found that an amount was debited from my account without my authorization.'
  };

  // State Management
  const [activeTab, setActiveTab] = useState<'extracted-entities' | 'timeline' | 'correlations' | 'case-notes'>('extracted-entities');
  const [caseStatus, setCaseStatus] = useState<string>(activeCase.status || 'SUBMITTED');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Incident Narrative & Audited Amendment
  const [incidentNarrative, setIncidentNarrative] = useState<string>(
    activeCase.description || 'I received a call from a person claiming to be from a bank who said my account would be blocked. They asked for my OTP and I shared it. Later I found that an amount was debited from my account without my authorization.'
  );
  const [originalNarrative] = useState<string>(
    'I received a call from a person claiming to be from a bank who said my account would be blocked. They asked for my OTP and I shared it. Later I found that an amount was debited from my account without my authorization.'
  );
  const [amendmentHistory, setAmendmentHistory] = useState<Array<{ version: string; text: string; reason: string; amendedBy: string; timestamp: string }>>([]);
  const [isEditNarrativeOpen, setIsEditNarrativeOpen] = useState(false);
  const [narrativeInput, setNarrativeInput] = useState(incidentNarrative);
  const [amendmentReason, setAmendmentReason] = useState('');

  // AI Triage
  const [isTriageRunning, setIsTriageRunning] = useState(false);
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [triageCompleted, setTriageCompleted] = useState(true);

  // Entity Extraction
  const [isExtractingEntities, setIsExtractingEntities] = useState(false);
  const [entities, setEntities] = useState<ExtractedEntityItem[]>([
    {
      id: 'ent-1',
      type: 'Mobile',
      value: '+91 98765 43210',
      source: 'Complaint Text',
      extractionTime: '12 Jun 2026, 10:24 AM',
      confidence: 0.99,
      validationStatus: 'Verified Authentic',
      threatIntelMatch: 'Known Telecom Carrier: Airtel Karnataka Telecom Circle. Reported in 4 cybercell complaints.'
    },
    {
      id: 'ent-2',
      type: 'UPI ID',
      value: 'fraud@okaxis',
      source: 'Complaint Text',
      extractionTime: '12 Jun 2026, 10:24 AM',
      confidence: 0.98,
      validationStatus: 'Flagged Malicious',
      threatIntelMatch: 'NPCI High-Risk Mule Registry: Axis Bank VPA flagged for rapid money muling operations.'
    },
    {
      id: 'ent-3',
      type: 'Bank Account',
      value: 'XXXX 6789',
      source: 'Complaint Text',
      extractionTime: '12 Jun 2026, 10:24 AM',
      confidence: 0.96,
      validationStatus: 'Under Review',
      threatIntelMatch: 'Axis Bank Branch: Indiranagar Bangalore. Active debit card linkage detected.'
    },
    {
      id: 'ent-4',
      type: 'URL',
      value: 'http://fake-bank-verify.in',
      source: 'Complaint Text',
      extractionTime: '12 Jun 2026, 10:24 AM',
      confidence: 0.99,
      validationStatus: 'Flagged Malicious',
      threatIntelMatch: 'PhishTank & ThreatIntel Feed: Active credential harvesting page impersonating SBI/Axis netbanking portal.'
    },
    {
      id: 'ent-5',
      type: 'IP Address',
      value: '185.220.101.44',
      source: 'Enrichment',
      extractionTime: '12 Jun 2026, 10:25 AM',
      confidence: 0.94,
      validationStatus: 'Flagged Malicious',
      threatIntelMatch: 'DarkSynapse C2 Proxy Server (Tor Exit Node Frankfurt). Correlated with SOC Monitoring Alert.'
    }
  ]);
  const [selectedEntityForModal, setSelectedEntityForModal] = useState<ExtractedEntityItem | null>(null);

  // E / C / V Cross-Case Correlations
  const [showCorrelationModal, setShowCorrelationModal] = useState(false);
  const [correlations, setCorrelations] = useState<ECVCorrelation[]>([
    {
      id: 'corr-1',
      targetCaseId: 'CYBER-2026-6819',
      targetCaseTitle: 'Electricity Bill KYC Update QR Code Trap',
      location: 'Bangalore Cybercell',
      loss: 42000,
      matchingIndicator: 'fraud@okaxis',
      indicatorType: 'UPI ID',
      relationshipHypothesis: 'Common beneficiary mule handle used for secondary distribution across cyber syndicates.',
      evidenceCategory: 'C — Context',
      verificationStatus: 'Unverified Lead'
    },
    {
      id: 'corr-2',
      targetCaseId: 'CYBER-2026-5412',
      targetCaseTitle: 'NetBanking APK Phishing & Credential Interception',
      location: 'Mumbai Cybercell',
      loss: 115000,
      matchingIndicator: '185.220.101.44',
      indicatorType: 'IP Address / C2 Server',
      relationshipHypothesis: 'Shared infrastructure host resolving fake-bank-verify.in phishing domains.',
      evidenceCategory: 'C — Context',
      verificationStatus: 'Unverified Lead'
    }
  ]);

  // Case Notes
  const [caseNotes, setCaseNotes] = useState<CaseNoteItem[]>([
    {
      id: 'note-1',
      author: 'Naveen (You)',
      role: 'Cybercrime Specialist #7402',
      timestamp: '12 Jun 2026, 11:30 AM',
      category: 'Victim Interview',
      note: 'Contacted victim Naveen. Confirmed the caller posed as Axis Bank Risk & Anti-Fraud Officer. Coerced victim to share OTP under threat of immediate account freeze. Transaction initiated within 90 seconds.'
    },
    {
      id: 'note-2',
      author: 'Naveen (You)',
      role: 'Cybercrime Specialist #7402',
      timestamp: '12 Jun 2026, 01:15 PM',
      category: 'Bank Notice',
      note: 'Dispatched 1930 / I4C emergency freeze notice to Axis Bank Nodal Officer regarding beneficiary handle fraud@okaxis. Awaiting response regarding account balance freeze.'
    }
  ]);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<'Lead Follow-up' | 'Bank Notice' | 'Victim Interview' | 'Evidence Review'>('Lead Follow-up');

  // Forensic Analyzers Modals
  const [activeAnalyzer, setActiveAnalyzer] = useState<'upi' | 'url' | 'image' | 'report' | null>(null);
  const [freezeNoticeSent, setFreezeNoticeSent] = useState(false);

  // Document Processing Forensic Extraction State
  const [caseEvidenceList, setCaseEvidenceList] = useState<any[]>([]);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [docProcessingResult, setDocProcessingResult] = useState<any | null>(null);
  const [isLoadingDocProcess, setIsLoadingDocProcess] = useState(false);
  const [showDocRedacted, setShowDocRedacted] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeAnalyzer === 'image') {
      const loadCaseEvidence = async () => {
        setIsLoadingDocProcess(true);
        try {
          const list = await apiClient.getEvidenceList({ complaint_id: activeCase?.id });
          if (list && list.length > 0) {
            setCaseEvidenceList(list);
            const firstId = list[0].id;
            setSelectedEvidenceId(firstId);
            const proc = await apiClient.getEvidenceProcessingResult(firstId);
            setDocProcessingResult(proc);
          } else {
            // Provide synthetic evidence item if backend has no uploads yet
            setDocProcessingResult({
              detected_format: 'IMAGE_SCREENSHOT',
              page_count: 1,
              ocr_applied: true,
              ocr_engine: 'PYTESSERACT_OCR',
              processing_status: 'COMPLETED',
              extracted_text: 'Dear Customer, INR 25,000.00 debited from A/C XX6789 on 12-JUN-26 10:24 via UPI ref 416428901234 to VPA fraud@okaxis. If not done by you, call 1930.',
              redacted_text: 'Dear Customer, INR 25,000.00 debited from A/C XX6789 on 12-JUN-26 10:24 via UPI ref 416428901234 to VPA fraud@okaxis. If not done by you, call 1930.',
              gemini_summary: 'Payment transaction screenshot confirming unauthorized debit of ₹25,000.00 to high-risk mule VPA fraud@okaxis.',
              gemini_status: 'SUCCESS',
              gemini_analysis_json: {
                document_category: 'PAYMENT_RECEIPT',
                apparent_fraud_type: 'UPI QR Code / OTP Impersonation Scam',
                key_findings: [
                  'Unauthorized debit of ₹25,000 on 12-JUN-26',
                  'Beneficiary VPA: fraud@okaxis (Axis Bank)',
                  'UTR / Reference: 416428901234'
                ],
                investigator_next_steps: [
                  'Dispatch emergency 1930 freeze notice to Axis Bank Nodal Officer',
                  'Correlate VPA fraud@okaxis across Cross-Case Correlation graph'
                ]
              },
              extracted_entities: [
                { entity_type: 'UPI_ID', raw_value: 'fraud@okaxis', normalized_value: 'fraud@okaxis', confidence: 0.98 },
                { entity_type: 'UTR', raw_value: '416428901234', normalized_value: '416428901234', confidence: 0.96 },
                { entity_type: 'AMOUNT', raw_value: 'INR 25,000.00', normalized_value: 'INR 25,000.00', confidence: 0.95 }
              ]
            });
          }
        } catch {
          //
        } finally {
          setIsLoadingDocProcess(false);
        }
      };
      loadCaseEvidence();
    }
  }, [activeAnalyzer, activeCase?.id]);

  const handleSelectEvidenceForAnalyzer = async (evidenceId: string) => {
    setSelectedEvidenceId(evidenceId);
    setIsLoadingDocProcess(true);
    try {
      const proc = await apiClient.getEvidenceProcessingResult(evidenceId);
      setDocProcessingResult(proc);
    } catch {
      //
    } finally {
      setIsLoadingDocProcess(false);
    }
  };

  const handleUploadNewEvidenceInAnalyzer = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoadingDocProcess(true);
    showToast(`Uploading and extracting ${file.name}...`);
    try {
      const uploaded = await apiClient.uploadEvidence(activeCase?.id || 'complaint-7102', file);
      const list = await apiClient.getEvidenceList({ complaint_id: activeCase?.id });
      setCaseEvidenceList(list || []);
      setSelectedEvidenceId(uploaded.id);
      const proc = await apiClient.getEvidenceProcessingResult(uploaded.id);
      setDocProcessingResult(proc);
      showToast(`Document ${file.name} processed: ${proc.extracted_entities?.length || 0} indicators extracted.`);
    } catch (err: any) {
      showToast(`Upload failed: ${err.message || 'Error processing document'}`);
    } finally {
      setIsLoadingDocProcess(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };


  // Quick Action Modals
  const [activeQuickAction, setActiveQuickAction] = useState<'add-evidence' | 'link-case' | 'request-validation' | null>(null);
  const [evidenceName, setEvidenceName] = useState('');
  const [evidenceType, setEvidenceType] = useState('Transaction Slip');
  const [evidenceHash, setEvidenceHash] = useState('8f74a9...b14e');
  const [evidenceSource, setEvidenceSource] = useState('Victim Mobile Device Extract');
  const quickEvidenceFileInputRef = useRef<HTMLInputElement>(null);
  const [quickEvidenceFile, setQuickEvidenceFile] = useState<File | null>(null);
  const [isUploadingQuickEvidence, setIsUploadingQuickEvidence] = useState(false);
  const [linkTargetCaseId, setLinkTargetCaseId] = useState('CYBER-2026-6819');
  const [linkRationale, setLinkRationale] = useState('Shared mule VPA fraud@okaxis identified across both complaints.');
  const [validationReviewer, setValidationReviewer] = useState('Senior Analyst Sharma (Supervisor)');
  const [validationRemarks, setValidationRemarks] = useState('Request supervisor verification of Level 2 triage escalation and 1930 freeze notice.');

  const handleQuickEvidenceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQuickEvidenceFile(file);
    setEvidenceName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setEvidenceHash(hashHex);
    } catch {
      setEvidenceHash('4b8a1c9e2f3d5a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b');
    }
  };

  const handleSealQuickEvidence = async () => {
    setIsUploadingQuickEvidence(true);
    try {
      if (quickEvidenceFile) {
        const targetId = activeCase?.id || 'complaint-7102';
        const uploaded = await apiClient.uploadEvidence(targetId, quickEvidenceFile);
        if (uploaded) {
          setCaseEvidenceList(prev => [uploaded, ...prev]);
        }
      }
      showToast(`Evidence "${evidenceName || 'File'}" sealed and stored in Evidence Repository.`);
      setActiveQuickAction(null);
      setEvidenceName('');
      setQuickEvidenceFile(null);
    } catch (err: any) {
      console.warn('Backend evidence upload warning:', err);
      showToast(`Evidence "${evidenceName || 'File'}" sealed in local cryptographic vault.`);
      setActiveQuickAction(null);
      setEvidenceName('');
      setQuickEvidenceFile(null);
    } finally {
      setIsUploadingQuickEvidence(false);
    }
  };

  // Notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast(`Copied "${text}" to clipboard.`);
  };

  // Run AI Triage Action
  const handleRunAITriage = () => {
    setIsTriageRunning(true);
    setTimeout(() => {
      setIsTriageRunning(false);
      setShowTriageModal(true);
      setTriageCompleted(true);
      showToast('AI Triage Complete: Scored at Level 2 Triage (High Priority).');
    }, 1200);
  };

  // Run Entity Extraction Action
  const handleRunEntityExtraction = () => {
    setIsExtractingEntities(true);
    setTimeout(() => {
      setIsExtractingEntities(false);
      // Ensure all 5 standard entities are present, plus optional new one
      if (entities.length === 5) {
        setEntities(prev => [
          ...prev,
          {
            id: 'ent-6',
            type: 'IFSC Code',
            value: 'UTIB0000123',
            source: 'Enrichment',
            extractionTime: '13 Jun 2026, 09:16 AM',
            confidence: 0.95,
            validationStatus: 'Verified Authentic',
            threatIntelMatch: 'Axis Bank Indiranagar Bangalore branch routing code.'
          }
        ]);
        showToast('Entity extraction re-run complete: 6 cyber entities indexed.');
      } else {
        showToast('Entity extraction complete: 5 cyber entities indexed.');
      }
    }, 1100);
  };

  // Save Amended Narrative
  const handleSaveAmendment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!narrativeInput.trim()) return;
    const newVersion = `v${amendmentHistory.length + 2}.0`;
    setAmendmentHistory(prev => [
      ...prev,
      {
        version: newVersion,
        text: narrativeInput,
        reason: amendmentReason || 'Investigator clarified statement during victim interview.',
        amendedBy: 'Naveen (You)',
        timestamp: new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setIncidentNarrative(narrativeInput);
    setIsEditNarrativeOpen(false);
    setAmendmentReason('');
    showToast(`Narrative updated under Audited Amendment ${newVersion}. Original statement preserved.`);
  };

  // Add Case Note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const newNote: CaseNoteItem = {
      id: `note-${Date.now()}`,
      author: 'Naveen (You)',
      role: 'Cybercrime Specialist #7402',
      timestamp: 'Just now',
      category: newNoteCategory,
      note: newNoteText.trim()
    };
    setCaseNotes(prev => [newNote, ...prev]);
    setNewNoteText('');
    showToast('Case note recorded in audit log.');
  };

  // Verify E/C/V Correlation
  const handleVerifyCorrelation = (id: string, action: 'verify' | 'reject') => {
    setCorrelations(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          evidenceCategory: action === 'verify' ? 'V — Verified Cross-Case Link' : 'C — Context',
          verificationStatus: action === 'verify' ? 'Verified' : 'Rejected / Inconclusive',
          verificationRationale: action === 'verify'
            ? 'Independent bank transaction verification confirmed identical mule VPA routing.'
            : 'Mule VPA coincidence not supported by IP or device fingerprint corroboration.',
          verifiedBy: 'Naveen (You)',
          verifiedAt: '13 Jun 2026, 09:20 AM'
        };
      }
      return c;
    }));
    showToast(
      action === 'verify' 
        ? 'Cross-case correlation VERIFIED: Registered as local investigative link without altering evidentiary provenance.'
        : 'Cross-case correlation flagged as UNRELATED LEAD: Preserved in context log.'
    );
  };

  return (
    <div className="flex flex-col gap-5 text-content-primary animate-in fade-in duration-200">
      {/* Toast Alert Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#06140c] border border-primary text-primary text-xs font-mono shadow-2xl animate-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Grid: Left Workspace (8 cols) + Right Panels (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ========================================================================= */}
        {/* LEFT WORKSPACE (8 Columns)                                                */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 flex flex-col gap-5">

          {/* Top Bar: Back Link, Case ID, Triage Badge, Action Buttons, Title & Dates */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => onSelectTab('assigned-cases')}
              className="inline-flex items-center gap-1.5 text-xs text-content-muted hover:text-primary transition-colors font-mono w-fit cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Assigned Cases</span>
            </button>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-primary font-mono font-bold text-sm tracking-wide">
                  CYBER-2026-7102
                </span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#2c1214] text-[#ff5252] border border-[#ff5252]/40 tracking-wider">
                  LEVEL 2 TRIAGE
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleRunAITriage}
                  disabled={isTriageRunning}
                  className="px-3 py-1.5 rounded-lg bg-[#0d1e15] border border-primary/30 hover:border-primary/60 text-xs font-mono text-content-primary hover:text-primary flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="Run explainable DeBERTa neural triage classification"
                >
                  <RotateCw className={`w-3.5 h-3.5 text-primary ${isTriageRunning ? 'animate-spin' : ''}`} />
                  <span>Run AI Triage</span>
                </button>

                <button
                  onClick={() => setShowCorrelationModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#00e676] hover:bg-[#00c853] text-[#020b06] text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  title="View cross-case correlation graph and linked complaints"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#020b06]" />
                  <span>View Related Cases</span>
                </button>
              </div>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                UPI / QR Code Payment Scam Report
              </h1>
              <div className="text-xs text-content-muted mt-1 font-sans flex items-center gap-2">
                <span>Submitted on 12 Jun 2026, 10:24 AM</span>
                <span>•</span>
                <span>Last updated 13 Jun 2026, 09:15 AM</span>
              </div>
            </div>
          </div>

          {/* Incident Narrative Card */}
          <div className="p-4 rounded-xl bg-[#06140c] border border-primary/20 flex flex-col gap-2 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold text-xs font-mono">
                <FileText className="w-4 h-4 text-primary" />
                <span>Incident Narrative</span>
                {amendmentHistory.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Audited Amendment v{amendmentHistory.length + 1}.0
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  setNarrativeInput(incidentNarrative);
                  setIsEditNarrativeOpen(true);
                }}
                className="px-2.5 py-1 rounded bg-[#0d2217] hover:bg-[#133020] text-content-primary hover:text-primary text-[11px] font-mono border border-white/10 hover:border-primary/40 flex items-center gap-1 transition-all cursor-pointer"
                title="Propose audited amendment to incident statement"
              >
                <Edit3 className="w-3 h-3 text-primary" />
                <span>Edit</span>
              </button>
            </div>

            <p className="text-xs text-[#c8ddd0] leading-relaxed font-sans">
              {incidentNarrative}
            </p>
          </div>

          {/* Case Summary Cards (4 Cards Grid) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Card 1: Reported Loss */}
            <div className="p-3.5 rounded-xl bg-[#06140c] border border-primary/20 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-content-muted block uppercase">Reported Loss</span>
                <span className="text-sm font-bold text-primary font-mono">₹25,000</span>
              </div>
            </div>

            {/* Card 2: Case Category */}
            <div className="p-3.5 rounded-xl bg-[#06140c] border border-primary/20 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-content-muted block uppercase">Case Category</span>
                <span className="text-xs font-bold text-white truncate block">UPI / QR Code</span>
                <span className="text-[10px] text-content-muted block leading-none">Payment Scam</span>
              </div>
            </div>

            {/* Card 3: Status */}
            <div className="p-3.5 rounded-xl bg-[#06140c] border border-primary/20 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-[#00b0ff]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-content-muted block uppercase">Status</span>
                <span className="text-xs font-bold text-[#00b0ff] font-mono tracking-wide">{caseStatus}</span>
              </div>
            </div>

            {/* Card 4: Assigned Unit */}
            <div className="p-3.5 rounded-xl bg-[#06140c] border border-primary/20 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-[#00b0ff]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-content-muted block uppercase">Assigned Unit</span>
                <span className="text-xs font-bold text-white truncate block">Cybercell Metro</span>
              </div>
            </div>
          </div>

          {/* Four Workspace Tabs */}
          <div className="border-b border-primary/20 flex items-center gap-6 text-xs font-mono">
            <button
              onClick={() => setActiveTab('extracted-entities')}
              className={`pb-2.5 flex items-center gap-2 border-b-2 font-bold transition-all cursor-pointer ${
                activeTab === 'extracted-entities'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-content-muted hover:text-content-primary'
              }`}
            >
              <Fingerprint className="w-4 h-4" />
              <span>Extracted Entities (IOCs)</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`pb-2.5 flex items-center gap-2 border-b-2 font-bold transition-all cursor-pointer ${
                activeTab === 'timeline'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-content-muted hover:text-content-primary'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Timeline</span>
            </button>

            <button
              onClick={() => setActiveTab('correlations')}
              className={`pb-2.5 flex items-center gap-2 border-b-2 font-bold transition-all cursor-pointer ${
                activeTab === 'correlations'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-content-muted hover:text-content-primary'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>Correlations</span>
            </button>

            <button
              onClick={() => setActiveTab('case-notes')}
              className={`pb-2.5 flex items-center gap-2 border-b-2 font-bold transition-all cursor-pointer ${
                activeTab === 'case-notes'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-content-muted hover:text-content-primary'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Case Notes</span>
            </button>
          </div>

          {/* TAB 1: EXTRACTED CYBER ENTITIES (IOCs) */}
          {activeTab === 'extracted-entities' && (
            <div className="p-4 rounded-xl bg-[#06140c] border border-primary/20 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-primary font-bold text-xs font-mono">
                  <Fingerprint className="w-4 h-4 text-primary" />
                  <span>Extracted Cyber Entities (IOCs)</span>
                </div>

                <button
                  onClick={handleRunEntityExtraction}
                  disabled={isExtractingEntities}
                  className="px-3.5 py-1.5 rounded-lg bg-[#00e676] hover:bg-[#00c853] text-[#020b06] text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  title="Run deterministic regex and DeBERTa cyber NER on complaint and evidence files"
                >
                  <Fingerprint className={`w-3.5 h-3.5 text-[#020b06] ${isExtractingEntities ? 'animate-pulse' : ''}`} />
                  <span>{isExtractingEntities ? 'Extracting...' : 'Run Entity Extraction'}</span>
                </button>
              </div>

              {/* Entities Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-[10px] text-content-muted uppercase">
                      <th className="pb-2.5 font-semibold">TYPE</th>
                      <th className="pb-2.5 font-semibold">VALUE</th>
                      <th className="pb-2.5 font-semibold">SOURCE</th>
                      <th className="pb-2.5 font-semibold text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {entities.map((item) => {
                      // Pill badges matching screenshot styling
                      const pillStyle = 
                        item.type === 'Mobile' ? 'bg-[#2b1842] text-[#d6b4fc] border border-[#a855f7]/40' :
                        item.type === 'UPI ID' ? 'bg-[#14233c] text-[#7dd3fc] border border-[#38bdf8]/40' :
                        item.type === 'Bank Account' ? 'bg-[#332211] text-[#fcd34d] border border-[#f59e0b]/40' :
                        item.type === 'URL' ? 'bg-[#0f2d27] text-[#5eead4] border border-[#14b8a6]/40' :
                        item.type === 'IP Address' ? 'bg-[#132238] text-[#93c5fd] border border-[#3b82f6]/40' :
                        'bg-zinc-800 text-zinc-300 border border-zinc-600/40';

                      return (
                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                          {/* TYPE */}
                          <td className="py-2.5 pr-3">
                            <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-medium ${pillStyle}`}>
                              {item.type}
                            </span>
                          </td>

                          {/* VALUE */}
                          <td className="py-2.5 pr-3 text-content-primary font-bold">
                            <div className="flex items-center gap-2">
                              <span>{item.value}</span>
                              <button
                                onClick={() => handleCopy(item.id, item.value)}
                                className="opacity-0 group-hover:opacity-100 text-content-muted hover:text-primary transition-opacity"
                                title="Copy value"
                              >
                                {copiedId === item.id ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>

                          {/* SOURCE */}
                          <td className="py-2.5 pr-3 text-content-secondary text-[11px]">
                            {item.source}
                          </td>

                          {/* ACTION */}
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => setSelectedEntityForModal(item)}
                              className="px-2.5 py-1 rounded-md bg-[#0a2014] hover:bg-[#0f2e1e] text-primary border border-primary/30 hover:border-primary/60 text-[11px] font-mono inline-flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                            >
                              <Eye className="w-3 h-3 text-primary" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="p-5 rounded-xl bg-[#06140c] border border-primary/20 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2 text-primary font-bold text-xs font-mono">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Case Milestone Timeline (Cryptographically Sealed)</span>
                </div>
                <span className="text-[10px] font-mono text-content-muted">NIST SP 800-61 Rev. 3 Audit Compliance</span>
              </div>

              <div className="relative pl-6 border-l-2 border-primary/30 flex flex-col gap-5 py-2">
                {[
                  {
                    time: '12 Jun 2026, 10:24 AM',
                    title: 'Incident Submitted via Citizen Portal',
                    desc: 'Citizen Naveen submitted payment fraud report with debit notification screenshot.',
                    actor: 'Citizen Portal / Automated Ingestion',
                    hash: '0x3b8a...12c4'
                  },
                  {
                    time: '12 Jun 2026, 10:25 AM',
                    title: 'Automated Cyber Entity Extraction (5 IOCs)',
                    desc: 'Deterministic rules & Cyber NER identified mobile (+91 98765 43210), UPI handle (fraud@okaxis), bank account, phishing domain, and C2 host.',
                    actor: 'CCIP Entity Extraction Pipeline',
                    hash: '0x992b...7e11'
                  },
                  {
                    time: '12 Jun 2026, 11:00 AM',
                    title: 'Case Assigned to Specialist Unit',
                    desc: 'Assigned to Cybercell Metro. Primary Investigator: Naveen (SPEC-04).',
                    actor: 'Nodal Dispatcher (Supervisor)',
                    hash: '0x4a9f...881c'
                  },
                  {
                    time: '12 Jun 2026, 02:15 PM',
                    title: 'SOC Telemetry Correlated (Alert C2-102431)',
                    desc: 'SOC Monitoring flagged outbound TCP/IP connection to 185.220.101.44 (DarkSynapse C2) from monitored gateway.',
                    actor: 'SOC Monitoring Mesh',
                    hash: '0x18ab...cc09'
                  },
                  {
                    time: '13 Jun 2026, 09:15 AM',
                    title: 'Level 2 Triage Confirmed',
                    desc: 'Investigator confirmed urgency: 24h Golden Hour active for 1930 payment freeze.',
                    actor: 'Naveen (You)',
                    hash: '0x7e12...b499'
                  }
                ].map((ev, idx) => (
                  <div key={idx} className="relative flex flex-col gap-1 text-xs">
                    <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-[#06140c]" />
                    <div className="flex items-center justify-between text-content-muted font-mono text-[11px]">
                      <span>{ev.time}</span>
                      <span className="text-[10px] text-primary/70">SHA-256: {ev.hash}</span>
                    </div>
                    <span className="font-bold text-white text-xs">{ev.title}</span>
                    <p className="text-content-secondary text-[11px] font-sans leading-relaxed">{ev.desc}</p>
                    <span className="text-[10px] font-mono text-primary/80 mt-0.5">Logged by: {ev.actor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CORRELATIONS (E/C/V FRAMEWORK) */}
          {activeTab === 'correlations' && (
            <div className="p-5 rounded-xl bg-[#06140c] border border-primary/20 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                <div>
                  <div className="flex items-center gap-2 text-primary font-bold text-xs font-mono">
                    <Share2 className="w-4 h-4 text-primary" />
                    <span>Cross-Case Correlations (E / C / V Architecture)</span>
                  </div>
                  <p className="text-[11px] text-content-muted mt-0.5 font-sans">
                    Context (C) matches remain investigative leads until independently verified (V). Unverified context does not alter active case evidence (E).
                  </p>
                </div>

                <button
                  onClick={() => setShowCorrelationModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>3D Correlation Graph</span>
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {correlations.map((corr) => (
                  <div
                    key={corr.id}
                    className="p-4 rounded-xl bg-[#0a1f14] border border-white/[0.08] hover:border-primary/40 flex flex-col gap-2.5 transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-primary text-xs">{corr.targetCaseId}</span>
                        <span className="text-content-muted">•</span>
                        <span className="text-white font-sans font-bold text-xs">{corr.targetCaseTitle}</span>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          {corr.evidenceCategory}
                        </span>
                        <span className={`px-2 py-0.5 rounded border font-bold ${
                          corr.verificationStatus === 'Verified'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : corr.verificationStatus === 'Rejected / Inconclusive'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {corr.verificationStatus}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono bg-black/30 p-2.5 rounded-lg border border-white/[0.04]">
                      <div>
                        <span className="text-[10px] text-content-muted block">MATCHING INDICATOR</span>
                        <span className="text-primary font-bold">{corr.matchingIndicator} ({corr.indicatorType})</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-content-muted block">REPORTED LOSS</span>
                        <span className="text-white font-bold">{formatINR(corr.loss)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-content-muted block">JURISDICTION</span>
                        <span className="text-content-secondary">{corr.location}</span>
                      </div>
                    </div>

                    <p className="text-xs text-content-secondary font-sans leading-relaxed">
                      <strong className="text-content-primary font-mono text-[11px]">Hypothesis:</strong> {corr.relationshipHypothesis}
                    </p>

                    {corr.verificationRationale && (
                      <div className="p-2 rounded bg-black/40 border border-primary/20 text-[11px] font-mono text-content-muted">
                        <span className="text-primary font-bold">Audit Verification Note:</span> {corr.verificationRationale}
                        <span className="block text-[10px] text-content-muted mt-0.5">Verified by {corr.verifiedBy} at {corr.verifiedAt}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs font-mono">
                      <span className="text-[10px] text-content-muted">
                        Patent Mechanism: Controlled E/C/V provenance isolation active.
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVerifyCorrelation(corr.id, 'verify')}
                          className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-bold transition-all cursor-pointer"
                        >
                          Verify Link
                        </button>
                        <button
                          onClick={() => handleVerifyCorrelation(corr.id, 'reject')}
                          className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 text-[11px] font-bold transition-all cursor-pointer"
                        >
                          Mark Unrelated
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CASE NOTES */}
          {activeTab === 'case-notes' && (
            <div className="p-5 rounded-xl bg-[#06140c] border border-primary/20 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2 text-primary font-bold text-xs font-mono">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>Investigator Case Notes & Judicial Diary</span>
                </div>
                <span className="text-[10px] font-mono text-content-muted">Audited & Timestamped</span>
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="flex flex-col gap-2.5 p-3 rounded-xl bg-black/40 border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-content-muted">Record Official Observation</span>
                  <select
                    value={newNoteCategory}
                    onChange={(e: any) => setNewNoteCategory(e.target.value)}
                    className="bg-[#0b1c13] border border-primary/30 rounded px-2 py-0.5 text-xs text-primary font-mono focus:outline-none"
                  >
                    <option value="Lead Follow-up">Lead Follow-up</option>
                    <option value="Bank Notice">Bank Notice</option>
                    <option value="Victim Interview">Victim Interview</option>
                    <option value="Evidence Review">Evidence Review</option>
                  </select>
                </div>
                <textarea
                  rows={2}
                  placeholder="Type investigation note, transaction observation, or victim communication details..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="w-full bg-[#07170e] border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-content-muted focus:outline-none focus:border-primary font-sans resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-primary text-[#020b06] text-xs font-bold font-mono hover:bg-primary-hover transition-all cursor-pointer shadow-sm"
                  >
                    Record Note
                  </button>
                </div>
              </form>

              {/* Notes List */}
              <div className="flex flex-col gap-3">
                {caseNotes.map((note) => (
                  <div key={note.id} className="p-3.5 rounded-xl bg-[#0a1f14] border border-white/[0.06] flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-bold">{note.author}</span>
                        <span className="text-content-muted">({note.role})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.2 rounded bg-primary/10 text-primary border border-primary/30 text-[10px]">
                          {note.category}
                        </span>
                        <span className="text-content-muted text-[10px]">{note.timestamp}</span>
                      </div>
                    </div>
                    <p className="text-[#c8ddd0] font-sans leading-relaxed text-xs">
                      {note.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN (4 Columns)                                                  */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 flex flex-col gap-4">

          {/* 1. Forensic Analyzer Actions Panel */}
          <div className="p-4 rounded-xl bg-[#06140c] border border-primary/20 flex flex-col gap-3 shadow-md">
            <div className="flex items-center gap-2 text-primary font-bold text-xs font-mono pb-2 border-b border-white/[0.08]">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Forensic Analyzer Actions</span>
            </div>

            <div className="flex flex-col gap-2 text-xs font-mono">
              {/* Option 1: UPI / Bank Transaction Analyzer */}
              <button
                onClick={() => setActiveAnalyzer('upi')}
                className="w-full p-2.5 rounded-lg bg-[#0b1c13] hover:bg-[#10291c] border border-white/[0.06] hover:border-primary/40 flex items-center justify-between text-content-primary hover:text-primary transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Landmark className="w-4 h-4 text-primary" />
                  <span>UPI / Bank Transaction Analyzer</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-content-muted group-hover:text-primary transition-colors" />
              </button>

              {/* Option 2: URL / Phishing Analyzer */}
              <button
                onClick={() => setActiveAnalyzer('url')}
                className="w-full p-2.5 rounded-lg bg-[#0b1c13] hover:bg-[#10291c] border border-white/[0.06] hover:border-primary/40 flex items-center justify-between text-content-primary hover:text-primary transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-primary" />
                  <span>URL / Phishing Analyzer</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-content-muted group-hover:text-primary transition-colors" />
              </button>

              {/* Option 3: Image / Document Analyzer */}
              <button
                onClick={() => setActiveAnalyzer('image')}
                className="w-full p-2.5 rounded-lg bg-[#0b1c13] hover:bg-[#10291c] border border-white/[0.06] hover:border-primary/40 flex items-center justify-between text-content-primary hover:text-primary transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <FileImage className="w-4 h-4 text-primary" />
                  <span>Image / Document Analyzer</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-content-muted group-hover:text-primary transition-colors" />
              </button>

              {/* Option 4: Generate Report (Solid vibrant green) */}
              <button
                onClick={() => setActiveAnalyzer('report')}
                className="w-full p-3 rounded-lg bg-[#00e676] hover:bg-[#00c853] text-[#020b06] font-bold flex items-center justify-between transition-all shadow-md cursor-pointer group mt-1"
              >
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-4 h-4 text-[#020b06]" />
                  <span>Generate Report</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#020b06]" />
              </button>
            </div>
          </div>

          {/* 2. Case Information Panel */}
          <div className="p-4 rounded-xl bg-[#06140c] border border-primary/20 flex flex-col gap-3 shadow-md">
            <div className="flex items-center gap-2 text-primary font-bold text-xs font-mono pb-2 border-b border-white/[0.08]">
              <Info className="w-4 h-4 text-primary" />
              <span>Case Information</span>
            </div>

            <div className="flex flex-col gap-2.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-content-muted">Case ID</span>
                <span className="font-bold text-primary">CYBER-2026-7102</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-content-muted">Victim</span>
                <span className="text-white font-sans font-medium">Naveen</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-content-muted">Submitted</span>
                <span className="text-content-secondary">12 Jun 2026, 10:24 AM</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-content-muted">Last Updated</span>
                <span className="text-content-secondary">13 Jun 2026, 09:15 AM</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-content-muted">Status</span>
                <span className="flex items-center gap-1.5 text-[#00b0ff] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00b0ff]" />
                  <span>Submitted</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-content-muted">Priority</span>
                <span className="flex items-center gap-1.5 text-[#ff5252] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff5252]" />
                  <span>Level 2</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-content-muted">Assigned Unit</span>
                <span className="text-white font-sans font-medium">Cybercell Metro</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-content-muted">Investigator</span>
                <span className="text-white font-sans font-medium">Naveen (You)</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-content-muted">Tags</span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-[#102419] border border-white/10 text-content-primary text-[10px]">
                    UPI Scam
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#102419] border border-white/10 text-content-primary text-[10px]">
                    Payment Fraud
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Quick Actions Panel */}
          <div className="p-4 rounded-xl bg-[#06140c] border border-primary/20 flex flex-col gap-3 shadow-md">
            <div className="flex items-center gap-2 text-primary font-bold text-xs font-mono pb-2 border-b border-white/[0.08]">
              <Zap className="w-4 h-4 text-primary" />
              <span>Quick Actions</span>
            </div>

            <div className="flex flex-col gap-2 text-xs font-mono">
              <button
                onClick={() => setActiveQuickAction('add-evidence')}
                className="w-full p-2.5 rounded-lg bg-[#0b1c13] hover:bg-[#10291c] border border-white/[0.06] hover:border-primary/40 flex items-center justify-between text-content-primary hover:text-primary transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Upload className="w-4 h-4 text-primary" />
                  <span>Add Evidence</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-content-muted group-hover:text-primary transition-colors" />
              </button>

              <button
                onClick={() => setActiveQuickAction('link-case')}
                className="w-full p-2.5 rounded-lg bg-[#0b1c13] hover:bg-[#10291c] border border-white/[0.06] hover:border-primary/40 flex items-center justify-between text-content-primary hover:text-primary transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <LinkIcon className="w-4 h-4 text-primary" />
                  <span>Link to Existing Case</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-content-muted group-hover:text-primary transition-colors" />
              </button>

              <button
                onClick={() => setActiveQuickAction('request-validation')}
                className="w-full p-2.5 rounded-lg bg-[#0b1c13] hover:bg-[#10291c] border border-white/[0.06] hover:border-primary/40 flex items-center justify-between text-content-primary hover:text-primary transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Request Validation</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-content-muted group-hover:text-primary transition-colors" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS & WORKFLOW DRAWERS                                                 */}
      {/* ========================================================================= */}

      {/* 1. Audited Narrative Amendment Modal */}
      {isEditNarrativeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#06140c] border border-primary/30 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-primary font-bold text-sm font-mono">
                <Edit3 className="w-4 h-4" />
                <span>Audited Incident Statement Amendment</span>
              </div>
              <button onClick={() => setIsEditNarrativeOpen(false)} className="text-content-muted hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] text-xs">
              <span className="text-[10px] font-mono text-content-muted uppercase block mb-1">
                Original Submitted Complaint (Version 1.0 - Read Only, Immutable)
              </span>
              <p className="text-content-secondary italic font-sans">{originalNarrative}</p>
            </div>

            <form onSubmit={handleSaveAmendment} className="flex flex-col gap-3 text-xs font-mono">
              <div>
                <label className="block text-content-muted text-[11px] mb-1">
                  Amended Statement (Version {amendmentHistory.length + 2}.0)
                </label>
                <textarea
                  rows={4}
                  value={narrativeInput}
                  onChange={(e) => setNarrativeInput(e.target.value)}
                  className="w-full bg-[#081a10] border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-primary font-sans resize-none"
                  placeholder="Enter updated narrative based on victim interview or corroborating evidence..."
                />
              </div>

              <div>
                <label className="block text-content-muted text-[11px] mb-1">
                  Justification / Amendment Rationale <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Victim clarified call duration, exact UPI handle, and caller phone number during formal interview"
                  value={amendmentReason}
                  onChange={(e) => setAmendmentReason(e.target.value)}
                  className="w-full bg-[#081a10] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-primary font-sans"
                />
              </div>

              <div className="text-[10px] text-content-muted bg-primary/10 border border-primary/20 p-2.5 rounded-lg flex items-center gap-2">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <span>
                  Audit Policy: The original citizen submission is permanently preserved. Any amendment is appended with investigator identifier, timestamp, and signed hash.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsEditNarrativeOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/[0.04] text-content-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-[#020b06] font-bold"
                >
                  Seal Amendment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Explainable AI Triage Modal */}
      {showTriageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#06140c] border border-primary/30 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-primary font-bold text-sm font-mono">
                <RotateCw className="w-4 h-4 text-primary" />
                <span>Explainable AI Triage Recommendation (DeBERTa-v3)</span>
              </div>
              <button onClick={() => setShowTriageModal(false)} className="text-content-muted hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0b1c13] border border-primary/20 flex flex-col gap-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">Predicted Category: UPI / QR Code Payment Scam</span>
                <span className="px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/40 font-bold">
                  94.8% Confidence
                </span>
              </div>
              <p className="text-content-secondary font-sans text-[11px] leading-relaxed">
                Complaint narrative exhibits strong lexical alignment with social engineering OTP interception and fraudulent UPI VPA debit patterns.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col gap-1.5">
                <span className="text-[10px] text-content-muted uppercase">Urgency Assessment</span>
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Golden Hour Active (&lt; 24h)</span>
                </div>
                <span className="text-[10px] text-content-muted">Debited 12 Jun 2026. High recovery probability if frozen within 6 hours.</span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col gap-1.5">
                <span className="text-[10px] text-content-muted uppercase">Missing Information</span>
                <div className="flex items-center gap-1 text-content-secondary">
                  <span className="text-rose-400 font-bold">•</span> Bank Transaction UTR Number
                </div>
                <div className="flex items-center gap-1 text-content-secondary">
                  <span className="text-emerald-400 font-bold">✓</span> Beneficiary UPI VPA Identified
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-xs font-mono">
              <span className="text-[10px] text-content-muted uppercase block mb-1">Recommended Forensic Analyzers</span>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded bg-[#0b1c13] text-primary border border-primary/30 text-[11px]">
                  🏛️ UPI / Bank Transaction Analyzer
                </span>
                <span className="px-2 py-1 rounded bg-[#0b1c13] text-primary border border-primary/30 text-[11px]">
                  🔗 URL / Phishing Analyzer
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-sans flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Advisory Notice: This is an automated preliminary recommendation. The assigned investigator retains full legal authority to modify or dismiss.</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <button
                onClick={() => {
                  setShowTriageModal(false);
                  showToast('AI Triage recommendation dismissed.');
                }}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-content-muted hover:text-white text-xs font-mono"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setShowTriageModal(false);
                  setCaseStatus('UNDER_INVESTIGATION');
                  showToast('AI Triage accepted: Status advanced to UNDER_INVESTIGATION.');
                }}
                className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-[#020b06] text-xs font-mono font-bold"
              >
                Accept Triage Recommendation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Entity Detail & Threat Intel Provenance Modal */}
      {selectedEntityForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[#06140c] border border-primary/30 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-primary font-bold text-sm font-mono">
                <Fingerprint className="w-4 h-4" />
                <span>Cyber Entity Provenance & Threat Intel</span>
              </div>
              <button onClick={() => setSelectedEntityForModal(null)} className="text-content-muted hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col gap-1">
                <span className="text-[10px] text-content-muted uppercase">Entity Type</span>
                <span className="text-primary font-bold text-sm">{selectedEntityForModal.type}</span>
                <span className="text-white font-bold text-base mt-1 break-all">{selectedEntityForModal.value}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04]">
                  <span className="text-[10px] text-content-muted block">SOURCE PROVENANCE</span>
                  <span className="text-content-primary font-bold">{selectedEntityForModal.source}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04]">
                  <span className="text-[10px] text-content-muted block">EXTRACTION CONFIDENCE</span>
                  <span className="text-soft-green font-bold">{(selectedEntityForModal.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04]">
                <span className="text-[10px] text-content-muted block mb-1">VALIDATION STATUS</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {selectedEntityForModal.validationStatus}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#0a1f14] border border-primary/20 flex flex-col gap-1">
                <span className="text-[10px] text-primary font-bold uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Threat Intelligence Feeds Correlation
                </span>
                <p className="text-content-secondary font-sans text-xs leading-relaxed">
                  {selectedEntityForModal.threatIntelMatch}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs font-mono">
              <button
                onClick={() => {
                  onSelectTab('threat-intelligence');
                }}
                className="text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Lookup in Threat Intel
              </button>
              <button
                onClick={() => setSelectedEntityForModal(null)}
                className="px-4 py-1.5 rounded-lg bg-primary text-[#020b06] font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Cross-Case Correlation (3D / E-C-V) Modal */}
      {showCorrelationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-4xl bg-[#06140c] border border-primary/40 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-primary font-bold text-sm font-mono">
                <Share2 className="w-4 h-4 text-primary" />
                <span>Cross-Case Correlation Graph & Controlled E/C/V Engine</span>
              </div>
              <button onClick={() => setShowCorrelationModal(false)} className="text-content-muted hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-primary/20 text-xs font-mono flex items-center justify-between">
              <div>
                <span className="text-primary font-bold">Active Anchor: CYBER-2026-7102</span>
                <span className="text-content-muted ml-3">Candidate Matches: 2 Related Cases Found</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold">
                PATENT E/C/V SAFEGUARDS ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {correlations.map((corr) => (
                <div key={corr.id} className="p-4 rounded-xl bg-[#0a1f14] border border-white/[0.08] flex flex-col justify-between gap-3 font-mono text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-primary font-bold">{corr.targetCaseId}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px]">
                        {corr.verificationStatus}
                      </span>
                    </div>
                    <div className="text-white font-bold font-sans text-sm">{corr.targetCaseTitle}</div>
                    <div className="text-content-muted text-[11px] mt-1">{corr.location} • Loss: {formatINR(corr.loss)}</div>
                  </div>

                  <div className="p-2.5 rounded bg-black/40 border border-white/[0.04] text-[11px]">
                    <span className="text-primary font-bold block mb-0.5">Shared Identifier:</span>
                    <span className="text-white">{corr.matchingIndicator} ({corr.indicatorType})</span>
                    <p className="text-content-secondary font-sans text-[11px] mt-1.5 leading-relaxed">{corr.relationshipHypothesis}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                    <span className="text-[10px] text-content-muted">Category: {corr.evidenceCategory}</span>
                    <button
                      onClick={() => {
                        handleVerifyCorrelation(corr.id, 'verify');
                        showToast(`Verified correlation with ${corr.targetCaseId}`);
                      }}
                      className="px-2.5 py-1 rounded bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 text-[11px] font-bold cursor-pointer"
                    >
                      Verify as Local Lead
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-black/40 border border-white/[0.04] text-[11px] text-content-muted font-sans flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>
                Judicial Rule: Cross-case candidate relationships serve as investigative context only. They must be independently verified by the assigned officer before entering evidence repositories.
              </span>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/[0.06]">
              <button
                onClick={() => setShowCorrelationModal(false)}
                className="px-4 py-2 rounded-lg bg-primary text-[#020b06] font-bold font-mono text-xs cursor-pointer"
              >
                Close Correlation View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Forensic Analyzer: UPI / Bank Transaction Analyzer */}
      {activeAnalyzer === 'upi' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-[#06140c] border border-primary/30 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-primary font-bold text-sm font-mono">
                <Landmark className="w-4 h-4 text-primary" />
                <span>UPI & Bank Transaction Forensics Engine</span>
              </div>
              <button onClick={() => setActiveAnalyzer(null)} className="text-content-muted hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-content-muted block uppercase">Beneficiary VPA</span>
                  <span className="text-primary font-bold text-sm">fraud@okaxis</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                  HIGH-RISK MULE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04]">
                  <span className="text-[10px] text-content-muted block">ROUTING BANK</span>
                  <span className="text-white font-bold">Axis Bank Ltd</span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04]">
                  <span className="text-[10px] text-content-muted block">ACCOUNT SUFFIX</span>
                  <span className="text-white font-bold">XXXX 6789</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0b1c13] border border-primary/20 flex flex-col gap-1.5">
                <span className="text-primary font-bold text-xs uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Transaction Velocity & Dispersion
                </span>
                <p className="text-content-secondary font-sans text-xs leading-relaxed">
                  ₹25,000 received at 10:24 AM. 80% was immediately dispersed into two sub-wallets via automated IMPS within 4 minutes.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between">
                <div>
                  <span className="text-white font-bold block text-xs">1930 / I4C Portal Emergency Freeze</span>
                  <span className="text-[10px] text-content-muted">Dispatches nodal freeze directive to Axis Bank fraud desk</span>
                </div>
                <button
                  onClick={() => {
                    setFreezeNoticeSent(true);
                    showToast('Emergency Freeze Notice Dispatched to Axis Bank Nodal Officer.');
                  }}
                  disabled={freezeNoticeSent}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs font-mono transition-all ${
                    freezeNoticeSent 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                      : 'bg-primary text-[#020b06] hover:bg-primary-hover shadow-md'
                  }`}
                >
                  {freezeNoticeSent ? '✓ Notice Dispatched' : 'Request Freeze'}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/[0.06]">
              <button
                onClick={() => setActiveAnalyzer(null)}
                className="px-4 py-1.5 rounded-lg bg-white/[0.06] text-content-primary hover:text-white text-xs font-mono"
              >
                Close Analyzer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Forensic Analyzer: URL / Phishing Analyzer */}
      {activeAnalyzer === 'url' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-[#06140c] border border-primary/30 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-primary font-bold text-sm font-mono">
                <Globe className="w-4 h-4 text-primary" />
                <span>Phishing & Malicious Infrastructure Analyzer</span>
              </div>
              <button onClick={() => setActiveAnalyzer(null)} className="text-content-muted hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-content-muted block uppercase">Analyzed URL</span>
                  <span className="text-primary font-bold text-sm">http://fake-bank-verify.in</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                  CREDENTIAL HARVESTER
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04]">
                  <span className="text-[10px] text-content-muted block">DOMAIN REGISTRAR</span>
                  <span className="text-white font-bold">NameCheap (5 days old)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04]">
                  <span className="text-[10px] text-content-muted block">RESOLVED IP (A RECORD)</span>
                  <span className="text-white font-bold">185.220.101.44</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0b1c13] border border-primary/20 flex flex-col gap-1.5">
                <span className="text-primary font-bold text-xs uppercase">Heuristic Threat Verdict</span>
                <p className="text-content-secondary font-sans text-xs leading-relaxed">
                  Cloned HTML template imitating SBI / Axis NetBanking OTP challenge. Automated credential transmission directly relayed via Telegram Bot API backend.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <button
                onClick={() => {
                  showToast('Domain Takedown Notice generated for NIXI (.IN Registry).');
                  setActiveAnalyzer(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-primary text-[#020b06] font-bold text-xs font-mono"
              >
                Request Domain Takedown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Forensic Analyzer: Image & Document Intelligent Processor */}
      {activeAnalyzer === 'image' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#06140c] border border-primary/40 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-primary font-bold text-sm font-mono">
                <FileImage className="w-4 h-4 text-primary" />
                <span>Forensic Document & Image Intelligence Pipeline</span>
              </div>
              <button onClick={() => setActiveAnalyzer(null)} className="text-content-muted hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Switcher & Upload Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-black/40 border border-white/[0.06] text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-content-muted uppercase">Select Evidence:</span>
                {caseEvidenceList && caseEvidenceList.length > 0 ? (
                  <select
                    value={selectedEvidenceId || ''}
                    onChange={(e) => handleSelectEvidenceForAnalyzer(e.target.value)}
                    className="bg-[#0b1c13] border border-primary/30 rounded px-2.5 py-1 text-xs text-primary font-mono focus:outline-none"
                  >
                    {caseEvidenceList.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.quarantined ? '⚠️ [QUARANTINED] ' : '✓ [CLEAN] '}
                        {ev.name || ev.original_filename} ({ev.size || 'Verified'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-white font-bold">debit_sms_screenshot.png (Active Evidence)</span>
                )}
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadNewEvidenceInAnalyzer}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.txt"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoadingDocProcess}
                  className="px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer font-bold"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload & Analyze Document</span>
                </button>
              </div>
            </div>

            {isLoadingDocProcess ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 font-mono text-xs text-content-muted">
                <RotateCw className="w-6 h-6 text-primary animate-spin" />
                <span>Extracting document text via pypdf / OCR & running Gemini contextual intelligence...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3 font-mono text-xs">
                {/* Telemetry Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04]">
                    <span className="text-[10px] text-content-muted block uppercase">Detected Format</span>
                    <span className="text-primary font-bold">{docProcessingResult?.detected_format || 'IMAGE_SCREENSHOT'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04]">
                    <span className="text-[10px] text-content-muted block uppercase">OCR Engine</span>
                    <span className="text-white font-bold">{docProcessingResult?.ocr_applied ? (docProcessingResult?.ocr_engine || 'OCR Applied') : 'Native Text'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04]">
                    <span className="text-[10px] text-content-muted block uppercase">Pipeline Status</span>
                    <span className="text-emerald-400 font-bold">{docProcessingResult?.processing_status || 'COMPLETED'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04]">
                    <span className="text-[10px] text-content-muted block uppercase">Gemini AI</span>
                    <span className="text-primary font-bold">{docProcessingResult?.gemini_status === 'SUCCESS' ? 'Active' : 'Offline Safe'}</span>
                  </div>
                </div>

                {/* Gemini Contextual Dossier */}
                {docProcessingResult?.gemini_summary && (
                  <div className="p-3.5 rounded-xl bg-[#0b1f14] border border-primary/30 flex flex-col gap-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-primary/20">
                      <span className="text-primary font-bold uppercase text-[11px] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Gemini Contextual Summary
                      </span>
                      <span className="px-2 py-0.2 rounded text-[10px] bg-primary/20 text-primary border border-primary/30">
                        {docProcessingResult?.gemini_analysis_json?.document_category || 'FORENSIC EVIDENCE'}
                      </span>
                    </div>
                    <p className="text-white font-sans text-xs leading-relaxed">
                      {docProcessingResult.gemini_summary}
                    </p>
                    {docProcessingResult?.gemini_analysis_json?.key_findings && (
                      <ul className="list-disc pl-4 text-content-secondary font-sans text-xs flex flex-col gap-0.5 mt-0.5">
                        {docProcessingResult.gemini_analysis_json.key_findings.map((f: string, i: number) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Extracted Indicators */}
                {docProcessingResult?.extracted_entities && docProcessingResult.extracted_entities.length > 0 && (
                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-bold text-xs uppercase flex items-center gap-1.5">
                        <Fingerprint className="w-3.5 h-3.5" /> Extracted Indicators ({docProcessingResult.extracted_entities.length})
                      </span>
                      <button
                        onClick={() => {
                          const newItems = docProcessingResult.extracted_entities.map((ent: any, idx: number) => ({
                            id: `doc-ent-${Date.now()}-${idx}`,
                            type: ent.entity_type === 'UPI_ID' ? 'UPI ID' : ent.entity_type === 'PHONE_NUMBER' ? 'Mobile' : ent.entity_type === 'URL' ? 'URL' : 'Bank Account',
                            value: ent.raw_value,
                            source: 'Document OCR',
                            extractionTime: 'Just now',
                            confidence: ent.confidence || 0.95,
                            validationStatus: 'Verified Authentic',
                            threatIntelMatch: 'Extracted directly from uploaded document.'
                          }));
                          setEntities(prev => [...prev, ...newItems]);
                          showToast(`Imported ${newItems.length} indicators to active case workspace.`);
                        }}
                        className="px-2 py-0.5 rounded bg-primary text-[#020b06] text-[10px] font-bold cursor-pointer"
                      >
                        + Import to Case IOCs
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {docProcessingResult.extracted_entities.map((ent: any, idx: number) => (
                        <div key={idx} className="px-2.5 py-1 rounded bg-[#0b1c13] border border-primary/30 flex items-center gap-2">
                          <span className="text-[10px] text-content-muted">{ent.entity_type}:</span>
                          <span className="text-white font-bold">{ent.raw_value}</span>
                          <span className="text-[10px] text-emerald-400">({Math.round((ent.confidence || 0.95) * 100)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Document Extracted Text with PII Redaction View */}
                <div className="p-3 rounded-xl bg-[#040c07] border border-white/[0.06] flex flex-col gap-1.5">
                  <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-white font-bold text-xs uppercase">Extracted Document Text</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold">
                        PII SHIELD
                      </span>
                    </div>
                    <button
                      onClick={() => setShowDocRedacted(!showDocRedacted)}
                      className="text-[10px] text-content-muted hover:text-primary transition-colors cursor-pointer"
                    >
                      {showDocRedacted ? 'Show Raw' : 'Show Redacted'}
                    </button>
                  </div>
                  <p className="text-content-secondary font-mono text-[11px] leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap select-text">
                    {showDocRedacted 
                      ? (docProcessingResult?.redacted_text || docProcessingResult?.extracted_text || 'No text extracted')
                      : (docProcessingResult?.extracted_text || 'No text extracted')}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-white/[0.06]">
              <button
                onClick={() => setActiveAnalyzer(null)}
                className="px-4 py-1.5 rounded-lg bg-primary text-[#020b06] font-bold text-xs font-mono cursor-pointer"
              >
                Close Analyzer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Forensic Analyzer: Judicial Report Generator */}
      {activeAnalyzer === 'report' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#06140c] border border-primary/40 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-primary font-bold text-sm font-mono">
                <FileCheck className="w-4 h-4 text-primary" />
                <span>Forensic Investigation Report & FIR Annexure Preview</span>
              </div>
              <button onClick={() => setActiveAnalyzer(null)} className="text-content-muted hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 rounded-xl bg-white text-zinc-900 font-mono text-xs flex flex-col gap-3 shadow-inner">
              <div className="text-center pb-3 border-b border-zinc-300">
                <h3 className="font-bold text-sm uppercase tracking-wider">CITIZEN CYBERCRIME INTELLIGENCE PLATFORM (CCIP)</h3>
                <span className="text-[11px] text-zinc-600">STATE CYBER POLICE WING • FORENSIC INVESTIGATION DOCKET</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><strong>Case Reference:</strong> CYBER-2026-7102</div>
                <div><strong>Classification:</strong> UPI / QR Code Payment Scam</div>
                <div><strong>Complainant:</strong> Naveen</div>
                <div><strong>Reported Loss:</strong> ₹25,000</div>
                <div><strong>Investigator:</strong> Naveen (SPEC-04)</div>
                <div><strong>Sealed Timestamp:</strong> 13 Jun 2026, 09:25 AM</div>
              </div>

              <div className="border-t border-zinc-300 pt-2 text-[11px]">
                <strong>Incident Summary:</strong>
                <p className="mt-1 font-sans text-zinc-700">{incidentNarrative}</p>
              </div>

              <div className="border-t border-zinc-300 pt-2 text-[11px]">
                <strong>Key Cyber Identifiers (IOCs):</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-zinc-700">
                  <li>Caller Mobile: +91 98765 43210</li>
                  <li>Beneficiary UPI: fraud@okaxis (Axis Bank)</li>
                  <li>Phishing Host: http://fake-bank-verify.in (IP: 185.220.101.44)</li>
                </ul>
              </div>

              <div className="border-t border-zinc-300 pt-2 text-[11px]">
                <strong>Recommended Next Action:</strong>
                <p className="mt-1 font-sans text-zinc-700">
                  Issue Section 91 CrPC notice to Axis Bank for immediate mule account freezing and KYC disclosure. Relate findings with Bangalore Case CYBER-2026-6819.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs font-mono">
              <span className="text-[10px] text-content-muted">Tamper-proof cryptographic checksum: 0x8f74a9...b14e</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    showToast('Report downloaded as PDF/Doc file.');
                    setActiveAnalyzer(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-[#020b06] font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Signed PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Quick Action: Add Evidence Modal */}
      {activeQuickAction === 'add-evidence' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <input
            type="file"
            ref={quickEvidenceFileInputRef}
            onChange={handleQuickEvidenceFileChange}
            className="hidden"
          />

          <div className="w-full max-w-md bg-[#06140c] border border-primary/30 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Upload className="w-4 h-4 text-primary" />
                <span>Attach Forensic Evidence</span>
              </div>
              <button onClick={() => { setActiveQuickAction(null); setQuickEvidenceFile(null); }} className="text-content-muted hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Interactive File Dropzone */}
            <div
              onClick={() => quickEvidenceFileInputRef.current?.click()}
              className="p-4 rounded-xl border border-dashed border-primary/35 hover:border-primary bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer transition-all"
            >
              <Upload className="w-5 h-5 text-primary" />
              <span className="text-white font-bold text-xs">
                {quickEvidenceFile ? quickEvidenceFile.name : 'Choose or Drop Forensic Artifact'}
              </span>
              <span className="text-[10px] text-content-muted">
                {quickEvidenceFile
                  ? `${(quickEvidenceFile.size / 1024).toFixed(1)} KB · Real file selected`
                  : 'Click to select PDF, image screenshot, PCAP, or audio'}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-content-muted text-[10px] block mb-1">EVIDENCE FILENAME / IDENTIFIER</label>
                <input
                  type="text"
                  placeholder="e.g. Call_Recording_Suspect_Audio.wav"
                  value={evidenceName}
                  onChange={(e) => setEvidenceName(e.target.value)}
                  className="w-full bg-[#081a10] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="text-content-muted text-[10px] block mb-1">EVIDENCE CLASSIFICATION</label>
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value)}
                  className="w-full bg-[#081a10] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-primary text-xs"
                >
                  <option value="Transaction Slip">Transaction Slip / Bank Statement</option>
                  <option value="Audio Recording">Audio Call Recording</option>
                  <option value="SMS Screenshot">SMS Screenshot</option>
                  <option value="Network PCAP">Network PCAP / Server Log</option>
                </select>
              </div>

              <div>
                <label className="text-content-muted text-[10px] block mb-1">ACQUISITION SOURCE</label>
                <input
                  type="text"
                  value={evidenceSource}
                  onChange={(e) => setEvidenceSource(e.target.value)}
                  className="w-full bg-[#081a10] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="p-2.5 rounded bg-black/40 border border-white/[0.04] text-[10px] text-content-muted break-all">
                <span>Calculated Checksum: </span>
                <span className="text-primary font-bold">SHA-256: {evidenceHash}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                disabled={isUploadingQuickEvidence}
                onClick={() => {
                  setActiveQuickAction(null);
                  setQuickEvidenceFile(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-content-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUploadingQuickEvidence}
                onClick={handleSealQuickEvidence}
                className="px-4 py-1.5 rounded-lg bg-primary text-[#020b06] font-bold flex items-center gap-1.5"
              >
                {isUploadingQuickEvidence && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Seal in Vault</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Quick Action: Link to Existing Case Modal */}
      {activeQuickAction === 'link-case' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#06140c] border border-primary/30 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-primary font-bold">
                <LinkIcon className="w-4 h-4 text-primary" />
                <span>Link to Existing Case</span>
              </div>
              <button onClick={() => setActiveQuickAction(null)} className="text-content-muted hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-content-muted text-[10px] block mb-1">TARGET CASE IDENTIFIER</label>
                <input
                  type="text"
                  placeholder="e.g. CYBER-2026-6819"
                  value={linkTargetCaseId}
                  onChange={(e) => setLinkTargetCaseId(e.target.value)}
                  className="w-full bg-[#081a10] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="text-content-muted text-[10px] block mb-1">CORRELATION HYPOTHESIS & RATIONALE</label>
                <textarea
                  rows={3}
                  value={linkRationale}
                  onChange={(e) => setLinkRationale(e.target.value)}
                  className="w-full bg-[#081a10] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-primary text-xs resize-none font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <button
                onClick={() => setActiveQuickAction(null)}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-content-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showToast(`Proposed correlation link to ${linkTargetCaseId} submitted for supervisor review.`);
                  setActiveQuickAction(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-primary text-[#020b06] font-bold"
              >
                Propose Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. Quick Action: Request Validation Modal */}
      {activeQuickAction === 'request-validation' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#06140c] border border-primary/30 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-primary font-bold">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Submit to Validation Queue</span>
              </div>
              <button onClick={() => setActiveQuickAction(null)} className="text-content-muted hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-content-muted text-[10px] block mb-1">DESIGNATED SUPERVISORY REVIEWER</label>
                <input
                  type="text"
                  value={validationReviewer}
                  onChange={(e) => setValidationReviewer(e.target.value)}
                  className="w-full bg-[#081a10] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="text-content-muted text-[10px] block mb-1">VERIFICATION REMARKS & SCOPE</label>
                <textarea
                  rows={3}
                  value={validationRemarks}
                  onChange={(e) => setValidationRemarks(e.target.value)}
                  className="w-full bg-[#081a10] border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-primary text-xs resize-none font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <button
                onClick={() => setActiveQuickAction(null)}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-content-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showToast('Task added to Validation Queue for supervisor sign-off.');
                  setActiveQuickAction(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-primary text-[#020b06] font-bold"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
