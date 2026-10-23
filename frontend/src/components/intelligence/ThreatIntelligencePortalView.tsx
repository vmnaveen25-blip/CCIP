import React, { useState, useMemo } from 'react';
import { 
  Users, 
  RefreshCw, 
  Search, 
  Link as LinkIcon, 
  Radio, 
  Globe, 
  FileCode, 
  Mail, 
  Eye, 
  Ban, 
  Shield, 
  Calendar, 
  SlidersHorizontal, 
  ChevronDown, 
  Check, 
  Copy, 
  X, 
  AlertTriangle, 
  ExternalLink, 
  ShieldCheck, 
  Lock, 
  ArrowRight,
  Database,
  Layers,
  Activity,
  CheckCircle2,
  Share2,
  Terminal,
  Clock,
  Sparkles
} from 'lucide-react';
import { Complaint } from '../../types';

export interface ThreatActorCard {
  id: string;
  name: string;
  cluster: string;
  category: string;
  status: 'ACTIVE' | 'MONITORING' | 'BLOCKED';
  primaryThreatType: string;
  confidenceScore: number;
  ttpSummary: string;
  mitreTechniques: string[];
  associatedCases: string[];
}

export interface ThreatIndicator {
  id: string;
  iocType: 'URL' | 'IP Address' | 'Domain' | 'SHA-256 Hash' | 'Email';
  iocValue: string;
  relatedThreat: string;
  confidence: number;
  status: 'Malicious' | 'Suspicious' | 'Blocked';
  actionType: 'view' | 'block-review';
  source: string;
  firstObserved: string;
  lastObserved: string;
  observedDaysAgo: number;
  detectionSignatures: string[];
  linkedCases: Array<{
    id: string;
    caseNumber: string;
    title: string;
    status: string;
    lossAmount?: string;
  }>;
  rawTelemetry: {
    asn?: string;
    country?: string;
    registrar?: string;
    reputationVerdict?: string;
    ipOrDomain?: string;
  };
}

interface ThreatIntelligencePortalViewProps {
  onSelectTab: (tab: string) => void;
  onSelectCase?: (caseId: string) => void;
  complaints?: Complaint[];
}

const INITIAL_THREAT_ACTORS: ThreatActorCard[] = [
  {
    id: 'lazarus',
    name: 'Lazarus Group',
    cluster: 'DarkSynapse C2 Cluster',
    category: 'State-sponsored threat actor',
    status: 'ACTIVE',
    primaryThreatType: 'Ransomware / C2',
    confidenceScore: 92,
    ttpSummary: 'Advanced persistent threat specializing in cryptocurrency theft, state-sponsored cyber espionage, and ransomware deployment with custom stealth loaders.',
    mitreTechniques: ['T1566.002 - Spearphishing Link', 'T1071.001 - Web Protocols C2', 'T1059.001 - PowerShell Execution', 'T1027 - Obfuscated Files'],
    associatedCases: ['CASE-2026-0842', 'CASE-2026-0914']
  },
  {
    id: 'scattered-spider',
    name: 'Scattered Spider',
    cluster: 'Evilginx Phish Proxy v3',
    category: 'Credential Harvesting',
    status: 'MONITORING',
    primaryThreatType: 'Phishing / Social Engineering',
    confidenceScore: 89,
    ttpSummary: 'Cybercriminal syndicate heavily focused on identity-centric attacks, SIM swapping, Okta/MFA bypass proxies, and cloud infrastructure takeover.',
    mitreTechniques: ['T1539 - Steal Web Session Cookie', 'T1556 - Modify Authentication Process', 'T1589 - Gather Victim Identity Info'],
    associatedCases: ['CASE-2026-0842', 'COMP-2026-1109']
  },
  {
    id: 'finsteal',
    name: 'FinSteal Syndicate',
    cluster: 'Tornado Peel Mixer Hop',
    category: 'Money Laundering',
    status: 'BLOCKED',
    primaryThreatType: 'Financial Fraud',
    confidenceScore: 95,
    ttpSummary: 'Organized financial cybercrime collective utilizing peel-chain smart contracts, mule bank accounts, and fake payment gateway proxies across southern Asia.',
    mitreTechniques: ['T1583.003 - Virtual Private Server', 'T1584 - Compromise Infrastructure', 'T1048 - Exfiltration Over Alternative Protocol'],
    associatedCases: ['CASE-2026-0881', 'CASE-2026-0902']
  }
];

