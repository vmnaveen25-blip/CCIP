import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Complaint } from '../../types';
import {
  Bot,
  Search,
  Folder,
  FileText,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Lock,
  Mail,
  Smartphone,
  Landmark,
  Link as LinkIcon,
  Calendar,
  User,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Paperclip,
  Send,
  Sparkles,
  Clock,
  Info,
  MoreVertical,
  ArrowRight,
  RotateCw,
  Image as ImageIcon,
  CheckCircle2,
  FileCode,
  Tag,
  Settings,
  Key,
  X,
  Zap,
  Cpu
} from 'lucide-react';
import {
  renderMarkdown,
  queryGoogleGemini,
  generateIntelligentCyberResponse,
  CaseContextData,
  ChatMessage
} from '../../utils/cyberAIAssistantEngine';

interface AIAssistantInvestigationPortalViewProps {
  onSelectTab: (tab: string) => void;
  onSelectCase?: (caseId: string) => void;
  complaints?: Complaint[];
  selectedCaseId?: string;
  currentUser?: any;
}

interface CaseItem {
  id: string;
  referenceNumber: string;
  title: string;
  category: string;
  date: string;
  status: 'SUBMITTED' | 'UNDER_INVESTIGATION' | 'EVIDENCE_REVIEW' | 'CLOSED';
  statusLabel: string;
  statusColor: 'cyan' | 'amber' | 'blue' | 'gray';
  priority: 'High' | 'Medium' | 'Low';
  priorityColor: 'red' | 'amber' | 'blue';
  evidenceCount: number;
  indicatorsCount: number;
  linksCount: number;
  source: string;
  complainant: string;
  department: string;
  incidentType: string;
  pendingVerifications: number;
  summary: string;
  recordedFacts: {
    incidentReport: string;
    reportedUrl?: string;
    transactionRef?: string;
    uploadedDocsCount: number;
    docDetails: string[];
    incidentType: string;
    sourceCount: number;
  };
  keyIndicators: Array<{
    id: string;
    value: string;
    type: string;
    badge: 'Suspicious' | 'Unverified' | 'Verified' | 'Malicious';
    badgeType: 'danger' | 'warning' | 'success';
    icon: string;
  }>;
  evidenceFiles: Array<{
    id: string;
    name: string;
    type: 'Image' | 'PDF' | 'Text' | 'Audio';
    timestamp: string;
  }>;
  verificationNeeds: string[];
  suggestedNextChecks: string[];
  timeline: Array<{
    time: string;
    event: string;
  }>;
}

