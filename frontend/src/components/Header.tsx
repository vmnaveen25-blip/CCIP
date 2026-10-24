import React from 'react';
import { PortalRole, UserProfile } from '../types';
import { 
  ShieldAlert, 
  Search, 
  Bell, 
  ShieldCheck, 
  ChevronDown, 
  Terminal, 
  UserCheck, 
  Cpu, 
  Lock,
  Globe,
  Radio,
  Sparkles,
  LogOut,
  User,
  Wifi,
  WifiOff
} from 'lucide-react';

interface HeaderProps {
  currentPortal: PortalRole;
  onSelectPortal: (portal: PortalRole) => void;
  onOpenOmniSearch: () => void;
  notificationCount: number;
  onOpenNotifications: () => void;
  onOpenProfileModal?: () => void;
  defconLevel?: number;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
  onOpenAuth?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

const THREAT_LEVEL_CONFIG: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'THREAT: CRITICAL', color: 'text-red-400',   bg: 'bg-red-500/20 border-red-500/40' },
  2: { label: 'THREAT: HIGH',     color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/40' },
  3: { label: 'THREAT: ELEVATED', color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/40' },
  4: { label: 'THREAT: GUARDED',  color: 'text-soft-green', bg: 'bg-green-500/10 border-green-500/25' },
  5: { label: 'THREAT: LOW',      color: 'text-soft-blue',  bg: 'bg-blue-500/10 border-blue-500/25' },
};

export const Header: React.FC<HeaderProps> = ({
  currentPortal,
  onSelectPortal,
  onOpenOmniSearch,
  notificationCount,
  onOpenNotifications,
  onOpenProfileModal,
  defconLevel = 4,
  currentUser,
  onLogout,
  onOpenAuth,
  isSidebarOpen = false,
  onToggleSidebar
}) => {
  const [portalDropdownOpen, setPortalDropdownOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPortalDropdownOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const portals: { id: PortalRole; label: string; sub: string; icon: React.ReactNode; color: string; badge: string }[] = [
    { id: 'landing',   label: 'Public Portal & Landing', sub: 'Citizen Intake & Radar',         icon: <Globe className="w-4 h-4" />,      color: 'text-primary',   badge: 'PUBLIC' },
    { id: 'citizen',   label: 'Citizen Service Portal',  sub: 'File & Track Incidents',          icon: <UserCheck className="w-4 h-4" />,  color: 'text-soft-green', badge: 'CITIZEN' },
    { id: 'specialist',label: 'Specialist Operations',   sub: 'SOC Telemetry & Workbench',       icon: <Radio className="w-4 h-4" />,      color: 'text-primary',   badge: 'SPEC-OPS' },
    { id: 'aiml',      label: 'AI/ML Maintenance',       sub: 'Model Drift & Continuous Learning',icon: <Cpu className="w-4 h-4" />,       color: 'text-soft-pink', badge: 'DATA-OPS' },
    { id: 'admin',     label: 'Admin & System Health',   sub: 'RBAC Matrices & Enclave Config',  icon: <Lock className="w-4 h-4" />,       color: 'text-soft-lime', badge: 'ROOT' },
  ];

  const currentPortalMeta = portals.find(p => p.id === currentPortal) || portals[0];

  const getUserInitials = () => {
    const name = currentUser?.full_name || (currentPortal === 'citizen' ? 'Citizen User' : 'Operator');
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col select-none">
      {/* Main Operational Header */}
      <div className="h-16 w-full bg-[#030706]/95 backdrop-blur-xl border-b border-[#00e676]/15 px-4 md:px-6 flex items-center justify-between gap-4 shadow-[0_4px_28px_rgba(0,0,0,0.5)]">
        
        {/* Brand Emblem & Sidebar Toggle */}
        <div
          onClick={() => {
            if (onToggleSidebar) {
              onToggleSidebar();
            } else {
              onSelectPortal('citizen');
            }
          }}
          className="flex items-center gap-3 cursor-pointer group min-w-max select-none"
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && (onToggleSidebar ? onToggleSidebar() : onSelectPortal('citizen'))}
          aria-label="Toggle navigation sidebar"
          title={isSidebarOpen ? "Click logo to hide sidebar" : "Click logo to show sidebar"}
        >
          <div className="h-10 w-10 rounded-xl bg-[#00e676]/15 border border-[#00e676]/35 flex items-center justify-center relative overflow-hidden shadow-[0_0_18px_rgba(0,230,118,0.25)] group-hover:border-[#00e676]/60 group-hover:shadow-[0_0_24px_rgba(0,230,118,0.4)] group-hover:scale-105 transition-all duration-standard">
            <ShieldCheck className="w-5 h-5 text-[#00e676]" aria-hidden="true" />
            <span className={`absolute bottom-1 right-1 w-2 h-2 rounded-full transition-all duration-300 ${isSidebarOpen ? 'bg-[#00e676] shadow-[0_0_8px_#00e676]' : 'bg-[#6e8d7a]/50'}`} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-extrabold tracking-wider text-white group-hover:text-[#00e676] transition-colors duration-fast">
                CCIP
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#00e676]/15 text-[#00e676] border border-[#00e676]/30">
                SOVEREIGN
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-[#6e8d7a] font-normal leading-tight group-hover:text-white/80 transition-colors">
              Citizen Cybercrime Intelligence Platform
            </span>
          </div>
        </div>

        {/* Portal Switcher */}
        <div className="relative shrink-0">
          <button
            onClick={() => { setPortalDropdownOpen(!portalDropdownOpen); setUserMenuOpen(false); }}
            className="flex items-center gap-2 bg-[#07170e] px-3.5 py-1.5 rounded-full border border-[#00e676]/25 hover:border-[#00e676]/50 hover:bg-[#0a2215] transition-all duration-fast text-left shadow-sm"
            aria-haspopup="listbox"
            aria-expanded={portalDropdownOpen}
          >
            <span className="text-[11px] text-[#6e8d7a] uppercase tracking-wider hidden lg:inline">Portal:</span>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#00e676] shadow-[0_0_8px_#00e676]" aria-hidden="true" />
              <span className="text-xs font-semibold text-white truncate max-w-[130px] md:max-w-[170px]">
                {currentPortalMeta.label}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] font-mono text-[#00e676] hidden sm:inline">
                {currentPortalMeta.badge}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#6e8d7a] transition-transform duration-fast ${portalDropdownOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {portalDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setPortalDropdownOpen(false)}
                aria-hidden="true"
              />
              <div
                className="absolute top-full mt-2 left-0 w-80 max-w-[calc(100vw-2rem)] bg-[#06140c] border border-[#00e676]/30 rounded-2xl p-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.8)] z-50 notif-drawer"
                role="listbox"
                aria-label="Switch portal"
              >
                <div className="px-3 py-2 border-b border-[#00e676]/15 mb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase text-[#6e8d7a] tracking-wider font-bold">
                    Switch Operational Enclave
                  </span>
                  <span className="text-[10px] font-mono text-[#00e676] bg-[#00e676]/10 border border-[#00e676]/25 px-1.5 py-0.5 rounded">
                    6 ENVIRONMENTS
                  </span>
                </div>
                <div className="flex flex-col gap-0.5" role="group">
                  {portals.map((p) => {
                    const isSelected = p.id === currentPortal;
                    return (
                      <button
                        key={p.id}
                        onClick={() => { onSelectPortal(p.id); setPortalDropdownOpen(false); }}
                        className={`flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-fast ${
                          isSelected
                            ? 'bg-[#00e676]/20 border border-[#00e676]/40 text-[#00e676] font-semibold shadow-[0_0_15px_rgba(0,230,118,0.15)]'
                            : 'hover:bg-white/[0.04] text-[#c8ddd0] hover:text-white'
                        }`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#00e676]/20 text-[#00e676]' : 'bg-[#030706] ' + p.color}`}>
                            {p.icon}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">{p.label}</div>
                            <div className="text-[11px] text-[#6e8d7a]">{p.sub}</div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isSelected ? 'bg-[#00e676]/30 text-white' : 'bg-black/40 text-[#6e8d7a]'}`}>
                          {p.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Omni-Search Bar (Capsule Style) */}
        <div className="flex-1 min-w-0 max-w-xl mx-2 hidden md:block">
          <div
            onClick={onOpenOmniSearch}
            className="flex items-center bg-[#07170e]/90 border border-[#00e676]/25 hover:border-[#00e676]/50 rounded-full px-4 py-2 gap-3 cursor-pointer shadow-[0_0_15px_rgba(0,230,118,0.05)] transition-all group"
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onOpenOmniSearch()}
            aria-label="Open search"
          >
            <Search className="w-4 h-4 text-[#6e8d7a] group-hover:text-[#00e676] transition-colors duration-fast" aria-hidden="true" />
            <span className="text-xs text-[#6e8d7a] group-hover:text-[#c8ddd0] truncate flex-1 font-sans">
              Search Case ID, IP, Hash, URL, Mobile, Email...
            </span>
            <div className="hidden lg:flex items-center gap-1.5">
              <span className="bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/20 text-[9px] font-mono px-1.5 py-0.5 rounded">CASE</span>
              <span className="bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/20 text-[9px] font-mono px-1.5 py-0.5 rounded">IOC</span>
              <span className="bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/20 text-[9px] font-mono px-1.5 py-0.5 rounded">HASH</span>
            </div>
            <kbd className="bg-[#030706] text-[#6e8d7a] border border-[#00e676]/20 px-2 py-0.5 rounded-full text-[10px] font-mono" aria-label="Keyboard shortcut">⌘K</kbd>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Mobile search */}
          <button
            onClick={onOpenOmniSearch}
            className="p-2 rounded-full bg-[#07170e] border border-[#00e676]/25 hover:border-[#00e676]/50 text-[#c8ddd0] hover:text-[#00e676] transition-all duration-fast md:hidden"
            aria-label="Open search"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
          </button>

          {/* Notifications Bell */}
          <button
            onClick={() => { setPortalDropdownOpen(false); setUserMenuOpen(false); onOpenNotifications(); }}
            className="relative p-2.5 rounded-full bg-[#07170e] border border-[#00e676]/25 hover:border-[#00e676]/50 text-[#c8ddd0] hover:text-[#00e676] transition-all duration-fast"
            aria-label={`System alerts${notificationCount > 0 ? ` — ${notificationCount} unread` : ''}`}
          >
            <Bell className="w-4 h-4" aria-hidden="true" />
            {notificationCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-mono font-bold ring-2 ring-[#030706] shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                aria-hidden="true"
              >
                {notificationCount}
              </span>
            )}
          </button>

          {/* User Profile Pill (Exact Match to UI Screenshot) */}
          <div className="relative shrink-0">
            <button
              onClick={() => { setUserMenuOpen(!userMenuOpen); setPortalDropdownOpen(false); }}
              className="flex items-center gap-2.5 bg-[#07170e] border border-[#00e676]/25 hover:border-[#00e676]/50 rounded-full px-3 py-1.5 transition-all duration-fast text-left shadow-[0_0_15px_rgba(0,230,118,0.05)]"
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              aria-label="User profile menu"
            >
              {/* Glowing Avatar */}
              <div className="w-7 h-7 rounded-full bg-[#00e676]/20 border border-[#00e676]/50 flex items-center justify-center text-[#00e676] shadow-[0_0_8px_rgba(0,230,118,0.3)] shrink-0">
                <User className="w-4 h-4 text-[#00e676]" />
              </div>

              <div className="flex flex-col">
                <span className="text-xs font-bold text-white leading-tight max-w-[120px] truncate">
                  {currentUser?.full_name || 'Naveen'}
                </span>
                <span className="text-[10px] text-[#00e676] font-mono font-medium truncate max-w-[120px]">
                  {currentPortal === 'admin' ? 'ADMIN' : currentPortal === 'specialist' ? 'SPECIALIST' : (currentUser?.clearance_level || (currentPortal === 'citizen' ? 'CITIZEN' : 'OPERATOR'))}
                </span>
              </div>

              <ChevronDown
                className={`w-3.5 h-3.5 text-[#6e8d7a] transition-transform duration-fast ${userMenuOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            {/* Profile Dropdown */}
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setUserMenuOpen(false)}
                  aria-hidden="true"
                />
                <div
                  className="absolute top-full mt-2 right-0 w-72 max-w-[calc(100vw-1.5rem)] bg-[#161618] border border-white/[0.14] rounded-2xl p-3.5 shadow-modal z-50 notif-drawer"
                  role="menu"
                  aria-label="User profile options"
                >
                  <div className="pb-3 border-b border-white/[0.07] mb-2">
                    <div className="text-xs font-bold text-content-primary truncate">
                      {currentUser?.full_name || (currentPortal === 'citizen' ? 'Citizen User' : 'Authorized Operator')}
                    </div>
                    <div className="text-[11px] text-content-muted font-mono truncate mt-0.5">
                      {currentUser?.email || 'Active Enclave Session'}
                    </div>
                    {currentUser?.phone_number && (
                      <div className="text-[10px] text-content-muted font-mono mt-0.5">{currentUser.phone_number}</div>
                    )}
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="chip-neutral px-2 py-0.5 rounded text-[10px] font-mono text-primary uppercase font-bold">
                        {currentUser?.role || currentPortal.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono text-soft-green flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" aria-hidden="true" /> VERIFIED
                      </span>
                    </div>
                  </div>

                    <div className="flex flex-col gap-0.5 text-xs" role="group">
                      {onOpenProfileModal && (
                        <>
                          <button
                            onClick={() => { setUserMenuOpen(false); onOpenProfileModal(); }}
                            className="flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-white/[0.05] text-content-secondary hover:text-content-primary transition-all duration-fast"
                            role="menuitem"
                          >
                            <User className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                            <span>My Profile & Identity</span>
                          </button>
                          <button
                            onClick={() => { setUserMenuOpen(false); onOpenProfileModal(); }}
                            className="flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-white/[0.05] text-content-secondary hover:text-content-primary transition-all duration-fast"
                            role="menuitem"
                          >
                            <Lock className="w-3.5 h-3.5 text-soft-green" aria-hidden="true" />
                            <span>Security & Credentials</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => { setUserMenuOpen(false); onOpenNotifications(); }}
                        className="flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-white/[0.05] text-content-secondary hover:text-content-primary transition-all duration-fast"
                        role="menuitem"
                      >
                        <Bell className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                        <span>Notification Center</span>
                      </button>

                      {currentPortal === 'citizen' && (
                        <button
                          onClick={() => { onSelectPortal('citizen'); setUserMenuOpen(false); }}
                          className="flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-white/[0.05] text-content-secondary hover:text-content-primary transition-all duration-fast"
                          role="menuitem"
                        >
                          <Globe className="w-3.5 h-3.5 text-content-muted" aria-hidden="true" />
                          <span>Citizen Service Portal</span>
                        </button>
                      )}

                      {onLogout ? (
                        <button
                          onClick={() => { setUserMenuOpen(false); onLogout(); }}
                          className="flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-danger/10 text-danger/80 hover:text-danger transition-all duration-fast font-medium mt-1 pt-2 border-t border-white/[0.06]"
                          role="menuitem"
                        >
                          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Sign Out of Enclave</span>
                        </button>
                      ) : onOpenAuth ? (
                        <button
                          onClick={() => { setUserMenuOpen(false); onOpenAuth(); }}
                          className="flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-white/[0.05] text-primary transition-all duration-fast font-medium mt-1 pt-2 border-t border-white/[0.06]"
                          role="menuitem"
                        >
                          <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Switch User / Sign In</span>
                        </button>
                      ) : null}
                    </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