const INITIAL_INDICATORS: ThreatIndicator[] = [
  {
    id: 'ioc-1',
    iocType: 'URL',
    iocValue: 'https://login-example.invalid',
    relatedThreat: 'Scattered Spider',
    confidence: 92,
    status: 'Malicious',
    actionType: 'view',
    source: 'I4C Cyber Threat Intelligence Grid',
    firstObserved: '04 Jun 2026, 14:22 IST',
    lastObserved: '12 Jun 2026, 09:15 IST',
    observedDaysAgo: 1,
    detectionSignatures: [
      'Evilginx3 Reverse-Proxy Signature Match',
      'High-entropy login subpath masquerading as SBI NetBanking',
      'TLS Certificate: Dynamic ZeroSSL ephemeral issuer'
    ],
    linkedCases: [
      {
        id: 'case-842',
        caseNumber: 'CASE-2026-0842',
        title: 'High-Value Corporate Credential Harvesting via SMS Phishing',
        status: 'UNDER_INVESTIGATION',
        lossAmount: '₹42,50,000'
      },
      {
        id: 'comp-1109',
        caseNumber: 'COMP-2026-1109',
        title: 'Unauthorized OTP Interception on Executive Account',
        status: 'TRIAGED'
      }
    ],
    rawTelemetry: {
      asn: 'AS13335 (Cloudflare Proxy)',
      country: 'IN / Global CDN',
      registrar: 'NameCheap Privacy Protect',
      reputationVerdict: 'Phishing Reverse Proxy • Block Recommended',
      ipOrDomain: 'login-example.invalid'
    }
  },
  {
    id: 'ioc-2',
    iocType: 'IP Address',
    iocValue: '192.0.2.45',
    relatedThreat: 'Lazarus Group',
    confidence: 88,
    status: 'Malicious',
    actionType: 'block-review',
    source: 'CERT-In Threat Intelligence Enclave',
    firstObserved: '28 May 2026, 18:40 IST',
    lastObserved: '12 Jun 2026, 10:20 IST',
    observedDaysAgo: 2,
    detectionSignatures: [
      'CobaltStrike Team Server Listener v4.9 beaconing',
      'TCP Port 443 anomalous TLS handshake with DarkSynapse payload',
      'Active scanner probe hitting municipal power grid endpoints'
    ],
    linkedCases: [
      {
        id: 'case-914',
        caseNumber: 'CASE-2026-0914',
        title: 'Ransomware Lateral Movement via C2 Ingress in Utility Gateway',
        status: 'ESCALATED',
        lossAmount: '₹1,20,00,000'
      }
    ],
    rawTelemetry: {
      asn: 'AS64496 (Dedicated VPS Mesh)',
      country: 'RO (Bucharest Node)',
      reputationVerdict: 'Active C2 Team Server Node',
      ipOrDomain: '192.0.2.45'
    }
  },
  {
    id: 'ioc-3',
    iocType: 'Domain',
    iocValue: 'update-example.invalid',
    relatedThreat: 'FinSteal Syndicate',
    confidence: 76,
    status: 'Suspicious',
    actionType: 'view',
    source: 'NCRP DNS Takedown Sensor',
    firstObserved: '02 Jun 2026, 11:05 IST',
    lastObserved: '11 Jun 2026, 22:45 IST',
    observedDaysAgo: 3,
    detectionSignatures: [
      'Newly registered domain (< 96 hours old)',
      'Fast-flux DNS pointing to rotating non-resident IP addresses',
      'Cloned banking portal assets detected in HTTP response body'
    ],
    linkedCases: [
      {
        id: 'case-881',
        caseNumber: 'CASE-2026-0881',
        title: 'Multi-Hop UPI Payment Gateway Hijack Campaign',
        status: 'UNDER_INVESTIGATION',
        lossAmount: '₹18,20,000'
      }
    ],
    rawTelemetry: {
      asn: 'AS20940 (Akamai Linode)',
      country: 'SG (Singapore Data Center)',
      registrar: 'PublicDomainRegistry Direct',
      reputationVerdict: 'Suspicious Fast-Flux DNS Endpoint',
      ipOrDomain: 'update-example.invalid'
    }
  },
  {
    id: 'ioc-4',
    iocType: 'SHA-256 Hash',
    iocValue: 'a3f9d2c4e6b7a1d8c9f2e3a4b5c6d7e8f9b2a1c4d5e6f7a8b9c0d1e2f3a4b5c6',
    relatedThreat: 'Lazarus Group',
    confidence: 90,
    status: 'Malicious',
    actionType: 'view',
    source: 'National Cyber Forensic Repository (NCFR)',
    firstObserved: '06 Jun 2026, 03:14 IST',
    lastObserved: '12 Jun 2026, 08:30 IST',
    observedDaysAgo: 1,
    detectionSignatures: [
      'DarkSynapse Stealth DLL Dropper binary',
      'Antivirus Evasion via Process Hollowing into svchost.exe',
      'Embedded encrypted C2 fallback list referencing port 8443'
    ],
    linkedCases: [
      {
        id: 'case-914',
        caseNumber: 'CASE-2026-0914',
        title: 'Ransomware Lateral Movement via C2 Ingress in Utility Gateway',
        status: 'ESCALATED'
      }
    ],
    rawTelemetry: {
      reputationVerdict: 'Weaponized Trojanized Dropper DLL',
      ipOrDomain: 'SHA-256 PE32+ Executable'
    }
  },
  {
    id: 'ioc-5',
    iocType: 'Email',
    iocValue: 'security-alert@example.invalid',
    relatedThreat: 'Scattered Spider',
    confidence: 68,
    status: 'Suspicious',
    actionType: 'view',
    source: 'National Cybercrime Reporting Ingest',
    firstObserved: '08 Jun 2026, 16:50 IST',
    lastObserved: '12 Jun 2026, 06:10 IST',
    observedDaysAgo: 2,
    detectionSignatures: [
      'SPF / DKIM alignment failure on outbound gateway',
      'Header Spoofing mimicking Reserve Bank of India notification',
      'Embedded redirect matching Scattered Spider shortlink infrastructure'
    ],
    linkedCases: [
      {
        id: 'case-842',
        caseNumber: 'CASE-2026-0842',
        title: 'High-Value Corporate Credential Harvesting via SMS Phishing',
        status: 'UNDER_INVESTIGATION'
      }
    ],
    rawTelemetry: {
      country: 'Unknown Relaying SMTP Host',
      reputationVerdict: 'Phishing Spear Sender Identity',
      ipOrDomain: 'security-alert@example.invalid'
    }
  }
];

