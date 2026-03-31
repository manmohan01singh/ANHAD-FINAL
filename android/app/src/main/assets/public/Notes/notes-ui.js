/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NOTES UI - USER INTERFACE CONTROLLER
 * Handles all DOM interactions and UI state management
 * ═══════════════════════════════════════════════════════════════════════════
 */

class NotesUI {
    constructor() {
        this.manager = new NotesManager();
        this.currentFolder = 'all';
        this.currentNoteId = null;
        this.searchQuery = '';
        this.isEditorOpen = false;
        this.confirmCallback = null;

        // Cache DOM elements
        this.elements = {};

        this.init();
    }

    // ═══════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════

    init() {
        this.cacheElements();
        this.bindEvents();
        this.initTheme();
        this.renderNotes();
        this.updateNotesCount();
        this.updateSortUI();

        console.log('📝 Gurbani Notes Initialized');
    }

    cacheElements() {
        // Header elements
        this.elements.backBtn = document.getElementById('back-btn');
        this.elements.searchBtn = document.getElementById('search-btn');
        this.elements.themeBtn = document.getElementById('theme-btn');
        this.elements.themeIcon = document.getElementById('theme-icon');
        this.elements.menuBtn = document.getElementById('menu-btn');
        this.elements.notesCount = document.getElementById('notes-count');

        // Search elements
        this.elements.searchBar = document.getElementById('search-bar');
        this.elements.searchInput = document.getElementById('search-input');
        this.elements.searchClear = document.getElementById('search-clear');

        // Main content
        this.elements.notesList = document.getElementById('notes-list');
        this.elements.emptyState = document.getElementById('empty-state');
        this.elements.emptyCta = document.getElementById('empty-cta');
        this.elements.folderTabs = document.getElementById('folder-tabs');

        // FAB
        this.elements.fab = document.getElementById('fab');

        // Editor
        this.elements.editorOverlay = document.getElementById('editor-overlay');
        this.elements.editorBack = document.getElementById('editor-back');
        this.elements.editorTitle = document.getElementById('editor-title');
        this.elements.editorContent = document.getElementById('editor-content');
        this.elements.editorMeta = document.getElementById('editor-meta');
        this.elements.editorPin = document.getElementById('editor-pin');
        this.elements.editorFolder = document.getElementById('editor-folder');
        this.elements.editorShare = document.getElementById('editor-share');
        this.elements.editorDelete = document.getElementById('editor-delete');

        // Folder picker
        this.elements.folderPicker = document.getElementById('folder-picker');
        this.elements.closeFolderPicker = document.getElementById('close-folder-picker');

        // Menu
        this.elements.menuOverlay = document.getElementById('menu-overlay');
        this.elements.menuBackdrop = document.getElementById('menu-backdrop');
        this.elements.menuTheme = document.getElementById('menu-theme');
        this.elements.menuThemeIcon = document.getElementById('menu-theme-icon');
        this.elements.menuThemeText = document.getElementById('menu-theme-text');
        this.elements.menuSort = document.getElementById('menu-sort');
        this.elements.menuExport = document.getElementById('menu-export');
        this.elements.menuImport = document.getElementById('menu-import');
        this.elements.menuDeleteAll = document.getElementById('menu-delete-all');

        // Sort sheet
        this.elements.sortSheet = document.getElementById('sort-sheet');
        this.elements.sortBackdrop = document.getElementById('sort-backdrop');

        // Confirm modal
        this.elements.confirmModal = document.getElementById('confirm-modal');
        this.elements.confirmTitle = document.getElementById('confirm-title');
        this.elements.confirmMessage = document.getElementById('confirm-message');
        this.elements.confirmCancel = document.getElementById('confirm-cancel');
        this.elements.confirmDelete = document.getElementById('confirm-delete');

        // Toast
        this.elements.toast = document.getElementById('toast');
        this.elements.toastMessage = document.getElementById('toast-message');

        // Import input
        this.elements.importInput = document.getElementById('import-input');
    }

    // ═══════════════════════════════════════════════════════════════
    // EVENT BINDING
    // ═══════════════════════════════════════════════════════════════

