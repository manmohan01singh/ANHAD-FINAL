import { esc } from '../../shared/escape.js';

export function createMessageRenderer() {
  function makeAIShell() {
    const div = document.createElement('div');
    div.className = 'msg ai';
    div.innerHTML = '<div class="msg-avatar"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div><div class="msg-content"><div class="msg-name">ANHAD</div><div class="msg-body"><div class="thinking"><span></span><span></span><span></span></div></div></div>';
    return div;
  }

  function makeUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'msg user';
    div.innerHTML = '<div class="msg-body"><p>' + esc(text) + '</p></div>';
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
