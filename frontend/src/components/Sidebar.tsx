import React from 'react';
import { PortalRole } from '../types';
import { 
  Radar, 
  Activity, 
  Network, 
  FileText, 
  Lock, 
  Fingerprint, 
  Coins, 
  BrainCircuit, 
  Cpu, 
  ShieldAlert, 
  PlusCircle, 
  Search, 
  Users, 
  Server, 
  KeyRound, 
  FileCheck, 
  AlertTriangle, 
  Compass, 
  Database, 
  BarChart3, 
  GitBranch, 
  ShieldCheck, 
  Building2, 
  FolderOpen, 
  Bell, 
  User, 
  HelpCircle, 
  Share2, 
  Bot, 
  Layers, 
  Sparkles, 
  Sliders, 
  CheckCircle2,
  BookOpen,
  Headphones,
  ArrowRight,
  Settings,
  LayoutDashboard,
  Shield
} from 'lucide-react';

interface SidebarProps {
  currentPortal: PortalRole;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  openCasesCount?: number;
  criticalAlertsCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  highlight?: boolean;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPortal,
  activeTab,
  onSelectTab,
  openCasesCount = 14,
  criticalAlertsCount = 5,
  isOpen = false,
  onClose
}) => {
  const getNavGroups = (): NavGroup[] => {
    switch (currentPortal) {
      case 'citizen':
        return [
          {
            groupTitle: 'Citizen Services',
            items: [
              { id: 'citizen-dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
              { id: 'ai-shield', label: 'AI Cyber Shield', icon: <Shield className="w-4 h-4" />, badge: 'AI', badgeColor: 'bg-[#00e676]/15 text-[#00e676] border border-[#00e676]/30' },
              { id: 'file-complaint', label: 'File Complaint', icon: <PlusCircle className="w-4 h-4" /> },
              { id: 'my-complaints', label: 'My Complaints', icon: <FileText className="w-4 h-4" /> },
              { id: 'track-status', label: 'Status Tracker', icon: <Search className="w-4 h-4" /> },
              { id: 'documents', label: 'Documents & Evidence', icon: <FolderOpen className="w-4 h-4" /> },
              { id: 'safety-hub', label: 'Safety Hub', icon: <ShieldCheck className="w-4 h-4" /> },
              { id: 'awareness', label: 'Awareness & Resources', icon: <BookOpen className="w-4 h-4" /> },
            ]
          },
          {
            groupTitle: 'Account & Support',
            items: [
              { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
              { id: 'profile', label: 'Citizen Profile', icon: <User className="w-4 h-4" /> },
              { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
              { id: 'help-support', label: 'Help & Advisory', icon: <HelpCircle className="w-4 h-4" /> },
            ]
          }
        ];

      case 'specialist':
        return [
          {
            groupTitle: 'Threat & SOC Monitoring',
            items: [
              { id: 'specialist-dashboard', label: 'Specialist Dashboard', icon: <Compass className="w-4 h-4" /> },
              { id: 'threat-intelligence',  label: 'Threat Intelligence',  icon: <Radar className="w-4 h-4" /> },
              { id: 'soc-monitoring',       label: 'SOC Monitoring',        icon: <Activity className="w-4 h-4" />, badge: 'LIVE' },
            ]
          },
          {
            groupTitle: 'Case Forensics',
            items: [
              { id: 'assigned-cases',          label: 'Assigned Cases',          icon: <FileText className="w-4 h-4" /> },
              { id: 'investigation-workspace', label: 'Investigation Workspace', icon: <BrainCircuit className="w-4 h-4" /> },
              { id: 'evidence-repository',     label: 'Evidence Repository',     icon: <Lock className="w-4 h-4" /> },
              { id: 'cross-case-correlation',  label: 'Cross-Case Correlation',  icon: <Network className="w-4 h-4" /> },
              { id: 'validation-queue',        label: 'Validation Queue',        icon: <FileCheck className="w-4 h-4" /> },
            ]
          },
          {
            groupTitle: 'AI & Reporting',
            items: [
              { id: 'ai-assistant',         label: 'AI Investigation Assistant', icon: <Bot className="w-4 h-4" />, highlight: true },
              { id: 'investigation-reports',label: 'Investigation Reports',      icon: <BarChart3 className="w-4 h-4" /> },
            ]
          }
        ];

      case 'aiml':
        return [
          {
            groupTitle: 'Model Operations',
            items: [
              { id: 'ai-dashboard',        label: 'AI Dashboard',           icon: <Activity className="w-4 h-4" /> },
              { id: 'model-registry',      label: 'Model Registry',         icon: <Cpu className="w-4 h-4" /> },
              { id: 'model-versions',      label: 'Model Versions',         icon: <GitBranch className="w-4 h-4" /> },
              { id: 'model-approval',      label: 'Model Approval',         icon: <CheckCircle2 className="w-4 h-4" /> },
              { id: 'deployment-rollback', label: 'Deployment & Rollback',  icon: <Layers className="w-4 h-4" /> },
            ]
          },
          {
            groupTitle: 'Data & Training',
            items: [
              { id: 'dataset-management', label: 'Dataset Management', icon: <Database className="w-4 h-4" /> },
              { id: 'data-processing',    label: 'Data Processing',    icon: <Sliders className="w-4 h-4" /> },
              { id: 'training',           label: 'Model Training',     icon: <BrainCircuit className="w-4 h-4" /> },
              { id: 'validation',         label: 'AI Detection Lab',   icon: <FileCheck className="w-4 h-4" />, badge: 'LIVE' },
            ]
          },
          {
            groupTitle: 'Governance & Audits',
            items: [
              { id: 'monitoring-drift',  label: 'Monitoring & Drift',   icon: <Activity className="w-4 h-4" />, badge: 'DRIFT' },
              { id: 'model-audits',      label: 'Model Audit Reports',  icon: <FileText className="w-4 h-4" /> },
              { id: 'continual-learning',label: 'Continual Learning',   icon: <Sparkles className="w-4 h-4" /> },
            ]
          }
        ];

      case 'admin':
        return [
          {
            groupTitle: 'Governance & Access',
            items: [
              { id: 'admin-dashboard',   label: 'Admin Dashboard',      icon: <Compass className="w-4 h-4" /> },
              { id: 'users-management',  label: 'Users & Access',       icon: <Users className="w-4 h-4" /> },
              { id: 'roles-permissions', label: 'Roles & Permissions',  icon: <KeyRound className="w-4 h-4" /> },
            ]
          },
          {
            groupTitle: 'System & Infrastructure',
            items: [
              { id: 'system-health',       label: 'System Health',        icon: <Activity className="w-4 h-4" /> },
              { id: 'security',            label: 'Security & Audit',     icon: <ShieldCheck className="w-4 h-4" /> },
              { id: 'api-integrations',    label: 'API Integrations',     icon: <Share2 className="w-4 h-4" /> },
              { id: 'database-management', label: 'Database & Storage',  icon: <Database className="w-4 h-4" /> },
              { id: 'audit-logs',          label: 'Audit Logs',           icon: <FileText className="w-4 h-4" /> },
              { id: 'system-configuration',label: 'System Configuration', icon: <Sliders className="w-4 h-4" /> },
            ]
          }
        ];

      default:
        return [];
    }
  };

  const navGroups = getNavGroups();

  return (
    <aside
      className={`fixed left-0 top-16 bottom-0 w-64 bg-[#030706]/98 border-r border-[#00e676]/15 z-40 flex flex-col justify-between shadow-[4px_0_30px_rgba(0,0,0,0.6)] overflow-y-auto transition-all duration-300 ease-in-out ${
        isOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : '-translate-x-full opacity-0 pointer-events-none'
      }`}
      aria-label="Navigation"
    >
      <div className="flex flex-col p-3 gap-5">
        {/* Navigation Groups */}
        <nav className="flex flex-col gap-5" role="navigation">
          {navGroups.map((group, idx) => (
            <div key={idx} className="flex flex-col gap-0.5">
              <span className="px-3 text-[9px] font-mono uppercase tracking-[0.12em] text-[#4e725b] font-bold mb-1.5 opacity-90">
                {group.groupTitle}
              </span>
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`
                      flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-full text-left text-xs
                      relative overflow-hidden transition-all duration-fast
                      ${isActive ? 'bg-[#00e676]/10 border border-[#00e676]/70 text-white font-bold shadow-[0_0_16px_rgba(0,230,118,0.2)]' : 'border border-transparent hover:bg-white/[0.04] text-[#8fa396] hover:text-white'}
                    `}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`
                          transition-colors duration-150
                          ${isActive ? 'text-[#00e676]' : 'text-[#6e8d7a]'}
                        `}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && typeof item.badge !== 'number' && (
                      <span
                        className={`
                          text-[9px] font-mono px-1.5 py-0.5 rounded-md flex-shrink-0 font-bold
                          ${item.badgeColor ? item.badgeColor : isActive ? 'bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/40' : 'bg-[#07170e] text-[#6e8d7a] border border-white/[0.08]'}
                        `}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Helpline Card for Citizen Portal or Mesh Telemetry */}
      {currentPortal === 'citizen' ? (
        <div className="p-3 border-t border-[#00e676]/15 bg-[#030706]">
          <div className="rounded-2xl bg-[#06140c] border border-[#00e676]/25 p-3.5 flex flex-col gap-3 shadow-[0_0_20px_rgba(0,230,118,0.06)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#00e676]/15 border border-[#00e676]/40 flex items-center justify-center text-[#00e676] shadow-[0_0_12px_rgba(0,230,118,0.25)] shrink-0">
                  <Headphones className="w-5 h-5 text-[#00e676]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#6e8d7a] uppercase font-mono font-bold leading-tight">Need Help?</span>
                  <span className="text-xs text-white font-semibold leading-tight">Cyber Helpline</span>
                  <span className="text-lg font-mono font-extrabold text-[#00e676] tracking-wider leading-tight mt-0.5">1930</span>
                </div>
              </div>
              <a
                href="tel:1930"
                className="w-8 h-8 rounded-full bg-[#00e676]/20 hover:bg-[#00e676] hover:text-[#030706] text-[#00e676] border border-[#00e676]/40 flex items-center justify-center transition-all shadow-[0_0_10px_rgba(0,230,118,0.2)] shrink-0"
                title="Call 1930 Helpline"
              >
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <p className="text-[11px] text-[#6e8d7a] leading-tight">
              Report cyber fraud, seek guidance and get support.
            </p>
          </div>

          <div className="text-center mt-2.5">
            <span className="text-[10px] font-mono text-[#4e725b]">
              CCIP v4.2 • Operational Enclave Alpha
            </span>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-[#00e676]/15 bg-[#030706]">
          <div className="flex items-center justify-between text-[11px] font-sans text-[#c8ddd0] mb-2">
            <span className="flex items-center gap-1.5">
              <span className="pulse-dot online status-dot-glow" aria-hidden="true" />
              Operational Mesh
            </span>
            <span className="text-[#00e676] font-mono font-bold text-[10px]">HEALTHY</span>
          </div>
          <div className="w-full bg-[#07170e] h-1.5 rounded-full overflow-hidden border border-[#00e676]/20">
            <div className="bg-[#00e676] h-full w-[96%] rounded-full shadow-[0_0_8px_#00e676]" />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#6e8d7a] mt-1.5">
            <span>RUNTIME: ACTIVE</span>
            <span>NODE: READY</span>
          </div>
        </div>
      )}
    </aside>
  );
};
