/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  GURBANI RADIO SERVER — True Server-Authoritative Live Broadcast            ║
 * ║  All devices hear the same audio at the same moment.                        ║
 * ║  Single source of truth for the 24/7 Gurbani Kirtan stream.                ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const compression = require('compression');
const fs = require('fs').promises;
const fsSync = require('fs');
const { Readable } = require('stream');
const crypto = require('crypto');
const configStore = require('./lib/config-store');
const rateLimitModule = require('express-rate-limit');
const rateLimit = rateLimitModule.rateLimit || rateLimitModule;
const ipKeyGenerator = rateLimitModule.ipKeyGenerator || ((ip) => ip);
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

// Sadhsangat Live Imports
const sqlite3 = require('sqlite3');
const axios = require('axios');
const cron = require('node-cron');
const communityPresence = require('./lib/community-presence');
const { requireAuth, requireAdmin, createRateLimiter, sanitizeString, registerUser } = require('./lib/auth-middleware');
const friendsEngine = require('./lib/friends-engine');
const companionEngine = require('./lib/companion-engine');
const companionNotifications = require('./lib/companion-notifications');
const campaignEngine = require('./lib/campaign-engine');
const adminEngine = require('./lib/admin-engine');


const app = express();
const PORT = process.env.PORT || 3004;
app.disable('x-powered-by');

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const CONFIG = {
    R2_BASE_URL: process.env.R2_BASE_URL || 'https://pub-525228169e0c44e38a67c306ba1a458c.r2.dev',
    SIMRAN_R2_BASE_URL: process.env.SIMRAN_R2_BASE_URL || 'https://pub-8bf31fc1f2a44451b40a3ded7e07fac2.r2.dev',
    SIMRAN_R2_PREFIX: process.env.SIMRAN_R2_PREFIX || 'waheguru',
    SIMRAN_STATE_FILE: process.env.SIMRAN_STATE_FILE || path.join(__dirname, 'simran-state.json'),
    FRONTEND_ROOT: process.env.FRONTEND_ROOT || path.join(__dirname, '..', 'frontend'),
    MAIN_UI: process.env.MAIN_UI || path.join(__dirname, '..', 'frontend'),
    SEHAJ_PROGRESS_DIR: process.env.SEHAJ_PROGRESS_DIR || path.join(__dirname, 'data', 'sehaj-progress'),
    RADIO_STATE_FILE: process.env.RADIO_STATE_FILE || path.join(__dirname, 'radio-state.json'),
    DEFAULT_TRACK_DURATION: parseInt(process.env.DEFAULT_TRACK_DURATION) || 3600, // 1 hour fallback per track
    LISTENER_TTL: parseInt(process.env.LISTENER_TTL) || 60000, // 60s — heartbeat timeout
    STATE_SAVE_INTERVAL: parseInt(process.env.STATE_SAVE_INTERVAL) || 30000, // Save state to disk every 30s
    // Groq AI API Configuration
    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
    GROQ_API_URL: 'https://api.groq.com/openai/v1/chat/completions',
    CHANNEL_VALIDATION_CACHE_TTL: 86400000, // 24 hours cache for channel validation
    // Shared secret for the Sadhsangat admin channel-management routes.
    // Required — those routes fail closed (503) if this is not set.
    ADMIN_API_TOKEN: process.env.ADMIN_API_TOKEN || ''
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

const SIMRAN_PLAYLIST = [
    { id: 1, filename: '01 - DEENANATH SUNO WAHEGURU SIMRAN DAY 1.mp3', title: 'Deenanath Suno', artist: 'Amritvela Trust' },
    { id: 2, filename: '02 - TUM KARO DAYA WAHEGURU SIMRAIN DAY 2.mp3', title: 'Tum Karo Daya', artist: 'Amritvela Trust' },
    { id: 3, filename: '03 - SUNN YAAR HAMARE SAJAN - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Sunn Yaar Hamare Sajan', artist: 'Amritvela Trust' },
    { id: 4, filename: '04 - SUKH NAAHI RE HAR BHAGAT BINA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Sukh Naahi Re', artist: 'Amritvela Trust' },
    { id: 5, filename: '05 - TU PRABH DATA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Tu Prabh Data', artist: 'Amritvela Trust' },
    { id: 6, filename: '06 - SATNAM WAHEGURU - SIMRAN - AMRITVELA TRUST..mp3', title: 'Satnam Waheguru', artist: 'Amritvela Trust' },
    { id: 7, filename: '07 - MERE RAM - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Mere Ram', artist: 'Amritvela Trust' },
    { id: 8, filename: '08 - RAKHWALA SIMRAN - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Rakhwala Simran', artist: 'Amritvela Trust' },
    { id: 9, filename: '09 - AAS PYAASI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Aas Pyaasi', artist: 'Amritvela Trust' },
    { id: 10, filename: '10 - PRABH PAAS JAN KI ARDAS - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Prabh Paas Jan Ki Ardas', artist: 'Amritvela Trust' },
    { id: 11, filename: '11 - TU HI TU HI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Tu Hi Tu Hi', artist: 'Amritvela Trust' },
    { id: 12, filename: '12 - NAAM NAAM NAAM APNA NAAM DEHO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Naam Naam Naam Apna Naam Deho', artist: 'Amritvela Trust' },
    { id: 13, filename: '13 - DHAN GURU RAMDAS JI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Dhan Guru Ramdas Ji', artist: 'Amritvela Trust' },
    { id: 14, filename: '14 - AAO SAJANA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Aao Sajana', artist: 'Amritvela Trust' },
    { id: 15, filename: '15 - TUJ BIN KAVAN HAMARA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Tuj Bin Kavan Hamara', artist: 'Amritvela Trust' },
    { id: 16, filename: '16 - MERA BAID GURU GOVINDA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Mera Baid Guru Govinda', artist: 'Amritvela Trust' },
    { id: 17, filename: '17 - JAGAN TE SUPNA BHALA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Jagan Te Supna Bhala', artist: 'Amritvela Trust' },
    { id: 18, filename: '18 - EH NEECH KARAM HAR MERE - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Eh Neech Karam Har Mere', artist: 'Amritvela Trust' },
    { id: 19, filename: '19 - APNA NAAM JAPAO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Apna Naam Japao', artist: 'Amritvela Trust' },
    { id: 20, filename: '20 - MERE PYAARE SATUGURU JI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Mere Pyaare Satuguru Ji', artist: 'Amritvela Trust' },
    { id: 21, filename: '21 - RAKH LEHO BHAGWAN - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Rakh Leho Bhagwan', artist: 'Amritvela Trust' },
    { id: 22, filename: '22 - KAB GAL LAVENGE - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Kab Gal Lavenge', artist: 'Amritvela Trust' },
    { id: 23, filename: '23 - MERE RAM MERE RAM - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Mere Ram Mere Ram', artist: 'Amritvela Trust' },
    { id: 24, filename: '24 - RAKHEYA KARO SIMRAN DAY 25.mp3', title: 'Rakheya Karo', artist: 'Amritvela Trust' },
    { id: 25, filename: '25 - WAHEGURU SIMRAN UTH NAAM JAP AMRITVELA TRUST BEST SIMRAN.mp3', title: 'Waheguru Simran Uth Naam Jap', artist: 'Amritvela Trust' },
    { id: 26, filename: '26 - BEST WAHEGURU SIMRAN DAY 27 CHALIYA 2020.mp3', title: 'Best Waheguru Simran Day 27', artist: 'Amritvela Trust' },
    { id: 27, filename: '27 - KAD NANAK AAVE VARI - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Kad Nanak Aave Vari', artist: 'Amritvela Trust' },
    { id: 28, filename: '28 - BIN GUR NA PAVAIGO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Bin Gur Na Pavaigo', artist: 'Amritvela Trust' },
    { id: 29, filename: '29 - KIYO SHINGAR MILAN KE TAAYEE - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Kiyo Shingar Milan Ke Taayee', artist: 'Amritvela Trust' },
    { id: 30, filename: '30 - NAAM BINA NAHI JEEVIA JAYE - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Naam Bina Nahi Jeevia Jaye', artist: 'Amritvela Trust' },
    { id: 31, filename: '31 - AATH PEHAR SIMRO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Aath Pehar Simro', artist: 'Amritvela Trust' },
    { id: 32, filename: '32 - MIL MERE PREETMA JEEO - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Mil Mere Preetma Jeeo', artist: 'Amritvela Trust' },
    { id: 33, filename: '33 - SATNAM SHRI WAHEGURU SIMRAN DAY 35 CHALIYA 2020.mp3', title: 'Satnam Shri Waheguru', artist: 'Amritvela Trust' },
    { id: 34, filename: '34 - RAKH RAKH MERE BEETHLA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Rakh Rakh Mere Beethla', artist: 'Amritvela Trust' },
    { id: 35, filename: '35 - PRAAN ADHAARA RAM - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Praan Adhaara Ram', artist: 'Amritvela Trust' },
    { id: 36, filename: '36 - DHAN BABA NANAK - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Dhan Baba Nanak', artist: 'Amritvela Trust' },
    { id: 37, filename: '37 - SUNN MANN MITTAR PYAREYA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Sunn Mann Mittar Pyareya', artist: 'Amritvela Trust' },
    { id: 38, filename: '38 - MERE SATGUR PYARE GURNANAK AAJA - WAHEGURU SIMRAN - AMRITVELA TRUST..mp3', title: 'Mere Satgur Pyare Gurnanak Aaja', artist: 'Amritvela Trust' }
];


// ═══════════════════════════════════════════════════════════════════
// LIVE BROADCAST ENGINE — Single Source of Truth
// ═══════════════════════════════════════════════════════════════════

// ── FIXED EPOCH — NEVER changes across deploys, restarts, or filesystem wipes ──
// This is the birth of the radio station. All position math derives from this.
// Using Jan 1 2024 00:00:00 UTC ensures deterministic shuffle on ALL devices.
const FIXED_EPOCH = 1704067200000; // 2024-01-01T00:00:00.000Z

class BroadcastEngine {
    constructor(playlistName, playlist, stateFile) {
        this.playlistName = playlistName;
        this.playlist = playlist;
        this.stateFile = stateFile;
        this.epoch = FIXED_EPOCH;
        this.trackDurations = {};
        this.listeners = new Map();
        this.stateDirty = false;
        this.saveInterval = null;
        this.shuffleOrder = [];
    }

    async initialize() {
        let learnedDurations = {};
        try {
            const data = await fs.readFile(this.stateFile, 'utf8');
            const state = JSON.parse(data);
            if (state.trackDurations && typeof state.trackDurations === 'object') {
                learnedDurations = state.trackDurations;
            }
            console.log('[📻 ' + this.playlistName + '] Loaded ' + Object.keys(learnedDurations).length + ' learned durations from state file');
        } catch (err) {
            console.log('[📻 ' + this.playlistName + '] No state file found, starting fresh');
        }

        this.epoch = FIXED_EPOCH;
        this.trackDurations = learnedDurations;
        this.regenerateShuffleOrder(0);

        this.saveInterval = setInterval(() => {
            if (this.stateDirty) this.persistState();
        }, CONFIG.STATE_SAVE_INTERVAL);

        setInterval(() => this.cleanupListeners(), 30000);
        await this.persistState();

        const livePos = this.getCurrentLivePosition();
        const track = this.playlist[livePos.trackIndex];
        console.log(`[📻 Broadcast] Epoch: ${new Date(this.epoch).toISOString()}`);
        console.log(`[📻 Broadcast] Currently playing: ${track.title} at ${this.formatTime(livePos.trackPosition)}`);
        console.log(`[📻 Broadcast] Shuffle order (first 10): ${this.shuffleOrder.slice(0, 10).map(i => i + 1).join(', ')}...`);
        console.log(`[📻 Broadcast] ${Object.keys(this.trackDurations).length}/${this.playlist.length} track durations known`);
    }

    regenerateShuffleOrder(cycle) {
        let seed = (this.epoch || 0) + cycle * 2654435761;
        function rand() {
            seed |= 0;
            seed = seed + 0x6D2B79F5 | 0;
            let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
        this.shuffleOrder = Array.from({ length: this.playlist.length }, (_, i) => i);
        for (let i = this.shuffleOrder.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            [this.shuffleOrder[i], this.shuffleOrder[j]] = [this.shuffleOrder[j], this.shuffleOrder[i]];
        }
    }

    getTrackDuration(index) {
        return this.trackDurations[String(index)] || CONFIG.DEFAULT_TRACK_DURATION;
    }

    getTotalPlaylistDuration() {
        let total = 0;
        for (let i = 0; i < this.playlist.length; i++) total += this.getTrackDuration(i);
        return total;
    }

    /**
     * VIRTUAL LIVE POSITION — Deterministic mapping from wallclock time to track+position
     * 
     * Design:
     * - Cycle (shuffle order) uses FIXED total for stability (shuffle never jumps)
     * - Position within cycle uses LEARNED (actual) durations so position never
     *   exceeds a track's real length (eliminates dead zones)
     * - When rawPosition > learnedTotal, wraps back into content range
     */
    getCurrentLivePosition() {
        const now = Date.now();
        const elapsedSeconds = (now - this.epoch) / 1000;
        const fixedTotal = this.playlist.length * CONFIG.DEFAULT_TRACK_DURATION;
        const learnedTotal = this.getTotalPlaylistDuration();

        // Cycle uses fixedTotal for shuffle stability
        const cycle = Math.floor(elapsedSeconds / fixedTotal);
        this.regenerateShuffleOrder(cycle);

        // Position uses learnedTotal (actual durations) — wraps to prevent dead zones
        const rawPosition = ((elapsedSeconds % fixedTotal) + fixedTotal) % fixedTotal;
        const positionInPlaylist = rawPosition % learnedTotal;

        let accumulated = 0;
        for (let i = 0; i < this.playlist.length; i++) {
            const actualTrackIndex = this.shuffleOrder[i];
            const trackDuration = this.getTrackDuration(actualTrackIndex);
            if (accumulated + trackDuration > positionInPlaylist) {
                return {
                    trackIndex: actualTrackIndex, shufflePosition: i,
                    trackPosition: Math.max(0, positionInPlaylist - accumulated),
                    totalElapsed: elapsedSeconds, playlistDuration: learnedTotal, playlistCycle: cycle
                };
            }
            accumulated += trackDuration;
        }
        return { trackIndex: this.shuffleOrder[0] || 0, shufflePosition: 0, trackPosition: 0, totalElapsed: elapsedSeconds, playlistDuration: learnedTotal, playlistCycle: cycle };
    }

    reportDuration(trackIndex, duration) {
        if (!isFinite(duration) || duration <= 60 || duration > 86400) {
            return false; // Reject unreasonable durations
        }
        if (trackIndex < 0 || trackIndex >= this.playlist.length) {
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
            await fs.writeFile(this.stateFile, JSON.stringify(state, null, 2), 'utf8');
            this.stateDirty = false;
        } catch (err) {
            console.error('[📻 ' + this.playlistName + '] Failed to persist state:', err.message);
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
        console.log('[📻 ' + this.playlistName + '] State saved on shutdown');
    }
}

// Create the global broadcast engine
const broadcast = new BroadcastEngine('Amritvela', PLAYLIST, CONFIG.RADIO_STATE_FILE);
const simranBroadcast = new BroadcastEngine('Waheguru Simran', SIMRAN_PLAYLIST, CONFIG.SIMRAN_STATE_FILE);

// ═══════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════

// CORS must run BEFORE body parser so error responses (413, etc.) include CORS headers
// and browsers don't misreport size errors as CORS failures.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ||
    'http://localhost:3000,http://127.0.0.1:3000,https://localhost,https://localhost:3000,https://anhad.vercel.app,https://anhadnaam.vercel.app,capacitor://localhost,ionic://localhost')
    .split(',').map(o => o.trim()).filter(Boolean);

// For local dev, be permissive; production uses strict origin list
const IS_LOCAL_DEV = !process.env.ALLOWED_ORIGINS;

app.use((req, res, next) => {
    const origin = req.headers.origin;
    const requestedHeaders = req.headers['access-control-request-headers'];
    const requestedMethod = req.headers['access-control-request-method'];

    // Check if it is a local request origin (development / custom builds)
    const isLocalOrigin = origin && (
        origin.startsWith('http://localhost') ||
        origin.startsWith('https://localhost') ||
        origin.startsWith('http://127.0.0.1') ||
        origin.startsWith('https://127.0.0.1')
    );

    if (isLocalOrigin || (IS_LOCAL_DEV && (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')))) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
        res.setHeader('Vary', 'Origin');
    } else if (origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app') || origin === 'https://anhad.vercel.app')) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }

    res.setHeader('Access-Control-Allow-Methods', requestedMethod || 'GET, POST, PUT, DELETE, OPTIONS');
    // IMPORTANT: echo requested headers so preflight always passes (Capacitor/WebView can send extra headers)
    res.setHeader('Access-Control-Allow-Headers', requestedHeaders || 'Content-Type, Range, Authorization, X-User-ID');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    next();
});

app.use(compression({
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers.range) return false;
        return compression.filter(req, res);
    }
}));

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    next();
});

// Parse JSON body — CORS already ran so error responses include proper headers
app.use(express.json({ limit: '500kb' }));

// Rate limiting — 60 requests/minute per IP on all API routes
// NOTE: When using Cloudflare, this limits per Cloudflare edge IP
// Consider using CF-Connecting-IP header for client IP instead
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please slow down.' },
    // Use Cloudflare's client IP if available, fall back to default
    keyGenerator: (req) => {
        const clientIp = req.headers['cf-connecting-ip'] ||
            req.headers['x-forwarded-for']?.split(',')[0].trim() ||
            req.ip;
        return ipKeyGenerator(clientIp);
    }
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
// 🌐 REMOTE CONFIGURATION & CAMPAIGN ENGINE API
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_CAMPAIGNS = {
  version: '1.0.0',
  updatedAt: '2026-08-17T00:00:00.000Z',
  featureFlags: {
    enableVirtualLive: true,
    enableSadhsangatAutoRefresh: true,
    enableDynamicSky: true,
    enableCampaignHeroTakeover: true
  },
  campaigns: [
    {
      id: 'chaliya-amritvela-2026',
      title: 'Chaliya Amritvela Trust 2026',
      subtitle: '40 Days of Divine Naam Simran & Nitnem Practice',
      type: 'spiritual_event',
      priority: 100,
      platforms: ['web', 'android', 'ios'],
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-12-31T23:59:59.000Z',
      // OFF, matching SAFE_BUILTIN_CONFIG in frontend/lib/remote-config.js.
      // These two MUST be kept in sync: this object is the actual value
      // served by GET /api/config/campaigns whenever nothing has been
      // persisted via the admin PUT/PATCH routes yet (see
      // backend/lib/config-store.js — read() returns null until an admin
      // write happens, and getLiveCampaignConfig() falls back to this exact
      // object). The frontend's SAFE_BUILTIN_CONFIG is only a last-resort for
      // a device that has never reached this server at all, so editing it
      // alone — as a previous fix attempt did — has no effect on any device
      // that successfully fetches this endpoint, which is why the campaign
      // kept showing after being "turned off".
      // NOTE: startDate/endDate above still span all of 2026. Narrow them to
      // the real 40-day Chaliya window before turning this back on.
      active: false,
      content: {
        badgeText: 'CHALIYA 2026',
        // Copy for the in-greeting announcement (State B). Kept short because it
        // renders inside the 148px portrait disc and the greeting text box, both
        // fixed-size; campaign-renderer.js clamps it as a backstop.
        //
        // The Gurmukhi line is Gurbani, not marketing copy: Japji Sahib pauri 4,
        // 'ਅੰਮ੍ਰਿਤ ਵੇਲਾ ਸਚੁ ਨਾਉ' — 'in the ambrosial hours of Amritvela,
        // meditate on the True Name' — the practice a Chaliya is built around.
        //
        // Must stay in sync with SAFE_BUILTIN_CONFIG in
        // frontend/lib/remote-config.js, or an offline device shows different
        // wording from an online one.
        announce: {
          badge: 'CHALIYA 2026',
          title: 'Chaliya 2026',
          line: 'ਅੰਮ੍ਰਿਤ ਵੇਲਾ ਸਚੁ ਨਾਉ',
          sub: '40 days of Amritvela Simran — Coming Soon',
          pill: 'AMRITVELA LIVE SAMAGAMS',
          image: 'assets/Darbar-sahib-AMRITVELA.webp'
        },
        heroTitle: 'Chaliya Amritvela 2026',
        heroSubtitle: 'Join thousands in the annual 40-day Amritvela Simran Abhyaas',
        ctaText: 'Join Amritvela',
        ctaAction: 'STREAM:amritvela',
        announcement: {
          icon: '✨',
          title: 'Amritvela Chaliya 2026 In Progress',
          message: 'Awaken during Amritvela (3:00 AM – 6:00 AM) for collective Nitnem & Waheguru Simran.',
          actionLabel: 'Open Nitnem Tracker',
          actionUrl: 'NitnemTracker/nitnem-tracker.html'
        },
        banner: {
          enabled: true,
          text: 'ੴ Annual Chaliya 2026 — Amritvela Trust',
          link: 'GurbaniRadio/gurbani-radio.html?stream=amritvela',
          accentColor: '#D4AF37'
        },
        themeTokens: {
          accentGlow: 'rgba(212, 175, 55, 0.3)',
          badgeBackground: 'linear-gradient(135deg, #8A6D3B 0%, #D4AF37 100%)'
        }
      }
    }
  ]
};

/**
 * Reads the live config: stored value if one exists and validates, else the
 * built-in DEFAULT_CAMPAIGNS above as a seed. configStore.read() never throws,
 * so a store outage degrades to defaults rather than taking this route down.
 */
async function getLiveCampaignConfig() {
  const stored = await configStore.read();
  return stored || DEFAULT_CAMPAIGNS;
}

function configEtag(config) {
  return '"' + crypto.createHash('sha1').update(JSON.stringify(config)).digest('hex') + '"';
}

app.get('/api/config/campaigns', async (req, res) => {
  try {
    const config = await getLiveCampaignConfig();
    const etag = configEtag(config);

    // Previously `public, max-age=300` — a five-minute cache directive, which is
    // in direct tension with the sub-15s propagation an admin toggle needs. The
    // client already defeats it per-browser with a ?t= cache-buster, so it only
    // ever risked confusing shared caches. no-cache + ETag means the 15s poll
    // revalidates every time but costs a 304 with no body when nothing changed.
    res.set({
      'Cache-Control': 'no-cache',
      'ETag': etag,
      'Access-Control-Allow-Origin': '*'
    });

    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }
    res.json(config);
  } catch (e) {
    console.error('[Config] Failed to serve campaign config:', e);
    // Last-resort: never fail this endpoint. A campaign system must not be able
    // to break the app it decorates.
    res.set({ 'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*' });
    res.json(DEFAULT_CAMPAIGNS);
  }
});

