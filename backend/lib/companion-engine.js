/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD COMPANION RELATIONSHIP ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Manages explicit second-level Amrit Vela Companion designation and per-companion
 * notification preferences. Strict isolation: Friendship != Companion.
 */

const friendsEngine = require('./friends-engine');
const { getUser } = require('./auth-middleware');

class CompanionEngine {
  constructor() {
    // Key: `${userUid}:${friendUid}` -> { userUid, friendUid, isCompanion: boolean, notify: boolean, updatedAt }
    this.companionSettings = new Map();
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
