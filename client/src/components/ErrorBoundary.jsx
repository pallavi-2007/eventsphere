import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'sans-serif',
            background: '#f9f5ff',
            padding: '2rem',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ color: '#5b21b6', marginBottom: '0.5rem' }}>Something went wrong</h1>
          <p style={{ color: '#6b7280', maxWidth: 400, marginBottom: '1.5rem' }}>
            An unexpected error occurred. Please refresh the page. If the problem persists, try
            clearing your browser cache.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#7c3aed',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
          {this.state.error && (
            <details
              style={{
                marginTop: '1.5rem',
                color: '#9ca3af',
                fontSize: '0.8rem',
                maxWidth: 500,
                textAlign: 'left'
              }}
            >
              <summary style={{ cursor: 'pointer' }}>Error details</summary>
              <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
