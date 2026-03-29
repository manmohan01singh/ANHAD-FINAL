/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  GURBANI RADIO SERVER — True Server-Authoritative Live Broadcast            ║
 * ║  All devices hear the same audio at the same moment.                        ║
 * ║  Single source of truth for the 24/7 Gurbani Kirtan stream.                ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { Readable } = require('stream');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const CONFIG = {
    R2_BASE_URL: 'https://pub-525228169e0c44e38a67c306ba1a458c.r2.dev',
    FRONTEND_ROOT: path.join(__dirname, '..', 'frontend'),
    MAIN_UI: path.join(__dirname, '..', 'frontend'),
    SEHAJ_PROGRESS_DIR: path.join(__dirname, '..', 'frontend', 'SehajPaath', 'data'),
    RADIO_STATE_FILE: path.join(__dirname, 'radio-state.json'),
    DEFAULT_TRACK_DURATION: 3600, // 1 hour fallback per track
    LISTENER_TTL: 60000, // 60s — heartbeat timeout
    STATE_SAVE_INTERVAL: 30000, // Save state to disk every 30s
};

const PLAYLIST = [
    { id: 1, filename: 'day-1.webm', title: 'Day 1 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 2, filename: 'day-2.webm', title: 'Day 2 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 3, filename: 'day-3.webm', title: 'Day 3 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 4, filename: 'day-4.webm', title: 'Day 4 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 5, filename: 'day-5.webm', title: 'Day 5 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 6, filename: 'day-6.webm', title: 'Day 6 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 7, filename: 'day-7.webm', title: 'Day 7 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 8, filename: 'day-8.webm', title: 'Day 8 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 9, filename: 'day-9.webm', title: 'Day 9 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 10, filename: 'day-10.webm', title: 'Day 10 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 11, filename: 'day-11.webm', title: 'Day 11 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 12, filename: 'day-12.webm', title: 'Day 12 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 13, filename: 'day-13.webm', title: 'Day 13 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 14, filename: 'day-14.webm', title: 'Day 14 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 15, filename: 'day-15.webm', title: 'Day 15 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 16, filename: 'day-16.webm', title: 'Day 16 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 17, filename: 'day-17.webm', title: 'Day 17 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 18, filename: 'day-18.webm', title: 'Day 18 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 19, filename: 'day-19.webm', title: 'Day 19 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 20, filename: 'day-20.webm', title: 'Day 20 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 21, filename: 'day-21.webm', title: 'Day 21 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 22, filename: 'day-22.webm', title: 'Day 22 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 23, filename: 'day-23.webm', title: 'Day 23 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 24, filename: 'day-24.webm', title: 'Day 24 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 25, filename: 'day-25.webm', title: 'Day 25 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 26, filename: 'day-26.webm', title: 'Day 26 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 27, filename: 'day-27.webm', title: 'Day 27 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 28, filename: 'day-28.webm', title: 'Day 28 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 29, filename: 'day-29.webm', title: 'Day 29 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 30, filename: 'day-30.webm', title: 'Day 30 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 31, filename: 'day-31.webm', title: 'Day 31 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 32, filename: 'day-32.webm', title: 'Day 32 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 33, filename: 'day-33.webm', title: 'Day 33 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 34, filename: 'day-34.webm', title: 'Day 34 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 35, filename: 'day-35.webm', title: 'Day 35 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 36, filename: 'day-36.webm', title: 'Day 36 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 37, filename: 'day-37.webm', title: 'Day 37 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 38, filename: 'day-38.webm', title: 'Day 38 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 39, filename: 'day-39.webm', title: 'Day 39 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' },
    { id: 40, filename: 'day-40.webm', title: 'Day 40 — ਗੁਰਬਾਣੀ ਕੀਰਤਨ', artist: 'Bhai Gurpreet Singh Ji' }
];

// ═══════════════════════════════════════════════════════════════════
// LIVE BROADCAST ENGINE — Single Source of Truth
// ═══════════════════════════════════════════════════════════════════

