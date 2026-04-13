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

export default function CommandInput({ onEditApplied }) {
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

    let step = 'init';
    try {
      step = 'getDocumentContext';
      const docContext = getDocumentContext();

      step = 'sendEditCommand';
      const edits = await sendEditCommand(trimmed, docContext);

      step = 'applyEdits';
      await applyEdits(edits);

      step = 'done';
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
      const raw =
        (err && typeof err === 'object')
          ? (() => {
              const keys = Object.getOwnPropertyNames(err);
              const parts = keys.map((k) => {
                try { return k + ': ' + String(err[k]); } catch { return k + ': ?'; }
              });
              return parts.length ? parts.join(' | ') : String(err);
            })()
          : String(err);
      setError('[step:' + step + '] ' + raw);
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
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            'e.g. "The sky is blown out — recover highlights and add warmth"\n' +
            'or "Make this look moody and cinematic"\n\n' +
            'Press Ctrl+Enter to apply.'
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

      <div
        style={{ fontSize: 10, color: '#666', textAlign: 'right', marginTop: -4 }}
      >
        Ctrl+Enter to apply
      </div>
    </div>
  );
}