    bindEvents() {
        // Back button
        this.elements.backBtn?.addEventListener('click', () => this.goBack());

        // Search
        this.elements.searchBtn?.addEventListener('click', () => this.toggleSearch());
        this.elements.searchInput?.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.elements.searchClear?.addEventListener('click', () => this.clearSearch());

        // Theme toggle (now in menu)
        // this.elements.themeBtn?.addEventListener('click', () => this.toggleTheme());

        // Menu
        this.elements.menuBtn?.addEventListener('click', () => this.openMenu());
        this.elements.menuBackdrop?.addEventListener('click', () => this.closeMenu());
        this.elements.menuTheme?.addEventListener('click', () => this.toggleTheme());
        this.elements.menuSort?.addEventListener('click', () => this.openSortSheet());
        this.elements.menuExport?.addEventListener('click', () => this.handleExport());
        this.elements.menuImport?.addEventListener('click', () => this.handleImportClick());
        this.elements.menuDeleteAll?.addEventListener('click', () => this.confirmDeleteAll());

        // Import input
        this.elements.importInput?.addEventListener('change', (e) => this.handleImport(e));

        // Sort sheet
        this.elements.sortBackdrop?.addEventListener('click', () => this.closeSortSheet());
        document.querySelectorAll('.sort-option').forEach(btn => {
            btn.addEventListener('click', () => this.handleSort(btn.dataset.sort));
        });

        // FAB
        this.elements.fab?.addEventListener('click', () => this.createNewNote());
        this.elements.emptyCta?.addEventListener('click', () => this.createNewNote());

        // Folder tabs
        this.elements.folderTabs?.addEventListener('click', (e) => {
            const tab = e.target.closest('.folder-tab');
            if (tab) {
                this.switchFolder(tab.dataset.folder);
            }
        });

        // Notes list click delegation
        this.elements.notesList?.addEventListener('click', (e) => {
            const card = e.target.closest('.note-card');
            if (card) {
                this.openNote(card.dataset.noteId);
            }
        });

        // Editor events
        this.elements.editorBack?.addEventListener('click', () => this.closeEditor());
        this.elements.editorPin?.addEventListener('click', () => this.toggleCurrentNotePin());
        this.elements.editorFolder?.addEventListener('click', () => this.toggleFolderPicker());
        this.elements.editorShare?.addEventListener('click', () => this.shareCurrentNote());
        this.elements.editorDelete?.addEventListener('click', () => this.confirmDeleteNote());
        this.elements.closeFolderPicker?.addEventListener('click', () => this.closeFolderPicker());

        // Editor toolbar buttons
        document.querySelectorAll('.toolbar-btn[data-format]').forEach(btn => {
            btn.addEventListener('click', () => this.applyFormat(btn.dataset.format));
        });

        // Editor auto-save with debounce
        let saveTimeout;
        const autoSave = () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => this.saveCurrentNote(), 500);
        };

        this.elements.editorTitle?.addEventListener('input', autoSave);
        this.elements.editorContent?.addEventListener('input', autoSave);

        // Confirm modal
        this.elements.confirmCancel?.addEventListener('click', () => this.closeConfirm());
        this.elements.confirmDelete?.addEventListener('click', () => this.executeConfirm());
        document.querySelector('.confirm-backdrop')?.addEventListener('click', () => this.closeConfirm());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Prevent body scroll when editor is open
        this.elements.editorOverlay?.addEventListener('touchmove', (e) => {
            if (e.target === this.elements.editorOverlay) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    // ═══════════════════════════════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════════════════════════════

    goBack() {
        if (this.isEditorOpen) {
            this.closeEditor();
        } else if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '../index.html';
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // THEME MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    initTheme() {
        const savedTheme = localStorage.getItem('gurbani_notes_theme') || 'dark';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        localStorage.setItem('gurbani_notes_theme', newTheme);
        this.showToast(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode enabled`);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.classList.toggle('dark-mode', theme === 'dark');

        // Update menu theme option
        if (this.elements.menuThemeIcon && this.elements.menuThemeText) {
            if (theme === 'dark') {
                this.elements.menuThemeIcon.classList.remove('fa-sun');
                this.elements.menuThemeIcon.classList.add('fa-moon');
                this.elements.menuThemeText.textContent = 'Dark Mode';
            } else {
                this.elements.menuThemeIcon.classList.remove('fa-moon');
                this.elements.menuThemeIcon.classList.add('fa-sun');
                this.elements.menuThemeText.textContent = 'Light Mode';
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // NOTES LIST RENDERING
    // ═══════════════════════════════════════════════════════════════

    renderNotes() {
        let notes;

        if (this.searchQuery) {
            notes = this.manager.searchNotes(this.searchQuery);
        } else {
            notes = this.manager.getNotesByFolder(this.currentFolder);
        }

        // Show/hide empty state
        if (notes.length === 0) {
            this.elements.notesList.innerHTML = '';
            this.elements.emptyState?.classList.add('visible');
        } else {
            this.elements.emptyState?.classList.remove('visible');
            this.elements.notesList.innerHTML = notes.map(note => this.renderNoteCard(note)).join('');
        }

        this.updateNotesCount();
    }

    renderNoteCard(note) {
        const title = note.title || 'Untitled';
        const preview = this.manager.getPreview(note.content);
        const date = this.manager.formatDate(note.modifiedAt);
        const pinnedClass = note.pinned ? 'pinned' : '';
        const folderBadge = this.getFolderBadge(note.folder);

        return `
            <article class="note-card ${pinnedClass}" data-note-id="${note.id}">
                <div class="note-header">
                    <h3 class="note-title">${this.escapeHtml(title)}</h3>
                    <i class="fas fa-thumbtack note-pin"></i>
                </div>
                ${preview ? `<p class="note-preview">${this.escapeHtml(preview)}</p>` : ''}
                <div class="note-meta">
                    <span class="note-date">${date}</span>
                    ${folderBadge}
                </div>
            </article>
        `;
    }

    getFolderBadge(folder) {
        if (folder === 'gurbani') {
            return '<span class="folder-badge gurbani"><i class="fas fa-book-open"></i> Gurbani</span>';
        } else if (folder === 'personal') {
            return '<span class="folder-badge personal"><i class="fas fa-heart"></i> Personal</span>';
        }
        return '';
    }

    updateNotesCount() {
        const count = this.manager.getNotesCount();
        if (this.elements.notesCount) {
            this.elements.notesCount.textContent = `${count} Note${count !== 1 ? 's' : ''}`;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // FOLDER MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    switchFolder(folder) {
        this.currentFolder = folder;

        // Update active tab
        document.querySelectorAll('.folder-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.folder === folder);
        });

        this.renderNotes();
    }

    // ═══════════════════════════════════════════════════════════════
    // SEARCH
    // ═══════════════════════════════════════════════════════════════

    toggleSearch() {
        const isActive = this.elements.searchBar?.classList.toggle('active');

        if (isActive) {
            this.elements.searchInput?.focus();
        } else {
            this.clearSearch();
        }
    }

    handleSearch(query) {
        this.searchQuery = query;

        // Show/hide clear button
        this.elements.searchClear?.classList.toggle('visible', query.length > 0);

        this.renderNotes();
    }

    clearSearch() {
        this.searchQuery = '';
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
        }
        this.elements.searchClear?.classList.remove('visible');
        this.renderNotes();
    }

    // ═══════════════════════════════════════════════════════════════
    // NOTE EDITOR
    // ═══════════════════════════════════════════════════════════════

    createNewNote() {
        const note = this.manager.createNote({
            folder: this.currentFolder === 'pinned' ? 'all' : this.currentFolder
        });
        this.openNote(note.id);
    }

    openNote(noteId) {
        const note = this.manager.getNote(noteId);
        if (!note) {
            this.showToast('Note not found', 'error');
            return;
        }

        this.currentNoteId = noteId;
        this.isEditorOpen = true;

        // Populate editor
        this.elements.editorTitle.value = note.title;
        this.elements.editorContent.value = note.content;

        // Update meta
        this.updateEditorMeta(note);

        // Update pin state
        this.updatePinButtonState(note.pinned);

        // Update folder picker state
        this.updateFolderPickerState(note.folder);

        // Show editor
        this.elements.editorOverlay?.classList.add('active');

        // Focus title if empty, otherwise content
        setTimeout(() => {
            if (!note.title) {
                this.elements.editorTitle?.focus();
            } else {
                this.elements.editorContent?.focus();
            }
        }, 300);
    }

    closeEditor() {
        this.saveCurrentNote();

        this.isEditorOpen = false;
        this.currentNoteId = null;

        this.elements.editorOverlay?.classList.remove('active');
        this.closeFolderPicker();

        this.renderNotes();
    }

    saveCurrentNote() {
        if (!this.currentNoteId) return;

        const title = this.elements.editorTitle?.value || '';
        const content = this.elements.editorContent?.value || '';

        // Don't save if both are empty
        if (!title.trim() && !content.trim()) {
            this.manager.deleteNote(this.currentNoteId);
            return;
        }

        const note = this.manager.updateNote(this.currentNoteId, { title, content });
        if (note) {
            this.updateEditorMeta(note);
        }
    }

    updateEditorMeta(note) {
        const dateStr = new Date(note.modifiedAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });

        const charCount = (note.title?.length || 0) + (note.content?.length || 0);

        if (this.elements.editorMeta) {
            this.elements.editorMeta.innerHTML = `
                <span class="meta-date">${dateStr}</span>
                <span class="meta-chars">${charCount} characters</span>
            `;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // EDITOR FORMATTING
    // ═══════════════════════════════════════════════════════════════

    applyFormat(format) {
        const textarea = this.elements.editorContent;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);

        let newText = '';
        let newCursorPos = start;
        let cursorOffset = 0;

        switch (format) {
            case 'bold':
                if (selectedText) {
                    newText = text.substring(0, start) + '**' + selectedText + '**' + text.substring(end);
                    newCursorPos = end + 4;
                } else {
                    newText = text.substring(0, start) + '****' + text.substring(end);
                    newCursorPos = start + 2;
                    cursorOffset = -2;
                }
                break;

            case 'italic':
                if (selectedText) {
                    newText = text.substring(0, start) + '*' + selectedText + '*' + text.substring(end);
                    newCursorPos = end + 2;
                } else {
                    newText = text.substring(0, start) + '**' + text.substring(end);
                    newCursorPos = start + 1;
                    cursorOffset = -1;
                }
                break;

            case 'list':
                if (selectedText) {
                    const lines = selectedText.split('\n');
                    const bulletedLines = lines.map(line => line.trim() ? '- ' + line : line).join('\n');
                    newText = text.substring(0, start) + bulletedLines + text.substring(end);
                    newCursorPos = start + bulletedLines.length;
                } else {
                    newText = text.substring(0, start) + '- ' + text.substring(end);
                    newCursorPos = start + 2;
                }
                break;

            case 'checklist':
                if (selectedText) {
                    const lines = selectedText.split('\n');
                    const checkLines = lines.map(line => line.trim() ? '- [ ] ' + line : line).join('\n');
                    newText = text.substring(0, start) + checkLines + text.substring(end);
                    newCursorPos = start + checkLines.length;
                } else {
                    newText = text.substring(0, start) + '- [ ] ' + text.substring(end);
                    newCursorPos = start + 6;
                }
                break;

            case 'gurmukhi':
                newText = text.substring(0, start) + 'ੴ' + text.substring(end);
                newCursorPos = start + 1;
                break;

            default:
                return;
        }

        textarea.value = newText;
        textarea.focus();
        textarea.setSelectionRange(newCursorPos + cursorOffset, newCursorPos + cursorOffset);

        // Trigger auto-save
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // ═══════════════════════════════════════════════════════════════
    // PIN FUNCTIONALITY
    // ═══════════════════════════════════════════════════════════════

    toggleCurrentNotePin() {
        if (!this.currentNoteId) return;

        const note = this.manager.togglePin(this.currentNoteId);
        if (note) {
            this.updatePinButtonState(note.pinned);
            this.showToast(note.pinned ? 'Note pinned' : 'Note unpinned');
        }
    }

    updatePinButtonState(isPinned) {
        this.elements.editorPin?.classList.toggle('pinned', isPinned);
    }

    // ═══════════════════════════════════════════════════════════════
    // FOLDER PICKER
    // ═══════════════════════════════════════════════════════════════

    toggleFolderPicker() {
        this.elements.folderPicker?.classList.toggle('active');
    }

    closeFolderPicker() {
        this.elements.folderPicker?.classList.remove('active');
    }

    changeNoteFolder(folder) {
        if (!this.currentNoteId) return;

        this.manager.moveToFolder(this.currentNoteId, folder);
        this.updateFolderPickerState(folder);
        this.closeFolderPicker();
        this.showToast('Moved to ' + this.getFolderName(folder));
    }

    updateFolderPickerState(folder) {
        document.querySelectorAll('.folder-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.folder === folder);
        });
    }

    getFolderName(folder) {
        const names = {
            all: 'General',
            gurbani: 'Gurbani Notes',
            personal: 'Personal'
        };
        return names[folder] || 'General';
    }

    // ═══════════════════════════════════════════════════════════════
    // SHARE
    // ═══════════════════════════════════════════════════════════════

    async shareCurrentNote() {
        if (!this.currentNoteId) return;

        const note = this.manager.getNote(this.currentNoteId);
        if (!note) return;

        const title = note.title || 'Untitled';
        const content = note.content || '';
        const shareText = `${title}\n\n${content}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: shareText
                });
            } catch (error) {
                if (error.name !== 'AbortError') {
                    this.copyToClipboard(shareText);
                }
            }
        } else {
            this.copyToClipboard(shareText);
        }
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copied to clipboard');
        } catch (error) {
            this.showToast('Failed to copy', 'error');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // DELETE
    // ═══════════════════════════════════════════════════════════════

    confirmDeleteNote() {
        this.showConfirm(
            'Delete Note?',
            'This action cannot be undone.',
            () => {
                if (this.currentNoteId) {
                    this.manager.deleteNote(this.currentNoteId);
                    this.currentNoteId = null;
                    this.closeEditor();
                    this.showToast('Note deleted');
                }
            }
        );
    }

    confirmDeleteAll() {
        const count = this.manager.getNotesCount();
        this.closeMenu();

        this.showConfirm(
            'Delete All Notes?',
            `This will permanently delete ${count} note${count !== 1 ? 's' : ''}. This action cannot be undone.`,
            () => {
                this.manager.deleteAllNotes();
                this.renderNotes();
                this.showToast('All notes deleted');
            }
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // MENU
    // ═══════════════════════════════════════════════════════════════

    openMenu() {
        this.elements.menuOverlay?.classList.add('active');
    }

    closeMenu() {
        this.elements.menuOverlay?.classList.remove('active');
    }

    // ═══════════════════════════════════════════════════════════════
    // SORT
    // ═══════════════════════════════════════════════════════════════

    openSortSheet() {
        this.closeMenu();
        this.elements.sortSheet?.classList.add('active');
    }

    closeSortSheet() {
        this.elements.sortSheet?.classList.remove('active');
    }

    handleSort(sortBy) {
        this.manager.setSortBy(sortBy);
        this.updateSortUI();
        this.closeSortSheet();
        this.renderNotes();
    }

    updateSortUI() {
        const currentSort = this.manager.getSortBy();
        document.querySelectorAll('.sort-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sort === currentSort);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // EXPORT / IMPORT
    // ═══════════════════════════════════════════════════════════════

    handleExport() {
        this.closeMenu();
        this.manager.exportNotes();
        this.showToast('Notes exported');
    }

    handleImportClick() {
        this.closeMenu();
        this.elements.importInput?.click();
    }

    async handleImport(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const count = await this.manager.importNotes(file);
            this.renderNotes();
            this.showToast(`Imported ${count} note${count !== 1 ? 's' : ''}`);
        } catch (error) {
            this.showToast('Import failed', 'error');
        }

        // Reset input
        e.target.value = '';
    }

    // ═══════════════════════════════════════════════════════════════
    // CONFIRM MODAL
    // ═══════════════════════════════════════════════════════════════

    showConfirm(title, message, callback) {
        this.confirmCallback = callback;

        if (this.elements.confirmTitle) {
            this.elements.confirmTitle.textContent = title;
        }
        if (this.elements.confirmMessage) {
            this.elements.confirmMessage.textContent = message;
        }

        this.elements.confirmModal?.classList.add('active');
    }

    closeConfirm() {
        this.elements.confirmModal?.classList.remove('active');
        this.confirmCallback = null;
    }

    executeConfirm() {
        if (this.confirmCallback) {
            this.confirmCallback();
        }
        this.closeConfirm();
    }

    // ═══════════════════════════════════════════════════════════════
    // TOAST NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════════

    showToast(message, type = 'success') {
        if (this.elements.toastMessage) {
            this.elements.toastMessage.textContent = message;
        }

        const toast = this.elements.toast;
        if (!toast) return;

        toast.classList.remove('error');
        if (type === 'error') {
            toast.classList.add('error');
        }

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    // ═══════════════════════════════════════════════════════════════
    // KEYBOARD SHORTCUTS
    // ═══════════════════════════════════════════════════════════════

    handleKeyboard(e) {
        // Escape to close overlays
        if (e.key === 'Escape') {
            if (this.elements.confirmModal?.classList.contains('active')) {
                this.closeConfirm();
            } else if (this.elements.sortSheet?.classList.contains('active')) {
                this.closeSortSheet();
            } else if (this.elements.menuOverlay?.classList.contains('active')) {
                this.closeMenu();
            } else if (this.isEditorOpen) {
                this.closeEditor();
            }
            return;
        }

        // Cmd/Ctrl + N for new note
        if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
            e.preventDefault();
            this.createNewNote();
            return;
        }

        // Cmd/Ctrl + F for search
        if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
            e.preventDefault();
            if (!this.isEditorOpen) {
                this.toggleSearch();
            }
            return;
        }

        // Cmd/Ctrl + S to save (in editor)
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault();
            if (this.isEditorOpen) {
                this.saveCurrentNote();
                this.showToast('Note saved');
            }
            return;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for use
window.NotesUI = NotesUI;
