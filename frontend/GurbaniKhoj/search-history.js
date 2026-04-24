/**
 * SEARCH HISTORY PAGE — Premium iOS-style
 * Groups by date, smooth animations, swipe-to-delete
 */

const STORAGE_KEY = 'gurbaniHistory';

// ═══════════════════════════════════════════════════════════════════════════════
// DOM
// ═══════════════════════════════════════════════════════════════════════════════

const $ = (sel) => document.querySelector(sel);
const DOM = {
    mainContent: $('#mainContent'),
    emptyState: $('#emptyState'),
    clearAllBtn: $('#clearAllBtn'),
    backBtn: $('#backBtn'),
    confirmOverlay: $('#confirmOverlay'),
    confirmDelete: $('#confirmDelete'),
    confirmCancel: $('#confirmCancel'),
    toast: $('#toast'),
    toastText: $('#toastText')
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function haptic(style = 'light') {
    if (navigator.vibrate) {
        navigator.vibrate(style === 'light' ? 10 : 20);
    }
}

function showToast(msg) {
    DOM.toastText.textContent = msg;
    DOM.toast.classList.add('show');
    setTimeout(() => DOM.toast.classList.remove('show'), 2500);
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATE GROUPING
// ═══════════════════════════════════════════════════════════════════════════════

function getDateGroup(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const isToday = now.toDateString() === date.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = yesterday.toDateString() === date.toDateString();

    if (isToday) return { key: 'today', label: 'Today' };
    if (isYesterday) return { key: 'yesterday', label: 'Yesterday' };
    if (diffDays < 7) return { key: 'thisWeek', label: 'This Week' };
    if (diffDays < 30) return { key: 'thisMonth', label: 'This Month' };
    return { key: 'older', label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) };
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatRelativeDate(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const isToday = now.toDateString() === date.toDateString();
    if (isToday) return formatTime(timestamp);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (yesterday.toDateString() === date.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════════════

function loadHistory() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveHistory(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function render() {
    const items = loadHistory();

    if (items.length === 0) {
        DOM.mainContent.innerHTML = '';
        DOM.emptyState.classList.add('visible');
        DOM.clearAllBtn.style.opacity = '0.3';
        DOM.clearAllBtn.style.pointerEvents = 'none';
        return;
    }

    DOM.emptyState.classList.remove('visible');
    DOM.clearAllBtn.style.opacity = '1';
    DOM.clearAllBtn.style.pointerEvents = 'auto';

    // Group items by date
    const groups = {};
    const groupOrder = [];

    items.forEach((item, index) => {
        const ts = item.timestamp || item.savedAt || Date.now();
        const group = getDateGroup(ts);

        if (!groups[group.key]) {
            groups[group.key] = { label: group.label, items: [] };
            groupOrder.push(group.key);
        }
        groups[group.key].items.push({ ...item, _index: index, _ts: ts });
    });

    // Build HTML
    let html = '';
    let itemDelay = 0;

    groupOrder.forEach(key => {
        const group = groups[key];
        html += `<section class="history-section" style="animation-delay: ${itemDelay * 30}ms">`;
        html += `<h2 class="section-title">${group.label}</h2>`;
        html += `<div class="section-list">`;

        group.items.forEach(item => {
            const gurmukhi = item.gurmukhi || item.query || '';
            const source = item.source || 'All Sources';
            const timeStr = formatRelativeDate(item._ts);
            const resultsStr = item.resultCount ? `${item.resultCount} results` : '';

            html += `
                <div class="history-row" data-index="${item._index}" style="animation-delay: ${itemDelay * 40}ms">
                    <div class="row-content" onclick="selectItem(${item._index})">
                        <div class="row-gurmukhi">${gurmukhi}</div>
                        <div class="row-meta">
                            <span class="row-source">${source}</span>
                            ${resultsStr ? `<span class="row-dot">·</span><span class="row-results">${resultsStr}</span>` : ''}
                            <span class="row-dot">·</span>
                            <span class="row-time">${timeStr}</span>
                        </div>
                    </div>
                    <button class="row-delete" onclick="deleteItem(${item._index}, event)" aria-label="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                    <div class="row-chevron">›</div>
                </div>
            `;
            itemDelay++;
        });

        html += `</div></section>`;
    });

    DOM.mainContent.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function selectItem(index) {
    const items = loadHistory();
    const item = items[index];
    if (!item) return;

    haptic();

    // Navigate back to Gurbani Khoj with this query pre-filled
    // Save the query to sessionStorage so gurbani-khoj can pick it up
    sessionStorage.setItem('gurbaniKhoj_historyQuery', item.query);
    window.location.href = 'gurbani-khoj.html';
}

function deleteItem(index, event) {
    event.stopPropagation();
    haptic('medium');

    const row = document.querySelector(`.history-row[data-index="${index}"]`);
    if (row) {
        row.classList.add('deleting');
        setTimeout(() => {
            const items = loadHistory();
            items.splice(index, 1);
            saveHistory(items);
            render();
            showToast('Removed');
        }, 300);
    }
}

function clearAll() {
    DOM.confirmOverlay.classList.add('active');
    haptic();
}

function confirmClear() {
    DOM.confirmOverlay.classList.remove('active');
    saveHistory([]);
    // Animate out all rows
    document.querySelectorAll('.history-row').forEach((row, i) => {
        row.style.animationDelay = `${i * 30}ms`;
        row.classList.add('deleting');
    });
    setTimeout(() => {
        render();
        showToast('History cleared');
    }, 400);
    haptic('medium');
}

function cancelClear() {
    DOM.confirmOverlay.classList.remove('active');
}

// ═══════════════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    render();

    // Back button
    DOM.backBtn.addEventListener('click', () => {
        haptic();
        if (window.anhadGoBack) {
            window.anhadGoBack('gurbani-khoj.html');
        } else {
            history.back();
        }
    });

    // Clear all
    DOM.clearAllBtn.addEventListener('click', clearAll);
    DOM.confirmDelete.addEventListener('click', confirmClear);
    DOM.confirmCancel.addEventListener('click', cancelClear);
    DOM.confirmOverlay.querySelector('.confirm-backdrop').addEventListener('click', cancelClear);
});