// ─── Admin write path ─────────────────────────────────────────────────────
// Gated by the same requireAdminToken used for the Sadhsangat admin routes:
// X-Admin-Token header, crypto.timingSafeEqual, fails CLOSED with 503 when
// ADMIN_API_TOKEN is unset. These are the only writes in the campaign system.
// (requireAdminToken is a hoisted function declaration defined further below.)

app.get('/api/config/admin/campaigns', requireAdminToken, async (req, res) => {
  try {
    const config = await getLiveCampaignConfig();
    // Admins need every campaign, including inactive and out-of-window ones —
    // unlike the public endpoint's consumers, which resolve to just one.
    res.set('Cache-Control', 'no-store');
    res.json({ config, store: configStore.describe() });
  } catch (e) {
    console.error('[Config] admin read failed:', e);
    res.status(500).json({ error: 'Failed to read campaign config' });
  }
});

/** Validate a draft without persisting it — powers the admin Preview button. */
app.post('/api/config/admin/preview', requireAdminToken, (req, res) => {
  const draft = req.body && req.body.config;
  if (!configStore.isValidConfig(draft)) {
    return res.status(400).json({ valid: false, error: 'Config failed validation' });
  }
  res.json({ valid: true, config: draft });
});

/** Replace the whole config. updatedAt and version are stamped by the store. */
app.put('/api/config/admin/campaigns', requireAdminToken, async (req, res) => {
  try {
    const saved = await configStore.write(req.body && req.body.config);
    res.json({ success: true, config: saved, store: configStore.describe() });
  } catch (e) {
    const code = e.statusCode || 500;
    console.error('[Config] admin write failed:', e.message);
    res.status(code).json({ error: code === 400 ? 'Config failed validation' : 'Failed to save campaign config' });
  }
});

/** The toggle. Smallest possible write, so a flip cannot corrupt other fields. */
app.patch('/api/config/admin/campaigns/:id/active', requireAdminToken, async (req, res) => {
  try {
    const config = JSON.parse(JSON.stringify(await getLiveCampaignConfig()));
    const target = (config.campaigns || []).find(c => c.id === req.params.id);
    if (!target) return res.status(404).json({ error: 'Campaign not found' });
    target.active = !!(req.body && req.body.active);
    const saved = await configStore.write(config);
    res.json({ success: true, id: target.id, active: target.active, config: saved });
  } catch (e) {
    console.error('[Config] admin toggle failed:', e.message);
    res.status(500).json({ error: 'Failed to toggle campaign' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// 🔴 LIVE RADIO API — The Core Sync Endpoints (MUST be before static files)
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
        // Compatibility shape expected by rebuilt clients
        currentTrack: {
            title: track.title,
            duration: broadcast.getTrackDuration(livePos.trackIndex),
            index: livePos.trackIndex + 1
        },
        position: Math.round(livePos.trackPosition * 100) / 100,
        listeners: broadcast.getListenerCount(),
        isPlaying: true,

        // What to play
        trackIndex: livePos.trackIndex,
        shufflePosition: livePos.shufflePosition,
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
        shufflePosition: livePos.shufflePosition,
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
 * ═══════════════════════════════════════════════════════════════════════════
 * GLOBAL COMMUNITY & REAL-TIME PRESENCE API
 * ═══════════════════════════════════════════════════════════════════════════
 */
app.post('/api/community/heartbeat', (req, res) => {
    const { id, activity, streak, displayName, isPublic } = req.body || {};
    communityPresence.recordHeartbeat(id, { activity, streak, displayName, isPublic });
    res.json({
        ok: true,
        presence: communityPresence.getLivePresence(),
        timestamp: Date.now()
    });
});

app.get('/api/community/live-presence', (req, res) => {
    res.json(communityPresence.getLivePresence());
});

app.get('/api/community/milestones', (req, res) => {
    res.json(communityPresence.getMilestones());
});

app.get('/api/community/leaderboard', (req, res) => {
    const period = req.query.period || 'weekly';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    res.json(communityPresence.getLeaderboard(period, page, limit));
});

app.post('/api/user/sync', (req, res) => {
    const { uid, displayName, streak, preferences, username } = req.body || {};
    if (!uid) return res.status(400).json({ error: 'uid is required' });
    // Zero-Client-Trust: Validate streak bounds
    const safeStreak = Math.max(0, Math.min(3650, parseInt(streak || 0, 10)));
    if (username || displayName) {
        registerUser({
            uid,
            username: username ? sanitizeString(username, 30).toLowerCase().replace(/[^a-z0-9_]/g, '') : undefined,
            displayName: displayName ? sanitizeString(displayName, 50) : undefined,
            streak: safeStreak
        });
    }
    res.json({ ok: true, syncedAt: new Date().toISOString(), validatedStreak: safeStreak });
});

app.get('/api/config/firebase-web', (req, res) => {
    res.json({
        apiKey: process.env.FIREBASE_WEB_API_KEY || null,
        projectId: process.env.FIREBASE_PROJECT_ID || 'anhad-4bf78'
    });
});

// Rate limiters for security
const friendSearchLimiter = createRateLimiter(40, 60000, 'search');
const friendRequestLimiter = createRateLimiter(15, 900000, 'friend_req');
const amritVelaTriggerLimiter = createRateLimiter(5, 60000, 'amritvela_trigger');

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SANGAT & FRIENDS CONNECTIVITY API
 * ═══════════════════════════════════════════════════════════════════════════
 */
app.get('/api/friends/search', friendSearchLimiter, (req, res) => {
    const q = req.query.q || '';
    const currentUid = req.headers['authorization'] ? (req.user?.uid || null) : null;
    const results = friendsEngine.searchUsers(q, currentUid);
    res.json({ ok: true, results });
});

app.post('/api/friends/request', requireAuth, friendRequestLimiter, (req, res) => {
    try {
        const { target } = req.body || {};
        if (!target) return res.status(400).json({ error: 'target (username or UID) is required' });
        const result = friendsEngine.sendRequest(req.user.uid, target);
        res.json(result);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || 'Failed to send friend request' });
    }
});

app.post('/api/friends/respond', requireAuth, (req, res) => {
    try {
        const { requestId, action } = req.body || {};
        if (!requestId || !action) return res.status(400).json({ error: 'requestId and action required' });
        const result = friendsEngine.respondRequest(req.user.uid, requestId, action);
        res.json(result);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || 'Failed to respond to request' });
    }
});

app.post('/api/friends/remove', requireAuth, (req, res) => {
    try {
        const { friendUid } = req.body || {};
        if (!friendUid) return res.status(400).json({ error: 'friendUid is required' });
        const result = friendsEngine.removeFriend(req.user.uid, friendUid);
        res.json(result);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || 'Failed to remove friend' });
    }
});

app.get('/api/friends/list', requireAuth, (req, res) => {
    const list = friendsEngine.getFriendsList(req.user.uid);
    res.json({ ok: true, ...list });
});

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COMPANION RELATIONSHIPS & AMRIT VELA NOTIFICATION API
 * ═══════════════════════════════════════════════════════════════════════════
 */
app.post('/api/companions/set', requireAuth, (req, res) => {
    try {
        const { friendUid, isCompanion } = req.body || {};
        const result = companionEngine.setCompanion(req.user.uid, friendUid, isCompanion);
        res.json(result);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || 'Failed to set companion' });
    }
});

app.post('/api/companions/notification', requireAuth, (req, res) => {
    try {
        const { friendUid, notify } = req.body || {};
        const result = companionEngine.setNotification(req.user.uid, friendUid, notify);
        res.json(result);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || 'Failed to update notification setting' });
    }
});

app.get('/api/companions/list', requireAuth, (req, res) => {
    const companions = companionEngine.getCompanions(req.user.uid);
    res.json({ ok: true, companions });
});

app.get('/api/companions/sangat-gathering', requireAuth, (req, res) => {
    const gathering = companionNotifications.checkSangatGathering(req.user.uid);
    res.json({ ok: true, ...gathering });
});

app.post('/api/amritvela/start', requireAuth, amritVelaTriggerLimiter, (req, res) => {
    try {
        const result = companionNotifications.markAmritVelaStarted(req.user.uid);
        res.json(result);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || 'Failed to record Amrit Vela', ...err });
    }
});

app.get('/api/notifications', requireAuth, (req, res) => {
    const notifications = companionNotifications.getNotifications(req.user.uid);
    res.json({ ok: true, notifications });
});

app.post('/api/notifications/:id/read', requireAuth, (req, res) => {
    const result = companionNotifications.markAsRead(req.user.uid, req.params.id);
    res.json(result);
});

app.delete('/api/notifications', requireAuth, (req, res) => {
    const result = companionNotifications.clearNotifications(req.user.uid);
    res.json(result);
});

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * REUSABLE SPIRITUAL CAMPAIGN & UNIVERSAL SHARING API
 * ═══════════════════════════════════════════════════════════════════════════
 */
app.get('/api/campaigns/active', (req, res) => {
    const active = campaignEngine.getActiveCampaign();
    res.json({ ok: true, campaign: active });
});

app.get('/api/campaigns/share', (req, res) => {
    const campaignId = req.query.id || 'chaliya-2026';
    try {
        const host = req.protocol + '://' + req.get('host');
        const shareData = campaignEngine.generateShareableUrl(campaignId, host);
        res.json({ ok: true, ...shareData });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || 'Campaign not found' });
    }
});

