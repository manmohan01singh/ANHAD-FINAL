const BM_STORE = 'gurbanigpt_bmarks';

export function initBookmarks() {
  function getAll() {
    try { return JSON.parse(localStorage.getItem(BM_STORE) || '[]'); } catch { return []; }
  }

  function save(arr) {
    try { localStorage.setItem(BM_STORE, JSON.stringify(arr)); } catch {}
  }

  function add(text) {
    const list = getAll();
    if (!list.some(b => b.text === text)) {
      list.unshift({ text, date: new Date().toLocaleDateString() });
      if (list.length > 50) list.pop();
      save(list);
    }
  }

  function remove(index) {
    const list = getAll();
    list.splice(index, 1);
    save(list);
  }

  function render(container) {
    const list = getAll();
    if (!list.length) {
      container.innerHTML = '<div class="bmarks-empty">No saved messages yet.<br>Tap "Save" on any reply.</div>';
      return;
    }
    container.innerHTML = list.map((b, i) => `
      <div class="bmark-item">
        <button class="bmark-del" data-index="${i}" title="Remove" aria-label="Remove saved message">✕</button>
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px">${b.date}</div>
        <div>${escapeHtml(b.text.slice(0, 280))}${b.text.length > 280 ? '…' : ''}</div>
      </div>`).join('');

    container.querySelectorAll('.bmark-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        remove(idx);
        render(container);
      });
    });
  }

  return { add, remove, render, getAll };
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
