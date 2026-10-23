import React, { useState, useEffect } from 'react';
import { Complaint, ThreatFeedItem } from '../types';
import { formatINR } from '../utils/formatters';
import { Search, X, ShieldAlert, Fingerprint, Coins, Terminal, ArrowRight } from 'lucide-react';

interface OmniSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaints: Complaint[];
  threats: ThreatFeedItem[];
  onSelectCase: (caseId: string) => void;
}

export const OmniSearchModal: React.FC<OmniSearchModalProps> = ({
  isOpen,
  onClose,
  complaints,
  threats,
  onSelectCase
}) => {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'CASE' | 'IOC' | 'WALLET'>('ALL');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredComplaints = complaints.filter(c => {
    if (filterType !== 'ALL' && filterType !== 'CASE') return false;
    const matchQ = query.toLowerCase();
    return (
      c.referenceNumber.toLowerCase().includes(matchQ) ||
      c.title.toLowerCase().includes(matchQ) ||
      c.citizenName.toLowerCase().includes(matchQ) ||
      (c.suspectInfo?.alias && c.suspectInfo.alias.toLowerCase().includes(matchQ)) ||
      (c.suspectInfo?.walletAddress && c.suspectInfo.walletAddress.toLowerCase().includes(matchQ))
    );
  });

  const filteredThreats = threats.filter(t => {
    if (filterType === 'CASE') return false;
    if (filterType === 'WALLET' && t.iocType !== 'CRYPTO_WALLET') return false;
    const matchQ = query.toLowerCase();
    return (
      t.iocValue.toLowerCase().includes(matchQ) ||
      t.threatName.toLowerCase().includes(matchQ) ||
      t.threatActor.toLowerCase().includes(matchQ)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/45 backdrop-blur-[7px] animate-in fade-in duration-150">
      <div 
        className="fixed inset-0"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-[#06140c] border border-[#00e676]/25 rounded-2xl sm:rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.85)] overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Search Header Bar */}
        <div className="flex items-center gap-3 p-4 border-b border-[#00e676]/15 bg-[#030906]">
          <Search className="w-5 h-5 text-[#00e676] shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Case ID (e.g. CYBER-2026-9842), IP address, IOC Hash, Suspect Alias..."
            className="w-full bg-transparent text-white placeholder:text-[#8fa396] text-sm focus:outline-none font-sans"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[#8fa396] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-1 rounded-lg bg-white/[0.06] text-[#8fa396] hover:text-white text-xs px-2 font-mono"
          >
            ESC
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#020704] border-b border-[#00e676]/15 text-xs font-mono">
          <span className="text-[#8fa396] mr-1">FILTER:</span>
          {(['ALL', 'CASE', 'IOC', 'WALLET'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-lg transition-colors text-xs ${
                filterType === type 
                  ? 'bg-[#00e676] text-[#031508] font-bold shadow-[0_0_12px_rgba(0,230,118,0.3)]' 
                  : 'text-[#8fa396] hover:text-white bg-white/[0.04]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-4 flex flex-col gap-3 bg-[#06140c]">
          {filteredComplaints.length === 0 && filteredThreats.length === 0 ? (
            <div className="p-8 text-center text-[#8fa396]">
              <Terminal className="w-10 h-10 mx-auto mb-2 text-[#00e676]/30" />
              <p className="text-sm font-semibold text-white">No matching records found</p>
              <p className="text-xs text-[#8fa396] mt-1">Try searching for "CYBER", "185.220", "Voice Clone", or "0x71C"</p>
            </div>
          ) : (
            <>
              {filteredComplaints.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono text-[#00e676] uppercase tracking-wider px-1 py-1 font-bold">
                    INCIDENT CASES ({filteredComplaints.length})
                  </div>
                  <div className="flex flex-col gap-2">
                    {filteredComplaints.map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onSelectCase(c.id);
                          onClose();
                        }}
                        className="p-3.5 rounded-xl bg-[#030906] border border-[#00e676]/15 hover:border-[#00e676]/50 hover:bg-[#071910] cursor-pointer flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/20">
                            <ShieldAlert className="w-4 h-4 text-[#00e676]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#00e676]">{c.referenceNumber}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-[#c8ddd0]">
                                {c.category}
                              </span>
                              <span className={`text-[10px] font-mono font-bold px-1.5 rounded ${
                                c.severity === 'CRITICAL' ? 'chip-danger' : 'chip-warning'
                              }`}>
                                {c.severity}
                              </span>
                            </div>
                            <div className="text-xs text-white font-medium mt-1 group-hover:text-[#00e676] transition-colors">
                              {c.title}
                            </div>
                            <div className="text-[11px] text-[#8fa396] flex items-center gap-2 mt-0.5">
                              <span>Victim: {c.citizenName}</span>
                              {c.financialLoss ? (
                                <>
                                  <span>•</span>
                                  <span className="text-[#00e676] font-mono font-semibold">{formatINR(c.financialLoss)} Loss</span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#8fa396] group-hover:text-[#00e676] group-hover:translate-x-1 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredThreats.length > 0 && (
                <div className="mt-2">
                  <div className="text-[10px] font-mono text-[#00e676] uppercase tracking-wider px-1 py-1 font-bold">
                    ACTIVE THREAT FEEDS & IOCs ({filteredThreats.length})
                  </div>
                  <div className="flex flex-col gap-2">
                    {filteredThreats.map(t => (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-xl bg-[#030906] border border-[#00e676]/15 flex items-center justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/20">
                            {t.iocType === 'CRYPTO_WALLET' ? <Coins className="w-4 h-4 text-amber-400" /> : <Fingerprint className="w-4 h-4 text-cyan-400" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-white bg-black/40 px-1.5 py-0.5 rounded border border-[#00e676]/20">
                                {t.iocValue}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-[#00e676]/15 text-[#00e676] border border-[#00e676]/30">
                                {t.confidenceScore}% CONFIDENCE
                              </span>
                            </div>
                            <div className="text-xs text-[#c8ddd0] mt-1">
                              {t.threatName} • <span className="text-[#8fa396] font-mono">{t.threatActor}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-1 rounded bg-white/[0.06] text-[#c8ddd0] border border-white/10">
                          {t.associatedCasesCount} CASES LINKED
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-[#030906] border-t border-[#00e676]/15 flex items-center justify-between text-[11px] font-mono text-[#8fa396]">
          <span>Navigate with <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white">↓</kbd></span>
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white">ENTER</kbd> to inspect case</span>
        </div>
      </div>
    </div>
  );
};
