import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon,
  User, 
  Lock, 
  Bell, 
  Sliders, 
  Smartphone, 
  Database, 
  ChevronRight, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  Save, 
  Eye, 
  EyeOff, 
  Key, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  Trash2, 
  LogOut, 
  Check, 
  Globe, 
  Clock, 
  Moon, 
  Sun, 
  Laptop, 
  ExternalLink,
  Shield,
  Sparkles,
  Info
} from 'lucide-react';
import { UserProfile } from '../../types';

interface SettingsViewProps {
  currentUser?: UserProfile | null;
  onSelectTab: (tabId: string) => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

type ModalType = 
  | null 
  | 'account' 
  | 'security' 
  | 'notifications' 
  | 'display' 
  | 'devices' 
  | 'data-privacy';

interface SessionItem {
  id: string;
  device: string;
  browser: string;
  os: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  ip: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  currentUser, 
  onSelectTab,
  onShowToast 
}) => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Form State: Account Information
  const [fullName, setFullName] = useState(currentUser?.full_name || 'Priya Sharma');
  const [email, setEmail] = useState(currentUser?.email || 'priya.sharma@citizen.gov.in');
  const [phone, setPhone] = useState(currentUser?.phone_number || '+91 98765 43210');
  const [language, setLanguage] = useState('English (India)');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST)');
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // Form State: Security & 2FA
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [maskPhoneNumber, setMaskPhoneNumber] = useState(true);
  const [strictSessionTimeout, setStrictSessionTimeout] = useState(true);
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);

  // Form State: Notifications
  const [notifComplaintUpdates, setNotifComplaintUpdates] = useState(true);
  const [notifSecurityAlerts, setNotifSecurityAlerts] = useState(true);
  const [notifPlatformAnnouncements, setNotifPlatformAnnouncements] = useState(false);
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelSMS, setChannelSMS] = useState(true);
  const [channelInApp, setChannelInApp] = useState(true);

  // Form State: Display & Accessibility
  const [currentTheme, setCurrentTheme] = useState<'sovereign' | 'high-contrast'>('sovereign');
  const [fontSize, setFontSize] = useState<'standard' | 'large'>('standard');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [screenReaderOptimization, setScreenReaderOptimization] = useState(true);

  // Form State: Connected Devices
  const [sessions, setSessions] = useState<SessionItem[]>([
    {
      id: 'sess-1',
      device: 'Desktop Workstation',
      browser: 'Chrome 128.0',
      os: 'Windows 11 Sovereign Enclave',
      location: 'Bengaluru, Karnataka, India',
      lastActive: 'Active Now',
      isCurrent: true,
      ip: '103.21.244.18'
    },
    {
      id: 'sess-2',
      device: 'Apple iPhone 15 Pro',
      browser: 'Mobile Safari 17.5',
      os: 'iOS 18.0',
      location: 'Mumbai, Maharashtra, India',
      lastActive: '2 hours ago',
      isCurrent: false,
      ip: '49.36.128.92'
    },
    {
      id: 'sess-3',
      device: 'Personal Laptop',
      browser: 'Firefox 130.0',
      os: 'Ubuntu 24.04 LTS',
      location: 'New Delhi, India',
      lastActive: '3 days ago',
      isCurrent: false,
      ip: '115.240.90.14'
    }
  ]);

  // Form State: Data & Privacy Controls
  const [isExportingData, setIsExportingData] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAccount(true);
    setTimeout(() => {
      setIsSavingAccount(false);
      setActiveModal(null);
      if (onShowToast) onShowToast('Profile information updated successfully.', 'success');
    }, 800);
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      setSecuritySuccess('Passwords do not match. Please verify.');
      return;
    }
    setSecuritySuccess('Security settings and password updated successfully.');
    setTimeout(() => {
      setSecuritySuccess(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveModal(null);
      if (onShowToast) onShowToast('Account security preferences updated.', 'success');
    }, 1200);
  };

  const handleRevokeSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (onShowToast) onShowToast('Device session revoked successfully.', 'info');
  };

  const handleSignOutAllOtherDevices = () => {
    setSessions(prev => prev.filter(s => s.isCurrent));
    if (onShowToast) onShowToast('Signed out from all other active sessions.', 'success');
  };

  const handleExportData = () => {
    setIsExportingData(true);
    setTimeout(() => {
      setIsExportingData(false);
      const dataPayload = {
        citizenProfile: {
          name: fullName,
          email,
          phone,
          language,
          timezone,
          securityStatus: {
            twoFactorEnabled: is2FAEnabled,
            activeSessions: sessions.length
          }
        },
        exportGeneratedAt: new Date().toISOString(),
        sovereignEnclaveVerification: 'VERIFIED_SHA256_AUTHENTIC'
      };
      const blob = new Blob([JSON.stringify(dataPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CCIP_Citizen_Data_Export_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      if (onShowToast) onShowToast('Personal data export downloaded securely.', 'success');
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. HERO HEADER */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#06140c] via-[#05110a] to-[#030906] p-6 sm:p-7 border border-[#00e676]/20 shadow-[0_0_30px_rgba(0,230,118,0.06)] overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -left-12 -top-12 w-56 h-56 bg-[#00e676]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-12 -bottom-12 w-64 h-64 bg-[#00e676]/8 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Left: Title & Subtitle */}
        <div className="flex items-center gap-4 sm:gap-5 z-10 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#00e676]/20 to-[#00b0ff]/10 border border-[#00e676]/40 flex items-center justify-center text-[#00e676] shadow-[0_0_25px_rgba(0,230,118,0.25)] shrink-0">
            <SettingsIcon className="w-8 h-8 sm:w-9 sm:h-9 text-[#00e676]" />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Settings
            </h1>
            <p className="text-xs sm:text-sm text-[#8fa396] mt-1 leading-snug">
              Manage your account, security, preferences, and notification settings.
            </p>
          </div>
        </div>

        {/* Hero Right: Security Health Badge */}
        <div className="relative flex items-center gap-3 bg-[#030706]/80 border border-[#00e676]/30 px-4 py-2.5 rounded-xl self-start md:self-auto shrink-0 z-10 shadow-[0_0_15px_rgba(0,230,118,0.1)]">
          <div className="w-9 h-9 rounded-lg bg-[#00e676]/15 border border-[#00e676]/40 flex items-center justify-center text-[#00e676] shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#00e676]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#8fa396] uppercase tracking-wider font-bold">Account Health</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/40">
                94% SECURE
              </span>
            </div>
            <span className="text-xs font-semibold text-white mt-0.5">
              {is2FAEnabled ? '2FA Active' : '2FA Recommended'} • {sessions.length} Active Sessions
            </span>
          </div>
        </div>
      </div>

      {/* 2. THE SIX SETTINGS CARDS (Grid: 3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* CARD 1: Account Information */}
        <div
          onClick={() => setActiveModal('account')}
          className="rounded-2xl bg-[#06140c]/90 border border-[#00e676]/20 hover:border-[#00e676]/60 p-5 sm:p-6 flex flex-col justify-between gap-4 transition-all duration-200 group cursor-pointer shadow-[0_0_20px_rgba(0,230,118,0.04)] hover:shadow-[0_0_25px_rgba(0,230,118,0.12)]"
        >
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#0284c7]/20 border border-[#0284c7]/40 flex items-center justify-center text-[#38bdf8] shrink-0 shadow-sm mt-0.5">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h3 className="text-base font-bold text-white group-hover:text-[#00e676] transition-colors leading-snug">
                  Account Information
                </h3>
                <ChevronRight className="w-4 h-4 text-[#00e676] group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <p className="text-xs text-[#8fa396] mt-1 leading-snug">
                Personal details, contact information, language, and timezone.
              </p>
            </div>
          </div>

          <ul className="flex flex-col gap-2 pt-2 border-t border-white/[0.04]">
            <li className="flex items-center gap-2 text-xs text-[#c8ddd0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0" />
              <span>Name, email, and mobile number</span>
            </li>
            <li className="flex items-center gap-2 text-xs text-[#c8ddd0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0" />
              <span>Update profile information</span>
            </li>
            <li className="flex items-center gap-2 text-xs text-[#c8ddd0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0" />
              <span>Manage language and timezone</span>
            </li>
          </ul>

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
            <span className="text-[10px] font-mono text-[#8fa396] bg-[#030706] px-2 py-0.5 rounded border border-white/[0.06]">
              {fullName}
            </span>
            <span className="text-xs font-bold text-[#00e676] group-hover:underline flex items-center gap-1">
              Manage Account <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* CARD 2: Security & Privacy */}
        <div
          onClick={() => setActiveModal('security')}
          className="rounded-2xl bg-[#06140c]/90 border border-[#00e676]/20 hover:border-[#00e676]/60 p-5 sm:p-6 flex flex-col justify-between gap-4 transition-all duration-200 group cursor-pointer shadow-[0_0_20px_rgba(0,230,118,0.04)] hover:shadow-[0_0_25px_rgba(0,230,118,0.12)]"
        >
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#00e676]/20 border border-[#00e676]/40 flex items-center justify-center text-[#00e676] shrink-0 shadow-sm mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h3 className="text-base font-bold text-white group-hover:text-[#00e676] transition-colors leading-snug">
                  Security & Privacy
                </h3>
                <ChevronRight className="w-4 h-4 text-[#00e676] group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <p className="text-xs text-[#8fa396] mt-1 leading-snug">
                Password, two-factor authentication, and privacy preferences.
              </p>
            </div>
          </div>

          <ul className="flex flex-col gap-2 pt-2 border-t border-white/[0.04]">
            <li className="flex items-center gap-2 text-xs text-[#c8ddd0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0" />
              <span>Change password</span>
            </li>
            <li className="flex items-center justify-between gap-2 text-xs text-[#c8ddd0]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0" />
                <span>Two-factor authentication (2FA)</span>
              </div>
              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${is2FAEnabled ? 'bg-[#00e676]/15 text-[#00e676] border-[#00e676]/40' : 'bg-amber-500/15 text-amber-400 border-amber-500/40'}`}>
                {is2FAEnabled ? 'Enabled' : 'Not Enabled'}
              </span>
            </li>
            <li className="flex items-center gap-2 text-xs text-[#c8ddd0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0" />
              <span>Manage privacy and data preferences</span>
            </li>
          </ul>

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
            <span className="text-[10px] font-mono text-[#8fa396] bg-[#030706] px-2 py-0.5 rounded border border-white/[0.06]">
              SHA-256 Protected
            </span>
            <span className="text-xs font-bold text-[#00e676] group-hover:underline flex items-center gap-1">
              Security Controls <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* CARD 3: Notification Preferences */}
        <div
          onClick={() => setActiveModal('notifications')}
          className="rounded-2xl bg-[#06140c]/90 border border-[#00e676]/20 hover:border-[#00e676]/60 p-5 sm:p-6 flex flex-col justify-between gap-4 transition-all duration-200 group cursor-pointer shadow-[0_0_20px_rgba(0,230,118,0.04)] hover:shadow-[0_0_25px_rgba(0,230,118,0.12)]"
        >
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#f59e0b]/20 border border-[#f59e0b]/40 flex items-center justify-center text-[#f59e0b] shrink-0 shadow-sm mt-0.5">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h3 className="text-base font-bold text-white group-hover:text-[#00e676] transition-colors leading-snug">
                  Notification Preferences
                </h3>
                <ChevronRight className="w-4 h-4 text-[#00e676] group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <p className="text-xs text-[#8fa396] mt-1 leading-snug">
                Complaint updates, security alerts, and platform announcements.
              </p>
            </div>
          </div>

          <ul className="flex flex-col gap-2 pt-2 border-t border-white/[0.04]">
            <li className="flex items-center justify-between gap-2 text-xs text-[#c8ddd0]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0" />
                <span>Complaint status updates</span>
              </div>
              <span className="text-[9px] font-mono text-[#00e676]">Active</span>
            </li>
            <li className="flex items-center justify-between gap-2 text-xs text-[#c8ddd0]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0" />
                <span>Security alerts and advisories</span>
              </div>
              <span className="text-[9px] font-mono text-[#00e676]">Active</span>
            </li>
            <li className="flex items-center justify-between gap-2 text-xs text-[#c8ddd0]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0" />
                <span>Platform announcements</span>
              </div>
              <span className="text-[9px] font-mono text-[#8fa396]">Muted</span>
            </li>
          </ul>

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
            <span className="text-[10px] font-mono text-[#8fa396] bg-[#030706] px-2 py-0.5 rounded border border-white/[0.06]">
              Email & SMS
            </span>
            <span className="text-xs font-bold text-[#00e676] group-hover:underline flex items-center gap-1">
              Configure Alerts <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* CARD 4: Display & Accessibility */}
        <div
          onClick={() => setActiveModal('display')}
          className="rounded-2xl bg-[#06140c]/90 border border-[#00e676]/20 hover:border-[#00e676]/60 p-5 sm:p-6 flex flex-col justify-between gap-4 transition-all duration-200 group cursor-pointer shadow-[0_0_20px_rgba(0,230,118,0.04)] hover:shadow-[0_0_25px_rgba(0,230,118,0.12)]"
        >
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 flex items-center justify-center text-[#a78bfa] shrink-0 shadow-sm mt-0.5">
              <Sliders className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h3 className="text-base font-bold text-white group-hover:text-[#00e676] transition-colors leading-snug">
                  Display & Accessibility
                </h3>
                <ChevronRight className="w-4 h-4 text-[#00e676] group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <p className="text-xs text-[#8fa396] mt-1 leading-snug">
                Theme, language, and interface accessibility options.
              </p>
            </div>
          </div>

          <ul className="flex flex-col gap-2 pt-2 border-t border-white/[0.04]">
            <li className="flex items-center gap-2 text-xs text-[#c8ddd0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0" />
              <span>Theme and appearance</span>
            </li>
            <li className="flex items-center gap-2 text-xs text-[#c8ddd0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0" />
              <span>Language preferences</span>
            </li>
            <li className="flex items-center gap-2 text-xs text-[#c8ddd0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0" />
              <span>Accessibility options</span>
            </li>
          </ul>

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
            <span className="text-[10px] font-mono text-[#8fa396] bg-[#030706] px-2 py-0.5 rounded border border-white/[0.06]">
              Sovereign Cyber Dark
            </span>
            <span className="text-xs font-bold text-[#00e676] group-hover:underline flex items-center gap-1">
              Customize <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* CARD 5: Connected Devices */}
        <div
          onClick={() => setActiveModal('devices')}
          className="rounded-2xl bg-[#06140c]/90 border border-[#00e676]/20 hover:border-[#00e676]/60 p-5 sm:p-6 flex flex-col justify-between gap-4 transition-all duration-200 group cursor-pointer shadow-[0_0_20px_rgba(0,230,118,0.04)] hover:shadow-[0_0_25px_rgba(0,230,118,0.12)]"
        >
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#06b6d4]/20 border border-[#06b6d4]/40 flex items-center justify-center text-[#22d3ee] shrink-0 shadow-sm mt-0.5">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h3 className="text-base font-bold text-white group-hover:text-[#00e676] transition-colors leading-snug">
                  Connected Devices
                </h3>
                <ChevronRight className="w-4 h-4 text-[#00e676] group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <p className="text-xs text-[#8fa396] mt-1 leading-snug">
                Review active sessions and sign out other devices.
              </p>
            </div>
          </div>

          <ul className="flex flex-col gap-2 pt-2 border-t border-white/[0.04]">
            <li className="flex items-center gap-2 text-xs text-[#c8ddd0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0" />
              <span>View active sessions</span>
            </li>
            <li className="flex items-center gap-2 text-xs text-[#c8ddd0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0" />
              <span>Sign out from other devices</span>
            </li>
            <li className="flex items-center gap-2 text-xs text-[#c8ddd0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0" />
              <span>Device security and activity</span>
            </li>
          </ul>

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
            <span className="text-[10px] font-mono text-[#00e676] bg-[#00e676]/10 px-2 py-0.5 rounded border border-[#00e676]/30">
              {sessions.length} Active Sessions
            </span>
            <span className="text-xs font-bold text-[#00e676] group-hover:underline flex items-center gap-1">
              Review Sessions <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* CARD 6: Data & Privacy Controls */}
        <div
          onClick={() => setActiveModal('data-privacy')}
          className="rounded-2xl bg-[#06140c]/90 border border-[#00e676]/20 hover:border-[#00e676]/60 p-5 sm:p-6 flex flex-col justify-between gap-4 transition-all duration-200 group cursor-pointer shadow-[0_0_20px_rgba(0,230,118,0.04)] hover:shadow-[0_0_25px_rgba(0,230,118,0.12)]"
        >
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 shadow-sm mt-0.5">
              <Database className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h3 className="text-base font-bold text-white group-hover:text-[#00e676] transition-colors leading-snug">
                  Data & Privacy Controls
                </h3>
                <ChevronRight className="w-4 h-4 text-[#00e676] group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <p className="text-xs text-[#8fa396] mt-1 leading-snug">
                Download account data, manage available privacy choices, and request account deletion where supported.
              </p>
            </div>
          </div>

          <ul className="flex flex-col gap-2 pt-2 border-t border-white/[0.04]">
            <li className="flex items-center gap-2 text-xs text-[#c8ddd0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0" />
              <span>Download your data</span>
            </li>
            <li className="flex items-center gap-2 text-xs text-[#c8ddd0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0" />
              <span>Manage data permissions</span>
            </li>
            <li className="flex items-center gap-2 text-xs text-[#c8ddd0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_#00e676] shrink-0" />
              <span>Delete account (if applicable)</span>
            </li>
          </ul>

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
            <span className="text-[10px] font-mono text-[#8fa396] bg-[#030706] px-2 py-0.5 rounded border border-white/[0.06]">
              Statutory Storage
            </span>
            <span className="text-xs font-bold text-[#00e676] group-hover:underline flex items-center gap-1">
              Data Controls <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* 3. SOVEREIGN CITIZEN GUARANTEE BANNER */}
      <div className="rounded-2xl bg-[#06140c]/80 border border-[#00e676]/20 p-5 flex items-start gap-3.5 text-xs text-[#c8ddd0] shadow-sm">
        <ShieldCheck className="w-5 h-5 text-[#00e676] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-white text-sm">Citizen Privacy Isolation & Enclave Integrity</span>
          <p className="leading-relaxed text-[11px] text-[#8fa396]">
            In compliance with national cybersecurity standards, your personal preferences and credentials are cryptographically protected. Specialist forensic workspaces, cross-case suspect matrices, and internal law enforcement intelligence remain strictly isolated from your citizen account.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODALS FOR EACH OF THE SIX SETTINGS SECTIONS */}
      {/* ========================================================================= */}

      {/* MODAL 1: Account Information */}
      {activeModal === 'account' && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setActiveModal(null)}
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-[#06140c] border border-[#00e676]/30 p-6 flex flex-col gap-5 shadow-[0_0_50px_rgba(0,230,118,0.2)] max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#00e676]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0284c7]/20 border border-[#0284c7]/40 flex items-center justify-center text-[#38bdf8]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Account Information</h3>
                  <p className="text-xs text-[#8fa396]">Update your personal contact details and display preferences.</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-[#8fa396] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[#c8ddd0]">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  className="bg-[#030706] border border-[#00e676]/20 focus:border-[#00e676] rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[#c8ddd0]">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="bg-[#030706] border border-[#00e676]/20 focus:border-[#00e676] rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
                />
                <span className="text-[10px] text-[#6e8d7a]">Used for complaint tracking notifications and security alerts.</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[#c8ddd0]">Mobile Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  className="bg-[#030706] border border-[#00e676]/20 focus:border-[#00e676] rounded-xl px-3.5 py-2.5 text-white focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#c8ddd0]">Interface Language</label>
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    className="bg-[#030706] border border-[#00e676]/20 focus:border-[#00e676] rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="English (India)">English (India)</option>
                    <option value="Hindi (हिंदी)">Hindi (हिंदी)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#c8ddd0]">Default Timezone</label>
                  <select
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    className="bg-[#030706] border border-[#00e676]/20 focus:border-[#00e676] rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                    <option value="UTC (Coordinated Universal Time)">UTC (Universal Time)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#8fa396] hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAccount}
                  className="px-5 py-2 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-[#030706] font-bold shadow-[0_0_15px_rgba(0,230,118,0.25)] flex items-center gap-2"
                >
                  {isSavingAccount ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Security & Privacy */}
      {activeModal === 'security' && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setActiveModal(null)}
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-[#06140c] border border-[#00e676]/30 p-6 flex flex-col gap-5 shadow-[0_0_50px_rgba(0,230,118,0.2)] max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#00e676]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00e676]/20 border border-[#00e676]/40 flex items-center justify-center text-[#00e676]">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Security & Privacy</h3>
                  <p className="text-xs text-[#8fa396]">Password, two-factor authentication, and privacy options.</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-[#8fa396] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {securitySuccess && (
              <div className="p-3 rounded-xl bg-[#00e676]/15 border border-[#00e676]/40 flex items-center gap-2 text-[#00e676] text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{securitySuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveSecurity} className="flex flex-col gap-4 text-xs">
              {/* 2FA Toggle Box */}
              <div className="p-4 rounded-xl bg-[#030706] border border-[#00e676]/20 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-white text-xs">Two-Factor Authentication (2FA)</span>
                  <span className="text-[11px] text-[#8fa396]">Requires a 6-digit authenticator code when signing into CCIP.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${is2FAEnabled ? 'bg-[#00e676]' : 'bg-[#1a2820]'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${is2FAEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Password Change Fields */}
              <div className="flex flex-col gap-3 pt-1">
                <span className="font-bold text-white text-xs">Change Password</span>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#8fa396]">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full bg-[#030706] border border-[#00e676]/20 focus:border-[#00e676] rounded-xl px-3.5 py-2 text-white pr-9 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6e8d7a] hover:text-white"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#8fa396]">New Password</label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="bg-[#030706] border border-[#00e676]/20 focus:border-[#00e676] rounded-xl px-3.5 py-2 text-white focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#8fa396]">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="bg-[#030706] border border-[#00e676]/20 focus:border-[#00e676] rounded-xl px-3.5 py-2 text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Privacy Toggles */}
              <div className="flex flex-col gap-2.5 pt-2 border-t border-white/[0.06]">
                <span className="font-bold text-white text-xs">Privacy Controls</span>
                <label className="flex items-center justify-between p-2.5 rounded-lg bg-[#030706] border border-white/[0.04] cursor-pointer">
                  <span className="text-[#c8ddd0]">Mask mobile number in public case tracker</span>
                  <input
                    type="checkbox"
                    checked={maskPhoneNumber}
                    onChange={e => setMaskPhoneNumber(e.target.checked)}
                    className="accent-[#00e676] w-4 h-4 rounded cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between p-2.5 rounded-lg bg-[#030706] border border-white/[0.04] cursor-pointer">
                  <span className="text-[#c8ddd0]">Strict 15-minute idle session auto-lock</span>
                  <input
                    type="checkbox"
                    checked={strictSessionTimeout}
                    onChange={e => setStrictSessionTimeout(e.target.checked)}
                    className="accent-[#00e676] w-4 h-4 rounded cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#8fa396] hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-[#030706] font-bold shadow-[0_0_15px_rgba(0,230,118,0.25)] flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Security</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Notification Preferences */}
      {activeModal === 'notifications' && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setActiveModal(null)}
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-[#06140c] border border-[#00e676]/30 p-6 flex flex-col gap-5 shadow-[0_0_50px_rgba(0,230,118,0.2)] max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#00e676]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/20 border border-[#f59e0b]/40 flex items-center justify-center text-[#f59e0b]">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Notification Preferences</h3>
                  <p className="text-xs text-[#8fa396]">Choose which alerts you wish to receive.</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-[#8fa396] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-2">
                <span className="font-bold text-white">Alert Categories</span>
                <label className="flex items-center justify-between p-3 rounded-xl bg-[#030706] border border-[#00e676]/20 cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-bold text-[#c8ddd0]">Complaint Status Updates</span>
                    <span className="text-[11px] text-[#8fa396]">Receive updates when your investigation advances or evidence is reviewed.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifComplaintUpdates}
                    onChange={e => setNotifComplaintUpdates(e.target.checked)}
                    className="accent-[#00e676] w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-[#030706] border border-[#00e676]/20 cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-bold text-[#c8ddd0]">Security Alerts & Urgent Advisories</span>
                    <span className="text-[11px] text-[#8fa396]">Critical account alerts, new device logins, and verified scam bulletins.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifSecurityAlerts}
                    onChange={e => setNotifSecurityAlerts(e.target.checked)}
                    className="accent-[#00e676] w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-[#030706] border border-white/[0.06] cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-bold text-[#c8ddd0]">Platform Announcements</span>
                    <span className="text-[11px] text-[#8fa396]">General updates, system maintenance schedules, and feature news.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPlatformAnnouncements}
                    onChange={e => setNotifPlatformAnnouncements(e.target.checked)}
                    className="accent-[#00e676] w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
                <span className="font-bold text-white">Delivery Channels</span>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#030706] border border-white/[0.06] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channelEmail}
                      onChange={e => setChannelEmail(e.target.checked)}
                      className="accent-[#00e676] w-3.5 h-3.5"
                    />
                    <span className="text-[11px] text-[#c8ddd0]">Email</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#030706] border border-white/[0.06] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channelSMS}
                      onChange={e => setChannelSMS(e.target.checked)}
                      className="accent-[#00e676] w-3.5 h-3.5"
                    />
                    <span className="text-[11px] text-[#c8ddd0]">SMS</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#030706] border border-white/[0.06] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channelInApp}
                      onChange={e => setChannelInApp(e.target.checked)}
                      className="accent-[#00e676] w-3.5 h-3.5"
                    />
                    <span className="text-[11px] text-[#c8ddd0]">In-App Bell</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#8fa396] hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    if (onShowToast) onShowToast('Notification preferences saved.', 'success');
                  }}
                  className="px-5 py-2 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-[#030706] font-bold shadow-[0_0_15px_rgba(0,230,118,0.25)] flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Preferences</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Display & Accessibility */}
      {activeModal === 'display' && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setActiveModal(null)}
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-[#06140c] border border-[#00e676]/30 p-6 flex flex-col gap-5 shadow-[0_0_50px_rgba(0,230,118,0.2)] max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#00e676]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 flex items-center justify-center text-[#a78bfa]">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Display & Accessibility</h3>
                  <p className="text-xs text-[#8fa396]">Personalize the interface appearance and accessibility.</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-[#8fa396] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-2">
                <span className="font-bold text-white">Visual Theme</span>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setCurrentTheme('sovereign')}
                    className={`p-3.5 rounded-xl border cursor-pointer flex flex-col gap-2 transition-all ${currentTheme === 'sovereign' ? 'bg-[#00e676]/10 border-[#00e676] shadow-[0_0_12px_rgba(0,230,118,0.2)]' : 'bg-[#030706] border-white/[0.08]'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">Sovereign Dark</span>
                      {currentTheme === 'sovereign' && <Check className="w-4 h-4 text-[#00e676]" />}
                    </div>
                    <span className="text-[11px] text-[#8fa396]">Established CCIP black & neon-green scheme.</span>
                  </div>

                  <div
                    onClick={() => setCurrentTheme('high-contrast')}
                    className={`p-3.5 rounded-xl border cursor-pointer flex flex-col gap-2 transition-all ${currentTheme === 'high-contrast' ? 'bg-[#00e676]/10 border-[#00e676] shadow-[0_0_12px_rgba(0,230,118,0.2)]' : 'bg-[#030706] border-white/[0.08]'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">High Contrast</span>
                      {currentTheme === 'high-contrast' && <Check className="w-4 h-4 text-[#00e676]" />}
                    </div>
                    <span className="text-[11px] text-[#8fa396]">Maximum contrast text and element borders.</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
                <span className="font-bold text-white">Accessibility Options</span>
                <label className="flex items-center justify-between p-2.5 rounded-lg bg-[#030706] border border-white/[0.04] cursor-pointer">
                  <span className="text-[#c8ddd0]">Reduced motion & animations</span>
                  <input
                    type="checkbox"
                    checked={reducedMotion}
                    onChange={e => setReducedMotion(e.target.checked)}
                    className="accent-[#00e676] w-4 h-4 rounded cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between p-2.5 rounded-lg bg-[#030706] border border-white/[0.04] cursor-pointer">
                  <span className="text-[#c8ddd0]">Screen reader & keyboard assist tags</span>
                  <input
                    type="checkbox"
                    checked={screenReaderOptimization}
                    onChange={e => setScreenReaderOptimization(e.target.checked)}
                    className="accent-[#00e676] w-4 h-4 rounded cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#8fa396] hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    if (onShowToast) onShowToast('Display and accessibility options applied.', 'success');
                  }}
                  className="px-5 py-2 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-[#030706] font-bold shadow-[0_0_15px_rgba(0,230,118,0.25)] flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Apply Preferences</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Connected Devices */}
      {activeModal === 'devices' && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setActiveModal(null)}
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full max-w-xl rounded-2xl bg-[#06140c] border border-[#00e676]/30 p-6 flex flex-col gap-5 shadow-[0_0_50px_rgba(0,230,118,0.2)] max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#00e676]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#06b6d4]/20 border border-[#06b6d4]/40 flex items-center justify-center text-[#22d3ee]">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Connected Devices & Sessions</h3>
                  <p className="text-xs text-[#8fa396]">Review active login sessions and revoke unauthorized devices.</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-[#8fa396] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              {sessions.map(session => (
                <div 
                  key={session.id}
                  className="p-3.5 rounded-xl bg-[#030706] border border-[#00e676]/20 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-[#c8ddd0] shrink-0">
                      {session.device.includes('iPhone') ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white truncate">{session.device}</span>
                        {session.isCurrent && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/40">
                            THIS DEVICE
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#8fa396] truncate">{session.browser} • {session.os}</span>
                      <span className="text-[10px] text-[#6e8d7a]">{session.location} • IP: {session.ip}</span>
                    </div>
                  </div>

                  {!session.isCurrent ? (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-400 font-bold text-xs shrink-0 transition-colors"
                    >
                      Sign Out
                    </button>
                  ) : (
                    <span className="text-[11px] font-mono text-[#00e676] shrink-0 font-bold">Active Now</span>
                  )}
                </div>
              ))}

              {sessions.filter(s => !s.isCurrent).length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={handleSignOutAllOtherDevices}
                    className="w-full py-2.5 rounded-xl bg-red-950/30 hover:bg-red-900/40 border border-red-500/40 text-red-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out All Other Devices</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-white/[0.06]">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-[#030706] font-bold text-xs shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Data & Privacy Controls */}
      {activeModal === 'data-privacy' && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setActiveModal(null)}
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full max-w-xl rounded-2xl bg-[#06140c] border border-[#00e676]/30 p-6 flex flex-col gap-5 shadow-[0_0_50px_rgba(0,230,118,0.2)] max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#00e676]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Data & Privacy Controls</h3>
                  <p className="text-xs text-[#8fa396]">Download personal data exports and manage account deletion.</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-[#8fa396] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              {/* Download Data Section */}
              <div className="p-4 rounded-xl bg-[#030706] border border-[#00e676]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-white text-xs">Download Your Personal Data</span>
                  <span className="text-[11px] text-[#8fa396]">Export a copy of your citizen profile, activity log, and preferences in JSON format.</span>
                </div>
                <button
                  onClick={handleExportData}
                  disabled={isExportingData}
                  className="px-4 py-2 rounded-xl bg-[#00e676]/20 hover:bg-[#00e676] text-[#00e676] hover:text-[#030706] border border-[#00e676]/40 font-bold text-xs flex items-center justify-center gap-2 transition-all shrink-0"
                >
                  {isExportingData ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>{isExportingData ? 'Generating...' : 'Export Data'}</span>
                </button>
              </div>

              {/* Statutory Retention Notice */}
              <div className="p-3.5 rounded-xl bg-[#05110a] border border-white/[0.08] flex items-start gap-2.5 text-[11px] text-[#8fa396]">
                <Info className="w-4 h-4 text-[#38bdf8] shrink-0 mt-0.5" />
                <span>
                  Under statutory cybercrime record preservation rules, submitted forensic incident reports and evidence chains must be retained securely in accordance with national evidence preservation statutes.
                </span>
              </div>

              {/* Danger Zone: Account Deletion */}
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/40 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Account Deletion Request</span>
                </div>
                <p className="text-[11px] text-[#fca5a5]">
                  Deleting your citizen profile revokes access to the portal and active complaint notifications. To prevent accidental deletion, type <strong className="text-white">DELETE</strong> below.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={deleteConfirmationText}
                    onChange={e => {
                      setDeleteConfirmationText(e.target.value);
                      setDeleteError(null);
                    }}
                    placeholder="Type DELETE"
                    className="flex-1 bg-[#030706] border border-red-500/40 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-red-500"
                  />
                  <button
                    disabled={deleteConfirmationText !== 'DELETE'}
                    onClick={() => {
                      if (deleteConfirmationText === 'DELETE') {
                        setIsDeletingAccount(true);
                        setTimeout(() => {
                          setIsDeletingAccount(false);
                          setActiveModal(null);
                          if (onShowToast) onShowToast('Account deletion request submitted for administrative review.', 'info');
                        }, 1000);
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                      deleteConfirmationText === 'DELETE'
                        ? 'bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                        : 'bg-red-950/40 text-red-700 border border-red-900/50 cursor-not-allowed'
                    }`}
                  >
                    {isDeletingAccount ? 'Processing...' : 'Request Deletion'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-white/[0.06]">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#8fa396] hover:text-white font-medium text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