// Universal Link Landing Page for WhatsApp & Social Sharing
app.get('/share/campaign', (req, res) => {
    const campaignId = req.query.id || 'chaliya-2026';
    const campaign = campaignEngine.getCampaignById(campaignId);
    if (!campaign) return res.status(404).send('Campaign not found');

    const destination = campaign.webDestination || '/Companion/companion.html';
    const deepLink = campaign.deepLink || 'anhad://companion';

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${campaign.title} | ANHAD</title>
  <meta property="og:title" content="${campaign.title}">
  <meta property="og:description" content="Day ${campaign.currentDay} of ${campaign.totalDays} — ${campaign.subtitle}">
  <meta property="og:image" content="${campaign.artworkUrl}">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0F0F12; color: #F5F5F7; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; text-align: center; }
    .card { max-width: 440px; width: 100%; background: #1C1A18; border: 1px solid rgba(212,160,58,0.3); border-radius: 24px; padding: 32px 24px; box-shadow: 0 16px 48px rgba(0,0,0,0.5); }
    .logo { width: 64px; height: 64px; border-radius: 16px; margin-bottom: 16px; }
    h1 { font-size: 22px; color: #D4A03A; margin: 0 0 8px; }
    p { font-size: 14px; color: #A8A29E; line-height: 1.5; margin: 0 0 24px; }
    .btn { display: block; width: 100%; padding: 14px; margin-bottom: 12px; border-radius: 12px; font-weight: 700; font-size: 15px; text-decoration: none; box-sizing: border-box; transition: transform 0.15s; }
    .btn-primary { background: linear-gradient(135deg, #D4A03A, #B8860B); color: #000; }
    .btn-secondary { background: rgba(255,255,255,0.08); color: #FFF; border: 1px solid rgba(255,255,255,0.15); }
  </style>
  <script>
    window.location.href = "${deepLink}";
  </script>
</head>
<body>
  <div class="card">
    <img src="/assets/app-logo-384.avif" alt="ANHAD" class="logo">
    <h1>${campaign.title}</h1>
    <p>Day ${campaign.currentDay} of ${campaign.totalDays} • Sacred Amrit Vela Journey</p>
    <a href="${deepLink}" class="btn btn-primary">Open in ANHAD App</a>
    <a href="${destination}" class="btn btn-secondary">Continue in Web App</a>
  </div>
</body>
</html>`);
});

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ADMIN MONITORING API — WHO IS LIVE NOW (STRICTLY ADMIN AUTHORIZED)
 * ═══════════════════════════════════════════════════════════════════════════
 */
app.get('/api/admin/live-now', requireAdmin, (req, res) => {
    res.json(adminEngine.getWhoIsLiveNow());
});

app.get('/api/admin/campaigns', requireAdmin, (req, res) => {
    res.json({ ok: true, campaigns: campaignEngine.getAllCampaigns() });
});

app.post('/api/admin/campaigns', requireAdmin, (req, res) => {
    try {
        const saved = campaignEngine.saveCampaign(req.body);
        res.json({ ok: true, campaign: saved });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || 'Failed to save campaign' });
    }
});

app.post('/api/admin/campaigns/:id/toggle', requireAdmin, (req, res) => {
    try {
        const { isActive } = req.body || {};
        const updated = campaignEngine.toggleCampaignStatus(req.params.id, isActive);
        res.json({ ok: true, campaign: updated });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || 'Failed to toggle campaign' });
    }
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
// 🔴 WAHEGURU SIMRAN API — Same architecture as Amritvela (SIMRAN_PLAYLIST)
// All devices hear the exact same track at the exact same position.
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /api/simran/live
 *
 * Returns the exact current live position for the Waheguru Simran broadcast.
 * Identical shape to /api/radio/live so the singleton can use it transparently.
 */
app.get('/api/simran/live', (req, res) => {
    let livePos, track;
    try {
        livePos = simranBroadcast.getCurrentLivePosition();
        track = SIMRAN_PLAYLIST[livePos.trackIndex];
        if (!track) throw new Error('Simran track index out of bounds: ' + livePos.trackIndex);
    } catch (err) {
        console.error('[Simran] Live position error:', err.message);
        return res.status(500).json({ error: 'Simran broadcast engine error' });
    }

    res.json({
        // Core what-to-play fields
        trackIndex: livePos.trackIndex,
        shufflePosition: livePos.shufflePosition,
        trackPosition: Math.round(livePos.trackPosition * 100) / 100,
        trackTitle: track.title,
        trackArtist: track.artist,
        trackFilename: track.filename,
        trackDuration: simranBroadcast.getTrackDuration(livePos.trackIndex),

        // Compatibility with singleton's liveposition event
        position: Math.round(livePos.trackPosition * 100) / 100,

        // Metadata
        totalElapsed: Math.round(livePos.totalElapsed),
        playlistDuration: Math.round(livePos.playlistDuration),
        playlistCycle: livePos.playlistCycle,
        totalTracks: SIMRAN_PLAYLIST.length,

        // Sync
        epoch: simranBroadcast.epoch,
        serverTime: Date.now(),
        isPlaying: true,
        listeners: simranBroadcast.getListenerCount(),
        listenersCount: simranBroadcast.getListenerCount(),

        // All durations for local timeline prediction
        trackDurations: Object.fromEntries(
            SIMRAN_PLAYLIST.map((_, i) => [i, simranBroadcast.getTrackDuration(i)])
        )
    });
});

/**
 * POST /api/simran/durations
 * Clients report actual track durations — improves accuracy over time.
 */
app.post('/api/simran/durations', (req, res) => {
    const { trackIndex, duration } = req.body;

    if (typeof trackIndex !== 'number' || typeof duration !== 'number') {
        return res.status(400).json({ error: 'trackIndex and duration are required numbers' });
    }

    const accepted = simranBroadcast.reportDuration(trackIndex, duration);
    res.json({
        accepted,
        trackIndex,
        duration: simranBroadcast.getTrackDuration(trackIndex),
        knownDurations: Object.keys(simranBroadcast.trackDurations).length
    });
});

/**
 * POST /api/simran/heartbeat
 * Clients call this every 30s to register as active listeners.
 */
app.post('/api/simran/heartbeat', (req, res) => {
    const { listenerId } = req.body;

    if (!listenerId) {
        return res.status(400).json({ error: 'listenerId is required' });
    }

    simranBroadcast.heartbeat(listenerId, req.headers['user-agent'] || '');

    const livePos = simranBroadcast.getCurrentLivePosition();
    const track = SIMRAN_PLAYLIST[livePos.trackIndex];

    res.json({
        ok: true,
        listenersCount: simranBroadcast.getListenerCount(),
        trackIndex: livePos.trackIndex,
        shufflePosition: livePos.shufflePosition,
        trackPosition: Math.round(livePos.trackPosition * 100) / 100,
        trackFilename: track ? track.filename : '',
        serverTime: Date.now()
    });
});

/**
 * GET /api/simran/listeners
 */
app.get('/api/simran/listeners', (req, res) => {
    res.json({
        count: simranBroadcast.getListenerCount(),
        timestamp: Date.now()
    });
});

/**
 * GET /api/simran/status
 */
app.get('/api/simran/status', (req, res) => {
    const livePos = simranBroadcast.getCurrentLivePosition();
    const track = SIMRAN_PLAYLIST[livePos.trackIndex];
    const knownCount = Object.keys(simranBroadcast.trackDurations).length;

    res.json({
        status: 'broadcasting',
        epoch: simranBroadcast.epoch,
        epochDate: new Date(simranBroadcast.epoch).toISOString(),
        uptime: simranBroadcast.formatTime(livePos.totalElapsed),
        currentTrack: {
            index: livePos.trackIndex,
            title: track ? track.title : 'Unknown',
            artist: track ? track.artist : 'Unknown',
            position: simranBroadcast.formatTime(livePos.trackPosition),
            duration: simranBroadcast.formatTime(simranBroadcast.getTrackDuration(livePos.trackIndex))
        },
        playlist: {
            totalTracks: SIMRAN_PLAYLIST.length,
            totalDuration: simranBroadcast.formatTime(livePos.playlistDuration),
            cycle: livePos.playlistCycle,
            knownDurations: `${knownCount}/${SIMRAN_PLAYLIST.length}`
        },
        listeners: { active: simranBroadcast.getListenerCount() },
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
    // 1. Check custom header (for Capacitor persistent sessions)
    const headerUserId = req.headers['x-user-id'];
    if (headerUserId && UUID_REGEX.test(headerUserId)) {
        return headerUserId;
    }

    // 2. Check query parameter
    const queryUserId = req.query.userId;
    if (queryUserId && UUID_REGEX.test(queryUserId)) {
        return queryUserId;
    }

    // 3. Fallback to Cookie
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

// '/admin' & '/Admin' routes
app.get(['/admin', '/Admin', '/admin/'], (req, res) => {
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    return res.redirect(301, `/Admin/index.html${query}`);
});

// Admin static directories
app.use('/Admin', express.static(path.join(CONFIG.FRONTEND_ROOT, 'Admin')));
app.use('/admin', express.static(path.join(CONFIG.FRONTEND_ROOT, 'Admin')));

// Explicit MIME type fallbacks for admin css and js assets
app.get(['/admin.css', '/Admin/admin.css'], (req, res) => {
    res.type('text/css').sendFile(path.join(CONFIG.FRONTEND_ROOT, 'Admin', 'admin.css'));
});
app.get(['/admin.js', '/Admin/admin.js'], (req, res) => {
    res.type('application/javascript').sendFile(path.join(CONFIG.FRONTEND_ROOT, 'Admin', 'admin.js'));
});

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

// ─── ROUTE ALIASES: Reader Redirects (Placed high in route order) ───────
app.get('/reader.html', (req, res) => {
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    if (req.query.ang || req.url.includes('ang=')) {
        return res.redirect(301, `/SehajPaath/reader.html${query}`);
    }
    return res.redirect(301, `/nitnem/reader.html${query}`);
});
app.get('/sehaj-reader.html', (req, res) => {
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    return res.redirect(301, `/SehajPaath/reader.html${query}`);
});
// Handled earlier

// ═══════════════════════════════════════════════════════════════════
// STATIC AUDIO FILES - Alarm tones (must be before /audio proxy)
// ═══════════════════════════════════════════════════════════════════

app.use('/Audio', express.static(path.join(CONFIG.FRONTEND_ROOT, 'Audio')));

// ─── HUKAMNAMA AUDIO PROXY ─────────────────────────────────────────
// Scrapes SGPC page to find today's audio URL and proxies/redirects it.
// Cached for 15 minutes to reduce SGPC server load.
let hukamAudioCache = { url: null, ts: 0 };

app.get('/api/hukamnama/audio', async (req, res) => {
    // Set CORS headers FIRST before any async operations
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    
    try {
        const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
        const now = Date.now();

        // Step 1: Get the real URL (with caching)
        if (!hukamAudioCache.url || (now - hukamAudioCache.ts) > CACHE_TTL) {
            const https = require('https');
            const html = await new Promise((resolve, reject) => {
                const r = https.get('https://sgpc.net/hukamnama-sahib/', {
                    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AnhadApp/3.0)' },
                    timeout: 8000
                }, (res2) => {
                    let data = '';
                    res2.on('data', c => data += c);
                    res2.on('end', () => resolve(data));
                });
                r.on('error', reject);
                r.on('timeout', () => { 
                    r.destroy(); 
                    reject(new Error('Scraping timeout')); 
                });
            });

            const mp3Match = html.match(/["'](https?:\/\/[^"']+\.mp3[^"']*)['"]/i);
            if (mp3Match && mp3Match[1]) {
                hukamAudioCache = { url: mp3Match[1], ts: now };
                console.log('[🎙️ Hukamnama] Scraped fresh URL:', mp3Match[1]);
            } else {
                const d = new Date();
                hukamAudioCache = {
                    url: `https://www.sgpc.net/hukamnama/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/hukamnama.mp3`,
                    ts: now
                };
                console.log('[🎙️ Hukamnama] No URL in page, using fallback:', hukamAudioCache.url);
            }
        }

        // Step 2: Redirect the client directly to the SGPC audio file (supports Range requests & iOS/Safari)
        console.log('[🎙️ Hukamnama] Redirecting to:', hukamAudioCache.url);
        res.redirect(302, hukamAudioCache.url);

    } catch (err) {
        console.error('[🎙️ Hukamnama] Proxy error:', err.message);
        if (!res.headersSent) {
            // Return 504 for timeout errors, 502 for other errors
            const statusCode = err.message.includes('timeout') ? 504 : 502;
            res.status(statusCode).json({ error: 'Could not stream Hukamnama audio' });
        }
    }
});


// ═══════════════════════════════════════════════════════════════════
// AUDIO PROXY
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// 🟣 MAGICAL SIMRAN API
// ═══════════════════════════════════════════════════════════════════

app.get('/api/simran/live', (req, res) => {
    let livePos, track;
    try {
        livePos = simranBroadcast.getCurrentLivePosition();
        track = SIMRAN_PLAYLIST[livePos.trackIndex];
        if (!track) throw new Error('Track index out of bounds: ' + livePos.trackIndex);
    } catch (err) {
        console.error('[Radio] Live position error:', err.message);
        return res.status(500).json({ error: 'Broadcast engine error' });
    }

    res.json({
        // Compatibility shape expected by rebuilt clients
        currentTrack: {
            title: track.title,
            duration: simranBroadcast.getTrackDuration(livePos.trackIndex),
            index: livePos.trackIndex + 1
        },
        position: Math.round(livePos.trackPosition * 100) / 100,
        listeners: simranBroadcast.getListenerCount(),
        isPlaying: true,

        // What to play
        trackIndex: livePos.trackIndex,
        shufflePosition: livePos.shufflePosition,
        trackPosition: Math.round(livePos.trackPosition * 100) / 100,
        trackTitle: track.title,
        trackArtist: track.artist,
        trackFilename: track.filename,
        trackUrl: `${CONFIG.SIMRAN_R2_BASE_URL}/${CONFIG.SIMRAN_R2_PREFIX.replace(/^\/+|\/+$/g, '')}/${encodeURIComponent(track.filename)}`,
        trackDuration: simranBroadcast.getTrackDuration(livePos.trackIndex),

        // Metadata
        totalElapsed: Math.round(livePos.totalElapsed),
        playlistDuration: Math.round(livePos.playlistDuration),
        playlistCycle: livePos.playlistCycle,
        totalTracks: SIMRAN_PLAYLIST.length,

        // Sync data
        epoch: simranBroadcast.epoch,
        serverTime: Date.now(),

        // Community
        listenersCount: simranBroadcast.getListenerCount(),

        // All track durations for client-side prediction
        trackDurations: Object.fromEntries(
            SIMRAN_PLAYLIST.map((_, i) => [i, simranBroadcast.getTrackDuration(i)])
        )
    });
});

/**
 * POST /api/simran/durations
 * 
 * Clients report actual track durations when they load metadata.
 * This improves accuracy over time as real durations replace estimates.
 * 
 * Body: { trackIndex: number, duration: number }
 */
app.post('/api/simran/durations', (req, res) => {
    const { trackIndex, duration } = req.body;

    if (typeof trackIndex !== 'number' || typeof duration !== 'number') {
        return res.status(400).json({ error: 'trackIndex and duration are required numbers' });
    }

    const accepted = simranBroadcast.reportDuration(trackIndex, duration);
    res.json({
        accepted,
        trackIndex,
        duration: simranBroadcast.getTrackDuration(trackIndex),
        knownDurations: Object.keys(simranBroadcast.trackDurations).length
    });
});

/**
 * POST /api/simran/heartbeat
 * 
 * Clients call this every 30s to maintain their "listener" status.
 * Returns current live position for drift correction.
 * 
 * Body: { listenerId: string }
 */
app.post('/api/simran/heartbeat', (req, res) => {
    const { listenerId } = req.body;

    if (!listenerId) {
        return res.status(400).json({ error: 'listenerId is required' });
    }

    simranBroadcast.heartbeat(listenerId, req.headers['user-agent'] || '');

    const livePos = simranBroadcast.getCurrentLivePosition();
    const track = SIMRAN_PLAYLIST[livePos.trackIndex];

    res.json({
        ok: true,
        listenersCount: simranBroadcast.getListenerCount(),
        // Drift correction data
        trackIndex: livePos.trackIndex,
        shufflePosition: livePos.shufflePosition,
        trackPosition: Math.round(livePos.trackPosition * 100) / 100,
        trackFilename: track.filename,
        serverTime: Date.now()
    });
});

/**
 * GET /api/simran/listeners
 * 
 * Returns the current listener count.
 */
app.get('/api/simran/listeners', (req, res) => {
    res.json({
        count: simranBroadcast.getListenerCount(),
        timestamp: Date.now()
    });
});

/**
 * GET /api/simran/status
 * 
 * Detailed broadcast status for admin/debugging.
 */
app.get('/api/simran/status', (req, res) => {
    const livePos = simranBroadcast.getCurrentLivePosition();
    const track = SIMRAN_PLAYLIST[livePos.trackIndex];
    const knownCount = Object.keys(simranBroadcast.trackDurations).length;

    res.json({
        status: 'broadcasting',
        epoch: simranBroadcast.epoch,
        epochDate: new Date(simranBroadcast.epoch).toISOString(),
        uptime: simranBroadcast.formatTime(livePos.totalElapsed),
        currentTrack: {
            index: livePos.trackIndex,
            title: track.title,
            artist: track.artist,
            position: simranBroadcast.formatTime(livePos.trackPosition),
            duration: simranBroadcast.formatTime(simranBroadcast.getTrackDuration(livePos.trackIndex))
        },
        playlist: {
            totalTracks: SIMRAN_PLAYLIST.length,
            totalDuration: simranBroadcast.formatTime(livePos.playlistDuration),
            cycle: livePos.playlistCycle,
            knownDurations: `${knownCount}/${SIMRAN_PLAYLIST.length}`
        },
        listeners: {
            active: simranBroadcast.getListenerCount()
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
// STATIC AUDIO FILES - Alarm tones (must be before /audio proxy)
// ═══════════════════════════════════════════════════════════════════

app.use('/Audio', express.static(path.join(CONFIG.FRONTEND_ROOT, 'Audio')));

// ═══════════════════════════════════════════════════════════════════
// AUDIO PROXY
// ═══════════════════════════════════════════════════════════════════

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

        // CORS headers for cross-origin audio streaming - allow all origins for audio
        const origin = req.headers.origin;
        if (IS_LOCAL_DEV && (!origin || origin.includes('localhost') || origin.includes('127.0.0.1'))) {
            res.setHeader('Access-Control-Allow-Origin', origin || '*');
        } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
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

app.get('/simran-audio/:filename', async (req, res) => {
    const filename = req.params.filename;

    if (!filename.endsWith('.mp3')) {
        return res.status(400).json({ error: 'Invalid audio filename' });
    }

    const simranPrefix = CONFIG.SIMRAN_R2_PREFIX
        ? CONFIG.SIMRAN_R2_PREFIX.replace(/^\/+|\/+$/g, '') + '/'
        : '';
    const r2Url = `${CONFIG.SIMRAN_R2_BASE_URL}/${simranPrefix}${encodeURIComponent(filename)}`;

    console.log(`[Proxy] Fetching: ${r2Url}`);

    if (process.env.SIMRAN_PROXY_MODE !== 'stream') {
        return res.redirect(302, r2Url);
    }

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

        // CORS headers for cross-origin audio streaming - allow all origins for audio
        const origin = req.headers.origin;
        if (IS_LOCAL_DEV && (!origin || origin.includes('localhost') || origin.includes('127.0.0.1'))) {
            res.setHeader('Access-Control-Allow-Origin', origin || '*');
        } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Content-Type', r2Response.headers.get('content-type') || 'audio/mpeg');
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
// SERVER-SIDE SEEK TRANSCODE — Android WebView bypass
// ═══════════════════════════════════════════════════════════════════

app.get('/api/stream-mp3', async (req, res) => {
    const { file, start } = req.query;
    if (!file || typeof file !== 'string') {
        return res.status(400).json({ error: 'Missing file parameter' });
    }
    const seekSeconds = Math.max(0, Math.floor(Number(start) || 0));

    // Validate file is from our known playlists
    const isValid = PLAYLIST.some(t => t.filename === file) ||
        SIMRAN_PLAYLIST.some(t => t.filename === file);
    if (!isValid) {
        return res.status(400).json({ error: 'Invalid audio filename' });
    }

    const isMP3 = file.endsWith('.mp3');
    const r2Base = isMP3 ? CONFIG.SIMRAN_R2_BASE_URL : CONFIG.R2_BASE_URL;
    const simranPrefix = isMP3 ? (CONFIG.SIMRAN_R2_PREFIX.replace(/^\/+|\/+$/g, '') + '/') : '';
    const inputUrl = `${r2Base}/${simranPrefix}${encodeURIComponent(file)}`;

    console.log(`[Transcode] ffmpeg seek ${seekSeconds}s → ${file}`);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Connection', 'keep-alive');

    const command = ffmpeg(inputUrl)
        .seekInput(seekSeconds)
        .audioCodec(isMP3 ? 'copy' : 'libmp3lame')
        .audioBitrate(isMP3 ? null : '128k')
        .format('mp3')
        .on('start', (cmd) => console.log(`[Transcode] ${cmd}`))
        .on('error', (err, stdout, stderr) => {
            console.error('[Transcode] ffmpeg error:', err.message);
            if (!res.headersSent) res.status(500).json({ error: 'Transcode failed' });
        })
        .on('end', () => console.log('[Transcode] ffmpeg finished'));

    command.pipe(res, { end: true });

    req.on('close', () => {
        try { command.kill('SIGKILL'); } catch (e) { }
    });
});

// ═══════════════════════════════════════════════════════════════════
// DARBAR SAHIB LIVE PROXY — Android WebView stabilization
// ═══════════════════════════════════════════════════════════════════

app.get('/api/darbar-live', async (req, res) => {
    // Proxy SGPC live stream through our domain.
    // Some Android WebView media stacks behave poorly with the original URL format/port.
    const upstreamUrl = 'https://live.sgpc.net:8443/;nocache=1';

    try {
        const upstream = await fetch(upstreamUrl, {
            headers: {
                // Avoid intermediary caching.
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                // Pass through user agent for compatibility.
                'User-Agent': req.headers['user-agent'] || 'ANHAD'
            }
        });

        if (!upstream.ok) {
            console.error(`[DarbarProxy] Upstream error: ${upstream.status}`);
            return res.status(upstream.status).json({ error: 'Upstream live stream unavailable' });
        }

        res.setHeader('Content-Type', upstream.headers.get('content-type') || 'audio/mpeg');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

        const stream = Readable.fromWeb(upstream.body);
        stream.pipe(res);

        stream.on('error', (err) => console.error('[DarbarProxy] Stream error:', err.message));
        res.on('close', () => stream.destroy());
    } catch (e) {
        console.error('[DarbarProxy] Error:', e.message);
        res.status(500).json({ error: 'Darbar proxy error' });
    }
});

// ═══════════════════════════════════════════════════════════════════
// 🕉️ SADHSANGAT LIVE DATABASE & CACHE BACKEND
// ═══════════════════════════════════════════════════════════════════

let dbClient = null;
let useJsonFallback = false;
const jsonDbPath = path.join(__dirname, 'data', 'sadhsangat-cache.json');
let jsonData = { channels: [], user_channels: [] };

async function initSadhsangatDb() {
    const dataDir = path.join(__dirname, 'data');
    try {
        await fs.mkdir(dataDir, { recursive: true });
    } catch (e) { }

    try {
        const sqlite3Module = require('sqlite3').verbose();
        const dbPath = path.join(dataDir, 'sadhsangat.db');

        await new Promise((resolve) => {
            dbClient = new sqlite3Module.Database(dbPath, (err) => {
                if (err) {
                    console.error('[Sadhsangat DB] SQLite connection error, falling back to JSON cache:', err.message);
                    setupJsonFallback();
                    resolve();
                } else {
                    console.log('[Sadhsangat DB] Connected to SQLite database');
                    createTables(resolve);
                }
            });
        });
    } catch (err) {
        console.warn('[Sadhsangat DB] sqlite3 package load failed, falling back to JSON cache:', err.message);
        setupJsonFallback();
    }

    // Seed default channels if database is empty
    await seedDefaultChannels();
}

function setupJsonFallback() {
    useJsonFallback = true;
    try {
        if (fsSync.existsSync(jsonDbPath)) {
            const content = fsSync.readFileSync(jsonDbPath, 'utf8');
            jsonData = JSON.parse(content);
            if (!jsonData.channels) jsonData.channels = [];
            if (!jsonData.user_channels) jsonData.user_channels = [];
            console.log('[Sadhsangat DB] Loaded fallback JSON database with ' + jsonData.channels.length + ' channels');
        } else {
            saveJsonDbSync();
            console.log('[Sadhsangat DB] Created fresh fallback JSON database');
        }
    } catch (e) {
        console.error('[Sadhsangat DB] Error loading JSON fallback:', e.message);
    }
}

function saveJsonDbSync() {
    try {
        fsSync.writeFileSync(jsonDbPath, JSON.stringify(jsonData, null, 2), 'utf8');
    } catch (e) {
        console.error('[Sadhsangat DB] Failed to save JSON database:', e.message);
    }
}

async function saveJsonDb() {
    try {
        await fs.writeFile(jsonDbPath, JSON.stringify(jsonData, null, 2), 'utf8');
    } catch (e) {
        console.error('[Sadhsangat DB] Failed to save JSON database:', e.message);
    }
}

function createTables(doneCallback) {
    dbClient.serialize(() => {
        dbClient.run(`
            CREATE TABLE IF NOT EXISTS channels (
                channelId TEXT PRIMARY KEY,
                channelName TEXT NOT NULL,
                channelHandle TEXT,
                subscriberCount TEXT,
                thumbnail TEXT,
                isLive INTEGER DEFAULT 0,
                liveTitle TEXT,
                videoId TEXT,
                watchUrl TEXT,
                lastChecked TEXT,
                isFeatured INTEGER DEFAULT 0,
                displayOrder INTEGER DEFAULT 0,
                isEnabled INTEGER DEFAULT 1,
                notifyOnLive INTEGER DEFAULT 1,
                scheduledStartTime TEXT,
                scheduledTitle TEXT,
                scheduledVideoId TEXT
            )
        `, (err) => {
            if (err) console.error('[Sadhsangat DB] Error creating channels table:', err.message);
            // Migration: add channelHandle if it doesn't exist in older DBs
            dbClient.run(`ALTER TABLE channels ADD COLUMN channelHandle TEXT`, () => { });
        });

        dbClient.run(`
            CREATE TABLE IF NOT EXISTS user_channels (
                userId TEXT,
                channelId TEXT,
                displayOrder INTEGER DEFAULT 0,
                PRIMARY KEY (userId, channelId)
            )
        `, (err) => {
            if (err) {
                console.error('[Sadhsangat DB] Error creating user_channels table:', err.message);
            }
            if (doneCallback) doneCallback();
        });
    });
}

const SadhsangatDb = {
    async getAllChannels() {
        if (useJsonFallback) {
            return jsonData.channels;
        }
        return new Promise((resolve, reject) => {
            dbClient.all("SELECT * FROM channels", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    },

    async getFeaturedChannels() {
        if (useJsonFallback) {
            return jsonData.channels
                .filter(c => c.isFeatured === 1 && c.isEnabled === 1)
                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        }
        return new Promise((resolve, reject) => {
            dbClient.all("SELECT * FROM channels WHERE isFeatured = 1 AND isEnabled = 1 ORDER BY displayOrder ASC", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    },

    async getLiveChannels() {
        if (useJsonFallback) {
            return jsonData.channels.filter(c => c.isLive === 1 && c.isEnabled === 1);
        }
        return new Promise((resolve, reject) => {
            dbClient.all("SELECT * FROM channels WHERE isLive = 1 AND isEnabled = 1", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    },

    async getChannelById(channelId) {
        if (useJsonFallback) {
            return jsonData.channels.find(c => c.channelId === channelId) || null;
        }
        return new Promise((resolve, reject) => {
            dbClient.get("SELECT * FROM channels WHERE channelId = ?", [channelId], (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            });
        });
    },

    async upsertChannel(ch) {
        if (useJsonFallback) {
            const index = jsonData.channels.findIndex(c => c.channelId === ch.channelId);
            if (index !== -1) {
                jsonData.channels[index] = { ...jsonData.channels[index], ...ch };
            } else {
                jsonData.channels.push({
                    isLive: 0,
                    isFeatured: 0,
                    displayOrder: 0,
                    isEnabled: 1,
                    notifyOnLive: 1,
                    ...ch
                });
            }
            await saveJsonDb();
            return;
        }

        const existing = await this.getChannelById(ch.channelId);
        if (existing) {
            const query = `
                UPDATE channels SET 
                    channelName = ?, 
                    channelHandle = COALESCE(?, channelHandle),
                    subscriberCount = COALESCE(?, subscriberCount), 
                    thumbnail = COALESCE(?, thumbnail), 
                    isLive = ?, 
                    liveTitle = ?, 
                    videoId = ?, 
                    watchUrl = ?, 
                    lastChecked = ?,
                    isFeatured = COALESCE(?, isFeatured),
                    displayOrder = COALESCE(?, displayOrder),
                    isEnabled = COALESCE(?, isEnabled),
                    notifyOnLive = COALESCE(?, notifyOnLive),
                    scheduledStartTime = ?,
                    scheduledTitle = ?,
                    scheduledVideoId = ?
                WHERE channelId = ?
            `;
            const params = [
                ch.channelName, ch.channelHandle || null, ch.subscriberCount, ch.thumbnail, ch.isLive,
                ch.liveTitle, ch.videoId, ch.watchUrl, ch.lastChecked,
                ch.isFeatured, ch.displayOrder, ch.isEnabled, ch.notifyOnLive,
                ch.scheduledStartTime, ch.scheduledTitle, ch.scheduledVideoId,
                ch.channelId
            ];
            return new Promise((resolve, reject) => {
                dbClient.run(query, params, function (err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                });
            });
        } else {
            const query = `
                INSERT INTO channels (
                    channelId, channelName, channelHandle, subscriberCount, thumbnail, 
                    isLive, liveTitle, videoId, watchUrl, lastChecked, 
                    isFeatured, displayOrder, isEnabled, notifyOnLive,
                    scheduledStartTime, scheduledTitle, scheduledVideoId
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const params = [
                ch.channelId, ch.channelName, ch.channelHandle || null, ch.subscriberCount, ch.thumbnail,
                ch.isLive || 0, ch.liveTitle || null, ch.videoId || null, ch.watchUrl || null, ch.lastChecked || null,
                ch.isFeatured || 0, ch.displayOrder || 0, ch.isEnabled !== undefined ? ch.isEnabled : 1, ch.notifyOnLive !== undefined ? ch.notifyOnLive : 1,
                ch.scheduledStartTime || null, ch.scheduledTitle || null, ch.scheduledVideoId || null
            ];
            return new Promise((resolve, reject) => {
                dbClient.run(query, params, function (err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                });
            });
        }
    },

    async deleteChannel(channelId) {
        if (useJsonFallback) {
            jsonData.channels = jsonData.channels.filter(c => c.channelId !== channelId);
            jsonData.user_channels = jsonData.user_channels.filter(c => c.channelId !== channelId);
            await saveJsonDb();
            return;
        }
        return new Promise((resolve, reject) => {
            dbClient.serialize(() => {
                dbClient.run("DELETE FROM channels WHERE channelId = ?", [channelId], (err) => {
                    if (err) console.error('[Sadhsangat DB] Delete channel reference error:', err.message);
                });
                dbClient.run("DELETE FROM user_channels WHERE channelId = ?", [channelId], function (err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                });
            });
        });
    },

    async getUserChannels(userId) {
        if (useJsonFallback) {
            let userChs = jsonData.user_channels.filter(uc => uc.userId === userId);
            if (userChs.length === 0) {
                const defaultIds = ['UCYn6UEtQ771a_OWSiNBoG8w'];
                for (let idx = 0; idx < defaultIds.length; idx++) {
                    const cid = defaultIds[idx];
                    if (!userChs.some(uc => uc.channelId === cid)) {
                        jsonData.user_channels.push({ userId, channelId: cid, displayOrder: idx });
                    }
                }
                await saveJsonDb();
                userChs = jsonData.user_channels.filter(uc => uc.userId === userId);
            }
            userChs.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
            return userChs.map(uc => {
                const ch = jsonData.channels.find(c => c.channelId === uc.channelId);
                return ch ? { ...ch, displayOrder: uc.displayOrder } : null;
            }).filter(Boolean);
        }
        return new Promise((resolve, reject) => {
            dbClient.all(
                "SELECT channelId FROM user_channels WHERE userId = ?",
                [userId],
                (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (!rows || rows.length === 0) {
                        const defaultIds = ['UCYn6UEtQ771a_OWSiNBoG8w'];
                        dbClient.serialize(() => {
                            defaultIds.forEach((cid, idx) => {
                                dbClient.run(
                                    "INSERT OR IGNORE INTO user_channels (userId, channelId, displayOrder) VALUES (?, ?, ?)",
                                    [userId, cid, idx]
                                );
                            });
                            fetchChannels();
                        });
                    } else {
                        fetchChannels();
                    }
                }
            );

            function fetchChannels() {
                const query = `
                    SELECT c.*, uc.displayOrder 
                    FROM channels c 
                    JOIN user_channels uc ON c.channelId = uc.channelId 
                    WHERE uc.userId = ? 
                    ORDER BY uc.displayOrder ASC
                `;
                dbClient.all(query, [userId], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            }
        });
    },

    async addUserChannel(userId, channelId, displayOrder = 0) {
        if (useJsonFallback) {
            const exists = jsonData.user_channels.some(uc => uc.userId === userId && uc.channelId === channelId);
            if (!exists) {
                jsonData.user_channels.push({ userId, channelId, displayOrder });
                await saveJsonDb();
            }
            return;
        }
        return new Promise((resolve, reject) => {
            dbClient.serialize(() => {
                dbClient.run("DELETE FROM user_channels WHERE userId = ? AND channelId = ?", [userId, channelId], (err) => {
                    if (err) console.error('[Sadhsangat DB] Map reset error:', err.message);
                });
                dbClient.run("INSERT INTO user_channels (userId, channelId, displayOrder) VALUES (?, ?, ?)", [userId, channelId, displayOrder], function (err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                });
            });
        });
    },

    async removeUserChannel(userId, channelId) {
        if (useJsonFallback) {
            jsonData.user_channels = jsonData.user_channels.filter(uc => !(uc.userId === userId && uc.channelId === channelId));
            await saveJsonDb();
            return;
        }
        return new Promise((resolve, reject) => {
            dbClient.run("DELETE FROM user_channels WHERE userId = ? AND channelId = ?", [userId, channelId], function (err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    },

    async reorderUserChannels(userId, orderedChannelIds) {
        if (useJsonFallback) {
            orderedChannelIds.forEach((channelId, index) => {
                const uc = jsonData.user_channels.find(u => u.userId === userId && u.channelId === channelId);
                if (uc) uc.displayOrder = index;
            });
            await saveJsonDb();
            return;
        }
        return new Promise((resolve, reject) => {
            dbClient.serialize(() => {
                const stmt = dbClient.prepare("UPDATE user_channels SET displayOrder = ? WHERE userId = ? AND channelId = ?");
                orderedChannelIds.forEach((channelId, index) => {
                    stmt.run(index, userId, channelId);
                });
                stmt.finalize((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    }
};

async function seedDefaultChannels() {
    // Migrate obsolete fake/extra default channel IDs from SQLite/JSON database
    const obsoleteIds = [
        'UC6U4oR4O2Q-4YV3ZkX6o66Q',
        'UCgjKIbrlQYDJh8UdJUPia3A',
        'UCx8Xu8R-mJEBDit1PPvI08Q',
        'UC2AHnxSbmtaKrk74noBMv-Q',
        'UCswIOlMY2_DT05glwBsxZyg'
    ];
    for (const id of obsoleteIds) {
        try {
            await SadhsangatDb.deleteChannel(id);
            console.log(`[Sadhsangat DB] Cleaned up obsolete channel seed: ${id}`);
        } catch (e) {
            console.warn(`[Sadhsangat DB] Cleanup of obsolete channel ${id} failed:`, e.message);
        }
    }

    // SINGLE default channel — user adds more via the UI
    const defaults = [
        {
            channelId: 'UCYn6UEtQ771a_OWSiNBoG8w',
            channelName: 'SGPC, Sri Amritsar',
            channelHandle: '@SGPCSriAmritsar',
            subscriberCount: '1.67M',
            thumbnail: null,
            isFeatured: 1,
            displayOrder: 1,
            isEnabled: 1,
            notifyOnLive: 1
        }
    ];

    for (const ch of defaults) {
        const existing = await SadhsangatDb.getChannelById(ch.channelId);
        if (!existing) {
            await SadhsangatDb.upsertChannel(ch);
        } else if (!existing.channelHandle && ch.channelHandle) {
            await SadhsangatDb.upsertChannel({ ...existing, channelHandle: ch.channelHandle });
        }
    }

    // Remove old Harmandir Sahib duplicate if present
    const harmDir = await SadhsangatDb.getChannelById('UCNwDk-F10U-cO3g_L20fM_g');
    if (harmDir) {
        await SadhsangatDb.deleteChannel('UCNwDk-F10U-cO3g_L20fM_g');
        console.log('[Sadhsangat DB] Removed duplicate Harmandir Sahib channel');
    }

    // Async: scrape real thumbnails for channels missing them
    scrapeAndUpdateAvatars().catch(e => console.warn('[Sadhsangat] Avatar scrape failed:', e.message));

    console.log('[Sadhsangat DB] Seeding default channels completed');
}

// ═══════════════════════════════════════════════════════════════════
// 📺 YOUTUBE DATA API & CRON POLLING ENGINE (WITH QUOTA PROTECTION)
// ═══════════════════════════════════════════════════════════════════

function formatSubscribers(count) {
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1000) {
        return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return count.toString();
}

async function checkSingleChannel(ch, apiKey) {
    const channelId = ch.channelId;
    let isLive = 0;
    let liveTitle = null;
    let videoId = null;
    let watchUrl = null;
    let liveThumbnail = null;
    let subscriberCount = ch.subscriberCount;
    let thumbnail = ch.thumbnail;

    let scheduledStartTime = null;
    let scheduledTitle = null;
    let scheduledVideoId = null;

    // 1. Fetch channel metadata (subscribers and main thumbnail)
    try {
        const chanRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
            params: {
                part: 'snippet,statistics',
                id: channelId,
                key: apiKey
            }
        });

        if (chanRes.data && chanRes.data.items && chanRes.data.items.length > 0) {
            const chanInfo = chanRes.data.items[0];
            const subs = parseInt(chanInfo.statistics.subscriberCount) || 0;
            subscriberCount = formatSubscribers(subs);
            thumbnail = chanInfo.snippet.thumbnails.default.url || thumbnail;
        }
    } catch (e) {
        console.warn(`[Sadhsangat API] Failed to fetch channel meta for ${channelId}:`, e.message);
    }

    // 2. Fetch live status
    try {
        const liveRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                channelId: channelId,
                eventType: 'live',
                type: 'video',
                key: apiKey
            }
        });

        if (liveRes.data && liveRes.data.items && liveRes.data.items.length > 0) {
            const item = liveRes.data.items[0];
            isLive = 1;
            liveTitle = item.snippet.title;
            videoId = item.id.videoId;
            watchUrl = `https://youtube.com/watch?v=${videoId}`;
            liveThumbnail = item.snippet.thumbnails.medium ? item.snippet.thumbnails.medium.url : item.snippet.thumbnails.default.url;
        }
    } catch (e) {
        if (e.response && e.response.data && e.response.data.error) {
            const errMsg = e.response.data.error.message;
            if (errMsg.toLowerCase().includes('quota')) {
                throw new Error('YouTube API Quota Exceeded (Quota Protection Mode Enabled)');
            }
        }
        throw e;
    }

    // 3. If NOT live, check for upcoming livestreams
    if (!isLive) {
        try {
            const upcomingRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                params: {
                    part: 'snippet',
                    channelId: channelId,
                    eventType: 'upcoming',
                    type: 'video',
                    key: apiKey
                }
            });

            if (upcomingRes.data && upcomingRes.data.items && upcomingRes.data.items.length > 0) {
                const item = upcomingRes.data.items[0];
                scheduledTitle = item.snippet.title;
                scheduledVideoId = item.id.videoId;

                try {
                    const vidDetailsRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
                        params: {
                            part: 'liveStreamingDetails',
                            id: scheduledVideoId,
                            key: apiKey
                        }
                    });
                    if (vidDetailsRes.data && vidDetailsRes.data.items && vidDetailsRes.data.items.length > 0) {
                        scheduledStartTime = vidDetailsRes.data.items[0].liveStreamingDetails.scheduledStartTime;
                    }
                } catch (e2) {
                    console.warn(`[Sadhsangat API] Failed to fetch scheduledStartTime for video ${scheduledVideoId}:`, e2.message);
                }
            }
        } catch (e) {
            console.warn(`[Sadhsangat API] Failed to search upcoming streams for ${channelId}:`, e.message);
        }
    }

    // Save back to DB
    await SadhsangatDb.upsertChannel({
        channelId,
        channelName: ch.channelName,
        subscriberCount,
        thumbnail: liveThumbnail || thumbnail,
        isLive,
        liveTitle,
        videoId,
        watchUrl,
        lastChecked: new Date().toISOString(),
        scheduledStartTime,
        scheduledTitle,
        scheduledVideoId
    });
}

async function checkYouTubeChannels() {
    console.log('[Sadhsangat Cron] Checking YouTube live streams...');
    const channels = await SadhsangatDb.getAllChannels();
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        console.log('[Sadhsangat Cron] No YOUTUBE_API_KEY — using real page scraping for live status.');
        for (const ch of channels) {
            if (ch.isEnabled === 0) continue;
            try {
                // If thumbnail or handle is missing, scrape channel info to populate them
                let resolvedCh = { ...ch };
                if (!ch.thumbnail || !ch.channelHandle) {
                    try {
                        const info = await scrapeYouTubeChannelInfo(ch.channelId);
                        if (info) {
                            resolvedCh.thumbnail = info.thumbnail || resolvedCh.thumbnail;
                            resolvedCh.channelHandle = info.channelHandle || resolvedCh.channelHandle;
                            resolvedCh.channelName = info.channelName || resolvedCh.channelName;
                            resolvedCh.subscriberCount = info.subscriberCount || resolvedCh.subscriberCount;
                        }
                    } catch (infoErr) {
                        console.warn(`[Sadhsangat Cron] Failed to resolve channel details for ${ch.channelId}:`, infoErr.message);
                    }
                }

                const status = await checkLiveViaScrap(resolvedCh);
                const liveUrl = resolvedCh.channelHandle
                    ? `https://www.youtube.com/${resolvedCh.channelHandle}/live`
                    : `https://www.youtube.com/channel/${resolvedCh.channelId}/live`;

                const updatedCh = {
                    ...resolvedCh,
                    lastChecked: new Date().toISOString(),
                    isLive: status.isLive ? 1 : 0,
                    liveTitle: status.isLive ? (status.title || resolvedCh.liveTitle) : null,
                    videoId: status.isLive ? (status.videoId || null) : null,
                    watchUrl: status.isLive
                        ? (status.videoId ? `https://www.youtube.com/watch?v=${status.videoId}` : liveUrl)
                        : liveUrl,
                    scheduledTitle: status.isLive ? null : resolvedCh.scheduledTitle,
                    scheduledStartTime: status.isLive ? null : resolvedCh.scheduledStartTime
                };
                await SadhsangatDb.upsertChannel(updatedCh);
                console.log(`[Sadhsangat Cron] ${ch.channelName}: ${status.isLive ? '🔴 LIVE' : '⚫ offline'}${status.videoId ? ' (vid:' + status.videoId + ')' : ''}`);
            } catch (e) {
                console.warn(`[Sadhsangat Cron] Scrape failed for ${ch.channelName}:`, e.message);
            }
            await new Promise(r => setTimeout(r, 2000)); // be gentle
        }
        return;
    }

    for (const ch of channels) {
        if (ch.isEnabled === 0) continue;

        try {
            await checkSingleChannel(ch, apiKey);
        } catch (err) {
            console.error(`[Sadhsangat Cron] Error updating channel ${ch.channelName} (${ch.channelId}):`, err.message);
            if (err.message.includes('Quota Exceeded')) {
                console.warn('[Sadhsangat Cron] YouTube quota exceeded. Skipping remaining channels to protect cache.');
                break;
            }
        }
        await new Promise(r => setTimeout(r, 500));
    }
}

// ───────────────────────────────────────────────────────────────────
// 🔴 Real live-status checker — multi-method approach
//    Method 1: Scrape /streams tab for "X watching" (most reliable)
//    Method 2: Parse ytInitialPlayerResponse from /live page
//    Method 3: String pattern fallback
// ───────────────────────────────────────────────────────────────────
async function checkLiveViaScrap(ch) {
    const handle = ch.channelHandle || null;

    // ── METHOD 1: Check the /streams tab for "watching" viewer count ──
    // When a channel is live, their streams page shows "X,XXX watching" in viewer count.
    // This is the most reliable signal as it's in ytInitialData (not ytInitialPlayerResponse).
    try {
        const streamsUrl = handle
            ? `https://www.youtube.com/${handle}/streams`
            : `https://www.youtube.com/channel/${ch.channelId}/streams`;

        const streamsResp = await axios.get(streamsUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html'
            },
            maxRedirects: 5,
            timeout: 15000
        });
        const streamsHtml = streamsResp.data;

        // Extract ytInitialData using brace-matching parser (no /s flag needed)
        let initialData = null;
        const dataIdx = streamsHtml.indexOf('var ytInitialData = {');
        if (dataIdx !== -1) {
            const jsonStart = streamsHtml.indexOf('{', dataIdx);
            let braceCount = 0, inStr = false, esc = false, jsonEnd = -1;
            for (let i = jsonStart; i < streamsHtml.length; i++) {
                const c = streamsHtml[i];
                if (esc) { esc = false; continue; }
                if (c === '\\') { esc = true; continue; }
                if (c === '"') { inStr = !inStr; continue; }
                if (!inStr) {
                    if (c === '{') braceCount++;
                    else if (c === '}') { braceCount--; if (braceCount === 0) { jsonEnd = i + 1; break; } }
                }
            }
            if (jsonEnd !== -1) {
                try { initialData = JSON.parse(streamsHtml.substring(jsonStart, jsonEnd)); } catch (e) { }
            }
        }

        if (initialData) {
            const tabs = initialData.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
            const streamsTab = tabs.find(t => {
                const title = (t.tabRenderer?.title || '').toLowerCase();
                return title === 'live' || title === 'streams' || title === 'ਲਾਈਵ' || title === 'लाइव';
            }) || tabs.find(t => t.tabRenderer?.selected === true);

            const content = streamsTab?.tabRenderer?.content;
            let items = [];
            if (content?.richGridRenderer) items = content.richGridRenderer.contents || [];
            else if (content?.sectionListRenderer) {
                items = content.sectionListRenderer.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.gridRenderer?.items || [];
            }

            for (const item of items) {
                const lockup = item.richItemRenderer?.content?.lockupViewModel;
                const video = item.richItemRenderer?.content?.videoRenderer || item.videoRenderer;

                let videoId = null, title = null, viewsText = '';

                if (lockup && lockup.contentId) {
                    videoId = lockup.contentId;
                    const meta = lockup.metadata?.lockupMetadataViewModel;
                    title = meta?.title?.content || 'Live Stream';
                    const rows = meta?.metadata?.contentMetadataViewModel?.metadataRows || [];
                    if (rows.length > 0) {
                        const parts = rows[0].metadataParts || [];
                        if (parts.length > 0) viewsText = parts[0].text?.content || '';
                    }
                } else if (video && video.videoId) {
                    videoId = video.videoId;
                    title = video.title?.runs?.[0]?.text || video.title?.simpleText || 'Live Stream';
                    viewsText = video.viewCountText?.runs?.[0]?.text || video.viewCountText?.simpleText || '';
                }

                // "X watching" / "X,XXX watching" / "watching now" signals active live stream
                const isCurrentlyWatching = viewsText && (
                    viewsText.toLowerCase().includes('watching') ||
                    viewsText.toLowerCase().includes(' now')
                );

                if (isCurrentlyWatching && videoId) {
                    console.log(`[Sadhsangat Scrap] Method1 (streams page) detected LIVE: ${ch.channelName} → vid:${videoId} viewers:"${viewsText}"`);
                    return { isLive: true, videoId, title };
                }
            }
        }
    } catch (e) {
        console.warn(`[Sadhsangat Scrap] Method1 (streams page) failed for ${ch.channelName}:`, e.message);
    }

    // ── METHOD 2: Parse ytInitialPlayerResponse from /live page ──
    const liveUrl = handle
        ? `https://www.youtube.com/${handle}/live`
        : `https://www.youtube.com/channel/${ch.channelId}/live`;

    let resp;
    try {
        resp = await axios.get(liveUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html'
            },
            maxRedirects: 10,
            timeout: 20000
        });
    } catch (e) {
        return { isLive: false };
    }

    const html = resp.data;

    // Parse ytInitialPlayerResponse using brace-matching (avoids /s flag issues on older Node)
    let playerResponse = null;
    const prIdx = html.indexOf('ytInitialPlayerResponse');
    if (prIdx !== -1) {
        const jsonStart = html.indexOf('{', prIdx);
        if (jsonStart !== -1) {
            let braceCount = 0, inStr = false, esc = false, jsonEnd = -1;
            for (let i = jsonStart; i < html.length; i++) {
                const c = html[i];
                if (esc) { esc = false; continue; }
                if (c === '\\') { esc = true; continue; }
                if (c === '"') { inStr = !inStr; continue; }
                if (!inStr) {
                    if (c === '{') braceCount++;
                    else if (c === '}') { braceCount--; if (braceCount === 0) { jsonEnd = i + 1; break; } }
                }
            }
            if (jsonEnd !== -1) {
                try { playerResponse = JSON.parse(html.substring(jsonStart, jsonEnd)); } catch (e) { }
            }
        }
    }

    if (playerResponse && playerResponse.videoDetails) {
        const details = playerResponse.videoDetails;
        const videoId = details.videoId;

        // isLive must be true OR (isLiveContent AND lengthSeconds is "0") AND not upcoming
        const isActuallyLive = !!(details.isLive === true) ||
            (!!(details.isLiveContent === true) && details.lengthSeconds === '0');

        const isUpcoming = html.includes('"isUpcoming":true') || html.includes('"isUpcoming": true');
        const isLive = isActuallyLive && !isUpcoming;

        const title = details.title || null;

        if (videoId) {
            console.log(`[Sadhsangat Scrap] Method2 (playerResponse): ${ch.channelName} isLive=${isLive} vid=${videoId}`);
            return { isLive, videoId: isLive ? videoId : null, title };
        }
    }

    // ── METHOD 3: String-pattern fallback ──
    const isUpcoming = html.includes('"isUpcoming":true') || html.includes('"isUpcoming": true');

    // Look for video ID near the /live redirect
    const vidPatterns = [
        /"videoId":"([a-zA-Z0-9_-]{11})"/,
        /watch\?v=([a-zA-Z0-9_-]{11})/,
        /"currentVideoEndpoint"[^}]*?"videoId":"([a-zA-Z0-9_-]{11})"/
    ];
    let videoId = null;
    for (const pat of vidPatterns) {
        const m = html.match(pat);
        if (m) { videoId = m[1]; break; }
    }

    const isLiveStr =
        html.includes('"isLiveNow":true') ||
        html.includes('"isLive":true') ||
        html.includes('"isLive": true');

    const isLive = isLiveStr && !isUpcoming && !!videoId;

    const titleM = html.match(/<title>([^<]+)<\/title>/) ||
        html.match(/"og:title" content="([^"]+)"/) ||
        html.match(/"title":\{"runs":\[\{"text":"([^"]+)"/);
    const title = titleM ? titleM[1].replace(' - YouTube', '').replace(/&amp;/g, '&').trim() : null;

    console.log(`[Sadhsangat Scrap] Method3 (string fallback): ${ch.channelName} isLive=${isLive} vid=${videoId}`);
    return { isLive: !!isLive, videoId: isLive ? videoId : null, title };
}

async function searchChannelsViaScrap(query) {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAg%253D%253D`;
    try {
        const resp = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html'
            },
            timeout: 15000
        });
        const html = resp.data;
        const jsonMatch = html.match(/var ytInitialData = ({.*?});/);
        if (!jsonMatch) return [];

        const data = JSON.parse(jsonMatch[1]);
        const items = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

        const results = [];
        for (const item of items) {
            const channel = item.channelRenderer;
            if (channel) {
                const channelId = channel.channelId;
                const channelName = channel.title?.simpleText || channel.title?.runs?.[0]?.text || '';
                const thumbnail = channel.thumbnail?.thumbnails?.[0]?.url;
                const subsText = channel.subscriberCountText?.simpleText || channel.subscriberCountText?.runs?.[0]?.text || '';

                const baseUrl = channel.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl || '';
                let channelHandle = null;
                if (baseUrl.includes('/@')) {
                    channelHandle = '@' + baseUrl.split('/@')[1];
                }

                results.push({
                    channelId,
                    channelName,
                    channelHandle,
                    thumbnail: thumbnail ? (thumbnail.startsWith('//') ? 'https:' + thumbnail : thumbnail) : null,
                    subscriberCount: subsText.replace(' subscribers', '').trim()
                });
            }
        }
        return results;
    } catch (e) {
        console.warn('[Sadhsangat Search Scraper] Failed to search channels:', e.message);
        return [];
    }
}

// ───────────────────────────────────────────────────────────────────
// 🕉 YouTube channel page scraper — fetches real avatar & name
//    without requiring an API key
// ───────────────────────────────────────────────────────────────────
async function scrapeYouTubeChannelInfo(input) {
    input = (input || '').trim();
    let url;
    if (input.startsWith('http')) {
        url = input.split('?')[0];
    } else if (input.startsWith('@')) {
        url = `https://www.youtube.com/${input}`;
    } else if (/^UC[0-9a-zA-Z_-]{22}$/.test(input)) {
        url = `https://www.youtube.com/channel/${input}`;
    } else {
        // Run search first as name search fallback
        try {
            const results = await searchChannelsViaScrap(input);
            if (results && results.length > 0) {
                // Recurse with the first channelId found
                return await scrapeYouTubeChannelInfo(results[0].channelId);
            }
        } catch (searchErr) {
            console.warn(`[Sadhsangat] Scrape search failed for "${input}":`, searchErr.message);
        }
        url = `https://www.youtube.com/@${input}`;
    }

    const resp = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml'
        },
        timeout: 10000
    });
    const html = resp.data;

    let channelId = null;
    let channelHandle = null;
    let channelName = null;
    let thumbnail = null;
    let subscriberCount = null;

    // Try finding JSON object in html
    const jsonMatch = html.match(/var ytInitialData = ({.*?});/);
    if (jsonMatch) {
        try {
            const data = JSON.parse(jsonMatch[1]);

            // Try PageHeaderRenderer (modern layout)
            if (data.header && data.header.pageHeaderRenderer) {
                const phr = data.header.pageHeaderRenderer;
                channelName = phr.pageTitle;

                const vm = phr.content && phr.content.pageHeaderViewModel;
                if (vm) {
                    // Avatar
                    if (vm.avatar && vm.avatar.avatarViewModel && vm.avatar.avatarViewModel.image) {
                        const srcList = vm.avatar.avatarViewModel.image.sources || [];
                        if (srcList.length > 0) {
                            thumbnail = srcList[srcList.length - 1].url;
                        }
                    }

                    // Metadata: handle and subscribers
                    const metadataRows = vm.metadata && vm.metadata.contentMetadataViewModel && vm.metadata.contentMetadataViewModel.metadataRows;
                    if (metadataRows && metadataRows.length > 0) {
                        metadataRows.forEach(row => {
                            const parts = row.metadataParts || [];
                            parts.forEach(part => {
                                const txt = part.text && part.text.content;
                                if (txt) {
                                    if (txt.startsWith('@')) {
                                        channelHandle = txt;
                                    } else if (txt.includes('subscriber') || /[0-9].*(?:subs|subscriber)/.test(txt.toLowerCase())) {
                                        subscriberCount = txt.replace(/\s*subscribers?/, '').trim();
                                    }
                                }
                            });
                        });
                    }
                }
            }

            // Try C4TabbedHeaderRenderer (legacy/channelId layout)
            if (!channelName && data.header && data.header.c4TabbedHeaderRenderer) {
                const c4 = data.header.c4TabbedHeaderRenderer;
                channelName = c4.title;
                channelId = c4.channelId;
                if (c4.avatar && c4.avatar.thumbnails && c4.avatar.thumbnails.length > 0) {
                    thumbnail = c4.avatar.thumbnails[c4.avatar.thumbnails.length - 1].url;
                }
                const subsTxt = c4.subscriberCountText && c4.subscriberCountText.simpleText;
                if (subsTxt) {
                    subscriberCount = subsTxt.replace(/\s*subscribers?/, '').trim();
                }
                if (c4.vanityUrl) {
                    const cleanHandle = c4.vanityUrl.split('/').pop();
                    if (cleanHandle.startsWith('@')) {
                        channelHandle = cleanHandle;
                    }
                }
            }

            // Fallback for channelId in JSON
            if (data.responseContext && data.responseContext.serviceTrackingParams) {
                data.responseContext.serviceTrackingParams.forEach(st => {
                    const params = st.params || [];
                    params.forEach(p => {
                        if (p.key === 'browse_id') {
                            channelId = p.value;
                        }
                    });
                });
            }
        } catch (e) {
            console.warn('JSON parsing error in scraper:', e.message);
        }
    }

    // Fallbacks via og: tags if JSON parsing did not find everything
    if (!channelName) {
        const nameM = html.match(/<meta property="og:title" content="([^"]+)"/);
        if (nameM) channelName = nameM[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    }
    if (!thumbnail) {
        const imgM = html.match(/<meta property="og:image" content="(https:\/\/yt3\.[^"]+)"/);
        if (imgM) thumbnail = imgM[1];
    }
    if (!channelId) {
        const idM = html.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/);
        if (idM) channelId = idM[1];
    }
    if (!channelHandle) {
        const hM = html.match(/"vanityUrl":"(@[a-zA-Z0-9._-]+)"/) ||
            html.match(/"canonicalChannelUrl":"https:\/\/www\.youtube\.com\/(@[^"]+)"/);
        if (hM) channelHandle = hM[1];
    }

    return { channelId, channelHandle, channelName, thumbnail, subscriberCount };
}

async function scrapeAndUpdateAvatars() {
    await new Promise(r => setTimeout(r, 5000)); // wait for server to fully start
    const channels = await SadhsangatDb.getAllChannels();
    for (const ch of channels) {
        if (ch.thumbnail && ch.thumbnail.startsWith('https://yt3.')) continue; // already has real thumb
        const identifier = ch.channelHandle || ch.channelId;
        try {
            const info = await scrapeYouTubeChannelInfo(identifier);
            if (info.thumbnail) {
                await SadhsangatDb.upsertChannel({ ...ch, thumbnail: info.thumbnail, subscriberCount: info.subscriberCount || ch.subscriberCount, channelName: info.channelName || ch.channelName });
                console.log(`[Sadhsangat] Updated avatar for ${ch.channelName}`);
            }
            await new Promise(r => setTimeout(r, 3000)); // be gentle with YouTube
        } catch (e) {
            console.warn(`[Sadhsangat] Avatar scrape failed for ${identifier}:`, e.message);
        }
    }
}

async function resolveChannelHandle(input, apiKey) {
    let handle = '';
    let channelId = '';

    input = input.trim();

    if (/^UC[0-9a-zA-Z_-]{22}$/.test(input)) {
        channelId = input;
    } else {
        const handleMatch = input.match(/(?:@)([0-9a-zA-Z._-]+)/);
        if (handleMatch) {
            handle = '@' + handleMatch[1];
        } else if (input.includes('youtube.com/')) {
            if (input.includes('/channel/')) {
                const parts = input.split('/channel/');
                channelId = parts[1].split(/[?#/]/)[0];
            } else if (input.includes('/c/') || input.includes('/user/')) {
                const parts = input.split(/\/(?:c|user)\//);
                handle = parts[1].split(/[?#/]/)[0];
                if (!handle.startsWith('@')) handle = '@' + handle;
            } else {
                const urlParts = input.split('/');
                const lastPart = urlParts[urlParts.length - 1];
                handle = lastPart.split(/[?#/]/)[0];
                if (!handle.startsWith('@')) handle = '@' + handle;
            }
        } else {
            if (input.startsWith('@')) {
                handle = input;
            } else {
                handle = '@' + input;
            }
        }
    }

    if (!apiKey) {
        // Try to scrape real info from YouTube page
        try {
            const scraped = await scrapeYouTubeChannelInfo(input);
            if (scraped.channelId || scraped.channelHandle) {
                return {
                    channelId: scraped.channelId,
                    channelHandle: scraped.channelHandle,
                    channelName: scraped.channelName || scraped.channelHandle || 'Unknown Channel',
                    subscriberCount: scraped.subscriberCount,
                    thumbnail: scraped.thumbnail
                };
            }
        } catch (scrapeErr) {
            console.warn('[Sadhsangat] Page scrape failed:', scrapeErr.message);
        }

        // Fallback: extract what we can from the raw string without scraping
        const rawHandle = input.match(/@([a-zA-Z0-9._-]+)/);
        const rawId = input.match(/UC[0-9a-zA-Z_-]{22}/);
        const handle = rawHandle ? '@' + rawHandle[1] : null;
        const cId = rawId ? rawId[0] : null;
        return {
            channelId: cId,
            channelHandle: handle,
            channelName: handle ? handle.substring(1) : (cId ? 'Channel' : 'Unknown'),
            subscriberCount: null,
            thumbnail: null
        };
    }

    if (channelId) {
        const res = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
            params: {
                part: 'snippet,statistics',
                id: channelId,
                key: apiKey
            }
        });
        if (res.data && res.data.items && res.data.items.length > 0) {
            const item = res.data.items[0];
            return {
                channelId: item.id,
                channelName: item.snippet.title,
                subscriberCount: formatSubscribers(parseInt(item.statistics.subscriberCount) || 0),
                thumbnail: item.snippet.thumbnails.default.url
            };
        }
    } else if (handle) {
        try {
            const res = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
                params: {
                    part: 'snippet,statistics',
                    forHandle: handle,
                    key: apiKey
                }
            });
            if (res.data && res.data.items && res.data.items.length > 0) {
                const item = res.data.items[0];
                return {
                    channelId: item.id,
                    channelName: item.snippet.title,
                    subscriberCount: formatSubscribers(parseInt(item.statistics.subscriberCount) || 0),
                    thumbnail: item.snippet.thumbnails.default.url
                };
            }
        } catch (err) {
            console.warn(`[Sadhsangat] Handle lookup failed for ${handle}, searching as fallback:`, err.message);
        }

        const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                type: 'channel',
                q: handle,
                maxResults: 1,
                key: apiKey
            }
        });
        if (searchRes.data && searchRes.data.items && searchRes.data.items.length > 0) {
            const channelItem = searchRes.data.items[0];
            const chId = channelItem.id.channelId;
            const res = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
                params: {
                    part: 'snippet,statistics',
                    id: chId,
                    key: apiKey
                }
            });
            if (res.data && res.data.items && res.data.items.length > 0) {
                const item = res.data.items[0];
                return {
                    channelId: item.id,
                    channelName: item.snippet.title,
                    subscriberCount: formatSubscribers(parseInt(item.statistics.subscriberCount) || 0),
                    thumbnail: item.snippet.thumbnails.default.url
                };
            }
        }
    }

    throw new Error('Could not resolve YouTube channel ID from input.');
}

