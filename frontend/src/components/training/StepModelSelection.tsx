import React from 'react';
import { 
  Check, 
  Cpu, 
  Tag, 
  Info,
  ArrowRight,
  ShieldCheck,
  Network,
  FileText,
  Box,
  Link2,
  Mail,
  MessageSquare
} from 'lucide-react';

export interface TrainableModelSpec {
  family: string;
  name: string;
  task: string;
  baseModel: string;
  category: 'STRUCTURED' | 'NLP' | 'EMBEDDING' | 'GRAPH';
  recommendedRuntime: 'LOCAL_CPU' | 'COLAB_EXTERNAL';
  currentVersion: string;
  activeMetrics: {
    accuracy: number;
    f1: number;
  };
  metricsDisplay: string;
  description: string;
  iconType: 'shield' | 'network' | 'doc' | 'box' | 'link' | 'mail' | 'sms' | 'similarity';
}

export const TRAINABLE_MODELS: TrainableModelSpec[] = [
  {
    family: 'feedback_gate',
    name: 'Feedback Reliability Neural Gate',
    task: 'STRUCTURED CLASSIFICATION',
    baseModel: 'PyTorch MLP',
    category: 'STRUCTURED',
    recommendedRuntime: 'LOCAL_CPU',
    currentVersion: 'v1.1.0',
    activeMetrics: { accuracy: 98.4, f1: 0.96 },
    metricsDisplay: 'ACC: 98.4% F1: 0.96',
    description: 'Discriminates reliable citizen reports from noise and adversarial spam using multi-signal governance model.',
    iconType: 'shield'
  },
  {
    family: 'evidence_graph_link',
    name: 'Evidence Graph Link Predictor',
    task: 'GRAPH LEARNING',
    baseModel: 'PyTorch GraphSAGE',
    category: 'GRAPH',
    recommendedRuntime: 'LOCAL_CPU',
    currentVersion: 'v1.0.4',
    activeMetrics: { accuracy: 96.2, f1: 0.94 },
    metricsDisplay: 'ACC: 96.2% F1: 0.94',
    description: 'Predicts high-probability relationship edges between financial, cryptographic, and telecommunication forensic artifacts.',
    iconType: 'network'
  },
  {
    family: 'complaint_classifier',
    name: 'Citizen Complaint Category Classifier',
    task: 'TEXT CLASSIFICATION',
    baseModel: 'microsoft/deberta-v3-base',
    category: 'NLP',
    recommendedRuntime: 'COLAB_EXTERNAL',
    currentVersion: 'v1.2.1',
    activeMetrics: { accuracy: 94.7, f1: 0.91 },
    metricsDisplay: 'ACC: 94.7% F1: 0.91',
    description: '18-class jurisdictional cybercrime triage model mapping raw victim narratives to specific legal offense codes.',
    iconType: 'doc'
  },
  {
    family: 'cyber_ner',
    name: 'Cyber Threat Entity Recognizer',
    task: 'TOKEN CLASSIFICATION',
    baseModel: 'xlm-roberta-base',
    category: 'NLP',
    recommendedRuntime: 'COLAB_EXTERNAL',
    currentVersion: 'v1.3.0',
    activeMetrics: { accuracy: 95.8, f1: 0.89 },
    metricsDisplay: 'F1: 0.89 NER-F1: 0.90',
    description: 'Extracts 12 entity types (IPs, Crypto Wallets, CVEs, Threat Actors, Domains, Bank Accounts) from forensic evidence notes.',
    iconType: 'box'
  },
  {
    family: 'url_phishing',
    name: 'URL Phishing Detector',
    task: 'BINARY CLASSIFICATION',
    baseModel: 'EfficientNet-B0 (URL + lexical)',
    category: 'NLP',
    recommendedRuntime: 'LOCAL_CPU',
    currentVersion: 'v1.0.7',
    activeMetrics: { accuracy: 97.6, f1: 0.95 },
    metricsDisplay: 'ACC: 97.6% F1: 0.95',
    description: 'Detects phishing and malicious URLs using hybrid lexical and visual features.',
    iconType: 'link'
  },
  {
    family: 'email_threat',
    name: 'Email Threat Classifier',
    task: 'TEXT CLASSIFICATION',
    baseModel: 'microsoft/deberta-v3-base',
    category: 'NLP',
    recommendedRuntime: 'COLAB_EXTERNAL',
    currentVersion: 'v1.1.2',
    activeMetrics: { accuracy: 95.1, f1: 0.92 },
    metricsDisplay: 'ACC: 95.1% F1: 0.92',
    description: 'Classifies malicious, phishing, and business email compromise (BEC) messages.',
    iconType: 'mail'
  },
  {
    family: 'sms_spam',
    name: 'SMS Scam Classifier',
    task: 'TEXT CLASSIFICATION',
    baseModel: 'DistilBERT',
    category: 'NLP',
    recommendedRuntime: 'LOCAL_CPU',
    currentVersion: 'v1.0.3',
    activeMetrics: { accuracy: 94.3, f1: 0.90 },
    metricsDisplay: 'ACC: 94.3% F1: 0.90',
    description: 'Detects scam, smishing, and fraudulent SMS messages in multiple languages.',
    iconType: 'sms'
  },
  {
    family: 'case_similarity',
    name: 'Case Similarity Transformer',
    task: 'EMBEDDING / SIMILARITY',
    baseModel: 'all-mpnet-base-v2',
    category: 'EMBEDDING',
    recommendedRuntime: 'COLAB_EXTERNAL',
    currentVersion: 'v1.2.0',
    activeMetrics: { accuracy: 95.0, f1: 0.91 },
    metricsDisplay: 'MRR: 0.87 Recall@10: 0.91',
    description: 'Generates semantic embeddings to find similar cases across complaints.',
    iconType: 'similarity'
  }
];

