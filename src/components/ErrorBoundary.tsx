import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Download, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('Captivox ErrorBoundary caught an unhandled exception:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleRescueDownload = () => {
    try {
      // Find latest project in localStorage
      let foundData = null;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('captivox_project_')) {
          foundData = localStorage.getItem(key);
          break;
        }
      }

      if (foundData) {
        const blob = new Blob([foundData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `captivox_rescue_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert('No local project data found in storage.');
      }
    } catch (e) {
      alert('Failed to export emergency backup: ' + e);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0d0d11] text-white flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#16161c] border border-red-500/30 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/40">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">CAPTIVOX Recovery Engine</h2>
                <p className="text-xs text-neutral-400">An unexpected runtime exception was isolated.</p>
              </div>
            </div>

            <div className="p-3 bg-black/60 rounded-xl border border-neutral-800 text-xs font-mono text-red-300 mb-5 overflow-auto max-h-36">
              {this.state.error?.toString() || 'Unknown error occurred'}
            </div>

            <p className="text-xs text-neutral-300 mb-5">
              Your edits are protected by CAPTIVOX's 3-second auto-save and version history.
              You can reload safely or download the emergency project backup below.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#ff3d5a] hover:bg-[#e0334e] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Editor</span>
              </button>

              <button
                onClick={this.handleRescueDownload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors border border-neutral-700"
              >
                <Download className="w-4 h-4" />
                <span>Emergency Backup</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