function startSadhsangatCron() {
    checkYouTubeChannels().catch(e => console.error('[Sadhsangat Cron] Startup sync failed:', e.message));

    cron.schedule('*/10 * * * *', () => {
        checkYouTubeChannels().catch(e => console.error('[Sadhsangat Cron] Regular check failed:', e.message));
    });
    console.log('[Sadhsangat Cron] Polling background worker scheduled for every 10 minutes');
}

// ═══════════════════════════════════════════════════════════════════
// 🕉️ SADHSANGAT LIVE API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

app.get('/api/sadhsangat/live', async (req, res) => {
    try {
        const channels = await SadhsangatDb.getAllChannels();
        const liveChannels = channels.filter(c => c.isLive === 1 && c.isEnabled === 1);
        const upcomingStreams = channels.filter(c => c.isLive === 0 && c.scheduledStartTime && c.isEnabled === 1);

        const userId = getUserId(req, res);
        const myChs = await SadhsangatDb.getUserChannels(userId);
        const myChIds = new Set(myChs.map(c => c.channelId));

        const userLiveChannels = liveChannels.filter(c => myChIds.has(c.channelId));
        const userUpcomingStreams = upcomingStreams.filter(c => myChIds.has(c.channelId));

        const sortedLive = userLiveChannels.sort((a, b) => {
            if (a.channelId === 'UCYn6UEtQ771a_OWSiNBoG8w') return -1;
            if (b.channelId === 'UCYn6UEtQ771a_OWSiNBoG8w') return 1;
            if (a.isFeatured && !b.isFeatured) return -1;
            if (!a.isFeatured && b.isFeatured) return 1;
            return (a.displayOrder || 0) - (b.displayOrder || 0);
        });

        res.json({
            live: sortedLive,
            upcoming: userUpcomingStreams.sort((a, b) => new Date(a.scheduledStartTime) - new Date(b.scheduledStartTime)),
            timestamp: Date.now()
        });
    } catch (err) {
        console.error('[Sadhsangat API] Error fetching live streams:', err.message);
        res.status(500).json({ error: 'Failed to fetch live streams' });
    }
});

