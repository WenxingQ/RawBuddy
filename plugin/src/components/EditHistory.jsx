import React from 'react';

/**
 * @param {{ history: Array<{id, command, explanation, timestamp, editSummary}> }} props
 */
export default function EditHistory({ history }) {
  if (history.length === 0) {
    return (
      <div className="history-empty">
        No edits applied yet in this session.
        <br />
        Go to the Edit tab and describe what you want to change.
      </div>
    );
  }

  return (
    <div className="history-list">
      {[...history].reverse().map((item) => (
        <div key={item.id} className="history-item">
          <div className="command">"{item.command}"</div>
          <div className="meta">{formatTime(item.timestamp)}</div>
          {item.explanation && (
            <div
              style={{
                fontSize: 10,
                color: '#aaa',
                marginTop: 4,
                lineHeight: 1.4,
                fontStyle: 'italic',
              }}
            >
              {item.explanation}
            </div>
          )}
          {item.editSummary.length > 0 && (
            <div className="tags">
              {item.editSummary.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
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
