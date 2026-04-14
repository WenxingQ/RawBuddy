import React, { useState, useEffect } from 'react';
import CommandInput from './components/CommandInput';
import EditHistory from './components/EditHistory';
import Settings from './components/Settings';
import ErrorBoundary from './components/ErrorBoundary';
import { getApiKey } from './services/claude';

const TABS = [
  { id: 'edit', label: 'Edit' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('edit');
  const [history, setHistory] = useState([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [hasApiKey, setHasApiKey] = useState(null); // null = loading, false = missing, true = present

  useEffect(() => {
    getApiKey().then((k) => setHasApiKey(!!k));
  }, []);

  function handleEditApplied(entry) {
    setHistory((prev) => [...prev, entry]);
    // activeTab is captured from closure — if tab changes mid-flight the count
    // may be off by one, which is an acceptable approximation.
    setUnseenCount((prev) => activeTab === 'history' ? prev : prev + 1);
  }

  function handleTabChange(tabId) {
    if (tabId === 'history') setUnseenCount(0);
    if (tabId === 'edit') getApiKey().then((k) => setHasApiKey(!!k));
    setActiveTab(tabId);
  }

  return (
    <ErrorBoundary>
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          padding: '8px 12px 6px',
          borderBottom: '1px solid #333',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: '#4aa0ff', letterSpacing: '-0.01em' }}>
          RawBuddy
        </span>
      </div>

      {/* Tab Bar */}
      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
            {tab.id === 'history' && unseenCount > 0 && (
              <span style={{
                display: 'inline-block',
                marginLeft: 5,
                background: '#4aa0ff',
                borderRadius: 8,
                padding: '0 4px',
                fontSize: 9,
                color: '#fff',
                lineHeight: '14px',
                verticalAlign: 'middle',
                fontWeight: 700,
              }}>
                {unseenCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'edit' && (
          <CommandInput
            onEditApplied={handleEditApplied}
            hasApiKey={hasApiKey}
            onGoToSettings={() => handleTabChange('settings')}
          />
        )}
        {activeTab === 'history' && <EditHistory history={history} />}
        {activeTab === 'settings' && (
          <Settings
            onKeySaved={() => setHasApiKey(true)}
            onKeyCleared={() => setHasApiKey(false)}
          />
        )}
      </div>
    </div>
    </ErrorBoundary>
  );
}
