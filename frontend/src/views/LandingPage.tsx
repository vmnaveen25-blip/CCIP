import React, { useState, useEffect } from 'react';
import { PortalRole, Complaint, UserProfile } from '../types';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  FileText, 
  Brain, 
  UploadCloud, 
  Search, 
  CheckCircle2, 
  Check, 
  UserCheck, 
  Layers, 
  FileSearch, 
  Key, 
  FileCode, 
  Smartphone, 
  MessageSquare, 
  AlertOctagon, 
  Camera, 
  XCircle, 
  PhoneCall, 
  AlertTriangle, 
  ChevronDown, 
  ArrowRight, 
  Megaphone, 
  LogIn, 
  Sparkles,
  Zap
} from 'lucide-react';

import { AuthScreenType } from '../components/AuthModal';
import { FloatingChatbotWidget } from '../components/citizen/FloatingChatbotWidget';

interface LandingPageProps {
  onNavigatePortal: (portal: PortalRole, initialTab?: string) => void;
  onTrackCase: (referenceNumber: string) => void;
  complaints: Complaint[];
  onOpenAuth?: (screen?: AuthScreenType) => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigatePortal,
  onTrackCase,
  complaints,
  onOpenAuth,
  currentUser,
  onLogout
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [quickTrackId, setQuickTrackId] = useState('');
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackError, setTrackError] = useState('');

  // When landing page is mounted/redirected, close any existing active session immediately
  useEffect(() => {
    if (currentUser && onLogout) {
      onLogout();
    }
  }, []);

  const toggleFaq = (index: number) => {
    setActiveFaq(prev => prev === index ? null : index);
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTrackId.trim()) {
      setTrackError('Please enter a case reference ID');
      return;
    }
    setTrackError('');
    setShowTrackModal(false);
    onTrackCase(quickTrackId.trim());
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      q: "How do I report cybercrime?",
      a: "Click on 'Report Cybercrime' or 'File a Complaint' on this page. You will be guided through a secure step-by-step incident form to document the event and upload evidence."
    },
    {
      q: "What evidence should I upload?",
      a: "Provide screenshots of conversations, payment receipts, email headers, fraudulent links, SMS records, and transaction IDs with clear timestamps."
    },
    {
      q: "Can I track my complaint?",
      a: "Yes. Upon submitting your complaint, you will receive a unique Case Tracking ID and real-time status updates via SMS and secure portal notifications."
    },
    {
      q: "Who can view my complaint?",
      a: "Only verified law enforcement personnel, designated cybersecurity officers, and you can view the case details under strict role-based access control."
    },
    {
      q: "What happens after submission?",
      a: "Your report undergoes AI-supported triage for pattern matching, then moves to an assigned officer for technical investigation and verification."
    },
    {
      q: "How do I sign in?",
      a: "Click the 'Sign In' button in the top navigation bar. Citizens can sign in directly using their username or email and password. Authorized personnel authenticate with their assigned staff credentials."
    }
  ];

  return (
    <div className="flex flex-col text-left font-sans bg-[#030706] text-[#F8F7F5] w-full max-w-full overflow-x-clip min-h-screen">
      {/* 1930 Emergency Cyber Financial Fraud Helpline Top Banner */}
      <div className="bg-gradient-to-r from-[#031508] via-[#062010] to-[#031508] border-b border-[#00e676]/30 py-1.5 px-4 text-center text-xs text-[#00e676] flex flex-wrap items-center justify-center gap-2 sm:gap-3 font-mono z-50 w-full max-w-full overflow-hidden">
        <span className="inline-flex items-center gap-1 font-bold tracking-wider uppercase text-[#031508] bg-[#00e676] px-2 py-0.5 rounded text-[10px] shrink-0">
          <PhoneCall className="w-3 h-3" /> 1930
        </span>
        <span className="font-semibold text-white/90 shrink-0">CYBER FINANCIAL FRAUD HELPLINE</span>
        <span className="hidden md:inline text-white/60 truncate max-w-xl">• Report financial cyber fraud within golden hours to initiate bank nodal freeze (I4C NCRP)</span>
      </div>

      {/* Top Navigation Bar from Stitch Mockup */}
      <header className="sticky top-0 z-50 bg-[#030706]/95 backdrop-blur-md border-b border-[#00e676]/15 shadow-sm w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3.5 flex items-center justify-between gap-3">
          {/* Brand Logo Left */}
          <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0" onClick={() => scrollToSection('hero')}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#06140c] to-[#030906] border border-[#00e676]/40 flex items-center justify-center p-1 shadow-[0_0_14px_rgba(0,230,118,0.25)] overflow-hidden hover:border-[#00e676]/70 transition-all">
              <img src="/ccip-logo.png" alt="CCIP Logo" className="w-full h-full object-contain filter drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                CCIP Enclave
              </span>
              <span className="text-xs text-[#96908C] tracking-wider font-normal">Citizen Cybercrime Platform</span>
            </div>
          </div>

          {/* Center Links */}
          <nav className="hidden xl:flex items-center gap-5 lg:gap-6 text-xs font-medium text-[#D8D3D0] shrink-0">
            <button onClick={() => scrollToSection('hero')} className="text-[#00e676] flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] inline-block"></span>
              Home
            </button>
            <button 
              onClick={() => onOpenAuth ? onOpenAuth('citizen-login') : onNavigatePortal('citizen', 'file-complaint')} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              Report Cybercrime
            </button>
            <button onClick={() => scrollToSection('safety-guidance')} className="hover:text-white transition-colors">
              Safety Guidance
            </button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors">
              Help
            </button>
          </nav>

          {/* Right Action CTAs - Prompt to Sign In */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button 
              onClick={() => onOpenAuth ? onOpenAuth('selection') : onNavigatePortal('citizen')}
              className="bg-gradient-to-r from-[#00e676] to-[#00c853] hover:brightness-110 text-[#031508] text-xs font-bold px-4 sm:px-5 py-2.5 rounded-md flex items-center gap-2 shadow-[0_0_20px_rgba(0,230,118,0.35)] transition duration-200 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-[#00e676]/15 bg-gradient-to-b from-[#06140c] to-[#030706]">
        {/* Ambient radial glow */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#00e676]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-[#00e676]/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Hero Column */}
          <div className="lg:col-span-6 space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#062010] border border-[#00e676]/30 text-[#00e676] text-[11px] font-semibold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse"></span>
              A SAFER DIGITAL TOMORROW
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
              AI-Powered Cybercrime <br/>
              Reporting &amp; <span className="text-[#00e676]">Investigation</span> <br/>
              <span className="text-[#00e676]">Platform</span>
            </h1>

            {/* Value Statements */}
            <div className="space-y-3">
              <p className="text-[#D8D3D0] text-sm sm:text-base leading-relaxed font-normal">
                Report cybercrime securely. Support evidence-driven investigation. Enable faster, explainable response.
              </p>
              <p className="text-[#96908C] text-xs sm:text-sm leading-relaxed max-w-xl">
                An integrated platform for citizens, cybersecurity specialists, and authorized AI/ML operations.
              </p>
            </div>


            {/* Trust Micro-Badges */}
            <div className="pt-4 flex flex-wrap items-center gap-5 text-xs text-[#96908C] border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#67C7E7]" />
                <span className="text-white/80">Secure</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#19D58A]" />
                <span className="text-white/80">Evidence-Driven</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-[#B084F5]" />
                <span className="text-white/80">AI-Assisted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#00e676]" />
                <span className="text-white/80">Human Oversight</span>
              </div>
            </div>
          </div>

          {/* Right Hero Interactive Diagram / Network Visualization */}
          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[380px] sm:min-h-[440px] w-full max-w-full overflow-hidden py-4">
            <div className="relative w-full max-w-[420px] sm:max-w-[480px] aspect-square flex items-center justify-center mx-auto px-1 sm:px-2">
              {/* Concentric Grid Rings & Lines SVG */}
              <svg className="absolute inset-0 w-full h-full opacity-60 pointer-events-none" viewBox="0 0 500 500">
                <circle cx="250" cy="250" fill="none" r="190" stroke="#00e676" strokeDasharray="4 6" strokeOpacity="0.25" strokeWidth="1" />
                <circle cx="250" cy="250" fill="none" r="140" stroke="#00e676" strokeOpacity="0.3" strokeWidth="1" />
                <circle cx="250" cy="250" fill="none" r="90" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1" />
                <line stroke="rgba(255,255,255,0.06)" strokeWidth="1" x1="250" x2="250" y1="60" y2="440" />
                <line stroke="rgba(255,255,255,0.06)" strokeWidth="1" x1="60" x2="440" y1="250" y2="250" />
                <line stroke="rgba(0,230,118,0.15)" strokeWidth="1" x1="120" x2="380" y1="120" y2="380" />
                <line stroke="rgba(0,230,118,0.15)" strokeWidth="1" x1="380" x2="120" y1="120" y2="380" />
                <circle cx="250" cy="60" fill="#00e676" r="4" />
                <circle cx="440" cy="250" fill="#00e676" r="4" />
                <circle cx="250" cy="440" fill="#19D58A" r="4" />
                <circle cx="60" cy="250" fill="#B084F5" r="4" />
                <circle cx="380" cy="120" fill="#00e676" r="3" />
                <circle cx="120" cy="380" fill="#00e676" r="3" />
              </svg>

              {/* Center Hub Badge */}
              <div className="relative z-20 text-center px-4 py-3.5 sm:px-5 sm:py-4 rounded-2xl bg-[#06140c]/95 border border-[#00e676]/40 shadow-[0_0_30px_rgba(0,230,118,0.3)] max-w-[220px] sm:max-w-[250px] flex flex-col items-center">
                <img src="/ccip-logo.png" alt="CCIP Emblem" className="w-12 h-12 sm:w-14 sm:h-14 object-contain mb-2 drop-shadow-[0_0_12px_rgba(0,230,118,0.45)]" />
                <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-white leading-snug">
                  CITIZEN CYBERCRIME INTELLIGENCE PLATFORM
                </div>
                <div className="text-[8px] sm:text-[8.5px] uppercase tracking-wider text-[#96908C] mt-1">
                  PEOPLE • EVIDENCE • INTELLIGENCE • SAFER SOCIETY
                </div>
              </div>

              {/* Floating Card 1: Top-Left (Report Cybercrime) */}
              <div 
                onClick={() => onNavigatePortal('citizen', 'file-complaint')}
                className="absolute top-0 left-0 sm:left-1 z-10 bg-[#06140c]/90 backdrop-blur-md border border-[#00e676]/20 hover:border-[#00e676]/50 p-2.5 sm:p-3 rounded-xl max-w-[160px] sm:max-w-[190px] text-left shadow-lg cursor-pointer transition-all"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#67C7E7]/15 text-[#67C7E7] flex items-center justify-center text-xs">
                    <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-white leading-tight">Report Cybercrime</span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-[#96908C] leading-snug">Submit incident details and evidence securely.</p>
              </div>

              {/* Floating Card 2: Top-Right (AI Analysis & Correlation) */}
              <div 
                onClick={() => onNavigatePortal('specialist', 'correlator')}
                className="absolute top-1 right-0 sm:right-1 z-10 bg-[#06140c]/90 backdrop-blur-md border border-[#00e676]/20 hover:border-[#00e676]/50 p-2.5 sm:p-3 rounded-xl max-w-[160px] sm:max-w-[190px] text-left shadow-lg cursor-pointer transition-all"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#67C7E7]/15 text-[#67C7E7] flex items-center justify-center text-xs">
                    <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-white leading-tight">AI Analysis &amp; Correlation</span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-[#96908C] leading-snug">Identify patterns across cases.</p>
              </div>

              {/* Floating Card 3: Bottom-Left (Investigation & Verification) */}
              <div 
                onClick={() => onNavigatePortal('specialist', 'assigned-cases')}
                className="absolute bottom-3 left-0 sm:left-1 z-10 bg-[#06140c]/90 backdrop-blur-md border border-[#00e676]/20 hover:border-[#00e676]/50 p-2.5 sm:p-3 rounded-xl max-w-[165px] sm:max-w-[195px] text-left shadow-lg cursor-pointer transition-all"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#19D58A]/15 text-[#19D58A] flex items-center justify-center text-xs">
                    <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-white leading-tight">Investigation &amp; Verification</span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-[#96908C] leading-snug">Evidence-driven analysis by specialists.</p>
              </div>

              {/* Floating Card 4: Bottom-Right (Safer Communities) */}
              <div 
                onClick={() => onNavigatePortal('citizen')}
                className="absolute bottom-1 right-0 sm:right-1 z-10 bg-[#06140c]/90 backdrop-blur-md border border-[#00e676]/20 hover:border-[#00e676]/50 p-2.5 sm:p-3 rounded-xl max-w-[160px] sm:max-w-[190px] text-left shadow-lg cursor-pointer transition-all"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#19D58A]/15 text-[#19D58A] flex items-center justify-center text-xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-white leading-tight">Safer Communities</span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-[#96908C] leading-snug">Faster response. Stronger digital safety for everyone.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Bottom Status Ribbon */}
        <div className="max-w-7xl mx-auto mt-10 pt-4 border-t border-white/5 flex flex-wrap items-center justify-end text-[11px] font-medium text-[#96908C] tracking-wider gap-4">
          <span className="text-white">Detect</span>
          <span className="text-white/30">•</span>
          <span className="text-[#00e676]">Analyze</span>
          <span className="text-white/30">•</span>
          <span className="text-white">Correlate</span>
          <span className="text-white/30">•</span>
          <span className="text-[#67C7E7]">Investigate</span>
          <span className="text-white/30">•</span>
          <span className="text-[#19D58A]">Prevent</span>
        </div>
      </section>

      {/* Citizen Report CTA Banner */}
      <section id="report-cta" className="py-14 px-4 sm:px-6 lg:px-8 bg-[#030706] border-b border-[#00e676]/15 w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl border border-[#00e676]/20 p-6 sm:p-8 relative overflow-hidden bg-gradient-to-r from-[#06140c] via-[#081f13] to-[#06140c] shadow-[0_0_30px_rgba(0,230,118,0.1)]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Laptop Mockup Graphic */}
              <div className="lg:col-span-3 flex justify-center">
                <div className="w-full max-w-[220px] aspect-video bg-[#030906] rounded-xl border border-[#00e676]/20 p-4 flex flex-col justify-center items-center text-center shadow-inner relative group">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#D8D3D0] mb-2">
                    REPORT<br/>CYBERCRIME
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#00e676]/20 border border-[#00e676]/40 flex items-center justify-center text-[#00e676] shadow-[0_0_10px_rgba(0,230,118,0.4)]">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Middle Description & Action Button */}
              <div className="lg:col-span-6 space-y-4 text-left">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Experienced a Cybercrime Incident?
                </h2>
                <p className="text-xs sm:text-sm text-[#D8D3D0] leading-relaxed">
                  Report suspicious activity, fraud, phishing, account compromise or other cyber incidents through the guided complaint process.
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <button 
                    onClick={() => onNavigatePortal('citizen', 'file-complaint')}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00e676] to-[#00c853] hover:brightness-110 text-[#031508] text-xs font-bold px-6 py-3 rounded-md shadow-[0_0_20px_rgba(0,230,118,0.35)] transition-all"
                  >
                    <span>File a Complaint</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowTrackModal(true)}
                    className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold px-4 py-3 rounded-md transition-all"
                  >
                    <Search className="w-3.5 h-3.5 text-[#96908C]" />
                    <span>Track Existing Case</span>
                  </button>
                </div>
              </div>

              {/* Right Feature Checklist */}
              <div className="lg:col-span-3 space-y-2.5 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6 text-xs text-[#D8D3D0]">
                <div className="flex items-center gap-2.5">
                  <span className="text-cyan-400">
                    <FileText className="w-4 h-4" />
                  </span>
                  <span>Structured complaint form</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-cyan-400">
                    <UploadCloud className="w-4 h-4" />
                  </span>
                  <span>Evidence upload</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-cyan-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <span>Complaint tracking</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                  <span>Status notifications</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Privacy + AI Assists — Humans Decide Split Block */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#030706] border-b border-[#00e676]/15 w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Security & Privacy */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Security &amp; <span className="text-[#00e676]">Privacy</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#96908C] mt-1">
                Your trust and data security matter.
              </p>
            </div>

            {/* 3x2 Grid of Badges */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-[#06140c] p-3 rounded-lg border border-[#00e676]/15 flex flex-col items-center justify-center text-center">
                <span className="text-emerald-400 mb-1.5">
                  <UserCheck className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-semibold text-white leading-snug">Role-Based Access</span>
              </div>
              <div className="bg-[#06140c] p-3 rounded-lg border border-[#00e676]/15 flex flex-col items-center justify-center text-center">
                <span className="text-cyan-400 mb-1.5">
                  <Lock className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-semibold text-white leading-snug">Secure Authentication</span>
              </div>
              <div className="bg-[#06140c] p-3 rounded-lg border border-[#00e676]/15 flex flex-col items-center justify-center text-center">
                <span className="text-amber-400 mb-1.5">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-semibold text-white leading-snug">Evidence Integrity</span>
              </div>
              <div className="bg-[#06140c] p-3 rounded-lg border border-[#00e676]/15 flex flex-col items-center justify-center text-center">
                <span className="text-pink-400 mb-1.5">
                  <FileCode className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-semibold text-white leading-snug">Audit Logging</span>
              </div>
              <div className="bg-[#06140c] p-3 rounded-lg border border-[#00e676]/15 flex flex-col items-center justify-center text-center">
                <span className="text-yellow-400 mb-1.5">
                  <Shield className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-semibold text-white leading-snug">Data Protection</span>
              </div>
              <div className="bg-[#06140c] p-3 rounded-lg border border-[#00e676]/15 flex flex-col items-center justify-center text-center">
                <span className="text-purple-400 mb-1.5">
                  <Key className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-semibold text-white leading-snug">Controlled Access</span>
              </div>
            </div>
          </div>

          {/* Right Column: AI Assists — Humans Decide */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                AI Assists — <span className="text-[#00e676]">Humans Decide</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#96908C] mt-1 leading-relaxed">
                AI supports investigation recommendations, evidence organization and analysis, but does not replace human judgment.
              </p>
            </div>

            {/* 4-Step Pipeline Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center pt-2">
              {/* Step A */}
              <div className="bg-[#06140c] p-3.5 rounded-xl text-left border border-[#00e676]/15 relative">
                <div className="w-7 h-7 rounded-md bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-2">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white mb-0.5">Evidence</div>
                <p className="text-[10px] text-[#96908C] leading-tight">Digital data and artifacts</p>
              </div>

              {/* Step B */}
              <div className="bg-[#06140c] p-3.5 rounded-xl text-left border border-[#00e676]/15 relative">
                <div className="w-7 h-7 rounded-md bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-2">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white mb-0.5">Context</div>
                <p className="text-[10px] text-[#96908C] leading-tight">Related information and intelligence</p>
              </div>

              {/* Step C */}
              <div className="bg-[#06140c] p-3.5 rounded-xl text-left border border-[#00e676]/15 relative">
                <div className="w-7 h-7 rounded-md bg-amber-500/15 text-amber-400 flex items-center justify-center mb-2">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white mb-0.5">AI Recommendation</div>
                <p className="text-[10px] text-[#96908C] leading-tight">Analysis and suggested insights</p>
              </div>

              {/* Step D */}
              <div className="bg-[#06140c] p-3.5 rounded-xl text-left border border-[#00e676]/40 bg-[#00e676]/10 relative">
                <div className="w-7 h-7 rounded-md bg-[#00e676]/20 text-[#00e676] flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-[#00e676] mb-0.5">Verified Finding</div>
                <p className="text-[10px] text-[#96908C] leading-tight">Human expert review and decision</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stay Safe Online & FAQ Double Section */}
      <section id="safety-guidance" className="py-16 px-4 sm:px-6 lg:px-8 bg-[#030706] border-b border-[#00e676]/15 w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Stay Safe Online */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Stay Safe <span className="text-[#00e676]">Online</span>
                </h2>
                <p className="text-xs sm:text-sm text-[#96908C] mt-1">
                  Simple steps to protect yourself from cyber threats.
                </p>
              </div>
              <button 
                onClick={() => onNavigatePortal('citizen', 'guidance')}
                className="text-xs font-semibold text-[#00e676] hover:text-[#00c853] flex items-center gap-1 transition-colors"
              >
                <span>View All Guidance</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2x3 Grid of Compact Advice Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Card 1 */}
              <div className="bg-[#06140c] p-3.5 rounded-xl border border-[#00e676]/15 flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-red-500/10 text-red-400 flex-shrink-0 flex items-center justify-center">
                  <AlertOctagon className="w-4 h-4" />
                </span>
                <div className="text-xs text-[#D8D3D0] leading-snug">
                  <strong className="text-white block font-medium">Do not share</strong>
                  OTPs or passwords
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-[#06140c] p-3.5 rounded-xl border border-[#00e676]/15 flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-cyan-500/10 text-cyan-400 flex-shrink-0 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </span>
                <div className="text-xs text-[#D8D3D0] leading-snug">
                  <strong className="text-white block font-medium">Preserve screenshots</strong>
                  and transaction details
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-[#06140c] p-3.5 rounded-xl border border-[#00e676]/15 flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-[#00e676]/10 text-[#00e676] flex-shrink-0 flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </span>
                <div className="text-xs text-[#D8D3D0] leading-snug">
                  <strong className="text-white block font-medium">Avoid further</strong>
                  interaction with suspicious accounts
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-[#06140c] p-3.5 rounded-xl border border-[#00e676]/15 flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-teal-500/10 text-teal-400 flex-shrink-0 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </span>
                <div className="text-xs text-[#D8D3D0] leading-snug">
                  <strong className="text-white block font-medium">Contact your bank</strong>
                  quickly after financial fraud
                </div>
              </div>

              {/* Card 5 */}
              <div className="bg-[#06140c] p-3.5 rounded-xl border border-[#00e676]/15 flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-purple-500/10 text-purple-400 flex-shrink-0 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <div className="text-xs text-[#D8D3D0] leading-snug">
                  <strong className="text-white block font-medium">Use official</strong>
                  complaint channels
                </div>
              </div>

              {/* Card 6 */}
              <div className="bg-[#06140c] p-3.5 rounded-xl border border-[#00e676]/15 flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-400 flex-shrink-0 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <div className="text-xs text-[#D8D3D0] leading-snug">
                  <strong className="text-white block font-medium">Do not attempt</strong>
                  to investigate suspects yourself
                </div>
              </div>
            </div>
          </div>

          {/* Right: Frequently Asked Questions */}
          <div id="faq" className="lg:col-span-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Frequently Asked <span className="text-[#00e676]">Questions</span>
                </h2>
                <p className="text-xs sm:text-sm text-[#96908C] mt-1">
                  Find answers to common questions.
                </p>
              </div>
              <button 
                onClick={() => onNavigatePortal('citizen')}
                className="text-xs font-semibold text-[#00e676] hover:text-[#00c853] flex items-center gap-1 transition-colors"
              >
                <span>View All FAQs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Accordion List */}
            <div className="space-y-2 pt-2 text-xs">
              {faqs.map((faq, idx) => (
                <div 
                  key={idx}
                  className="bg-[#06140c] rounded-xl overflow-hidden border border-[#00e676]/15 transition duration-150"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-3.5 flex items-center justify-between cursor-pointer text-white font-medium select-none hover:text-[#00e676] transition-colors text-left"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-[#96908C] transition-transform duration-200 ${activeFaq === idx ? 'rotate-180 text-[#00e676]' : ''}`} />
                  </button>
                  {activeFaq === idx && (
                    <div className="px-3.5 pb-3 text-[#96908C] leading-relaxed border-t border-[#00e676]/15 pt-2 animate-in fade-in duration-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#020504] py-10 px-4 sm:px-6 lg:px-8 border-t border-[#00e676]/15 w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[#00e676]/10 text-center md:text-left">
            {/* Left: Logo & Motto */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#06140c] to-[#030906] border border-[#00e676]/40 flex items-center justify-center p-1 shadow-[0_0_10px_rgba(0,230,118,0.2)] overflow-hidden">
                <img src="/ccip-logo.png" alt="CCIP Logo" className="w-full h-full object-contain filter drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]" />
              </div>
              <div>
                <div className="text-xs font-bold text-white tracking-wide">Citizen Cybercrime Intelligence Platform (CCIP)</div>
                <div className="text-[10px] text-[#96908C]">People | Evidence | Intelligence | Safer Society</div>
              </div>
            </div>

            {/* Center: Links */}
            <nav className="flex flex-wrap items-center justify-center gap-5 text-xs text-[#96908C] font-medium">
              <button onClick={() => scrollToSection('hero')} className="hover:text-white transition">Privacy</button>
              <button onClick={() => scrollToSection('hero')} className="hover:text-white transition">Terms</button>
              <button onClick={() => scrollToSection('faq')} className="hover:text-white transition">Help</button>
              <button onClick={() => scrollToSection('safety-guidance')} className="hover:text-white transition">Safety Guidance</button>
              <button onClick={() => onOpenAuth ? onOpenAuth('selection') : onNavigatePortal('citizen')} className="hover:text-white transition cursor-pointer">Sign In</button>
              <button onClick={() => onOpenAuth ? onOpenAuth('citizen-login') : onNavigatePortal('citizen', 'file-complaint')} className="hover:text-[#00e676] transition cursor-pointer">File Complaint</button>
            </nav>

            {/* Right: Disclaimer */}
            <div className="text-[10px] text-[#96908C] text-center md:text-right max-w-xs">
              <div className="font-semibold text-[#D8D3D0]">Prototype Version 1.0</div>
              <div>This is a prototype for demonstration purposes. Not an official government website.</div>
            </div>
          </div>

          <div className="pt-4 text-center text-[10px] text-[#96908C]">
            © 2025 AI Cybercrime Intelligence Platform. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Case Lookup Modal */}
      {showTrackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#06140c] border border-[#00e676]/30 rounded-2xl p-6 max-w-md w-full shadow-[0_0_40px_rgba(0,230,118,0.2)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#00e676]/15 mb-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#00e676]" />
                <h3 className="text-sm font-bold text-white">Track Cybercrime Case</h3>
              </div>
              <button onClick={() => setShowTrackModal(false)} className="text-[#96908C] hover:text-white">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTrackSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-[#D8D3D0] block mb-1.5 font-medium">
                  Enter Case Reference ID:
                </label>
                <input
                  type="text"
                  placeholder="e.g. CYBER-2026-9842"
                  value={quickTrackId}
                  onChange={(e) => setQuickTrackId(e.target.value)}
                  className="w-full bg-[#030906] border border-[#00e676]/20 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-[#96908C] focus:outline-none focus:border-[#00e676] uppercase"
                />
                {trackError && <p className="text-[11px] text-red-400 mt-1">{trackError}</p>}
              </div>

              <div className="p-3 rounded-xl bg-[#030906] border border-[#00e676]/15 text-[11px] text-[#96908C] flex flex-col gap-1">
                <span className="text-white font-semibold">Verified Case Reference Sample:</span>
                <span className="font-mono text-[#00e676]">CYBER-2026-9842</span>
                <span>(AI Voice Clone Wire Fraud)</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTrackModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[#96908C] hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-[#00e676] to-[#00c853] hover:brightness-110 text-[#031508] shadow-[0_0_15px_rgba(0,230,118,0.35)] transition-all"
                >
                  Track Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Chatbot Widget (Bottom Right Corner) */}
      <FloatingChatbotWidget
        onNavigatePortal={onNavigatePortal}
        onTrackCase={onTrackCase}
        onOpenAuth={onOpenAuth}
      />
    </div>
  );
};
