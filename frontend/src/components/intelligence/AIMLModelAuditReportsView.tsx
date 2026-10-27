import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Globe, 
  Mail, 
  MessageSquare, 
  Box, 
  Share2, 
  Search, 
  Calendar, 
  ChevronDown, 
  ChevronRight, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Network, 
  X, 
  Check, 
  Sparkles, 
  FlaskConical, 
  Layers, 
  ShieldCheck, 
  Sliders, 
  Download, 
  Filter,
  BarChart2,
  Gauge,
  Activity,
  UserCheck,
  Cpu
} from 'lucide-react';
import { ModelMetric } from '../../types';

export interface ContributingFactor {
  name: string;
  score: number; // positive = pushes toward phishing/malicious, negative = pushes toward legitimate
  formattedScore: string;
  direction: 'positive' | 'negative';
  description?: string;
}

export interface AuditRecord {
  id: string;
  auditId: string;
  caseId?: string;
  modelId: string;
  modelName: string;
  modelVersion: string;
  inputType: 'URL' | 'Email' | 'SMS' | 'Complaint' | 'OSINT Text' | 'Case Vectors';
  inputDisplay: string;
  rawInputSnippet: string;
  timestamp: string;
  timestampRaw: string;
  prediction: 'Phishing' | 'Legitimate' | 'Malicious' | 'Benign' | 'Spam' | 'Critical' | 'Linked';
  riskLevel: 'High' | 'Low' | 'Medium';
  confidence: number;
  isReviewed: boolean;
  reviewedOn?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  contributingFactors: ContributingFactor[];
  explanationSummary: string;
}

interface AIMLModelAuditReportsViewProps {
  onSelectTab: (tab: string) => void;
  models?: ModelMetric[];
}

