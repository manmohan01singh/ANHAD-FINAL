/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GURBANI RADIO - ELECTRON MAIN PROCESS
 * Background notifications and system tray support for Windows/macOS/Linux
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { app, BrowserWindow, Tray, Menu, Notification, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// Keep reference to prevent garbage collection
let mainWindow = null;
let tray = null;
let scheduledNotifications = new Map();

// App configuration
const CONFIG = {
    width: 420,
    height: 800,
    minWidth: 380,
    minHeight: 600,
    appName: 'Gurbani Radio',
    iconPath: path.join(__dirname, 'frontend/assets/favicon.svg')
};

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLE INSTANCE LOCK
// ═══════════════════════════════════════════════════════════════════════════════
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine) => {
        // If user tries to run a second instance, focus our window
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// AUTO-LAUNCH SETTINGS
// ═══════════════════════════════════════════════════════════════
// Set the app to launch at login
app.setLoginItemSettings({
    openAtLogin: true,
    path: app.getPath('exe'),
    args: ['--hidden'] // Custom flag to check if we should start hidden
});

// ═══════════════════════════════════════════════════════════════
// CREATE MAIN WINDOW
// ═══════════════════════════════════════════════════════════════
function createWindow() {
    // Check if we opened with --hidden flag (from startup)
    const startHidden = process.argv.includes('--hidden');

    mainWindow = new BrowserWindow({
        width: CONFIG.width,
        height: CONFIG.height,
        minWidth: CONFIG.minWidth,
        minHeight: CONFIG.minHeight,
        frame: true,
        resizable: true,
        show: !startHidden, // Don't show if starting hidden
        icon: CONFIG.iconPath,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'electron-preload.js')
        }
    });

    // Load the frontend
    mainWindow.loadFile('frontend/index.html');

    // Show window when ready (only if not starting hidden)
    mainWindow.once('ready-to-show', () => {
        if (!startHidden) {
            mainWindow.show();
        }
    });

    // Handle close - minimize to tray instead of quitting
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();

            // Show notification that app is running in background
            if (Notification.isSupported()) {
                new Notification({
                    title: 'Gurbani Radio',
                    body: 'Running in background. Click tray icon to open.',
                    silent: true
                }).show();
            }
        }
        return false;
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM TRAY
// ═══════════════════════════════════════════════════════════════════════════════
function createTray() {
    // Create tray icon
    const iconPath = path.join(__dirname, 'frontend/assets/favicon.svg');

    // For Windows, we need a smaller icon
    let trayIcon;
    try {
        trayIcon = nativeImage.createFromPath(iconPath);
        trayIcon = trayIcon.resize({ width: 16, height: 16 });
    } catch (e) {
        console.warn('Tray icon load failed, using default');
        trayIcon = nativeImage.createEmpty();
    }

    tray = new Tray(trayIcon);
    tray.setToolTip('Gurbani Radio - Running in background');

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open Gurbani Radio',
            click: () => {
                mainWindow.show();
                mainWindow.focus();
            }
        },
        { type: 'separator' },
        {
            label: 'Naam Abhyas',
            click: () => {
                mainWindow.show();
                mainWindow.loadFile('frontend/NaamAbhyas/naam-abhyas.html');
            }
        },
        {
            label: 'Nitnem Tracker',
            click: () => {
                mainWindow.show();
                mainWindow.loadFile('frontend/NitnemTracker/nitnem-tracker.html');
            }
        },
        {
            label: 'Smart Reminders',
            click: () => {
                mainWindow.show();
                mainWindow.loadFile('frontend/reminders/smart-reminders.html');
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        mainWindow.show();
        mainWindow.focus();
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULED NOTIFICATIONS (Works even when app is minimized to tray!)
// ═══════════════════════════════════════════════════════════════════════════════
function scheduleNotification(data) {
    const { id, title, body, scheduledTime, url } = data;

    if (!id || !scheduledTime) return;

    // Cancel existing if same ID
    if (scheduledNotifications.has(id)) {
        clearTimeout(scheduledNotifications.get(id));
    }

    const delay = scheduledTime - Date.now();

    if (delay <= 0) {
        // Fire immediately
        showNotification({ title, body, url });
        return;
    }

    // Schedule
    const timeoutId = setTimeout(() => {
        showNotification({ title, body, url });
        scheduledNotifications.delete(id);
    }, delay);

    scheduledNotifications.set(id, timeoutId);
    console.log(`[Electron] Scheduled notification "${id}" for ${new Date(scheduledTime).toLocaleString()}`);
}

function showNotification(data) {
    const { title, body, url } = data;

    if (!Notification.isSupported()) {
        console.warn('Notifications not supported');
        return;
    }

    const notification = new Notification({
        title: title || 'Gurbani Radio',
        body: body || '',
        icon: CONFIG.iconPath,
        urgency: 'critical',
        silent: false
    });

    notification.on('click', () => {
        mainWindow.show();
        mainWindow.focus();

        if (url) {
            mainWindow.loadFile(`frontend${url}`);
        }
    });

    notification.show();
}

function cancelNotification(id) {
    if (scheduledNotifications.has(id)) {
        clearTimeout(scheduledNotifications.get(id));
        scheduledNotifications.delete(id);
        console.log(`[Electron] Cancelled notification "${id}"`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// IPC HANDLERS (Communication with renderer/frontend)
// ═══════════════════════════════════════════════════════════════════════════════
ipcMain.on('schedule-notification', (event, data) => {
    scheduleNotification(data);
});

ipcMain.on('cancel-notification', (event, data) => {
    cancelNotification(data.id);
});

ipcMain.on('show-notification', (event, data) => {
    showNotification(data);
});

// ═══════════════════════════════════════════════════════════════════════════════
// APP LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════════
app.whenReady().then(() => {
    createWindow();
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // Don't quit on macOS
    if (process.platform !== 'darwin') {
        // On Windows/Linux, only quit if explicitly requested
        // Otherwise keep running in tray
    }
});

app.on('before-quit', () => {
    app.isQuitting = true;
});

console.log('[Electron] Gurbani Radio Desktop initialized');
