import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Search, 
  RefreshCw, 
  Plus, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Edit3, 
  MoreHorizontal, 
  ShieldCheck, 
  FlaskConical, 
  FileText, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Link2, 
  Mail, 
  MessageSquare, 
  ListFilter, 
  GitBranch, 
  BarChart3, 
  Clock, 
  Download, 
  ArrowRight,
  Lock,
  Terminal,
  Sliders,
  Shield
} from 'lucide-react';
import { apiClient } from '../../api/client';

export interface DatasetItem {
  id: string;
  name: string;
  description: string;
  version: string;
  type: 'Training' | 'Validation' | 'Test';
  models: string;
  filesSamples: string;
  size: string;
  source: string;
  status: 'Validated' | 'Processing' | 'Needs Review' | 'Restricted';
  updatedAt: string;
  updatedBy: string;
  iconType: 'link' | 'mail' | 'sms' | 'file' | 'ner' | 'branch' | 'shield' | 'chart';
  datasetHash: string;
  storagePath: string;
  license: string;
  privacyClassification: 'RESTRICTED_PII_REDACTED' | 'SYNTHETIC_ANONYMOUS' | 'INTERNAL_CONFIDENTIAL';
}

interface AIMLDatasetManagementViewProps {
  onSelectTab: (tab: string) => void;
}

