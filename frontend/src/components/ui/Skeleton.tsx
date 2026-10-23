import React from 'react';

interface SkeletonRowProps {
  cols?: number;
  height?: string;
  animate?: boolean;
}

export const SkeletonRow: React.FC<SkeletonRowProps> = ({
  cols = 5,
  height = '40px',
  animate = true,
}) => (
  <tr style={{ height }} aria-hidden="true">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-3 py-2">
        <div
          className={`rounded ${animate ? 'skeleton' : 'bg-surface-input'}`}
          style={{
            height: '14px',
            width: i === 0 ? '70%' : i === cols - 1 ? '50%' : '85%',
            animationDelay: `${i * 60}ms`,
          }}
        />
      </td>
    ))}
  </tr>
);

interface SkeletonCardProps {
  lines?: number;
  showHeader?: boolean;
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  lines = 3,
  showHeader = true,
  className = '',
}) => (
  <div className={`op-card p-5 flex flex-col gap-3 ${className}`} aria-hidden="true">
    {showHeader && (
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="skeleton rounded h-4 w-36" />
        <div className="skeleton rounded h-4 w-16" />
      </div>
    )}
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="skeleton rounded h-3"
        style={{
          width: `${85 - i * 12}%`,
          animationDelay: `${i * 80}ms`,
        }}
      />
    ))}
  </div>
);
