/* ═══════════════════════════════════════════════════════════════════
   ANHAD — Scroll & Header System (Items 7–13)
   Typewriter, morphing header, clock, bell, calendar, subtitle, avatar
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

const ScrollSystem = {
  scrollP: 0,
  lastY: 0,
  subtitleIndex: 0,

  greetings: {
    amritvela: 'ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖਾਲਸਾ',
    dawn: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ',
    morning: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ',
    afternoon: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ',
    dusk: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ',
    night: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ',
  },

  subtitles: [
    'The ambrosial hours',
    'Waheguru is everywhere',
    'Chardi Kala always',
  ],

  init() {
    this._setupScroll();
    this._typewriterGreeting();
    this._startClock();
    this._startSubtitleCycle();
    this._setupBell();
    this._setNanakshahiDate();
    this._setupNavHide();
  },

  /* Item 8: Morphing Collapse Header */
  _setupScroll() {
    const root = document.documentElement;
    window.addEventListener('scroll', () => {
      const p = Math.min(window.scrollY / 80, 1);
      this.scrollP = p;
      root.style.setProperty('--scroll-p', p);

      const header = document.querySelector('.app-header-v2');
      if (header) header.classList.toggle('scrolled', p > 0.1);

      const miniPill = document.querySelector('.mini-pill');
      if (miniPill) miniPill.classList.toggle('visible', p > 0.8);
    }, { passive: true });
  },

  /* Item 7: Typewriter Greeting */
  _typewriterGreeting() {
    const el = document.getElementById('greetingText');
    const cursor = document.getElementById('greetingCursor');
    if (!el) return;

    const h = new Date().getHours();
    let key = 'morning';
    if (h >= 3 && h < 5) key = 'amritvela';
    else if (h >= 5 && h < 7) key = 'dawn';
    else if (h >= 12 && h < 17) key = 'afternoon';
    else if (h >= 17 && h < 20) key = 'dusk';
    else if (h >= 20 || h < 3) key = 'night';

    const text = this.greetings[key];
    el.textContent = '';
    let i = 0;
    const type = () => {
      if (i < text.length) {
        el.textContent += text[i];
        i++;
        requestAnimationFrame(() => setTimeout(type, 40));
      } else {
        let blinks = 0;
        const blinkInterval = setInterval(() => {
          blinks++;
          if (blinks >= 6) {
            clearInterval(blinkInterval);
            if (cursor) cursor.classList.add('hidden');
          }
        }, 300);
      }
    };
    requestAnimationFrame(() => setTimeout(type, 300));
  },

  /* Item 9: Live Clock */
  _startClock() {
    const el = document.getElementById('liveClock');
    if (!el) return;
    const update = () => {
      const now = new Date();
      el.textContent = now.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit'
      });
    };
    update();
    setInterval(update, 1000);
  },

  /* Item 12: Animated Subtitle */
  _startSubtitleCycle() {
    const container = document.querySelector('.subtitle-line');
    if (!container) return;

    let current = document.createElement('span');
    current.className = 'subtitle-text fading-in';
    current.textContent = this.subtitles[0];
    container.appendChild(current);

    setInterval(() => {
      this.subtitleIndex = (this.subtitleIndex + 1) % this.subtitles.length;
      current.classList.remove('fading-in');
      current.classList.add('fading-out');
      requestAnimationFrame(() => {
        setTimeout(() => {
          current.textContent = this.subtitles[this.subtitleIndex];
          current.classList.remove('fading-out');
          current.classList.add('fading-in');
        }, 400);
      });
    }, 5000);
  },

  /* Item 10: Bell Animation */
  _setupBell() {
    const bell = document.getElementById('bellBtn');
    if (!bell) return;
    bell.classList.add('ringing');
    setTimeout(() => bell.classList.remove('ringing'), 700);
    bell.addEventListener('click', () => {
      bell.classList.add('ringing');
      setTimeout(() => bell.classList.remove('ringing'), 700);
      if (navigator.vibrate) navigator.vibrate(8);
    });
  },

  /* Item 11: Nanakshahi Calendar Date */
  _setNanakshahiDate() {
    const el = document.getElementById('nanakshahiDate');
    if (!el) return;
    const now = new Date();
    const gMonth = now.getMonth();
    const gDay = now.getDate();
    const nanakMonths = ['ਚੇਤ','ਵੈਸਾਖ','ਜੇਠ','ਹਾੜ','ਸਾਵਣ','ਭਾਦੋਂ','ਅੱਸੂ','ਕੱਤਕ','ਮੱਘਰ','ਪੋਹ','ਮਾਘ','ਫੱਗਣ'];
    const punjabiNums = n => String(n).replace(/[0-9]/g, d => '੦੧੨੩੪੫੬੭੮੯'[d]);
    let nMonth, nDay, nYear;
    if (gMonth >= 2 && gMonth <= 11) {
      const baseMonth = (gMonth - 2) % 12;
      nMonth = nanakMonths[baseMonth < 0 ? baseMonth + 12 : baseMonth];
      nDay = gDay;
      nYear = now.getFullYear() - 1469;
    } else {
      nMonth = nanakMonths[gMonth >= 0 && gMonth <= 1 ? 10 + gMonth : 0];
      nDay = gDay;
      nYear = now.getFullYear() - 1469 - (gMonth <= 1 ? 1 : 0);
    }
    el.textContent = `${punjabiNums(nDay)} ${nMonth}, ਨਾਨਕਸ਼ਾਹੀ ${punjabiNums(nYear)}`;

    const gurpurabs = [
      { m: 0, d: 5, name: 'ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ ਪ੍ਰਕਾਸ਼ ਪੁਰਬ' },
      { m: 3, d: 14, name: 'ਵਿਸਾਖੀ' },
      { m: 10, d: 15, name: 'ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ ਪ੍ਰਕਾਸ਼ ਪੁਰਬ' },
    ];
    const today = gurpurabs.find(g => g.m === gMonth && g.d === gDay);
    if (today) {
      el.classList.add('gurpurab');
      el.textContent += ` — ${today.name}`;
    }
  },

  /* Item 45: Hide Nav on Scroll Down */
  _setupNavHide() {
    const nav = document.querySelector('.nav-pill-v2');
    if (!nav) return;
    let lastY = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > lastY && y > 80) {
        nav.classList.add('hidden');
      } else {
        nav.classList.remove('hidden');
      }
      lastY = y;
    }, { passive: true });
  }
};

window.ScrollSystem = ScrollSystem;
