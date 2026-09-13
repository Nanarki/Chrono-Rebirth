import React, { useState, useEffect, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

export const ErrorBoundary: React.FC<Props> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Captured runtime error:', event.error);
      setHasError(true);
      setErrorMsg(event.message || 'An unexpected runtime error occurred.');
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('Captured unhandled promise:', event.reason);
      setHasError(true);
      setErrorMsg(event.reason?.message || 'An unhandled asynchronous error occurred.');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const handleReset = () => {
    setHasError(false);
    setErrorMsg(null);
    window.location.reload();
  };

  if (hasError) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-rose-500/40 bg-slate-900 p-6 shadow-2xl text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="font-['Cinzel'] text-xl font-bold text-slate-100">
            Temporal Anomaly Encountered
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            A runtime disturbance occurred while updating expedition state. Your progress is preserved.
          </p>
          {errorMsg && (
            <div className="text-[11px] text-rose-300 font-mono bg-rose-950/40 border border-rose-900/50 p-2.5 rounded-lg text-left overflow-x-auto max-h-32">
              {errorMsg}
            </div>
          )}
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3 text-sm font-bold text-slate-950 shadow-lg cursor-pointer transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Resume Expedition</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