export const AIMLModelAuditReportsView: React.FC<AIMLModelAuditReportsViewProps> = ({
  onSelectTab
}) => {
  // Selected Model filter (matching screenshot: URL Phishing Detector)
  const [selectedModelFilter, setSelectedModelFilter] = useState<string>('url-phishing');
  const [timeRangeFilter, setTimeRangeFilter] = useState<string>('Last 30 days');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'highest-risk'>('latest');

  // Audit Records Master Dataset (18 records matching Audit Records (18) in screenshot)
  const [records, setRecords] = useState<AuditRecord[]>([
    // Row 1: hxxps://example-secure.com (Selected by default in screenshot)
    {
      id: 'rec-1',
      auditId: 'AUD-2025-0312-8821',
      caseId: 'CYBER-2025-8842',
      modelId: 'url-phishing',
      modelName: 'URL Phishing Detector',
      modelVersion: 'v1.0.7',
      inputType: 'URL',
      inputDisplay: 'hxxps://example-secure.com',
      rawInputSnippet: 'https://example-secure.com/login/auth-session?token=8f92ab',
      timestamp: '12 Mar 2025, 14:32',
      timestampRaw: '2025-03-12T14:32:00Z',
      prediction: 'Phishing',
      riskLevel: 'High',
      confidence: 0.92,
      isReviewed: true,
      reviewedOn: '12 Mar 2025, 16:10',
      reviewedBy: 'Analyst-01',
      reviewNotes: 'Confirmed fake banking landing page mimicking State Bank online portal with credential harvesting form.',
      contributingFactors: [
        { name: 'Suspicious URL pattern', score: 0.42, formattedScore: '+0.42', direction: 'positive', description: 'Hex encoding & subpath structure strongly mirrors known credential-theft kits.' },
        { name: 'New domain (age < 7 days)', score: 0.28, formattedScore: '+0.28', direction: 'positive', description: 'Domain registered 4 days prior through bulletproof registrar.' },
        { name: 'Contains misleading keywords', score: 0.18, formattedScore: '+0.18', direction: 'positive', description: 'Keyword "secure" used to falsely imply authentic SSL banking portal.' },
        { name: 'Unusual subdomain structure', score: -0.07, formattedScore: '-0.07', direction: 'negative', description: 'Standard apex domain delegation partially offset risk score.' },
        { name: 'Uses HTTPS', score: -0.05, formattedScore: '-0.05', direction: 'negative', description: 'Valid free Let\'s Encrypt certificate present.' }
      ],
      explanationSummary: 'The model flagged this URL as phishing mainly due to suspicious URL pattern, new domain and misleading keywords in the domain name.'
    },

    // Row 2: hxxps://trusted-site.org
    {
      id: 'rec-2',
      auditId: 'AUD-2025-0312-8750',
      caseId: 'CYBER-2025-8830',
      modelId: 'url-phishing',
      modelName: 'URL Phishing Detector',
      modelVersion: 'v1.0.7',
      inputType: 'URL',
      inputDisplay: 'hxxps://trusted-site.org',
      rawInputSnippet: 'https://trusted-site.org/annual-report/2024.pdf',
      timestamp: '12 Mar 2025, 11:08',
      timestampRaw: '2025-03-12T11:08:00Z',
      prediction: 'Legitimate',
      riskLevel: 'Low',
      confidence: 0.08,
      isReviewed: true,
      reviewedOn: '12 Mar 2025, 11:45',
      reviewedBy: 'Analyst-03',
      reviewNotes: 'Verified legitimate non-profit organizational portal.',
      contributingFactors: [
        { name: 'Established domain age (> 8 years)', score: -0.45, formattedScore: '-0.45', direction: 'negative' },
        { name: 'Consistent WHOIS registrar record', score: -0.32, formattedScore: '-0.32', direction: 'negative' },
        { name: 'Clean global Alexa/Tranco ranking', score: -0.22, formattedScore: '-0.22', direction: 'negative' },
        { name: 'Standard URL parameter format', score: -0.09, formattedScore: '-0.09', direction: 'negative' },
        { name: 'Extended validation certificate', score: -0.06, formattedScore: '-0.06', direction: 'negative' }
      ],
      explanationSummary: 'The model classified this URL as legitimate due to high domain age, long-standing WHOIS registration, and absence of deceptive keywords.'
    },

    // Row 3: hxxps://free-offer.shop
    {
      id: 'rec-3',
      auditId: 'AUD-2025-0311-8610',
      caseId: 'CYBER-2025-8799',
      modelId: 'url-phishing',
      modelName: 'URL Phishing Detector',
      modelVersion: 'v1.0.7',
      inputType: 'URL',
      inputDisplay: 'hxxps://free-offer.shop',
      rawInputSnippet: 'https://free-offer.shop/claim-voucher?user=9928',
      timestamp: '11 Mar 2025, 17:20',
      timestampRaw: '2025-03-11T17:20:00Z',
      prediction: 'Phishing',
      riskLevel: 'High',
      confidence: 0.94,
      isReviewed: true,
      reviewedOn: '11 Mar 2025, 18:05',
      reviewedBy: 'Analyst-01',
      reviewNotes: 'Lure URL promising shopping vouchers; steals phone and OTP.',
      contributingFactors: [
        { name: 'High-risk TLD (.shop)', score: 0.38, formattedScore: '+0.38', direction: 'positive' },
        { name: 'Suspicious incentive keyword ("free-offer")', score: 0.34, formattedScore: '+0.34', direction: 'positive' },
        { name: 'Zero historic web traffic footprint', score: 0.22, formattedScore: '+0.22', direction: 'positive' },
        { name: 'Host IP in flagged bulletproof subnet', score: 0.15, formattedScore: '+0.15', direction: 'positive' },
        { name: 'Uses HTTPS', score: -0.04, formattedScore: '-0.04', direction: 'negative' }
      ],
      explanationSummary: 'The model flagged this URL as phishing based on predatory incentive terminology in the domain, a suspicious .shop extension, and low reputation IP hosting.'
    },

    // Row 4: hxxps://gov-portal.my
    {
      id: 'rec-4',
      auditId: 'AUD-2025-0311-8402',
      caseId: 'CYBER-2025-8751',
      modelId: 'url-phishing',
      modelName: 'URL Phishing Detector',
      modelVersion: 'v1.0.7',
      inputType: 'URL',
      inputDisplay: 'hxxps://gov-portal.my',
      rawInputSnippet: 'https://gov-portal.my/tax-assessment/2025',
      timestamp: '11 Mar 2025, 09:12',
      timestampRaw: '2025-03-11T09:12:00Z',
      prediction: 'Legitimate',
      riskLevel: 'Low',
      confidence: 0.05,
      isReviewed: true,
      reviewedOn: '11 Mar 2025, 10:00',
      reviewedBy: 'Analyst-02',
      reviewNotes: 'Official municipal governmental portal.',
      contributingFactors: [
        { name: 'Verified government ccTLD registry (.my)', score: -0.52, formattedScore: '-0.52', direction: 'negative' },
        { name: 'DNSSEC validation passed', score: -0.28, formattedScore: '-0.28', direction: 'negative' },
        { name: 'Domain registered > 12 years', score: -0.21, formattedScore: '-0.21', direction: 'negative' },
        { name: 'Clean Google Safe Browsing history', score: -0.11, formattedScore: '-0.11', direction: 'negative' }
      ],
      explanationSummary: 'The model recognized this URL as legitimate due to strict country-code government registry validation, active DNSSEC, and a clean historical reputation.'
    },

    // Row 5: hxxps://payment-update.net
    {
      id: 'rec-5',
      auditId: 'AUD-2025-0310-8230',
      caseId: 'CYBER-2025-8710',
      modelId: 'url-phishing',
      modelName: 'URL Phishing Detector',
      modelVersion: 'v1.0.7',
      inputType: 'URL',
      inputDisplay: 'hxxps://payment-update.net',
      rawInputSnippet: 'https://payment-update.net/invoice/pay?ref=40029',
      timestamp: '10 Mar 2025, 16:45',
      timestampRaw: '2025-03-10T16:45:00Z',
      prediction: 'Phishing',
      riskLevel: 'High',
      confidence: 0.89,
      isReviewed: true,
      reviewedOn: '10 Mar 2025, 17:30',
      reviewedBy: 'Analyst-01',
      reviewNotes: 'Fake payment processing redirect simulating credit card gateway.',
      contributingFactors: [
        { name: 'Financial payment deceptive wording', score: 0.39, formattedScore: '+0.39', direction: 'positive' },
        { name: 'Domain registered < 14 days ago', score: 0.31, formattedScore: '+0.31', direction: 'positive' },
        { name: 'Nameservers mapped to fast-flux DNS', score: 0.24, formattedScore: '+0.24', direction: 'positive' },
        { name: 'Unusual query parameter encoding', score: 0.12, formattedScore: '+0.12', direction: 'positive' },
        { name: 'Uses HTTPS', score: -0.05, formattedScore: '-0.05', direction: 'negative' }
      ],
      explanationSummary: 'The model identified this URL as phishing due to deceptive payment keywords, short domain lifecycle, and rapid fast-flux DNS nameserver changes.'
    },

    // Row 6: hxxps://account-verify.com
    {
      id: 'rec-6',
      auditId: 'AUD-2025-0310-8115',
      caseId: 'CYBER-2025-8692',
      modelId: 'url-phishing',
      modelName: 'URL Phishing Detector',
      modelVersion: 'v1.0.7',
      inputType: 'URL',
      inputDisplay: 'hxxps://account-verify.com',
      rawInputSnippet: 'https://account-verify.com/security/login',
      timestamp: '10 Mar 2025, 10:18',
      timestampRaw: '2025-03-10T10:18:00Z',
      prediction: 'Phishing',
      riskLevel: 'High',
      confidence: 0.91,
      isReviewed: true,
      reviewedOn: '10 Mar 2025, 11:02',
      reviewedBy: 'Analyst-02',
      reviewNotes: 'Generic account re-verification portal targeting telecommunication logins.',
      contributingFactors: [
        { name: 'High-urgency verification keywords', score: 0.41, formattedScore: '+0.41', direction: 'positive' },
        { name: 'WHOIS privacy proxy masking owner', score: 0.27, formattedScore: '+0.27', direction: 'positive' },
        { name: 'Suspicious path depth (/security/login)', score: 0.21, formattedScore: '+0.21', direction: 'positive' },
        { name: 'Non-standard SSL issuer', score: 0.14, formattedScore: '+0.14', direction: 'positive' },
        { name: 'Popular TLD (.com)', score: -0.06, formattedScore: '-0.06', direction: 'negative' }
      ],
      explanationSummary: 'The model flagged this URL as phishing based on generic account re-verification terminology, obscured WHOIS registrant details, and deceptive login path structure.'
    },

    // Rows 7-18: Remaining 12 records completing the 18 Audit Records count
    {
      id: 'rec-7',
      auditId: 'AUD-2025-0309-7980',
      caseId: 'CYBER-2025-8650',
      modelId: 'url-phishing',
      modelName: 'URL Phishing Detector',
      modelVersion: 'v1.0.7',
      inputType: 'URL',
      inputDisplay: 'hxxps://ebanking-alert-update.biz',
      rawInputSnippet: 'https://ebanking-alert-update.biz/sbi/relogin',
      timestamp: '09 Mar 2025, 19:40',
      timestampRaw: '2025-03-09T19:40:00Z',
      prediction: 'Phishing',
      riskLevel: 'High',
      confidence: 0.96,
      isReviewed: true,
      reviewedOn: '09 Mar 2025, 20:15',
      reviewedBy: 'Analyst-01',
      contributingFactors: [
        { name: 'Banking trademark typo-squatting', score: 0.44, formattedScore: '+0.44', direction: 'positive' },
        { name: 'High-risk .biz TLD', score: 0.29, formattedScore: '+0.29', direction: 'positive' }
      ],
      explanationSummary: 'The model flagged this URL as phishing due to blatant financial trademark squatting and deceptive banking relogin lures.'
    },
    {
      id: 'rec-8',
      auditId: 'AUD-2025-0309-7812',
      caseId: 'CYBER-2025-8622',
      modelId: 'url-phishing',
      modelName: 'URL Phishing Detector',
      modelVersion: 'v1.0.7',
      inputType: 'URL',
      inputDisplay: 'hxxps://secure-cloud-portal.io',
      rawInputSnippet: 'https://secure-cloud-portal.io/docs/share',
      timestamp: '09 Mar 2025, 14:15',
      timestampRaw: '2025-03-09T14:15:00Z',
      prediction: 'Legitimate',
      riskLevel: 'Low',
      confidence: 0.12,
      isReviewed: true,
      reviewedOn: '09 Mar 2025, 15:00',
      reviewedBy: 'Analyst-03',
      contributingFactors: [
        { name: 'Corporate domain age (> 5 years)', score: -0.38, formattedScore: '-0.38', direction: 'negative' },
        { name: 'Authentic enterprise SSO certificate', score: -0.26, formattedScore: '-0.26', direction: 'negative' }
      ],
      explanationSummary: 'Legitimate corporate document sharing portal with established identity verification certificates.'
    },
    {
      id: 'rec-9',
      auditId: 'AUD-2025-0308-7650',
      caseId: 'CYBER-2025-8590',
      modelId: 'url-phishing',
      modelName: 'URL Phishing Detector',
      modelVersion: 'v1.0.7',
      inputType: 'URL',
      inputDisplay: 'hxxps://netflix-subscription-renew.online',
      rawInputSnippet: 'https://netflix-subscription-renew.online/billing',
      timestamp: '08 Mar 2025, 21:05',
      timestampRaw: '2025-03-08T21:05:00Z',
      prediction: 'Phishing',
      riskLevel: 'High',
      confidence: 0.95,
      isReviewed: true,
      reviewedOn: '08 Mar 2025, 21:40',
      reviewedBy: 'Analyst-01',
      contributingFactors: [
        { name: 'Streaming service trademark infringement', score: 0.46, formattedScore: '+0.46', direction: 'positive' },
        { name: 'Cheap disposable TLD (.online)', score: 0.28, formattedScore: '+0.28', direction: 'positive' }
      ],
      explanationSummary: 'Brand impersonation phishing campaign targeting OTT subscriber credentials.'
    },
    {
      id: 'rec-10',
      auditId: 'AUD-2025-0308-7510',
      caseId: 'CYBER-2025-8575',
      modelId: 'url-phishing',
      modelName: 'URL Phishing Detector',
      modelVersion: 'v1.0.7',
      inputType: 'URL',
      inputDisplay: 'hxxps://university-portal.edu',
      rawInputSnippet: 'https://university-portal.edu/admissions',
      timestamp: '08 Mar 2025, 11:20',
      timestampRaw: '2025-03-08T11:20:00Z',
      prediction: 'Legitimate',
      riskLevel: 'Low',
      confidence: 0.04,
      isReviewed: true,
      reviewedOn: '08 Mar 2025, 12:00',
      reviewedBy: 'Analyst-02',
      contributingFactors: [
        { name: 'Accredited .edu educational domain', score: -0.58, formattedScore: '-0.58', direction: 'negative' }
      ],
      explanationSummary: 'Verified educational institution domain; zero malicious heuristics.'
    },
    {
      id: 'rec-11',
      auditId: 'AUD-2025-0307-7320',
      caseId: 'CYBER-2025-8530',
      modelId: 'url-phishing',
      modelName: 'URL Phishing Detector',
      modelVersion: 'v1.0.7',
      inputType: 'URL',
      inputDisplay: 'hxxps://crypto-airdrop-bonus.xyz',
      rawInputSnippet: 'https://crypto-airdrop-bonus.xyz/connect-wallet',
      timestamp: '07 Mar 2025, 18:50',
      timestampRaw: '2025-03-07T18:50:00Z',
      prediction: 'Phishing',
      riskLevel: 'High',
      confidence: 0.97,
      isReviewed: true,
      reviewedOn: '07 Mar 2025, 19:25',
      reviewedBy: 'Analyst-01',
      contributingFactors: [
        { name: 'Cryptocurrency drainer script signature', score: 0.48, formattedScore: '+0.48', direction: 'positive' },
        { name: 'Deceptive airdrop incentive terminology', score: 0.35, formattedScore: '+0.35', direction: 'positive' }
      ],
      explanationSummary: 'Web3 cryptocurrency wallet draining site attempting to execute unauthorized token approval transactions.'
    },
    {
      id: 'rec-12',
      auditId: 'AUD-2025-0307-7190',
      caseId: 'CYBER-2025-8512',
      modelId: 'url-phishing',
      modelName: 'URL Phishing Detector',
      modelVersion: 'v1.0.7',
      inputType: 'URL',
      inputDisplay: 'hxxps://support-ticket-system.org',
      rawInputSnippet: 'https://support-ticket-system.org/ticket/view/491',
      timestamp: '07 Mar 2025, 13:05',
      timestampRaw: '2025-03-07T13:05:00Z',
      prediction: 'Legitimate',
      riskLevel: 'Low',
      confidence: 0.10,
      isReviewed: true,
      reviewedOn: '07 Mar 2025, 13:40',
      reviewedBy: 'Analyst-03',
      contributingFactors: [
        { name: 'Open-source software ticket tracker repository', score: -0.41, formattedScore: '-0.41', direction: 'negative' }
      ],
      explanationSummary: 'Legitimate open-source community support portal.'
    },
    {
      id: 'rec-13',
      auditId: 'AUD-2025-0306-6980',
      caseId: 'CYBER-2025-8490',
      modelId: 'url-phishing',
      modelName: 'URL Phishing Detector',
      modelVersion: 'v1.0.7',
      inputType: 'URL',
      inputDisplay: 'hxxps://kyc-pan-update.in',
      rawInputSnippet: 'https://kyc-pan-update.in/verification-form',
      timestamp: '06 Mar 2025, 17:15',
      timestampRaw: '2025-03-06T17:15:00Z',
      prediction: 'Phishing',
      riskLevel: 'High',
      confidence: 0.93,
      isReviewed: true,
      reviewedOn: '06 Mar 2025, 18:00',
      reviewedBy: 'Analyst-01',
      contributingFactors: [
        { name: 'Indian statutory KYC/PAN identity theft lure', score: 0.43, formattedScore: '+0.43', direction: 'positive' }
      ],
      explanationSummary: 'Phishing portal impersonating Income Tax department PAN card linking mandate.'
    },
    {
      id: 'rec-14',
      auditId: 'AUD-2025-0306-6810',
      caseId: 'CYBER-2025-8465',
      modelId: 'url-phishing',
      modelName: 'URL Phishing Detector',
      modelVersion: 'v1.0.7',
      inputType: 'URL',
      inputDisplay: 'hxxps://global-news-network.com',
      rawInputSnippet: 'https://global-news-network.com/article/tech-trends',
      timestamp: '06 Mar 2025, 10:40',
      timestampRaw: '2025-03-06T10:40:00Z',
      prediction: 'Legitimate',
      riskLevel: 'Low',
      confidence: 0.07,
      isReviewed: true,
      reviewedOn: '06 Mar 2025, 11:15',
      reviewedBy: 'Analyst-02',
      contributingFactors: [
        { name: 'High-volume news publisher with syndication', score: -0.49, formattedScore: '-0.49', direction: 'negative' }
      ],
      explanationSummary: 'Standard media publication website with high authority score.'
    },
    {
      id: 'rec-15',
      auditId: 'AUD-2025-0305-6620',
      caseId: 'CYBER-2025-8420',
      modelId: 'url-phishing',
      modelName: 'URL Phishing Detector',
      modelVersion: 'v1.0.7',
      inputType: 'URL',
      inputDisplay: 'hxxps://fedex-parcel-delivery-fee.top',
      rawInputSnippet: 'https://fedex-parcel-delivery-fee.top/reschedule',
      timestamp: '05 Mar 2025, 15:30',
      timestampRaw: '2025-03-05T15:30:00Z',
      prediction: 'Phishing',
      riskLevel: 'High',
      confidence: 0.94,
      isReviewed: true,
      reviewedOn: '05 Mar 2025, 16:15',
      reviewedBy: 'Analyst-01',
      contributingFactors: [
        { name: 'Courier service parcel fee scam', score: 0.45, formattedScore: '+0.45', direction: 'positive' }
      ],
      explanationSummary: 'Logistics impersonation phishing campaign demanding customs re-delivery fee.'
    },
    {
      id: 'rec-16',
      auditId: 'AUD-2025-0305-6450',
      caseId: 'CYBER-2025-8395',
      modelId: 'url-phishing',
      modelName: 'URL Phishing Detector',
      modelVersion: 'v1.0.7',
      inputType: 'URL',
      inputDisplay: 'hxxps://tech-documentation-hub.dev',
      rawInputSnippet: 'https://tech-documentation-hub.dev/api-reference',
      timestamp: '05 Mar 2025, 09:25',
      timestampRaw: '2025-03-05T09:25:00Z',
      prediction: 'Legitimate',
      riskLevel: 'Low',
      confidence: 0.06,
      isReviewed: true,
      reviewedOn: '05 Mar 2025, 10:00',
      reviewedBy: 'Analyst-03',
      contributingFactors: [
        { name: 'Developer documentation hosting structure', score: -0.42, formattedScore: '-0.42', direction: 'negative' }
      ],
      explanationSummary: 'Benign developer API documentation portal.'
    },
    {
      id: 'rec-17',
      auditId: 'AUD-2025-0304-6290',
      caseId: 'CYBER-2025-8360',
      modelId: 'url-phishing',
      modelName: 'URL Phishing Detector',
      modelVersion: 'v1.0.7',
      inputType: 'URL',
      inputDisplay: 'hxxps://instant-loan-approval-apk.cc',
      rawInputSnippet: 'https://instant-loan-approval-apk.cc/download',
      timestamp: '04 Mar 2025, 20:10',
      timestampRaw: '2025-03-04T20:10:00Z',
      prediction: 'Phishing',
      riskLevel: 'High',
      confidence: 0.98,
      isReviewed: true,
      reviewedOn: '04 Mar 2025, 20:45',
      reviewedBy: 'Analyst-01',
      contributingFactors: [
        { name: 'Predatory lending malware APK distribution', score: 0.52, formattedScore: '+0.52', direction: 'positive' }
      ],
      explanationSummary: 'Rogue Android APK distribution portal harvesting citizen contacts and camera permissions.'
    },
    {
      id: 'rec-18',
      auditId: 'AUD-2025-0304-6120',
      caseId: 'CYBER-2025-8330',
      modelId: 'url-phishing',
      modelName: 'URL Phishing Detector',
      modelVersion: 'v1.0.7',
      inputType: 'URL',
      inputDisplay: 'hxxps://community-forum-archive.org',
      rawInputSnippet: 'https://community-forum-archive.org/threads/general',
      timestamp: '04 Mar 2025, 12:40',
      timestampRaw: '2025-03-04T12:40:00Z',
      prediction: 'Legitimate',
      riskLevel: 'Low',
      confidence: 0.09,
      isReviewed: true,
      reviewedOn: '04 Mar 2025, 13:10',
      reviewedBy: 'Analyst-02',
      contributingFactors: [
        { name: 'Public bulletin board archive footprint', score: -0.37, formattedScore: '-0.37', direction: 'negative' }
      ],
      explanationSummary: 'Legitimate public bulletin board discussion archive.'
    },

    // -------------------------------------------------------------------------
    // Complaint Classifier Audit Records
    // -------------------------------------------------------------------------
    {
      id: 'rec-cc-1',
      auditId: 'AUD-2025-0312-7011',
      caseId: 'CR-2026-8821',
      modelId: 'complaint-classifier',
      modelName: 'Complaint Classifier',
      modelVersion: '1.1.0',
      inputType: 'Complaint',
      inputDisplay: 'Mule account UPI fraudulent transfer complaint',
      rawInputSnippet: 'Someone sent a fake QR code and debited 50000 rupees via PhonePe UPI without consent.',
      timestamp: '12 Jun 2026, 11:15',
      timestampRaw: '2026-06-12T11:15:00Z',
      prediction: 'Malicious',
      riskLevel: 'High',
      confidence: 0.96,
      isReviewed: true,
      reviewedOn: '12 Jun 2026, 11:45',
      reviewedBy: 'Analyst-01',
      reviewNotes: 'Verified unauthorized UPI pull transaction matching classic payment redirection fraud.',
      contributingFactors: [
        { name: 'Unauthorized debit lure keywords', score: 0.44, formattedScore: '+0.44', direction: 'positive', description: 'DeBERTa detected unapproved payment flow semantics.' },
        { name: 'Specific financial quantum (> ₹25k)', score: 0.31, formattedScore: '+0.31', direction: 'positive', description: 'High loss threshold triggers urgent police jurisdiction.' },
        { name: 'Third-party payment gateway indicator', score: 0.18, formattedScore: '+0.18', direction: 'positive', description: 'UPI merchant API identifier flagged in entity list.' }
      ],
      explanationSummary: 'Classified under UPI Financial Fraud with 96% confidence based on non-consensual QR code debit language.'
    },
    {
      id: 'rec-cc-2',
      auditId: 'AUD-2025-0310-7012',
      caseId: 'CR-2026-7492',
      modelId: 'complaint-classifier',
      modelName: 'Complaint Classifier',
      modelVersion: '1.1.0',
      inputType: 'Complaint',
      inputDisplay: 'Police officer digital arrest intimidation narrative',
      rawInputSnippet: 'Caller claimed to be CBI officer stating a parcel containing narcotics was intercepted in Mumbai airport.',
      timestamp: '10 Jun 2026, 09:20',
      timestampRaw: '2026-06-10T09:20:00Z',
      prediction: 'Critical',
      riskLevel: 'High',
      confidence: 0.98,
      isReviewed: true,
      reviewedOn: '10 Jun 2026, 09:50',
      reviewedBy: 'Analyst-02',
      reviewNotes: 'High-severity digital arrest syndicate operation. Urgent account freeze request issued.',
      contributingFactors: [
        { name: 'Law enforcement impersonation semantics', score: 0.52, formattedScore: '+0.52', direction: 'positive', description: 'CBI / police rank impersonation detected.' },
        { name: 'Contraband parcel coercion tactic', score: 0.38, formattedScore: '+0.38', direction: 'positive', description: 'Classic customs intimidation template.' }
      ],
      explanationSummary: 'Triaged as Identity Theft & Extortion under Digital Arrest category requiring immediate 1930 escalation.'
    },

    // -------------------------------------------------------------------------
    // Email Threat Classifier Audit Records
    // -------------------------------------------------------------------------
    {
      id: 'rec-em-1',
      auditId: 'AUD-2026-0610-5011',
      caseId: 'CYBER-2026-9104',
      modelId: 'email-threat',
      modelName: 'Email Threat Classifier',
      modelVersion: '1.0.0',
      inputType: 'Email',
      inputDisplay: 'Urgent Wire Transfer / Fake CFO Mandate',
      rawInputSnippet: 'Subject: Urgent: Confidential Project Wire Transfer. Please process the attached offshore supplier invoice immediately.',
      timestamp: '10 Jun 2026, 14:18',
      timestampRaw: '2026-06-10T14:18:00Z',
      prediction: 'Malicious',
      riskLevel: 'High',
      confidence: 0.98,
      isReviewed: true,
      reviewedOn: '10 Jun 2026, 15:00',
      reviewedBy: 'Analyst-01',
      reviewNotes: 'Executive impersonation BEC attack originating from typo-squatted executive domain.',
      contributingFactors: [
        { name: 'Executive authority pressure cues', score: 0.49, formattedScore: '+0.49', direction: 'positive', description: 'DistilBERT detected high-urgency executive payment directive.' },
        { name: 'Lookalike sender domain header', score: 0.35, formattedScore: '+0.35', direction: 'positive', description: 'Domain age under 3 days with mismatched SPF/DKIM.' }
      ],
      explanationSummary: 'Flagged as BEC / Executive Impersonation threat due to urgent offshore payment request.'
    },
    {
      id: 'rec-em-2',
      auditId: 'AUD-2026-0608-5012',
      caseId: 'CYBER-2026-9022',
      modelId: 'email-threat',
      modelName: 'Email Threat Classifier',
      modelVersion: '1.0.0',
      inputType: 'Email',
      inputDisplay: 'Internal Architecture Review Slide Deck',
      rawInputSnippet: 'Good afternoon team, please review the attached slide deck before our 3 PM architecture review.',
      timestamp: '08 Jun 2026, 11:05',
      timestampRaw: '2026-06-08T11:05:00Z',
      prediction: 'Benign',
      riskLevel: 'Low',
      confidence: 0.02,
      isReviewed: true,
      reviewedOn: '08 Jun 2026, 11:20',
      reviewedBy: 'Analyst-03',
      contributingFactors: [
        { name: 'Standard corporate calendar phrasing', score: -0.46, formattedScore: '-0.46', direction: 'negative', description: 'Internal team cadence language.' }
      ],
      explanationSummary: 'Verified safe internal communication with zero deceptive heuristics.'
    },

    // -------------------------------------------------------------------------
    // SMS Scan Classifier Audit Records
    // -------------------------------------------------------------------------
    {
      id: 'rec-sms-1',
      auditId: 'AUD-2026-0608-4011',
      caseId: 'CR-2026-6104',
      modelId: 'sms-scam',
      modelName: 'SMS Scan Classifier',
      modelVersion: '1.0.0',
      inputType: 'SMS',
      inputDisplay: 'Electricity Bill Power Cut Disconnection Smish',
      rawInputSnippet: 'Dear consumer, your electricity power will be disconnected tonight at 9:30 PM due to unpaid bill. Call officer immediately at 9876543210.',
      timestamp: '08 Jun 2026, 16:40',
      timestampRaw: '2026-06-08T16:40:00Z',
      prediction: 'Spam',
      riskLevel: 'High',
      confidence: 0.99,
      isReviewed: true,
      reviewedOn: '08 Jun 2026, 17:10',
      reviewedBy: 'Analyst-01',
      reviewNotes: 'Known power disconnection smishing campaign active across northern state grids.',
      contributingFactors: [
        { name: 'Disconnection deadline threat cue', score: 0.51, formattedScore: '+0.51', direction: 'positive', description: 'Urgent shutoff intimidation vocabulary.' },
        { name: 'Personal mobile number as support line', score: 0.36, formattedScore: '+0.36', direction: 'positive', description: 'Lack of official IVR or toll-free helpline.' }
      ],
      explanationSummary: 'Detected high-confidence smishing attempt targeting utility bill panic.'
    },

    // -------------------------------------------------------------------------
    // Investigation Assistant Audit Records
    // -------------------------------------------------------------------------
    {
      id: 'rec-ia-1',
      auditId: 'AUD-2026-0611-3011',
      caseId: 'CR-2026-7033',
      modelId: 'investigation-assistant',
      modelName: 'Investigation Assistant',
      modelVersion: 'v2.0.0',
      inputType: 'Case Vectors',
      inputDisplay: 'Cross-Jurisdiction Syndicate Link Correlator',
      rawInputSnippet: 'Mule bank account ICICI-9821034421 shared between Bangalore and Delhi cyber cells.',
      timestamp: '11 Jun 2026, 16:50',
      timestampRaw: '2026-06-11T16:50:00Z',
      prediction: 'Linked',
      riskLevel: 'High',
      confidence: 0.98,
      isReviewed: true,
      reviewedOn: '11 Jun 2026, 17:15',
      reviewedBy: 'Analyst-01',
      reviewNotes: 'Cross-case correlation established 4 interconnected complaint nodes sharing single UPI endpoint.',
      contributingFactors: [
        { name: 'Exact Bank Account & IFSC collision', score: 0.58, formattedScore: '+0.58', direction: 'positive', description: 'Deterministic rule matched 4 separate FIR filings.' },
        { name: 'Temporal proximity within 48 hours', score: 0.28, formattedScore: '+0.28', direction: 'positive', description: 'Rapid fund dispersion pattern.' }
      ],
      explanationSummary: 'Astraea sovereign rules engine linked 4 interstate complaints into a unified cyber syndicate dossier.'
    },

    // -------------------------------------------------------------------------
    // Cyber NER Transformer Audit Records
    // -------------------------------------------------------------------------
    {
      id: 'rec-ner-1',
      auditId: 'AUD-2026-0603-2011',
      caseId: 'CYBER-2026-8842',
      modelId: 'cyber-ner',
      modelName: 'Cyber NER Transformer',
      modelVersion: 'cyber-ner-bootstrap-v4.0.0',
      inputType: 'OSINT Text',
      inputDisplay: 'Malware C2 & Crypto Ransomware IOC Extraction',
      rawInputSnippet: 'Attacker hosted C2 on 198.51.100.24 and requested 0.45 BTC to 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa.',
      timestamp: '03 Jun 2026, 16:30',
      timestampRaw: '2026-06-03T16:30:00Z',
      prediction: 'Malicious',
      riskLevel: 'High',
      confidence: 0.95,
      isReviewed: true,
      reviewedOn: '03 Jun 2026, 17:00',
      reviewedBy: 'Analyst-02',
      contributingFactors: [
        { name: 'IPv4 C2 Address Token Span', score: 0.47, formattedScore: '+0.47', direction: 'positive', description: 'Identified actionable C2 host IP.' },
        { name: 'Bitcoin Base58 Wallet Address Token Span', score: 0.44, formattedScore: '+0.44', direction: 'positive', description: 'Recognized crypto ledger destination.' }
      ],
      explanationSummary: 'Extracted 2 critical indicators (IP_ADDRESS and CRYPTO_WALLET) with high span confidence.'
    },

    // -------------------------------------------------------------------------
    // Case Similarity Transformer Audit Records
    // -------------------------------------------------------------------------
    {
      id: 'rec-cs-1',
      auditId: 'AUD-2026-0601-1011',
      caseId: 'CR-2026-8821',
      modelId: 'case-similarity',
      modelName: 'Case Similarity Transformer',
      modelVersion: 'case-similarity-bootstrap-v1.0.0',
      inputType: 'Case Vectors',
      inputDisplay: 'Fake Courier Customs Impersonation Narrative Pair',
      rawInputSnippet: 'Victim received an automated call claiming customs confiscated a courier with illegal contraband in Mumbai.',
      timestamp: '01 Jun 2026, 10:00',
      timestampRaw: '2026-06-01T10:00:00Z',
      prediction: 'Linked',
      riskLevel: 'Medium',
      confidence: 0.92,
      isReviewed: true,
      reviewedOn: '01 Jun 2026, 10:30',
      reviewedBy: 'Analyst-03',
      contributingFactors: [
        { name: 'all-MiniLM-L6-v2 Cosine Similarity: 0.88', score: 0.48, formattedScore: '+0.48', direction: 'positive', description: 'Dense embedding vectors exhibit close angular proximity.' }
      ],
      explanationSummary: 'Semantic cosine similarity matched case with 6 other courier customs complaints across Karnataka and Maharashtra.'
    },

    // -------------------------------------------------------------------------
    // Incident Urgency Classifier Audit Records
    // -------------------------------------------------------------------------
    {
      id: 'rec-iu-1',
      auditId: 'AUD-2026-0528-0911',
      caseId: 'CR-2026-7492',
      modelId: 'incident-urgency',
      modelName: 'Incident Urgency Classifier',
      modelVersion: 'incident-urgency-v1.0.0',
      inputType: 'Complaint',
      inputDisplay: 'Ongoing Active Ransomware Encryption Alert',
      rawInputSnippet: 'All departmental hospital servers are encrypted with .lock extension and demanding 50 BTC. Intensive Care patient systems offline.',
      timestamp: '28 May 2026, 15:45',
      timestampRaw: '2026-05-28T15:45:00Z',
      prediction: 'Critical',
      riskLevel: 'High',
      confidence: 0.99,
      isReviewed: true,
      reviewedOn: '28 May 2026, 15:55',
      reviewedBy: 'Analyst-01',
      contributingFactors: [
        { name: 'Critical infrastructure healthcare impact', score: 0.58, formattedScore: '+0.58', direction: 'positive', description: 'Life-safety critical systems offline.' },
        { name: 'Active ongoing ransomware encryption', score: 0.39, formattedScore: '+0.39', direction: 'positive', description: 'Zero-hour emergency dispatch required.' }
      ],
      explanationSummary: 'Classified as CRITICAL urgency requiring instant CERT-In national cyber incident response.'
    }
  ]);

  // Selected Record ID (Default is 'rec-1', exactly matching the screenshot)
  const [selectedRecordId, setSelectedRecordId] = useState<string>('rec-1');

  // Audit History Modal state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  // Review Status toggle / modal
  const [isEditReviewOpen, setIsEditReviewOpen] = useState<boolean>(false);
  const [editNotes, setEditNotes] = useState<string>('');

  // Filtered list
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Model filter
      if (selectedModelFilter !== 'all' && r.modelId !== selectedModelFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesInput = r.inputDisplay.toLowerCase().includes(q);
        const matchesCase = r.caseId?.toLowerCase().includes(q);
        const matchesAudit = r.auditId.toLowerCase().includes(q);
        const matchesPrediction = r.prediction.toLowerCase().includes(q);
        if (!matchesInput && !matchesCase && !matchesAudit && !matchesPrediction) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'highest-risk') {
        return b.confidence - a.confidence;
      }
      if (sortBy === 'oldest') {
        return a.timestampRaw.localeCompare(b.timestampRaw);
      }
      return b.timestampRaw.localeCompare(a.timestampRaw);
    });
  }, [records, selectedModelFilter, searchQuery, sortBy]);

  // The active selected record (defaults to active filtered match)
  const selectedRecord = useMemo(() => {
    return filteredRecords.find(r => r.id === selectedRecordId) || filteredRecords[0] || records[0];
  }, [filteredRecords, records, selectedRecordId]);

  // Handle Review Status update
  const handleSaveReview = () => {
    setRecords(prev => prev.map(r => {
      if (r.id === selectedRecord.id) {
        return {
          ...r,
          isReviewed: true,
          reviewedOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reviewedBy: 'Analyst-01',
          reviewNotes: editNotes || r.reviewNotes
        };
      }
      return r;
    }));
    setIsEditReviewOpen(false);
    setEditNotes('');
  };

  return (
    <div className="flex flex-col gap-5 w-full text-slate-200">
      
      {/* 1. TOP HEADER & TITLE BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00e676]/10 border border-[#00e676]/25 flex items-center justify-center text-[#00e676] shrink-0 mt-0.5 shadow-[0_0_14px_rgba(0,230,118,0.18)]">
            <FileText className="w-5 h-5 text-[#00e676]" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold text-white tracking-normal font-sans">
              Model Audit Reports &amp; Explainability
            </h1>
            <p className="text-xs text-[#8fa396] mt-0.5">
              Review recorded model decisions and understand key factors behind the predictions.
            </p>
          </div>
        </div>

        {/* View Audit History Button (top right) */}
        <button
          onClick={() => setIsHistoryModalOpen(true)}
          className="px-3.5 py-1.5 rounded-lg border border-white/[0.12] bg-[#0c1611]/80 hover:bg-white/[0.06] hover:border-[#00e676]/40 text-slate-200 text-xs font-mono font-medium transition-all flex items-center gap-2 self-start md:self-auto shadow-sm"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#00e676]" />
          <span>View Audit History</span>
        </button>
      </div>

      {/* 2. FILTER STRIP (MODEL, TIME RANGE, SEARCH) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* Filter 1: Model */}
        <div className="relative rounded-xl border border-white/[0.08] bg-[#070d0a]/90 p-2.5 pt-3">
          <label className="absolute -top-2 left-3 px-1.5 bg-[#070d0a] text-[10px] font-mono font-bold text-[#8fa396] uppercase tracking-wider">
            Model
          </label>
          <div className="flex items-center justify-between gap-2 cursor-pointer mt-0.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <Globe className="w-4 h-4 text-[#00e676] shrink-0" />
              <select
                value={selectedModelFilter}
                onChange={(e) => setSelectedModelFilter(e.target.value)}
                className="bg-transparent text-xs font-mono text-white font-medium focus:outline-none cursor-pointer w-full appearance-none pr-6"
              >
                <option value="url-phishing" className="bg-[#0b1410] text-white">URL Phishing Detector</option>
                <option value="complaint-classifier" className="bg-[#0b1410] text-white">Complaint Classifier</option>
                <option value="email-threat" className="bg-[#0b1410] text-white">Email Threat Classifier</option>
                <option value="sms-scam" className="bg-[#0b1410] text-white">SMS Scan Classifier</option>
                <option value="investigation-assistant" className="bg-[#0b1410] text-white">Investigation Assistant</option>
                <option value="cyber-ner" className="bg-[#0b1410] text-white">Cyber NER Transformer</option>
                <option value="case-similarity" className="bg-[#0b1410] text-white">Case Similarity Transformer</option>
                <option value="incident-urgency" className="bg-[#0b1410] text-white">Incident Urgency Classifier</option>
                <option value="all" className="bg-[#0b1410] text-white">All Registered Models (8)</option>
              </select>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none shrink-0" />
          </div>
        </div>

        {/* Filter 2: Time Range */}
        <div className="relative rounded-xl border border-white/[0.08] bg-[#070d0a]/90 p-2.5 pt-3">
          <label className="absolute -top-2 left-3 px-1.5 bg-[#070d0a] text-[10px] font-mono font-bold text-[#8fa396] uppercase tracking-wider">
            Time range
          </label>
          <div className="flex items-center justify-between gap-2 cursor-pointer mt-0.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <Calendar className="w-4 h-4 text-[#8fa396] shrink-0" />
              <select
                value={timeRangeFilter}
                onChange={(e) => setTimeRangeFilter(e.target.value)}
                className="bg-transparent text-xs font-mono text-white font-medium focus:outline-none cursor-pointer w-full appearance-none pr-6"
              >
                <option value="Last 24 hours" className="bg-[#0b1410] text-white">Last 24 hours</option>
                <option value="Last 7 days" className="bg-[#0b1410] text-white">Last 7 days</option>
                <option value="Last 30 days" className="bg-[#0b1410] text-white">Last 30 days</option>
                <option value="Last 90 days" className="bg-[#0b1410] text-white">Last 90 days</option>
              </select>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none shrink-0" />
          </div>
        </div>

        {/* Filter 3: Search record */}
        <div className="relative rounded-xl border border-white/[0.08] bg-[#070d0a]/90 p-2.5 pt-3">
          <label className="absolute -top-2 left-3 px-1.5 bg-[#070d0a] text-[10px] font-mono font-bold text-[#8fa396] uppercase tracking-wider">
            Search record (Case ID, URL...)
          </label>
          <div className="flex items-center gap-2 mt-0.5">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="bg-transparent text-xs font-mono text-white placeholder-slate-500 focus:outline-none w-full"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 3. MAIN DUAL-COLUMN CONTENT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: AUDIT RECORDS (COL-SPAN 5 OR 6) */}
        <div className="lg:col-span-5 rounded-xl border border-white/[0.08] bg-[#070d0a]/90 p-4 shadow-xl flex flex-col gap-3">
          
          {/* Header of Audit Records */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 text-white font-bold text-xs tracking-normal font-sans">
              <FileText className="w-4 h-4 text-[#00e676]" />
              <span>Audit Records ({filteredRecords.length})</span>
            </div>

            {/* Sort by dropdown */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8fa396]">
              <span>Sort by</span>
              <div className="relative inline-flex items-center">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#0b1410] border border-white/[0.08] rounded-md px-2 py-0.5 text-[11px] text-white focus:outline-none cursor-pointer appearance-none pr-5"
                >
                  <option value="latest">Latest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="highest-risk">Highest risk</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* List of Audit Records */}
          <div className="flex flex-col gap-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredRecords.map((item) => {
              const isSelected = item.id === selectedRecord.id;
              const isPhishing = item.prediction === 'Phishing' || item.prediction === 'Malicious';

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedRecordId(item.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected 
                      ? 'bg-[#00e676]/[0.08] border-[#00e676]/50 shadow-[0_0_16px_rgba(0,230,118,0.12)]' 
                      : 'bg-[#09120e]/60 border-white/[0.04] hover:border-white/[0.12] hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Left: Icon & Input Text */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#00e676]/10 border border-[#00e676]/20 flex items-center justify-center text-[#00e676] shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <span className="font-mono font-bold text-white text-xs truncate" title={item.inputDisplay}>
                        {item.inputDisplay}
                      </span>
                      <span className="text-[11px] text-[#8fa396] font-mono mt-0.5">
                        {item.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Right: Prediction + Risk Badge + Arrow */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono font-bold text-white">
                      {item.prediction}
                    </span>

                    {/* Risk Badge (Red for High, Green for Low) */}
                    {isPhishing ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#ff3b30]/15 border border-[#ff3b30]/35 text-[#ff453a]">
                        High
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#00e676]/15 border border-[#00e676]/35 text-[#00e676]">
                        Low
                      </span>
                    )}

                    <ChevronRight className="w-4 h-4 text-[#00e676]" />
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* RIGHT COLUMN: SELECTED RECORD DETAILS (COL-SPAN 7) */}
        <div className="lg:col-span-7 rounded-xl border border-white/[0.08] bg-[#070d0a]/90 p-5 shadow-2xl flex flex-col gap-6">
          
          {/* Header of Selected Record */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 text-white font-bold text-xs tracking-normal font-sans">
              <Network className="w-4 h-4 text-[#00e676]" />
              <span>Selected Record</span>
            </div>

            {/* Reviewed Badge */}
            {selectedRecord.isReviewed ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00e676]/10 border border-[#00e676]/30 text-[#00e676] text-xs font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e676]" />
                <span>Reviewed</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Pending Review</span>
              </div>
            )}
          </div>

          {/* Metadata Strip: 5 Metrics Across */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-1 font-mono">
            
            {/* 1. Model Version */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[11px] text-[#8fa396]">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                <span>Model Version</span>
              </div>
              <div className="text-xs font-bold text-white">
                {selectedRecord.modelVersion}
              </div>
            </div>

            {/* 2. Input Type */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[11px] text-[#8fa396]">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Input Type</span>
              </div>
              <div className="text-xs font-bold text-white">
                {selectedRecord.inputType}
              </div>
            </div>

            {/* 3. Prediction */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[11px] text-[#8fa396]">
                <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Prediction</span>
              </div>
              <div className={`text-xs font-bold ${
                selectedRecord.prediction === 'Phishing' || selectedRecord.prediction === 'Malicious' 
                  ? 'text-[#ff453a]' 
                  : 'text-[#00e676]'
              }`}>
                {selectedRecord.prediction}
              </div>
            </div>

            {/* 4. Confidence */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[11px] text-[#8fa396]">
                <Gauge className="w-3.5 h-3.5 text-slate-400" />
                <span>Confidence</span>
              </div>
              <div className={`text-xs font-bold ${
                selectedRecord.confidence > 0.5 ? 'text-[#ff453a]' : 'text-[#00e676]'
              }`}>
                {selectedRecord.confidence.toFixed(2)}
              </div>
            </div>

            {/* 5. Reviewed On */}
            <div className="flex flex-col gap-0.5 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-[11px] text-[#8fa396]">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Reviewed On</span>
              </div>
              <div className="text-xs font-bold text-white">
                {selectedRecord.reviewedOn || 'Not reviewed'}
              </div>
              {selectedRecord.reviewedBy && (
                <div className="text-[10px] text-[#8fa396]">
                  by {selectedRecord.reviewedBy}
                </div>
              )}
            </div>

          </div>

          {/* Section: Top Contributing Factors */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center gap-2 text-white font-bold text-xs tracking-normal font-sans">
              <FileText className="w-4 h-4 text-[#00e676]" />
              <span>Top Contributing Factors</span>
            </div>

            {/* Factor attribution bars */}
            <div className="flex flex-col gap-3 font-mono text-xs mt-1">
              {selectedRecord.contributingFactors.map((factor, idx) => {
                const isPositive = factor.direction === 'positive';
                // calculate bar width relative to max score of 0.6
                const barWidth = Math.min(100, Math.max(8, (Math.abs(factor.score) / 0.55) * 100));

                return (
                  <div key={idx} className="flex items-center justify-between gap-4">
                    {/* Feature Name */}
                    <div className="w-[42%] text-xs text-slate-200 truncate" title={factor.name}>
                      {factor.name}
                    </div>

                    {/* Bar visualization track */}
                    <div className="flex-1 h-3 rounded bg-white/[0.05] overflow-hidden relative">
                      <div
                        className={`h-full rounded transition-all duration-500 ${
                          isPositive 
                            ? 'bg-[#ff453a] shadow-[0_0_8px_rgba(255,69,58,0.4)]' 
                            : 'bg-[#00a8ff] shadow-[0_0_8px_rgba(0,168,255,0.4)]'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>

                    {/* Score value */}
                    <div className={`w-12 text-right text-xs font-bold shrink-0 ${
                      isPositive ? 'text-[#ff453a]' : 'text-[#00a8ff]'
                    }`}>
                      {factor.formattedScore}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Explanation Summary */}
          <div className="flex flex-col gap-2.5 pt-2">
            <div className="flex items-center gap-2 text-white font-bold text-xs tracking-normal font-sans">
              <FileText className="w-4 h-4 text-[#00e676]" />
              <span>Explanation Summary</span>
            </div>

            <div className="rounded-xl bg-[#040806] border border-white/[0.06] p-4 text-xs font-sans text-slate-300 leading-relaxed">
              {selectedRecord.explanationSummary}
            </div>
          </div>

          {/* Operational Workflow Action Strip (Section 9, 10 & 11) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.06] text-xs font-mono">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onSelectTab('validation')}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-200 transition-colors flex items-center gap-1.5"
                title="Reproduce this prediction in AI Detection Lab"
              >
                <FlaskConical className="w-3.5 h-3.5 text-[#00e676]" />
                <span>Test in Detection Lab</span>
              </button>

              <button
                onClick={() => onSelectTab('monitoring-drift')}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-200 transition-colors flex items-center gap-1.5"
                title="Inspect drift telemetry for this model family"
              >
                <Activity className="w-3.5 h-3.5 text-[#00e676]" />
                <span>Check Drift Telemetry</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditReviewOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-[#00e676]/10 hover:bg-[#00e676]/20 border border-[#00e676]/40 text-[#00e676] font-bold transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,230,118,0.15)]"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{selectedRecord.isReviewed ? 'Update Review Notes' : 'Record Review Decision'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* 4. MODAL: FULL AUDIT HISTORY LEDGER */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1410] border border-white/[0.1] rounded-2xl max-w-4xl w-full p-6 shadow-2xl flex flex-col gap-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <FileText className="w-4 h-4 text-[#00e676]" />
                <span>Model Inference &amp; Decision Audit Trail (ISO/IEC 42001)</span>
              </div>
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300 font-sans text-xs">
              Complete chronological register of saved model predictions, model versions, human reviewer attestations, and connected case references. All records are cryptographically timestamped.
            </p>

            <div className="overflow-x-auto max-h-[420px] rounded-lg border border-white/[0.06]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#070e0a] text-[10px] uppercase text-[#8fa396]">
                    <th className="py-2.5 px-3">Audit ID</th>
                    <th className="py-2.5 px-3">Input Target</th>
                    <th className="py-2.5 px-3">Model</th>
                    <th className="py-2.5 px-3">Version</th>
                    <th className="py-2.5 px-3">Prediction</th>
                    <th className="py-2.5 px-3">Conf</th>
                    <th className="py-2.5 px-3">Review Status</th>
                    <th className="py-2.5 px-3">Case ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 text-[#00e676] font-bold">{r.auditId}</td>
                      <td className="py-2.5 px-3 text-white max-w-[180px] truncate">{r.inputDisplay}</td>
                      <td className="py-2.5 px-3 text-slate-300">{r.modelName}</td>
                      <td className="py-2.5 px-3 text-slate-400">{r.modelVersion}</td>
                      <td className="py-2.5 px-3">
                        <span className={r.prediction === 'Phishing' ? 'text-rose-400 font-bold' : 'text-[#00e676] font-bold'}>
                          {r.prediction}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{r.confidence.toFixed(2)}</td>
                      <td className="py-2.5 px-3">
                        {r.isReviewed ? (
                          <span className="text-[#00e676] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Reviewed
                          </span>
                        ) : (
                          <span className="text-amber-400">Pending</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{r.caseId || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
              <span className="text-[11px] text-[#8fa396]">
                Showing {records.length} historical audit entries
              </span>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#00e676] text-black font-bold hover:bg-[#00e676]/90 transition-colors"
              >
                Close Audit Trail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: EDIT / RECORD REVIEW DECISION */}
      {isEditReviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1410] border border-white/[0.1] rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <UserCheck className="w-4 h-4 text-[#00e676]" />
                <span>Human Review Record — {selectedRecord.inputDisplay}</span>
              </div>
              <button onClick={() => setIsEditReviewOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300 font-sans text-xs">
              Attest to the AI model's prediction outcome. Your review notes will be appended to the official audit log and linked to the corresponding case record.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#8fa396] text-[11px] font-bold">Investigator Review Notes:</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder={selectedRecord.reviewNotes || "Document evidence cross-verification, WHOIS confirmation, or reason for disagreement..."}
                rows={4}
                className="w-full bg-[#050b07] border border-white/[0.08] rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00e676]/40 resize-none font-sans"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                onClick={() => setIsEditReviewOpen(false)}
                className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReview}
                className="px-4 py-2 rounded-lg bg-[#00e676] hover:bg-[#00e676]/90 text-black text-xs font-bold transition-colors flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,230,118,0.3)]"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Review Attestation</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
