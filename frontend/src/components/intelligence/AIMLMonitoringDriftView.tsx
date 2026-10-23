import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Box, 
  AlertTriangle, 
  Clock, 
  Globe, 
  Mail, 
  MessageSquare, 
  FileText, 
  Share2, 
  Bell, 
  Network, 
  Table, 
  FileSearch, 
  Info, 
  ArrowRight, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink, 
  X, 
  Check, 
  Sliders, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles,
  FlaskConical,
  Layers,
  ChevronRight,
  Filter
} from 'lucide-react';
import { ModelMetric } from '../../types';

export interface MonitoredModelRecord {
  id: string;
  name: string;
  iconType: 'globe' | 'mail' | 'message-square' | 'file-text' | 'box' | 'share-2' | 'bell' | 'network';
  signalMonitored: string;
  recentStatus: 'No alert' | 'Review needed' | 'Monitoring unavailable' | 'Stale data';
  lastChecked: string;
  lastCheckedExact: string;
  nextRunExact: string;
  deployedVersion: string;
  baselineWindow: string;
  currentWindow: string;
  sampleCount: number;
  testMethod: string;
  testStatistic: number;
  threshold: number;
  pValue: number;
  divergentFeatures: {
    name: string;
    shiftPercent: number;
    baselineMean: string;
    currentMean: string;
    interpretation: string;
  }[];
  groundTruthEvaluation?: {
    labeledSamples: number;
    currentAccuracy: number;
    baselineAccuracy: number;
    falsePositiveRate: number;
    baselineFPR: number;
    latencyMs: number;
    baselineLatencyMs: number;
  };
  geminiExplanation: string;
  operatorReviewNotes?: string;
  reviewState: 'PENDING_REVIEW' | 'CONTINUE_MONITORING' | 'COLLECT_LABELS' | 'RETRAIN_PROPOSED' | 'NO_ACTION_REQUIRED';
}

interface AIMLMonitoringDriftViewProps {
  onSelectTab: (tab: string) => void;
  models?: ModelMetric[];
}

