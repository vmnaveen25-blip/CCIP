import React, { useState } from 'react';
import { PortalRole, Complaint, UserProfile } from '../types';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  FileText, 
  Brain, 
  BarChart3, 
  UploadCloud, 
  ClipboardCheck, 
  Users, 
  Search, 
  CheckCircle2, 
  Check, 
  UserCheck, 
  Cpu, 
  Settings, 
  FolderLock, 
  Database, 
  Share2, 
  Link as LinkIcon, 
  Briefcase, 
  Activity, 
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
    <div className="flex flex-col text-left font-sans bg-[#030706] text-[#F8F7F5] w-full max-w-full overflow-x-hidden min-h-screen">
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
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#06140c] to-[#030906] border border-[#00e676]/40 flex items-center justify-center p-2 shadow-[0_0_12px_rgba(0,230,118,0.25)]">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-[#00e676]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                AI Cybercrime
              </span>
              <span className="text-xs text-[#96908C] tracking-wider font-normal">Intelligence Platform</span>
            </div>
          </div>

          {/* Center Links */}
          <nav className="hidden xl:flex items-center gap-5 lg:gap-6 text-xs font-medium text-[#D8D3D0] shrink-0">
            <button onClick={() => scrollToSection('hero')} className="text-[#00e676] flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] inline-block"></span>
              Home
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">
              How It Works
            </button>
            <button onClick={() => onNavigatePortal('citizen', 'file-complaint')} className="hover:text-white transition-colors">
              Report Cybercrime
            </button>
            <button onClick={() => scrollToSection('capabilities')} className="hover:text-white transition-colors">
              Platform Capabilities
            </button>
            <button onClick={() => scrollToSection('safety-guidance')} className="hover:text-white transition-colors">
              Safety Guidance
            </button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors">
              Help
            </button>
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button 
              onClick={() => onNavigatePortal('citizen', 'file-complaint')}
              className="bg-gradient-to-r from-[#00e676] to-[#00c853] hover:brightness-110 text-[#031508] text-xs font-bold px-3.5 sm:px-4 py-2.5 rounded-md flex items-center gap-1.5 shadow-[0_0_20px_rgba(0,230,118,0.35)] transition duration-200"
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Report Cybercrime</span>
            </button>
            {currentUser ? (
              <button 
                onClick={() => onNavigatePortal(currentUser.portal_role || 'citizen')}
                className="border border-primary/30 hover:border-primary/60 text-primary bg-primary/10 hover:bg-primary/20 text-xs font-semibold px-3 sm:px-3.5 py-2.5 rounded-md flex items-center gap-1.5 transition duration-200"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>Dashboard ({currentUser.full_name?.trim().split(/\s+/)[0] || 'User'})</span>
              </button>
            ) : (
              <button 
                onClick={() => onOpenAuth ? onOpenAuth('selection') : onNavigatePortal('citizen')}
                className="border border-white/15 hover:border-white/30 text-[#F8F7F5] bg-white/[0.03] hover:bg-white/[0.08] text-xs font-semibold px-3 sm:px-3.5 py-2.5 rounded-md flex items-center gap-1.5 transition duration-200"
              >
                <LogIn className="w-3.5 h-3.5 text-[#96908C]" />
                <span>Sign In</span>
              </button>
            )}
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

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={() => onNavigatePortal('citizen', 'file-complaint')}
                className="bg-gradient-to-r from-[#00e676] to-[#00c853] hover:brightness-110 text-[#031508] text-xs font-bold px-6 py-3.5 rounded-md flex items-center gap-2 shadow-[0_0_20px_rgba(0,230,118,0.35)] transition-all"
              >
                <Megaphone className="w-4 h-4" />
                <span>Report Cybercrime</span>
              </button>
              {currentUser ? (
                <button
                  onClick={() => onNavigatePortal(currentUser.portal_role || 'citizen')}
                  className="border border-primary/40 hover:border-primary/60 text-white bg-primary/20 hover:bg-primary/30 text-xs font-semibold px-6 py-3.5 rounded-md flex items-center gap-2 transition-all shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Enter Dashboard ({currentUser.full_name?.trim().split(/\s+/)[0] || 'User'})</span>
                </button>
              ) : (
                <button
                  onClick={() => onOpenAuth ? onOpenAuth('selection') : onNavigatePortal('citizen')}
                  className="border border-white/20 hover:border-white/40 text-white bg-white/[0.04] hover:bg-white/[0.09] text-xs font-semibold px-6 py-3.5 rounded-md flex items-center gap-2 transition-all"
                >
                  <LogIn className="w-4 h-4 text-[#96908C]" />
                  <span>Sign In</span>
                </button>
              )}
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
              <div className="relative z-20 text-center px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-xl bg-[#06140c]/95 border border-[#00e676]/40 shadow-[0_0_30px_rgba(0,230,118,0.3)] max-w-[210px] sm:max-w-[240px]">
                <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-white leading-snug">
                  AI CYBERCRIME INTELLIGENCE PLATFORM
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

      {/* Our Platform Principles */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#030706] border-b border-[#00e676]/15 w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 text-left">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Our <span className="text-[#00e676]">Platform Principles</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#96908C] mt-1">
              Built for trust, transparency and a safer digital world.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Principle 1 */}
            <div className="bg-[#06140c]/90 p-5 rounded-xl border border-[#00e676]/15 hover:border-[#00e676]/40 transition duration-200">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3.5">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-1.5">Secure Complaint Intake</h3>
              <p className="text-xs text-[#96908C] leading-relaxed">Report incidents through a secure and structured process.</p>
            </div>

            {/* Principle 2 */}
            <div className="bg-[#06140c]/90 p-5 rounded-xl border border-[#00e676]/15 hover:border-[#00e676]/40 transition duration-200">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3.5">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-1.5">Evidence-Centered Investigation</h3>
              <p className="text-xs text-[#96908C] leading-relaxed">Preserve and analyze digital evidence with integrity.</p>
            </div>

            {/* Principle 3 */}
            <div className="bg-[#06140c]/90 p-5 rounded-xl border border-[#00e676]/15 hover:border-[#00e676]/40 transition duration-200">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3.5">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-1.5">Explainable AI Assistance</h3>
              <p className="text-xs text-[#96908C] leading-relaxed">AI provides transparent insights to support human decision-making.</p>
            </div>

            {/* Principle 4 */}
            <div className="bg-[#06140c]/90 p-5 rounded-xl border border-[#00e676]/15 hover:border-[#00e676]/40 transition duration-200">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3.5">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-1.5">Controlled Continuous Learning</h3>
              <p className="text-xs text-[#96908C] leading-relaxed">Improve detection through validated and approved datasets.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 bg-[#030706] border-b border-[#00e676]/15 w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                How <span className="text-[#00e676]">It Works</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#96908C] mt-1">
                From reporting to resolution — a structured and transparent process.
              </p>
            </div>
            <div className="text-xs font-medium text-[#96908C]">
              Turn reports into safer communities.
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 relative w-full max-w-full">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center group">
              <div className="relative w-14 h-14 rounded-full bg-[#06140c] border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                <FileText className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#081f13] border border-[#00e676]/20 text-[10px] font-bold text-white flex items-center justify-center">1</span>
              </div>
              <h3 className="text-xs font-bold text-white mb-1">Report Incident</h3>
              <p className="text-[11px] text-[#96908C] leading-tight max-w-[130px]">Provide details about the cybercrime.</p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center group">
              <div className="relative w-14 h-14 rounded-full bg-[#06140c] border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_12px_rgba(103,199,231,0.2)]">
                <UploadCloud className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#081f13] border border-[#00e676]/20 text-[10px] font-bold text-white flex items-center justify-center">2</span>
              </div>
              <h3 className="text-xs font-bold text-white mb-1">Submit Evidence</h3>
              <p className="text-[11px] text-[#96908C] leading-tight max-w-[130px]">Upload files, links, screenshots, etc.</p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center group">
              <div className="relative w-14 h-14 rounded-full bg-[#06140c] border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3 shadow-[0_0_12px_rgba(25,213,138,0.2)]">
                <ClipboardCheck className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#081f13] border border-[#00e676]/20 text-[10px] font-bold text-white flex items-center justify-center">3</span>
              </div>
              <h3 className="text-xs font-bold text-white mb-1">Complaint Review</h3>
              <p className="text-[11px] text-[#96908C] leading-tight max-w-[130px]">Initial verification and categorization.</p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center group">
              <div className="relative w-14 h-14 rounded-full bg-[#06140c] border border-pink-500/40 flex items-center justify-center text-pink-400 mb-3 shadow-[0_0_12px_rgba(244,114,182,0.2)]">
                <Users className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#081f13] border border-[#00e676]/20 text-[10px] font-bold text-white flex items-center justify-center">4</span>
              </div>
              <h3 className="text-xs font-bold text-white mb-1">Case Assignment</h3>
              <p className="text-[11px] text-[#96908C] leading-tight max-w-[130px]">Assigned to appropriate unit or specialist.</p>
            </div>

            {/* Step 5 */}
            <div className="flex flex-col items-center text-center group">
              <div className="relative w-14 h-14 rounded-full bg-[#06140c] border border-yellow-500/40 flex items-center justify-center text-yellow-400 mb-3 shadow-[0_0_12px_rgba(240,214,0,0.2)]">
                <Search className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#081f13] border border-[#00e676]/20 text-[10px] font-bold text-white flex items-center justify-center">5</span>
              </div>
              <h3 className="text-xs font-bold text-white mb-1">Technical Investigation</h3>
              <p className="text-[11px] text-[#96908C] leading-tight max-w-[130px]">In-depth analysis and threat intelligence.</p>
            </div>

            {/* Step 6 */}
            <div className="flex flex-col items-center text-center group">
              <div className="relative w-14 h-14 rounded-full bg-[#06140c] border border-emerald-400/40 flex items-center justify-center text-emerald-300 mb-3 shadow-[0_0_12px_rgba(52,211,153,0.2)]">
                <ShieldCheck className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#081f13] border border-[#00e676]/20 text-[10px] font-bold text-white flex items-center justify-center">6</span>
              </div>
              <h3 className="text-xs font-bold text-white mb-1">Verification</h3>
              <p className="text-[11px] text-[#96908C] leading-tight max-w-[130px]">Independent review and validation.</p>
            </div>

            {/* Step 7 */}
            <div className="flex flex-col items-center text-center group">
              <div className="relative w-14 h-14 rounded-full bg-[#06140c] border border-[#00e676]/50 flex items-center justify-center text-[#00e676] mb-3 shadow-[0_0_12px_rgba(0,230,118,0.3)]">
                <CheckCircle2 className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#00e676] text-[10px] font-bold text-[#031508] flex items-center justify-center">7</span>
              </div>
              <h3 className="text-xs font-bold text-white mb-1">Resolution / Follow-up</h3>
              <p className="text-[11px] text-[#96908C] leading-tight max-w-[130px]">Case closure and status updates.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Who Uses the Platform? */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#030706] border-b border-[#00e676]/15 w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 text-left">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Who Uses <span className="text-[#00e676]">the Platform?</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#96908C] mt-1">
              A unified platform for a safer digital society.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-full">
            {/* Role 1 */}
            <div 
              onClick={() => onNavigatePortal('citizen')}
              className="bg-[#06140c]/90 p-4 rounded-xl border border-[#00e676]/15 hover:border-[#00e676]/40 transition duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-[#00e676]/10 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] mb-3 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-white mb-1 group-hover:text-[#00e676] transition-colors">Citizen / Complainant</h3>
                <p className="text-[11px] text-[#96908C] leading-relaxed">Report and track cybercrime complaints.</p>
              </div>
            </div>

            {/* Role 2 */}
            <div 
              onClick={() => onNavigatePortal('specialist')}
              className="bg-[#06140c]/90 p-4 rounded-xl border border-white/5 hover:border-[#67C7E7]/40 transition duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">Cybersecurity Specialist</h3>
                <p className="text-[11px] text-[#96908C] leading-relaxed">Analyze evidence and investigate cyber threats.</p>
              </div>
            </div>

            {/* Role 4 */}
            <div 
              onClick={() => onNavigatePortal('aiml')}
              className="bg-[#06140c]/90 p-4 rounded-xl border border-white/5 hover:border-purple-500/40 transition duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-105 transition-transform">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">AI/ML Maintenance Specialist</h3>
                <p className="text-[11px] text-[#96908C] leading-relaxed">Maintain validated AI model lifecycle.</p>
              </div>
            </div>

            {/* Role 5 */}
            <div 
              onClick={() => onNavigatePortal('admin')}
              className="bg-[#06140c]/90 p-4 rounded-xl border border-white/5 hover:border-teal-500/40 transition duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-3 group-hover:scale-105 transition-transform">
                  <Settings className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-white mb-1 group-hover:text-teal-400 transition-colors">System Administrator</h3>
                <p className="text-[11px] text-[#96908C] leading-relaxed">Manage security, access and platform operations.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Capabilities */}
      <section id="capabilities" className="py-16 px-4 sm:px-6 lg:px-8 bg-[#030706] border-b border-[#00e676]/15 w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Platform <span className="text-[#00e676]">Capabilities</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#96908C] mt-1">
                An integrated ecosystem for end-to-end cybercrime intelligence.
              </p>
            </div>
            <button 
              onClick={() => onNavigatePortal('specialist')}
              className="text-xs font-semibold text-[#00e676] hover:text-[#00c853] flex items-center gap-1 transition-colors"
            >
              <span>View All Capabilities</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full max-w-full">
            {/* Cap 1 */}
            <div 
              onClick={() => onNavigatePortal('citizen')}
              className="bg-[#06140c]/90 p-4 rounded-xl border border-[#00e676]/15 hover:border-[#00e676]/40 transition duration-200 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[#00e676]/10 text-[#00e676] flex items-center justify-center mb-2.5">
                <FolderLock className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">Cybercrime Complaint Management</h3>
              <p className="text-[11px] text-[#96908C] leading-tight">Structured intake and tracking.</p>
            </div>

            {/* Cap 2 */}
            <div 
              onClick={() => onNavigatePortal('specialist', 'evidence-repository')}
              className="bg-[#06140c]/90 p-4 rounded-xl border border-white/5 hover:border-cyan-500/40 transition duration-200 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-cyan-400 flex items-center justify-center mb-2.5">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">Evidence Management</h3>
              <p className="text-[11px] text-[#96908C] leading-tight">Secure storage and analysis.</p>
            </div>

            {/* Cap 3 */}
            <div 
              onClick={() => onNavigatePortal('specialist', 'intel-overview')}
              className="bg-[#06140c]/90 p-4 rounded-xl border border-white/5 hover:border-emerald-500/40 transition duration-200 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2.5">
                <Share2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">IOC &amp; Threat Analysis</h3>
              <p className="text-[11px] text-[#96908C] leading-tight">Analyze indicators of compromise.</p>
            </div>

            {/* Cap 4 */}
            <div 
              onClick={() => onNavigatePortal('specialist', 'correlator')}
              className="bg-[#06140c]/90 p-4 rounded-xl border border-white/5 hover:border-pink-500/40 transition duration-200 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center mb-2.5">
                <LinkIcon className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">Cross-Case Correlation</h3>
              <p className="text-[11px] text-[#96908C] leading-tight">Identify links across cases.</p>
            </div>

            {/* Cap 5 */}
            <div 
              onClick={() => onNavigatePortal('specialist', 'validation-queue')}
              className="bg-[#06140c]/90 p-4 rounded-xl border border-white/5 hover:border-yellow-500/40 transition duration-200 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-400 flex items-center justify-center mb-2.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">Independent Verification</h3>
              <p className="text-[11px] text-[#96908C] leading-tight">Validate findings and evidence.</p>
            </div>

            {/* Cap 6 */}
            <div 
              onClick={() => onNavigatePortal('aiml')}
              className="bg-[#06140c]/90 p-4 rounded-xl border border-white/5 hover:border-purple-500/40 transition duration-200 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2.5">
                <Brain className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">AI Investigation Assistant</h3>
              <p className="text-[11px] text-[#96908C] leading-tight">AI-supported analysis and recommendations.</p>
            </div>

            {/* Cap 7 */}
            <div 
              onClick={() => onNavigatePortal('specialist', 'assigned-cases')}
              className="bg-[#06140c]/90 p-4 rounded-xl border border-white/5 hover:border-red-500/40 transition duration-200 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center mb-2.5">
                <Briefcase className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">Cybercrime Case Management</h3>
              <p className="text-[11px] text-[#96908C] leading-tight">End-to-end case lifecycle.</p>
            </div>

            {/* Cap 8 */}
            <div 
              onClick={() => onNavigatePortal('specialist')}
              className="bg-[#06140c]/90 p-4 rounded-xl border border-white/5 hover:border-cyan-500/40 transition duration-200 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2.5">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">SOC Monitoring</h3>
              <p className="text-[11px] text-[#96908C] leading-tight">Real-time threat monitoring.</p>
            </div>

            {/* Cap 9 */}
            <div 
              onClick={() => onNavigatePortal('aiml')}
              className="bg-[#06140c]/90 p-4 rounded-xl border border-white/5 hover:border-purple-500/40 transition duration-200 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-300 flex items-center justify-center mb-2.5">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">AI/ML Governance</h3>
              <p className="text-[11px] text-[#96908C] leading-tight">Controlled model lifecycle and deployment.</p>
            </div>

            {/* Cap 10 */}
            <div 
              onClick={() => onNavigatePortal('admin')}
              className="bg-[#06140c]/90 p-4 rounded-xl border border-white/5 hover:border-emerald-500/40 transition duration-200 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">Audit &amp; Security</h3>
              <p className="text-[11px] text-[#96908C] leading-tight">Comprehensive audit logging and access control.</p>
            </div>
          </div>
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
              <div className="w-8 h-8 rounded-md bg-[#06140c] border border-[#00e676]/40 flex items-center justify-center p-1.5 shadow-[0_0_10px_rgba(0,230,118,0.2)]">
                <Shield className="w-5 h-5 text-[#00e676]" />
              </div>
              <div>
                <div className="text-xs font-bold text-white tracking-wide">AI Cybercrime Intelligence Platform</div>
                <div className="text-[10px] text-[#96908C]">People | Evidence | Intelligence | Safer Society</div>
              </div>
            </div>

            {/* Center: Links */}
            <nav className="flex flex-wrap items-center justify-center gap-5 text-xs text-[#96908C] font-medium">
              <button onClick={() => scrollToSection('hero')} className="hover:text-white transition">Privacy</button>
              <button onClick={() => scrollToSection('hero')} className="hover:text-white transition">Terms</button>
              <button onClick={() => scrollToSection('faq')} className="hover:text-white transition">Help</button>
              <button onClick={() => scrollToSection('safety-guidance')} className="hover:text-white transition">Safety Guidance</button>
              <button onClick={() => onOpenAuth ? onOpenAuth('selection') : onNavigatePortal('citizen')} className="hover:text-white transition">Sign In</button>
              <button onClick={() => onNavigatePortal('citizen', 'file-complaint')} className="hover:text-[#00e676] transition">File Complaint</button>
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
    </div>
  );
};
