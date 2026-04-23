import React, { useState } from 'react';

function HistoryExplanation({ text }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 120;
  const displayText = (!expanded && isLong) ? text.slice(0, 117) + '…' : text;

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ fontSize: 11, color: '#bbb', lineHeight: 1.5 }}>{displayText}</div>
      {isLong && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setExpanded((v) => !v)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded((v) => !v); }}
          style={{ fontSize: 10, color: '#4aa0ff', cursor: 'pointer', marginTop: 2 }}
        >
          {expanded ? 'Show less' : 'Show more'}
        </div>
      )}
    </div>
  );
}

export default function EditHistory({ history }) {
  if (history.length === 0) {
    return (
      <div className="history-empty">
        No edits this session.
        <br />
        <span style={{ fontSize: 10, color: '#666' }}>History clears when the panel reloads.</span>
      </div>
    );
  }

  return (
    <div className="history-list">
      {[...history].reverse().map((item) => (
        <div key={item.id} className="history-item">
          <div className="command">"{item.command}"</div>
          <div className="meta">{formatTime(item.timestamp)}</div>
          {item.explanation && <HistoryExplanation text={item.explanation} />}
          {item.editSummary?.length > 0 && (
            <div className="tags">
              {item.editSummary.map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
