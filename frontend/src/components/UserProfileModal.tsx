import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { apiClient } from '../api/client';
import { 
  User, 
  X, 
  ShieldCheck, 
  KeyRound, 
  Bell, 
  Mail, 
  Phone, 
  Building2, 
  BadgeCheck, 
  Calendar, 
  Check, 
  Save, 
  AlertCircle,
  Smartphone,
  Lock,
  Globe,
  Radio
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserUpdated: (user: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'SECURITY' | 'PREFERENCES'>('IDENTITY');
  
  // Editable fields
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phone_number || '');
  
  // Preference toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [urgentPaging, setUrgentPaging] = useState(currentUser?.portal_role !== 'citizen');

  // Status & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name || '');
      setPhoneNumber(currentUser.phone_number || '');
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFeedback({ type: 'error', message: 'Full name cannot be blank.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const updated = await apiClient.updateUserProfile({
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim() || undefined
      });
      onUserUpdated(updated);
      setFeedback({ type: 'success', message: 'Profile credentials successfully updated and signed in enclave.' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update profile details.' });
    } finally {
      setIsSaving(false);
    }
  };

  const getUserInitials = () => {
    const name = fullName || currentUser?.full_name || 'User';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatCreationDate = (dStr?: string | null) => {
    if (!dStr) return 'Active Operator';
    try {
      return new Date(dStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-xl bg-[#06140c] border border-[#00e676]/25 rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.85)] flex flex-col max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="p-4 sm:p-5 border-b border-[#00e676]/15 flex items-center justify-between bg-[#030906]">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-full ring-2 ring-[#00e676]/40 bg-[#030906] flex items-center justify-center text-sm font-bold text-[#00e676] shadow-sm">
              <span>{getUserInitials()}</span>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00e676] rounded-full border-2 border-[#06140c] status-dot-glow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">{fullName || currentUser?.full_name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00e676]/15 text-[#00e676] border border-[#00e676]/30 uppercase">
                  {currentUser?.portal_role || 'CITIZEN'}
                </span>
              </div>
              <p className="text-xs text-[#8fa396] font-mono">{currentUser?.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8fa396] hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Close profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 pt-3 border-b border-[#00e676]/15 bg-[#020704] flex items-center gap-2">
          <button
            onClick={() => setActiveTab('IDENTITY')}
            className={`flex items-center gap-2 pb-2.5 px-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'IDENTITY'
                ? 'border-[#00e676] text-[#00e676] font-bold'
                : 'border-transparent text-[#8fa396] hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Identity & Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`flex items-center gap-2 pb-2.5 px-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'SECURITY'
                ? 'border-[#00e676] text-[#00e676] font-bold'
                : 'border-transparent text-[#8fa396] hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Security & Authentication</span>
          </button>

          <button
            onClick={() => setActiveTab('PREFERENCES')}
            className={`flex items-center gap-2 pb-2.5 px-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'PREFERENCES'
                ? 'border-[#00e676] text-[#00e676] font-bold'
                : 'border-transparent text-[#8fa396] hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Preferences</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {feedback && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              feedback.type === 'success' 
                ? 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/30' 
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
            }`}>
              {feedback.type === 'success' ? <Check className="w-4 h-4 shrink-0 text-[#00e676]" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {activeTab === 'IDENTITY' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#c8ddd0] mb-1">Full Legal Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8fa396]" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="e.g. Elena Rostova"
                      className="w-full pl-9 pr-3 py-2 bg-[#030906] border border-[#00e676]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#00e676]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#c8ddd0] mb-1">Registered Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8fa396]" />
                    <input
                      type="email"
                      value={currentUser?.email || ''}
                      disabled
                      className="w-full pl-9 pr-3 py-2 bg-[#030906]/60 border border-[#00e676]/15 rounded-xl text-xs text-[#8fa396] cursor-not-allowed font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-[#00e676] flex items-center gap-1 mt-1 font-mono">
                    <ShieldCheck className="w-3 h-3" /> Identity Verified in Database
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#c8ddd0] mb-1">Emergency / Alert Phone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8fa396]" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2 bg-[#030906] border border-[#00e676]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#00e676]"
                    />
                  </div>
                  <span className="text-[10px] text-[#8fa396] font-mono mt-1 block">Used for two-factor verification & case updates</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#c8ddd0] mb-1">Clearance Level</label>
                  <div className="p-2 bg-[#030906] border border-[#00e676]/20 rounded-xl text-xs font-mono text-[#00e676] flex items-center justify-between">
                    <span>{currentUser?.clearance_level || 'CITIZEN TIER'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#00e676]/15 text-[#00e676] border border-[#00e676]/30">SEALED</span>
                  </div>
                </div>

                {currentUser?.department && (
                  <div>
                    <label className="block text-xs font-medium text-[#c8ddd0] mb-1">Assigned Department</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8fa396]" />
                      <input
                        type="text"
                        value={currentUser.department}
                        disabled
                        className="w-full pl-9 pr-3 py-2 bg-[#030906]/60 border border-[#00e676]/15 rounded-xl text-xs text-[#8fa396] cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}

                {currentUser?.badge_number && (
                  <div>
                    <label className="block text-xs font-medium text-[#c8ddd0] mb-1">Badge / Officer ID</label>
                    <div className="relative">
                      <BadgeCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8fa396]" />
                      <input
                        type="text"
                        value={currentUser.badge_number}
                        disabled
                        className="w-full pl-9 pr-3 py-2 bg-[#030906]/60 border border-[#00e676]/15 rounded-xl text-xs text-[#8fa396] cursor-not-allowed font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Account Metadata card */}
              <div className="p-3 bg-[#030906] border border-[#00e676]/15 rounded-xl flex items-center justify-between text-xs text-[#8fa396]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#00e676]" />
                  <span>Enclave Account Registered:</span>
                </div>
                <span className="font-mono text-white">{formatCreationDate(currentUser?.created_at)}</span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#00e676] to-[#00c853] text-[#031508] shadow-[0_0_15px_rgba(0,230,118,0.25)] hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'SECURITY' && (
            <div className="space-y-4">
              {/* MFA Card */}
              <div className="p-4 bg-[#030906] border border-[#00e676]/15 rounded-xl flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#00e676]/10 border border-[#00e676]/20 text-[#00e676] mt-0.5">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Two-Factor Authentication (MFA / TOTP)</h4>
                    <p className="text-[11px] text-[#8fa396] mt-0.5 leading-relaxed">
                      Secures incident filings, evidence access, and cryptographic signature verification with time-based OTP.
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00e676]/15 text-[#00e676] border border-[#00e676]/30">
                        {currentUser?.mfa_enabled ? 'MFA ACTIVE (TOTP)' : 'AVAILABLE (OPTIONAL)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Password & Session Security */}
              <div className="p-4 bg-[#030906] border border-[#00e676]/15 rounded-xl flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#00e676]/10 border border-[#00e676]/20 text-[#00e676] mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Cryptographic Session Protection</h4>
                    <p className="text-[11px] text-[#8fa396] mt-0.5 leading-relaxed">
                      All account sessions utilize Argon2id password hashing, SHA-256 HMAC tamper seals, and automatic 15-minute lockouts upon 5 failed attempts.
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-[#c8ddd0]">
                      <span>Algorithm: Argon2id v19</span>
                      <span>·</span>
                      <span>Enclave Cipher: TLS 1.3</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Identity */}
              <div className="p-4 bg-[#030906] border border-[#00e676]/15 rounded-xl flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mt-0.5">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Federated Google SSO</h4>
                    <p className="text-[11px] text-[#8fa396] mt-0.5 leading-relaxed">
                      Link your Google identity for instant verified authentication and expedited incident tracking.
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                        currentUser?.is_google_linked || currentUser?.google_id
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                          : 'bg-white/[0.04] text-[#8fa396] border-white/[0.08]'
                      }`}>
                        {currentUser?.is_google_linked || currentUser?.google_id ? 'GOOGLE LINKED' : 'NOT LINKED'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'PREFERENCES' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-[#030906] border border-[#00e676]/15 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">Case Status Email Alerts</h4>
                  <p className="text-[11px] text-[#8fa396]">Receive email updates when officer notes or forensic triage results update.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={emailAlerts} 
                  onChange={e => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 accent-[#00e676] cursor-pointer rounded" 
                />
              </div>

              <div className="p-3.5 bg-[#030906] border border-[#00e676]/15 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">Real-Time In-App Push</h4>
                  <p className="text-[11px] text-[#8fa396]">Stream live alerts via WebSocket duplex pipe without reloading the dashboard.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={pushAlerts} 
                  onChange={e => setPushAlerts(e.target.checked)}
                  className="w-4 h-4 accent-[#00e676] cursor-pointer rounded" 
                />
              </div>

              {currentUser?.portal_role !== 'citizen' && (
                <div className="p-3.5 bg-[#030906] border border-[#00e676]/15 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-white">Critical Incident Paging</h4>
                    <p className="text-[11px] text-[#8fa396]">Priority audio and visual alert banner on high-severity cybercrime attacks.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={urgentPaging} 
                    onChange={e => setUrgentPaging(e.target.checked)}
                    className="w-4 h-4 accent-[#00e676] cursor-pointer rounded" 
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-[#00e676]/15 bg-[#030906] flex items-center justify-between text-xs text-[#8fa396]">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00e676]" />
            <span>Session Clearance: {currentUser?.clearance_level || 'CITIZEN'}</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.08] hover:bg-white/[0.14] text-white transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
