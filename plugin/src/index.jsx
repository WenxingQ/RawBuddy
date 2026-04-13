import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

// UXP does not guarantee the HTML body is parsed before scripts run,
// so we create the container programmatically instead of finding #root.
function mount() {
  try {
    const container = document.createElement('div');
    container.setAttribute('id', 'root');
    document.body.appendChild(container);
    ReactDOM.render(<App />, container);
  } catch (err) {
    document.body.innerHTML =
      '<div style="color:#f06060;padding:12px;font-family:sans-serif;font-size:11px">' +
      '<b>RawBuddy failed to load:</b><br/>' + (err && err.message) +
      '</div>';
  }
}

if (document.body) {
  mount();
} else {
  document.addEventListener('DOMContentLoaded', mount);
}
