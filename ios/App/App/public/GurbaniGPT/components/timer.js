export function initTimer() {
  let seconds = 300, total = 300, active = false, rafId = null;
  let lastTick = 0, wahCount = 0, breathPhase = 0;
  let audioCtx = null;
  const CHIME_TOGGLE_KEY = 'gpt_chime';

  const durBtns = document.querySelectorAll('.timer-dur');
  const display = document.getElementById('timerDisplay');
  const breath = document.getElementById('timerBreath');
  const counter = document.getElementById('timerCounter');
  const startBtn = document.getElementById('timerStart');
  const closeBtn = document.getElementById('timerClose');
  const overlay = document.getElementById('timerOv');
  const ring = document.getElementById('breathRing');
  const chimeToggle = document.getElementById('timerChimeToggle');

  if (!display || !breath || !counter || !startBtn || !closeBtn || !overlay) return;

  if (chimeToggle) {
    chimeToggle.checked = localStorage.getItem(CHIME_TOGGLE_KEY) !== 'off';
    chimeToggle.addEventListener('change', () => {
      localStorage.setItem(CHIME_TOGGLE_KEY, chimeToggle.checked ? 'on' : 'off');
    });
  }

  function updateDisplay() {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    display.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function tick(timestamp) {
    if (!active) return;
    if (!lastTick) lastTick = timestamp;
    const delta = timestamp - lastTick;
    if (delta >= 1000) {
      lastTick = timestamp;
      if (seconds <= 0) {
        stop();
        breath.textContent = 'Waheguru Ji \u2014 Simran complete';
        startBtn.textContent = 'Begin Again';
        counter.textContent = '☬ ' + wahCount + ' Waheguru';
        return;
      }
      seconds--;
      wahCount++;
      updateDisplay();
      counter.textContent = '☬ ' + wahCount + ' Waheguru';
      if (wahCount % 30 === 0) {
        breath.textContent = (wahCount % 60 === 0 ? 'Breathe in...' : 'Breathe out...') + ' Waheguru';
      }
    }
    rafId = requestAnimationFrame(tick);
  }

  function breathCycle() {
    if (!active) return;
    const phases = ['Breathe in... Waheguru', 'Hold... Waheguru', 'Breathe out... Waheguru', 'Rest... Waheguru'];
    breath.textContent = phases[breathPhase % 4];
    ring.className = 'breath-ring ' + ((breathPhase % 4 === 0 || breathPhase % 4 === 1) ? 'breathe-in' : 'breathe-out');

    if ((breathPhase % 4 === 0 || breathPhase % 4 === 2) && chimeToggle && chimeToggle.checked) {
      playChime();
    }

    breathPhase++;
    setTimeout(() => { if (active) breathCycle(); }, 4200);
  }

  function playChime() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const now = audioCtx.currentTime;
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const osc3 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.type = 'sine'; osc1.frequency.setValueAtTime(160, now);
      osc2.type = 'sine'; osc2.frequency.setValueAtTime(240, now);
      osc3.type = 'sine'; osc3.frequency.setValueAtTime(400, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);

      osc1.connect(gain); osc2.connect(gain); osc3.connect(gain);
      gain.connect(audioCtx.destination);
      osc1.start(now); osc2.start(now); osc3.start(now);
      osc1.stop(now + 4); osc2.stop(now + 4); osc3.stop(now + 4);
    } catch (err) {
      console.warn('Chime error:', err);
    }
  }

  function start() {
    if (active) { stop(); startBtn.textContent = 'Begin Simran'; return; }
    wahCount = 0; seconds = total; lastTick = 0;
    active = true; startBtn.textContent = 'Pause';
    breath.textContent = 'Breathe in... Waheguru';
    breathPhase = 0;
    updateDisplay();
    rafId = requestAnimationFrame(tick);
    breathCycle();
  }

  function stop() {
    active = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  durBtns.forEach(d => {
    d.addEventListener('click', () => {
      durBtns.forEach(x => x.classList.remove('sel'));
      d.classList.add('sel');
      total = seconds = parseInt(d.dataset.mins, 10) * 60;
      updateDisplay();
      if (!active) breath.textContent = 'Ready to begin';
    });
  });

  startBtn.addEventListener('click', start);
  closeBtn.addEventListener('click', () => { overlay.style.display = 'none'; stop(); });

  overlay.addEventListener('click', e => {
    if (e.target === overlay) { overlay.style.display = 'none'; stop(); }
  });

  function open() { overlay.style.display = 'flex'; }

  return { open, stop };
}
