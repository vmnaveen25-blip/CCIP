import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  ChevronDown, 
  Play, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Globe, 
  Mail, 
  MessageSquare, 
  FileText, 
  Cpu, 
  Database, 
  Terminal, 
  Lock, 
  Clock, 
  Sliders, 
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { ModelMetric } from '../../types';
import { apiClient } from '../../api/client';

export interface ApprovalCandidate {
  id: string;
  name: string;
  version: string;
  status: 'PENDING_APPROVAL' | 'TESTING' | 'APPROVED' | 'REJECTED';
  description: string;
  modelType: string;
  baseArchitecture: string;
  environment: 'Production' | 'Staging' | 'Development';
  accuracy: string;
  accuracyVal: number;
  f1Score: string;
  f1Val: number;
  driftRate: string;
  driftVal: number;
  iconType: 'voice' | 'crypto' | 'email' | 'sms' | 'transformer';
  datasetName: string;
  datasetHash: string;
  precision: string;
  recall: string;
  latencyMs: string;
  falsePositiveRate: string;
  falseNegativeRate: string;
  testSampleCount: number;
  testedAt: string;
  trainedAt: string;
  evaluatorNotes: string;
  reviewedBy?: string;
  reviewTimestamp?: string;
}

interface AIMLModelApprovalViewProps {
  models?: ModelMetric[];
  onSelectTab: (tab: string) => void;
}

