import { initRAG } from '../components/rag.js';
import { initGurbaniSource } from '../components/gurbani-source.js';
import { initIntentAnalyzer } from '../components/intent.js';
import { initConceptExpander } from '../components/expansion.js';
import { initWisdomRetrieval } from '../components/retrieval.js';
import { initWisdomReasoner } from '../components/wisdom.js';
import { initDebugPanel } from '../components/debug.js';
import { initResponsePlanner } from '../components/response-planner.js';

const STORE = 'gurbanigpt_v4';
const SESS_STORE = 'gurbanigpt_sessions';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-4-scout-17b-16e-instruct';

const PROD_API = 'https://anhad-final.onrender.com';
const API_BASE = PROD_API;
console.log('ANHAD Companion v4 | API:', API_BASE);

const displayName = 'Gurbani Companion';

const V = {
  notEmpty: t => t.trim().length > 0,
  notTooLong: t => t.length <= 2000,
  notDuplicate: (t, h) => h.length === 0 || h[h.length - 1]?.content !== t.trim(),
  isOnline: () => navigator.onLine,
  notStreaming: s => !s,
  isSafe: t => !/(.)\1{15,}/i.test(t),
  historyCap: h => h.length <= 38,
  detectLang: t => /[\u0A00-\u0A7F]/.test(t) ? 'Punjabi' : /[\u0900-\u097F]/.test(t) ? 'Hindi' : 'English',
  ttsAvail: () => 'speechSynthesis' in window,
  shareAvail: () => !!navigator.share,
  noAbuse: t => !/^\s*[!@#$%^&*()\-_=+[\]{}|;':",.<>?\/\\`~]{10,}/.test(t),
};

function convertAnmolToUnicode(str) {
  if (!str) return '';
  const trimmed = str.trim();
  const directMap = {
    'BweI gurdws': 'ਭਾਈ ਗੁਰਦਾਸ',
    'BweI gurdws jI': 'ਭਾਈ ਗੁਰਦਾਸ ਜੀ',
    'guru nwnk dyv': 'ਗੁਰੂ ਨਾਨਕ ਦੇਵ',
    'guru AMgd dyv': 'ਗੁਰੂ ਅੰਗਦ ਦੇਵ',
    'guru Amrdws': 'ਗੁਰੂ ਅਮਰਦਾਸ',
    'guru rwmdws': 'ਗੁਰੂ ਰਾਮਦਾਸ',
    'guru arjn dyv': 'ਗੁਰੂ ਅਰਜਨ ਦੇਵ',
    'guru qyg bhwdr': 'ਗੁਰੂ ਤੇਗ ਬਹਾਦਰ',
    'guru gobiMd isMG': 'ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ',
    'kbIr jI': 'ਕਬੀਰ ਜੀ',
    'PrId jI': 'ਫ਼ਰੀਦ ਜੀ',
    'nwmdyv jI': 'ਨਾਮਦੇਵ ਜੀ',
    'rivdws jI': 'ਰਵਿਦਾਸ ਜੀ',
    'syK PrId': 'ਸ਼ੇਖ਼ ਫ਼ਰੀਦ'
  };
  if (directMap[trimmed]) return directMap[trimmed];

  const map = {
    'a': 'ੳ', 'A': 'ਅ', 's': 'ਸ', 'S': 'ਸ਼', 'h': 'ਹ', 'H': '੍ਹ',
    'k': 'ਕ', 'K': 'ਖ਼', 'g': 'ਗ', 'G': 'ਘ', 'c': 'ਚ', 'C': 'ਛ',
    'j': 'ਜ', 'J': 'ਝ', 't': 'ਟ', 'T': 'ਠ', 'd': 'ਡ', 'D': 'ਢ',
    'x': 'ਣ', 'q': 'ਤ', 'Q': 'ਥ', 'n': 'ਨ',
    'p': 'ਪ', 'P': 'ਫ', 'b': 'ਬ', 'B': 'ਭ', 'm': 'ਮ', 'y': 'ਯ',
    'r': 'ਰ', 'R': '੍ਰ', 'l': 'ਲ', 'L': 'ਲ਼', 'v': 'ਵ', 'V': 'ੜ',
    'w': 'ਾ', 'W': 'ਾਂ', 'i': 'ਿ', 'I': 'ੀ', 'u': 'ੁ', 'U': 'ੂ',
    'e': 'ੲ', 'o': 'ੋ', 'q': 'ੌ', '@': 'ੱ',
    'M': 'ੰ', 'N': 'ਂ', 'z': 'ਜ਼', 'Z': 'ਗ਼', ')': 'ਫ਼', '|': '।',
    '\\': '।', '1': '੧', '2': '੨', '3': '੩', '4': '੪', '5': '੫',
    '6': '੬', '7': '੭', '8': '੮', '9': '੯', '0': '੦'
  };

  let res = '';
  for (let idx = 0; idx < str.length; idx++) {
    const char = str[idx];
    if (char === 'i') {
      let nextCons = '';
      let lookahead = idx + 1;
      if (lookahead < str.length) {
        const nextChar = str[lookahead];
        nextCons = map[nextChar] || nextChar;
        idx++;
      }
      res += nextCons + 'ਿ';
    } else {
      res += map[char] || char;
    }
  }

  res = res.replace(/ਅਾ/g, 'ਆ');
  res = res.replace(/ੲੇ/g, 'ਏ');
  res = res.replace(/ੲੀ/g, 'ਈ');
  res = res.replace(/ੳੁ/g, 'ਉ');
  res = res.replace(/ੳੂ/g, 'ਊ');
  res = res.replace(/ੳੋ/g, 'ਓ');
  res = res.replace(/ਅੈ/g, 'ਐ');
  res = res.replace(/ਅੌ/g, 'ਔ');
  res = res.replace(/ਨµ/g, 'ਨੰ');
  res = res.replace(/ਮµ/g, 'ਮੰ');
  return res;
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderMd(s) {
  if (!s) return '';
  let h = esc(s);
  h = h.replace(/```(\w*)\n([\s\S]*?)```/g, (_, l, c) => {
    const lc = l ? ` class="lang-${esc(l)}"` : '';
    return `<pre${lc}><code>${esc(c.trim())}</code></pre>`;
  });
  h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
  h = h.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  h = h.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/\*(.*?)\*/g, '<em>$1</em>');
  h = h.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
  h = h.replace(/^[-•*] (.+)$/gm, '<li>$1</li>');
  h = h.replace(/(<li>[\s\S]*?<\/li>(\s*<li>[\s\S]*?<\/li>)*)/g, '<ul>$1</ul>');
  h = h.replace(/^---$/gm, '<hr>');
  h = h.split(/\n\n+/).map(p => {
    p = p.trim();
    if (!p) return '';
    if (p.startsWith('<') && (p.endsWith('>') || p.endsWith('</ul>') || p.endsWith('</pre>') || p.endsWith('<hr>'))) return p;
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');
  return h || `<p>${s}</p>`;
}

function makeActBtn(html, cls) {
  const b = document.createElement('button');
  b.className = 'msg-act-btn ' + cls;
  b.innerHTML = html;
  return b;
}

function addMsgActions(msgEl, text, bookmarks) {
  const acts = msgEl.querySelector('.msg-actions');
  if (!acts) return;
  const copyBtn = makeActBtn(
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy',
    'copy'
  );
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(text).then(() => showToast('Copied')).catch(() => { });
  });
  acts.appendChild(copyBtn);
  const bmBtn = makeActBtn(
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Save',
    'bm'
  );
  bmBtn.addEventListener('click', () => {
    if (bookmarks) bookmarks.add(text);
    bmBtn.classList.toggle('active');
    showToast('Saved');
  });
  acts.appendChild(bmBtn);
  if (V.ttsAvail()) {
    const spkBtn = makeActBtn(
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> Speak',
      'speak'
    );
    let speaking = false;
    spkBtn.addEventListener('click', () => {
      if (speaking) { speechSynthesis.cancel(); speaking = false; spkBtn.classList.remove('active'); return; }
      const utt = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ''));
      utt.rate = 0.82; utt.pitch = 1;
      utt.onend = () => { speaking = false; spkBtn.classList.remove('active'); };
      speechSynthesis.speak(utt);
      speaking = true; spkBtn.classList.add('active');
    });
    acts.appendChild(spkBtn);
  }
  if (V.shareAvail()) {
    const shrBtn = makeActBtn(
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Share',
      'share'
    );
    shrBtn.addEventListener('click', () => {
      navigator.share({ title: displayName, text, url: location.href }).catch(() => { });
    });
    acts.appendChild(shrBtn);
  }
}

