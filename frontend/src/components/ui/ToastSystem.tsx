import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;   // ms — 0 = persist
  persistent?: boolean;
  exiting?: boolean;
}

interface ToastSystemProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 flex-shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 flex-shrink-0" />,
  error:   <XCircle      className="w-4 h-4 flex-shrink-0" />,
  info:    <Info         className="w-4 h-4 flex-shrink-0" />,
};

const ToastEntry: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  return (
    <div
      className={`toast ${toast.type} ${toast.exiting ? 'exiting' : ''}`}
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <span className="toast-icon">{ICONS[toast.type]}</span>
      <div className="flex flex-col flex-1 min-w-0">
        {toast.title && (
          <span className="font-semibold text-content-primary text-xs mb-0.5">{toast.title}</span>
        )}
        <span className="text-content-secondary text-[11px] leading-relaxed">{toast.message}</span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded-lg text-content-muted hover:text-content-primary transition-colors flex-shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const ToastSystem: React.FC<ToastSystemProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map(t => (
        <ToastEntry key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

/* ──────────────────────────────────────────
   Toast Manager Hook
   ────────────────────────────────────────── */

let _toastId = 0;
const genId = () => `toast-${++_toastId}`;

export function useToastManager() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    // Mark as exiting for CSS exit animation
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    const clearTimer = timers.current.get(id);
    if (clearTimer) clearTimeout(clearTimer);
    timers.current.delete(id);
    // Remove after animation
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 150);
  }, []);

  const push = useCallback((
    type: ToastType,
    message: string,
    opts?: { title?: string; duration?: number; persistent?: boolean }
  ) => {
    const id = genId();
    const duration = opts?.persistent ? 0 : (opts?.duration ?? (type === 'error' ? 0 : 4500));
    const item: ToastItem = { id, type, message, title: opts?.title, duration, persistent: opts?.persistent };
    setToasts(prev => [...prev, item]);

    if (duration > 0) {
      const t = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, t);
    }
    return id;
  }, [dismiss]);

  // Cleanup on unmount
  useEffect(() => {
    const map = timers.current;
    return () => { map.forEach(t => clearTimeout(t)); };
  }, []);

  return { toasts, push, dismiss };
}
