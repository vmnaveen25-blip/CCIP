import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  Clock, 
  Calendar, 
  ArrowRight,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { TrainingJob } from '../../types';

interface TrainingHistoryTableProps {
  jobs: TrainingJob[];
  onSelectJob: (job: TrainingJob) => void;
  selectedJobId?: string;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const TrainingHistoryTable: React.FC<TrainingHistoryTableProps> = ({
  jobs,
  onSelectJob,
  selectedJobId,
  onRefresh,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = 
      job.job_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.target_model_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.model_family.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            COMPLETED
          </span>
        );
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <Flame className="w-3 h-3" />
            RUNNING
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-500/10 text-slate-300 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="op-card p-5 border border-white/[0.08] bg-[#161618] rounded-2xl flex flex-col gap-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Sovereign Training Job Ledger ({jobs.length} Runs Recorded)
          </h4>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/[0.06] hover:bg-white/[0.1] text-white flex items-center gap-1.5 transition-all self-start sm:self-auto disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-white/40" />
          <input
            type="text"
            placeholder="Search by job reference, model family or candidate name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#242426] border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'COMPLETED', 'RUNNING', 'DRAFT', 'FAILED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all ${
                statusFilter === st 
                  ? 'bg-primary text-black font-bold' 
                  : 'bg-white/[0.04] text-white/60 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] text-content-muted text-[10px] uppercase">
              <th className="py-2.5 px-3">Reference</th>
              <th className="py-2.5 px-3">Target Model</th>
              <th className="py-2.5 px-3">Task</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Validation Metric</th>
              <th className="py-2.5 px-3">Quality Gate</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-content-muted text-xs font-mono">
                  No training jobs found matching the current search criteria.
                </td>
              </tr>
            ) : (
              filteredJobs.map((job) => {
                const isSelected = selectedJobId === job.id;
                const metrics = job.metrics_json || {};
                const qg = job.quality_gate_result_json?.status || 'N/A';

                return (
                  <tr
                    key={job.id}
                    onClick={() => onSelectJob(job)}
                    className={`hover:bg-white/[0.03] transition-colors cursor-pointer ${
                      isSelected ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <span className="font-bold text-primary">{job.job_reference}</span>
                      <span className="text-[10px] text-white/40 block mt-0.5">
                        {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-white font-sans font-semibold block truncate max-w-[180px]">
                        {job.target_model_name}
                      </span>
                      <span className="text-[10px] text-content-muted block">
                        {job.target_model_version}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-content-muted text-[11px]">
                      {job.training_task}
                    </td>
                    <td className="py-3 px-3">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="py-3 px-3 text-white">
                      {metrics.validation_f1 ? (
                        <span className="text-emerald-400 font-bold">
                          F1: {metrics.validation_f1.toFixed(3)}
                        </span>
                      ) : metrics.accuracy ? (
                        <span className="text-cyan-400 font-bold">
                          Acc: {metrics.accuracy}%
                        </span>
                      ) : (
                        <span className="text-white/40">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        qg === 'PASS' 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : qg === 'FAIL' 
                          ? 'bg-rose-500/10 text-rose-400' 
                          : 'bg-white/[0.06] text-white/40'
                      }`}>
                        {qg}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectJob(job);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-white/[0.06] hover:bg-primary hover:text-black transition-all"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