/**
 * The BroadcastEngine is the heart of the live radio station.
 * It manages:
 *  - A fixed epoch timestamp from which all position math derives
 *  - Track durations (learned from clients, persisted to disk)
 *  - Active listener tracking with heartbeat TTL
 *  - Periodic state persistence to survive restarts
 */
class BroadcastEngine {
    constructor() {
        this.epoch = null;           // Birth of the radio station (ms)
        this.trackDurations = {};    // { "0": 3847.2, "1": 3612.8, ... }
        this.listeners = new Map();  // listenerId → { lastSeen, userAgent }
        this.stateDirty = false;
        this.saveInterval = null;
        this.shuffleOrder = [];      // Deterministic shuffle order per cycle
    }

    /**
     * Initialize the broadcast engine on server startup.
     * Loads or creates radio-state.json with the epoch.
     */
    async initialize() {
        let state;
        let needsReset = false;
        try {
            const data = await fs.readFile(CONFIG.RADIO_STATE_FILE, 'utf8');
            state = JSON.parse(data);
            // If the old epoch is from before we added shuffle, reset it
            if (!state.shuffleEnabled) {
                needsReset = true;
            }
            console.log('[📻 Broadcast] Loaded existing radio state');
        } catch (err) {
            needsReset = true;
        }

        if (needsReset) {
            // Fresh start with shuffle enabled — epoch = NOW
            state = {
                epoch: Date.now(),
                startedAt: new Date().toISOString(),
                trackDurations: state?.trackDurations || {},
                shuffleEnabled: true
            };
            console.log('[📻 Broadcast] 🔀 Created fresh radio state with SHUFFLE enabled (epoch = now)');
        }

        this.epoch = state.epoch;
        this.trackDurations = state.trackDurations || {};

        // Generate initial shuffle order
        this.regenerateShuffleOrder(0);

        // Persist state periodically
        this.saveInterval = setInterval(() => {
            if (this.stateDirty) {
                this.persistState();
            }
        }, CONFIG.STATE_SAVE_INTERVAL);

        // Clean up expired listeners every 30s
        setInterval(() => this.cleanupListeners(), 30000);

        // Persist on save
        await this.persistState();

        const livePos = this.getCurrentLivePosition();
        const track = PLAYLIST[livePos.trackIndex];
        console.log(`[📻 Broadcast] Epoch: ${new Date(this.epoch).toISOString()}`);
        console.log(`[📻 Broadcast] Currently playing: ${track.title} at ${this.formatTime(livePos.trackPosition)}`);
        console.log(`[📻 Broadcast] Shuffle order (first 10): ${this.shuffleOrder.slice(0, 10).map(i => i + 1).join(', ')}...`);
        console.log(`[📻 Broadcast] ${Object.keys(this.trackDurations).length}/40 track durations known`);
    }

    /**
     * Deterministic shuffle using Fisher-Yates with a seeded PRNG.
     * Same cycle number always produces the same order.
     * This ensures all clients see the same shuffle.
     */
    regenerateShuffleOrder(cycle) {
        // Simple seeded PRNG (mulberry32)
        let seed = (this.epoch || 0) + cycle * 2654435761;
        function rand() {
            seed |= 0;
            seed = seed + 0x6D2B79F5 | 0;
            let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }

        // Create ordered array and shuffle it
        this.shuffleOrder = Array.from({ length: PLAYLIST.length }, (_, i) => i);
        for (let i = this.shuffleOrder.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            [this.shuffleOrder[i], this.shuffleOrder[j]] = [this.shuffleOrder[j], this.shuffleOrder[i]];
        }
    }

    /**
     * Get the duration of a specific track.
     * Uses client-reported duration if available, otherwise defaults.
     */
    getTrackDuration(index) {
        return this.trackDurations[String(index)] || CONFIG.DEFAULT_TRACK_DURATION;
    }

    /**
     * Get total duration of the entire playlist in seconds.
     */
    getTotalPlaylistDuration() {
        let total = 0;
        for (let i = 0; i < PLAYLIST.length; i++) {
            total += this.getTrackDuration(i);
        }
        return total;
    }

