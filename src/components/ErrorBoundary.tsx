import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

// Initialize Sentry for React Frontend Client
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: 'https://mock-dsn-react@sentry.io/7654321',
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 1.0,
  });
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[React Error Boundary Captured]:', error, errorInfo);
    // Send React frontend exceptions directly to Sentry
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shadow-xl">
            <AlertOctagon className="h-8 w-8 animate-bounce" />
          </div>
          <div className="max-w-md space-y-2">
            <h1 className="text-xl font-extrabold tracking-tight">Something went wrong</h1>
            <p className="text-xs text-slate-400">
              An unexpected interface exception occurred. The incident stack trace has been captured and transmitted to Sentry error reporting.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-lg transition-all active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reload Application</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
