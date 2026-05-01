/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NOTES MANAGER - DATA LAYER
 * Handles all note CRUD operations and localStorage persistence
 * ═══════════════════════════════════════════════════════════════════════════
 */

class NotesManager {
    constructor() {
        this.storageKey = 'gurbani_notes_v2';
        this.settingsKey = 'gurbani_notes_settings';
        this.notes = [];
        this.settings = {
            sortBy: 'modified',
            sortOrder: 'desc'
        };
        this.loadNotes();
        this.loadSettings();
    }

    // ═══════════════════════════════════════════════════════════════
    // PERSISTENCE
    // ═══════════════════════════════════════════════════════════════

    async loadNotes() {
        try {
            // First try localStorage
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.notes = JSON.parse(stored);
                // Migrate old notes if needed
                this.notes = this.notes.map(note => this.migrateNote(note));
            }

            // Also try to sync from IndexedDB if localStorage is empty
            if (this.notes.length === 0 && window.GurbaniStorage) {
                await window.GurbaniStorage.init();
                const indexedNotes = await window.GurbaniStorage.get('notes', 'all_notes');
                if (indexedNotes && indexedNotes.length > 0) {
                    this.notes = indexedNotes.map(note => this.migrateNote(note));
                    // Also restore to localStorage
                    localStorage.setItem(this.storageKey, JSON.stringify(this.notes));
                }
            }
        } catch (error) {
            console.error('[NotesManager] Failed to load notes:', error);
            this.notes = [];
        }
    }

    loadSettings() {
        try {
            const stored = localStorage.getItem(this.settingsKey);
            if (stored) {
                this.settings = { ...this.settings, ...JSON.parse(stored) };
            }
        } catch (error) {
            console.error('[NotesManager] Failed to load settings:', error);
        }
    }

    saveNotes() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.notes));

            // Also persist to IndexedDB
            this.persistToIndexedDB();

            return true;
        } catch (error) {
            console.error('[NotesManager] Failed to save notes:', error);
            return false;
        }
    }

    /**
     * Persist notes to IndexedDB for reliable storage
     */
    async persistToIndexedDB() {
        try {
            if (window.GurbaniStorage && window.GurbaniStorage.isReady) {
                await window.GurbaniStorage.set('notes', 'all_notes', this.notes);
                await window.GurbaniStorage.set('notes', 'settings', this.settings);
            }
        } catch (error) {
            console.warn('[NotesManager] IndexedDB persist error:', error);
        }
    }

    saveSettings() {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(this.settings));
            this.persistToIndexedDB();
            return true;
        } catch (error) {
            console.error('[NotesManager] Failed to save settings:', error);
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // NOTE MIGRATION (For backwards compatibility)
    // ═══════════════════════════════════════════════════════════════

    migrateNote(note) {
        return {
            id: note.id || this.generateId(),
            title: note.title || '',
            content: note.content || '',
            folder: note.folder || 'all',
            pinned: note.pinned || false,
            createdAt: note.createdAt || Date.now(),
            modifiedAt: note.modifiedAt || note.createdAt || Date.now(),
            color: note.color || null
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // CRUD OPERATIONS
    // ═══════════════════════════════════════════════════════════════

    createNote(data = {}) {
        const note = {
            id: this.generateId(),
            title: data.title || '',
            content: data.content || '',
            folder: data.folder || 'all',
            pinned: false,
            createdAt: Date.now(),
            modifiedAt: Date.now(),
            color: data.color || null
        };

        this.notes.unshift(note);
        this.saveNotes();

        console.log('[NotesManager] Created note:', note.id);
        return note;
    }

    updateNote(id, updates) {
        const index = this.notes.findIndex(n => n.id === id);
        if (index === -1) {
            console.warn('[NotesManager] Note not found:', id);
            return null;
        }

        this.notes[index] = {
            ...this.notes[index],
            ...updates,
            modifiedAt: Date.now()
        };

        this.saveNotes();
        console.log('[NotesManager] Updated note:', id);
        return this.notes[index];
    }

    deleteNote(id) {
        const index = this.notes.findIndex(n => n.id === id);
        if (index === -1) {
            console.warn('[NotesManager] Note not found:', id);
            return false;
        }

        this.notes.splice(index, 1);
        this.saveNotes();
        console.log('[NotesManager] Deleted note:', id);
        return true;
    }

    deleteAllNotes() {
        const count = this.notes.length;
        this.notes = [];
        this.saveNotes();
        console.log('[NotesManager] Deleted all notes:', count);
        return count;
    }

    getNote(id) {
        return this.notes.find(n => n.id === id) || null;
    }

    // ═══════════════════════════════════════════════════════════════
    // QUERY OPERATIONS
    // ═══════════════════════════════════════════════════════════════

    getAllNotes() {
        return this.sortNotes([...this.notes]);
    }

    getNotesByFolder(folder) {
        let filtered;

        if (folder === 'all') {
            filtered = [...this.notes];
        } else if (folder === 'pinned') {
            filtered = this.notes.filter(n => n.pinned);
        } else {
            filtered = this.notes.filter(n => n.folder === folder);
        }

        return this.sortNotes(filtered);
    }

    searchNotes(query) {
        if (!query || query.trim() === '') {
            return this.getAllNotes();
        }

        const searchTerm = query.toLowerCase().trim();
        const filtered = this.notes.filter(note => {
            const titleMatch = note.title.toLowerCase().includes(searchTerm);
            const contentMatch = note.content.toLowerCase().includes(searchTerm);
            return titleMatch || contentMatch;
        });

        return this.sortNotes(filtered);
    }

    getPinnedNotes() {
        return this.sortNotes(this.notes.filter(n => n.pinned));
    }

    getNotesCount() {
        return this.notes.length;
    }

    getFolderCounts() {
        return {
            all: this.notes.length,
            pinned: this.notes.filter(n => n.pinned).length,
            gurbani: this.notes.filter(n => n.folder === 'gurbani').length,
            personal: this.notes.filter(n => n.folder === 'personal').length
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // SORTING
    // ═══════════════════════════════════════════════════════════════

    sortNotes(notes) {
        const { sortBy, sortOrder } = this.settings;

        // Always put pinned notes first
        const pinned = notes.filter(n => n.pinned);
        const unpinned = notes.filter(n => !n.pinned);

        const sortFn = (a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'modified':
                    comparison = b.modifiedAt - a.modifiedAt;
                    break;
                case 'created':
                    comparison = b.createdAt - a.createdAt;
                    break;
                case 'title':
                    comparison = a.title.localeCompare(b.title);
                    break;
                default:
                    comparison = b.modifiedAt - a.modifiedAt;
            }

            return sortOrder === 'desc' ? comparison : -comparison;
        };

        pinned.sort(sortFn);
        unpinned.sort(sortFn);

        return [...pinned, ...unpinned];
    }

    setSortBy(sortBy) {
        this.settings.sortBy = sortBy;
        this.saveSettings();
    }

    getSortBy() {
        return this.settings.sortBy;
    }

    // ═══════════════════════════════════════════════════════════════
    // PIN OPERATIONS
    // ═══════════════════════════════════════════════════════════════

    togglePin(id) {
        const note = this.getNote(id);
        if (!note) return null;

        note.pinned = !note.pinned;
        note.modifiedAt = Date.now();
        this.saveNotes();

        console.log('[NotesManager] Toggled pin:', id, note.pinned);
        return note;
    }

    // ═══════════════════════════════════════════════════════════════
    // FOLDER OPERATIONS
    // ═══════════════════════════════════════════════════════════════

    moveToFolder(id, folder) {
        return this.updateNote(id, { folder });
    }

    // ═══════════════════════════════════════════════════════════════
    // EXPORT / IMPORT
    // ═══════════════════════════════════════════════════════════════

    exportNotes() {
        const exportData = {
            version: 2,
            exportedAt: new Date().toISOString(),
            notes: this.notes
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gurbani-notes-${this.formatDateForFilename(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('[NotesManager] Exported', this.notes.length, 'notes');
        return true;
    }

    async importNotes(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    let importedNotes = [];

                    // Handle different export formats
                    if (Array.isArray(data)) {
                        importedNotes = data;
                    } else if (data.notes && Array.isArray(data.notes)) {
                        importedNotes = data.notes;
                    } else {
                        throw new Error('Invalid file format');
                    }

                    // Migrate and add notes
                    importedNotes.forEach(note => {
                        const migrated = this.migrateNote({
                            ...note,
                            id: this.generateId() // Generate new ID to avoid conflicts
                        });
                        this.notes.push(migrated);
                    });

                    this.saveNotes();
                    console.log('[NotesManager] Imported', importedNotes.length, 'notes');
                    resolve(importedNotes.length);
                } catch (error) {
                    console.error('[NotesManager] Import failed:', error);
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════

    generateId() {
        return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    formatDateForFilename(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'Just now';
        } else if (diffMins < 60) {
            return `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
    }

    getPreview(content, maxLength = 150) {
        if (!content) return '';
        const cleaned = content.replace(/\n+/g, ' ').trim();
        if (cleaned.length <= maxLength) return cleaned;
        return cleaned.substring(0, maxLength).trim() + '...';
    }
}

// Export for use
window.NotesManager = NotesManager;