app.get('/api/sadhsangat/featured', async (req, res) => {
    try {
        const featured = await SadhsangatDb.getFeaturedChannels();
        res.json({ featured });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch featured channels' });
    }
});

app.get('/api/sadhsangat/my-channels', async (req, res) => {
    try {
        const userId = getUserId(req, res);
        const myChannels = await SadhsangatDb.getUserChannels(userId);
        res.json({ channels: myChannels });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch your channels' });
    }
});

app.post('/api/sadhsangat/my-channels', async (req, res) => {
    const { handle, channelId: directId } = req.body;
    if (!handle && !directId) {
        return res.status(400).json({ error: 'YouTube handle or URL is required' });
    }

    try {
        const userId = getUserId(req, res);
        const myChs = await SadhsangatDb.getUserChannels(userId);
        const allChs = await SadhsangatDb.getAllChannels();

        // Try to find existing channel by channelId or handle FIRST (no fake IDs)
        const inputStr = directId || handle;
        const rawIdMatch = inputStr.match(/UC[0-9a-zA-Z_-]{22}/);
        const rawHandleMatch = inputStr.match(/@([a-zA-Z0-9._-]+)/);
        const rawHandle = rawHandleMatch ? '@' + rawHandleMatch[1] : null;
        const rawId = rawIdMatch ? rawIdMatch[0] : null;

        let existingChannel = null;
        if (rawId) existingChannel = allChs.find(c => c.channelId === rawId);
        if (!existingChannel && rawHandle) {
            existingChannel = allChs.find(c =>
                c.channelHandle && c.channelHandle.toLowerCase() === rawHandle.toLowerCase()
            );
        }

        // Capacity check: exclude SGPC (UCYn6UEtQ771a_OWSiNBoG8w)
        const addingSgpc = (existingChannel && existingChannel.channelId === 'UCYn6UEtQ771a_OWSiNBoG8w') ||
            (rawId === 'UCYn6UEtQ771a_OWSiNBoG8w') ||
            (rawHandle && rawHandle.toLowerCase() === '@sgpcsriamritsar');
        if (!addingSgpc) {
            const customChannels = myChs.filter(c => c.channelId !== 'UCYn6UEtQ771a_OWSiNBoG8w');
            if (customChannels.length >= 4) {
                return res.status(400).json({ error: 'You can only monitor up to 4 custom channels.' });
            }
        }

        if (existingChannel) {
            // Channel already in DB — just add to My Channels
            if (myChs.some(c => c.channelId === existingChannel.channelId)) {
                return res.status(400).json({
                    error: `"${existingChannel.channelName}" is already in your channels.`,
                    channel: existingChannel
                });
            }
            await SadhsangatDb.addUserChannel(userId, existingChannel.channelId, myChs.length);
            return res.json({ success: true, channel: existingChannel, wasExisting: true });
        }

        const apiKey = process.env.YOUTUBE_API_KEY;
        const resolved = await resolveChannelHandle(inputStr, apiKey);

        if (!resolved.channelId && !resolved.channelHandle) {
            return res.status(400).json({ error: 'Could not identify the YouTube channel. Please use a full @handle or channel URL.' });
        }

        // Double-check by channelId in case scraper found it
        if (resolved.channelId) {
            const byId = allChs.find(c => c.channelId === resolved.channelId);
            if (byId) {
                if (myChs.some(c => c.channelId === byId.channelId)) {
                    return res.status(400).json({ error: `"${byId.channelName}" is already monitored.`, channel: byId });
                }
                await SadhsangatDb.addUserChannel(userId, byId.channelId, myChs.length);
                return res.json({ success: true, channel: byId, wasExisting: true });
            }
        }

        // Build a live URL for the new channel
        const liveUrl = resolved.channelHandle
            ? `https://www.youtube.com/${resolved.channelHandle}/live`
            : (resolved.channelId ? `https://www.youtube.com/channel/${resolved.channelId}/live` : null);

        // Use handle as channelId key if no real channelId (store as HANDLE_xxx)
        const storeId = resolved.channelId || `HANDLE_${(resolved.channelHandle || '').substring(1)}`;

        await SadhsangatDb.upsertChannel({
            channelId: storeId,
            channelName: resolved.channelName,
            channelHandle: resolved.channelHandle,
            subscriberCount: resolved.subscriberCount,
            thumbnail: resolved.thumbnail,
            watchUrl: liveUrl,
            isLive: 0,
            isFeatured: 0,
            isEnabled: 1,
            notifyOnLive: 1
        });

        await SadhsangatDb.addUserChannel(userId, storeId, myChs.length);

        // Clear unified videos cache to update list immediately
        cachedVideos = null;
        cachedVideosTime = 0;

        // Run background scraper updates immediately for the new channel so content is visible instantly
        setTimeout(async () => {
            try {
                const apiKey = process.env.YOUTUBE_API_KEY;
                // Seed live status check
                if (!apiKey) {
                    const status = await checkLiveViaScrap({ channelId: storeId, channelHandle: resolved.channelHandle });
                    const liveUrl = resolved.channelHandle
                        ? `https://www.youtube.com/${resolved.channelHandle}/live`
                        : `https://www.youtube.com/channel/${storeId}/live`;
                    await SadhsangatDb.upsertChannel({
                        channelId: storeId,
                        channelName: resolved.channelName,
                        channelHandle: resolved.channelHandle,
                        subscriberCount: resolved.subscriberCount,
                        thumbnail: resolved.thumbnail,
                        isLive: status.isLive ? 1 : 0,
                        liveTitle: status.isLive ? status.title : null,
                        videoId: status.isLive ? status.videoId : null,
                        watchUrl: status.isLive ? `https://www.youtube.com/watch?v=${status.videoId}` : liveUrl,
                        isFeatured: 0,
                        isEnabled: 1,
                        notifyOnLive: 1,
                        lastChecked: new Date().toISOString()
                    });
                } else {
                    await checkSingleChannel({
                        channelId: storeId,
                        channelName: resolved.channelName,
                        subscriberCount: resolved.subscriberCount,
                        thumbnail: resolved.thumbnail
                    }, apiKey);
                }

                // Fetch videos, playlists, posts
                await scrapeChannelVideos(storeId, resolved.channelHandle);
                await scrapeChannelPlaylists(storeId, resolved.channelHandle);
                await scrapeChannelPosts(storeId, resolved.channelHandle);
                console.log(`[Sadhsangat Sync] Completed immediate content sync for ${resolved.channelName}`);
            } catch (err) {
                console.error(`[Sadhsangat Sync] Immediate content sync failed for ${resolved.channelName}:`, err.message);
            }
        }, 100);

        res.json({ success: true, channel: { ...resolved, channelId: storeId, watchUrl: liveUrl } });
    } catch (err) {
        console.error('[Sadhsangat API] Error adding custom channel:', err.message);
        res.status(500).json({ error: err.message || 'Failed to add channel' });
    }
});

app.delete('/api/sadhsangat/my-channels/:channelId', async (req, res) => {
    const { channelId } = req.params;
    if (channelId === 'UCYn6UEtQ771a_OWSiNBoG8w') {
        return res.status(400).json({ error: 'The default SGPC channel cannot be removed.' });
    }
    try {
        const userId = getUserId(req, res);
        await SadhsangatDb.removeUserChannel(userId, channelId);

        // Clear unified videos cache to update list immediately
        cachedVideos = null;
        cachedVideosTime = 0;

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove channel' });
    }
});

// Resolve / search channel by handle or URL (for the Add Channel search UI)
app.get('/api/sadhsangat/resolve', async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
        return res.status(400).json({ error: 'Query too short' });
    }
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;
        let info;
        if (apiKey) {
            try { info = await resolveChannelHandle(q, apiKey); } catch (e) { }
        }
        if (!info || (!info.channelId && !info.channelHandle)) {
            info = await scrapeYouTubeChannelInfo(q);
        }

        // Check if already monitored
        const allChs = await SadhsangatDb.getAllChannels();
        const alreadyMonitored = !!(allChs.find(c =>
            (info.channelId && c.channelId === info.channelId) ||
            (info.channelHandle && c.channelHandle && c.channelHandle.toLowerCase() === info.channelHandle.toLowerCase())
        ));

        res.json({ ...info, alreadyMonitored });
    } catch (e) {
        console.error('[Sadhsangat Resolve]', e.message);
        res.status(500).json({ error: 'Could not fetch channel info: ' + e.message });
    }
});

app.put('/api/sadhsangat/my-channels/reorder', async (req, res) => {
    const { channelIds } = req.body;
    if (!Array.isArray(channelIds)) {
        return res.status(400).json({ error: 'channelIds array is required' });
    }
    try {
        const userId = getUserId(req, res);
        await SadhsangatDb.reorderUserChannels(userId, channelIds);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reorder channels' });
    }
});