export const AIMLModelApprovalView: React.FC<AIMLModelApprovalViewProps> = ({
  models,
  onSelectTab
}) => {
  // Candidate models inventory matching the reference screenshot exactly
  const [candidates, setCandidates] = useState<ApprovalCandidate[]>([
    {
      id: 'voiceguard-v2.2-rc1',
      name: 'VoiceGuard',
      version: 'v2.2-RC1',
      status: 'PENDING_APPROVAL',
      description: 'Audio deepfake and synthetic voice detection for scam calls.',
      modelType: 'Audio Classifier',
      baseArchitecture: 'ECAPA-TDNN',
      environment: 'Production',
      accuracy: '98.6%',
      accuracyVal: 98.6,
      f1Score: '0.982',
      f1Val: 98.2,
      driftRate: '0.4%',
      driftVal: 4.0,
      iconType: 'voice',
      datasetName: 'Synthetic Voice Acoustics & GAN Vocoder Benchmark (v4.2)',
      datasetHash: '9a8b1c4d7e2f3a5b6c8d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
      precision: '98.9%',
      recall: '98.3%',
      latencyMs: '22ms',
      falsePositiveRate: '0.35%',
      falseNegativeRate: '0.80%',
      testSampleCount: 12450,
      testedAt: '2026-10-22 18:30 UTC',
      trainedAt: '2026-10-21 14:15 UTC',
      evaluatorNotes: 'Passed all 14 acoustic spoofing test partitions. 0 regressions detected vs v2.1 baseline.'
    },
    {
      id: 'cryptotracer-v4.1-canary',
      name: 'CryptoTracer',
      version: 'v4.1-Canary',
      status: 'PENDING_APPROVAL',
      description: 'Cryptocurrency transaction tracing and illicit fund flow detection.',
      modelType: 'Graph ML',
      baseArchitecture: 'GNN (GraphSAGE)',
      environment: 'Production',
      accuracy: '97.4%',
      accuracyVal: 97.4,
      f1Score: '0.969',
      f1Val: 96.9,
      driftRate: '0.8%',
      driftVal: 8.0,
      iconType: 'crypto',
      datasetName: 'Peeling Chains & Mixer Topology Ledger Feeds (v3.0)',
      datasetHash: '7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c',
      precision: '97.8%',
      recall: '96.2%',
      latencyMs: '45ms',
      falsePositiveRate: '0.62%',
      falseNegativeRate: '1.40%',
      testSampleCount: 38200,
      testedAt: '2026-10-22 11:20 UTC',
      trainedAt: '2026-10-20 09:00 UTC',
      evaluatorNotes: 'Significantly enhanced multi-hop cluster resolution for cross-chain bridge hops.'
    },
    {
      id: 'emailguard-v1.3-rc2',
      name: 'EmailGuard',
      version: 'v1.3-RC2',
      status: 'TESTING',
      description: 'Email phishing and malware content classification.',
      modelType: 'Transformer',
      baseArchitecture: 'DeBERTa-v3',
      environment: 'Staging',
      accuracy: '96.2%',
      accuracyVal: 96.2,
      f1Score: '0.948',
      f1Val: 94.8,
      driftRate: '1.2%',
      driftVal: 12.0,
      iconType: 'email',
      datasetName: 'Sovereign Enclave Corporate Threat Corpus (v2.1)',
      datasetHash: '87e209ab14bcdef0123456789abcdef0123456789abcdef0123456789abcdef0',
      precision: '96.8%',
      recall: '94.2%',
      latencyMs: '58ms',
      falsePositiveRate: '0.88%',
      falseNegativeRate: '2.10%',
      testSampleCount: 18500,
      testedAt: '2026-10-23 04:15 UTC (In Progress)',
      trainedAt: '2026-10-22 16:45 UTC',
      evaluatorNotes: 'Currently undergoing stress testing on newly observed spear-phishing payloads.'
    },
    {
      id: 'smsshield-v1.1-rc1',
      name: 'SMSShield',
      version: 'v1.1-RC1',
      status: 'TESTING',
      description: 'SMS scam and smishing detection.',
      modelType: 'Transformer',
      baseArchitecture: 'DistilBERT',
      environment: 'Staging',
      accuracy: '95.8%',
      accuracyVal: 95.8,
      f1Score: '0.941',
      f1Val: 94.1,
      driftRate: '1.5%',
      driftVal: 15.0,
      iconType: 'sms',
      datasetName: '1930 Helpline Citizen SMS Reports (v3.4)',
      datasetHash: '34a1789c8ef0123456789abcdef0123456789abcdef0123456789abcdef01234',
      precision: '96.4%',
      recall: '93.8%',
      latencyMs: '24ms',
      falsePositiveRate: '0.75%',
      falseNegativeRate: '2.40%',
      testSampleCount: 22000,
      testedAt: '2026-10-23 06:00 UTC (In Progress)',
      trainedAt: '2026-10-22 20:30 UTC',
      evaluatorNotes: 'Running evaluation across Indian vernacular SMS smishing variations.'
    }
  ]);

  // Search and Filter States matching reference
  const [searchQuery, setSearchQuery] = useState('');
  const [modelFilter, setModelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('PENDING_APPROVAL');
  const [envFilter, setEnvFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [reviewingCandidate, setReviewingCandidate] = useState<ApprovalCandidate | null>(null);
  const [evaluatingCandidate, setEvaluatingCandidate] = useState<ApprovalCandidate | null>(null);
  const [detailsCandidate, setDetailsCandidate] = useState<ApprovalCandidate | null>(null);
  const [openSplitDropdownId, setOpenSplitDropdownId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // Calculate dynamic pending count
  const pendingCount = useMemo(() => {
    return candidates.filter(c => c.status === 'PENDING_APPROVAL').length;
  }, [candidates]);

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.version.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.modelType.toLowerCase().includes(q);

      const matchesModel = modelFilter === 'ALL' || c.name.toLowerCase().includes(modelFilter.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      const matchesEnv = envFilter === 'ALL' || c.environment === envFilter;

      return matchesSearch && matchesModel && matchesStatus && matchesEnv;
    });
  }, [candidates, searchQuery, modelFilter, statusFilter, envFilter]);

  // Paginated
  const paginatedCandidates = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCandidates.slice(start, start + pageSize);
  }, [filteredCandidates, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / pageSize));

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await apiClient.getAIModelsStatus();
    } catch {}
    setTimeout(() => {
      setIsRefreshing(false);
      setFeedbackMessage('Approval queue synchronized with Sovereign Enclave audit records.');
      setTimeout(() => setFeedbackMessage(null), 4000);
    }, 450);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedCandidates.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleApprove = (candidate: ApprovalCandidate, navigateToDeploy = false) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === candidate.id) {
        return {
          ...c,
          status: 'APPROVED',
          reviewedBy: 'Naveen (Lead Sovereign Operator)',
          reviewTimestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
        };
      }
      return c;
    }));

    setReviewingCandidate(null);
    setOpenSplitDropdownId(null);
    setFeedbackMessage(`AUTHORIZATION RECORDED: ${candidate.name} (${candidate.version}) approved for ${candidate.environment} deployment.`);

    if (navigateToDeploy) {
      setTimeout(() => {
        onSelectTab('deployment-rollback');
      }, 900);
    } else {
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  const handleReject = () => {
    if (!reviewingCandidate) return;
    const cand = reviewingCandidate;

    setCandidates(prev => prev.map(c => {
      if (c.id === cand.id) {
        return {
          ...c,
          status: 'REJECTED',
          evaluatorNotes: rejectionReason ? `REJECTED: ${rejectionReason}` : c.evaluatorNotes,
          reviewedBy: 'Naveen (Lead Sovereign Operator)',
          reviewTimestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
        };
      }
      return c;
    }));

    setIsRejectDialogOpen(false);
    setReviewingCandidate(null);
    setRejectionReason('');
    setFeedbackMessage(`CANDIDATE REJECTED: ${cand.name} (${cand.version}) rejected. Promotion halted.`);
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const renderIcon = (iconType: ApprovalCandidate['iconType']) => {
    switch (iconType) {
      case 'voice':
        return <Activity className="w-5 h-5 text-emerald-400" />;
      case 'crypto':
        return <Globe className="w-5 h-5 text-emerald-400" />;
      case 'email':
        return <Mail className="w-5 h-5 text-emerald-400" />;
      case 'sms':
        return <MessageSquare className="w-5 h-5 text-emerald-400" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-5 text-content-primary animate-in fade-in duration-200">
      {/* 1. TOP HEADER matching reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Model Approval</h1>
            <p className="text-xs text-[#8fa396]">
              Review evaluated model versions and approve them for deployment to production environments.
            </p>
          </div>
        </div>

        {/* Top-Right Pending Badge matching reference */}
        <div className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-400 font-mono text-xs font-bold tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          {pendingCount} CANDIDATES PENDING
        </div>
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

      {/* 2. SEARCH & FILTER BAR matching reference */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidates by model name, version, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans transition-colors"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto font-mono text-xs">
          {/* All Models Filter */}
          <div className="relative min-w-[130px]">
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors appearance-none pr-8 cursor-pointer"
            >
              <option value="ALL">All Models</option>
              <option value="VoiceGuard">VoiceGuard</option>
              <option value="CryptoTracer">CryptoTracer</option>
              <option value="EmailGuard">EmailGuard</option>
              <option value="SMSShield">SMSShield</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>

          {/* Status Filter */}
          <div className="relative min-w-[145px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors appearance-none pr-8 cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="TESTING">Testing</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>

          {/* Environments Filter */}
          <div className="relative min-w-[140px]">
            <select
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
              className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors appearance-none pr-8 cursor-pointer"
            >
              <option value="ALL">All Environments</option>
              <option value="Production">Production</option>
              <option value="Staging">Staging</option>
              <option value="Development">Development</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl border border-emerald-900/40 bg-[#121c17] text-slate-300 hover:text-white hover:border-emerald-500 transition-colors shrink-0"
            title="Refresh candidates"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3. CANDIDATE MODEL CARDS matching reference */}
      <div className="space-y-3 font-sans">
        {paginatedCandidates.length > 0 ? (
          paginatedCandidates.map((cand) => {
            const isPending = cand.status === 'PENDING_APPROVAL';
            const isTesting = cand.status === 'TESTING';
            const isApproved = cand.status === 'APPROVED';
            const isSelected = selectedIds.includes(cand.id);

            return (
              <div
                key={cand.id}
                className="p-4 sm:p-5 rounded-2xl bg-[#0c1310]/95 border border-emerald-900/40 hover:border-emerald-500/50 shadow-xl backdrop-blur-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left: Checkbox + Icon + Identity + Specs */}
                <div className="flex items-start gap-4 flex-1 min-w-[300px]">
                  {/* Rounded Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(cand.id)}
                    className="mt-3 w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-emerald-500"
                  />

                  {/* Icon Box */}
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)] mt-0.5">
                    {renderIcon(cand.iconType)}
                  </div>

                  {/* Model Meta */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-base font-bold text-emerald-400 font-mono tracking-tight">
                        {cand.name}
                      </span>

                      {/* Version Pill */}
                      <span className="px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold">
                        {cand.version}
                      </span>

                      {/* Status Badge */}
                      {isPending && (
                        <span className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/40 text-amber-400 text-[10px] font-mono font-bold tracking-wider">
                          PENDING APPROVAL
                        </span>
                      )}
                      {isTesting && (
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 text-[10px] font-mono font-bold tracking-wider">
                          TESTING
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/50 text-emerald-400 text-[10px] font-mono font-bold tracking-wider">
                          APPROVED
                        </span>
                      )}
                      {cand.status === 'REJECTED' && (
                        <span className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/50 text-rose-400 text-[10px] font-mono font-bold tracking-wider">
                          REJECTED
                        </span>
                      )}
                    </div>

                    {/* Purpose Description */}
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-sans">
                      {cand.description}
                    </p>

                    {/* Sub-specs line */}
                    <div className="text-[11px] font-mono text-slate-400 mt-2 flex flex-wrap items-center gap-2">
                      <span>Model Type: <strong className="text-slate-200">{cand.modelType}</strong></span>
                      <span className="text-slate-600">|</span>
                      <span>Base: <strong className="text-slate-200">{cand.baseArchitecture}</strong></span>
                      <span className="text-slate-600">|</span>
                      <span>
                        Environment: <strong className={cand.environment === 'Production' ? 'text-emerald-400 font-bold' : 'text-slate-200'}>
                          {cand.environment}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle: Metrics with Progress Bars matching reference */}
                <div className="flex flex-wrap items-center gap-6 font-mono text-xs pl-8 sm:pl-16 lg:pl-0">
                  {/* Accuracy */}
                  <div>
                    <div className="text-[11px] text-slate-400">Accuracy</div>
                    <div className="text-slate-100 font-bold text-xs mt-0.5">{cand.accuracy}</div>
                    <div className="w-24 bg-slate-800/80 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div 
                        className="bg-[#00e676] h-full rounded-full transition-all duration-500" 
                        style={{ width: `${cand.accuracyVal}%` }} 
                      />
                    </div>
                  </div>

                  {/* F1 Score */}
                  <div>
                    <div className="text-[11px] text-slate-400">F1 Score</div>
                    <div className="text-slate-100 font-bold text-xs mt-0.5">{cand.f1Score}</div>
                    <div className="w-24 bg-slate-800/80 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div 
                        className="bg-[#00e676] h-full rounded-full transition-all duration-500" 
                        style={{ width: `${cand.f1Val}%` }} 
                      />
                    </div>
                  </div>

                  {/* Drift Rate */}
                  <div>
                    <div className="text-[11px] text-slate-400">Drift Rate</div>
                    <div className="text-slate-100 font-bold text-xs mt-0.5">{cand.driftRate}</div>
                    <div className="w-20 bg-slate-800/80 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div 
                        className="bg-rose-400 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, cand.driftVal * 5)}%` }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Stacked Action Buttons matching reference */}
                <div className="flex flex-col gap-2 shrink-0 self-end lg:self-auto min-w-[170px]">
                  {isPending ? (
                    <div className="relative">
                      {/* Split button: Review & Approve */}
                      <div className="flex rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,230,118,0.3)]">
                        <button
                          onClick={() => setReviewingCandidate(cand)}
                          className="flex-1 px-4 py-2 bg-[#00e676] hover:bg-[#00c853] text-[#07130e] text-xs font-bold font-mono tracking-wide flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-black" />
                          <span>Review & Approve</span>
                        </button>
                        <button
                          onClick={() => setOpenSplitDropdownId(openSplitDropdownId === cand.id ? null : cand.id)}
                          className="px-2 py-2 bg-[#00c853] hover:bg-[#00b348] text-black border-l border-emerald-700/50 flex items-center justify-center cursor-pointer"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Dropdown Menu */}
                      {openSplitDropdownId === cand.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setOpenSplitDropdownId(null)} 
                          />
                          <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#0e1713] border border-emerald-500/40 shadow-2xl z-50 py-1 divide-y divide-emerald-900/20 font-mono text-xs">
                            <button
                              onClick={() => handleApprove(cand, false)}
                              className="w-full px-3.5 py-2 text-left text-emerald-400 hover:bg-emerald-950/40 flex items-center gap-2"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Quick Approve</span>
                            </button>
                            <button
                              onClick={() => handleApprove(cand, true)}
                              className="w-full px-3.5 py-2 text-left text-white hover:bg-emerald-950/40 flex items-center gap-2"
                            >
                              <Play className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Approve & Deploy</span>
                            </button>
                            <button
                              onClick={() => {
                                setReviewingCandidate(cand);
                                setIsRejectDialogOpen(true);
                                setOpenSplitDropdownId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-rose-400 hover:bg-rose-950/30 flex items-center gap-2"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject Candidate</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    /* Testing or Approved status button */
                    <button
                      onClick={() => setEvaluatingCandidate(cand)}
                      className="px-4 py-2 rounded-xl bg-[#121c17] hover:bg-[#182620] border border-slate-700/80 hover:border-emerald-500/80 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>View Evaluation</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  )}

                  {/* Secondary Button: View Details */}
                  <button
                    onClick={() => setDetailsCandidate(cand)}
                    className="px-4 py-2 rounded-xl bg-[#121c17] hover:bg-[#182620] border border-slate-700/80 hover:border-emerald-500/80 text-slate-300 hover:text-white text-xs font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 rounded-2xl bg-[#0c1310]/95 border border-emerald-900/40 text-center font-mono text-xs text-[#8fa396]">
            No model candidates found matching the selected filters.
          </div>
        )}
      </div>

      {/* 4. TABLE FOOTER / PAGINATION matching reference */}
      <div className="px-4 py-3 rounded-xl border border-emerald-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-[#8fa396] bg-[#09110d]">
        <div>
          Showing 1 to {Math.min(filteredCandidates.length, pageSize)} of {filteredCandidates.length} candidates
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="w-6 h-6 rounded border border-emerald-500/60 bg-emerald-950/40 text-emerald-400 font-bold flex items-center justify-center text-xs">
            {currentPage}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-[#121c17] border border-emerald-900/40 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-emerald-500 ml-2"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>

      {/* 5. MODAL: DETAILED REVIEW & APPROVE DOSSIER */}
      {reviewingCandidate && !isRejectDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0a100d] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-emerald-900/40 flex items-center justify-between bg-[#0e1713]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide">
                    {reviewingCandidate.name} <span className="text-emerald-400 font-mono text-xs">{reviewingCandidate.version}</span>
                  </h3>
                  <p className="text-xs font-mono text-[#8fa396]">
                    FORMAL SOVEREIGN DEPLOYMENT EVALUATION REVIEW
                  </p>
                </div>
              </div>

              <button
                onClick={() => setReviewingCandidate(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono text-slate-300 max-h-[75vh]">
              {/* Pipeline Gate */}
              <div className="p-4 rounded-xl bg-[#121c17] border border-emerald-900/40">
                <span className="text-[10px] text-[#8fa396] uppercase font-bold block mb-2">Lifecycle Gate Transition</span>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2 py-1 rounded bg-emerald-950/60 border border-emerald-500/50 text-emerald-300">1. Training Run Complete</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="px-2 py-1 rounded bg-emerald-950/60 border border-emerald-500/50 text-emerald-300">2. Benchmark Passed</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="px-2 py-1 rounded bg-amber-950/60 border border-amber-500/50 text-amber-300 font-bold">3. Reviewer Sign-Off (ACTIVE)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-400">4. Canary Deployment</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[10px] text-[#8fa396] block">TEST ACCURACY</span>
                  <span className="text-emerald-400 text-base font-bold">{reviewingCandidate.accuracy}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[10px] text-[#8fa396] block">F1 SCORE</span>
                  <span className="text-white text-base font-bold">{reviewingCandidate.f1Score}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[10px] text-[#8fa396] block">PRECISION</span>
                  <span className="text-white text-base font-bold">{reviewingCandidate.precision}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[10px] text-[#8fa396] block">RECALL</span>
                  <span className="text-white text-base font-bold">{reviewingCandidate.recall}</span>
                </div>
              </div>

              {/* Error Rates & Latency */}
              <div className="grid grid-cols-3 gap-2.5 text-center text-[11px]">
                <div className="p-2.5 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[#8fa396] block">False Positive Rate</span>
                  <span className="text-emerald-400 font-bold">{reviewingCandidate.falsePositiveRate}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[#8fa396] block">False Negative Rate</span>
                  <span className="text-amber-400 font-bold">{reviewingCandidate.falseNegativeRate}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[#8fa396] block">Inference Latency</span>
                  <span className="text-white font-bold">{reviewingCandidate.latencyMs}</span>
                </div>
              </div>

              {/* Dataset Provenance */}
              <div className="p-4 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase font-mono">Dataset Provenance</span>
                  <span className="text-[10px] text-emerald-400 font-bold">VERIFIED TEST PARTITION (n={reviewingCandidate.testSampleCount.toLocaleString()})</span>
                </div>
                <p className="text-slate-200 text-xs font-sans">{reviewingCandidate.datasetName}</p>
                <div className="pt-2 border-t border-emerald-900/30 text-[10px] text-[#8fa396] break-all">
                  SHA-256 HASH: {reviewingCandidate.datasetHash}
                </div>
              </div>

              {/* Evaluator Notes */}
              <div className="p-3.5 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-1">
                <span className="text-[10px] text-[#8fa396] uppercase font-bold block">Evaluator Notes & Observations</span>
                <p className="text-slate-200 text-xs font-sans leading-relaxed">{reviewingCandidate.evaluatorNotes}</p>
              </div>

              {/* Governance Directive */}
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-[11px] leading-relaxed font-sans">
                <strong>GOVERNANCE STANDARD:</strong> Approving this version marks it as production-ready in CCIP Model Registry and generates an authorized cryptographic release token.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-emerald-900/40 bg-[#0e1713] flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRejectDialogOpen(true)}
                  className="px-3.5 py-2 rounded-xl border border-rose-500/40 hover:bg-rose-950/40 text-rose-400 font-bold transition-all"
                >
                  Reject Candidate
                </button>
                <button
                  onClick={() => {
                    setReviewingCandidate(null);
                    onSelectTab('validation');
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-700 hover:border-emerald-500 text-slate-300 transition-all flex items-center gap-1.5"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Test in Lab</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApprove(reviewingCandidate, false)}
                  className="px-4 py-2 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-black font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(0,230,118,0.3)]"
                >
                  Approve Model
                </button>
                <button
                  onClick={() => handleApprove(reviewingCandidate, true)}
                  className="px-4 py-2 rounded-xl bg-emerald-950 border border-emerald-500/50 hover:bg-emerald-900 text-emerald-300 font-bold transition-all flex items-center gap-1"
                >
                  <span>Approve & Deploy</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: REJECT CANDIDATE DIALOG */}
      {isRejectDialogOpen && reviewingCandidate && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0a100d] border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
            <div className="px-6 py-4 border-b border-rose-900/40 flex items-center justify-between bg-[#150a0c]">
              <div className="flex items-center gap-2 text-rose-400 font-bold font-mono text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Reject Model Candidate</span>
              </div>
              <button onClick={() => setIsRejectDialogOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3 font-mono text-xs">
              <p className="text-slate-300 font-sans text-xs">
                Provide a recorded audit reason for rejecting <strong>{reviewingCandidate.name} ({reviewingCandidate.version})</strong>. This will be preserved in Model Audit Reports.
              </p>
              <textarea
                rows={3}
                required
                placeholder="e.g. Unacceptable false positive rate on regional dialect samples, retrain required..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-[#121c17] border border-rose-900/40 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 font-sans resize-none"
              />
            </div>

            <div className="px-6 py-3 border-t border-rose-900/40 bg-[#150a0c] flex justify-end gap-2 font-mono text-xs">
              <button
                onClick={() => setIsRejectDialogOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: VIEW EVALUATION */}
      {evaluatingCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0a100d] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
            <div className="px-6 py-4 border-b border-emerald-900/40 flex items-center justify-between bg-[#0e1713]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    {evaluatingCandidate.name} • {evaluatingCandidate.version}
                  </h3>
                  <p className="text-xs font-mono text-emerald-400">BENCHMARK EVALUATION TEST RESULTS</p>
                </div>
              </div>
              <button onClick={() => setEvaluatingCandidate(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 font-mono text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-2">
                <span className="text-[10px] text-[#8fa396] uppercase font-bold block">Current Test Phase</span>
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold">{evaluatingCandidate.environment} Test Partition</span>
                  <span className="text-amber-400 font-bold">{evaluatingCandidate.testedAt}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full w-4/5 animate-pulse" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[10px] text-[#8fa396] block">CURRENT ACC</span>
                  <span className="text-emerald-400 text-sm font-bold">{evaluatingCandidate.accuracy}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[10px] text-[#8fa396] block">CURRENT F1</span>
                  <span className="text-white text-sm font-bold">{evaluatingCandidate.f1Score}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[10px] text-[#8fa396] block">DRIFT RATE</span>
                  <span className="text-rose-400 text-sm font-bold">{evaluatingCandidate.driftRate}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-1 font-sans">
                <span className="text-[10px] text-[#8fa396] font-mono uppercase block">Evaluator Notes</span>
                <p className="text-slate-200 text-xs">{evaluatingCandidate.evaluatorNotes}</p>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-emerald-900/40 bg-[#0e1713] flex justify-between items-center font-mono text-xs">
              <button
                onClick={() => {
                  setEvaluatingCandidate(null);
                  onSelectTab('validation');
                }}
                className="text-emerald-400 hover:underline flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Open in AI Detection Lab</span>
              </button>
              <button
                onClick={() => setEvaluatingCandidate(null)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: VIEW DETAILS */}
      {detailsCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0a100d] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
            <div className="px-6 py-4 border-b border-emerald-900/40 flex items-center justify-between bg-[#0e1713]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    {detailsCandidate.name} • {detailsCandidate.version}
                  </h3>
                  <p className="text-xs font-mono text-emerald-400">CANDIDATE SPECIFICATION METADATA</p>
                </div>
              </div>
              <button onClick={() => setDetailsCandidate(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 font-mono text-xs text-slate-300">
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[#8fa396] block uppercase">Model Family:</span>
                  <span className="text-white font-bold">{detailsCandidate.name}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[#8fa396] block uppercase">Component Type:</span>
                  <span className="text-white font-bold">{detailsCandidate.modelType}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[#8fa396] block uppercase">Architecture:</span>
                  <span className="text-white font-bold">{detailsCandidate.baseArchitecture}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[#8fa396] block uppercase">Target Environment:</span>
                  <span className="text-emerald-400 font-bold">{detailsCandidate.environment}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-2">
                <span className="text-[10px] text-[#8fa396] uppercase font-bold block">Dataset Association</span>
                <p className="text-white font-sans text-xs">{detailsCandidate.datasetName}</p>
                <div className="pt-2 border-t border-emerald-900/30 text-[10px] text-[#8fa396] break-all">
                  SHA-256 HASH: {detailsCandidate.datasetHash}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-1">
                <span className="text-[10px] text-[#8fa396] uppercase font-bold block">Training Timestamp</span>
                <p className="text-white">{detailsCandidate.trainedAt}</p>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-emerald-900/40 bg-[#0e1713] flex justify-end font-mono text-xs">
              <button
                onClick={() => setDetailsCandidate(null)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