let showToast = () => { };
export function setToast(fn) { showToast = fn; }

/* ── Typewriter — rAF ── */
export function createTypewriter() {
  let rafId = null, idx = 0, buf = '', el = null, done = false, lastFrame = 0;
  function start(el_) {
    el = el_; idx = 0; buf = ''; done = false; lastFrame = 0;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
  }
  function tick(ts) {
    if (done) return;
    if (!lastFrame) lastFrame = ts;
    const d = ts - lastFrame;
    if (d < 30) { rafId = requestAnimationFrame(tick); return; }
    lastFrame = ts;
    if (idx >= buf.length) { rafId = requestAnimationFrame(tick); return; }
    idx = Math.min(idx + 3, buf.length);
    if (el) el.innerHTML = renderMd(buf.slice(0, idx)) + '<span class="cur"></span>';
    rafId = requestAnimationFrame(tick);
  }
  function push(c) { buf += c; }
  function finish() {
    done = true;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    buf = buf.replace(/<!--GB-->/g, '').trim();
    if (el) el.innerHTML = renderMd(buf);
  }
  function abort() {
    done = true;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (el) el.innerHTML = renderMd(buf) || '<em style="color:var(--text-muted)">Stopped.</em>';
  }
  function getText() { return buf; }
  return { start, push, finish, abort, getText };
}

/* ── MODULAR PROMPT SYSTEM ── */

const CORE_PROMPT = `You are ANHAD — a calm Gurbani Companion.

Your voice must sound like a thoughtful, humble Gursikh sitting beside the person, not like a therapist, coach, professor, or generic AI assistant.

━ CORE VOICE RULES ──
- Speak naturally and simply.
- Do not sound analytical, clinical, or over-explaining.
- Do not say "many people experience...", "it can sometimes feel...", or "what you're experiencing..." unless absolutely necessary.
- Do not sound poetic just to sound deep.
- Do not sound motivational in a modern self-help way.
- Do not overuse "Waheguru Ji" or "Tusi" in every line.
- Do not lecture.

━ VOICE PRIORITIES ──
1. Warm human understanding.
2. Gurbani rootedness.
3. Gentle practical guidance.
4. Truth over impressiveness.

━ STYLE EXAMPLES ──
Bad:
- "Many people experience overthinking in these situations."
- "Trust in yourself and your inner strength."
- "What you're experiencing is a deep-seated fear of not being good enough."

Better:
- "An exam tomorrow can make the mind restless, even after sincere preparation."
- "Prepare honestly, then let the result rest in Hukam."
- "Guru Sahib gives a steadier way to hold this moment."

━ RESPONSE STRUCTURE ──
- Start with a human, ordinary sentence.
- Connect to Gurbani naturally.
- Explain the specific Shabad, not generic spirituality.
- Use plain language.
- Keep warmth, but keep it quiet.
- End gently, not dramatically.

Place the marker <!--GB--> on its own line right after you introduce the Shabad. The Gurbani card will render there.

━ WHAT YOU ARE NOT ──
- a therapist
- a life coach
- a productivity app
- a self-help speaker

━ WHAT YOU ARE ──
- a compassionate elder
- a thoughtful friend
- a grounded Gurbani companion

━ DISTRESS / FACTUAL / SPIRITUAL ──
- If the user is distressed, be even simpler and more human.
- If the user asks a factual question, stay calm and direct.
- If the user asks for spiritual guidance, let Gurbani carry the depth.

━ ADDITIONAL WEAK vs STRONG ──
Weak: "It can sometimes feel overwhelming when we have a big day ahead of us."
Strong: "Tomorrow can weigh heavily on the mind, even when we have prepared well."

Weak: "Trust yourself and your abilities."
Strong: "Do your part sincerely, then let the rest remain in Hukam."

Weak: "Many people feel this way."
Strong: "You are not alone in this."

Weak: "I thought of this Shabad because it reminds us that the wisdom is already within us."
Strong: "I thought of this Shabad because Guru Sahib points the mind back from panic to steadiness."

━ LANGUAGE ──
Match the user's language exactly. Stay in one language.

━ CRISIS ──
If the user expresses suicidal thoughts, respond first as a compassionate human. Share helplines (AASRA: +91-9820466726, iCall: +91-9152987821). Never make them feel guilty. Never imply suffering is punishment. Gurbani comes after safety.

━ NO GURBANI ──
If no strong Shabad was found, say honestly: "I searched but could not find a direct Shabad for this." Then share general Gurmat wisdom that relates. Do not fabricate a connection. Honesty builds trust more than a forced verse.

━ NEVER MAKE GURBANI SAY WHAT IT DOES NOT ──
Do not extrapolate, spiritualize, or generalize a Shabad beyond its actual teaching. If the Shabad speaks of Hukam, do not make it speak of Love. If it speaks of Detachment, do not make it speak of Devotion. Stay faithful to the verse. If you are unsure of its meaning, say so.`;

function buildPrompt(memorySummary, lastSession) {
  const parts = [CORE_PROMPT];
  if (memorySummary) parts.push(`Note about this user: ${memorySummary}`);
  if (lastSession) parts.push(`They were last here discussing: ${lastSession}`);
  return parts.join('\n\n');
}

