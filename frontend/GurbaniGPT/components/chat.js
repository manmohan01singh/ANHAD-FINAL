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
  let el = null, buf = '', running = false, done = false, aborted = false;
  let queue = [];
  let displayBuf = '';
  let lastTick = 0;
  const charsPerSecond = 50; // Smooth human status speed: ~50 chars/sec

  function start(container) {
    el = container;
    el.innerHTML = '';
    buf = '';
    displayBuf = '';
    queue = [];
    running = true;
    done = false;
    aborted = false;
    lastTick = performance.now();
    requestAnimationFrame(tick);
  }

  function push(text) {
    if (!running || aborted) return;
    buf += text;
    // Push characters into queue
    for (let i = 0; i < text.length; i++) {
      queue.push(text[i]);
    }
  }

  function tick(timestamp) {
    if (!running || aborted) return;
    const elapsed = timestamp - lastTick;
    const charDelay = 1000 / charsPerSecond;

    if (elapsed >= charDelay) {
      const charsToType = Math.floor(elapsed / charDelay);
      let typed = 0;
      while (queue.length > 0 && typed < charsToType) {
        displayBuf += queue.shift();
        typed++;
      }
      lastTick = timestamp - (elapsed % charDelay);
      flush();
    }

    if (done && queue.length === 0) {
      running = false;
      flush();
      return;
    }

    requestAnimationFrame(tick);
  }

  function flush() {
    if (!el || aborted) return;
    let html = renderMd(displayBuf);
    if (running || queue.length > 0) {
      html += '<span class="cur"></span>';
    }
    el.innerHTML = html;
    const msgs = el.closest('#msgs');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  function finish() {
    done = true;
  }

  function abort() {
    aborted = true;
    running = false;
  }

  function getText() {
    return displayBuf || buf;
  }

  function isBusy() {
    return running;
  }

  return { start, push, finish, abort, getText, isBusy };
}

const READING_KEY = 'gurbanigpt_reading_history';

