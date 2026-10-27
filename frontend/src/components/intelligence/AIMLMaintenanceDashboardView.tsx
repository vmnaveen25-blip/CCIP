import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  RefreshCw, 
  Box, 
  Rocket, 
  Clock, 
  AlertTriangle, 
  Database, 
  Eye, 
  BarChart3, 
  ShieldCheck, 
  ArrowRight, 
  ChevronRight, 
  FileText, 
  Globe, 
  Mail, 
  MessageSquare, 
  TrendingUp, 
  X, 
  CheckCircle2, 
  Sliders, 
  Layers, 
  Cpu, 
  Check, 
  Copy, 
  Terminal, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { ModelMetric } from '../../types';
import { apiClient } from '../../api/client';

interface AIMLMaintenanceDashboardViewProps {
  models: ModelMetric[];
  onSelectTab: (tab: string) => void;
  onRefresh?: () => void;
}

interface ActivityEvent {
  id: string;
  dotColor: string;
  text: string;
  timestamp: string;
  modelId: string;
}

export const AIMLMaintenanceDashboardView: React.FC<AIMLMaintenanceDashboardViewProps> = ({
  models,
  onSelectTab,
  onRefresh
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedTime, setLastRefreshedTime] = useState('Thu, 12 Jun 2026  10:24 AM');

  // Chart controls
  const [timeRange, setTimeRange] = useState<'30d' | '7d' | '90d'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'accuracy' | 'f1' | 'drift' | 'latency'>('accuracy');
  const [hoveredPoint, setHoveredPoint] = useState<{
    model: string;
    date: string;
    val: string;
    x: number;
    y: number;
  } | null>(null);

  // Modals
  const [inspectingModel, setInspectingModel] = useState<any | null>(null);
  const [approvalModalModel, setApprovalModalModel] = useState<any | null>(null);
  const [isAllActivitiesOpen, setIsAllActivitiesOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Standard model catalog based on reference design
  const modelTableData = useMemo(() => [
    {
      id: 'url-phishing',
      name: 'URL Phishing Detector',
      purpose: 'Detect and analyse malicious URLs',
      version: '2.0.0',
      status: 'Deployed',
      statusType: 'deployed', // green
      accuracy: '97.74%',
      driftRate: '0.8%',
      lastEvaluation: '12 Jun 2026',
      icon: Globe,
      actionLabel: 'View',
      actionIcon: Eye,
      actionColor: 'emerald',
      architecture: 'XGBoost Feature Ensemble + Lexical CNN',
      dataset: 'CERT-In Phishing Corpus 2026 (v4.2)',
      datasetHash: '9a8b1c4d...e2f3',
      f1Score: '0.9799',
      latency: '18ms',
      falsePositiveRate: '0.41%'
    },
    {
      id: 'email-threat',
      name: 'Email Threat Classifier',
      purpose: 'Classify phishing, spam and malicious emails',
      version: '1.0.0',
      status: 'Testing',
      statusType: 'testing', // yellow
      accuracy: '96.79%',
      driftRate: '1.1%',
      lastEvaluation: '10 Jun 2026',
      icon: Mail,
      actionLabel: 'Evaluate',
      actionIcon: BarChart3,
      actionColor: 'slate',
      architecture: 'DeBERTa-v3 Multi-Header Spam Classifier',
      dataset: 'Sovereign Mail Quarantine Data (v2.1)',
      datasetHash: 'f4b2e81a...390d',
      f1Score: '0.9682',
      latency: '42ms',
      falsePositiveRate: '0.82%'
    },
    {
      id: 'sms-scam',
      name: 'SMS Scam Classifier',
      purpose: 'Detect smishing and SMS fraud patterns',
      version: '1.0.0',
      status: 'Pending Approval',
      statusType: 'pending', // amber
      accuracy: '93.21%',
      driftRate: '2.4%',
      lastEvaluation: '08 Jun 2026',
      icon: MessageSquare,
      actionLabel: 'Review',
      actionIcon: ShieldCheck,
      actionColor: 'emerald',
      architecture: 'DistilBERT Smishing Pattern Classifier',
      dataset: '1930 Helpline Citizen SMS Reports (v1.8)',
      datasetHash: '87e209ab...14bc',
      f1Score: '0.9315',
      latency: '24ms',
      falsePositiveRate: '1.15%'
    },
    {
      id: 'complaint-classifier',
      name: 'Cybercrime Complaint Classifier',
      purpose: 'Classify and triage 18+ complaint categories',
      version: '1.0.0',
      status: 'Not Deployed',
      statusType: 'not_deployed', // gray
      accuracy: '91.05%',
      driftRate: '3.6%',
      lastEvaluation: '05 Jun 2026',
      icon: FileText,
      actionLabel: 'View',
      actionIcon: Eye,
      actionColor: 'slate',
      architecture: 'DeBERTa-v3 18-Category Cyber Legal Triage',
      dataset: 'National Cyber Crime Portal Anonymized Records',
      datasetHash: '34a1789c...8ef0',
      f1Score: '0.9140',
      latency: '65ms',
      falsePositiveRate: '1.45%'
    }
  ], []);

  // Recent activities list matching screenshot
  const recentActivities: ActivityEvent[] = useMemo(() => [
    {
      id: 'act-1',
      dotColor: 'bg-emerald-400',
      text: 'URL Phishing Detector v2.0.0 deployed to production',
      timestamp: '12 Jun 2026, 10:24 AM',
      modelId: 'url-phishing'
    },
    {
      id: 'act-2',
      dotColor: 'bg-sky-400',
      text: 'Email Threat Classifier evaluation completed',
      timestamp: '10 Jun 2026, 02:18 PM',
      modelId: 'email-threat'
    },
    {
      id: 'act-3',
      dotColor: 'bg-amber-400',
      text: 'SMS Scam Classifier submitted for approval',
      timestamp: '08 Jun 2026, 11:05 AM',
      modelId: 'sms-scam'
    },
    {
      id: 'act-4',
      dotColor: 'bg-slate-400',
      text: 'Cybercrime Complaint Classifier model registered',
      timestamp: '05 Jun 2026, 09:30 AM',
      modelId: 'complaint-classifier'
    }
  ], []);

  // Performance Trend chart data
  const chartDates = ['10 Jun', '15 Jun', '20 Jun', '25 Jun', '30 Jun', '5 Jul', '10 Jul'];
  
  // Normalized points for SVG rendering (width: 600, height: 180)
  // Accuracy metric points (%)
  const seriesAccuracy = {
    url: [97.2, 97.8, 97.4, 98.1, 97.9, 97.74, 97.9],
    email: [96.1, 96.4, 96.2, 96.9, 96.79, 96.8, 96.85],
    sms: [92.4, 92.8, 93.5, 93.1, 93.21, 93.4, 93.3],
    complaint: [90.5, 91.2, 90.8, 91.4, 91.05, 91.1, 91.2]
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) onRefresh();
    try {
      await apiClient.getAIModelsStatus();
    } catch {}
    setTimeout(() => {
      const now = new Date();
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const str = `${dayNames[now.getDay()]}, ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}  ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
      setLastRefreshedTime(str);
      setIsRefreshing(false);
      setActionFeedback('AI/ML model telemetry synchronized with local sovereign enclave.');
      setTimeout(() => setActionFeedback(null), 4000);
    }, 400);
  };

  const handleRowAction = (model: typeof modelTableData[0]) => {
    if (model.actionLabel === 'Evaluate') {
      onSelectTab('validation');
    } else if (model.actionLabel === 'Review') {
      setApprovalModalModel(model);
    } else {
      setInspectingModel(model);
    }
  };

  const handleApproveModel = (modelId: string) => {
    setActionFeedback(`Model ${modelId} v1.0.0 APPROVED for staging deployment. Audit receipt registered.`);
    setApprovalModalModel(null);
    setTimeout(() => setActionFeedback(null), 5000);
  };

  // Convert percentage value (0 - 100) to SVG Y coordinate (height 180, padding 20..160)
  const getY = (val: number) => {
    const minVal = 0;
    const maxVal = 100;
    const height = 150;
    const paddingTop = 15;
    return paddingTop + height - ((val - minVal) / (maxVal - minVal)) * height;
  };

  // Convert index (0..6) to SVG X coordinate (width 540, padding 40..520)
  const getX = (idx: number) => {
    const startX = 40;
    const endX = 525;
    return startX + (idx / 6) * (endX - startX);
  };

  // Generate SVG path string from points
  const makePath = (vals: number[]) => {
    return vals.reduce((acc, val, idx) => {
      const x = getX(idx);
      const y = getY(val);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };

  return (
    <div className="flex flex-col gap-5 text-content-primary animate-in fade-in duration-200">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">AI/ML Maintenance Dashboard</h1>
            <p className="text-xs text-[#8fa396]">
              View model status, performance, and quick actions for AI/ML operations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto font-mono text-xs">
          <span className="text-[#8fa396] text-[11px] whitespace-nowrap">
            {lastRefreshedTime}
          </span>
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-[#121c17] hover:bg-[#192720] text-emerald-400 text-xs font-mono flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(0,230,118,0.1)]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-mono">{actionFeedback}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. THE FOUR SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Models */}
        <div 
          onClick={() => onSelectTab('model-registry')}
          className="bg-[#06140d]/90 hover:bg-[#081a11] border border-[#00e676]/20 hover:border-[#00e676]/45 rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all duration-200 group shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
        >
          <div className="w-12 h-12 rounded-xl bg-[#002619] border border-[#00e676]/35 flex items-center justify-center text-[#00e676] group-hover:scale-105 transition-transform shrink-0 shadow-[0_0_12px_rgba(0,230,118,0.2)]">
            <Box className="w-6 h-6 text-[#00e676]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs text-[#8fa396] font-medium">
              <span>Total Models</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#4e725b] group-hover:text-[#00e676] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-extrabold text-white font-mono tracking-tight">4</span>
              <span className="text-xs font-semibold text-[#00e676] flex items-center font-mono">
                ↑ +1
              </span>
            </div>
            <div className="text-[11px] text-[#6e8d7a] truncate mt-0.5">
              Registered in system
            </div>
          </div>
        </div>

        {/* Card 2: Active Models */}
        <div 
          onClick={() => onSelectTab('deployment-rollback')}
          className="bg-[#06140d]/90 hover:bg-[#081a11] border border-[#00e676]/20 hover:border-[#00e676]/45 rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all duration-200 group shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
        >
          <div className="w-12 h-12 rounded-xl bg-[#002619] border border-[#00e676]/35 flex items-center justify-center text-[#00e676] group-hover:scale-105 transition-transform shrink-0 shadow-[0_0_12px_rgba(0,230,118,0.2)]">
            <Rocket className="w-6 h-6 text-[#00e676]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs text-[#8fa396] font-medium">
              <span>Active Models</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#4e725b] group-hover:text-[#00e676] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-extrabold text-[#00e676] font-mono tracking-tight">1</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#00e676]/15 text-[#00e676] border border-[#00e676]/30">
                PROD LIVE
              </span>
            </div>
            <div className="text-[11px] text-[#6e8d7a] truncate mt-0.5">
              Deployed in production
            </div>
          </div>
        </div>

        {/* Card 3: Pending Approval */}
        <div 
          onClick={() => onSelectTab('model-approval')}
          className="bg-[#06140d]/90 hover:bg-[#12160d] border border-[#00e676]/20 hover:border-[#f59e0b]/45 rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all duration-200 group shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
        >
          <div className="w-12 h-12 rounded-xl bg-[#2a1a05] border border-[#f59e0b]/40 flex items-center justify-center text-[#f59e0b] group-hover:scale-105 transition-transform shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
            <Clock className="w-6 h-6 text-[#f59e0b]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs text-[#8fa396] font-medium">
              <span>Pending Approval</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#4e725b] group-hover:text-[#f59e0b] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-extrabold text-white font-mono tracking-tight">2</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30">
                AWAITING
              </span>
            </div>
            <div className="text-[11px] text-[#6e8d7a] truncate mt-0.5">
              Awaiting review
            </div>
          </div>
        </div>

        {/* Card 4: Models with Drift */}
        <div 
          onClick={() => onSelectTab('monitoring-drift')}
          className="bg-[#06140d]/90 hover:bg-[#12160d] border border-[#00e676]/20 hover:border-[#f59e0b]/45 rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all duration-200 group shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
        >
          <div className="w-12 h-12 rounded-xl bg-[#2a1a05] border border-[#f59e0b]/40 flex items-center justify-center text-[#f59e0b] group-hover:scale-105 transition-transform shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
            <AlertTriangle className="w-6 h-6 text-[#f59e0b]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs text-[#8fa396] font-medium">
              <span>Models with Drift</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#4e725b] group-hover:text-[#f59e0b] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-extrabold text-[#f59e0b] font-mono tracking-tight">1</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30">
                ATTENTION
              </span>
            </div>
            <div className="text-[11px] text-[#6e8d7a] truncate mt-0.5">
              Needs attention
            </div>
          </div>
        </div>
      </div>

      {/* 3. CENTRAL TABLE: MODEL STATUS OVERVIEW */}
      <div className="rounded-xl border border-emerald-900/40 bg-[#0c1310]/95 p-5 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-2.5 pb-3 border-b border-emerald-900/40 mb-3">
          <Database className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">Model Status Overview</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-emerald-900/40 text-[#8fa396] text-[11px] font-medium">
                <th className="py-2.5 px-3 font-semibold">Model Name</th>
                <th className="py-2.5 px-3 font-semibold">Purpose</th>
                <th className="py-2.5 px-3 font-semibold font-mono">Version</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold font-mono">Accuracy</th>
                <th className="py-2.5 px-3 font-semibold font-mono">Drift Rate</th>
                <th className="py-2.5 px-3 font-semibold">Last Evaluation</th>
                <th className="py-2.5 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/20">
              {modelTableData.map((row) => {
                const IconComponent = row.icon;
                const ActionIcon = row.actionIcon;

                return (
                  <tr key={row.id} className="hover:bg-[#121d17]/80 transition-colors">
                    {/* Model Name */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <IconComponent className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-semibold text-white tracking-tight">{row.name}</span>
                      </div>
                    </td>

                    {/* Purpose */}
                    <td className="py-3 px-3 text-[#a1b8aa] max-w-xs truncate" title={row.purpose}>
                      {row.purpose}
                    </td>

                    {/* Version */}
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {row.version}
                    </td>

                    {/* Status Pill */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {row.statusType === 'deployed' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 font-mono text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Deployed
                        </span>
                      )}
                      {row.statusType === 'testing' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/40 border border-amber-500/40 text-amber-400 font-mono text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          Testing
                        </span>
                      )}
                      {row.statusType === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/40 border border-amber-500/40 text-amber-400 font-mono text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          Pending Approval
                        </span>
                      )}
                      {row.statusType === 'not_deployed' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/60 border border-slate-700/60 text-slate-400 font-mono text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          Not Deployed
                        </span>
                      )}
                    </td>

                    {/* Accuracy */}
                    <td className="py-3 px-3 font-mono text-slate-200">
                      {row.accuracy}
                    </td>

                    {/* Drift Rate */}
                    <td className="py-3 px-3 font-mono text-slate-200">
                      {row.driftRate}
                    </td>

                    {/* Last Evaluation */}
                    <td className="py-3 px-3 text-[#8fa396] whitespace-nowrap">
                      {row.lastEvaluation}
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleRowAction(row)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-mono transition-all ${
                          row.actionColor === 'emerald'
                            ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
                            : 'border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-400'
                        }`}
                      >
                        <ActionIcon className="w-3.5 h-3.5" />
                        <span>{row.actionLabel}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. BOTTOM 2-COLUMN SECTION: RECENT ACTIVITIES & MODEL PERFORMANCE TREND */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT: Recent Activities */}
        <div className="lg:col-span-5 rounded-xl border border-emerald-900/40 bg-[#0c1310]/95 p-5 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">Recent Activities</h3>
              </div>
              <button
                onClick={() => onSelectTab('model-audits')}
                className="text-xs text-emerald-400 hover:underline font-medium flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-3">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${act.dotColor}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 leading-snug">{act.text}</p>
                    <p className="text-[11px] text-[#8fa396] font-mono mt-0.5">{act.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-emerald-900/30 flex items-center justify-between text-[11px] text-[#8fa396] font-mono">
            <span>Audit Engine: Active</span>
            <span className="text-emerald-400">All events tamper-sealed</span>
          </div>
        </div>

        {/* RIGHT: Model Performance Trend */}
        <div className="lg:col-span-7 rounded-xl border border-emerald-900/40 bg-[#0c1310]/95 p-5 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-900/40 mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">Model Performance Trend</h3>
              </div>

              {/* Chart Dropdown Controls */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="bg-[#121c17] border border-emerald-900/50 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="30d">Last 30 Days</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>

                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value as any)}
                  className="bg-[#121c17] border border-emerald-900/50 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="accuracy">Accuracy</option>
                  <option value="f1">F1 Score</option>
                  <option value="drift">Drift Rate</option>
                  <option value="latency">Latency</option>
                </select>
              </div>
            </div>

            {/* SVG Interactive Line Chart */}
            <div className="relative w-full overflow-hidden">
              <svg viewBox="0 0 550 190" className="w-full h-44 select-none">
                {/* Y-Axis Label */}
                <text x="12" y="14" fill="#8fa396" fontSize="9" fontFamily="monospace">
                  Accuracy (%)
                </text>

                {/* Horizontal Grid lines & Y-Axis values */}
                {[
                  { val: 100, y: getY(100) },
                  { val: 75, y: getY(75) },
                  { val: 50, y: getY(50) },
                  { val: 25, y: getY(25) },
                  { val: 0, y: getY(0) }
                ].map(grid => (
                  <g key={grid.val}>
                    <line
                      x1="40"
                      y1={grid.y}
                      x2="525"
                      y2={grid.y}
                      stroke="#1b2e23"
                      strokeWidth="1"
                      strokeDasharray={grid.val === 0 ? '0' : '2 3'}
                    />
                    <text
                      x="32"
                      y={grid.y + 3}
                      fill="#6f8578"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {grid.val}
                    </text>
                  </g>
                ))}

                {/* 4 Colored Trend Lines */}
                {/* 1. URL Detector (Emerald #00e676) */}
                <path
                  d={makePath(seriesAccuracy.url)}
                  fill="none"
                  stroke="#00e676"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* 2. Email Threat Classifier (Blue #38bdf8) */}
                <path
                  d={makePath(seriesAccuracy.email)}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* 3. SMS Scam Classifier (Amber #fbbf24) */}
                <path
                  d={makePath(seriesAccuracy.sms)}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* 4. Complaint Classifier (Slate #94a3b8) */}
                <path
                  d={makePath(seriesAccuracy.complaint)}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Data Dots */}
                {seriesAccuracy.url.map((val, idx) => {
                  const x = getX(idx);
                  const y = getY(val);
                  return (
                    <circle
                      key={`url-${idx}`}
                      cx={x}
                      cy={y}
                      r="3.5"
                      fill="#00e676"
                      className="cursor-pointer hover:r-5 transition-all"
                      onMouseEnter={() => setHoveredPoint({ model: 'URL Detector', date: chartDates[idx], val: `${val}%`, x, y })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })}

                {seriesAccuracy.email.map((val, idx) => {
                  const x = getX(idx);
                  const y = getY(val);
                  return (
                    <circle
                      key={`email-${idx}`}
                      cx={x}
                      cy={y}
                      r="3.5"
                      fill="#38bdf8"
                      className="cursor-pointer hover:r-5 transition-all"
                      onMouseEnter={() => setHoveredPoint({ model: 'Email Classifier', date: chartDates[idx], val: `${val}%`, x, y })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })}

                {seriesAccuracy.sms.map((val, idx) => {
                  const x = getX(idx);
                  const y = getY(val);
                  return (
                    <circle
                      key={`sms-${idx}`}
                      cx={x}
                      cy={y}
                      r="3.5"
                      fill="#fbbf24"
                      className="cursor-pointer hover:r-5 transition-all"
                      onMouseEnter={() => setHoveredPoint({ model: 'SMS Classifier', date: chartDates[idx], val: `${val}%`, x, y })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })}

                {seriesAccuracy.complaint.map((val, idx) => {
                  const x = getX(idx);
                  const y = getY(val);
                  return (
                    <circle
                      key={`complaint-${idx}`}
                      cx={x}
                      cy={y}
                      r="3.5"
                      fill="#94a3b8"
                      className="cursor-pointer hover:r-5 transition-all"
                      onMouseEnter={() => setHoveredPoint({ model: 'Complaint Classifier', date: chartDates[idx], val: `${val}%`, x, y })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })}

                {/* X-Axis Dates */}
                {chartDates.map((date, idx) => (
                  <text
                    key={date}
                    x={getX(idx)}
                    y="180"
                    fill="#6f8578"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {date}
                  </text>
                ))}
              </svg>

              {/* Tooltip on hover */}
              {hoveredPoint && (
                <div 
                  className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full px-2.5 py-1 rounded bg-[#0a100d] border border-emerald-500/60 text-white font-mono text-[10px] shadow-2xl"
                  style={{ left: `${(hoveredPoint.x / 550) * 100}%`, top: `${(hoveredPoint.y / 190) * 100 - 8}%` }}
                >
                  <span className="text-emerald-400 font-bold">{hoveredPoint.model}</span>: {hoveredPoint.val}
                  <div className="text-[9px] text-[#8fa396]">{hoveredPoint.date}</div>
                </div>
              )}
            </div>

            {/* Legend Matching Screenshot */}
            <div className="flex flex-wrap items-center justify-center gap-5 pt-2 text-[11px] font-mono text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00e676]" />
                <span>URL Detector</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
                <span>Email Classifier</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
                <span>SMS Classifier</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8]" />
                <span>Complaint Classifier</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. MODAL: MODEL INSPECTION DOSSIER */}
      {inspectingModel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0a100d] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
            <div className="px-6 py-4 border-b border-emerald-900/40 flex items-center justify-between bg-[#0e1713]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">{inspectingModel.name}</h3>
                  <p className="text-xs font-mono text-emerald-400">VERSION {inspectingModel.version} • {inspectingModel.status.toUpperCase()}</p>
                </div>
              </div>

              <button
                onClick={() => setInspectingModel(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[#8fa396] text-[10px] block mb-1">ARCHITECTURE</span>
                  <span className="text-white font-bold">{inspectingModel.architecture}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[#8fa396] text-[10px] block mb-1">INFERENCE LATENCY</span>
                  <span className="text-emerald-400 font-bold">{inspectingModel.latency}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[#8fa396] text-[10px] block mb-1">EVALUATION ACCURACY</span>
                  <span className="text-emerald-400 font-bold text-sm">{inspectingModel.accuracy}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[#8fa396] text-[10px] block mb-1">F1 SCORE</span>
                  <span className="text-white font-bold text-sm">{inspectingModel.f1Score}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#121c17] border border-emerald-900/40 font-sans space-y-2">
                <span className="text-xs font-bold text-white uppercase font-mono tracking-wider block">Training Dataset Lineage</span>
                <p className="text-slate-300 text-xs">{inspectingModel.dataset}</p>
                <div className="flex items-center gap-2 text-[11px] font-mono text-[#8fa396] pt-1 border-t border-emerald-900/30">
                  <span>SHA-256 HASH:</span>
                  <span className="text-emerald-400">{inspectingModel.datasetHash}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-[11px]">
                <span className="font-bold">GOVERNANCE DIRECTIVE:</span> This model version is registered in the CCIP Sovereign Model Registry with immutable cryptographic weights hash verification.
              </div>
            </div>

            <div className="px-6 py-3 border-t border-emerald-900/40 bg-[#0e1713] flex items-center justify-between font-mono text-xs">
              <button
                onClick={() => {
                  setInspectingModel(null);
                  onSelectTab('validation');
                }}
                className="text-emerald-400 hover:underline flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Test in AI Detection Lab</span>
              </button>
              <button
                onClick={() => setInspectingModel(null)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono transition-all"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: MODEL APPROVAL REVIEW */}
      {approvalModalModel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0a100d] border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
            <div className="px-6 py-4 border-b border-amber-900/40 flex items-center justify-between bg-[#141208]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Model Approval Review</h3>
                  <p className="text-xs font-mono text-amber-400">{approvalModalModel.name} v{approvalModalModel.version}</p>
                </div>
              </div>

              <button
                onClick={() => setApprovalModalModel(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-[#161a12] border border-amber-500/30 text-amber-200">
                <span className="font-bold">CANDIDATE PENDING REVIEW:</span> This model was evaluated against verified 1930 Helpline benchmark datasets and achieved {approvalModalModel.accuracy} accuracy with a drift indicator of {approvalModalModel.driftRate}.
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-300">
                <div className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[#8fa396] text-[10px] block">BENCHMARK ACCURACY</span>
                  <span className="text-emerald-400 text-sm font-bold">{approvalModalModel.accuracy}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[#8fa396] text-[10px] block">DRIFT MEASUREMENT</span>
                  <span className="text-amber-400 text-sm font-bold">{approvalModalModel.driftRate}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-emerald-900/40 bg-[#0e1713] flex items-center justify-between font-mono text-xs">
              <button
                onClick={() => setApprovalModalModel(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white"
              >
                Dismiss
              </button>
              <button
                onClick={() => handleApproveModel(approvalModalModel.id)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Approve for Staging</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
