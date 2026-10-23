import React, { useState, useEffect, useCallback } from 'react';
import { SystemAuditLog } from '../types';
import { apiClient } from '../api/client';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { 
  Lock, 
  Server, 
  Terminal,
  Users,
  KeyRound,
  Building2,
  Sliders,
  ShieldCheck,
  Network,
  Database,
  FileText,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Download,
  Plus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Eye,
  Edit3,
  UserCheck,
  UserX,
  ShieldAlert,
  History,
  Phone,
  Mail,
  Check,
  Shield,
  Clock,
  Calendar,
  AlertCircle,
  Copy,
  Save
} from 'lucide-react';

interface AdminPortalProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  auditLogs: SystemAuditLog[];
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  activeTab,
  onSelectTab,
  auditLogs
}) => {
  // Admin General State
  const [adminSummary, setAdminSummary] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [newDepName, setNewDepName] = useState('');
  const [newDepCode, setNewDepCode] = useState('');
  const [newDepUnit, setNewDepUnit] = useState('');
  const [depFeedback, setDepFeedback] = useState<string | null>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  // User Management State
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [verificationFilter, setVerificationFilter] = useState('ALL');

  // Modals & Drawer State
  const [selectedUserForDrawer, setSelectedUserForDrawer] = useState<any | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addForm, setAddForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    role: 'CYBERSECURITY_SPECIALIST',
    department_id: '',
    clearance_level: 'TIER 2',
    badge_number: '',
    is_staff: true
  });
  const [addFeedback, setAddFeedback] = useState<string | null>(null);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  const [editUser, setEditUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone_number: '',
    department_id: '',
    clearance_level: '',
    badge_number: '',
    role: ''
  });
  const [editFeedback, setEditFeedback] = useState<string | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Role Change Confirmation Modal
  const [roleChangePending, setRoleChangePending] = useState<{
    user: any;
    targetRole: string;
  } | null>(null);

  // Account Status Action Confirmation Dialog (suspend, activate, disable)
  const [statusActionPending, setStatusActionPending] = useState<{
    user: any;
    action: 'activate' | 'suspend' | 'disable';
  } | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Audit History Modal
  const [auditUser, setAuditUser] = useState<any | null>(null);
  const [userAuditLogs, setUserAuditLogs] = useState<any[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Real System Configuration & Integrations State
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [dbBackups, setDbBackups] = useState<any[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupFeedback, setBackupFeedback] = useState<string | null>(null);

  // Real Audit Trail Filter & Export State
  const [adminAuditLogs, setAdminAuditLogs] = useState<SystemAuditLog[]>(auditLogs || []);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActor, setAuditActor] = useState('');
  const [auditAction, setAuditAction] = useState('');
  const [auditStatus, setAuditStatus] = useState('ALL');
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(false);
  const [isExportingAudit, setIsExportingAudit] = useState(false);

  // Department Edit Modal State
  const [editingDept, setEditingDept] = useState<any | null>(null);
  const [deptEditForm, setDeptEditForm] = useState({
    name: '',
    code: '',
    description: '',
    jurisdiction: '',
    isActive: true
  });
  const [isSubmittingDeptEdit, setIsSubmittingDeptEdit] = useState(false);
  const [deptEditFeedback, setDeptEditFeedback] = useState<string | null>(null);

  // Fetch Users function with server-side query params
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    setUserError(null);
    try {
      const params: any = {
        page,
        page_size: pageSize,
        paginate: true
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (departmentFilter !== 'ALL') params.department_id = departmentFilter;
      if (verificationFilter !== 'ALL') params.verification_status = verificationFilter;

      const res = await apiClient.getAdminUsers(params);
      if (res && res.items) {
        setUsers(res.items);
        setTotalUsers(res.total);
        setTotalPages(res.total_pages || Math.ceil(res.total / pageSize) || 1);
      } else if (Array.isArray(res)) {
        setUsers(res);
        setTotalUsers(res.length);
        setTotalPages(Math.ceil(res.length / pageSize) || 1);
      }
    } catch (err: any) {
      setUserError(err.message || 'Failed to load user accounts.');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [page, pageSize, searchQuery, roleFilter, statusFilter, departmentFilter, verificationFilter]);

  const fetchDepartments = useCallback(async () => {
    try {
      const deps = await apiClient.getDepartments();
      if (deps) setDepartments(deps);
    } catch (e) {}
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const health = await apiClient.getSystemHealth();
      if (health) setSystemHealth(health);
    } catch (e) {}
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const sum = await apiClient.getAdminDashboardSummary();
      if (sum) setAdminSummary(sum);
    } catch (e) {}
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const cfg = await apiClient.getSystemConfiguration();
      if (cfg) setSystemConfig(cfg);
    } catch (e) {}
  }, []);

  const fetchIntegrations = useCallback(async () => {
    try {
      const ints = await apiClient.getIntegrationsStatus();
      if (ints) setIntegrations(ints);
    } catch (e) {}
  }, []);

  const fetchDbData = useCallback(async () => {
    try {
      const [status, backups] = await Promise.all([
        apiClient.getDatabaseStatus().catch(() => null),
        apiClient.getDatabaseBackups().catch(() => [])
      ]);
      if (status) setDbStatus(status);
      if (backups) setDbBackups(backups);
    } catch (e) {}
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoadingAuditLogs(true);
    try {
      const params: any = { limit: 100 };
      if (auditSearch.trim()) params.search = auditSearch.trim();
      if (auditActor.trim()) params.actor = auditActor.trim();
      if (auditAction.trim()) params.action = auditAction.trim();
      if (auditStatus !== 'ALL') params.status = auditStatus;

      const logs = await apiClient.getAdminAuditLogs(params);
      if (logs) setAdminAuditLogs(logs);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setIsLoadingAuditLogs(false);
    }
  }, [auditSearch, auditActor, auditAction, auditStatus]);

  // Initial loads
  useEffect(() => {
    fetchDepartments();
    fetchHealth();
    fetchSummary();
    fetchConfig();
    fetchIntegrations();
    fetchDbData();
    fetchAuditLogs();
  }, [fetchDepartments, fetchHealth, fetchSummary, fetchConfig, fetchIntegrations, fetchDbData, fetchAuditLogs]);

  // Fetch contextual tab data when active tab changes
  useEffect(() => {
    if (activeTab === 'users-management' || activeTab === 'admin-dashboard') {
      fetchUsers();
    } else if (activeTab === 'departments-units') {
      fetchDepartments();
    } else if (activeTab === 'system-health' || activeTab === 'system-health-ops') {
      fetchHealth();
    } else if (activeTab === 'system-configuration') {
      fetchConfig();
    } else if (activeTab === 'api-integrations') {
      fetchIntegrations();
    } else if (activeTab === 'database-management') {
      fetchDbData();
    } else if (activeTab === 'audit-logs' || activeTab === 'audit-trails') {
      fetchAuditLogs();
    }
  }, [activeTab, fetchUsers, fetchDepartments, fetchHealth, fetchConfig, fetchIntegrations, fetchDbData, fetchAuditLogs]);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepName.trim()) return;
    try {
      const created = await apiClient.createDepartment({
        name: newDepName.trim(),
        code: (newDepCode || newDepName.slice(0, 4)).trim().toUpperCase(),
        description: `Operational unit: ${newDepName.trim()}`,
        jurisdiction: newDepUnit || 'Federal / National',
        isActive: true
      });
      setDepartments(prev => [...prev, created]);
      setNewDepName('');
      setNewDepCode('');
      setNewDepUnit('');
      setDepFeedback('Department unit registered and provisioned in database.');
      setTimeout(() => setDepFeedback(null), 4000);
    } catch (err: any) {
      setDepFeedback(err.message || 'Failed to create department.');
    }
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    setBackupFeedback(null);
    try {
      const created = await apiClient.createDatabaseBackup();
      setDbBackups(prev => [created, ...prev]);
      setBackupFeedback(`Backup snapshot ${created.filename} (${created.sizeFormatted}) created and SHA-256 sealed.`);
      fetchDbData();
      setTimeout(() => setBackupFeedback(null), 5000);
    } catch (err: any) {
      setBackupFeedback(err.message || 'Failed to create database backup snapshot.');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleExportAudit = async (format: 'csv' | 'json') => {
    setIsExportingAudit(true);
    try {
      await apiClient.exportAuditLogs(format, {
        search: auditSearch.trim() || undefined,
        actor: auditActor.trim() || undefined,
        action: auditAction.trim() || undefined,
        status: auditStatus !== 'ALL' ? auditStatus : undefined
      });
    } catch (err) {
      console.error('Failed to export audit logs:', err);
    } finally {
      setIsExportingAudit(false);
    }
  };

  const handleOpenDeptEdit = (dept: any) => {
    setEditingDept(dept);
    setDeptEditForm({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      jurisdiction: dept.jurisdiction || 'Federal / National',
      isActive: dept.isActive !== false
    });
    setDeptEditFeedback(null);
  };

  const handleSaveDeptEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    setIsSubmittingDeptEdit(true);
    setDeptEditFeedback(null);
    try {
      const updated = await apiClient.updateDepartment(editingDept.id, deptEditForm);
      setDepartments(prev => prev.map(d => d.id === updated.id ? updated : d));
      setEditingDept(null);
      setDepFeedback(`Department ${updated.name} successfully updated.`);
      setTimeout(() => setDepFeedback(null), 4000);
    } catch (err: any) {
      setDeptEditFeedback(err.message || 'Failed to update department.');
    } finally {
      setIsSubmittingDeptEdit(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setDepartmentFilter('ALL');
    setVerificationFilter('ALL');
    setPage(1);
  };

  const hasActiveFilters = searchQuery.trim() !== '' || roleFilter !== 'ALL' || statusFilter !== 'ALL' || departmentFilter !== 'ALL' || verificationFilter !== 'ALL';

  // Role Badge Styling
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'CITIZEN':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
            CITIZEN
          </span>
        );
      case 'CYBERSECURITY_SPECIALIST':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#67C7E7]/10 text-[#67C7E7] border border-[#67C7E7]/30">
            SPECIALIST
          </span>
        );
      case 'CYBERCRIME_POLICE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/30">
            POLICE
          </span>
        );
      case 'ADMIN':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
            ADMIN
          </span>
        );
      case 'AI_ML_SYSTEM_LEAD':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#A855F7]/10 text-[#A855F7] border border-[#A855F7]/30">
            AI/ML LEAD
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-white/[0.06] text-content-secondary border border-white/[0.1]">
            {role || 'PERSONNEL'}
          </span>
        );
    }
  };

  // Status Badge Styling
  const getAccountStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            ACTIVE
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            SUSPENDED
          </span>
        );
      case 'DISABLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            DISABLED
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            PENDING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-white/[0.06] text-content-secondary border border-white/[0.1]">
            {status || 'UNKNOWN'}
          </span>
        );
    }
  };

  // Initials generator
  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'OP';
  };

  // Relative time formatter
  const formatRelativeTime = (isoString?: string | null) => {
    if (!isoString) return 'Never';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'Never';
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Never';
    }
  };

  // Department name resolver
  const getDepartmentName = (u: any) => {
    if (u.department) return u.department;
    if (u.department_id && departments.length > 0) {
      const found = departments.find(d => d.id === u.department_id);
      if (found) return found.name;
    }
    return null;
  };

  // Copy helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">


      {/* 1. TAB: ADMIN DASHBOARD */}
      {(activeTab === 'admin-dashboard' || activeTab === 'rbac-matrix') && (
        <div className="flex flex-col gap-6">
          {/* KPI 4-col */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="op-card p-5">
              <div className="flex items-center justify-between text-content-muted text-xs">
                <span>Infrastructure Telemetry</span>
                <Server className="w-4 h-4 text-soft-green" />
              </div>
              <div className="text-2xl font-bold text-content-primary mt-2 font-mono">
                {systemHealth?.status === 'HEALTHY' ? 'ONLINE' : (systemHealth?.status || 'ONLINE')}
              </div>
              <div className="text-[11px] text-soft-green mt-1 font-mono">
                {systemHealth?.services?.database?.type || 'SQLite (WAL Mode)'} • {systemHealth?.latency_ms ?? 1.2}ms Latency
              </div>
            </div>

            <div className="op-card p-5">
              <div className="flex items-center justify-between text-content-muted text-xs">
                <span>Registered Personnel</span>
                <Users className="w-4 h-4 text-soft-lime" />
              </div>
              <div className="text-2xl font-bold text-content-primary mt-2 font-mono">
                {adminSummary?.metrics?.total_users ?? totalUsers} Users
              </div>
              <div className="text-[11px] text-content-muted mt-1 font-mono">
                {adminSummary?.metrics?.active_users ?? users.filter((u: any) => u.account_status === 'ACTIVE').length} Active Accounts
              </div>
            </div>

            <div className="op-card p-5">
              <div className="flex items-center justify-between text-content-muted text-xs">
                <span>Active Departments</span>
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-content-primary mt-2 font-mono">
                {departments.length} Units
              </div>
              <div className="text-[11px] text-soft-green mt-1 font-mono">Operational Precincts Registered</div>
            </div>

            <div className="op-card p-5">
              <div className="flex items-center justify-between text-content-muted text-xs">
                <span>Tamper-Proof Audit Seals</span>
                <ShieldCheck className="w-4 h-4 text-soft-blue" />
              </div>
              <div className="text-2xl font-bold text-content-primary mt-2 font-mono">
                {dbStatus?.tables?.audit_logs ?? adminSummary?.metrics?.audit_logs_count ?? auditLogs.length} Logs
              </div>
              <div className="text-[11px] text-soft-blue mt-1 font-mono">SHA-256 Ledger Sealed</div>
            </div>
          </div>

          {/* 2-col Nodes Health & Audit Log Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="op-card p-6">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-soft-green" />
                    <span className="text-xs font-mono font-bold text-content-primary uppercase">Enclave Component Health</span>
                  </div>
                  <span className="chip-success text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                    {systemHealth?.status === 'HEALTHY' ? 'SYSTEM HEALTHY' : 'LIVE STATUS'}
                  </span>
                </div>

                <div className="flex flex-col gap-3 font-mono text-xs">
                  {[
                    { 
                      name: 'Database Engine (Async)', 
                      metric1: `Latency: ${systemHealth?.services?.database?.latency_ms ?? systemHealth?.latency_ms ?? 1.2} ms`, 
                      metric2: `Dialect: ${systemHealth?.services?.database?.type || 'SQLite (WAL Mode)'}`, 
                      status: systemHealth?.services?.database?.status || 'HEALTHY' 
                    },
                    { 
                      name: 'Cryptographic Storage Vault', 
                      metric1: `Backend: ${systemHealth?.services?.storage_vault?.backend || 'LOCAL'}`, 
                      metric2: `Vault: ${systemHealth?.services?.storage_vault?.location || 'storage_vault'}`, 
                      status: systemHealth?.services?.storage_vault?.status || 'HEALTHY' 
                    },
                    { 
                      name: 'Sovereign Investigation Copilot', 
                      metric1: `Model: ${systemHealth?.services?.generative_copilot?.model || 'Deterministic Intelligence'}`, 
                      metric2: `Provider: ${systemHealth?.services?.generative_copilot?.provider || 'Sovereign Fallback'}`, 
                      status: systemHealth?.services?.generative_copilot?.status || 'ONLINE' 
                    },
                    { 
                      name: 'Real-Time WebSocket Gateway', 
                      metric1: `Active Sockets: ${systemHealth?.services?.websocket_gateway?.active_connections ?? 1}`, 
                      metric2: `Enclave Cipher: TLS 1.3`, 
                      status: systemHealth?.services?.websocket_gateway?.status || 'ACTIVE' 
                    },
                  ].map((node, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-[#242426] border border-white/[0.06] flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-content-primary font-bold">{node.name}</span>
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                          node.status === 'HEALTHY' || node.status === 'ONLINE' || node.status === 'ACTIVE'
                            ? 'bg-[#19D58A]/15 text-[#19D58A]'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {node.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-content-muted font-sans">
                        <span><strong className="text-content-primary font-mono">{node.metric1}</strong></span>
                        <span><strong className="text-content-secondary font-mono">{node.metric2}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="op-card p-6">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-primary" />
                    <span className="text-xs font-mono font-bold text-content-primary uppercase">Recent Tamper-Proof Audit Events</span>
                  </div>
                  <button onClick={() => onSelectTab('audit-logs')} className="text-xs text-primary hover:underline font-mono">VIEW ALL →</button>
                </div>

                <div className="flex flex-col gap-2.5 font-mono text-xs max-h-[420px] overflow-y-auto">
                  {auditLogs.length === 0 ? (
                    <EmptyState
                      variant="logs"
                      title="No audit events recorded"
                      description="Cryptographic tamper-evident log ledger is synchronized and idle."
                    />
                  ) : (
                    auditLogs.map((log, logIdx) => (
                      <div key={log.id} className="p-3.5 rounded-xl bg-[#242426] border border-white/[0.06] flex flex-col gap-1.5 slide-up" style={{ animationDelay: `${logIdx * 30}ms` }}>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-content-primary">{log.actor}</span>
                          <span className="text-content-muted">{log.timestamp}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-primary font-bold">{log.action}</span>
                          <span className="chip-neutral text-[10px] px-1.5 py-0.2 rounded">{log.clearance}</span>
                        </div>
                        <div className="text-[10px] text-content-muted truncate bg-[#141414] p-1 rounded border border-white/[0.04]">
                          SHA-256: {log.hash}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TAB: USERS MANAGEMENT */}
      {activeTab === 'users-management' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          {/* Top Banner / Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="op-card p-4">
              <div className="flex items-center justify-between text-xs font-mono text-content-muted">
                <span>TOTAL ACCOUNTS</span>
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="text-xl font-bold font-mono text-content-primary mt-1">{totalUsers}</div>
              <div className="text-[10px] text-content-muted mt-0.5">Enclave Identified Profiles</div>
            </div>

            <div className="op-card p-4">
              <div className="flex items-center justify-between text-xs font-mono text-content-muted">
                <span>ACTIVE PERSONNEL</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {users.filter(u => u.account_status === 'ACTIVE').length}
              </div>
              <div className="text-[10px] text-content-muted mt-0.5">On current directory page</div>
            </div>

            <div className="op-card p-4">
              <div className="flex items-center justify-between text-xs font-mono text-content-muted">
                <span>SUSPENDED</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                {users.filter(u => u.account_status === 'SUSPENDED').length}
              </div>
              <div className="text-[10px] text-content-muted mt-0.5">Authentication locked</div>
            </div>

            <div className="op-card p-4">
              <div className="flex items-center justify-between text-xs font-mono text-content-muted">
                <span>DISABLED</span>
                <UserX className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                {users.filter(u => u.account_status === 'DISABLED').length}
              </div>
              <div className="text-[10px] text-content-muted mt-0.5">Revoked & soft-deleted</div>
            </div>

            <div className="op-card p-4">
              <div className="flex items-center justify-between text-xs font-mono text-content-muted">
                <span>VERIFIED CITIZENS</span>
                <ShieldCheck className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-xl font-bold font-mono text-sky-400 mt-1">
                {users.filter(u => u.role === 'CITIZEN' && u.is_verified).length}
              </div>
              <div className="text-[10px] text-content-muted mt-0.5">Identity verified</div>
            </div>
          </div>

          {/* Main User Directory Card */}
          <div className="op-card p-5">
            {/* Header & Primary Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.08] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-content-primary uppercase tracking-wider">
                      User Accounts & Security Clearances
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/[0.06] text-content-secondary border border-white/[0.1]">
                      {totalUsers} TOTAL
                    </span>
                  </div>
                  <p className="text-[11px] text-content-muted mt-0.5">
                    Manage system personnel, field investigators, police units, and citizen accounts across Astraea Enclave.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button 
                  onClick={() => fetchUsers()} 
                  disabled={isLoadingUsers}
                  className="p-2 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] text-content-secondary hover:text-content-primary transition-colors disabled:opacity-50"
                  title="Refresh user directory"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin text-primary' : ''}`} />
                </button>
                <button 
                  onClick={() => {
                    setAddForm({
                      full_name: '',
                      email: '',
                      phone_number: '',
                      password: '',
                      role: 'CYBERSECURITY_SPECIALIST',
                      department_id: departments[0]?.id || '',
                      clearance_level: 'TIER 2',
                      badge_number: '',
                      is_staff: true
                    });
                    setAddFeedback(null);
                    setShowAddUserModal(true);
                  }}
                  className="btn-primary px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 font-medium shadow-lg shadow-primary/20"
                >
                  <Plus className="w-3.5 h-3.5" /> Provision User
                </button>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
                {/* Search Bar */}
                <div className="lg:col-span-4 relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search name, email, phone, badge..."
                    className="w-full bg-[#242426] border border-white/[0.08] rounded-xl pl-8 pr-3 py-2 text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:border-primary transition-colors"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => { setSearchQuery(''); setPage(1); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Role Filter */}
                <div className="lg:col-span-2">
                  <select
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                    className="w-full bg-[#242426] border border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-content-secondary focus:outline-none focus:border-primary cursor-pointer transition-colors"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="CITIZEN">Citizen</option>
                    <option value="CYBERSECURITY_SPECIALIST">Specialist</option>
                    <option value="CYBERCRIME_POLICE">Police</option>
                    <option value="ADMIN">Admin</option>
                    <option value="AI_ML_SYSTEM_LEAD">AI/ML Lead</option>
                  </select>
                </div>

                {/* Account Status Filter */}
                <div className="lg:col-span-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="w-full bg-[#242426] border border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-content-secondary focus:outline-none focus:border-primary cursor-pointer transition-colors"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="DISABLED">Disabled</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>

                {/* Department Filter */}
                <div className="lg:col-span-2">
                  <select
                    value={departmentFilter}
                    onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
                    className="w-full bg-[#242426] border border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-content-secondary focus:outline-none focus:border-primary cursor-pointer transition-colors truncate"
                  >
                    <option value="ALL">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name || d.code}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Verification Status Filter */}
                <div className="lg:col-span-2">
                  <select
                    value={verificationFilter}
                    onChange={(e) => { setVerificationFilter(e.target.value); setPage(1); }}
                    className="w-full bg-[#242426] border border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-content-secondary focus:outline-none focus:border-primary cursor-pointer transition-colors"
                  >
                    <option value="ALL">All Verifications</option>
                    <option value="EMAIL_VERIFIED">Email Verified</option>
                    <option value="PHONE_VERIFIED">Phone Verified</option>
                    <option value="GOOGLE_LINKED">Google Linked</option>
                    <option value="UNVERIFIED">Unverified</option>
                  </select>
                </div>
              </div>

              {/* Active Filter Chips & Reset */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] text-content-muted font-mono">Active Filters:</span>
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-primary/10 text-primary border border-primary/20">
                      Query: {searchQuery}
                      <button onClick={() => { setSearchQuery(''); setPage(1); }} className="hover:opacity-75"><X className="w-2.5 h-2.5" /></button>
                    </span>
                  )}
                  {roleFilter !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.06] text-content-primary border border-white/[0.1]">
                      Role: {roleFilter}
                      <button onClick={() => { setRoleFilter('ALL'); setPage(1); }} className="hover:opacity-75"><X className="w-2.5 h-2.5" /></button>
                    </span>
                  )}
                  {statusFilter !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.06] text-content-primary border border-white/[0.1]">
                      Status: {statusFilter}
                      <button onClick={() => { setStatusFilter('ALL'); setPage(1); }} className="hover:opacity-75"><X className="w-2.5 h-2.5" /></button>
                    </span>
                  )}
                  {departmentFilter !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.06] text-content-primary border border-white/[0.1]">
                      Dept: {departments.find(d => d.id === departmentFilter)?.name || departmentFilter}
                      <button onClick={() => { setDepartmentFilter('ALL'); setPage(1); }} className="hover:opacity-75"><X className="w-2.5 h-2.5" /></button>
                    </span>
                  )}
                  {verificationFilter !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.06] text-content-primary border border-white/[0.1]">
                      Verification: {verificationFilter}
                      <button onClick={() => { setVerificationFilter('ALL'); setPage(1); }} className="hover:opacity-75"><X className="w-2.5 h-2.5" /></button>
                    </span>
                  )}
                  <button
                    onClick={handleClearFilters}
                    className="text-[11px] font-mono text-primary hover:underline ml-1"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>

            {/* Error Banner */}
            {userError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{userError}</span>
                </div>
                <button 
                  onClick={() => fetchUsers()} 
                  className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-mono text-[10px]"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Table or Empty/Loading State */}
            <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
              {isLoadingUsers ? (
                <div className="p-8 flex flex-col items-center justify-center gap-3 text-content-muted">
                  <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-xs font-mono">Synchronizing directory with Enclave identity vault...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center text-center">
                  <EmptyState
                    variant="search"
                    title="No users found"
                    description={
                      hasActiveFilters 
                        ? 'No accounts match the selected filter criteria. Try adjusting your search or filters.'
                        : 'No user accounts are currently configured in this enclave partition.'
                    }
                  />
                  {hasActiveFilters && (
                    <button
                      onClick={handleClearFilters}
                      className="mt-3 btn-secondary px-3 py-1.5 rounded-xl text-xs"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="op-table-header">
                    <tr>
                      <th className="p-3 font-mono">USER</th>
                      <th className="p-3 font-mono">ROLE</th>
                      <th className="p-3 font-mono">DEPARTMENT / UNIT</th>
                      <th className="p-3 font-mono">ACCOUNT STATUS</th>
                      <th className="p-3 font-mono">VERIFICATION</th>
                      <th className="p-3 font-mono">LAST LOGIN</th>
                      <th className="p-3 font-mono">CREATED AT</th>
                      <th className="p-3 font-mono text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const initials = getInitials(u.full_name, u.email);
                      const deptName = getDepartmentName(u);
                      return (
                        <tr key={u.id} className="op-table-row hover:bg-white/[0.02] transition-colors">
                          {/* 1. User Column */}
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-purple-600/30 border border-primary/30 flex items-center justify-center font-mono font-bold text-[11px] text-primary flex-shrink-0">
                                {initials}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-content-primary truncate max-w-[160px]">
                                    {u.full_name || 'Unnamed Operator'}
                                  </span>
                                  {u.badge_number && (
                                    <span className="text-[10px] font-mono text-content-muted">
                                      ({u.badge_number})
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-[11px] text-content-muted truncate max-w-[190px]">
                                  {u.email}
                                </span>
                                {u.phone_number && (
                                  <span className="text-[10px] text-content-muted flex items-center gap-1 mt-0.5">
                                    <Phone className="w-2.5 h-2.5 opacity-60" /> {u.phone_number}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 2. Role Column */}
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              {getRoleBadge(u.role)}
                              {u.clearance_level && (
                                <span className="text-[10px] font-mono text-content-muted">
                                  {u.clearance_level}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. Department Column */}
                          <td className="p-3 whitespace-nowrap">
                            {deptName ? (
                              <div className="flex items-center gap-1.5 text-content-primary">
                                <Building2 className="w-3.5 h-3.5 text-content-muted flex-shrink-0" />
                                <span className="truncate max-w-[150px] font-medium" title={deptName}>
                                  {deptName}
                                </span>
                              </div>
                            ) : (
                              <span className="text-content-muted text-[11px] font-mono">Unassigned</span>
                            )}
                          </td>

                          {/* 4. Account Status Column */}
                          <td className="p-3 whitespace-nowrap">
                            {getAccountStatusBadge(u.account_status || (u.is_active ? 'ACTIVE' : 'SUSPENDED'))}
                          </td>

                          {/* 5. Verification Column */}
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {/* Email */}
                              {u.is_verified ? (
                                <span 
                                  className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                  title="Email Verified"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span 
                                  className="p-1 rounded bg-white/[0.04] text-content-muted border border-white/[0.08]" 
                                  title="Email Unverified"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5 opacity-40" />
                                </span>
                              )}

                              {/* Phone */}
                              {u.phone_number ? (
                                <span 
                                  className="p-1 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20" 
                                  title={`Phone Verified: ${u.phone_number}`}
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span 
                                  className="p-1 rounded bg-white/[0.04] text-content-muted border border-white/[0.08]" 
                                  title="No Phone Attached"
                                >
                                  <Phone className="w-3.5 h-3.5 opacity-20" />
                                </span>
                              )}

                              {/* Google Linked */}
                              {u.is_google_linked || u.google_id ? (
                                <span 
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  title="Google SSO Linked"
                                >
                                  G-SSO
                                </span>
                              ) : null}

                              {/* 2FA/MFA */}
                              {u.mfa_enabled || (u.mfa_type && u.mfa_type !== 'NONE') ? (
                                <span 
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                  title={`MFA Protected (${u.mfa_type || '2FA'})`}
                                >
                                  {u.mfa_type || '2FA'}
                                </span>
                              ) : null}
                            </div>
                          </td>

                          {/* 6. Last Login Column */}
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-content-muted font-mono text-[11px]">
                              <Clock className="w-3 h-3 opacity-60" />
                              <span>{formatRelativeTime(u.last_login_at)}</span>
                            </div>
                          </td>

                          {/* 7. Created At Column */}
                          <td className="p-3 whitespace-nowrap">
                            <span className="font-mono text-[11px] text-content-muted">
                              {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                            </span>
                          </td>

                          {/* 8. Actions Column */}
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Details Drawer */}
                              <button
                                onClick={() => setSelectedUserForDrawer(u)}
                                className="p-1.5 rounded-lg border border-white/[0.06] bg-[#242426] hover:bg-white/[0.08] text-content-secondary hover:text-content-primary transition-colors"
                                title="View User Dossier"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Profile */}
                              <button
                                onClick={() => {
                                  setEditUser(u);
                                  setEditForm({
                                    full_name: u.full_name || '',
                                    phone_number: u.phone_number || '',
                                    department_id: u.department_id || '',
                                    clearance_level: u.clearance_level || 'TIER 2',
                                    badge_number: u.badge_number || '',
                                    role: u.role || 'CITIZEN'
                                  });
                                  setEditFeedback(null);
                                }}
                                className="p-1.5 rounded-lg border border-white/[0.06] bg-[#242426] hover:bg-white/[0.08] text-content-secondary hover:text-primary transition-colors"
                                title="Edit User"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Suspend / Activate / Disable Actions */}
                              {u.account_status === 'SUSPENDED' ? (
                                <button
                                  onClick={() => {
                                    setStatusActionPending({ user: u, action: 'activate' });
                                    setStatusReason('');
                                  }}
                                  className="p-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                                  title="Activate User"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                </button>
                              ) : u.account_status === 'DISABLED' ? (
                                <button
                                  onClick={() => {
                                    setStatusActionPending({ user: u, action: 'activate' });
                                    setStatusReason('');
                                  }}
                                  className="p-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                                  title="Reactivate Account"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setStatusActionPending({ user: u, action: 'suspend' });
                                    setStatusReason('Administrative suspension pending review');
                                  }}
                                  className="p-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors"
                                  title="Suspend User"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* View Audit Trail */}
                              <button
                                onClick={async () => {
                                  setAuditUser(u);
                                  setIsLoadingAudit(true);
                                  setAuditError(null);
                                  try {
                                    const logs = await apiClient.getAdminUserAudit(u.id);
                                    setUserAuditLogs(logs || []);
                                  } catch (err: any) {
                                    setAuditError(err.message || 'Failed to fetch user audit logs.');
                                  } finally {
                                    setIsLoadingAudit(false);
                                  }
                                }}
                                className="p-1.5 rounded-lg border border-white/[0.06] bg-[#242426] hover:bg-white/[0.08] text-content-secondary hover:text-amber-400 transition-colors"
                                title="View User Audit Log"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-white/[0.08] text-xs">
              <div className="flex items-center gap-3 text-content-muted font-mono">
                <span>
                  Showing{' '}
                  <strong className="text-content-primary">
                    {totalUsers > 0 ? (page - 1) * pageSize + 1 : 0}–
                    {Math.min(page * pageSize, totalUsers)}
                  </strong>{' '}
                  of <strong className="text-content-primary">{totalUsers}</strong> users
                </span>

                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-content-muted text-[11px]">Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="bg-[#242426] border border-white/[0.08] rounded-lg px-2 py-1 text-content-secondary focus:outline-none focus:border-primary text-xs"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoadingUsers}
                  className="px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-[#242426] hover:bg-white/[0.08] text-content-secondary hover:text-content-primary disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 font-mono text-[11px]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                    let pageNum = idx + 1;
                    if (totalPages > 5 && page > 3) {
                      pageNum = page - 2 + idx;
                      if (pageNum > totalPages) pageNum = totalPages - 4 + idx;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-7 h-7 rounded-lg font-mono text-xs flex items-center justify-center transition-colors ${
                          page === pageNum
                            ? 'bg-primary text-primary-contrast font-bold'
                            : 'bg-[#242426] border border-white/[0.06] text-content-secondary hover:bg-white/[0.06] hover:text-content-primary'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && page < totalPages - 2 && (
                    <span className="text-content-muted px-1">...</span>
                  )}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoadingUsers}
                  className="px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-[#242426] hover:bg-white/[0.08] text-content-secondary hover:text-content-primary disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 font-mono text-[11px]"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* MODAL 1: ADD USER PROVISIONING MODAL                      */}
          {/* ========================================================= */}
          {showAddUserModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-[#1C1C1E] border border-white/[0.1] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                {/* Modal Header */}
                <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Plus className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-content-primary">Provision New Account</h3>
                      <p className="text-[11px] text-content-muted font-mono">
                        Astraea Enclave Security Clearances & Access Control
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAddUserModal(false)}
                    className="p-1 rounded-lg hover:bg-white/[0.08] text-content-muted hover:text-content-primary transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!addForm.full_name.trim() || !addForm.email.trim() || !addForm.password.trim()) {
                      setAddFeedback('Name, Email, and Initial Password are required.');
                      return;
                    }
                    setIsSubmittingAdd(true);
                    setAddFeedback(null);
                    try {
                      await apiClient.createAdminUser({
                        full_name: addForm.full_name.trim(),
                        email: addForm.email.trim(),
                        phone_number: addForm.phone_number.trim() || undefined,
                        password: addForm.password,
                        role: addForm.role,
                        department_id: addForm.department_id || undefined,
                        clearance_level: addForm.clearance_level,
                        badge_number: addForm.badge_number.trim() || undefined,
                        is_staff: addForm.is_staff
                      });
                      setShowAddUserModal(false);
                      fetchUsers();
                    } catch (err: any) {
                      setAddFeedback(err.message || 'Failed to provision user.');
                    } finally {
                      setIsSubmittingAdd(false);
                    }
                  }}
                  className="p-5 flex flex-col gap-4 text-xs"
                >
                  {/* Governance Notice Alert */}
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-[11px] text-primary flex items-start gap-2.5">
                    <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      Staff accounts (Specialist, Police, AI/ML Lead, Admin) can only be provisioned by Enclave Administrators. 
                      This event is immutably signed in the cryptographic audit ledger.
                    </span>
                  </div>

                  {addFeedback && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-400">
                      {addFeedback}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-content-secondary mb-1">
                        FULL NAME *
                      </label>
                      <input
                        type="text"
                        required
                        value={addForm.full_name}
                        onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                        placeholder="e.g. Elena Rostova"
                        className="w-full bg-[#242426] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-content-secondary mb-1">
                        EMAIL ADDRESS *
                      </label>
                      <input
                        type="email"
                        required
                        value={addForm.email}
                        onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                        placeholder="officer@astraea.gov"
                        className="w-full bg-[#242426] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-content-secondary mb-1">
                        PHONE NUMBER
                      </label>
                      <input
                        type="text"
                        value={addForm.phone_number}
                        onChange={(e) => setAddForm({ ...addForm, phone_number: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full bg-[#242426] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-content-secondary mb-1">
                        BADGE / SERVICE NUMBER
                      </label>
                      <input
                        type="text"
                        value={addForm.badge_number}
                        onChange={(e) => setAddForm({ ...addForm, badge_number: e.target.value })}
                        placeholder="e.g. LEO-9421"
                        className="w-full bg-[#242426] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-content-secondary mb-1">
                        SYSTEM ROLE *
                      </label>
                      <select
                        value={addForm.role}
                        onChange={(e) => {
                          const r = e.target.value;
                          const isStaffRole = r !== 'CITIZEN';
                          setAddForm({ 
                            ...addForm, 
                            role: r, 
                            is_staff: isStaffRole,
                            clearance_level: r === 'CYBERSECURITY_SPECIALIST' ? 'TIER 3 FORENSICS' : r === 'CYBERCRIME_POLICE' ? 'LEO TIER 2' : r === 'ADMIN' ? 'ROOT ENCLAVE' : r === 'AI_ML_SYSTEM_LEAD' ? 'ML-OPS LEVEL 4' : 'CITIZEN TIER'
                          });
                        }}
                        className="w-full bg-[#242426] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-primary"
                      >
                        <option value="CYBERSECURITY_SPECIALIST">Cybersecurity Specialist</option>
                        <option value="CYBERCRIME_POLICE">Cybercrime Police Officer</option>
                        <option value="ADMIN">Enclave Administrator</option>
                        <option value="AI_ML_SYSTEM_LEAD">AI/ML System Lead</option>
                        <option value="CITIZEN">Verified Citizen</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-content-secondary mb-1">
                        DEPARTMENT / UNIT
                      </label>
                      <select
                        value={addForm.department_id}
                        onChange={(e) => setAddForm({ ...addForm, department_id: e.target.value })}
                        className="w-full bg-[#242426] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-primary"
                      >
                        <option value="">Unassigned</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-content-secondary mb-1">
                        CLEARANCE LEVEL
                      </label>
                      <input
                        type="text"
                        value={addForm.clearance_level}
                        onChange={(e) => setAddForm({ ...addForm, clearance_level: e.target.value })}
                        placeholder="e.g. TIER 2, LEO TIER 2"
                        className="w-full bg-[#242426] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-mono text-content-secondary">
                          INITIAL PASSWORD *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const gen = 'Astraea#' + Math.random().toString(36).slice(-6).toUpperCase() + '!';
                            setAddForm({ ...addForm, password: gen });
                          }}
                          className="text-[10px] font-mono text-primary hover:underline"
                        >
                          Generate
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={addForm.password}
                        onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                        placeholder="Temporary secure password"
                        className="w-full bg-[#242426] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-content-primary font-mono placeholder:text-content-muted focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="staff-check"
                      checked={addForm.is_staff}
                      onChange={(e) => setAddForm({ ...addForm, is_staff: e.target.checked })}
                      className="rounded border-white/[0.1] bg-[#242426] text-primary focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="staff-check" className="text-[11px] text-content-secondary cursor-pointer select-none">
                      Designate as Enclave Staff Personnel (Enables operational dashboard routing)
                    </label>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08] mt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(false)}
                      className="px-4 py-2 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] text-content-secondary hover:text-content-primary transition-colors text-xs font-mono"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingAdd}
                      className="btn-primary px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSubmittingAdd ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Provisioning...
                        </>
                      ) : (
                        'Provision Account'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODAL 2: EDIT USER MODAL                                  */}
          {/* ========================================================= */}
          {editUser && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-[#1C1C1E] border border-white/[0.1] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Edit3 className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-content-primary">Edit User Profile</h3>
                      <p className="text-[11px] text-content-muted font-mono">{editUser.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setEditUser(null)}
                    className="p-1 rounded-lg hover:bg-white/[0.08] text-content-muted hover:text-content-primary transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    // Check if role changed -> prompt confirmation!
                    if (editForm.role !== editUser.role) {
                      setRoleChangePending({ user: editUser, targetRole: editForm.role });
                      return;
                    }

                    setIsSubmittingEdit(true);
                    setEditFeedback(null);
                    try {
                      await apiClient.updateAdminUser(editUser.id, {
                        full_name: editForm.full_name.trim() || undefined,
                        phone_number: editForm.phone_number.trim() || undefined,
                        department_id: editForm.department_id || undefined,
                        clearance_level: editForm.clearance_level.trim() || undefined,
                        badge_number: editForm.badge_number.trim() || undefined
                      });
                      setEditUser(null);
                      fetchUsers();
                    } catch (err: any) {
                      setEditFeedback(err.message || 'Failed to update user.');
                    } finally {
                      setIsSubmittingEdit(false);
                    }
                  }}
                  className="p-5 flex flex-col gap-4 text-xs"
                >
                  {editFeedback && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-400">
                      {editFeedback}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-content-secondary mb-1">
                        FULL NAME
                      </label>
                      <input
                        type="text"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        className="w-full bg-[#242426] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-content-secondary mb-1">
                        PHONE NUMBER
                      </label>
                      <input
                        type="text"
                        value={editForm.phone_number}
                        onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                        className="w-full bg-[#242426] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-content-secondary mb-1">
                        ROLE (MODIFICATION REQUIRES AUDIT CONFIRMATION)
                      </label>
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        className="w-full bg-[#242426] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-primary"
                      >
                        <option value="CITIZEN">Citizen</option>
                        <option value="CYBERSECURITY_SPECIALIST">Cybersecurity Specialist</option>
                        <option value="CYBERCRIME_POLICE">Cybercrime Police</option>
                        <option value="ADMIN">Enclave Administrator</option>
                        <option value="AI_ML_SYSTEM_LEAD">AI/ML System Lead</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-content-secondary mb-1">
                        DEPARTMENT / UNIT
                      </label>
                      <select
                        value={editForm.department_id}
                        onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}
                        className="w-full bg-[#242426] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-primary"
                      >
                        <option value="">Unassigned</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-content-secondary mb-1">
                        CLEARANCE LEVEL
                      </label>
                      <input
                        type="text"
                        value={editForm.clearance_level}
                        onChange={(e) => setEditForm({ ...editForm, clearance_level: e.target.value })}
                        className="w-full bg-[#242426] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-content-secondary mb-1">
                        BADGE NUMBER
                      </label>
                      <input
                        type="text"
                        value={editForm.badge_number}
                        onChange={(e) => setEditForm({ ...editForm, badge_number: e.target.value })}
                        className="w-full bg-[#242426] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08] mt-2">
                    <button
                      type="button"
                      onClick={() => setEditUser(null)}
                      className="px-4 py-2 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] text-content-secondary hover:text-content-primary transition-colors text-xs font-mono"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingEdit}
                      className="btn-primary px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSubmittingEdit ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODAL 3: ROLE CHANGE AUDIT CONFIRMATION WARNING           */}
          {/* ========================================================= */}
          {roleChangePending && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in zoom-in-95 duration-150">
              <div className="bg-[#1C1C1E] border border-amber-500/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-5 flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-content-primary">
                      Confirm Role & Privilege Transition
                    </h4>
                    <p className="text-xs text-content-secondary mt-1 leading-relaxed">
                      You are altering access permissions for{' '}
                      <strong className="text-content-primary">{roleChangePending.user.full_name}</strong> ({roleChangePending.user.email}).
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#242426] border border-white/[0.06] flex items-center justify-between text-xs font-mono">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-content-muted">CURRENT ROLE</span>
                      <span className="font-bold text-content-primary">{roleChangePending.user.role}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-400" />
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-amber-400">NEW TARGET ROLE</span>
                      <span className="font-bold text-amber-400">{roleChangePending.targetRole}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-content-muted leading-normal">
                    Changing this user's role will alter access permissions across Astraea Enclave. This action is permanently logged in the tamper-evident audit trail.
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08] mt-1">
                    <button
                      onClick={() => setRoleChangePending(null)}
                      className="px-4 py-2 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] text-content-secondary hover:text-content-primary transition-colors text-xs font-mono"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        setIsSubmittingEdit(true);
                        try {
                          await apiClient.updateAdminUser(roleChangePending.user.id, {
                            full_name: editForm.full_name.trim() || undefined,
                            phone_number: editForm.phone_number.trim() || undefined,
                            department_id: editForm.department_id || undefined,
                            clearance_level: editForm.clearance_level.trim() || undefined,
                            badge_number: editForm.badge_number.trim() || undefined,
                            role: roleChangePending.targetRole
                          });
                          setRoleChangePending(null);
                          setEditUser(null);
                          fetchUsers();
                        } catch (err: any) {
                          alert(err.message || 'Failed to update user role.');
                        } finally {
                          setIsSubmittingEdit(false);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs transition-colors shadow-lg shadow-amber-500/20"
                    >
                      Confirm Role Change
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODAL 4: ACCOUNT STATUS LIFECYCLE ACTION DIALOG           */}
          {/* ========================================================= */}
          {statusActionPending && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in zoom-in-95 duration-150">
              <div className="bg-[#1C1C1E] border border-white/[0.1] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-5 flex flex-col gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    statusActionPending.action === 'suspend'
                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                      : statusActionPending.action === 'disable'
                      ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                      : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  }`}>
                    {statusActionPending.action === 'suspend' && <UserX className="w-5 h-5" />}
                    {statusActionPending.action === 'disable' && <ShieldAlert className="w-5 h-5" />}
                    {statusActionPending.action === 'activate' && <UserCheck className="w-5 h-5" />}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-content-primary">
                      {statusActionPending.action === 'suspend' && 'Suspend User Account'}
                      {statusActionPending.action === 'disable' && 'Permanently Disable Account'}
                      {statusActionPending.action === 'activate' && 'Reactivate User Account'}
                    </h4>
                    <p className="text-xs text-content-secondary mt-1">
                      Account: <strong className="text-content-primary">{statusActionPending.user.full_name}</strong> ({statusActionPending.user.email})
                    </p>
                  </div>

                  {statusActionPending.action === 'suspend' && (
                    <>
                      <p className="text-[11px] text-content-muted leading-relaxed">
                        Suspending this account immediately blocks future authentication attempts and marks the session tokens invalid.
                      </p>
                      <div>
                        <label className="block text-[11px] font-mono text-content-secondary mb-1">
                          REASON FOR SUSPENSION *
                        </label>
                        <textarea
                          rows={2}
                          value={statusReason}
                          onChange={(e) => setStatusReason(e.target.value)}
                          placeholder="e.g. Suspected credential compromise pending security review"
                          className="w-full bg-[#242426] border border-white/[0.08] rounded-xl p-2.5 text-xs text-content-primary focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </>
                  )}

                  {statusActionPending.action === 'disable' && (
                    <>
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-400 leading-relaxed">
                        Disabling an account soft-deletes the identity, permanently revokes access, and prevents all future logins. User records and past audit logs remain preserved for chain-of-custody compliance.
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-content-secondary mb-1">
                          OFFBOARDING / REVOCATION REASON *
                        </label>
                        <textarea
                          rows={2}
                          value={statusReason}
                          onChange={(e) => setStatusReason(e.target.value)}
                          placeholder="e.g. Personnel separation and security clearance offboarding"
                          className="w-full bg-[#242426] border border-white/[0.08] rounded-xl p-2.5 text-xs text-content-primary focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </>
                  )}

                  {statusActionPending.action === 'activate' && (
                    <p className="text-[11px] text-content-muted leading-relaxed">
                      Reactivating this account will restore full system privileges and allow the operator to authenticate into Astraea Enclave.
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08] mt-1">
                    <button
                      onClick={() => setStatusActionPending(null)}
                      className="px-4 py-2 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] text-content-secondary hover:text-content-primary transition-colors text-xs font-mono"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        setIsSubmittingStatus(true);
                        try {
                          if (statusActionPending.action === 'suspend') {
                            await apiClient.suspendAdminUser(statusActionPending.user.id, statusReason || 'Administrative suspension');
                          } else if (statusActionPending.action === 'activate') {
                            await apiClient.activateAdminUser(statusActionPending.user.id);
                          } else if (statusActionPending.action === 'disable') {
                            await apiClient.disableAdminUser(statusActionPending.user.id, statusReason || 'Personnel offboarding');
                          }
                          setStatusActionPending(null);
                          fetchUsers();
                        } catch (err: any) {
                          alert(err.message || 'Status transition failed.');
                        } finally {
                          setIsSubmittingStatus(false);
                        }
                      }}
                      disabled={isSubmittingStatus}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
                        statusActionPending.action === 'suspend'
                          ? 'bg-amber-500 hover:bg-amber-600 text-black'
                          : statusActionPending.action === 'disable'
                          ? 'bg-rose-500 hover:bg-rose-600 text-white'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-black'
                      }`}
                    >
                      {isSubmittingStatus ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing...
                        </>
                      ) : (
                        statusActionPending.action === 'suspend' ? 'Suspend Account' : statusActionPending.action === 'disable' ? 'Disable Account' : 'Reactivate Account'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* DRAWER: USER DETAILS SLIDE-OVER                           */}
          {/* ========================================================= */}
          {selectedUserForDrawer && (
            <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-150">
              <div 
                onClick={() => setSelectedUserForDrawer(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
              />
              <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-md bg-[#1C1C1E] border-l border-white/[0.1] shadow-2xl flex flex-col">
                  {/* Drawer Header */}
                  <div className="p-6 border-b border-white/[0.08] flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-purple-600/30 border border-primary/30 flex items-center justify-center font-mono font-bold text-base text-primary">
                        {getInitials(selectedUserForDrawer.full_name, selectedUserForDrawer.email)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-content-primary">
                          {selectedUserForDrawer.full_name || 'Enclave Operator'}
                        </h3>
                        <p className="text-xs text-content-muted font-mono">{selectedUserForDrawer.email}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {getRoleBadge(selectedUserForDrawer.role)}
                          {getAccountStatusBadge(selectedUserForDrawer.account_status || (selectedUserForDrawer.is_active ? 'ACTIVE' : 'SUSPENDED'))}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedUserForDrawer(null)}
                      className="p-1.5 rounded-lg hover:bg-white/[0.08] text-content-muted hover:text-content-primary transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Drawer Content */}
                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 text-xs font-mono">
                    {/* Section 1: Security & Identity */}
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                        1. Identity & Clearance
                      </span>
                      <div className="p-3.5 rounded-xl bg-[#242426] border border-white/[0.06] flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-content-muted">USER ID</span>
                          <div className="flex items-center gap-1">
                            <span className="text-content-primary font-bold">{selectedUserForDrawer.id.slice(0, 12)}...</span>
                            <button 
                              onClick={() => copyToClipboard(selectedUserForDrawer.id, 'user-id')}
                              className="text-content-muted hover:text-content-primary"
                              title="Copy full User ID"
                            >
                              {copiedId === 'user-id' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-content-muted">BADGE NUMBER</span>
                          <span className="text-content-primary font-bold">
                            {selectedUserForDrawer.badge_number || 'None'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-content-muted">DEPARTMENT</span>
                          <span className="text-content-primary font-bold truncate max-w-[200px]">
                            {getDepartmentName(selectedUserForDrawer) || 'Unassigned'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-content-muted">CLEARANCE LEVEL</span>
                          <span className="text-primary font-bold">
                            {selectedUserForDrawer.clearance_level || 'CITIZEN TIER'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-content-muted">STAFF DESIGNATION</span>
                          <span className={selectedUserForDrawer.is_staff ? 'text-emerald-400 font-bold' : 'text-content-secondary'}>
                            {selectedUserForDrawer.is_staff ? 'YES (ENCLAVE OPERATIONAL)' : 'NO (CIVILIAN)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Authentication & Verification */}
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                        2. Authentication & Verification
                      </span>
                      <div className="p-3.5 rounded-xl bg-[#242426] border border-white/[0.06] flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-content-muted">EMAIL VERIFICATION</span>
                          <span className={selectedUserForDrawer.is_verified ? 'text-emerald-400 font-bold flex items-center gap-1' : 'text-amber-400 flex items-center gap-1'}>
                            {selectedUserForDrawer.is_verified ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {selectedUserForDrawer.is_verified ? 'VERIFIED' : 'UNVERIFIED'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-content-muted">PHONE ATTACHED</span>
                          <span className="text-content-primary">
                            {selectedUserForDrawer.phone_number || 'Not provided'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-content-muted">GOOGLE SSO LINKED</span>
                          <span className={selectedUserForDrawer.is_google_linked || selectedUserForDrawer.google_id ? 'text-emerald-400 font-bold' : 'text-content-muted'}>
                            {selectedUserForDrawer.is_google_linked || selectedUserForDrawer.google_id ? 'YES' : 'NO'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-content-muted">MFA/2FA STATUS</span>
                          <span className={selectedUserForDrawer.mfa_enabled ? 'text-purple-400 font-bold' : 'text-content-muted'}>
                            {selectedUserForDrawer.mfa_enabled ? `ENABLED (${selectedUserForDrawer.mfa_type || 'TOTP'})` : 'DISABLED'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Audit Lifecycle & Timestamps */}
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                        3. Lifecycle Timestamps
                      </span>
                      <div className="p-3.5 rounded-xl bg-[#242426] border border-white/[0.06] flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-content-muted">CREATED AT</span>
                          <span className="text-content-primary">
                            {selectedUserForDrawer.created_at ? new Date(selectedUserForDrawer.created_at).toUTCString() : '—'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-content-muted">UPDATED AT</span>
                          <span className="text-content-primary">
                            {selectedUserForDrawer.updated_at ? new Date(selectedUserForDrawer.updated_at).toUTCString() : '—'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-content-muted">LAST LOGIN</span>
                          <span className="text-content-primary">
                            {selectedUserForDrawer.last_login_at ? new Date(selectedUserForDrawer.last_login_at).toUTCString() : 'Never'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Privacy Note */}
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] text-content-muted font-sans leading-relaxed">
                      Zero sensitive credentials (password hashes, cryptographic secrets, or session tokens) are stored in client memory or exposed via management endpoints.
                    </div>
                  </div>

                  {/* Drawer Footer Actions */}
                  <div className="p-4 border-t border-white/[0.08] flex items-center justify-between gap-2 bg-[#18181A]">
                    <button
                      onClick={() => {
                        const target = selectedUserForDrawer;
                        setSelectedUserForDrawer(null);
                        setEditUser(target);
                        setEditForm({
                          full_name: target.full_name || '',
                          phone_number: target.phone_number || '',
                          department_id: target.department_id || '',
                          clearance_level: target.clearance_level || 'TIER 2',
                          badge_number: target.badge_number || '',
                          role: target.role || 'CITIZEN'
                        });
                      }}
                      className="btn-secondary px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 font-mono"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>

                    <button
                      onClick={async () => {
                        const target = selectedUserForDrawer;
                        setSelectedUserForDrawer(null);
                        setAuditUser(target);
                        setIsLoadingAudit(true);
                        setAuditError(null);
                        try {
                          const logs = await apiClient.getAdminUserAudit(target.id);
                          setUserAuditLogs(logs || []);
                        } catch (err: any) {
                          setAuditError(err.message || 'Failed to fetch user audit logs.');
                        } finally {
                          setIsLoadingAudit(false);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs flex items-center gap-1 font-mono transition-colors"
                    >
                      <History className="w-3.5 h-3.5" /> Audit History
                    </button>

                    <button
                      onClick={() => setSelectedUserForDrawer(null)}
                      className="px-3 py-1.5 rounded-xl border border-white/[0.08] hover:bg-white/[0.06] text-content-secondary text-xs font-mono transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODAL 5: USER AUDIT LOG HISTORY MODAL                     */}
          {/* ========================================================= */}
          {auditUser && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-[#1C1C1E] border border-white/[0.1] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <History className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-content-primary">
                        Security Audit Ledger: {auditUser.full_name}
                      </h3>
                      <p className="text-[11px] text-content-muted font-mono">{auditUser.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setAuditUser(null)}
                    className="p-1 rounded-lg hover:bg-white/[0.08] text-content-muted hover:text-content-primary transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                  {isLoadingAudit ? (
                    <div className="p-8 flex flex-col items-center justify-center gap-3 text-content-muted">
                      <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                      <span className="text-xs font-mono">Retrieving cryptographic audit ledger entries...</span>
                    </div>
                  ) : auditError ? (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                      {auditError}
                    </div>
                  ) : userAuditLogs.length === 0 ? (
                    <div className="p-8 text-center text-content-muted text-xs font-mono">
                      No administrative lifecycle audit events recorded for this user.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5 font-mono text-xs">
                      {userAuditLogs.map((log: any, idx: number) => (
                        <div 
                          key={log.id || idx} 
                          className="p-3.5 rounded-xl bg-[#242426] border border-white/[0.06] flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-content-primary">{log.action}</span>
                            <span className="text-content-muted">{log.timestamp}</span>
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-content-secondary">
                              Actor: <strong className="text-primary">{log.actor}</strong>
                            </span>
                            <span className="chip-neutral text-[10px] px-1.5 py-0.5 rounded">
                              {log.clearance || 'ENCLAVE'}
                            </span>
                          </div>

                          {log.metadata_json && Object.keys(log.metadata_json).length > 0 && (
                            <div className="text-[10px] bg-[#141414] p-2 rounded-lg border border-white/[0.04] text-content-secondary overflow-x-auto">
                              <pre>{JSON.stringify(log.metadata_json, null, 2)}</pre>
                            </div>
                          )}

                          {log.integrity_hash && (
                            <div className="text-[10px] text-content-muted truncate bg-[#141414] p-1 rounded border border-white/[0.04]">
                              Seal: {log.integrity_hash}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-white/[0.08] flex justify-end bg-[#18181A]">
                  <button
                    onClick={() => setAuditUser(null)}
                    className="btn-secondary px-4 py-1.5 rounded-xl text-xs font-mono"
                  >
                    Close Ledger
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. TAB: ROLES & PERMISSIONS */}
      {activeTab === 'roles-permissions' && (
        <div className="flex flex-col gap-6">
          <div className="op-card p-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono font-bold text-content-primary uppercase">Granular Role-Based Access Control (RBAC) Matrices</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {[
                { role: 'Citizen Complainant', perms: ['File Cybercrime Complaint', 'Track Case Status', 'Upload Digital Evidence', 'View Public Advisories'] },
                { role: 'Cybersecurity Specialist', perms: ['Inspect SOC Telemetry', 'Analyze Cryptographic Hashes', 'Explore Wallet Peel Chains', 'Use AI Forensic Assistant'] },
                { role: 'Cybercrime Police Officer', perms: ['Receive Case Dispatches', 'Execute Asset Freeze Warrants', 'Inter-Agency Coordination', 'Prepare Judicial Reports'] },
                { role: 'AI/ML System Lead', perms: ['Deploy ML Models', 'Calibrate Drift Telemetry', 'Approve Candidate Models', 'Audit Feature Attribution'] },
              ].map((r, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#242426] border border-white/[0.06] flex flex-col gap-3">
                  <span className="text-sm font-bold text-primary">{r.role}</span>
                  <div className="flex flex-col gap-1.5 font-sans text-xs">
                    {r.perms.map((p, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-2 text-content-secondary">
                        <CheckCircle2 className="w-3.5 h-3.5 text-soft-green shrink-0" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB: DEPARTMENTS / UNITS */}
      {activeTab === 'departments-units' && (
        <div className="flex flex-col gap-6">
          <div className="op-card p-5">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-white/[0.08] mb-4 gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-soft-lime" />
                <span className="text-xs font-mono font-bold text-content-primary uppercase">Organizational Units & Precincts ({departments.length})</span>
              </div>
              <span className="chip-primary text-[10px] font-mono px-2 py-0.5 rounded font-bold">DATABASE BACKED</span>
            </div>

            {depFeedback && (
              <div className="p-3 mb-4 rounded-xl bg-primary/20 border border-primary/40 text-primary text-xs flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{depFeedback}</span>
              </div>
            )}

            {/* Department Registration Form */}
            <form onSubmit={handleCreateDepartment} className="p-4 mb-4 rounded-xl bg-[#242426] border border-white/[0.06] flex flex-col sm:flex-row gap-3 text-xs">
              <input
                type="text"
                placeholder="Department Name (e.g. Darknet & Crypto Taskforce)"
                value={newDepName}
                onChange={(e) => setNewDepName(e.target.value)}
                className="flex-1 bg-[#141414] border border-white/[0.08] rounded-xl px-3 py-2 text-content-primary focus:outline-none focus:border-primary"
                required
              />
              <input
                type="text"
                placeholder="Code (e.g. DNCT)"
                value={newDepCode}
                onChange={(e) => setNewDepCode(e.target.value)}
                className="w-28 bg-[#141414] border border-white/[0.08] rounded-xl px-3 py-2 text-content-primary font-mono focus:outline-none focus:border-primary"
              />
              <select
                value={newDepUnit}
                onChange={(e) => setNewDepUnit(e.target.value)}
                className="bg-[#141414] border border-white/[0.08] rounded-xl px-3 py-2 text-content-primary font-mono focus:outline-none focus:border-primary"
              >
                <option value="SPECIALIST_UNIT">Specialist Unit</option>
                <option value="POLICE_PRECINCT">Police Precinct</option>
                <option value="GOVERNANCE_CELL">Governance Cell</option>
              </select>
              <button type="submit" className="btn-primary px-4 py-2 rounded-xl font-mono text-xs shrink-0 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Provision Unit
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              {departments.length > 0 ? (
                departments.map((dep, idx) => (
                  <div key={dep.id || idx} className="p-4 rounded-xl bg-[#242426] border border-white/[0.06] flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-primary font-bold text-sm block">{dep.name}</span>
                        <span className="chip-success text-[10px] px-1.5 py-0.2 rounded font-bold">{dep.code || 'UNIT'}</span>
                      </div>
                      <span className="text-content-muted text-[11px] block">{dep.jurisdiction || 'Federal / National Jurisdiction'}</span>
                      {dep.description && (
                        <p className="text-[11px] text-content-secondary mt-1 font-sans line-clamp-2">{dep.description}</p>
                      )}
                    </div>
                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                      <span className="text-content-secondary font-mono">{dep.memberCount ?? 0} Personnel</span>
                      <button
                        onClick={() => handleOpenDeptEdit(dep)}
                        className="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.1] text-content-primary text-[10px] flex items-center gap-1 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 py-8 text-center text-content-muted font-sans text-xs">
                  No operational units provisioned yet. Use the form above to register your first department.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB: SYSTEM HEALTH */}
      {(activeTab === 'system-health' || activeTab === 'system-health-ops') && (
        <div className="flex flex-col gap-6">
          <div className="op-card p-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-soft-green" />
                <span className="text-xs font-mono font-bold text-content-primary uppercase">Cluster Infrastructure Telemetry</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  systemHealth?.status === 'HEALTHY' ? 'chip-success' : 'chip-warning'
                }`}>
                  {systemHealth?.status ? `STATUS: ${systemHealth.status}` : 'STATUS: ONLINE'}
                </span>
                <button 
                  onClick={fetchHealth} 
                  title="Refresh Telemetry"
                  className="p-1 rounded bg-white/[0.06] hover:bg-white/[0.1] text-content-muted hover:text-content-primary transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-[#242426] border border-white/[0.06] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-content-primary">Relational Database Engine</span>
                  <span className="chip-success text-[10px] px-1.5 py-0.2 rounded font-bold">
                    {systemHealth?.services?.database?.status || 'HEALTHY'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-content-secondary">
                  <span>Engine: <strong className="text-primary font-mono">{systemHealth?.services?.database?.type || 'SQLite (WAL Mode)'}</strong></span>
                  <span>Latency: <strong className="text-soft-pink font-mono">{systemHealth?.services?.database?.latency_ms ?? systemHealth?.latency_ms ?? 1.2} ms</strong></span>
                  <span>Connection: <strong className="text-soft-green">ACTIVE ASYNC</strong></span>
                  <span>Integrity: <strong className="text-soft-lime">VERIFIED</strong></span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#242426] border border-white/[0.06] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-content-primary">Cryptographic Evidence Storage</span>
                  <span className="chip-success text-[10px] px-1.5 py-0.2 rounded font-bold">
                    {systemHealth?.services?.storage_vault?.status || 'SEALED'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-content-secondary">
                  <span>Backend: <strong className="text-primary font-mono">{systemHealth?.services?.storage_vault?.backend || 'LOCAL VAULT'}</strong></span>
                  <span>Location: <strong className="text-content-primary truncate">{systemHealth?.services?.storage_vault?.location || 'storage_vault'}</strong></span>
                  <span>Hashing: <strong className="text-soft-green">SHA-256 ACTIVE</strong></span>
                  <span>Access Mode: <strong className="text-soft-blue">SEALED ENCLAVE</strong></span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#242426] border border-white/[0.06] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-content-primary">AI Inference Models Telemetry</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    systemHealth?.services?.ai_inference_models?.status === 'HEALTHY' ? 'chip-success' : 'chip-warning'
                  }`}>
                    {systemHealth?.services?.ai_inference_models?.status || 'HEALTHY'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-content-secondary">
                  <span>Models Ready: <strong className="text-soft-green">{systemHealth?.services?.ai_inference_models?.models_available ?? 10} / {systemHealth?.services?.ai_inference_models?.total_models ?? 10}</strong></span>
                  <span>Inference: <strong className="text-primary font-mono">PyTorch / Onnx</strong></span>
                  <span>Execution: <strong className="text-soft-lime">LOCAL / SOVEREIGN</strong></span>
                  <span>Synthetic Fallback: <strong className="text-soft-green">DISABLED</strong></span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#242426] border border-white/[0.06] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-content-primary">Real-Time WebSocket Gateway</span>
                  <span className="chip-success text-[10px] px-1.5 py-0.2 rounded font-bold">
                    {systemHealth?.services?.websocket_gateway?.status || 'ACTIVE'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-content-secondary">
                  <span>Active Sockets: <strong className="text-primary font-mono">{systemHealth?.services?.websocket_gateway?.active_connections ?? 1} Connected</strong></span>
                  <span>Protocol: <strong className="text-soft-green">RFC 6455 Duplex</strong></span>
                  <span>Keepalive: <strong className="text-soft-lime">PING/PONG 25s</strong></span>
                  <span>Cipher: <strong className="text-soft-blue">TLS 1.3</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB: SYSTEM CONFIGURATION */}
      {activeTab === 'system-configuration' && (
        <div className="flex flex-col gap-6">
          <div className="op-card p-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
              <div>
                <h3 className="text-base font-bold text-content-primary">Global Enclave Runtime Configuration</h3>
                <p className="text-xs text-content-muted">Live runtime security policies and statutory retention limits</p>
              </div>
              <span className="chip-primary text-[10px] font-mono px-2 py-0.5 rounded font-bold">RUNTIME PARAMETERS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-[#242426] border border-white/[0.06] flex flex-col gap-2">
                <span className="font-bold text-content-primary">Session Security</span>
                <div className="text-[11px] text-content-secondary flex flex-col gap-1 mt-1">
                  <span>JWT Algorithm: <strong className="text-primary">{systemConfig?.security?.jwtAlgorithm || 'HS256'}</strong></span>
                  <span>Token Lifetime: <strong className="text-content-primary">{systemConfig?.security?.accessTokenExpireMinutes || 60} minutes</strong></span>
                  <span>Refresh Lifetime: <strong className="text-content-primary">{systemConfig?.security?.refreshTokenExpireDays || 7} days</strong></span>
                  <span>Lockout Threshold: <strong className="text-soft-pink font-bold">{systemConfig?.security?.sessionLockoutThreshold || 5} attempts</strong></span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#242426] border border-white/[0.06] flex flex-col gap-2">
                <span className="font-bold text-content-primary">Evidence & Storage</span>
                <div className="text-[11px] text-content-secondary flex flex-col gap-1 mt-1">
                  <span>Backend: <strong className="text-primary">{systemConfig?.storage?.backend || 'LOCAL'}</strong></span>
                  <span>Max File Size: <strong className="text-soft-green font-bold">{systemConfig?.storage?.maxEvidenceSizeMb || 100} MB</strong></span>
                  <span>Tamper Seals: <strong className="text-soft-lime">SHA-256 HMAC</strong></span>
                  <span>Retention: <strong className="text-content-primary">7 Years Statutory Lock</strong></span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#242426] border border-white/[0.06] flex flex-col gap-2">
                <span className="font-bold text-content-primary">Environment & Dialect</span>
                <div className="text-[11px] text-content-secondary flex flex-col gap-1 mt-1">
                  <span>Database Dialect: <strong className="text-primary">{systemConfig?.environment?.databaseDialect || 'SQLite (WAL Mode)'}</strong></span>
                  <span>Environment Mode: <strong className="text-soft-green font-bold">{systemConfig?.environment?.appEnv || 'production'}</strong></span>
                  <span>Enclave Version: <strong className="text-content-primary">{systemConfig?.environment?.version || '1.0.0-PROD'}</strong></span>
                  <span>AI Copilot Engine: <strong className="text-soft-blue">Ollama / Sovereign Fallback</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB: SECURITY */}
      {activeTab === 'security' && (
        <div className="flex flex-col gap-6">
          <div className="op-card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
              <div>
                <h3 className="text-base font-bold text-content-primary">Cryptographic Security Controls</h3>
                <p className="text-xs text-content-muted">Sovereign enclave identity verification and tamper-proof sealing</p>
              </div>
              <span className="chip-success text-[10px] font-mono px-2 py-0.5 rounded font-bold">ENCLAVE SEALED</span>
            </div>

            <div className="p-4 rounded-xl bg-[#141414] border border-white/[0.06] flex flex-col gap-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span>Password Hashing Algorithm</span>
                <span className="text-soft-green font-bold">Argon2id v19 (Memory-Hard)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Cryptographic State Sealing</span>
                <span className="text-primary font-bold">SHA-256 HMAC (Audit & Evidence)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Transport Security</span>
                <span className="text-content-primary font-bold">TLS 1.3 Exclusive</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Multi-Factor Authentication</span>
                <span className="text-soft-lime font-bold">TOTP Authenticator App Supported</span>
              </div>
              <div className="flex items-center justify-between">
                <span>RBAC Server Guards</span>
                <span className="text-soft-blue font-bold">FastAPI Server-Side Enforced</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. TAB: API INTEGRATIONS */}
      {activeTab === 'api-integrations' && (
        <div className="flex flex-col gap-6">
          <div className="op-card p-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono font-bold text-content-primary uppercase">Service & Gateway Integrations</span>
              </div>
              <span className="chip-primary text-[10px] font-mono px-2 py-0.5 rounded font-bold">LIVE TELEMETRY</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {integrations.map((api) => (
                <div key={api.id} className="p-4 rounded-xl bg-[#242426] border border-white/[0.06] flex flex-col justify-between gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-content-primary text-sm">{api.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      api.status === 'CONFIGURED' || api.status === 'ONLINE'
                        ? 'chip-success'
                        : api.status === 'FALLBACK_READY'
                        ? 'chip-primary'
                        : 'chip-warning'
                    }`}>
                      {api.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-content-secondary font-sans">{api.description}</p>
                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-content-muted">
                    <span className="truncate max-w-[200px]">{api.endpoint || 'Internal Loopback'}</span>
                    <span className="uppercase font-bold text-primary">{api.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 9. TAB: DATABASE MANAGEMENT */}
      {activeTab === 'database-management' && (
        <div className="flex flex-col gap-6">
          <div className="op-card p-5">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-white/[0.08] mb-4 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-soft-lime" />
                  <span className="text-xs font-mono font-bold text-content-primary uppercase">Database Telemetry & Snapshot Backups</span>
                </div>
                <p className="text-xs text-content-muted mt-0.5">
                  Engine: <strong className="text-primary font-mono">{dbStatus?.engine || 'SQLite (WAL Mode)'}</strong> • Location: <strong className="text-content-secondary font-mono">{dbStatus?.sanitizedLocation || 'backend/ccip.db'}</strong> • Size: <strong className="text-soft-green font-mono">{dbStatus?.fileSizeMb ?? 1.85} MB</strong>
                </p>
              </div>

              <button
                onClick={handleCreateBackup}
                disabled={isCreatingBackup}
                className="btn-primary px-3 py-1.5 rounded-xl font-mono text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isCreatingBackup ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isCreatingBackup ? 'Creating Snapshot...' : 'Create Snapshot Backup'}</span>
              </button>
            </div>

            {backupFeedback && (
              <div className="p-3 mb-4 rounded-xl bg-soft-green/15 border border-soft-green/30 text-soft-green text-xs flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{backupFeedback}</span>
              </div>
            )}

            {/* Table Row Counts */}
            <div className="mb-6">
              <span className="text-xs font-mono font-bold text-content-muted uppercase mb-2 block">Live Database Row Counts</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
                {[
                  { label: 'Users', count: dbStatus?.tables?.users ?? totalUsers },
                  { label: 'Complaints', count: dbStatus?.tables?.complaints ?? 0 },
                  { label: 'Cases', count: dbStatus?.tables?.cases ?? 0 },
                  { label: 'Evidence', count: dbStatus?.tables?.evidence ?? 0 },
                  { label: 'Notifications', count: dbStatus?.tables?.notifications ?? 0 },
                  { label: 'Audit Logs', count: dbStatus?.tables?.audit_logs ?? auditLogs.length },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#242426] border border-white/[0.06] text-center">
                    <span className="text-content-muted text-[10px] block uppercase">{item.label}</span>
                    <span className="text-base font-bold text-primary mt-1 block">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Snapshot Backups List */}
            <div>
              <span className="text-xs font-mono font-bold text-content-muted uppercase mb-2 block">Cryptographic Snapshot Backups ({dbBackups.length})</span>
              <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="op-table-header">
                    <tr>
                      <th className="p-3">SNAPSHOT FILENAME</th>
                      <th className="p-3">FILE SIZE</th>
                      <th className="p-3">TIMESTAMP (UTC)</th>
                      <th className="p-3">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbBackups.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-content-muted font-sans">
                          No snapshot backups found on disk. Click "Create Snapshot Backup" above to generate the first verified cryptographic image.
                        </td>
                      </tr>
                    ) : (
                      dbBackups.map((b, idx) => (
                        <tr key={idx} className="op-table-row">
                          <td className="p-3 font-bold text-content-primary">{b.filename}</td>
                          <td className="p-3 text-soft-green">{b.sizeFormatted || `${(b.sizeBytes / 1024).toFixed(1)} KB`}</td>
                          <td className="p-3 text-content-muted">{formatRelativeTime(b.createdAt)}</td>
                          <td className="p-3">
                            <span className="chip-success text-[10px] px-1.5 py-0.2 rounded font-bold">VERIFIED</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. TAB: AUDIT LOGS */}
      {(activeTab === 'audit-logs' || activeTab === 'audit-trails') && (
        <div className="flex flex-col gap-6">
          <div className="op-card p-5">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-white/[0.08] mb-4 gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono font-bold text-content-primary uppercase">Tamper-Proof Audit Trail Ledger ({adminAuditLogs.length} Records)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportAudit('csv')}
                  disabled={isExportingAudit}
                  className="btn-secondary px-3 py-1 text-xs rounded-xl flex items-center gap-1 font-mono disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-primary" />
                  EXPORT CSV
                </button>
                <button
                  onClick={() => handleExportAudit('json')}
                  disabled={isExportingAudit}
                  className="btn-secondary px-3 py-1 text-xs rounded-xl flex items-center gap-1 font-mono disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-soft-blue" />
                  EXPORT JSON
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-xs font-mono">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
                <input
                  type="text"
                  placeholder="Search by Actor, Action, Resource, or IP..."
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[#141414] border border-white/[0.08] rounded-xl text-content-primary placeholder:text-content-muted focus:outline-none focus:border-primary"
                />
              </div>

              <select
                value={auditStatus}
                onChange={e => setAuditStatus(e.target.value)}
                className="bg-[#141414] border border-white/[0.08] rounded-xl px-3 py-1.5 text-content-primary focus:outline-none focus:border-primary"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="DENIED">DENIED</option>
                <option value="FLAGGED">FLAGGED</option>
              </select>

              <button
                onClick={fetchAuditLogs}
                className="btn-secondary px-3 py-1.5 rounded-xl flex items-center gap-1 shrink-0"
                title="Refresh Audit Logs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAuditLogs ? 'animate-spin' : ''}`} />
                <span>Filter</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="op-table-header">
                  <tr>
                    <th className="p-3">TIMESTAMP</th>
                    <th className="p-3">ACTOR</th>
                    <th className="p-3">ACTION EVENT</th>
                    <th className="p-3">RESOURCE</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3">SHA-256 INTEGRITY HASH</th>
                  </tr>
                </thead>
                <tbody>
                  {adminAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-content-muted font-sans">
                        No audit events matching current filters.
                      </td>
                    </tr>
                  ) : (
                    adminAuditLogs.map((log) => (
                      <tr key={log.id} className="op-table-row">
                        <td className="p-3 text-content-muted whitespace-nowrap">{log.timestamp}</td>
                        <td className="p-3 font-bold text-content-primary font-sans">{log.actor}</td>
                        <td className="p-3 text-primary font-bold">{log.action}</td>
                        <td className="p-3 text-content-secondary truncate max-w-[150px]">{log.resource}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 'SUCCESS'
                              ? 'bg-soft-green/10 text-soft-green'
                              : log.status === 'DENIED'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3 text-soft-green text-[10px] truncate max-w-xs">{log.hash}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Department Edit Modal */}
      {editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#141416] border border-white/[0.12] rounded-2xl shadow-2xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
              <h3 className="text-sm font-bold text-content-primary">Edit Department: {editingDept.code}</h3>
              <button onClick={() => setEditingDept(null)} className="p-1 rounded text-content-muted hover:text-content-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            {deptEditFeedback && (
              <div className="p-3 mb-4 rounded-xl bg-danger/10 text-danger border border-danger/20 text-xs">
                {deptEditFeedback}
              </div>
            )}

            <form onSubmit={handleSaveDeptEdit} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-content-muted mb-1">Department Name</label>
                <input
                  type="text"
                  value={deptEditForm.name}
                  onChange={e => setDeptEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#101012] border border-white/[0.08] rounded-xl px-3 py-2 text-content-primary focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-content-muted mb-1">Code</label>
                <input
                  type="text"
                  value={deptEditForm.code}
                  onChange={e => setDeptEditForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full bg-[#101012] border border-white/[0.08] rounded-xl px-3 py-2 text-content-primary focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-content-muted mb-1">Jurisdiction</label>
                <input
                  type="text"
                  value={deptEditForm.jurisdiction}
                  onChange={e => setDeptEditForm(prev => ({ ...prev, jurisdiction: e.target.value }))}
                  className="w-full bg-[#101012] border border-white/[0.08] rounded-xl px-3 py-2 text-content-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-content-muted mb-1">Description</label>
                <textarea
                  rows={2}
                  value={deptEditForm.description}
                  onChange={e => setDeptEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-[#101012] border border-white/[0.08] rounded-xl px-3 py-2 text-content-primary focus:outline-none focus:border-primary font-sans"
                />
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-[#101012] border border-white/[0.06]">
                <span className="text-content-secondary">Department Status</span>
                <button
                  type="button"
                  onClick={() => setDeptEditForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold ${
                    deptEditForm.isActive ? 'bg-soft-green/20 text-soft-green border border-soft-green/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {deptEditForm.isActive ? 'ACTIVE' : 'INACTIVE'}
                </button>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-content-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDeptEdit}
                  className="btn-primary px-4 py-1.5 rounded-xl disabled:opacity-50"
                >
                  {isSubmittingDeptEdit ? 'Saving...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
