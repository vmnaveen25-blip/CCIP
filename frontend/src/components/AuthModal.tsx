import React, { useState, useEffect } from 'react';
import { PortalRole, UserProfile } from '../types';
import { apiClient } from '../api/client';
import { 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  KeyRound, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  X, 
  Sparkles,
  Mail,
  User,
  AlertTriangle,
  Fingerprint,
  RotateCcw,
  ChevronRight
} from 'lucide-react';

export type AuthScreenType = 
  | 'selection'
  | 'citizen-login'
  | 'citizen-register'
  | 'staff-login'
  | 'forgot-password'
  | 'otp-verify'
  | 'new-password'
  | 'reset-success'
  | 'phone-onboard';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialScreen?: AuthScreenType;
  onAuthenticate: (role: PortalRole, initialTab?: string, user?: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialScreen = 'selection',
  onAuthenticate
}) => {
  const [currentScreen, setCurrentScreen] = useState<AuthScreenType>(initialScreen);
  
  // Citizen login states (strictly username/email and password, no OTP or Google)
  const [citizenIdentifier, setCitizenIdentifier] = useState('');
  const [citizenPassword, setCitizenPassword] = useState('');
  const [showCitizenPassword, setShowCitizenPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Citizen registration states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regConsent, setRegConsent] = useState(false);

  // Staff login states
  const [staffId, setStaffId] = useState('a.thorne@astraea.gov');
  const [staffPassword, setStaffPassword] = useState('AstraeaEnclave#42');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffMfaCode, setStaffMfaCode] = useState('849102');
  const [staffTargetRole, setStaffTargetRole] = useState<PortalRole>('specialist');

  // Password reset states
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Loading & error feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setCurrentScreen(initialScreen);
    setErrorMessage(null);
    setResetSuccess(false);
  }, [initialScreen, isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // Citizen Login Submit (Username / Email + Password Only)
  // -------------------------------------------------------------
  const handleCitizenLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = citizenIdentifier.trim();
    if (!identifier) {
      setErrorMessage('Please enter your username or email address.');
      return;
    }
    if (!citizenPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.login({
        email: identifier,
        password: citizenPassword
      });
      setIsLoading(false);
      onAuthenticate('citizen', undefined, res?.user);
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Authentication failed. Please verify your username and password.');
    }
  };

  // -------------------------------------------------------------
  // Staff Login Submit (Staff ID / Email + Password + Role)
  // -------------------------------------------------------------
  const handleStaffLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.login({
        email: staffId.trim(),
        password: staffPassword,
        mfa_code: staffMfaCode.trim() || undefined,
        target_role: staffTargetRole
      });
      setIsLoading(false);
      const target = res?.user?.portal_role || staffTargetRole;
      onAuthenticate(target as PortalRole, undefined, res?.user);
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Staff authentication rejected by Enclave.');
    }
  };

  // -------------------------------------------------------------
  // Citizen Registration Submit (Direct registration & sign-in)
  // -------------------------------------------------------------
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMessage('Please complete all required fields.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }
    if (regPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.registerCitizen({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword
      });
      setIsLoading(false);
      if (res && res.access_token) {
        onAuthenticate('citizen', undefined, res.user);
        onClose();
      } else {
        setCitizenIdentifier(regEmail.trim());
        setCitizenPassword(regPassword);
        setCurrentScreen('citizen-login');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Registration failed. Please check your information.');
    }
  };

  // -------------------------------------------------------------
  // Password Reset Submit
  // -------------------------------------------------------------
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setErrorMessage('Please enter your registered username or email.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await apiClient.forgotPassword(resetEmail.trim());
    } catch (e) {
      // Graceful fallback for demo
    }
    setIsLoading(false);
    setResetSuccess(true);
  };

  // Quick fill staff demo credentials when switching roles
  const handleSelectStaffRole = (role: PortalRole) => {
    setStaffTargetRole(role);
    if (role === 'specialist') {
      setStaffId('a.thorne@astraea.gov');
      setStaffPassword('AstraeaEnclave#42');
    } else if (role === 'aiml') {
      setStaffId('m.vance@ai-ops.gov');
      setStaffPassword('AstraeaEnclave#42');
    } else if (role === 'admin') {
      setStaffId('root@astraea.internal');
      setStaffPassword('AstraeaEnclave#42');
    }
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#00e676]/10 rounded-full blur-[140px]"></div>
      </div>

      {/* Backdrop Dismiss Area */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Solid Sleek Cyber Modal Card */}
      <div className="modal-panel relative w-full max-w-[440px] my-6 rounded-3xl p-6 sm:p-8 z-10 bg-[#06140c] border border-[#00e676]/25 shadow-[0_32px_96px_rgba(0,0,0,0.85)] text-white">
        
        {/* Top Header Ribbon */}
        <div className="flex items-center justify-between border-b border-[#00e676]/15 pb-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="pulse-dot online status-dot-glow bg-[#00e676]" aria-hidden="true" />
            <span className="text-[11px] font-mono tracking-wider uppercase font-semibold text-[#8fa396]">
              Access Gateway
            </span>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 rounded-lg text-[#8fa396] hover:text-white hover:bg-white/[0.08] transition-colors"
            aria-label="Close authentication modal (Escape)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ============================================================ */}
        {/* SCREEN 1: LOGIN SELECTION                                    */}
        {/* ============================================================ */}
        {currentScreen === 'selection' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            {/* Title & Subtitle */}
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-[#00e676]/15 border border-[#00e676]/30 text-[#00e676] flex items-center justify-center shadow-[0_0_24px_rgba(0,230,118,0.2)] mb-1">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight font-sans">
                Sign In to CCIP
              </h1>
              <p className="text-[#8fa396] text-xs leading-relaxed max-w-[300px]">
                Select your designated access portal to authenticate
              </p>
            </div>

            {/* Portal Selection Cards */}
            <div className="flex flex-col gap-3 pt-1">
              {/* Option 1: Citizen Portal */}
              <button
                type="button"
                onClick={() => setCurrentScreen('citizen-login')}
                className="group w-full rounded-2xl p-4 flex items-center justify-between bg-[#030906] hover:bg-[#081a10] border border-[#00e676]/20 hover:border-[#00e676]/50 transition-all duration-200 text-left shadow-sm hover:shadow-md cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#00e676]/15 text-[#00e676] border border-[#00e676]/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white group-hover:text-[#00e676] transition-colors">
                      Citizen Portal
                    </div>
                    <div className="text-xs text-[#8fa396] truncate mt-0.5">
                      File &amp; track cybercrime complaints
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-[#00e676] group-hover:translate-x-0.5 transition-all shrink-0 ml-3" />
              </button>

              {/* Option 2: Authorized Staff */}
              <button
                type="button"
                onClick={() => setCurrentScreen('staff-login')}
                className="group w-full rounded-2xl p-4 flex items-center justify-between bg-[#030906] hover:bg-[#081a10] border border-[#00e676]/20 hover:border-cyan-500/50 transition-all duration-200 text-left shadow-sm hover:shadow-md cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      Authorized Staff
                    </div>
                    <div className="text-xs text-[#8fa396] truncate mt-0.5">
                      Cybersecurity specialists, SOC analysts &amp; admins
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-3" />
              </button>
            </div>

            {/* Clean Footer Link */}
            <div className="pt-2 text-center text-xs text-[#8fa396] border-t border-[#00e676]/15">
              <span>New complainant? </span>
              <button
                type="button"
                onClick={() => setCurrentScreen('citizen-register')}
                className="text-[#00e676] hover:text-[#55ff99] font-semibold transition-colors underline-offset-4 hover:underline"
              >
                Register Citizen Account
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SCREEN 2: CITIZEN LOGIN (Username/Email and Password Only)    */}
        {/* ============================================================ */}
        {currentScreen === 'citizen-login' && (
          <form onSubmit={handleCitizenLoginSubmit} className="flex flex-col gap-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <button 
                type="button"
                onClick={() => setCurrentScreen('selection')}
                className="text-xs text-[#8fa396] hover:text-white flex items-center gap-1.5 font-mono"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Choices
              </button>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00e676]/15 text-[#00e676] border border-[#00e676]/30 font-bold">
                CITIZEN ACCESS
              </span>
            </div>

            <div className="text-center mt-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">Citizen Sign In</h2>
              <p className="text-xs text-[#8fa396] mt-1">Enter your username or email and password to access your cases.</p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex flex-col gap-3.5 text-xs mt-1">
              {/* Username or Email */}
              <div>
                <label className="text-zinc-300 font-semibold font-mono text-[11px] block mb-1.5 uppercase tracking-wider">
                  Username or Email Address
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-[#8fa396] absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={citizenIdentifier}
                    onChange={(e) => setCitizenIdentifier(e.target.value)}
                    placeholder="e.g. name@example.com or username"
                    className="w-full bg-[#030906] focus:bg-[#071910] text-white placeholder:text-[#8fa396]/50 rounded-xl pl-10 pr-4 py-3 outline-none border border-[#00e676]/20 focus:border-[#00e676] focus:ring-1 focus:ring-[#00e676]/30 text-xs font-sans transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-zinc-300 font-semibold font-mono text-[11px] uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('forgot-password')}
                    className="text-[#00e676] hover:text-[#55ff99] underline-offset-4 hover:underline text-[11px]"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <KeyRound className="w-4 h-4 text-[#8fa396] absolute left-3.5 pointer-events-none" />
                  <input
                    type={showCitizenPassword ? 'text' : 'password'}
                    required
                    value={citizenPassword}
                    onChange={(e) => setCitizenPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full bg-[#030906] focus:bg-[#071910] text-white placeholder:text-[#8fa396]/50 rounded-xl pl-10 pr-10 py-3 outline-none border border-[#00e676]/20 focus:border-[#00e676] focus:ring-1 focus:ring-[#00e676]/30 text-xs font-sans transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCitizenPassword(!showCitizenPassword)}
                    className="absolute right-3 p-1 text-[#8fa396] hover:text-white"
                    title={showCitizenPassword ? "Hide password" : "Show password"}
                  >
                    {showCitizenPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300 text-xs select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#00e676]/30 bg-[#030906] text-[#00e676] focus:ring-[#00e676]/20"
                  />
                  <span>Remember me on this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00e676] to-[#00c853] text-[#031508] font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,230,118,0.3)] hover:brightness-110 transition-all flex items-center justify-center gap-2 mt-1 disabled:opacity-50"
              >
                {isLoading ? (
                  <Sparkles className="w-4 h-4 animate-spin text-[#031508]" />
                ) : (
                  <span>Sign In to Citizen Portal</span>
                )}
              </button>
            </div>

            <div className="text-center text-xs text-[#8fa396] pt-2 border-t border-[#00e676]/15 mt-1">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setCurrentScreen('citizen-register')}
                className="text-[#00e676] hover:text-[#55ff99] font-bold underline underline-offset-4 ml-1"
              >
                Create Citizen Account
              </button>
            </div>
          </form>
        )}

        {/* ============================================================ */}
        {/* SCREEN 3: CITIZEN REGISTRATION (Simple, no OTP required)     */}
        {/* ============================================================ */}
        {currentScreen === 'citizen-register' && (
          <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <button 
                type="button"
                onClick={() => setCurrentScreen('citizen-login')}
                className="text-xs text-[#8fa396] hover:text-white flex items-center gap-1.5 font-mono"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </button>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00e676]/15 text-[#00e676] border border-[#00e676]/30 font-bold">
                NEW CITIZEN
              </span>
            </div>

            <div className="text-center mt-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">Create Citizen Account</h2>
              <p className="text-xs text-[#8fa396] mt-1">Register for verified, secure cybercrime complaint tracking.</p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex flex-col gap-3 text-xs mt-1">
              <div>
                <label className="text-zinc-300 font-semibold font-mono text-[11px] block mb-1 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-[#8fa396] absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full bg-[#030906] focus:bg-[#071910] text-white placeholder:text-[#8fa396]/50 rounded-xl pl-10 pr-4 py-2.5 outline-none border border-[#00e676]/20 focus:border-[#00e676] text-xs font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold font-mono text-[11px] block mb-1 uppercase tracking-wider">
                  Email Address / Username
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-[#8fa396] absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#030906] focus:bg-[#071910] text-white placeholder:text-[#8fa396]/50 rounded-xl pl-10 pr-4 py-2.5 outline-none border border-[#00e676]/20 focus:border-[#00e676] text-xs font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-zinc-300 font-semibold font-mono text-[11px] block mb-1 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="8+ characters"
                      className="w-full bg-[#030906] focus:bg-[#071910] text-white placeholder:text-[#8fa396]/50 rounded-xl px-3 pr-8 py-2.5 outline-none border border-[#00e676]/20 focus:border-[#00e676] text-xs font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2 p-1 text-[#8fa396] hover:text-white"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold font-mono text-[11px] block mb-1 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-[#030906] focus:bg-[#071910] text-white placeholder:text-[#8fa396]/50 rounded-xl px-3 py-2.5 outline-none border border-[#00e676]/20 focus:border-[#00e676] text-xs font-sans"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer text-zinc-300 text-[11px] pt-1 select-none">
                <input
                  type="checkbox"
                  required
                  checked={regConsent}
                  onChange={(e) => setRegConsent(e.target.checked)}
                  className="rounded border-[#00e676]/30 bg-[#030906] text-[#00e676] focus:ring-[#00e676]/20 mt-0.5"
                />
                <span>I agree to platform terms of service and accurate reporting declarations.</span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00e676] to-[#00c853] text-[#031508] font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,230,118,0.3)] hover:brightness-110 transition-all flex items-center justify-center gap-2 mt-1 disabled:opacity-50"
              >
                {isLoading ? <Sparkles className="w-4 h-4 animate-spin text-[#031508]" /> : <span>Create Account &amp; Proceed</span>}
              </button>

              <div className="text-center text-xs text-[#8fa396] pt-1">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setCurrentScreen('citizen-login')}
                  className="text-[#00e676] hover:text-[#55ff99] font-bold underline underline-offset-4 ml-1"
                >
                  Sign In
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ============================================================ */}
        {/* SCREEN 4: AUTHORIZED STAFF LOGIN                             */}
        {/* ============================================================ */}
        {currentScreen === 'staff-login' && (
          <form onSubmit={handleStaffLoginSubmit} className="flex flex-col gap-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <button 
                type="button"
                onClick={() => setCurrentScreen('selection')}
                className="text-xs text-[#8fa396] hover:text-white flex items-center gap-1.5 font-mono"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Choices
              </button>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold">
                ENCLAVE ACCESS
              </span>
            </div>

            <div className="text-center mt-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">Authorized Staff Access</h2>
              <p className="text-xs text-[#8fa396] mt-1">Authenticate using official credentials and hardware authorization.</p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Quick Role Simulator Selector */}
            <div className="p-3 rounded-xl bg-[#030906] border border-[#00e676]/20 flex flex-col gap-2">
              <span className="text-[10px] font-mono text-[#8fa396] uppercase tracking-wider block">
                Select Operational Role:
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                {[
                  { role: 'specialist' as PortalRole, label: 'Specialist SOC' },
                  { role: 'aiml' as PortalRole, label: 'AI/ML Lead' },
                  { role: 'admin' as PortalRole, label: 'System Admin' },
                ].map((r) => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => handleSelectStaffRole(r.role)}
                    className={`p-2 rounded-lg text-left transition-all text-xs font-semibold ${
                      staffTargetRole === r.role
                        ? 'bg-gradient-to-r from-[#00e676] to-[#00c853] text-[#031508] shadow-sm font-bold'
                        : 'bg-[#06140c] text-[#8fa396] hover:text-white hover:bg-[#0a2214]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-zinc-300 font-semibold font-mono text-[11px] block mb-1.5 uppercase tracking-wider">
                  Staff ID / Official Email
                </label>
                <input
                  type="text"
                  required
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="e.g. a.thorne@astraea.gov"
                  className="w-full bg-[#030906] focus:bg-[#071910] text-white placeholder:text-[#8fa396]/50 rounded-xl px-4 py-2.5 outline-none border border-[#00e676]/20 focus:border-cyan-500 text-xs font-sans font-medium"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold font-mono text-[11px] block mb-1.5 uppercase tracking-wider">
                  Security Passphrase
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showStaffPassword ? 'text' : 'password'}
                    required
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full bg-[#030906] focus:bg-[#071910] text-white placeholder:text-[#8fa396]/50 rounded-xl pl-4 pr-10 py-2.5 outline-none border border-[#00e676]/20 focus:border-cyan-500 text-xs font-sans font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffPassword(!showStaffPassword)}
                    className="absolute right-3 p-1 text-[#8fa396] hover:text-white"
                  >
                    {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold font-mono text-[11px] block mb-1.5 uppercase tracking-wider">
                  Hardware Token / MFA Token
                </label>
                <input
                  type="text"
                  value={staffMfaCode}
                  onChange={(e) => setStaffMfaCode(e.target.value)}
                  placeholder="6-digit code or FIDO token"
                  className="w-full bg-[#030906] focus:bg-[#071910] text-white placeholder:text-[#8fa396]/50 rounded-xl px-4 py-2.5 outline-none border border-[#00e676]/20 focus:border-cyan-500 text-xs font-mono font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/25 transition-all flex items-center justify-center gap-2 mt-1 disabled:opacity-50"
              >
                {isLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <span>Authenticate &amp; Enter Enclave</span>}
              </button>
            </div>
          </form>
        )}

        {/* ============================================================ */}
        {/* SCREEN 5: FORGOT PASSWORD                                    */}
        {/* ============================================================ */}
        {currentScreen === 'forgot-password' && (
          <form onSubmit={handleResetSubmit} className="flex flex-col gap-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <button 
                type="button"
                onClick={() => setCurrentScreen('citizen-login')}
                className="text-xs text-[#8fa396] hover:text-white flex items-center gap-1.5 font-mono"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </button>
            </div>

            <div className="text-center mt-1">
              <div className="w-12 h-12 rounded-2xl bg-[#030906] border border-[#00e676]/30 flex items-center justify-center text-[#00e676] mx-auto mb-2 shadow-[0_0_15px_rgba(0,230,118,0.2)]">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Reset Password</h2>
              <p className="text-xs text-[#8fa396] mt-1 max-w-sm mx-auto">
                Enter your registered username or email to receive recovery instructions.
              </p>
            </div>

            {resetSuccess ? (
              <div className="p-4 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 text-[#00e676] text-xs flex flex-col gap-3 items-center text-center">
                <CheckCircle2 className="w-8 h-8 text-[#00e676]" />
                <p>Password recovery instructions have been dispatched for your account.</p>
                <button
                  type="button"
                  onClick={() => setCurrentScreen('citizen-login')}
                  className="py-2 px-4 rounded-lg bg-gradient-to-r from-[#00e676] to-[#00c853] text-[#031508] font-bold text-xs transition-colors"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5 text-xs mt-1">
                <div>
                  <label className="text-zinc-300 font-semibold font-mono text-[11px] block mb-1.5 uppercase tracking-wider">
                    Username or Email
                  </label>
                  <input
                    type="text"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="e.g. elena.rostova or name@example.com"
                    className="w-full bg-[#030906] focus:bg-[#071910] text-white placeholder:text-[#8fa396]/50 rounded-xl px-4 py-3 outline-none border border-[#00e676]/20 focus:border-[#00e676] text-xs font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00e676] to-[#00c853] text-[#031508] font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,230,118,0.3)] hover:brightness-110 transition-all flex items-center justify-center gap-2 mt-1 disabled:opacity-50"
                >
                  {isLoading ? <Sparkles className="w-4 h-4 animate-spin text-[#031508]" /> : <span>Send Reset Instructions</span>}
                </button>
              </div>
            )}
          </form>
        )}

      </div>
    </div>
  );
};
