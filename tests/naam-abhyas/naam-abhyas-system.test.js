import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Naam Abhyas Sound Assets & File Integrity', () => {
    it('verifies calm-singing-bowl.mp3 audio files exist and are valid sizes', () => {
        const sound1 = path.resolve(process.cwd(), 'frontend/NaamAbhyas/assets/sounds/calm-singing-bowl.mp3');
        const sound2 = path.resolve(process.cwd(), 'frontend/Audio/calm-singing-bowl.mp3');
        const sound3 = path.resolve(process.cwd(), 'android/app/src/main/res/raw/naam_bell.mp3');

        expect(fs.existsSync(sound1)).toBe(true);
        expect(fs.existsSync(sound2)).toBe(true);
        expect(fs.existsSync(sound3)).toBe(true);

        const stat1 = fs.statSync(sound1);
        const stat2 = fs.statSync(sound2);
        const stat3 = fs.statSync(sound3);

        expect(stat1.size).toBeGreaterThan(100000);
        expect(stat2.size).toBe(stat1.size);
        expect(stat3.size).toBe(stat1.size);
    });
});

describe('NaamAbhyasManager Schedule Reading & Compatibility', () => {
    it('handles both {_date, _schedule} and plain schedule maps properly', () => {
        const managerSrc = fs.readFileSync(
            path.resolve(process.cwd(), 'frontend/lib/naam-abhyas-manager.js'),
            'utf8'
        );
        const mockWindow = {
            location: { pathname: '/NaamAbhyas/naam-abhyas.html' },
            addEventListener: vi.fn(),
            dispatchEvent: vi.fn()
        };
        const mockDoc = {
            readyState: 'complete',
            addEventListener: vi.fn()
        };
        new Function('window', 'document', managerSrc)(mockWindow, mockDoc);
        const manager = mockWindow.NaamAbhyasManager;
        expect(manager).toBeDefined();

        // 1. Wrapped format
        const wrapped = {
            _date: '2026-10-16',
            _schedule: {
                5: { hour: 5, startMinute: 22, status: 'pending' },
                6: { hour: 6, startMinute: 45, status: 'completed' }
            }
        };
        const read1 = manager.readSchedule(wrapped);
        expect(Array.isArray(read1)).toBe(true);
        const s5 = read1.find(s => s.hour === 5);
        const s6 = read1.find(s => s.hour === 6);
        expect(s5).toBeDefined();
        expect(s5.minute).toBe(22);
        expect(s6.enabled).toBe(true);

        // 2. Direct map format
        const direct = {
            7: { hour: 7, startMinute: 15, status: 'pending' }
        };
        const read2 = manager.readSchedule(direct);
        expect(Array.isArray(read2)).toBe(true);
        const s7 = read2.find(s => s.hour === 7);
        expect(s7).toBeDefined();
        expect(s7.minute).toBe(15);
    });
});

