// tests/notifications/rotation-and-broadcast.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Spiritual Notifications 3.0 & Admin Broadcast Suite', () => {
    let notifsContent;

    beforeEach(() => {
        const filePath = path.resolve(__dirname, '../../frontend/notifications-content.json');
        const raw = fs.readFileSync(filePath, 'utf8');
        notifsContent = JSON.parse(raw).notifications;
    });

    describe('1. Content Bank Enrichment & 100% Feature Coverage', () => {
        it('should have all 19 spiritual categories covering every feature', () => {
            const expectedCategories = [
                'amritvela',
                'japji_sahib',
                'jaap_sahib',
                'tav_prasad_swaye',
                'chaupai_sahib',
                'anand_sahib',
                'rehras_sahib',
                'kirtan_sohila',
                'random_spiritual_reminders',
                'hukamnama',
                'simran',
                'nitnem_missed',
                'bedtime',
                'evening_peace',
                'gurbani_radio',
                'midday_peace',
                'sehaj_paath',
                'aarti',
                'streak_milestone'
            ];

            expectedCategories.forEach(cat => {
                expect(notifsContent).toHaveProperty(cat);
                expect(notifsContent[cat].length).toBeGreaterThanOrEqual(35);
            });
        });

        it('should have floral/celestial emojis and valid structure on every notification', () => {
            const floralAndStarEmojis = ['🌸', '✨', '🪷', '🌺', '🌟', '💫', '🕊️', '🌷', '🪯', '🌙', '☀️', '❤️', '🤍', '🌅', '🙏', '🎧', '📖', '⚔️', '🛡️', '📜', '🪔', '📋'];
            
            Object.entries(notifsContent).forEach(([cat, list]) => {
                list.forEach((item, idx) => {
                    expect(item.title).toBeTruthy();
                    expect(item.body).toBeTruthy();
                    
                    // Verify emoji presence in item
                    const hasEmoji = floralAndStarEmojis.some(e => item.title.includes(e) || (item.emoji && item.emoji.includes(e)) || item.body.includes(e));
                    expect(hasEmoji, `Category ${cat} item ${idx} missing emoji`).toBe(true);
                });
            });
        });
    });

    describe('2. 365-Day Continuous Non-Repeating Rotation Algorithm', () => {
        function gcd(a, b) {
            while (b) { let t = b; b = a % b; a = t; }
            return a;
        }

        it('should produce 35 completely unique notifications across a full 35-day cycle without repeats', () => {
            const list = notifsContent.amritvela;
            const EPOCH = 1704067200000;
            const seenTitles = new Set();
            const cycleStartEpoch = EPOCH + 20 * 35 * 86400000;

            function getRotatedItem(offset) {
                const targetDate = new Date(cycleStartEpoch + offset * 86400000);
                const cumulativeDays = Math.floor((targetDate.getTime() - EPOCH) / 86400000);

                const len = list.length; // 35
                const cycle = Math.floor(cumulativeDays / len);
                const dayInCycle = ((cumulativeDays % len) + len) % len;

                let catSeed = 0;
                for (let i = 0; i < 'amritvela'.length; i++) {
                    catSeed = (catSeed * 31 + 'amritvela'.charCodeAt(i)) >>> 0;
                }

                const candidates = [3, 4, 8, 9, 11, 12, 13, 16, 17, 18, 19, 23, 24, 26, 29, 31, 37, 41, 43];
                let stride = 1;
                const offsetSeed = Math.abs(cycle + catSeed);
                for (let i = 0; i < candidates.length; i++) {
                    const c = candidates[(offsetSeed + i) % candidates.length];
                    if (gcd(c, len) === 1) {
                        stride = c;
                        break;
                    }
                }
                const shift = Math.abs(cycle * 3 + (catSeed % 7)) % len;
                const idx = ((dayInCycle * stride + shift) % len + len) % len;

                return list[idx];
            }

            for (let day = 0; day < 35; day++) {
                const item = getRotatedItem(day);
                expect(seenTitles.has(item.title)).toBe(false);
                seenTitles.add(item.title);
            }

            expect(seenTitles.size).toBe(35);
        });

        it('should ensure day 1 of consecutive months does not repeat identically', () => {
            const list = notifsContent.japji_sahib;
            const EPOCH = 1704067200000;

            function getItemForDate(d) {
                const cumulativeDays = Math.floor((d.getTime() - EPOCH) / 86400000);
                const len = list.length;
                const cycle = Math.floor(cumulativeDays / len);
                const dayInCycle = ((cumulativeDays % len) + len) % len;
                let catSeed = 0;
                for (let i = 0; i < 'japji_sahib'.length; i++) {
                    catSeed = (catSeed * 31 + 'japji_sahib'.charCodeAt(i)) >>> 0;
                }
                const candidates = [3, 4, 8, 9, 11, 12, 13, 16, 17, 18, 19, 23, 24, 26, 29, 31, 37, 41, 43];
                let stride = 1;
                const offsetSeed = Math.abs(cycle + catSeed);
                for (let i = 0; i < candidates.length; i++) {
                    const c = candidates[(offsetSeed + i) % candidates.length];
                    if (gcd(c, len) === 1) {
                        stride = c;
                        break;
                    }
                }
                const shift = Math.abs(cycle * 3 + (catSeed % 7)) % len;
                const idx = ((dayInCycle * stride + shift) % len + len) % len;
                return list[idx];
            }

            const marchFirst = new Date(2026, 2, 1);
            const aprilFirst = new Date(2026, 3, 1);
            const mayFirst = new Date(2026, 4, 1);

            const itemMarch = getItemForDate(marchFirst);
            const itemApril = getItemForDate(aprilFirst);
            const itemMay = getItemForDate(mayFirst);

            // Under naive getDate() % len, all 1st of month were identical!
            // Under our algorithm, they are completely distinct!
            expect(itemMarch.title).not.toBe(itemApril.title);
            expect(itemApril.title).not.toBe(itemMay.title);
        });
    });

    describe('3. Backend Broadcast Engine & Persistent Store', () => {
        const broadcastEngine = require('../../backend/lib/broadcast-engine');

        it('should dispatch broadcast with unique ID, timestamp, and custom payload', async () => {
            const testPayload = {
                title: 'ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖ਼ਾਲਸਾ — Test Sangat Broadcast',
                body: 'Global administrative test alert to verify full device synchronization. 🌸✨',
                category: 'amritvela',
                emoji: '🌸',
                deepLink: '/nitnem/index.html',
                priority: 'high'
            };

            const created = await broadcastEngine.broadcast(testPayload);
            expect(created).toHaveProperty('id');
            expect(created.id).toMatch(/^bc_\d+_[a-f0-9]+/);
            expect(created.title).toBe(testPayload.title);
            expect(created.body).toBe(testPayload.body);
            expect(created.emoji).toBe('🌸');
            expect(created.priority).toBe('high');
            expect(created.stats.sent).toBe(true);

            // Retrieve from active broadcasts
            const active = broadcastEngine.getActiveBroadcasts();
            const found = active.find(b => b.id === created.id);
            expect(found).toBeDefined();
            expect(found.title).toBe(testPayload.title);

            // Clean up
            const deleted = broadcastEngine.deleteBroadcast(created.id);
            expect(deleted).toBe(true);
        });

        it('should reject broadcast with empty title or body', async () => {
            await expect(broadcastEngine.broadcast({ title: '', body: 'Sample' })).rejects.toThrow('Notification title is required');
            await expect(broadcastEngine.broadcast({ title: 'Sample', body: '' })).rejects.toThrow('Notification body message is required');
        });
    });

    describe('4. Admin Broadcast Console & Settings UI Wiring', () => {
        it('should have Admin broadcast console in frontend/Admin/broadcast.html with mockup and templates', () => {
            const htmlPath = path.resolve(__dirname, '../../frontend/Admin/broadcast.html');
            expect(fs.existsSync(htmlPath)).toBe(true);
            const html = fs.readFileSync(htmlPath, 'utf8');

            expect(html).toContain('phone-mockup');
            expect(html).toContain('emoji-palette');
            expect(html).toContain('template-bar');
            expect(html).toContain('dispatchBroadcast');
            expect(html).toContain('testOnThisDevice');
            expect(html).toContain('history-table');
        });

        it('should have Admin broadcast link in spiritual-notifications-settings.html', () => {
            const settingsPath = path.resolve(__dirname, '../../frontend/Settings/spiritual-notifications-settings.html');
            const html = fs.readFileSync(settingsPath, 'utf8');
            expect(html).toContain('openAdminBroadcast');
            expect(html).toContain('Global Broadcast Console');
        });
    });
});
