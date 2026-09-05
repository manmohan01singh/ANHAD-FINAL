/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD COMPANION NOTIFICATION ENGINE & AMRIT VELA ANTI-SPAM SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 * Dispatches verified Amrit Vela notifications to subscribed companions with
 * strict 4-hour cooldowns, deduplication, and in-app Notification Center integration.
 */

const companionEngine = require('./companion-engine');
const { getUser } = require('./auth-middleware');

class CompanionNotificationEngine {
  constructor() {
    // userUid -> lastAmritVelaTriggerTimestamp
    this.lastTriggerTimestamps = new Map();
    // Daily trigger deduplication: `${userUid}:${dateString}` -> boolean
    this.dailyTriggerHashes = new Set();
    // userUid -> [Notification]
    this.inAppNotifications = new Map();
    // userUid -> { timestamp, displayName }
    this.recentAmritVelaStarts = new Map();

    this.COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours anti-spam cooldown
  }

  /**
   * Marks Amrit Vela "Present/Started" and dispatches alerts to subscribed companions
   */
  markAmritVelaStarted(userUid) {
    if (!userUid) throw { status: 401, message: 'Authentication required' };
    const now = Date.now();
    const user = getUser(userUid) || { uid: userUid, displayName: 'Your companion' };

    // Anti-spam Cooldown Check
    const lastTrigger = this.lastTriggerTimestamps.get(userUid) || 0;
    if (now - lastTrigger < this.COOLDOWN_MS) {
      const waitMinutes = Math.ceil((this.COOLDOWN_MS - (now - lastTrigger)) / 60000);
      throw {
        status: 429,
        message: `Amrit Vela notification already broadcasted recently. Cooldown active for ${waitMinutes} more minutes.`,
        cooldownRemainingMinutes: waitMinutes
      };
    }

    // Daily deduplication check
    const today = new Date().toISOString().split('T')[0];
    const dailyHash = `${userUid}:${today}`;
    if (this.dailyTriggerHashes.has(dailyHash)) {
      throw {
        status: 429,
        message: 'Amrit Vela notification already sent for today. Max 1 notification blast per day.',
        code: 'DAILY_LIMIT_REACHED'
      };
    }

    // Record trigger
    this.lastTriggerTimestamps.set(userUid, now);
    this.dailyTriggerHashes.add(dailyHash);
    this.recentAmritVelaStarts.set(userUid, { timestamp: now, displayName: user.displayName });

    // Find subscribed companions who have explicitly enabled notifications
    const subscriberUids = companionEngine.getSubscribedCompanions(userUid);

    const notificationPayload = {
      type: 'amritvela_started',
      title: 'Amrit Vela has begun 🌅',
      message: `Your companion ${user.displayName} has started Amrit Vela. Join your sangat.`,
      senderUid: userUid,
      senderName: user.displayName,
      deepLink: '/nitnem/indexbani.html?source=companion_amritvela',
      createdAt: new Date().toISOString()
    };

    let deliveredCount = 0;
    for (const subUid of subscriberUids) {
      this.deliverNotification(subUid, {
        id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        ...notificationPayload
      });
      deliveredCount++;
    }

    return {
      ok: true,
      message: 'Amrit Vela broadcasted to selected companions',
      deliveredToCount: deliveredCount,
      timestamp: new Date().toISOString()
    };
  }

  deliverNotification(recipientUid, notif) {
    let list = this.inAppNotifications.get(recipientUid);
    if (!list) {
      list = [];
      this.inAppNotifications.set(recipientUid, list);
    }
    list.unshift({ ...notif, read: false });
    // Keep max 50 recent notifications
    if (list.length > 50) list.pop();
  }

  getNotifications(recipientUid) {
    return this.inAppNotifications.get(recipientUid) || [];
  }

  markAsRead(recipientUid, notifId) {
    const list = this.inAppNotifications.get(recipientUid) || [];
    const item = list.find(n => n.id === notifId);
    if (item) item.read = true;
    return { ok: true, notifId };
  }

  clearNotifications(recipientUid) {
    this.inAppNotifications.set(recipientUid, []);
    return { ok: true };
  }

  /**
   * "Sangat is Gathering" detection:
   * Checks if 2 or more of the user's Companions started Amrit Vela in the last 60 minutes
   */
  checkSangatGathering(userUid) {
    const companions = companionEngine.getCompanions(userUid);
    const now = Date.now();
    const threshold = now - (60 * 60 * 1000); // 60 minutes

    const activeCompanions = [];
    for (const c of companions) {
      const startInfo = this.recentAmritVelaStarts.get(c.uid);
      if (startInfo && startInfo.timestamp > threshold) {
        activeCompanions.push(startInfo.displayName || c.displayName);
      }
    }

    return {
      isGathering: activeCompanions.length >= 2,
      activeCount: activeCompanions.length,
      companionNames: activeCompanions,
      message: activeCompanions.length >= 2
        ? `🌅 Sangat is Gathering: ${activeCompanions[0]} and ${activeCompanions.length - 1} other companion(s) are practicing Amrit Vela right now.`
        : null
    };
  }
}

const notificationSingleton = new CompanionNotificationEngine();
notificationSingleton.CompanionNotificationEngine = CompanionNotificationEngine;
module.exports = notificationSingleton;
