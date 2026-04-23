import React, { useState, useEffect, useRef } from 'react';
import CommandInput from './components/CommandInput';
import Critique from './components/Critique';
import EditHistory from './components/EditHistory';
import Settings from './components/Settings';
import ErrorBoundary from './components/ErrorBoundary';
import { getApiKey } from './services/claude';

const TABS = [
  { id: 'critique', label: 'Critique' },
  { id: 'edit', label: 'Edit' },
  { id: 'history', label: 'History' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('critique');
  const [showSettings, setShowSettings] = useState(false);
  const [history, setHistory] = useState([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [hasApiKey, setHasApiKey] = useState(() => !!getApiKey());

  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  function handleEditApplied(entry) {
    setHistory((prev) => [...prev, entry]);
    setUnseenCount((prev) => activeTabRef.current === 'history' ? prev : prev + 1);
  }

  function handleTabChange(tabId) {
    if (tabId === 'history') setUnseenCount(0);
    setShowSettings(false);
    setActiveTab(tabId);
  }

  function openSettings() {
    setShowSettings(true);
  }

  return (
    <ErrorBoundary>
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: '6px 12px', borderBottom: '1px solid #333', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {showSettings ? (
          <>
            <button
              onClick={() => setShowSettings(false)}
              style={{ background: 'none', border: 'none', color: '#4aa0ff', cursor: 'pointer', fontSize: 11, padding: 0, marginRight: 8 }}
            >
              ← Back
            </button>
            <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#ddd' }}>Settings</span>
          </>
        ) : (
          <>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#4aa0ff', letterSpacing: '-0.01em' }}>
              RawBuddy
            </span>
            <button
              onClick={openSettings}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 11, padding: '2px 4px', display: 'flex', alignItems: 'center', gap: 3 }}
            >
              <span style={{ fontSize: 12 }}>⚙</span>
              <span>Settings</span>
            </button>
          </>
        )}
      </div>

      {/* Tab Bar — hidden when settings is open */}
      {!showSettings && (
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
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 4,
                  background: '#4aa0ff',
                  borderRadius: 8,
                  minWidth: 14,
                  height: 14,
                  padding: '0 4px',
                  fontSize: 9,
                  color: '#fff',
                  fontWeight: 700,
                  verticalAlign: 'middle',
                  lineHeight: 1,
                }}>
                  {unseenCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      <div className="tab-content">
        {showSettings ? (
          <Settings
            onKeySaved={() => setHasApiKey(true)}
            onKeyCleared={() => setHasApiKey(false)}
          />
        ) : (
          <>
            {activeTab === 'edit' && (
              <CommandInput
                onEditApplied={handleEditApplied}
                hasApiKey={hasApiKey}
                onGoToSettings={openSettings}
              />
            )}
            {activeTab === 'critique' && (
              <Critique
                hasApiKey={hasApiKey}
                onGoToSettings={openSettings}
              />
            )}
            {activeTab === 'history' && <EditHistory history={history} />}
          </>
        )}
      </div>

    </div>
    </ErrorBoundary>
  );
}
