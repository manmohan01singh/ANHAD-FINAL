/**
 * Bookmarks Manager Component
 * Manage saved bookmarks with folders
 */

class BookmarksManager {
    constructor() {
        this.bookmarks = this.loadBookmarks();
        this.folders = this.loadFolders();
    }

    loadBookmarks() {
        try {
            return JSON.parse(localStorage.getItem('sehajPaathBookmarks') || '[]');
        } catch {
            return [];
        }
    }

    saveBookmarks() {
        localStorage.setItem('sehajPaathBookmarks', JSON.stringify(this.bookmarks));
    }

    loadFolders() {
        try {
            return JSON.parse(localStorage.getItem('sehajPaathBookmarkFolders') || '[]') || this.getDefaultFolders();
        } catch {
            return this.getDefaultFolders();
        }
    }

    getDefaultFolders() {
        return [
            { id: 'favorites', name: 'Favorites', icon: '❤️', color: '#FF3B30' },
            { id: 'study', name: 'Study', icon: '📚', color: '#5856D6' },
            { id: 'peace', name: 'Peace', icon: '🌟', color: '#34C759' }
        ];
    }

    saveFolders() {
        localStorage.setItem('sehajPaathBookmarkFolders', JSON.stringify(this.folders));
    }

    /**
     * Add a bookmark
     */
    addBookmark(ang, options = {}) {
        const bookmark = {
            id: `bm_${Date.now()}`,
            ang,
            lineId: options.lineId || null,
            shabadId: options.shabadId || null,
            gurmukhi: options.gurmukhi || '',
            title: options.title || `Ang ${ang}`,
            folder: options.folder || null,
            color: options.color || '#D4AF37',
            note: options.note || '',
            createdAt: new Date().toISOString(),
            lastVisited: new Date().toISOString()
        };

        // Check for duplicates
        const exists = this.bookmarks.find(b => b.ang === ang && b.lineId === options.lineId);
        if (exists) {
            return { success: false, message: 'Already bookmarked', bookmark: exists };
        }

        this.bookmarks.unshift(bookmark);
        this.saveBookmarks();

        return { success: true, bookmark };
    }

    /**
     * Remove a bookmark
     */
    removeBookmark(id) {
        const index = this.bookmarks.findIndex(b => b.id === id);
        if (index === -1) return false;

        this.bookmarks.splice(index, 1);
        this.saveBookmarks();
        return true;
    }

    /**
     * Update a bookmark
     */
    updateBookmark(id, updates) {
        const bookmark = this.bookmarks.find(b => b.id === id);
        if (!bookmark) return false;

        Object.assign(bookmark, updates);
        this.saveBookmarks();
        return true;
    }

    /**
     * Get all bookmarks
     */
    getAll() {
        return this.bookmarks;
    }

    /**
     * Get bookmarks by folder
     */
    getByFolder(folderId) {
        return this.bookmarks.filter(b => b.folder === folderId);
    }

    /**
     * Get bookmark by ang
     */
    getByAng(ang) {
        return this.bookmarks.filter(b => b.ang === ang);
    }

    /**
     * Check if ang is bookmarked
     */
    isBookmarked(ang) {
        return this.bookmarks.some(b => b.ang === ang);
    }

    /**
     * Toggle bookmark for ang
     */
    toggle(ang, options = {}) {
        if (this.isBookmarked(ang)) {
            const bookmark = this.bookmarks.find(b => b.ang === ang);
            if (bookmark) {
                this.removeBookmark(bookmark.id);
                return { action: 'removed' };
            }
        } else {
            const result = this.addBookmark(ang, options);
            return { action: 'added', bookmark: result.bookmark };
        }
    }

    /**
     * Add folder
     */
    addFolder(name, icon = '📁', color = '#007AFF') {
        const folder = {
            id: `folder_${Date.now()}`,
            name,
            icon,
            color
        };

        this.folders.push(folder);
        this.saveFolders();
        return folder;
    }

    /**
     * Remove folder
     */
    removeFolder(id) {
        const index = this.folders.findIndex(f => f.id === id);
        if (index === -1) return false;

        // Move bookmarks from this folder
        this.bookmarks.forEach(b => {
            if (b.folder === id) b.folder = null;
        });
        this.saveBookmarks();

        this.folders.splice(index, 1);
        this.saveFolders();
        return true;
    }

    /**
     * Get all folders
     */
    getFolders() {
        return this.folders;
    }

    /**
     * Get bookmark count
     */
    getCount() {
        return this.bookmarks.length;
    }

    /**
     * Search bookmarks
     */
    search(query) {
        const lower = query.toLowerCase();
        return this.bookmarks.filter(b =>
            b.title.toLowerCase().includes(lower) ||
            b.gurmukhi.includes(query) ||
            b.note.toLowerCase().includes(lower)
        );
    }