describe('NaamStatsEngine: Simran and Sacred Reading Recording', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    function createNaamApp() {
        const naamSrc = fs.readFileSync(
            path.resolve(process.cwd(), 'frontend/NaamAbhyas/naam-abhyas.js'),
            'utf8'
        );
        const sandbox = {
            window: {
                location: { href: 'http://localhost/NaamAbhyas/naam-abhyas.html', pathname: '/NaamAbhyas/naam-abhyas.html' },
                addEventListener: vi.fn(),
                dispatchEvent: vi.fn()
            },
            document: {
                readyState: 'complete',
                documentElement: { setAttribute: vi.fn(), style: {} },
                body: { classList: { add: vi.fn(), remove: vi.fn() } },
                querySelectorAll: () => [],
                getElementById: () => null,
                addEventListener: vi.fn()
            },
            navigator: { vibrate: vi.fn() },
            localStorage: window.localStorage,
            console: console,
            URL: URL
        };

        const fn = new Function('window', 'document', 'navigator', 'localStorage', 'console', 'URL', naamSrc);
        fn(sandbox.window, sandbox.document, sandbox.navigator, sandbox.localStorage, sandbox.console, sandbox.URL);

        return sandbox.window.naamAbhyas || sandbox.window.naamAbhyasApp;
    }

    it('records Simran vs Sacred Reading independently and accumulates reading statistics', () => {
        const app = createNaamApp();
        expect(app).toBeDefined();
        const statsEngine = app.statsEngine;

        // Record a 2-minute Simran session
        const simranSession = statsEngine.recordSession({
            hour: 6,
            duration: 120,
            practiceType: 'simran',
            status: 'completed'
        });
        expect(simranSession.practiceType).toBe('simran');

        // Record a 2-minute Sacred Reading session
        const readingSession = statsEngine.recordSession({
            hour: 7,
            duration: 120,
            practiceType: 'reading',
            gurbaniText: 'ਗੁਰ ਸਤਿਗੁਰ ਕਾ ਜੋ ਸਿਖੁ ਅਖਾਏ ਸੁ ਭਲਕੇ ਉਠਿ ਹਰਿ ਨਾਮੁ ਧਿਆਵੈ ॥',
            status: 'completed'
        });
        expect(readingSession.practiceType).toBe('reading');
        expect(readingSession.gurbaniText).toContain('ਗੁਰ ਸਤਿਗੁਰ');

        // Check stats breakdown
        const todayStats = statsEngine.getTodayStats(18);
        expect(todayStats.completed).toBe(2);
        expect(todayStats.simranCompleted).toBe(1);
        expect(todayStats.readingCompleted).toBe(1);
        expect(todayStats.totalReadingMinutes).toBe(2);

        // Check overall statistics in history
        expect(statsEngine.history.statistics.totalSimranSessions).toBe(1);
        expect(statsEngine.history.statistics.totalReadingSessions).toBe(1);
        expect(statsEngine.history.statistics.totalReadingMinutes).toBe(2);
    });

    it('generates random timeline minutes across active hours and writes compatible wrapper', () => {
        const app = createNaamApp();
        expect(app).toBeDefined();
        const scheduleManager = app.scheduleManager;
        const schedule = scheduleManager.generateDailySchedule(true);

        const hours = Object.keys(schedule).map(Number);
        expect(hours.length).toBeGreaterThanOrEqual(10);

        // Check that minutes are between 2 and 58, and format matches H:MM AM/PM (e.g. 8:43 AM, 9:05 AM)
        const minutes = hours.map(h => schedule[h].startMinute);
        const nonZero = minutes.filter(m => m > 0);
        expect(nonZero.length).toBeGreaterThan(0);

        hours.forEach(h => {
            const slot = schedule[h];
            expect(slot.startMinute).toBeGreaterThanOrEqual(2);
            expect(slot.startMinute).toBeLessThanOrEqual(58);
            expect(slot.startTime).toMatch(/^\d{1,2}:\d{2}\s(AM|PM)$/);
            expect(slot.endTime).toMatch(/^\d{1,2}:\d{2}\s(AM|PM)$/);
        });

        // Verify that minutes across hours are varied rather than all identical
        const uniqueMinutes = new Set(minutes);
        expect(uniqueMinutes.size).toBeGreaterThan(3);

        // Verify stored wrapper in localStorage contains both _schedule and top-level hour keys
        const rawSaved = JSON.parse(localStorage.getItem('naam_abhyas_schedule'));
        expect(rawSaved._schedule).toBeDefined();
        expect(rawSaved[hours[0]]).toBeDefined();
        expect(rawSaved[hours[0]].startTime).toBeDefined();
    });

    it('refreshRandomMinutes regenerates varied random minutes for pending sessions', () => {
        const app = createNaamApp();
        app.scheduleManager.generateDailySchedule(true);
        const originalMinutes = Object.keys(app.scheduleManager.currentSchedule).map(
            h => app.scheduleManager.currentSchedule[h].startMinute
        );

        app.scheduleManager.refreshRandomMinutes();
        const refreshedMinutes = Object.keys(app.scheduleManager.currentSchedule).map(
            h => app.scheduleManager.currentSchedule[h].startMinute
        );

        expect(refreshedMinutes.length).toBe(originalMinutes.length);
        // Each slot still conforms to random time range
        refreshedMinutes.forEach(m => {
            expect(m).toBeGreaterThanOrEqual(2);
            expect(m).toBeLessThanOrEqual(58);
        });
    });
});

