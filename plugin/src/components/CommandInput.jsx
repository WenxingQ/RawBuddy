import React, { useState } from 'react';
import { sendEditCommand } from '../services/claude';
import { getDocumentContext, applyEdits } from '../services/photoshop';

/**
 * Build a short list of tag strings from Claude's edit response,
 * e.g. ["exposure +0.5", "highlights -30", "hue/sat layer"]
 */
function buildEditSummary(edits) {
  const tags = [];
  if (edits.camera_raw) {
    for (const [key, value] of Object.entries(edits.camera_raw)) {
      const sign = value > 0 ? '+' : '';
      tags.push(`${key.replace(/_/g, ' ')} ${sign}${value}`);
    }
  }
  if (edits.photoshop) {
    const psKeys = Object.keys(edits.photoshop);
    if (psKeys.length > 0) {
      // Group PS adjustments into layer types
      const hasHueSat = ['hue', 'saturation_ps', 'lightness'].some((k) => k in edits.photoshop);
      const hasBrightness = ['brightness', 'contrast_ps'].some((k) => k in edits.photoshop);
      if (hasHueSat) tags.push('hue/sat layer');
      if (hasBrightness) tags.push('brightness/contrast layer');
    }
  }
  return tags;
}

export default function CommandInput({ onEditApplied, hasApiKey, onGoToSettings }) {
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastExplanation, setLastExplanation] = useState(null);

  async function handleSubmit() {
    const trimmed = command.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setLastExplanation(null);

    try {
      const docContext = getDocumentContext();
      const edits = await sendEditCommand(trimmed, docContext);
      await applyEdits(edits);

      setLastExplanation(edits.explanation);
      setCommand('');

      if (onEditApplied) {
        onEditApplied({
          id: Date.now(),
          command: trimmed,
          explanation: edits.explanation,
          timestamp: new Date(),
          editSummary: buildEditSummary(edits),
        });
      }
    } catch (err) {
      const msg = (err && err.message) ? err.message : 'An unexpected error occurred.';
      setError(msg);
      console.error('[RawBuddy] handleSubmit error:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    // Cmd/Ctrl+Enter to submit
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* API key setup prompt — shown only when key is confirmed missing */}
      {hasApiKey === false && (
        <div style={{
          background: 'rgba(74, 160, 255, 0.08)',
          border: '1px solid rgba(74, 160, 255, 0.4)',
          borderRadius: 4,
          padding: '8px 10px',
          fontSize: 11,
          color: '#ddd',
          lineHeight: 1.5,
        }}>
          To get started, add your Anthropic API key in{' '}
          <button
            onClick={onGoToSettings}
            style={{
              background: 'none',
              border: 'none',
              color: '#4aa0ff',
              cursor: 'pointer',
              fontSize: 11,
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            Settings
          </button>
          .
        </div>
      )}

      <div>
        <div className="section-title" style={{ marginBottom: 6 }}>
          What would you like to adjust?
        </div>
        <textarea
          className="command-textarea"
          value={command}
          onChange={(e) => {
            setCommand(e.target.value);
            setError(null);
            setLastExplanation(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            'e.g. "Recover blown-out sky and add warmth"\n' +
            '"Make the shadows warmer and lift the blacks"'
          }
          disabled={loading}
        />
      </div>

      <button className="btn-primary" onClick={handleSubmit} disabled={loading || !command.trim()}>
        {loading ? (
          <>
            <span className="spinner" />
            Applying...
          </>
        ) : (
          'Apply Edit'
        )}
      </button>

      {error && <div className="status-error">{error}</div>}

      {lastExplanation && !error && (
        <div className="explanation-box">
          <div className="label">Claude applied</div>
          {lastExplanation}
        </div>
      )}

      <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'right' }}>
        {navigator.platform?.startsWith('Mac') ? '⌘' : 'Ctrl'}+Enter to apply
      </div>
    </div>
  );
}