export const AIMLDatasetManagementView: React.FC<AIMLDatasetManagementViewProps> = ({
  onSelectTab
}) => {
  // Master Datasets matching the reference screenshot exactly
  const [datasets, setDatasets] = useState<DatasetItem[]>([
    {
      id: 'ds-1',
      name: 'URL_Phishing_2024',
      description: 'Phishing and benign URLs',
      version: 'v3.1',
      type: 'Training',
      models: 'URL Detector',
      filesSamples: '1.2M URLs',
      size: '3.4 GB',
      source: 'TI Feeds + Public',
      status: 'Validated',
      updatedAt: '12 Jun 2026',
      updatedBy: 'Naveen',
      iconType: 'link',
      datasetHash: '9a8b1c4d7e2f3a5b6c8d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
      storagePath: 's3://ccip-datasets-enclave/url_phishing_2024/v3.1/',
      license: 'Government Open Data + CERT-In Feeds',
      privacyClassification: 'RESTRICTED_PII_REDACTED'
    },
    {
      id: 'ds-2',
      name: 'Email_Threat_2024',
      description: 'Malicious and benign emails',
      version: 'v2.0',
      type: 'Training',
      models: 'Email Classifier',
      filesSamples: '850K Emails',
      size: '2.1 GB',
      source: 'IOC Feeds + Corp.',
      status: 'Validated',
      updatedAt: '10 Jun 2026',
      updatedBy: 'S. Kumar',
      iconType: 'mail',
      datasetHash: '87e209ab14bcdef0123456789abcdef0123456789abcdef0123456789abcdef0',
      storagePath: 's3://ccip-datasets-enclave/email_threat_2024/v2.0/',
      license: 'Commercial Threat Feed License',
      privacyClassification: 'RESTRICTED_PII_REDACTED'
    },
    {
      id: 'ds-3',
      name: 'SMS_Scam_Collection',
      description: 'Smishing and spam messages',
      version: 'v1.5',
      type: 'Training',
      models: 'SMS Classifier',
      filesSamples: '620K Messages',
      size: '1.2 GB',
      source: 'Citizen Reports',
      status: 'Validated',
      updatedAt: '08 Jun 2026',
      updatedBy: 'Naveen',
      iconType: 'sms',
      datasetHash: '34a1789c8ef0123456789abcdef0123456789abcdef0123456789abcdef01234',
      storagePath: 's3://ccip-datasets-enclave/sms_scam_collection/v1.5/',
      license: '1930 Helpline Citizen Intake Permitted Use',
      privacyClassification: 'RESTRICTED_PII_REDACTED'
    },
    {
      id: 'ds-4',
      name: 'Complaint_Triage_2024',
      description: 'Cybercrime complaint texts',
      version: 'v2.1',
      type: 'Training',
      models: 'Complaint Classifier',
      filesSamples: '420K Records',
      size: '1.8 GB',
      source: 'CCIP Cases',
      status: 'Validated',
      updatedAt: '05 Jun 2026',
      updatedBy: 'A. Perera',
      iconType: 'file',
      datasetHash: 'f4b2e81a390d4567890123456789abcdef0123456789abcdef0123456789abcd',
      storagePath: 's3://ccip-datasets-enclave/complaint_triage_2024/v2.1/',
      license: 'Sovereign Law Enforcement Shared Corpus',
      privacyClassification: 'RESTRICTED_PII_REDACTED'
    },
    {
      id: 'ds-5',
      name: 'Cyber_NER_Corpus',
      description: 'Annotated cyber entities',
      version: 'v1.3',
      type: 'Training',
      models: 'NER Transformer',
      filesSamples: '310K Texts',
      size: '1.1 GB',
      source: 'Public + Internal',
      status: 'Validated',
      updatedAt: '02 Jun 2026',
      updatedBy: 'Naveen',
      iconType: 'ner',
      datasetHash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      storagePath: 's3://ccip-datasets-enclave/cyber_ner_corpus/v1.3/',
      license: 'MIT + CCIP Enclave Curated',
      privacyClassification: 'SYNTHETIC_ANONYMOUS'
    },
    {
      id: 'ds-6',
      name: 'Case_Similarity_Set',
      description: 'Case descriptions & metadata',
      version: 'v1.0',
      type: 'Training',
      models: 'Case Similarity',
      filesSamples: '280K Cases',
      size: '900 MB',
      source: 'CCIP Cases',
      status: 'Processing',
      updatedAt: '01 Jun 2026',
      updatedBy: 'R. Silva',
      iconType: 'branch',
      datasetHash: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
      storagePath: 's3://ccip-datasets-enclave/case_similarity_set/v1.0/',
      license: 'Anonymized Police FIR Repository',
      privacyClassification: 'RESTRICTED_PII_REDACTED'
    },
    {
      id: 'ds-7',
      name: 'Adversarial_URL_Set',
      description: 'Adversarial test samples',
      version: 'v1.0',
      type: 'Test',
      models: 'URL Detector',
      filesSamples: '50K URLs',
      size: '220 MB',
      source: 'Generated',
      status: 'Validated',
      updatedAt: '28 May 2026',
      updatedBy: 'Naveen',
      iconType: 'shield',
      datasetHash: '7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c',
      storagePath: 's3://ccip-datasets-enclave/adversarial_url_set/v1.0/',
      license: 'Synthetic Adversarial Engine',
      privacyClassification: 'SYNTHETIC_ANONYMOUS'
    },
    {
      id: 'ds-8',
      name: 'Model_Eval_Benchmark',
      description: 'Unified model evaluation set',
      version: 'v1.0',
      type: 'Validation',
      models: 'All Models',
      filesSamples: '200K Samples',
      size: '600 MB',
      source: 'Curated',
      status: 'Validated',
      updatedAt: '25 May 2026',
      updatedBy: 'S. Kumar',
      iconType: 'chart',
      datasetHash: '3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
      storagePath: 's3://ccip-datasets-enclave/model_eval_benchmark/v1.0/',
      license: 'Sovereign Enclave Benchmark Standard',
      privacyClassification: 'SYNTHETIC_ANONYMOUS'
    },
    {
      id: 'ds-9',
      name: 'Mule_Bank_Transactions_2026',
      description: 'UPI and IMPS illicit flow logs',
      version: 'v1.2',
      type: 'Training',
      models: 'Crypto & Bank Graph',
      filesSamples: '150K Trans',
      size: '540 MB',
      source: '1930 Bank Feeds',
      status: 'Validated',
      updatedAt: '20 May 2026',
      updatedBy: 'Naveen',
      iconType: 'branch',
      datasetHash: '4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b',
      storagePath: 's3://ccip-datasets-enclave/mule_bank_transactions/v1.2/',
      license: 'NPCI / RBI Controlled Financial Intelligence',
      privacyClassification: 'INTERNAL_CONFIDENTIAL'
    },
    {
      id: 'ds-10',
      name: 'Voice_Deepfake_Benchmark',
      description: 'Synthesized acoustic spoof tests',
      version: 'v2.0',
      type: 'Validation',
      models: 'VoiceGuard',
      filesSamples: '48K Audios',
      size: '4.6 GB',
      source: 'Sovereign Enclave',
      status: 'Validated',
      updatedAt: '15 May 2026',
      updatedBy: 'Dr. Thorne',
      iconType: 'shield',
      datasetHash: '5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c',
      storagePath: 's3://ccip-datasets-enclave/voice_deepfake_benchmark/v2.0/',
      license: 'Acoustic Defense Lab Synthetic Dataset',
      privacyClassification: 'SYNTHETIC_ANONYMOUS'
    },
    {
      id: 'ds-11',
      name: 'Telegram_Fraud_Narratives',
      description: 'Investment scam chat exports',
      version: 'v1.0',
      type: 'Validation',
      models: 'Complaint Classifier',
      filesSamples: '95K Chats',
      size: '380 MB',
      source: 'Citizen Reports',
      status: 'Validated',
      updatedAt: '10 May 2026',
      updatedBy: 'A. Perera',
      iconType: 'sms',
      datasetHash: '6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d',
      storagePath: 's3://ccip-datasets-enclave/telegram_fraud_narratives/v1.0/',
      license: 'Public Scam Repository',
      privacyClassification: 'RESTRICTED_PII_REDACTED'
    },
    {
      id: 'ds-12',
      name: 'Zero_Day_Exploit_Payloads',
      description: 'Quarantine test samples',
      version: 'v1.1',
      type: 'Test',
      models: 'All Models',
      filesSamples: '12K Payloads',
      size: '180 MB',
      source: 'CERT-In Directives',
      status: 'Validated',
      updatedAt: '05 May 2026',
      updatedBy: 'Naveen',
      iconType: 'shield',
      datasetHash: '7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c',
      storagePath: 's3://ccip-datasets-enclave/zero_day_exploit_payloads/v1.1/',
      license: 'Classified Sovereign Enclave Threat Library',
      privacyClassification: 'INTERNAL_CONFIDENTIAL'
    }
  ]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [modelFilter, setModelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Pagination matching screenshot: showing 8 per page
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Modals
  const [selectedDataset, setSelectedDataset] = useState<DatasetItem | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isGovernanceModalOpen, setIsGovernanceModalOpen] = useState(false);
  const [editingDataset, setEditingDataset] = useState<DatasetItem | null>(null);

  // Register Form State
  const [registerForm, setRegisterForm] = useState({
    name: '',
    description: '',
    version: 'v1.0',
    type: 'Training' as DatasetItem['type'],
    models: 'URL Detector',
    filesSamples: '100K Samples',
    size: '500 MB',
    source: 'Citizen Reports (Anonymized)',
    license: 'Sovereign Law Enforcement Intake',
    privacyClassification: 'RESTRICTED_PII_REDACTED' as DatasetItem['privacyClassification']
  });

  // KPI Calculations
  const totalDatasetsCount = datasets.length;
  const trainingCount = datasets.filter(d => d.type === 'Training').length;
  const validationCount = datasets.filter(d => d.type === 'Validation').length;
  const testCount = datasets.filter(d => d.type === 'Test').length;

  const trainingPercent = Math.round((trainingCount / totalDatasetsCount) * 100);
  const validationPercent = Math.round((validationCount / totalDatasetsCount) * 100);
  const testPercent = Math.round((testCount / totalDatasetsCount) * 100);

  // Filtered Datasets
  const filteredDatasets = useMemo(() => {
    return datasets.filter(d => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.models.toLowerCase().includes(q) ||
        d.source.toLowerCase().includes(q);

      const matchesType = typeFilter === 'ALL' || d.type === typeFilter;
      const matchesModel = modelFilter === 'ALL' || d.models.toLowerCase().includes(modelFilter.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;

      return matchesSearch && matchesType && matchesModel && matchesStatus;
    });
  }, [datasets, searchQuery, typeFilter, modelFilter, statusFilter]);

  // Paginated Datasets
  const paginatedDatasets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDatasets.slice(start, start + pageSize);
  }, [filteredDatasets, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredDatasets.length / pageSize));

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await apiClient.getDatasets();
    } catch {}
    setTimeout(() => {
      setIsRefreshing(false);
      setFeedbackMessage('Dataset repository catalog refreshed and synchronized with Sovereign Enclave.');
      setTimeout(() => setFeedbackMessage(null), 4000);
    }, 450);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.name.trim()) return;

    const newDs: DatasetItem = {
      id: 'ds-' + Date.now(),
      name: registerForm.name.trim(),
      description: registerForm.description.trim() || 'Custom registered dataset',
      version: registerForm.version.trim(),
      type: registerForm.type,
      models: registerForm.models,
      filesSamples: registerForm.filesSamples,
      size: registerForm.size,
      source: registerForm.source,
      status: 'Processing',
      updatedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      updatedBy: 'Naveen',
      iconType: 'file',
      datasetHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      storagePath: `s3://ccip-datasets-enclave/${registerForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}/${registerForm.version}/`,
      license: registerForm.license,
      privacyClassification: registerForm.privacyClassification
    };

    setDatasets(prev => [newDs, ...prev]);
    setIsRegisterModalOpen(false);
    setFeedbackMessage(`DATASET REGISTERED: ${newDs.name} (${newDs.version}) cataloged. Quality validation job initiated.`);
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const renderIcon = (iconType: DatasetItem['iconType']) => {
    switch (iconType) {
      case 'link':
        return <Link2 className="w-4 h-4 text-emerald-400" />;
      case 'mail':
        return <Mail className="w-4 h-4 text-emerald-400" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case 'file':
        return <FileText className="w-4 h-4 text-emerald-400" />;
      case 'ner':
        return <ListFilter className="w-4 h-4 text-emerald-400" />;
      case 'branch':
        return <GitBranch className="w-4 h-4 text-emerald-400" />;
      case 'shield':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'chart':
        return <BarChart3 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Database className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-5 text-content-primary animate-in fade-in duration-200">
      {/* 1. TOP HEADER matching reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Database className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Dataset Management</h1>
            <p className="text-xs text-[#8fa396]">
              Manage training, validation, and test datasets for all CCIP AI models.
            </p>
          </div>
        </div>

        {/* Action Buttons: Data Governance & Register Dataset */}
        <div className="flex items-center gap-3 self-start sm:self-auto font-mono text-xs">
          <button
            onClick={() => setIsGovernanceModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-emerald-500/40 hover:bg-emerald-950/40 text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Data Governance</span>
          </button>

          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-[#07130e] font-bold tracking-wide flex items-center gap-2 shadow-[0_0_20px_rgba(0,230,118,0.35)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3] text-black" />
            <span>Register Dataset</span>
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

      {/* 2. SUMMARY CARDS (4 Cards Grid) matching reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Datasets */}
        <div className="p-4 rounded-2xl bg-[#0c1310]/95 border border-emerald-900/40 shadow-xl backdrop-blur-md flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Database className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs text-[#8fa396] block">Total Datasets</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono text-white">{totalDatasetsCount}</span>
              <span className="text-xs font-mono text-emerald-400">+2 this month</span>
            </div>
          </div>
        </div>

        {/* Card 2: Training Datasets */}
        <div className="p-4 rounded-2xl bg-[#0c1310]/95 border border-emerald-900/40 shadow-xl backdrop-blur-md flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Layers className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs text-[#8fa396] block">Training Datasets</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono text-white">{trainingCount}</span>
              <span className="text-xs font-mono text-emerald-400">{trainingPercent}%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Validation Datasets */}
        <div className="p-4 rounded-2xl bg-[#0c1310]/95 border border-emerald-900/40 shadow-xl backdrop-blur-md flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <FlaskConical className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <span className="text-xs text-[#8fa396] block">Validation Datasets</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono text-white">{validationCount}</span>
              <span className="text-xs font-mono text-cyan-400">{validationPercent}%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Test Datasets */}
        <div className="p-4 rounded-2xl bg-[#0c1310]/95 border border-emerald-900/40 shadow-xl backdrop-blur-md flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <span className="text-xs text-[#8fa396] block">Test Datasets</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono text-white">{testCount}</span>
              <span className="text-xs font-mono text-blue-400">{testPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & FILTER BAR matching reference */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search dataset name, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans transition-colors"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto font-mono text-xs">
          {/* All Types */}
          <div className="relative min-w-[130px]">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors appearance-none pr-8 cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="Training">Training</option>
              <option value="Validation">Validation</option>
              <option value="Test">Test</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>

          {/* All Models */}
          <div className="relative min-w-[135px]">
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors appearance-none pr-8 cursor-pointer"
            >
              <option value="ALL">All Models</option>
              <option value="URL Detector">URL Detector</option>
              <option value="Email Classifier">Email Classifier</option>
              <option value="SMS Classifier">SMS Classifier</option>
              <option value="Complaint Classifier">Complaint Classifier</option>
              <option value="NER Transformer">NER Transformer</option>
              <option value="Case Similarity">Case Similarity</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>

          {/* All Status */}
          <div className="relative min-w-[125px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors appearance-none pr-8 cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="Validated">Validated</option>
              <option value="Processing">Processing</option>
              <option value="Needs Review">Needs Review</option>
              <option value="Restricted">Restricted</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl border border-emerald-900/40 bg-[#121c17] text-slate-300 hover:text-white hover:border-emerald-500 transition-colors shrink-0"
            title="Refresh repository"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4. DATASET REPOSITORY TABLE matching reference */}
      <div className="rounded-2xl border border-emerald-900/40 bg-[#0c1310]/95 backdrop-blur-md shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-emerald-900/40 text-[#8fa396] text-[11px] uppercase tracking-wider bg-[#09110d]/90">
                <th className="py-3 px-3.5 font-semibold">NAME ↕</th>
                <th className="py-3 px-3 font-semibold">VERSION ↕</th>
                <th className="py-3 px-3 font-semibold">TYPE ↕</th>
                <th className="py-3 px-3 font-semibold">MODEL(S)</th>
                <th className="py-3 px-3 font-semibold">FILES / SAMPLES ↕</th>
                <th className="py-3 px-3 font-semibold">SIZE ↕</th>
                <th className="py-3 px-3 font-semibold">SOURCE ↕</th>
                <th className="py-3 px-3 font-semibold">STATUS ↕</th>
                <th className="py-3 px-3 font-semibold">UPDATED AT ↕</th>
                <th className="py-3 px-3 font-semibold text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/20 font-sans text-xs">
              {paginatedDatasets.length > 0 ? (
                paginatedDatasets.map((row) => {
                  const isValidated = row.status === 'Validated';
                  const isProcessing = row.status === 'Processing';

                  return (
                    <tr key={row.id} className="hover:bg-[#121d17]/80 transition-colors">
                      {/* Name + Icon + Subtitle */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                            {renderIcon(row.iconType)}
                          </div>
                          <div>
                            <button
                              onClick={() => setSelectedDataset(row)}
                              className="font-bold font-mono text-white hover:text-emerald-400 text-xs text-left"
                            >
                              {row.name}
                            </button>
                            <span className="text-[11px] text-[#8fa396] block font-sans">
                              {row.description}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Version */}
                      <td className="py-3 px-3 font-mono text-cyan-400 font-bold whitespace-nowrap">
                        {row.version}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {row.type === 'Training' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-bold">
                            <Layers className="w-3 h-3" />
                            Training
                          </span>
                        )}
                        {row.type === 'Validation' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-400 font-mono text-[10px] font-bold">
                            <FlaskConical className="w-3 h-3" />
                            Validation
                          </span>
                        )}
                        {row.type === 'Test' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-950/60 border border-blue-500/40 text-blue-400 font-mono text-[10px] font-bold">
                            <FileText className="w-3 h-3" />
                            Test
                          </span>
                        )}
                      </td>

                      {/* Model(s) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-slate-300 font-mono text-[11px]">
                          {row.models}
                        </span>
                      </td>

                      {/* Files / Samples */}
                      <td className="py-3 px-3 font-mono text-slate-200 whitespace-nowrap">
                        {row.filesSamples}
                      </td>

                      {/* Size */}
                      <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                        {row.size}
                      </td>

                      {/* Source */}
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap text-xs font-sans">
                        {row.source}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isValidated ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Validated
                          </span>
                        ) : isProcessing ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/50 border border-amber-500/40 text-amber-400 font-mono text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                            Processing
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 font-mono text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            {row.status}
                          </span>
                        )}
                      </td>

                      {/* Updated At */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                        <div className="text-slate-300">{row.updatedAt}</div>
                        <div className="text-[#8fa396] text-[10px]">{row.updatedBy}</div>
                      </td>

                      {/* Actions (View, Edit, Menu) */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedDataset(row)}
                            className="p-1.5 rounded-lg border border-slate-700/80 hover:border-emerald-500 text-slate-300 hover:text-emerald-400 transition-colors"
                            title="View Dataset Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingDataset(row)}
                            className="p-1.5 rounded-lg border border-slate-700/80 hover:border-emerald-500 text-slate-300 hover:text-emerald-400 transition-colors"
                            title="Edit Metadata"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDataset(row);
                            }}
                            className="p-1.5 rounded-lg border border-slate-700/80 hover:border-emerald-500 text-slate-300 hover:text-white transition-colors"
                            title="More Operations"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-xs text-[#8fa396] font-mono">
                    No datasets found matching the search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 5. TABLE FOOTER / PAGINATION matching reference */}
        <div className="px-4 py-3 border-t border-emerald-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-[#8fa396] bg-[#09110d]">
          <div>
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(filteredDatasets.length, currentPage * pageSize)} of {filteredDatasets.length} datasets
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`w-6 h-6 rounded border text-xs font-bold transition-colors ${
                  currentPage === idx + 1
                    ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {idx + 1}
              </button>
            ))}

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
              <option value={8}>8 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* 6. MODAL: REGISTER NEW DATASET */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0a100d] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
            <div className="px-6 py-4 border-b border-emerald-900/40 flex items-center justify-between bg-[#0e1713]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Register Training / Evaluation Dataset</h3>
                  <p className="text-xs font-mono text-emerald-400">SOVEREIGN CATALOG REPOSITORY</p>
                </div>
              </div>

              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Dataset Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UPI_Mule_Trans_2026"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Release Version</label>
                  <input
                    type="text"
                    required
                    value={registerForm.version}
                    onChange={(e) => setRegisterForm({ ...registerForm, version: e.target.value })}
                    className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Description / Content Summary *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Labeled transactions exhibiting rapid peeling chains"
                  value={registerForm.description}
                  onChange={(e) => setRegisterForm({ ...registerForm, description: e.target.value })}
                  className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Dataset Role / Type</label>
                  <select
                    value={registerForm.type}
                    onChange={(e) => setRegisterForm({ ...registerForm, type: e.target.value as any })}
                    className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Training">Training (Model Parameters)</option>
                    <option value="Validation">Validation (Hyperparameter Tuning)</option>
                    <option value="Test">Test (Independent Generalization)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Target Model Family</label>
                  <select
                    value={registerForm.models}
                    onChange={(e) => setRegisterForm({ ...registerForm, models: e.target.value })}
                    className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="URL Detector">URL Detector</option>
                    <option value="Email Classifier">Email Classifier</option>
                    <option value="SMS Classifier">SMS Classifier</option>
                    <option value="Complaint Classifier">Complaint Classifier</option>
                    <option value="NER Transformer">NER Transformer</option>
                    <option value="Case Similarity">Case Similarity</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Samples / Records Count</label>
                  <input
                    type="text"
                    value={registerForm.filesSamples}
                    onChange={(e) => setRegisterForm({ ...registerForm, filesSamples: e.target.value })}
                    className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Dataset Size</label>
                  <input
                    type="text"
                    value={registerForm.size}
                    onChange={(e) => setRegisterForm({ ...registerForm, size: e.target.value })}
                    className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-[11px] leading-relaxed">
                <strong>GOVERNANCE DIRECTIVE:</strong> Registering records the dataset in catalog inventory as <span className="font-mono text-slate-300">Processing</span>. Data Processing ETL checks must confirm zero unredacted PII before model admission.
              </div>

              <div className="pt-3 border-t border-emerald-900/40 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono transition-all"
                >
                  Register in Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: DATASET DETAILS DOSSIER */}
      {selectedDataset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0a100d] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
            <div className="px-6 py-4 border-b border-emerald-900/40 flex items-center justify-between bg-[#0e1713]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  {renderIcon(selectedDataset.iconType)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">{selectedDataset.name}</h3>
                  <p className="text-xs font-mono text-emerald-400">
                    VERSION {selectedDataset.version} • {selectedDataset.type.toUpperCase()} ROLE
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedDataset(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono text-slate-300 max-h-[75vh]">
              <div className="p-3.5 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-1 font-sans">
                <span className="text-[10px] text-[#8fa396] font-mono uppercase block">Description & Scope</span>
                <p className="text-white text-xs leading-relaxed">{selectedDataset.description}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[10px] text-[#8fa396] block">SAMPLE VOLUME</span>
                  <span className="text-emerald-400 font-bold text-sm">{selectedDataset.filesSamples}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[10px] text-[#8fa396] block">TOTAL SIZE</span>
                  <span className="text-white font-bold text-sm">{selectedDataset.size}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[10px] text-[#8fa396] block">TARGET MODEL</span>
                  <span className="text-white font-bold text-sm">{selectedDataset.models}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#121c17] border border-emerald-900/40">
                  <span className="text-[10px] text-[#8fa396] block">STATUS</span>
                  <span className="text-emerald-400 font-bold text-sm">{selectedDataset.status}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase">Cryptographic Integrity</span>
                  <span className="text-[10px] text-emerald-400 font-bold">SHA-256 SIGNED</span>
                </div>
                <div className="text-[10px] text-[#8fa396] break-all">
                  HASH: {selectedDataset.datasetHash}
                </div>
                <div className="text-[10px] text-slate-400 border-t border-emerald-900/30 pt-1.5 font-sans">
                  Storage URI: <span className="text-slate-200 font-mono">{selectedDataset.storagePath}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121c17] border border-emerald-900/40 grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-[#8fa396] block">License / Permitted Use:</span>
                  <span className="text-slate-200">{selectedDataset.license}</span>
                </div>
                <div>
                  <span className="text-[#8fa396] block">Privacy Gate:</span>
                  <span className="text-emerald-400">{selectedDataset.privacyClassification}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-emerald-900/40 bg-[#0e1713] flex justify-between items-center font-mono text-xs">
              <button
                onClick={() => {
                  setSelectedDataset(null);
                  onSelectTab('data-processing');
                }}
                className="text-emerald-400 hover:underline flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Process in Data Processing</span>
              </button>
              <button
                onClick={() => setSelectedDataset(null)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: DATA GOVERNANCE POLICY */}
      {isGovernanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0a100d] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
            <div className="px-6 py-4 border-b border-emerald-900/40 flex items-center justify-between bg-[#0e1713]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">CCIP AI Data Governance Directives</h3>
                  <p className="text-xs font-mono text-emerald-400">PRIVACY, QUALITY & LEAKAGE CONTROLS</p>
                </div>
              </div>
              <button onClick={() => setIsGovernanceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono text-slate-300 max-h-[70vh]">
              <div className="p-3.5 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-1 font-sans">
                <span className="text-white font-bold block">1. Citizen Evidence vs. Training Data Boundary</span>
                <p className="text-[#8fa396] text-xs leading-relaxed">
                  Submitted citizen complaints, bank statements, and identity documents stored in the Evidence Repository are strictly segregated from AI Training Datasets. No raw citizen intake is used for model training without explicit sanitization, duplicate removal, and PII anonymization.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-1 font-sans">
                <span className="text-white font-bold block">2. Training vs. Test Contamination Protection</span>
                <p className="text-[#8fa396] text-xs leading-relaxed">
                  Datasets marked as <strong>Test</strong> (such as Adversarial_URL_Set) are strictly firewalled from Model Training pipelines. They may only be consumed inside the AI Detection Lab for objective generalization assessment.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121c17] border border-emerald-900/40 space-y-1 font-sans">
                <span className="text-white font-bold block">3. Cryptographic Provenance Signatures</span>
                <p className="text-[#8fa396] text-xs leading-relaxed">
                  Every versioned dataset release produces an immutable SHA-256 tree hash. When a candidate model is submitted to Model Approval, its evaluation metrics are cryptographically verified against the exact dataset hash.
                </p>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-emerald-900/40 bg-[#0e1713] flex justify-end font-mono text-xs">
              <button
                onClick={() => setIsGovernanceModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
              >
                Acknowledge Directive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL: EDIT DATASET METADATA */}
      {editingDataset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0a100d] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
            <div className="px-6 py-4 border-b border-emerald-900/40 flex items-center justify-between bg-[#0e1713]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Edit Dataset Metadata</h3>
                  <p className="text-xs font-mono text-emerald-400">{editingDataset.name} • {editingDataset.version}</p>
                </div>
              </div>
              <button onClick={() => setEditingDataset(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 font-mono text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Description</label>
                <input
                  type="text"
                  value={editingDataset.description}
                  onChange={(e) => setEditingDataset({ ...editingDataset, description: e.target.value })}
                  className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Target Model Association</label>
                <input
                  type="text"
                  value={editingDataset.models}
                  onChange={(e) => setEditingDataset({ ...editingDataset, models: e.target.value })}
                  className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Source / Attribution</label>
                <input
                  type="text"
                  value={editingDataset.source}
                  onChange={(e) => setEditingDataset({ ...editingDataset, source: e.target.value })}
                  className="w-full bg-[#121c17] border border-emerald-900/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              <div className="pt-3 border-t border-emerald-900/40 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingDataset(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDatasets(prev => prev.map(d => d.id === editingDataset.id ? editingDataset : d));
                    setFeedbackMessage(`METADATA UPDATED: ${editingDataset.name} attributes saved.`);
                    setEditingDataset(null);
                    setTimeout(() => setFeedbackMessage(null), 4000);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