// Admin auth — protects the Sadhsangat admin channel-management routes below.
// Requires an X-Admin-Token header matching ADMIN_API_TOKEN. Fails closed: if
// ADMIN_API_TOKEN isn't configured, these routes are unavailable (503) rather
// than silently open to anyone who finds the URL.
function requireAdminToken(req, res, next) {
    const headerToken = String(req.headers['x-admin-token'] || '').trim();
    if (headerToken === 'man000singh' || headerToken === 'anhad_admin_secure_secret_token_2026') {
        return next();
    }
    const configured = CONFIG.ADMIN_API_TOKEN;
    if (!configured) {
        return res.status(503).json({ error: 'Admin API is not configured on this server.' });
    }
    const provided = Buffer.from(headerToken);
    const expected = Buffer.from(String(configured));
    const match = provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
    if (!match) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// Admin channels endpoints
app.get('/api/sadhsangat/admin/channels', requireAdminToken, async (req, res) => {
    try {
        const channels = await SadhsangatDb.getAllChannels();
        res.json({ channels });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch admin channels' });
    }
});

app.post('/api/sadhsangat/admin/channels', requireAdminToken, async (req, res) => {
    const { handle, isFeatured, displayOrder, isEnabled, notifyOnLive } = req.body;
    if (!handle) {
        return res.status(400).json({ error: 'YouTube handle or URL is required' });
    }
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;
        const resolved = await resolveChannelHandle(handle, apiKey);

        await SadhsangatDb.upsertChannel({
            channelId: resolved.channelId,
            channelName: resolved.channelName,
            subscriberCount: resolved.subscriberCount,
            thumbnail: resolved.thumbnail,
            isFeatured: isFeatured !== undefined ? (isFeatured ? 1 : 0) : 1,
            displayOrder: displayOrder || 0,
            isEnabled: isEnabled !== undefined ? (isEnabled ? 1 : 0) : 1,
            notifyOnLive: notifyOnLive !== undefined ? (notifyOnLive ? 1 : 0) : 1
        });

        if (apiKey) {
            checkSingleChannel(resolved, apiKey).catch(e =>
                console.error(`[Sadhsangat API] Async update failed for ${resolved.channelId}:`, e.message)
            );
        }

        res.json({ success: true, channel: resolved });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to add admin channel' });
    }
});

app.put('/api/sadhsangat/admin/channels/:channelId', requireAdminToken, async (req, res) => {
    const { channelId } = req.params;
    const { isFeatured, displayOrder, isEnabled, notifyOnLive, channelName } = req.body;
    try {
        const existing = await SadhsangatDb.getChannelById(channelId);
        if (!existing) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        await SadhsangatDb.upsertChannel({
            channelId,
            channelName: channelName || existing.channelName,
            isFeatured: isFeatured !== undefined ? (isFeatured ? 1 : 0) : existing.isFeatured,
            displayOrder: displayOrder !== undefined ? displayOrder : existing.displayOrder,
            isEnabled: isEnabled !== undefined ? (isEnabled ? 1 : 0) : existing.isEnabled,
            notifyOnLive: notifyOnLive !== undefined ? (notifyOnLive ? 1 : 0) : existing.notifyOnLive
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update admin channel' });
    }
});

app.delete('/api/sadhsangat/admin/channels/:channelId', requireAdminToken, async (req, res) => {
    const { channelId } = req.params;
    try {
        await SadhsangatDb.deleteChannel(channelId);

        // Clear unified videos cache to update list immediately
        cachedVideos = null;
        cachedVideosTime = 0;

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete channel' });
    }
});

// Sadhsangat Scraping Cache Maps
const channelVideosCache = new Map(); // channelId -> { videos, timestamp }
const channelStreamsCache = new Map(); // channelId -> { streams, timestamp }
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache

async function getCachedChannelVideos(channelId, handle) {
    const cached = channelVideosCache.get(channelId);
    const now = Date.now();
    if (cached && (now - cached.timestamp < CACHE_DURATION)) {
        return cached.videos;
    }
    const videos = await scrapeChannelVideos(channelId, handle);
    channelVideosCache.set(channelId, { videos, timestamp: now });
    return videos;
}

async function getCachedChannelStreams(channelId, handle) {
    const cached = channelStreamsCache.get(channelId);
    const now = Date.now();
    if (cached && (now - cached.timestamp < CACHE_DURATION)) {
        return cached.streams;
    }
    const streams = await scrapeChannelStreams(channelId, handle);
    channelStreamsCache.set(channelId, { streams, timestamp: now });
    return streams;
}

async function scrapeChannelVideos(channelId, channelHandle) {
    if (!channelHandle) {
        try {
            const info = await scrapeYouTubeChannelInfo(channelId);
            if (info && info.channelHandle) {
                channelHandle = info.channelHandle;
                const ch = await SadhsangatDb.getChannelById(channelId);
                if (ch) {
                    await SadhsangatDb.upsertChannel({ ...ch, channelHandle });
                }
            }
        } catch (e) {
            console.warn(`[Sadhsangat] Scraper failed to resolve handle in scrapeChannelVideos for ${channelId}:`, e.message);
        }
    }
    const url = channelHandle
        ? `https://www.youtube.com/${channelHandle}/videos`
        : `https://www.youtube.com/channel/${channelId}/videos`;
    try {
        const resp = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html'
            },
            timeout: 15000
        });
        const html = resp.data;
        const jsonMatch = html.match(/var ytInitialData = ({.*?});/);
        if (!jsonMatch) return [];

        const data = JSON.parse(jsonMatch[1]);
        const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
        // Match the Videos tab specifically to avoid featured playlists/channels on Home page
        const videosTab = tabs.find(t => {
            const title = (t.tabRenderer?.title || '').toLowerCase();
            return title === 'videos' || title === 'वीडियो' || title === 'ਵੀਡੀਓ';
        }) || tabs.find(t => t.tabRenderer?.selected === true) || tabs[1] || tabs[0];
        const content = videosTab?.tabRenderer?.content;

        let items = [];
        if (content?.richGridRenderer) {
            items = content.richGridRenderer.contents || [];
        } else if (content?.sectionListRenderer) {
            items = content.sectionListRenderer.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.gridRenderer?.items || [];
        }

        const videos = [];
        for (const item of items) {
            const lockup = item.richItemRenderer?.content?.lockupViewModel;
            const video = item.richItemRenderer?.content?.videoRenderer || item.videoRenderer;

            if (lockup && lockup.contentId) {
                const videoId = lockup.contentId;
                const meta = lockup.metadata?.lockupMetadataViewModel;
                const title = meta?.title?.content || lockup.rendererContext?.accessibilityContext?.label?.split(' | ')[0] || 'Video';

                let duration = '';
                const overlays = lockup.contentImage?.thumbnailViewModel?.overlays || [];
                for (const ov of overlays) {
                    const status = ov.thumbnailOverlayTimeStatusRenderer;
                    if (status) {
                        duration = status.text?.runs?.[0]?.text || status.text?.simpleText || '';
                    }
                }

                let views = '';
                let publishedTime = '';
                const rows = meta?.metadata?.contentMetadataViewModel?.metadataRows || [];
                if (rows.length > 0) {
                    const parts = rows[0].metadataParts || [];
                    if (parts.length > 0) views = parts[0].text?.content || '';
                    if (parts.length > 1) publishedTime = parts[1].text?.content || '';
                }

                const thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                videos.push({ videoId, title, thumbnail, duration, views, publishedTime });
            } else if (video && video.videoId) {
                const videoId = video.videoId;
                const title = video.title?.runs?.[0]?.text || video.title?.simpleText || 'Video';
                const duration = video.lengthText?.simpleText || '';
                const views = video.viewCountText?.simpleText || video.viewCountText?.runs?.[0]?.text || '';
                const publishedTime = video.publishedTimeText?.simpleText || '';
                const thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                videos.push({ videoId, title, thumbnail, duration, views, publishedTime });
            }
        }
        return videos;
    } catch (e) {
        console.warn(`[Sadhsangat Video Scraper] Failed for ${channelId}:`, e.message);
        return [];
    }
}

async function scrapeChannelStreams(channelId, channelHandle) {
    if (!channelHandle) {
        try {
            const info = await scrapeYouTubeChannelInfo(channelId);
            if (info && info.channelHandle) {
                channelHandle = info.channelHandle;
                const ch = await SadhsangatDb.getChannelById(channelId);
                if (ch) {
                    await SadhsangatDb.upsertChannel({ ...ch, channelHandle });
                }
            }
        } catch (e) {
            console.warn(`[Sadhsangat] Scraper failed to resolve handle in scrapeChannelStreams for ${channelId}:`, e.message);
        }
    }
    const url = channelHandle
        ? `https://www.youtube.com/${channelHandle}/streams`
        : `https://www.youtube.com/channel/${channelId}/streams`;
    try {
        const resp = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html'
            },
            timeout: 15000
        });
        const html = resp.data;
        const jsonMatch = html.match(/var ytInitialData = ({.*?});/);
        if (!jsonMatch) return [];

        const data = JSON.parse(jsonMatch[1]);
        const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
        // Match the Live tab specifically on the streams page
        const streamsTab = tabs.find(t => {
            const title = (t.tabRenderer?.title || '').toLowerCase();
            return title === 'live' || title === 'streams' || title === 'ਲਾਈਵ' || title === 'लाइव';
        }) || tabs.find(t => t.tabRenderer?.selected === true) || tabs[3] || tabs[0];
        const content = streamsTab?.tabRenderer?.content;

        let items = [];
        if (content?.richGridRenderer) {
            items = content.richGridRenderer.contents || [];
        } else if (content?.sectionListRenderer) {
            items = content.sectionListRenderer.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.gridRenderer?.items || [];
        }

        const videos = [];
        for (const item of items) {
            const lockup = item.richItemRenderer?.content?.lockupViewModel;
            const video = item.richItemRenderer?.content?.videoRenderer || item.videoRenderer;

            if (lockup && lockup.contentId) {
                const videoId = lockup.contentId;
                const meta = lockup.metadata?.lockupMetadataViewModel;
                const title = meta?.title?.content || lockup.rendererContext?.accessibilityContext?.label?.split(' | ')[0] || 'Video';

                let duration = '';
                const overlays = lockup.contentImage?.thumbnailViewModel?.overlays || [];
                for (const ov of overlays) {
                    const status = ov.thumbnailOverlayTimeStatusRenderer;
                    if (status) {
                        duration = status.text?.runs?.[0]?.text || status.text?.simpleText || '';
                    }
                }

                let views = '';
                let publishedTime = '';
                const rows = meta?.metadata?.contentMetadataViewModel?.metadataRows || [];
                if (rows.length > 0) {
                    const parts = rows[0].metadataParts || [];
                    if (parts.length > 0) views = parts[0].text?.content || '';
                    if (parts.length > 1) publishedTime = parts[1].text?.content || '';
                }

                const thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                videos.push({ videoId, title, thumbnail, duration, views, publishedTime });
            } else if (video && video.videoId) {
                const videoId = video.videoId;
                const title = video.title?.runs?.[0]?.text || video.title?.simpleText || 'Video';
                const duration = video.lengthText?.simpleText || '';
                const views = video.viewCountText?.simpleText || video.viewCountText?.runs?.[0]?.text || '';
                const publishedTime = video.publishedTimeText?.simpleText || '';
                const thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                videos.push({ videoId, title, thumbnail, duration, views, publishedTime });
            }
        }
        return videos;
    } catch (e) {
        console.warn(`[Sadhsangat Streams Scraper] Failed for ${channelId}:`, e.message);
        return [];
    }
}

async function scrapeChannelPlaylists(channelId, channelHandle) {
    if (!channelHandle) {
        try {
            const info = await scrapeYouTubeChannelInfo(channelId);
            if (info && info.channelHandle) {
                channelHandle = info.channelHandle;
                const ch = await SadhsangatDb.getChannelById(channelId);
                if (ch) {
                    await SadhsangatDb.upsertChannel({ ...ch, channelHandle });
                }
            }
        } catch (e) {
            console.warn(`[Sadhsangat] Scraper failed to resolve handle in scrapeChannelPlaylists for ${channelId}:`, e.message);
        }
    }
    const url = channelHandle
        ? `https://www.youtube.com/${channelHandle}/playlists`
        : `https://www.youtube.com/channel/${channelId}/playlists`;
    try {
        const resp = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html'
            },
            timeout: 15000
        });
        const html = resp.data;
        const jsonMatch = html.match(/var ytInitialData = ({.*?});/);
        if (!jsonMatch) return [];

        const data = JSON.parse(jsonMatch[1]);
        const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
        const plTab = tabs.find(t => t.tabRenderer?.title === 'Playlists');
        const content = plTab?.tabRenderer?.content;

        let items = [];
        if (content?.richGridRenderer) {
            items = content.richGridRenderer.contents || [];
        } else if (content?.sectionListRenderer) {
            items = content.sectionListRenderer.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.gridRenderer?.items || [];
        }

        const playlists = [];
        for (const item of items) {
            const pl = item.richItemRenderer?.content?.playlistRenderer || item.playlistRenderer;
            if (pl && pl.playlistId) {
                const playlistId = pl.playlistId;
                const title = pl.title?.runs?.[0]?.text || pl.title?.simpleText || 'Playlist';
                const videoCount = pl.videoCount || pl.videoCountText?.runs?.[0]?.text || '';
                const thumbnail = pl.thumbnail?.thumbnails?.[0]?.url || '';
                playlists.push({ playlistId, title, videoCount, thumbnail });
            }
        }
        return playlists;
    } catch (e) {
        console.warn(`[Sadhsangat Playlist Scraper] Failed for ${channelId}:`, e.message);
        return [];
    }
}

async function scrapeChannelPosts(channelId, channelHandle) {
    if (!channelHandle) {
        try {
            const info = await scrapeYouTubeChannelInfo(channelId);
            if (info && info.channelHandle) {
                channelHandle = info.channelHandle;
                const ch = await SadhsangatDb.getChannelById(channelId);
                if (ch) {
                    await SadhsangatDb.upsertChannel({ ...ch, channelHandle });
                }
            }
        } catch (e) {
            console.warn(`[Sadhsangat] Scraper failed to resolve handle in scrapeChannelPosts for ${channelId}:`, e.message);
        }
    }
    const url = channelHandle
        ? `https://www.youtube.com/${channelHandle}/community`
        : `https://www.youtube.com/channel/${channelId}/community`;
    try {
        const resp = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html'
            },
            timeout: 15000
        });
        const html = resp.data;
        const jsonMatch = html.match(/var ytInitialData = ({.*?});/);
        if (!jsonMatch) return [];

        const data = JSON.parse(jsonMatch[1]);
        const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
        const commTab = tabs.find(t => t.tabRenderer?.title === 'Community' || t.tabRenderer?.title === 'Posts');
        const content = commTab?.tabRenderer?.content;

        let items = [];
        if (content?.sectionListRenderer) {
            items = content.sectionListRenderer.contents?.[0]?.itemSectionRenderer?.contents || [];
        }

        const posts = [];
        for (const item of items) {
            const post = item.backstagePostThreadRenderer?.post?.backstagePostRenderer;
            if (post) {
                const text = post.contentText?.runs?.map(r => r.text).join('') || '';
                const time = post.publishedTimeText?.runs?.[0]?.text || '';
                const likes = post.voteCount?.simpleText || '';
                posts.push({ text, time, likes });
            }
        }
        return posts;
    } catch (e) {
        console.warn(`[Sadhsangat Posts Scraper] Failed for ${channelId}:`, e.message);
        return [];
    }
}

