/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD IN-APP CAMPAIGN & NOTIFICATION CENTER
 * ═══════════════════════════════════════════════════════════════════════════════
 * Mounts the Notification Bell icon in the header, provides a clean drawer
 * displaying active Campaign daily guidance and Companion Amrit Vela alerts,
 * and executes deep links directly into target screens.
 */

(function(window) {
  'use strict';

  if (window.AnhadNotificationCenter) return;

  let panelEl = null;
  let bellBtn = null;
  let badgeEl = null;

  async function fetchActiveCampaign() {
    try {
      const res = await fetch('/api/campaigns/active');
      const data = await res.json();
      return data.campaign || null;
    } catch (e) {
      return null;
    }
  }

  async function fetchNotifications() {
    try {
      if (window.AnhadFriends) {
        return await window.AnhadFriends.getNotifications();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  function createNotificationCenterUI() {
    // Inject Styles
    const style = document.createElement('style');
    style.textContent = `
      .anhad-notif-bell {
        position: relative;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-primary, #1C1C1E);
      }
      .anhad-notif-badge {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #E11D48;
        border: 1.5px solid var(--bg-primary, #FFF);
        display: none;
      }
      .anhad-notif-panel {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        max-width: 400px;
        background: var(--bg-primary, #FAF8F5);
        color: var(--text-primary, #1C1C1E);
        box-shadow: -8px 0 32px rgba(0,0,0,0.25);
        z-index: 3000;
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
        border-left: 1px solid var(--border-color, rgba(0,0,0,0.08));
      }
      .anhad-notif-panel.open {
        transform: translateX(0);
      }
      .anhad-notif-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.4);
        z-index: 2999;
        display: none;
        backdrop-filter: blur(4px);
      }
      .anhad-notif-header {
        padding: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--border-color, rgba(0,0,0,0.08));
      }
      .anhad-notif-title { font-size: 18px; font-weight: 700; }
      .anhad-notif-close { background: none; border: none; font-size: 20px; cursor: pointer; color: inherit; }
      .anhad-notif-body { flex: 1; overflow-y: auto; padding: 16px; }
      .campaign-card {
        background: linear-gradient(135deg, rgba(212,160,58,0.15) 0%, rgba(184,134,11,0.05) 100%);
        border: 1px solid rgba(212,160,58,0.3);
        border-radius: 16px;
        padding: 16px;
        margin-bottom: 20px;
      }
      .campaign-tag { font-size: 11px; font-weight: 800; color: var(--accent, #D4943A); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
      .campaign-heading { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
      .campaign-quote { font-family: 'Noto Sans Gurmukhi', serif; font-size: 14px; color: var(--accent, #D4943A); margin-bottom: 4px; }
      .campaign-en { font-size: 12px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 12px; }
      .campaign-cta {
        display: inline-block;
        background: var(--accent, #D4943A);
        color: #000;
        font-weight: 700;
        font-size: 13px;
        padding: 8px 16px;
        border-radius: 50px;
        text-decoration: none;
        cursor: pointer;
      }
      .notif-item {
        background: var(--bg-secondary, #F2F2F7);
        border-radius: 14px;
        padding: 12px 14px;
        margin-bottom: 10px;
        cursor: pointer;
        transition: background 0.15s;
      }
      .notif-item-title { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
      .notif-item-msg { font-size: 12.5px; color: var(--text-secondary); line-height: 1.4; }
      .notif-item-time { font-size: 11px; color: var(--text-tertiary, #AEAEB2); margin-top: 6px; }
    `;
    document.head.appendChild(style);

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'anhad-notif-backdrop';
    backdrop.id = 'notifBackdrop';
    backdrop.onclick = closeNotificationCenter;
    document.body.appendChild(backdrop);

    // Panel
    panelEl = document.createElement('div');
    panelEl.className = 'anhad-notif-panel';
    panelEl.id = 'notifPanel';
    panelEl.innerHTML = `
      <div class="anhad-notif-header">
        <div class="anhad-notif-title">Notifications & Guidance</div>
        <button class="anhad-notif-close" onclick="window.AnhadNotificationCenter.close()">✕</button>
      </div>
      <div class="anhad-notif-body" id="notifBody">
        <p style="text-align:center; color:var(--text-secondary);">Loading guidance...</p>
      </div>
    `;
    document.body.appendChild(panelEl);

    // Mount bell icon in header if glass nav exists
    const navAction = document.querySelector('.glass-nav__action') || document.querySelector('.app-header-right');
    if (navAction) {
      bellBtn = document.createElement('button');
      bellBtn.className = 'anhad-notif-bell';
      bellBtn.title = 'Notification Center';
      bellBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        <span class="anhad-notif-badge" id="notifBadge"></span>
      `;
      bellBtn.onclick = openNotificationCenter;
      navAction.prepend(bellBtn);
      badgeEl = bellBtn.querySelector('#notifBadge');
    }
  }

  async function openNotificationCenter() {
    if (!panelEl) return;
    document.getElementById('notifBackdrop').style.display = 'block';
    panelEl.classList.add('open');
    if (badgeEl) badgeEl.style.display = 'none';

    const bodyEl = document.getElementById('notifBody');
    const [campaign, notifs] = await Promise.all([fetchActiveCampaign(), fetchNotifications()]);

    let html = '';

    // Campaign Card
    if (campaign && campaign.todayMessage) {
      const msg = campaign.todayMessage;
      html += `
        <div class="campaign-card">
          <div class="campaign-tag">📿 Active Spiritual Journey</div>
          <div class="campaign-heading">${msg.title}</div>
          <div class="campaign-quote">${msg.quoteGurmukhi}</div>
          <div class="campaign-en">${msg.quoteEnglish}</div>
          <a href="${msg.deepLink}" class="campaign-cta" onclick="window.AnhadNotificationCenter.close()">${msg.actionLabel || 'Begin Practice'}</a>
        </div>
      `;
    }

    // Companion Notifications
    html += '<h3 style="font-size:13px; text-transform:uppercase; color:var(--text-secondary); margin:16px 0 10px;">Companion Alerts</h3>';
    if (notifs.length === 0) {
      html += '<p style="font-size:13px; color:var(--text-secondary); text-align:center; padding:20px 0;">No new companion notifications. When your close companions start Amrit Vela, alerts appear here.</p>';
    } else {
      html += notifs.map(n => `
        <div class="notif-item" onclick="window.location.href='${n.deepLink}'; window.AnhadNotificationCenter.close();">
          <div class="notif-item-title">${n.title}</div>
          <div class="notif-item-msg">${n.message}</div>
          <div class="notif-item-time">${new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      `).join('');
    }

    bodyEl.innerHTML = html;
  }

  function closeNotificationCenter() {
    if (!panelEl) return;
    panelEl.classList.remove('open');
    document.getElementById('notifBackdrop').style.display = 'none';
  }

  async function checkUnreadBadge() {
    const notifs = await fetchNotifications();
    const unread = notifs.some(n => !n.read);
    if (badgeEl) {
      badgeEl.style.display = unread ? 'block' : 'none';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    createNotificationCenterUI();
    checkUnreadBadge();
  });

  window.AnhadNotificationCenter = {
    open: openNotificationCenter,
    close: closeNotificationCenter,
    refreshBadge: checkUnreadBadge
  };
})(typeof window !== 'undefined' ? window : globalThis);
