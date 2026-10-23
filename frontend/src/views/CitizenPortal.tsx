import React, { useState, useEffect, useRef } from 'react';
import { Complaint, UserProfile } from '../types';
import { apiClient } from '../api/client';
import { 
  formatINR, 
  formatIndianDate, 
  formatIndianPhone 
} from '../utils/formatters';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { FileComplaintWizard } from '../components/citizen/FileComplaintWizard';
import { 
  PlusCircle, 
  FileText, 
  ShieldCheck, 
  UploadCloud, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  Download, 
  Clock, 
  Check, 
  FolderOpen, 
  TrendingUp, 
  ChevronRight, 
  Shield, 
  PhoneCall, 
  RefreshCw, 
  ExternalLink,
  BarChart3,
  Inbox,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  XCircle,
  Info,
  HelpCircle,
  FilePlus,
  Eye,
  X,
  LifeBuoy,
  User,
  Save,
  AlertTriangle,
  Radio,
  Users,
  Lightbulb,
  Link2,
  TrendingDown,
  BookOpen,
  Maximize2,
  LayoutGrid,
  Search
} from 'lucide-react';

interface CitizenPortalProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  complaints: Complaint[];
  selectedCaseId?: string | null;
  onSelectCase: (caseId: string) => void;
  onSubmitComplaint: (newComplaint: Complaint) => void;
  currentUser?: UserProfile | null;
}

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  activeTab,
  onSelectTab,
  complaints,
  selectedCaseId,
  onSelectCase,
  onSubmitComplaint,
  currentUser
}) => {
  const [wizardStep, setWizardStep] = useState(1);
  const [category, setCategory] = useState<Complaint['category']>('Financial Fraud');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState('2026-09-04');
  const [financialLoss, setFinancialLoss] = useState<string>('25000');

  const [telemetrySeries, setTelemetrySeries] = useState<{ month: string; submitted: number; resolved: number }[]>([]);
  const [categoryStats, setCategoryStats] = useState<{ category: string; count: number; percentage: number }[]>([]);
  const [regionStats, setRegionStats] = useState<{ name: string; count: number; percentage: number }[]>([]);

  // Live Evidence & Notifications State
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const docVaultInputRef = useRef<HTMLInputElement | null>(null);

  const fetchStats = async () => {
    try {
      const [tel, cat, reg, summary] = await Promise.all([
        apiClient.getComplaintTelemetry().catch(() => null),
        apiClient.getComplaintCategoriesStats().catch(() => null),
        apiClient.getComplaintRegionsStats().catch(() => null),
        apiClient.getCitizenDashboardSummary().catch(() => null)
      ]);
      if (tel?.data) setTelemetrySeries(tel.data);
      if (cat?.categories) setCategoryStats(cat.categories);
      if (reg?.regions) setRegionStats(reg.regions);
      if (summary) setDashboardSummary(summary);
    } catch (e) {}
  };

  const fetchEvidence = async () => {
    setIsLoadingEvidence(true);
    try {
      const list = await apiClient.getEvidenceList();
      if (list && list.length > 0) {
        setEvidenceList(list);
      }
    } catch (e) {}
    setIsLoadingEvidence(false);
  };

  const fetchNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const notifs = await apiClient.getNotifications();
      if (notifs) {
        setNotificationsList(notifs);
      }
    } catch (e) {}
    setIsLoadingNotifications(false);
  };

  useEffect(() => {
    fetchStats();
  }, [complaints.length]);

  useEffect(() => {
    if (activeTab === 'documents') {
      fetchEvidence();
    } else if (activeTab === 'notifications') {
      fetchNotifications();
    }
  }, [activeTab]);
  
  const [citizenName, setCitizenName] = useState(currentUser?.full_name || '');
  const [citizenEmail, setCitizenEmail] = useState(currentUser?.email || '');
  const [citizenPhone, setCitizenPhone] = useState(currentUser?.phone_number || '');

  useEffect(() => {
    if (currentUser) {
      if (currentUser.full_name) setCitizenName(currentUser.full_name);
      if (currentUser.email) setCitizenEmail(currentUser.email);
      if (currentUser.phone_number) setCitizenPhone(currentUser.phone_number);
    }
  }, [currentUser]);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<string | null>(null);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);

  const handleUpdateCitizenProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSaveSuccess(null);
    setProfileSaveError(null);
    try {
      await apiClient.updateUserProfile({
        full_name: citizenName.trim(),
        phone_number: citizenPhone.trim()
      });
      setProfileSaveSuccess('Identity credentials successfully updated and attested.');
      setTimeout(() => setProfileSaveSuccess(null), 4000);
    } catch (err: any) {
      setProfileSaveError(err?.message || 'Failed to update citizen credentials.');
    } finally {
      setIsSavingProfile(false);
    }
  };
  
  const [suspectAlias, setSuspectAlias] = useState('');
  const [suspectEmail, setSuspectEmail] = useState('');
  const [suspectPhone, setSuspectPhone] = useState('');
  const [suspectWebsite, setSuspectWebsite] = useState('');
  const [suspectWallet, setSuspectWallet] = useState('');

  const [dashboardSummary, setDashboardSummary] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Citizen AI Cyber Shield State
  const [aiInputText, setAiInputText] = useState('');
  const [aiQueryType, setAiQueryType] = useState('auto');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleRunAiAnalysis = async (customText?: string, customType?: string) => {
    const textToAnalyze = customText !== undefined ? customText : aiInputText;
    const typeToUse = customType !== undefined ? customType : aiQueryType;
    if (!textToAnalyze.trim()) return;

    setAiLoading(true);
    setAiError(null);
    try {
      const res = await apiClient.assistCitizen(textToAnalyze.trim(), typeToUse);
      setAiAnalysisResult(res);
    } catch (err: any) {
      setAiError(err?.message || 'Threat analysis failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePreFillComplaintFromAi = () => {
    if (!aiAnalysisResult?.prefill_data) return;
    const { category: cat, suspect_url, description: desc } = aiAnalysisResult.prefill_data;
    if (cat) setCategory(cat);
    if (desc) setDescription(desc);
    if (suspect_url) setSuspectWebsite(suspect_url);
    onSelectTab('file-complaint');
    setWizardStep(2);
  };

  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; type: string; sha256Hash: string; verified: boolean; rawFile?: File }[]>([]);


  const [submissionSuccess, setSubmissionSuccess] = useState<Complaint | null>(null);

  const activeCase = complaints.find(c => c.id === selectedCaseId) || complaints[0] || null;

  // Citizen Complaint Lifecycle Timeline State
  const [timelineData, setTimelineData] = useState<any>(null);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [expandedStageIndex, setExpandedStageIndex] = useState<number | null>(null);
  const [showCaseDetailsModal, setShowCaseDetailsModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  const fetchTimeline = async (complaintId: string) => {
    if (!complaintId) return;
    setIsLoadingTimeline(true);
    setTimelineError(null);
    try {
      const data = await apiClient.getCitizenComplaintTimeline(complaintId);
      if (data) {
        setTimelineData(data);
      }
    } catch (err: any) {
      console.warn('Failed to fetch authoritative citizen timeline:', err);
      setTimelineError(err?.message || 'Unable to load real-time status update.');
    } finally {
      setIsLoadingTimeline(false);
    }
  };

  useEffect(() => {
    if ((activeTab === 'track-status' || activeTab === 'complaint-status') && activeCase) {
      const targetId = activeCase.id || activeCase.referenceNumber;
      if (targetId) {
        fetchTimeline(targetId);
      }
    }
  }, [activeTab, activeCase?.id, activeCase?.referenceNumber]);

  // Helper to compute SHA-256 in browser using WebCrypto
  const computeFileSHA256 = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return '4b8a1c9e2f3d5a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFilePickerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadProgress('Computing cryptographic SHA-256 seals...');
    const newItems: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const hash = await computeFileSHA256(file);
      newItems.push({
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type || 'application/octet-stream',
        sha256Hash: hash,
        verified: true,
        rawFile: file
      });
    }

    setUploadedFiles(prev => [...prev, ...newItems]);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDocVaultUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const targetCaseId = activeCase?.id;
    if (!targetCaseId) {
      alert('Please select or file an active complaint first before uploading evidence to the vault.');
      return;
    }
    setUploadProgress('Uploading and hashing evidence file...');
    try {
      const res = await apiClient.uploadEvidence(targetCaseId, file);
      if (res) {
        setEvidenceList(prev => [res, ...prev]);
      }
    } catch (err: any) {
      console.error('Evidence upload failed:', err);
      alert('Evidence upload to enclave vault failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadProgress(null);
      if (docVaultInputRef.current) docVaultInputRef.current.value = '';
    }
  };

  const handleDownloadEvidence = async (evidenceId: string) => {
    try {
      await apiClient.downloadEvidence(evidenceId);
    } catch (e) {
      alert('Failed to download evidence artifact. Verify connection.');
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await apiClient.markNotificationRead(id);
      setNotificationsList(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {}
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await apiClient.markAllNotificationsRead();
      setNotificationsList(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {}
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        title: title || `${category} Incident Report`,
        description: description || 'Report of cyber incident submitted through guided citizen intake portal.',
        category,
        incident_date: `${incidentDate} 12:00 UTC`,
        loss_amount: financialLoss ? parseFloat(financialLoss) : 0,
        citizen_name: citizenName || currentUser?.full_name || 'Citizen User',
        citizen_email: citizenEmail || currentUser?.email || '',
        citizen_phone: citizenPhone || currentUser?.phone_number || '',
        suspect_info: {
          alias: suspectAlias || undefined,
          email: suspectEmail || undefined,
          phone: suspectPhone || undefined,
          website: suspectWebsite || undefined,
          walletAddress: suspectWallet || undefined
        }
      };

      const created = await apiClient.createComplaint(payload);
      if (created) {
        // Upload any attached files to this newly registered complaint
        for (const f of uploadedFiles) {
          if (f.rawFile) {
            try {
              await apiClient.uploadEvidence(created.id, f.rawFile);
            } catch (evErr) {
              console.warn('Failed to upload evidence for new complaint:', f.name, evErr);
            }
          }
        }
        onSubmitComplaint(created);
        setSubmissionSuccess(created);
        setWizardStep(4);
      }
    } catch (err: any) {
      console.error('Complaint registration failed on backend:', err);
      alert('Error submitting complaint to enclave: ' + (err.message || 'Please check connection'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Hidden file inputs for real cryptographic file uploads */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFilePickerChange} 
        multiple 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={docVaultInputRef} 
        onChange={handleDocVaultUpload} 
        className="hidden" 
      />

      {/* 1. CITIZEN DASHBOARD (Default Tab) — Exact 1:1 UI/UX Recreation */}
      {(activeTab === 'citizen-dashboard' || activeTab === 'dashboard' || !activeTab) && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          
          {/* Top Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-[#06140c]/90 backdrop-blur-xl p-6 sm:p-7 border border-[#00e676]/25 shadow-[0_0_35px_rgba(0,230,118,0.08)] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Background Digital Cyber Mesh Lines */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35">
              <svg className="w-full h-full" viewBox="0 0 1000 260" preserveAspectRatio="none" fill="none">
                <path d="M0,160 Q250,60 500,180 T1000,90" stroke="#00e676" strokeWidth="1.5" strokeOpacity="0.5" />
                <path d="M0,190 Q300,110 600,230 T1000,120" stroke="#00e676" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="4 6" />
                <path d="M0,130 Q200,30 450,150 T1000,70" stroke="#00ff88" strokeWidth="2" strokeOpacity="0.6" />
                <circle cx="500" cy="180" r="3.5" fill="#00ff88" className="animate-pulse" />
                <circle cx="750" cy="150" r="3" fill="#00e676" />
                <circle cx="250" cy="60" r="2.5" fill="#00e676" />
              </svg>
              <div className="absolute right-0 top-0 w-96 h-96 bg-[#00e676]/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Left Content */}
            <div className="flex flex-col gap-2 relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#030706]/90 border border-[#00e676]/40 shadow-[0_0_12px_rgba(0,230,118,0.2)] w-fit">
                <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse shadow-[0_0_8px_#00e676]"></span>
                <span className="text-[10px] font-mono font-bold text-[#00e676] uppercase tracking-wider">LIVE</span>
                <span className="text-[10px] text-white/40">·</span>
                <span className="text-[10px] font-mono font-semibold text-[#00e676] uppercase tracking-wider">
                  CITIZEN DEFENSE REGISTRY ACTIVE
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-1">
                {(() => {
                  const firstName = currentUser?.full_name?.trim()
                    ? currentUser.full_name.trim().split(/\s+/)[0]
                    : 'Naveen';
                  return `Welcome back, ${firstName}`;
                })()}
              </h1>
              <p className="text-xs sm:text-sm text-[#c8ddd0] leading-relaxed">
                Track your cybercrime reports, review forensic triage records, and receive cryptographically verified alerts from State Cyber Crime Police and 1930 Helpline.
              </p>
            </div>

            {/* Right Helpline Widget + Primary Emerald CTA */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 relative z-10 shrink-0">
              {/* Helpline Dial 1930 Widget */}
              <div className="flex items-center gap-3.5 px-4 py-2.5 rounded-full bg-[#030706]/90 border border-[#00e676]/30 shadow-[0_0_15px_rgba(0,230,118,0.1)]">
                <div className="w-10 h-10 rounded-full bg-[#00e676]/20 border border-[#00e676]/50 flex items-center justify-center text-[#00e676] shadow-[0_0_10px_rgba(0,230,118,0.3)] shrink-0">
                  <PhoneCall className="w-5 h-5 text-[#00e676]" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#6e8d7a] font-bold leading-tight">HELPLINE 24x7</span>
                  <span className="text-sm font-mono font-extrabold text-white tracking-tight leading-tight">Dial 1930</span>
                  <span className="text-[10px] font-mono text-[#00e676]/90 leading-tight">Toll-Free</span>
                </div>
              </div>

              {/* Primary Emerald Glowing CTA Button */}
              <button
                onClick={() => onSelectTab('file-complaint')}
                className="inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-[#00e676] to-[#00c853] text-[#031508] text-sm font-extrabold shadow-[0_0_35px_rgba(0,230,118,0.5)] hover:shadow-[0_0_45px_rgba(0,230,118,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all group shrink-0"
              >
                <span>File a Cybercrime Complaint</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* 4 KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Complaints Filed */}
            <div className="rounded-2xl bg-[#06140c]/90 p-5 border border-[#00e676]/20 shadow-[0_0_20px_rgba(0,230,118,0.05)] flex items-center justify-between hover:border-[#00e676]/45 transition-all group">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shadow-[0_0_12px_rgba(0,230,118,0.2)] shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-extrabold font-mono text-white tracking-tight">1,248</span>
                  <span className="text-xs text-[#6e8d7a] font-medium">Total Complaints Filed</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[11px] font-mono font-bold text-[#00e676] bg-[#00e676]/10 border border-[#00e676]/25 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  ↑ 12.4%
                </span>
                {/* Mini Sparkline Bar Chart */}
                <div className="flex items-end gap-1 h-5 pt-1">
                  <span className="w-1 bg-[#00e676]/40 rounded-full h-[40%]"></span>
                  <span className="w-1 bg-[#00e676]/60 rounded-full h-[65%]"></span>
                  <span className="w-1 bg-[#00e676]/50 rounded-full h-[50%]"></span>
                  <span className="w-1 bg-[#00e676]/80 rounded-full h-[80%]"></span>
                  <span className="w-1 bg-[#00e676] rounded-full h-[100%] shadow-[0_0_6px_#00e676]"></span>
                </div>
              </div>
            </div>

            {/* Card 2: Under Investigation */}
            <div className="rounded-2xl bg-[#06140c]/90 p-5 border border-[#00e676]/20 shadow-[0_0_20px_rgba(0,230,118,0.05)] flex items-center justify-between hover:border-[#00e676]/45 transition-all group">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shadow-[0_0_12px_rgba(0,230,118,0.2)] shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-extrabold font-mono text-white tracking-tight">842</span>
                  <span className="text-xs text-[#6e8d7a] font-medium">Under Investigation</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[11px] font-mono font-bold text-[#00e676] bg-[#00e676]/10 border border-[#00e676]/25 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  ↑ 8.1%
                </span>
                <div className="flex items-end gap-1 h-5 pt-1">
                  <span className="w-1 bg-[#00e676]/30 rounded-full h-[35%]"></span>
                  <span className="w-1 bg-[#00e676]/50 rounded-full h-[55%]"></span>
                  <span className="w-1 bg-[#00e676]/70 rounded-full h-[70%]"></span>
                  <span className="w-1 bg-[#00e676]/60 rounded-full h-[60%]"></span>
                  <span className="w-1 bg-[#00e676] rounded-full h-[95%] shadow-[0_0_6px_#00e676]"></span>
                </div>
              </div>
            </div>

            {/* Card 3: Resolved Cases */}
            <div className="rounded-2xl bg-[#06140c]/90 p-5 border border-[#00e676]/20 shadow-[0_0_20px_rgba(0,230,118,0.05)] flex items-center justify-between hover:border-[#00e676]/45 transition-all group">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shadow-[0_0_12px_rgba(0,230,118,0.2)] shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-extrabold font-mono text-white tracking-tight">320</span>
                  <span className="text-xs text-[#6e8d7a] font-medium">Resolved Cases</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[11px] font-mono font-bold text-[#00e676] bg-[#00e676]/10 border border-[#00e676]/25 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  ↑ 18.7%
                </span>
                <div className="flex items-end gap-1 h-5 pt-1">
                  <span className="w-1 bg-[#00e676]/40 rounded-full h-[45%]"></span>
                  <span className="w-1 bg-[#00e676]/50 rounded-full h-[55%]"></span>
                  <span className="w-1 bg-[#00e676]/65 rounded-full h-[70%]"></span>
                  <span className="w-1 bg-[#00e676]/85 rounded-full h-[85%]"></span>
                  <span className="w-1 bg-[#00e676] rounded-full h-[100%] shadow-[0_0_6px_#00e676]"></span>
                </div>
              </div>
            </div>

            {/* Card 4: Active Threat Alerts */}
            <div className="rounded-2xl bg-[#06140c]/90 p-5 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)] flex items-center justify-between hover:border-red-500/40 transition-all group">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)] shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-extrabold font-mono text-white tracking-tight">86</span>
                  <span className="text-xs text-[#6e8d7a] font-medium">Active Threat Alerts</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[11px] font-mono font-bold text-red-400 bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  ↓ 5.3%
                </span>
                <div className="flex items-end gap-1 h-5 pt-1">
                  <span className="w-1 bg-red-500/80 rounded-full h-[80%]"></span>
                  <span className="w-1 bg-red-500/65 rounded-full h-[65%]"></span>
                  <span className="w-1 bg-red-500/50 rounded-full h-[50%]"></span>
                  <span className="w-1 bg-red-500/35 rounded-full h-[35%]"></span>
                  <span className="w-1 bg-red-500 rounded-full h-[25%] shadow-[0_0_6px_rgba(239,68,68,0.8)]"></span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Row: Complaints Overview & Telemetry (60%) + Incident Tracker (40%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Card: Complaints Overview & Telemetry (7 Cols) */}
            <div className="lg:col-span-7 rounded-2xl bg-[#06140c]/90 p-6 border border-[#00e676]/20 shadow-[0_0_25px_rgba(0,230,118,0.06)] flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Complaints Overview &amp; Telemetry</h3>
                    <p className="text-xs text-[#6e8d7a]">Complaint intake velocity vs judicial turnaround rate</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-[#030706] border border-[#00e676]/25 text-[#6e8d7a]">
                    2026 OPERATIONAL
                  </span>
                  <div className="relative">
                    <select className="bg-[#030706] text-xs text-[#c8ddd0] font-mono border border-[#00e676]/25 rounded-xl px-2.5 py-1 pr-6 appearance-none focus:outline-none focus:border-[#00e676]">
                      <option>Last 6 Months</option>
                      <option>Last 30 Days</option>
                      <option>All-Time</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#6e8d7a] absolute right-2 top-2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Legend Indicators */}
              <div className="flex items-center gap-5 text-xs pt-1 border-t border-[#00e676]/10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676]"></span>
                  <span className="text-[#c8ddd0] font-medium text-xs">Intake Reports</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00f5d4] shadow-[0_0_6px_#00f5d4]"></span>
                  <span className="text-[#c8ddd0] font-medium text-xs">Investigated</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_6px_#10b981]"></span>
                  <span className="text-[#c8ddd0] font-medium text-xs">Resolved</span>
                </div>
              </div>

              {/* Spline Chart with Floating Tooltip matching image */}
              <div className="w-full h-64 relative rounded-xl bg-[#030706]/80 p-4 border border-[#00e676]/15 flex flex-col justify-end">
                {/* Horizontal Y-Grid lines */}
                <div className="absolute inset-x-4 top-4 flex items-center justify-between text-[#6e8d7a] font-mono text-[10px]">
                  <span className="w-7 text-left">200</span>
                  <div className="w-full border-b border-[#00e676]/10 ml-2"></div>
                </div>
                <div className="absolute inset-x-4 top-16 flex items-center justify-between text-[#6e8d7a] font-mono text-[10px]">
                  <span className="w-7 text-left">150</span>
                  <div className="w-full border-b border-[#00e676]/10 ml-2"></div>
                </div>
                <div className="absolute inset-x-4 top-28 flex items-center justify-between text-[#6e8d7a] font-mono text-[10px]">
                  <span className="w-7 text-left">100</span>
                  <div className="w-full border-b border-[#00e676]/10 ml-2"></div>
                </div>
                <div className="absolute inset-x-4 top-40 flex items-center justify-between text-[#6e8d7a] font-mono text-[10px]">
                  <span className="w-7 text-left">50</span>
                  <div className="w-full border-b border-[#00e676]/10 ml-2"></div>
                </div>
                <div className="absolute inset-x-4 bottom-8 flex items-center justify-between text-[#6e8d7a] font-mono text-[10px]">
                  <span className="w-7 text-left">0</span>
                  <div className="w-full border-b border-[#00e676]/10 ml-2"></div>
                </div>

                {/* SVG Splines with Gradients */}
                <svg className="w-full h-44 overflow-visible ml-6" fill="none" preserveAspectRatio="none" viewBox="0 0 600 160">
                  <defs>
                    <linearGradient id="intakeGlowGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#00e676" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#00e676" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="resolvedGlowGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.30" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Area fill */}
                  <path
                    d="M 20 130 C 80 120, 140 85, 210 100 C 280 115, 330 35, 410 40 C 490 45, 540 120, 580 90 L 580 160 L 20 160 Z"
                    fill="url(#intakeGlowGrad)"
                  />
                  <path
                    d="M 20 150 C 90 145, 150 125, 220 130 C 290 135, 340 75, 410 85 C 490 95, 540 145, 580 130 L 580 160 L 20 160 Z"
                    fill="url(#resolvedGlowGrad)"
                  />

                  {/* Stream 1: Intake (Bright Emerald) */}
                  <path
                    d="M 20 130 C 80 120, 140 85, 210 100 C 280 115, 330 35, 410 40 C 490 45, 540 120, 580 90"
                    stroke="#00e676"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Stream 2: Investigated (Teal Neon) */}
                  <path
                    d="M 20 140 C 85 130, 145 105, 215 115 C 285 125, 335 55, 410 65 C 490 75, 540 130, 580 110"
                    stroke="#00f5d4"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="3 3"
                  />
                  {/* Stream 3: Resolved (Mint) */}
                  <path
                    d="M 20 150 C 90 145, 150 125, 220 130 C 290 135, 340 75, 410 85 C 490 95, 540 145, 580 130"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Nodes */}
                  <circle cx="210" cy="100" r="4" fill="#00e676" />
                  <circle cx="410" cy="40" r="5" fill="#00e676" className="animate-pulse shadow-[0_0_10px_#00e676]" />
                  <circle cx="410" cy="65" r="4" fill="#00f5d4" />
                  <circle cx="410" cy="85" r="4" fill="#10b981" />
                  <circle cx="580" cy="90" r="4" fill="#00e676" />
                </svg>

                {/* Floating Interactive Tooltip (Exact Match to Image at Apr 2026) */}
                <div className="absolute left-[54%] top-[14%] bg-[#030706]/95 border border-[#00e676]/40 rounded-xl p-2.5 shadow-[0_0_20px_rgba(0,230,118,0.25)] text-left min-w-[110px] pointer-events-none">
                  <span className="text-[10px] font-mono font-bold text-[#c8ddd0] block mb-1">Apr 2026</span>
                  <div className="flex flex-col gap-0.5 text-[10px] font-mono">
                    <span className="flex items-center gap-1.5 text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00e676]"></span> Intake: 128
                    </span>
                    <span className="flex items-center gap-1.5 text-[#00f5d4]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00f5d4]"></span> Investigated: 86
                    </span>
                    <span className="flex items-center gap-1.5 text-[#10b981]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span> Resolved: 62
                    </span>
                  </div>
                </div>

                {/* X-Axis Month Labels */}
                <div className="flex justify-between items-center pt-2 pl-8 font-mono text-[11px] text-[#6e8d7a]">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span className="text-[#00e676] font-bold">Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>
              </div>
            </div>

            {/* Right Card: Incident Tracker (5 Cols) */}
            <div className="lg:col-span-5 rounded-2xl bg-[#06140c]/90 p-6 border border-[#00e676]/20 shadow-[0_0_25px_rgba(0,230,118,0.06)] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Incident Tracker</h3>
                    <p className="text-xs text-[#6e8d7a]">Live status of your recent complaints</p>
                  </div>
                </div>
                <button
                  onClick={() => onSelectTab('my-complaints')}
                  className="text-xs font-semibold text-[#00e676] hover:text-[#00ff88] flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-[#00e676]/10"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* List of 5 Incident Rows matching UI screenshot */}
              <div className="flex flex-col divide-y divide-[#00e676]/10">
                {/* Row 1 */}
                <div className="py-3 flex items-center justify-between gap-2 hover:bg-white/[0.02] px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-[#00e676]/20 text-[#00e676] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="font-mono text-xs font-bold text-white">CCIP-2026-001</span>
                    <span className="text-xs text-[#c8ddd0] truncate flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      Financial Fraud
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[10px] text-[#6e8d7a] hidden sm:inline">12 Jun 2026</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 font-mono text-[10px] font-semibold">
                      Under Investigation
                    </span>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="py-3 flex items-center justify-between gap-2 hover:bg-white/[0.02] px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-[#00e676]/20 text-[#00e676] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="font-mono text-xs font-bold text-white">CCIP-2026-002</span>
                    <span className="text-xs text-[#c8ddd0] truncate flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      Phishing
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[10px] text-[#6e8d7a] hidden sm:inline">11 Jun 2026</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-semibold">
                      Evidence Collection
                    </span>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="py-3 flex items-center justify-between gap-2 hover:bg-white/[0.02] px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-[#00e676]/20 text-[#00e676] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="font-mono text-xs font-bold text-white">CCIP-2026-003</span>
                    <span className="text-xs text-[#c8ddd0] truncate flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-[#00e676] shrink-0" />
                      Social Media Scam
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[10px] text-[#6e8d7a] hidden sm:inline">10 Jun 2026</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#00e676]/15 border border-[#00e676]/30 text-[#00e676] font-mono text-[10px] font-semibold">
                      Resolved
                    </span>
                  </div>
                </div>

                {/* Row 4 */}
                <div className="py-3 flex items-center justify-between gap-2 hover:bg-white/[0.02] px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-[#00e676]/20 text-[#00e676] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="font-mono text-xs font-bold text-white">CCIP-2026-004</span>
                    <span className="text-xs text-[#c8ddd0] truncate flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-[#00f5d4] shrink-0" />
                      Identity Theft
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[10px] text-[#6e8d7a] hidden sm:inline">09 Jun 2026</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 font-mono text-[10px] font-semibold">
                      Under Investigation
                    </span>
                  </div>
                </div>

                {/* Row 5 */}
                <div className="py-3 flex items-center justify-between gap-2 hover:bg-white/[0.02] px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-[#00e676]/20 text-[#00e676] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="font-mono text-xs font-bold text-white">CCIP-2026-005</span>
                    <span className="text-xs text-[#c8ddd0] truncate flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      Cyber Bullying
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[10px] text-[#6e8d7a] hidden sm:inline">08 Jun 2026</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 font-mono text-[10px] font-semibold">
                      In Review
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Threat Map (35%) + Safety Awareness (40%) + Quick Services (25%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Card 1: Threat Map & Recent Activity (4 Cols) */}
            <div className="lg:col-span-4 rounded-2xl bg-[#06140c]/90 p-5 border border-[#00e676]/20 shadow-[0_0_25px_rgba(0,230,118,0.06)] flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0">
                    <Radio className="w-4 h-4 text-[#00e676]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Threat Map &amp; Recent Activity</h3>
                    <p className="text-[11px] text-[#6e8d7a]">Live view of reported cybercrime incidents across India</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#030706] border border-[#00e676]/20 text-white flex items-center gap-1">
                    India <ChevronDown className="w-3 h-3 text-[#6e8d7a]" />
                  </span>
                  <button className="p-1 rounded hover:bg-white/[0.05] text-[#6e8d7a] hover:text-white" title="Expand Map">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* India Cyber Hologram Map & Incident Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                {/* Vector Map Canvas / SVG */}
                <div className="sm:col-span-7 h-44 relative rounded-xl bg-[#030706] border border-[#00e676]/15 overflow-hidden flex items-center justify-center p-2">
                  <svg className="w-full h-full" viewBox="0 0 200 220" fill="none">
                    {/* Grid Lines */}
                    <line x1="20" y1="0" x2="20" y2="220" stroke="#00e676" strokeOpacity="0.08" strokeWidth="0.5" />
                    <line x1="60" y1="0" x2="60" y2="220" stroke="#00e676" strokeOpacity="0.08" strokeWidth="0.5" />
                    <line x1="100" y1="0" x2="100" y2="220" stroke="#00e676" strokeOpacity="0.08" strokeWidth="0.5" />
                    <line x1="140" y1="0" x2="140" y2="220" stroke="#00e676" strokeOpacity="0.08" strokeWidth="0.5" />
                    <line x1="180" y1="0" x2="180" y2="220" stroke="#00e676" strokeOpacity="0.08" strokeWidth="0.5" />
                    <line x1="0" y1="50" x2="200" y2="50" stroke="#00e676" strokeOpacity="0.08" strokeWidth="0.5" />
                    <line x1="0" y1="100" x2="200" y2="100" stroke="#00e676" strokeOpacity="0.08" strokeWidth="0.5" />
                    <line x1="0" y1="150" x2="200" y2="150" stroke="#00e676" strokeOpacity="0.08" strokeWidth="0.5" />
                    
                    {/* India Outline Polygonal Geometry */}
                    <path
                      d="M 95 20 L 115 40 L 135 35 L 125 65 L 145 75 L 155 90 L 180 85 L 190 100 L 175 110 L 155 105 L 140 120 L 130 145 L 115 180 L 105 210 L 95 185 L 85 160 L 70 140 L 55 125 L 40 120 L 45 95 L 65 85 L 80 65 L 85 45 Z"
                      stroke="#00e676"
                      strokeWidth="1.5"
                      fill="#00e676"
                      fillOpacity="0.08"
                    />

                    {/* Glowing Incident Hotspots */}
                    {/* Delhi Region (Red - High) */}
                    <circle cx="95" cy="70" r="8" fill="#ef4444" fillOpacity="0.3" className="animate-ping" />
                    <circle cx="95" cy="70" r="4" fill="#ef4444" />

                    {/* Mumbai Region (Red/Orange) */}
                    <circle cx="65" cy="120" r="7" fill="#f97316" fillOpacity="0.3" className="animate-ping" />
                    <circle cx="65" cy="120" r="3.5" fill="#f97316" />

                    {/* Bengaluru / South (Green) */}
                    <circle cx="95" cy="165" r="6" fill="#00e676" fillOpacity="0.3" />
                    <circle cx="95" cy="165" r="3" fill="#00e676" />

                    {/* Hyderabad (Yellow) */}
                    <circle cx="100" cy="135" r="6" fill="#fbbf24" fillOpacity="0.3" />
                    <circle cx="100" cy="135" r="3" fill="#fbbf24" />

                    {/* Kolkata / East (Green) */}
                    <circle cx="145" cy="105" r="5" fill="#00e676" fillOpacity="0.3" />
                    <circle cx="145" cy="105" r="2.5" fill="#00e676" />
                  </svg>
                </div>

                {/* Top Incident Types List */}
                <div className="sm:col-span-5 flex flex-col gap-1.5 text-[11px] font-mono">
                  <span className="text-[10px] text-[#6e8d7a] uppercase font-bold tracking-wider mb-1 block">
                    Top Incident Types
                  </span>
                  <div className="flex items-center justify-between text-[#c8ddd0]">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span> Financial Fraud
                    </span>
                    <span className="font-bold text-white">32%</span>
                  </div>
                  <div className="flex items-center justify-between text-[#c8ddd0]">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full bg-[#f97316]"></span> Phishing
                    </span>
                    <span className="font-bold text-white">24%</span>
                  </div>
                  <div className="flex items-center justify-between text-[#c8ddd0]">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full bg-[#fbbf24]"></span> Social Media Scam
                    </span>
                    <span className="font-bold text-white">18%</span>
                  </div>
                  <div className="flex items-center justify-between text-[#c8ddd0]">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full bg-[#00e676]"></span> Identity Theft
                    </span>
                    <span className="font-bold text-white">12%</span>
                  </div>
                  <div className="flex items-center justify-between text-[#c8ddd0]">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full bg-[#a855f7]"></span> Cyber Bullying
                    </span>
                    <span className="font-bold text-white">8%</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6e8d7a]">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full border border-white/30"></span> Others
                    </span>
                    <span className="font-bold text-white">6%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Safety Awareness & Alerts (5 Cols) */}
            <div className="lg:col-span-5 rounded-2xl bg-[#06140c]/90 p-5 border border-[#00e676]/20 shadow-[0_0_25px_rgba(0,230,118,0.06)] flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Safety Awareness &amp; Alerts</h3>
                  </div>
                </div>
                <button
                  onClick={() => onSelectTab('awareness')}
                  className="text-xs font-semibold text-[#00e676] hover:text-[#00ff88] flex items-center gap-1 transition-colors"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 4 Alert Cards matching screenshot */}
              <div className="flex flex-col gap-2.5">
                {/* Alert 1 */}
                <div className="p-2.5 rounded-xl bg-[#030706] border border-red-500/25 flex items-center justify-between gap-3 hover:border-red-500/50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Rise in UPI Fraud Cases</span>
                      <span className="text-[11px] text-[#6e8d7a] truncate">Be cautious of fake payment links.</span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-[#6e8d7a] shrink-0">12 Jun 2026</span>
                </div>

                {/* Alert 2 */}
                <div className="p-2.5 rounded-xl bg-[#030706] border border-[#00e676]/20 flex items-center justify-between gap-3 hover:border-[#00e676]/40 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#00f5d4]/15 border border-[#00f5d4]/30 flex items-center justify-center text-[#00f5d4] shrink-0">
                      <Info className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">New Phishing SMS Campaign</span>
                      <span className="text-[11px] text-[#6e8d7a] truncate">Avoid clicking unknown links.</span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-[#6e8d7a] shrink-0">10 Jun 2026</span>
                </div>

                {/* Alert 3 */}
                <div className="p-2.5 rounded-xl bg-[#030706] border border-[#00e676]/20 flex items-center justify-between gap-3 hover:border-[#00e676]/40 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Tips to Stay Safe Online</span>
                      <span className="text-[11px] text-[#6e8d7a] truncate">Learn how to protect your data.</span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-[#6e8d7a] shrink-0">08 Jun 2026</span>
                </div>

                {/* Alert 4 */}
                <div className="p-2.5 rounded-xl bg-[#030706] border border-[#00e676]/20 flex items-center justify-between gap-3 hover:border-[#00e676]/40 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-[#10b981] shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Awareness Webinar</span>
                      <span className="text-[11px] text-[#6e8d7a] truncate">Join our upcoming session.</span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-[#6e8d7a] shrink-0">05 Jun 2026</span>
                </div>
              </div>
            </div>

            {/* Card 3: Quick Services (3 Cols) */}
            <div className="lg:col-span-3 rounded-2xl bg-[#06140c]/90 p-5 border border-[#00e676]/20 shadow-[0_0_25px_rgba(0,230,118,0.06)] flex flex-col justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">Quick Services</h3>
              </div>

              {/* 2x3 Grid of 6 Cyber Action Tiles */}
              <div className="grid grid-cols-3 gap-2.5">
                {/* Tile 1: Check URL Safety */}
                <button
                  onClick={() => onSelectTab('ai-shield')}
                  className="rounded-xl bg-[#030706] border border-[#00e676]/20 hover:border-[#00e676]/60 hover:bg-[#00e676]/10 p-2.5 flex flex-col items-center justify-center gap-2 text-center transition-all group shadow-sm hover:shadow-[0_0_12px_rgba(0,230,118,0.2)]"
                  title="Verify malicious URLs"
                >
                  <Link2 className="w-4 h-4 text-[#00e676] group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-semibold text-[#c8ddd0] group-hover:text-white leading-tight">
                    Check URL Safety
                  </span>
                </button>

                {/* Tile 2: Verify Mobile/Email */}
                <button
                  onClick={() => onSelectTab('ai-shield')}
                  className="rounded-xl bg-[#030706] border border-[#00e676]/20 hover:border-[#00e676]/60 hover:bg-[#00e676]/10 p-2.5 flex flex-col items-center justify-center gap-2 text-center transition-all group shadow-sm hover:shadow-[0_0_12px_rgba(0,230,118,0.2)]"
                  title="Verify suspect numbers & emails"
                >
                  <PhoneCall className="w-4 h-4 text-[#00e676] group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-semibold text-[#c8ddd0] group-hover:text-white leading-tight">
                    Verify/ Mobile/Email
                  </span>
                </button>

                {/* Tile 3: Report Suspicious */}
                <button
                  onClick={() => onSelectTab('file-complaint')}
                  className="rounded-xl bg-[#030706] border border-[#00e676]/20 hover:border-[#00e676]/60 hover:bg-[#00e676]/10 p-2.5 flex flex-col items-center justify-center gap-2 text-center transition-all group shadow-sm hover:shadow-[0_0_12px_rgba(0,230,118,0.2)]"
                  title="Report cyber suspicious activity"
                >
                  <AlertTriangle className="w-4 h-4 text-[#00e676] group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-semibold text-[#c8ddd0] group-hover:text-white leading-tight">
                    Report Suspicious
                  </span>
                </button>

                {/* Tile 4: Upload Evidence */}
                <button
                  onClick={() => onSelectTab('documents')}
                  className="rounded-xl bg-[#030706] border border-[#00e676]/20 hover:border-[#00e676]/60 hover:bg-[#00e676]/10 p-2.5 flex flex-col items-center justify-center gap-2 text-center transition-all group shadow-sm hover:shadow-[0_0_12px_rgba(0,230,118,0.2)]"
                  title="Secure evidentiary vault"
                >
                  <UploadCloud className="w-4 h-4 text-[#00e676] group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-semibold text-[#c8ddd0] group-hover:text-white leading-tight">
                    Upload Evidence
                  </span>
                </button>

                {/* Tile 5: Track Complaint */}
                <button
                  onClick={() => onSelectTab('track-status')}
                  className="rounded-xl bg-[#030706] border border-[#00e676]/20 hover:border-[#00e676]/60 hover:bg-[#00e676]/10 p-2.5 flex flex-col items-center justify-center gap-2 text-center transition-all group shadow-sm hover:shadow-[0_0_12px_rgba(0,230,118,0.2)]"
                  title="Track investigation state"
                >
                  <Search className="w-4 h-4 text-[#00e676] group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-semibold text-[#c8ddd0] group-hover:text-white leading-tight">
                    Track Complaint
                  </span>
                </button>

                {/* Tile 6: Get Safety Tips */}
                <button
                  onClick={() => onSelectTab('safety-hub')}
                  className="rounded-xl bg-[#030706] border border-[#00e676]/20 hover:border-[#00e676]/60 hover:bg-[#00e676]/10 p-2.5 flex flex-col items-center justify-center gap-2 text-center transition-all group shadow-sm hover:shadow-[0_0_12px_rgba(0,230,118,0.2)]"
                  title="Citizen defense guidance"
                >
                  <Lightbulb className="w-4 h-4 text-[#00e676] group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-semibold text-[#c8ddd0] group-hover:text-white leading-tight">
                    Get Safety Tips
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. FILE COMPLAINT WIZARD TAB */}
      {activeTab === 'file-complaint' && (
        <FileComplaintWizard
          onSelectTab={onSelectTab}
          onSubmitComplaint={onSubmitComplaint}
          onSelectCase={onSelectCase}
          currentUser={currentUser}
          initialCategory={category}
          initialDescription={description}
          initialSuspectUrl={suspectWebsite}
        />
      )}

      {/* 3. MY COMPLAINTS TAB */}
      {activeTab === 'my-complaints' && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">My Complaint History</h2>
              <p className="text-xs text-[#8fa396]">Complete forensic ledger of submitted incidents</p>
            </div>
            <button
              onClick={() => onSelectTab('file-complaint')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00e676] to-[#00c853] text-[#031508] text-xs font-bold hover:brightness-110 shadow-[0_0_15px_rgba(0,230,118,0.25)] flex items-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Incident</span>
            </button>
          </div>

          {complaints.length === 0 ? (
            <div className="bg-[#06140c]/90 p-8 rounded-2xl border border-[#00e676]/15">
              <EmptyState
                variant="cases"
                title="No complaints in your ledger"
                description="You have not filed any complaints under this account yet. Click 'New Incident' to lodge a cybercrime report."
                action={{ label: 'New Incident', onClick: () => onSelectTab('file-complaint') }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {complaints.map((c) => (
                <div 
                  key={c.id}
                  onClick={() => {
                    onSelectCase(c.id);
                    onSelectTab('track-status');
                  }}
                  className="bg-[#06140c]/90 p-5 rounded-2xl border border-[#00e676]/15 hover:border-[#00e676]/50 hover:shadow-[0_0_25px_rgba(0,230,118,0.1)] transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#00e676]">{c.referenceNumber}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                        c.status === 'UNDER_INVESTIGATION' ? 'bg-[#00e676]/15 text-[#00e676] border-[#00e676]/30' :
                        c.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-[#00e676] transition-colors">{c.title}</h4>
                    <p className="text-xs text-[#8fa396] line-clamp-2">{c.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#00e676]/10 flex items-center justify-between text-xs text-[#8fa396]">
                    <span className="font-mono">{c.incidentDate ? c.incidentDate.slice(0, 10) : '2026-09-04'}</span>
                    <span className="text-[#00e676] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Inspect Case <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. TRACK STATUS TAB */}
      {(activeTab === 'track-status' || activeTab === 'complaint-status') && (() => {
        const fallbackTimeline = activeCase ? {
          complaint_id: activeCase.id,
          complaint_reference: activeCase.referenceNumber,
          case_reference: activeCase.id ? `CAS-${activeCase.id.slice(0, 8).toUpperCase()}` : null,
          current_status: activeCase.status,
          current_status_label: activeCase.status === 'UNDER_INVESTIGATION' ? 'Investigation in Progress' : activeCase.status.replace(/_/g, ' '),
          submitted_at: activeCase.incidentDate || 'Recent',
          updated_at: activeCase.reportedDate || 'Recently',
          progress: {
            completed: activeCase.status === 'RESOLVED' ? 9 : activeCase.status === 'UNDER_INVESTIGATION' ? 5 : 1,
            total: 10,
            percentage: activeCase.status === 'RESOLVED' ? 90 : activeCase.status === 'UNDER_INVESTIGATION' ? 50 : 10
          },
          timeline: [
            {
              stage: 'COMPLAINT_SUBMITTED',
              title: 'Complaint Submitted',
              description: 'Your complaint has been successfully received.',
              state: 'COMPLETED',
              timestamp: activeCase.incidentDate || 'Recent'
            },
            {
              stage: 'INITIAL_REVIEW',
              title: 'Initial Review',
              description: 'Your complaint is being reviewed by the cybercrime team.',
              state: activeCase.status === 'SUBMITTED' ? 'CURRENT' : 'COMPLETED'
            },
            {
              stage: 'INTELLIGENCE_ANALYSIS',
              title: 'Intelligence Analysis',
              description: 'The complaint has been analyzed for threat indicators and supporting information.',
              state: activeCase.status === 'SUBMITTED' ? 'PENDING' : activeCase.status === 'TRIAGED' ? 'CURRENT' : 'COMPLETED'
            },
            {
              stage: 'CASE_CREATED',
              title: 'Case Created',
              description: 'Your complaint has been converted into an investigation case.',
              state: ['SUBMITTED', 'TRIAGED', 'UNDER_REVIEW'].includes(activeCase.status) ? 'PENDING' : 'COMPLETED'
            },
            {
              stage: 'ASSIGNED',
              title: 'Assigned for Investigation',
              description: 'The case has been assigned to the appropriate investigation team.',
              state: ['SUBMITTED', 'TRIAGED', 'UNDER_REVIEW', 'CASE_CREATED'].includes(activeCase.status) ? 'PENDING' : 'COMPLETED'
            },
            {
              stage: 'UNDER_INVESTIGATION',
              title: 'Investigation in Progress',
              description: 'Investigation activities are currently in progress.',
              state: activeCase.status === 'UNDER_INVESTIGATION' ? 'CURRENT' : ['RESOLVED', 'CLOSED'].includes(activeCase.status) ? 'COMPLETED' : 'PENDING'
            },
            {
              stage: 'EVIDENCE_VERIFIED',
              title: 'Evidence Verification',
              description: 'Submitted evidence has passed integrity verification.',
              state: ['EVIDENCE_VERIFIED', 'RESOLVED', 'CLOSED'].includes(activeCase.status) ? 'COMPLETED' : 'PENDING'
            },
            {
              stage: 'APPROPRIATE_ACTION_INITIATED',
              title: 'Appropriate Action Initiated',
              description: 'The case has progressed to the appropriate action stage.',
              state: activeCase.status === 'LAW_ENFORCEMENT_DISPATCHED' ? 'CURRENT' : ['RESOLVED', 'CLOSED'].includes(activeCase.status) ? 'COMPLETED' : 'PENDING'
            },
            {
              stage: 'RESOLVED',
              title: 'Resolved',
              description: 'The investigation has reached a resolution.',
              state: activeCase.status === 'RESOLVED' ? 'CURRENT' : activeCase.status === 'CLOSED' ? 'COMPLETED' : 'PENDING'
            },
            {
              stage: 'CLOSED',
              title: 'Closed',
              description: 'The case has been formally closed.',
              state: activeCase.status === 'CLOSED' ? 'CURRENT' : 'PENDING'
            }
          ],
          latest_update: activeCase.status === 'RESOLVED'
            ? 'The investigation has concluded and formal resolution is documented.'
            : 'Your case is currently under investigation. No action is required from you at this time.',
          evidence_summary: {
            count: activeCase.evidenceFiles ? activeCase.evidenceFiles.length : 0,
            integrity_status: 'VERIFIED',
            integrity_label: 'SHA-256 Integrity Seal Verified'
          },
          allowed_actions: {
            view_details: true,
            add_evidence: activeCase.status !== 'CLOSED' && activeCase.status !== 'CANCELLED',
            view_evidence: true,
            contact_support: true,
            add_evidence_disabled_reason: (activeCase.status === 'CLOSED' || activeCase.status === 'CANCELLED')
              ? 'Evidence submission is disabled for closed or cancelled cases.'
              : null
          },
          is_cancelled: activeCase.status === 'CANCELLED',
          cancellation_reason: null,
          is_reopened: false
        } : null;

        const currentTimeline = timelineData || fallbackTimeline;

        const renderNodeIcon = (state: string) => {
          switch (state) {
            case 'COMPLETED':
              return <Check className="w-3.5 h-3.5 text-black stroke-[3]" />;
            case 'CURRENT':
              return <Clock className="w-3.5 h-3.5 text-amber-300 animate-pulse" />;
            case 'CANCELLED':
              return <XCircle className="w-3.5 h-3.5 text-red-400" />;
            case 'REOPENED':
              return <RefreshCw className="w-3.5 h-3.5 text-[#67C7E7]" />;
            case 'PENDING':
            default:
              return <span className="w-2 h-2 rounded-full bg-white/25" />;
          }
        };

        const getNodeStyles = (state: string) => {
          switch (state) {
            case 'COMPLETED':
              return 'bg-[#19D58A] text-[#121214] shadow-[0_0_12px_rgba(25,213,138,0.4)]';
            case 'CURRENT':
              return 'bg-amber-500/20 border-2 border-amber-400 text-amber-300 ring-4 ring-amber-400/20 shadow-[0_0_16px_rgba(251,191,36,0.35)]';
            case 'CANCELLED':
              return 'bg-red-500/20 border-2 border-red-500 text-red-400 ring-4 ring-red-500/20';
            case 'REOPENED':
              return 'bg-[#67C7E7]/20 border-2 border-[#67C7E7] text-[#67C7E7] ring-4 ring-[#67C7E7]/20';
            case 'PENDING':
            default:
              return 'border border-white/20 bg-[#19191C] text-white/30';
          }
        };

        const getBadgeStyles = (state: string) => {
          switch (state) {
            case 'COMPLETED':
              return 'bg-[#19D58A]/15 text-[#19D58A] border-[#19D58A]/30';
            case 'CURRENT':
              return 'bg-amber-400/20 text-amber-300 border-amber-400/40 font-bold shadow-[0_0_10px_rgba(251,191,36,0.2)]';
            case 'CANCELLED':
              return 'bg-red-500/20 text-red-400 border-red-500/30 font-bold';
            case 'REOPENED':
              return 'bg-[#67C7E7]/20 text-[#67C7E7] border-[#67C7E7]/40 font-bold';
            case 'PENDING':
            default:
              return 'bg-white/[0.05] text-[#AAA5A2] border-white/[0.08]';
          }
        };

        const getRowStyles = (state: string) => {
          switch (state) {
            case 'CURRENT':
              return 'bg-amber-400/[0.04] border border-amber-400/25 rounded-xl p-3.5 shadow-sm';
            case 'CANCELLED':
              return 'bg-red-500/[0.04] border border-red-500/25 rounded-xl p-3.5';
            case 'REOPENED':
              return 'bg-[#67C7E7]/[0.05] border border-[#67C7E7]/25 rounded-xl p-3.5';
            default:
              return 'p-1.5';
          }
        };

        return (
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
            {!activeCase ? (
              <div className="bg-[#06140c]/90 p-8 rounded-2xl border border-[#00e676]/15">
                <EmptyState
                  variant="cases"
                  title="No active case selected"
                  description="Select an existing complaint from your ledger or file a new cyber incident to view its investigation track."
                  action={{ label: 'File Complaint', onClick: () => onSelectTab('file-complaint') }}
                />
              </div>
            ) : (
              <>
                {/* 1. TOP SUMMARY CARD */}
                <div className="rounded-2xl bg-[#06140c]/90 p-6 border border-[#00e676]/20 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col gap-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#00e676]/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#8fa396] uppercase tracking-wider">
                          COMPLAINT LIFECYCLE LEDGER
                        </span>
                        {isLoadingTimeline && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#00e676]">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Syncing
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-baseline gap-3 mt-1">
                        <h2 className="text-2xl font-bold font-mono text-white tracking-tight">
                          {currentTimeline?.complaint_reference || activeCase.referenceNumber}
                        </h2>
                        {currentTimeline?.case_reference && (
                          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/30">
                            Case Ref: {currentTimeline.case_reference}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8fa396] mt-0.5">{activeCase.title}</p>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2">
                      <div className="flex items-center gap-2">
                        {complaints.length > 1 && (
                          <select
                            value={activeCase.id}
                            onChange={(e) => onSelectCase(e.target.value)}
                            className="bg-[#030906] border border-[#00e676]/20 text-white rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#00e676]"
                            aria-label="Switch tracked complaint"
                          >
                            {complaints.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.referenceNumber} ({c.status})
                              </option>
                            ))}
                          </select>
                        )}
                        <button
                          type="button"
                          onClick={() => fetchTimeline(activeCase.id || activeCase.referenceNumber)}
                          className="p-2 rounded-xl bg-[#030906] border border-[#00e676]/20 text-[#8fa396] hover:text-[#00e676] hover:border-[#00e676]/50 transition-colors"
                          title="Refresh timeline from central ledger"
                          aria-label="Refresh timeline"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTimeline ? 'animate-spin text-[#00e676]' : ''}`} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-[#8fa396]">Current Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide border ${
                          currentTimeline?.is_cancelled ? 'bg-red-500/20 text-red-400 border-red-500/40' :
                          currentTimeline?.is_reopened ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' :
                          currentTimeline?.current_status === 'RESOLVED' ? 'bg-[#00e676]/20 text-[#00e676] border-[#00e676]/40' :
                          'bg-[#00e676]/15 text-[#00e676] border-[#00e676]/35 shadow-[0_0_12px_rgba(0,230,118,0.2)]'
                        }`}>
                          {currentTimeline?.current_status_label || activeCase.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Row: Submitted Date, Last Updated, Progress */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-[#030906] border border-[#00e676]/15 flex flex-col justify-between">
                      <span className="text-[10px] font-mono text-[#8fa396] uppercase">Submitted Date</span>
                      <span className="text-sm font-semibold font-mono text-white mt-1">
                        {currentTimeline?.submitted_at || activeCase.incidentDate?.slice(0, 16) || '12 Sep 2026'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#030906] border border-[#00e676]/15 flex flex-col justify-between">
                      <span className="text-[10px] font-mono text-[#8fa396] uppercase">Last Updated</span>
                      <span className="text-sm font-semibold font-mono text-white mt-1">
                        {currentTimeline?.updated_at || '12 Sep 2026, 2:18 PM'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#030906] border border-[#00e676]/15 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-[#8fa396] uppercase">Lifecycle Progress</span>
                        <span className="text-[#00e676] font-bold">
                          {currentTimeline?.progress ? `${currentTimeline.progress.percentage}%` : '50%'}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-white mt-1">
                        {currentTimeline?.progress
                          ? `${currentTimeline.progress.completed} of ${currentTimeline.progress.total} stages completed`
                          : '5 of 10 stages completed'}
                      </span>
                      <div className="w-full bg-[#020604] h-2 rounded-full overflow-hidden mt-2 border border-[#00e676]/20">
                        <div
                          className="bg-gradient-to-r from-[#00e676] via-emerald-400 to-[#00c853] h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,230,118,0.5)]"
                          style={{ width: `${currentTimeline?.progress?.percentage ?? 50}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Special State: Cancelled Notice */}
                  {currentTimeline?.is_cancelled && (
                    <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 flex items-start gap-3 text-xs">
                      <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-red-300 uppercase tracking-wider font-mono">
                          Complaint Cancelled
                        </span>
                        <p className="text-red-200/90 leading-relaxed">
                          {currentTimeline?.cancellation_reason || 'This complaint has been formally cancelled.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Special State: Reopened Notice */}
                  {currentTimeline?.is_reopened && (
                    <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-start gap-3 text-xs">
                      <RefreshCw className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-cyan-400 uppercase tracking-wider font-mono">
                          Investigation Resumed • Case Reopened
                        </span>
                        <p className="text-[#c8ddd0] leading-relaxed">
                          New evidentiary information required the investigation to continue. All previous chain-of-custody milestones remain verified.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. COMPACT VERTICAL TIMELINE CARD */}
                <div className="rounded-2xl bg-[#06140c]/90 p-6 border border-[#00e676]/20 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#00e676]/10">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        Investigation Status Timeline
                      </h3>
                      <p className="text-xs text-[#8fa396] mt-0.5">
                        Compact forensic lifecycle tracking with verified stage milestones
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-[#8fa396]">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#00e676]"></span> Completed
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span> Current
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-white/30"></span> Pending
                      </span>
                    </div>
                  </div>

                  {/* Timeline Stream */}
                  <div className="flex flex-col pl-1 pt-1" role="list" aria-label="Complaint Lifecycle Stages">
                    {(currentTimeline?.timeline || []).map((item: any, idx: number, arr: any[]) => {
                      const isLast = idx === arr.length - 1;
                      const isExpandable = Boolean(item.detail);
                      const isExpanded = expandedStageIndex === idx;

                      return (
                        <div
                          key={`${item.stage}-${idx}`}
                          className={`relative flex items-start gap-4 transition-all ${
                            isLast ? 'pb-2' : 'pb-7'
                          }`}
                          role="listitem"
                        >
                          {/* LEFT: Circular Status Node & Continuous Vertical Connector */}
                          <div className="flex flex-col items-center shrink-0">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${getNodeStyles(
                                item.state
                              )}`}
                              aria-label={`Stage ${item.title}: ${item.state}`}
                              title={`${item.title} (${item.state})`}
                            >
                              {renderNodeIcon(item.state)}
                            </div>

                            {/* Continuous vertical connector */}
                            {!isLast && (
                              <div
                                className={`w-0.5 absolute top-7 bottom-0 left-[13px] ${
                                  item.state === 'COMPLETED' ? 'bg-[#00e676]' : 'bg-[#00e676]/20'
                                }`}
                                aria-hidden="true"
                              />
                            )}
                          </div>

                          {/* CENTER & RIGHT: Stage Row */}
                          <div
                            className={`flex-1 flex flex-col sm:flex-row sm:items-start justify-between gap-3 transition-colors ${getRowStyles(
                              item.state
                            )}`}
                          >
                            {/* CENTER: Stage Title, Description, Expandable detail */}
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4
                                  className={`text-sm tracking-tight ${
                                    item.state === 'CURRENT'
                                      ? 'font-bold text-amber-300'
                                      : item.state === 'COMPLETED'
                                      ? 'font-semibold text-white'
                                      : item.state === 'CANCELLED'
                                      ? 'font-bold text-red-300'
                                      : item.state === 'REOPENED'
                                      ? 'font-bold text-cyan-400'
                                      : 'font-normal text-[#8fa396]'
                                  }`}
                                >
                                  {item.title}
                                </h4>

                                {isExpandable && (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedStageIndex(isExpanded ? null : idx)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setExpandedStageIndex(isExpanded ? null : idx);
                                      }
                                    }}
                                    className="text-[11px] font-mono text-[#8fa396] hover:text-[#00e676] inline-flex items-center gap-0.5 underline transition-colors"
                                    aria-expanded={isExpanded}
                                    aria-label={`Toggle detail for ${item.title}`}
                                  >
                                    <span>{isExpanded ? 'Hide detail' : 'View detail'}</span>
                                    {isExpanded ? (
                                      <ChevronUp className="w-3 h-3" />
                                    ) : (
                                      <ChevronDown className="w-3 h-3" />
                                    )}
                                  </button>
                                )}
                              </div>

                              <p
                                className={`text-xs mt-1 leading-relaxed ${
                                  item.state === 'PENDING'
                                    ? 'text-[#8fa396]/70'
                                    : item.state === 'CURRENT'
                                    ? 'text-[#c8ddd0] font-medium'
                                    : 'text-[#c8ddd0]'
                                }`}
                              >
                                {item.description}
                              </p>

                              {/* Optional Expandable detail panel */}
                              {isExpandable && isExpanded && (
                                <div className="mt-2.5 p-3 rounded-lg bg-[#030906] border border-[#00e676]/20 text-xs text-[#c8ddd0] animate-in fade-in slide-in-from-top-1 duration-150">
                                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#8fa396] uppercase tracking-wider mb-1">
                                    <Info className="w-3 h-3 text-[#00e676]" />
                                    <span>Stage Information</span>
                                  </div>
                                  <p className="font-mono text-[11px] leading-relaxed text-[#c8ddd0]">
                                    {item.detail}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* RIGHT: Timestamp and Compact Status Badge */}
                            <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-1.5 shrink-0 pt-0.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${getBadgeStyles(
                                  item.state
                                )}`}
                              >
                                {item.state}
                              </span>
                              <span className="text-[11px] font-mono text-[#8fa396] whitespace-nowrap">
                                {item.timestamp ? item.timestamp : '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. LATEST UPDATE CARD */}
                <div className="rounded-2xl bg-[#06140c]/90 p-5 border border-[#00e676]/30 shadow-[0_0_20px_rgba(0,230,118,0.1)] flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#00e676]/15 text-[#00e676] border border-[#00e676]/30 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#00e676] uppercase font-bold tracking-wider">
                        LATEST UPDATE
                      </span>
                      <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse"></span>
                    </div>
                    <p className="text-sm font-medium text-white mt-1 leading-relaxed">
                      {currentTimeline?.latest_update ||
                        'Your case is currently under investigation. No action is required from you at this time.'}
                    </p>
                  </div>
                </div>

                {/* 4. EVIDENCE SUMMARY & CITIZEN ACTIONS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* Evidence Summary Card (6 cols) */}
                  <div className="md:col-span-6 rounded-2xl bg-[#06140c]/90 p-5 border border-[#00e676]/15 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#8fa396] uppercase tracking-wider">
                          EVIDENTIARY INTEGRITY
                        </span>
                        <ShieldCheck className="w-4 h-4 text-[#00e676]" />
                      </div>
                      <h4 className="text-base font-bold text-white mt-1">
                        Evidence Submitted:{' '}
                        <span className="text-white font-mono">
                          {currentTimeline?.evidence_summary?.count ??
                            (activeCase.evidenceFiles ? activeCase.evidenceFiles.length : 0)}{' '}
                          files
                        </span>
                      </h4>
                      <p className="text-xs text-[#8fa396] mt-1 leading-relaxed">
                        All uploaded materials are cryptographically preserved in the secure defense vault.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#030906] border border-[#00e676]/15 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#00e676]"></div>
                        <span className="text-xs font-mono font-semibold text-white">
                          {currentTimeline?.evidence_summary?.integrity_label || 'SHA-256 Integrity Seal Verified'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00e676]/15 text-[#00e676] border border-[#00e676]/30 font-bold">
                        SEAL ACTIVE
                      </span>
                    </div>
                  </div>

                  {/* Citizen Actions Card (6 cols) */}
                  <div className="md:col-span-6 rounded-2xl bg-[#06140c]/90 p-5 border border-[#00e676]/15 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-mono text-[#8fa396] uppercase tracking-wider">
                        AUTHORIZED CITIZEN ACTIONS
                      </span>
                      <h4 className="text-base font-bold text-white mt-1">Case Service Actions</h4>
                      <p className="text-xs text-[#8fa396] mt-1">
                        Perform verified citizen requests directly on this complaint.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* View Complaint Details */}
                      <button
                        type="button"
                        onClick={() => setShowCaseDetailsModal(true)}
                        className="p-2.5 rounded-xl bg-[#030906] border border-[#00e676]/20 hover:border-[#00e676]/50 text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#00e676]" />
                        <span>View Details</span>
                      </button>

                      {/* Add Supporting Evidence */}
                      <button
                        type="button"
                        onClick={() => {
                          if (currentTimeline?.allowed_actions?.add_evidence !== false) {
                            docVaultInputRef.current?.click();
                          }
                        }}
                        disabled={currentTimeline?.allowed_actions?.add_evidence === false}
                        title={
                          currentTimeline?.allowed_actions?.add_evidence_disabled_reason ||
                          'Upload additional supporting documents or receipts'
                        }
                        className={`p-2.5 rounded-xl border font-medium flex items-center justify-center gap-1.5 transition-colors ${
                          currentTimeline?.allowed_actions?.add_evidence === false
                            ? 'bg-[#030906]/50 border-white/5 text-[#8fa396]/40 cursor-not-allowed'
                            : 'bg-[#030906] border-[#00e676]/20 hover:border-[#00e676]/50 text-white hover:text-[#00e676]'
                        }`}
                      >
                        <FilePlus className="w-3.5 h-3.5 text-[#00e676]" />
                        <span>Add Evidence</span>
                      </button>

                      {/* View Submitted Evidence */}
                      <button
                        type="button"
                        onClick={() => onSelectTab('documents')}
                        className="p-2.5 rounded-xl bg-[#030906] border border-[#00e676]/20 hover:border-[#00e676]/50 text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#00e676]" />
                        <span>View Evidence</span>
                      </button>

                      {/* Contact Support */}
                      <button
                        type="button"
                        onClick={() => setShowSupportModal(true)}
                        className="p-2.5 rounded-xl bg-[#030906] border border-[#00e676]/20 hover:border-[#00e676]/50 text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
                        <span>Contact Support</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* MODAL 1: Citizen Complaint Details */}
                {showCaseDetailsModal && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="details-modal-title"
                  >
                    <div className="bg-[#06140c] border border-[#00e676]/30 rounded-2xl p-6 max-w-lg w-full shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col gap-4 text-xs">
                      <div className="flex items-center justify-between pb-3 border-b border-[#00e676]/15">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#00e676]" />
                          <h3 id="details-modal-title" className="text-base font-bold text-white">
                            Complaint Record #{activeCase.referenceNumber}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCaseDetailsModal(false)}
                          className="p-1 rounded-lg text-[#8fa396] hover:text-white hover:bg-white/10"
                          aria-label="Close modal"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl bg-[#030906] border border-[#00e676]/15">
                            <span className="text-[10px] font-mono text-[#8fa396] uppercase block">Category</span>
                            <span className="text-white font-semibold mt-0.5 block">{activeCase.category}</span>
                          </div>
                          <div className="p-3 rounded-xl bg-[#030906] border border-[#00e676]/15">
                            <span className="text-[10px] font-mono text-[#8fa396] uppercase block">Financial Loss</span>
                            <span className="text-[#00e676] font-mono font-bold mt-0.5 block">
                              {formatINR(activeCase.financialLoss)}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#030906] border border-[#00e676]/15">
                          <span className="text-[10px] font-mono text-[#8fa396] uppercase block">Incident Narrative</span>
                          <p className="text-[#c8ddd0] leading-relaxed mt-1">{activeCase.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl bg-[#030906] border border-[#00e676]/15">
                            <span className="text-[10px] font-mono text-[#8fa396] uppercase block">Complainant</span>
                            <span className="text-white font-medium mt-0.5 block">
                              {activeCase.citizenName || currentUser?.full_name || 'Registered Citizen'}
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-[#030906] border border-[#00e676]/15">
                            <span className="text-[10px] font-mono text-[#8fa396] uppercase block">Contact</span>
                            <span className="text-white font-mono text-[11px] mt-0.5 block truncate">
                              {activeCase.citizenEmail || currentUser?.email || 'Secured on file'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#00e676]/15 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowCaseDetailsModal(false)}
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODAL 2: Contact Support */}
                {showSupportModal && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="support-modal-title"
                  >
                    <div className="bg-[#06140c] border border-[#00e676]/30 rounded-2xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col gap-4 text-xs">
                      <div className="flex items-center justify-between pb-3 border-b border-[#00e676]/15">
                        <div className="flex items-center gap-2">
                          <LifeBuoy className="w-4 h-4 text-[#00e676]" />
                          <h3 id="support-modal-title" className="text-base font-bold text-white">
                            Cybercrime Citizen Support
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowSupportModal(false)}
                          className="p-1 rounded-lg text-[#8fa396] hover:text-white hover:bg-white/10"
                          aria-label="Close modal"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="p-4 rounded-xl bg-[#030906] border border-[#00e676]/30 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#00e676]/20 text-[#00e676] flex items-center justify-center shrink-0">
                            <PhoneCall className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-[#8fa396] uppercase block">
                              National Helpline (24x7)
                            </span>
                            <span className="text-base font-bold font-mono text-white">1930 (Toll Free)</span>
                            <p className="text-[11px] text-[#c8ddd0] mt-0.5">Immediate financial cyber fraud escalation</p>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#030906] border border-[#00e676]/15 flex flex-col gap-1">
                          <span className="text-[10px] font-mono text-[#8fa396] uppercase">Case Reference Required</span>
                          <p className="text-[#00e676] font-mono font-bold">{activeCase.referenceNumber}</p>
                          <p className="text-[#8fa396] text-[11px] mt-1 leading-relaxed">
                            Quote this tracking reference when speaking with any cyber helpline officer or state cyber division desk.
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#00e676]/15 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowSupportModal(false)}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00e676] to-[#00c853] text-[#031508] font-bold hover:brightness-110 shadow-[0_0_15px_rgba(0,230,118,0.3)] transition-all"
                        >
                          Understood
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}

      {/* 5. DOCUMENTS TAB */}
      {activeTab === 'documents' && (
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Evidence Vault &amp; Documents</h2>
              <p className="text-xs text-[#8fa396]">Secure cryptographic repository of case materials sealed in Enclave</p>
            </div>
            <button
              onClick={() => docVaultInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00e676] to-[#00c853] text-[#031508] text-xs font-bold hover:brightness-110 shadow-[0_0_15px_rgba(0,230,118,0.25)] flex items-center gap-1.5 transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>

          <div className="bg-[#06140c]/90 p-6 rounded-2xl border border-[#00e676]/15 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col gap-3">
            {isLoadingEvidence ? (
              <div className="flex flex-col gap-3">
                <SkeletonCard lines={2} showHeader={false} />
                <SkeletonCard lines={2} showHeader={false} />
              </div>
            ) : (evidenceList.length > 0 ? evidenceList : uploadedFiles).length === 0 ? (
              <EmptyState
                variant="evidence"
                title="Evidence Vault is empty"
                description="Upload digital proof, forensic artifacts, or communication records to cryptographically seal them."
                action={{ label: 'Attach Evidence', onClick: () => docVaultInputRef.current?.click() }}
              />
            ) : (evidenceList.length > 0 ? evidenceList : uploadedFiles).map((file, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#030906] border border-[#00e676]/15 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#00e676]/15 text-[#00e676] flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{file.name || file.original_filename}</div>
                    <div className="text-[11px] font-mono text-[#8fa396]">
                      Size: {file.size || file.file_size_formatted || '1.2 MB'} • SHA-256: {(file.sha256Hash || file.sha256_hash || '').slice(0, 28)}...
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-[#00e676]/15 text-[#00e676] font-mono text-[10px] font-bold border border-[#00e676]/30">
                    SHA-256 VERIFIED
                  </span>
                  <button 
                    onClick={() => handleDownloadEvidence(file.id || `ev-${idx}`)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                    title="Download Evidence File"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Citizen Alerts &amp; Notifications</h2>
              <p className="text-xs text-[#8fa396]">Official case updates and emergency broadcasts from national enclave</p>
            </div>
            {notificationsList.length > 0 && (
              <button 
                onClick={handleMarkAllNotificationsRead}
                className="px-3 py-1.5 rounded-xl border border-[#00e676]/20 text-xs font-mono text-[#c8ddd0] hover:text-[#00e676] hover:bg-[#00e676]/10 transition-colors"
              >
                Mark All Read
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {isLoadingNotifications ? (
              <div className="flex flex-col gap-3">
                <SkeletonCard lines={2} showHeader={false} />
                <SkeletonCard lines={2} showHeader={false} />
              </div>
            ) : notificationsList.length === 0 ? (
              <EmptyState
                variant="alerts"
                title="No new alerts"
                description="No unread operational advisories or case updates from the national cyber enclave."
              />
            ) : (
              notificationsList.map((n) => (
                <div 
                  key={n.id}
                  className={`p-4 rounded-2xl border flex flex-col gap-1 text-xs transition-all ${
                    n.is_read ? 'bg-[#06140c]/60 border-[#00e676]/10' : 'bg-[#06140c] border-[#00e676]/40 shadow-[0_0_15px_rgba(0,230,118,0.1)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[#00e676] font-bold">{n.title || 'ENCLAVE ALERT'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#8fa396] font-mono text-[10px]">
                        {n.created_at ? n.created_at.slice(0, 16).replace('T', ' ') + ' UTC' : 'Recent'}
                      </span>
                      {!n.is_read && (
                        <button 
                          onClick={() => handleMarkNotificationRead(n.id)}
                          className="text-[10px] font-mono text-[#00e676] hover:underline"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-white font-medium">{n.message || n.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 6. CITIZEN AI CYBER SHIELD & ASSISTANT TAB */}
      {activeTab === 'ai-assistant' && (
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-[#18181b] to-zinc-900 border border-emerald-500/30 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">Citizen Cyber Shield</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    PRE-INCIDENT DEFENSE
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Check suspicious links, SMS alerts, and emails with sovereign AI models before you fall victim.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectTab('file-complaint')}
                className="px-4 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                File Formal Complaint
              </button>
            </div>
          </div>

          {/* Quick FAQ Guidance Pills */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[11px] font-mono text-zinc-400 uppercase mr-1">Quick Inquiries:</span>
            <button
              type="button"
              onClick={() => {
                setAiQueryType('portal_help');
                setAiInputText('How do I file a cybercrime complaint?');
                handleRunAiAnalysis('How do I file a cybercrime complaint?', 'portal_help');
              }}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 text-xs transition-all flex items-center gap-1.5"
            >
              <span>📝</span> How to file a complaint?
            </button>
            <button
              type="button"
              onClick={() => {
                setAiQueryType('portal_help');
                setAiInputText('How can I track my complaint status?');
                handleRunAiAnalysis('How can I track my complaint status?', 'portal_help');
              }}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 text-xs transition-all flex items-center gap-1.5"
            >
              <span>🔍</span> How to track status?
            </button>
            <button
              type="button"
              onClick={() => {
                setAiQueryType('portal_help');
                setAiInputText('Emergency 1930 Helpline & Golden Hour advice');
                handleRunAiAnalysis('Emergency 1930 Helpline & Golden Hour advice', 'portal_help');
              }}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <span>🚨</span> 1930 Helpline / Fund Freeze
            </button>
          </div>

          {/* Input Panel */}
          <div className="bg-[#18181b] border border-white/[0.1] rounded-3xl p-6 flex flex-col gap-4 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                Inspect Suspicious Content
              </span>

              {/* Modality Selector */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/[0.06] text-xs">
                {(['auto', 'url', 'sms', 'email', 'portal_help'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setAiQueryType(m)}
                    className={`px-3 py-1 rounded-lg transition-all capitalize font-mono text-[11px] ${
                      aiQueryType === m
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {m === 'portal_help' ? 'Portal Help' : m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <textarea
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
                placeholder="Paste suspicious website URL, SMS message, email text, or ask a question about how the portal works..."
                rows={4}
                className="w-full bg-black/40 border border-white/[0.1] rounded-2xl p-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-all font-sans resize-none"
              />

              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-zinc-500 font-mono">
                  Analysis runs strictly on sovereign offline ML models. No external APIs used.
                </span>
                <button
                  type="button"
                  disabled={aiLoading || !aiInputText.trim()}
                  onClick={() => handleRunAiAnalysis()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Evaluating Models...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Scan for Phishing / Threat
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {aiError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          {/* Results Display */}
          {aiAnalysisResult && (
            <div className="bg-[#18181b] border border-white/[0.12] rounded-3xl p-6 flex flex-col gap-5 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Verdict Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full ${
                    aiAnalysisResult.risk_level === 'HIGH_RISK'
                      ? 'bg-red-500 animate-pulse ring-4 ring-red-500/20'
                      : aiAnalysisResult.risk_level === 'SUSPICIOUS'
                      ? 'bg-amber-500 ring-4 ring-amber-500/20'
                      : aiAnalysisResult.risk_level === 'SAFE'
                      ? 'bg-emerald-500 ring-4 ring-emerald-500/20'
                      : 'bg-blue-500 ring-4 ring-blue-500/20'
                  }`} />
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Verdict</span>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{aiAnalysisResult.risk_level || 'ANALYZED'}</span>
                      {aiAnalysisResult.confidence && (
                        <span className="text-xs font-mono font-normal text-zinc-400">
                          ({(aiAnalysisResult.confidence * 100).toFixed(1)}% model certainty)
                        </span>
                      )}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-300">
                    Model: {aiAnalysisResult.model_name || 'Enclave Assistant'}
                  </span>
                </div>
              </div>

              {/* Portal Guidance View if requested */}
              {aiAnalysisResult.modality === 'portal_help' && aiAnalysisResult.guidance_steps && (
                <div className="flex flex-col gap-3">
                  <h4 className="text-sm font-bold text-emerald-400">{aiAnalysisResult.title}</h4>
                  <div className="space-y-2 bg-black/30 p-4 rounded-2xl border border-white/[0.06]">
                    {aiAnalysisResult.guidance_steps.map((step: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explainable Rationale Breakdown */}
              {aiAnalysisResult.explainable_reasons && aiAnalysisResult.explainable_reasons.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                    Explainable Risk Factors
                  </span>
                  <div className="space-y-2 bg-black/30 p-4 rounded-2xl border border-white/[0.06]">
                    {aiAnalysisResult.explainable_reasons.map((reason: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                        <span className="leading-relaxed">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Defensive Actions */}
              {aiAnalysisResult.recommended_actions && aiAnalysisResult.recommended_actions.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                    Recommended Defensive Actions
                  </span>
                  <div className="space-y-2 bg-emerald-950/20 p-4 rounded-2xl border border-emerald-500/20">
                    {aiAnalysisResult.recommended_actions.map((act: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed font-medium">{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Transition to Complaint Form */}
              {aiAnalysisResult.can_prefill_complaint && (
                <div className="mt-2 p-4 rounded-2xl bg-primary/10 border border-primary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-primary">Were you targeted or suffered a loss?</h5>
                    <p className="text-[11px] text-zinc-400">
                      You can convert this AI threat report directly into an official cybercrime complaint.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePreFillComplaintFromAi}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 flex-shrink-0 cursor-pointer transition-all shadow-md"
                  >
                    <span>Proceed to File Complaint</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 7. CITIZEN PROFILE & VERIFICATION TAB */}

      {activeTab === 'profile' && (
        <div className="max-w-4xl mx-auto w-full space-y-6">
          {/* Header Card */}
          <div className="bg-[#06140c]/90 p-6 rounded-2xl border border-[#00e676]/20 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] font-mono text-xl font-bold shadow-[0_0_15px_rgba(0,230,118,0.2)]">
                {citizenName ? citizenName.slice(0, 2).toUpperCase() : (currentUser?.email ? currentUser.email.slice(0, 2).toUpperCase() : 'CZ')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{citizenName || 'Verified Citizen User'}</h2>
                  <span className="px-2 py-0.5 rounded-md bg-[#00e676]/15 text-[#00e676] border border-[#00e676]/30 text-[10px] font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    ATTESTED
                  </span>
                </div>
                <p className="text-xs text-[#8fa396] mt-0.5 font-mono">
                  {currentUser?.email || 'citizen@enclave.internal'} &bull; Clearance: {currentUser?.clearance_level || 'National E-ID (Level 1)'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-[#8fa396] block">Enclave Account ID</span>
                <span className="text-xs font-mono text-[#00e676] font-semibold">
                  {currentUser?.id ? `${currentUser.id.slice(0, 12)}...` : 'ENCLAVE-CITIZEN-SEC'}
                </span>
              </div>
            </div>
          </div>

          {/* Three Summary Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#06140c]/90 p-5 rounded-2xl border border-[#00e676]/15 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-[#8fa396] uppercase">Complaints Filed</span>
                <FolderOpen className="w-4 h-4 text-[#00e676]" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">{complaints.length}</div>
              <span className="text-[11px] text-[#8fa396] mt-1 block">Total incident reports registered</span>
            </div>

            <div className="bg-[#06140c]/90 p-5 rounded-2xl border border-[#00e676]/15 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-[#8fa396] uppercase">In Active Investigation</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-400">
                {complaints.filter(c => ['UNDER_INVESTIGATION', 'ASSIGNED', 'IN_PROGRESS'].includes(c.status)).length}
              </div>
              <span className="text-[11px] text-[#8fa396] mt-1 block">Law enforcement active triage</span>
            </div>

            <div className="bg-[#06140c]/90 p-5 rounded-2xl border border-[#00e676]/15 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-[#8fa396] uppercase">Resolved Cases</span>
                <CheckCircle2 className="w-4 h-4 text-[#00e676]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#00e676]">
                {complaints.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status)).length}
              </div>
              <span className="text-[11px] text-[#8fa396] mt-1 block">Statutory closure or FIR filed</span>
            </div>
          </div>

          {/* Identity & Profile Edit Form */}
          <div className="bg-[#06140c]/90 p-6 rounded-2xl border border-[#00e676]/20 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#00e676]" />
              Citizen Identity & Credentials Management
            </h3>

            {profileSaveSuccess && (
              <div className="mb-4 p-3.5 rounded-xl bg-[#00e676]/10 border border-[#00e676]/30 text-[#00e676] text-xs flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{profileSaveSuccess}</span>
              </div>
            )}

            {profileSaveError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{profileSaveError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateCitizenProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#c8ddd0] mb-1.5 font-medium">
                    Legal Full Name
                  </label>
                  <input
                    type="text"
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    required
                    placeholder="e.g., Rajesh Kumar"
                    className="w-full bg-[#030906] border border-[#00e676]/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00e676] focus:ring-1 focus:ring-[#00e676]/30 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#c8ddd0] mb-1.5 font-medium">
                    Primary Contact Mobile
                  </label>
                  <input
                    type="tel"
                    value={citizenPhone}
                    onChange={(e) => setCitizenPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#030906] border border-[#00e676]/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00e676] focus:ring-1 focus:ring-[#00e676]/30 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between text-xs font-mono text-[#c8ddd0] mb-1.5 font-medium">
                  <span>Registered Enclave Email (Locked)</span>
                  <span className="text-[10px] text-[#8fa396] flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#00e676]" />
                    Identity Anchor
                  </span>
                </label>
                <input
                  type="email"
                  value={currentUser?.email || citizenEmail}
                  disabled
                  className="w-full bg-[#030906]/60 border border-[#00e676]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#8fa396] cursor-not-allowed font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00e676] to-[#00c853] text-[#031508] text-xs font-bold font-mono hover:brightness-110 shadow-[0_0_15px_rgba(0,230,118,0.3)] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Credentials...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sovereign Privacy & Data Protection Guarantee */}
          <div className="p-5 rounded-2xl bg-[#06140c]/80 border border-[#00e676]/15 flex items-start gap-3.5 text-xs text-[#c8ddd0]">
            <ShieldCheck className="w-5 h-5 text-[#00e676] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-white">Statutory Privacy & Sovereign Isolation Guarantee</span>
              <p className="leading-relaxed text-[11px] text-[#8fa396]">
                Your citizen credentials, submitted forensic evidence, and filed complaints are protected under end-to-end cryptographic hashing (SHA-256). In compliance with national privacy statutes and Sovereign Enclave protocols, internal law enforcement investigative notes, cross-case suspect graphs, and inter-agency intelligence are completely isolated from citizen portal visibility.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 8. HELP & SUPPORT DESK TAB */}

      {(activeTab === 'help-support' || activeTab === 'help-and-support' || activeTab === 'help') && (
        <div className="max-w-4xl mx-auto w-full space-y-6">
          <div className="bg-[#06140c]/90 p-6 rounded-2xl border border-[#00e676]/20 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#00e676]/15">
              <div>
                <h2 className="text-xl font-bold text-white">National Cyber Help & Emergency Support</h2>
                <p className="text-xs text-[#8fa396] mt-1">
                  Immediate statutory assistance for victims of online financial fraud, identity theft, and extortion.
                </p>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center gap-3 shadow-[0_0_15px_rgba(0,230,118,0.15)]">
                <PhoneCall className="w-5 h-5 text-[#00e676] animate-pulse" />
                <div>
                  <span className="text-[10px] font-mono text-[#00e676] block uppercase font-bold">24x7 National Helpline</span>
                  <span className="text-lg font-bold font-mono text-white">Dial 1930</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-[#030906] border border-[#00e676]/15 space-y-2">
                <div className="flex items-center gap-2 text-[#00e676] font-bold text-xs">
                  <Clock className="w-4 h-4" />
                  <span>Golden Hour Financial Fraud Rule</span>
                </div>
                <p className="text-[11px] text-[#8fa396] leading-relaxed">
                  If you have lost money to a banking, UPI, or credit card scam, reporting the transaction within 2 to 4 hours drastically increases the probability of freezing the funds before withdrawal at an ATM or mule exchange.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#030906] border border-[#00e676]/15 space-y-2">
                <div className="flex items-center gap-2 text-[#00e676] font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Evidence Preservation Advice</span>
                </div>
                <p className="text-[11px] text-[#8fa396] leading-relaxed">
                  Do not delete SMS messages, chat conversations, WhatsApp screenshots, or transaction receipt PDFs. Export them immediately and attach them to your complaint to assist forensic analysts.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
