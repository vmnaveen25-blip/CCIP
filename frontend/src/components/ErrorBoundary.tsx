import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#18181B] border border-red-500/30 rounded-2xl p-6 shadow-2xl text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            
            <div>
              <h2 className="text-base font-bold text-white mb-1 font-mono">
                {this.props.fallbackTitle || 'Forensic View Fault Detected'}
              </h2>
              <p className="text-xs text-[#96908C]">
                An unexpected runtime telemetry interruption occurred while rendering this module. Safe state preservation is active.
              </p>
            </div>

            {this.state.error && (
              <div className="w-full text-left bg-[#101012] border border-white/[0.06] rounded-xl p-3 font-mono text-[11px] text-red-300/90 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="btn-primary px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload View
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 font-semibold"
              >
                <Home className="w-3.5 h-3.5" />
                Full Refresh
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
