/* ── MessageRenderer ──
   Creates message DOM elements. Pure rendering — no state, no logic. */

import { esc } from '../../shared/escape.js';

export function createMessageRenderer() {
  function makeAIShell() {
    const div = document.createElement('div');
    div.className = 'msg ai';
    div.innerHTML = '<div class="msg-avatar"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div><div class="msg-content"><div class="msg-body"><div class="thinking"><span></span><span></span><span></span></div></div></div>';
    return div;
  }

  function makeUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'msg user';
    div.innerHTML = '<div class="msg-content"><div class="msg-body"><p>' + esc(text) + '</p></div></div>';
    return div;
  }

  function appendUser(text, container) {
    const el = makeUserMessage(text);
    container.appendChild(el);
    return el;
  }

  function appendAI(container) {
    const el = makeAIShell();
    container.appendChild(el);
    return el;
  }

  function createThinking() {
    const div = document.createElement('div');
    div.className = 'thinking';
    div.innerHTML = '<span></span><span></span><span></span>';
    return div;
  }

  function scrollBottom(container, smooth) {
    if (!container) return;
    if (smooth) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }

  return { makeAIShell, makeUserMessage, appendUser, appendAI, createThinking, scrollBottom };
}
