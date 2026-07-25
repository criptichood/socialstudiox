import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  props?: any;
  children?: ReactNode;
  fallbackTitle?: string;
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
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 md:p-10 my-4 bg-slate-900 border border-rose-500/30 rounded-3xl text-left space-y-4 shadow-2xl max-w-3xl mx-auto animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display">
                {this.props.fallbackTitle || 'Section Display Interrupted'}
              </h3>
              <p className="text-xs text-slate-400">
                An unexpected component error occurred in this section, but the rest of your application is safe.
              </p>
            </div>
          </div>

          {this.state.error && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-mono text-rose-300/90 overflow-x-auto max-h-40 leading-relaxed">
              <p className="font-bold text-rose-400 mb-1">{this.state.error.toString()}</p>
              {this.state.errorInfo && (
                <p className="text-[10px] text-slate-500 whitespace-pre-wrap mt-2">
                  {this.state.errorInfo.componentStack}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Rendering</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-slate-700"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Reload Studio</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
