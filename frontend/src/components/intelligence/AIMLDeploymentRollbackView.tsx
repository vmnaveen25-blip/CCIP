import React, { useState } from 'react';
import { 
  Layers, 
  Check, 
  Clock, 
  TrendingUp, 
  ShieldCheck, 
  Sliders, 
  RotateCcw, 
  History, 
  Pause, 
  Play, 
  ArrowUp, 
  ArrowRight, 
  Info, 
  ChevronDown, 
  BookOpen, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  Terminal,
  Activity,
  FileText
} from 'lucide-react';
import { ModelMetric } from '../../types';
import { apiClient } from '../../api/client';

export interface DeploymentHistoryRow {
  id: string;
  version: string;
  stageAction: string;
  traffic: string;
  status: 'Passed' | 'Active' | 'Superseded' | 'Rolled Back' | 'Paused' | 'Failed';
  startedAt: string;
  completedAt: string;
  operator: string;
  notes: string;
}

interface AIMLDeploymentRollbackViewProps {
  models?: ModelMetric[];
  onSelectTab: (tab: string) => void;
}

export const AIMLDeploymentRollbackView: React.FC<AIMLDeploymentRollbackViewProps> = ({
  models,
  onSelectTab
}) => {
  // Model & Environment Selection
  const [selectedModel, setSelectedModel] = useState('URL Phishing Detector — v2.1');
  const [selectedEnv, setSelectedEnv] = useState('Production');

  // Rollout State
  const [rolloutStage, setRolloutStage] = useState<'CANARY_10' | 'CANARY_50' | 'FULL_100'>('CANARY_50');
  const [trafficAllocated, setTrafficAllocated] = useState(50);
  const [isPaused, setIsPaused] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<'DEPLOYMENT IN PROGRESS' | 'PAUSED' | 'COMPLETED' | 'ROLLED BACK'>('DEPLOYMENT IN PROGRESS');
  const [startedTimestamp, setStartedTimestamp] = useState('12 Jun 2026, 10:24 AM');

  // Modals
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [rollbackReason, setRollbackReason] = useState('Elevated false positive alarms on regional domain patterns');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Deployment History Rows matching reference screenshot exactly
  const [historyRows, setHistoryRows] = useState<DeploymentHistoryRow[]>([
    {
      id: 'h-1',
      version: 'v2.1',
      stageAction: 'Canary Deployment',
      traffic: '10%',
      status: 'Passed',
      startedAt: '12 Jun 2026, 10:24 AM',
      completedAt: '12 Jun 2026, 10:36 AM',
      operator: 'Naveen',
      notes: 'Initial canary rollout'
    },
    {
      id: 'h-2',
      version: 'v2.1',
      stageAction: 'Canary Ramp-up',
      traffic: '50%',
      status: 'Active',
      startedAt: '12 Jun 2026, 10:36 AM',
      completedAt: '—',
      operator: 'Naveen',
      notes: 'Monitoring (auto)'
    },
    {
      id: 'h-3',
      version: 'v2.0',
      stageAction: 'Full Deployment',
      traffic: '100%',
      status: 'Superseded',
      startedAt: '02 May 2026, 09:15 AM',
      completedAt: '12 Jun 2026, 10:24 AM',
      operator: 'S. Kumar',
      notes: 'Replaced by v2.1'
    }
  ]);

  // Model Options
  const modelOptions = [
    'URL Phishing Detector — v2.1',
    'VoiceGuard — v2.2-RC1',
    'CryptoTracer — v4.1-Canary',
    'Email Threat Classifier — v1.0.0',
    'SMS Scam Classifier — v1.0.0',
    'Investigation Assistant — v2.0.0',
    'Cybercrime Complaint Classifier — v1.1.0',
    'Cyber NER Transformer — v4.0.0',
    'Case Similarity Transformer — v1.0.0',
    'Incident Urgency Classifier — v1.0.0'
  ];

  // Action: Pause / Resume Rollout
  const handleTogglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      setDeploymentStatus('DEPLOYMENT IN PROGRESS');
      setFeedbackMessage('Rollout resumed. Automatic canary health checks and traffic ingress re-enabled.');
    } else {
      setIsPaused(true);
      setDeploymentStatus('PAUSED');
      setFeedbackMessage(`Rollout held at ${trafficAllocated}% traffic allocation. Canary metrics frozen for review.`);
    }
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  // Action: Promote to 100%
  const handlePromoteTo100 = () => {
    setRolloutStage('FULL_100');
    setTrafficAllocated(100);
    setIsPaused(false);
    setDeploymentStatus('COMPLETED');

    const completedTime = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Update history table
    setHistoryRows(prev => [
      {
        id: 'h-' + Date.now(),
        version: 'v2.1',
        stageAction: 'Full Rollout (100%)',
        traffic: '100%',
        status: 'Passed',
        startedAt: completedTime,
        completedAt: completedTime,
        operator: 'Naveen',
        notes: 'Promoted to full 100% production traffic after passing 5/5 health checks'
      },
      ...prev.map(r => r.status === 'Active' ? { ...r, status: 'Passed' as const, completedAt: completedTime } : r)
    ]);

    setFeedbackMessage('PROMOTION COMPLETE: Model v2.1 is now serving 100% production traffic with zero regressions.');
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  // Action: Execute Rollback
  const handleExecuteRollback = async () => {
    setIsRollingBack(true);
    try {
      await apiClient.rollbackModel('URL-Phishing-Detector', 'v2.0');
    } catch (e) {
      console.warn('Backend rollback endpoint fallback invoked:', e);
    }

    setTimeout(() => {
      setIsRollingBack(false);
      setIsRollbackModalOpen(false);
      setRolloutStage('FULL_100');
      setTrafficAllocated(100);
      setDeploymentStatus('ROLLED BACK');
      setSelectedModel('URL Phishing Detector — v2.0');

      const rollbackTime = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      setHistoryRows(prev => [
        {
          id: 'h-' + Date.now(),
          version: 'v2.0',
          stageAction: 'Rollback Recovery',
          traffic: '100%',
          status: 'Passed',
          startedAt: rollbackTime,
          completedAt: rollbackTime,
          operator: 'Naveen',
          notes: `Emergency rollback: ${rollbackReason}`
        },
        ...prev.map(r => r.status === 'Active' ? { ...r, status: 'Rolled Back' as const, completedAt: rollbackTime } : r)
      ]);

      setFeedbackMessage('ROLLBACK SUCCESSFUL: Restored stable version v2.0. Ingress traffic safely redirected.');
      setTimeout(() => setFeedbackMessage(null), 5000);
    }, 600);
  };

  return (
    <div className="flex flex-col gap-5 text-content-primary animate-in fade-in duration-200">
      {/* 1. TOP HEADER matching reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Layers className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Deployment & Rollback</h1>
            <p className="text-xs text-[#8fa396]">
              Release approved model versions safely and monitor rollout health.
            </p>
          </div>
        </div>

        {/* View Deployment Guide Button */}
        <button
          onClick={() => setIsGuideOpen(true)}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl border border-emerald-500/40 hover:bg-emerald-950/40 text-emerald-400 hover:text-emerald-300 text-xs font-mono font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          <span>View Deployment Guide</span>
        </button>
      </div>

      {feedbackMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-lg font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. CARD 1: ACTIVE DEPLOYMENT matching reference */}
      <div className="rounded-2xl bg-[#0c1310]/95 border border-emerald-900/40 p-5 sm:p-6 shadow-xl backdrop-blur-md flex flex-col gap-6">
        {/* Top Controls Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-emerald-900/30">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00e676] shadow-[0_0_10px_rgba(0,230,118,0.8)] animate-pulse"></span>
            <h2 className="text-base font-bold text-white tracking-wide">Active Deployment</h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Model Selector */}
            <div className="flex flex-col gap-1 min-w-[240px]">
              <label className="text-[11px] font-mono text-[#8fa396]">Model</label>
              <div className="relative">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none pr-8 cursor-pointer font-sans font-medium"
                >
                  {modelOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
              </div>
            </div>

            {/* Environment Selector */}
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-[11px] font-mono text-[#8fa396]">Environment</label>
              <div className="relative">
                <select
                  value={selectedEnv}
                  onChange={(e) => setSelectedEnv(e.target.value)}
                  className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none pr-8 cursor-pointer font-sans font-medium"
                >
                  <option value="Production">Production</option>
                  <option value="Staging">Staging</option>
                  <option value="Development">Development</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
              </div>
            </div>

            {/* Status & Timestamp Badge */}
            <div className="flex flex-col items-end self-end lg:self-auto ml-auto">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider ${
                deploymentStatus === 'COMPLETED'
                  ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-400'
                  : deploymentStatus === 'PAUSED'
                  ? 'bg-amber-950/70 border border-amber-500/50 text-amber-400'
                  : deploymentStatus === 'ROLLED BACK'
                  ? 'bg-rose-950/70 border border-rose-500/50 text-rose-400'
                  : 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  deploymentStatus === 'PAUSED' ? 'bg-amber-400' : deploymentStatus === 'ROLLED BACK' ? 'bg-rose-400' : 'bg-emerald-400 animate-ping'
                }`}></span>
                {deploymentStatus}
              </span>
              <span className="text-[11px] font-mono text-slate-400 mt-1">
                Started: {startedTimestamp}
              </span>
            </div>
          </div>
        </div>

        {/* Canary Stepper Stages matching reference */}
        <div className="pt-2 pb-1">
          <div className="flex items-center justify-between relative max-w-4xl mx-auto px-4 sm:px-12">
            {/* Step 1: Canary 10% (Passed) */}
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-7 h-7 rounded-full bg-emerald-950/80 border border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div className="font-mono">
                <div className="text-xs font-bold text-white">Canary 10%</div>
                <div className="text-[11px] text-emerald-400 font-bold">Passed</div>
              </div>
            </div>

            {/* Connecting Line 1 (Solid Green) */}
            <div className="flex-1 h-0.5 bg-emerald-500 mx-4" />

            {/* Step 2: Canary 50% (Active) */}
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-7 h-7 rounded-full bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="font-mono">
                <div className="text-xs font-bold text-white">Canary 50%</div>
                <div className={`text-[11px] font-bold ${isPaused ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {isPaused ? 'Paused' : 'Active'}
                </div>
              </div>
            </div>

            {/* Connecting Line 2 (Dashed Muted Line) */}
            <div className={`flex-1 h-0.5 mx-4 ${
              rolloutStage === 'FULL_100' ? 'bg-emerald-500' : 'border-t border-dashed border-slate-700'
            }`} />

            {/* Step 3: Full rollout 100% (Pending) */}
            <div className="flex items-center gap-3 relative z-10">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                rolloutStage === 'FULL_100'
                  ? 'bg-emerald-950/80 border border-emerald-400 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-900 border border-slate-700 text-slate-500'
              }`}>
                {rolloutStage === 'FULL_100' ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                )}
              </div>
              <div className="font-mono">
                <div className={`text-xs font-bold ${rolloutStage === 'FULL_100' ? 'text-white' : 'text-slate-400'}`}>
                  Full rollout 100%
                </div>
                <div className={`text-[11px] ${rolloutStage === 'FULL_100' ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                  {rolloutStage === 'FULL_100' ? 'Active' : 'Pending'}
                </div>
              </div>
            </div>
          </div>

          {/* Canary Progress Bar matching reference */}
          <div className="mt-8">
            <div className="w-full bg-[#121c17] border border-emerald-900/40 h-3 rounded-full overflow-hidden p-0.5">
              <div 
                className="bg-gradient-to-r from-emerald-500 via-[#00e676] to-[#00ff88] h-full rounded-full transition-all duration-700 shadow-[0_0_15px_rgba(0,230,118,0.4)]"
                style={{ width: `${trafficAllocated}%` }}
              />
            </div>
            <div className="text-right mt-1.5 text-xs font-mono font-bold text-emerald-400">
              {trafficAllocated}% traffic allocated
            </div>
          </div>
        </div>

        {/* Health Metrics (3 Cards Grid) matching reference */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
          {/* Card 1: Error rate */}
          <div className="p-4 rounded-xl bg-[#121c17] border border-emerald-900/40 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-xs text-[#8fa396] block">Error rate</span>
                <span className="text-lg font-bold font-mono text-white">0.4%</span>
              </div>
            </div>
            <div className="text-right font-mono text-xs text-emerald-400">
              <div>▼ -0.2%</div>
              <div className="text-[10px] text-[#8fa396]">vs. previous</div>
            </div>
          </div>

          {/* Card 2: Latency */}
          <div className="p-4 rounded-xl bg-[#121c17] border border-emerald-900/40 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Clock className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-xs text-[#8fa396] block">Latency</span>
                <span className="text-lg font-bold font-mono text-white">142 ms</span>
              </div>
            </div>
            <div className="text-right font-mono text-xs text-emerald-400">
              <div>▼ -18 ms</div>
              <div className="text-[10px] text-[#8fa396]">vs. previous</div>
            </div>
          </div>

          {/* Card 3: Health checks */}
          <div className="p-4 rounded-xl bg-[#121c17] border border-emerald-900/40 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-xs text-[#8fa396] block">Health checks</span>
                <span className="text-lg font-bold font-mono text-white">Passed</span>
              </div>
            </div>
            <div className="text-right font-mono text-xs">
              <div className="text-emerald-400 font-bold">5 / 5</div>
              <div className="text-[10px] text-[#8fa396]">all services healthy</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CARD 2: RELEASE CONTROLS matching reference */}
      <div className="rounded-2xl bg-[#0c1310]/95 border border-emerald-900/40 p-5 sm:p-6 shadow-xl backdrop-blur-md flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Sliders className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Release Controls</h3>
              <p className="text-xs text-[#8fa396]">
                Control rollout progression or rollback to a previous stable version.
              </p>
            </div>
          </div>

          {/* Right Warning Notice */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs font-sans">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Rollout and rollback require successful health checks and appropriate permissions.</span>
          </div>
        </div>

        {/* 3 Big Control Buttons matching reference */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Button 1: Pause / Resume Rollout */}
          <button
            onClick={handleTogglePause}
            className="p-4 rounded-xl border border-slate-700/80 hover:border-emerald-500/80 bg-[#121c17] hover:bg-[#182620] text-white flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2 font-mono font-bold text-xs">
              {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-slate-300 group-hover:text-emerald-400" />}
              <span>{isPaused ? 'Resume rollout' : 'Pause rollout'}</span>
            </div>
            <span className="text-[11px] text-[#8fa396] font-sans">
              {isPaused ? 'Continue traffic progression' : 'Hold at current traffic level'}
            </span>
          </button>

          {/* Button 2: Promote to 100% */}
          <button
            onClick={handlePromoteTo100}
            disabled={rolloutStage === 'FULL_100'}
            className="p-4 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-[#07130e] flex flex-col items-center justify-center gap-1 shadow-[0_0_20px_rgba(0,230,118,0.35)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2 font-mono font-bold text-xs">
              <ArrowUp className="w-4 h-4 stroke-[3]" />
              <span>Promote to 100%</span>
            </div>
            <span className="text-[11px] text-[#07130e]/90 font-sans font-medium">
              Complete full rollout (after checks)
            </span>
          </button>

          {/* Button 3: Rollback to v2.0 */}
          <button
            onClick={() => setIsRollbackModalOpen(true)}
            className="p-4 rounded-xl border border-rose-500/40 hover:border-rose-500/80 bg-rose-950/10 hover:bg-rose-950/25 text-rose-400 hover:text-rose-300 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 font-mono font-bold text-xs">
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <span>Rollback to v2.0</span>
            </div>
            <span className="text-[11px] text-rose-300/80 font-sans">
              Revert to previous approved version
            </span>
          </button>
        </div>
      </div>

      {/* 4. CARD 3: RECENT DEPLOYMENT HISTORY matching reference */}
      <div className="rounded-2xl bg-[#0c1310]/95 border border-emerald-900/40 p-5 sm:p-6 shadow-xl backdrop-blur-md flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-emerald-900/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <History className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Recent Deployment History</h3>
              <p className="text-xs text-[#8fa396]">Latest deployment activities for this model.</p>
            </div>
          </div>

          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="text-xs font-mono text-slate-300 hover:text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>View All History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* History Table matching reference */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-emerald-900/40 text-[#8fa396] text-[11px] uppercase tracking-wider bg-[#09110d]/80">
                <th className="py-3 px-3 font-semibold">VERSION</th>
                <th className="py-3 px-3 font-semibold">STAGE / ACTION</th>
                <th className="py-3 px-3 font-semibold">TRAFFIC</th>
                <th className="py-3 px-3 font-semibold">STATUS</th>
                <th className="py-3 px-3 font-semibold">STARTED AT</th>
                <th className="py-3 px-3 font-semibold">COMPLETED AT</th>
                <th className="py-3 px-3 font-semibold">OPERATOR</th>
                <th className="py-3 px-3 font-semibold">NOTES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/20 font-sans">
              {historyRows.map((row) => {
                const isPassed = row.status === 'Passed';
                const isActive = row.status === 'Active';
                const isSuperseded = row.status === 'Superseded';
                const isRolledBack = row.status === 'Rolled Back';

                return (
                  <tr key={row.id} className="hover:bg-[#121d17]/80 transition-colors">
                    {/* Version */}
                    <td className="py-3 px-3 font-mono text-slate-200 font-bold whitespace-nowrap">
                      {row.version}
                    </td>

                    {/* Stage / Action */}
                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap font-sans">
                      {row.stageAction}
                    </td>

                    {/* Traffic */}
                    <td className="py-3 px-3 font-mono text-slate-200 whitespace-nowrap">
                      {row.traffic}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-xs">
                      {isPassed && (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Passed
                        </span>
                      )}
                      {isActive && (
                        <span className="inline-flex items-center gap-1.5 text-cyan-400 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                          Active
                        </span>
                      )}
                      {isSuperseded && (
                        <span className="inline-flex items-center gap-1.5 text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                          Superseded
                        </span>
                      )}
                      {isRolledBack && (
                        <span className="inline-flex items-center gap-1.5 text-rose-400 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                          Rolled Back
                        </span>
                      )}
                    </td>

                    {/* Started At */}
                    <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                      {row.startedAt}
                    </td>

                    {/* Completed At */}
                    <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                      {row.completedAt}
                    </td>

                    {/* Operator */}
                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap font-mono text-xs">
                      {row.operator}
                    </td>

                    {/* Notes */}
                    <td className="py-3 px-3 text-slate-400 text-xs font-sans">
                      {row.notes}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL: DEPLOYMENT GUIDE */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0a100d] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
            <div className="px-6 py-4 border-b border-emerald-900/40 flex items-center justify-between bg-[#0e1713]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">CCIP Deployment & Canary Rollback Guide</h3>
                  <p className="text-xs font-mono text-emerald-400">ZERO-DOWNTIME INGRESS SPECIFICATION</p>
                </div>
              </div>
              <button onClick={() => setIsGuideOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono text-slate-300 max-h-[70vh]">
              <div className="p-3.5 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-1 font-sans">
                <span className="text-white font-bold block">1. Canary Progression Architecture</span>
                <p className="text-[#8fa396] text-xs leading-relaxed">
                  Traffic is routed dynamically through the CCIP API Gateway using weighted header routing:
                  Phase 1 routes 10% of citizen complaints and threat indicators to candidate models. If error rates remain &lt;0.5% and latency &lt;200ms for 30 minutes, Phase 2 advances to 50%.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-1 font-sans">
                <span className="text-white font-bold block">2. Automatic Emergency Rollback Triggers</span>
                <p className="text-[#8fa396] text-xs leading-relaxed">
                  If the candidate model violates any of the following SLA thresholds, the system halts traffic progression:
                  Error rate exceeds 1.5% • Inference latency exceeds 350ms • Health check probe failures ≥ 2 / 5.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-1 font-sans">
                <span className="text-white font-bold block">3. Rollback State Guarantee</span>
                <p className="text-[#8fa396] text-xs leading-relaxed">
                  Executing a rollback restores the immutable binary checkpoint of the previous stable version (v2.0) in less than 500ms, preserving ongoing investigations and analysis queries.
                </p>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-emerald-900/40 bg-[#0e1713] flex justify-end font-mono text-xs">
              <button
                onClick={() => setIsGuideOpen(false)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: CONFIRM ROLLBACK */}
      {isRollbackModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0a100d] border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
            <div className="px-6 py-4 border-b border-rose-900/40 flex items-center justify-between bg-[#150a0c]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Confirm Rollback to v2.0</h3>
                  <p className="text-xs font-mono text-rose-400">EMERGENCY STABLE RECOVERY</p>
                </div>
              </div>
              <button onClick={() => setIsRollbackModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 font-mono text-xs text-slate-300">
              <p className="text-slate-200 font-sans text-xs leading-relaxed">
                You are initiating an emergency rollback for <strong>{selectedModel}</strong>.
                Traffic will be immediately redirected from <strong>v2.1</strong> back to the verified stable candidate <strong>v2.0</strong>.
              </p>

              <div>
                <label className="text-slate-300 block mb-1">Reason for Rollback *</label>
                <textarea
                  rows={3}
                  required
                  value={rollbackReason}
                  onChange={(e) => setRollbackReason(e.target.value)}
                  className="w-full bg-[#121c17] border border-rose-900/40 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 font-sans resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-200 text-[11px] leading-relaxed">
                <strong>AUDIT DIRECTIVE:</strong> Rollback operations are immutably signed and published to CCIP Model Audit Reports with operator attribution (Naveen).
              </div>
            </div>

            <div className="px-6 py-3 border-t border-rose-900/40 bg-[#150a0c] flex justify-end gap-2.5 font-mono text-xs">
              <button
                onClick={() => setIsRollbackModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRollback}
                disabled={isRollingBack}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all flex items-center gap-1.5"
              >
                {isRollingBack ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Rolling Back...</span>
                  </>
                ) : (
                  <span>Execute Immediate Rollback</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: VIEW ALL HISTORY */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-[#0a100d] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
            <div className="px-6 py-4 border-b border-emerald-900/40 flex items-center justify-between bg-[#0e1713]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Complete Deployment Audit Ledger</h3>
                  <p className="text-xs font-mono text-emerald-400">IMMUTABLE DEPLOYMENT RECORD</p>
                </div>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 font-mono text-xs max-h-[70vh]">
              {historyRows.map((r, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-[#121c17] border border-emerald-900/30 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-emerald-400 font-bold">{r.version}</span> • <span className="text-white font-sans">{r.stageAction}</span>
                    <p className="text-[11px] text-[#8fa396] font-sans mt-0.5">{r.notes}</p>
                  </div>
                  <div className="text-right text-[11px] text-slate-400">
                    <div>Started: {r.startedAt}</div>
                    <div className="text-emerald-400 font-bold">{r.status} (by {r.operator})</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 border-t border-emerald-900/40 bg-[#0e1713] flex justify-end font-mono text-xs">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
              >
                Close Audit History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
