import React, { useState, useEffect } from 'react';
import { getApiKey, saveApiKey, removeApiKey } from '../services/claude';

export default function Settings() {
  const [keyInput, setKeyInput] = useState('');
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [status, setStatus] = useState(null); // 'saved' | 'cleared' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    getApiKey().then((k) => {
      if (k) {
        setHasSavedKey(true);
        // Show masked placeholder — don't show the real key
        setKeyInput('');
      }
    });
  }, []);

  async function handleSave() {
    const trimmed = keyInput.trim();
    if (!trimmed) {
      setErrorMsg('Please enter an API key.');
      setStatus('error');
      return;
    }
    if (!trimmed.startsWith('sk-ant-')) {
      setErrorMsg('This does not look like an Anthropic API key (should start with sk-ant-).');
      setStatus('error');
      return;
    }
    try {
      await saveApiKey(trimmed);
      setHasSavedKey(true);
      setKeyInput('');
      setStatus('saved');
      setErrorMsg('');
    } catch (e) {
      setErrorMsg('Failed to save key: ' + e.message);
      setStatus('error');
    }
  }

  async function handleClear() {
    try {
      await removeApiKey();
    } catch {
      // localStorage.removeItem does not throw in UXP but guard defensively
    }
    setHasSavedKey(false);
    setKeyInput('');
    setStatus('cleared');
    setErrorMsg('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div className="section-title" style={{ marginBottom: 8 }}>Anthropic API Key</div>

        {hasSavedKey && (
          <div
            style={{
              background: 'rgba(92, 186, 106, 0.1)',
              border: '1px solid #5cba6a',
              borderRadius: 4,
              padding: '6px 9px',
              fontSize: 11,
              color: '#5cba6a',
              marginBottom: 8,
            }}
          >
            API key is saved.
          </div>
        )}

        <label className="settings-label">
          {hasSavedKey ? 'Replace API key' : 'Enter API key'}
        </label>
        <input
          className="settings-input"
          type="password"
          value={keyInput}
          onChange={(e) => {
            setKeyInput(e.target.value);
            setStatus(null);
            setErrorMsg('');
          }}
          placeholder="sk-ant-api03-..."
          autoComplete="off"
          spellCheck={false}
        />
        <div className="settings-hint" style={{ marginTop: 4 }}>
          Your key is stored in the plugin's local storage and is never sent anywhere except
          directly to api.anthropic.com.
        </div>

        {status === 'error' && (
          <div className="status-error" style={{ marginTop: 8 }}>
            {errorMsg}
          </div>
        )}
        {status === 'saved' && (
          <div className="status-saved" style={{ marginTop: 8 }}>
            Saved successfully.
          </div>
        )}
        {status === 'cleared' && (
          <div className="status-saved" style={{ marginTop: 8, color: '#999' }}>
            API key cleared.
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button className="btn-primary" onClick={handleSave}>
            Save Key
          </button>
          {hasSavedKey && (
            <button
              className="btn-primary"
              onClick={handleClear}
              style={{ background: '#555', flex: '0 0 auto', width: 'auto', padding: '7px 12px' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #333' }} />

      <div>
        <div className="section-title" style={{ marginBottom: 6 }}>About</div>
        <p className="settings-hint" style={{ lineHeight: 1.6 }}>
          RawBuddy translates natural language into Camera Raw and Photoshop adjustments using
          Claude AI. All edits are non-destructive and competition-safe — no generative AI features
          are ever applied.
        </p>
        <p className="settings-hint" style={{ marginTop: 6, lineHeight: 1.6 }}>
          Get an API key at console.anthropic.com
        </p>
      </div>
    </div>
  );
}
