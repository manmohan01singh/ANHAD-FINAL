/* ── StreamController ──
   Handles SSE stream parsing, token buffering, typewriter animation,
   and thinking state indicators. */

import { createTypewriter } from '../../../components/chat.js';

const THINKING_STATES = [
  'Understanding your question...',
  'Exploring Gurbani...',
  'Consulting Guru Sahib\'s wisdom...',
  'Going deeper into the teachings...',
  'Reflecting on the Shabad...',
  'Preparing the answer...',
];

const COMPLEX_QUERY_WORDS = ['why', 'how', 'explain', 'meaning', 'what is', 'what does', 'tell me about'];

export function createStreamController() {
  let typewriter = null;
  let fullText = '';
  let thinkCleared = false;
  let bodyEl = null;
  let thinkingInterval = null;
  let currentStateIdx = 0;

  function isComplexQuery(text) {
    const lower = (text || '').toLowerCase();
    return COMPLEX_QUERY_WORDS.some(function (w) { return lower.includes(w); });
  }

  function init(bodyElement, queryText) {
    bodyEl = bodyElement;
    typewriter = createTypewriter();
    fullText = '';
    thinkCleared = false;
    currentStateIdx = 0;
    thinkingInterval = null;

    if (isComplexQuery(queryText)) {
      showThinkingState();
    }
  }

  function showThinkingState() {
    if (!bodyEl || thinkCleared) return;
    const state = THINKING_STATES[currentStateIdx % THINKING_STATES.length];
    bodyEl.innerHTML = '<div class="thinking"><span></span><span></span><span></span><div class="thinking-text">' + state + '</div></div>';
    currentStateIdx++;
    thinkingInterval = setInterval(function () {
      if (thinkCleared) { clearInterval(thinkingInterval); return; }
      if (!bodyEl) { clearInterval(thinkingInterval); return; }
      const s = THINKING_STATES[currentStateIdx % THINKING_STATES.length];
      bodyEl.innerHTML = '<div class="thinking"><span></span><span></span><span></span><div class="thinking-text">' + s + '</div></div>';
      currentStateIdx++;
    }, 2000);
  }

  function clearThinking() {
    if (thinkingInterval) { clearInterval(thinkingInterval); thinkingInterval = null; }
    if (bodyEl && !thinkCleared) {
      const think = bodyEl.querySelector('.thinking');
      if (think) think.remove();
      typewriter.start(bodyEl);
      thinkCleared = true;
    }
  }

  function handleToken(token) {
    if (!thinkCleared) {
      window.dispatchEvent(new CustomEvent('gptGenerating'));
    }
    clearThinking();
    fullText += token;
    typewriter.push(token);
  }

  async function parseStream(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;
        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content || '';
          if (token) handleToken(token);
        } catch { }
      }
    }

    if (!thinkCleared) {
      const think = bodyEl ? bodyEl.querySelector('.thinking') : null;
      if (think) think.remove();
    }

    typewriter.finish();

    while (typewriter.isBusy && typewriter.isBusy()) {
      await new Promise(function (r) { setTimeout(r, 50); });
    }

    return fullText;
  }

  async function parseJsonResponse(response) {
    const data = await response.json();
    fullText = data.content || data.message || data.response || '';
    window.dispatchEvent(new CustomEvent('gptGenerating'));
    clearThinking();
    if (bodyEl) {
      typewriter.start(bodyEl);
      typewriter.push(fullText);
      typewriter.finish();
      while (typewriter.isBusy && typewriter.isBusy()) {
        await new Promise(function (r) { setTimeout(r, 50); });
      }
    }
    return fullText;
  }

  function abort() {
    if (typewriter) typewriter.abort();
  }

  function finish() {
    if (typewriter) typewriter.finish();
  }

  function getText() { return fullText; }

  return { init, handleToken, parseStream, parseJsonResponse, finish, abort, getText };
}