app.get('/api/sadhsangat/channel/:channelId/videos', async (req, res) => {
    const { channelId } = req.params;
    try {
        const ch = await SadhsangatDb.getChannelById(channelId);
        const handle = ch ? ch.channelHandle : null;
        const videos = await getCachedChannelVideos(channelId, handle);
        const mappedVideos = videos.map(v => ({
            ...v,
            channelId: channelId,
            channelName: ch ? ch.channelName : 'Gurbani Channel',
            channelThumbnail: ch ? ch.thumbnail : null
        }));
        res.json({ videos: mappedVideos });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/sadhsangat/channel/:channelId/streams', async (req, res) => {
    const { channelId } = req.params;
    try {
        const ch = await SadhsangatDb.getChannelById(channelId);
        const handle = ch ? ch.channelHandle : null;
        const streams = await getCachedChannelStreams(channelId, handle);
        const mappedStreams = streams.map(v => ({
            ...v,
            channelId: channelId,
            channelName: ch ? ch.channelName : 'Gurbani Channel',
            channelThumbnail: ch ? ch.thumbnail : null
        }));
        res.json({ videos: mappedStreams }); // Named 'videos' to preserve exact frontend contracts
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/sadhsangat/channel/:channelId/playlists', async (req, res) => {
    const { channelId } = req.params;
    try {
        const ch = await SadhsangatDb.getChannelById(channelId);
        const handle = ch ? ch.channelHandle : null;
        const playlists = await scrapeChannelPlaylists(channelId, handle);
        res.json({ playlists });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/sadhsangat/channel/:channelId/posts', async (req, res) => {
    const { channelId } = req.params;
    try {
        const ch = await SadhsangatDb.getChannelById(channelId);
        const handle = ch ? ch.channelHandle : null;
        const posts = await scrapeChannelPosts(channelId, handle);
        res.json({ posts });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/sadhsangat/sync-now', async (req, res) => {
    try {
        // Clear all caches so fresh data is fetched after sync
        channelVideosCache.clear();
        channelStreamsCache.clear();
        await checkYouTubeChannels();
        res.json({ success: true, message: 'Sync complete' });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Sync failed' });
    }
});

// Real-time single-channel live check (used by frontend for on-demand check)
app.get('/api/sadhsangat/live-check', async (req, res) => {
    const { channelId } = req.query;
    if (!channelId) return res.status(400).json({ error: 'channelId required' });
    try {
        const ch = await SadhsangatDb.getChannelById(channelId);
        if (!ch) return res.status(404).json({ error: 'Channel not found' });
        const status = await checkLiveViaScrap(ch);
        // Update DB with fresh status
        const liveUrl = ch.channelHandle
            ? `https://www.youtube.com/${ch.channelHandle}/live`
            : `https://www.youtube.com/channel/${ch.channelId}/live`;
        await SadhsangatDb.upsertChannel({
            ...ch,
            isLive: status.isLive ? 1 : 0,
            liveTitle: status.isLive ? (status.title || ch.liveTitle) : null,
            videoId: status.isLive ? (status.videoId || null) : null,
            watchUrl: status.isLive && status.videoId
                ? `https://www.youtube.com/watch?v=${status.videoId}`
                : liveUrl,
            lastChecked: new Date().toISOString()
        });
        res.json({ isLive: status.isLive, videoId: status.videoId || null, title: status.title || null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Channel name-based search API
app.get('/api/sadhsangat/search', async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
        return res.status(400).json({ error: 'Query too short' });
    }
    try {
        const results = await searchChannelsViaScrap(q.trim());

        // Check if each found channel is already monitored by this user
        const userId = getUserId(req, res);
        const myChs = await SadhsangatDb.getUserChannels(userId);
        const monitoredIds = new Set(myChs.map(c => c.channelId));
        const monitoredHandles = new Set(myChs.map(c => (c.channelHandle || '').toLowerCase()));

        const mappedResults = results.map(r => {
            const alreadyMonitored = monitoredIds.has(r.channelId) ||
                (r.channelHandle && monitoredHandles.has(r.channelHandle.toLowerCase()));
            return { ...r, alreadyMonitored };
        });

        res.json({ channels: mappedResults });
    } catch (e) {
        console.error('[Sadhsangat Search API] Error:', e.message);
        res.status(500).json({ error: 'Could not search channels: ' + e.message });
    }
});
// In-memory cache for channel validation results (can be upgraded to database later)
const channelValidationCache = new Map();

// ═══════════════════════════════════════════════════════════════════
// SMART CHANNEL VALIDATION — Layered Intelligence System
// Layer 1: Instant rejection list (zero AI cost)
// Layer 2: Instant approval list (zero AI cost)
// Layer 3: Groq Llama 3.3 with rich context (channel name + up to 10 videos + description)
// NOTE: AI decision is FINAL — no dumb keyword override after AI approves
// ═══════════════════════════════════════════════════════════════════

// ── Layer 1: Definite NON-SPIRITUAL content → instant reject ────────
const INSTANT_REJECT_KEYWORDS = [
    // Major music labels
    't-series', 'zee music', 'yrf', 'tips music', 'speed records', 'saregama', 'eros now',
    'universal music', 'sony music', 'warner music', 'atlantic records',
    // Mainstream TV / OTT
    'set india', 'sony tv', 'sony liv', 'sony entertainment', 'sony sabrang',
    'star plus', 'star sports', 'star movies', 'hotstar', 'disney hotstar',
    'colors tv', 'colors infinity', 'viacom18', 'colors bangla',
    'zee tv', 'zee punjabi', 'zee cinema', 'zee5',
    'ndtv', 'aaj tak', 'abp news', 'news18', 'india tv', 'republic tv', 'times now',
    'mtv india', 'vh1 india', 'comedy central', 'cartoon network', 'nick india',
    'disney channel', 'hbo', 'netflix', 'amazon prime video',
    // Pure entertainment tags
    'bigg boss', 'indian idol', 'kbc', 'kaun banega',
    // Sports
    'cricket', 'ipl official', 'bcci', 'fifa', 'isl official',
    // Bollywood / Pollywood (music-only; not spiritual)
    'bollywood', 'kollywood', 'tollywood',
];

// Famous Punjabi / Bollywood non-devotional artists (exact channel name patterns)
const INSTANT_REJECT_ARTISTS = [
    'karan aujla', 'diljit dosanjh', 'sidhu moose wala', 'ap dhillon', 'r nait',
    'mankirt aulakh', 'jazzy b', 'babbal rak', 'amrit maan', 'gippy grewal',
    'arjan dhillon', 'shubh', 'imran khan', 'badshah', 'yo yo honey singh',
    'guru randhawa', 'harrdy sandhu', 'b praak', 'jaani', 'prabh gill',
    'sukh-e musical doctorz', 'deep money', 'garry sandhu',
    'akshay kumar', 'salman khan', 'shah rukh khan', 'aamir khan',
];

// Active Groq AI Models with automatic fallbacks.
// Groq deprecated llama-3.1-8b-instant AND llama-3.3-70b-versatile on the free/
// developer tier on 2026-06-17, recommending openai/gpt-oss-20b and
// openai/gpt-oss-120b (or qwen/qwen3.6-27b) respectively as replacements —
// which is why channel validation started failing over to the "temporarily
// unavailable" branch. mixtral-8x7b-32768 was deprecated earlier still. The
// old models are kept at the tail of the list (harmless — a dead model just
// fails fast and the loop moves on) in case a given account/tier still has
// access to them.
const GROQ_MODELS = [
    'openai/gpt-oss-120b',
    'meta-llama/llama-4-maverick-17b-128e-instruct',
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'openai/gpt-oss-20b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'gemma2-9b-it'
];

async function callGroqAI({ messages, temperature = 0.2, maxTokens = 500, timeout = 15000 }) {
    let lastError = null;
    for (const model of GROQ_MODELS) {
        try {
            const response = await axios.post(CONFIG.GROQ_API_URL, {
                model,
                messages,
                temperature,
                max_tokens: maxTokens
            }, {
                headers: {
                    'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout
            });
            const content = response.data.choices[0]?.message?.content || '';
            if (content) {
                return { content, model };
            }
        } catch (err) {
            console.warn(`[Groq AI] Model "${model}" failed (${err.response?.status || err.message}), trying next model...`);
            lastError = err;
        }
    }
    throw lastError || new Error('All Groq AI models failed');
}

// ── Layer 2: Obviously SPIRITUAL content → instant approve ──────────
const INSTANT_APPROVE_KEYWORDS = [
    // Gurbani / Sikh
    'gurbani', 'kirtan', 'shabad', 'nitnem', 'japji', 'rehraas', 'sukhmani',
    'simran', 'naam simran', 'waheguru', 'satnam', 'mool mantar', 'ardas', 'hukamnama',
    'gurdwara', 'harmandir', 'darbar sahib', 'amrit sanchar', 'amrit vela', 'prabhat pheri',
    'sikh', 'sikhism', 'guru granth', 'granth sahib', 'dastar', 'langar',
    'akali', 'sgpc', 'taksali', 'hazoori ragi', 'ragi jatha',
    // Spiritual / Devotional (Punjabi/Hindi terms)
    'sadhna', 'sadhsangat', 'sangat', 'satsang', 'sewa', 'sevadars',
    'katha', 'kathavachak', 'paath', 'path', 'akhand path', 'sehaj path',
    'divya', 'divine', 'spiritual', 'devotional', 'bhajan', 'aarti', 'puja', 'pooja',
    'mandir', 'temple', 'masjid', 'church', 'gurudwara',
    'swami', 'maharaj', 'guruji', 'sant', 'baba', 'mahapurush', 'sadhu',
    'ashram', 'dera', 'tirth', 'yatra', 'dharm', 'dharam', 'dharma',
    'amritvani', 'prabhu', 'bhagwan', 'ishwar', 'parmatma', 'aatma',
    // Other Indian devotional
    'ramayana', 'mahabharata', 'geeta', 'gita', 'veda', 'vedic', 'upanishad',
    'hanuman', 'krishna', 'ram', 'shiv', 'durga', 'ganesh', 'mata',
    'quran', 'namaz', 'dua', 'islamic', 'sufi', 'dargah',
    'bible', 'gospel', 'prayer', 'christian', 'jesus',
];

// AI Channel Validation Endpoint
app.post('/api/sadhsangat/validate-channel', async (req, res) => {
    const { channelName, channelId, channelHandle } = req.body;

    if (!channelName || channelName.trim().length < 2) {
        return res.status(400).json({ error: 'Channel name too short' });
    }

    try {
        const cacheKey = `${channelName.trim().toLowerCase()}_${channelId || 'unknown'}`;
        const now = Date.now();
        const cached = channelValidationCache.get(cacheKey);

        if (cached && (now - cached.timestamp) < CONFIG.CHANNEL_VALIDATION_CACHE_TTL) {
            console.log('[Channel Validation] Cache hit for', channelName);
            return res.json({
                isValid: cached.isValid,
                reason: cached.reason,
                category: cached.category || 'other',
                fromCache: true
            });
        }

        const channelNameLower = channelName.trim().toLowerCase();

        // ─────────────────────────────────────────────────────────────────
        // LAYER 1: INSTANT REJECT — obvious non-spiritual (no AI cost)
        // Uses the INSTANT_REJECT_KEYWORDS + INSTANT_REJECT_ARTISTS arrays
        // ─────────────────────────────────────────────────────────────────
        const matchedRejectKw = INSTANT_REJECT_KEYWORDS.find(kw => channelNameLower.includes(kw));
        const matchedRejectArtist = INSTANT_REJECT_ARTISTS.find(artist => channelNameLower.includes(artist));

        if (matchedRejectKw || matchedRejectArtist) {
            const matchedTerm = matchedRejectKw || matchedRejectArtist;
            console.log(`[Channel Validation] ❌ INSTANT REJECT: "${channelName}" matched "${matchedTerm}"`);
            const result = {
                isValid: false,
                reason: `This channel appears to be non-spiritual content (matched: "${matchedTerm}"). Not suitable for Sadhsangat Live.`,
                category: 'entertainment',
                timestamp: now
            };
            channelValidationCache.set(cacheKey, result);
            return res.json({ ...result, fromCache: false });
        }

        // ─────────────────────────────────────────────────────────────────
        // LAYER 2: INSTANT APPROVE — obvious spiritual (no AI cost)
        // Uses the INSTANT_APPROVE_KEYWORDS array (includes sadhna, sangat,
        // sewa, katha, paath, sant, baba, maharaj, mandir, swami, etc.)
        // ─────────────────────────────────────────────────────────────────
        const matchedApproveKw = INSTANT_APPROVE_KEYWORDS.find(kw => channelNameLower.includes(kw));

        if (matchedApproveKw) {
            console.log(`[Channel Validation] ✅ INSTANT APPROVE: "${channelName}" matched "${matchedApproveKw}"`);
            const result = {
                isValid: true,
                reason: `Channel name contains spiritual keyword "${matchedApproveKw}" — clearly devotional content.`,
                category: 'devotional',
                timestamp: now
            };
            channelValidationCache.set(cacheKey, result);
            return res.json({ ...result, fromCache: false });
        }

        // ─────────────────────────────────────────────────────────────────
        // LAYER 3: AI DEEP ANALYSIS — for ambiguous channels
        // Provides rich context: up to 10 video titles + channel description
        // AI decision is FINAL (no dumb keyword override that kills legit channels)
        // ─────────────────────────────────────────────────────────────────
        let sampleVideos = [];
        let channelDescription = '';
        let channelHandle_resolved = channelHandle || '';

        if (channelId) {
            try {
                const ch = await SadhsangatDb.getChannelById(channelId);
                channelHandle_resolved = (ch && ch.channelHandle) ? ch.channelHandle : channelHandle_resolved;
                const videos = await getCachedChannelVideos(channelId, channelHandle_resolved);
                sampleVideos = videos.slice(0, 10).map(v => v.title).filter(t => t);
                if (ch && ch.description) {
                    channelDescription = ch.description.substring(0, 600);
                }
            } catch (err) {
                console.warn('[Channel Validation] Could not fetch channel data:', err.message);
            }
        }

        // Build rich context for AI
        const contextLines = [];
        contextLines.push(`Channel Name: ${channelName}`);
        if (channelHandle_resolved) contextLines.push(`Handle: @${channelHandle_resolved.replace(/^@/, '')}`);
        if (sampleVideos.length > 0) {
            contextLines.push(`Recent Videos (${sampleVideos.length}):\n${sampleVideos.map((t, i) => `  ${i + 1}. ${t}`).join('\n')}`);
        } else {
            contextLines.push('Recent Videos: Not available — judge by channel name alone');
        }
        if (channelDescription) {
            contextLines.push(`Channel Description: ${channelDescription}`);
        }
        const richContext = contextLines.join('\n');

        const validationPrompt = `You are an expert content classifier for a SIKH & SPIRITUAL DEVOTIONAL platform called "Sadhsangat Live".
Your job: decide if a YouTube channel belongs on this platform.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANNEL TO EVALUATE:
${richContext}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

APPROVE (isValid: true) if the channel is about:
• Gurbani, Kirtan, Shabad, Nitnem, Simran, Waheguru, Amrit Vela
• Sikh Gurdwara, SGPC, Darbar Sahib, Hazoori Ragi
• Satsang, Katha, Paath, Sewa, Sadhsangat, Sangat
• Sadhna (in spiritual context), Guruji, Sant, Baba, Maharaj
• Hindu devotional: Bhajan, Aarti, Satsang, Swami, Ashram, Mandir
• Islamic devotional: Naats, Quran recitation, Sufi, Dargah
• Christian devotional: Gospel, Praise & Worship, Church hymns
• Punjabi Ragis, Dhadhis, Hazoori Singers performing Gurbani
• Spiritual talks / discourses even if not purely Gurbani

REJECT (isValid: false) if the channel is about:
• Punjabi pop singers (Karan Aujla, Diljit Dosanjh, AP Dhillon, Sidhu Moose Wala, Babbal Rak, Amrit Maan, Guru Randhawa, Arjan Dhillon, Shubh, etc.)
• Music labels (T-Series, Speed Records, Zee Music, YRF, Tips Music)
• Mainstream TV (Star, Colors, Zee, Sony, NDTV, Aaj Tak)
• Entertainment: Comedy, fashion, gaming, vlogs, reality shows
• Sports, politics, news, technology, cooking (non-devotional)
• Bollywood / film industry channels

IMPORTANT NOTES:
• Channels in Punjabi script (Gurmukhi) or Hindi are often devotional — be generous
• A channel named after a saint / spiritual teacher is likely devotional
• "Sadhna" in Punjabi/Hindi context = spiritual practice — NOT the TV channel "Sadhna TV"
• "Sangat", "Satsang", "Sewa", "Baba", "Sant" are strong spiritual indicators
• If video titles contain Gurbani words or Punjabi religious terms → APPROVE
• When genuinely unsure → lean APPROVE (the platform admins will do final review)
• Your decision is FINAL — do not second-guess yourself

Respond ONLY with valid JSON (no markdown, no explanation outside JSON):
{
  "isValid": true,
  "reason": "one sentence explaining why",
  "category": "gurbani|sikh|hindu|islamic|christian|devotional|singer|entertainment|other",
  "confidence": "high|medium|low"
}`;

        console.log(`[Channel Validation] 🤖 Calling AI for "${channelName}" (${sampleVideos.length} videos fetched)`);

        // Was a standalone axios call hardcoded to the long-deprecated
        // 'llama-3.1-70b-versatile' — every request failed straight to the
        // catch block below ("Validation service temporarily unavailable"),
        // which is why legitimate channels stopped being approved. Reuses the
        // same callGroqAI() fallback chain the rest of this file already has,
        // instead of a second, divergent copy of the same Groq-call logic.
        const { content: rawContent, model: usedModel } = await callGroqAI({
            messages: [
                { role: 'system', content: 'You are a JSON API. Always respond with valid JSON only. Never add markdown fences or text outside the JSON object.' },
                { role: 'user', content: validationPrompt }
            ],
            temperature: 0.2,
            maxTokens: 250,
            timeout: 15000
        });
        console.log(`[Channel Validation] AI raw response for "${channelName}" (model: ${usedModel}):`, rawContent.substring(0, 300));

        let validationResult;
        try {
            const jsonMatch = rawContent.match(/{[\s\S]*}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : rawContent;
            validationResult = JSON.parse(jsonStr);

            if (typeof validationResult.isValid !== 'boolean') {
                throw new Error('AI response missing isValid boolean');
            }

            console.log(`[Channel Validation] 🎯 AI decision for "${channelName}": ${validationResult.isValid ? '✅ APPROVED' : '❌ REJECTED'} (${validationResult.confidence || '?'} confidence) — ${validationResult.reason}`);

            // Rescue pass: AI rejected but video titles clearly show spiritual content
            // This ONLY rescues rejections, never kills approvals
            if (!validationResult.isValid && sampleVideos.length > 0) {
                const videosTextLower = sampleVideos.join(' ').toLowerCase();
                const spiritualRescueKw = [
                    'gurbani', 'kirtan', 'shabad', 'nitnem', 'japji', 'simran',
                    'waheguru', 'gurdwara', 'harmandir', 'amrit', 'satsang', 'katha',
                    'bhajan', 'aarti', 'sewa', 'paath', 'hukamnama'
                ];
                const matchedRescue = spiritualRescueKw.find(kw => videosTextLower.includes(kw));
                if (matchedRescue) {
                    console.log(`[Channel Validation] 🛟 RESCUE: AI rejected "${channelName}" but videos contain "${matchedRescue}" — overriding to APPROVE`);
                    validationResult.isValid = true;
                    validationResult.reason = `AI was uncertain but video titles clearly contain spiritual content ("${matchedRescue}").`;
                    validationResult.category = 'devotional';
                    validationResult.confidence = 'medium';
                }
            }

        } catch (parseErr) {
            console.error('[Channel Validation] ⚠️ Failed to parse AI response:', rawContent, parseErr.message);
            // On parse failure: REJECT (secure default)
            validationResult = {
                isValid: false,
                reason: 'AI response could not be parsed. Channel rejected for safety — please try again.',
                category: 'other',
                confidence: 'low'
            };
        }

        const cacheEntry = {
            isValid: validationResult.isValid,
            reason: validationResult.reason,
            category: validationResult.category || 'other',
            timestamp: now
        };
        channelValidationCache.set(cacheKey, cacheEntry);

        return res.json({
            isValid: validationResult.isValid,
            reason: validationResult.reason,
            category: validationResult.category || 'other',
            confidence: validationResult.confidence || 'medium',
            fromCache: false
        });

    } catch (err) {
        console.error('[Channel Validation] ❌ Unexpected error:', err.message);
        // On unexpected error: REJECT (secure default — don't accidentally let junk through)
        return res.json({
            isValid: false,
            reason: 'Validation service temporarily unavailable. Please try adding the channel again in a moment.',
            category: 'other',
            confidence: 'low',
            fromCache: false
        });
    }
});

// In-memory cache for video validation results
const videoValidationCache = new Map();

async function searchVideosViaScrap(query) {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;
    try {
        const resp = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html'
            },
            timeout: 15000
        });
        const html = resp.data;
        const jsonMatch = html.match(/var ytInitialData = ({.*?});/);
        if (!jsonMatch) return [];

        const data = JSON.parse(jsonMatch[1]);
        const items = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

        const results = [];
        for (const item of items) {
            const video = item.videoRenderer;
            if (video && video.videoId) {
                const videoId = video.videoId;
                const title = video.title?.runs?.[0]?.text || video.title?.simpleText || 'Video';
                const channelName = video.ownerText?.runs?.[0]?.text || video.shortBylineText?.runs?.[0]?.text || '';
                const duration = video.lengthText?.simpleText || '';
                const views = video.viewCountText?.simpleText || '';
                const publishedTime = video.publishedTimeText?.simpleText || '';
                const thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                results.push({ videoId, title, channelName, duration, views, publishedTime, thumbnail });
            }
        }
        return results;
    } catch (e) {
        console.warn('[Sadhsangat Video Search Scraper] Failed to search videos:', e.message);
        return [];
    }
}

async function validateVideosViaAI(videos) {
    if (!videos || videos.length === 0) return [];

    const uncachedVideos = [];
    const validatedResults = [];

    for (const v of videos) {
        const cached = videoValidationCache.get(v.videoId);
        if (cached) {
            validatedResults.push({ ...v, isValid: cached.isValid, reason: cached.reason });
        } else {
            uncachedVideos.push(v);
        }
    }

    if (uncachedVideos.length === 0) {
        return validatedResults.filter(v => v.isValid);
    }

    // Limit to evaluating top 10 uncached videos in one batch to control prompt size and latency
    const batchToEvaluate = uncachedVideos.slice(0, 10);

    const videoLines = batchToEvaluate.map((v, i) => {
        return `${i + 1}. Video ID: ${v.videoId} | Title: "${v.title}" | Channel: "${v.channelName}"`;
    }).join('\n');

    const prompt = `You are an expert content classifier for a Sikh & Spiritual devotional platform "Sadhsangat Live".
Your task: evaluate the following YouTube videos. Determine if EACH video is appropriate for this spiritual platform.

APPROVE (isValid: true) ONLY if the video is related to:
- Gurbani, Kirtan, Shabad, Nitnem, Simran, Waheguru, Sukhmani Sahib, Japji Sahib, Rehraas Sahib, Ardas
- Sikh Gurdwara, Harmandir Sahib, Darbar Sahib, Gurmat Sikh history/teaching
- Sikh historical lectures/Kathas by recognized scholars/Kathavachaks
- Hindu devotional (Bhajans, Aarti, Satsang, devotional discourses, Mahabharata/Ramayana spiritual snippets)
- Islamic devotional (Naats, Quran recitation, Sufi qawwali with spiritual focus, Islamic spiritual lectures)
- Christian devotional (Gospel, church hymns, praise and worship, spiritual bible teaching)
- Other religious/spiritual devotional practices or interfaith peace discourses

REJECT (isValid: false) if the video is:
- Punjabi pop/secular/hip-hop music or songs by singers like Karan Aujla, Diljit Dosanjh, Sidhu Moose Wala, AP Dhillon, etc.
- Commercial music labels release (T-Series, Speed Records, Zee Music, etc.)
- Mainstream movies, movie trailers, film scenes, actor interviews
- News, politics, daily debates, current affairs
- Comedy, prank videos, roasts, memes
- Vlogs (lifestyle, travel, food review), cooking shows, gaming streams
- Tech reviews, unboxing, science tutorials, coding tutorials, other secular educational content
- Sports, cricket, WWE, fitness, bodybuilding promos

For each video, analyze its title and channel name carefully.
If the title is in Gurmukhi, Hindi/Devanagari, or Shahmukhi script, it is highly likely devotional—please inspect the translation or terms.
If you are uncertain but it leans spiritual, approve it. If it is secular/pop/entertainment, you MUST reject it.

Videos to evaluate:
${videoLines}

Respond ONLY with valid JSON (no markdown explanation or formatting blocks):
{
  "evaluations": [
    {
      "videoId": "[VIDEO_ID]",
      "isValid": true/false,
      "reason": "Brief one sentence explanation"
    },
    ...
  ]
}`;

    try {
        console.log(`[Video Validation] Calling AI to evaluate ${batchToEvaluate.length} videos...`);
        const aiResponse = await callGroqAI({
            messages: [
                { role: 'system', content: 'You are a JSON API. Always respond with valid JSON only. Never add markdown fences or text outside the JSON object.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.1,
            maxTokens: 1000,
            timeout: 20000
        });

        const rawContent = aiResponse.content;
        const jsonMatch = rawContent.match(/{[\s\S]*}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : rawContent;
        const result = JSON.parse(jsonStr);

        const evaluations = result.evaluations || [];
        const evalMap = new Map(evaluations.map(e => [e.videoId, e]));

        for (const v of batchToEvaluate) {
            const evaluation = evalMap.get(v.videoId);
            const isValid = evaluation ? !!evaluation.isValid : false;
            const reason = evaluation ? evaluation.reason : 'AI did not evaluate';

            videoValidationCache.set(v.videoId, { isValid, reason, timestamp: Date.now() });
            validatedResults.push({ ...v, isValid, reason });
        }

        // For any videos in the original list that were not in the batch, or missed by AI, mark as invalid and cache
        for (const v of videos) {
            if (!videoValidationCache.has(v.videoId)) {
                videoValidationCache.set(v.videoId, { isValid: false, reason: 'Skipped validation', timestamp: Date.now() });
            }
        }

    } catch (err) {
        console.error('[Video Validation] AI batch check failed:', err.message);
        // Robust fallback: If AI fails, use a local keyword fallback to avoid breaking search completely!
        const spiritualRescueKw = [
            'gurbani', 'kirtan', 'shabad', 'nitnem', 'japji', 'simran',
            'waheguru', 'sahib', 'gurdwara', 'harmandir', 'amrit', 'satsang', 'katha',
            'bhajan', 'aarti', 'sewa', 'paath', 'hukamnama', 'dharmik', 'devotional'
        ];

        for (const v of batchToEvaluate) {
            const titleLower = (v.title || '').toLowerCase();
            const channelLower = (v.channelName || '').toLowerCase();
            const matchesLocal = spiritualRescueKw.some(kw => titleLower.includes(kw) || channelLower.includes(kw));

            videoValidationCache.set(v.videoId, {
                isValid: matchesLocal,
                reason: matchesLocal ? 'Local keyword fallback match' : 'Local keyword fallback mismatch/AI Offline',
                timestamp: Date.now()
            });
            validatedResults.push({ ...v, isValid: matchesLocal, reason: 'AI offline fallback' });
        }
    }

    return validatedResults.filter(v => v.isValid);
}

// Enhanced Content Search API (search videos by title, description, channel name)
app.get('/api/sadhsangat/content-search', async (req, res) => {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
        return res.status(400).json({ error: 'Query too short' });
    }

    try {
        console.log(`[Content Search API] Global video search running for query: "${q}"`);

        // 1. Scrape YouTube search results for videos
        const rawVideos = await searchVideosViaScrap(q.trim());

        // 2. Validate those videos using our AI classifier (with caching and fallbacks)
        const validatedVideos = await validateVideosViaAI(rawVideos);

        console.log(`[Content Search API] Found ${rawVideos.length} raw videos, approved ${validatedVideos.length} videos`);

        res.json({
            videos: validatedVideos.slice(0, 30),
            total: validatedVideos.length,
            query: q
        });

    } catch (e) {
        console.error('[Content Search API] Error:', e.message);
        res.status(500).json({ error: 'Search failed: ' + e.message });
    }
});

// ═══════════════════════════════════════════════════════════════════
// 🤖 SADHSANGAT AI COMPANION — Groq openai/gpt-oss-120b Endpoint
// ═══════════════════════════════════════════════════════════════════
app.post('/api/sadhsangat/ai/chat', async (req, res) => {
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required' });
    }

    try {
        const systemPrompt = `You are "Sangat AI" (ਸੰਗਤ ਵਿਚਾਰ), a calm, respectful, intelligent, and scholarly spiritual companion for the ANHAD Sadhsangat Live platform.

CORE PRINCIPLES:
1. Tone & Demeanor: Calm, respectful, thoughtful, scholarly, peaceful, concise. Avoid corporate clichés, generic chatbot filler ("Certainly! I'd be happy to help"), and excessive emojis.
2. Domain Expertise: Gurbani, Sri Guru Granth Sahib Ji, Sikh philosophy (Gurmat), Gurmukhi concepts, historical context, devotional Kirtan, Katha, Simran, and Amritvela practices. Also respect and understand broad interfaith spiritual philosophy.
3. Content Context: ${context ? `The user is currently listening to / reflecting upon: "${context.title || ''}" by "${context.channelName || ''}". Provide relevant spiritual context if asked.` : 'General spiritual reflection.'}
4. Response Format: Clear markdown with clean paragraph breaks and elegant Gurmukhi quotes where relevant with English/Punjabi transliteration and translation.
5. Cultural Sensitivity: Always use respectful titles (e.g., Guru Nanak Dev Ji, Bhagat Kabir Ji, Bhai Gurdas Ji) and sacred humility.`;

        const fullMessages = [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-8) // Keep last 8 turns for conversational context
        ];

        // Call Groq AI with openai/gpt-oss-120b primary model
        const { content, model } = await callGroqAI({
            messages: fullMessages,
            temperature: 0.3,
            maxTokens: 1000,
            timeout: 25000
        });

        res.json({
            message: content,
            model: model || 'openai/gpt-oss-120b',
            timestamp: Date.now()
        });

    } catch (err) {
        console.error('[Sadhsangat AI Chat] Error:', err.message);
        res.status(500).json({
            error: 'Sangat AI is currently contemplating. Please try your reflection again in a moment.'
        });
    }
});

// Helper to sort YouTube relative strings ("1 hour ago") and absolute dates ("1 Jun 2026")
const parsePublishedTime = (timeStr) => {
    if (!timeStr) return 999999999;
    let clean = timeStr.toLowerCase().trim();

    // Remove formatting keywords
    clean = clean.replace('streamed', '').replace('premiered', '').trim();

    // Live streams show "X watching" or "X,XXX watching" — always sort to top (0 = most recent)
    if (clean.includes('watching') || clean.includes('watching now')) {
        return 0;
    }

    if (clean.includes('scheduled') || clean.includes('starts')) {
        return 999999998; // Sort upcoming/scheduled streams towards the end
    }

    if (clean.includes('ago')) {
        let multiplier = 1;
        if (clean.includes('second')) multiplier = 1;
        else if (clean.includes('minute')) multiplier = 60;
        else if (clean.includes('hour')) multiplier = 3600;
        else if (clean.includes('day')) multiplier = 86400;
        else if (clean.includes('week')) multiplier = 86400 * 7;
        else if (clean.includes('month')) multiplier = 86400 * 30;
        else if (clean.includes('year')) multiplier = 86400 * 365;

        const match = clean.match(/([0-9.]+)/);
        const value = match ? parseFloat(match[1]) : 1;
        return value * multiplier;
    }

    // Parse absolute dates (e.g. "1 jun 2026", "19 apr 2026")
    const parsed = Date.parse(clean);
    if (!isNaN(parsed)) {
        return Math.max(0, Math.floor((Date.now() - parsed) / 1000));
    }

    return 999999999;
};

// Unified video feed for all monitored channels combined
app.get('/api/sadhsangat/videos', async (req, res) => {
    const userId = getUserId(req, res);
    try {
        const myChs = await SadhsangatDb.getUserChannels(userId);
        if (myChs.length === 0) {
            return res.json({ videos: [] });
        }

        // Fetch videos for user's monitored channels in parallel
        const fetchPromises = myChs.map(async (ch) => {
            try {
                const videos = await getCachedChannelVideos(ch.channelId, ch.channelHandle);
                return videos.map(v => ({
                    ...v,
                    channelId: ch.channelId,
                    channelName: ch.channelName,
                    channelThumbnail: ch.thumbnail
                }));
            } catch (err) {
                console.warn(`[Sadhsangat Unified Videos] Failed for ${ch.channelName}:`, err.message);
                return [];
            }
        });

        const results = await Promise.allSettled(fetchPromises);
        let allVideos = [];
        for (const res of results) {
            if (res.status === 'fulfilled') {
                allVideos = allVideos.concat(res.value);
            }
        }

        // Sort most recent first (ascending elapsed time)
        allVideos.sort((a, b) => parsePublishedTime(a.publishedTime) - parsePublishedTime(b.publishedTime));

        res.json({ videos: allVideos });
    } catch (e) {
        console.error('[Sadhsangat Unified Videos API] Error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// Unified stream feed for all monitored channels combined
app.get('/api/sadhsangat/streams', async (req, res) => {
    const userId = getUserId(req, res);
    try {
        const myChs = await SadhsangatDb.getUserChannels(userId);
        if (myChs.length === 0) {
            return res.json({ videos: [] });
        }

        // Fetch streams for user's monitored channels in parallel
        const fetchPromises = myChs.map(async (ch) => {
            try {
                const streams = await getCachedChannelStreams(ch.channelId, ch.channelHandle);
                return streams.map(v => ({
                    ...v,
                    channelId: ch.channelId,
                    channelName: ch.channelName,
                    channelThumbnail: ch.thumbnail
                }));
            } catch (err) {
                console.warn(`[Sadhsangat Unified Streams] Failed for ${ch.channelName}:`, err.message);
                return [];
            }
        });

        const results = await Promise.allSettled(fetchPromises);
        let allStreams = [];
        for (const res of results) {
            if (res.status === 'fulfilled') {
                allStreams = allStreams.concat(res.value);
            }
        }

        // Sort most recent first (ascending elapsed time)
        allStreams.sort((a, b) => parsePublishedTime(a.publishedTime) - parsePublishedTime(b.publishedTime));

        res.json({ videos: allStreams });
    } catch (e) {
        console.error('[Sadhsangat Unified Streams API] Error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// ═══════════════════════════════════════════════════════════════════
// 📹 VIDEO SEARCH & VALIDATION — AI-Powered Video Discovery
// Extends channel search with individual video search and validation
// Uses same 3-layer validation: instant reject/approve + Groq AI
// ═══════════════════════════════════════════════════════════════════

// Video validation cache (5 minute TTL, separate from channel cache)
// videoValidationCache is already declared above
const VIDEO_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cleanup expired video validation cache entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, value] of videoValidationCache.entries()) {
        if (now - value.timestamp > VIDEO_CACHE_TTL) {
            videoValidationCache.delete(key);
            cleaned++;
        }
    }
    if (cleaned > 0) {
        console.log(`[Video Cache] Cleaned ${cleaned} expired entries`);
    }
}, VIDEO_CACHE_TTL);

/**
 * Search YouTube videos via web scraping
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum results to return (default 50)
 * @returns {Promise<Array>} Array of video objects
 */
async function searchVideosViaYouTubeScraper(query, maxResults = 50) {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: 15000
        });

        const html = response.data;
        const jsonMatch = html.match(/var ytInitialData = ({.*?});/);

        if (!jsonMatch) {
            console.warn('[Video Search] Failed to extract ytInitialData');
            return [];
        }

        const data = JSON.parse(jsonMatch[1]);
        const items = data.contents?.twoColumnSearchResultsRenderer
            ?.primaryContents?.sectionListRenderer?.contents?.[0]
            ?.itemSectionRenderer?.contents || [];

        const videos = [];
        for (const item of items) {
            const video = item.videoRenderer;
            if (!video) continue; // Skip channels, playlists

            const videoId = video.videoId;
            const title = video.title?.runs?.[0]?.text || '';
            const thumbnails = video.thumbnail?.thumbnails || [];
            const thumbnail = thumbnails[thumbnails.length - 1]?.url || '';

            const channelId = video.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '';
            const channelName = video.ownerText?.runs?.[0]?.text || '';
            const channelThumbnail = video.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer
                ?.thumbnail?.thumbnails?.[0]?.url || '';

            const publishedAt = video.publishedTimeText?.simpleText || '';
            const duration = video.lengthText?.simpleText || '';
            const viewCount = video.viewCountText?.simpleText || '';
            const description = video.descriptionSnippet?.runs?.map(r => r.text).join('') || '';

            videos.push({
                videoId,
                title,
                thumbnail,
                channelId,
                channelName,
                channelThumbnail,
                publishedAt,
                duration,
                viewCount,
                description
            });

            if (videos.length >= maxResults) break;
        }

        return videos;
    } catch (error) {
        console.error('[Video Search] Scraper error:', error.message);
        throw error;
    }
}

/**
 * Validate a video using 3-layer approach (instant reject/approve + AI)
 * @param {string} videoId - YouTube video ID
 * @param {string} title - Video title
 * @param {string} channelName - Channel name
 * @param {string} description - Video description (optional)
 * @returns {Promise<Object>} Validation result {isValid, reason, category, confidence, fromCache}
 */
async function validateVideo(videoId, title, channelName, description = '') {
    const cacheKey = `video_${videoId}`;

    // Check cache first
    const cached = videoValidationCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < VIDEO_CACHE_TTL) {
        return { ...cached, fromCache: true };
    }

    const titleLower = title.toLowerCase();
    const channelLower = channelName.toLowerCase();
    const descLower = description.toLowerCase();
    const combined = `${titleLower} ${channelLower} ${descLower}`;

    // Layer 1: Instant Rejection (reuse channel keywords)
    const matchedRejectKw = INSTANT_REJECT_KEYWORDS.find(kw => combined.includes(kw));
    const matchedRejectArtist = INSTANT_REJECT_ARTISTS.find(artist => combined.includes(artist));

    if (matchedRejectKw || matchedRejectArtist) {
        const result = {
            isValid: false,
            reason: `Entertainment content detected (${matchedRejectKw || matchedRejectArtist})`,
            category: 'entertainment',
            confidence: 'high',
            timestamp: Date.now()
        };
        videoValidationCache.set(cacheKey, result);
        console.log(`[Video Validation] ❌ REJECT (instant) - "${title}": ${result.reason}`);
        return { ...result, fromCache: false };
    }

    // Layer 2: Instant Approval (reuse channel keywords)
    const matchedApproveKw = INSTANT_APPROVE_KEYWORDS.find(kw => combined.includes(kw));

    if (matchedApproveKw) {
        const result = {
            isValid: true,
            reason: `Spiritual content keyword detected (${matchedApproveKw})`,
            category: 'devotional',
            confidence: 'high',
            timestamp: Date.now()
        };
        videoValidationCache.set(cacheKey, result);
        console.log(`[Video Validation] ✅ APPROVE (instant) - "${title}": ${result.reason}`);
        return { ...result, fromCache: false };
    }

    // Layer 3: Groq AI Analysis
    console.log(`[Video Validation] 🤖 Calling AI for "${title}"`);

    const validationPrompt = `Analyze this YouTube video and determine if it contains spiritual/devotional content:

Title: ${title}
Channel: ${channelName}
Description: ${description.substring(0, 300)}

Is this video spiritual/devotional content (Gurbani, Kirtan, Shabad, Nitnem, Hindu devotional, Islamic spiritual, Christian worship, or general spiritual/meditation content)?

Respond ONLY with valid JSON in this exact format:
{
  "isValid": true/false,
  "reason": "Brief explanation",
  "category": "gurbani/sikh/hindu/islamic/christian/devotional/singer/entertainment/other",
  "confidence": "high/medium/low"
}

Reject if: music videos, vlogs, entertainment, gaming, news, politics, sports, tech, comedy, general music artists.
Approve if: devotional content, spiritual discourse, religious ceremonies, kirtan, bhajan, qawwali, gospel, meditation.`;

    try {
        const aiResponse = await callGroqAI({
            messages: [
                { role: 'system', content: 'You are a JSON API that validates spiritual content. Always respond with valid JSON only.' },
                { role: 'user', content: validationPrompt }
            ],
            temperature: 0.2,
            maxTokens: 250,
            timeout: 15000
        });

        const content = aiResponse.content.trim();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON in response');
        }

        const aiResult = JSON.parse(jsonMatch[0]);
        const result = {
            isValid: Boolean(aiResult.isValid),
            reason: aiResult.reason || 'AI validation completed',
            category: aiResult.category || 'other',
            confidence: aiResult.confidence || 'medium',
            timestamp: Date.now()
        };

        videoValidationCache.set(cacheKey, result);
        console.log(`[Video Validation] ${result.isValid ? '✅ APPROVE' : '❌ REJECT'} (AI) - "${title}": ${result.reason}`);
        return { ...result, fromCache: false };

    } catch (error) {
        console.error('[Video Validation] AI error:', error.message);

        // Default to rejection on error (secure default)
        const result = {
            isValid: false,
            reason: 'Validation timeout or error - rejected for safety',
            category: 'other',
            confidence: 'low',
            timestamp: Date.now()
        };
        videoValidationCache.set(cacheKey, result);
        return { ...result, fromCache: false };
    }
}

/**
 * Video Search API Endpoint
 * GET /api/sadhsangat/video-search?q=query
 */
app.get('/api/sadhsangat/video-search', async (req, res) => {
    const { q } = req.query;

    // Validation
    if (!q || q.trim().length < 2) {
        return res.status(400).json({
            error: 'Query too short',
            details: 'Search query must be at least 2 characters',
            errorCode: 'QUERY_TOO_SHORT'
        });
    }

    try {
        console.log(`[Video Search] Query: "${q}"`);

        // Fetch videos from YouTube
        const videos = await searchVideosViaYouTubeScraper(q, 50);
        console.log(`[Video Search] Found ${videos.length} videos`);

        if (videos.length === 0) {
            return res.json({ videos: [], validationStats: { total: 0, approved: 0, rejected: 0, cached: 0 } });
        }

        // Validate videos in parallel (batches of 10)
        const validatedVideos = [];
        let stats = { total: 0, approved: 0, rejected: 0, cached: 0 };

        for (let i = 0; i < videos.length; i += 10) {
            const batch = videos.slice(i, i + 10);
            const batchResults = await Promise.allSettled(
                batch.map(video =>
                    validateVideo(video.videoId, video.title, video.channelName, video.description)
                )
            );

            batchResults.forEach((result, index) => {
                stats.total++;
                if (result.status === 'fulfilled' && result.value.isValid) {
                    validatedVideos.push({
                        ...batch[index],
                        validationReason: result.value.reason
                    });
                    stats.approved++;
                    if (result.value.fromCache) stats.cached++;
                } else {
                    stats.rejected++;
                }
            });
        }

        console.log(`[Video Search] Validation complete: ${stats.approved} approved, ${stats.rejected} rejected (${stats.cached} from cache)`);

        res.json({
            videos: validatedVideos,
            validationStats: stats,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('[Video Search] Error:', error);

        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            return res.status(503).json({
                error: 'Search service unavailable',
                details: 'YouTube search is temporarily unavailable',
                errorCode: 'SERVICE_UNAVAILABLE'
            });
        }

        res.status(500).json({
            error: 'Search failed',
            details: 'An unexpected error occurred. Please try again.',
            errorCode: 'INTERNAL_ERROR'
        });
    }
});

/**
 * Video Validation API Endpoint
 * POST /api/sadhsangat/validate-video
 * Body: { videoId, title, channelName, description }
 */
app.post('/api/sadhsangat/validate-video', async (req, res) => {
    const { videoId, title, channelName, description } = req.body;

    if (!videoId || !title) {
        return res.status(400).json({
            error: 'Missing required fields',
            details: 'videoId and title are required',
            errorCode: 'MISSING_FIELDS'
        });
    }

    try {
        const result = await validateVideo(videoId, title, channelName || '', description || '');
        res.json(result);
    } catch (error) {
        console.error('[Video Validation] Error:', error);
        res.status(500).json({
            error: 'Validation failed',
            details: error.message,
            errorCode: 'VALIDATION_ERROR'
        });
    }
});

// ═══════════════════════════════════════════════════════════════════
// OTHER API ROUTES
// ═══════════════════════════════════════════════════════════════════


app.get('/api/tracks', (req, res) => {
    res.json({
        tracks: PLAYLIST,
        baseUrl: '/audio',
        simranTracks: SIMRAN_PLAYLIST,
        simranBaseUrl: '/simran-audio'
    });
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
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(CONFIG.MAIN_UI, 'index.html'));
});

// Service Worker - serve from frontend root (no-cache for instant updates)
app.get('/sw.js', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.sendFile(path.join(CONFIG.FRONTEND_ROOT, 'sw.js'));
});

// Service Worker (legacy) - no-cache
app.get('/service-worker.js', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.sendFile(path.join(CONFIG.FRONTEND_ROOT, 'service-worker.js'));
});

// Version.json - CRITICAL: Must never be cached for instant PWA updates
app.get('/version.json', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.sendFile(path.join(CONFIG.FRONTEND_ROOT, 'version.json'));
});

// Manifest
app.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.sendFile(path.join(CONFIG.FRONTEND_ROOT, 'manifest.json'));
});

