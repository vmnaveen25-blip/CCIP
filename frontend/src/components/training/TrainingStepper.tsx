import React from 'react';
import { 
  Check, 
  Layers, 
  Database, 
  Sliders, 
  FileCheck, 
  Award 
} from 'lucide-react';

export interface StepItem {
  id: number;
  label: string;
  sublabel: string;
  icon: React.ElementType;
}

const STEPS: StepItem[] = [
  { id: 1, label: 'Model Family', sublabel: 'Candidate selection', icon: Layers },
  { id: 2, label: 'Dataset Vault', sublabel: 'Approved splits', icon: Database },
  { id: 3, label: 'Hyperparameters', sublabel: 'Task configuration', icon: Sliders },
  { id: 4, label: 'Pre-flight & Run', sublabel: 'Telemetry & execution', icon: FileCheck },
  { id: 5, label: 'Review & Handoff', sublabel: 'Approval queue', icon: Award }
];

interface TrainingStepperProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  completedSteps: number[];
  canNavigateToStep?: (step: number) => boolean;
}

export const TrainingStepper: React.FC<TrainingStepperProps> = ({
  currentStep,
  onSelectStep,
  completedSteps,
  canNavigateToStep = () => true
}) => {
  return (
    <div className="w-full bg-[#0c1310]/95 border border-white/[0.08] rounded-2xl p-3 shadow-xl">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STEPS.map((step) => {
          const isCurrent = currentStep === step.id;
          const isCompleted = completedSteps.includes(step.id);
          const isAccessible = canNavigateToStep(step.id);

          return (
            <button
              key={step.id}
              onClick={() => isAccessible && onSelectStep(step.id)}
              disabled={!isAccessible}
              className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all relative overflow-hidden ${
                isCurrent 
                  ? 'border border-[#00e676]/60 bg-[#00e676]/5 shadow-[0_0_15px_rgba(0,230,118,0.1)]' 
                  : isCompleted 
                  ? 'border border-emerald-500/30 bg-emerald-500/5 hover:bg-white/[0.04]' 
                  : 'border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
              } ${!isAccessible ? 'cursor-not-allowed opacity-40 hover:bg-transparent' : 'cursor-pointer'}`}
            >
              {/* Step indicator circle */}
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm font-bold shrink-0 transition-all ${
                  isCurrent 
                    ? 'bg-[#00e676] text-black shadow-md shadow-[#00e676]/30' 
                    : isCompleted 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-white/[0.08] text-white/60'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.id}
              </div>

              {/* Step text info */}
              <div className="flex flex-col min-w-0">
                <span className={`text-xs font-bold truncate ${
                  isCurrent ? 'text-white' : isCompleted ? 'text-emerald-300' : 'text-white/80'
                }`}>
                  {step.label}
                </span>
                <span className="text-[10px] text-white/40 truncate font-mono">
                  {step.sublabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

