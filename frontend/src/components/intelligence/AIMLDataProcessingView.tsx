import React, { useState } from 'react';
import { 
  GitBranch, 
  Plus, 
  Info, 
  Cpu, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  BookOpen, 
  Activity, 
  FileCheck2, 
  Sliders, 
  Clock, 
  ArrowRight, 
  Eye, 
  MoreVertical, 
  X, 
  Check, 
  AlertTriangle, 
  Terminal, 
  Database, 
  ShieldCheck, 
  Sparkles,
  RefreshCw,
  FileText
} from 'lucide-react';
import { ModelMetric } from '../../types';

export interface PipelineItem {
  id: string;
  name: string;
  tag: string;
  tagColor: 'green' | 'blue' | 'purple' | 'amber';
  version: string;
  description: string;
  inputFormats: string;
  targetRate: string;
  stepsCount: number;
  status: 'Specification Ready' | 'Running' | 'Idle' | 'Disabled';
  lastUpdated: string;
  owner: string;
  iconType: 'audio' | 'text' | 'image' | 'generic';
  steps: {
    stepNumber: number;
    title: string;
    description: string;
  }[];
}

export interface ExecutionHistoryItem {
  jobId: string;
  pipeline: string;
  dataset: string;
  type: 'Processing' | 'Augmentation';
  status: 'Completed' | 'Failed' | 'Running' | 'Queued';
  startedAt: string;
  duration: string;
  processed: string;
  errors: number;
  operator: string;
}

interface AIMLDataProcessingViewProps {
  onSelectTab: (tab: string) => void;
}

