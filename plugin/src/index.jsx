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
    const el = document.createElement('div');
    el.style.cssText = 'color:#f06060;padding:12px;font-family:sans-serif;font-size:11px';
    el.textContent = 'RawBuddy failed to load: ' + (err && err.message);
    document.body.appendChild(el);
  }
}

if (document.body) {
  mount();
} else {
  document.addEventListener('DOMContentLoaded', mount);
}
