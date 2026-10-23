import React, { useState } from 'react';
import { 
  Sparkles, 
  Play, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Database, 
  Globe, 
  Mail, 
  MessageSquare, 
  Share2, 
  Sliders, 
  Settings, 
  BarChart3, 
  ShieldCheck, 
  Scale, 
  TrendingUp, 
  Layers, 
  Info, 
  ExternalLink, 
  X, 
  Check, 
  AlertTriangle,
  RefreshCw,
  FlaskConical,
  Lock,
  ArrowRight
} from 'lucide-react';
import { ModelMetric } from '../../types';

export interface ValidatedSample {
  id: string;
  sourceText: string;
  sourceType: 'url' | 'email' | 'sms' | 'complaint' | 'case-pair';
  inputType: 'URL' | 'Email' | 'SMS' | 'Complaint' | 'Case Pair';
  humanLabel: string;
  humanLabelType: 'phishing' | 'legitimate' | 'scam' | 'fraud' | 'related';
  status: 'Eligible' | 'Pending' | 'Under Review';
  addedOn: string;
  caseId: string;
  investigatorNotes?: string;
  reviewerId: string;
}

interface AIMLContinualLearningViewProps {
  onSelectTab: (tab: string) => void;
  models?: ModelMetric[];
}

export const AIMLContinualLearningView: React.FC<AIMLContinualLearningViewProps> = ({
  onSelectTab
}) => {
  // Sample records matching the reference screenshot exactly
  const [samples, setSamples] = useState<ValidatedSample[]>([
    {
      id: 'sample-1',
      sourceText: 'hxxps://example-secure.com',
      sourceType: 'url',
      inputType: 'URL',
      humanLabel: 'Phishing',
      humanLabelType: 'phishing',
      status: 'Eligible',
      addedOn: '12 Mar 2025, 14:32',
      caseId: 'CASE-2025-0012',
      investigatorNotes: 'Fake online banking portal confirmed by forensic analyst. Credential harvesting script active.',
      reviewerId: 'Analyst-01'
    },
    {
      id: 'sample-2',
      sourceText: 'Suspicious email sample',
      sourceType: 'email',
      inputType: 'Email',
      humanLabel: 'Legitimate',
      humanLabelType: 'legitimate',
      status: 'Pending',
      addedOn: '12 Mar 2025, 11:08',
      caseId: 'CASE-2025-0008',
      investigatorNotes: 'Automated invoice notification from verified vendor. Header spoofing was negative.',
      reviewerId: 'Analyst-03'
    },
    {
      id: 'sample-3',
      sourceText: '"Free gift" SMS text',
      sourceType: 'sms',
      inputType: 'SMS',
      humanLabel: 'Scam',
      humanLabelType: 'scam',
      status: 'Eligible',
      addedOn: '11 Mar 2025, 17:20',
      caseId: 'CASE-2025-0005',
      investigatorNotes: 'Lottery lure with embedded shortened redirect link leading to fake APK download.',
      reviewerId: 'Analyst-01'
    },
    {
      id: 'sample-4',
      sourceText: 'Complaint narrative',
      sourceType: 'complaint',
      inputType: 'Complaint',
      humanLabel: 'Fraud',
      humanLabelType: 'fraud',
      status: 'Under Review',
      addedOn: '11 Mar 2025, 09:12',
      caseId: 'CASE-2025-0004',
      investigatorNotes: 'Digital arrest impersonation complaint narrative. Multi-jurisdictional triage verification underway.',
      reviewerId: 'Analyst-02'
    },
    {
      id: 'sample-5',
      sourceText: 'Similar case pair',
      sourceType: 'case-pair',
      inputType: 'Case Pair',
      humanLabel: 'Related',
      humanLabelType: 'related',
      status: 'Eligible',
      addedOn: '10 Mar 2025, 16:45',
      caseId: 'CASE-2025-0001',
      investigatorNotes: 'Coinciding mule account numbers and cryptocurrency transaction hashes establish high similarity link.',
      reviewerId: 'Analyst-01'
    }
  ]);

  // Selected checkboxes
  const [selectedSampleIds, setSelectedSampleIds] = useState<string[]>([]);

  // Training Queue Settings State
  const [targetBufferSize, setTargetBufferSize] = useState<number>(200);
  const [autoScheduleFineTuning, setAutoScheduleFineTuning] = useState<boolean>(true);
  const [requireMultiReviewer, setRequireMultiReviewer] = useState<boolean>(true);

  // Run Fine-Tuning Job Modal state
  const [isJobModalOpen, setIsJobModalOpen] = useState<boolean>(false);
  const [isJobRunning, setIsJobRunning] = useState<boolean>(false);
  const [jobProgressStage, setJobProgressStage] = useState<string>('');
  const [jobCompletedCandidate, setJobCompletedCandidate] = useState<string | null>(null);

  // View All Samples Modal state
  const [isViewAllOpen, setIsViewAllOpen] = useState<boolean>(false);

  // Case Preview Modal state
  const [activeCaseModal, setActiveCaseModal] = useState<ValidatedSample | null>(null);

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedSampleIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Toggle select all
  const handleToggleSelectAll = () => {
    if (selectedSampleIds.length === samples.length) {
      setSelectedSampleIds([]);
    } else {
      setSelectedSampleIds(samples.map(s => s.id));
    }
  };

  // Source Icon Renderer
  const renderSourceIcon = (sourceType: ValidatedSample['sourceType']) => {
    switch (sourceType) {
      case 'url':
        return <Globe className="w-4 h-4 text-slate-300" />;
      case 'email':
        return <Mail className="w-4 h-4 text-slate-300" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4 text-slate-300" />;
      case 'complaint':
        return <FileText className="w-4 h-4 text-slate-300" />;
      case 'case-pair':
        return <Share2 className="w-4 h-4 text-slate-300" />;
      default:
        return <Globe className="w-4 h-4 text-slate-300" />;
    }
  };

  // Human Label Badge Renderer
  const renderHumanLabelBadge = (sample: ValidatedSample) => {
    switch (sample.humanLabelType) {
      case 'phishing':
      case 'scam':
      case 'fraud':
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#ff3b30]/15 border border-[#ff3b30]/35 text-[#ff453a]">
            {sample.humanLabel}
          </span>
        );
      case 'legitimate':
      case 'related':
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#00e676]/15 border border-[#00e676]/35 text-[#00e676]">
            {sample.humanLabel}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-white/[0.08] text-slate-300 border border-white/[0.1]">
            {sample.humanLabel}
          </span>
        );
    }
  };

  // Status Badge Renderer
  const renderStatusBadge = (status: ValidatedSample['status']) => {
    switch (status) {
      case 'Eligible':
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#00e676]/15 border border-[#00e676]/35 text-[#00e676]">
            Eligible
          </span>
        );
      case 'Pending':
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/15 border border-amber-500/35 text-amber-400">
            Pending
          </span>
        );
      case 'Under Review':
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-sky-500/15 border border-sky-500/35 text-sky-400">
            Under Review
          </span>
        );
      default:
        return null;
    }
  };

  // Run Fine-Tuning Job Execution
  const handleExecuteFineTuning = () => {
    setIsJobRunning(true);
    setJobCompletedCandidate(null);
    setJobProgressStage('Validating 62 eligible human-verified labels...');

    setTimeout(() => {
      setJobProgressStage('Preparing calibrated fine-tuning dataset with privacy masks...');
    }, 1000);

    setTimeout(() => {
      setJobProgressStage('Training candidate model (URL Phishing Detector v1.0.8-candidate)...');
    }, 2200);

    setTimeout(() => {
      setJobProgressStage('Running automated regression tests against evaluation baseline...');
    }, 3400);

    setTimeout(() => {
      setIsJobRunning(false);
      setJobProgressStage('Job Completed Successfully!');
      setJobCompletedCandidate('URL Phishing Detector v1.0.8-RC1');
    }, 4500);
  };

  return (
    <div className="flex flex-col gap-5 w-full text-slate-200">
      
      {/* 1. TOP HEADER & MAIN ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00e676]/10 border border-[#00e676]/25 flex items-center justify-center text-[#00e676] shrink-0 mt-0.5 shadow-[0_0_14px_rgba(0,230,118,0.2)]">
            <Sparkles className="w-5 h-5 text-[#00e676]" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold text-white tracking-normal font-sans">
              Continual Learning
            </h1>
            <p className="text-xs text-[#8fa396] mt-0.5">
              Manage human-validated outcomes and queue them for safe, controlled fine-tuning.
            </p>
          </div>
        </div>

        {/* Right side status badge and primary CTA */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00e676]/10 border border-[#00e676]/30 text-[#00e676] text-xs font-mono font-bold tracking-wider shadow-[0_0_12px_rgba(0,230,118,0.15)]">
            <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
            <span>BUFFER READY</span>
          </div>

          <button
            onClick={() => setIsJobModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-[#00e676] hover:bg-[#00e676]/90 text-black font-bold text-xs font-mono transition-all flex items-center gap-2 shadow-[0_0_18px_rgba(0,230,118,0.35)]"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>Run Fine-Tuning Job</span>
          </button>
        </div>
      </div>

      {/* 2. FOUR SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Pending Samples */}
        <div className="rounded-xl border border-white/[0.08] bg-[#070d0a]/90 p-4.5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#8fa396] font-medium">Pending Samples</div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight mt-0.5">
              120
            </div>
            <div className="text-[11px] text-[#6b8273] mt-0.5">
              Awaiting eligibility checks
            </div>
          </div>
        </div>

        {/* Card 2: Eligible for Training */}
        <div className="rounded-xl border border-white/[0.08] bg-[#070d0a]/90 p-4.5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#00e676]/10 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0 shadow-[0_0_12px_rgba(0,230,118,0.15)]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#8fa396] font-medium">Eligible for Training</div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight mt-0.5">
              62
            </div>
            <div className="text-[11px] text-[#6b8273] mt-0.5">
              Passed validation rules
            </div>
          </div>
        </div>

        {/* Card 3: In Queue */}
        <div className="rounded-xl border border-white/[0.08] bg-[#070d0a]/90 p-4.5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#8fa396] font-medium">In Queue</div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight mt-0.5">
              0
            </div>
            <div className="text-[11px] text-[#6b8273] mt-0.5">
              Scheduled for next cycle
            </div>
          </div>
        </div>

        {/* Card 4: Last Training Run */}
        <div className="rounded-xl border border-white/[0.08] bg-[#070d0a]/90 p-4.5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-[#8fa396] font-medium">Last Training Run</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-bold text-white font-mono">12 Mar 2025</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.06] border border-white/[0.1] text-slate-300">
                v1.0.6
              </span>
            </div>
            <div className="text-[11px] text-[#6b8273] mt-0.5">
              Completed successfully
            </div>
          </div>
        </div>

      </div>

      {/* 3. MAIN SECTION: RECENT VALIDATED SAMPLES TABLE */}
      <div className="rounded-xl border border-white/[0.08] bg-[#070d0a]/90 p-5 shadow-2xl flex flex-col gap-4">
        
        {/* Table Header Row */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-start gap-3">
            <FileText className="w-4 h-4 text-[#00e676] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xs md:text-sm font-bold text-white tracking-normal font-sans">
                Recent Validated Samples
              </h2>
              <p className="text-[11px] text-[#8fa396] mt-0.5 font-sans">
                Latest human-validated outcomes collected from investigations
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsViewAllOpen(true)}
            className="px-3 py-1 rounded-lg border border-white/[0.1] bg-[#0c1611]/80 hover:bg-white/[0.06] hover:border-[#00e676]/40 text-slate-300 text-xs font-mono font-medium transition-all flex items-center gap-1.5"
          >
            <span>View All</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#00e676]" />
          </button>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-wider text-[#8fa396]">
                <th className="py-2.5 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedSampleIds.length === samples.length && samples.length > 0}
                    onChange={handleToggleSelectAll}
                    className="rounded bg-[#040806] border-white/[0.2] text-[#00e676] focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3">Source</th>
                <th className="py-2.5 px-3">Input Type</th>
                <th className="py-2.5 px-3">Human Label</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Added On</th>
                <th className="py-2.5 px-3">Case ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs font-mono">
              {samples.map((row) => {
                const isSelected = selectedSampleIds.includes(row.id);

                return (
                  <tr 
                    key={row.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-[#00e676]/[0.05]' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(row.id)}
                        className="rounded bg-[#040806] border-white/[0.2] text-[#00e676] focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Source */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="shrink-0">
                          {renderSourceIcon(row.sourceType)}
                        </div>
                        <span className="font-mono text-white text-xs">
                          {row.sourceText}
                        </span>
                      </div>
                    </td>

                    {/* Input Type */}
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/[0.05] border border-white/[0.08] text-slate-300">
                        {row.inputType}
                      </span>
                    </td>

                    {/* Human Label */}
                    <td className="py-3 px-3">
                      {renderHumanLabelBadge(row)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      {renderStatusBadge(row.status)}
                    </td>

                    {/* Added On */}
                    <td className="py-3 px-3 text-slate-300">
                      {row.addedOn}
                    </td>

                    {/* Case ID with External Link */}
                    <td className="py-3 px-3">
                      <button
                        onClick={() => setActiveCaseModal(row)}
                        className="text-[#00e676] hover:underline font-bold flex items-center gap-1 transition-colors"
                      >
                        <span>{row.caseId}</span>
                        <ExternalLink className="w-3 h-3 text-[#00e676]" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* 4. BOTTOM DUAL PANELS: TRAINING QUEUE SETTINGS & DATA QUALITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT PANEL: TRAINING QUEUE SETTINGS (COL-SPAN 6) */}
        <div className="lg:col-span-6 rounded-xl border border-white/[0.08] bg-[#070d0a]/90 p-5 shadow-xl flex flex-col justify-between gap-5">
          
          <div>
            {/* Header */}
            <div className="flex items-start gap-3 pb-3 border-b border-white/[0.06] mb-4">
              <Settings className="w-4 h-4 text-[#00e676] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs md:text-sm font-bold text-white tracking-normal font-sans">
                  Training Queue Settings
                </h3>
                <p className="text-[11px] text-[#8fa396] mt-0.5 font-sans">
                  Configure automatic fine-tuning behaviour and safety rules.
                </p>
              </div>
            </div>

            {/* Settings Rows */}
            <div className="flex flex-col gap-4 font-mono text-xs">
              
              {/* Setting 1: Target buffer size */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-300 text-xs">Target buffer size</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={targetBufferSize}
                    onChange={(e) => setTargetBufferSize(Number(e.target.value))}
                    className="w-16 bg-[#040806] border border-white/[0.12] rounded p-1 text-center font-bold text-white text-xs focus:outline-none focus:border-[#00e676]/40"
                  />
                  <span className="text-[#8fa396] text-xs">samples</span>
                  <div className="group relative cursor-pointer">
                    <Info className="w-3.5 h-3.5 text-slate-500 hover:text-white" />
                    <div className="hidden group-hover:block absolute bottom-full right-0 mb-1 w-48 p-2 rounded bg-black/90 border border-white/[0.1] text-[10px] text-slate-300 font-sans z-20">
                      Buffer limit required before an automated fine-tuning cycle is considered.
                    </div>
                  </div>
                </div>
              </div>

              {/* Setting 2: Auto-schedule fine-tuning */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-300 text-xs">Auto-schedule fine-tuning</span>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setAutoScheduleFineTuning(prev => !prev)}
                    className={`w-10 h-5 rounded-full transition-colors relative flex items-center ${
                      autoScheduleFineTuning ? 'bg-[#00e676]' : 'bg-white/[0.1]'
                    }`}
                  >
                    <span 
                      className={`w-3.5 h-3.5 rounded-full bg-black transition-transform duration-200 ${
                        autoScheduleFineTuning ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-slate-300 text-xs">
                    {autoScheduleFineTuning ? 'Enabled (monthly)' : 'Disabled'}
                  </span>
                  <div className="group relative cursor-pointer">
                    <Info className="w-3.5 h-3.5 text-slate-500 hover:text-white" />
                    <div className="hidden group-hover:block absolute bottom-full right-0 mb-1 w-48 p-2 rounded bg-black/90 border border-white/[0.1] text-[10px] text-slate-300 font-sans z-20">
                      Permits monthly automated candidate training runs when buffer criteria are satisfied.
                    </div>
                  </div>
                </div>
              </div>

              {/* Setting 3: Require multi-reviewer approval */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-300 text-xs">Require multi-reviewer approval</span>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setRequireMultiReviewer(prev => !prev)}
                    className={`w-10 h-5 rounded-full transition-colors relative flex items-center ${
                      requireMultiReviewer ? 'bg-[#00e676]' : 'bg-white/[0.1]'
                    }`}
                  >
                    <span 
                      className={`w-3.5 h-3.5 rounded-full bg-black transition-transform duration-200 ${
                        requireMultiReviewer ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-slate-300 text-xs">
                    {requireMultiReviewer ? 'Enabled' : 'Disabled'}
                  </span>
                  <div className="group relative cursor-pointer">
                    <Info className="w-3.5 h-3.5 text-slate-500 hover:text-white" />
                    <div className="hidden group-hover:block absolute bottom-full right-0 mb-1 w-48 p-2 rounded bg-black/90 border border-white/[0.1] text-[10px] text-slate-300 font-sans z-20">
                      Demands independent second-specialist sign-off before admitting sensitive labels.
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.04] text-[11px] font-mono text-[#6b8273]">
            Safety Guardrails: Active • Candidate versions undergo Model Approval review prior to deployment.
          </div>
        </div>

        {/* RIGHT PANEL: DATA QUALITY & MODEL IMPACT (COL-SPAN 6) */}
        <div className="lg:col-span-6 rounded-xl border border-white/[0.08] bg-[#070d0a]/90 p-5 shadow-xl flex flex-col justify-between gap-5">
          
          <div>
            {/* Header */}
            <div className="flex items-start gap-3 pb-3 border-b border-white/[0.06] mb-4">
              <BarChart3 className="w-4 h-4 text-[#00e676] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs md:text-sm font-bold text-white tracking-normal font-sans">
                  Data Quality &amp; Model Impact
                </h3>
                <p className="text-[11px] text-[#8fa396] mt-0.5 font-sans">
                  Quality checks and expected improvement from buffered samples.
                </p>
              </div>
            </div>

            {/* 4 Metric Columns Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
              
              {/* Column 1: Data Quality */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[11px] text-[#8fa396]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00e676]" />
                  <span>Data Quality</span>
                </div>
                <div className="text-xl font-bold text-white tracking-tight">
                  96%
                </div>
                <div className="text-[10px] text-[#8fa396]">
                  Pass rate
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mt-1">
                  <div className="h-full bg-[#00e676] rounded-full" style={{ width: '96%' }} />
                </div>
              </div>

              {/* Column 2: Label Agreement */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[11px] text-[#8fa396]">
                  <Scale className="w-3.5 h-3.5 text-[#00e676]" />
                  <span>Label Agreement</span>
                </div>
                <div className="text-xl font-bold text-white tracking-tight">
                  0.89
                </div>
                <div className="text-[10px] text-[#8fa396]">
                  Inter-reviewer score
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mt-1">
                  <div className="h-full bg-[#00e676] rounded-full" style={{ width: '89%' }} />
                </div>
              </div>

              {/* Column 3: Estimated Gain */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[11px] text-[#8fa396]">
                  <TrendingUp className="w-3.5 h-3.5 text-[#00e676]" />
                  <span>Estimated Gain</span>
                </div>
                <div className="text-xl font-bold text-white tracking-tight">
                  +1.2%
                </div>
                <div className="text-[10px] text-[#8fa396]">
                  F1-score (validation)
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mt-1">
                  <div className="h-full bg-[#00e676] rounded-full" style={{ width: '65%' }} />
                </div>
              </div>

              {/* Column 4: Diversity */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[11px] text-[#8fa396]">
                  <Layers className="w-3.5 h-3.5 text-[#00e676]" />
                  <span>Diversity</span>
                </div>
                <div className="text-xl font-bold text-white tracking-tight">
                  5
                </div>
                <div className="text-[10px] text-[#8fa396]">
                  Input types
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mt-1">
                  <div className="h-full bg-[#00e676] rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.04] text-[11px] font-mono text-[#6b8273]">
            Evaluation Protocol: Stratified k-fold cross-validation against clean ground-truth benchmark.
          </div>
        </div>

      </div>

      {/* 5. MODAL: RUN FINE-TUNING JOB CONFIRMATION & EXECUTION */}
      {isJobModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1410] border border-white/[0.1] rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-5 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Sparkles className="w-4 h-4 text-[#00e676]" />
                <span>Execute Controlled Continual Fine-Tuning Job</span>
              </div>
              <button 
                onClick={() => setIsJobModalOpen(false)}
                disabled={isJobRunning}
                className="text-slate-400 hover:text-white disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!isJobRunning && !jobCompletedCandidate ? (
              <div className="flex flex-col gap-4">
                <p className="text-slate-300 font-sans text-xs leading-relaxed">
                  You are about to launch a controlled learning cycle using <strong>62 validated, human-reviewed outcomes</strong>. The training process will generate a candidate model version without overwriting the active production release.
                </p>

                <div className="p-3.5 rounded-xl bg-[#060c09] border border-white/[0.06] flex flex-col gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#8fa396]">Target Model:</span>
                    <span className="text-white font-bold">URL Phishing Detector</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8fa396]">Current Deployed:</span>
                    <span className="text-slate-300">v1.0.7 (Active)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8fa396]">Candidate Output:</span>
                    <span className="text-[#00e676] font-bold">v1.0.8-candidate</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8fa396]">Eligible Buffered Samples:</span>
                    <span className="text-white font-bold">62 samples (Pass rate 96%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8fa396]">Next Workflow Stage:</span>
                    <span className="text-amber-400 font-bold">Model Approval Review</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#00e676]/10 border border-[#00e676]/30 text-xs text-[#00e676] flex items-center gap-2">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>Immutable safeguard: The candidate will NOT be deployed to production until approved in the Model Approval Portal.</span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                  <button
                    onClick={() => setIsJobModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteFineTuning}
                    className="px-4 py-2 rounded-lg bg-[#00e676] hover:bg-[#00e676]/90 text-black text-xs font-bold transition-colors flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,230,118,0.3)]"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>Confirm &amp; Start Training Run</span>
                  </button>
                </div>
              </div>
            ) : isJobRunning ? (
              <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
                <RefreshCw className="w-10 h-10 text-[#00e676] animate-spin" />
                <div className="flex flex-col gap-1">
                  <span className="text-white font-bold text-sm">Fine-Tuning Run in Progress...</span>
                  <span className="text-xs text-[#8fa396]">{jobProgressStage}</span>
                </div>
                <div className="w-full max-w-md h-2 rounded-full bg-white/[0.06] overflow-hidden mt-2">
                  <div className="h-full bg-[#00e676] animate-pulse rounded-full" style={{ width: '75%' }} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#00e676]/10 border border-[#00e676]/30 flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#00e676] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white font-sans">
                      Training Run Completed Successfully!
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 font-sans">
                      Candidate version <strong>{jobCompletedCandidate}</strong> has been created and verified.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#060c09] border border-white/[0.06] flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-[#8fa396]">Candidate Version:</span>
                    <span className="text-[#00e676] font-bold">{jobCompletedCandidate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8fa396]">Evaluated F1-Score:</span>
                    <span className="text-white font-bold">0.988 (+1.1% gain)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8fa396]">Status:</span>
                    <span className="text-amber-400 font-bold">Awaiting Model Approval</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                  <button
                    onClick={() => {
                      setIsJobModalOpen(false);
                      setJobCompletedCandidate(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-xs font-bold transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setIsJobModalOpen(false);
                      setJobCompletedCandidate(null);
                      onSelectTab('model-approval');
                    }}
                    className="px-4 py-2 rounded-lg bg-[#00e676] hover:bg-[#00e676]/90 text-black text-xs font-bold transition-colors flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,230,118,0.3)]"
                  >
                    <span>Inspect in Model Approval</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. MODAL: VIEW ALL VALIDATED SAMPLES */}
      {isViewAllOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1410] border border-white/[0.1] rounded-2xl max-w-4xl w-full p-6 shadow-2xl flex flex-col gap-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <FileText className="w-4 h-4 text-[#00e676]" />
                <span>All Buffered Human-Validated Samples (182 Total)</span>
              </div>
              <button 
                onClick={() => setIsViewAllOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300 font-sans text-xs">
              Complete inventory of 62 eligible samples and 120 pending validation samples. Each record maintains cryptographic linkage to its originating case.
            </p>

            <div className="overflow-x-auto max-h-[400px] rounded-lg border border-white/[0.06]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#070e0a] text-[10px] uppercase text-[#8fa396]">
                    <th className="py-2.5 px-3">Source Sample</th>
                    <th className="py-2.5 px-3">Input Type</th>
                    <th className="py-2.5 px-3">Human Label</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Reviewer</th>
                    <th className="py-2.5 px-3">Added On</th>
                    <th className="py-2.5 px-3">Case Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {samples.map((s) => (
                    <tr key={s.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 text-white font-bold">{s.sourceText}</td>
                      <td className="py-2.5 px-3 text-slate-300">{s.inputType}</td>
                      <td className="py-2.5 px-3">{renderHumanLabelBadge(s)}</td>
                      <td className="py-2.5 px-3">{renderStatusBadge(s.status)}</td>
                      <td className="py-2.5 px-3 text-slate-400">{s.reviewerId}</td>
                      <td className="py-2.5 px-3 text-slate-400">{s.addedOn}</td>
                      <td className="py-2.5 px-3 text-[#00e676] font-bold">{s.caseId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
              <span className="text-[11px] text-[#8fa396]">
                62 Eligible for fine-tuning • 120 Pending eligibility rules
              </span>
              <button
                onClick={() => setIsViewAllOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#00e676] text-black font-bold hover:bg-[#00e676]/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: CASE EVIDENCE PREVIEW */}
      {activeCaseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1410] border border-white/[0.1] rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <ExternalLink className="w-4 h-4 text-[#00e676]" />
                <span>Originating Investigation Case: {activeCaseModal.caseId}</span>
              </div>
              <button onClick={() => setActiveCaseModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#060c09] border border-white/[0.06] flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-[#8fa396]">Source Input:</span>
                <span className="text-white font-bold">{activeCaseModal.sourceText}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8fa396]">Input Type:</span>
                <span className="text-slate-300">{activeCaseModal.inputType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8fa396]">Human Verified Label:</span>
                <div>{renderHumanLabelBadge(activeCaseModal)}</div>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8fa396]">Specialist Investigator:</span>
                <span className="text-slate-300">{activeCaseModal.reviewerId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8fa396]">Admission Status:</span>
                <div>{renderStatusBadge(activeCaseModal.status)}</div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[#8fa396] text-[11px] font-bold">Investigator Notes:</span>
              <p className="text-slate-200 font-sans text-xs bg-[#050b07] p-3 rounded-lg border border-white/[0.06]">
                {activeCaseModal.investigatorNotes}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                onClick={() => setActiveCaseModal(null)}
                className="px-4 py-2 rounded-lg bg-[#00e676] text-black font-bold hover:bg-[#00e676]/90 transition-colors"
              >
                Close Case Context
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
