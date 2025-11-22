import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  paneName: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for individual panes.
 * Allows one pane to crash without affecting the other.
 */
class PaneErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.paneName}:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center p-24">
          <div className="text-center max-w-sm">
            <p className="text-lg font-serif mb-12 text-text-primary">
              Error in {this.props.paneName}
            </p>
            <p className="text-sm text-text-secondary mb-16">
              Something went wrong in this pane. The other pane should still work.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <p className="text-xs font-mono text-text-secondary mb-16 break-all">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleReset}
              className="px-16 py-8 text-sm font-mono border border-border-subtle rounded-sm hover:border-text-secondary transition-colors"
              aria-label={`Retry ${this.props.paneName}`}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PaneErrorBoundary;
