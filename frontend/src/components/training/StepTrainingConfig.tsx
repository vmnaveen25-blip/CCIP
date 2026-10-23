import React from 'react';
import { 
  Sliders, 
  Target, 
  Sparkles, 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight,
  Zap,
  RotateCcw
} from 'lucide-react';
import { QualityGateConfig } from '../../types';

export interface TrainingHyperparameters {
  epochs: number;
  batch_size: number;
  learning_rate: number;
  warmup_steps: number;
  weight_decay: number;
  seed: number;
  preset: 'CONSERVATIVE' | 'BALANCED' | 'EXPERIMENTAL';
}

interface StepTrainingConfigProps {
  hyperparams: TrainingHyperparameters;
  onChangeHyperparams: (params: TrainingHyperparameters) => void;
  qualityGates: QualityGateConfig;
  onChangeQualityGates: (gates: QualityGateConfig) => void;
  task: string;
  onBack: () => void;
  onNext: () => void;
}

export const StepTrainingConfig: React.FC<StepTrainingConfigProps> = ({
  hyperparams,
  onChangeHyperparams,
  qualityGates,
  onChangeQualityGates,
  task,
  onBack,
  onNext
}) => {
  const isStructured = task === 'STRUCTURED_CLASSIFICATION';

  const applyPreset = (preset: 'CONSERVATIVE' | 'BALANCED' | 'EXPERIMENTAL') => {
    switch (preset) {
      case 'CONSERVATIVE':
        onChangeHyperparams({
          ...hyperparams,
          preset,
          epochs: isStructured ? 3 : 2,
          batch_size: 16,
          learning_rate: isStructured ? 0.0005 : 0.00001,
          warmup_steps: 100,
          weight_decay: 0.01
        });
        break;
      case 'BALANCED':
        onChangeHyperparams({
          ...hyperparams,
          preset,
          epochs: isStructured ? 5 : 3,
          batch_size: 32,
          learning_rate: isStructured ? 0.001 : 0.00002,
          warmup_steps: 200,
          weight_decay: 0.01
        });
        break;
      case 'EXPERIMENTAL':
        onChangeHyperparams({
          ...hyperparams,
          preset,
          epochs: isStructured ? 8 : 5,
          batch_size: 32,
          learning_rate: isStructured ? 0.002 : 0.00005,
          warmup_steps: 50,
          weight_decay: 0.001
        });
        break;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Preset Selector Banner */}
      <div className="op-card p-5 border border-white/[0.08] bg-[#161618] rounded-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Hyperparameter Configuration Presets
          </span>
          <span className="text-[11px] font-mono text-content-muted">
            Optimized for {isStructured ? 'Sovereign CPU MLP' : 'Transformer Architecture'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'CONSERVATIVE', label: 'Conservative', desc: 'Low LR · High stability · Minimal risk', color: 'blue' },
            { id: 'BALANCED', label: 'Balanced (Standard)', desc: 'Recommended baseline · Rapid convergence', color: 'emerald' },
            { id: 'EXPERIMENTAL', label: 'Experimental', desc: 'Higher LR · More exploration epochs', color: 'amber' }
          ].map((p) => {
            const isSelected = hyperparams.preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id as any)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected 
                    ? 'bg-primary/10 border-primary shadow-sm shadow-primary/20' 
                    : 'bg-[#242426] border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-mono font-bold ${isSelected ? 'text-primary' : 'text-white'}`}>
                    {p.label}
                  </span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className="text-[10px] text-content-muted block leading-tight">
                  {p.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed Hyperparameters Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Hyperparameters */}
        <div className="op-card p-5 border border-white/[0.08] bg-[#1a1a1c] rounded-2xl flex flex-col gap-4">
          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/[0.08]">
            <Sliders className="w-4 h-4 text-primary" />
            Core Training Hyperparameters
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-white/70 block mb-1">
                EPOCHS ({hyperparams.epochs})
              </label>
              <input
                type="range"
                min={1}
                max={isStructured ? 20 : 10}
                value={hyperparams.epochs}
                onChange={(e) => onChangeHyperparams({ ...hyperparams, epochs: parseInt(e.target.value) })}
                className="w-full accent-primary"
              />
              <span className="text-[10px] text-white/40 font-mono mt-0.5 block">
                {isStructured ? 'Fast CPU convergence (1-20)' : 'Colab GPU Recommended (1-10)'}
              </span>
            </div>

            <div>
              <label className="text-xs font-mono text-white/70 block mb-1">
                BATCH SIZE
              </label>
              <select
                value={hyperparams.batch_size}
                onChange={(e) => onChangeHyperparams({ ...hyperparams, batch_size: parseInt(e.target.value) })}
                className="w-full px-3 py-1.5 rounded-xl bg-[#242426] border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-primary"
              >
                <option value={8}>8 (Minimal Memory)</option>
                <option value={16}>16 (Balanced)</option>
                <option value={32}>32 (Standard)</option>
                <option value={64}>64 (High Throughput)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-white/70 block mb-1">
                LEARNING RATE
              </label>
              <input
                type="number"
                step={isStructured ? "0.0001" : "0.000005"}
                value={hyperparams.learning_rate}
                onChange={(e) => onChangeHyperparams({ ...hyperparams, learning_rate: parseFloat(e.target.value) })}
                className="w-full px-3 py-1.5 rounded-xl bg-[#242426] border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-white/70 block mb-1">
                RANDOM SEED
              </label>
              <input
                type="number"
                value={hyperparams.seed}
                onChange={(e) => onChangeHyperparams({ ...hyperparams, seed: parseInt(e.target.value) })}
                className="w-full px-3 py-1.5 rounded-xl bg-[#242426] border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-primary"
              />
              <span className="text-[10px] text-white/40 font-mono mt-0.5 block">
                Deterministic reproducibility
              </span>
            </div>

            <div>
              <label className="text-xs font-mono text-white/70 block mb-1">
                WARMUP STEPS
              </label>
              <input
                type="number"
                value={hyperparams.warmup_steps}
                onChange={(e) => onChangeHyperparams({ ...hyperparams, warmup_steps: parseInt(e.target.value) })}
                className="w-full px-3 py-1.5 rounded-xl bg-[#242426] border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-white/70 block mb-1">
                WEIGHT DECAY
              </label>
              <input
                type="number"
                step="0.001"
                value={hyperparams.weight_decay}
                onChange={(e) => onChangeHyperparams({ ...hyperparams, weight_decay: parseFloat(e.target.value) })}
                className="w-full px-3 py-1.5 rounded-xl bg-[#242426] border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Right: Quality Gate Thresholds */}
        <div className="op-card p-5 border border-white/[0.08] bg-[#1a1a1c] rounded-2xl flex flex-col gap-4">
          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/[0.08]">
            <Target className="w-4 h-4 text-emerald-400" />
            Automated Quality Gate Policy
          </h4>

          <p className="text-xs text-white/70">
            Trained models are automatically evaluated against these thresholds. Candidate models failing quality gates cannot be promoted to production.
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-mono text-white/70 block mb-1">
                EVALUATION METRIC
              </label>
              <select
                value={qualityGates.metric}
                onChange={(e) => onChangeQualityGates({ ...qualityGates, metric: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl bg-[#242426] border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-primary"
              >
                <option value="validation_f1">Macro F1-Score (Recommended for Imbalance)</option>
                <option value="accuracy">Standard Top-1 Accuracy (%)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-white/70 block mb-1">
                  MIN VALIDATION SCORE
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="1.0"
                  value={qualityGates.minimum_validation}
                  onChange={(e) => onChangeQualityGates({ ...qualityGates, minimum_validation: parseFloat(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#242426] border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-primary"
                />
                <span className="text-[10px] text-white/40 font-mono mt-0.5 block">
                  Threshold: ≥ {(qualityGates.minimum_validation * 100).toFixed(0)}%
                </span>
              </div>

              <div>
                <label className="text-xs font-mono text-white/70 block mb-1">
                  MIN HELD-OUT TEST SCORE
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="1.0"
                  value={qualityGates.minimum_test}
                  onChange={(e) => onChangeQualityGates({ ...qualityGates, minimum_test: parseFloat(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#242426] border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-primary"
                />
                <span className="text-[10px] text-white/40 font-mono mt-0.5 block">
                  Threshold: ≥ {(qualityGates.minimum_test * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#242426] border border-white/[0.06] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Require Adversarial Challenge Set</span>
                <span className="text-[10px] text-white/50 font-mono">
                  Evaluates against synthetic adversarial jailbreak & smishing variations
                </span>
              </div>
              <input
                type="checkbox"
                checked={qualityGates.challenge_set_required || false}
                onChange={(e) => onChangeQualityGates({ ...qualityGates, challenge_set_required: e.target.checked })}
                className="w-4 h-4 rounded accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl text-xs font-mono bg-white/[0.05] hover:bg-white/[0.1] text-white flex items-center gap-2 border border-white/[0.08] transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dataset Selection</span>
        </button>

        <button
          onClick={onNext}
          className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-primary hover:bg-primary/90 text-black flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
        >
          <span>Continue to Pre-flight & Run</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
