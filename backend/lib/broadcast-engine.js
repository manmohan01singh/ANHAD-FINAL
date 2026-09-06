/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD ADMIN GLOBAL BROADCAST NOTIFICATION ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Allows authorized administrators to broadcast push notifications & alerts
 * to all devices worldwide (PWA, Android, iOS) with custom Gurmukhi/English text,
 * floral/celestial emojis, deep links, priority flags, and persistent history.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const firebaseAdmin = require('./firebase-admin');

const DATA_FILE = path.join(__dirname, '..', 'data', 'broadcasts.json');

class BroadcastEngine {
  constructor() {
    this.broadcasts = [];
    this.loadFromDisk();
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        this.broadcasts = JSON.parse(raw);
        if (!Array.isArray(this.broadcasts)) this.broadcasts = [];
      } else {
        this.broadcasts = [];
        this.saveToDisk();
      }
    } catch (err) {
      console.warn('[BroadcastEngine] Error loading broadcasts.json:', err.message);
      this.broadcasts = [];
    }
  }

  saveToDisk() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.broadcasts, null, 2), 'utf8');
    } catch (err) {
      console.error('[BroadcastEngine] Error saving broadcasts.json:', err.message);
    }
  }

  /**
   * Broadcast a notification to all devices
   * @param {Object} payload
   */
  async broadcast({
    title,
    body,
    subtitle = '',
    category = 'admin_broadcast',
    emoji = '🌸',
    deepLink = '/',
    sound = 'default',
    priority = 'high',
    ttlHours = 72,
    createdBy = 'admin'
  }) {
    if (!title || !title.trim()) {
      throw new Error('Notification title is required');
    }
    if (!body || !body.trim()) {
      throw new Error('Notification body message is required');
    }

    const now = Date.now();
    const id = 'bc_' + now + '_' + crypto.randomBytes(4).toString('hex');
    const expiresAt = now + (Number(ttlHours) || 72) * 3600 * 1000;

    const broadcastItem = {
      id,
      title: title.trim(),
      body: body.trim(),
      subtitle: subtitle ? subtitle.trim() : '',
      category: category || 'admin_broadcast',
      emoji: emoji || '🌸',
      deepLink: deepLink || '/',
      sound: sound || 'default',
      priority: priority || 'high',
      createdAt: new Date(now).toISOString(),
      timestamp: now,
      expiresAt,
      createdBy: createdBy || 'admin',
      stats: {
        sent: true,
        fcmDispatched: false,
        fcmMessageId: null,
        fcmError: null
      }
    };

    // Attempt Firebase Cloud Messaging Topic Broadcast if initialized
    try {
      const messaging = firebaseAdmin.getMessaging ? firebaseAdmin.getMessaging() : null;
      if (messaging) {
        const fcmPayload = {
          topic: 'all_devices',
          notification: {
            title: (broadcastItem.emoji ? broadcastItem.emoji + ' ' : '') + broadcastItem.title,
            body: broadcastItem.body
          },
          data: {
            broadcastId: id,
            category: broadcastItem.category,
            deepLink: broadcastItem.deepLink,
            priority: broadcastItem.priority,
            timestamp: String(now)
          },
          android: {
            priority: 'high',
            notification: {
              channelId: 'anhad_spiritual_reminders',
              sound: 'default',
              clickAction: 'FLUTTER_NOTIFICATION_CLICK'
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1
              }
            }
          }
        };

        const fcmRes = await messaging.send(fcmPayload);
        broadcastItem.stats.fcmDispatched = true;
        broadcastItem.stats.fcmMessageId = fcmRes;
        console.log('[BroadcastEngine] FCM broadcast dispatched successfully:', fcmRes);
      } else {
        console.log('[BroadcastEngine] FCM messaging not active, broadcast recorded for in-app client sync');
      }
    } catch (fcmErr) {
      console.warn('[BroadcastEngine] FCM dispatch warning (client sync active):', fcmErr.message);
      broadcastItem.stats.fcmError = fcmErr.message;
    }

    // Prepend to array & keep max 200 items in history
    this.broadcasts.unshift(broadcastItem);
    if (this.broadcasts.length > 200) {
      this.broadcasts = this.broadcasts.slice(0, 200);
    }
    this.saveToDisk();

    return broadcastItem;
  }

  /**
   * Get all active non-expired broadcasts
   * @param {number} since - optional millisecond timestamp
   */
  getActiveBroadcasts(since = 0) {
    const now = Date.now();
    const sinceNum = Number(since) || 0;
    return this.broadcasts.filter(b => {
      const notExpired = !b.expiresAt || b.expiresAt > now;
      const afterSince = b.timestamp > sinceNum;
      return notExpired && afterSince;
    });
  }

  /**
   * Get full history (including stats) for Admin Console
   */
  getAllBroadcasts() {
    return [...this.broadcasts];
  }

  /**
   * Delete broadcast by ID
   * @param {string} id
   */
  deleteBroadcast(id) {
    const initialLen = this.broadcasts.length;
    this.broadcasts = this.broadcasts.filter(b => b.id !== id);
    const deleted = this.broadcasts.length < initialLen;
    if (deleted) this.saveToDisk();
    return deleted;
  }
}

module.exports = new BroadcastEngine();
