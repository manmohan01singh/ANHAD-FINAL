/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD FRONTEND FRIENDS & COMPANION SYSTEM COORDINATOR
 * ═══════════════════════════════════════════════════════════════════════════════
 * Communicates with backend endpoints to manage friends, companions,
 * notification settings, and Amrit Vela start actions.
 */

(function(window) {
  'use strict';

  if (window.AnhadFriends) return;

  async function getAuthHeader() {
    if (window.AnhadAuth) {
      if (typeof window.AnhadAuth.getIdToken === 'function') {
        try {
          const token = await window.AnhadAuth.getIdToken();
          if (token) return { 'Authorization': 'Bearer ' + token };
        } catch (e) {}
      }
      const p = window.AnhadAuth.getProfile();
      if (p && p.uid) return { 'Authorization': 'Bearer ' + p.uid };
    }
    const guestId = localStorage.getItem('anhad_guest_id') || 'guest_user';
    return { 'Authorization': 'Bearer ' + guestId };
  }

  async function api(path, options = {}) {
    const authHeader = await getAuthHeader();
    const headers = {
      'Content-Type': 'application/json',
      ...authHeader,
      ...(options.headers || {})
    };

    const res = await fetch(path, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }
    return data;
  }

  const AnhadFriends = {
    // ── Search ──
    async searchUsers(query) {
      if (!query || query.trim().length < 2) return [];
      const res = await api(`/api/friends/search?q=${encodeURIComponent(query.trim())}`);
      return res.results || [];
    },

    // ── Friend Requests ──
    async sendRequest(target) {
      return await api('/api/friends/request', {
        method: 'POST',
        body: JSON.stringify({ target })
      });
    },

    async respondRequest(requestId, action) {
      return await api('/api/friends/respond', {
        method: 'POST',
        body: JSON.stringify({ requestId, action })
      });
    },

    async removeFriend(friendUid) {
      return await api('/api/friends/remove', {
        method: 'POST',
        body: JSON.stringify({ friendUid })
      });
    },

    async getFriendsList() {
      return await api('/api/friends/list');
    },

    // ── Companions ──
    async setCompanion(friendUid, isCompanion) {
      return await api('/api/companions/set', {
        method: 'POST',
        body: JSON.stringify({ friendUid, isCompanion })
      });
    },

    async setNotification(friendUid, notify) {
      return await api('/api/companions/notification', {
        method: 'POST',
        body: JSON.stringify({ friendUid, notify })
      });
    },

    async getCompanions() {
      const res = await api('/api/companions/list');
      return res.companions || [];
    },

    async checkSangatGathering() {
      return await api('/api/companions/sangat-gathering');
    },

    // ── Amrit Vela Action ──
    async markAmritVelaStarted() {
      return await api('/api/amritvela/start', {
        method: 'POST'
      });
    },

    // ── In-App Notifications ──
    async getNotifications() {
      const res = await api('/api/notifications');
      return res.notifications || [];
    },

    async markNotificationRead(id) {
      return await api(`/api/notifications/${id}/read`, { method: 'POST' });
    },

    async clearNotifications() {
      return await api('/api/notifications', { method: 'DELETE' });
    }
  };

  window.AnhadFriends = AnhadFriends;
})(typeof window !== 'undefined' ? window : globalThis);
