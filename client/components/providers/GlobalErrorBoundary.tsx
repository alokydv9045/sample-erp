'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full glass premium-shadow rounded-[2.5rem] p-10 text-center space-y-8 border-none ring-1 ring-primary/10">
            <div className="mx-auto w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center animate-pulse">
              <AlertTriangle className="h-10 w-10 text-rose-500" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">System Error</h1>
              <p className="text-muted-foreground font-medium">
                We've encountered a deep system error. Our team has been notified.
              </p>
              <div className="p-3 bg-muted/50 rounded-xl text-xs font-mono text-left overflow-auto max-h-32 text-muted-foreground">
                {this.state.error?.message}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => window.location.reload()} 
                className="premium-gradient font-black h-12 rounded-2xl shadow-lg shadow-primary/20 gap-2"
              >
                <RefreshCw className="h-4 w-4" /> RESTART APPLICATION
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'} 
                className="glass font-black h-12 rounded-2xl gap-2"
              >
                <Home className="h-4 w-4" /> BACK TO HOME
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