export const ThreatIntelligencePortalView: React.FC<ThreatIntelligencePortalViewProps> = ({
  onSelectTab,
  onSelectCase,
  complaints = []
}) => {
  // Main Data States
  const [threatActors, setThreatActors] = useState<ThreatActorCard[]>(INITIAL_THREAT_ACTORS);
  const [indicators, setIndicators] = useState<ThreatIndicator[]>(INITIAL_INDICATORS);
  const [lastSyncTime, setLastSyncTime] = useState<string>('12 Jun 2026, 10:24 AM');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIocType, setSelectedIocType] = useState<string>('ALL');
  const [selectedConfidenceLevel, setSelectedConfidenceLevel] = useState<string>('ALL');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('7d');
  const [activeThreatActorFilter, setActiveThreatActorFilter] = useState<string | null>(null);

  // Modals
  const [selectedIndicatorForView, setSelectedIndicatorForView] = useState<ThreatIndicator | null>(null);
  const [selectedIndicatorForBlock, setSelectedIndicatorForBlock] = useState<ThreatIndicator | null>(null);
  const [selectedActorDossier, setSelectedActorDossier] = useState<ThreatActorCard | null>(null);

  // Block Modal Form States
  const [blockNotes, setBlockNotes] = useState<string>('Forensic telemetry confirms active malicious campaign. Verified by Level 2 Cyber Specialist.');
  const [blockCheckFirewall, setBlockCheckFirewall] = useState<boolean>(true);
  const [blockCheckSinkhole, setBlockCheckSinkhole] = useState<boolean>(true);
  const [blockCheckNotify, setBlockCheckNotify] = useState<boolean>(true);
  const [isBlockingInProgress, setIsBlockingInProgress] = useState<boolean>(false);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // WORKFLOW 1: Threat Feed Synchronization
  // --------------------------------------------------------------------------
  const handleSyncNow = () => {
    setIsSyncing(true);
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
      setLastSyncTime(formatted);
      setIsSyncing(false);
      setSyncSuccessToast('Threat intelligence feeds synchronized successfully across 4 upstream sensor grids.');
      setTimeout(() => setSyncSuccessToast(null), 4500);
    }, 1200);
  };

  // --------------------------------------------------------------------------
  // WORKFLOW 2: Threat Actor Filter
  // --------------------------------------------------------------------------
  const handleCardClick = (actor: ThreatActorCard) => {
    if (activeThreatActorFilter === actor.name) {
      setActiveThreatActorFilter(null);
    } else {
      setActiveThreatActorFilter(actor.name);
    }
  };

  // --------------------------------------------------------------------------
  // WORKFLOW 3: Filter & Search Computation
  // --------------------------------------------------------------------------
  const filteredIndicators = useMemo(() => {
    return indicators.filter(item => {
      // Free-text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesValue = item.iocValue.toLowerCase().includes(q);
        const matchesThreat = item.relatedThreat.toLowerCase().includes(q);
        const matchesType = item.iocType.toLowerCase().includes(q);
        const matchesSource = item.source.toLowerCase().includes(q);
        if (!matchesValue && !matchesThreat && !matchesType && !matchesSource) {
          return false;
        }
      }

      // Threat Actor card selection filter
      if (activeThreatActorFilter && item.relatedThreat !== activeThreatActorFilter) {
        return false;
      }

      // IOC Type filter
      if (selectedIocType !== 'ALL') {
        if (selectedIocType === 'URL' && item.iocType !== 'URL') return false;
        if (selectedIocType === 'IP' && item.iocType !== 'IP Address') return false;
        if (selectedIocType === 'DOMAIN' && item.iocType !== 'Domain') return false;
        if (selectedIocType === 'HASH' && item.iocType !== 'SHA-256 Hash') return false;
        if (selectedIocType === 'EMAIL' && item.iocType !== 'Email') return false;
      }

      // Confidence Level filter
      if (selectedConfidenceLevel !== 'ALL') {
        if (selectedConfidenceLevel === 'CRITICAL' && item.confidence < 90) return false;
        if (selectedConfidenceLevel === 'HIGH' && (item.confidence < 80 || item.confidence >= 90)) return false;
        if (selectedConfidenceLevel === 'MEDIUM' && (item.confidence < 60 || item.confidence >= 80)) return false;
        if (selectedConfidenceLevel === 'LOW' && item.confidence >= 60) return false;
      }

      // Date Range filter
      if (selectedDateRange !== 'ALL') {
        if (selectedDateRange === '24h' && item.observedDaysAgo > 1) return false;
        if (selectedDateRange === '7d' && item.observedDaysAgo > 7) return false;
        if (selectedDateRange === '30d' && item.observedDaysAgo > 30) return false;
      }

      return true;
    });
  }, [indicators, searchQuery, activeThreatActorFilter, selectedIocType, selectedConfidenceLevel, selectedDateRange]);

  // --------------------------------------------------------------------------
  // WORKFLOW 5: Block Review & Authorization Execution
  // --------------------------------------------------------------------------
  const handleExecuteBlock = () => {
    if (!selectedIndicatorForBlock) return;
    setIsBlockingInProgress(true);

    setTimeout(() => {
      const targetId = selectedIndicatorForBlock.id;
      setIndicators(prev => prev.map(ind => {
        if (ind.id === targetId) {
          return {
            ...ind,
            status: 'Blocked',
            actionType: 'view'
          };
        }
        return ind;
      }));

      // Update Threat Actor Card status if needed
      setThreatActors(prev => prev.map(actor => {
        if (actor.name === selectedIndicatorForBlock.relatedThreat && actor.name === 'Lazarus Group') {
          return {
            ...actor,
            ttpSummary: actor.ttpSummary + ' (Perimeter countermeasures actively enforced for 192.0.2.45)'
          };
        }
        return actor;
      }));

      setIsBlockingInProgress(false);
      setSyncSuccessToast(`Perimeter firewall drop rule active across all enclave gateway boundaries for ${selectedIndicatorForBlock.iocValue}.`);
      setTimeout(() => setSyncSuccessToast(null), 5000);
      setSelectedIndicatorForBlock(null);
    }, 900);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedValue(text);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  const getIocTypeIcon = (type: string) => {
    switch (type) {
      case 'URL':
        return <LinkIcon className="w-4 h-4 text-[#00e676]" />;
      case 'IP Address':
        return <Radio className="w-4 h-4 text-[#00e676]" />;
      case 'Domain':
        return <Globe className="w-4 h-4 text-[#00e676]" />;
      case 'SHA-256 Hash':
        return <FileCode className="w-4 h-4 text-[#00e676]" />;
      case 'Email':
        return <Mail className="w-4 h-4 text-[#00e676]" />;
      default:
        return <Shield className="w-4 h-4 text-[#00e676]" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 text-white pb-12 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {syncSuccessToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 p-4 rounded-2xl bg-[#041a0e] border border-[#00e676]/60 text-white shadow-[0_12px_40px_rgba(0,230,118,0.25)] animate-in slide-in-from-top-4 duration-200 max-w-md">
          <CheckCircle2 className="w-5 h-5 text-[#00e676] shrink-0" />
          <div className="text-xs font-sans leading-relaxed text-[#c8ddd0]">
            {syncSuccessToast}
          </div>
          <button 
            onClick={() => setSyncSuccessToast(null)}
            className="p-1 rounded text-[#8fa396] hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. HEADER SECTION (EXACT MATCH TO REFERENCE IMAGE)                  */}
      {/* ==================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
              Threat Intelligence
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#04160c] border border-[#00e676]/40 text-[#00e676] text-[11px] font-mono font-bold tracking-wider shadow-[0_0_12px_rgba(0,230,118,0.15)]">
              <span className="w-2 h-2 rounded-full bg-[#00e676] shadow-[0_0_8px_#00e676] animate-pulse" />
              FEEDS SYNCED
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8fa396] mt-1 font-sans">
            Monitor emerging threats, malicious indicators, and threat actor activity from trusted sources.
          </p>
        </div>

        {/* Sync Controls */}
        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <span className="text-xs text-[#8fa396] font-sans">
            Last sync: <span className="text-white font-medium">{lastSyncTime}</span>
          </span>

          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="p-2 rounded-xl bg-[#04160c] border border-[#00e676]/30 hover:border-[#00e676]/60 text-[#00e676] hover:bg-[#00e676]/10 transition-all disabled:opacity-50"
            title="Refresh feeds"
            aria-label="Refresh feeds"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#04160c] border border-[#00e676]/60 hover:bg-[#00e676]/15 text-[#00e676] font-semibold text-xs transition-all shadow-[0_0_15px_rgba(0,230,118,0.15)] active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync Now</span>
          </button>
        </div>
      </div>

      {/* Filter notification pill if filtered by Actor */}
      {activeThreatActorFilter && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#04160c] border border-[#00e676]/40 text-xs text-[#c8ddd0]">
          <div className="flex items-center gap-2">
            <span className="text-[#00e676] font-bold">Active Filter:</span>
            <span>Showing indicators associated with <strong className="text-white">{activeThreatActorFilter}</strong></span>
          </div>
          <button
            onClick={() => setActiveThreatActorFilter(null)}
            className="px-2 py-0.5 rounded bg-white/[0.08] hover:bg-white/[0.15] text-white text-[11px] font-mono flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear Filter
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. THREAT ACTOR SUMMARY CARDS (GRID OF 3)                            */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {threatActors.map((actor) => {
          const isSelected = activeThreatActorFilter === actor.name;
          return (
            <div
              key={actor.id}
              onClick={() => handleCardClick(actor)}
              className={`
                group relative p-5 rounded-2xl bg-[#05160d] border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4
                shadow-[0_8px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_12px_32px_rgba(0,230,118,0.12)] hover:-translate-y-0.5
                ${isSelected ? 'border-[#00e676] bg-[#071f12] ring-1 ring-[#00e676]/50' : 'border-[#00e676]/20 hover:border-[#00e676]/50'}
              `}
            >
              {/* Card Top: Icon, Group Name, Status Badge, Cluster, Category */}
              <div className="flex items-start gap-3.5">
                {/* Users Icon Container */}
                <div className="w-12 h-12 rounded-2xl bg-[#00e676]/15 border border-[#00e676]/35 flex items-center justify-center text-[#00e676] shrink-0 shadow-[0_0_16px_rgba(0,230,118,0.2)] group-hover:scale-105 transition-transform">
                  <Users className="w-6 h-6 text-[#00e676]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-bold text-[#00e676] tracking-tight group-hover:text-white transition-colors truncate">
                      {actor.name}
                    </span>
                    <span
                      className={`
                        text-[10px] font-mono font-bold px-2 py-0.5 rounded tracking-wider shrink-0
                        ${actor.status === 'ACTIVE' ? 'bg-[#3b1219] border border-[#ef4444]/60 text-[#ef4444]' :
                          actor.status === 'MONITORING' ? 'bg-[#38260c] border border-[#f59e0b]/60 text-[#f59e0b]' :
                          'bg-[#3b1219] border border-[#ef4444]/60 text-[#ef4444]'}
                      `}
                    >
                      {actor.status}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-white mt-0.5 truncate">
                    {actor.cluster}
                  </div>
                  <div className="text-xs text-[#8fa396] truncate mt-0.5">
                    {actor.category}
                  </div>
                </div>
              </div>

              {/* Card Bottom: Primary Threat Type & Confidence Score */}
              <div className="pt-3 border-t border-[#00e676]/15 flex items-center justify-between gap-4">
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] text-[#8fa396] leading-tight">Primary Threat Type</span>
                  <span className="text-xs font-medium text-white truncate mt-0.5">
                    {actor.primaryThreatType}
                  </span>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[11px] text-[#8fa396] leading-tight">Confidence Score</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold text-[#00e676] font-mono">
                      {actor.confidenceScore}%
                    </span>
                    <div className="w-16 sm:w-20 bg-[#092214] h-1.5 rounded-full overflow-hidden border border-[#00e676]/20">
                      <div 
                        className="bg-[#00e676] h-full rounded-full shadow-[0_0_8px_#00e676]" 
                        style={{ width: `${actor.confidenceScore}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* 3. IOCS & THREAT INDICATORS CARD & TABLE                            */}
      {/* ==================================================================== */}
      <div className="rounded-2xl bg-[#04140b] border border-[#00e676]/25 shadow-[0_12px_40px_rgba(0,0,0,0.65)] overflow-hidden flex flex-col">
        
        {/* Table Filter & Search Header */}
        <div className="p-4 sm:p-5 border-b border-[#00e676]/15 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 bg-[#030e07]">
          {/* Card Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shadow-[0_0_12px_rgba(0,230,118,0.2)] shrink-0">
              <Database className="w-4 h-4 text-[#00e676]" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight font-sans">
              IOCs & Threat Indicators
            </h2>
          </div>

          {/* Right Controls: Filter Dropdowns + Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter 1: IOC Type Dropdown */}
            <div className="relative">
              <select
                value={selectedIocType}
                onChange={(e) => setSelectedIocType(e.target.value)}
                className="appearance-none bg-[#071a10] border border-[#00e676]/25 hover:border-[#00e676]/50 rounded-xl px-3 py-1.5 pr-8 text-xs text-white font-sans focus:outline-none focus:border-[#00e676] transition-colors cursor-pointer"
                aria-label="Filter by IOC Type"
              >
                <option value="ALL">All IOC Types</option>
                <option value="URL">URL</option>
                <option value="IP">IP Address</option>
                <option value="DOMAIN">Domain</option>
                <option value="HASH">SHA-256 Hash</option>
                <option value="EMAIL">Email</option>
              </select>
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#8fa396] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filter 2: Confidence Levels Dropdown */}
            <div className="relative">
              <select
                value={selectedConfidenceLevel}
                onChange={(e) => setSelectedConfidenceLevel(e.target.value)}
                className="appearance-none bg-[#071a10] border border-[#00e676]/25 hover:border-[#00e676]/50 rounded-xl px-3 py-1.5 pr-8 text-xs text-white font-sans focus:outline-none focus:border-[#00e676] transition-colors cursor-pointer"
                aria-label="Filter by Confidence Level"
              >
                <option value="ALL">All Confidence Levels</option>
                <option value="CRITICAL">Critical (&gt;90%)</option>
                <option value="HIGH">High (80-89%)</option>
                <option value="MEDIUM">Medium (60-79%)</option>
                <option value="LOW">Low (&lt;60%)</option>
              </select>
              <Shield className="w-3.5 h-3.5 text-[#8fa396] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filter 3: Date Range Dropdown */}
            <div className="relative">
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="appearance-none bg-[#071a10] border border-[#00e676]/25 hover:border-[#00e676]/50 rounded-xl px-3 py-1.5 pr-8 text-xs text-white font-sans focus:outline-none focus:border-[#00e676] transition-colors cursor-pointer"
                aria-label="Filter by Date Range"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="ALL">All Time</option>
              </select>
              <Calendar className="w-3.5 h-3.5 text-[#8fa396] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Search Input Box */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-[#8fa396] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search indicators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#071a10] border border-[#00e676]/25 hover:border-[#00e676]/50 focus:border-[#00e676] rounded-xl pl-9 pr-7 py-1.5 text-xs text-white placeholder-[#8fa396] focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8fa396] hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Indicators Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#00e676]/15 bg-[#030a05] text-[#8fa396] font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">IOC Type</th>
                <th className="py-3 px-4 font-semibold">Indicator Value</th>
                <th className="py-3 px-4 font-semibold">Related Threat</th>
                <th className="py-3 px-4 font-semibold">Confidence</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#00e676]/10 font-sans">
              {filteredIndicators.length > 0 ? (
                filteredIndicators.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-[#00e676]/[0.04] transition-colors group"
                  >
                    {/* 1. IOC Type */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getIocTypeIcon(item.iocType)}
                        <span className="text-white font-medium">
                          {item.iocType}
                        </span>
                      </div>
                    </td>

                    {/* 2. Indicator Value */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 max-w-[280px] sm:max-w-md">
                        <span className="font-mono text-xs text-white truncate select-all group-hover:text-[#00e676] transition-colors" title={item.iocValue}>
                          {item.iocValue}
                        </span>
                        <button
                          onClick={() => handleCopy(item.iocValue)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#8fa396] hover:text-white transition-opacity"
                          title="Copy indicator"
                        >
                          {copiedValue === item.iocValue ? (
                            <Check className="w-3 h-3 text-[#00e676]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* 3. Related Threat */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-white font-medium">
                        {item.relatedThreat}
                      </span>
                    </td>

                    {/* 4. Confidence */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-white text-xs min-w-[32px]">
                          {item.confidence}%
                        </span>
                        <div className="w-16 sm:w-20 bg-[#092214] h-1.5 rounded-full overflow-hidden border border-[#00e676]/20">
                          <div 
                            className="bg-[#00e676] h-full rounded-full shadow-[0_0_8px_#00e676]"
                            style={{ width: `${item.confidence}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* 5. Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`
                          inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border
                          ${item.status === 'Malicious' ? 'bg-[#3b1219] border-[#ef4444]/60 text-[#ef4444]' :
                            item.status === 'Suspicious' ? 'bg-[#38260c] border-[#f59e0b]/60 text-[#f59e0b]' :
                            'bg-[#081a10] border-[#00e676]/40 text-[#00e676]'}
                        `}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* 6. Action Button */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      {item.status === 'Malicious' && item.actionType === 'block-review' ? (
                        <button
                          onClick={() => setSelectedIndicatorForBlock(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#280c10] border border-[#ef4444]/60 hover:bg-[#ef4444]/20 text-[#ef4444] text-xs font-semibold shadow-[0_0_12px_rgba(239,68,68,0.15)] hover:shadow-[0_0_16px_rgba(239,68,68,0.3)] transition-all active:scale-[0.98]"
                        >
                          <Ban className="w-3.5 h-3.5 text-[#ef4444]" />
                          <span>Block Review</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedIndicatorForView(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#04160c] border border-[#00e676]/40 hover:bg-[#00e676]/20 text-[#00e676] text-xs font-semibold shadow-[0_0_12px_rgba(0,230,118,0.1)] hover:shadow-[0_0_16px_rgba(0,230,118,0.25)] transition-all active:scale-[0.98]"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#00e676]" />
                          <span>View</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#8fa396]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Shield className="w-8 h-8 text-[#8fa396]/40" />
                      <span className="text-sm font-sans">No threat indicators match your filter criteria.</span>
                      <button 
                        onClick={() => { setSearchQuery(''); setSelectedIocType('ALL'); setSelectedConfidenceLevel('ALL'); setSelectedDateRange('7d'); setActiveThreatActorFilter(null); }}
                        className="text-xs text-[#00e676] underline hover:text-white mt-1"
                      >
                        Reset all filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination matching screenshot */}
        <div className="p-4 border-t border-[#00e676]/15 flex items-center justify-between text-xs text-[#8fa396] bg-[#030e07]">
          <span>
            Showing 1 to {filteredIndicators.length} of {filteredIndicators.length} indicators
          </span>

          <div className="flex items-center gap-1.5 font-mono">
            <button
              disabled
              className="w-8 h-8 rounded-lg bg-[#07170e] border border-white/[0.08] text-[#6e8d7a] flex items-center justify-center opacity-50 cursor-not-allowed"
              aria-label="Previous page"
            >
              &lt;
            </button>
            <button
              className="w-8 h-8 rounded-lg bg-[#00e676]/15 border border-[#00e676] text-[#00e676] font-bold flex items-center justify-center shadow-[0_0_10px_rgba(0,230,118,0.2)]"
            >
              1
            </button>
            <button
              disabled
              className="w-8 h-8 rounded-lg bg-[#07170e] border border-white/[0.08] text-[#6e8d7a] flex items-center justify-center opacity-50 cursor-not-allowed"
              aria-label="Next page"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. MODAL: VIEW INDICATOR DETAILS & ENCLAVE LINKED CASES (WORKFLOW 4) */}
      {/* ==================================================================== */}
      {selectedIndicatorForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl my-6 rounded-3xl p-6 sm:p-7 bg-[#06140c] border border-[#00e676]/30 shadow-[0_32px_96px_rgba(0,0,0,0.9)] text-white">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#00e676]/15 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676]">
                  {getIocTypeIcon(selectedIndicatorForView.iocType)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono uppercase font-bold text-[#8fa396]">
                      {selectedIndicatorForView.iocType} INDICATOR
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                        selectedIndicatorForView.status === 'Malicious' ? 'bg-[#3b1219] border-[#ef4444]/60 text-[#ef4444]' :
                        selectedIndicatorForView.status === 'Suspicious' ? 'bg-[#38260c] border-[#f59e0b]/60 text-[#f59e0b]' :
                        'bg-[#081a10] border-[#00e676]/40 text-[#00e676]'
                      }`}
                    >
                      {selectedIndicatorForView.status}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-mono font-bold text-white break-all select-all mt-0.5">
                    {selectedIndicatorForView.iocValue}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedIndicatorForView(null)}
                className="p-1.5 rounded-lg text-[#8fa396] hover:text-white hover:bg-white/[0.08]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Tabs / Sections */}
            <div className="flex flex-col gap-5 text-xs max-h-[70vh] overflow-y-auto pr-1">
              
              {/* Telemetry & Confidence Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-[#030906] border border-[#00e676]/15">
                <div>
                  <span className="text-[10px] text-[#8fa396] uppercase font-mono">Confidence</span>
                  <div className="text-sm font-bold text-[#00e676] font-mono mt-0.5">
                    {selectedIndicatorForView.confidence}%
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-[#8fa396] uppercase font-mono">Threat Group</span>
                  <div className="text-sm font-bold text-white truncate mt-0.5">
                    {selectedIndicatorForView.relatedThreat}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-[#8fa396] uppercase font-mono">First Observed</span>
                  <div className="text-xs text-[#c8ddd0] mt-0.5">
                    {selectedIndicatorForView.firstObserved}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-[#8fa396] uppercase font-mono">Last Observed</span>
                  <div className="text-xs text-[#c8ddd0] mt-0.5">
                    {selectedIndicatorForView.lastObserved}
                  </div>
                </div>
              </div>

              {/* Source & Network Telemetry */}
              <div className="p-4 rounded-2xl bg-[#04120a] border border-[#00e676]/15 flex flex-col gap-2">
                <span className="text-[11px] font-mono uppercase font-bold text-[#00e676]">
                  Verified Intelligence Source &amp; Network Telemetry
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#8fa396]">Feed Origin: </span>
                    <span className="text-white font-medium">{selectedIndicatorForView.source}</span>
                  </div>
                  {selectedIndicatorForView.rawTelemetry.asn && (
                    <div>
                      <span className="text-[#8fa396]">Autonomous System: </span>
                      <span className="text-white font-medium">{selectedIndicatorForView.rawTelemetry.asn}</span>
                    </div>
                  )}
                  {selectedIndicatorForView.rawTelemetry.country && (
                    <div>
                      <span className="text-[#8fa396]">Geographic Node: </span>
                      <span className="text-white font-medium">{selectedIndicatorForView.rawTelemetry.country}</span>
                    </div>
                  )}
                  {selectedIndicatorForView.rawTelemetry.reputationVerdict && (
                    <div>
                      <span className="text-[#8fa396]">Verdict: </span>
                      <span className="text-[#00e676] font-medium">{selectedIndicatorForView.rawTelemetry.reputationVerdict}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Detection Signatures */}
              <div className="p-4 rounded-2xl bg-[#04120a] border border-[#00e676]/15 flex flex-col gap-2">
                <span className="text-[11px] font-mono uppercase font-bold text-[#00e676]">
                  Detection Signatures &amp; Heuristic Triggers
                </span>
                <div className="flex flex-col gap-1.5">
                  {selectedIndicatorForView.detectionSignatures.map((sig, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-[#c8ddd0]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00e676]" />
                      <span>{sig}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CONNECTED ENCLAVE CASES & INVESTIGATIONS (Crucial Requirement) */}
              <div className="p-4 rounded-2xl bg-[#071f12] border border-[#00e676]/35 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#00e676]" />
                    <span className="text-xs font-bold text-white">
                      Linked Enclave Cases &amp; Complaints ({selectedIndicatorForView.linkedCases.length})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#00e676] bg-[#00e676]/15 px-2 py-0.5 rounded">
                    ENCLAVE CORRELATION MATCH
                  </span>
                </div>
                <p className="text-[11px] text-[#8fa396] leading-relaxed">
                  CCIP correlated this indicator against active law enforcement cases, evidence files, and citizen reports in the sovereign database.
                </p>

                <div className="flex flex-col gap-2">
                  {selectedIndicatorForView.linkedCases.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-[#041009] border border-[#00e676]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#00e676] text-xs">{c.caseNumber}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.08] text-white">{c.status}</span>
                          {c.lossAmount && (
                            <span className="text-[11px] font-mono font-bold text-red-400">Loss: {c.lossAmount}</span>
                          )}
                        </div>
                        <div className="text-xs text-white truncate mt-0.5 font-medium">{c.title}</div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            if (onSelectCase) onSelectCase(c.id);
                            onSelectTab('investigation-workspace');
                            setSelectedIndicatorForView(null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#00e676]/15 hover:bg-[#00e676]/30 text-[#00e676] text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <span>Open in Workspace</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 mt-5 border-t border-[#00e676]/15 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onSelectTab('cross-case-correlation');
                    setSelectedIndicatorForView(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#00e676]" />
                  <span>Correlate in Cross-Case Matrix</span>
                </button>
                <button
                  onClick={() => {
                    onSelectTab('evidence-repository');
                    setSelectedIndicatorForView(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 text-[#00e676]" />
                  <span>Evidence Repository</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                {selectedIndicatorForView.status === 'Malicious' && (
                  <button
                    onClick={() => {
                      const item = selectedIndicatorForView;
                      setSelectedIndicatorForView(null);
                      setSelectedIndicatorForBlock(item);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#280c10] border border-[#ef4444]/60 hover:bg-[#ef4444]/20 text-[#ef4444] text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Block Review</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedIndicatorForView(null)}
                  className="px-4 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-xs font-semibold text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. MODAL: BLOCK REVIEW & COUNTERMEASURE AUTHORIZATION (WORKFLOW 5)   */}
      {/* ==================================================================== */}
      {selectedIndicatorForBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl my-6 rounded-3xl p-6 sm:p-7 bg-[#0b0406] border border-red-500/40 shadow-[0_32px_96px_rgba(0,0,0,0.95)] text-white">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-red-500/20 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                  <Ban className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase font-bold text-red-400 tracking-wider">
                    Sovereign Enclave Countermeasure Authorization
                  </span>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Block Malicious Threat Indicator
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedIndicatorForBlock(null)}
                className="p-1.5 rounded-lg text-[#8fa396] hover:text-white hover:bg-white/[0.08]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-4 text-xs">
              
              {/* Target Indicator Card */}
              <div className="p-4 rounded-2xl bg-[#160609] border border-red-500/25 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-red-300 font-bold uppercase">Target {selectedIndicatorForBlock.iocType}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 font-bold">
                    CONFIDENCE: {selectedIndicatorForBlock.confidence}%
                  </span>
                </div>
                <div className="font-mono text-base font-bold text-white select-all break-all">
                  {selectedIndicatorForBlock.iocValue}
                </div>
                <div className="text-xs text-[#c8ddd0]">
                  Associated Threat Group: <strong className="text-white">{selectedIndicatorForBlock.relatedThreat}</strong>
                </div>
              </div>

              {/* Impact Assessment */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#8fa396] block text-[10px] uppercase font-mono">Enclave False-Positive Risk</span>
                  <span className="text-[#00e676] font-bold">LOW (&lt;0.02%) • Zero Whitelist Collision</span>
                </div>
                <div className="text-right">
                  <span className="text-[#8fa396] block text-[10px] uppercase font-mono">Active Ingress/Egress Sessions</span>
                  <span className="text-red-400 font-bold">3 Gateway Sockets Active</span>
                </div>
              </div>

              {/* Countermeasure Scope Checklist */}
              <div className="flex flex-col gap-2.5">
                <span className="text-[11px] font-mono uppercase font-bold text-[#8fa396]">
                  Countermeasures to Deploy Upon Execution:
                </span>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition-colors">
                  <input
                    type="checkbox"
                    checked={blockCheckFirewall}
                    onChange={(e) => setBlockCheckFirewall(e.target.checked)}
                    className="w-4 h-4 rounded text-red-500 focus:ring-0 cursor-pointer accent-red-500"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-white text-xs">Enforce Perimeter Firewall Drop Rule</div>
                    <div className="text-[11px] text-[#8fa396]">Instantly drop all ingress and egress packets across all enclave state border gateway routers.</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition-colors">
                  <input
                    type="checkbox"
                    checked={blockCheckSinkhole}
                    onChange={(e) => setBlockCheckSinkhole(e.target.checked)}
                    className="w-4 h-4 rounded text-red-500 focus:ring-0 cursor-pointer accent-red-500"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-white text-xs">Deploy Sovereign DNS Sinkhole</div>
                    <div className="text-[11px] text-[#8fa396]">Redirect malicious queries to sovereign quarantine forensic collector to harvest victim telemetry.</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition-colors">
                  <input
                    type="checkbox"
                    checked={blockCheckNotify}
                    onChange={(e) => setBlockCheckNotify(e.target.checked)}
                    className="w-4 h-4 rounded text-red-500 focus:ring-0 cursor-pointer accent-red-500"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-white text-xs">Notify Linked Case Investigators</div>
                    <div className="text-[11px] text-[#8fa396]">Broadcast countermeasure disposition into CASE-2026-0842 and CASE-2026-0914 audit logs.</div>
                  </div>
                </label>
              </div>

              {/* Specialist Note */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-mono uppercase font-bold text-[#8fa396]">
                  Specialist Forensic Rationale &amp; Audit Note:
                </span>
                <textarea
                  value={blockNotes}
                  onChange={(e) => setBlockNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-[#040806] border border-white/[0.12] focus:border-red-500 rounded-xl p-3 text-xs text-white placeholder-[#8fa396] focus:outline-none resize-none"
                  placeholder="Provide statutory forensic reasoning for the enclave audit trail..."
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 mt-5 border-t border-red-500/20 flex items-center justify-between gap-3">
              <span className="text-[10px] font-mono text-[#8fa396]">
                OPERATOR CLEARANCE: <strong className="text-white">SPECIALIST TIER 2+</strong>
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedIndicatorForBlock(null)}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-white transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleExecuteBlock}
                  disabled={isBlockingInProgress}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <Ban className={`w-4 h-4 ${isBlockingInProgress ? 'animate-spin' : ''}`} />
                  <span>{isBlockingInProgress ? 'Enforcing Block Rule...' : 'Confirm & Execute Block'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