    /**
     * THE CORE CALCULATION: What is playing RIGHT NOW?
     * 
     * elapsed = (now - epoch) / 1000  → total seconds since birth
     * position = elapsed % totalPlaylistDuration → position within the looping playlist
     * Walk through SHUFFLED tracks to find which track and at what seek position
     */
    getCurrentLivePosition() {
        const now = Date.now();
        const elapsedMs = now - this.epoch;
        const elapsedSeconds = elapsedMs / 1000;
        const totalPlaylistDuration = this.getTotalPlaylistDuration();
        const cycle = Math.floor(elapsedSeconds / totalPlaylistDuration);
        const positionInPlaylist = ((elapsedSeconds % totalPlaylistDuration) + totalPlaylistDuration) % totalPlaylistDuration;

        // Regenerate shuffle for current cycle
        this.regenerateShuffleOrder(cycle);

        let accumulated = 0;
        for (let i = 0; i < PLAYLIST.length; i++) {
            const actualTrackIndex = this.shuffleOrder[i];
            const trackDuration = this.getTrackDuration(actualTrackIndex);
            if (accumulated + trackDuration > positionInPlaylist) {
                const trackPosition = positionInPlaylist - accumulated;
                return {
                    trackIndex: actualTrackIndex,
                    shufflePosition: i,
                    trackPosition: Math.max(0, trackPosition),
                    totalElapsed: elapsedSeconds,
                    playlistDuration: totalPlaylistDuration,
                    playlistCycle: cycle
                };
            }
            accumulated += trackDuration;
        }

        // Fallback
        return {
            trackIndex: this.shuffleOrder[0] || 0,
            shufflePosition: 0,
            trackPosition: 0,
            totalElapsed: elapsedSeconds,
            playlistDuration: totalPlaylistDuration,
            playlistCycle: cycle
        };
    }

    /**
     * Report an actual track duration from a client.
     * Only updates if it seems reasonable (> 60s, < 24h).
     */
    reportDuration(trackIndex, duration) {
        if (!isFinite(duration) || duration <= 60 || duration > 86400) {
            return false; // Reject unreasonable durations
        }
        if (trackIndex < 0 || trackIndex >= PLAYLIST.length) {
            return false;
        }

        const key = String(trackIndex);
        const existing = this.trackDurations[key];

        // Accept if no existing, or if the new value is close to existing (within 10%)
        if (!existing || Math.abs(duration - existing) / existing < 0.1) {
            this.trackDurations[key] = duration;
            this.stateDirty = true;
            console.log(`[📻 Broadcast] Track ${trackIndex + 1} duration: ${this.formatTime(duration)} ${existing ? '(updated)' : '(new)'}`);
            return true;
        }

        // If very different, average them
        this.trackDurations[key] = (existing + duration) / 2;
        this.stateDirty = true;
        console.log(`[📻 Broadcast] Track ${trackIndex + 1} duration averaged: ${this.formatTime(this.trackDurations[key])}`);
        return true;
    }

    /**
     * Register or refresh a listener heartbeat.
     */
    heartbeat(listenerId, userAgent = '') {
        this.listeners.set(listenerId, {
            lastSeen: Date.now(),
            userAgent: userAgent.substring(0, 100)
        });
    }

    /**
     * Remove listeners who haven't sent a heartbeat within TTL.
     */
    cleanupListeners() {
        const now = Date.now();
        let removed = 0;
        for (const [id, info] of this.listeners) {
            if (now - info.lastSeen > CONFIG.LISTENER_TTL) {
                this.listeners.delete(id);
                removed++;
            }
        }
        if (removed > 0) {
            console.log(`[📻 Broadcast] Cleaned up ${removed} expired listener(s). Active: ${this.listeners.size}`);
        }
    }

    /**
     * Get count of active listeners.
     */
    getListenerCount() {
        return this.listeners.size;
    }

