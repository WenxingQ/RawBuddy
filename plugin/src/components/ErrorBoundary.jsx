import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[RawBuddy] Render error:', error, info.componentStack);
  }

  handleReset() {
    this.setState({ error: null });
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          fontFamily: "'Adobe Clean', -apple-system, sans-serif",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#f06060' }}>
            Something went wrong
          </div>
          <div style={{
            background: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: 4,
            padding: '7px 9px',
            fontSize: 10,
            color: '#999',
            lineHeight: 1.5,
            wordBreak: 'break-word',
          }}>
            {this.state.error.message || String(this.state.error)}
          </div>
          <button
            onClick={this.handleReset}
            style={{
              width: '100%',
              padding: '7px 12px',
              background: '#4aa0ff',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              fontFamily: "'Adobe Clean', -apple-system, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
          <div style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>
            If this keeps happening, reload the plugin in UXP Developer Tool.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