    /**
     * Sort bookmarks
     */
    sort(by = 'date', order = 'desc') {
        const sorted = [...this.bookmarks];

        sorted.sort((a, b) => {
            let comparison = 0;

            switch (by) {
                case 'date':
                    comparison = new Date(a.createdAt) - new Date(b.createdAt);
                    break;
                case 'ang':
                    comparison = a.ang - b.ang;
                    break;
                case 'title':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'visited':
                    comparison = new Date(a.lastVisited) - new Date(b.lastVisited);
                    break;
            }

            return order === 'desc' ? -comparison : comparison;
        });

        return sorted;
    }

    /**
     * Export bookmarks as JSON
     */
    export() {
        return JSON.stringify({
            bookmarks: this.bookmarks,
            folders: this.folders,
            exportedAt: new Date().toISOString()
        }, null, 2);
    }

    /**
     * Import bookmarks from JSON
     */
    import(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            if (data.bookmarks) {
                this.bookmarks = [...this.bookmarks, ...data.bookmarks];
                this.saveBookmarks();
            }

            if (data.folders) {
                const existingIds = this.folders.map(f => f.id);
                const newFolders = data.folders.filter(f => !existingIds.includes(f.id));
                this.folders = [...this.folders, ...newFolders];
                this.saveFolders();
            }

            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }

    /**
     * Render bookmarks UI
     */
    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const folders = this.getFolders();
        const bookmarks = this.sort('date', 'desc');

        container.innerHTML = `
            <div class="bookmarks-manager">
                <!-- Folders -->
                <div class="bookmark-folders">
                    <h3 class="section-title">Folders</h3>
                    <div class="folders-grid">
                        ${folders.map(folder => `
                            <div class="folder-item" data-folder="${folder.id}">
                                <span class="folder-icon">${folder.icon}</span>
                                <span class="folder-name">${folder.name}</span>
                                <span class="folder-count">${this.getByFolder(folder.id).length}</span>
                            </div>
                        `).join('')}
                        <button class="add-folder-btn" id="addFolderBtn">
                            <span>+</span>
                            <span>New Folder</span>
                        </button>
                    </div>
                </div>
                
                <!-- Bookmarks List -->
                <div class="bookmarks-list">
                    <h3 class="section-title">All Bookmarks <span class="count">(${bookmarks.length})</span></h3>
                    ${bookmarks.length === 0 ? `
                        <div class="empty-state">
                            <span class="empty-icon">🔖</span>
                            <p>No bookmarks yet</p>
                            <p class="subtle">Tap the bookmark icon while reading to save your place</p>
                        </div>
                    ` : `
                        <div class="bookmarks-items">
                            ${bookmarks.map(bookmark => `
                                <div class="bookmark-item" data-id="${bookmark.id}">
                                    <div class="bookmark-info" data-ang="${bookmark.ang}">
                                        <div class="bookmark-header">
                                            <span class="bookmark-ang">Ang ${bookmark.ang}</span>
                                            ${bookmark.folder ? `<span class="bookmark-folder">${this.folders.find(f => f.id === bookmark.folder)?.icon || ''}</span>` : ''}
                                        </div>
                                        <p class="bookmark-gurmukhi">${bookmark.gurmukhi || bookmark.title}</p>
                                        ${bookmark.note ? `<p class="bookmark-note">${bookmark.note}</p>` : ''}
                                        <span class="bookmark-date">${this.formatDate(bookmark.createdAt)}</span>
                                    </div>
                                    <button class="bookmark-delete" data-id="${bookmark.id}">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                        </svg>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;

        // Add event listeners
        this.attachEventListeners(container);
    }

    attachEventListeners(container) {
        // Bookmark click to navigate
        container.querySelectorAll('.bookmark-info').forEach(el => {
            el.addEventListener('click', () => {
                const ang = parseInt(el.dataset.ang);
                window.location.href = `reader.html?ang=${ang}`;
            });
        });

        // Delete bookmark
        container.querySelectorAll('.bookmark-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                if (confirm('Remove this bookmark?')) {
                    this.removeBookmark(id);
                    this.render(container.id);
                }
            });
        });

        // Folder click
        container.querySelectorAll('.folder-item').forEach(el => {
            el.addEventListener('click', () => {
                const folderId = el.dataset.folder;
                this.renderFolderContents(container, folderId);
            });
        });
    }

    renderFolderContents(container, folderId) {
        const folder = this.folders.find(f => f.id === folderId);
        const bookmarks = this.getByFolder(folderId);

        // For simplicity, just filter the main view
        // In a full implementation, this would show a folder detail view
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookmarksManager;
}