    /**
     * Persist state to disk.
     */
    async persistState() {
        try {
            const state = {
                epoch: this.epoch,
                startedAt: new Date(this.epoch).toISOString(),
                trackDurations: this.trackDurations,
                shuffleEnabled: true,
                lastSaved: new Date().toISOString(),
                knownDurations: Object.keys(this.trackDurations).length
            };
            await fs.writeFile(CONFIG.RADIO_STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
            this.stateDirty = false;
        } catch (err) {
            console.error('[📻 Broadcast] Failed to persist state:', err.message);
        }
    }

    /**
     * Format seconds to human-readable time.
     */
    formatTime(seconds) {
        if (!isFinite(seconds)) return '0:00';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Cleanup on server shutdown.
     */
    async shutdown() {
        clearInterval(this.saveInterval);
        await this.persistState();
        console.log('[📻 Broadcast] State saved on shutdown');
    }
}

// Create the global broadcast engine
const broadcast = new BroadcastEngine();

// ═══════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════

// Parse JSON body — 10kb limit prevents oversized payload attacks
app.use(express.json({ limit: '10kb' }));

// CORS — only allow explicitly listed origins from ALLOWED_ORIGINS env var
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',').map(o => o.trim()).filter(Boolean);

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// Rate limiting — 60 requests/minute per IP on all API routes
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please slow down.' }
});
app.use('/api/', apiLimiter);

// Logging (skip heartbeats to reduce noise)
app.use((req, res, next) => {
    if (!req.path.includes('/heartbeat')) {
        console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    }
    next();
});

// ═══════════════════════════════════════════════════════════════════
// STATIC FILES
// ═══════════════════════════════════════════════════════════════════

// Serve entire frontend folder
app.use(express.static(CONFIG.FRONTEND_ROOT));

// Serve MainWebPage at root
app.use('/', express.static(CONFIG.MAIN_UI));

// ═══════════════════════════════════════════════════════════════════
// 🔴 LIVE RADIO API — The Core Sync Endpoints
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /api/radio/live
 * 
 * Returns the exact current live position.
 * Every client that calls this will get the same track and position.
 * This is the single source of truth for "what's playing now."
 */
app.get('/api/radio/live', (req, res) => {
    let livePos, track;
    try {
        livePos = broadcast.getCurrentLivePosition();
        track = PLAYLIST[livePos.trackIndex];
        if (!track) throw new Error('Track index out of bounds: ' + livePos.trackIndex);
    } catch (err) {
        console.error('[Radio] Live position error:', err.message);
        return res.status(500).json({ error: 'Broadcast engine error' });
    }

    res.json({
        // What to play
        trackIndex: livePos.trackIndex,
        trackPosition: Math.round(livePos.trackPosition * 100) / 100,
        trackTitle: track.title,
        trackArtist: track.artist,
        trackFilename: track.filename,
        trackUrl: `/audio/${track.filename}`,
        trackDuration: broadcast.getTrackDuration(livePos.trackIndex),

        // Metadata
        totalElapsed: Math.round(livePos.totalElapsed),
        playlistDuration: Math.round(livePos.playlistDuration),
        playlistCycle: livePos.playlistCycle,
        totalTracks: PLAYLIST.length,

        // Sync data
        epoch: broadcast.epoch,
        serverTime: Date.now(),

        // Community
        listenersCount: broadcast.getListenerCount(),

        // All track durations for client-side prediction
        trackDurations: Object.fromEntries(
            PLAYLIST.map((_, i) => [i, broadcast.getTrackDuration(i)])
        )
    });
});

/**
 * POST /api/radio/durations
 * 
 * Clients report actual track durations when they load metadata.
 * This improves accuracy over time as real durations replace estimates.
 * 
 * Body: { trackIndex: number, duration: number }
 */
app.post('/api/radio/durations', (req, res) => {
    const { trackIndex, duration } = req.body;

    if (typeof trackIndex !== 'number' || typeof duration !== 'number') {
        return res.status(400).json({ error: 'trackIndex and duration are required numbers' });
    }

    const accepted = broadcast.reportDuration(trackIndex, duration);
    res.json({
        accepted,
        trackIndex,
        duration: broadcast.getTrackDuration(trackIndex),
        knownDurations: Object.keys(broadcast.trackDurations).length
    });
});

