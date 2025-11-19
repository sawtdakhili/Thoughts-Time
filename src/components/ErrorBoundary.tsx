import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // In production, you could send this to an error reporting service
    // Example: Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="h-full flex items-center justify-center bg-background text-text-primary">
          <div className="max-w-md px-24 py-32 border border-border-subtle rounded-sm">
            <h1 className="text-xl font-serif mb-16">Something went wrong</h1>
            <p className="text-sm text-text-secondary mb-24 leading-relaxed">
              An unexpected error occurred. You can try refreshing the page or resetting the app state.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="mb-24">
                <summary className="text-sm font-mono cursor-pointer hover:text-text-primary">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-12 p-12 bg-hover-bg text-xs font-mono overflow-auto max-h-[200px] border border-border-subtle rounded-sm">
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-12">
              <button
                onClick={this.handleReset}
                className="px-16 py-8 text-sm font-mono border border-border-subtle rounded-sm hover:border-text-secondary transition-colors"
                aria-label="Try again"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-16 py-8 text-sm font-mono bg-text-primary text-background border border-text-primary rounded-sm hover:opacity-90 transition-opacity"
                aria-label="Reload page"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