export const AIMLDataProcessingView: React.FC<AIMLDataProcessingViewProps> = ({
  onSelectTab
}) => {
  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'pipelines' | 'augmentation'>('pipelines');

  // Active Cluster & Pipeline State
  const [workerStatus, setWorkerStatus] = useState<'Idle' | 'Running' | 'Offline'>('Idle');
  const [activeJobsCount, setActiveJobsCount] = useState(0);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isAllExecutionsModalOpen, setIsAllExecutionsModalOpen] = useState(false);
  const [selectedPipelineForDetails, setSelectedPipelineForDetails] = useState<PipelineItem | null>(null);
  const [selectedPipelineForRun, setSelectedPipelineForRun] = useState<PipelineItem | null>(null);
  const [selectedDatasetForRun, setSelectedDatasetForRun] = useState('Complaint_Triage_2024 (v2.1)');
  const [outputVersionTag, setOutputVersionTag] = useState('v2.2-clean');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Pipelines State matching reference screenshot exactly
  const [pipelines, setPipelines] = useState<PipelineItem[]>([
    {
      id: 'pipe-01',
      name: 'Pipeline #01: Acoustic FFT Spectrogram Extraction',
      tag: 'AUDIO',
      tagColor: 'green',
      version: 'v1.0',
      description: 'Convert audio to spectrograms for voice-based phishing detection.',
      inputFormats: '.wav, .mp3',
      targetRate: '1,200 samples/sec',
      stepsCount: 4,
      status: 'Specification Ready',
      lastUpdated: '12 Jun 2026, 10:24 AM',
      owner: 'Naveen',
      iconType: 'audio',
      steps: [
        { stepNumber: 1, title: 'Audio Resampling & Format Normalization', description: 'Converts input audio stream to 16kHz mono PCM waveform.' },
        { stepNumber: 2, title: 'Silence Trimming & Noise Gate', description: 'Strips leading/trailing silent segments below -40dB threshold.' },
        { stepNumber: 3, title: 'Short-Time Fourier Transform (STFT)', description: 'Generates linear FFT matrix using 512-point Hanning window.' },
        { stepNumber: 4, title: 'Mel-Scale Log Energy Projection', description: 'Calculates 80-band Mel-spectrogram tensor ready for PyTorch ingestion.' }
      ]
    },
    {
      id: 'pipe-02',
      name: 'Pipeline #02: Anonymization & PII Masking Pipeline',
      tag: 'TEXT',
      tagColor: 'blue',
      version: 'v1.1',
      description: 'Detect and mask personally identifiable information (PII) from text data.',
      inputFormats: '.json, .txt, .csv',
      targetRate: 'Zero-Leak',
      stepsCount: 6,
      status: 'Specification Ready',
      lastUpdated: '10 Jun 2026, 03:15 PM',
      owner: 'S. Kumar',
      iconType: 'text',
      steps: [
        { stepNumber: 1, title: 'Schema & Encoding Sanitization', description: 'Validates UTF-8 compliance and enforces JSON/CSV structural schemas.' },
        { stepNumber: 2, title: 'Indian Statutory PII Regex Scan', description: 'Detects Aadhaar (12-digit UIDAI), PAN, Passport, and Phone numbers.' },
        { stepNumber: 3, title: 'Banking Token Redaction (UPI / IFSC / Card)', description: 'Masks account numbers and VPAs with synthetic salt hashes (******4321).' },
        { stepNumber: 4, title: 'DeBERTa-NER Named Entity Masking', description: 'Identifies person names, victim residences, and organization names.' },
        { stepNumber: 5, title: 'Split Separation & Deduplication', description: 'Removes near-duplicate narratives and prevents evaluation set leakage.' },
        { stepNumber: 6, title: 'Cryptographic SHA-256 Output Manifest', description: 'Computes cryptographic hash and writes sanitized output to dataset registry.' }
      ]
    },
    {
      id: 'pipe-03',
      name: 'Pipeline #03: Synthetic Contrastive Augmentation',
      tag: 'IMAGE',
      tagColor: 'purple',
      version: 'v1.0',
      description: 'Generate synthetic variations for contrastive learning.',
      inputFormats: '.png, .jpg',
      targetRate: '240 pairs/sec',
      stepsCount: 5,
      status: 'Specification Ready',
      lastUpdated: '08 Jun 2026, 11:40 AM',
      owner: 'Naveen',
      iconType: 'image',
      steps: [
        { stepNumber: 1, title: 'Image Normalization & Color Space Align', description: 'Standardizes input images to RGB 512x512 with normalized aspect ratios.' },
        { stepNumber: 2, title: 'Phishing DOM Artifact Perturbation', description: 'Introduces minor typography distortions and fake form overlays.' },
        { stepNumber: 3, title: 'Affine Transformation & Resolution Jitter', description: 'Applies +/- 15% random scaling, shearing, and JPEG compression noise.' },
        { stepNumber: 4, title: 'Positive / Negative Pair Association', description: 'Pairs authentic portal logos with fraudulent clone screenshot templates.' },
        { stepNumber: 5, title: 'Embedding Index Generation', description: 'Calculates contrastive loss targets and exports balanced pair tensor splits.' }
      ]
    }
  ]);

  // Synthetic Augmentation Tab Pipelines
  const augmentationJobs: PipelineItem[] = [
    {
      id: 'aug-01',
      name: 'Job #01: Adversarial URL Homoglyph & Lexical Generator',
      tag: 'URL',
      tagColor: 'amber',
      version: 'v2.0',
      description: 'Generate IDN homograph attacks and punycode obfuscations for URL Phishing training.',
      inputFormats: '.csv, .parquet',
      targetRate: '4,500 pairs/sec',
      stepsCount: 4,
      status: 'Specification Ready',
      lastUpdated: '05 Jun 2026, 09:10 AM',
      owner: 'Naveen',
      iconType: 'text',
      steps: [
        { stepNumber: 1, title: 'Top-500 Legitimate Banking Domains Ingestion', description: 'Loads sovereign whitelisted Indian banking & government root domains.' },
        { stepNumber: 2, title: 'Cyrillic & Unicode Homoglyph Substitution', description: 'Generates visual spoof duplicates replacing Latin characters (e.g., sbi.co.in).' },
        { stepNumber: 3, title: 'Typosquatting & Bit-Flipping Mutation', description: 'Simulates single-character insertion, deletion, and keyboard proximity errors.' },
        { stepNumber: 4, title: 'Pair Construction & Label Generation', description: 'Outputs labeled (authentic, adversarial_spoof) contrastive pairs.' }
      ]
    },
    {
      id: 'aug-02',
      name: 'Job #02: Multi-Dialect Smishing Narrative Paraphraser',
      tag: 'TEXT',
      tagColor: 'blue',
      version: 'v1.4',
      description: 'Paraphrase SMS fraud templates into Hindi, Hinglish, and regional vernacular variants.',
      inputFormats: '.json, .txt',
      targetRate: '350 texts/sec',
      stepsCount: 3,
      status: 'Specification Ready',
      lastUpdated: '01 Jun 2026, 04:20 PM',
      owner: 'A. Perera',
      iconType: 'text',
      steps: [
        { stepNumber: 1, title: 'Smishing Seed Lure Parsing', description: 'Extracts core scam mechanics (OTP urgency, electricity cutoff, lottery).' },
        { stepNumber: 2, title: 'Back-Translation & Vernacular Phrasing', description: 'Translates seed texts through Hindi/Hinglish language models.' },
        { stepNumber: 3, title: 'Synthetic APK & Shortlink Injection', description: 'Randomly populates lures with synthetic .apk and bit.ly spoof links.' }
      ]
    }
  ];

  // Execution History State matching reference screenshot exactly
  const [executions, setExecutions] = useState<ExecutionHistoryItem[]>([
    {
      jobId: 'DP-2026-008',
      pipeline: '#02 PII Masking',
      dataset: 'Complaint_Triage_2024',
      type: 'Processing',
      status: 'Completed',
      startedAt: '12 Jun 2026, 08:14 AM',
      duration: '12m 34s',
      processed: '420K records',
      errors: 0,
      operator: 'Naveen'
    },
    {
      jobId: 'DP-2026-007',
      pipeline: '#01 Spectrogram',
      dataset: 'Voice_Scam_2024',
      type: 'Processing',
      status: 'Completed',
      startedAt: '11 Jun 2026, 02:21 PM',
      duration: '8m 12s',
      processed: '96K samples',
      errors: 0,
      operator: 'S. Kumar'
    },
    {
      jobId: 'DP-2026-006',
      pipeline: '#03 Augmentation',
      dataset: 'URL_Phishing_2024',
      type: 'Augmentation',
      status: 'Failed',
      startedAt: '10 Jun 2026, 11:03 AM',
      duration: '6m 48s',
      processed: '12K pairs',
      errors: 123,
      operator: 'Naveen'
    },
    {
      jobId: 'DP-2026-005',
      pipeline: '#02 PII Masking',
      dataset: 'Email_Threat_2024',
      type: 'Processing',
      status: 'Completed',
      startedAt: '09 Jun 2026, 10:27 AM',
      duration: '14m 02s',
      processed: '850K records',
      errors: 0,
      operator: 'A. Perera'
    },
    {
      jobId: 'DP-2026-004',
      pipeline: '#03 Augmentation',
      dataset: 'Adversarial_URL_Set',
      type: 'Augmentation',
      status: 'Completed',
      startedAt: '08 Jun 2026, 06:45 PM',
      duration: '22m 10s',
      processed: '50K pairs',
      errors: 0,
      operator: 'Naveen'
    }
  ]);

  // Handle Pipeline Execution Dispatch
  const handleExecutePipeline = () => {
    if (!selectedPipelineForRun) return;

    const newJobId = `DP-2026-${String(executions.length + 9).padStart(3, '0')}`;
    const startTime = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newExec: ExecutionHistoryItem = {
      jobId: newJobId,
      pipeline: selectedPipelineForRun.name.replace('Pipeline ', '').slice(0, 15),
      dataset: selectedDatasetForRun.split(' ')[0],
      type: activeSubTab === 'pipelines' ? 'Processing' : 'Augmentation',
      status: 'Running',
      startedAt: startTime,
      duration: 'In Progress',
      processed: 'Starting...',
      errors: 0,
      operator: 'Naveen'
    };

    setExecutions(prev => [newExec, ...prev]);
    setActiveJobsCount(prev => prev + 1);
    setWorkerStatus('Running');
    setSelectedPipelineForRun(null);

    setFeedbackMessage(`JOB DISPATCHED: [${newJobId}] assigned to local Celery worker partition. Processing ${selectedDatasetForRun}.`);

    // Simulate completion after 5 seconds
    setTimeout(() => {
      setExecutions(prev => prev.map(e => e.jobId === newJobId ? {
        ...e,
        status: 'Completed',
        duration: '2m 18s',
        processed: '250K records'
      } : e));
      setActiveJobsCount(prev => Math.max(0, prev - 1));
      setWorkerStatus('Idle');
    }, 5000);

    setTimeout(() => setFeedbackMessage(null), 6000);
  };

  const renderPipelineIcon = (type: PipelineItem['iconType']) => {
    switch (type) {
      case 'audio':
        return <Activity className="w-5 h-5 text-emerald-400" />;
      case 'text':
        return <FileCheck2 className="w-5 h-5 text-emerald-400" />;
      case 'image':
        return <Layers className="w-5 h-5 text-emerald-400" />;
      default:
        return <Sliders className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-5 text-content-primary animate-in fade-in duration-200">
      {/* 1. TOP HEADER matching reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <GitBranch className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">ETL Pipelines & Synthetic Augmentation Jobs</h1>
            <p className="text-xs text-[#8fa396]">
              Process, clean, transform and augment datasets for CCIP AI models.
            </p>
          </div>
        </div>

        {/* Warning Badge & Create Pipeline Button */}
        <div className="flex items-center gap-3 self-start sm:self-auto font-mono text-xs">
          <div className="px-3.5 py-1.5 rounded-xl border border-amber-500/40 bg-amber-950/20 text-amber-300 flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Background pipeline not configured</span>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-[#07130e] font-bold tracking-wide flex items-center gap-2 shadow-[0_0_20px_rgba(0,230,118,0.35)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3] text-black" />
            <span>Create Pipeline</span>
          </button>
        </div>
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

      {/* 2. SUMMARY / WORKER CLUSTER CARDS (4 Cards Grid) matching reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Worker Cluster Status */}
        <div className="p-4 rounded-2xl bg-[#0c1310]/95 border border-emerald-900/40 shadow-xl backdrop-blur-md flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Cpu className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs text-[#8fa396] block">Worker Cluster Status</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${workerStatus === 'Running' ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`}></span>
              <span className="text-sm font-bold font-mono text-emerald-400">{workerStatus}</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-mono mt-0.5 leading-tight">
              Celery/Redis cluster ready. Jobs run when workers are online.
            </span>
          </div>
        </div>

        {/* Card 2: Active Jobs */}
        <div className="p-4 rounded-2xl bg-[#0c1310]/95 border border-emerald-900/40 shadow-xl backdrop-blur-md flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Play className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs text-[#8fa396] block">Active Jobs</span>
            <div className="flex items-baseline gap-1.5 mt-0.5 font-mono">
              <span className="text-2xl font-bold text-white">{activeJobsCount}</span>
              <span className="text-xs text-slate-400">of 3</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-mono mt-0.5">Running in background</span>
          </div>
        </div>

        {/* Card 3: Completed (24h) */}
        <div className="p-4 rounded-2xl bg-[#0c1310]/95 border border-emerald-900/40 shadow-xl backdrop-blur-md flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs text-[#8fa396] block">Completed (24h)</span>
            <div className="flex items-baseline gap-2 mt-0.5 font-mono">
              <span className="text-2xl font-bold text-white">8</span>
              <span className="text-xs text-emerald-400">↑ 2</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-mono mt-0.5">Successful jobs</span>
          </div>
        </div>

        {/* Card 4: Failed (24h) */}
        <div className="p-4 rounded-2xl bg-[#0c1310]/95 border border-emerald-900/40 shadow-xl backdrop-blur-md flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <XCircle className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <span className="text-xs text-[#8fa396] block">Failed (24h)</span>
            <div className="flex items-baseline gap-2 mt-0.5 font-mono">
              <span className="text-2xl font-bold text-white">1</span>
              <span className="text-xs text-rose-400">↑ 1</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-mono mt-0.5">Requires attention</span>
          </div>
        </div>
      </div>

      {/* 3. SUB-TABS & PIPELINE GUIDE BUTTON matching reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-6 font-mono text-xs">
          <button
            onClick={() => setActiveSubTab('pipelines')}
            className={`pb-1 flex items-center gap-2 transition-colors relative cursor-pointer ${
              activeSubTab === 'pipelines' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>Data Processing Pipelines ({pipelines.length})</span>
            {activeSubTab === 'pipelines' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('augmentation')}
            className={`pb-1 flex items-center gap-2 transition-colors relative cursor-pointer ${
              activeSubTab === 'augmentation' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Synthetic Augmentation Jobs ({augmentationJobs.length})</span>
            {activeSubTab === 'augmentation' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
            )}
          </button>
        </div>

        <button
          onClick={() => setIsGuideModalOpen(true)}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl border border-emerald-500/40 hover:bg-emerald-950/40 text-emerald-400 text-xs font-mono font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          <span>Pipeline Guide</span>
        </button>
      </div>

      {/* 4. PIPELINE CARDS LIST matching reference */}
      <div className="space-y-3 font-sans">
        {(activeSubTab === 'pipelines' ? pipelines : augmentationJobs).map((p) => (
          <div
            key={p.id}
            className="p-4 sm:p-5 rounded-2xl bg-[#0c1310]/95 border border-emerald-900/40 hover:border-emerald-500/50 shadow-xl backdrop-blur-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            {/* Left: Icon + Title + Tags + Specs */}
            <div className="flex items-start gap-4 flex-1 min-w-[320px]">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)] mt-0.5">
                {renderPipelineIcon(p.iconType)}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-sm font-bold text-white font-mono tracking-tight">
                    {p.name}
                  </span>

                  {/* Modality Tag */}
                  {p.tagColor === 'green' && (
                    <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold">
                      {p.tag}
                    </span>
                  )}
                  {p.tagColor === 'blue' && (
                    <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-500/40 text-blue-400 text-[10px] font-mono font-bold">
                      {p.tag}
                    </span>
                  )}
                  {p.tagColor === 'purple' && (
                    <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/40 text-purple-400 text-[10px] font-mono font-bold">
                      {p.tag}
                    </span>
                  )}
                  {p.tagColor === 'amber' && (
                    <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-400 text-[10px] font-mono font-bold">
                      {p.tag}
                    </span>
                  )}

                  {/* Version Tag */}
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 text-[10px] font-mono font-bold">
                    {p.version}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-[#8fa396] mt-1 font-sans">
                  {p.description}
                </p>

                {/* Input Specs Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-2.5 font-mono text-[11px]">
                  <span className="px-2.5 py-1 rounded-lg bg-[#121c17] border border-emerald-900/30 text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-slate-400" />
                    <span>Input: {p.inputFormats}</span>
                  </span>

                  <span className="px-2.5 py-1 rounded-lg bg-[#121c17] border border-emerald-900/30 text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3 h-3 text-emerald-400" />
                    <span>Target: {p.targetRate}</span>
                  </span>

                  <span className="px-2.5 py-1 rounded-lg bg-[#121c17] border border-emerald-900/30 text-slate-300 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-cyan-400" />
                    <span>Steps: {p.stepsCount}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Middle: Status & Metadata */}
            <div className="pl-16 lg:pl-0 font-mono text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{p.status}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Last updated: {p.lastUpdated}
              </div>
              <div className="text-[11px] text-[#8fa396]">
                Owner: {p.owner}
              </div>
            </div>

            {/* Right: Stacked Action Buttons matching reference */}
            <div className="flex flex-col gap-2 shrink-0 self-end lg:self-auto min-w-[150px]">
              {/* Primary Run Pipeline Button */}
              <button
                onClick={() => setSelectedPipelineForRun(p)}
                className="px-4 py-2 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-[#07130e] text-xs font-bold font-mono tracking-wide flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(0,230,118,0.3)] transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Run Pipeline</span>
              </button>

              {/* View Details + More Menu */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedPipelineForDetails(p)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#121c17] hover:bg-[#182620] border border-slate-700/80 hover:border-emerald-500/80 text-slate-300 hover:text-white text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                <button
                  onClick={() => setSelectedPipelineForDetails(p)}
                  className="p-1.5 rounded-xl bg-[#121c17] hover:bg-[#182620] border border-slate-700/80 hover:border-emerald-500/80 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="More actions"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 5. RECENT PIPELINE EXECUTIONS TABLE matching reference */}
      <div className="rounded-2xl bg-[#0c1310]/95 border border-emerald-900/40 p-5 sm:p-6 shadow-xl backdrop-blur-md flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-emerald-900/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Recent Pipeline Executions</h3>
              <p className="text-xs text-[#8fa396]">Latest execution history for data processing and augmentation jobs.</p>
            </div>
          </div>

          <button
            onClick={() => setIsAllExecutionsModalOpen(true)}
            className="text-xs font-mono text-slate-300 hover:text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>View All Executions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-emerald-900/40 text-[#8fa396] text-[11px] uppercase tracking-wider bg-[#09110d]/80">
                <th className="py-3 px-3 font-semibold">JOB ID</th>
                <th className="py-3 px-3 font-semibold">PIPELINE</th>
                <th className="py-3 px-3 font-semibold">DATASET</th>
                <th className="py-3 px-3 font-semibold">TYPE</th>
                <th className="py-3 px-3 font-semibold">STATUS</th>
                <th className="py-3 px-3 font-semibold">STARTED AT</th>
                <th className="py-3 px-3 font-semibold">DURATION</th>
                <th className="py-3 px-3 font-semibold">PROCESSED</th>
                <th className="py-3 px-3 font-semibold">ERRORS</th>
                <th className="py-3 px-3 font-semibold">OPERATOR</th>
                <th className="py-3 px-3 font-semibold text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/20 font-sans">
              {executions.map((row) => {
                const isCompleted = row.status === 'Completed';
                const isFailed = row.status === 'Failed';
                const isRunning = row.status === 'Running';

                return (
                  <tr key={row.jobId} className="hover:bg-[#121d17]/80 transition-colors">
                    {/* Job ID */}
                    <td className="py-3 px-3 font-mono text-cyan-400 font-bold whitespace-nowrap">
                      {row.jobId}
                    </td>

                    {/* Pipeline */}
                    <td className="py-3 px-3 text-slate-200 whitespace-nowrap font-mono">
                      {row.pipeline}
                    </td>

                    {/* Dataset */}
                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap font-sans">
                      {row.dataset}
                    </td>

                    {/* Type */}
                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap font-sans">
                      {row.type}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-xs">
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Completed
                        </span>
                      )}
                      {isFailed && (
                        <span className="inline-flex items-center gap-1.5 text-rose-400 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                          Failed
                        </span>
                      )}
                      {isRunning && (
                        <span className="inline-flex items-center gap-1.5 text-cyan-400 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                          Running
                        </span>
                      )}
                    </td>

                    {/* Started At */}
                    <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                      {row.startedAt}
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                      {row.duration}
                    </td>

                    {/* Processed */}
                    <td className="py-3 px-3 font-mono text-slate-200 whitespace-nowrap">
                      {row.processed}
                    </td>

                    {/* Errors */}
                    <td className="py-3 px-3 font-mono whitespace-nowrap font-bold">
                      <span className={row.errors > 0 ? 'text-rose-400' : 'text-slate-400'}>
                        {row.errors}
                      </span>
                    </td>

                    {/* Operator */}
                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap font-mono text-xs">
                      {row.operator}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setFeedbackMessage(`Inspecting audit trace for job [${row.jobId}].`);
                            setTimeout(() => setFeedbackMessage(null), 3000);
                          }}
                          className="p-1.5 rounded-lg border border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-emerald-400 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setFeedbackMessage(`Opening log stream for [${row.jobId}].`);
                            setTimeout(() => setFeedbackMessage(null), 3000);
                          }}
                          className="p-1.5 rounded-lg border border-slate-700 hover:border-emerald-500 text-slate-400 hover:text-white transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. MODAL: RUN PIPELINE EXECUTION DIALOG */}
      {selectedPipelineForRun && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0a100d] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
            <div className="px-6 py-4 border-b border-emerald-900/40 flex items-center justify-between bg-[#0e1713]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Play className="w-5 h-5 fill-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Execute ETL Transformation</h3>
                  <p className="text-xs font-mono text-emerald-400">{selectedPipelineForRun.name}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPipelineForRun(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 font-mono text-xs text-slate-300">
              <div>
                <label className="text-slate-300 block mb-1">Source Dataset to Process *</label>
                <select
                  value={selectedDatasetForRun}
                  onChange={(e) => setSelectedDatasetForRun(e.target.value)}
                  className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                >
                  <option value="Complaint_Triage_2024 (v2.1)">Complaint_Triage_2024 (v2.1) — 420K records</option>
                  <option value="URL_Phishing_2024 (v3.1)">URL_Phishing_2024 (v3.1) — 1.2M URLs</option>
                  <option value="Email_Threat_2024 (v2.0)">Email_Threat_2024 (v2.0) — 850K emails</option>
                  <option value="SMS_Scam_Collection (v1.5)">SMS_Scam_Collection (v1.5) — 620K messages</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Output Derived Version Tag *</label>
                <input
                  type="text"
                  value={outputVersionTag}
                  onChange={(e) => setOutputVersionTag(e.target.value)}
                  className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-1 font-sans">
                <span className="text-white font-bold block text-xs">Pipeline Execution Sequence</span>
                <div className="space-y-1 text-[11px] text-[#8fa396] pt-1">
                  {selectedPipelineForRun.steps.map((st) => (
                    <div key={st.stepNumber} className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] flex items-center justify-center shrink-0">
                        {st.stepNumber}
                      </span>
                      <span>{st.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-emerald-900/40 bg-[#0e1713] flex justify-end gap-2.5 font-mono text-xs">
              <button
                onClick={() => setSelectedPipelineForRun(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePipeline}
                className="px-4 py-2 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-black font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(0,230,118,0.3)]"
              >
                Dispatch to Cluster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: PIPELINE DETAILS & STEP DOSSIER */}
      {selectedPipelineForDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0a100d] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
            <div className="px-6 py-4 border-b border-emerald-900/40 flex items-center justify-between bg-[#0e1713]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  {renderPipelineIcon(selectedPipelineForDetails.iconType)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">{selectedPipelineForDetails.name}</h3>
                  <p className="text-xs font-mono text-emerald-400">SPECIFICATION DOSSIER • {selectedPipelineForDetails.version}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPipelineForDetails(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono text-slate-300 max-h-[70vh]">
              <div className="p-3.5 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-1 font-sans">
                <span className="text-[10px] text-[#8fa396] font-mono uppercase block">Objective</span>
                <p className="text-white text-xs leading-relaxed">{selectedPipelineForDetails.description}</p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-white uppercase block">Transformation Stage Sequence ({selectedPipelineForDetails.stepsCount} Steps)</span>
                {selectedPipelineForDetails.steps.map((st) => (
                  <div key={st.stepNumber} className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/30 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                      {st.stepNumber}
                    </span>
                    <div>
                      <span className="text-white font-bold block">{st.title}</span>
                      <p className="text-[#8fa396] text-[11px] font-sans mt-0.5 leading-relaxed">{st.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-emerald-900/40 bg-[#0e1713] flex justify-between items-center font-mono text-xs">
              <button
                onClick={() => {
                  const p = selectedPipelineForDetails;
                  setSelectedPipelineForDetails(null);
                  setSelectedPipelineForRun(p);
                }}
                className="px-4 py-2 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-black font-bold flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Run This Pipeline</span>
              </button>
              <button
                onClick={() => setSelectedPipelineForDetails(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white"
              >
                Close Specification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: PIPELINE ARCHITECTURAL GUIDE */}
      {isGuideModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0a100d] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
            <div className="px-6 py-4 border-b border-emerald-900/40 flex items-center justify-between bg-[#0e1713]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">CCIP Asynchronous ETL Worker Architecture</h3>
                  <p className="text-xs font-mono text-emerald-400">CELERY & REDIS QUEUE INFRASTRUCTURE</p>
                </div>
              </div>
              <button onClick={() => setIsGuideModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono text-slate-300 max-h-[70vh]">
              <div className="p-3.5 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-1 font-sans">
                <span className="text-white font-bold block">1. Task Broker & Asynchronous Worker Nodes</span>
                <p className="text-[#8fa396] text-xs leading-relaxed">
                  When an operator clicks "Run Pipeline", the CCIP backend writes the job parameters to the Redis broker queue. Distributed Celery worker processes pick up the job, streaming progress indicators back through WebSocket updates.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-1 font-sans">
                <span className="text-white font-bold block">2. Zero-Leak PII Anonymization Standard</span>
                <p className="text-[#8fa396] text-xs leading-relaxed">
                  The PII Masking pipeline enforces two-stage redaction: regex pattern matching for standardized Indian ID formats (Aadhaar, PAN, Bank VPAs) and DeBERTa token classification for person and address extraction.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-1 font-sans">
                <span className="text-white font-bold block">3. Lineage Preservation Guarantee</span>
                <p className="text-[#8fa396] text-xs leading-relaxed">
                  Every transformation writes an immutable SHA-256 tree hash and saves derived files with a new version identifier, guaranteeing that original training data is never silently overwritten.
                </p>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-emerald-900/40 bg-[#0e1713] flex justify-end font-mono text-xs">
              <button
                onClick={() => setIsGuideModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL: CREATE NEW PIPELINE DEFINITION */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0a100d] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
            <div className="px-6 py-4 border-b border-emerald-900/40 flex items-center justify-between bg-[#0e1713]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Plus className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Create Pipeline Specification</h3>
                  <p className="text-xs font-mono text-emerald-400">REGISTER NEW ETL TRANSFORMATION</p>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsCreateModalOpen(false);
                setFeedbackMessage('New pipeline specification registered and cataloged.');
                setTimeout(() => setFeedbackMessage(null), 4000);
              }}
              className="p-6 space-y-4 font-mono text-xs"
            >
              <div>
                <label className="text-slate-300 block mb-1">Pipeline Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pipeline #04: Cyber Threat URL Lexical Extractor"
                  className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Modality Tag</label>
                  <select className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500">
                    <option value="TEXT">TEXT</option>
                    <option value="URL">URL</option>
                    <option value="AUDIO">AUDIO</option>
                    <option value="IMAGE">IMAGE</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Initial Version</label>
                  <input
                    type="text"
                    defaultValue="v1.0"
                    className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Transformation Description *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Extracts lexical and structural domain features for zero-hour phishing classification..."
                  className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans resize-none"
                />
              </div>

              <div className="pt-3 border-t border-emerald-900/40 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono transition-all"
                >
                  Save Specification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. MODAL: VIEW ALL EXECUTIONS AUDIT TRAIL */}
      {isAllExecutionsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-[#0a100d] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
            <div className="px-6 py-4 border-b border-emerald-900/40 flex items-center justify-between bg-[#0e1713]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Complete ETL Pipeline Execution Audit Ledger</h3>
                  <p className="text-xs font-mono text-emerald-400">IMMUTABLE JOB LOGS</p>
                </div>
              </div>
              <button onClick={() => setIsAllExecutionsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 font-mono text-xs max-h-[70vh]">
              {executions.map((e) => (
                <div key={e.jobId} className="p-3.5 rounded-xl bg-[#121c17] border border-emerald-900/30 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-cyan-400 font-bold">{e.jobId}</span> • <span className="text-white font-bold">{e.pipeline}</span> on <span className="text-slate-300">{e.dataset}</span>
                    <p className="text-[11px] text-[#8fa396] font-sans mt-0.5">Processed {e.processed} in {e.duration} ({e.errors} errors)</p>
                  </div>
                  <div className="text-right text-[11px]">
                    <div className="text-slate-400">{e.startedAt}</div>
                    <div className={e.status === 'Completed' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {e.status} (by {e.operator})
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 border-t border-emerald-900/40 bg-[#0e1713] flex justify-end font-mono text-xs">
              <button
                onClick={() => setIsAllExecutionsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
              >
                Close Audit Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