describe('Capacitor Global Scheduler Export & Non-Linear Random Timeline', () => {
    it('exports window.CapacitorNotifications and window.__anhadGlobalScheduler', () => {
        const globalSrc = fs.readFileSync(
            path.resolve(process.cwd(), 'frontend/lib/capacitor-notifications-global.js'),
            'utf8'
        );
        const sandboxWindow = {
            addEventListener: vi.fn(),
            location: { href: 'http://localhost/index.html', pathname: '/index.html' },
            document: {
                readyState: 'complete',
                addEventListener: vi.fn(),
                getElementById: vi.fn().mockReturnValue(null),
                createElement: vi.fn().mockReturnValue({ style: {}, classList: { add: vi.fn() } }),
                head: { appendChild: vi.fn() },
                body: { appendChild: vi.fn() }
            }
        };

        new Function('window', 'document', globalSrc)(sandboxWindow, sandboxWindow.document);

        expect(sandboxWindow.CapacitorNotifications).toBeDefined();
        expect(typeof sandboxWindow.CapacitorNotifications.scheduleAll).toBe('function');
        expect(typeof sandboxWindow.CapacitorNotifications.rescheduleAll).toBe('function');
        expect(sandboxWindow.__anhadGlobalScheduler).toBeDefined();
        expect(typeof sandboxWindow.AnhadShowNaamPopup).toBe('function');
    });

    it('schedules non-linear, varied minutes across consecutive hours without sequential repetition', async () => {
        const globalSrc = fs.readFileSync(
            path.resolve(process.cwd(), 'frontend/lib/capacitor-notifications-global.js'),
            'utf8'
        );
        const storage = {};
        const localNotificationsMock = {
            createChannel: vi.fn().mockResolvedValue(true),
            cancel: vi.fn().mockResolvedValue(true),
            schedule: vi.fn().mockResolvedValue(true),
            checkPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
            requestPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
            addListener: vi.fn()
        };

        const sandboxWindow = {
            addEventListener: vi.fn(),
            location: { href: 'http://localhost/index.html', pathname: '/index.html' },
            document: {
                readyState: 'complete',
                addEventListener: vi.fn(),
                getElementById: vi.fn().mockReturnValue(null),
                createElement: vi.fn().mockReturnValue({ style: {}, classList: { add: vi.fn() } }),
                head: { appendChild: vi.fn() },
                body: { appendChild: vi.fn() }
            },
            localStorage: {
                getItem: (k) => storage[k] || null,
                setItem: (k, v) => { storage[k] = String(v); },
                removeItem: (k) => { delete storage[k]; }
            },
            Capacitor: {
                isNativePlatform: () => true,
                getPlatform: () => 'android',
                Plugins: {
                    LocalNotifications: localNotificationsMock
                }
            }
        };

        new Function('window', 'document', 'localStorage', globalSrc)(sandboxWindow, sandboxWindow.document, sandboxWindow.localStorage);

        // Run scheduleAll
        await sandboxWindow.CapacitorNotifications.scheduleAll();

        // Verify schedule was saved with random time slots
        const savedRaw = JSON.parse(storage['naam_abhyas_schedule']);
        expect(savedRaw).toBeDefined();
        const schedMap = savedRaw._schedule;
        expect(schedMap).toBeDefined();

        const hours = Object.keys(schedMap).map(Number).sort((a, b) => a - b);
        expect(hours.length).toBeGreaterThanOrEqual(10);

        // Verify each hour has valid startTime, startMinute
        const minutes = hours.map(h => schedMap[h].startMinute);
        hours.forEach(h => {
            expect(schedMap[h].startTime).toMatch(/^\d{1,2}:\d{2}\s(AM|PM)$/);
            expect(schedMap[h].startMinute).toBeGreaterThanOrEqual(2);
            expect(schedMap[h].startMinute).toBeLessThanOrEqual(57);
        });

        // Verify consecutive hours do NOT simply increment by 1 (which was the old hash defect: 39, 40, 41, 42, 43...)
        let sequentialDifferences = 0;
        for (let i = 0; i < minutes.length - 1; i++) {
            if (minutes[i + 1] - minutes[i] === 1) {
                sequentialDifferences++;
            }
        }
        // Less than 20% of consecutive slots should ever differ by exactly 1
        expect(sequentialDifferences).toBeLessThan(3);
    });
});

