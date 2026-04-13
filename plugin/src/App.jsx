import React, { useState } from 'react';
import CommandInput from './components/CommandInput';
import EditHistory from './components/EditHistory';
import Settings from './components/Settings';
import ErrorBoundary from './components/ErrorBoundary';

const TABS = [
  { id: 'edit', label: 'Edit' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('edit');
  const [history, setHistory] = useState([]);

  function handleEditApplied(entry) {
    setHistory((prev) => [...prev, entry]);
  }

  return (
    <ErrorBoundary>
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          padding: '8px 12px 6px',
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: '#4aa0ff', letterSpacing: '-0.01em' }}>
          RawBuddy
        </span>
        {history.length > 0 && (
          <span
            style={{
              fontSize: 10,
              color: '#666',
              background: '#2a2a2a',
              borderRadius: 8,
              padding: '1px 6px',
            }}
          >
            {history.length} edit{history.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Tab Bar */}
      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'edit' && <CommandInput onEditApplied={handleEditApplied} />}
        {activeTab === 'history' && <EditHistory history={history} />}
        {activeTab === 'settings' && <Settings />}
      </div>
    </div>
    </ErrorBoundary>
  );
}
