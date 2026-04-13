import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 12, color: '#f06060', fontSize: 11, fontFamily: 'sans-serif', lineHeight: 1.5 }}>
          <b>RawBuddy error:</b>
          <br />
          {this.state.error.message}
          <br /><br />
          <span style={{ color: '#999' }}>Check the UXP Developer Tool console for details.</span>
        </div>
      );
    }
    return this.props.children;
  }
}
