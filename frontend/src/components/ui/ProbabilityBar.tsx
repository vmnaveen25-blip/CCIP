import React, { useEffect, useRef } from 'react';

interface ProbabilityBarProps {
  value: number;          // 0.0 – 1.0
  threshold?: number;
  label?: string;
  showPercent?: boolean;
  size?: 'sm' | 'md' | 'lg';
  delay?: number;         // ms animation delay
}

function getVariant(value: number, threshold?: number): 'safe' | 'warning' | 'danger' | 'info' {
  if (threshold !== undefined) {
    const ratio = value / threshold;
    if (ratio < 0.5) return 'safe';
    if (ratio < 1.0) return 'warning';
    return 'danger';
  }
  if (value < 0.3) return 'safe';
  if (value < 0.65) return 'warning';
  return 'danger';
}

const heights: Record<'sm' | 'md' | 'lg', string> = {
  sm: '4px',
  md: '6px',
  lg: '8px',
};

export const ProbabilityBar: React.FC<ProbabilityBarProps> = ({
  value,
  threshold,
  label,
  showPercent = true,
  size = 'md',
  delay = 0,
}) => {
  const fillRef = useRef<HTMLDivElement>(null);
  const pct = Math.min(100, Math.max(0, Math.round(value * 100)));
  const variant = getVariant(value, threshold);

  useEffect(() => {
    const el = fillRef.current;
    if (!el) return;
    // Trigger animation after delay
    const id = setTimeout(() => {
      el.style.setProperty('--prob-width', `${pct}%`);
      el.style.width = `${pct}%`;
    }, delay);
    return () => clearTimeout(id);
  }, [pct, delay]);

  const thresholdPct = threshold !== undefined
    ? Math.min(100, Math.round(threshold * 100))
    : null;

  return (
    <div className="flex flex-col gap-1">
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-[11px] font-mono">
          {label && <span className="text-content-muted">{label}</span>}
          <div className="flex items-center gap-1.5 ml-auto">
            {thresholdPct !== null && (
              <span className="text-content-muted opacity-60">
                threshold {thresholdPct}%
              </span>
            )}
            {showPercent && (
              <span className={`font-bold ${
                variant === 'safe'    ? 'text-soft-green' :
                variant === 'warning' ? 'text-soft-yellow' :
                'text-primary'
              }`}>
                {pct}%
              </span>
            )}
          </div>
        </div>
      )}

      <div
        className="probability-bar-track relative"
        style={{ height: heights[size] }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        {/* Threshold marker */}
        {thresholdPct !== null && (
          <div
            className="absolute top-0 bottom-0 w-[1px] bg-white/30 z-10"
            style={{ left: `${thresholdPct}%` }}
            title={`Threshold: ${thresholdPct}%`}
          />
        )}

        <div
          ref={fillRef}
          className={`probability-bar-fill ${variant}`}
          style={{ width: '0%' }}
        />
      </div>
    </div>
  );
};
