import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Play, 
  Pause, 
  RefreshCw, 
  ShieldAlert, 
  Lock, 
  Database, 
  FileText, 
  Search, 
  Globe, 
  SlidersHorizontal, 
  Calendar, 
  Eye, 
  Copy, 
  Check, 
  X, 
  AlertTriangle, 
  FolderPlus, 
  Ban, 
  ArrowRight, 
  CheckCircle2, 
  Radio, 
  Terminal, 
  Layers, 
  Share2, 
  Clock, 
  Shield, 
  Zap, 
  Cpu, 
  ExternalLink,
  ChevronDown,
  Info
} from 'lucide-react';
import { Complaint } from '../../types';

export interface SocEvent {
  id: string;
  time: string;
  fullTimestamp: string;
  protocol: 'TCP/IP' | 'TLSv1.3' | 'DNS' | 'HTTP' | 'SSH' | 'ICMP';
  source: string;
  destination: string;
  eventType: 'C2 Communication' | 'Malware Ingress' | 'Suspicious Domain' | 'Exfiltration Attempt' | 'Brute Force Login' | 'Phishing Connection' | 'Port Scanning' | 'Malware Download' | 'Data Exfiltration';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'New' | 'Under Review' | 'Investigating' | 'Closed';
  title: string;
  summary: string;
  recommendedAction: string;
  threatIntelMatch?: {
    indicator: string;
    threatActor: string;
    confidenceScore: number;
    feedSource: string;
    campaign: string;
    detectionEngine: string;
  };
  assetInfo?: {
    hostname: string;
    department: string;
    user: string;
    os: string;
    macAddress: string;
    vlan: string;
  };
  relatedEvents?: Array<{
    id: string;
    time: string;
    type: string;
    source: string;
    destination: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
  }>;
  auditTrail: Array<{
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    details: string;
  }>;
}

interface SocMonitoringPortalViewProps {
  onSelectTab: (tab: string) => void;
  onSelectCase?: (caseId: string) => void;
  complaints?: Complaint[];
}

