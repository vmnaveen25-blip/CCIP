import React from 'react';

type StatusValue =
  | 'READY'
  | 'PRODUCTION'
  | 'READY_FOR_LAZY_LOAD'
  | 'LOADED'
  | 'AVAILABLE_WITH_LIMITATIONS'
  | 'NOT_DEPLOYED'
  | 'BROKEN'
  | 'RETRAINING'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'PENDING'
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'RESOLVED'
  | 'UNDER_INVESTIGATION'
  | 'ASSIGNED'
  | 'OPEN'
  | 'CLOSED'
  | 'FLAGGED'
  | 'VERIFIED'
  | 'BLOCKED'
  | 'ALERT'
  | 'MONITOR'
  | string;

interface StatusBadgeProps {
  status: StatusValue;
  pulse?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

function getStatusConfig(status: string): { chip: string; dot?: string } {
  const s = status?.toUpperCase?.() ?? '';

  // AI Model statuses
  if (s === 'READY' || s === 'PRODUCTION' || s === 'LOADED')
    return { chip: 'chip-success', dot: 'bg-soft-green' };
  if (s === 'READY_FOR_LAZY_LOAD')
    return { chip: 'chip-info', dot: 'bg-soft-blue' };
  if (s === 'AVAILABLE_WITH_LIMITATIONS')
    return { chip: 'chip-warning', dot: 'bg-soft-yellow' };
  if (s === 'NOT_DEPLOYED')
    return { chip: 'chip-neutral', dot: 'bg-content-muted' };
  if (s === 'BROKEN')
    return { chip: 'chip-danger', dot: 'bg-danger' };
  if (s === 'RETRAINING')
    return { chip: 'chip-warning', dot: 'bg-soft-yellow' };

  // Case/complaint statuses
  if (s === 'RESOLVED' || s === 'CLOSED' || s === 'VERIFIED' || s === 'EVIDENCE_VERIFIED')
    return { chip: 'chip-success', dot: 'bg-soft-green' };
  if (s === 'CRITICAL')
    return { chip: 'chip-danger', dot: 'bg-danger' };
  if (s === 'HIGH')
    return { chip: 'chip-danger', dot: 'bg-danger' };
  if (s === 'MEDIUM')
    return { chip: 'chip-warning', dot: 'bg-soft-yellow' };
  if (s === 'LOW' || s === 'CANCELLED')
    return { chip: 'chip-neutral', dot: 'bg-content-muted' };
  if (s === 'FLAGGED' || s === 'ALERT')
    return { chip: 'chip-danger', dot: 'bg-danger' };
  if (s === 'UNDER_INVESTIGATION' || s === 'ASSIGNED' || s === 'CASE_CREATED' || s === 'TRIAGED' || s === 'VALIDATED')
    return { chip: 'chip-info', dot: 'bg-soft-blue' };
  if (s === 'LAW_ENFORCEMENT_DISPATCHED')
    return { chip: 'chip-warning', dot: 'bg-soft-yellow' };
  if (s === 'OPEN' || s === 'PENDING' || s === 'ACTIVE')
    return { chip: 'chip-primary', dot: 'bg-primary' };
  if (s === 'BLOCKED')
    return { chip: 'chip-danger', dot: 'bg-danger' };
  if (s === 'MONITOR')
    return { chip: 'chip-warning', dot: 'bg-soft-yellow' };

  return { chip: 'chip-neutral' };
}

function formatStatusDisplay(status: string): string {
  if (!status) return '';
  if (status === 'LAW_ENFORCEMENT_DISPATCHED') return 'Law Enforcement Action';
  if (status === 'CASE_CREATED') return 'Case Created';
  if (status === 'UNDER_INVESTIGATION') return 'Under Investigation';
  if (status === 'UNDER_REVIEW') return 'Under Review';
  if (status === 'EVIDENCE_VERIFIED') return 'Evidence Verified';
  return status;
}

const sizeClasses: Record<'xs' | 'sm' | 'md', string> = {
  xs: 'text-[9px] px-1.5 py-0',
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  pulse = false,
  size = 'sm',
  className = '',
}) => {
  const { chip, dot } = getStatusConfig(status);
  const isAnimated = pulse || ['RETRAINING', 'ACTIVE', 'LOADING'].includes(status?.toUpperCase?.() ?? '');

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-mono font-bold
        ${chip} ${sizeClasses[size]}
        ${isAnimated ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dot} flex-shrink-0`}
          aria-hidden="true"
        />
      )}
      {formatStatusDisplay(status)}
    </span>
  );
};
