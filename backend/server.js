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

// Sadhsangat Live Imports
const sqlite3 = require('sqlite3');
const axios = require('axios');
const cron = require('node-cron');

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
    'http://localhost:3000,http://127.0.0.1:3000,https://localhost,https://localhost:3000,https://anhad.vercel.app,https://anhadnaam.vercel.app,capacitor://localhost,ionic://localhost')
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
    } catch (e) {}

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
            dbClient.run(`ALTER TABLE channels ADD COLUMN channelHandle TEXT`, () => {});
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
                dbClient.run(query, params, function(err) {
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
                dbClient.run(query, params, function(err) {
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
                dbClient.run("DELETE FROM user_channels WHERE channelId = ?", [channelId], function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                });
            });
        });
    },

    async getUserChannels(userId) {
        if (useJsonFallback) {
            let userChs = jsonData.user_channels.filter(uc => uc.userId === userId);
            const hasSgpc = userChs.some(uc => uc.channelId === 'UCYn6UEtQ771a_OWSiNBoG8w');
            if (!hasSgpc) {
                jsonData.user_channels.push({ userId, channelId: 'UCYn6UEtQ771a_OWSiNBoG8w', displayOrder: 0 });
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
            dbClient.get(
                "SELECT 1 FROM user_channels WHERE userId = ? AND channelId = 'UCYn6UEtQ771a_OWSiNBoG8w'",
                [userId],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (!row) {
                        dbClient.run(
                            "INSERT OR IGNORE INTO user_channels (userId, channelId, displayOrder) VALUES (?, 'UCYn6UEtQ771a_OWSiNBoG8w', 0)",
                            [userId],
                            (insertErr) => {
                                if (insertErr) {
                                    console.error('[Sadhsangat DB] Auto-seed user channel error:', insertErr.message);
                                }
                                fetchChannels();
                            }
                        );
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
                dbClient.run("INSERT INTO user_channels (userId, channelId, displayOrder) VALUES (?, ?, ?)", [userId, channelId, displayOrder], function(err) {
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
            dbClient.run("DELETE FROM user_channels WHERE userId = ? AND channelId = ?", [userId, channelId], function(err) {
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
    // Migrate obsolete fake channel ID from SQLite/JSON database
    try {
        await SadhsangatDb.deleteChannel('UC6U4oR4O2Q-4YV3ZkX6o66Q');
        console.log('[Sadhsangat DB] Cleaned up obsolete channel seed: UC6U4oR4O2Q-4YV3ZkX6o66Q');
    } catch (e) {
        console.warn('[Sadhsangat DB] Cleanup of obsolete channel failed:', e.message);
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
// 🔴 Real live-status checker — scrapes YouTube /live page
//    Extracts videoId, title, isLive without any API key
// ───────────────────────────────────────────────────────────────────
async function checkLiveViaScrap(ch) {
    const handle = ch.channelHandle || null;
    const url = handle
        ? `https://www.youtube.com/${handle}/live`
        : `https://www.youtube.com/channel/${ch.channelId}/live`;

    let resp;
    try {
        resp = await axios.get(url, {
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

    // Try to find the current video ID on the page (works when live)
    const vidM = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/) ||
                 html.match(/"currentVideoEndpoint".*?"videoId":"([a-zA-Z0-9_-]{11})"/);
    const videoId = vidM ? vidM[1] : null;

    // Comprehensive live broadcast indicators — YouTube changes these regularly
    const isLive =
        // Classic indicators
        html.includes('"isLiveContent":true') ||
        html.includes('isLiveBroadcast') ||
        html.includes('"liveBroadcastDetails"') ||
        // Modern indicators (2024+)
        html.includes('"isLive":true') ||
        html.includes('concurrentViewers') ||
        html.includes('BADGE_STYLE_TYPE_LIVE_NOW') ||
        html.includes('liveStreamabilityRenderer') ||
        html.includes('"style":"LIVE"') ||
        // Viewer count patterns — YouTube now shows "9.1K watching" not "watching now"
        (html.includes(' watching') && !!videoId) ||
        (html.includes('watching now') && !!videoId);

    // Extract stream title
    const titleM = html.match(/<title>([^<]+)<\/title>/) ||
                   html.match(/"title":\{"runs":\[\{"text":"([^"]+)"/) ||
                   html.match(/"og:title" content="([^"]+)"/);
    const title = titleM ? titleM[1].replace(' - YouTube','').replace(/&amp;/g,'&').trim() : null;

    return { isLive: !!(isLive && videoId), videoId: isLive ? videoId : null, title };
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
        if (nameM) channelName = nameM[1].replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"');
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
            try { info = await resolveChannelHandle(q, apiKey); } catch (e) {}
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

// Admin channels endpoints
app.get('/api/sadhsangat/admin/channels', async (req, res) => {
    try {
        const channels = await SadhsangatDb.getAllChannels();
        res.json({ channels });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch admin channels' });
    }
});

app.post('/api/sadhsangat/admin/channels', async (req, res) => {
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

app.put('/api/sadhsangat/admin/channels/:channelId', async (req, res) => {
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

app.delete('/api/sadhsangat/admin/channels/:channelId', async (req, res) => {
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
    } catch(e) {
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
    } catch(e) {
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
    } catch(e) {
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
    } catch(e) {
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
        await checkYouTubeChannels();
        res.json({ success: true, message: 'Sync complete' });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Sync failed' });
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

    // Initialize Sadhsangat Live DB and start the Cron Poller
    await initSadhsangatDb();
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
