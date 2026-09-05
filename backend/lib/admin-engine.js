/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD ADMIN MONITORING & INTELLIGENCE ENGINE ("WHO IS LIVE NOW")
 * ═══════════════════════════════════════════════════════════════════════════════
 * STRICTLY ADMIN-AUTHORIZED.
 * Powers the real-time live monitoring dashboard for administrators only.
 * Normal users never receive this dataset.
 */

const communityPresence = require('./community-presence');
const friendsEngine = require('./friends-engine');
const companionEngine = require('./companion-engine');
const companionNotifications = require('./companion-notifications');
const campaignEngine = require('./campaign-engine');

class AdminEngine {
  constructor() {
    this.bootTime = Date.now();
  }

  /**
   * Generates the comprehensive Live Now dataset for authorized administrators.
   */
  getWhoIsLiveNow() {
    const now = Date.now();
    const presence = communityPresence.getLivePresence();
    const activeSessions = [];

    // Extract sessions from presence engine
    if (communityPresence.activeSessions) {
      for (const [id, session] of communityPresence.activeSessions.entries()) {
        const isAmritVela = session.activity === 'nitnem' || session.activity === 'simran';
        activeSessions.push({
          uid: id,
          displayName: session.displayName || 'Gursikh Sangat',
          activity: session.activity || 'idle',
          streak: session.streak || 0,
          isPublic: session.isPublic !== false,
          lastSeenAgoSeconds: Math.floor((now - session.lastSeen) / 1000),
          isAmritVelaParticipant: isAmritVela
        });
      }
    }

    // Default simulation if single user / local development node
    if (activeSessions.length === 0) {
      activeSessions.push({
        uid: 'sys_admin_node',
        displayName: 'Broadcast Host',
        activity: 'live_stream',
        streak: 40,
        isPublic: true,
        lastSeenAgoSeconds: 2,
        isAmritVelaParticipant: true
      });
    }

    // Community aggregates
    const totalFriendships = friendsEngine.friendships ? friendsEngine.friendships.size : 0;
    let activeCompanionsCount = 0;
    if (companionEngine.companionSettings) {
      for (const val of companionEngine.companionSettings.values()) {
        if (val.isCompanion) activeCompanionsCount++;
      }
    }

    // Amrit Vela participation details
    const amritVelaUsers = activeSessions.filter(s => s.isAmritVelaParticipant);

    // Server connection health
    const uptimeSeconds = Math.floor((now - this.bootTime) / 1000);
    const memory = process.memoryUsage();

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalActiveUsers: Math.max(activeSessions.length, presence.totalActive || 1),
        activityBreakdown: presence.byActivity || {},
        amritVelaParticipantsCount: amritVelaUsers.length,
        totalFriendshipConnections: totalFriendships,
        activeCompanionsDesignated: activeCompanionsCount
      },
      activeUsers: activeSessions,
      amritVelaParticipants: amritVelaUsers,
      activeCampaign: campaignEngine.getActiveCampaign(),
      systemHealth: {
        uptimeSeconds,
        uptimeFormatted: this.formatUptime(uptimeSeconds),
        heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
        rssMb: Math.round(memory.rss / 1024 / 1024),
        nodeVersion: process.version,
        heartbeatTtlSeconds: 60
      }
    };
  }

  formatUptime(seconds) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return (d > 0 ? d + 'd ' : '') + h + 'h ' + m + 'm ' + s + 's';
  }
}

const adminSingleton = new AdminEngine();
adminSingleton.AdminEngine = AdminEngine;
module.exports = adminSingleton;