/**
 * POST /api/radio/heartbeat
 * 
 * Clients call this every 30s to maintain their "listener" status.
 * Returns current live position for drift correction.
 * 
 * Body: { listenerId: string }
 */
app.post('/api/radio/heartbeat', (req, res) => {
    const { listenerId } = req.body;

    if (!listenerId) {
        return res.status(400).json({ error: 'listenerId is required' });
    }

    broadcast.heartbeat(listenerId, req.headers['user-agent'] || '');

    const livePos = broadcast.getCurrentLivePosition();
    const track = PLAYLIST[livePos.trackIndex];

    res.json({
        ok: true,
        listenersCount: broadcast.getListenerCount(),
        // Drift correction data
        trackIndex: livePos.trackIndex,
        trackPosition: Math.round(livePos.trackPosition * 100) / 100,
        trackFilename: track.filename,
        serverTime: Date.now()
    });
});

/**
 * GET /api/radio/listeners
 * 
 * Returns the current listener count.
 */
app.get('/api/radio/listeners', (req, res) => {
    res.json({
        count: broadcast.getListenerCount(),
        timestamp: Date.now()
    });
});

/**
 * GET /api/radio/status
 * 
 * Detailed broadcast status for admin/debugging.
 */
app.get('/api/radio/status', (req, res) => {
    const livePos = broadcast.getCurrentLivePosition();
    const track = PLAYLIST[livePos.trackIndex];
    const knownCount = Object.keys(broadcast.trackDurations).length;

    res.json({
        status: 'broadcasting',
        epoch: broadcast.epoch,
        epochDate: new Date(broadcast.epoch).toISOString(),
        uptime: broadcast.formatTime(livePos.totalElapsed),
        currentTrack: {
            index: livePos.trackIndex,
            title: track.title,
            artist: track.artist,
            position: broadcast.formatTime(livePos.trackPosition),
            duration: broadcast.formatTime(broadcast.getTrackDuration(livePos.trackIndex))
        },
        playlist: {
            totalTracks: PLAYLIST.length,
            totalDuration: broadcast.formatTime(livePos.playlistDuration),
            cycle: livePos.playlistCycle,
            knownDurations: `${knownCount}/${PLAYLIST.length}`
        },
        listeners: {
            active: broadcast.getListenerCount()
        },
        serverTime: new Date().toISOString()
    });
});

// ═══════════════════════════════════════════════════════════════════
// SEHAJ PAATH API - Progress Management
// ═══════════════════════════════════════════════════════════════════

// Helper to read progress file
async function readProgressFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return createDefaultProgress();
    }
}

