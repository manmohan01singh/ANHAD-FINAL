/**
 * Notes Manager Component
 */

class NotesManager {
    constructor() {
        this.notes = this.loadNotes();
    }

    loadNotes() {
        try {
            return JSON.parse(localStorage.getItem('sehajPaathNotes') || '[]');
        } catch {
            return [];
        }
    }

    save() {
        localStorage.setItem('sehajPaathNotes', JSON.stringify(this.notes));
    }

    addNote(text, options = {}) {
        const note = {
            id: `note_${Date.now()}`,
            text,
            ang: options.ang || null,
            lineId: options.lineId || null,
            gurmukhi: options.gurmukhi || '',
            color: options.color || '#FFE4B5',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.notes.unshift(note);
        this.save();
        return note;
    }

    updateNote(id, text) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            note.text = text;
            note.updatedAt = new Date().toISOString();
            this.save();
            return note;
        }
        return null;
    }

    deleteNote(id) {
        const index = this.notes.findIndex(n => n.id === id);
        if (index >= 0) {
            this.notes.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    }

    getAll() {
        return this.notes;
    }

    getByAng(ang) {
        return this.notes.filter(n => n.ang === ang);
    }

    getCount() {
        return this.notes.length;
    }

    search(query) {
        const lower = query.toLowerCase();
        return this.notes.filter(n =>
            n.text.toLowerCase().includes(lower) ||
            n.gurmukhi.includes(query)
        );
    }

    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="notes-manager">
                <div class="notes-header">
                    <h3>📝 Notes</h3>
                    <span class="notes-count">${this.notes.length}</span>
                </div>
                
                ${this.notes.length === 0 ? `
                    <div class="empty-state">
                        <span class="empty-icon">📝</span>
                        <p>No notes yet</p>
                        <p class="subtle">Long-press on a line while reading to add a note</p>
                    </div>
                ` : `
                    <div class="notes-list">
                        ${this.notes.map(note => `
                            <div class="note-card" data-id="${note.id}" style="border-left-color: ${note.color}">
                                <div class="note-header">
                                    ${note.ang ? `<span class="note-ang">Ang ${note.ang}</span>` : ''}
                                    <span class="note-date">${this.formatDate(note.createdAt)}</span>
                                </div>
                                ${note.gurmukhi ? `<p class="note-gurmukhi">${note.gurmukhi}</p>` : ''}
                                <p class="note-text">${note.text}</p>
                                <div class="note-actions">
                                    <button class="note-btn edit" data-id="${note.id}">Edit</button>
                                    <button class="note-btn delete" data-id="${note.id}">Delete</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;

        this.attachListeners(container);
    }

    attachListeners(container) {
        // Edit buttons
        container.querySelectorAll('.note-btn.edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const note = this.notes.find(n => n.id === id);
                if (note) {
                    const newText = prompt('Edit note:', note.text);
                    if (newText !== null && newText.trim()) {
                        this.updateNote(id, newText.trim());
                        this.render(container.id);
                    }
                }
            });
        });

        // Delete buttons
        container.querySelectorAll('.note-btn.delete').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Delete this note?')) {
                    this.deleteNote(btn.dataset.id);
                    this.render(container.id);
                }
            });
        });

        // Navigate to ang
        container.querySelectorAll('.note-ang').forEach(el => {
            el.addEventListener('click', () => {
                const card = el.closest('.note-card');
                const note = this.notes.find(n => n.id === card.dataset.id);
                if (note?.ang) {
                    window.location.href = `reader.html?ang=${note.ang}`;
                }
            });
        });
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotesManager;
}
