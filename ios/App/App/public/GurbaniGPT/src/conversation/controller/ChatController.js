/* ── ChatController ──
   The only module chat.js talks to for conversation management.
   Under 300 lines. Delegates everything. */

import { createConversationStore } from '../state/ConversationStore.js';
import { createHistoryManager } from '../state/HistoryManager.js';
import { createMessageRenderer } from '../rendering/MessageRenderer.js';
import { createGurbaniRenderer } from '../rendering/GurbaniRenderer.js';
import { createStreamController } from '../streaming/StreamController.js';
import { createWelcomeController } from '../WelcomeController.js';
import { getPipelineEngine } from '../../PipelineEngine.js';
import { V } from '../../shared/validators.js';
import { renderMd } from '../../shared/markdown.js';

let toastFn = null;

export function setToast(fn) { toastFn = fn; }

export function createChatController() {
  const store = createConversationStore();
  const historyManager = createHistoryManager();
  const renderer = createMessageRenderer();
  const gurbaniRenderer = createGurbaniRenderer();
  const streamer = createStreamController();
  const welcomeCtrl = createWelcomeController();

  const msgList = document.getElementById('msgList');
  const welcomeEl = document.getElementById('welcome');
  const msgs = document.getElementById('msgs');
  const inp = document.getElementById('inp');
  const sendBtn = document.getElementById('sendBtn');
  const stopBtn = document.getElementById('stopBtn');

  function toast(msg) { if (toastFn) toastFn(msg); }

  /* ── Load history ── */
  function init() {
    const history = historyManager.loadHistory();
    store.setHistory(history);
    if (history.length > 0) {
      renderAllMessages();
      showConvo();
    } else {
      showWelcome();
    }
    setupEventListeners();
  }

  /* ── Render all messages from history ── */
  function renderAllMessages() {
    msgList.innerHTML = '';
    const history = store.getHistory();
    for (const msg of history) {
      if (msg.role === 'user') {
        renderer.appendUser(msg.content, msgList);
      } else {
        const msgEl = renderer.appendAI(msgList);
        const bodyEl = msgEl.querySelector('.msg-body');
        if (bodyEl) {
          bodyEl.innerHTML = renderMd(msg.content);
        }
        if (msg.gurbaniBlock) {
          const contentEl = msgEl.querySelector('.msg-content');
          if (contentEl) {
            gurbaniRenderer.injectCard(contentEl, msg.gurbaniBlock.html);
          }
        }
      }
    }
  }

  /* ── Show/hide welcome ── */
  function showConvo() {
    if (msgs) msgs.style.display = 'block';
    if (welcomeEl) welcomeEl.style.display = 'none';
  }

  function showWelcome() {
    if (msgs) msgs.style.display = 'none';
    if (welcomeEl) welcomeEl.style.display = 'block';
    loadWelcomeVerse();
  }

  async function loadWelcomeVerse() {
    const pipeline = getPipelineEngine();
    const cached = welcomeCtrl.getCachedVerse();
    if (cached) {
      const cardEl = document.getElementById('welcomeCard');
      if (cardEl && cached.unicode) {
        cardEl.innerHTML = '<div class="gurbani-block"><div class="gurbani-block-inner"><div class="gb-verse">' + cached.unicode + '</div><div class="gb-translation">' + cached.english + '</div><div class="gb-source">' + (cached.source || 'Guru Granth Sahib') + '</div></div></div>';
      }
      return;
    }
    try {
      const result = await pipeline.memory.conversation.getLastUserMessage();
      // Fetch a random verse for welcome
      const gurbani = pipeline.memory && pipeline.memory.preferences ? null : null;
      // Use rag to get a random verse
      const { initRAG } = await import('../../../components/rag.js');
      const rag = initRAG();
      const searchResult = await rag.search('hukam');
      if (searchResult && searchResult.verses && searchResult.verses.length > 0) {
        const verse = searchResult.verses[Math.floor(Math.random() * searchResult.verses.length)];
        welcomeCtrl.cacheVerse(verse);
        const cardEl = document.getElementById('welcomeCard');
        if (cardEl && verse.unicode) {
          cardEl.innerHTML = '<div class="gurbani-block"><div class="gurbani-block-inner"><div class="gb-verse">' + verse.unicode + '</div><div class="gb-translation">' + verse.english + '</div><div class="gb-source">Ang ' + (verse.pageNo || '') + '</div></div></div>';
        }
      }
    } catch { }
  }

  /* ── Background summary generation ── */
  async function generateSummary(pipeline, summary, history) {
    try {
      const userMessages = history.filter(function (m) { return m.role === 'user'; }).slice(-10);
      const assistantMessages = history.filter(function (m) { return m.role === 'assistant'; }).slice(-10);
      const summaryPrompt = 'Summarize this conversation in 2-3 sentences. Focus on the user\'s emotional state, questions asked, and Shabads shared. Be concise:\n\n';
      for (let i = 0; i < Math.min(userMessages.length, assistantMessages.length); i++) {
        summaryPrompt += 'User: ' + (userMessages[i] ? userMessages[i].content : '') + '\n';
        summaryPrompt += 'ANHAD: ' + (assistantMessages[i] ? assistantMessages[i].content.slice(0, 200) : '') + '\n';
      }
      const res = await fetch('/api/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [{ role: 'user', content: summaryPrompt }],
          temperature: 0.3,
          max_tokens: 200,
        }),
      });
      const data = await res.json();
      const summaryText = data.choices?.[0]?.message?.content || data.content || '';
      if (summaryText) summary.storeSummary(summaryText);
    } catch { }
  }

  /* ── Send message ── */
  async function send(text) {
    if (!V.notEmpty(text)) { toast('Type something first'); return; }
    if (!V.notTooLong(text)) { toast('Max 2000 chars'); return; }
    if (!V.notDuplicate(text, store.getHistory())) { toast('Already sent'); return; }
    if (!V.isOnline()) { toast('No internet'); return; }
    if (store.isStreaming()) { toast('Wait for reply'); return; }
    if (!V.isSafe(text)) { toast('Please rephrase'); return; }
    if (!V.noAbuse(text)) { toast('Please type normally'); return; }

    text = text.trim();
    inp.value = '';
    updateInputState();

    showConvo();
    renderer.appendUser(text, msgList);
    store.pushHistory({ role: 'user', content: text });
    historyManager.saveHistory(store.getHistory());

    store.setStreaming(true);
    setStreamUI(true);

    const msgEl = renderer.appendAI(msgList);
    store.setCurrentMsgEl(msgEl);
    store.resetResponse();

    const bodyEl = msgEl.querySelector('.msg-body');
    streamer.init(bodyEl, text);
    renderer.scrollBottom(msgs, true);

    const abortCtrl = new AbortController();
    store.setAbortCtrl(abortCtrl);

    window.dispatchEvent(new CustomEvent('gptProcessing'));
    let hasStartedGenerating = false;
    const thinkingTimer = setTimeout(function () {
      if (store.isStreaming() && !hasStartedGenerating) {
        window.dispatchEvent(new CustomEvent('gptThinking'));
      }
    }, 1500);

    const onGenerating = function () {
      hasStartedGenerating = true;
      clearTimeout(thinkingTimer);
    };
    window.addEventListener('gptGenerating', onGenerating, { once: true });

    try {
      /* Run pipeline */
      const pipeline = getPipelineEngine();
      const result = await pipeline.run(text, store.getHistory());
      pipeline.debugPanel.render(result.trace);

      /* Call LLM */
      const response = await pipeline.callLLM(store.getHistory(), result.prompt, abortCtrl.signal);
      const contentType = response.headers.get('content-type') || '';
      let fullText = '';

      if (contentType.includes('stream') || response.body) {
        fullText = await streamer.parseStream(response);
      } else {
        fullText = await streamer.parseJsonResponse(response);
      }

      streamer.finish();

      if (fullText) {
        const displayFull = fullText.replace(/<!--GB-->/g, '').trim();
        store.pushHistory({ role: 'assistant', content: displayFull, gurbaniBlock: result.gurbaniBlock });
        historyManager.saveHistory(store.getHistory());

        /* Inject Gurbani card if present */
        if (result.gurbaniBlock) {
          const contentEl = msgEl.querySelector('.msg-content');
          if (contentEl) {
            gurbaniRenderer.injectCard(contentEl, result.gurbaniBlock.html);
          }
          /* Add reading history entry */
          if (result.pipelineResult && result.pipelineResult.primary) {
            historyManager.addReadingEntry(result.pipelineResult.primary);
          }
        }

        /* Trigger memory summary generation if due */
        const summary = pipeline.memory.summary;
        if (summary.shouldSummarize(store.getHistory().filter(function (m) { return m.role === 'user'; }).length)) {
          summary.markSummarizing();
          generateSummary(pipeline, summary, store.getHistory());
        }
      }
      window.dispatchEvent(new CustomEvent('gptDone'));
    } catch (err) {
      streamer.abort();
      if (err.name === 'AbortError') {
        if (!store.getFullResponse()) {
          const body = msgEl.querySelector('.msg-body');
          if (body) body.innerHTML = '<em style="color:var(--text-muted)">Stopped.</em>';
        }
      } else {
        const body = msgEl.querySelector('.msg-body');
        if (body) body.innerHTML = '<div class="err-bbl">\u26A0\uFE0F ' + (err.message || 'Something went wrong.') + '</div>';
      }
      window.dispatchEvent(new CustomEvent('gptError'));
    } finally {
      clearTimeout(thinkingTimer);
      window.removeEventListener('gptGenerating', onGenerating);
    }

    store.setStreaming(false);
    store.setAbortCtrl(null);
    setStreamUI(false);
    renderer.scrollBottom(msgs, true);
    updateInputState();
    inp.focus();
  }

  function stop() {
    const ctrl = store.getAbortCtrl();
    if (ctrl) { ctrl.abort(); store.setStreaming(false); setStreamUI(false); }
    window.dispatchEvent(new CustomEvent('gptDone'));
  }

  function clearAll() {
    store.clearAll();
    historyManager.saveHistory([]);
    msgList.innerHTML = '';
    showWelcome();
  }

  /* ── UI helpers ── */
  function setStreamUI(on) {
    if (sendBtn) sendBtn.style.display = on ? 'none' : '';
    if (stopBtn) stopBtn.style.display = on ? '' : 'none';
  }

  function updateInputState() {
    const hasText = V.notEmpty(inp.value);
    if (sendBtn) sendBtn.disabled = !hasText || store.isStreaming();
  }

  function setupEventListeners() {
    if (sendBtn) sendBtn.addEventListener('click', function () { send(inp.value); });
    if (inp) {
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(inp.value); }
      });
      inp.addEventListener('input', function () {
        updateInputState();
        growInput();
      });
    }
    if (stopBtn) stopBtn.addEventListener('click', stop);

    /* Clear button */
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearAll);
    const newConvoBtn = document.getElementById('newConvoBtn');
    if (newConvoBtn) newConvoBtn.addEventListener('click', clearAll);
  }

  function growInput() {
    if (inp) {
      inp.style.height = 'auto';
      inp.style.height = Math.min(inp.scrollHeight, 200) + 'px';
    }
  }

  function setHistoryFromExternal(arr) {
    store.setHistory(arr);
    msgList.innerHTML = '';
    for (const msg of arr) {
      if (msg.role === 'user') {
        renderer.appendUser(msg.content, msgList);
      } else {
        const msgEl = renderer.appendAI(msgList);
        const bodyEl = msgEl.querySelector('.msg-body');
        if (bodyEl) {
          bodyEl.innerHTML = renderMd(msg.content);
        }
        if (msg.gurbaniBlock) {
          const contentEl = msgEl.querySelector('.msg-content');
          if (contentEl) {
            gurbaniRenderer.injectCard(contentEl, msg.gurbaniBlock.html);
          }
        }
      }
    }
    if (arr.length > 0) showConvo(); else showWelcome();
  }

  return { init, send, stop, clearAll, getHistory: function () { return store.getHistory(); }, setHistory: setHistoryFromExternal };
}
