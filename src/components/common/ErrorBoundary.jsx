import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log error to console or error-reporting services
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided as a prop, render it
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback({
            error: this.state.error,
            resetErrorBoundary: this.handleReset,
          });
        }
        return this.props.fallback;
      }

      return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center p-4 bg-light">
          <div
            className="crm-panel shadow-lg border border-danger-subtle bg-white text-dark p-4 p-md-5"
            style={{ maxWidth: '640px', width: '100%', borderRadius: '16px' }}
          >
            <div className="d-flex align-items-center gap-3 mb-4">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                }}
              >
                <AlertTriangle size={30} />
              </div>
              <div>
                <h4 className="fw-bold mb-1 text-danger">Something went wrong</h4>
                <p className="text-muted text-sm mb-0">
                  An unexpected error occurred in the application. You can try refreshing the page or returning to the dashboard.
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="p-3 rounded-3 bg-light border mb-4 font-mono text-xs text-secondary overflow-auto" style={{ maxHeight: '120px' }}>
              <span className="fw-bold text-danger">Error: </span>
              {this.state.error ? this.state.error.message || String(this.state.error) : 'Unknown runtime error'}
            </div>

            {/* Action Buttons */}
            <div className="d-flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                className="btn btn-primary d-inline-flex align-items-center gap-2 fw-semibold"
                onClick={this.handleReload}
              >
                <RefreshCw size={16} />
                Reload Application
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 fw-semibold"
                onClick={this.handleGoHome}
              >
                <Home size={16} />
                Back to Dashboard
              </button>

              <button
                type="button"
                className="btn btn-light border d-inline-flex align-items-center gap-2 text-muted fw-semibold"
                onClick={this.handleReset}
              >
                Try Again
              </button>
            </div>

            {/* Technical Details Toggle */}
            <div className="border-top pt-3 mt-4">
              <button
                type="button"
                className="btn btn-link btn-sm text-decoration-none p-0 text-muted d-inline-flex align-items-center gap-1"
                onClick={this.toggleDetails}
              >
                <span>{this.state.showDetails ? 'Hide Technical Details' : 'Show Technical Details'}</span>
                {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {this.state.showDetails && (
                <div className="mt-3 p-3 bg-dark text-light rounded-3 font-mono text-xs overflow-auto" style={{ maxHeight: '200px' }}>
                  <div className="text-danger fw-bold mb-1">
                    {this.state.error && this.state.error.stack ? this.state.error.stack : String(this.state.error)}
                  </div>
                  {this.state.errorInfo && (
                    <div className="text-secondary mt-2">
                      <div className="text-white-50 fw-bold">Component Stack:</div>
                      <pre className="m-0 text-white-50" style={{ whiteSpace: 'pre-wrap' }}>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