export const AIAssistantInvestigationPortalView: React.FC<AIAssistantInvestigationPortalViewProps> = ({
  onSelectTab,
  onSelectCase,
  complaints = [],
  selectedCaseId,
  currentUser
}) => {
  // Case Navigation State
  const [activeTabSection, setActiveTabSection] = useState<'my-cases' | 'all-assigned' | 'recent'>('my-cases');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'UNDER_INVESTIGATION' | 'EVIDENCE_REVIEW' | 'CLOSED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCaseKey, setSelectedCaseKey] = useState<string>(selectedCaseId || 'CYBER-2026-7102');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCaseContextCollapsed, setIsCaseContextCollapsed] = useState<boolean>(false);

  // Chat State & AI Engine Settings
  const [inputQuery, setInputQuery] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('ccip_gemini_api_key') || '');
  const [selectedEngine, setSelectedEngine] = useState<'gemini' | 'copilot'>(() => {
    const saved = localStorage.getItem('ccip_ai_engine');
    if (saved === 'gemini' || saved === 'copilot') return saved;
    return localStorage.getItem('ccip_gemini_api_key') ? 'gemini' : 'copilot';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>(apiKey);
  const [tempEngine, setTempEngine] = useState<'gemini' | 'copilot'>(selectedEngine);
  const [isTestingKey, setIsTestingKey] = useState<boolean>(false);
  const [keyTestStatus, setKeyTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [keyTestMessage, setKeyTestMessage] = useState<string>('');

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'msg-initial',
      sender: 'assistant',
      time: '10:24 AM',
      isInitialDossier: true,
      modelUsed: 'CCIP Cyber Copilot'
    }
  ]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Master Cases Repository matching screenshot
  const casesData: CaseItem[] = useMemo(() => [
    {
      id: 'case-7102',
      referenceNumber: 'CYBER-2026-7102',
      title: 'UPI / QR Code Payment Scam',
      category: 'Financial Fraud',
      date: '12 Jun 2026, 10:24 AM',
      status: 'SUBMITTED',
      statusLabel: 'SUBMITTED',
      statusColor: 'cyan',
      priority: 'Medium',
      priorityColor: 'amber',
      evidenceCount: 3,
      indicatorsCount: 5,
      linksCount: 2,
      source: 'Citizen Portal',
      complainant: 'Citizen Portal',
      department: 'Cybercrime Unit',
      incidentType: 'UPI / QR Code Scam',
      pendingVerifications: 4,
      summary: 'This case involves a reported unauthorized payment after the complainant scanned a QR code. The available records indicate a suspicious URL, one transaction reference, and two uploaded documents. No link to another case has been verified yet.',
      recordedFacts: {
        incidentReport: 'Complainant reported scanning a QR code and making an unauthorized payment.',
        reportedUrl: 'upi-claim-support.in',
        transactionRef: 'UPI92736117283',
        uploadedDocsCount: 2,
        docDetails: [
          'Screenshot of payment (image)',
          'Identity document (PDF)'
        ],
        incidentType: 'UPI / QR Code Payment Scam',
        sourceCount: 3
      },
      keyIndicators: [
        { id: 'ind-1', value: 'upi-claim-support.in', type: 'Domain', badge: 'Suspicious', badgeType: 'danger', icon: 'globe' },
        { id: 'ind-2', value: '185.220.101.44', type: 'IP Address', badge: 'Unverified', badgeType: 'warning', icon: 'server' },
        { id: 'ind-3', value: 'fraud@okaxis.com', type: 'Email', badge: 'Unverified', badgeType: 'warning', icon: 'mail' },
        { id: 'ind-4', value: '+91 98765 43210', type: 'Mobile', badge: 'Verified', badgeType: 'success', icon: 'mobile' },
        { id: 'ind-5', value: 'XXXX 6789', type: 'Bank Account', badge: 'Unverified', badgeType: 'warning', icon: 'bank' }
      ],
      evidenceFiles: [
        { id: 'ev-1', name: 'Screenshot of payment', type: 'Image', timestamp: '12 Jun 2026, 10:18 AM' },
        { id: 'ev-2', name: 'Identity document', type: 'PDF', timestamp: '12 Jun 2026, 10:20 AM' },
        { id: 'ev-3', name: 'Complaint form', type: 'Text', timestamp: '12 Jun 2026, 10:24 AM' }
      ],
      verificationNeeds: [
        'Verify the reported domain and check for known threat intelligence matches.',
        'Analyze transaction details with authorized financial partners.',
        'Check for similar URLs or indicators in other cases.',
        'Review uploaded documents for additional indicators (e.g. phone numbers, accounts, device details).'
      ],
      suggestedNextChecks: [
        'Run threat intelligence lookup for the domain',
        'Verify transaction reference with bank (authorized)',
        'Check for related cases using the indicators',
        'Analyze uploaded documents for more indicators',
        'Build a chronological timeline from evidence'
      ],
      timeline: [
        { time: '12 Jun 2026, 10:24 AM', event: 'Complaint submitted (Citizen Portal)' },
        { time: '12 Jun 2026, 10:28 AM', event: 'Initial triage completed' },
        { time: '12 Jun 2026, 10:35 AM', event: 'Indicators extracted (5)' },
        { time: '12 Jun 2026, 11:12 AM', event: 'Evidence files processed (3)' }
      ]
    },
    {
      id: 'case-7033',
      referenceNumber: 'CYBER-2026-7033',
      title: 'Online Shopping Fraud',
      category: 'Financial Fraud',
      date: '11 Jun 2026, 03:18 PM',
      status: 'EVIDENCE_REVIEW',
      statusLabel: 'EVIDENCE REVIEW',
      statusColor: 'amber',
      priority: 'High',
      priorityColor: 'red',
      evidenceCount: 4,
      indicatorsCount: 6,
      linksCount: 4,
      source: 'Delhi Cybercell docket',
      complainant: 'Citizen Portal (Delhi)',
      department: 'Special Cell Intelligence',
      incidentType: 'Mule Account Scam',
      pendingVerifications: 2,
      summary: 'Victim purchased luxury electronics on counterfeit discount portal. Payment intercepted via deceptive payment gateway mimicking Razorpay.',
      recordedFacts: {
        incidentReport: 'Victim remitted ₹48,500 to bogus merchant portal with zero product delivery.',
        reportedUrl: 'mega-deal-electronics.shop',
        transactionRef: 'RZP_ORDER_994821',
        uploadedDocsCount: 3,
        docDetails: ['Invoice copy (PDF)', 'Chat transcript (image)', 'Bank debit advice (PDF)'],
        incidentType: 'Online Shopping Fraud',
        sourceCount: 4
      },
      keyIndicators: [
        { id: 'ind-7033-1', value: 'mega-deal-electronics.shop', type: 'Domain', badge: 'Malicious', badgeType: 'danger', icon: 'globe' },
        { id: 'ind-7033-2', value: '185.220.101.44', type: 'IP Address', badge: 'Unverified', badgeType: 'warning', icon: 'server' },
        { id: 'ind-7033-3', value: 'merchant-refund@axis', type: 'UPI VPA', badge: 'Unverified', badgeType: 'warning', icon: 'bank' }
      ],
      evidenceFiles: [
        { id: 'ev-7033-1', name: 'Invoice copy', type: 'PDF', timestamp: '11 Jun 2026, 03:10 PM' },
        { id: 'ev-7033-2', name: 'Chat transcript', type: 'Image', timestamp: '11 Jun 2026, 03:15 PM' }
      ],
      verificationNeeds: [
        'Correlate shared hosting IP 185.220.101.44 with case CYBER-2026-7102.',
        'Obtain merchant settlement details from gateway.'
      ],
      suggestedNextChecks: [
        'Perform Cross-Case Correlation with CYBER-2026-7102',
        'Request registrar takedown for fraudulent storefront'
      ],
      timeline: [
        { time: '11 Jun 2026, 03:18 PM', event: 'Complaint filed online' },
        { time: '11 Jun 2026, 04:00 PM', event: 'Evidence verification initiated' }
      ]
    },
    {
      id: 'case-2788',
      referenceNumber: 'CYBER-2026-2788',
      title: 'Social Media Impersonation',
      category: 'Identity Theft',
      date: '08 Jun 2026, 11:32 AM',
      status: 'SUBMITTED',
      statusLabel: 'SUBMITTED',
      statusColor: 'cyan',
      priority: 'Low',
      priorityColor: 'blue',
      evidenceCount: 5,
      indicatorsCount: 3,
      linksCount: 4,
      source: 'Citizen Portal',
      complainant: 'Citizen Direct',
      department: 'Cyber Social Monitoring',
      incidentType: 'Account Takeover / Lure',
      pendingVerifications: 1,
      summary: 'Cloned Instagram executive handle soliciting fraudulent cryptocurrency token pre-sales from contacts.',
      recordedFacts: {
        incidentReport: 'Compromised profile sending malicious Telegram links soliciting funds.',
        reportedUrl: 't.me/official_bonus_airdrop',
        uploadedDocsCount: 4,
        docDetails: ['Profile screenshot', 'DM extortion logs'],
        incidentType: 'Social Media Impersonation',
        sourceCount: 2
      },
      keyIndicators: [
        { id: 'ind-2788-1', value: 't.me/official_bonus_airdrop', type: 'URL', badge: 'Suspicious', badgeType: 'danger', icon: 'globe' },
        { id: 'ind-2788-2', value: '+91 91234 56789', type: 'Mobile', badge: 'Unverified', badgeType: 'warning', icon: 'mobile' }
      ],
      evidenceFiles: [
        { id: 'ev-2788-1', name: 'Profile screenshot', type: 'Image', timestamp: '08 Jun 2026, 11:25 AM' }
      ],
      verificationNeeds: ['Request platform user registration IP logs under Section 91 CrPC.'],
      suggestedNextChecks: ['Submit preservation request to Meta Compliance'],
      timeline: [
        { time: '08 Jun 2026, 11:32 AM', event: 'Citizen narrative logged' }
      ]
    },
    {
      id: 'case-1156',
      referenceNumber: 'CYBER-2026-1156',
      title: 'Investment Fraud',
      category: 'Financial Fraud',
      date: '02 Jun 2026, 09:14 AM',
      status: 'CLOSED',
      statusLabel: 'CLOSED',
      statusColor: 'gray',
      priority: 'High',
      priorityColor: 'red',
      evidenceCount: 6,
      indicatorsCount: 9,
      linksCount: 5,
      source: 'Mumbai Cyber Crime Unit',
      complainant: 'Referral Docket',
      department: 'Financial Crimes Taskforce',
      incidentType: 'Ponzi / High Yield Crypto',
      pendingVerifications: 0,
      summary: 'Syndicated Ponzi scheme soliciting fake algorithmic trading deposits. Recovery initiated via interim bank freeze.',
      recordedFacts: {
        incidentReport: 'Victims deposited cumulative ₹1.2 Cr into mule bank pool.',
        transactionRef: 'CR_POOL_BATCH_1102',
        uploadedDocsCount: 6,
        docDetails: ['Certified ledger', 'Recovery order'],
        incidentType: 'Investment Fraud',
        sourceCount: 5
      },
      keyIndicators: [
        { id: 'ind-1156-1', value: 'apex-algo-yield.trade', type: 'Domain', badge: 'Malicious', badgeType: 'danger', icon: 'globe' }
      ],
      evidenceFiles: [
        { id: 'ev-1156-1', name: 'Certified ledger', type: 'PDF', timestamp: '02 Jun 2026, 09:00 AM' }
      ],
      verificationNeeds: ['All primary verification milestones completed.'],
      suggestedNextChecks: ['Archive sealed evidence in Sovereign Cold Storage'],
      timeline: [
        { time: '02 Jun 2026, 09:14 AM', event: 'Case registered' },
        { time: '05 Jun 2026, 05:00 PM', event: 'Case resolved & sealed' }
      ]
    }
  ], []);

  // Selected Active Case Item
  const activeCase = useMemo(() => {
    return casesData.find(c => c.referenceNumber === selectedCaseKey || c.id === selectedCaseKey) || casesData[0];
  }, [casesData, selectedCaseKey]);

  // Filtered case cards for left panel
  const filteredCases = useMemo(() => {
    return casesData.filter(c => {
      // Status filter
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.referenceNumber.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [casesData, statusFilter, searchQuery]);

  // Toast feedback
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
    showToast(`Copied "${text}" to clipboard.`);
  };

  // Case Selection Handler
  const handleSelectCaseCard = (caseItem: CaseItem) => {
    setSelectedCaseKey(caseItem.referenceNumber);
    if (onSelectCase) onSelectCase(caseItem.referenceNumber);
    showToast(`Switched active investigation context to ${caseItem.referenceNumber}`);
    
    // Reset conversation to selected case's grounded dossier
    setChatHistory([
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isInitialDossier: true
      }
    ]);
  };

  // AI Model Settings Handlers
  const handleTestGeminiKey = async () => {
    if (!tempApiKey.trim()) {
      setKeyTestStatus('error');
      setKeyTestMessage('Please enter an API key first.');
      return;
    }
    setIsTestingKey(true);
    setKeyTestStatus('idle');
    setKeyTestMessage('');
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${tempApiKey.trim()}`);
      if (res.ok) {
        setKeyTestStatus('success');
        setKeyTestMessage('✓ Connection verified! Google Gemini API is live.');
      } else {
        const errData = await res.json().catch(() => ({}));
        setKeyTestStatus('error');
        setKeyTestMessage(errData?.error?.message || `HTTP ${res.status}: Invalid key or permission denied`);
      }
    } catch (e: any) {
      setKeyTestStatus('error');
      setKeyTestMessage(e.message || 'Network connection failed.');
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSaveSettings = () => {
    const trimmedKey = tempApiKey.trim();
    setApiKey(trimmedKey);
    setSelectedEngine(tempEngine);
    localStorage.setItem('ccip_gemini_api_key', trimmedKey);
    localStorage.setItem('ccip_ai_engine', tempEngine);
    setIsSettingsOpen(false);
    showToast(tempEngine === 'gemini' && trimmedKey ? 'Google Gemini 1.5 Flash active.' : 'CCIP Sovereign Cyber Copilot active.');
  };

  // Handle Send Custom Query (Intelligent Real-World Assistant Engine)
  const handleSendQuery = async (customPromptOrEvent?: any) => {
    let query = '';
    if (typeof customPromptOrEvent === 'string') {
      query = customPromptOrEvent.trim();
    } else if (customPromptOrEvent && customPromptOrEvent.preventDefault) {
      customPromptOrEvent.preventDefault();
      query = inputQuery.trim();
    } else {
      query = inputQuery.trim();
    }

    if (!query || isGenerating) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setInputQuery('');

    // Append user message immediately
    setChatHistory(prev => [
      ...prev,
      { id: `usr-${Date.now()}`, sender: 'user', time, text: query }
    ]);

    setIsGenerating(true);

    try {
      let responseText = '';
      let modelUsed = 'CCIP Cyber Copilot';
      let source: 'gemini' | 'local_llm' | 'neural_engine' = 'neural_engine';

      if (selectedEngine === 'gemini' && apiKey.trim()) {
        try {
          responseText = await queryGoogleGemini(apiKey.trim(), query, activeCase, chatHistory);
          modelUsed = 'Gemini 1.5 Flash';
          source = 'gemini';
        } catch (geminiErr: any) {
          console.warn('[Gemini API Call failed, falling back to Sovereign Neural Copilot]:', geminiErr);
          showToast(`Gemini API: ${geminiErr.message || 'Offline'}. Falling back to Copilot.`);
          responseText = generateIntelligentCyberResponse(query, activeCase, casesData);
          modelUsed = 'CCIP Cyber Copilot (Fallback)';
          source = 'neural_engine';
        }
      } else {
        // High-fidelity domain intelligence engine
        await new Promise(r => setTimeout(r, 600));
        responseText = generateIntelligentCyberResponse(query, activeCase, casesData);
        modelUsed = 'CCIP Cyber Copilot';
        source = 'neural_engine';
      }

      setChatHistory(prev => [
        ...prev,
        {
          id: `ast-${Date.now()}`,
          sender: 'assistant',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: responseText,
          modelUsed,
          source
        }
      ]);
    } catch (err: any) {
      const fallbackText = generateIntelligentCyberResponse(query, activeCase, casesData);
      setChatHistory(prev => [
        ...prev,
        {
          id: `ast-${Date.now()}`,
          sender: 'assistant',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: fallbackText,
          modelUsed: 'CCIP Cyber Copilot',
          source: 'neural_engine'
        }
      ]);
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }
  };

  // Handle Action Shortcuts
  const handleShortcutQuery = (type: 'summary' | 'timeline' | 'verification' | 'related') => {
    if (type === 'summary') {
      handleSendQuery('Summarize this case with complete incident narrative, key indicators, and investigative next steps');
    } else if (type === 'timeline') {
      handleSendQuery('Build a chronological incident event timeline from case records and evidence timestamps');
    } else if (type === 'verification') {
      handleSendQuery('What evidence and indicators need independent verification in this case?');
    } else if (type === 'related') {
      handleSendQuery('Show related cases and cross-case candidate correlations for this docket');
    }
  };

  return (
    <div className="flex flex-col gap-3 text-content-primary animate-in fade-in duration-200">
      {/* Toast Alert Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#06140c] border border-primary text-primary text-xs font-mono shadow-2xl animate-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN 3-COLUMN WORKSPACE: LEFT SELECTOR + CENTER ASSISTANT + RIGHT CONTEXT */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-3.5 items-start">

        {/* ----------------------------------------------------------------------- */}
        {/* COLUMN 1: 1. SELECT A CASE (Left Column)                                */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-3 p-3.5 rounded-2xl bg-[#040e08] border border-primary/20 shadow-xl min-w-0">
          
          {/* Section Title */}
          <div>
            <h2 className="text-xs font-bold text-white tracking-wider uppercase font-mono">
              1. SELECT A CASE
            </h2>
            <p className="text-[11px] text-content-muted mt-0.5">
              Choose a case to start the investigation assistant.
            </p>
          </div>

          {/* Navigation Tabs: My Cases | All Assigned | Recent */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#06170e] border border-white/[0.06] text-[11px] font-mono">
            <button
              onClick={() => setActiveTabSection('my-cases')}
              className={`py-1.5 px-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer min-w-0 ${
                activeTabSection === 'my-cases'
                  ? 'bg-[#00e676]/20 text-[#00e676] font-bold border border-[#00e676]/40 shadow-sm'
                  : 'text-content-muted hover:text-white'
              }`}
              title="My Cases"
            >
              <span className="truncate">My Cases</span>
            </button>

            <button
              onClick={() => setActiveTabSection('all-assigned')}
              className={`py-1.5 px-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer min-w-0 ${
                activeTabSection === 'all-assigned'
                  ? 'bg-[#00e676]/20 text-[#00e676] font-bold border border-[#00e676]/40 shadow-sm'
                  : 'text-content-muted hover:text-white'
              }`}
              title="All Assigned"
            >
              <span className="truncate">Assigned</span>
            </button>

            <button
              onClick={() => setActiveTabSection('recent')}
              className={`py-1.5 px-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer min-w-0 ${
                activeTabSection === 'recent'
                  ? 'bg-[#00e676]/20 text-[#00e676] font-bold border border-[#00e676]/40 shadow-sm'
                  : 'text-content-muted hover:text-white'
              }`}
              title="Recent Cases"
            >
              <span className="truncate">Recent</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Case ID, title, keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#06150c] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-content-muted focus:outline-none focus:border-primary font-mono"
            />
          </div>

          {/* Status Filter Pills matching screenshot */}
          <div className="flex flex-wrap items-center gap-1 text-[11px] font-mono">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-[#00e676] text-[#020b06] font-bold border-[#00e676]'
                  : 'bg-[#06150c] text-content-muted border-white/[0.08] hover:text-white'
              }`}
            >
              All
            </button>

            <button
              onClick={() => setStatusFilter('SUBMITTED')}
              className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                statusFilter === 'SUBMITTED'
                  ? 'bg-[#00e676] text-[#020b06] font-bold border-[#00e676]'
                  : 'bg-[#06150c] text-content-muted border-white/[0.08] hover:text-white'
              }`}
            >
              Submitted
            </button>

            <button
              onClick={() => setStatusFilter('UNDER_INVESTIGATION')}
              className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                statusFilter === 'UNDER_INVESTIGATION'
                  ? 'bg-[#00e676] text-[#020b06] font-bold border-[#00e676]'
                  : 'bg-[#06150c] text-content-muted border-white/[0.08] hover:text-white'
              }`}
            >
              Under Investigation
            </button>

            <button
              onClick={() => setStatusFilter('EVIDENCE_REVIEW')}
              className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                statusFilter === 'EVIDENCE_REVIEW'
                  ? 'bg-[#00e676] text-[#020b06] font-bold border-[#00e676]'
                  : 'bg-[#06150c] text-content-muted border-white/[0.08] hover:text-white'
              }`}
            >
              Evidence Review
            </button>

            <button
              onClick={() => setStatusFilter('CLOSED')}
              className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                statusFilter === 'CLOSED'
                  ? 'bg-[#00e676] text-[#020b06] font-bold border-[#00e676]'
                  : 'bg-[#06150c] text-content-muted border-white/[0.08] hover:text-white'
              }`}
            >
              Closed
            </button>
          </div>

          {/* List of Case Cards */}
          <div className="flex flex-col gap-2.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredCases.map((c) => {
              const isSelected = c.referenceNumber === activeCase.referenceNumber;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectCaseCard(c)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-[#072414] border-[#00e676] shadow-[0_0_15px_rgba(0,230,118,0.18)]'
                      : 'bg-[#06170e]/80 border-white/[0.06] hover:border-primary/40 hover:bg-[#081e13]'
                  }`}
                >
                  {/* Top line: Folder Icon + Case ID + Status Badge */}
                  <div className="flex items-start justify-between gap-1.5 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                        c.statusColor === 'cyan' ? 'bg-[#00e676]/20 text-[#00e676]' :
                        c.statusColor === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        <Folder className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-mono font-bold text-xs text-white truncate" title={c.referenceNumber}>
                        {c.referenceNumber}
                      </span>
                    </div>

                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider shrink-0 whitespace-nowrap ${
                      c.statusColor === 'cyan' ? 'bg-[#052918] text-[#00e676] border border-[#00e676]/40' :
                      c.statusColor === 'amber' ? 'bg-[#2d1e07] text-[#f59e0b] border border-[#f59e0b]/40' :
                      'bg-zinc-900 text-zinc-400 border border-zinc-700'
                    }`}>
                      {c.statusLabel}
                    </span>
                  </div>

                  {/* Title & Date */}
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-white leading-snug line-clamp-1" title={c.title}>
                      {c.title}
                    </h3>
                    <p className="text-[11px] text-content-muted font-mono mt-0.5">
                      {c.date}
                    </p>
                  </div>

                  {/* Bottom Metadata Badges */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1.5 border-t border-white/[0.04] text-[10px] font-mono text-content-secondary">
                    <span className="flex items-center gap-1 shrink-0">
                      <FileText className="w-3 h-3 text-cyan-400" />
                      <span>{c.evidenceCount} Evidence</span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Search className="w-3 h-3 text-amber-400" />
                      <span>{c.indicatorsCount} Indicators</span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <LinkIcon className="w-3 h-3 text-indigo-400" />
                      <span>{c.linksCount} Links</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls matching screenshot */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs font-mono text-content-muted">
            <button className="p-1 rounded hover:text-white cursor-pointer disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              <span className="w-6 h-6 rounded flex items-center justify-center font-bold text-[#00e676] bg-[#00e676]/20 border border-[#00e676]/40">1</span>
              <span className="w-6 h-6 rounded flex items-center justify-center hover:text-white cursor-pointer">2</span>
              <span className="w-6 h-6 rounded flex items-center justify-center hover:text-white cursor-pointer">3</span>
              <span className="px-1 text-content-muted">...</span>
              <span className="w-6 h-6 rounded flex items-center justify-center hover:text-white cursor-pointer">12</span>
            </div>

            <button className="p-1 rounded hover:text-white cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* COLUMN 2: CENTER WORKSPACE (ACTIVE CASE BANNER + AI ASSISTANT CHAT)     */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-8 xl:col-span-6 flex flex-col gap-3 min-w-0">

          {/* TOP ACTIVE CASE BANNER matching screenshot */}
          <div className="p-3.5 rounded-2xl bg-[#040e08] border border-primary/25 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-[#072414] border border-[#00e676]/40 flex items-center justify-center text-[#00e676] shrink-0 shadow-[0_0_12px_rgba(0,230,118,0.2)] mt-0.5 sm:mt-0">
                <Folder className="w-5 h-5 text-[#00e676]" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#00e676] font-bold uppercase tracking-wider">
                    ACTIVE CASE
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <span className="text-sm font-bold text-white font-sans break-words line-clamp-2">
                    {activeCase.referenceNumber} — {activeCase.title}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#052918] text-[#00e676] border border-[#00e676]/40 shrink-0">
                    {activeCase.statusLabel}
                  </span>
                </div>

                {/* Sub-bar chips */}
                <div className="flex items-center gap-x-2.5 gap-y-1 text-[11px] text-content-muted font-sans mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1 font-mono text-[10px] shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{activeCase.date}</span>
                  </span>
                  <span className="text-white/20 hidden sm:inline">•</span>
                  <span className="shrink-0">Complainant: <strong className="text-white">{activeCase.complainant}</strong></span>
                  <span className="text-white/20 hidden sm:inline">•</span>
                  <span className="flex items-center gap-1 shrink-0">
                    <FileText className="w-3 h-3 text-cyan-400" />
                    <span className="text-white font-bold">{activeCase.evidenceCount}</span> Evidence Files
                  </span>
                  <span className="text-white/20 hidden sm:inline">•</span>
                  <span className="flex items-center gap-1 shrink-0">
                    <Search className="w-3 h-3 text-amber-400" />
                    <span className="text-white font-bold">{activeCase.indicatorsCount}</span> Indicators
                  </span>
                  <span className="text-white/20 hidden sm:inline">•</span>
                  <span className="flex items-center gap-1 shrink-0">
                    <LinkIcon className="w-3 h-3 text-indigo-400" />
                    <span className="text-white font-bold">{activeCase.linksCount}</span> Related Cases
                  </span>
                </div>
              </div>
            </div>

            {/* Right Buttons: Switch Case + More */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => showToast('Select any case from the left panel to switch active context.')}
                className="px-3 py-1.5 rounded-xl bg-[#061a0f] hover:bg-[#0c2e1b] border border-white/10 hover:border-primary/50 text-white text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#00e676]" />
                <span>Switch Case</span>
              </button>

              <button className="p-1.5 rounded-lg text-content-muted hover:text-white transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* MAIN AI INVESTIGATION ASSISTANT CONTAINER */}
          <div className="rounded-2xl bg-[#040e08] border border-primary/25 shadow-2xl flex flex-col justify-between overflow-hidden">
            
            {/* Header: Bot Icon + Title + Status Badge */}
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#072414] border border-[#00e676]/40 flex items-center justify-center text-[#00e676] shrink-0">
                  <Bot className="w-5 h-5 text-[#00e676]" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white tracking-wide">
                    AI Investigation Assistant
                  </h1>
                  <p className="text-[11px] text-content-muted mt-0.5">
                    Ask questions about this case using recorded information. All answers are grounded in case records.
                  </p>
                </div>
              </div>

              {/* Status Badge & Engine Settings Trigger */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setTempApiKey(apiKey);
                    setTempEngine(selectedEngine);
                    setKeyTestStatus('idle');
                    setKeyTestMessage('');
                    setIsSettingsOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#062414] hover:bg-[#0c361e] border border-[#00e676]/40 text-[#00e676] font-mono text-[11px] font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(0,230,118,0.15)] group"
                  title="Configure AI Model & API Key (Google Gemini / Sovereign Copilot)"
                >
                  {selectedEngine === 'gemini' && apiKey ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-[#00e676] animate-pulse" />
                      <span>Gemini 1.5 Flash</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
                      <span>Cyber Copilot</span>
                    </>
                  )}
                  <Settings className="w-3 h-3 text-content-muted group-hover:text-white group-hover:rotate-45 transition-all ml-1" />
                </button>
              </div>
            </div>

            {/* Suggested Questions Action Shortcuts Bar matching screenshot */}
            <div className="px-4 py-2.5 bg-[#030a06] border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto text-xs font-mono">
              <button
                onClick={() => handleShortcutQuery('summary')}
                className="px-3 py-1.5 rounded-xl bg-[#06170e] hover:bg-[#0c2c1a] border border-white/10 hover:border-primary/40 text-content-secondary hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span>Summarize this case</span>
              </button>

              <button
                onClick={() => handleShortcutQuery('timeline')}
                className="px-3 py-1.5 rounded-xl bg-[#06170e] hover:bg-[#0c2c1a] border border-white/10 hover:border-primary/40 text-content-secondary hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Build an event timeline</span>
              </button>

              <button
                onClick={() => handleShortcutQuery('verification')}
                className="px-3 py-1.5 rounded-xl bg-[#06170e] hover:bg-[#0c2c1a] border border-white/10 hover:border-primary/40 text-content-secondary hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                <span>What evidence needs verification?</span>
              </button>

              <button
                onClick={() => handleShortcutQuery('related')}
                className="px-3 py-1.5 rounded-xl bg-[#06170e] hover:bg-[#0c2c1a] border border-white/10 hover:border-primary/40 text-content-secondary hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Show related cases</span>
              </button>

              <div className="relative shrink-0">
                <button
                  onClick={() => showToast('Additional shortcuts: Extract IOCs, Run Domain DNS, Validate Mule Chain.')}
                  className="px-2.5 py-1.5 rounded-xl bg-[#06170e] hover:bg-[#0c2c1a] border border-white/10 text-content-muted hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <span>More</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Conversation Area with Structured Dossier Message */}
            <div className="p-4 flex-1 overflow-y-auto max-h-[640px] flex flex-col gap-4 font-sans text-xs">
              
              {chatHistory.map((msg) => {
                if (msg.sender === 'user') {
                  return (
                    <div key={msg.id} className="ml-auto max-w-[85%] p-3 rounded-2xl bg-[#00e676]/15 border border-[#00e676]/40 text-white font-medium shadow-md">
                      <div className="flex items-center justify-between gap-4 text-[10px] font-mono text-[#00e676] mb-1">
                        <span className="font-bold">INVESTIGATOR (YOU)</span>
                        <span>{msg.time}</span>
                      </div>
                      <p className="text-xs">{msg.text}</p>
                    </div>
                  );
                }

                if (msg.isInitialDossier) {
                  return (
                    <div key={msg.id} className="flex flex-col gap-3 p-4 rounded-2xl bg-[#05140b] border border-primary/20 shadow-xl">
                      {/* Message Sender Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-[#00e676]/20 border border-[#00e676]/40 flex items-center justify-center text-[#00e676]">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-white">CCIP Assistant</span>
                          <span className="text-content-muted text-[11px]">{msg.time}</span>
                        </div>

                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.06] text-content-muted border border-white/10 font-bold">
                          DEMO DATA
                        </span>
                      </div>

                      {/* Main Title & Narrative Paragraph */}
                      <div>
                        <h2 className="text-sm font-bold text-[#00e676] tracking-wide">
                          Case Summary (Based on recorded case information)
                        </h2>
                        <p className="text-xs text-content-secondary leading-relaxed mt-1.5">
                          {activeCase.summary}
                        </p>
                      </div>

                      {/* 3-Column Structured Information Grid matching screenshot */}
                      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-3 pt-1">
                        
                        {/* Box 1: Recorded Facts */}
                        <div className="p-3.5 rounded-xl bg-[#040e08] border border-white/[0.08] flex flex-col justify-between gap-2.5 xl:col-span-2 2xl:col-span-1 min-w-0">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-2 min-w-0">
                              <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span className="truncate">Recorded Facts</span>
                              <span className="text-[10px] text-content-muted font-normal shrink-0">(from case records)</span>
                            </div>

                            <ul className="flex flex-col gap-1.5 text-[11px] text-content-secondary leading-snug">
                              <li className="break-words">• {activeCase.recordedFacts.incidentReport}</li>
                              {activeCase.recordedFacts.reportedUrl && (
                                <li className="flex items-center gap-1.5 flex-wrap min-w-0">
                                  <span className="shrink-0 text-content-muted">• Reported URL:</span>
                                  <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono text-[10px] border border-cyan-800 break-all select-all">
                                    {activeCase.recordedFacts.reportedUrl}
                                  </span>
                                </li>
                              )}
                              {activeCase.recordedFacts.transactionRef && (
                                <li className="flex items-center gap-1.5 flex-wrap min-w-0">
                                  <span className="shrink-0 text-content-muted">• Transaction Ref:</span>
                                  <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono text-[10px] border border-cyan-800 break-all select-all">
                                    {activeCase.recordedFacts.transactionRef}
                                  </span>
                                </li>
                              )}
                              <li>
                                • Uploaded Documents: {activeCase.recordedFacts.uploadedDocsCount} files
                                <ul className="pl-3 pt-0.5 flex flex-col gap-0.5 text-content-muted text-[10px]">
                                  {activeCase.recordedFacts.docDetails.map((d, i) => (
                                    <li key={i} className="break-words">• {d}</li>
                                  ))}
                                </ul>
                              </li>
                              <li className="break-words">• Incident Type: {activeCase.recordedFacts.incidentType}</li>
                            </ul>
                          </div>

                          <button 
                            onClick={() => showToast('Tracing 3 authoritative case narrative sources.')}
                            className="text-[11px] text-[#00e676] hover:underline flex items-center gap-1 font-mono pt-1 cursor-pointer"
                          >
                            <span>Based on {activeCase.recordedFacts.sourceCount} source records</span>
                            <ArrowRight className="w-3 h-3 shrink-0" />
                          </button>
                        </div>

                        {/* Box 2: Key Indicators (5) */}
                        <div className="p-3.5 rounded-xl bg-[#040e08] border border-white/[0.08] flex flex-col justify-between gap-2.5 min-w-0">
                          <div>
                            <div className="flex items-center justify-between mb-2 min-w-0">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-white min-w-0">
                                <Search className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="truncate">Key Indicators ({activeCase.keyIndicators.length})</span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 text-xs font-mono">
                              {activeCase.keyIndicators.map((ind) => (
                                <div key={ind.id} className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-black/25 border border-white/[0.04] text-[11px] min-w-0 hover:border-white/10 transition-colors">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-white/[0.04] border border-white/[0.06]">
                                      {ind.icon === 'globe' && <Globe className="w-3.5 h-3.5 text-amber-400" />}
                                      {ind.icon === 'server' && <Lock className="w-3.5 h-3.5 text-red-400" />}
                                      {ind.icon === 'mail' && <Mail className="w-3.5 h-3.5 text-purple-400" />}
                                      {ind.icon === 'mobile' && <Smartphone className="w-3.5 h-3.5 text-emerald-400" />}
                                      {ind.icon === 'bank' && <Landmark className="w-3.5 h-3.5 text-amber-400" />}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1 leading-tight">
                                      <span className="text-white text-[11px] font-mono font-medium truncate" title={ind.value}>
                                        {ind.value}
                                      </span>
                                      <span className="text-[10px] text-content-muted font-sans truncate mt-0.5">
                                        {ind.type}
                                      </span>
                                    </div>
                                  </div>

                                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0 whitespace-nowrap self-center ${
                                    ind.badgeType === 'danger' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                                    ind.badgeType === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                                    'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  }`}>
                                    {ind.badge}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <button 
                            onClick={() => {
                              onSelectTab('cross-case-correlation');
                              showToast('Navigating to Cross-Case Correlation 3D view for all indicators.');
                            }}
                            className="text-[11px] text-[#00e676] hover:underline flex items-center gap-1 font-mono pt-1 cursor-pointer"
                          >
                            <span>View all {activeCase.keyIndicators.length} indicators</span>
                            <ArrowRight className="w-3 h-3 shrink-0" />
                          </button>
                        </div>

                        {/* Box 3: Evidence Overview (3) */}
                        <div className="p-3.5 rounded-xl bg-[#040e08] border border-white/[0.08] flex flex-col justify-between gap-2.5 min-w-0">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-2 min-w-0">
                              <Folder className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="truncate">Evidence Overview ({activeCase.evidenceFiles.length})</span>
                            </div>

                            <div className="flex flex-col gap-2">
                              {activeCase.evidenceFiles.map((ev) => (
                                <div key={ev.id} className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-black/25 border border-white/[0.04] text-[11px] min-w-0 hover:border-white/10 transition-colors">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-white/[0.04] border border-white/[0.06]">
                                      {ev.type === 'Image' ? <ImageIcon className="w-3.5 h-3.5 text-cyan-400" /> : <FileText className="w-3.5 h-3.5 text-emerald-400" />}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1 leading-tight">
                                      <span className="text-white text-[11px] font-medium truncate" title={ev.name}>
                                        {ev.name}
                                      </span>
                                      <span className="text-[10px] text-content-muted font-mono mt-0.5">
                                        {ev.timestamp}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-content-muted border border-white/10 shrink-0 whitespace-nowrap self-center">
                                    {ev.type}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <button 
                            onClick={() => {
                              onSelectTab('evidence-repository');
                              showToast('Navigating to Evidence Repository.');
                            }}
                            className="text-[11px] text-[#00e676] hover:underline flex items-center gap-1 font-mono pt-1 cursor-pointer"
                          >
                            <span>Open evidence repository</span>
                            <ArrowRight className="w-3 h-3 shrink-0" />
                          </button>
                        </div>

                      </div>

                      {/* Bottom 3-Card Summary Grid matching screenshot */}
                      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-3 pt-1">
                        
                        {/* Card 1: Current Status */}
                        <div className="p-3.5 rounded-xl bg-[#040e08] border border-white/[0.08] flex flex-col gap-2 font-mono text-[11px] xl:col-span-2 2xl:col-span-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-white font-sans mb-1 min-w-0">
                            <Info className="w-3.5 h-3.5 text-[#00e676] shrink-0" />
                            <span className="truncate">Current Status</span>
                          </div>

                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <span className="text-content-muted font-sans shrink-0">Case Status:</span>
                            <span className="text-white font-bold truncate">{activeCase.statusLabel}</span>
                          </div>

                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <span className="text-content-muted font-sans shrink-0">Assigned To:</span>
                            <span className="text-white font-sans truncate">Naveen (Specialist)</span>
                          </div>

                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <span className="text-content-muted font-sans shrink-0">Priority:</span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shrink-0">
                              {activeCase.priority}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <span className="text-content-muted font-sans shrink-0">Evidence Files:</span>
                            <span className="text-white font-bold shrink-0">{activeCase.evidenceCount}</span>
                          </div>

                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <span className="text-content-muted font-sans shrink-0">Indicators Extracted:</span>
                            <span className="text-white font-bold shrink-0">{activeCase.indicatorsCount}</span>
                          </div>

                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <span className="text-content-muted font-sans shrink-0">Related Cases (Unverified):</span>
                            <span className="text-white font-bold shrink-0">{activeCase.linksCount}</span>
                          </div>

                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <span className="text-content-muted font-sans shrink-0">Verifications Pending:</span>
                            <span className="text-amber-400 font-bold shrink-0">{activeCase.pendingVerifications}</span>
                          </div>
                        </div>

                        {/* Card 2: Verification Needs */}
                        <div className="p-3.5 rounded-xl bg-[#040e08] border border-white/[0.08] flex flex-col gap-2 text-[11px] min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1 min-w-0">
                            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">Verification Needs</span>
                            <span className="text-[10px] text-content-muted font-normal shrink-0">(Suggestions)</span>
                          </div>

                          <ul className="flex flex-col gap-1.5 text-content-secondary leading-snug">
                            {activeCase.verificationNeeds.map((need, idx) => (
                              <li key={idx} className="flex items-start gap-1.5 min-w-0">
                                <span className="text-emerald-400 shrink-0 font-bold">•</span>
                                <span className="break-words">{need}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Card 3: Suggested Next Checks */}
                        <div className="p-3.5 rounded-xl bg-[#040e08] border border-white/[0.08] flex flex-col gap-2 text-[11px] min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1 min-w-0">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">Suggested Next Checks</span>
                          </div>

                          <div className="flex flex-col gap-1">
                            {activeCase.suggestedNextChecks.map((check, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  handleShortcutQuery('verification');
                                  showToast(`Dispatched investigation inquiry: ${check}`);
                                }}
                                className="text-left text-content-secondary hover:text-white flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer group min-w-0"
                              >
                                <span className="truncate group-hover:text-primary transition-colors text-[11px] min-w-0 flex-1" title={check}>• {check}</span>
                                <ArrowRight className="w-3 h-3 text-content-muted group-hover:text-primary shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="mr-auto max-w-[95%] p-4 rounded-2xl bg-[#05140b] border border-white/[0.08] text-content-secondary shadow-xl transition-all">
                    {/* Assistant Message Header */}
                    <div className="flex items-center justify-between gap-4 text-[10px] font-mono text-content-muted mb-2.5 pb-2 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-[#00e676]/20 border border-[#00e676]/40 flex items-center justify-center text-[#00e676] shrink-0">
                          {msg.source === 'gemini' ? <Sparkles className="w-3 h-3 text-[#00e676]" /> : <Bot className="w-3 h-3 text-[#00e676]" />}
                        </div>
                        <span className="font-bold text-white tracking-wide">
                          {msg.source === 'gemini' ? 'GEMINI INVESTIGATION COPILOT' : 'CCIP ASSISTANT'}
                        </span>
                        {msg.modelUsed && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-white/[0.06] text-primary border border-primary/20 font-bold hidden sm:inline">
                            {msg.modelUsed}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span>{msg.time}</span>
                        {msg.text && (
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.text || '')}
                            className="p-1 rounded hover:bg-white/10 text-content-muted hover:text-white transition-colors cursor-pointer"
                            title="Copy response to clipboard"
                          >
                            {copiedText === msg.text ? (
                              <Check className="w-3 h-3 text-[#00e676]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Rich Markdown Formatted Body */}
                    {msg.text && (
                      <div
                        className="markdown-content text-xs text-white leading-relaxed
                          [&_h3]:text-xs [&_h3]:font-bold [&_h3]:text-[#00e676] [&_h3]:tracking-wide [&_h3]:mt-3 [&_h3]:mb-1.5
                          [&_h4]:text-[11px] [&_h4]:font-bold [&_h4]:text-white [&_h4]:mt-2.5 [&_h4]:mb-1
                          [&_p]:text-xs [&_p]:text-content-secondary [&_p]:leading-relaxed [&_p]:mb-2
                          [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-2 [&_ul]:space-y-1
                          [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mb-2 [&_ol]:space-y-1
                          [&_li]:text-[11px] [&_li]:text-content-secondary [&_li]:leading-normal
                          [&_code]:text-[11px] [&_code]:font-mono [&_code]:bg-[#020b05] [&_code]:text-[#00e676] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:border [&_code]:border-[#00e676]/30
                          [&_pre]:bg-[#020904] [&_pre]:p-3 [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-white/10 [&_pre]:my-2.5 [&_pre]:overflow-x-auto
                          [&_blockquote]:border-l-2 [&_blockquote]:border-[#00e676]/60 [&_blockquote]:pl-3 [&_blockquote]:py-1.5 [&_blockquote]:my-2.5 [&_blockquote]:italic [&_blockquote]:bg-[#00e676]/5 [&_blockquote]:rounded-r-lg
                          [&_table]:w-full [&_table]:text-[11px] [&_table]:border-collapse [&_table]:my-2.5
                          [&_th]:border [&_th]:border-white/10 [&_th]:p-1.5 [&_th]:bg-[#06190d] [&_th]:text-white [&_th]:font-bold [&_th]:text-left
                          [&_td]:border [&_td]:border-white/10 [&_td]:p-1.5 [&_td]:text-content-secondary
                          [&_hr]:border-white/10 [&_hr]:my-3"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                      />
                    )}

                    {msg.bullets && (
                      <ul className="flex flex-col gap-1 text-[11px] text-content-secondary pl-2 border-l border-primary/30 mt-2">
                        {msg.bullets.map((b, i) => (
                          <li key={i}>• {b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}

              {isGenerating && (
                <div className="flex items-center gap-2.5 text-xs font-mono text-primary p-3 rounded-xl bg-[#05140b] border border-primary/30 w-fit animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  <span>
                    {selectedEngine === 'gemini' && apiKey
                      ? 'Generating reasoning via Google Gemini 1.5 Flash...'
                      : 'Synthesizing case intelligence with Cyber Copilot...'}
                  </span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Quick Prompt Suggestion Chips */}
            <div className="px-3 pt-2 pb-1.5 bg-[#030a06] border-t border-white/[0.06] flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px] font-mono">
              <span className="text-content-muted text-[10px] shrink-0 font-sans hidden sm:inline">Co-Pilot Prompts:</span>
              <button
                type="button"
                onClick={() => handleSendQuery('What are the features that help to find and detect a phishing URL?')}
                className="px-2.5 py-1 rounded-lg bg-[#061c10] hover:bg-[#0c2f1b] border border-white/10 hover:border-[#00e676]/40 text-[#00e676] hover:text-white transition-all shrink-0 cursor-pointer font-bold"
              >
                🔍 Phishing URL Features
              </button>
              <button
                type="button"
                onClick={() => handleSendQuery('What do you suggest I need to do right now for this case?')}
                className="px-2.5 py-1 rounded-lg bg-[#061c10] hover:bg-[#0c2f1b] border border-white/10 hover:border-[#00e676]/40 text-amber-300 hover:text-white transition-all shrink-0 cursor-pointer"
              >
                🚀 What To Do Right Now
              </button>
              <button
                type="button"
                onClick={() => handleSendQuery('What to do next in this investigation? Give me suggestions and ideas')}
                className="px-2.5 py-1 rounded-lg bg-[#061c10] hover:bg-[#0c2f1b] border border-white/10 hover:border-[#00e676]/40 text-cyan-300 hover:text-white transition-all shrink-0 cursor-pointer"
              >
                🧭 What To Do Next
              </button>
              <button
                type="button"
                onClick={() => handleSendQuery('What are the critical mistakes investigators make or that I need to avoid in this case?')}
                className="px-2.5 py-1 rounded-lg bg-[#061c10] hover:bg-[#0c2f1b] border border-white/10 hover:border-[#00e676]/40 text-red-300 hover:text-white transition-all shrink-0 cursor-pointer"
              >
                ⚠️ Mistakes to Avoid
              </button>
              <button
                type="button"
                onClick={() => handleSendQuery('Draft a formal Section 91 CrPC notice for this case')}
                className="px-2.5 py-1 rounded-lg bg-[#061c10] hover:bg-[#0c2f1b] border border-white/10 hover:border-[#00e676]/40 text-content-secondary hover:text-white transition-all shrink-0 cursor-pointer"
              >
                📜 Draft 91 CrPC Notice
              </button>
              <button
                type="button"
                onClick={() => handleSendQuery('How do I freeze the suspect mule account under Section 102 CrPC?')}
                className="px-2.5 py-1 rounded-lg bg-[#061c10] hover:bg-[#0c2f1b] border border-white/10 hover:border-[#00e676]/40 text-content-secondary hover:text-white transition-all shrink-0 cursor-pointer"
              >
                🧊 Freeze Mule Account
              </button>
            </div>

            {/* Sticky Bottom Chat Input matching screenshot */}
            <form onSubmit={handleSendQuery} className="p-3 bg-[#030a06] flex items-center gap-2">
              <button
                type="button"
                onClick={() => showToast('Attach evidence document or forensic log extract.')}
                className="p-2 rounded-xl text-content-muted hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Attach evidence file"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                placeholder="Ask anything (e.g. 'what is phishing', 'summarize case', 'how to freeze mule account')..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                className="flex-1 bg-[#06150c] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-content-muted focus:outline-none focus:border-primary font-sans"
              />

              <button
                type="submit"
                disabled={!inputQuery.trim() || isGenerating}
                className="px-4 py-2 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-[#020b06] font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(0,230,118,0.25)] transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>

          </div>

        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* COLUMN 3: CASE CONTEXT PANEL (Right Column, 2.8 cols)                   */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-12 xl:col-span-3 flex flex-col gap-3.5 p-4 rounded-2xl bg-[#040e08] border border-primary/20 shadow-xl min-w-0">
          
          {/* Header: Info Icon + Case Context + Chevron */}
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Info className="w-4 h-4 text-[#00e676] shrink-0" />
              <span className="text-xs font-bold text-white tracking-wide truncate">
                Case Context
              </span>
            </div>
            <button 
              onClick={() => setIsCaseContextCollapsed(prev => !prev)}
              className="text-content-muted hover:text-white transition-colors shrink-0 p-0.5"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${isCaseContextCollapsed ? '-rotate-90' : ''}`} />
            </button>
          </div>

          {!isCaseContextCollapsed && (
            <>
              {/* Key-Value Details List matching screenshot */}
              <div className="flex flex-col gap-2.5 text-xs font-sans">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-content-muted text-[11px] shrink-0">Case ID</span>
                  <div className="flex items-center gap-1 text-white font-mono font-bold text-[11px] shrink-0">
                    <span>{activeCase.referenceNumber}</span>
                    <button
                      onClick={() => handleCopy(activeCase.referenceNumber)}
                      className="text-content-muted hover:text-primary transition-colors cursor-pointer p-0.5"
                      title="Copy Case ID"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2 min-w-0">
                  <span className="text-content-muted text-[11px] shrink-0">Title</span>
                  <span className="text-white font-medium text-right text-[11px] leading-tight break-words min-w-0" title={activeCase.title}>
                    {activeCase.title}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-content-muted text-[11px] shrink-0">Source</span>
                  <span className="text-white text-[11px] text-right truncate" title={activeCase.source}>{activeCase.source}</span>
                </div>

                <div className="flex items-baseline justify-between gap-2 min-w-0 flex-wrap sm:flex-nowrap">
                  <span className="text-content-muted text-[11px] shrink-0">Submitted</span>
                  <span className="text-white font-mono text-[11px] text-right whitespace-nowrap shrink-0">{activeCase.date}</span>
                </div>

                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-content-muted text-[11px] shrink-0">Status</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#052918] text-[#00e676] border border-[#00e676]/40 shrink-0 whitespace-nowrap">
                    {activeCase.statusLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-content-muted text-[11px] shrink-0">Priority</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 whitespace-nowrap">
                    {activeCase.priority}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-content-muted text-[11px] shrink-0">Assigned To</span>
                  <span className="text-white text-[11px] text-right truncate">Naveen (Specialist)</span>
                </div>

                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-content-muted text-[11px] shrink-0">Department</span>
                  <span className="text-white text-[11px] text-right truncate">{activeCase.department}</span>
                </div>

                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-content-muted text-[11px] shrink-0">Complainant Type</span>
                  <span className="text-white text-[11px] text-right truncate">{activeCase.complainant}</span>
                </div>

                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-content-muted text-[11px] shrink-0">Incident Type</span>
                  <span className="text-white text-[11px] text-right truncate">{activeCase.incidentType}</span>
                </div>

                {/* Clickable record counts with links matching screenshot */}
                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/[0.04] min-w-0 flex-wrap">
                  <span className="text-content-muted text-[11px] shrink-0">Evidence Files</span>
                  <button 
                    onClick={() => onSelectTab('evidence-repository')}
                    className="flex items-center gap-1 text-[11px] text-[#00e676] hover:underline cursor-pointer font-mono shrink-0 whitespace-nowrap"
                  >
                    <span className="text-white font-bold">{activeCase.evidenceCount}</span>
                    <span>View Evidence →</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 min-w-0 flex-wrap">
                  <span className="text-content-muted text-[11px] shrink-0">Indicators</span>
                  <button 
                    onClick={() => onSelectTab('cross-case-correlation')}
                    className="flex items-center gap-1 text-[11px] text-[#00e676] hover:underline cursor-pointer font-mono shrink-0 whitespace-nowrap"
                  >
                    <span className="text-white font-bold">{activeCase.indicatorsCount}</span>
                    <span>View Indicators →</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 min-w-0 flex-wrap">
                  <span className="text-content-muted text-[11px] shrink-0">Related Cases</span>
                  <button 
                    onClick={() => onSelectTab('cross-case-correlation')}
                    className="flex items-center gap-1.5 text-[11px] text-[#00e676] hover:underline cursor-pointer font-mono shrink-0 whitespace-nowrap"
                  >
                    <span className="text-amber-400 font-bold whitespace-nowrap">{activeCase.linksCount} (Unverified)</span>
                    <span className="whitespace-nowrap">View Cases →</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 min-w-0 flex-wrap">
                  <span className="text-content-muted text-[11px] shrink-0">Verifications Pending</span>
                  <button 
                    onClick={() => onSelectTab('validation-queue')}
                    className="flex items-center gap-1.5 text-[11px] text-[#00e676] hover:underline cursor-pointer font-mono shrink-0 whitespace-nowrap"
                  >
                    <span className="text-amber-400 font-bold">{activeCase.pendingVerifications}</span>
                    <span className="whitespace-nowrap">View Tasks →</span>
                  </button>
                </div>
              </div>

              {/* Case Timeline (Key Events) matching screenshot */}
              <div className="pt-2 border-t border-white/[0.08] flex flex-col gap-2 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white font-mono min-w-0">
                  <Clock className="w-3.5 h-3.5 text-[#00e676] shrink-0" />
                  <span className="truncate">Case Timeline (Key Events)</span>
                </div>

                <div className="relative pl-3 flex flex-col gap-3 font-mono text-[10px] min-w-0">
                  {/* Vertical Timeline Guide Line */}
                  <div className="absolute left-1 top-2 bottom-2 w-[1px] bg-primary/30" />

                  {activeCase.timeline.map((item, idx) => (
                    <div key={idx} className="relative flex flex-col gap-0.5 min-w-0">
                      <div className="absolute -left-3 top-1 w-2 h-2 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676]" />
                      <span className="text-content-muted text-[10px]">{item.time}</span>
                      <span className="text-white font-sans text-[11px] leading-tight break-words">{item.event}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => onSelectTab('investigation-workspace')}
                  className="w-full mt-1 py-2 rounded-xl bg-[#061c10] hover:bg-[#0c311c] border border-white/10 hover:border-primary/50 text-[#00e676] text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>View Full Timeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}

        </div>

      </div>

      {/* AI Model Configuration Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-[#040e08] border border-primary/40 shadow-2xl p-5 flex flex-col gap-4 text-xs font-sans">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#00e676]/20 border border-[#00e676]/40 flex items-center justify-center text-[#00e676]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">AI Engine & Model Configuration</h3>
                  <p className="text-[11px] text-content-muted">Configure real-world LLM inference (Google Gemini or Sovereign Copilot)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-content-muted hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Model Selection Options */}
            <div className="flex flex-col gap-3">
              {/* Option 1: Google Gemini */}
              <label className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                tempEngine === 'gemini' ? 'bg-[#00e676]/10 border-[#00e676]' : 'bg-[#020a05] border-white/10 hover:border-white/20'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="ai-engine"
                      checked={tempEngine === 'gemini'}
                      onChange={() => setTempEngine('gemini')}
                      className="accent-[#00e676]"
                    />
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#00e676]" />
                      Google Gemini 1.5 Flash (Live Cloud AI)
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#00e676]/20 text-[#00e676] font-bold border border-[#00e676]/40">
                    REAL-WORLD LLM
                  </span>
                </div>
                <p className="text-[11px] text-content-secondary pl-5 leading-relaxed">
                  Direct connection to Google Gemini 1.5 Flash API for state-of-the-art conversational responses, deep threat analysis, and nuanced cybercrime case answers.
                </p>

                {tempEngine === 'gemini' && (
                  <div className="mt-2 pl-5 flex flex-col gap-2">
                    <label className="text-[10px] font-mono text-content-muted uppercase">Google Gemini API Key:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        placeholder="Paste your Gemini API key (AIzaSy...)"
                        value={tempApiKey}
                        onChange={(e) => setTempApiKey(e.target.value)}
                        className="flex-1 bg-[#06150c] border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white font-mono placeholder-content-muted focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={handleTestGeminiKey}
                        disabled={isTestingKey || !tempApiKey.trim()}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[10px] disabled:opacity-40 flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        {isTestingKey && <RotateCw className="w-3 h-3 animate-spin" />}
                        <span>Test</span>
                      </button>
                    </div>

                    {keyTestMessage && (
                      <p className={`text-[10px] font-mono ${keyTestStatus === 'success' ? 'text-[#00e676]' : 'text-red-400'}`}>
                        {keyTestMessage}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-content-muted pt-1">
                      <span>Don't have an API key?</span>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <span>Get free Gemini API Key</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                )}
              </label>

              {/* Option 2: CCIP Sovereign Cyber Copilot */}
              <label className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                tempEngine === 'copilot' ? 'bg-[#00e676]/10 border-[#00e676]' : 'bg-[#020a05] border-white/10 hover:border-white/20'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="ai-engine"
                      checked={tempEngine === 'copilot'}
                      onChange={() => setTempEngine('copilot')}
                      className="accent-[#00e676]"
                    />
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-cyan-400" />
                      CCIP Sovereign Cyber Copilot (Built-in In-Browser AI)
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                    OFFLINE / SECURE
                  </span>
                </div>
                <p className="text-[11px] text-content-secondary pl-5 leading-relaxed">
                  High-fidelity cyber intelligence reasoning engine running directly in your browser. Covers phishing, ransomware, mule accounts, Section 65B/63 BSA, Section 91/102 CrPC, and case dossier queries with zero external network transmission.
                </p>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-content-muted hover:text-white hover:bg-white/10 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-4 py-1.5 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-[#020b06] font-bold text-xs shadow-[0_0_12px_rgba(0,230,118,0.25)] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save & Apply</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
