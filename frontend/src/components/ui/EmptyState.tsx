import React from 'react';
import { Inbox, FolderOpen, Search, AlertTriangle, Bot, FileText } from 'lucide-react';

type EmptyStateVariant = 'cases' | 'evidence' | 'search' | 'alerts' | 'ai' | 'logs' | 'generic';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

const icons: Record<EmptyStateVariant, React.ReactNode> = {
  cases:    <FileText   className="w-8 h-8" />,
  evidence: <FolderOpen className="w-8 h-8" />,
  search:   <Search     className="w-8 h-8" />,
  alerts:   <AlertTriangle className="w-8 h-8" />,
  ai:       <Bot        className="w-8 h-8" />,
  logs:     <FileText   className="w-8 h-8" />,
  generic:  <Inbox      className="w-8 h-8" />,
};

const defaults: Record<EmptyStateVariant, { title: string; description: string }> = {
  cases:    {
    title: 'No cases found',
    description: 'No cases match your current filters. Adjust criteria or file a new complaint.',
  },
  evidence: {
    title: 'No evidence items',
    description: 'No evidence has been uploaded to this case vault yet.',
  },
  search:   {
    title: 'No results',
    description: 'Your search returned no matches. Try a different reference number, IP, or alias.',
  },
  alerts:   {
    title: 'No active alerts',
    description: 'No unread operational alerts or broadcasts at this time.',
  },
  ai:       {
    title: 'No analysis results',
    description: 'Submit a query to the AI investigation assistant to receive forensic analysis.',
  },
  logs:     {
    title: 'No audit events',
    description: 'No audit log entries recorded for the selected timeframe.',
  },
  generic:  {
    title: 'Nothing here yet',
    description: 'This section has no data to display.',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'generic',
  title,
  description,
  action,
  className = '',
}) => {
  const t = title       ?? defaults[variant].title;
  const d = description ?? defaults[variant].description;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-12 px-6 text-center ${className}`}
      role="status"
      aria-label={t}
    >
      <div className="text-content-muted opacity-30">
        {icons[variant]}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-content-secondary">{t}</p>
        <p className="text-xs text-content-muted max-w-xs leading-relaxed">{d}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-secondary mt-2 px-4 py-2 text-xs rounded-xl"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
