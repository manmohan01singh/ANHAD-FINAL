/* ── StreamController ──
   Handles SSE stream parsing, token buffering, and typewriter animation.
   Separates streaming logic from UI and state. */

import { createTypewriter } from '../../components/chat.js';

export function createStreamController() {
  let typewriter = null;
  let fullText = '';
  let thinkCleared = false;
  let bodyEl = null;

  function init(bodyElement) {
    bodyEl = bodyElement;
    typewriter = createTypewriter();
    fullText = '';
    thinkCleared = false;
  }

  function clearThinking() {
    if (bodyEl && !thinkCleared) {
      const think = bodyEl.querySelector('.thinking');
      if (think) think.remove();
      typewriter.start(bodyEl);
      thinkCleared = true;
    }
  }

  function handleToken(token) {
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
        } catch {}
      }
    }

    if (!thinkCleared) {
      const think = bodyEl ? bodyEl.querySelector('.thinking') : null;
      if (think) think.remove();
    }

    typewriter.finish();
    return fullText;
  }

  async function parseJsonResponse(response) {
    const data = await response.json();
    fullText = data.content || data.message || data.response || '';
    const think = bodyEl ? bodyEl.querySelector('.thinking') : null;
    if (think) think.remove();
    if (bodyEl) {
      typewriter.start(bodyEl);
      typewriter.push(fullText);
      await new Promise(function(r) { setTimeout(r, 30); });
    }
    typewriter.finish();
    return fullText;
  }

  function abort() {
    if (typewriter) typewriter.abort();
  }

  function getText() { return fullText; }

  return { init, handleToken, parseStream, parseJsonResponse, abort, getText };
}
