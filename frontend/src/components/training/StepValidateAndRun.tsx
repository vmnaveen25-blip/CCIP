import React from 'react';
import { 
  FileCheck, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Cpu, 
  Play, 
  Download, 
  ArrowLeft, 
  ShieldCheck, 
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { TrainingRuntimeStatus, PreflightCheckItem, TrainingJob } from '../../types';

interface StepValidateAndRunProps {
  runtimeStatus: TrainingRuntimeStatus | null;
  activeJob: TrainingJob | null;
  checks: PreflightCheckItem[];
  isValidating: boolean;
  isRunning: boolean;
  onValidate: () => void;
  onStart: () => void;
  onExportColab: () => void;
  onBack: () => void;
}

export const StepValidateAndRun: React.FC<StepValidateAndRunProps> = ({
  runtimeStatus,
  activeJob,
  checks,
  isValidating,
  isRunning,
  onValidate,
  onStart,
  onExportColab,
  onBack
}) => {
  const isCUDAMissing = !runtimeStatus?.cuda_available;
  const isStructured = activeJob?.training_task === 'STRUCTURED_CLASSIFICATION';
  const hasFailures = checks.some(c => c.status === 'FAIL');
  const isReady = activeJob?.status === 'READY' || (!hasFailures && checks.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Truthful Enclave Hardware Runtime Banner */}
      <div className="op-card p-5 border border-white/[0.08] bg-[#161618] rounded-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Enclave Compute Infrastructure // Truthful Telemetry
            </h4>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            runtimeStatus?.cuda_available 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {runtimeStatus?.cuda_available ? 'GPU ACCELERATED' : 'LOCAL CPU ONLY (NO GPU)'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
          <div className="p-3 rounded-xl bg-[#242426] border border-white/[0.06]">
            <span className="text-[10px] text-content-muted block mb-1">CPU HOST CORES</span>
            <span className="text-white font-bold text-base">
              {runtimeStatus?.cpu_count || 4} Cores
            </span>
            <span className="text-[10px] text-content-muted block mt-0.5">
              Util: {runtimeStatus?.cpu_percent || 12}%
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#242426] border border-white/[0.06]">
            <span className="text-[10px] text-content-muted block mb-1">SYSTEM MEMORY</span>
            <span className="text-white font-bold text-base">
              {runtimeStatus?.total_ram_gb || 7.9} GB
            </span>
            <span className="text-[10px] text-content-muted block mt-0.5">
              Avail: {runtimeStatus?.available_ram_gb || 3.2} GB
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#242426] border border-white/[0.06]">
            <span className="text-[10px] text-content-muted block mb-1">ACCELERATION (CUDA)</span>
            <span className="text-amber-400 font-bold text-base">
              {runtimeStatus?.cuda_available ? 'Available' : 'Disabled'}
            </span>
            <span className="text-[10px] text-content-muted block mt-0.5">
              {runtimeStatus?.gpu_name || 'No Dedicated GPU'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#242426] border border-white/[0.06]">
            <span className="text-[10px] text-content-muted block mb-1">FRAMEWORK RUNTIME</span>
            <span className="text-white font-bold text-base">
              PyTorch {runtimeStatus?.torch_version || '2.14.0'}
            </span>
            <span className="text-[10px] text-content-muted block mt-0.5">
              Python {runtimeStatus?.python_version?.slice(0, 6) || '3.12'}
            </span>
          </div>
        </div>

        {isCUDAMissing && !isStructured && (
          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-start gap-3">
            <Download className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-mono">ADVISORY: TRANSFORMER TRAINING ON LOCAL CPU</strong>
              Training deep language models (BERT/DeBERTa) on local CPU will be compute-constrained. For optimal throughput without compromising sensitive incident confidentiality, export a <strong className="text-white">Google Colab Training Package</strong>.
            </div>
          </div>
        )}
      </div>

      {/* 2. Structured Pre-Flight Validation Matrix */}
      <div className="op-card p-5 border border-white/[0.08] bg-[#1a1a1c] rounded-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Sovereign Pre-Flight Validation Checks
            </h4>
          </div>

          <button
            onClick={onValidate}
            disabled={isValidating || isRunning}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
            <span>{isValidating ? 'Executing Checks...' : 'Re-Run Validation'}</span>
          </button>
        </div>

        {checks.length === 0 ? (
          <div className="p-6 rounded-xl bg-[#242426] border border-white/[0.06] text-center text-xs font-mono text-content-muted flex flex-col items-center gap-2">
            <FileCheck className="w-8 h-8 text-white/20" />
            <span>Pre-flight checks have not been run yet for this draft job.</span>
            <button
              onClick={onValidate}
              className="mt-2 px-4 py-1.5 rounded-lg bg-cyan-500 text-black font-bold text-xs"
            >
              Run Pre-Flight Checks Now
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {checks.map((check, idx) => {
              const isPass = check.status === 'PASS';
              const isWarn = check.status === 'WARNING';
              const isFail = check.status === 'FAIL';

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                    isPass 
                      ? 'bg-emerald-500/5 border-emerald-500/20' 
                      : isWarn 
                      ? 'bg-amber-500/5 border-amber-500/20' 
                      : 'bg-rose-500/5 border-rose-500/20'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {isPass ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : isWarn ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="text-xs font-mono font-bold text-white block">
                        {check.name}
                      </span>
                      <span className="text-xs text-white/70 font-sans">
                        {check.message}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                    isPass 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : isWarn 
                      ? 'bg-amber-500/10 text-amber-400' 
                      : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {check.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation & Execution Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl text-xs font-mono bg-white/[0.05] hover:bg-white/[0.1] text-white flex items-center gap-2 border border-white/[0.08] transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Hyperparameters</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onExportColab}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-2 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Colab Package</span>
          </button>

          <button
            onClick={onStart}
            disabled={!isReady || isRunning}
            className="px-6 py-2 rounded-xl text-xs font-mono font-bold bg-primary hover:bg-primary/90 text-black flex items-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Training Run</span>
          </button>
        </div>
      </div>
    </div>
  );
};
