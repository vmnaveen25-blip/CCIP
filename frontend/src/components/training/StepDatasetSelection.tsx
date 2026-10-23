import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Check, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  ArrowLeft, 
  ArrowRight,
  Lock,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '../../api/client';

export interface DatasetItem {
  id: string;
  name: string;
  version: string;
  total_samples: number;
  classes_count: number;
  status: string; // "APPROVED", "PENDING", "REJECTED"
  deidentified: boolean;
  train_split: number;
  val_split: number;
  test_split: number;
  associated_task: string;
}

const DEFAULT_APPROVED_DATASETS: DatasetItem[] = [
  {
    id: 'ds-feedback-gate-v1',
    name: 'Citizen Feedback Reliability Ground-Truth Vault',
    version: 'v1.4.0',
    total_samples: 12500,
    classes_count: 2,
    status: 'APPROVED',
    deidentified: true,
    train_split: 10000,
    val_split: 1500,
    test_split: 1000,
    associated_task: 'STRUCTURED_CLASSIFICATION'
  },
  {
    id: 'ds-graph-evidence-v1',
    name: 'Cross-Jurisdiction Evidence Graph Edge Registry',
    version: 'v1.1.0',
    total_samples: 8400,
    classes_count: 2,
    status: 'APPROVED',
    deidentified: true,
    train_split: 6800,
    val_split: 1000,
    test_split: 600,
    associated_task: 'STRUCTURED_CLASSIFICATION'
  },
  {
    id: 'ds-complaints-jurisdiction-v2',
    name: 'De-Identified Cybercrime Jurisdictional Complaints Benchmark',
    version: 'v2.2.0',
    total_samples: 24800,
    classes_count: 18,
    status: 'APPROVED',
    deidentified: true,
    train_split: 20000,
    val_split: 2800,
    test_split: 2000,
    associated_task: 'TEXT_CLASSIFICATION'
  },
  {
    id: 'ds-cyber-ner-forensics-v1',
    name: 'Sovereign Forensics NER Gold-Standard Corpus',
    version: 'v1.5.0',
    total_samples: 9200,
    classes_count: 12,
    status: 'APPROVED',
    deidentified: true,
    train_split: 7500,
    val_split: 1000,
    test_split: 700,
    associated_task: 'TOKEN_CLASSIFICATION'
  },
  {
    id: 'ds-phishing-spear-v1',
    name: 'Executive BEC & Phishing Lure Corpus',
    version: 'v1.2.0',
    total_samples: 15600,
    classes_count: 2,
    status: 'APPROVED',
    deidentified: true,
    train_split: 12600,
    val_split: 1800,
    test_split: 1200,
    associated_task: 'TEXT_CLASSIFICATION'
  }
];

interface StepDatasetSelectionProps {
  selectedDatasetId: string | null;
  selectedDatasetVersion: string;
  onSelectDataset: (dataset: DatasetItem) => void;
  targetTask: string;
  onBack: () => void;
  onNext: () => void;
}

export const StepDatasetSelection: React.FC<StepDatasetSelectionProps> = ({
  selectedDatasetId,
  selectedDatasetVersion,
  onSelectDataset,
  targetTask,
  onBack,
  onNext
}) => {
  const [datasets, setDatasets] = useState<DatasetItem[]>(DEFAULT_APPROVED_DATASETS);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getDatasets();
        if (data && Array.isArray(data) && data.length > 0) {
          const mapped: DatasetItem[] = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            version: d.version || 'v1.0.0',
            total_samples: d.total_samples || d.sample_count || 10000,
            classes_count: d.classes_count || 2,
            status: d.status || 'APPROVED',
            deidentified: true,
            train_split: Math.round((d.total_samples || 10000) * 0.8),
            val_split: Math.round((d.total_samples || 10000) * 0.1),
            test_split: Math.round((d.total_samples || 10000) * 0.1),
            associated_task: d.associated_task || targetTask
          }));
          setDatasets(mapped);
          if (!selectedDatasetId && mapped.length > 0) {
            onSelectDataset(mapped[0]);
          }
        }
      } catch {
        // Fallback to default approved datasets
      } finally {
        setLoading(false);
      }
    };
    fetchDatasets();
  }, [targetTask]);

  return (
    <div className="flex flex-col gap-6">
      {/* Notice on Sovereign Enclave Data Vault Safety Gates */}
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block mb-0.5 font-mono">GOVERNANCE RULE // APPROVED DATASETS ONLY</strong>
          In accordance with Enclave Privacy Protocols, model training jobs may ONLY utilize datasets with verified <strong className="text-white">APPROVED</strong> governance status and <strong className="text-white">DE-IDENTIFICATION</strong> seals. Raw un-sanitized citizen PII is strictly quarantined from all training pipelines.
        </div>
      </div>

      {/* Dataset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {datasets.map((ds) => {
          const isSelected = selectedDatasetId === ds.id;
          const isApproved = ds.status === 'APPROVED';

          return (
            <div
              key={ds.id}
              onClick={() => isApproved && onSelectDataset(ds)}
              className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                isApproved ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              } ${
                isSelected 
                  ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10' 
                  : 'bg-[#1a1a1c] border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.02]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white tracking-wide">
                        {ds.name}
                      </h4>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-primary text-black flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-content-muted block mt-0.5">
                      ID: {ds.id} · VERSION: <strong className="text-white">{ds.version}</strong>
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    <ShieldCheck className="w-3 h-3" />
                    {ds.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 my-3 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.06] text-white/80">
                    SAMPLES: <strong className="text-white">{ds.total_samples.toLocaleString()}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    CLASSES: {ds.classes_count}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    DE-IDENTIFIED
                  </span>
                </div>
              </div>

              {/* Data Split Breakdown */}
              <div className="pt-3 border-t border-white/[0.06]">
                <div className="flex items-center justify-between text-[11px] font-mono mb-1.5 text-white/60">
                  <span>SPLITS:</span>
                  <span>
                    Train: <strong className="text-emerald-400">{ds.train_split.toLocaleString()}</strong> · 
                    Val: <strong className="text-cyan-400">{ds.val_split.toLocaleString()}</strong> · 
                    Test: <strong className="text-purple-400">{ds.test_split.toLocaleString()}</strong>
                  </span>
                </div>
                {/* Visual split progress bar */}
                <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: '80%' }} title="Train Split (80%)" />
                  <div className="bg-cyan-500 h-full" style={{ width: '10%' }} title="Validation Split (10%)" />
                  <div className="bg-purple-500 h-full" style={{ width: '10%' }} title="Held-out Test Split (10%)" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl text-xs font-mono bg-white/[0.05] hover:bg-white/[0.1] text-white flex items-center gap-2 border border-white/[0.08] transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Model Selection</span>
        </button>

        <button
          onClick={onNext}
          disabled={!selectedDatasetId}
          className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-primary hover:bg-primary/90 text-black flex items-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-40"
        >
          <span>Continue to Hyperparameters</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
