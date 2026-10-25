import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Megaphone, 
  Lock, 
  CreditCard, 
  AlertTriangle, 
  FileText, 
  Landmark, 
  PhoneCall, 
  Lightbulb, 
  ChevronRight, 
  ExternalLink, 
  ArrowRight, 
  ShieldCheck, 
  X, 
  Clock, 
  Shield, 
  Globe, 
  Sparkles, 
  CheckCircle2, 
  Info,
  Laptop,
  Smartphone,
  Tag
} from 'lucide-react';

interface AwarenessResourcesViewProps {
  onSelectTab: (tabId: string) => void;
}

type CategoryType = 
  | 'all' 
  | 'scam-awareness' 
  | 'account-security' 
  | 'safe-payments' 
  | 'fraud-guide' 
  | 'official-resources';

interface GuideItem {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryType: CategoryType;
  readTime: string;
  iconType: 'phishing' | 'upi' | 'password' | 'calls';
  fullContent: {
    overview: string;
    warningSigns: string[];
    preventionSteps: string[];
    ifAffected: string;
    actionRoute?: string;
    actionLabel?: string;
  };
}

interface TopicCard {
  id: string;
  title: string;
  subtitle: string;
  categoryType: CategoryType;
  icon: React.ReactNode;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  bullets: string[];
}

const PhishingLaptopThumbnail: React.FC = () => (
  <div className="relative w-full h-24 rounded-lg bg-gradient-to-b from-[#0e1913] to-[#040906] border border-[#00e676]/20 overflow-hidden flex items-center justify-center">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.18),transparent_70%)] pointer-events-none" />
    <div className="relative flex flex-col items-center">
      <div className="w-24 h-14 rounded-t-md bg-[#131b17] border border-red-500/50 p-1 flex flex-col items-center justify-center relative shadow-[0_0_15px_rgba(239,68,68,0.3)]">
        <div className="w-full h-full bg-[#070d09] rounded flex flex-col items-center justify-center relative overflow-hidden">
          <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/60 flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.5)]">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="flex gap-1 mt-1">
            <span className="w-3 h-0.5 bg-red-400/80 rounded-full" />
            <span className="w-1.5 h-0.5 bg-red-400/40 rounded-full" />
          </div>
        </div>
      </div>
      <div className="w-32 h-1.5 rounded-b-md bg-[#1f2b24] border-t border-white/20 shadow-md flex justify-center">
        <div className="w-6 h-0.5 bg-[#0b120e] rounded-full" />
      </div>
    </div>
  </div>
);

const UpiPhoneThumbnail: React.FC = () => (
  <div className="relative w-full h-24 rounded-lg bg-gradient-to-b from-[#0e1913] to-[#040906] border border-[#00e676]/20 overflow-hidden flex items-center justify-center">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,230,118,0.18),transparent_70%)] pointer-events-none" />
    <div className="w-16 h-20 rounded-xl bg-[#131b17] border border-[#00e676]/50 p-1 flex flex-col items-center shadow-[0_0_15px_rgba(0,230,118,0.25)]">
      <div className="w-full h-full bg-[#050c08] rounded-lg p-1 flex flex-col justify-between items-center relative overflow-hidden">
        <div className="w-3.5 h-0.5 bg-black rounded-full" />
        <div className="w-full bg-[#0284c7]/25 border border-[#38bdf8]/40 rounded px-1 py-0.5 flex items-center justify-between">
          <span className="text-[7px] font-mono font-bold text-white tracking-wider">UPI</span>
          <CreditCard className="w-2.5 h-2.5 text-[#00e676]" />
        </div>
        <div className="w-5 h-5 rounded-md bg-[#00e676]/20 border border-[#00e676]/60 flex items-center justify-center">
          <ShieldCheck className="w-3 h-3 text-[#00e676]" />
        </div>
        <span className="text-[6px] font-mono font-bold text-[#00e676] bg-[#00e676]/15 px-1 py-0.2 rounded">SECURE</span>
      </div>
    </div>
  </div>
);

