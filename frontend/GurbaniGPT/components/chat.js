/* ── Chat Coordinator ──
   Thin shim (~250 lines) that wires DOM events and delegates to the new architecture.
   Pipeline logic → PipelineEngine
   Streaming → StreamController
   State → ConversationStore
   History → HistoryManager
   Rendering → MessageRenderer / GurbaniRenderer
   Planning → ResponsePlanner + VoiceEngine */

import { createChatController, setToast as setChatToast } from '../src/conversation/controller/ChatController.js';
import { getPipelineEngine } from '../src/PipelineEngine.js';
import { esc } from '../src/shared/escape.js';
import { renderMd } from '../src/shared/markdown.js';
import { V } from '../src/shared/validators.js';

export function setToast(fn) { setChatToast(fn); }

export function createTypewriter() {
  let el = null, buf = '', running = false, raf = null, done = false, aborted = false;

  function start(container) {
    el = container;
    el.innerHTML = '';
    running = true;
    done = false;
    aborted = false;
  }

  function push(text) {
    if (!running || aborted) return;
    buf += text;
    if (!raf) raf = requestAnimationFrame(flush);
  }

  function flush() {
    raf = null;
    if (!el || aborted) return;
    el.innerHTML = renderMd(buf);
    const msgs = el.closest('#msgs');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  function finish() {
    running = false; done = true; if (raf) { cancelAnimationFrame(raf); raf = null; }
    flush();
  }

  function abort() {
    aborted = true; running = false; if (raf) { cancelAnimationFrame(raf); raf = null; }
  }

  function getText() { return buf; }

  return { start, push, finish, abort, getText };
}

const READING_KEY = 'gurbanigpt_reading_history';

export function initChat(deps) {
  const $ = function(id) { return document.getElementById(id); };
  const msgs = $('msgs'), msgList = $('msgList'), welcome = $('welcome');
  const inp = $('inp'), sendBtn = $('sendBtn'), stopBtn = $('stopBtn');
  const sidebar = $('sidebar'), sidebarOv = $('sidebarOv'), prevConvosList = $('prevConvosList');

  const chatCtrl = createChatController();
  const pipeline = getPipelineEngine();

  let history = [];
  let sessionId = Date.now().toString();

  /* ── Load and wire history ── */
  function loadHistory() {
    try {
      const s = localStorage.getItem('gurbanigpt_v4');
      if (s) { history = JSON.parse(s); renderAll(); }
    } catch {}
  }

  function saveHistory() {
    if (history.length > 40) history = history.slice(-40);
    try { localStorage.setItem('gurbanigpt_v4', JSON.stringify(history)); saveSession(); } catch {}
  }

  function getSessions() {
    try { return JSON.parse(localStorage.getItem('gurbanigpt_sessions') || '[]'); } catch { return []; }
  }
  function saveSessions(a) {
    try { localStorage.setItem('gurbanigpt_sessions', JSON.stringify(a)); } catch {}
  }
  function saveSession() {
    if (!history.length) return;
    const all = getSessions();
    const i = all.findIndex(function(s) { return s.id === sessionId; });
    const first = history.find(function(m) { return m.role === 'user'; });
    const title = first ? first.content.slice(0, 48) + (first.content.length > 48 ? '\u2026' : '') : 'Conversation';
    const entry = { id: sessionId, title, date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), ts: Date.now(), messages: history.slice(-40) };
    if (i >= 0) all[i] = entry; else all.unshift(entry);
    if (all.length > 30) all.splice(30);
    saveSessions(all);
    renderPrevConvos();
  }

  function deleteSession(id) {
    const all = getSessions().filter(function(s) { return s.id !== id; });
    saveSessions(all);
    renderPrevConvos();
  }

  function loadSession(s) {
    if (s && s.messages) {
      history = s.messages;
      sessionId = s.id;
      renderAll();
      closeSidebar();
      showConvo();
      saveHistory();
    }
  }

  function renderPrevConvos(filter) {
    if (!prevConvosList) return;
    const all = getSessions();
    const filtered = filter ? all.filter(function(s) { return s.title.toLowerCase().includes(filter.toLowerCase()); }) : all;
    prevConvosList.innerHTML = filtered.map(function(s) {
      return '<div class="conv-item" data-id="' + s.id + '"><div class="conv-title">' + esc(s.title) + '</div><div class="conv-date">' + esc(s.date) + '</div><button class="conv-del" data-id="' + s.id + '">\u2716</button></div>';
    }).join('') || '<div class="conv-empty">No conversations yet</div>';
  }

  function renderAll() {
    msgList.innerHTML = '';
    for (const m of history) {
      if (m.role === 'user') {
        const div = document.createElement('div');
        div.className = 'msg user';
        div.innerHTML = '<div class="msg-content"><div class="msg-body"><p>' + esc(m.content) + '</p></div></div>';
        msgList.appendChild(div);
      }
    }
  }

  function showConvo() {
    if (msgs) msgs.style.display = 'block';
    if (welcome) welcome.style.display = 'none';
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarOv) sidebarOv.classList.remove('show');
  }

  /* ── Reading History ── */
  function getReadingHistory() {
    try { return JSON.parse(localStorage.getItem(READING_KEY) || '[]'); } catch { return []; }
  }

  function renderReadingHistory() {
    const container = $('readingHistory');
    if (!container) return;
    const entries = getReadingHistory();
    container.innerHTML = entries.map(function(e) {
      return '<div class="reading-item" data-id="' + esc(e.shabadId || '') + '"><div class="reading-preview">' + esc(e.preview || '') + '</div><div class="reading-meta">' + (e.ang ? 'Ang ' + e.ang : '') + (e.writer ? ' \u00B7 ' + e.writer : '') + '</div></div>';
    }).join('') || '<div class="conv-empty">No Shabads viewed yet</div>';
  }

  /* ── Override chatCtrl.send to integrate with existing history ── */
  const origSend = chatCtrl.send;
  chatCtrl.send = async function(text) {
    history.push({ role: 'user', content: text });
    saveHistory();
    await origSend.call(chatCtrl, text);
    if (pipeline.memory) pipeline.memory.summary.incrementMessageCount();
  };

  /* ── Init ── */
  loadHistory();
  renderReadingHistory();
  renderPrevConvos();
  if (inp) inp.focus();

  /* ── Wire sidebar events ── */
  if (prevConvosList) {
    prevConvosList.addEventListener('click', function(e) {
      const item = e.target.closest('.conv-item');
      const del = e.target.closest('.conv-del');
      if (del) { e.stopPropagation(); deleteSession(del.dataset.id); return; }
      if (item) {
        const all = getSessions();
        const s = all.find(function(x) { return x.id === item.dataset.id; });
        if (s) loadSession(s);
      }
    });
  }

  $('sidebarToggle')?.addEventListener('click', function() {
    sidebar?.classList.toggle('open');
    sidebarOv?.classList.toggle('show');
    renderReadingHistory();
    renderPrevConvos();
  });
  sidebarOv?.addEventListener('click', closeSidebar);
  $('sidebarClose')?.addEventListener('click', closeSidebar);

  /* ── Search in sidebar ── */
  const searchInp = $('searchInp');
  if (searchInp) {
    searchInp.addEventListener('input', function() { renderPrevConvos(this.value); });
  }

  /* ── Debug panel ── */
  $('debugBtn')?.addEventListener('click', function() {
    pipeline.debugPanel.toggle();
  });

  /* ── Theme toggle ── */
  $('themeToggle')?.addEventListener('click', function() {
    if (deps && deps.getTheme) {
      const t = deps.getTheme();
      if (t && t.toggle) t.toggle();
    }
  });

  /* ── Clear button ── */
  $('clearBtn')?.addEventListener('click', function() {
    history = [];
    sessionId = Date.now().toString();
    saveHistory();
    msgList.innerHTML = '';
    if (msgs) msgs.style.display = 'none';
    if (welcome) welcome.style.display = 'block';
  });

  /* ── Suggestions ── */
  document.querySelectorAll('.suggestion-chip').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (inp) { inp.value = this.textContent; chatCtrl.send(this.textContent); }
    });
  });

  /* ── Ctrl+Shift+D for debug ── */
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      pipeline.debugPanel.toggle();
    }
  });

  return {
    sendMsg: chatCtrl.send,
    clearAll: chatCtrl.clearAll,
    loadHistory: loadHistory,
    saveHistory: saveHistory,
    getHistory: function() { return history; },
  };
}
