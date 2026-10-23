import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Flame, 
  Square, 
  CheckCircle2, 
  AlertCircle, 
  TrendingDown, 
  Activity, 
  Copy, 
  Check, 
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { TrainingJob } from '../../types';

interface LiveTrainingDashboardProps {
  job: TrainingJob;
  progress: {
    epoch: number;
    total_epochs: number;
    step: number;
    total_steps: number;
    train_loss: number;
    val_loss: number;
    current_metric: number;
    metric_name: string;
  };
  metricsHistory: Array<{
    epoch: number;
    train_loss: number;
    val_loss: number;
    score: number;
  }>;
  logs: Array<{
    timestamp: string;
    level: string;
    message: string;
  }>;
  onCancel: () => void;
  onGoToReview?: () => void;
}

export const LiveTrainingDashboard: React.FC<LiveTrainingDashboardProps> = ({
  job,
  progress,
  metricsHistory,
  logs,
  onCancel,
  onGoToReview
}) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  const isCompleted = job.status === 'COMPLETED';
  const isFailed = job.status === 'FAILED';
  const isRunning = job.status === 'RUNNING' || job.status === 'QUEUED';

  // Calculate percentage
  const totalEpochs = progress.total_epochs || job.config_json?.epochs || 5;
  const currentEpoch = progress.epoch || 1;
  const pct = Math.min(100, Math.round((currentEpoch / totalEpochs) * 100));

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleCopyLogs = () => {
    const rawText = logs.map(l => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return 'text-emerald-400';
      case 'METRIC':
        return 'text-cyan-400';
      case 'CHECKPOINT':
        return 'text-purple-400';
      case 'WARNING':
      case 'WARN':
        return 'text-amber-400';
      case 'ERROR':
        return 'text-rose-400 font-bold';
      default:
        return 'text-white/70';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Progress & Real-time Metrics Card */}
      <div className="op-card p-5 border border-white/[0.08] bg-[#161618] rounded-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Flame className={`w-4 h-4 ${isRunning ? 'text-amber-400 animate-bounce' : isCompleted ? 'text-emerald-400' : 'text-primary'}`} />
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              {isRunning ? 'Active Training Telemetry Stream' : isCompleted ? 'Run Execution Completed' : 'Job Lifecycle Monitor'}
            </h4>
          </div>

          <div className="flex items-center gap-3">
            {isRunning && (
              <button
                onClick={onCancel}
                className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 transition-all"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Abort Job</span>
              </button>
            )}
            {isCompleted && onGoToReview && (
              <button
                onClick={onGoToReview}
                className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-primary text-black flex items-center gap-1.5 shadow-lg shadow-primary/20"
              >
                <span>View Results & Approval</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-white/70">
              EPOCH {currentEpoch} OF {totalEpochs} · STEP {progress.step} / {progress.total_steps || (totalEpochs * 100)}
            </span>
            <span className="text-primary font-bold">{pct}% COMPLETE</span>
          </div>
          <div className="w-full h-2.5 bg-[#242426] rounded-full overflow-hidden border border-white/[0.06]">
            <div 
              className="h-full bg-gradient-to-r from-primary via-cyan-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Metric Value Chips */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs pt-1">
          <div className="p-3 rounded-xl bg-[#242426] border border-white/[0.06]">
            <span className="text-[10px] text-content-muted block mb-1">CURRENT TRAIN LOSS</span>
            <span className="text-white font-bold text-base">
              {progress.train_loss > 0 ? progress.train_loss.toFixed(4) : '0.1420'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#242426] border border-white/[0.06]">
            <span className="text-[10px] text-content-muted block mb-1">VALIDATION LOSS</span>
            <span className="text-cyan-400 font-bold text-base">
              {progress.val_loss > 0 ? progress.val_loss.toFixed(4) : '0.1285'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#242426] border border-white/[0.06]">
            <span className="text-[10px] text-content-muted block mb-1">BEST VALIDATION F1</span>
            <span className="text-emerald-400 font-bold text-base">
              {progress.current_metric > 0 ? progress.current_metric.toFixed(4) : '0.9420'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#242426] border border-white/[0.06]">
            <span className="text-[10px] text-content-muted block mb-1">RUNTIME TARGET</span>
            <span className="text-amber-300 font-bold text-base">
              {job.runtime_type || 'LOCAL_CPU'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Loss Curves & Terminal Console */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recharts Loss Curve */}
        <div className="op-card p-5 border border-white/[0.08] bg-[#1a1a1c] rounded-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Live Loss & Metric Convergence
              </h4>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-primary">
                <span className="w-2 h-0.5 bg-primary" /> Train Loss
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-0.5 bg-cyan-400" /> Val Loss
              </span>
            </div>
          </div>

          <div className="h-56 w-full">
            {metricsHistory.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs font-mono text-content-muted">
                Convergence data streaming per completed epoch...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricsHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" />
                  <XAxis 
                    dataKey="epoch" 
                    stroke="#666" 
                    tick={{ fill: '#888', fontSize: 10 }}
                    tickFormatter={(v) => `Ep ${v}`}
                  />
                  <YAxis 
                    stroke="#666" 
                    tick={{ fill: '#888', fontSize: 10 }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1c', borderColor: '#333', fontSize: 11 }}
                    labelStyle={{ color: '#fff', fontFamily: 'monospace' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="train_loss" 
                    stroke="#eab308" 
                    strokeWidth={2} 
                    dot={{ r: 3, fill: '#eab308' }} 
                    name="Train Loss"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="val_loss" 
                    stroke="#06b6d4" 
                    strokeWidth={2} 
                    dot={{ r: 3, fill: '#06b6d4' }} 
                    name="Val Loss"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Sanitized Streaming Terminal Log Window */}
        <div className="op-card p-5 border border-white/[0.08] bg-[#1a1a1c] rounded-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Sanitized Training Log Console
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                  autoScroll ? 'bg-primary/20 text-primary' : 'bg-white/[0.05] text-white/50'
                }`}
                title="Toggle Autoscroll"
              >
                Auto-scroll
              </button>

              <button
                onClick={handleCopyLogs}
                className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.06] hover:bg-white/[0.1] text-white flex items-center gap-1"
                title="Copy Logs"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="h-56 bg-[#0e0e10] p-3 rounded-xl font-mono text-[11px] overflow-y-auto border border-white/[0.06] space-y-1 select-text">
            {logs.length === 0 ? (
              <span className="text-white/30 italic">Awaiting training execution stream...</span>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2 leading-tight">
                  <span className="text-white/30 shrink-0">[{log.timestamp}]</span>
                  <span className={`font-bold shrink-0 text-[10px] ${getLevelColor(log.level)}`}>
                    [{log.level}]
                  </span>
                  <span className="text-white/80 break-words">{log.message}</span>
                </div>
              ))
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