const PasswordVaultThumbnail: React.FC = () => (
  <div className="relative w-full h-24 rounded-lg bg-gradient-to-b from-[#0e1913] to-[#040906] border border-[#00e676]/20 overflow-hidden flex items-center justify-center">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.22),transparent_70%)] pointer-events-none" />
    <div className="relative flex items-center justify-center">
      <div className="absolute w-16 h-16 rounded-full border border-[#38bdf8]/25 pointer-events-none animate-pulse" />
      <div className="absolute w-12 h-12 rounded-full border border-dashed border-[#00e676]/35 pointer-events-none" />
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0284c7]/30 to-[#00e676]/20 border border-[#38bdf8]/60 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.45)]">
        <Lock className="w-5 h-5 text-[#38bdf8]" />
      </div>
      <div className="absolute -left-5 top-1/2 w-3.5 h-[1px] bg-[#38bdf8]/60" />
      <div className="absolute -right-5 top-1/2 w-3.5 h-[1px] bg-[#38bdf8]/60" />
    </div>
  </div>
);

const SuspiciousCallThumbnail: React.FC = () => (
  <div className="relative w-full h-24 rounded-lg bg-gradient-to-b from-[#0e1913] to-[#040906] border border-[#00e676]/20 overflow-hidden flex items-center justify-center">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.2),transparent_70%)] pointer-events-none" />
    <div className="w-16 h-20 rounded-xl bg-[#131b17] border border-red-500/50 p-1 flex flex-col items-center shadow-[0_0_15px_rgba(239,68,68,0.3)]">
      <div className="w-full h-full bg-[#080506] rounded-lg p-1 flex flex-col justify-between items-center relative overflow-hidden">
        <div className="w-3.5 h-0.5 bg-black rounded-full" />
        <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/70 flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.4)]">
          <AlertTriangle className="w-3 h-3 text-red-400" />
        </div>
        <div className="flex items-center gap-1.5 pb-0.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex items-center justify-center shadow-sm">
            <PhoneCall className="w-1.5 h-1.5 text-white" />
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
            <PhoneCall className="w-1.5 h-1.5 text-white" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const AwarenessResourcesView: React.FC<AwarenessResourcesViewProps> = ({ onSelectTab }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [activeGuide, setActiveGuide] = useState<GuideItem | null>(null);
  const [activeTopic, setActiveTopic] = useState<TopicCard | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Four Main Topic Cards
  const topicCards: TopicCard[] = [
    {
      id: 'topic-scams',
      title: 'Common Cyber Scams',
      subtitle: 'Learn about the latest scam methods and how to identify them.',
      categoryType: 'scam-awareness',
      icon: <Megaphone className="w-5 h-5" />,
      iconBg: 'bg-[#0284c7]/20',
      iconBorder: 'border-[#0284c7]/40',
      iconColor: 'text-[#38bdf8]',
      bullets: [
        'Phishing links and fake websites',
        'Fake customer care calls',
        'UPI and payment scams',
        'Job and investment frauds'
      ]
    },
    {
      id: 'topic-security',
      title: 'Account Security',
      subtitle: 'Simple steps to keep your accounts safe and secure.',
      categoryType: 'account-security',
      icon: <Lock className="w-5 h-5" />,
      iconBg: 'bg-[#00e676]/20',
      iconBorder: 'border-[#00e676]/40',
      iconColor: 'text-[#00e676]',
      bullets: [
        'Strong passwords and 2FA',
        'Safe login practices',
        'Protect personal information',
        'Recognize suspicious activity'
      ]
    },
    {
      id: 'topic-payments',
      title: 'Safe Online Payments',
      subtitle: 'Be careful while making and receiving payments online.',
      categoryType: 'safe-payments',
      icon: <CreditCard className="w-5 h-5" />,
      iconBg: 'bg-[#f59e0b]/20',
      iconBorder: 'border-[#f59e0b]/40',
      iconColor: 'text-[#f59e0b]',
      bullets: [
        'Verify recipients before paying',
        'Check QR codes carefully',
        'Use official payment apps only',
        'Avoid sharing UPI PIN or OTP'
      ]
    },
    {
      id: 'topic-scammed',
      title: "If You've Been Scammed",
      subtitle: 'Step-by-step guidance on what to do if you have lost money or faced cyber fraud.',
      categoryType: 'fraud-guide',
      icon: <AlertTriangle className="w-5 h-5" />,
      iconBg: 'bg-red-500/20',
      iconBorder: 'border-red-500/40',
      iconColor: 'text-red-400',
      bullets: [
        'Contact your bank immediately',
        'Call 1930 for financial fraud',
        'Preserve evidence (screenshots, messages)',
        'File a complaint on CCIP'
      ]
    }
  ];

  // Popular Guides Library
  const popularGuides: GuideItem[] = [
    {
      id: 'guide-phishing',
      title: 'How to Identify Phishing Emails',
      description: 'Learn the warning signs of phishing emails and what to do.',
      category: 'SCAM AWARENESS',
      categoryType: 'scam-awareness',
      readTime: '5 min read',
      iconType: 'phishing',
      fullContent: {
        overview: 'Phishing emails mimic genuine institutions like banks, electricity boards, income tax portals, or courier services to deceive you into disclosing login passwords, card numbers, or OTPs.',
        warningSigns: [
          'Generic greetings ("Dear Customer") instead of your registered name.',
          'Mismatched domain names (e.g., support@secure-icicibanks.com instead of icicibank.com).',
          'Urgent language threatening immediate account closure or legal prosecution within 24 hours.',
          'Attachments with double extensions like invoice.pdf.exe or bill.zip.'
        ],
        preventionSteps: [
          'Never click links in unexpected emails. Always navigate manually to the official website.',
          'Check sender domain details by expanding the "from" header.',
          'Submit suspect links or attachments to CCIP AI Cyber Shield for automated threat evaluation.'
        ],
        ifAffected: 'If you already entered your password, immediately change it on the official portal and terminate all active sessions. If financial credentials were exposed, contact your bank immediately.',
        actionRoute: 'ai-shield',
        actionLabel: 'Check Link with AI Cyber Shield'
      }
    },
    {
      id: 'guide-upi',
      title: 'Stay Safe from UPI Scams',
      description: 'Tips to avoid fraud while using UPI apps and QR codes.',
      category: 'SAFE PAYMENTS',
      categoryType: 'safe-payments',
      readTime: '4 min read',
      iconType: 'upi',
      fullContent: {
        overview: 'Unified Payments Interface (UPI) fraud typically exploits social engineering where fraudsters send "Collect Money" requests or share malicious QR codes claiming you are receiving a prize, refund, or marketplace payment.',
        warningSigns: [
          'The caller asks you to enter your UPI PIN to "receive" funds into your bank account.',
          'Receiving unexpected payment requests (Collect Requests) on Google Pay, PhonePe, or Paytm.',
          'Buyer on OLX or Quikr claiming advance payment and requesting you scan a QR code.'
        ],
        preventionSteps: [
          'Remember the fundamental rule: Entering UPI PIN ALWAYS DEBITS money from your bank account. You NEVER need to enter a PIN to receive money.',
          'Decline unknown collect payment requests.',
          'Disable auto-pay mandates on merchant apps unless explicitly authorized.'
        ],
        ifAffected: 'Call 1930 immediately to register the transaction with the National Cyber Crime Reporting Portal and notify your bank to block the recipient UPI VPA.',
        actionRoute: 'file-complaint',
        actionLabel: 'File Incident in CCIP'
      }
    },
    {
      id: 'guide-passwords',
      title: 'Create Strong Passwords',
      description: 'Best practices for strong and unique passwords.',
      category: 'ACCOUNT SECURITY',
      categoryType: 'account-security',
      readTime: '3 min read',
      iconType: 'password',
      fullContent: {
        overview: 'Weak, reused, or dictionary-based passwords allow credential-stuffing attacks where compromised accounts on one service lead to unauthorized access across your emails and bank logins.',
        warningSigns: [
          'Notifications of login attempts from unfamiliar cities or IP addresses.',
          'Receiving unexpected password reset OTPs or verification codes.',
          'Browser warnings indicating your password appeared in a public data breach.'
        ],
        preventionSteps: [
          'Use passphrases consisting of 4-5 random words with symbols and numbers (>= 14 characters).',
          'Never reuse the same password across personal email, banking, and social networks.',
          'Activate Two-Factor Authentication (2FA) with authenticator apps instead of SMS OTPs.'
        ],
        ifAffected: 'Update your passwords immediately, log out from all devices, and revoke authorization for third-party connected apps.',
        actionRoute: 'settings',
        actionLabel: 'Review Security Settings'
      }
    },
    {
      id: 'guide-calls',
      title: 'Handling Suspicious Calls',
      description: 'What to do when you receive calls from unknown numbers.',
      category: 'SCAM AWARENESS',
      categoryType: 'scam-awareness',
      readTime: '4 min read',
      iconType: 'calls',
      fullContent: {
        overview: 'Fraudsters impersonate telecom providers (threatening SIM block), police/CBI officers (alleging money laundering/digital arrest), or bank managers claiming mandatory KYC updates.',
        warningSigns: [
          'Caller claiming an illegal parcel with drugs/contraband was dispatched in your name.',
          'Demands that you stay on video call (Skype/WhatsApp) for "virtual interrogation".',
          'Requests to install remote screen-sharing applications like AnyDesk or TeamViewer QuickSupport.'
        ],
        preventionSteps: [
          'Law enforcement agencies and banks NEVER conduct virtual interrogations or demand money transfers for verification.',
          'Immediately disconnect the call. Do not argue or press digits.',
          'Verify with your local police station or bank branch directly through official numbers.'
        ],
        ifAffected: 'If you installed remote access software, uninstall it immediately, disconnect Wi-Fi/mobile data, and notify your bank to freeze internet banking.',
        actionRoute: 'ai-shield',
        actionLabel: 'Verify Caller in AI Shield'
      }
    }
  ];

  // Filtering Logic
  const filteredGuides = useMemo(() => {
    return popularGuides.filter(guide => {
      const matchesCategory = 
        selectedCategory === 'all' || 
        guide.categoryType === selectedCategory;
      
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !query ||
        guide.title.toLowerCase().includes(query) ||
        guide.description.toLowerCase().includes(query) ||
        guide.category.toLowerCase().includes(query) ||
        guide.fullContent.overview.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const filteredTopics = useMemo(() => {
    return topicCards.filter(topic => {
      const matchesCategory = 
        selectedCategory === 'all' || 
        topic.categoryType === selectedCategory;

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !query ||
        topic.title.toLowerCase().includes(query) ||
        topic.subtitle.toLowerCase().includes(query) ||
        topic.bullets.some(b => b.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. HERO SECTION */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#06140c] via-[#05110a] to-[#030906] p-6 sm:p-7 border border-[#00e676]/20 shadow-[0_0_30px_rgba(0,230,118,0.06)] overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -left-12 -top-12 w-56 h-56 bg-[#00e676]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-12 -bottom-12 w-64 h-64 bg-[#00e676]/8 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Left: Title & Subtitle */}
        <div className="flex items-center gap-4 sm:gap-5 z-10 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#00e676]/20 to-[#00b0ff]/10 border border-[#00e676]/40 flex items-center justify-center text-[#00e676] shadow-[0_0_25px_rgba(0,230,118,0.25)] shrink-0">
            <BookOpen className="w-8 h-8 sm:w-9 sm:h-9 text-[#00e676]" />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Awareness & Resources
            </h1>
            <p className="text-xs sm:text-sm text-[#8fa396] mt-1 leading-snug">
              Learn, stay informed, and protect yourself from cyber threats.
            </p>
          </div>
        </div>

        {/* Hero Right: Security Learning Network Graphic */}
        <div className="relative flex items-center justify-center self-center md:self-auto shrink-0 z-10 py-1">
          <div className="relative w-48 sm:w-56 h-20 flex items-center justify-between px-3">
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#00e676]/30 to-transparent" />
            <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 h-16 border border-[#00e676]/15 rounded-full pointer-events-none" />

            {/* Document Node Left */}
            <div className="relative z-10 w-11 h-11 rounded-full bg-[#030c07] border border-[#00e676]/35 flex items-center justify-center text-[#8fa396] shadow-[0_0_12px_rgba(0,230,118,0.12)]">
              <FileText className="w-5 h-5 text-[#8fa396]" />
            </div>

            {/* Center Glowing Shield Lock Node */}
            <div className="relative z-20 w-16 h-16 rounded-2xl bg-gradient-to-b from-[#00e676]/25 to-[#062414] border-2 border-[#00e676]/60 flex items-center justify-center text-[#00e676] shadow-[0_0_24px_rgba(0,230,118,0.35)]">
              <Shield className="w-8 h-8 text-[#00e676]" />
              <Lock className="w-4 h-4 text-white absolute" />
            </div>

            {/* Document Node Right */}
            <div className="relative z-10 w-11 h-11 rounded-full bg-[#030c07] border border-[#00e676]/35 flex items-center justify-center text-[#8fa396] shadow-[0_0_12px_rgba(0,230,118,0.12)]">
              <FileText className="w-5 h-5 text-[#8fa396]" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEARCH BAR & 6 CATEGORY FILTERS */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#06140c]/90 border border-[#00e676]/20 p-3 sm:p-3.5 rounded-2xl shadow-sm">
        {/* Search Input */}
        <div className="relative w-full lg:w-[240px] xl:w-[280px] shrink-0">
          <Search className="w-4 h-4 text-[#6e8d7a] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search awareness topics, guides, scams..."
            className="w-full bg-[#030706] border border-[#00e676]/20 focus:border-[#00e676] rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-[#4e725b] focus:outline-none focus:ring-1 focus:ring-[#00e676]/50 transition-all font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6e8d7a] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 6 Category Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none flex-nowrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#00e676] text-[#030706] shadow-[0_0_12px_rgba(0,230,118,0.3)]'
                : 'bg-[#030706] border border-white/[0.08] text-[#8fa396] hover:text-white hover:border-[#00e676]/30'
            }`}
          >
            All Resources
          </button>

          <button
            onClick={() => setSelectedCategory('scam-awareness')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'scam-awareness'
                ? 'bg-[#00e676] text-[#030706] shadow-[0_0_12px_rgba(0,230,118,0.3)]'
                : 'bg-[#030706] border border-white/[0.08] text-[#8fa396] hover:text-white hover:border-[#00e676]/30'
            }`}
          >
            Scam Awareness
          </button>

          <button
            onClick={() => setSelectedCategory('account-security')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'account-security'
                ? 'bg-[#00e676] text-[#030706] shadow-[0_0_12px_rgba(0,230,118,0.3)]'
                : 'bg-[#030706] border border-white/[0.08] text-[#8fa396] hover:text-white hover:border-[#00e676]/30'
            }`}
          >
            Account Security
          </button>

          <button
            onClick={() => setSelectedCategory('safe-payments')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'safe-payments'
                ? 'bg-[#00e676] text-[#030706] shadow-[0_0_12px_rgba(0,230,118,0.3)]'
                : 'bg-[#030706] border border-white/[0.08] text-[#8fa396] hover:text-white hover:border-[#00e676]/30'
            }`}
          >
            Safe Payments
          </button>

          <button
            onClick={() => setSelectedCategory('fraud-guide')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'fraud-guide'
                ? 'bg-[#00e676] text-[#030706] shadow-[0_0_12px_rgba(0,230,118,0.3)]'
                : 'bg-[#030706] border border-white/[0.08] text-[#8fa396] hover:text-white hover:border-[#00e676]/30'
            }`}
          >
            Cyber Fraud Guide
          </button>

          <button
            onClick={() => setSelectedCategory('official-resources')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'official-resources'
                ? 'bg-[#00e676] text-[#030706] shadow-[0_0_12px_rgba(0,230,118,0.3)]'
                : 'bg-[#030706] border border-white/[0.08] text-[#8fa396] hover:text-white hover:border-[#00e676]/30'
            }`}
          >
            Official Resources
          </button>
        </div>
      </div>

      {/* 3. FOUR MAIN TOPIC CARDS (4-Column Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredTopics.map(topic => (
          <div
            key={topic.id}
            onClick={() => setActiveTopic(topic)}
            className="rounded-2xl bg-[#06140c]/90 border border-[#00e676]/20 hover:border-[#00e676]/60 p-4.5 flex flex-col justify-between gap-3.5 transition-all duration-200 group cursor-pointer shadow-[0_0_20px_rgba(0,230,118,0.04)] hover:shadow-[0_0_25px_rgba(0,230,118,0.12)]"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl ${topic.iconBg} border ${topic.iconBorder} flex items-center justify-center ${topic.iconColor} shrink-0 shadow-sm mt-0.5`}>
                {topic.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="text-sm font-bold text-white group-hover:text-[#00e676] transition-colors leading-snug">
                    {topic.title}
                  </h3>
                  <ChevronRight className="w-4 h-4 text-[#00e676] group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
                <p className="text-[11px] text-[#8fa396] mt-1 leading-snug">
                  {topic.subtitle}
                </p>
              </div>
            </div>

            <ul className="flex flex-col gap-2 pt-2 border-t border-white/[0.04]">
              {topic.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[11px] text-[#c8ddd0] leading-snug">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0 mt-1" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* 4. POPULAR GUIDES SECTION */}
      <div className="rounded-2xl bg-[#06140c]/90 border border-[#00e676]/20 p-5 sm:p-6 flex flex-col gap-4 shadow-[0_0_20px_rgba(0,230,118,0.04)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0">
              <FileText className="w-5 h-5 text-[#00e676]" />
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="text-base font-bold text-white tracking-tight">
                Popular Guides
              </h3>
              <p className="text-xs text-[#8fa396] truncate">
                Step-by-step articles to help you stay safe online.
              </p>
            </div>
          </div>

          <button
            onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
            className="flex items-center gap-1.5 text-xs font-bold text-[#00e676] hover:text-[#69f0ae] hover:underline transition-all shrink-0 cursor-pointer"
          >
            <span>View All Guides</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Guides (4-Column Grid) */}
        {filteredGuides.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {filteredGuides.map(guide => (
              <div
                key={guide.id}
                onClick={() => setActiveGuide(guide)}
                className="group rounded-xl bg-[#030706] border border-[#00e676]/15 hover:border-[#00e676]/60 p-4 flex flex-col justify-between gap-3.5 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-[0_0_20px_rgba(0,230,118,0.12)]"
              >
                {/* Visual Thumbnail Mockups */}
                <div className="w-full">
                  {guide.iconType === 'phishing' && <PhishingLaptopThumbnail />}
                  {guide.iconType === 'upi' && <UpiPhoneThumbnail />}
                  {guide.iconType === 'password' && <PasswordVaultThumbnail />}
                  {guide.iconType === 'calls' && <SuspiciousCallThumbnail />}
                </div>

                {/* Content */}
                <div className="flex flex-col gap-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#00e676] transition-colors leading-snug">
                    {guide.title}
                  </h4>
                  <p className="text-[11px] text-[#8fa396] line-clamp-2 leading-snug">
                    {guide.description}
                  </p>
                </div>

                {/* Footer Category Badge & Reading Time */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    guide.category.includes('SCAM') 
                      ? 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/30'
                      : guide.category.includes('PAYMENTS')
                      ? 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/30'
                      : 'bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/30'
                  }`}>
                    {guide.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-[#6e8d7a]">
                      {guide.readTime}
                    </span>
                    {guide.iconType === 'calls' && (
                      <ChevronRight className="w-3.5 h-3.5 text-[#00e676]" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-[#030706] rounded-xl border border-white/[0.06] flex flex-col items-center gap-2">
            <Info className="w-6 h-6 text-[#6e8d7a]" />
            <p className="text-xs text-[#8fa396]">No resources found matching your search. Try another keyword or filter.</p>
            <button
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              className="text-xs font-bold text-[#00e676] hover:underline mt-1"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* 5. BOTTOM ROW: OFFICIAL HELP & REPORTING + LATEST UPDATES & ADVISORIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Official Help & Reporting */}
        <div className="rounded-2xl bg-[#06140c]/90 border border-[#00e676]/20 p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-[0_0_20px_rgba(0,230,118,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0">
              <Landmark className="w-5 h-5 text-[#00e676]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Official Help & Reporting
              </h3>
              <p className="text-xs text-[#8fa396]">
                Use these official channels for cybercrime reporting and support.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* National Cyber Crime Reporting Portal */}
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-3.5 rounded-xl bg-[#030706] border border-[#00e676]/20 hover:border-[#00e676]/60 hover:bg-[#00e676]/10 transition-all flex flex-col justify-between gap-2 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-[#0284c7]/15 border border-[#0284c7]/30 flex items-center justify-center text-[#38bdf8] shrink-0">
                  <Globe className="w-4 h-4 text-[#38bdf8]" />
                </div>
                <ExternalLink className="w-4 h-4 text-[#6e8d7a] group-hover:text-[#00e676] transition-colors" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-white group-hover:text-[#00e676] transition-colors block">
                  National Cyber Crime Reporting Portal
                </span>
                <span className="text-[11px] text-[#8fa396] mt-0.5 block">
                  Report online at cybercrime.gov.in
                </span>
              </div>
            </a>

            {/* Cyber Helpline: 1930 */}
            <a
              href="tel:1930"
              className="group p-3.5 rounded-xl bg-[#030706] border border-[#00e676]/20 hover:border-[#00e676]/60 hover:bg-[#00e676]/10 transition-all flex flex-col justify-between gap-2 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0">
                  <PhoneCall className="w-4 h-4 text-[#00e676]" />
                </div>
                <ExternalLink className="w-4 h-4 text-[#6e8d7a] group-hover:text-[#00e676] transition-colors" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-white group-hover:text-[#00e676] transition-colors block">
                  Cyber Helpline: 1930
                </span>
                <span className="text-[11px] text-[#8fa396] mt-0.5 block">
                  For financial cyber fraud (India)
                </span>
              </div>
            </a>
          </div>
        </div>

        {/* Right: Latest Updates & Advisories */}
        <div className="rounded-2xl bg-[#06140c]/90 border border-[#00e676]/20 p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-[0_0_20px_rgba(0,230,118,0.04)]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0">
                <Lightbulb className="w-5 h-5 text-[#00e676]" />
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Latest Updates & Advisories
                </h3>
                <p className="text-xs text-[#8fa396] truncate">
                  Stay informed with the latest cybercrime alerts and safety tips.
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelectTab('safety-hub')}
              className="flex items-center gap-1.5 text-xs font-bold text-[#00e676] hover:text-[#69f0ae] hover:underline transition-all shrink-0"
            >
              <span>View More</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-2.5 pt-1">
            {/* Advisory 1: Fake Delivery and Parcel Scams */}
            <div className="group p-3 rounded-xl bg-[#030706] border border-[#00e676]/15 hover:border-[#00e676]/40 transition-all flex items-center justify-between gap-3 cursor-pointer">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white group-hover:text-[#00e676] transition-colors truncate">
                    Beware of Fake Delivery and Parcel Scams
                  </span>
                  <span className="text-[11px] text-[#8fa396] truncate">
                    Do not click on suspicious links claiming to be from courier services.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-[10px] text-[#6e8d7a]">12 Mar 2025</span>
                <ChevronRight className="w-4 h-4 text-[#6e8d7a] group-hover:text-[#00e676] group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>

            {/* Advisory 2: Increase in UPI Payment Fraud Attempts */}
            <div className="group p-3 rounded-xl bg-[#030706] border border-[#00e676]/15 hover:border-[#00e676]/40 transition-all flex items-center justify-between gap-3 cursor-pointer">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#0284c7]/15 border border-[#0284c7]/30 flex items-center justify-center text-[#38bdf8] shrink-0">
                  <Info className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white group-hover:text-[#00e676] transition-colors truncate">
                    Increase in UPI Payment Fraud Attempts
                  </span>
                  <span className="text-[11px] text-[#8fa396] truncate">
                    Verify recipients and avoid scanning unknown QR codes.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-[10px] text-[#6e8d7a]">08 Mar 2025</span>
                <ChevronRight className="w-4 h-4 text-[#6e8d7a] group-hover:text-[#00e676] group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. INTERACTIVE GUIDE DETAIL READER MODAL */}
      {activeGuide && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setActiveGuide(null)}
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full max-w-xl rounded-2xl bg-[#06140c] border border-[#00e676]/30 p-6 flex flex-col gap-5 shadow-[0_0_50px_rgba(0,230,118,0.2)] max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#00e676]/20">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/40">
                    {activeGuide.category}
                  </span>
                  <span className="text-[10px] font-mono text-[#8fa396]">
                    • {activeGuide.readTime}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {activeGuide.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveGuide(null)}
                className="p-1.5 rounded-lg text-[#8fa396] hover:text-white hover:bg-white/[0.06] transition-colors"
                aria-label="Close reader"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-4 text-xs text-[#c8ddd0] leading-relaxed">
              <div className="p-3.5 rounded-xl bg-[#030706] border border-[#00e676]/15">
                <p className="text-[#8fa396]">{activeGuide.fullContent.overview}</p>
              </div>

              {/* Warning Signs */}
              <div className="flex flex-col gap-2">
                <span className="font-bold text-white text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Common Warning Signs
                </span>
                <ul className="flex flex-col gap-1.5 pl-2">
                  {activeGuide.fullContent.warningSigns.map((sign, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                      <span>{sign}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Steps */}
              <div className="flex flex-col gap-2">
                <span className="font-bold text-white text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#00e676]" />
                  What You Should Do
                </span>
                <ul className="flex flex-col gap-1.5 pl-2">
                  {activeGuide.fullContent.preventionSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shrink-0 mt-1.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* If Affected */}
              <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/40 flex flex-col gap-1">
                <span className="font-bold text-red-400 text-xs">If you have already interacted with this scam:</span>
                <p className="text-[#fecaca]">{activeGuide.fullContent.ifAffected}</p>
              </div>

              {/* Shortcut Action Button */}
              {activeGuide.fullContent.actionRoute && (
                <button
                  onClick={() => {
                    setActiveGuide(null);
                    onSelectTab(activeGuide.fullContent.actionRoute!);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-[#030706] font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,230,118,0.2)] transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{activeGuide.fullContent.actionLabel}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. TOPIC DETAIL READER MODAL */}
      {activeTopic && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setActiveTopic(null)}
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-[#06140c] border border-[#00e676]/30 p-6 flex flex-col gap-5 shadow-[0_0_50px_rgba(0,230,118,0.2)] max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#00e676]/20">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${activeTopic.iconBg} border ${activeTopic.iconBorder} flex items-center justify-center ${activeTopic.iconColor}`}>
                  {activeTopic.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{activeTopic.title}</h3>
                  <p className="text-xs text-[#8fa396]">{activeTopic.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTopic(null)}
                className="p-1.5 rounded-lg text-[#8fa396] hover:text-white"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs text-[#c8ddd0]">
              <span className="font-bold text-white">Key Guidelines & Prevention:</span>
              <ul className="flex flex-col gap-2">
                {activeTopic.bullets.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-[#030706] border border-white/[0.06]">
                    <CheckCircle2 className="w-4 h-4 text-[#00e676] shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => {
                    setActiveTopic(null);
                    onSelectTab('safety-hub');
                  }}
                  className="flex-1 py-2 rounded-xl bg-[#00e676]/15 hover:bg-[#00e676]/25 border border-[#00e676]/40 text-[#00e676] font-bold text-xs"
                >
                  Open Safety Hub
                </button>
                <button
                  onClick={() => {
                    setActiveTopic(null);
                    onSelectTab('file-complaint');
                  }}
                  className="flex-1 py-2 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-[#030706] font-bold text-xs"
                >
                  Report Incident
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
