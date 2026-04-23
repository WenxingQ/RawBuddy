import React, { useState } from 'react';
import { sendCritiqueRequest } from '../services/claude';
import { getDocumentContext, captureDocumentImage } from '../services/photoshop';
import AnimatedDots from './AnimatedDots';

const COLOR_SCORE_HIGH = '#5cba6a';
const COLOR_SCORE_MID  = '#f5a623';
const COLOR_SCORE_LOW  = '#f06060';

function scoreColor(score) {
  if (score >= 8) return COLOR_SCORE_HIGH;
  if (score >= 5) return COLOR_SCORE_MID;
  return COLOR_SCORE_LOW;
}

// ── Criterion detail drill-down ────────────────────────────
function CriterionDetail({ item, onBack }) {
  const isSummary = item.type === 'summary';
  const improvements = !isSummary && Array.isArray(item.improvements) && item.improvements.length > 0
    ? item.improvements
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Back bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div
          role="button"
          tabIndex={0}
          onClick={onBack}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onBack(); }}
          style={{
            color: '#4aa0ff',
            cursor: 'pointer',
            fontSize: 11,
            padding: '6px 8px',
            lineHeight: 1,
            flexShrink: 0,
            minHeight: 28,
            display: 'flex',
            alignItems: 'center',
            marginLeft: -8,
          }}
        >
          ← Back
        </div>
        <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#e0e0e0' }}>{item.name}</span>
        {!isSummary && (
          <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(item.score), flexShrink: 0 }}>
            {Number(item.score).toFixed(1)}
          </span>
        )}
      </div>

      {/* Mini score bar */}
      {!isSummary && (
        <div style={{ height: 4, background: '#333', borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ width: `${Number(item.score) * 10}%`, height: '100%', background: scoreColor(item.score), borderRadius: 2 }} />
        </div>
      )}

      <div style={{ borderTop: '1px solid #444', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isSummary ? (
          <div style={{ fontSize: 11, color: '#e0e0e0', lineHeight: 1.6 }}>{item.text}</div>
        ) : (
          <>
            {item.reason ? (
              <div>
                <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Scoring Reason
                </div>
                <div style={{ fontSize: 11, color: '#e0e0e0', lineHeight: 1.6 }}>{item.reason}</div>
              </div>
            ) : null}

            {improvements && (
              <div>
                <div style={{
                  fontSize: 10,
                  color: '#999',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                  paddingTop: 8,
                  borderTop: '1px solid #333',
                }}>
                  What to Improve
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {improvements.map((imp, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8 }}>
                      <span style={{
                        flexShrink: 0,
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: '#4aa0ff',
                        marginTop: 5,
                      }} />
                      <span style={{ fontSize: 11, color: '#e0e0e0', lineHeight: 1.5 }}>{imp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────
export default function Critique({ hasApiKey, onGoToSettings }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [detail, setDetail] = useState(null);

  async function handleCritique() {
    if (loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setDetail(null);
    try {
      const docContext = getDocumentContext();
      const imageBase64 = await captureDocumentImage();
      setResult(await sendCritiqueRequest(docContext, imageBase64));
    } catch (err) {
      const msg = (err && err.message) || '';
      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        setError('API key rejected. Check your key in Settings.');
      } else if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) {
        setError('Rate limit reached. Wait a moment and try again.');
      } else if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network')) {
        setError('Network error — check your internet connection.');
      } else {
        setError(msg || 'Critique failed. Please try again.');
      }
      console.error('[RawBuddy] critique error:', err);
    } finally {
      setLoading(false);
    }
  }

  // ── Criterion / summary detail view ───────────────────
  if (detail) {
    return (
      <CriterionDetail item={detail} onBack={() => setDetail(null)} />
    );
  }

  // ── List view ──────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {hasApiKey === false && (
        <div style={{
          background: 'rgba(74,160,255,0.08)',
          border: '1px solid rgba(74,160,255,0.4)',
          borderRadius: 4,
          padding: '7px 10px',
          fontSize: 11,
          color: '#e0e0e0',
          lineHeight: 1.5,
        }}>
          Add your Anthropic API key in{' '}
          <button
            onClick={onGoToSettings}
            style={{ background: 'none', border: 'none', color: '#4aa0ff', cursor: 'pointer', fontSize: 11, padding: 0, textDecoration: 'underline' }}
          >
            Settings
          </button>.
        </div>
      )}

      <button className="btn-primary" onClick={handleCritique} disabled={loading}>
        {loading
          ? (<>Analysing photo<AnimatedDots /></>)
          : result ? 'Re-critique' : 'Critique Photo'
        }
      </button>

      {!result && !loading && (
        <div style={{ fontSize: 11, color: '#b8b8b8', lineHeight: 1.5 }}>
          Scores your photo across five PSA judging criteria — composition, subject, technical quality, impact, and colour.
        </div>
      )}

      {error && <div className="status-error">{error}</div>}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Score card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 32,
            paddingLeft: 10,
            borderLeft: '3px solid ' + scoreColor(result.overall_score ?? 0),
            marginBottom: 6,
            flexShrink: 0,
          }}>
            <span style={{
              fontSize: 20,
              fontWeight: 700,
              lineHeight: 1,
              color: scoreColor(result.overall_score),
              flexShrink: 0,
              letterSpacing: '-0.02em',
            }}>
              {result.overall_score != null ? Number(result.overall_score).toFixed(1) : '—'}
            </span>
            <span style={{ fontSize: 10, color: '#999', lineHeight: 1, flexShrink: 0 }}>/10</span>
            <span style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
              Overall
            </span>
          </div>

          {/* Criterion rows */}
          {Array.isArray(result.criteria) && result.criteria.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {result.criteria.map((c, idx) => {
                const score = Number(c.score);
                const color = scoreColor(score);
                const isLast = idx === result.criteria.length - 1;
                return (
                  <div
                    key={idx}
                    style={{ borderBottom: isLast ? 'none' : '1px solid #444' }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setDetail({ ...c, type: 'criterion', score, reason: c.reason || c.comment || '' })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setDetail({ ...c, type: 'criterion', score, reason: c.reason || c.comment || '' });
                        }
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 4px',
                        cursor: 'pointer',
                        borderRadius: 3,
                      }}
                    >
                      <span style={{
                        flex: 1,
                        fontSize: 11,
                        color: '#e0e0e0',
                        fontWeight: 500,
                        lineHeight: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {c.name}
                      </span>
                      <div style={{
                        flexShrink: 0,
                        width: 48,
                        height: 5,
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: 3,
                        overflow: 'hidden',
                      }}>
                        <div style={{ width: `${score * 10}%`, height: '100%', background: color, borderRadius: 3 }} />
                      </div>
                      <span style={{
                        flexShrink: 0,
                        width: 26,
                        fontSize: 13,
                        fontWeight: 700,
                        color,
                        lineHeight: 1,
                        textAlign: 'right',
                        letterSpacing: '-0.01em',
                      }}>
                        {score.toFixed(1)}
                      </span>
                      <span style={{ flexShrink: 0, fontSize: 11, color: '#999', lineHeight: 1 }}>›</span>
                    </div>
                  </div>
                );
              })}

              {/* Overall summary link */}
              {result.overall_summary && (
                <div style={{ marginTop: 4, paddingTop: 6, borderTop: '1px solid #444' }}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setDetail({ type: 'summary', name: 'Overall Summary', text: result.overall_summary })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setDetail({ type: 'summary', name: 'Overall Summary', text: result.overall_summary });
                      }
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      height: 24,
                      cursor: 'pointer',
                      borderRadius: 3,
                      padding: '0 4px',
                    }}
                  >
                    <span style={{ flex: 1, fontSize: 11, color: '#b8b8b8', lineHeight: 1 }}>
                      Overall summary
                    </span>
                    <span style={{ fontSize: 13, color: '#4aa0ff', flexShrink: 0, lineHeight: 1 }}>›</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