function buildGurbaniBlockFromPrimary(primary, related, fullShabad) {
  if (!primary) return null;

  const v = primary;
  let html = '<div class="gurbani-block"><div class="gurbani-block-inner">';

  if (v.unicode) html += '<div class="gb-verse">' + v.unicode + '</div>';
  if (v.english) html += '<div class="gb-translation">' + esc(v.english) + '</div>';
  if (v.punjabi && v.punjabi !== v.english) html += '<div class="gb-translation gb-punjabi">' + esc(v.punjabi) + '</div>';

  const metaParts = [];
  if (v.pageNo) metaParts.push('Ang ' + v.pageNo);
  if (v.raag) metaParts.push('Raag ' + v.raag);
  const author = v.writerGurmukhi ? convertAnmolToUnicode(v.writerGurmukhi) : v.writer;
  if (author) metaParts.push(author);
  if (metaParts.length) html += '<div class="gb-source">' + esc(metaParts.join(' \u00B7 ')) + '</div>';

  if (fullShabad && fullShabad.shabadId) {
    html += '<button class="gb-full-btn" data-shabad-id="' + fullShabad.shabadId + '">View Full Shabad</button>';
  }

  if (related && related.length > 0) {
    html += '<div class="gb-related-label">Related</div>';
    for (const r of related) {
      html += '<div class="gb-related-verse" data-shabad-id="' + (r.shabadId || '') + '">' + esc((r.unicode || '').slice(0, 80)) + '</div>';
    }
  }

  html += '</div></div>';

  const text = (v.unicode ? v.unicode + '\n' : '') + (v.english ? v.english + '\n' : '') + (v.pageNo ? 'Ang ' + v.pageNo : '') + (author ? ', ' + author : '');

  return { text: text.trim(), html, shabadId: v.shabadId };
}

const SUMMARY_PROMPT = `Analyze this conversation and produce a concise user summary (max 80 words). Include: preferred language, key interests/topics discussed, emotional patterns observed, learning style (brief vs detailed questions), and any milestone reached (e.g., started simran, learned about Hukam). Write in third person. Be accurate — if unclear, state "unclear".`;

/* ── Chat engine ── */
let gMood = () => '', gLen = () => 'brief', gMemory = null, gBookmarks = null, gTimer = null, gTheme = null;