const INITIAL_EVENTS: SocEvent[] = [
  {
    id: 'evt-101',
    time: '10:24:31',
    fullTimestamp: '12 Jun 2026, 10:24:31 AM',
    protocol: 'TCP/IP',
    source: '192.168.1.15',
    destination: '185.220.101.44',
    eventType: 'C2 Communication',
    severity: 'Critical',
    status: 'New',
    title: 'C2 Communication Detected',
    summary: 'Possible command and control (C2) communication detected with a known malicious IP address associated with DarkSynapse (UNC4192).',
    recommendedAction: 'Investigate the source system, check for additional activity, and isolate if necessary.',
    threatIntelMatch: {
      indicator: '185.220.101.44',
      threatActor: 'Lazarus Group (DarkSynapse)',
      confidenceScore: 98,
      feedSource: 'I4C Cyber Threat Intelligence Grid',
      campaign: 'Operation DarkSynapse C2 Cluster',
      detectionEngine: 'Heuristic Beacon Pattern Matcher'
    },
    assetInfo: {
      hostname: 'FIN-WS-042',
      department: 'Corporate Accounts & Treasury',
      user: 'r.sharma@finance.internal',
      os: 'Windows 11 Enterprise (Build 22631)',
      macAddress: '00:1A:2B:3C:4D:5E',
      vlan: 'VLAN 10 - Core Finance'
    },
    relatedEvents: [
      { id: 'rel-1', time: '10:23:14', type: 'Outbound TCP Probe', source: '192.168.1.15', destination: '185.220.101.44:443', severity: 'High' },
      { id: 'rel-2', time: '10:21:05', type: 'Unusual Kerberos Request', source: '192.168.1.15', destination: '10.0.0.1:88', severity: 'Medium' }
    ],
    auditTrail: [
      { id: 'aud-1', timestamp: '12 Jun 2026, 10:24:31 AM', actor: 'SOC Sensor Engine', action: 'EVENT_INGESTED', details: 'Ingested from Perimeter Firewall Gateway Eth0' },
      { id: 'aud-2', timestamp: '12 Jun 2026, 10:24:32 AM', actor: 'Automated Triager', action: 'ALERT_GENERATED', details: 'Raised Critical alert due to DarkSynapse C2 match' }
    ]
  },
  {
    id: 'evt-102',
    time: '10:22:19',
    fullTimestamp: '12 Jun 2026, 10:22:19 AM',
    protocol: 'TLSv1.3',
    source: '10.10.5.23',
    destination: '0x71C83909...',
    eventType: 'Malware Ingress',
    severity: 'High',
    status: 'Under Review',
    title: 'Malware Ingress Payload Detected',
    summary: 'Encrypted inbound payload transfer matching BlackCat/ALPHV stealth loader payload characteristics.',
    recommendedAction: 'Quarantine incoming network socket, dump endpoint process memory, and inspect hash.',
    threatIntelMatch: {
      indicator: '0x71C83909a12bc90048EF910c2830fFa829804e89',
      threatActor: 'ALPHV Affiliate Network',
      confidenceScore: 94,
      feedSource: 'CERT-In Threat Intelligence Enclave',
      campaign: 'BlackCat v3 Ransomware Mesh',
      detectionEngine: 'TLS JA3 Fingerprint Matcher'
    },
    assetInfo: {
      hostname: 'ENG-SRV-09',
      department: 'Infrastructure & Cloud Gateways',
      user: 'svc-deploy@infra.internal',
      os: 'Ubuntu 24.04 LTS Sovereign Server',
      macAddress: '52:54:00:12:34:56',
      vlan: 'VLAN 50 - Cloud DMZ'
    },
    relatedEvents: [
      { id: 'rel-3', time: '10:20:00', type: 'Inbound Stream Burst', source: '10.10.5.23', destination: 'External Node', severity: 'High' }
    ],
    auditTrail: [
      { id: 'aud-3', timestamp: '12 Jun 2026, 10:22:19 AM', actor: 'SOC Sensor Engine', action: 'EVENT_INGESTED', details: 'Ingested from Gateway TLS Decrypt Probe' },
      { id: 'aud-4', timestamp: '12 Jun 2026, 10:23:00 AM', actor: 'Specialist Naveen', action: 'STATUS_UNDER_REVIEW', details: 'Analyst assigned ticket for packet inspection' }
    ]
  },
  {
    id: 'evt-103',
    time: '10:20:45',
    fullTimestamp: '12 Jun 2026, 10:20:45 AM',
    protocol: 'DNS',
    source: '192.168.2.8',
    destination: 'suspicious-d...',
    eventType: 'Suspicious Domain',
    severity: 'High',
    status: 'New',
    title: 'Suspicious Fast-Flux DNS Query',
    summary: 'Internal workstation initiated repeated DNS resolution for fast-flux domain update-example.invalid.',
    recommendedAction: 'Deploy DNS sinkhole redirect, inspect host DNS resolver cache, and analyze browser artifacts.',
    threatIntelMatch: {
      indicator: 'update-example.invalid',
      threatActor: 'FinSteal Syndicate',
      confidenceScore: 89,
      feedSource: 'NCRP DNS Takedown Sensor',
      campaign: 'Fast-Flux Payment Redirection',
      detectionEngine: 'DNS Anomaly Entropy Detector'
    },
    assetInfo: {
      hostname: 'OPS-LAPTOP-18',
      department: 'Logistics Operations',
      user: 'v.patel@ops.internal',
      os: 'Windows 11 Pro',
      macAddress: 'A4:83:E7:22:11:00',
      vlan: 'VLAN 20 - Branch Office'
    },
    relatedEvents: [],
    auditTrail: [
      { id: 'aud-5', timestamp: '12 Jun 2026, 10:20:45 AM', actor: 'Core DNS Resolver', action: 'QUERY_LOGGED', details: 'DNS request intercepted by Sovereign Resolver' }
    ]
  },
  {
    id: 'evt-104',
    time: '10:18:12',
    fullTimestamp: '12 Jun 2026, 10:18:12 AM',
    protocol: 'HTTP',
    source: '10.10.5.11',
    destination: '45.142.214.9',
    eventType: 'Exfiltration Attempt',
    severity: 'Medium',
    status: 'Investigating',
    title: 'Abnormal Outbound Data Transfer',
    summary: 'Abnormal outbound HTTP POST volume detected exceeding baseline threshold for host by 420%.',
    recommendedAction: 'Inspect egress packet body, verify DLP enforcement status, and interview endpoint operator.',
    threatIntelMatch: {
      indicator: '45.142.214.9',
      threatActor: 'Unclassified Foreign Host',
      confidenceScore: 78,
      feedSource: 'Global Threat Mesh',
      campaign: 'Potential Data Exfiltration Point',
      detectionEngine: 'Statistical Egress Threshold Engine'
    },
    assetInfo: {
      hostname: 'RND-CAD-04',
      department: 'Research & Engineering',
      user: 'k.verma@rnd.internal',
      os: 'macOS Sonoma 14.5',
      macAddress: 'F0:18:98:AA:BB:CC',
      vlan: 'VLAN 30 - Engineering'
    },
    relatedEvents: [],
    auditTrail: [
      { id: 'aud-6', timestamp: '12 Jun 2026, 10:18:12 AM', actor: 'SOC Sensor Engine', action: 'EVENT_INGESTED', details: 'Ingested from Gateway NetFlow collector' },
      { id: 'aud-7', timestamp: '12 Jun 2026, 10:19:10 AM', actor: 'Specialist Naveen', action: 'STATUS_INVESTIGATING', details: 'Escalated to investigation docket' }
    ]
  },
  {
    id: 'evt-105',
    time: '10:16:08',
    fullTimestamp: '12 Jun 2026, 10:16:08 AM',
    protocol: 'SSH',
    source: '192.168.3.21',
    destination: '194.26.29.112',
    eventType: 'Brute Force Login',
    severity: 'Medium',
    status: 'New',
    title: 'Repeated SSH Authentication Failures',
    summary: '48 failed SSH authentication attempts within 60 seconds against internal bastion jump-host.',
    recommendedAction: 'Enforce firewall rate-limiting, expire targeted user credentials, and check auth logs.',
    assetInfo: {
      hostname: 'BASTION-JUMP-01',
      department: 'Security Infrastructure',
      user: 'root / admin (targeted)',
      os: 'Debian 12 Hardened Sovereign Linux',
      macAddress: '00:50:56:AB:CD:EF',
      vlan: 'VLAN 99 - Admin Management'
    },
    relatedEvents: [],
    auditTrail: [
      { id: 'aud-8', timestamp: '12 Jun 2026, 10:16:08 AM', actor: 'SSH Auth Daemon', action: 'AUTH_FAILED_BURST', details: 'Rate limit tripped on port 22' }
    ]
  },
  {
    id: 'evt-106',
    time: '10:14:55',
    fullTimestamp: '12 Jun 2026, 10:14:55 AM',
    protocol: 'TLSv1.3',
    source: '192.168.1.77',
    destination: 'secure-nexus...',
    eventType: 'Phishing Connection',
    severity: 'High',
    status: 'Under Review',
    title: 'Phishing Reverse Proxy Connection',
    summary: 'Internal user session established outbound TLS session to reverse proxy masquerading as government portal.',
    recommendedAction: 'Revoke active authentication cookies, reset user account credentials, and block destination domain.',
    threatIntelMatch: {
      indicator: 'secure-nexus-auth.in',
      threatActor: 'Scattered Spider',
      confidenceScore: 92,
      feedSource: 'I4C Cyber Threat Intelligence Grid',
      campaign: 'Tycoon2FA Phishing Campaign',
      detectionEngine: 'URL Threat Intelligence Correlation'
    },
    assetInfo: {
      hostname: 'HR-EXEC-02',
      department: 'Human Resources & Personnel',
      user: 'm.deshmukh@hr.internal',
      os: 'Windows 11 Pro',
      macAddress: '70:85:C2:55:44:33',
      vlan: 'VLAN 10 - Administration'
    },
    relatedEvents: [],
    auditTrail: [
      { id: 'aud-9', timestamp: '12 Jun 2026, 10:14:55 AM', actor: 'Web Proxy Gateway', action: 'PROXY_INTERCEPT', details: 'Proxy flagged suspicious categorization' }
    ]
  },
  {
    id: 'evt-107',
    time: '10:11:23',
    fullTimestamp: '12 Jun 2026, 10:11:23 AM',
    protocol: 'ICMP',
    source: '10.10.5.44',
    destination: '8.8.8.8',
    eventType: 'Port Scanning',
    severity: 'Low',
    status: 'Closed',
    title: 'Routine Perimeter Diagnostic Ping',
    summary: 'Standard ICMP echo requests exchanged with public DNS provider endpoint during connection diagnostic check.',
    recommendedAction: 'No immediate action required. Logged for baseline anomaly analysis.',
    assetInfo: {
      hostname: 'NET-MON-PROBE',
      department: 'Network Operations Center',
      user: 'system_daemon',
      os: 'FreeBSD 14.1',
      macAddress: '08:00:27:11:22:33',
      vlan: 'VLAN 90 - Network Monitoring'
    },
    relatedEvents: [],
    auditTrail: [
      { id: 'aud-10', timestamp: '12 Jun 2026, 10:11:23 AM', actor: 'SOC Analyst', action: 'INCIDENT_CLOSED', details: 'Verified as authorized diagnostic sweep' }
    ]
  },
  {
    id: 'evt-108',
    time: '10:09:17',
    fullTimestamp: '12 Jun 2026, 10:09:17 AM',
    protocol: 'TCP/IP',
    source: '192.168.4.10',
    destination: '203.0.113.45',
    eventType: 'Malware Download',
    severity: 'High',
    status: 'Investigating',
    title: 'Inbound Malicious Binary Dropper',
    summary: 'Host downloaded executable file matching CobaltStrike stager shellcode hash.',
    recommendedAction: 'Isolate host from local VLAN immediately, terminate parent process tree, and capture volatile memory.',
    threatIntelMatch: {
      indicator: '203.0.113.45',
      threatActor: 'Lazarus Group',
      confidenceScore: 90,
      feedSource: 'National Cyber Forensic Repository',
      campaign: 'Operation DarkSynapse Stager',
      detectionEngine: 'Network Sandbox Signature Match'
    },
    assetInfo: {
      hostname: 'DEV-WORKSTATION-05',
      department: 'Software Engineering',
      user: 's.nair@eng.internal',
      os: 'Ubuntu 22.04 LTS Desktop',
      macAddress: '3C:7C:3F:88:99:AA',
      vlan: 'VLAN 40 - Development'
    },
    relatedEvents: [],
    auditTrail: [
      { id: 'aud-11', timestamp: '12 Jun 2026, 10:09:17 AM', actor: 'Endpoint Agent', action: 'MALWARE_BLOCKED', details: 'File quarantined by local sovereign EDR' }
    ]
  },
  {
    id: 'evt-109',
    time: '10:06:39',
    fullTimestamp: '12 Jun 2026, 10:06:39 AM',
    protocol: 'DNS',
    source: '192.168.2.19',
    destination: 'tornado-mix...',
    eventType: 'Suspicious Domain',
    severity: 'Medium',
    status: 'New',
    title: 'Cryptocurrency Mixer Host Lookup',
    summary: 'Endpoint attempted DNS resolution for decentralized coin mixer interface tornado-mixer.invalid.',
    recommendedAction: 'Verify whether the workstation is authorized for crypto forensic research.',
    threatIntelMatch: {
      indicator: 'tornado-mixer.invalid',
      threatActor: 'FinSteal Syndicate',
      confidenceScore: 84,
      feedSource: 'Sovereign Crypto Trace Mesh',
      campaign: 'Tornado Peel Mixer Hop',
      detectionEngine: 'Blockchain Threat Intelligence Feed'
    },
    assetInfo: {
      hostname: 'FIN-AUDIT-03',
      department: 'Compliance & Audit',
      user: 'a.kulkarni@audit.internal',
      os: 'Windows 11 Pro',
      macAddress: 'B0:4E:26:12:34:78',
      vlan: 'VLAN 10 - Finance'
    },
    relatedEvents: [],
    auditTrail: [
      { id: 'aud-12', timestamp: '12 Jun 2026, 10:06:39 AM', actor: 'Core DNS Resolver', action: 'QUERY_FLAGGED', details: 'Flagged by High-Risk Financial Domain rule' }
    ]
  },
  {
    id: 'evt-110',
    time: '10:04:11',
    fullTimestamp: '12 Jun 2026, 10:04:11 AM',
    protocol: 'TLSv1.3',
    source: '10.10.5.90',
    destination: '172.67.34.12',
    eventType: 'Data Exfiltration',
    severity: 'Critical',
    status: 'Under Review',
    title: 'Encrypted Channel Data Tunneling',
    summary: 'Prolonged high-throughput TLS tunnel to unclassified cloud IP without valid SNI header.',
    recommendedAction: 'Sever active TCP socket immediately, isolate host at network switch layer, and extract flow logs.',
    threatIntelMatch: {
      indicator: '172.67.34.12',
      threatActor: 'State-sponsored threat actor',
      confidenceScore: 95,
      feedSource: 'CERT-In Threat Intelligence Enclave',
      campaign: 'Stealth Exfiltration Gateway',
      detectionEngine: 'NetFlow Tunneling Anomaly Detector'
    },
    assetInfo: {
      hostname: 'DB-REPLICA-02',
      department: 'Central Database Enclave',
      user: 'postgres_service',
      os: 'RHEL 9.4 Hardened',
      macAddress: '00:15:5D:88:77:66',
      vlan: 'VLAN 95 - Database Core'
    },
    relatedEvents: [],
    auditTrail: [
      { id: 'aud-13', timestamp: '12 Jun 2026, 10:04:11 AM', actor: 'Core Firewall', action: 'TUNNEL_DETECTED', details: 'Socket flagged for abnormal session duration' }
    ]
  }
];