describe('Naam Abhyas Session Alert Modal & Sacred Reading UI', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('wires sessionAlertModal and starts simran or sacred reading correctly', () => {
        const naamSrc = fs.readFileSync(
            path.resolve(process.cwd(), 'frontend/NaamAbhyas/naam-abhyas.js'),
            'utf8'
        );

        const elements = {};
        function getMockEl(id) {
            if (!elements[id]) {
                elements[id] = {
                    id,
                    classList: {
                        classes: new Set(),
                        add(c) { this.classes.add(c); },
                        remove(c) { this.classes.delete(c); },
                        contains(c) { return this.classes.has(c); },
                        toggle(c, val) { if (val) this.classes.add(c); else this.classes.delete(c); }
                    },
                    style: {},
                    listeners: {},
                    addEventListener(evt, fn) { this.listeners[evt] = fn; },
                    click() { if (this.listeners['click']) this.listeners['click']({ preventDefault: vi.fn() }); },
                    querySelector() { return null; }
                };
            }
            return elements[id];
        }

        const modalEl = getMockEl('sessionAlertModal');
        const startNowBtn = getMockEl('alertStartNowBtn');
        const startReadingBtn = getMockEl('alertStartReadingBtn');
        const readingStatsSub = getMockEl('readingStatsSub');
        const readingStatsTime = getMockEl('readingStatsTime');
        const statsPanelContent = getMockEl('statsPanelContent');

        const sandbox = {
            window: {
                location: { href: 'http://localhost/NaamAbhyas/naam-abhyas.html', pathname: '/NaamAbhyas/naam-abhyas.html' },
                addEventListener: vi.fn(),
                dispatchEvent: vi.fn()
            },
            document: {
                readyState: 'complete',
                documentElement: { setAttribute: vi.fn(), style: {} },
                body: { classList: { add: vi.fn(), remove: vi.fn() } },
                querySelectorAll: () => [],
                getElementById: (id) => getMockEl(id),
                addEventListener: vi.fn()
            },
            navigator: { vibrate: vi.fn() },
            localStorage: window.localStorage,
            console: console,
            URL: URL
        };

        const fn = new Function('window', 'document', 'navigator', 'localStorage', 'console', 'URL', naamSrc);
        fn(sandbox.window, sandbox.document, sandbox.navigator, sandbox.localStorage, sandbox.console, sandbox.URL);

        const app = sandbox.window.naamAbhyas || sandbox.window.naamAbhyasApp;
        expect(app).toBeDefined();

        // 1. Show Session Alert
        app.showSessionAlert({ hour: 9, startTime: '9:25 AM' });
        expect(modalEl.classList.contains('active')).toBe(true);

        // 2. Click Sacred Reading
        startReadingBtn.click();
        expect(modalEl.classList.contains('active')).toBe(false);
        expect(app.timerPlayer.practiceType).toBe('reading');

        // Complete the reading session
        app.timerPlayer.complete();

        // 3. Verify updateUI updates reading stats banner
        app.updateUI();
        expect(readingStatsSub.textContent).toContain('1 sacred reading session today');
        expect(readingStatsTime.textContent).toBe('2 min');

        // 4. Verify renderFullStatsContent includes Sacred Reading breakdown
        app.renderFullStatsContent();
        expect(statsPanelContent.innerHTML).toContain('Practice Modes Breakdown');
        expect(statsPanelContent.innerHTML).toContain('Sacred Reading:');
        expect(statsPanelContent.innerHTML).toContain('1 sessions (2 min)');
    });
});

