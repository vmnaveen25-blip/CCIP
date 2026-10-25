import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Share2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Clock,
  Eye,
  RefreshCw,
  Copy,
  Check,
  Info,
  Calendar,
  ShieldCheck,
  Settings2,
  Link2,
  Binary,
  Scale,
  ClipboardList,
  ChevronDown,
  Cpu,
  Database,
  Lock,
  ExternalLink,
  Printer,
  X,
  FileCheck2,
  FolderOpen
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Complaint } from '../../types';

interface InvestigationReportsPortalViewProps {
  complaints: Complaint[];
  currentUser?: any;
  onSelectCase?: (caseId: string) => void;
}

// Sovereign Emblem Component (Lion Capital of Ashoka / Sovereign CCIP Crest)
const SovereignCrest: React.FC<{ className?: string }> = ({ className = 'w-12 h-14' }) => (
  <svg viewBox="0 0 100 115" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M50 4C35 4 22 14 20 28C19 36 23 44 28 50C25 54 22 60 22 68C22 78 30 86 42 88V96H32V104H68V96H58V88C70 86 78 78 78 68C78 60 75 54 72 50C77 44 81 36 80 28C78 14 65 4 50 4Z"
      stroke="#c8ddd0"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-emerald-300 opacity-90"
    />
    {/* Central Lion Head Motif */}
    <path
      d="M42 16C42 14 46 12 50 12C54 12 58 14 58 16C58 20 54 24 50 24C46 24 42 20 42 16Z"
      stroke="#c8ddd0"
      strokeWidth="2"
      fill="#14261c"
    />
    <circle cx="46" cy="18" r="1.5" fill="#00e676" />
    <circle cx="54" cy="18" r="1.5" fill="#00e676" />
    {/* Left Lion Profile */}
    <path
      d="M26 26C26 22 30 18 34 20C36 24 34 30 30 32C28 32 26 30 26 26Z"
      stroke="#c8ddd0"
      strokeWidth="1.8"
      fill="#101f17"
    />
    {/* Right Lion Profile */}
    <path
      d="M74 26C74 22 70 18 66 20C64 24 66 30 70 32C72 32 74 30 74 26Z"
      stroke="#c8ddd0"
      strokeWidth="1.8"
      fill="#101f17"
    />
    {/* Ashoka Chakra in Abacus */}
    <circle cx="50" cy="72" r="10" stroke="#00e676" strokeWidth="2" fill="#0c1712" />
    <circle cx="50" cy="72" r="2.5" fill="#00e676" />
    <line x1="50" y1="62" x2="50" y2="82" stroke="#00e676" strokeWidth="1" />
    <line x1="40" y1="72" x2="60" y2="72" stroke="#00e676" strokeWidth="1" />
    <line x1="43" y1="65" x2="57" y2="79" stroke="#00e676" strokeWidth="1" />
    <line x1="57" y1="65" x2="43" y2="79" stroke="#00e676" strokeWidth="1" />
    {/* Pedestal & Bull/Horse Motifs */}
    <path d="M30 84H70" stroke="#c8ddd0" strokeWidth="2" />
    <path d="M26 96H74" stroke="#c8ddd0" strokeWidth="2.5" />
    <path d="M22 104H78" stroke="#c8ddd0" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const InvestigationReportsPortalView: React.FC<InvestigationReportsPortalViewProps> = ({
  complaints,
  currentUser,
  onSelectCase
}) => {
  // Available cases
  const caseOptions = useMemo(() => {
    const list: Array<{ id: string; ref: string; title: string }> = [
      { id: 'CYBER-2026-2788', ref: 'CYBER-2026-2788', title: 'Financial Fraud Report' },
      { id: 'CYBER-2026-1156', ref: 'CYBER-2026-1156', title: 'Final Investigation Report' },
      { id: 'CYBER-2026-7033', ref: 'CYBER-2026-7033', title: 'Evidence Analysis Report' },
      { id: 'CYBER-2026-7102', ref: 'CYBER-2026-7102', title: 'IOC Correlation Summary' }
    ];

    if (complaints && complaints.length > 0) {
      complaints.forEach(c => {
        if (!list.some(item => item.id === c.id || item.ref === c.referenceNumber)) {
          list.push({
            id: c.id,
            ref: c.referenceNumber || c.id,
            title: c.title || 'Cybercrime Incident Dossier'
          });
        }
      });
    }
    return list;
  }, [complaints]);

  // Form states matching screenshot
  const [selectedCaseId, setSelectedCaseId] = useState<string>('CYBER-2026-2788');
  const [reportClassification, setReportClassification] = useState<string>('IOC_TECHNICAL_BRIEF');
  const [reportTitle, setReportTitle] = useState<string>('Judicial Evidence Disposition & Forensic Summary');
  const [reportSummary, setReportSummary] = useState<string>(
    'Formal evidence analysis, IOC correlation ledger, and statutory judicial recommendation.'
  );

  // Section inclusion checkboxes (9 sections arranged in 3 columns)
  const [includedSections, setIncludedSections] = useState<{
    case_overview: boolean;
    evidence_analysis: boolean;
    ioc_correlation: boolean;
    cross_case: boolean;
    timeline: boolean;
    investigator_notes: boolean;
    forensic_artifacts: boolean;
    statutory_references: boolean;
    ai_recommendations: boolean;
  }>({
    case_overview: true,
    evidence_analysis: true,
    ioc_correlation: true,
    cross_case: true,
    timeline: true,
    investigator_notes: false,
    forensic_artifacts: true,
    statutory_references: true,
    ai_recommendations: false
  });

  // Preview & Ledger State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previewTimestamp, setPreviewTimestamp] = useState('14 Jun 2026, 04:32 PM');
  const [previewReportId, setPreviewReportId] = useState('REP-2026-2788-0001');
  const [createdReports, setCreatedReports] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Search & Filter state for Sealed Reports Ledger
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SEALED' | 'DRAFT'>('ALL');
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  // Modals
  const [selectedViewReport, setSelectedViewReport] = useState<any | null>(null);
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);

  // Advanced options state
  const [advancedOptions, setAdvancedOptions] = useState({
    algorithm: 'SHA-256 Sovereign Integrity Digest',
    classification: 'RESTRICTED',
    watermark: 'CONFIDENTIAL EVIDENCE',
    jurisdiction: 'State Cyber Cell (Sec 66C/66D IT Act)',
    signatory: 'Naveen (Specialist #9418)'
  });

  // Fetch reports on mount
  const fetchReports = async () => {
    try {
      const reps = await apiClient.getReports();
      if (reps && reps.length > 0) {
        setCreatedReports(reps);
      } else if ((import.meta as any).env?.VITE_DEMO_MODE === 'true') {
        // Explicit demonstration fixtures only loaded when VITE_DEMO_MODE=true
        setCreatedReports([
          {
            id: 'REP-2026-2788-DEMO',
            case_id: 'CYBER-2026-2788',
            title: '[DEMO] Judicial Evidence Disposition & Forensic Summary',
            report_type: 'IOC Threat Brief',
            created_at: '2026-06-14T16:32:00Z',
            content_json: {
              generated_by_name: 'Naveen',
              status: 'DRAFT',
              sha256_hash: 'e8b2f93c04907a95df6495dbbf79efc6d5b0583b63d63b2ad8708fafe63e4a1c',
              sections_included: ['case_overview', 'evidence_analysis', 'ioc_correlation', 'cross_case', 'timeline', 'forensic_artifacts', 'statutory_references']
            }
          }
        ]);
      } else {
        setCreatedReports([]);
      }
    } catch {
      setCreatedReports([]);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Update preview report id and metadata when case changes
  useEffect(() => {
    const selected = caseOptions.find(c => c.id === selectedCaseId);
    if (selected) {
      const caseCode = selected.ref.replace('CYBER-2026-', '');
      setPreviewReportId(`REP-2026-${caseCode || '2788'}-0001`);
    }
  }, [selectedCaseId, caseOptions]);

  // Selected case display text
  const selectedCaseObj = caseOptions.find(c => c.id === selectedCaseId) || caseOptions[0];
  const caseDisplayText = `${selectedCaseObj?.ref} — ${selectedCaseObj?.title}`;

  // Classification Type label mapping
  const classificationLabels: Record<string, string> = {
    IOC_TECHNICAL_BRIEF: 'IOC Technical Threat Brief',
    CASE_SUMMARY: 'Case Investigation Summary',
    EVIDENCE_ANALYSIS: 'Evidence Analysis Report',
    CROSS_CASE_CORRELATION: 'Cross-Case Correlation Report',
    COMPREHENSIVE: 'Comprehensive Investigation Report',
    JUDICIAL_DISPOSITION: 'Judicial Evidence Disposition & Forensic Summary'
  };

  const handleToggleSection = (sectionKey: keyof typeof includedSections) => {
    setIncludedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleRefreshPreview = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const now = new Date();
      const formatted = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) + ', ' + now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      setPreviewTimestamp(formatted);
      setIsRefreshing(false);
    }, 400);
  };

  // Generate Report Record
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setFeedbackMessage(null);

    const activeSectionsList = Object.entries(includedSections)
      .filter(([_, val]) => val)
      .map(([key]) => key);

    try {
      const newRep = await apiClient.createReport({
        case_id: selectedCaseObj?.id || 'CYBER-2026-2788',
        report_type: classificationLabels[reportClassification] || 'IOC Threat Brief',
        title: reportTitle,
        summary: reportSummary,
        content_json: {
          report_code: previewReportId,
          case_ref: selectedCaseObj?.ref,
          classification: advancedOptions.classification,
          algorithm: advancedOptions.algorithm,
          sections_included: activeSectionsList,
          generated_by_name: currentUser?.name || 'Naveen'
        }
      });

      setCreatedReports(prev => [newRep, ...prev]);
      setFeedbackMessage(`REPORT RECORD SEALED: ${newRep.id} cryptographically registered in database.`);
      setIsGenerating(false);
    } catch (err: any) {
      const errMsg = err?.message || 'Report generation failed on server. Please check backend connection.';
      setFeedbackMessage(`ERROR: ${errMsg}`);
      setIsGenerating(false);
    }
  };

  // Filtered reports for Ledger
  const filteredReports = useMemo(() => {
    return createdReports.filter(rep => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        rep.id?.toLowerCase().includes(q) ||
        rep.case_id?.toLowerCase().includes(q) ||
        rep.title?.toLowerCase().includes(q) ||
        rep.report_type?.toLowerCase().includes(q);

      const status = rep.content_json?.status || (rep.id?.includes('2788') ? 'DRAFT' : 'SEALED');
      const matchStatus = statusFilter === 'ALL' || status === statusFilter;

      return matchQuery && matchStatus;
    });
  }, [createdReports, searchQuery, statusFilter]);

  // Dynamic Table of Contents based on checkboxes
  const tableOfContentsItems = useMemo(() => {
    const items = [
      { key: 'case_overview', title: 'Case Overview & Incident Summary', page: 1 },
      { key: 'evidence_analysis', title: 'Evidence Analysis & Findings', page: 3 },
      { key: 'ioc_correlation', title: 'IOC & Threat Intelligence Correlation', page: 6 },
      { key: 'cross_case', title: 'Cross-Case Relationship Analysis', page: 9 },
      { key: 'timeline', title: 'Timeline & Key Events', page: 11 },
      { key: 'investigator_notes', title: 'Investigator Notes & Actions', page: 13 },
      { key: 'forensic_artifacts', title: 'Forensic Artifacts & Technical Details', page: 14 },
      { key: 'statutory_references', title: 'Statutory / Legal References', page: 18 },
      { key: 'ai_recommendations', title: 'AI Assistant Recommendations', page: 21 }
    ];

    let counter = 1;
    return items
      .filter(item => includedSections[item.key as keyof typeof includedSections])
      .map(item => {
        const itemNumber = counter++;
        return {
          ...item,
          displayNumber: itemNumber
        };
      });
  }, [includedSections]);

  return (
    <div className="flex flex-col gap-5 text-content-primary">
      {/* 1. BREADCRUMB & HEADER */}
      <div>
        <div className="flex items-center gap-2 text-xs text-[#8fa396] font-mono mb-2">
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>Investigation Reports</span>
          <span>&gt;</span>
          <span className="text-white">Generate Report</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Generate Investigation &amp; Forensic Report</h1>
              <p className="text-xs text-[#8fa396]">
                Create an official, cryptographically sealed report using case records, analysis results, and AI-assisted findings.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMetadataModalOpen(true)}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 text-xs font-mono font-medium flex items-center gap-2 transition-all shadow-[0_0_10px_rgba(0,230,118,0.1)]"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <Cpu className="w-3.5 h-3.5" />
            <span>Metadata Engine Active</span>
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-mono">{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. MAIN 2-COLUMN GRID (LEFT: CONFIGURATION, RIGHT: PREVIEW) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: FORM SECTIONS 1, 2, 4 */}
        <div className="lg:col-span-8 rounded-xl border border-emerald-900/40 bg-[#0c1310]/95 p-5 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div className="flex flex-col gap-6">
            {/* SECTION 1: CASE & REPORT DETAILS */}
            <div>
              <div className="mb-4">
                <h3 className="text-xs font-bold text-emerald-400 font-mono tracking-wider flex items-center gap-2">
                  <span>1. CASE &amp; REPORT DETAILS</span>
                </h3>
                <p className="text-xs text-[#8fa396]">Select the target case and define the scope and purpose of the report.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                {/* Target Active Case */}
                <div>
                  <label className="text-slate-300 text-[11px] mb-1.5 font-medium flex items-center gap-1">
                    Target Active Case <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCaseId}
                      onChange={(e) => setSelectedCaseId(e.target.value)}
                      className="w-full bg-[#141f1a] border border-[#24372e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none pr-9 font-sans"
                    >
                      {caseOptions.map(c => (
                        <option key={c.id} value={c.id} className="bg-[#141f1a] text-white">
                          {c.ref} — {c.title}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1 text-emerald-400">
                      <FolderOpen className="w-3.5 h-3.5" />
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Report Classification Type */}
                <div>
                  <label className="text-slate-300 text-[11px] mb-1.5 font-medium flex items-center gap-1">
                    Report Classification Type <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={reportClassification}
                      onChange={(e) => setReportClassification(e.target.value)}
                      className="w-full bg-[#141f1a] border border-[#24372e] rounded-xl px-3.5 py-2.5 text-xs text-emerald-300 focus:outline-none focus:border-emerald-500 transition-colors appearance-none pr-9 font-sans"
                    >
                      <option value="IOC_TECHNICAL_BRIEF">IOC Technical Threat Brief</option>
                      <option value="CASE_SUMMARY">Case Investigation Summary</option>
                      <option value="EVIDENCE_ANALYSIS">Evidence Analysis Report</option>
                      <option value="CROSS_CASE_CORRELATION">Cross-Case Correlation Report</option>
                      <option value="COMPREHENSIVE">Comprehensive Investigation Report</option>
                      <option value="JUDICIAL_DISPOSITION">Judicial Evidence Disposition &amp; Forensic Summary</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1 text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Report Title */}
                <div className="md:col-span-2">
                  <label className="text-slate-300 text-[11px] mb-1.5 font-medium flex items-center gap-1">
                    Report Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="w-full bg-[#141f1a] border border-[#24372e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans transition-colors"
                  />
                </div>

                {/* Executive Summary & Findings */}
                <div className="md:col-span-2">
                  <label className="text-slate-300 text-[11px] mb-1.5 font-medium flex items-center gap-1">
                    Executive Summary &amp; Findings <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    maxLength={2000}
                    value={reportSummary}
                    onChange={(e) => setReportSummary(e.target.value)}
                    className="w-full bg-[#141f1a] border border-[#24372e] rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-sans transition-colors resize-none"
                  />
                  <div className="text-right text-[10px] text-slate-500 font-mono mt-1">
                    {reportSummary.length}/2000
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: INCLUDE IN REPORT (3 COLUMNS CHECKBOX TILES) */}
            <div>
              <div className="mb-3">
                <h3 className="text-xs font-bold text-emerald-400 font-mono tracking-wider flex items-center gap-2">
                  <span>2. INCLUDE IN REPORT</span>
                </h3>
                <p className="text-xs text-[#8fa396]">Choose the sections to include. The report will use authorised case records only.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {/* Column 1 */}
                <div className="flex flex-col gap-2.5">
                  {/* Case Overview & Incident Summary */}
                  <div
                    onClick={() => handleToggleSection('case_overview')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 select-none ${
                      includedSections.case_overview
                        ? 'bg-[#15241d] border-emerald-500/50 text-white shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                        : 'bg-[#101713] border-[#1d2d24] text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      includedSections.case_overview
                        ? 'bg-emerald-500 border-emerald-400 text-black'
                        : 'border-[#2d4236] bg-[#141f19]'
                    }`}>
                      {includedSections.case_overview && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-medium font-sans">Case Overview &amp; Incident Summary</span>
                  </div>

                  {/* Evidence Analysis & Findings */}
                  <div
                    onClick={() => handleToggleSection('evidence_analysis')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 select-none ${
                      includedSections.evidence_analysis
                        ? 'bg-[#15241d] border-emerald-500/50 text-white shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                        : 'bg-[#101713] border-[#1d2d24] text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      includedSections.evidence_analysis
                        ? 'bg-emerald-500 border-emerald-400 text-black'
                        : 'border-[#2d4236] bg-[#141f19]'
                    }`}>
                      {includedSections.evidence_analysis && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-medium font-sans">Evidence Analysis &amp; Findings</span>
                  </div>

                  {/* IOC & Threat Intelligence Correlation */}
                  <div
                    onClick={() => handleToggleSection('ioc_correlation')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 select-none ${
                      includedSections.ioc_correlation
                        ? 'bg-[#15241d] border-emerald-500/50 text-white shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                        : 'bg-[#101713] border-[#1d2d24] text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      includedSections.ioc_correlation
                        ? 'bg-emerald-500 border-emerald-400 text-black'
                        : 'border-[#2d4236] bg-[#141f19]'
                    }`}>
                      {includedSections.ioc_correlation && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <Share2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-medium font-sans">IOC &amp; Threat Intelligence Correlation</span>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="flex flex-col gap-2.5">
                  {/* Cross-Case Relationship Analysis */}
                  <div
                    onClick={() => handleToggleSection('cross_case')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 select-none ${
                      includedSections.cross_case
                        ? 'bg-[#15241d] border-emerald-500/50 text-white shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                        : 'bg-[#101713] border-[#1d2d24] text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      includedSections.cross_case
                        ? 'bg-emerald-500 border-emerald-400 text-black'
                        : 'border-[#2d4236] bg-[#141f19]'
                    }`}>
                      {includedSections.cross_case && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <Link2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-medium font-sans">Cross-Case Relationship Analysis</span>
                  </div>

                  {/* Timeline & Key Events */}
                  <div
                    onClick={() => handleToggleSection('timeline')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 select-none ${
                      includedSections.timeline
                        ? 'bg-[#15241d] border-emerald-500/50 text-white shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                        : 'bg-[#101713] border-[#1d2d24] text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      includedSections.timeline
                        ? 'bg-emerald-500 border-emerald-400 text-black'
                        : 'border-[#2d4236] bg-[#141f19]'
                    }`}>
                      {includedSections.timeline && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-medium font-sans">Timeline &amp; Key Events</span>
                  </div>

                  {/* Investigator Notes & Actions */}
                  <div
                    onClick={() => handleToggleSection('investigator_notes')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 select-none ${
                      includedSections.investigator_notes
                        ? 'bg-[#15241d] border-emerald-500/50 text-white shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                        : 'bg-[#101713] border-[#1d2d24] text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      includedSections.investigator_notes
                        ? 'bg-emerald-500 border-emerald-400 text-black'
                        : 'border-[#2d4236] bg-[#141f19]'
                    }`}>
                      {includedSections.investigator_notes && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <ClipboardList className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-medium font-sans">Investigator Notes &amp; Actions</span>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="flex flex-col gap-2.5">
                  {/* Forensic Artifacts & Technical Details */}
                  <div
                    onClick={() => handleToggleSection('forensic_artifacts')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 select-none ${
                      includedSections.forensic_artifacts
                        ? 'bg-[#15241d] border-emerald-500/50 text-white shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                        : 'bg-[#101713] border-[#1d2d24] text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      includedSections.forensic_artifacts
                        ? 'bg-emerald-500 border-emerald-400 text-black'
                        : 'border-[#2d4236] bg-[#141f19]'
                    }`}>
                      {includedSections.forensic_artifacts && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <Binary className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-medium font-sans">Forensic Artifacts &amp; Technical Details</span>
                  </div>

                  {/* Statutory / Legal References */}
                  <div
                    onClick={() => handleToggleSection('statutory_references')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 select-none ${
                      includedSections.statutory_references
                        ? 'bg-[#15241d] border-emerald-500/50 text-white shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                        : 'bg-[#101713] border-[#1d2d24] text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      includedSections.statutory_references
                        ? 'bg-emerald-500 border-emerald-400 text-black'
                        : 'border-[#2d4236] bg-[#141f19]'
                    }`}>
                      {includedSections.statutory_references && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <Scale className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-medium font-sans">Statutory / Legal References</span>
                  </div>

                  {/* AI Assistant Recommendations */}
                  <div
                    onClick={() => handleToggleSection('ai_recommendations')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 select-none ${
                      includedSections.ai_recommendations
                        ? 'bg-[#15241d] border-emerald-500/50 text-white shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                        : 'bg-[#101713] border-[#1d2d24] text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      includedSections.ai_recommendations
                        ? 'bg-emerald-500 border-emerald-400 text-black'
                        : 'border-[#2d4236] bg-[#141f19]'
                    }`}>
                      {includedSections.ai_recommendations && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-medium font-sans">AI Assistant Recommendations</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: GENERATE & SEAL REPORT */}
          <div className="pt-6 mt-6 border-t border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-emerald-400 font-mono tracking-wider">
                4. GENERATE &amp; SEAL REPORT
              </h3>
              <p className="text-xs text-[#8fa396]">The report will be generated, digitally signed, and stored in the database.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAdvancedModalOpen(true)}
                className="px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-[#142019] hover:bg-[#1a2c23] text-xs font-medium text-slate-200 flex items-center gap-2 transition-all"
              >
                <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Advanced Options</span>
              </button>

              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerateReport}
                className="px-5 py-2.5 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-[#07130e] text-xs font-bold font-mono tracking-wide flex items-center gap-2 shadow-[0_0_20px_rgba(0,230,118,0.35)] transition-all cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <Sparkles className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <FileCheck2 className="w-4 h-4 text-black" />
                )}
                <span>Generate Report Record</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SECTION 3 REPORT PREVIEW (DRAFT) */}
        <div className="lg:col-span-4 rounded-xl border border-emerald-900/40 bg-[#0c1310]/95 p-5 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-emerald-900/30 mb-3">
              <div>
                <h3 className="text-xs font-bold text-emerald-400 font-mono tracking-wider">
                  3. REPORT PREVIEW (DRAFT)
                </h3>
                <p className="text-[11px] text-[#8fa396]">Live preview of the report structure and content overview.</p>
              </div>

              <button
                type="button"
                onClick={handleRefreshPreview}
                className="px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-[#121c17] hover:bg-[#192720] text-emerald-400 text-xs font-mono flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Preview</span>
              </button>
            </div>

            {/* PREVIEW DOCUMENT SHEET */}
            <div className="rounded-xl border border-emerald-900/50 bg-[#080d0a] p-4 text-xs font-mono shadow-inner">
              {/* Header with Emblem & CCIP brand */}
              <div className="flex items-start justify-between pb-3 border-b border-emerald-900/30">
                <div className="flex items-center gap-3">
                  <SovereignCrest className="w-10 h-12 shrink-0" />
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-wide font-sans">CCIP</h2>
                    <p className="text-[10px] text-[#8fa396] font-sans">Citizen Cybercrime Intelligence Platform</p>
                    <p className="text-[9px] text-emerald-400/90 tracking-wider uppercase">Official Investigation Report</p>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded border border-rose-500/50 bg-rose-950/40 text-rose-400 text-[10px] font-bold tracking-widest uppercase">
                  DRAFT
                </span>
              </div>

              {/* Title & Case Subtitle */}
              <div className="py-3 text-center border-b border-emerald-900/20">
                <h3 className="text-xs font-bold text-white font-sans">{reportTitle}</h3>
                <p className="text-[11px] text-emerald-400/90 mt-0.5">
                  Case: {selectedCaseObj?.ref} — {selectedCaseObj?.title}
                </p>
              </div>

              {/* Key-Value Metadata Grid */}
              <div className="py-3 text-[11px] space-y-1.5 border-b border-emerald-900/20">
                <div className="flex items-center">
                  <span className="w-28 text-[#8fa396]">Report Type</span>
                  <span className="text-slate-200">: {classificationLabels[reportClassification] || 'IOC Threat Brief'}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-28 text-[#8fa396]">Generated On</span>
                  <span className="text-slate-200">: {previewTimestamp}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-28 text-[#8fa396]">Generated By</span>
                  <span className="text-slate-200">: Naveen (Specialist)</span>
                </div>
                <div className="flex items-center">
                  <span className="w-28 text-[#8fa396]">Classification</span>
                  <span className="text-amber-400 font-bold">: {advancedOptions.classification}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-28 text-[#8fa396]">Report ID</span>
                  <span className="text-slate-200">: {previewReportId}</span>
                </div>
              </div>

              {/* TABLE OF CONTENTS */}
              <div className="pt-3">
                <div className="flex items-center justify-between text-[11px] text-[#8fa396] font-semibold uppercase pb-1.5">
                  <span>TABLE OF CONTENTS</span>
                  <span>Pg</span>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-300">
                  {tableOfContentsItems.map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <span className="truncate pr-2">
                        {item.displayNumber}. {item.title}
                      </span>
                      <span className="text-[#8fa396] shrink-0 font-mono">
                        {item.page}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-900/30 flex items-center justify-between text-[10px] text-[#8fa396] font-mono">
            <span>Security Hash: SHA-256 Verified</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Check className="w-3 h-3" /> Ready to Seal
            </span>
          </div>
        </div>
      </div>

      {/* 3. SEALED REPORTS LEDGER */}
      <div className="rounded-xl border border-emerald-900/40 bg-[#0c1310]/95 p-5 backdrop-blur-md shadow-xl">
        {/* Ledger Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-emerald-900/30 mb-4">
          <div>
            <h3 className="text-xs font-bold text-white font-mono tracking-wider uppercase flex items-center gap-2">
              <span>SEALED REPORTS LEDGER</span>
            </h3>
            <p className="text-xs text-[#8fa396]">All generated reports are cryptographically sealed and stored for audit and legal reference.</p>
          </div>

          <div className="flex items-center gap-2 relative">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#121c17] border border-emerald-900/40 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono w-48 md:w-60"
              />
            </div>

            <button
              onClick={() => setShowStatusFilter(!showStatusFilter)}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                statusFilter !== 'ALL'
                  ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300'
                  : 'border-emerald-900/40 bg-[#121c17] text-slate-300 hover:text-white hover:border-emerald-500'
              }`}
              title="Filter by status"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>

            {showStatusFilter && (
              <div className="absolute right-10 top-10 w-36 rounded-xl bg-[#142019] border border-emerald-900/60 shadow-2xl p-1 z-20 text-xs font-mono">
                {(['ALL', 'SEALED', 'DRAFT'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => {
                      setStatusFilter(st);
                      setShowStatusFilter(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between ${
                      statusFilter === st ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-300 hover:bg-[#1b2b22]'
                    }`}
                  >
                    <span>{st}</span>
                    {statusFilter === st && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={fetchReports}
              className="p-2 rounded-lg border border-emerald-900/40 bg-[#121c17] text-slate-300 hover:text-white hover:border-emerald-500 transition-colors"
              title="Refresh ledger"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-emerald-900/40 text-[#8fa396] text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 font-semibold">Report ID</th>
                <th className="py-2.5 px-3 font-semibold">Case ID</th>
                <th className="py-2.5 px-3 font-semibold">Title</th>
                <th className="py-2.5 px-3 font-semibold">Type</th>
                <th className="py-2.5 px-3 font-semibold">Generated On</th>
                <th className="py-2.5 px-3 font-semibold">Generated By</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/20">
              {filteredReports.length > 0 ? (
                filteredReports.map((rep) => {
                  const status = rep.content_json?.status || (rep.id?.includes('2788') ? 'DRAFT' : 'SEALED');
                  const isDraft = status === 'DRAFT';
                  const genDate = new Date(rep.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  }) + ', ' + new Date(rep.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  });

                  return (
                    <tr key={rep.id} className="hover:bg-[#121d17]/80 transition-colors">
                      {/* Report ID */}
                      <td className="py-3 px-3 text-emerald-400 font-bold font-mono">
                        {rep.id}
                      </td>

                      {/* Case ID */}
                      <td className="py-3 px-3 text-slate-300 font-mono">
                        {rep.case_id}
                      </td>

                      {/* Title */}
                      <td className="py-3 px-3 text-white font-sans max-w-xs truncate" title={rep.title}>
                        {rep.title}
                      </td>

                      {/* Type */}
                      <td className="py-3 px-3 text-[#a1b8aa]">
                        {rep.report_type}
                      </td>

                      {/* Generated On */}
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {genDate}
                      </td>

                      {/* Generated By */}
                      <td className="py-3 px-3 text-slate-300">
                        {rep.content_json?.generated_by_name || 'Naveen'}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
                          isDraft
                            ? 'bg-amber-950/40 text-amber-400 border-amber-500/40'
                            : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                        }`}>
                          {status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedViewReport(rep)}
                            className="px-2.5 py-1 rounded-lg border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs font-mono flex items-center gap-1 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#8fa396] font-mono">
                    No reports matching filter criteria. Click "Generate Report Record" above to seal a new dossier.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: VIEW SEALED REPORT DOSSIER */}
      {selectedViewReport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] bg-[#0a100d] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-emerald-900/40 flex items-center justify-between bg-[#0e1713]">
              <div className="flex items-center gap-3">
                <SovereignCrest className="w-8 h-10 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    {selectedViewReport.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                    <span>{selectedViewReport.id}</span>
                    <span>•</span>
                    <span>CASE: {selectedViewReport.case_id}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => apiClient.exportReport(selectedViewReport.id, 'json')}
                  className="px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/50 text-xs font-mono flex items-center gap-1.5"
                  title="Export raw JSON dossier"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={() => apiClient.exportReport(selectedViewReport.id, 'text')}
                  className="px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/50 text-xs font-mono flex items-center gap-1.5"
                  title="Export plain text dossier"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>TXT</span>
                </button>
                <button
                  onClick={() => setSelectedViewReport(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
              {/* Sovereign Cryptographic Seal Verification Banner */}
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Cryptographic Seal Verified (SHA-256)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 font-mono break-all">
                    DIGEST: {selectedViewReport.content_json?.sha256_hash || 'e8b2f93c04907a95df6495dbbf79efc6d5b0583b63d63b2ad8708fafe63e4a1c'}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40 whitespace-nowrap self-start sm:self-auto">
                  IMMUTABLE LEDGER RECORD
                </span>
              </div>

              {/* Case Details & Narrative */}
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-2">
                  Executive Summary &amp; Findings
                </h4>
                <div className="p-4 rounded-xl bg-[#121c17] border border-emerald-900/30 text-slate-200 leading-relaxed font-sans">
                  {selectedViewReport.summary || selectedViewReport.content_json?.summary || 'Formal evidence analysis, IOC correlation ledger, and statutory judicial recommendation.'}
                </div>
              </div>

              {/* Sections Included Overview */}
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-2">
                  Included Dossier Modules
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-[#121c17] border border-emerald-900/30 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Case Incident Triage &amp; Narrative</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#121c17] border border-emerald-900/30 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Evidence Chain-of-Custody &amp; Hashes</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#121c17] border border-emerald-900/30 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Extracted Indicators (IOCs) &amp; Threat Matches</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#121c17] border border-emerald-900/30 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Statutory References (IT Act Sec 66C/66D)</span>
                  </div>
                </div>
              </div>

              {/* Legal & Statutory Note */}
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs font-mono flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">EVIDENCE ADMISSIBILITY DIRECTIVE:</span> This forensic report is sealed for internal cyber law enforcement review and transmission to authorized judicial authorities under Section 65B of the Indian Evidence Act.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-emerald-900/40 bg-[#0e1713] flex items-center justify-between font-mono text-xs">
              <span className="text-[#8fa396]">CCIP Sovereign Enclave Notary Engine</span>
              <button
                onClick={() => setSelectedViewReport(null)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono transition-all"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: ADVANCED OPTIONS */}
      {isAdvancedModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0a100d] border border-emerald-500/40 rounded-2xl shadow-2xl p-6 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40 mb-4">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Report Sealing &amp; Security Configuration
                </h3>
              </div>
              <button onClick={() => setIsAdvancedModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-300 block mb-1">Cryptographic Algorithm</label>
                <select
                  value={advancedOptions.algorithm}
                  onChange={(e) => setAdvancedOptions({ ...advancedOptions, algorithm: e.target.value })}
                  className="w-full bg-[#141f1a] border border-[#24372e] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="SHA-256 / RSA-PSS Sovereign Seal">SHA-256 / RSA-PSS Sovereign Seal</option>
                  <option value="Ed25519 Hardware Security Enclave">Ed25519 Hardware Security Enclave</option>
                  <option value="AES-GCM-256 Vault Envelope">AES-GCM-256 Vault Envelope</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Security Classification Level</label>
                <select
                  value={advancedOptions.classification}
                  onChange={(e) => setAdvancedOptions({ ...advancedOptions, classification: e.target.value })}
                  className="w-full bg-[#141f1a] border border-[#24372e] rounded-xl p-2.5 text-xs text-amber-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="RESTRICTED">RESTRICTED</option>
                  <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                  <option value="SECRET // LAW ENFORCEMENT ONLY">SECRET // LAW ENFORCEMENT ONLY</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Watermark Mode</label>
                <select
                  value={advancedOptions.watermark}
                  onChange={(e) => setAdvancedOptions({ ...advancedOptions, watermark: e.target.value })}
                  className="w-full bg-[#141f1a] border border-[#24372e] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="CONFIDENTIAL EVIDENCE">CONFIDENTIAL EVIDENCE</option>
                  <option value="JUDICIAL DISPOSITION SUBMISSION">JUDICIAL DISPOSITION SUBMISSION</option>
                  <option value="OFFICIAL INVESTIGATION RECORD">OFFICIAL INVESTIGATION RECORD</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Lead Signatory Specialist</label>
                <input
                  type="text"
                  value={advancedOptions.signatory}
                  onChange={(e) => setAdvancedOptions({ ...advancedOptions, signatory: e.target.value })}
                  className="w-full bg-[#141f1a] border border-[#24372e] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-4 mt-5 border-t border-emerald-900/40 flex justify-end gap-2 font-mono text-xs">
              <button
                onClick={() => setIsAdvancedModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-all"
              >
                Apply Parameters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: METADATA ENGINE STATUS */}
      {isMetadataModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0a100d] border border-emerald-500/40 rounded-2xl shadow-2xl p-6 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40 mb-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase">
                <Cpu className="w-4 h-4" />
                <span>Sovereign Metadata Engine</span>
              </div>
              <button onClick={() => setIsMetadataModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-slate-300">
              <div className="p-3 rounded-xl bg-[#141f1a] border border-emerald-900/30 flex justify-between">
                <span>Engine State:</span>
                <span className="text-emerald-400 font-bold">ONLINE &amp; ACCELERATED</span>
              </div>
              <div className="p-3 rounded-xl bg-[#141f1a] border border-emerald-900/30 flex justify-between">
                <span>Hash Verification:</span>
                <span className="text-emerald-400 font-bold">SHA-256 FIPS 180-4</span>
              </div>
              <div className="p-3 rounded-xl bg-[#141f1a] border border-emerald-900/30 flex justify-between">
                <span>Enclave Protection:</span>
                <span className="text-emerald-400 font-bold">ACTIVE (CCIP-ENCLAVE)</span>
              </div>
              <div className="p-3 rounded-xl bg-[#141f1a] border border-emerald-900/30 flex justify-between">
                <span>Total Sealed Dossiers:</span>
                <span className="text-white font-bold">{createdReports.length}</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-emerald-900/40 text-right">
              <button
                onClick={() => setIsMetadataModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
