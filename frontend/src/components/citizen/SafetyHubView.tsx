import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  AlertTriangle, 
  ChevronRight, 
  CheckSquare, 
  Square, 
  Zap, 
  FileText, 
  FolderOpen, 
  Lightbulb, 
  QrCode, 
  Landmark, 
  X, 
  ArrowRight, 
  Laptop, 
  Smartphone, 
  UserCheck, 
  PhoneCall, 
  ExternalLink,
  Info,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface SafetyHubViewProps {
  onSelectTab: (tabId: string) => void;
}

type ModalCategory = 'scams' | 'accounts' | 'scammed' | null;

export const SafetyHubView: React.FC<SafetyHubViewProps> = ({ onSelectTab }) => {
  // Warning notice banner state
  const [isNoticeVisible, setIsNoticeVisible] = useState(true);

  // Interactive checklist state (persisted locally in session)
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    otp: false,
    recipient: false,
    address: false,
    apps: false
  });

  // Modal detail view state
  const [activeModal, setActiveModal] = useState<ModalCategory>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const toggleChecklistItem = (key: string) => {
    setChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = Object.keys(checklist).length;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. HERO SECTION */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#06140c] via-[#05110a] to-[#030906] p-6 sm:p-7 border border-[#00e676]/20 shadow-[0_0_30px_rgba(0,230,118,0.06)] overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Subtle decorative background glow */}
        <div className="absolute -left-12 -top-12 w-56 h-56 bg-[#00e676]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-12 -bottom-12 w-64 h-64 bg-[#00e676]/8 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Left: Title & Subtitle with Hex Shield */}
        <div className="flex items-center gap-4 sm:gap-5 z-10 min-w-0">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#00e676]/20 to-[#00b0ff]/10 border border-[#00e676]/40 flex items-center justify-center text-[#00e676] shadow-[0_0_25px_rgba(0,230,118,0.25)] shrink-0">
            <ShieldCheck className="w-8 h-8 sm:w-9 sm:h-9 text-[#00e676]" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#00e676] rounded-full border-2 border-[#030706] animate-pulse" />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Safety Hub
            </h1>
            <p className="text-xs sm:text-sm text-[#8fa396] mt-1 leading-snug">
              Practical steps to stay safe online and respond to cyber fraud.
            </p>
          </div>
        </div>

        {/* Hero Right: Security Network Illustration (Laptop • Cyber Shield Lock • Smartphone) */}
        <div className="relative flex items-center justify-center self-center md:self-auto shrink-0 z-10 py-1">
          {/* Concentric radar rings */}
          <div className="relative w-48 sm:w-56 h-20 flex items-center justify-between px-3">
            {/* Connecting circuit lines */}
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#00e676]/30 to-transparent" />
            <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 h-16 border border-[#00e676]/15 rounded-full pointer-events-none" />

            {/* Laptop Node */}
            <div className="relative z-10 w-11 h-11 rounded-full bg-[#030c07] border border-[#00e676]/35 flex items-center justify-center text-[#6e8d7a] shadow-[0_0_12px_rgba(0,230,118,0.12)] hover:text-[#00e676] transition-colors">
              <Laptop className="w-5 h-5 text-[#8fa396]" />
            </div>

            {/* Center Glowing Shield Lock Node */}
            <div className="relative z-20 w-16 h-16 rounded-2xl bg-gradient-to-b from-[#00e676]/25 to-[#062414] border-2 border-[#00e676]/60 flex items-center justify-center text-[#00e676] shadow-[0_0_24px_rgba(0,230,118,0.35)]">
              <Shield className="w-8 h-8 text-[#00e676]" />
              <Lock className="w-4 h-4 text-white absolute" />
            </div>

            {/* Smartphone Node */}
            <div className="relative z-10 w-11 h-11 rounded-full bg-[#030c07] border border-[#00e676]/35 flex items-center justify-center text-[#6e8d7a] shadow-[0_0_12px_rgba(0,230,118,0.12)] hover:text-[#00e676] transition-colors">
              <Smartphone className="w-5 h-5 text-[#8fa396]" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. IMPORTANT SAFETY NOTICE (AMBER BANNER) */}
      {isNoticeVisible && (
        <div className="rounded-xl bg-[#161206] border border-[#f59e0b]/40 px-4 py-3 sm:px-5 flex items-center justify-between gap-3 shadow-[0_0_18px_rgba(245,158,11,0.08)] transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#f59e0b]/20 border border-[#f59e0b]/40 flex items-center justify-center text-[#f59e0b] shrink-0">
              <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
            </div>
            <p className="text-xs sm:text-sm text-[#fef3c7] font-medium leading-relaxed">
              If money has been lost to cyber fraud, contact your bank immediately and report it through the official cybercrime reporting channel.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveModal('scammed')}
              className="hidden sm:inline-flex px-3 py-1 text-xs font-semibold rounded-lg bg-[#f59e0b]/20 hover:bg-[#f59e0b]/30 text-[#fef3c7] border border-[#f59e0b]/40 transition-colors"
            >
              Emergency Steps
            </button>
            <button
              onClick={() => setIsNoticeVisible(false)}
              className="p-1 text-[#f59e0b]/70 hover:text-white transition-colors rounded-lg"
              title="Dismiss Notice"
              aria-label="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. THREE GUIDANCE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Recognize Scams */}
        <div 
          onClick={() => setActiveModal('scams')}
          className="rounded-2xl bg-[#06140c]/90 border border-[#00e676]/20 hover:border-[#00e676]/60 p-5 flex flex-col justify-between gap-4 transition-all duration-200 group cursor-pointer shadow-[0_0_20px_rgba(0,230,118,0.04)] hover:shadow-[0_0_25px_rgba(0,230,118,0.12)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#0284c7]/20 border border-[#0284c7]/40 flex items-center justify-center text-[#38bdf8] shrink-0 shadow-sm">
                <UserCheck className="w-5 h-5 text-[#38bdf8]" />
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-base font-bold text-white group-hover:text-[#00e676] transition-colors leading-tight">
                  Recognize Scams
                </h3>
                <p className="text-xs text-[#8fa396] mt-0.5 leading-tight">
                  Be aware of common cyber fraud methods.
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#6e8d7a] group-hover:text-[#00e676] group-hover:translate-x-1 transition-all shrink-0 mt-1" />
          </div>

          <ul className="flex flex-col gap-2.5 pt-1">
            <li className="flex items-start gap-2.5 text-xs text-[#c8ddd0] leading-snug">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0 mt-1.5" />
              <span>Watch out for phishing links in messages and emails.</span>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-[#c8ddd0] leading-snug">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0 mt-1.5" />
              <span>Do not trust fake customer-care numbers.</span>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-[#c8ddd0] leading-snug">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0 mt-1.5" />
              <span>Be cautious of payment and QR code scams.</span>
            </li>
          </ul>
        </div>

        {/* Card 2: Secure Your Accounts */}
        <div 
          onClick={() => setActiveModal('accounts')}
          className="rounded-2xl bg-[#06140c]/90 border border-[#00e676]/20 hover:border-[#00e676]/60 p-5 flex flex-col justify-between gap-4 transition-all duration-200 group cursor-pointer shadow-[0_0_20px_rgba(0,230,118,0.04)] hover:shadow-[0_0_25px_rgba(0,230,118,0.12)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#00e676]/20 border border-[#00e676]/40 flex items-center justify-center text-[#00e676] shrink-0 shadow-sm">
                <Lock className="w-5 h-5 text-[#00e676]" />
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-base font-bold text-white group-hover:text-[#00e676] transition-colors leading-tight">
                  Secure Your Accounts
                </h3>
                <p className="text-xs text-[#8fa396] mt-0.5 leading-tight">
                  Keep your digital identity safe.
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#6e8d7a] group-hover:text-[#00e676] group-hover:translate-x-1 transition-all shrink-0 mt-1" />
          </div>

          <ul className="flex flex-col gap-2.5 pt-1">
            <li className="flex items-start gap-2.5 text-xs text-[#c8ddd0] leading-snug">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0 mt-1.5" />
              <span>Use strong and unique passwords.</span>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-[#c8ddd0] leading-snug">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0 mt-1.5" />
              <span>Enable two-step verification (2FA) where available.</span>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-[#c8ddd0] leading-snug">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0 mt-1.5" />
              <span>Never share your OTPs with anyone.</span>
            </li>
          </ul>
        </div>

        {/* Card 3: If You've Been Scammed */}
        <div 
          onClick={() => setActiveModal('scammed')}
          className="rounded-2xl bg-[#06140c]/90 border border-red-500/30 hover:border-red-500/60 p-5 flex flex-col justify-between gap-4 transition-all duration-200 group cursor-pointer shadow-[0_0_20px_rgba(239,68,68,0.06)] hover:shadow-[0_0_25px_rgba(239,68,68,0.15)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 shadow-sm">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors leading-tight">
                  If You've Been Scammed
                </h3>
                <p className="text-xs text-[#8fa396] mt-0.5 leading-tight">
                  Take quick and correct action.
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#6e8d7a] group-hover:text-red-400 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
          </div>

          <ul className="flex flex-col gap-2.5 pt-1">
            <li className="flex items-start gap-2.5 text-xs text-[#c8ddd0] leading-snug">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0 mt-1.5" />
              <span>Preserve screenshots, messages and transaction details.</span>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-[#c8ddd0] leading-snug">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0 mt-1.5" />
              <span>Contact your bank or payment provider promptly.</span>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-[#c8ddd0] leading-snug">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0 mt-1.5" />
              <span>File a complaint on CCIP to report the incident.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 4. MIDDLE TWO-COLUMN GRID: CHECKLIST & USEFUL ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Quick Safety Checklist */}
        <div className="rounded-2xl bg-[#06140c]/90 border border-[#00e676]/20 p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-[0_0_20px_rgba(0,230,118,0.04)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0">
                <CheckSquare className="w-5 h-5 text-[#00e676]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Quick Safety Checklist
                </h3>
                <p className="text-xs text-[#8fa396]">
                  Follow these key steps to stay safe online.
                </p>
              </div>
            </div>

            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#00e676]/15 border border-[#00e676]/30 text-[#00e676]">
              {completedCount} of {totalCount} completed
            </span>
          </div>

          <div className="flex flex-col gap-3 pt-1">
            {/* Item 1 */}
            <label 
              onClick={() => toggleChecklistItem('otp')}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                checklist.otp 
                  ? 'bg-[#00e676]/10 border-[#00e676]/40 text-white' 
                  : 'bg-[#030706] border-white/[0.08] hover:border-[#00e676]/30 text-[#c8ddd0]'
              }`}
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                checklist.otp ? 'bg-[#00e676] border-[#00e676] text-[#030706]' : 'border-[#4e725b] bg-[#07170e]'
              }`}>
                {checklist.otp && <CheckCircle2 className="w-4 h-4 text-[#030706] stroke-[3]" />}
              </div>
              <span className={`text-xs font-medium leading-tight ${checklist.otp ? 'line-through text-[#8fa396]' : ''}`}>
                Never share your OTP or UPI PIN
              </span>
            </label>

            {/* Item 2 */}
            <label 
              onClick={() => toggleChecklistItem('recipient')}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                checklist.recipient 
                  ? 'bg-[#00e676]/10 border-[#00e676]/40 text-white' 
                  : 'bg-[#030706] border-white/[0.08] hover:border-[#00e676]/30 text-[#c8ddd0]'
              }`}
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                checklist.recipient ? 'bg-[#00e676] border-[#00e676] text-[#030706]' : 'border-[#4e725b] bg-[#07170e]'
              }`}>
                {checklist.recipient && <CheckCircle2 className="w-4 h-4 text-[#030706] stroke-[3]" />}
              </div>
              <span className={`text-xs font-medium leading-tight ${checklist.recipient ? 'line-through text-[#8fa396]' : ''}`}>
                Verify the recipient before approving payment
              </span>
            </label>

            {/* Item 3 */}
            <label 
              onClick={() => toggleChecklistItem('address')}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                checklist.address 
                  ? 'bg-[#00e676]/10 border-[#00e676]/40 text-white' 
                  : 'bg-[#030706] border-white/[0.08] hover:border-[#00e676]/30 text-[#c8ddd0]'
              }`}
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                checklist.address ? 'bg-[#00e676] border-[#00e676] text-[#030706]' : 'border-[#4e725b] bg-[#07170e]'
              }`}>
                {checklist.address && <CheckCircle2 className="w-4 h-4 text-[#030706] stroke-[3]" />}
              </div>
              <span className={`text-xs font-medium leading-tight ${checklist.address ? 'line-through text-[#8fa396]' : ''}`}>
                Check the website address before signing in
              </span>
            </label>

            {/* Item 4 */}
            <label 
              onClick={() => toggleChecklistItem('apps')}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                checklist.apps 
                  ? 'bg-[#00e676]/10 border-[#00e676]/40 text-white' 
                  : 'bg-[#030706] border-white/[0.08] hover:border-[#00e676]/30 text-[#c8ddd0]'
              }`}
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                checklist.apps ? 'bg-[#00e676] border-[#00e676] text-[#030706]' : 'border-[#4e725b] bg-[#07170e]'
              }`}>
                {checklist.apps && <CheckCircle2 className="w-4 h-4 text-[#030706] stroke-[3]" />}
              </div>
              <span className={`text-xs font-medium leading-tight ${checklist.apps ? 'line-through text-[#8fa396]' : ''}`}>
                Avoid installing apps sent by unknown callers
              </span>
            </label>
          </div>
        </div>

        {/* Right: Useful Actions */}
        <div className="rounded-2xl bg-[#06140c]/90 border border-[#00e676]/20 p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-[0_0_20px_rgba(0,230,118,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0">
              <Zap className="w-5 h-5 text-[#00e676]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Useful Actions
              </h3>
              <p className="text-xs text-[#8fa396]">
                Quick access to important tools and services.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-1">
            {/* Action 1: Open AI Cyber Shield */}
            <button
              onClick={() => onSelectTab('ai-shield')}
              className="group flex items-center justify-between p-3.5 rounded-xl bg-[#030706] border border-[#00e676]/20 hover:border-[#00e676]/60 hover:bg-[#00e676]/10 transition-all text-left shadow-sm hover:shadow-[0_0_15px_rgba(0,230,118,0.15)]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5 text-[#00e676]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-white group-hover:text-[#00e676] transition-colors">
                    Open AI Cyber Shield
                  </span>
                  <span className="text-[11px] text-[#8fa396] truncate">
                    Check URLs, emails, SMS and mobile numbers.
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#6e8d7a] group-hover:text-[#00e676] group-hover:translate-x-1 transition-all shrink-0" />
            </button>

            {/* Action 2: File a Complaint */}
            <button
              onClick={() => onSelectTab('file-complaint')}
              className="group flex items-center justify-between p-3.5 rounded-xl bg-[#030706] border border-[#00e676]/20 hover:border-[#00e676]/60 hover:bg-[#00e676]/10 transition-all text-left shadow-sm hover:shadow-[0_0_15px_rgba(0,230,118,0.15)]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5 text-[#00e676]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-white group-hover:text-[#00e676] transition-colors">
                    File a Complaint
                  </span>
                  <span className="text-[11px] text-[#8fa396] truncate">
                    Report a cyber fraud or suspicious activity.
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#6e8d7a] group-hover:text-[#00e676] group-hover:translate-x-1 transition-all shrink-0" />
            </button>

            {/* Action 3: View My Complaints */}
            <button
              onClick={() => onSelectTab('my-complaints')}
              className="group flex items-center justify-between p-3.5 rounded-xl bg-[#030706] border border-[#00e676]/20 hover:border-[#00e676]/60 hover:bg-[#00e676]/10 transition-all text-left shadow-sm hover:shadow-[0_0_15px_rgba(0,230,118,0.15)]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0 group-hover:scale-105 transition-transform">
                  <FolderOpen className="w-5 h-5 text-[#00e676]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-white group-hover:text-[#00e676] transition-colors">
                    View My Complaints
                  </span>
                  <span className="text-[11px] text-[#8fa396] truncate">
                    Track the status of your submitted complaints.
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#6e8d7a] group-hover:text-[#00e676] group-hover:translate-x-1 transition-all shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM SECTION: LATEST SAFETY ADVICE */}
      <div className="rounded-2xl bg-[#06140c]/90 border border-[#00e676]/20 p-5 sm:p-6 flex flex-col gap-4 shadow-[0_0_20px_rgba(0,230,118,0.04)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0">
              <Lightbulb className="w-5 h-5 text-[#00e676]" />
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="text-base font-bold text-white tracking-tight">
                Latest Safety Advice
              </h3>
              <p className="text-xs text-[#8fa396] truncate">
                Important reminders to stay safe in the digital world.
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectTab('awareness')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#00e676] hover:text-[#69f0ae] hover:underline transition-all shrink-0"
          >
            <span>View More</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Advice 1: QR Codes */}
          <div className="p-4 rounded-xl bg-[#030706] border border-[#00e676]/15 flex items-center gap-3.5 hover:border-[#00e676]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#07170e] border border-[#00e676]/25 flex items-center justify-center text-[#00e676] shrink-0 shadow-sm">
              <QrCode className="w-5 h-5 text-[#00e676]" />
            </div>
            <p className="text-xs sm:text-sm text-[#c8ddd0] leading-relaxed">
              QR codes do not receive money; scan only when you trust the payment request.
            </p>
          </div>

          {/* Advice 2: Banks & OTPs */}
          <div className="p-4 rounded-xl bg-[#030706] border border-[#00e676]/15 flex items-center gap-3.5 hover:border-[#00e676]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#07170e] border border-[#00e676]/25 flex items-center justify-center text-[#00e676] shrink-0 shadow-sm">
              <Landmark className="w-5 h-5 text-[#00e676]" />
            </div>
            <p className="text-xs sm:text-sm text-[#c8ddd0] leading-relaxed">
              Banks and official support teams do not ask you to disclose your OTP.
            </p>
          </div>
        </div>
      </div>

      {/* 6. EXPANDED DETAIL MODAL DIALOGS */}
      {activeModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setActiveModal(null)}
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-[#06140c] border border-[#00e676]/30 p-6 flex flex-col gap-5 shadow-[0_0_50px_rgba(0,230,118,0.2)] max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#00e676]/20">
              <div className="flex items-center gap-3">
                {activeModal === 'scams' && (
                  <div className="w-10 h-10 rounded-xl bg-[#0284c7]/20 border border-[#0284c7]/40 flex items-center justify-center text-[#38bdf8]">
                    <UserCheck className="w-5 h-5" />
                  </div>
                )}
                {activeModal === 'accounts' && (
                  <div className="w-10 h-10 rounded-xl bg-[#00e676]/20 border border-[#00e676]/40 flex items-center justify-center text-[#00e676]">
                    <Lock className="w-5 h-5" />
                  </div>
                )}
                {activeModal === 'scammed' && (
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {activeModal === 'scams' && 'Recognizing Cyber Scams'}
                    {activeModal === 'accounts' && 'Securing Your Digital Accounts'}
                    {activeModal === 'scammed' && "Emergency Steps: If You've Been Scammed"}
                  </h3>
                  <p className="text-xs text-[#8fa396]">
                    {activeModal === 'scams' && 'Practical indicators to identify deceptive tactics'}
                    {activeModal === 'accounts' && 'Essential habits to protect your online identity'}
                    {activeModal === 'scammed' && 'Time-sensitive recovery and reporting protocol'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-[#8fa396] hover:text-white hover:bg-white/[0.06] transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="flex flex-col gap-4 text-xs text-[#c8ddd0] leading-relaxed">
              {activeModal === 'scams' && (
                <>
                  <div className="p-3.5 rounded-xl bg-[#030706] border border-[#00e676]/15 flex flex-col gap-2">
                    <span className="font-bold text-white text-xs flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#00e676]" />
                      Phishing & Malicious Links
                    </span>
                    <p className="text-[#8fa396]">
                      Scammers send urgent SMS or emails claiming your electricity, bank account, or parcel delivery will be suspended unless you click immediately. Always check the domain URL carefully.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#030706] border border-[#00e676]/15 flex flex-col gap-2">
                    <span className="font-bold text-white text-xs flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-[#00e676]" />
                      Fake Customer Support & Remote Access
                    </span>
                    <p className="text-[#8fa396]">
                      Search engine ads often show fake helpline numbers. Fraudsters urge you to install screen-sharing apps (AnyDesk, TeamViewer) to drain funds. Never install apps instructed by callers.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#030706] border border-[#00e676]/15 flex flex-col gap-2">
                    <span className="font-bold text-white text-xs flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-[#00e676]" />
                      QR Code & Payment Request Scams
                    </span>
                    <p className="text-[#8fa396]">
                      Scanning a QR code or entering your UPI PIN always DEDUCTS money from your bank account. You never need to enter a PIN to receive payments.
                    </p>
                  </div>

                  <button
                    onClick={() => { setActiveModal(null); onSelectTab('ai-shield'); }}
                    className="w-full py-2.5 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-[#030706] font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,230,118,0.2)] transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Scan Suspicious Link in AI Cyber Shield</span>
                  </button>
                </>
              )}

              {activeModal === 'accounts' && (
                <>
                  <div className="p-3.5 rounded-xl bg-[#030706] border border-[#00e676]/15 flex flex-col gap-2">
                    <span className="font-bold text-white text-xs">1. Password Hygiene</span>
                    <p className="text-[#8fa396]">
                      Avoid using birthdays, names, or common patterns. Use at least 14 characters combining upper, lower, numbers, and symbols.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#030706] border border-[#00e676]/15 flex flex-col gap-2">
                    <span className="font-bold text-white text-xs">2. Two-Factor Authentication (2FA)</span>
                    <p className="text-[#8fa396]">
                      Enable authenticator apps (Google Authenticator, Microsoft Authenticator) or hardware keys on your email and banking portals instead of SMS OTPs where possible.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#030706] border border-[#00e676]/15 flex flex-col gap-2">
                    <span className="font-bold text-white text-xs">3. Review Active Sessions</span>
                    <p className="text-[#8fa396]">
                      Regularly inspect logged-in devices in your Google, WhatsApp, and banking security settings and terminate unrecognized active sessions.
                    </p>
                  </div>

                  <button
                    onClick={() => { setActiveModal(null); onSelectTab('settings'); }}
                    className="w-full py-2.5 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-[#030706] font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,230,118,0.2)] transition-all"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Manage Account Security Settings</span>
                  </button>
                </>
              )}

              {activeModal === 'scammed' && (
                <>
                  <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/40 flex flex-col gap-2">
                    <span className="font-bold text-red-400 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      1. Urgent Action (Immediate)
                    </span>
                    <p className="text-[#fecaca]">
                      Call your bank or payment provider immediately to freeze the transaction and block affected cards/accounts. In India, dial <strong>1930</strong> immediately to report financial fraud to the National Cyber Crime Reporting Portal.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#030706] border border-[#00e676]/15 flex flex-col gap-2">
                    <span className="font-bold text-white text-xs">2. Preserve Evidentiary Records</span>
                    <p className="text-[#8fa396]">
                      Do not delete chat histories, SMS, emails, or call logs. Take full-screen screenshots displaying sender details, timestamps, UPI transaction IDs, and bank reference numbers.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#030706] border border-[#00e676]/15 flex flex-col gap-2">
                    <span className="font-bold text-white text-xs">3. File CCIP Forensic Complaint</span>
                    <p className="text-[#8fa396]">
                      Lodge a verified complaint via CCIP to record hash-verified evidence and initiate automated threat classification.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <a
                      href="tel:1930"
                      className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Call 1930 Helpline</span>
                    </a>

                    <button
                      onClick={() => { setActiveModal(null); onSelectTab('file-complaint'); }}
                      className="py-2.5 px-3 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-[#030706] font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,230,118,0.2)] transition-all"
                    >
                      <FileText className="w-4 h-4" />
                      <span>File CCIP Report</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