interface StepModelSelectionProps {
  selectedFamily: string;
  onSelectFamily: (spec: TrainableModelSpec) => void;
  targetVersion: string;
  onChangeTargetVersion: (v: string) => void;
  notes: string;
  onChangeNotes: (notes: string) => void;
  onNext: () => void;
}

export const StepModelSelection: React.FC<StepModelSelectionProps> = ({
  selectedFamily,
  onSelectFamily,
  targetVersion,
  onChangeTargetVersion,
  notes,
  onChangeNotes,
  onNext
}) => {
  const activeSpec = TRAINABLE_MODELS.find(m => m.family === selectedFamily) || TRAINABLE_MODELS[0];

  const renderModelIcon = (type: string, isCpu: boolean) => {
    const containerClass = `w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
      isCpu
        ? 'bg-[#00e676]/10 border-[#00e676]/30 text-[#00e676]'
        : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
    }`;

    switch (type) {
      case 'shield':
        return <div className={containerClass}><ShieldCheck className="w-5 h-5 text-[#00e676]" /></div>;
      case 'network':
        return <div className={containerClass}><Network className="w-5 h-5 text-[#00e676]" /></div>;
      case 'doc':
        return <div className={containerClass}><FileText className="w-5 h-5 text-blue-400" /></div>;
      case 'box':
        return <div className={containerClass}><Box className="w-5 h-5 text-blue-400" /></div>;
      case 'link':
        return <div className={containerClass}><Link2 className="w-5 h-5 text-[#00e676]" /></div>;
      case 'mail':
        return <div className={containerClass}><Mail className="w-5 h-5 text-blue-400" /></div>;
      case 'sms':
        return <div className={containerClass}><MessageSquare className="w-5 h-5 text-[#00e676]" /></div>;
      case 'similarity':
        return <div className={containerClass}><FileText className="w-5 h-5 text-blue-400" /></div>;
      default:
        return <div className={containerClass}><Cpu className="w-5 h-5 text-cyan-400" /></div>;
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Top Banner Notice */}
      <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 text-xs text-white/80 flex items-start gap-3 shadow-lg">
        <div className="w-5 h-5 rounded-full border border-blue-400 text-blue-400 flex items-center justify-center font-bold font-mono text-xs shrink-0 mt-0.5">
          i
        </div>
        <div className="leading-relaxed">
          <strong className="text-white block mb-0.5 font-mono text-xs font-bold tracking-wide">
            SOVEREIGN AI MODEL REGISTRY // TRAINING CANDIDATE SELECTION
          </strong>
          <span>Select one of the production model families below. Models flagged with </span>
          <strong className="text-[#00e676] font-mono font-bold">LOCAL CPU</strong>
          <span> can be trained and validated directly within this sovereign host. For heavy transformer architectures, use the </span>
          <strong className="text-[#c084fc] font-mono font-bold">COLAB PACKAGE</strong>
          <span> to export a clean training bundle to run on cloud GPU without leaking raw sensitive case data.</span>
        </div>
      </div>

      {/* Grid of 8 Models matching screenshot precisely */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TRAINABLE_MODELS.map((model) => {
          const isSelected = selectedFamily === model.family;
          const isCpu = model.recommendedRuntime === 'LOCAL_CPU';

          return (
            <div
              key={model.family}
              onClick={() => onSelectFamily(model)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected 
                  ? 'bg-[#00e676]/[0.03] border-[#00e676] shadow-lg shadow-[#00e676]/10' 
                  : 'bg-[#0c1310]/85 border-white/[0.08] hover:border-white/[0.18] hover:bg-white/[0.02]'
              }`}
            >
              <div>
                {/* Header: Left Icon Box + Title/Subtitle + Right Badge */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Left Icon Box */}
                    {renderModelIcon(model.iconType, isCpu)}

                    {/* Title & Subtitle */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white tracking-wide">
                          {model.name}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-[#00e676] text-black flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3] text-black" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block mt-0.5">
                        {model.task} · BASE: {model.baseModel}
                      </span>
                    </div>
                  </div>

                  {/* Right Runtime Badge */}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 border ${
                    isCpu 
                      ? 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/30' 
                      : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                  }`}>
                    {isCpu ? 'LOCAL CPU RUNNABLE' : 'COLAB RECOMMENDED'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-white/70 font-sans mb-3 line-clamp-2 leading-relaxed">
                  {model.description}
                </p>
              </div>

              {/* Footer: Production Metrics & Active Version */}
              <div className="pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="text-white/40">PROD:</span>
                  <span className="text-white font-bold">{model.currentVersion}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-white/40">EVALUATION ·</span>
                  <span className="text-white/70">
                    {model.metricsDisplay.split(' ').map((part, pIdx) => {
                      const isNum = /^[\d\.]+%?$/.test(part);
                      return (
                        <span key={pIdx} className={isNum ? 'text-cyan-400 font-bold ml-1 mr-2' : 'text-white/50'}>
                          {part}
                        </span>
                      );
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration for Selected Model */}
      <div className="op-card p-5 border border-white/[0.08] bg-[#0c1310]/90 rounded-2xl flex flex-col gap-4 shadow-xl">
        <h4 className="text-xs font-mono font-bold text-[#00e676] uppercase tracking-wider flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#00e676]" />
          Candidate Version Tag & Retraining Rationale
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-mono text-white/70 block mb-1.5">
              TARGET CANDIDATE VERSION
            </label>
            <input
              type="text"
              value={targetVersion}
              onChange={(e) => onChangeTargetVersion(e.target.value)}
              placeholder="e.g. v1.1.1-candidate"
              className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-[#00e676]"
            />
            <span className="text-[10px] text-white/40 font-mono mt-1 block">
              Staging target: backend/ml_models/staging/{activeSpec.family}/
            </span>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-mono text-white/70 block mb-1.5">
              EXPERIMENT NOTES & RETRAINING MOTIVATION
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => onChangeNotes(e.target.value)}
              placeholder="e.g. Retraining with August 2026 ground-truth fraud datasets to reduce false positive alerts"
              className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white font-sans text-xs focus:outline-none focus:border-[#00e676]"
            />
            <span className="text-[10px] text-white/40 font-mono mt-1 block">
              Permanent audit log metadata recorded in the Sovereign Ledger
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onNext}
            className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-[#00e676] hover:bg-[#00c864] text-black flex items-center gap-2 shadow-lg shadow-[#00e676]/20 transition-all cursor-pointer"
          >
            <span>Continue to Dataset Selection</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