// Helper to write progress file
async function writeProgressFile(progress, filePath) {
    try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(progress, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('[Sehaj Paath] Error writing progress:', error.message);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════
// PER-USER IDENTITY — UUID cookie, one progress file per user
// ═══════════════════════════════════════════════════════════════════

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getUserId(req, res) {
    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.match(/(?:^|;\s*)anhad_user_id=([^;]+)/);
    let userId = match ? match[1] : null;
    if (!userId || !UUID_REGEX.test(userId)) {
        userId = crypto.randomUUID();
        res.setHeader('Set-Cookie',
            `anhad_user_id=${userId}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly`
        );
    }
    return userId;
}

function getProgressFilePath(userId) {
    const safeId = userId.replace(/[^0-9a-f-]/gi, '');
    return path.join(CONFIG.SEHAJ_PROGRESS_DIR, `sehaj-progress-${safeId}.json`);
}

// Create default progress structure
function createDefaultProgress() {
    return {
        version: 1,
        currentAng: 1,
        completedAngs: [],
        bookmarks: [],
        history: [],
        totals: {
            totalReadingSeconds: 0,
            completions: 0,
        },
        session: {
            active: false,
            startedAt: null,
            startAng: null,
            lastAng: null,
            seconds: 0,
        },
        settings: {
            theme: 'dark',
            gurmukhiFont: 'noto-sans',
            fontSize: 30,
            fontWeight: 500,
            lineSpacing: 1.9,
            larivaar: false,
            padChed: true,
            showTransliteration: true,
            showEnglish: true,
            showPunjabi: false,
            showProgress: true,
            showProgressPercent: true,
            showAngCounter: true,
            autoScrollEnabled: false,
            autoScrollSpeed: 4,
            dailyAngGoal: 5,
            reminders: {
                enabled: false,
                time: '05:00',
                days: [0, 1, 2, 3, 4, 5, 6],
            },
        },
    };
}

// GET - Fetch progress
app.get('/api/sehaj-paath/progress', async (req, res) => {
    try {
        const userId = getUserId(req, res);
        const filePath = getProgressFilePath(userId);
        const progress = await readProgressFile(filePath);
        res.json(progress);
    } catch (error) {
        console.error('[Sehaj Paath] Error reading progress:', error.message);
        res.status(500).json({ error: 'Failed to read progress' });
    }
});

// PUT - Save progress
app.put('/api/sehaj-paath/progress', async (req, res) => {
    try {
        const userId = getUserId(req, res);
        const filePath = getProgressFilePath(userId);
        const progress = req.body;
        const success = await writeProgressFile(progress, filePath);
        if (success) {
            res.json({ success: true, message: 'Progress saved' });
        } else {
            res.status(500).json({ error: 'Failed to save progress' });
        }
    } catch (error) {
        console.error('[Sehaj Paath] Error saving progress:', error.message);
        res.status(500).json({ error: 'Failed to save progress' });
    }
});

// POST - Update specific fields
app.post('/api/sehaj-paath/progress', async (req, res) => {
    try {
        const userId = getUserId(req, res);
        const filePath = getProgressFilePath(userId);
        const updates = req.body;
        const current = await readProgressFile(filePath);
        const merged = { ...current, ...updates };
        const success = await writeProgressFile(merged, filePath);
        if (success) {
            res.json({ success: true, data: merged });
        } else {
            res.status(500).json({ error: 'Failed to update progress' });
        }
    } catch (error) {
        console.error('[Sehaj Paath] Error updating progress:', error.message);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// POST - Add bookmark
app.post('/api/sehaj-paath/bookmarks', async (req, res) => {
    try {
        const userId = getUserId(req, res);
        const filePath = getProgressFilePath(userId);
        const { ang, note } = req.body;
        const progress = await readProgressFile(filePath);

        const bookmark = {
            id: `${Date.now()}`,
            ang: Math.max(1, Math.min(1430, Number(ang))),
            note: note || '',
            createdAt: new Date().toISOString(),
        };

        progress.bookmarks = progress.bookmarks || [];
        progress.bookmarks.push(bookmark);
        if (progress.history) progress.history = progress.history.slice(-100);

        await writeProgressFile(progress, filePath);
        res.json({ success: true, bookmark });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add bookmark' });
    }
});

// DELETE - Remove bookmark
app.delete('/api/sehaj-paath/bookmarks/:id', async (req, res) => {
    try {
        const userId = getUserId(req, res);
        const filePath = getProgressFilePath(userId);
        const { id } = req.params;
        const progress = await readProgressFile(filePath);

        progress.bookmarks = (progress.bookmarks || []).filter(b => b.id !== id);

        await writeProgressFile(progress, filePath);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove bookmark' });
    }
});

// ═══════════════════════════════════════════════════════════════════
// AUDIO PROXY
// ═══════════════════════════════════════════════════════════════════

app.get('/audio/:filename', async (req, res) => {
    const filename = req.params.filename;

    if (!/^day-\d{1,2}\.webm$/.test(filename)) {
        return res.status(400).json({ error: 'Invalid audio filename' });
    }

    const r2Url = `${CONFIG.R2_BASE_URL}/${filename}`;

    console.log(`[Proxy] Fetching: ${r2Url}`);

    try {
        const fetchOptions = {
            method: 'GET',
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; GurbaniRadio/1.0)',
                'Accept': '*/*',
            }
        };

        if (req.headers.range) {
            fetchOptions.headers['Range'] = req.headers.range;
        }

        const r2Response = await fetch(r2Url, fetchOptions);

        if (!r2Response.ok && r2Response.status !== 206) {
            console.error(`[Proxy] R2 Error: ${r2Response.status}`);
            return res.status(r2Response.status).json({
                error: 'Audio not found',
                status: r2Response.status
            });
        }

        res.setHeader('Content-Type', r2Response.headers.get('content-type') || 'audio/webm');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=3600');

        if (r2Response.headers.get('content-length')) {
            res.setHeader('Content-Length', r2Response.headers.get('content-length'));
        }

        if (r2Response.headers.get('content-range')) {
            res.setHeader('Content-Range', r2Response.headers.get('content-range'));
            res.status(206);
        }

        const stream = Readable.fromWeb(r2Response.body);
        stream.pipe(res);

        stream.on('error', (err) => console.error('[Proxy] Stream error:', err.message));
        res.on('close', () => stream.destroy());

    } catch (error) {
        console.error('[Proxy] Error:', error.message);
        res.status(500).json({ error: 'Proxy error' });
    }
});

// ═══════════════════════════════════════════════════════════════════
// OTHER API ROUTES
// ═══════════════════════════════════════════════════════════════════

app.get('/api/tracks', (req, res) => {
    res.json({ tracks: PLAYLIST, baseUrl: '/audio' });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        broadcasting: true,
        listeners: broadcast.getListenerCount()
    });
});

app.get('/test-r2', async (req, res) => {
    const testUrl = `${CONFIG.R2_BASE_URL}/day-31.webm`;
    try {
        const response = await fetch(testUrl, { method: 'HEAD' });
        res.json({ success: response.ok, status: response.status, url: testUrl });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Root
app.get('/', (req, res) => {
    res.sendFile(path.join(CONFIG.MAIN_UI, 'index.html'));
});

// Service Worker - serve from frontend root
app.get('/sw.js', (req, res) => {
    res.sendFile(path.join(CONFIG.FRONTEND_ROOT, 'sw.js'));
});

// Manifest
app.get('/manifest.json', (req, res) => {
    res.sendFile(path.join(CONFIG.FRONTEND_ROOT, 'manifest.json'));
});

// ═══════════════════════════════════════════════════════════════════
// 404 HANDLER
// ═══════════════════════════════════════════════════════════════════

app.use((req, res) => {
    console.log(`[404] Not found: ${req.path}`);
    res.status(404).json({
        error: 'Not Found',
        path: req.path,
        hint: 'Check if the file exists and path is correct'
    });
});

// ═══════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════

async function startServer() {
    // Initialize the broadcast engine first
    await broadcast.initialize();

    app.listen(PORT, () => {
        const livePos = broadcast.getCurrentLivePosition();
        const track = PLAYLIST[livePos.trackIndex];

        console.log('');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('  🙏 GURBANI RADIO SERVER — 24/7 LIVE BROADCAST');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`  🌐 Home:          http://localhost:${PORT}/`);
        console.log(`  📻 Now Playing:   ${track.title} at ${broadcast.formatTime(livePos.trackPosition)}`);
        console.log(`  🔴 Live API:      http://localhost:${PORT}/api/radio/live`);
        console.log(`  📊 Status:        http://localhost:${PORT}/api/radio/status`);
        console.log(`  🎧 Listeners:     ${broadcast.getListenerCount()}`);
        console.log(`  📖 Sehaj Paath:   http://localhost:${PORT}/SehajPaath/sehaj-paath.html`);
        console.log(`  📿 Nitnem:        http://localhost:${PORT}/nitnem/indexbani.html`);
        console.log(`  📅 Calendar:      http://localhost:${PORT}/Calendar/Gurupurab-Calendar.html`);
        console.log(`  🎵 Audio Proxy:   http://localhost:${PORT}/audio/day-31.webm`);
        console.log('═══════════════════════════════════════════════════════════════');
    });
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n[Server] Shutting down gracefully...');
    await broadcast.shutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await broadcast.shutdown();
    process.exit(0);
});

// Boot!
startServer().catch(err => {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
});