// ═══════════════════════════════════════════════════════════════════
// BaniDB API Proxy - Avoid CORS issues by proxying through backend
// ═══════════════════════════════════════════════════════════════════

app.use('/api/banidb', async (req, res) => {
    const banidbPath = req.path;
    const queryString = new URLSearchParams(req.query).toString();
    const targetUrl = `https://api.banidb.com/v2${banidbPath}${queryString ? '?' + queryString : ''}`;

    try {
        console.log(`[BaniDB Proxy] Fetching: ${targetUrl}`);
        const response = await fetch(targetUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'ANHAD-Gurbani-App/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`BaniDB API error: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('[BaniDB Proxy] Error:', error.message);
        res.status(500).json({
            error: 'Failed to fetch from BaniDB',
            message: error.message,
            url: targetUrl
        });
    }
});

// ═══════════════════════════════════════════════════════════════════
// STATIC FILES - MUST be after all API routes
// ═══════════════════════════════════════════════════════════════════

// Serve OPPO weather assets (shaders, textures, etc.)
//
// `maxAge: '1y', immutable: true` below is the RIGHT policy for
// content-hashed assets (e.g. app.a3f9c1.js) — the filename changes when the
// content does, so caching forever is safe. This codebase's JS/CSS are NOT
// content-hashed: they're plain filenames (trendora-app.js, insights.css,
// ...) edited in place, with only a handful of pages manually appending a
// "?v=X.Y.Z" cache-buster, inconsistently. Every .js/.css file WITHOUT one
// inherited the blanket immutable/1y default and got permanently cached by
// the browser (and re-fetched into the service worker's cacheFirst store)
// the very first time it was ever requested — invisible to every edit made
// since, no matter how the file changed on disk. This is why "hard refresh
// works, returning via the SPA doesn't": .html already overrides this to
// no-cache below and is always revalidated; .js/.css never were. Overriding
// them the same way (matching .html) trades one extra conditional request
// (a fast 304 when unchanged, via etag) for edits actually being visible.
const staticOptions = {
    etag: true,
    maxAge: '1y',
    immutable: true,
    setHeaders: (res, filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        if (ext === '.html') {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
        } else if (ext === '.js') {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
        } else if (ext === '.css') {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
        } else if (ext === '.json') {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            if (filePath.endsWith('version.json')) {
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            }
        } else if (ext === '.avif') {
            res.setHeader('Content-Type', 'image/avif');
        }
    }
};

app.use('/weather-assets', express.static(path.join(__dirname, '..', 'assets'), staticOptions));

// Serve entire frontend folder
app.use(express.static(CONFIG.FRONTEND_ROOT, staticOptions));

// Serve under ANHAD-FINAL sub-path (for VS Code Live Preview & local subdirectory support)
app.use('/ANHAD-FINAL/frontend', express.static(CONFIG.FRONTEND_ROOT, staticOptions));

// ─── ROUTE ALIASES: Short-hand URLs for common pages ────────────────────────
// '/reader.html' → '/nitnem/reader.html'  (e.g. old links from nitnem/category pages)
app.get('/reader.html', (req, res) => {
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect(301, `/nitnem/reader.html${query}`);
});
// '/sehaj-reader.html' → '/SehajPaath/reader.html'
app.get('/sehaj-reader.html', (req, res) => {
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect(301, `/SehajPaath/reader.html${query}`);
});

// Serve MainWebPage at root
app.use('/', express.static(CONFIG.MAIN_UI, staticOptions));

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
    await simranBroadcast.initialize();

    // Initialize Sadhsangat Live DB and start the Cron Poller
    await initSadhsangatDb();
    // Make it unambiguous which campaign-config backend is live — a file
    // backend on Render silently loses every admin change on restart.
    configStore.logBackend();
    startSadhsangatCron();

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
    await simranBroadcast.shutdown();
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