export const AIMLMonitoringDriftView: React.FC<AIMLMonitoringDriftViewProps> = ({
  onSelectTab
}) => {
  // 8 Registered models matching the reference screenshot exactly
  const [monitoredModels, setMonitoredModels] = useState<MonitoredModelRecord[]>([
    {
      id: 'url-phishing',
      name: 'URL Phishing Detector',
      iconType: 'globe',
      signalMonitored: 'URL feature distribution',
      recentStatus: 'No alert',
      lastChecked: '12 hours ago',
      lastCheckedExact: '2026-10-23 08:30 UTC',
      nextRunExact: '2026-10-24 08:30 UTC (in 12 hours)',
      deployedVersion: 'v1.0.7 (Active)',
      baselineWindow: '2026-09-01 to 2026-09-30 (N=120,000 URLs)',
      currentWindow: 'Last 7 Days (N=14,280 incoming URLs)',
      sampleCount: 14280,
      testMethod: 'Kolmogorov-Smirnov (KS) Test on 30 Lexical/Content Features',
      testStatistic: 0.038,
      threshold: 0.080,
      pValue: 0.384,
      divergentFeatures: [
        {
          name: 'Subdomain depth and count',
          shiftPercent: 11.2,
          baselineMean: '1.4 subdomains',
          currentMean: '1.55 subdomains',
          interpretation: 'Slight increase in multi-level domain structures, within normal variance threshold.'
        },
        {
          name: 'Shannon entropy of FQDN',
          shiftPercent: 5.8,
          baselineMean: '3.24 bits',
          currentMean: '3.42 bits',
          interpretation: 'Domain randomness scores remain in alignment with baseline distribution.'
        },
        {
          name: 'Query parameter length',
          shiftPercent: 4.1,
          baselineMean: '24 chars',
          currentMean: '25 chars',
          interpretation: 'Parameter structures remain consistent with benign/phishing corpus.'
        }
      ],
      groundTruthEvaluation: {
        labeledSamples: 450,
        currentAccuracy: 98.6,
        baselineAccuracy: 98.7,
        falsePositiveRate: 0.32,
        baselineFPR: 0.30,
        latencyMs: 14,
        baselineLatencyMs: 12
      },
      geminiExplanation: 'Current incoming URL features are statistically consistent with the baseline evaluation set (KS test p=0.384). No distribution shift or performance degradation detected.',
      reviewState: 'NO_ACTION_REQUIRED'
    },
    {
      id: 'email-threat',
      name: 'Email Threat Classifier',
      iconType: 'mail',
      signalMonitored: 'Email text distribution',
      recentStatus: 'Review needed',
      lastChecked: '12 hours ago',
      lastCheckedExact: '2026-10-23 08:30 UTC',
      nextRunExact: '2026-10-24 08:30 UTC (in 12 hours)',
      deployedVersion: 'v1.1.2 (Active)',
      baselineWindow: '2026-09-01 to 2026-09-30 (N=85,000 corporate/citizen emails)',
      currentWindow: 'Last 7 Days (N=9,840 incoming emails)',
      sampleCount: 9840,
      testMethod: 'Population Stability Index (PSI) & Transformer Sequence Distribution',
      testStatistic: 0.142,
      threshold: 0.080,
      pValue: 0.003,
      divergentFeatures: [
        {
          name: 'Email body token count & length',
          shiftPercent: 34.2,
          baselineMean: '142 tokens',
          currentMean: '285 tokens',
          interpretation: 'Significant influx of long, multi-paragraph fake invoice and vendor fraud lures.'
        },
        {
          name: 'Embedded hyperlink density',
          shiftPercent: 28.5,
          baselineMean: '1.2 links / msg',
          currentMean: '3.8 links / msg',
          interpretation: 'New templates incorporate QR code imagery and multiple redirect tracking links.'
        },
        {
          name: 'Multilingual / non-Latin characters',
          shiftPercent: 18.7,
          baselineMean: '0.4%',
          currentMean: '4.2%',
          interpretation: 'Rise in Cyrillic homoglyph lookalike characters attempting token obfuscation.'
        },
        {
          name: 'Financial urgency vocabulary frequency',
          shiftPercent: 14.1,
          baselineMean: '0.22 score',
          currentMean: '0.38 score',
          interpretation: 'Elevated urgency language related to fake tax penalties and unpaid bills.'
        }
      ],
      groundTruthEvaluation: {
        labeledSamples: 320,
        currentAccuracy: 96.8,
        baselineAccuracy: 98.4,
        falsePositiveRate: 1.15,
        baselineFPR: 0.60,
        latencyMs: 24,
        baselineLatencyMs: 22
      },
      geminiExplanation: 'Recent email message inputs differ noticeably from the September baseline (PSI score: 0.142 vs 0.080 threshold). Long fake invoice templates with multi-link redirects are shifting the feature distribution. Analyst ground truth on 320 recent cases indicates a slight accuracy dip to 96.8%. Recommend inspecting test cases in AI Detection Lab and preparing an updated candidate dataset.',
      reviewState: 'PENDING_REVIEW'
    },
    {
      id: 'sms-scam',
      name: 'SMS Scam Classifier',
      iconType: 'message-square',
      signalMonitored: 'SMS language/content distribution',
      recentStatus: 'No alert',
      lastChecked: '12 hours ago',
      lastCheckedExact: '2026-10-23 08:30 UTC',
      nextRunExact: '2026-10-24 08:30 UTC (in 12 hours)',
      deployedVersion: 'v1.0.3 (Active)',
      baselineWindow: '2026-09-01 to 2026-09-30 (N=240,000 SMS messages)',
      currentWindow: 'Last 7 Days (N=32,400 incoming SMS)',
      sampleCount: 32400,
      testMethod: 'Wasserstein Distance on Char N-Grams & Vocabulary Entropy',
      testStatistic: 0.029,
      threshold: 0.080,
      pValue: 0.512,
      divergentFeatures: [
        {
          name: 'Short-code URL presence',
          shiftPercent: 6.4,
          baselineMean: '18.2%',
          currentMean: '19.4%',
          interpretation: 'Bitly / TinyURL smishing link ratio stable across citizen telecommunications feeds.'
        },
        {
          name: 'Financial institution keyword mentions',
          shiftPercent: 3.1,
          baselineMean: '22.5%',
          currentMean: '23.2%',
          interpretation: 'Bank impersonation patterns remain within standard variance boundaries.'
        }
      ],
      groundTruthEvaluation: {
        labeledSamples: 680,
        currentAccuracy: 98.9,
        baselineAccuracy: 99.1,
        falsePositiveRate: 0.40,
        baselineFPR: 0.38,
        latencyMs: 18,
        baselineLatencyMs: 16
      },
      geminiExplanation: 'SMS scam incoming message stream is stable. Character N-gram divergence is minimal (Wasserstein distance: 0.029). Operational health and false-alarm rates remain optimal.',
      reviewState: 'NO_ACTION_REQUIRED'
    },
    {
      id: 'complaint-classifier',
      name: 'Complaint Classifier',
      iconType: 'file-text',
      signalMonitored: 'Complaint category distribution',
      recentStatus: 'No alert',
      lastChecked: '12 hours ago',
      lastCheckedExact: '2026-10-23 08:30 UTC',
      nextRunExact: '2026-10-24 08:30 UTC (in 12 hours)',
      deployedVersion: 'v1.2.1 (Active)',
      baselineWindow: '2026-09-01 to 2026-09-30 (N=18,500 citizen filings)',
      currentWindow: 'Last 7 Days (N=2,150 incoming filings)',
      sampleCount: 2150,
      testMethod: 'Chi-Square Goodness-of-Fit on 18 Jurisdictional Triage Classes',
      testStatistic: 0.041,
      threshold: 0.100,
      pValue: 0.290,
      divergentFeatures: [
        {
          name: 'Digital arrest / impersonation category',
          shiftPercent: 8.2,
          baselineMean: '12.4% share',
          currentMean: '13.4% share',
          interpretation: 'Expected gradual uptick in police impersonation reports; classification confidence remains high.'
        },
        {
          name: 'Part-time job / task fraud category',
          shiftPercent: 4.5,
          baselineMean: '16.1% share',
          currentMean: '16.8% share',
          interpretation: 'Jurisdictional triage category alignment intact.'
        }
      ],
      groundTruthEvaluation: {
        labeledSamples: 240,
        currentAccuracy: 95.8,
        baselineAccuracy: 96.0,
        falsePositiveRate: 0.90,
        baselineFPR: 0.85,
        latencyMs: 38,
        baselineLatencyMs: 36
      },
      geminiExplanation: 'Complaint classification categories conform to historical distribution bounds (Chi-Square p=0.290). No evidence of category drift.',
      reviewState: 'NO_ACTION_REQUIRED'
    },
    {
      id: 'cyber-ner',
      name: 'Cyber NER Transformer',
      iconType: 'box',
      signalMonitored: 'Entity extraction patterns',
      recentStatus: 'Review needed',
      lastChecked: '12 hours ago',
      lastCheckedExact: '2026-10-23 08:30 UTC',
      nextRunExact: '2026-10-24 08:30 UTC (in 12 hours)',
      deployedVersion: 'v2.0.1 (Active)',
      baselineWindow: '2026-09-01 to 2026-09-30 (N=50,000 OSINT & threat documents)',
      currentWindow: 'Last 7 Days (N=6,200 incoming OSINT feeds)',
      sampleCount: 6200,
      testMethod: 'Token OOV (Out-of-Vocabulary) & Entity Span Distribution Check',
      testStatistic: 0.118,
      threshold: 0.080,
      pValue: 0.007,
      divergentFeatures: [
        {
          name: 'TRC-20 & Solana wallet address formats',
          shiftPercent: 42.1,
          baselineMean: '3.1% entity density',
          currentMean: '12.8% entity density',
          interpretation: 'Sharp surge in alternative chain crypto address formats not fully represented in base BERT tokenizer.'
        },
        {
          name: 'Telegram channel and bot username handles',
          shiftPercent: 29.4,
          baselineMean: '2.1% share',
          currentMean: '8.4% share',
          interpretation: 'Scam syndicates operating primarily out of specialized Telegram group links and automated bots.'
        },
        {
          name: 'Obfuscated PowerShell / Base64 script tokens',
          shiftPercent: 19.2,
          baselineMean: '1.4% share',
          currentMean: '4.8% share',
          interpretation: 'IOC extraction seeing more multi-encoded script artifacts.'
        }
      ],
      groundTruthEvaluation: {
        labeledSamples: 180,
        currentAccuracy: 93.8,
        baselineAccuracy: 97.1,
        falsePositiveRate: 1.80,
        baselineFPR: 0.90,
        latencyMs: 42,
        baselineLatencyMs: 38
      },
      geminiExplanation: 'Entity extraction is experiencing significant distribution shift due to an influx of Solana/TRC-20 cryptocurrency wallet addresses and Telegram handle entities that were scarce in the baseline dataset. Extraction precision has dropped from 97.1% to 93.8% on recent analyst reviews. Recommend augmenting dataset with modern multi-chain crypto entities in Data Processing.',
      reviewState: 'PENDING_REVIEW'
    },
    {
      id: 'case-similarity',
      name: 'Case Similarity Transformer',
      iconType: 'share-2',
      signalMonitored: 'Similarity score distribution',
      recentStatus: 'No alert',
      lastChecked: '12 hours ago',
      lastCheckedExact: '2026-10-23 08:30 UTC',
      nextRunExact: '2026-10-24 08:30 UTC (in 12 hours)',
      deployedVersion: 'v1.4.0 (Active)',
      baselineWindow: '2026-09-01 to 2026-09-30 (N=15,000 paired case vectors)',
      currentWindow: 'Last 7 Days (N=1,800 similarity lookups)',
      sampleCount: 1800,
      testMethod: 'Cosine Distance Kernel Density Estimation (KDE)',
      testStatistic: 0.032,
      threshold: 0.080,
      pValue: 0.448,
      divergentFeatures: [
        {
          name: 'Cross-jurisdictional similarity scores',
          shiftPercent: 4.8,
          baselineMean: '0.62 mean cos-sim',
          currentMean: '0.65 mean cos-sim',
          interpretation: 'Vector embedding clusters are stable across inter-state police case correlations.'
        }
      ],
      groundTruthEvaluation: {
        labeledSamples: 150,
        currentAccuracy: 96.4,
        baselineAccuracy: 96.8,
        falsePositiveRate: 0.70,
        baselineFPR: 0.65,
        latencyMs: 32,
        baselineLatencyMs: 30
      },
      geminiExplanation: 'Case similarity vector space shows healthy clustering with no anomalous drift in pairwise cosine distances.',
      reviewState: 'NO_ACTION_REQUIRED'
    },
    {
      id: 'incident-urgency',
      name: 'Incident Urgency Classifier',
      iconType: 'bell',
      signalMonitored: 'Urgency class distribution',
      recentStatus: 'No alert',
      lastChecked: '12 hours ago',
      lastCheckedExact: '2026-10-23 08:30 UTC',
      nextRunExact: '2026-10-24 08:30 UTC (in 12 hours)',
      deployedVersion: 'v1.0.4 (Active)',
      baselineWindow: '2026-09-01 to 2026-09-30 (N=22,000 incidents)',
      currentWindow: 'Last 7 Days (N=2,900 incidents)',
      sampleCount: 2900,
      testMethod: 'Categorical Cross-Entropy Shift & Urgency Class Stability',
      testStatistic: 0.025,
      threshold: 0.080,
      pValue: 0.620,
      divergentFeatures: [
        {
          name: 'CRITICAL severity prediction ratio',
          shiftPercent: 2.1,
          baselineMean: '4.8% of cases',
          currentMean: '4.9% of cases',
          interpretation: 'Urgency triage prioritization ratio is consistent with operational dispatch capacity.'
        }
      ],
      groundTruthEvaluation: {
        labeledSamples: 210,
        currentAccuracy: 97.2,
        baselineAccuracy: 97.5,
        falsePositiveRate: 0.50,
        baselineFPR: 0.45,
        latencyMs: 16,
        baselineLatencyMs: 15
      },
      geminiExplanation: 'Incident urgency predictions continue to track baseline severity distribution closely. High-severity alerts remain calibrated.',
      reviewState: 'NO_ACTION_REQUIRED'
    },
    {
      id: 'cross-case-correlation',
      name: 'Cross-Case Correlation',
      iconType: 'network',
      signalMonitored: 'Relationship edge distribution',
      recentStatus: 'No alert',
      lastChecked: '12 hours ago',
      lastCheckedExact: '2026-10-23 08:30 UTC',
      nextRunExact: '2026-10-24 08:30 UTC (in 12 hours)',
      deployedVersion: 'v1.3.2 (Active)',
      baselineWindow: '2026-09-01 to 2026-09-30 (N=65,000 graph edges)',
      currentWindow: 'Last 7 Days (N=7,400 graph edges)',
      sampleCount: 7400,
      testMethod: 'Graph Degree & Edge Weight Spectral Distribution',
      testStatistic: 0.035,
      threshold: 0.080,
      pValue: 0.395,
      divergentFeatures: [
        {
          name: 'Bank account node clustering coefficient',
          shiftPercent: 5.4,
          baselineMean: '0.41',
          currentMean: '0.43',
          interpretation: 'Shared mule account subgraph structures reflect known syndicate topologies.'
        }
      ],
      groundTruthEvaluation: {
        labeledSamples: 190,
        currentAccuracy: 95.1,
        baselineAccuracy: 95.5,
        falsePositiveRate: 1.10,
        baselineFPR: 1.05,
        latencyMs: 48,
        baselineLatencyMs: 45
      },
      geminiExplanation: 'Graph relationship edge distributions demonstrate steady structural behavior. Link prediction confidence matches historical baselines.',
      reviewState: 'NO_ACTION_REQUIRED'
    }
  ]);

  // Selected model for bottom panel (null initially to match reference image)
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  // Filter state (e.g. when clicking 'Needs review' card)
  const [filterNeedsReview, setFilterNeedsReview] = useState<boolean>(false);

  // Loading state when user triggers a manual check
  const [isRunningCheck, setIsRunningCheck] = useState<boolean>(false);
  const [checkSuccessToast, setCheckSuccessToast] = useState<string | null>(null);

  // Review Task Modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [reviewDecision, setReviewDecision] = useState<'CONTINUE_MONITORING' | 'COLLECT_LABELS' | 'PIPELINE_FIX' | 'RETRAIN_CANDIDATE'>('CONTINUE_MONITORING');
  const [reviewNotes, setReviewNotes] = useState<string>('');

  // Selected Model Object
  const selectedModel = useMemo(() => {
    return monitoredModels.find(m => m.id === selectedModelId) || null;
  }, [monitoredModels, selectedModelId]);

  // Counts
  const totalMonitored = monitoredModels.length; // 8
  const needsReviewCount = monitoredModels.filter(m => m.recentStatus === 'Review needed').length; // 2

  // Filtered rows for the table
  const displayedModels = useMemo(() => {
    if (filterNeedsReview) {
      return monitoredModels.filter(m => m.recentStatus === 'Review needed');
    }
    return monitoredModels;
  }, [monitoredModels, filterNeedsReview]);

  // Model Icon Renderer
  const renderModelIcon = (iconType: MonitoredModelRecord['iconType']) => {
    switch (iconType) {
      case 'globe':
        return <Globe className="w-4 h-4 text-emerald-400" />;
      case 'mail':
        return <Mail className="w-4 h-4 text-emerald-400" />;
      case 'message-square':
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case 'file-text':
        return <FileText className="w-4 h-4 text-emerald-400" />;
      case 'box':
        return <Box className="w-4 h-4 text-emerald-400" />;
      case 'share-2':
        return <Share2 className="w-4 h-4 text-emerald-400" />;
      case 'bell':
        return <Bell className="w-4 h-4 text-emerald-400" />;
      case 'network':
        return <Network className="w-4 h-4 text-emerald-400" />;
      default:
        return <Activity className="w-4 h-4 text-emerald-400" />;
    }
  };

  // Trigger manual monitoring check
  const handleRunCheck = () => {
    if (!selectedModel) return;
    setIsRunningCheck(true);
    setCheckSuccessToast(null);

    setTimeout(() => {
      setIsRunningCheck(false);
      setCheckSuccessToast(`Monitoring check completed for ${selectedModel.name}. Signals refreshed at ${new Date().toLocaleTimeString()}.`);
      
      // Update the model's timestamp
      setMonitoredModels(prev => prev.map(m => {
        if (m.id === selectedModel.id) {
          return {
            ...m,
            lastChecked: 'Just now',
            lastCheckedExact: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
          };
        }
        return m;
      }));

      setTimeout(() => {
        setCheckSuccessToast(null);
      }, 5000);
    }, 1200);
  };

  // Handle Save Review Task
  const handleSaveReview = () => {
    if (!selectedModel) return;

    setMonitoredModels(prev => prev.map(m => {
      if (m.id === selectedModel.id) {
        return {
          ...m,
          operatorReviewNotes: reviewNotes || 'Operator investigated drift signal. Outcome documented in audit trail.',
          reviewState: reviewDecision === 'CONTINUE_MONITORING' ? 'CONTINUE_MONITORING' : 
                       reviewDecision === 'COLLECT_LABELS' ? 'COLLECT_LABELS' : 
                       reviewDecision === 'RETRAIN_CANDIDATE' ? 'RETRAIN_PROPOSED' : 'CONTINUE_MONITORING'
        };
      }
      return m;
    }));

    setIsReviewModalOpen(false);
    setReviewNotes('');
    setCheckSuccessToast(`Review task recorded for ${selectedModel.name}. Outcome logged in Model Audit Reports.`);
    setTimeout(() => setCheckSuccessToast(null), 5000);
  };

  return (
    <div className="flex flex-col gap-5 w-full text-slate-200">
      
      {/* 1. TOP HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00e676]/10 border border-[#00e676]/25 flex items-center justify-center text-[#00e676] shrink-0 mt-0.5 shadow-[0_0_12px_rgba(0,230,118,0.2)]">
            <Activity className="w-4 h-4 text-[#00e676]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold uppercase tracking-wider text-white font-mono">
                MONITORING &amp; DRIFT
              </h1>
            </div>
            <p className="text-xs text-[#8fa396] mt-0.5">
              Review model health and investigate meaningful changes in incoming data or model performance.
            </p>
          </div>
        </div>

        {/* Right Badge: MONITORING CONFIGURED */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e676]/10 border border-[#00e676]/40 text-[#00e676] text-[11px] font-mono font-bold tracking-wider shadow-[0_0_10px_rgba(0,230,118,0.15)]">
            <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
            <span>MONITORING CONFIGURED</span>
          </div>
        </div>
      </div>

      {/* 2. SUMMARY METRIC CARDS (3 CARDS MATCHING SCREENSHOT) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Models monitored */}
        <div 
          onClick={() => setFilterNeedsReview(false)}
          className={`rounded-xl border p-4.5 transition-all cursor-pointer flex items-center gap-4 ${
            !filterNeedsReview 
              ? 'bg-[#0a120e] border-[#00e676]/30 shadow-[0_0_16px_rgba(0,230,118,0.08)]' 
              : 'bg-[#0a120e]/80 border-white/[0.08] hover:border-[#00e676]/30'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-[#00e676]/10 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0 shadow-[0_0_14px_rgba(0,230,118,0.15)]">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#8fa396] font-medium">Models monitored</div>
            <div className="text-3xl font-bold text-white font-mono tracking-tight mt-0.5">
              {totalMonitored}
            </div>
            <div className="text-[11px] text-[#6b8273] mt-0.5">
              Registered models
            </div>
          </div>
        </div>

        {/* Card 2: Needs review (Interactive filter) */}
        <div 
          onClick={() => setFilterNeedsReview(prev => !prev)}
          className={`rounded-xl border p-4.5 transition-all cursor-pointer flex items-center gap-4 group ${
            filterNeedsReview 
              ? 'bg-[#180e10] border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.18)]' 
              : 'bg-[#0a120e]/80 border-white/[0.08] hover:border-rose-500/40 hover:bg-[#120b0d]'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#8fa396] font-medium">Needs review</span>
              {filterNeedsReview && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                  FILTERED
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-rose-400 font-mono tracking-tight mt-0.5">
              {needsReviewCount}
            </div>
            <div className="text-[11px] text-[#6b8273] mt-0.5 group-hover:text-rose-400/80 transition-colors">
              Models with drift signals
            </div>
          </div>
        </div>

        {/* Card 3: Last monitoring run */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0a120e]/80 p-4.5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#00e676]/10 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0 shadow-[0_0_14px_rgba(0,230,118,0.15)]">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#8fa396] font-medium">Last monitoring run</div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight mt-0.5">
              12 hours ago
            </div>
            <div className="text-[11px] text-[#6b8273] mt-0.5">
              Next run: in 12 hours
            </div>
          </div>
        </div>

      </div>

      {/* Filter notification banner if active */}
      {filterNeedsReview && (
        <div className="px-4 py-2 rounded-lg bg-rose-950/30 border border-rose-500/30 flex items-center justify-between text-xs font-mono text-rose-300">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-rose-400" />
            <span>Showing models requiring attention ({displayedModels.length} of {totalMonitored})</span>
          </div>
          <button 
            onClick={() => setFilterNeedsReview(false)}
            className="hover:underline text-rose-400 font-bold"
          >
            Clear Filter (Show All 8)
          </button>
        </div>
      )}

      {/* Check Success Toast */}
      {checkSuccessToast && (
        <div className="px-4 py-2.5 rounded-lg bg-[#00e676]/10 border border-[#00e676]/30 flex items-center justify-between text-xs font-mono text-[#00e676] animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00e676]" />
            <span>{checkSuccessToast}</span>
          </div>
          <button onClick={() => setCheckSuccessToast(null)} className="text-[#8fa396] hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. MODEL MONITORING TABLE */}
      <div className="rounded-xl border border-white/[0.08] bg-[#070d0a]/90 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#09120e]/60 text-[11px] font-mono uppercase tracking-wider text-[#8fa396]">
                <th className="py-3 px-5 font-bold w-[26%]">Model</th>
                <th className="py-3 px-5 font-bold w-[30%]">Signal monitored</th>
                <th className="py-3 px-5 font-bold w-[18%]">Recent status</th>
                <th className="py-3 px-5 font-bold w-[14%]">Last checked</th>
                <th className="py-3 px-5 font-bold w-[12%] text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs font-mono">
              {displayedModels.map((row) => {
                const isSelected = selectedModelId === row.id;
                const isReviewNeeded = row.recentStatus === 'Review needed';

                return (
                  <tr 
                    key={row.id}
                    onClick={() => setSelectedModelId(row.id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-[#00e676]/[0.08] border-l-2 border-[#00e676]' 
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Column 1: Model */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0">
                          {renderModelIcon(row.iconType)}
                        </div>
                        <span className="font-sans font-bold text-white text-xs tracking-normal">
                          {row.name}
                        </span>
                      </div>
                    </td>

                    {/* Column 2: Signal monitored */}
                    <td className="py-3.5 px-5 text-slate-300">
                      {row.signalMonitored}
                    </td>

                    {/* Column 3: Recent status */}
                    <td className="py-3.5 px-5">
                      {isReviewNeeded ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>Review needed</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00e676]/10 border border-[#00e676]/30 text-[#00e676] text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00e676]" />
                          <span>No alert</span>
                        </div>
                      )}
                    </td>

                    {/* Column 4: Last checked */}
                    <td className="py-3.5 px-5 text-slate-400">
                      {row.lastChecked}
                    </td>

                    {/* Column 5: Action */}
                    <td className="py-3.5 px-5">
                      {isReviewNeeded ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedModelId(row.id);
                          }}
                          className="text-amber-400 hover:text-amber-300 font-bold hover:underline transition-colors flex items-center gap-1"
                        >
                          <span>Review</span>
                          <span className="text-xs">→</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedModelId(row.id);
                          }}
                          className="text-[#00e676] hover:text-[#00e676]/80 font-bold hover:underline transition-colors flex items-center gap-1"
                        >
                          <span>View details</span>
                          <span className="text-xs">→</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. SELECTED MODEL DETAILS PANEL */}
      <div className="rounded-xl border border-white/[0.08] bg-[#070d0a]/90 p-5 shadow-2xl">
        
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-5">
          <div className="flex items-center gap-2 text-white font-mono font-bold tracking-wider text-xs md:text-sm">
            <Table className="w-4 h-4 text-[#00e676]" />
            <span>SELECTED MODEL DETAILS</span>
            {selectedModel && (
              <span className="text-xs font-mono text-[#8fa396] font-normal ml-2">
                — {selectedModel.name}
              </span>
            )}
          </div>

          {selectedModel && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedModelId(null)}
                className="px-2.5 py-1 rounded-md text-[11px] font-mono text-[#8fa396] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors flex items-center gap-1.5"
              >
                <X className="w-3 h-3" />
                <span>Deselect</span>
              </button>
            </div>
          )}
        </div>

        {/* Panel Body: State A (Empty state matching screenshot exactly) */}
        {!selectedModel ? (
          <div className="flex flex-col">
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#030906] border border-white/[0.08] flex items-center justify-center text-[#4e725b] mb-4 shadow-[0_0_20px_rgba(0,230,118,0.05)]">
                <FileSearch className="w-8 h-8 text-[#4e725b]" />
              </div>
              <p className="text-xs font-mono text-[#8fa396] max-w-md">
                Select a model to inspect drift history and available evidence.
              </p>
            </div>

            {/* Bottom info banner matching screenshot exactly */}
            <div className="p-3.5 rounded-lg bg-[#050c08] border border-white/[0.06] flex items-center gap-3 text-xs font-mono text-[#8fa396] mt-4">
              <Info className="w-4 h-4 text-[#8fa396] shrink-0" />
              <span>Input drift alone does not prove reduced accuracy. Model-quality assessment requires suitable labels and evaluation.</span>
            </div>
          </div>
        ) : (
          /* Panel Body: State B (Detailed Inspection View for Selected Model) */
          <div className="flex flex-col gap-6 font-mono text-xs animate-in fade-in duration-150">
            
            {/* Top Meta Attributes Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-[#0a120e] border border-white/[0.06]">
                <div className="text-[10px] text-[#6b8273] uppercase tracking-wider">Deployed version</div>
                <div className="text-sm font-bold text-white mt-1">{selectedModel.deployedVersion}</div>
                <div className="text-[10px] text-[#8fa396] mt-0.5">Production release</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0a120e] border border-white/[0.06]">
                <div className="text-[10px] text-[#6b8273] uppercase tracking-wider">Latest check</div>
                <div className="text-sm font-bold text-white mt-1">{selectedModel.lastChecked}</div>
                <div className="text-[10px] text-[#8fa396] mt-0.5">{selectedModel.lastCheckedExact}</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0a120e] border border-white/[0.06]">
                <div className="text-[10px] text-[#6b8273] uppercase tracking-wider">Monitored signal</div>
                <div className="text-sm font-bold text-white mt-1 truncate" title={selectedModel.signalMonitored}>
                  {selectedModel.signalMonitored}
                </div>
                <div className="text-[10px] text-[#8fa396] mt-0.5">Continuous telemetry</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0a120e] border border-white/[0.06]">
                <div className="text-[10px] text-[#6b8273] uppercase tracking-wider">Review state</div>
                <div className="mt-1">
                  {selectedModel.recentStatus === 'Review needed' ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold text-[11px] border border-amber-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Review needed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#00e676]/10 text-[#00e676] font-bold text-[11px] border border-[#00e676]/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00e676]" />
                      No alert
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#8fa396] mt-0.5">
                  {selectedModel.reviewState === 'PENDING_REVIEW' ? 'Awaiting operator examination' : 'Documented & verified'}
                </div>
              </div>
            </div>

            {/* Drift Metric & Mathematical Methodology */}
            <div className="p-4 rounded-xl bg-[#08110c] border border-white/[0.06] flex flex-col gap-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#00e676]" />
                  <span className="text-white font-bold text-xs uppercase tracking-wider">
                    Statistical Test &amp; Sample Windows
                  </span>
                </div>
                <span className="text-[11px] text-[#8fa396]">
                  Method: <strong className="text-white">{selectedModel.testMethod}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mt-1">
                <div className="flex flex-col gap-1">
                  <span className="text-[#6b8273] text-[11px]">Baseline Reference Window:</span>
                  <span className="text-slate-200 font-medium">{selectedModel.baselineWindow}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#6b8273] text-[11px]">Current Observation Window:</span>
                  <span className="text-slate-200 font-medium">{selectedModel.currentWindow}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#6b8273] text-[11px]">Test Metric vs Threshold:</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${selectedModel.testStatistic > selectedModel.threshold ? 'text-amber-400' : 'text-[#00e676]'}`}>
                      {selectedModel.testStatistic.toFixed(3)}
                    </span>
                    <span className="text-slate-500">/ Threshold: {selectedModel.threshold.toFixed(3)}</span>
                    <span className="text-[10px] text-[#8fa396]">(p-val: {selectedModel.pValue.toFixed(3)})</span>
                  </div>
                </div>
              </div>

              {/* Progress bar representing statistic vs threshold */}
              <div className="mt-1">
                <div className="w-full h-2 rounded-full bg-white/[0.05] overflow-hidden relative">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      selectedModel.testStatistic > selectedModel.threshold 
                        ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]' 
                        : 'bg-[#00e676] shadow-[0_0_8px_rgba(0,230,118,0.5)]'
                    }`}
                    style={{ width: `${Math.min(100, (selectedModel.testStatistic / (selectedModel.threshold * 1.5)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Features with Significant Shift */}
            <div className="p-4 rounded-xl bg-[#08110c] border border-white/[0.06] flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#00e676]" />
                  <span className="text-white font-bold text-xs uppercase tracking-wider">
                    Feature Distribution Divergence Breakdown
                  </span>
                </div>
                <span className="text-[11px] text-[#8fa396]">
                  {selectedModel.divergentFeatures.length} Key Monitored Dimensions
                </span>
              </div>

              <div className="flex flex-col gap-2.5 mt-1">
                {selectedModel.divergentFeatures.map((feat, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#050b07] border border-white/[0.04] flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 text-xs">{feat.name}</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        feat.shiftPercent > 20 
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' 
                          : 'bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/30'
                      }`}>
                        +{feat.shiftPercent}% shift
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div>
                        <span className="text-[#6b8273]">Baseline: </span>
                        <span>{feat.baselineMean}</span>
                        <span className="mx-2 text-slate-600">→</span>
                        <span className="text-[#6b8273]">Current: </span>
                        <span className="text-slate-200 font-medium">{feat.currentMean}</span>
                      </div>
                      <div className="text-[11px] text-[#8fa396] italic">
                        {feat.interpretation}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Ground Truth & Operational Health */}
            {selectedModel.groundTruthEvaluation && (
              <div className="p-4 rounded-xl bg-[#08110c] border border-white/[0.06] flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#00e676]" />
                    <span className="text-white font-bold text-xs uppercase tracking-wider">
                      Ground Truth Performance &amp; Operational Health
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8fa396]">
                    N = {selectedModel.groundTruthEvaluation.labeledSamples} Analyst-Verified Outcomes
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-1">
                  <div className="p-2.5 rounded-lg bg-[#050b07] border border-white/[0.04]">
                    <span className="text-[#6b8273] text-[10px] uppercase">Current Accuracy</span>
                    <div className="text-base font-bold text-white mt-0.5">
                      {selectedModel.groundTruthEvaluation.currentAccuracy}%
                    </div>
                    <span className="text-[10px] text-[#8fa396]">
                      Baseline: {selectedModel.groundTruthEvaluation.baselineAccuracy}%
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#050b07] border border-white/[0.04]">
                    <span className="text-[#6b8273] text-[10px] uppercase">False Positive Rate</span>
                    <div className="text-base font-bold text-slate-200 mt-0.5">
                      {selectedModel.groundTruthEvaluation.falsePositiveRate}%
                    </div>
                    <span className="text-[10px] text-[#8fa396]">
                      Baseline: {selectedModel.groundTruthEvaluation.baselineFPR}%
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#050b07] border border-white/[0.04]">
                    <span className="text-[#6b8273] text-[10px] uppercase">Operational Latency</span>
                    <div className="text-base font-bold text-slate-200 mt-0.5">
                      {selectedModel.groundTruthEvaluation.latencyMs}ms
                    </div>
                    <span className="text-[10px] text-[#8fa396]">
                      Baseline: {selectedModel.groundTruthEvaluation.baselineLatencyMs}ms
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#050b07] border border-white/[0.04]">
                    <span className="text-[#6b8273] text-[10px] uppercase">Inference Error Rate</span>
                    <div className="text-base font-bold text-[#00e676] mt-0.5">
                      0.00%
                    </div>
                    <span className="text-[10px] text-[#8fa396]">
                      Zero runtime crash alerts
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* AI Operator Synthesis (Gemini 1.5 Pro) */}
            <div className="p-4 rounded-xl bg-[#091510] border border-[#00e676]/20 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[#00e676] font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>AI Operator Drift Synthesis (Gemini Engine)</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed font-sans">
                {selectedModel.geminiExplanation}
              </p>
              {selectedModel.operatorReviewNotes && (
                <div className="mt-2 p-2.5 rounded bg-black/40 border border-white/[0.06] text-xs">
                  <span className="text-[#00e676] font-bold">Recorded Operator Finding: </span>
                  <span className="text-slate-300">{selectedModel.operatorReviewNotes}</span>
                </div>
              )}
            </div>

            {/* Operator Actions & Operational Workflow Links (Section 6 & 7) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleRunCheck}
                  disabled={isRunningCheck}
                  className="px-3.5 py-1.5 rounded-lg bg-[#00e676]/10 hover:bg-[#00e676]/20 border border-[#00e676]/40 text-[#00e676] font-bold transition-all flex items-center gap-2 shadow-[0_0_12px_rgba(0,230,118,0.15)] disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRunningCheck ? 'animate-spin' : ''}`} />
                  <span>{isRunningCheck ? 'Recalculating...' : 'Run Check Now'}</span>
                </button>

                <button
                  onClick={() => onSelectTab('validation')}
                  className="px-3.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-white font-medium transition-colors flex items-center gap-1.5"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Test in AI Detection Lab</span>
                </button>

                <button
                  onClick={() => onSelectTab('model-versions')}
                  className="px-3.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-white font-medium transition-colors flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Open Model Versions</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold transition-colors flex items-center gap-1.5"
                >
                  <span>Record Investigation Decision</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bottom info banner matching screenshot */}
            <div className="p-3.5 rounded-lg bg-[#050c08] border border-white/[0.06] flex items-center gap-3 text-xs font-mono text-[#8fa396]">
              <Info className="w-4 h-4 text-[#8fa396] shrink-0" />
              <span>Input drift alone does not prove reduced accuracy. Model-quality assessment requires suitable labels and evaluation.</span>
            </div>

          </div>
        )}

      </div>

      {/* 5. RECORD INVESTIGATION DECISION MODAL */}
      {isReviewModalOpen && selectedModel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1410] border border-white/[0.1] rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Record Investigation Decision — {selectedModel.name}</span>
              </div>
              <button 
                onClick={() => setIsReviewModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300 font-sans text-xs">
              Document your investigation conclusion into the CCIP Model Audit Reports ledger. Decisions are cryptographically signed under your operator role.
            </p>

            <div className="flex flex-col gap-2">
              <label className="text-[#8fa396] text-[11px] font-bold">Investigation Outcome / Next Step:</label>
              
              <div className="grid grid-cols-1 gap-2">
                <label className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-start gap-3 ${
                  reviewDecision === 'CONTINUE_MONITORING' 
                    ? 'bg-[#00e676]/10 border-[#00e676]/40 text-white' 
                    : 'bg-[#050b07] border-white/[0.06] text-slate-300 hover:bg-white/[0.02]'
                }`}>
                  <input 
                    type="radio" 
                    name="decision" 
                    checked={reviewDecision === 'CONTINUE_MONITORING'} 
                    onChange={() => setReviewDecision('CONTINUE_MONITORING')} 
                    className="mt-1"
                  />
                  <div>
                    <div className="font-bold text-xs">Continue monitoring (Variance is expected or within tolerable scope)</div>
                    <div className="text-[11px] text-[#8fa396] mt-0.5">Maintain current baseline; no performance degradation observed on live traffic.</div>
                  </div>
                </label>

                <label className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-start gap-3 ${
                  reviewDecision === 'COLLECT_LABELS' 
                    ? 'bg-amber-500/10 border-amber-500/40 text-white' 
                    : 'bg-[#050b07] border-white/[0.06] text-slate-300 hover:bg-white/[0.02]'
                }`}>
                  <input 
                    type="radio" 
                    name="decision" 
                    checked={reviewDecision === 'COLLECT_LABELS'} 
                    onChange={() => setReviewDecision('COLLECT_LABELS')} 
                    className="mt-1"
                  />
                  <div>
                    <div className="font-bold text-xs">Collect more evaluation labels (Dataset Management)</div>
                    <div className="text-[11px] text-[#8fa396] mt-0.5">Queue recent incoming cases for manual specialist annotation before making update decisions.</div>
                  </div>
                </label>

                <label className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-start gap-3 ${
                  reviewDecision === 'RETRAIN_CANDIDATE' 
                    ? 'bg-amber-500/10 border-amber-500/40 text-white' 
                    : 'bg-[#050b07] border-white/[0.06] text-slate-300 hover:bg-white/[0.02]'
                }`}>
                  <input 
                    type="radio" 
                    name="decision" 
                    checked={reviewDecision === 'RETRAIN_CANDIDATE'} 
                    onChange={() => setReviewDecision('RETRAIN_CANDIDATE')} 
                    className="mt-1"
                  />
                  <div>
                    <div className="font-bold text-xs">Trigger candidate retraining (Model Training)</div>
                    <div className="text-[11px] text-[#8fa396] mt-0.5">Drift has impacted model performance; prepare a retrained candidate version.</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#8fa396] text-[11px] font-bold">Operator Investigation Notes:</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Document what features shifted, pipeline observations, or justification for this decision..."
                rows={3}
                className="w-full bg-[#050b07] border border-white/[0.08] rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00e676]/40 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReview}
                className="px-4 py-2 rounded-lg bg-[#00e676] hover:bg-[#00e676]/90 text-black text-xs font-bold transition-colors flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,230,118,0.3)]"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Review Audit Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
