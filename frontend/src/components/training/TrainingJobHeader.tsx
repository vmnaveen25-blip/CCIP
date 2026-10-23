import React from 'react';
import { 
  Play, 
  Square, 
  CheckCircle2, 
  FileCheck, 
  Download, 
  Plus, 
  History,
  AlertCircle,
  Cpu,
  ShieldCheck,
  Flame
} from 'lucide-react';
import { TrainingJob, TrainingRuntimeStatus } from '../../types';

interface TrainingJobHeaderProps {
  activeJob: TrainingJob | null;
  runtimeStatus: TrainingRuntimeStatus | null;
  isRunning: boolean;
  onNewJob: () => void;
  onValidate: () => void;
  onStart: () => void;
  onCancel: () => void;
  onExportColab: () => void;
  onToggleHistory: () => void;
  showHistory: boolean;
  isValidating?: boolean;
}

export const TrainingJobHeader: React.FC<TrainingJobHeaderProps> = ({
  activeJob,
  runtimeStatus,
  isRunning,
  onNewJob,
  onValidate,
  onStart,
  onCancel,
  onExportColab,
  onToggleHistory,
  showHistory,
  isValidating = false
}) => {
  return (
    <div className="op-card p-5 border border-white/[0.08] bg-[#0c1310]/95 backdrop-blur-md rounded-2xl flex flex-col gap-3 shadow-xl">
      {/* Row 1: Title & Operational Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Job identity and Draft badge */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-[#00e676] font-mono text-sm font-black tracking-wider uppercase">
            {activeJob?.job_reference || 'TRN-NEW-RUN'}
          </span>
          <span className="text-white/40 font-mono text-sm">/</span>
          <span className="text-white font-sans text-sm font-bold">
            {activeJob?.target_model_name || 'Select Candidate Model'}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/[0.06] text-white/70 border border-white/10 uppercase">
            {activeJob?.status || 'DRAFT'}
          </span>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onToggleHistory}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
              showHistory 
                ? 'bg-[#00e676] text-black font-bold shadow-lg shadow-[#00e676]/20' 
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/80 border border-white/[0.08]'
            }`}
            title="Toggle Training History Ledger"
          >
            <History className="w-3.5 h-3.5 text-white/70" />
            <span>History</span>
          </button>

          <button
            onClick={onNewJob}
            disabled={isRunning}
            className="px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-white/80 border border-white/[0.08] transition-all disabled:opacity-40"
            title="Create New Training Job Draft"
          >
            <Plus className="w-3.5 h-3.5 text-[#00e676]" />
            <span>New Run</span>
          </button>

          <button
            onClick={onExportColab}
            className="px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all"
            title="Export Sensitive-Free Google Colab Training Package"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            <span>Colab Package</span>
          </button>

          <button
            onClick={onValidate}
            disabled={isRunning || isValidating}
            className="px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all disabled:opacity-40"
            title="Validate Dataset, Schemas, and Storage"
          >
            <FileCheck className={`w-3.5 h-3.5 text-cyan-400 ${isValidating ? 'animate-spin' : ''}`} />
            <span>{isValidating ? 'Validating...' : 'Pre-flight'}</span>
          </button>

          {isRunning ? (
            <button
              onClick={onCancel}
              className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Training</span>
            </button>
          ) : (
            <button
              onClick={onStart}
              className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 bg-[#00e676] hover:bg-[#00c864] text-black shadow-lg shadow-[#00e676]/20 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-black text-black" />
              <span>Start Run</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 2: CPU Hardware telemetry pill + Monospace status line */}
      <div className="flex flex-wrap items-center gap-3 pt-0.5">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-[11px]">
            {runtimeStatus?.cuda_available 
              ? `GPU: ${runtimeStatus.gpu_name}` 
              : `CPU-ONLY (${runtimeStatus?.cpu_count || 4} CORES · ${runtimeStatus?.total_ram_gb || 7.9} GB)`}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-white/50">
          <span>TASK: <strong className="text-white">{activeJob?.training_task || 'UNCONFIGURED'}</strong></span>
          <span>·</span>
          <span>TARGET: <strong className="text-white">{activeJob?.target_model_version || 'v1.0.0-candidate'}</strong></span>
          <span>·</span>
          <span>RUNTIME: <strong className="text-[#eab308]">{runtimeStatus?.runtime_type || 'LOCAL_CPU'}</strong></span>
        </div>
      </div>
    </div>
  );
};

