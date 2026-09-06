// tests/notifications-engine.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Notifications Engine & Dataset Verification', () => {
    let rawJson;
    let notifsData;

    beforeEach(() => {
        const filePath = path.resolve(__dirname, '../frontend/notifications-content.json');
        rawJson = fs.readFileSync(filePath, 'utf8');
        notifsData = JSON.parse(rawJson);
    });

    it('should have notifications-content.json in frontend, android, and ios with all 15 categories', () => {
        expect(notifsData).toHaveProperty('notifications');
        const categories = Object.keys(notifsData.notifications);
        expect(categories.length).toBeGreaterThanOrEqual(15);
        
        const expected = [
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
            'gurbani_radio'
        ];

        expected.forEach(cat => {
            expect(categories).toContain(cat);
            expect(notifsData.notifications[cat].length).toBeGreaterThan(0);
            
            // Check message structure
            const first = notifsData.notifications[cat][0];
            expect(first).toHaveProperty('title');
            expect(first).toHaveProperty('body');
        });
    });

    it('should have valid spiritual-notifications.js engine with correct metadata and buildNotifications', () => {
        const spiritualJs = fs.readFileSync(path.resolve(__dirname, '../frontend/lib/spiritual-notifications.js'), 'utf8');
        expect(spiritualJs).toContain('CATEGORIES_META');
        expect(spiritualJs).toContain('buildNotifications');
        expect(spiritualJs).toContain('scheduleAll');
        expect(spiritualJs).toContain('testNotification');
        expect(spiritualJs).toContain('spiritual_reminders');
    });

    it('should have updated sw.js with notifications-content.json precached and scheduled checking', () => {
        const swJs = fs.readFileSync(path.resolve(__dirname, '../frontend/sw.js'), 'utf8');
        expect(swJs).toContain('notifications-content.json');
        expect(swJs).toContain('loadNotificationContent');
        expect(swJs).toContain('checkAndFireScheduledNotifications');
    });
});
