import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileCode, 
  Copy, 
  Check, 
  ShieldCheck, 
  ExternalLink,
  Code2
} from 'lucide-react';
import { ColabExportPackage } from '../../types';

interface ColabExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportPackage: ColabExportPackage | null;
}

export const ColabExportModal: React.FC<ColabExportModalProps> = ({
  isOpen,
  onClose,
  exportPackage
}) => {
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !exportPackage) return null;

  const currentFile = exportPackage.package_files[activeFileIndex] || exportPackage.package_files[0];

  const handleCopy = () => {
    if (currentFile) {
      navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadAll = () => {
    const blob = new Blob([JSON.stringify(exportPackage, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ccip_training_package_${exportPackage.job_reference}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="op-card w-full max-w-3xl border border-white/[0.1] bg-[#161618] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                Google Colab Training Export Bundle
              </h3>
              <span className="text-[11px] font-mono text-content-muted block">
                REFERENCE: {exportPackage.job_reference} · MODEL: {exportPackage.model_family}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security / Privacy Guarantee Banner */}
        <div className="p-4 bg-purple-500/5 border-b border-white/[0.06] text-xs text-purple-200 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-white">ENCLAVE PRIVACY PRESERVED:</strong> This export bundle contains hyperparameter specifications, task schemas, and dataset manifest metadata. <strong className="text-white">No raw incident texts or complainant credentials are exported</strong>, adhering strictly to Sovereign Enclave data residency rules.
          </p>
        </div>

        {/* Content Tabs for Package Files */}
        <div className="flex border-b border-white/[0.08] bg-[#1a1a1c] px-4 pt-2 gap-2 overflow-x-auto">
          {exportPackage.package_files.map((file, idx) => (
            <button
              key={idx}
              onClick={() => setActiveFileIndex(idx)}
              className={`px-3 py-1.5 rounded-t-lg text-xs font-mono transition-all border-t border-x ${
                activeFileIndex === idx
                  ? 'bg-[#161618] text-primary border-white/[0.1] font-bold'
                  : 'bg-transparent text-white/60 border-transparent hover:text-white'
              }`}
            >
              {file.name}
            </button>
          ))}
        </div>

        {/* File Code Viewer */}
        <div className="flex-1 p-4 bg-[#0e0e10] overflow-y-auto font-mono text-xs text-white/80 select-text">
          <pre className="whitespace-pre-wrap break-words">
            {currentFile?.content}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/[0.08] bg-[#161618] flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white/[0.06] hover:bg-white/[0.1] text-white flex items-center gap-1.5 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy File Content'}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadAll}
              className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-primary hover:bg-primary/90 text-black flex items-center gap-1.5 shadow-lg shadow-primary/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Package JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
