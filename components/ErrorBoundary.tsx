import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 text-center">
          <div className="max-w-md">
            <div className="text-6xl mb-6">🐕</div>
            <h1 className="display-font text-3xl text-[#E74C3C] mb-4">
              A Disturbance in the Oblivion
            </h1>
            <p className="text-white/70 mb-2 text-lg">
              Yefris encountered an unexpected anomaly.
            </p>
            <p className="text-white/40 text-sm mb-8 italic">
              Even the most oblivious must face errors sometimes.
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-3 bg-[#E74C3C]/20 hover:bg-[#E74C3C]/40 border border-[#E74C3C] text-[#E74C3C] font-bold rounded-lg uppercase tracking-wider transition-all hover:scale-105"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 text-white/70 font-bold rounded-lg uppercase tracking-wider transition-all"
              >
                Reload Page
              </button>
            </div>

            {this.state.error && (
              <details className="mt-8 text-left">
                <summary className="text-white/30 text-xs cursor-pointer hover:text-white/50 uppercase tracking-widest">
                  Technical Details
                </summary>
                <pre className="mt-2 text-[10px] text-red-400/60 bg-black/40 p-3 rounded overflow-x-auto border border-white/5">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
