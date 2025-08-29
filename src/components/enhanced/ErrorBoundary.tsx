import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      return (
        <Card className="p-6 m-4 border-destructive/50">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <h3 className="text-lg font-semibold text-destructive">Något gick fel</h3>
          </div>
          
          <p className="text-muted-foreground mb-4">
            Ett oväntat fel uppstod. Försök ladda om sidan eller kontakta support om problemet kvarstår.
          </p>
          
          {this.state.error && (
            <details className="mb-4">
              <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                Teknisk information
              </summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                {this.state.error.message}
              </pre>
            </details>
          )}
          
          <Button onClick={this.retry} variant="outline" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Försök igen
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
}

export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>
) => {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
};