export const SocMonitoringPortalView: React.FC<SocMonitoringPortalViewProps> = ({
  onSelectTab,
  onSelectCase,
  complaints = []
}) => {
  // Main Data States
  const [events, setEvents] = useState<SocEvent[]>(INITIAL_EVENTS);
  const [selectedEventId, setSelectedEventId] = useState<string>('evt-101');
  const [activeDetailsTab, setActiveDetailsTab] = useState<'overview' | 'threat-intel' | 'related-events' | 'actions'>('overview');
  
  // Replay & Ingestion Telemetry States
  const [isReplaying, setIsReplaying] = useState<boolean>(true);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('12 Jun 2026, 10:24 AM');
  const [packetRate, setPacketRate] = useState<string>('18.4k pkt/s');
  
  // Operational Metrics
  const [eventsIngestedCount, setEventsIngestedCount] = useState<string>('1.2M');
  const [suspiciousEventsCount, setSuspiciousEventsCount] = useState<number>(38);
  const [blockedEventsCount, setBlockedEventsCount] = useState<number>(38);
  const [uniqueSignaturesCount, setUniqueSignaturesCount] = useState<number>(15);

  // Filters & Search
  const [selectedProtocol, setSelectedProtocol] = useState<string>('ALL');
  const [selectedThreatType, setSelectedThreatType] = useState<string>('ALL');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('24h');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Feedback & Modal States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState<boolean>(true);
  const [isCreateCaseModalOpen, setIsCreateCaseModalOpen] = useState<boolean>(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState<boolean>(false);

  // Active selected event
  const selectedEvent = useMemo(() => {
    return events.find(e => e.id === selectedEventId) || events[0];
  }, [events, selectedEventId]);

  // Periodic Replay Simulator (Harmless Synthetic Telemetry)
  useEffect(() => {
    if (!isReplaying) return;

    const interval = setInterval(() => {
      // Fluctuate rate subtly for realistic SOC feel
      const rates = ['18.2k pkt/s', '18.4k pkt/s', '18.6k pkt/s', '18.5k pkt/s', '18.3k pkt/s'];
      const randomRate = rates[Math.floor(Math.random() * rates.length)];
      setPacketRate(randomRate);
    }, 3000);

    return () => clearInterval(interval);
  }, [isReplaying]);

  // Handle Simulation Pause / Resume
  const handleToggleReplay = () => {
    setIsReplaying(prev => {
      const next = !prev;
      if (!next) {
        setPacketRate('PAUSED');
        setToastMessage('Simulation replay paused. Real-time synthetic stream halted.');
      } else {
        setPacketRate('18.4k pkt/s');
        setToastMessage('Simulation replay resumed. Synthetic security event stream active.');
      }
      setTimeout(() => setToastMessage(null), 4000);
      return next;
    });
  };

  const handleRefreshStatus = () => {
    const now = new Date();
    const formatted = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
      now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    setLastUpdatedTime(formatted);
    setToastMessage('SOC sensor polling completed. All connected interfaces synchronized.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter Computation
  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      // Protocol filter
      if (selectedProtocol !== 'ALL' && evt.protocol !== selectedProtocol) {
        return false;
      }
      // Threat type filter
      if (selectedThreatType !== 'ALL' && evt.eventType !== selectedThreatType) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSource = evt.source.toLowerCase().includes(q);
        const matchDest = evt.destination.toLowerCase().includes(q);
        const matchType = evt.eventType.toLowerCase().includes(q);
        const matchTitle = evt.title.toLowerCase().includes(q);
        if (!matchSource && !matchDest && !matchType && !matchTitle) {
          return false;
        }
      }
      return true;
    });
  }, [events, selectedProtocol, selectedThreatType, searchQuery]);

  // Actions
  const handleMarkAsInvestigating = () => {
    if (!selectedEvent) return;
    setEvents(prev => prev.map(e => {
      if (e.id === selectedEvent.id) {
        return {
          ...e,
          status: 'Investigating',
          auditTrail: [
            ...e.auditTrail,
            {
              id: `aud-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
              actor: 'Specialist Naveen',
              action: 'STATUS_INVESTIGATING',
              details: 'Analyst acknowledged alert and initiated formal investigation docket'
            }
          ]
        };
      }
      return e;
    }));
    setToastMessage(`Alert ${selectedEvent.title} marked as Investigating by Specialist Naveen.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleConfirmBlock = () => {
    if (!selectedEvent) return;
    setEvents(prev => prev.map(e => {
      if (e.id === selectedEvent.id) {
        return {
          ...e,
          status: 'Closed',
          auditTrail: [
            ...e.auditTrail,
            {
              id: `aud-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
              actor: 'Specialist Naveen',
              action: 'CONTAINMENT_BLOCKED',
              details: `Perimeter firewall drop rule active for destination ${e.destination}. Endpoint ${e.source} isolated.`
            }
          ]
        };
      }
      return e;
    }));
    setBlockedEventsCount(prev => prev + 1);
    setIsBlockModalOpen(false);
    setToastMessage(`Perimeter block rule successfully enforced for ${selectedEvent.destination}. Host ${selectedEvent.source} quarantined.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleConfirmCreateCase = () => {
    if (!selectedEvent) return;
    setIsCreateCaseModalOpen(false);
    setToastMessage(`Incident Docket CASE-2026-0945 created from SOC Alert: ${selectedEvent.title}. Redirecting to Workspace...`);
    setTimeout(() => {
      setToastMessage(null);
      onSelectTab('investigation-workspace');
    }, 1500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const getProtocolBadge = (protocol: string) => {
    switch (protocol) {
      case 'TCP/IP':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0a1e2c] border border-[#38bdf8]/40 text-[#38bdf8]">TCP/IP</span>;
      case 'TLSv1.3':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#20102b] border border-[#c084fc]/40 text-[#c084fc]">TLSv1.3</span>;
      case 'DNS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#071f12] border border-[#00e676]/40 text-[#00e676]">DNS</span>;
      case 'HTTP':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#072417] border border-[#34d399]/40 text-[#34d399]">HTTP</span>;
      case 'SSH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#141b24] border border-[#60a5fa]/40 text-[#60a5fa]">SSH</span>;
      case 'ICMP':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0d2222] border border-[#2dd4bf]/40 text-[#2dd4bf]">ICMP</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/[0.06] border border-white/[0.1] text-white">{protocol}</span>;
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#3b1219] border border-[#ef4444]/60 text-[#ef4444]">Critical</span>;
      case 'High':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#38260c] border border-[#f59e0b]/60 text-[#f59e0b]">High</span>;
      case 'Medium':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#2d2a0c] border border-[#eab308]/60 text-[#eab308]">Medium</span>;
      case 'Low':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#092214] border border-[#00e676]/40 text-[#00e676]">Low</span>;
      default:
        return null;
    }
  };

  const getStatusDot = (st: string) => {
    switch (st) {
      case 'New':
        return (
          <span className="flex items-center gap-1.5 text-xs text-white">
            <span className="w-2 h-2 rounded-full bg-[#ef4444] shadow-[0_0_6px_#ef4444]" />
            New
          </span>
        );
      case 'Under Review':
        return (
          <span className="flex items-center gap-1.5 text-xs text-white">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b] shadow-[0_0_6px_#f59e0b]" />
            Under Review
          </span>
        );
      case 'Investigating':
        return (
          <span className="flex items-center gap-1.5 text-xs text-white">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8] shadow-[0_0_6px_#38bdf8]" />
            Investigating
          </span>
        );
      case 'Closed':
        return (
          <span className="flex items-center gap-1.5 text-xs text-[#8fa396]">
            <span className="w-2 h-2 rounded-full bg-[#8fa396]" />
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-5 text-white pb-12 animate-in fade-in duration-200">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 p-4 rounded-2xl bg-[#041a0e] border border-[#00e676]/60 text-white shadow-[0_12px_40px_rgba(0,230,118,0.25)] animate-in slide-in-from-top-4 duration-200 max-w-md">
          <CheckCircle2 className="w-5 h-5 text-[#00e676] shrink-0" />
          <div className="text-xs font-sans leading-relaxed text-[#c8ddd0]">
            {toastMessage}
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1 rounded text-[#8fa396] hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. TOP HEADER & TELEMETRY CONTROLS                                  */}
      {/* ==================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title & Subtitle */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shadow-[0_0_16px_rgba(0,230,118,0.2)] shrink-0 mt-0.5">
            <Activity className="w-5 h-5 text-[#00e676]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
              SOC Monitoring
            </h1>
            <p className="text-xs sm:text-sm text-[#8fa396] mt-0.5 font-sans">
              Monitor security events, detect threats, and respond to suspicious activity from connected systems.
            </p>
          </div>
        </div>

        {/* Telemetry Controls matching screenshot */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto shrink-0">
          
          {/* Simulation Replay Pill */}
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#05170d] border border-[#00e676]/25 shadow-sm">
            <Terminal className="w-4 h-4 text-[#00e676]" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white leading-tight">Simulation Replay</span>
              <span className="text-[10px] text-[#8fa396] leading-tight">Replaying sample attack events</span>
            </div>
            <button
              onClick={handleToggleReplay}
              className="w-7 h-7 rounded-lg bg-[#00e676] hover:bg-[#00c853] text-[#030706] flex items-center justify-center transition-transform active:scale-95 shadow-[0_0_10px_rgba(0,230,118,0.3)] ml-1"
              title={isReplaying ? 'Pause simulator' : 'Resume simulator'}
            >
              {isReplaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>
          </div>

          {/* Rate Indicator Pill */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#05170d] border border-[#00e676]/25">
            <span className="text-xs font-mono font-bold text-[#00e676]">
              Rate: {packetRate}
            </span>
            <div className="flex items-end gap-0.5 h-3.5">
              <span className={`w-0.5 rounded-full bg-[#00e676] ${isReplaying ? 'h-1.5 animate-pulse' : 'h-1.5 opacity-40'}`} />
              <span className={`w-0.5 rounded-full bg-[#00e676] ${isReplaying ? 'h-2.5 animate-pulse delay-75' : 'h-2.5 opacity-40'}`} />
              <span className={`w-0.5 rounded-full bg-[#00e676] ${isReplaying ? 'h-3.5 animate-pulse delay-150' : 'h-3.5 opacity-40'}`} />
            </div>
          </div>

          {/* Pause / Resume Button */}
          <button
            onClick={handleToggleReplay}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#05170d] border border-[#00e676]/35 hover:border-[#00e676]/60 text-white hover:text-[#00e676] text-xs font-semibold transition-all active:scale-95"
          >
            {isReplaying ? (
              <>
                <span className="text-[#00e676] font-mono font-bold">||</span>
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-[#00e676] fill-current" />
                <span>Resume</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. MONITORING STATUS STRIP (MATCHING REFERENCE IMAGE)                */}
      {/* ==================================================================== */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#04140b] border border-[#00e676]/25 shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0">
            <Radio className="w-4 h-4 text-[#00e676]" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
            <span className="text-xs font-bold text-white font-sans flex items-center gap-2">
              Monitoring Status
              <span className="w-2.5 h-2.5 rounded-full bg-[#00e676] shadow-[0_0_8px_#00e676] animate-pulse" />
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white">
                No live hardware sensor connected
              </span>
              <span className="text-[11px] text-[#8fa396]">
                Currently replaying simulated perimeter attack signatures.
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
          <span className="text-xs text-[#8fa396] font-sans">
            Last updated: <span className="text-white font-medium">{lastUpdatedTime}</span>
          </span>
          <button
            onClick={handleRefreshStatus}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#00e676] transition-colors"
            title="Refresh status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. MONITORING STATISTICS (4 KPI CARDS IN A GRID)                     */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Events Ingested */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#05160d] border border-[#00e676]/20 shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0">
              <FileText className="w-5 h-5 text-[#00e676]" />
            </div>
            <div>
              <span className="text-xs text-[#8fa396] block leading-tight font-sans">Events Ingested</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold font-mono text-white tracking-tight">{eventsIngestedCount}</span>
                <span className="text-xs font-mono font-bold text-[#00e676]">↑ 12%</span>
              </div>
            </div>
          </div>
          {/* Mini Sparkline Chart */}
          <div className="flex items-end gap-1 h-8 shrink-0">
            <span className="w-1.5 h-3 rounded-t bg-[#00e676]/50" />
            <span className="w-1.5 h-4.5 rounded-t bg-[#00e676]/65" />
            <span className="w-1.5 h-6 rounded-t bg-[#00e676]/80" />
            <span className="w-1.5 h-7 rounded-t bg-[#00e676]" />
            <span className="w-1.5 h-8 rounded-t bg-[#00e676] shadow-[0_0_6px_#00e676]" />
          </div>
        </div>

        {/* Card 2: Suspicious Events */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#05160d] border border-[#00e676]/20 shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#ef4444]/15 border border-[#ef4444]/30 flex items-center justify-center text-[#ef4444] shrink-0">
              <ShieldAlert className="w-5 h-5 text-[#ef4444]" />
            </div>
            <div>
              <span className="text-xs text-[#8fa396] block leading-tight font-sans">Suspicious Events</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold font-mono text-white tracking-tight">{suspiciousEventsCount}</span>
                <span className="text-xs font-mono font-bold text-[#ef4444]">↑ 6%</span>
              </div>
            </div>
          </div>
          {/* Mini Sparkline Chart in Red */}
          <div className="flex items-end gap-1 h-8 shrink-0">
            <span className="w-1.5 h-3.5 rounded-t bg-[#ef4444]/50" />
            <span className="w-1.5 h-5.5 rounded-t bg-[#ef4444]/65" />
            <span className="w-1.5 h-4 rounded-t bg-[#ef4444]/80" />
            <span className="w-1.5 h-7 rounded-t bg-[#ef4444]" />
            <span className="w-1.5 h-8 rounded-t bg-[#ef4444] shadow-[0_0_6px_#ef4444]" />
          </div>
        </div>

        {/* Card 3: Blocked (Simulated) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#05160d] border border-[#00e676]/20 shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0">
              <Lock className="w-5 h-5 text-[#00e676]" />
            </div>
            <div>
              <span className="text-xs text-[#8fa396] block leading-tight font-sans">Blocked (Simulated)</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold font-mono text-white tracking-tight">{blockedEventsCount}</span>
                <span className="text-xs font-mono font-bold text-[#00e676]">↑ 6%</span>
              </div>
            </div>
          </div>
          {/* Mini Sparkline Chart */}
          <div className="flex items-end gap-1 h-8 shrink-0">
            <span className="w-1.5 h-2.5 rounded-t bg-[#00e676]/50" />
            <span className="w-1.5 h-4 rounded-t bg-[#00e676]/65" />
            <span className="w-1.5 h-5.5 rounded-t bg-[#00e676]/80" />
            <span className="w-1.5 h-6.5 rounded-t bg-[#00e676]" />
            <span className="w-1.5 h-8 rounded-t bg-[#00e676] shadow-[0_0_6px_#00e676]" />
          </div>
        </div>

        {/* Card 4: Unique Threat Signatures */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#05160d] border border-[#00e676]/20 shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0">
              <Database className="w-5 h-5 text-[#00e676]" />
            </div>
            <div>
              <span className="text-xs text-[#8fa396] block leading-tight font-sans">Unique Threat Signatures</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold font-mono text-white tracking-tight">{uniqueSignaturesCount}</span>
                <span className="text-xs font-mono font-bold text-[#00e676]">↑ 3%</span>
              </div>
            </div>
          </div>
          {/* Mini Sparkline Chart */}
          <div className="flex items-end gap-1 h-8 shrink-0">
            <span className="w-1.5 h-3.5 rounded-t bg-[#00e676]/50" />
            <span className="w-1.5 h-4.5 rounded-t bg-[#00e676]/65" />
            <span className="w-1.5 h-6 rounded-t bg-[#00e676]/80" />
            <span className="w-1.5 h-7.5 rounded-t bg-[#00e676]" />
            <span className="w-1.5 h-8 rounded-t bg-[#00e676] shadow-[0_0_6px_#00e676]" />
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. GLOBAL FILTER BAR (MATCHING REFERENCE IMAGE)                     */}
      {/* ==================================================================== */}
      <div className="p-3.5 rounded-2xl bg-[#04140b] border border-[#00e676]/25 flex flex-wrap items-center justify-between gap-3 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter 1: Protocols */}
          <div className="relative">
            <select
              value={selectedProtocol}
              onChange={(e) => setSelectedProtocol(e.target.value)}
              className="appearance-none bg-[#071a10] border border-[#00e676]/25 hover:border-[#00e676]/50 rounded-xl px-3 py-1.5 pl-8 pr-8 text-xs text-white font-sans focus:outline-none focus:border-[#00e676] transition-colors cursor-pointer"
            >
              <option value="ALL">All Protocols</option>
              <option value="TCP/IP">TCP/IP</option>
              <option value="TLSv1.3">TLSv1.3</option>
              <option value="DNS">DNS</option>
              <option value="HTTP">HTTP</option>
              <option value="SSH">SSH</option>
              <option value="ICMP">ICMP</option>
            </select>
            <Globe className="w-3.5 h-3.5 text-[#8fa396] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-[#8fa396] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filter 2: Threat Types */}
          <div className="relative">
            <select
              value={selectedThreatType}
              onChange={(e) => setSelectedThreatType(e.target.value)}
              className="appearance-none bg-[#071a10] border border-[#00e676]/25 hover:border-[#00e676]/50 rounded-xl px-3 py-1.5 pl-8 pr-8 text-xs text-white font-sans focus:outline-none focus:border-[#00e676] transition-colors cursor-pointer"
            >
              <option value="ALL">All Threat Types</option>
              <option value="C2 Communication">C2 Communication</option>
              <option value="Malware Ingress">Malware Ingress</option>
              <option value="Suspicious Domain">Suspicious Domain</option>
              <option value="Exfiltration Attempt">Exfiltration Attempt</option>
              <option value="Brute Force Login">Brute Force Login</option>
              <option value="Phishing Connection">Phishing Connection</option>
              <option value="Port Scanning">Port Scanning</option>
              <option value="Malware Download">Malware Download</option>
              <option value="Data Exfiltration">Data Exfiltration</option>
            </select>
            <Shield className="w-3.5 h-3.5 text-[#8fa396] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-[#8fa396] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filter 3: Time Range */}
          <div className="relative">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="appearance-none bg-[#071a10] border border-[#00e676]/25 hover:border-[#00e676]/50 rounded-xl px-3 py-1.5 pl-8 pr-8 text-xs text-white font-sans focus:outline-none focus:border-[#00e676] transition-colors cursor-pointer"
            >
              <option value="1h">Last 1 Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="ALL">All Time</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-[#8fa396] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-[#8fa396] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Search Input Box */}
        <div className="relative w-full sm:w-auto min-w-[280px]">
          <Search className="w-3.5 h-3.5 text-[#8fa396] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search IP, domain, hash, signature..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#071a10] border border-[#00e676]/25 hover:border-[#00e676]/50 focus:border-[#00e676] rounded-xl pl-9 pr-7 py-1.5 text-xs text-white placeholder-[#8fa396] focus:outline-none transition-colors font-sans"
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

      {/* ==================================================================== */}
      {/* 5. MAIN CONTENT SPLIT LAYOUT: LIVE EVENT STREAM + EVENT DETAILS     */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Live Event Stream Table (Col-span 7 or 8) */}
        <div className={`${isDetailsPanelOpen ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12'} rounded-2xl bg-[#04140b] border border-[#00e676]/25 shadow-[0_12px_40px_rgba(0,0,0,0.65)] overflow-hidden flex flex-col transition-all duration-300`}>
          
          {/* Header */}
          <div className="p-4 border-b border-[#00e676]/15 flex items-center justify-between bg-[#030e07]">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676]">
                <Activity className="w-4 h-4 text-[#00e676]" />
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight font-sans">
                Live Event Stream
              </h2>
              <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-[#00e676] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
                Real-time security events (simulated)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { setSelectedProtocol('ALL'); setSelectedThreatType('ALL'); setSearchQuery(''); }}
                className="text-xs text-[#00e676] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#00e676]/15 bg-[#030a05] text-[#8fa396] font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 font-semibold">Time</th>
                  <th className="py-2.5 px-3 font-semibold">Protocol</th>
                  <th className="py-2.5 px-3 font-semibold">Source</th>
                  <th className="py-2.5 px-3 font-semibold">Destination</th>
                  <th className="py-2.5 px-3 font-semibold">Event Type</th>
                  <th className="py-2.5 px-3 font-semibold">Severity</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#00e676]/10 font-sans">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((evt) => {
                    const isSelected = evt.id === selectedEventId;
                    return (
                      <tr
                        key={evt.id}
                        onClick={() => { setSelectedEventId(evt.id); setIsDetailsPanelOpen(true); }}
                        className={`
                          cursor-pointer transition-colors
                          ${isSelected ? 'bg-[#00e676]/10 border-l-2 border-[#00e676]' : 'hover:bg-[#00e676]/[0.04]'}
                        `}
                      >
                        {/* Time */}
                        <td className="py-3 px-3 font-mono text-xs text-[#8fa396] whitespace-nowrap">
                          {evt.time}
                        </td>

                        {/* Protocol */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {getProtocolBadge(evt.protocol)}
                        </td>

                        {/* Source */}
                        <td className="py-3 px-3 font-mono text-xs text-white whitespace-nowrap">
                          {evt.source}
                        </td>

                        {/* Destination */}
                        <td className="py-3 px-3 font-mono text-xs text-[#c8ddd0] truncate max-w-[130px]" title={evt.destination}>
                          {evt.destination}
                        </td>

                        {/* Event Type */}
                        <td className="py-3 px-3 font-medium text-xs text-white whitespace-nowrap">
                          {evt.eventType}
                        </td>

                        {/* Severity */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {getSeverityBadge(evt.severity)}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {getStatusDot(evt.status)}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-3 whitespace-nowrap text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEventId(evt.id);
                              setIsDetailsPanelOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#04160c] border border-[#00e676]/40 hover:bg-[#00e676]/20 text-[#00e676] text-xs font-semibold transition-all shadow-[0_0_8px_rgba(0,230,118,0.1)]"
                          >
                            <Eye className="w-3 h-3 text-[#00e676]" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#8fa396]">
                      No events matched the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer matching screenshot */}
          <div className="p-3.5 border-t border-[#00e676]/15 flex items-center justify-between text-xs text-[#8fa396] bg-[#030e07]">
            <span>
              Showing 1 to {filteredEvents.length} of 1,247 events
            </span>

            <div className="flex items-center gap-1 font-mono text-xs">
              <button disabled className="w-7 h-7 rounded-lg bg-[#07170e] border border-white/[0.08] text-[#6e8d7a] flex items-center justify-center opacity-50 cursor-not-allowed">
                &lt;
              </button>
              <button className="w-7 h-7 rounded-lg bg-[#00e676]/15 border border-[#00e676] text-[#00e676] font-bold flex items-center justify-center">
                1
              </button>
              <button className="w-7 h-7 rounded-lg bg-[#07170e] border border-white/[0.08] text-[#8fa396] hover:text-white flex items-center justify-center">
                2
              </button>
              <button className="w-7 h-7 rounded-lg bg-[#07170e] border border-white/[0.08] text-[#8fa396] hover:text-white flex items-center justify-center">
                3
              </button>
              <span className="px-1 text-[#6e8d7a]">...</span>
              <button className="w-7 h-7 rounded-lg bg-[#07170e] border border-white/[0.08] text-[#8fa396] hover:text-white flex items-center justify-center">
                125
              </button>
              <button className="w-7 h-7 rounded-lg bg-[#07170e] border border-white/[0.08] text-[#8fa396] hover:text-white flex items-center justify-center">
                &gt;
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Event Details Panel (Col-span 5 or 4) */}
        {isDetailsPanelOpen && selectedEvent && (
          <div className="lg:col-span-5 xl:col-span-4 rounded-2xl bg-[#04140b] border border-[#00e676]/25 shadow-[0_12px_40px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col animate-in fade-in slide-in-from-right-4 duration-200">
            
            {/* Details Panel Top Header */}
            <div className="p-4 border-b border-[#00e676]/15 flex items-center justify-between bg-[#030e07]">
              <h3 className="text-sm font-bold text-white font-sans">
                Event Details
              </h3>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#3b1219] border border-[#ef4444]/60 text-[#ef4444] text-[11px] font-bold">
                  <Shield className="w-3 h-3 text-[#ef4444]" />
                  {selectedEvent.severity}
                </span>
                <button
                  onClick={() => setIsDetailsPanelOpen(false)}
                  className="p-1 rounded text-[#8fa396] hover:text-white hover:bg-white/[0.08]"
                  title="Close panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Event Title Block */}
            <div className="p-4 border-b border-[#00e676]/10 flex items-start gap-3.5 bg-[#05170d]">
              <div className="w-10 h-10 rounded-2xl bg-[#ef4444]/15 border border-[#ef4444]/40 flex items-center justify-center text-[#ef4444] shrink-0 mt-0.5 shadow-[0_0_12px_rgba(239,68,68,0.2)]">
                <Share2 className="w-5 h-5 text-[#ef4444]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-white truncate font-sans">
                    {selectedEvent.title}
                  </h4>
                  <span className="flex items-center gap-1 text-[11px] font-mono text-white shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                    {selectedEvent.status}
                  </span>
                </div>
                <div className="text-[11px] text-[#8fa396] font-mono mt-0.5">
                  {selectedEvent.fullTimestamp}
                </div>
              </div>
            </div>

            {/* Sub-Tabs: Overview, Threat Intel, Related Events, Actions */}
            <div className="flex items-center border-b border-[#00e676]/15 bg-[#030a05] text-xs font-sans">
              <button
                onClick={() => setActiveDetailsTab('overview')}
                className={`flex-1 py-2.5 text-center font-medium transition-colors border-b-2 ${
                  activeDetailsTab === 'overview'
                    ? 'border-[#00e676] text-[#00e676] bg-[#00e676]/[0.06] font-bold'
                    : 'border-transparent text-[#8fa396] hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveDetailsTab('threat-intel')}
                className={`flex-1 py-2.5 text-center font-medium transition-colors border-b-2 ${
                  activeDetailsTab === 'threat-intel'
                    ? 'border-[#00e676] text-[#00e676] bg-[#00e676]/[0.06] font-bold'
                    : 'border-transparent text-[#8fa396] hover:text-white'
                }`}
              >
                Threat Intel
              </button>
              <button
                onClick={() => setActiveDetailsTab('related-events')}
                className={`flex-1 py-2.5 text-center font-medium transition-colors border-b-2 ${
                  activeDetailsTab === 'related-events'
                    ? 'border-[#00e676] text-[#00e676] bg-[#00e676]/[0.06] font-bold'
                    : 'border-transparent text-[#8fa396] hover:text-white'
                }`}
              >
                Related Events
              </button>
              <button
                onClick={() => setActiveDetailsTab('actions')}
                className={`flex-1 py-2.5 text-center font-medium transition-colors border-b-2 ${
                  activeDetailsTab === 'actions'
                    ? 'border-[#00e676] text-[#00e676] bg-[#00e676]/[0.06] font-bold'
                    : 'border-transparent text-[#8fa396] hover:text-white'
                }`}
              >
                Actions
              </button>
            </div>

            {/* Sub-Tab Contents */}
            <div className="p-4 flex flex-col gap-4 text-xs max-h-[500px] overflow-y-auto">
              
              {/* TAB 1: OVERVIEW */}
              {activeDetailsTab === 'overview' && (
                <>
                  {/* Attributes Grid matching screenshot */}
                  <div className="flex flex-col gap-2.5 py-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8fa396]">Source IP</span>
                      <div className="flex items-center gap-1.5 font-mono text-white font-medium">
                        <span>{selectedEvent.source}</span>
                        <button onClick={() => handleCopy(selectedEvent.source)} className="text-[#8fa396] hover:text-white p-0.5">
                          {copiedText === selectedEvent.source ? <Check className="w-3 h-3 text-[#00e676]" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8fa396]">Destination IP</span>
                      <div className="flex items-center gap-1.5 font-mono text-white font-medium">
                        <span className="truncate max-w-[180px]">{selectedEvent.destination}</span>
                        <button onClick={() => handleCopy(selectedEvent.destination)} className="text-[#8fa396] hover:text-white p-0.5">
                          {copiedText === selectedEvent.destination ? <Check className="w-3 h-3 text-[#00e676]" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8fa396]">Protocol</span>
                      <span className="font-mono text-white font-medium">{selectedEvent.protocol}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8fa396]">Event Type</span>
                      <span className="text-white font-medium">{selectedEvent.eventType}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8fa396]">Severity</span>
                      {getSeverityBadge(selectedEvent.severity)}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8fa396]">Status</span>
                      {getStatusDot(selectedEvent.status)}
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="p-3.5 rounded-xl bg-[#030906] border border-[#00e676]/15 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <FileText className="w-4 h-4 text-[#00e676]" />
                      <span>Summary</span>
                    </div>
                    <p className="text-[11px] text-[#c8ddd0] leading-relaxed">
                      {selectedEvent.summary}
                    </p>
                  </div>

                  {/* Recommended Action Box */}
                  <div className="p-3.5 rounded-xl bg-[#140609] border border-red-500/25 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span>Recommended Action</span>
                    </div>
                    <p className="text-[11px] text-[#fca5a5] leading-relaxed">
                      {selectedEvent.recommendedAction}
                    </p>
                  </div>
                </>
              )}

              {/* TAB 2: THREAT INTEL */}
              {activeDetailsTab === 'threat-intel' && (
                <div className="flex flex-col gap-3">
                  <div className="p-3.5 rounded-xl bg-[#05170d] border border-[#00e676]/25 flex flex-col gap-2">
                    <span className="text-[10px] font-mono uppercase text-[#00e676] font-bold">Threat Intelligence Feed Correlation</span>
                    {selectedEvent.threatIntelMatch ? (
                      <div className="flex flex-col gap-2 text-xs">
                        <div>
                          <span className="text-[#8fa396]">Known Threat Actor: </span>
                          <span className="text-[#00e676] font-bold">{selectedEvent.threatIntelMatch.threatActor}</span>
                        </div>
                        <div>
                          <span className="text-[#8fa396]">Associated Campaign: </span>
                          <span className="text-white font-medium">{selectedEvent.threatIntelMatch.campaign}</span>
                        </div>
                        <div>
                          <span className="text-[#8fa396]">Confidence Score: </span>
                          <span className="text-white font-bold font-mono">{selectedEvent.threatIntelMatch.confidenceScore}%</span>
                        </div>
                        <div>
                          <span className="text-[#8fa396]">Feed Source: </span>
                          <span className="text-[#c8ddd0]">{selectedEvent.threatIntelMatch.feedSource}</span>
                        </div>
                        <div>
                          <span className="text-[#8fa396]">Detection Engine: </span>
                          <span className="text-[#c8ddd0]">{selectedEvent.threatIntelMatch.detectionEngine}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[#8fa396]">
                        No active match in upstream Threat Intelligence databases. Telemetry evaluated via heuristic behavioral baseline.
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectTab('threat-intelligence')}
                    className="w-full py-2 px-3 rounded-xl bg-[#00e676]/10 hover:bg-[#00e676]/20 border border-[#00e676]/30 text-[#00e676] text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>View in Threat Intelligence Feed</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* TAB 3: RELATED EVENTS */}
              {activeDetailsTab === 'related-events' && (
                <div className="flex flex-col gap-2.5">
                  <span className="text-[11px] font-mono text-[#8fa396]">
                    Correlated telemetry originating from host {selectedEvent.source}:
                  </span>

                  {selectedEvent.relatedEvents && selectedEvent.relatedEvents.length > 0 ? (
                    selectedEvent.relatedEvents.map(rel => (
                      <div key={rel.id} className="p-3 rounded-xl bg-[#030906] border border-[#00e676]/15 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white text-xs">{rel.type}</div>
                          <div className="text-[10px] text-[#8fa396] font-mono mt-0.5">{rel.time} • {rel.destination}</div>
                        </div>
                        {getSeverityBadge(rel.severity)}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-[#8fa396] bg-white/[0.02] rounded-xl border border-white/[0.06]">
                      No other recent anomalous events on this asset.
                    </div>
                  )}

                  {selectedEvent.assetInfo && (
                    <div className="p-3.5 rounded-xl bg-[#05170d] border border-[#00e676]/20 flex flex-col gap-1.5 mt-2">
                      <span className="text-[10px] font-mono uppercase text-[#00e676] font-bold">Asset Metadata</span>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        <div><span className="text-[#8fa396]">Host:</span> <span className="text-white">{selectedEvent.assetInfo.hostname}</span></div>
                        <div><span className="text-[#8fa396]">VLAN:</span> <span className="text-white">{selectedEvent.assetInfo.vlan}</span></div>
                        <div><span className="text-[#8fa396]">User:</span> <span className="text-white">{selectedEvent.assetInfo.user}</span></div>
                        <div><span className="text-[#8fa396]">OS:</span> <span className="text-white">{selectedEvent.assetInfo.os}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: ACTIONS & AUDIT TRAIL */}
              {activeDetailsTab === 'actions' && (
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-mono uppercase text-[#00e676] font-bold">Immutable Audit Trail (NIST SP 800-61 Rev. 3)</span>
                  <div className="flex flex-col gap-2">
                    {selectedEvent.auditTrail.map((aud) => (
                      <div key={aud.id} className="p-3 rounded-xl bg-[#030906] border border-[#00e676]/15 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-[#00e676] font-bold">{aud.action}</span>
                          <span className="text-[#8fa396]">{aud.timestamp}</span>
                        </div>
                        <div className="text-xs text-white font-medium">{aud.actor}</div>
                        <div className="text-[11px] text-[#c8ddd0]">{aud.details}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Action Buttons Bar matching screenshot */}
            <div className="p-4 border-t border-[#00e676]/15 bg-[#030a05] grid grid-cols-3 gap-2">
              {/* Button 1: Create Case */}
              <button
                onClick={() => setIsCreateCaseModalOpen(true)}
                className="py-2 px-2.5 rounded-xl bg-[#04160c] border border-[#00e676]/60 hover:bg-[#00e676]/20 text-[#00e676] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_10px_rgba(0,230,118,0.1)] active:scale-95"
              >
                <FolderPlus className="w-3.5 h-3.5 text-[#00e676]" />
                <span className="truncate">Create Case</span>
              </button>

              {/* Button 2: Mark as Investigating */}
              <button
                onClick={handleMarkAsInvestigating}
                className="py-2 px-2.5 rounded-xl bg-white/[0.04] border border-white/[0.12] hover:bg-white/[0.08] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Search className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span className="truncate">Mark as Investigating</span>
              </button>

              {/* Button 3: Block */}
              <button
                onClick={() => setIsBlockModalOpen(true)}
                className="py-2 px-2.5 rounded-xl bg-[#280c10] border border-[#ef4444]/60 hover:bg-[#ef4444]/20 text-[#ef4444] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_10px_rgba(239,68,68,0.15)] active:scale-95"
              >
                <Ban className="w-3.5 h-3.5 text-[#ef4444]" />
                <span className="truncate">Block</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 6. MODAL: CREATE CASE FROM SOC ALERT                                */}
      {/* ==================================================================== */}
      {isCreateCaseModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg my-6 rounded-3xl p-6 sm:p-7 bg-[#06140c] border border-[#00e676]/35 shadow-[0_32px_96px_rgba(0,0,0,0.9)] text-white">
            
            <div className="flex items-start justify-between border-b border-[#00e676]/15 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676]">
                  <FolderPlus className="w-5 h-5 text-[#00e676]" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#00e676] uppercase font-bold">Investigation Workflow</span>
                  <h3 className="text-base font-bold text-white">Escalate Alert to Active Docket</h3>
                </div>
              </div>
              <button onClick={() => setIsCreateCaseModalOpen(false)} className="p-1 rounded text-[#8fa396] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#030906] border border-[#00e676]/15">
                <div className="text-[10px] text-[#8fa396] uppercase font-mono">Alert Source</div>
                <div className="font-bold text-white text-sm mt-0.5">{selectedEvent.title}</div>
                <div className="text-[#c8ddd0] mt-1">{selectedEvent.summary}</div>
              </div>

              <div>
                <label className="block text-[11px] text-[#8fa396] font-mono mb-1">Generated Incident Identifier</label>
                <input
                  type="text"
                  disabled
                  value="CASE-2026-0945 (C2 Ingress Incident Docket)"
                  className="w-full bg-[#030805] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-[#00e676] font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#8fa396] font-mono mb-1">Assigned Investigator</label>
                <input
                  type="text"
                  disabled
                  value="Specialist Naveen (Clearance: SPECIALIST TIER 2+)"
                  className="w-full bg-[#030805] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="pt-4 mt-5 border-t border-[#00e676]/15 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsCreateCaseModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCreateCase}
                className="px-4 py-2 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-[#030706] text-xs font-bold flex items-center gap-1.5 shadow-[0_0_16px_rgba(0,230,118,0.3)] transition-all"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Confirm &amp; Open Workspace</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. MODAL: EXECUTE PERIMETER BLOCK ACTION                            */}
      {/* ==================================================================== */}
      {isBlockModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg my-6 rounded-3xl p-6 sm:p-7 bg-[#0b0406] border border-red-500/40 shadow-[0_32px_96px_rgba(0,0,0,0.95)] text-white">
            
            <div className="flex items-start justify-between border-b border-red-500/20 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                  <Ban className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-red-400 uppercase font-bold">Countermeasure Enforcement</span>
                  <h3 className="text-base font-bold text-white">Execute Immediate Perimeter Block</h3>
                </div>
              </div>
              <button onClick={() => setIsBlockModalOpen(false)} className="p-1 rounded text-[#8fa396] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#180609] border border-red-500/25">
                <div className="flex items-center justify-between text-[10px] font-mono text-red-300 font-bold">
                  <span>TARGET SOCKET</span>
                  <span>SEVERITY: {selectedEvent.severity}</span>
                </div>
                <div className="font-mono text-base font-bold text-white mt-1">
                  {selectedEvent.destination}
                </div>
                <div className="text-[11px] text-[#fca5a5] mt-0.5">
                  Internal Host: {selectedEvent.source}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <span className="text-[11px] text-[#c8ddd0] leading-relaxed">
                  Executing this action will push a priority firewall drop rule to all border routers and isolate endpoint <strong>{selectedEvent.source}</strong> to prevent lateral movement.
                </span>
              </div>
            </div>

            <div className="pt-4 mt-5 border-t border-red-500/20 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsBlockModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBlock}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all"
              >
                <Ban className="w-4 h-4" />
                <span>Confirm &amp; Enforce Block</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
