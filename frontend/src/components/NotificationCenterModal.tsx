import React, { useState, useMemo } from 'react';
import { AppNotification } from '../types';
import { apiClient } from '../api/client';
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Trash2, 
  AlertTriangle, 
  Info, 
  ShieldAlert, 
  Search, 
  ExternalLink,
  Clock,
  Filter
} from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onRefresh: () => void;
  onSelectCase?: (caseId: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onRefresh,
  onSelectCase
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNREAD' | 'CRITICAL' | 'SECURITY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // Tab filter
      if (filterTab === 'UNREAD' && n.is_read) return false;
      if (filterTab === 'CRITICAL' && n.severity !== 'CRITICAL') return false;
      if (filterTab === 'SECURITY' && !n.type?.toLowerCase().includes('security') && !n.type?.toLowerCase().includes('auth')) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = n.title?.toLowerCase().includes(q);
        const matchesMsg = n.message?.toLowerCase().includes(q);
        const matchesType = n.type?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMsg && !matchesType) return false;
      }
      return true;
    });
  }, [notifications, filterTab, searchQuery]);

  const unreadTotal = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await apiClient.markNotificationRead(id);
      onRefresh();
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    setIsProcessing(true);
    try {
      await apiClient.markAllNotificationsRead();
      onRefresh();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.deleteNotification(id);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleActionClick = (notif: AppNotification) => {
    if (notif.action_link && onSelectCase) {
      // Extract case ID if action link has format /cases/xyz or xyz
      const parts = notif.action_link.split('/');
      const potentialId = parts[parts.length - 1];
      if (potentialId) {
        onSelectCase(potentialId);
        onClose();
        return;
      }
    }
    if (!notif.is_read) {
      handleMarkAsRead(notif.id);
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return ts;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-primary shrink-0" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'WARNING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-primary/10 text-primary border-primary/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-[#06140c] border border-[#00e676]/25 rounded-2xl shadow-[0_0_50px_rgba(0,230,118,0.15)] flex flex-col max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#00e676]/15 flex items-center justify-between bg-[#081f13]/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-content-primary">Notification Center</h2>
                {unreadTotal > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#00e676] text-[#031508] shadow-[0_0_12px_rgba(0,230,118,0.35)]">
                    {unreadTotal} UNREAD
                  </span>
                )}
              </div>
              <p className="text-xs text-content-muted">Real-time alerts, case telemetry updates, and security events</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadTotal > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isProcessing}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-content-secondary hover:text-content-primary border border-white/[0.08] transition-all"
              >
                <CheckCheck className="w-3.5 h-3.5 text-primary" />
                <span>Mark All Read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-white/[0.06] transition-colors"
              aria-label="Close notification center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="p-3 sm:p-4 border-b border-white/[0.06] bg-[#161618] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-[#101012] p-1 rounded-xl border border-white/[0.06]">
            {(['ALL', 'UNREAD', 'CRITICAL', 'SECURITY'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterTab === tab
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-content-muted hover:text-content-secondary'
                }`}
              >
                {tab}
                {tab === 'UNREAD' && unreadTotal > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-white">
                    {unreadTotal}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
            <input
              type="text"
              placeholder="Filter notifications..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#101012] border border-white/[0.08] rounded-xl text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:border-primary/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04] p-2 sm:p-3 space-y-1">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-content-muted mb-3">
                <Bell className="w-6 h-6 opacity-40" />
              </div>
              <h3 className="text-sm font-semibold text-content-primary">No Notifications Found</h3>
              <p className="text-xs text-content-muted mt-1 max-w-sm">
                {searchQuery
                  ? `No alerts match your filter "${searchQuery}".`
                  : filterTab === 'UNREAD'
                  ? 'You have caught up with all live intelligence feeds.'
                  : 'System and operational notifications will stream here in real time.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => handleActionClick(notif)}
                className={`group p-3 sm:p-4 rounded-xl transition-all cursor-pointer flex items-start gap-3.5 ${
                  notif.is_read
                    ? 'bg-transparent hover:bg-white/[0.03]'
                    : 'bg-primary/[0.04] hover:bg-primary/[0.08] border border-primary/20 shadow-sm'
                }`}
              >
                {/* Status Dot / Severity Icon */}
                <div className="mt-0.5 flex flex-col items-center gap-1.5">
                  <div className="p-1.5 rounded-lg bg-black/40 border border-white/[0.08]">
                    {getSeverityIcon(notif.severity)}
                  </div>
                  {!notif.is_read && (
                    <span className="w-2 h-2 rounded-full bg-primary ring-2 ring-primary/30" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-content-primary truncate">
                        {notif.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${getSeverityBadge(notif.severity)}`}>
                        {notif.severity}
                      </span>
                      {notif.type && (
                        <span className="text-[10px] font-mono text-content-muted uppercase">
                          · {notif.type}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0 text-[11px] text-content-muted font-mono">
                      <Clock className="w-3 h-3 opacity-60" />
                      <span>{formatTimestamp(notif.created_at)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-content-secondary leading-relaxed line-clamp-2">
                    {notif.message}
                  </p>

                  {/* Actions Bar */}
                  <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      {notif.action_link && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary group-hover:underline">
                          <span>Inspect Event</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notif.is_read ? (
                        <button
                          onClick={e => handleMarkAsRead(notif.id, e)}
                          title="Mark as read"
                          className="p-1.5 rounded-lg hover:bg-white/[0.08] text-content-muted hover:text-content-primary transition-colors"
                        >
                          <Check className="w-3.5 h-3.5 text-soft-green" />
                        </button>
                      ) : null}
                      <button
                        onClick={e => handleDelete(notif.id, e)}
                        title="Delete notification"
                        className="p-1.5 rounded-lg hover:bg-danger/10 text-content-muted hover:text-danger transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-white/[0.08] bg-[#18181b]/80 flex items-center justify-between text-xs text-content-muted">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-soft-green status-dot-glow" />
            <span>WebSocket Live Stream Active</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              disabled={unreadTotal === 0 || isProcessing}
              className="px-3 py-1 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-content-secondary hover:text-content-primary border border-white/[0.08] transition-all disabled:opacity-40"
            >
              Mark All Read
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs bg-gradient-to-r from-[#00e676] to-[#00c853] hover:brightness-110 text-[#031508] font-bold shadow-[0_0_15px_rgba(0,230,118,0.35)] transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