export function initChat({ getTheme, getBookmarks, getTimer, getMood, getLength, getMemory }) {
  gMood = () => (getMood ? getMood() : '');
  gLen = () => (getLength ? getLength() : 'brief');
  gMemory = getMemory ? getMemory() : null;
  gBookmarks = getBookmarks ? getBookmarks() : null;
  gTimer = getTimer ? getTimer() : null;
  gTheme = getTheme ? getTheme() : null;

  const $ = id => document.getElementById(id);
  const msgs = $('msgs'), msgList = $('msgList'), welcome = $('welcome');
  const inp = $('inp'), sendBtn = $('sendBtn'), stopBtn = $('stopBtn');
  const scrollNudge = $('scrollNudge');
  const charCount = $('charCount');
  const sidebar = $('sidebar'), sidebarOv = $('sidebarOv'), prevConvosList = $('prevConvosList');

  let history = [], streaming = false, abortCtrl = null;
  let sessionId = Date.now().toString();
  const tw = createTypewriter();
  const rag = initRAG();
  const gurbani = initGurbaniSource();
  const intentAnalyzer = initIntentAnalyzer();
  const conceptExpander = initConceptExpander();
  const wisdomReasoner = initWisdomReasoner();
  const wisdomRetrieval = initWisdomRetrieval({ rag, intentAnalyzer, conceptExpander, wisdomReasoner });
  const debugPanel = initDebugPanel();
  const responsePlanner = initResponsePlanner();

  /* ── Init ── */
  loadHistory();
  renderPrevConvos();
  inp.focus();
  setup();
  try {
    const sc = sessionStorage.getItem('gpt_scroll');
    if (sc) setTimeout(() => { msgs.scrollTop = +sc; }, 100);
  } catch { }

  /* ── Session ── */
  function loadHistory() {
    try {
      const s = localStorage.getItem(STORE);
      if (s) history = JSON.parse(s);
      if (history.length) { renderAll(); return; }
    } catch { }
    showWelcome();
  }

  function saveHistory() {
    if (history.length > 40) history = history.slice(-40);
    try { localStorage.setItem(STORE, JSON.stringify(history)); saveSession(); } catch { }
  }

  function getSessions() {
    try { return JSON.parse(localStorage.getItem(SESS_STORE) || '[]'); } catch { return []; }
  }
  function saveSessions(a) {
    try { localStorage.setItem(SESS_STORE, JSON.stringify(a)); } catch { }
  }

  function saveSession() {
    if (!history.length) return;
    const all = getSessions();
    const i = all.findIndex(s => s.id === sessionId);
    const first = history.find(m => m.role === 'user');
    const title = first ? first.content.slice(0, 48) + (first.content.length > 48 ? '…' : '') : 'Conversation';
    const s = { id: sessionId, title, date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), ts: Date.now(), messages: history.slice(-40) };
    if (i >= 0) all[i] = s; else all.unshift(s);
    if (all.length > 30) all.splice(30);
    saveSessions(all);
    renderPrevConvos();
  }

  function deleteSession(id) {
    saveSessions(getSessions().filter(s => s.id !== id));
    renderPrevConvos();
    showToast('Removed');
  }

  function loadSession(s) {
    history = s.messages || [];
    sessionId = s.id;
    history.length ? renderAll() : showWelcome();
    closeSidebar();
  }

  function renderPrevConvos(filter) {
    if (!prevConvosList) return;
    const all = getSessions();
    if (!all.length) { prevConvosList.innerHTML = '<div class="pc-empty">No previous chats</div>'; return; }
    const q = (filter || '').toLowerCase().trim();
    const filtered = q ? all.filter(function(s) { return s.title.toLowerCase().includes(q); }) : all;
    if (!filtered.length) {
      prevConvosList.innerHTML = '<div class="pc-empty">No matches found</div>';
      return;
    }
    prevConvosList.innerHTML = filtered.map(function(s) {
      const titleHtml = q ? esc(s.title).replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<span class="pc-highlight">$1</span>') : esc(s.title);
      return '<div class="pc-item" data-id="' + s.id + '">' +
        '<div class="pc-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>' +
        '<div class="pc-txt"><div class="pc-title">' + titleHtml + '</div><div class="pc-date">' + (s.date || '') + '</div></div>' +
        '<button class="pc-del" data-del="' + s.id + '" title="Delete">\u2715</button>' +
        '</div>';
    }).join('');
    // ... rest of event wiring stays the same
    prevConvosList.querySelectorAll('.pc-item').forEach(function(el) {
      el.addEventListener('click', function(e) {
        if (e.target.closest('.pc-del')) return;
        var session = getSessions().find(function(x) { return x.id === el.dataset.id; });
        if (session) loadSession(session);
      });
    });
    prevConvosList.querySelectorAll('.pc-del').forEach(function(b) {
      b.addEventListener('click', function(e) { e.stopPropagation(); deleteSession(b.dataset.del); });
    });
  }

  function renderAll() {
    showConvo();
    msgList.innerHTML = '';
    const d = document.createElement('div'); d.className = 'divider'; d.textContent = 'Earlier';
    msgList.appendChild(d);
    history.forEach(m => {
      if (m.role === 'user') appendUser(m.content, false);
      else if (m.role === 'assistant') appendAI(m.content, false);
    });
    scrollBot(false);
  }

  function showConvo() {
    welcome.style.display = 'none'; msgList.style.display = 'flex';
  }

  function showWelcome() {
    welcome.style.display = 'flex'; msgList.style.display = 'none';
    msgList.innerHTML = '';

    if (gMemory) {
      const lastTopic = gMemory.getLastSessionTopic();
      const summary = gMemory.getSummary();
      const backEl = $('welcomeBack');
      const subEl = $('welcomeSub');
      if (backEl) {
        if (lastTopic) {
          backEl.textContent = `Welcome back — ${lastTopic}`;
          backEl.className = 'welcome-greeting welcome-back';
        } else {
          backEl.textContent = 'Waheguru Ji Ka Khalsa';
          backEl.className = 'welcome-greeting';
        }
      }
      if (subEl) subEl.style.display = lastTopic ? 'none' : 'block';
    }

    loadWelcomeVerse();
  }

  async function loadWelcomeVerse() {
    const verseEl = $('welcomeVerse');
    const gurmukhiEl = $('wvGurmukhi');
    const transEl = $('wvTranslation');
    const srcEl = $('wvSource');
    if (!verseEl || !gurmukhiEl) return;

    verseEl.classList.add('loading');
    verseEl.classList.remove('hidden');
    gurmukhiEl.textContent = '';
    transEl.textContent = '';
    srcEl.textContent = '';

    try {
      const verse = await Promise.race([
        gurbani.getRandomVerse('G'),
        new Promise(function(r) { setTimeout(r, 7000); }),
      ]);
      if (verse && verse.unicode) {
        gurbani.cacheLastVerse(verse);
        gurmukhiEl.textContent = '\u201C' + verse.unicode + '\u201D';
        if (verse.english) transEl.textContent = verse.english;
        const parts = [];
        if (verse.pageNo) parts.push('Ang ' + verse.pageNo);
        if (verse.writer) parts.push(verse.writer);
        if (verse.source) parts.push(verse.source);
        srcEl.textContent = parts.join(' \u00B7 ');
        verseEl.classList.remove('loading');
        return;
      }
    } catch {}

    const cached = gurbani.getCachedVerse();
    if (cached && cached.unicode) {
      gurmukhiEl.textContent = '\u201C' + cached.unicode + '\u201D';
      if (cached.english) transEl.textContent = cached.english;
      const parts = [];
      if (cached.pageNo) parts.push('Ang ' + cached.pageNo);
      if (cached.writer) parts.push(cached.writer);
      if (cached.source) parts.push(cached.source);
      srcEl.textContent = (parts.length ? parts.join(' \u00B7 ') + ' \u00B7 ' : '') + 'Cached';
      verseEl.classList.remove('loading');
      return;
    }

    gurmukhiEl.textContent = '';
    verseEl.classList.add('hidden');
  }

  /* ── Reading History ── */
  const READING_STORE = 'gurbanigpt_reading_history';

  function getReadingHistory() {
    try { return JSON.parse(localStorage.getItem(READING_STORE) || '[]'); } catch { return []; }
  }

  function saveReadingHistory(arr) {
    try { localStorage.setItem(READING_STORE, JSON.stringify(arr.slice(0, 50))); } catch {}
  }

  function addReadingEntry(ragResult) {
    if (!ragResult || !ragResult.verses || !ragResult.verses.length) return;
    const v = ragResult.verses[0];
    const entry = {
      shabadId: v.shabadId || '',
      pageNo: v.pageNo || '',
      writer: v.writer || '',
      source: v.source || '',
      preview: (v.unicode || '').slice(0, 60),
      ts: Date.now(),
    };
    const all = getReadingHistory();
    const dup = all.some(function(e) { return e.shabadId && e.shabadId === entry.shabadId || (e.pageNo && e.pageNo === entry.pageNo && e.preview === entry.preview); });
    if (dup) return;
    all.unshift(entry);
    saveReadingHistory(all);
    renderReadingHistory();
  }

  function addReadingEntryFromPipeline(pipelineResult) {
    if (!pipelineResult || !pipelineResult.primary) return;
    const v = pipelineResult.primary;
    const entry = {
      shabadId: v.shabadId || '',
      pageNo: v.pageNo || '',
      writer: v.writer || '',
      source: v.source || '',
      preview: (v.unicode || '').slice(0, 60),
      ts: Date.now(),
    };
    const all = getReadingHistory();
    const dup = all.some(function(e) { return e.shabadId && e.shabadId === entry.shabadId || (e.pageNo && e.pageNo === entry.pageNo && e.preview === entry.preview); });
    if (dup) return;
    all.unshift(entry);
    saveReadingHistory(all);
    renderReadingHistory();
  }

  function renderReadingHistory() {
    const el = $('readingHistoryList');
    if (!el) return;
    const all = getReadingHistory();
    if (!all.length) { el.innerHTML = '<div class="rh-empty">No readings yet</div>'; return; }
    el.innerHTML = all.map(function(e) {
      var label = '';
      if (e.pageNo) label += 'Ang ' + e.pageNo;
      if (e.writer) label += (label ? ' \u00B7 ' : '') + e.writer;
      if (!label) label = 'Shabad';
      return '<div class="rh-item">' +
        '<div class="rh-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div>' +
        '<div class="rh-txt"><div class="rh-preview">' + esc(e.preview) + '</div><div class="rh-label">' + esc(label) + '</div></div>' +
        '</div>';
    }).join('');
  }

  function clearReadingHistory() {
    try { localStorage.removeItem(READING_STORE); } catch {}
    renderReadingHistory();
  }

  function clearAll() {
    if (history.length > 0) { saveSession(); if (gMemory) gMemory.markSessionEnd(); }
    history = [];
    try { localStorage.removeItem(STORE); } catch { }
    sessionId = Date.now().toString();
    showWelcome();
    renderPrevConvos();
    if (gMemory) gMemory.markNewSession();
  }

  function appendUser(text, anim = true) {
    const m = document.createElement('div');
    m.className = 'msg msg-user';
    if (!anim) m.style.animation = 'none';
    m.innerHTML = '<div class="msg-bubble">' + esc(text) + '</div>';
    msgList.appendChild(m);
    scrollBot(true);
    if (gMemory) { gMemory.markMessage(); gMemory.detectMilestones(text, 'user'); }
  }

  function appendAI(md, anim = true) {
    const m = makeAIShell(anim);
    m.querySelector('.msg-body').innerHTML = renderMd(md);
    addMsgActions(m, md, gBookmarks);
    msgList.appendChild(m);
    scrollBot(true);
    return m;
  }

  function makeAIShell(anim = true) {
    const m = document.createElement('div');
    m.className = 'msg msg-ai';
    if (!anim) m.style.animation = 'none';
    m.innerHTML = '<div class="msg-avatar" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="16" cy="16" r="12" stroke="currentColor"/><path d="M8 18 Q16 8 24 18" stroke="currentColor" stroke-linecap="round"/><path d="M11 20.5 Q16 14 21 20.5" stroke="currentColor" stroke-linecap="round"/></svg></div><div class="msg-content"><div class="msg-name">' + displayName + '</div><div class="msg-body"></div><div class="msg-actions"></div></div>';
    return m;
  }

  function scrollBot(smooth = true) {
    msgs.scrollTo({ top: msgs.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
  }

  let sr = null;
  msgs.addEventListener('scroll', () => {
    if (sr) cancelAnimationFrame(sr);
    sr = requestAnimationFrame(() => {
      const far = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight > 180;
      scrollNudge.classList.toggle('show', far && msgList.children.length > 0);
    });
  });
  scrollNudge.addEventListener('click', () => scrollBot(true));

  /* ── API call ── */
  async function apiCall(messages, prompt, signal) {
    const key = gMemory ? gMemory.getKey() : '';
    if (key) {
      const body = [{ role: 'system', content: prompt }, ...messages.map(m => ({ role: m.role, content: m.content }))];
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model: GROQ_MODEL, messages: body, temperature: 0.7, max_tokens: gLen() === 'detailed' ? 2048 : 1024, stream: true }),
        signal,
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error('Invalid Groq API key. Check settings.');
        if (res.status === 429) throw new Error('Too many requests — wait a moment.');
        throw new Error(`API error (${res.status})`);
      }
      return res;
    }
    let base = API_BASE;
    let res = await fetch(`${base}/api/gurbani-gpt/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, systemPrompt: prompt }),
      signal,
    });
    if (!res.ok && res.status === 401 && base !== PROD_API) {
      base = PROD_API;
      res = await fetch(`${base}/api/gurbani-gpt/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, systemPrompt: prompt }),
        signal,
      });
    }
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      if (res.status === 429) throw new Error('Too many requests — wait a moment.');
      throw new Error(e.error || `Server error ${res.status}`);
    }
    return res;
  }

  /* ── AI summarization ── */
  async function runSummary() {
    if (!gMemory || !gMemory.shouldSummarize() || history.length < 5) return;
    gMemory.markSummarizing();
    try {
      const key = gMemory.getKey();
      const msgs = history.slice(-30);
      let summary = '';

      if (key) {
        const res = await fetch(GROQ_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [{ role: 'system', content: SUMMARY_PROMPT }, ...msgs.map(m => ({ role: m.role, content: m.content }))],
            temperature: 0.3,
            max_tokens: 200,
          }),
        });
        const d = await res.json();
        summary = d.choices?.[0]?.message?.content || '';
      } else {
        let base = API_BASE;
        let res = await fetch(`${base}/api/gurbani-gpt/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: msgs, systemPrompt: SUMMARY_PROMPT }),
        });
        if (!res.ok && res.status === 401 && base !== PROD_API) {
          base = PROD_API;
          res = await fetch(`${base}/api/gurbani-gpt/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: msgs, systemPrompt: SUMMARY_PROMPT }),
          });
        }
        const d = await res.json();
        summary = d.content || d.message || d.response || '';
      }

      if (summary) gMemory.storeSummary(summary.trim());
    } catch { }
  }

  /* ── Send ── */
  async function sendMsg(text) {
    if (!V.notEmpty(text)) { showToast('Type something first'); return; }
    if (!V.notTooLong(text)) { showToast('Max 2000 chars'); return; }
    if (!V.notDuplicate(text, history)) { showToast('Already sent'); return; }
    if (!V.isOnline()) { showToast('No internet'); return; }
    if (!V.notStreaming(streaming)) { showToast('Wait for reply'); return; }
    if (!V.isSafe(text)) { showToast('Please rephrase'); return; }
    if (!V.noAbuse(text)) { showToast('Please type normally'); return; }
    if (!V.historyCap(history)) { history = history.slice(-20); saveHistory(); }

    text = text.trim();
    inp.value = '';
    charCount.classList.remove('show');
    updateInput();

    showConvo();
    appendUser(text, true);
    history.push({ role: 'user', content: text });

    if (gMemory) gMemory.markNewSession();

    if (gMemory) await runSummary();

    streaming = true;
    setStreamUI(true);

    const msgEl = makeAIShell(true);
    msgList.appendChild(msgEl);
    const bodyEl = msgEl.querySelector('.msg-body');

    const think = document.createElement('div');
    think.className = 'thinking';
    think.innerHTML = '<span></span><span></span><span></span>';
    bodyEl.appendChild(think);
    scrollBot(true);

    let full = '';
    abortCtrl = new AbortController();

    try {
      const memSum = gMemory ? gMemory.getSummary() : '';
      const lastTopic = gMemory ? gMemory.getLastSessionTopic() : '';
      let prompt = buildPrompt(memSum, lastTopic);

      // ── Wisdom Pipeline ──
      const pipelineResult = await wisdomRetrieval.retrieve(text, history);
      debugPanel.render(pipelineResult.trace);

      // ── Needs Gurbani? Branch ──
      if (pipelineResult.needsGurbani === false) {
        prompt += '\n\n--- CONVERSATION MODE: ' + (pipelineResult.mode || 'non-spiritual') + ' ---\n';
        prompt += 'This query is classified as: ' + (pipelineResult.mode || 'non-spiritual') + '.\n';
        prompt += 'No Gurbani retrieval was attempted. Do NOT search your training data for a Shabad.\n';
        prompt += 'Answer naturally in the user\'s language.\n';
        if (pipelineResult.mode === 'translation_request') {
          prompt += 'This is a translation or word-meaning query. Provide the direct translation/meaning. Only add Gurbani context if the phrase itself is from Gurbani (e.g., "Sat Sri Akal" is a Sikh greeting, not a Gurbani verse). Be accurate and concise.';
        } else if (pipelineResult.mode === 'factual_inquiry') {
          prompt += 'This is a factual/definitional query. Answer directly from your knowledge. If the question is about a Gurbani concept (like Hukam, Simran, etc.), explain it clearly. If it\'s a general question, answer normally. Only use Gurbani if it genuinely helps explain the answer.';
        } else if (pipelineResult.mode === 'greeting') {
          prompt += 'This is a greeting. Return the greeting warmly and briefly. Offer help.';
        } else {
          prompt += 'Answer the question directly and helpfully, as you would in a normal conversation. Only use Gurbani if the user specifically asks for it.';
        }
        if (pipelineResult.detection) {
          prompt += '\nDetected intent: ' + (pipelineResult.detection.intent || 'unknown') + '.';
          prompt += '\nDetected emotion: ' + (pipelineResult.detection.emotion || 'none') + '.';
        }

        const res = await apiCall(history, prompt, abortCtrl.signal);
        const ct = res.headers.get('content-type') || '';
        let thinkCleared = false;

        if (ct.includes('stream') || res.headers.get('x-powered-by')?.includes('Groq') || res.body) {
          const reader = res.body.getReader();
          const dec = new TextDecoder();
          let buf = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop();

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const d = line.slice(6).trim();
              if (d === '[DONE]') break;
              try {
                const p = JSON.parse(d);
                const tok = p.choices?.[0]?.delta?.content || '';
                if (tok) {
                  if (!thinkCleared) { think.remove(); tw.start(bodyEl); thinkCleared = true; }
                  full += tok; tw.push(tok);
                }
              } catch { }
            }
          }
          if (!thinkCleared) think.remove();
        } else {
          const d = await res.json();
          full = d.content || d.message || d.response || '';
          think.remove();
          tw.start(bodyEl);
          tw.push(full);
          await new Promise(r => setTimeout(r, 30));
        }

        tw.finish();
        if (full) {
          const displayFull = full.replace(/<!--GB-->/g, '').trim();
          history.push({ role: 'assistant', content: displayFull });
          saveHistory();
          addMsgActions(msgEl, displayFull, gBookmarks);
        }

        streaming = false; abortCtrl = null;
        setStreamUI(false);
        scrollBot(true);
        updateInput();
        inp.focus();
        return;
      }

      const hasGurbani = pipelineResult.primary !== null;

      let gurbaniBlock = null;
      let gurbaniBlockText = '';
      if (hasGurbani) {
        let fullShabad = null;
        const primary = pipelineResult.primary;
        if (primary.shabadId) {
          fullShabad = await rag.getShabad(primary.shabadId);
        }

        gurbaniBlock = buildGurbaniBlockFromPrimary(primary, pipelineResult.related, fullShabad);
        gurbaniBlockText = gurbaniBlock ? gurbaniBlock.text : '';

        // Inject Gurbani candidates into prompt with marker instruction
        prompt += '\n\n--- GURBANI CANDIDATE (retrieved and ranked by wisdom pipeline) ---\n';
        prompt += 'Primary Shabad:\n';
        if (primary.unicode) prompt += 'Gurmukhi: ' + primary.unicode + '\n';
        if (primary.english) prompt += 'Translation: ' + primary.english + '\n';
        if (primary.pageNo) prompt += 'Ang: ' + primary.pageNo + '\n';
        if (primary.raag) prompt += 'Raag: ' + primary.raag + '\n';
        if (primary.writer) prompt += 'Author: ' + primary.writer + '\n';
        prompt += 'Relevance: ' + (pipelineResult.detection ? pipelineResult.detection.subtext : 'matches user\'s situation') + '\n';
        prompt += 'Score: ' + (primary.scores ? (primary.scores.total * 100).toFixed(0) + '%' : 'high') + '\n';

        if (pipelineResult.wisdom) {
          prompt += '\n\n--- WISDOM REASONING (the deeper need behind this conversation) ---\n';
          prompt += 'Illusion detected: ' + pipelineResult.wisdom.primaryIllusion.illusion + '\n';
          prompt += 'Gurmat Truth: ' + pipelineResult.wisdom.truth.statement + '\n';
          prompt += 'Transformation path: ' + pipelineResult.wisdom.transformation + '\n';
          prompt += 'Seeker test: ' + pipelineResult.wisdom.seekerTest + '\n';
        }

        if (pipelineResult.humanNeed) {
          prompt += '\n--- HUMAN NEED (the deeper need inferred for the user) ---\n';
          prompt += 'Primary need: ' + pipelineResult.humanNeed.primaryNeed + '\n';
          prompt += 'Need statement: ' + pipelineResult.humanNeed.needStatement + '\n';
        }

        if (pipelineResult.related && pipelineResult.related.length > 0) {
          prompt += '\nRelated references:\n';
          for (const r of pipelineResult.related) {
            prompt += '- ' + (r.unicode || '').slice(0, 60) + ' (Ang ' + (r.pageNo || '?') + ')\n';
          }
        }

        /* ── Response Planner: dynamic structure, varied phrasing ── */
        const plan = responsePlanner.selectPlan(pipelineResult);
        if (pipelineResult.trace) {
          pipelineResult.trace.stages.push({ name: 'response_planner', output: { mode: plan.label, opening: plan.opening.slice(0, 60), transition: plan.transition.slice(0, 60), closing: plan.closing.slice(0, 60), teachingFocus: plan.teachingFocus || 'none' } });
          debugPanel.render(pipelineResult.trace);
        }
        prompt += '\n--- INSTRUCTION ---\n';
        prompt += 'The Gurbani verse card will be rendered visually at the point where you place the marker <!--GB-->. At the exact moment in your response where you want the Gurbani card to appear, write <!--GB--> on its own line.\n\n';
        prompt += '--- RESPONSE ARCHITECTURE ---\n';
        prompt += 'Mode: ' + plan.label + '\n';
        prompt += 'Conversational rhythm: ' + plan.rhythm + '\n\n';
        prompt += '--- STRUCTURE ---\n';
        prompt += 'Opening: ' + plan.opening + '\n\n';
        prompt += 'Then transition naturally to the Shabad with something in the spirit of: "' + plan.transition + '"\n';
        prompt += 'Place <!--GB--> on its own line right after introducing the Shabad.\n\n';
        prompt += 'After the card: focus on the single core teaching of this specific Shabad. Do not explain general themes.\n';
        if (plan.teachingFocus) {
          prompt += 'This Shabad teaches about: ' + plan.teachingFocus + '. Stay inside that teaching.\n';
        }
        prompt += 'End in the spirit of: "' + plan.closing + '"\n\n';
        prompt += '--- FOCUS INSTRUCTION ---\n';
        if (plan.focusInstruction && plan.focusInstruction.coreTeachingPath) {
          for (const f of plan.focusInstruction.coreTeachingPath) {
            prompt += '- ' + f + '\n';
          }
        }
        if (plan.focusInstruction && plan.focusInstruction.blocked) {
          prompt += '\n--- BLOCKED PHRASES FOR THIS RESPONSE ---\n';
          for (const b of plan.focusInstruction.blocked) {
            prompt += '- ' + b + '\n';
          }
        }
        prompt += '\nAlso avoid: ' + plan.blockedPhrases.slice(0, 4).join(', ') + '\n';
        prompt += 'Do NOT repeat the Gurmukhi or translation in your explanation — the card already shows it.\n';
        prompt += 'Do NOT write "The verses above" or "The retrieved Shabad". Let the Shabad feel natural in the flow.';
      } else {
        prompt += '\n\nNo Gurbani verse strongly matched this query. Do NOT give generic spiritual advice. Say honestly: "I searched but couldn\'t find a direct Shabad for this. However, this related teaching..." and share general wisdom. Be honest — lack of a direct verse match does not mean lack of wisdom. You may share a general Gurmat principle that relates.';
      }

      const res = await apiCall(history, prompt, abortCtrl.signal);
      const ct = res.headers.get('content-type') || '';
      let thinkCleared = false;

      if (ct.includes('stream') || res.headers.get('x-powered-by')?.includes('Groq') || res.body) {
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop();

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const d = line.slice(6).trim();
            if (d === '[DONE]') break;
            try {
              const p = JSON.parse(d);
              const tok = p.choices?.[0]?.delta?.content || '';
              if (tok) {
                if (!thinkCleared) { think.remove(); tw.start(bodyEl); thinkCleared = true; }
                full += tok; tw.push(tok);
              }
            } catch { }
          }
        }
        if (!thinkCleared) think.remove();
      } else {
        const d = await res.json();
        full = d.content || d.message || d.response || '';
        think.remove();
        tw.start(bodyEl);
        tw.push(full);
        await new Promise(r => setTimeout(r, 30));
      }

      tw.finish();
      if (full) {
        const displayFull = full.replace(/<!--GB-->/g, '').trim();

        if (gurbaniBlock) {
          const cardWrapper = document.createElement('div');
          cardWrapper.innerHTML = gurbaniBlock.html;
          const contentEl = msgEl.querySelector('.msg-content');
          if (contentEl) {
            contentEl.appendChild(cardWrapper.firstElementChild);
          }
          addReadingEntryFromPipeline(pipelineResult);
        }

        history.push({ role: 'assistant', content: displayFull });
        saveHistory();
        addMsgActions(msgEl, displayFull, gBookmarks);
      }
    } catch (err) {
      tw.abort();
      if (err.name === 'AbortError') {
        if (!full) bodyEl.innerHTML = '<em style="color:var(--text-muted)">Stopped.</em>';
        else addMsgActions(msgEl, full || '', gBookmarks);
      } else {
        think.remove();
        bodyEl.innerHTML = `<div class="err-bbl">⚠️ ${esc(err.message || 'Something went wrong.')}</div>`;
      }
      if (full) {
        var fullText = full.replace(/<!--GB-->/g, '').trim();
        if (gurbaniBlockText) fullText = gurbaniBlockText + '\n\n---\n\n' + fullText;
        history.push({ role: 'assistant', content: fullText }); saveHistory();
      }
    } finally {
      streaming = false; abortCtrl = null;
      setStreamUI(false);
      scrollBot(true);
      updateInput();
      inp.focus();
    }
  }

  function setStreamUI(on) {
    sendBtn.style.display = on ? 'none' : 'flex';
    stopBtn.classList.toggle('show', on);
  }

  function updateInput() {
    const ok = inp.value.trim().length > 0 && !streaming;
    sendBtn.disabled = !ok;
    sendBtn.classList.toggle('ready', ok);
  }

  function grow() {
    inp.style.height = 'auto';
    inp.style.height = Math.min(inp.scrollHeight, 120) + 'px';
  }

  function updateCharCount() {
    const l = inp.value.length;
    if (l > 100) { charCount.textContent = `${2000 - l}`; charCount.classList.add('show'); charCount.classList.toggle('warn', l > 1900); }
    else charCount.classList.remove('show');
  }

  function closeSidebar() {
    sidebar.classList.remove('open'); sidebarOv.classList.remove('open');
    if (menuBtn) menuBtn.classList.remove('open');
  }

  /* ── Setup ── */
  function setup() {
    inp.addEventListener('input', () => { grow(); updateInput(); updateCharCount(); });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!streaming && inp.value.trim()) sendMsg(inp.value); }
    });
    sendBtn.addEventListener('click', () => { if (!streaming && inp.value.trim()) sendMsg(inp.value); });
    stopBtn.addEventListener('click', () => { if (abortCtrl) { abortCtrl.abort(); abortCtrl = null; } showToast('Stopped'); });

    document.querySelectorAll('.suggestion-card').forEach(c => c.addEventListener('click', () => sendMsg(c.dataset.prompt)));

    const editBtn = $('editBtn'), newConvoBtn = $('newConvoBtn');
    if (editBtn) editBtn.addEventListener('click', clearAll);
    if (newConvoBtn) newConvoBtn.addEventListener('click', clearAll);

    const searchInput = $('convosSearch');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        renderPrevConvos(this.value);
      });
    }

    const menuBtn = $('menuBtn');
    function toggleSidebar() {
      const o = !sidebar.classList.contains('open');
      sidebar.classList.toggle('open', o); sidebarOv.classList.toggle('open', o);
      if (menuBtn) menuBtn.classList.toggle('open', o);
      if (o) {
        if (searchInput) { searchInput.value = ''; }
        renderPrevConvos();
        renderReadingHistory();
        if (window.__updateUI) window.__updateUI();
        if (searchInput) setTimeout(function() { searchInput.focus(); }, 350);
      }
    }
    if (menuBtn) menuBtn.addEventListener('click', toggleSidebar);
    const sidebarClose = $('sidebarClose');
    if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
    if (sidebarOv) sidebarOv.addEventListener('click', closeSidebar);
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar(); });

    const bmarksSidebarBtn = $('bmarksSidebarBtn');
    if (bmarksSidebarBtn) {
      bmarksSidebarBtn.addEventListener('click', function() {
        closeSidebar();
        if (gBookmarks) {
          const bmList = $('bmarksList');
          const bmOv = $('bmarksOv');
          if (bmList) gBookmarks.render(bmList);
          if (bmOv) bmOv.classList.add('open');
        } else {
          showToast('Bookmarks not available');
        }
      });
    }

    const themeSidebarBtn = $('themeSidebarBtn');
    if (themeSidebarBtn) {
      themeSidebarBtn.addEventListener('click', function() {
        closeSidebar();
        if (gTheme) gTheme.toggle();
      });
    }

    const aboutSidebarBtn = $('aboutSidebarBtn');
    if (aboutSidebarBtn) {
      aboutSidebarBtn.addEventListener('click', function() {
        closeSidebar();
        showToast('ANHAD Gurbani Companion v4 \u2014 Waheguru Ji Ka Khalsa');
      });
    }

    const debugSidebarBtn = $('debugSidebarBtn');
    if (debugSidebarBtn) {
      debugSidebarBtn.addEventListener('click', function() {
        closeSidebar();
        debugPanel.toggle();
        showToast(debugPanel.isOpen() ? 'Debug panel open' : 'Debug panel closed');
      });
    }

    msgList.addEventListener('click', async function(e) {
      var btn = e.target.closest('.gb-full-btn');
      if (!btn) return;
      var shabadId = btn.dataset.shabadId;
      if (!shabadId) return;
      showToast('Loading full Shabad...');
      try {
        var fullData = await rag.getShabad(shabadId);
        if (!fullData || !fullData.verses) { showToast('Could not load full Shabad'); return; }
        var verses = fullData.verses.slice(0, 8);
        var text = verses.map(function(v) {
          var parts = [];
          if (v.verse && v.verse.unicode) parts.push(v.verse.unicode);
          if (v.translation && v.translation.en && v.translation.en.bdb) parts.push(v.translation.en.bdb);
          return parts.join('\n');
        }).join('\n\n');
        var tempDiv = document.createElement('div');
        tempDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9998;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:20px';
        tempDiv.innerHTML = '<div style="max-width:500px;max-height:80vh;overflow-y:auto;background:var(--surface-elevated);border-radius:16px;padding:24px;font-size:14px;line-height:1.8;color:var(--text)"><pre style="white-space:pre-wrap;font-family:var(--font-gurmukhi,serif);font-size:16px;line-height:2">' + esc(text) + '</pre><button id="shabad-modal-close" style="margin-top:16px;padding:8px 20px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text);cursor:pointer;font-size:13px">Close</button></div>';
        document.body.appendChild(tempDiv);
        tempDiv.querySelector('#shabad-modal-close').addEventListener('click', function() { tempDiv.remove(); });
        tempDiv.addEventListener('click', function(e) { if (e.target === tempDiv) tempDiv.remove(); });
      } catch { showToast('Error loading full Shabad'); }
    });

    const bmarksBtn = $('bmarksBtn'), optBmarks = $('optBmarks');
    const bmarksOv = $('bmarksOv'), bmarksClose = $('bmarksClose'), bmarksList = $('bmarksList');
    if (bmarksBtn) bmarksBtn.addEventListener('click', () => { closeSidebar(); openBmarks(); });
    if (optBmarks) optBmarks.addEventListener('click', () => { closeMoreMenu(); openBmarks(); });
    if (bmarksClose) bmarksClose.addEventListener('click', () => bmarksOv.classList.remove('open'));
    if (bmarksOv) bmarksOv.addEventListener('click', e => { if (e.target === bmarksOv) bmarksOv.classList.remove('open'); });
    function openBmarks() { if (gBookmarks && bmarksList) gBookmarks.render(bmarksList); if (bmarksOv) bmarksOv.classList.add('open'); }

    const moreMenuBtn = $('moreMenuBtn'), moreDD = $('moreMenuDropdown');
    let ddOpen = false;
    function closeMoreMenu() { ddOpen = false; if (moreDD) moreDD.classList.remove('open'); }
    if (moreMenuBtn) {
      moreMenuBtn.addEventListener('click', e => { e.stopPropagation(); ddOpen = !ddOpen; moreDD.classList.toggle('open', ddOpen); });
    }
    document.addEventListener('click', e => {
      if (ddOpen && moreDD && !moreDD.contains(e.target) && e.target !== moreMenuBtn) closeMoreMenu();
    });

    const exportBtn = $('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', () => {
      if (!history.length) { showToast('Nothing to export'); closeSidebar(); return; }
      let txt = `${displayName} \u2014 Conversation\n${'='.repeat(40)}\n${new Date().toLocaleDateString()}\n\n`;
      history.forEach(m => { txt += (m.role === 'user' ? 'You' : displayName) + '\n' + m.content + '\n\n'; });
      txt += `${'-'.repeat(40)}\nWaheguru Ji Ki Kirpa \u2014 ANHAD`;
      const a = document.createElement('a');
      a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(txt);
      a.download = 'gurbani-companion-conversation.txt';
      a.click(); showToast('Exported');
      closeSidebar();
    });

    const moodToggle = $('moodToggle'), optMood = $('optMood');
    const moodOv = $('moodOv'), moodClose = $('moodCloseBtn'), addBtn = $('addBtn');
    const moodOpts = document.querySelectorAll('.mood-opt');
    function openMood() {
      const cur = gMood();
      moodOpts.forEach(o => { const s = o.dataset.mood === cur; o.classList.toggle('sel', s); const c = o.querySelector('.mood-check'); if (c) c.textContent = s ? '✓' : ''; });
      moodOv.classList.add('open');
    }
    function closeMood() { moodOv.classList.remove('open'); }
    if (moodToggle) moodToggle.addEventListener('click', () => { closeSidebar(); openMood(); });
    if (optMood) optMood.addEventListener('click', () => { closeMoreMenu(); openMood(); });
    if (addBtn) addBtn.addEventListener('click', openMood);
    if (moodClose) moodClose.addEventListener('click', closeMood);
    if (moodOv) moodOv.addEventListener('click', e => { if (e.target === moodOv) closeMood(); });
    moodOpts.forEach(o => {
      o.addEventListener('click', () => {
        moodOpts.forEach(x => { x.classList.remove('sel'); const c = x.querySelector('.mood-check'); if (c) c.textContent = ''; });
        o.classList.add('sel'); const c = o.querySelector('.mood-check'); if (c) c.textContent = '✓';
        if (getMood) getMood().set(o.dataset.mood);
        setTimeout(() => { closeMood(); showToast('Context set'); }, 220);
      });
    });

    const lengthToggle = $('lengthToggle'), optLength = $('optLength');
    const lengthRow = $('lengthRow'), optLenVal = $('optLengthVal');
    if (lengthToggle) lengthToggle.addEventListener('click', () => { lengthRow.classList.toggle('vis'); closeSidebar(); });
    if (optLength) {
      optLength.addEventListener('click', () => {
        if (getLength) { const n = getLength() === 'brief' ? 'detailed' : 'brief'; getLength().set(n); if (optLenVal) optLenVal.textContent = n.charAt(0).toUpperCase() + n.slice(1); document.querySelectorAll('.len-btn').forEach(b => b.classList.toggle('sel', b.dataset.len === n)); showToast('Length: ' + n); }
      });
    }
    document.querySelectorAll('.len-btn').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.len-btn').forEach(x => x.classList.remove('sel')); b.classList.add('sel');
        if (getLength) getLength().set(b.dataset.len);
        if (optLenVal) optLenVal.textContent = b.dataset.len.charAt(0).toUpperCase() + b.dataset.len.slice(1);
        showToast('Length: ' + b.dataset.len);
      });
    });

    const themeBtn = $('themeBtn'), optTheme = $('optTheme');
    if (themeBtn) themeBtn.addEventListener('click', () => { if (gTheme) gTheme.toggle(); });
    if (optTheme) optTheme.addEventListener('click', () => { closeMoreMenu(); if (gTheme) gTheme.toggle(); });

    const optClear = $('optClear');
    if (optClear) optClear.addEventListener('click', () => { closeMoreMenu(); clearAll(); showToast('Cleared'); });

    /* ── Memory UI ── */
    const statsEl = $('memoryStats'), resetBtn = $('memoryResetBtn'), timelineEl = $('journeyTimeline');
    function updateMemUI() {
      if (!statsEl || !gMemory) return;
      const s = gMemory.getStats();
      const j = gMemory.getJourney();
      let html = '<div style="font-size:13px;line-height:1.7"><b>Sessions:</b> ' + s.sessions + ' \u00B7 <b>Messages:</b> ' + s.messages + '</div>';
      if (s.summary) html += '<div style="font-size:11px;opacity:0.6;margin-top:4px">' + esc(s.summary) + '</div>';
      statsEl.innerHTML = html;

      if (timelineEl) {
        if (!j.length) { timelineEl.innerHTML = '<div style="font-size:12px;opacity:0.4;padding:8px 12px">Journey begins when you chat...</div>'; return; }
        timelineEl.innerHTML = j.map(function(m) { return '<div class="journey-item"><span class="journey-week">Week ' + m.week + '</span><span class="journey-event">' + esc(m.event) + '</span></div>'; }).join('');
      }
    }
    if (resetBtn && gMemory) {
      resetBtn.addEventListener('click', function() { gMemory.reset(); updateMemUI(); showToast('Memory reset'); });
    }

    if (sidebar) {
      window.__updateUI = function() { updateMemUI(); renderReadingHistory(); };
    }

    const micBtn = $('micBtn');
    if (micBtn) {
      micBtn.addEventListener('click', () => {
        if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) { showToast('Voice not supported'); return; }
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const r = new SR(); r.lang = 'pa-IN'; r.interimResults = false; r.maxAlternatives = 1;
        r.start(); showToast('Listening...', 4000);
        r.onresult = e => { inp.value = e.results[0][0].transcript; grow(); updateInput(); };
        r.onerror = () => showToast('Voice error');
      });
    }

    msgs.addEventListener('scroll', () => { try { sessionStorage.setItem('gpt_scroll', msgs.scrollTop); } catch { } });

    document.addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        debugPanel.toggle();
        showToast(debugPanel.isOpen() ? 'Debug panel open' : 'Debug panel closed');
      }
    });
  }

  return { sendMsg, clearAll, loadHistory, saveHistory, getHistory: () => history };
}
