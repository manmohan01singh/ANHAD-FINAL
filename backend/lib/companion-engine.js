/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD COMPANION RELATIONSHIP ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Manages explicit second-level Amrit Vela Companion designation and per-companion
 * notification preferences. Strict isolation: Friendship != Companion.
 */

const path = require('path');
const fs = require('fs');
const friendsEngine = require('./friends-engine');
const { getUser } = require('./auth-middleware');

const COMPANION_DATA_FILE = path.join(__dirname, '..', 'data', 'companion-data.json');

class CompanionEngine {
  constructor() {
    // Key: `${userUid}:${friendUid}` -> { userUid, friendUid, isCompanion: boolean, notify: boolean, updatedAt }
    this.companionSettings = new Map();
    this.loadFromDisk();
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(COMPANION_DATA_FILE)) {
        const raw = fs.readFileSync(COMPANION_DATA_FILE, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach(s => {
            if (s && s.userUid && s.friendUid) {
              this.companionSettings.set(this.getSettingKey(s.userUid, s.friendUid), s);
            }
          });
        }
      }
    } catch (e) {
      console.warn('[CompanionEngine] companion-data.json load note:', e.message);
    }
  }

  saveToDisk() {
    try {
      const dir = path.dirname(COMPANION_DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const list = Array.from(this.companionSettings.values());
      fs.writeFileSync(COMPANION_DATA_FILE, JSON.stringify(list, null, 2), 'utf8');
    } catch (e) {
      console.warn('[CompanionEngine] companion-data.json save note:', e.message);
    }
  }

  getSettingKey(userUid, friendUid) {
    return `${userUid}:${friendUid}`;
  }

  /**
   * Designate or un-designate a friend as an Amrit Vela Companion
   */
  setCompanion(userUid, friendUid, isCompanion) {
    if (!userUid || !friendUid) throw { status: 400, message: 'Both user ID and friend ID are required' };
    if (!friendsEngine.isFriend(userUid, friendUid)) {
      throw { status: 400, message: 'Cannot add as companion: Users must be mutual friends first' };
    }

    const key = this.getSettingKey(userUid, friendUid);
    const existing = this.companionSettings.get(key) || {
      userUid,
      friendUid,
      isCompanion: false,
      notify: false
    };

    existing.isCompanion = Boolean(isCompanion);
    // If companion is turned OFF, notifications also disable
    if (!existing.isCompanion) {
      existing.notify = false;
    }
    existing.updatedAt = new Date().toISOString();

    this.companionSettings.set(key, existing);
    this.saveToDisk();
    return { ok: true, setting: existing };
  }

  /**
   * Toggle independent notification ON/OFF for a companion
   */
  setNotification(userUid, friendUid, notify) {
    if (!userUid || !friendUid) throw { status: 400, message: 'Both user ID and friend ID are required' };
    const key = this.getSettingKey(userUid, friendUid);
    const existing = this.companionSettings.get(key);

    if (!existing || !existing.isCompanion) {
      throw { status: 400, message: 'Cannot set notification: User is not an active companion' };
    }

    existing.notify = Boolean(notify);
    existing.updatedAt = new Date().toISOString();

    this.companionSettings.set(key, existing);
    this.saveToDisk();
    return { ok: true, setting: existing };
  }

  /**
   * Get all close companions for a user
   */
  getCompanions(userUid) {
    const list = [];
    for (const [key, val] of this.companionSettings.entries()) {
      if (val.userUid === userUid && val.isCompanion) {
        // Double check friendship is still active
        if (friendsEngine.isFriend(userUid, val.friendUid)) {
          const u = getUser(val.friendUid) || { uid: val.friendUid, username: 'sangat', displayName: 'Gursikh Sangat' };
          list.push({
            uid: u.uid,
            username: u.username,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl || null,
            streak: u.streak || 0,
            notify: val.notify,
            since: val.updatedAt
          });
        }
      }
    }
    return list;
  }

  /**
   * Find all users who have marked `targetUid` as their Companion AND have notifications ON
   */
  getSubscribedCompanions(targetUid) {
    const subscribers = [];
    for (const val of this.companionSettings.values()) {
      if (val.friendUid === targetUid && val.isCompanion && val.notify) {
        if (friendsEngine.isFriend(val.userUid, targetUid)) {
          subscribers.push(val.userUid);
        }
      }
    }
    return subscribers;
  }
}

const companionSingleton = new CompanionEngine();
companionSingleton.CompanionEngine = CompanionEngine;
module.exports = companionSingleton;