export function initChat(deps) {
  const $ = function (id) { return document.getElementById(id); };
  const msgs = $('msgs'), msgList = $('msgList'), welcome = $('welcome');
  const inp = $('inp'), sendBtn = $('sendBtn'), stopBtn = $('stopBtn');
  const sidebar = $('sidebar'), sidebarOv = $('sidebarOv'), prevConvosList = $('prevConvosList');

  const chatCtrl = createChatController();
  const pipeline = getPipelineEngine();

  let history = [];
  let sessionId = Date.now().toString();

  /* ── Init controller (wires event listeners for send/stop/clear) ── */
  chatCtrl.init();

  /* ── Load and wire history ── */
  function loadHistory() {
    try {
      const s = localStorage.getItem('gurbanigpt_v4');
      if (s) { history = JSON.parse(s); chatCtrl.setHistory(history); }
    } catch { }
  }

  function saveHistory() {
    if (history.length > 40) history = history.slice(-40);
    try { localStorage.setItem('gurbanigpt_v4', JSON.stringify(history)); saveSession(); } catch { }
  }

  function getSessions() {
    try { return JSON.parse(localStorage.getItem('gurbanigpt_sessions') || '[]'); } catch { return []; }
  }
  function saveSessions(a) {
    try { localStorage.setItem('gurbanigpt_sessions', JSON.stringify(a)); } catch { }
  }
  function saveSession() {
    if (!history.length) return;
    const all = getSessions();
    const i = all.findIndex(function (s) { return s.id === sessionId; });
    const first = history.find(function (m) { return m.role === 'user'; });
    const title = first ? first.content.slice(0, 48) + (first.content.length > 48 ? '\u2026' : '') : 'Conversation';
    const entry = { id: sessionId, title, date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), ts: Date.now(), messages: history.slice(-40) };
    if (i >= 0) all[i] = entry; else all.unshift(entry);
    if (all.length > 30) all.splice(30);
    saveSessions(all);
    renderPrevConvos();
  }

  function deleteSession(id) {
    const all = getSessions().filter(function (s) { return s.id !== id; });
    saveSessions(all);
    renderPrevConvos();
  }

  function loadSession(s) {
    if (s && s.messages) {
      history = s.messages;
      sessionId = s.id;
      chatCtrl.setHistory(s.messages);
      closeSidebar();
      saveHistory();
    }
  }

  function renderPrevConvos(filter) {
    if (!prevConvosList) return;
    const all = getSessions();
    const filtered = filter ? all.filter(function (s) { return s.title.toLowerCase().includes(filter.toLowerCase()); }) : all;
    prevConvosList.innerHTML = filtered.map(function (s) {
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
      } else {
        const div = document.createElement('div');
        div.className = 'msg ai';
        div.innerHTML = '<div class="msg-avatar"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div><div class="msg-content"><div class="msg-name">ANHAD</div><div class="msg-body">' + renderMd(m.content) + '</div></div>';
        msgList.appendChild(div);
        if (m.gurbaniBlock) {
          const contentEl = div.querySelector('.msg-content');
          if (contentEl) {
            const cardWrap = document.createElement('div');
            cardWrap.innerHTML = m.gurbaniBlock.html;
            contentEl.appendChild(cardWrap.firstElementChild);
          }
        }
      }
    }
  }

  function showConvo() {
    if (msgs) msgs.style.display = 'block';
    if (welcome) welcome.style.display = 'none';
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarOv) sidebarOv.classList.remove('open');
  }

  /* ── Reading History ── */
  function getReadingHistory() {
    try { return JSON.parse(localStorage.getItem(READING_KEY) || '[]'); } catch { return []; }
  }

  function renderReadingHistory() {
    const container = $('readingHistoryList');
    if (!container) return;
    const entries = getReadingHistory();
    container.innerHTML = entries.map(function (e) {
      return '<div class="reading-item" data-id="' + esc(e.shabadId || '') + '"><div class="reading-preview">' + esc(e.preview || '') + '</div><div class="reading-meta">' + (e.ang ? 'Ang ' + e.ang : '') + (e.writer ? ' \u00B7 ' + e.writer : '') + '</div></div>';
    }).join('') || '<div class="conv-empty">No Shabads viewed yet</div>';
  }

  /* ── Memory Stats & Timeline ── */
  function renderMemory() {
    if (!deps || !deps.getMemory) return;
    const mem = deps.getMemory();
    if (!mem) return;
    const stats = mem.getStats();

    const statsEl = $('memoryStats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div style="display:flex;gap:12px;margin:8px 0;">
          <div style="flex:1;background:rgba(0,0,0,0.03);padding:8px;border-radius:10px;text-align:center;">
            <div style="font-size:16px;font-weight:700;color:var(--accent);">${stats.sessions || 0}</div>
            <div style="font-size:10px;color:var(--t3);text-transform:uppercase;">Sessions</div>
          </div>
          <div style="flex:1;background:rgba(0,0,0,0.03);padding:8px;border-radius:10px;text-align:center;">
            <div style="font-size:16px;font-weight:700;color:var(--accent);">${stats.messages || 0}</div>
            <div style="font-size:10px;color:var(--t3);text-transform:uppercase;">Messages</div>
          </div>
        </div>
      `;
    }

    const timelineEl = $('journeyTimeline');
    if (timelineEl) {
      if (stats.journey && stats.journey.length > 0) {
        timelineEl.innerHTML = stats.journey.map(function (m) {
          return `
            <div style="display:flex;gap:10px;margin-bottom:12px;font-size:12.5px;line-height:1.4;">
              <div style="width:8px;height:8px;border-radius:50%;background:var(--accent);margin-top:5px;flex-shrink:0;"></div>
              <div>
                <div style="color:var(--t1);font-weight:500;">${esc(m.event)}</div>
                <div style="color:var(--t3);font-size:10px;">Week ${m.week} &middot; ${esc(m.date)}</div>
              </div>
            </div>
          `;
        }).join('');
      } else {
        timelineEl.innerHTML = '<div style="font-size:12px;color:var(--t3);font-style:italic;padding:8px 0;">Timeline empty</div>';
      }
    }
  }

  /* ── Override chatCtrl.send to integrate with existing history ── */
  const origSend = chatCtrl.send;
  chatCtrl.send = async function (text) {
    try {
      history.push({ role: 'user', content: text });
      saveHistory();
      await origSend.call(chatCtrl, text);
      /* Sync from store (store has assistant response + user msg) */
      history = chatCtrl.getHistory();
      saveHistory();
      if (pipeline.memory) pipeline.memory.summary.incrementMessageCount();
    } catch (e) {
      console.error('[chatCtrl.send] Error:', e);
      /* Remove the user message we pushed since it failed */
      history.pop();
      saveHistory();
    }
  };

  /* ── Init ── */
  loadHistory();
  renderReadingHistory();
  renderPrevConvos();
  renderMemory();
  if (inp) inp.focus();

  /* ── Sidebar Home button ── */
  $('sidebarHomeBtn')?.addEventListener('click', function () {
    resetHandler();
    closeSidebar();
  });

  /* ── Wire sidebar events ── */
  if (prevConvosList) {
    prevConvosList.addEventListener('click', function (e) {
      const item = e.target.closest('.conv-item');
      const del = e.target.closest('.conv-del');
      if (del) { e.stopPropagation(); deleteSession(del.dataset.id); return; }
      if (item) {
        const all = getSessions();
        const s = all.find(function (x) { return x.id === item.dataset.id; });
        if (s) loadSession(s);
      }
    });
  }

  $('menuBtn')?.addEventListener('click', function () {
    sidebar?.classList.toggle('open');
    sidebarOv?.classList.toggle('open');
    renderReadingHistory();
    renderPrevConvos();
    renderMemory();
  });
  sidebarOv?.addEventListener('click', closeSidebar);
  $('sidebarClose')?.addEventListener('click', closeSidebar);

  /* ── Model Selector Dropdown ── */
  const modelSelector = $('modelSelector');
  const modelDropdown = $('modelDropdown');
  modelSelector?.addEventListener('click', function (e) {
    e.stopPropagation();
    $('moreDropdown')?.classList.remove('open');
    modelDropdown?.classList.toggle('open');
  });

  document.querySelectorAll('#modelDropdown .hdr-dropdown-item').forEach(function (item) {
    item.addEventListener('click', function () {
      document.querySelectorAll('#modelDropdown .hdr-dropdown-item').forEach(i => i.classList.remove('active'));
      this.classList.add('active');
      const modelName = this.dataset.model;
      localStorage.setItem('gurbanigpt_selected_model', modelName);

      const titleSpan = modelSelector.querySelector('.hdr-model-name');
      if (titleSpan) {
        const strongText = this.querySelector('strong')?.textContent || 'Gurbani';
        if (strongText === 'ANHAD') {
          titleSpan.innerHTML = `<strong>${strongText}</strong> (Quick)`;
          const sub = document.getElementById('welcomeSub');
          if (sub) sub.textContent = 'Quick conversational responses · No scripture retrieval';
        } else {
          titleSpan.innerHTML = `<strong>${strongText}</strong> GPT (Deep Vichar)`;
          const sub = document.getElementById('welcomeSub');
          if (sub) sub.textContent = 'Deep Vichar — Gurbani-rooted, translation-based, extreme depth';
        }
      }
      modelDropdown?.classList.remove('open');
    });
  });

  /* Initialize selected model UI active state */
  const savedModel = localStorage.getItem('gurbanigpt_selected_model');
  if (savedModel) {
    const matchingItem = document.querySelector(`#modelDropdown .hdr-dropdown-item[data-model="${savedModel}"]`);
    if (matchingItem) {
      document.querySelectorAll('#modelDropdown .hdr-dropdown-item').forEach(i => i.classList.remove('active'));
      matchingItem.classList.add('active');
      const titleSpan = modelSelector?.querySelector('.hdr-model-name');
      if (titleSpan) {
        const strongText = matchingItem.querySelector('strong')?.textContent || 'Gurbani';
        if (strongText === 'ANHAD') {
          titleSpan.innerHTML = `<strong>${strongText}</strong> (Quick)`;
          const sub = document.getElementById('welcomeSub');
          if (sub) sub.textContent = 'Quick conversational responses · No scripture retrieval';
        } else {
          titleSpan.innerHTML = `<strong>${strongText}</strong> GPT (Deep Vichar)`;
          const sub = document.getElementById('welcomeSub');
          if (sub) sub.textContent = 'Deep Vichar — Gurbani-rooted, translation-based, extreme depth';
        }
      }
    }
  }

  /* ── Options / More Dropdown ── */
  const moreBtn = $('moreBtn');
  const moreDropdown = $('moreDropdown');
  moreBtn?.addEventListener('click', function (e) {
    e.stopPropagation();
    modelDropdown?.classList.remove('open');
    moreDropdown?.classList.toggle('open');
  });

  $('optClear')?.addEventListener('click', function () {
    resetHandler();
    moreDropdown?.classList.remove('open');
  });

  $('optTimer')?.addEventListener('click', function () {
    if (deps && deps.getTimer) {
      deps.getTimer().open();
    }
    moreDropdown?.classList.remove('open');
  });

  $('optDebug')?.addEventListener('click', function () {
    pipeline.debugPanel.toggle();
    moreDropdown?.classList.remove('open');
  });

  $('optTheme')?.addEventListener('click', function () {
    if (deps && deps.getTheme) {
      const t = deps.getTheme();
      if (t && t.toggle) t.toggle();
    }
    moreDropdown?.classList.remove('open');
  });

  $('optMood')?.addEventListener('click', function () {
    $('moodOv')?.classList.add('show');
    moreDropdown?.classList.remove('open');
  });

  $('moodCloseBtn')?.addEventListener('click', function () {
    $('moodOv')?.classList.remove('show');
  });

  /* Wire mood option clicks */
  document.querySelectorAll('#moodOv .mood-opt').forEach(function (opt) {
    opt.addEventListener('click', function () {
      document.querySelectorAll('#moodOv .mood-opt').forEach(o => o.classList.remove('sel'));
      this.classList.add('sel');
      const mood = this.dataset.mood;
      localStorage.setItem('gurbanigpt_selected_mood', mood);
      if (deps && deps.getMood) {
        deps.getMood().set(mood);
      }
    });
  });

  /* Initialize mood selection */
  const savedMood = localStorage.getItem('gurbanigpt_selected_mood') || 'seeking';
  const matchingMood = document.querySelector(`#moodOv .mood-opt[data-mood="${savedMood}"]`);
  if (matchingMood) {
    document.querySelectorAll('#moodOv .mood-opt').forEach(o => o.classList.remove('sel'));
    matchingMood.classList.add('sel');
    if (deps && deps.getMood) {
      deps.getMood().set(savedMood);
    }
  }

  /* ── Sidebar Actions ── */
  $('bmarksSidebarBtn')?.addEventListener('click', function () {
    if (deps && deps.getBookmarks) {
      const bmarks = deps.getBookmarks();
      const container = $('bmarksList');
      if (container) bmarks.render(container);
    }
    $('bmarksOv')?.classList.add('show');
    closeSidebar();
  });

  $('bmarksClose')?.addEventListener('click', function () {
    $('bmarksOv')?.classList.remove('show');
  });

  $('aboutSidebarBtn')?.addEventListener('click', function () {
    alert('ANHAD GurbaniGPT \u2014 A Gemini-inspired Gurbani Companion and spiritual journal.\n\nProviding warm, scripture-rooted understanding, dynamic state reflections, and personalized journey tracking.');
    closeSidebar();
  });

  /* Close dropdowns on document level tap */
  window.addEventListener('click', function (e) {
    if (!e.target.closest('#modelSelector') && !e.target.closest('#modelDropdown')) {
      modelDropdown?.classList.remove('open');
    }
    if (!e.target.closest('#moreBtn') && !e.target.closest('#moreDropdown')) {
      moreDropdown?.classList.remove('open');
    }
  });

  /* ── Search in sidebar ── */
  const searchInp = $('convosSearch');
  if (searchInp) {
    searchInp.addEventListener('input', function () { renderPrevConvos(this.value); });
  }

  /* ── Debug panel ── */
  $('debugSidebarBtn')?.addEventListener('click', function () {
    pipeline.debugPanel.toggle();
    closeSidebar();
  });

  /* ── Theme toggle ── */
  $('themeSidebarBtn')?.addEventListener('click', function () {
    if (deps && deps.getTheme) {
      const t = deps.getTheme();
      if (t && t.toggle) t.toggle();
    }
  });

  /* ── Clear / New Chat button ── */
  const resetHandler = function () {
    history = [];
    sessionId = Date.now().toString();
    saveHistory();
    chatCtrl.setHistory([]);
    msgList.innerHTML = '';
    if (msgs) msgs.style.display = 'none';
    if (welcome) welcome.style.display = 'block';
  };
  $('newConvoBtn')?.addEventListener('click', resetHandler);
  $('clearBtn')?.addEventListener('click', resetHandler);

  /* ── Memory Reset button ── */
  $('memoryResetBtn')?.addEventListener('click', function () {
    if (confirm('Are you sure you want to reset your journey memory? This cannot be undone.')) {
      if (deps && deps.getMemory) {
        const mem = deps.getMemory();
        if (mem && mem.reset) {
          mem.reset();
          renderMemory();
          alert('Journey memory reset successfully');
        }
      }
    }
  });

  /* ── Suggestions ── */
  document.querySelectorAll('.suggestion-card').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const promptText = this.getAttribute('data-prompt') || this.textContent;
      if (inp) { inp.value = promptText; chatCtrl.send(promptText); }
    });
  });

  /* ── Hukamnama Vichar Button ── */
  $('btnHukamVichar')?.addEventListener('click', function () {
    const promptText = "Explain today's Hukamnama Sahib in deep detail. Display the full Gurmukhi verses, the correct English translation from tikas (Sahib Singh / Manmohan Singh translations), and then perform an extreme deep Vichar (spiritual commentary) on the entire Hukamnama — go word by word, phrase by phrase. Explain the spiritual essence, practical life lesson, and how to apply this Hukamnama today. This is Guru Sahib's direct message — treat it with that reverence.";
    if (inp) { inp.value = promptText; chatCtrl.send(promptText); }
  });

  /* ── Ctrl+Shift+D for debug ── */
  document.addEventListener('keydown', function (e) {
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
    getHistory: function () { return history; },
  };
}
