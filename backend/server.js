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
const rateLimitModule = require('express-rate-limit');
const rateLimit = rateLimitModule.rateLimit || rateLimitModule;
const ipKeyGenerator = rateLimitModule.ipKeyGenerator || ((ip) => ip);
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = process.env.PORT || 3000;

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

// Parse JSON body — 10kb limit prevents oversized payload attacks
app.use(express.json({ limit: '10kb' }));

// CORS — allow localhost variants for development, env-controlled for production
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ||
    'http://localhost:3000,http://127.0.0.1:3000,https://localhost,https://localhost:3000,https://anhadnaam.vercel.app,capacitor://localhost,ionic://localhost')
    .split(',').map(o => o.trim()).filter(Boolean);

// For local dev, be permissive; production uses strict origin list
const IS_LOCAL_DEV = !process.env.ALLOWED_ORIGINS;

app.use((req, res, next) => {
    const origin = req.headers.origin;
    const requestedHeaders = req.headers['access-control-request-headers'];
    const requestedMethod = req.headers['access-control-request-method'];
    
    // Local dev: allow any localhost origin (including https://localhost)
    if (IS_LOCAL_DEV && (!origin || origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
        res.setHeader('Vary', 'Origin');
    } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }
    
    res.setHeader('Access-Control-Allow-Methods', requestedMethod || 'GET, POST, PUT, DELETE, OPTIONS');
    // IMPORTANT: echo requested headers so preflight always passes (Capacitor/WebView can send extra headers)
    res.setHeader('Access-Control-Allow-Headers', requestedHeaders || 'Content-Type, Range, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    next();
});

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
// STATIC AUDIO FILES - Alarm tones (must be before /audio proxy)
// ═══════════════════════════════════════════════════════════════════

app.use('/Audio', express.static(path.join(CONFIG.FRONTEND_ROOT, 'Audio')));

// ─── HUKAMNAMA AUDIO PROXY ─────────────────────────────────────────
// Scrapes SGPC page to find today's audio URL and proxies/redirects it.
// Cached for 10 minutes to reduce SGPC server load.
let hukamAudioCache = { url: null, ts: 0 };

app.get('/api/hukamnama/audio', async (req, res) => {
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
                r.on('timeout', () => { r.destroy(); reject(new Error('timeout')); });
            });

            const mp3Match = html.match(/["'](https?:\/\/[^"']+\.mp3[^"']*)['"]/i);
            if (mp3Match && mp3Match[1]) {
                hukamAudioCache = { url: mp3Match[1], ts: now };
                console.log('[🎙️ Hukamnama] Scraped fresh URL:', mp3Match[1]);
            } else {
                const d = new Date();
                hukamAudioCache = { 
                    url: `https://www.sgpc.net/hukamnama/${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/hukamnama.mp3`,
                    ts: now 
                };
                console.log('[🎙️ Hukamnama] No URL in page, using fallback:', hukamAudioCache.url);
            }
        }

        // Step 2: Stream the data to the client (Bypasses CORS entirely)
        const https = require('https');
        const audioReq = https.get(hukamAudioCache.url, (audioRes) => {
            // Forward headers
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Accept-Ranges', 'bytes');
            if (audioRes.headers['content-length']) {
                res.setHeader('Content-Length', audioRes.headers['content-length']);
            }
            // Pipe the data
            audioRes.pipe(res);
        });

        audioReq.on('error', (err) => {
            console.error('[🎙️ Hukamnama] Streaming error:', err.message);
            if (!res.headersSent) res.status(502).end();
        });

    } catch (err) {
        console.error('[🎙️ Hukamnama] Proxy error:', err.message);
        if (!res.headersSent) res.status(502).json({ error: 'Could not stream Hukamnama audio' });
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

// ═══════════════════════════════════════════════════════════════════
// PER-USER IDENTITY — UUID cookie, one progress file per user
// ═══════════════════════════════════════════════════════════════════

// UUID_REGEX defined above

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
        try { command.kill('SIGKILL'); } catch (e) {}
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
    res.sendFile(path.join(CONFIG.MAIN_UI, 'index.html'));
});

// Service Worker - serve from frontend root (no-cache for instant updates)
app.get('/sw.js', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(CONFIG.FRONTEND_ROOT, 'sw.js'));
});

// Service Worker (legacy) - no-cache
app.get('/service-worker.js', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(CONFIG.FRONTEND_ROOT, 'service-worker.js'));
});

// Version.json - CRITICAL: Must never be cached for instant PWA updates
app.get('/version.json', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(path.join(CONFIG.FRONTEND_ROOT, 'version.json'));
});

// Manifest
app.get('/manifest.json', (req, res) => {
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
app.use('/weather-assets', express.static(path.join(__dirname, '..', 'assets')));

// Serve entire frontend folder
app.use(express.static(CONFIG.FRONTEND_ROOT));

// Serve MainWebPage at root
app.use('/', express.static(CONFIG.MAIN_UI));

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
