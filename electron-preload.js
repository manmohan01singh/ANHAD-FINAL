/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GURBANI RADIO - ELECTRON PRELOAD SCRIPT
 * Exposes safe APIs to the renderer (frontend)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // Check if running in Electron
    isElectron: true,
    platform: process.platform,

    // Notification scheduling (works in background!)
    scheduleNotification: (data) => {
        ipcRenderer.send('schedule-notification', data);
    },

    cancelNotification: (id) => {
        ipcRenderer.send('cancel-notification', { id });
    },

    showNotification: (data) => {
        ipcRenderer.send('show-notification', data);
    },

    // Listen for events from main process
    onNotificationClick: (callback) => {
        ipcRenderer.on('notification-clicked', (event, data) => callback(data));
    }
});

console.log('[Electron Preload] API exposed to renderer');
