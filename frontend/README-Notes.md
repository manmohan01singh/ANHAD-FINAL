# My Notes - iOS 26+ Optical Liquid Glass

A complete note-taking system integrated into the Sikh App with modern iOS-style design and powerful features.

## 🚀 Features

### Core Functionality
- **Full CRUD Operations**: Create, read, update, and delete notes
- **Rich Categories**: Organize notes by type (General, Gurbani, Meanings, Personal, Questions)
- **Smart Search**: Search across titles, content, and tags
- **Pinning**: Keep important notes at the top
- **Tags**: Organize with custom tags
- **Auto-save**: Never lose your work with automatic saving

### Gurbani Integration
- **Contextual Notes**: Add notes directly from Gurbani text
- **Ang References**: Link notes to specific Ang numbers
- **Hukamnama Integration**: Quick notes for daily Hukamnama
- **Gurpurab Events**: Notes for calendar events

### Device Features
- **Export/Import**: Backup and restore notes as JSON files
- **Offline Storage**: Works completely offline using localStorage
- **PWA Support**: Install as a standalone app
- **Responsive Design**: Optimized for all screen sizes

### UI/UX
- **iOS 26+ Design**: Modern optical liquid glass effects
- **Smooth Animations**: Fluid transitions and micro-interactions
- **Dark Mode**: Automatic theme switching
- **Keyboard Shortcuts**: Power user support
- **Touch Gestures**: Pull-to-refresh and swipe actions

## 📁 File Structure

```
frontend/
├── notes.html                 # Standalone notes app
├── css/
│   └── notes-app.css         # Notes-specific styles
├── js/
│   ├── notes-manager.js      # Core notes logic
│   ├── notes-ui.js          # User interface components
│   └── notes-integration.js  # App integration features
└── README-Notes.md          # This file
```

## 🎯 Quick Start

### Standalone Usage
1. Open `notes.html` in your browser
2. Start creating notes immediately
3. All data is saved locally

### Integration with Main App
1. Include the scripts in your main HTML:
```html
<script src="js/notes-manager.js"></script>
<script src="js/notes-ui.js"></script>
<script src="js/notes-integration.js"></script>
```

2. Add a container for notes:
```html
<div id="notes-container"></div>
```

3. Initialize the notes system:
```javascript
const notesUI = new NotesUI('notes-container');
notesUI.init();
```

## ⌨️ Keyboard Shortcuts

- **⌘N / Ctrl+N**: Create new note
- **⌘F / Ctrl+F**: Search notes
- **⌘⇧N / Ctrl+Shift+N**: Quick note from current context
- **ESC**: Close modal dialogs

## 📱 Mobile Features

### Touch Gestures
- **Pull to Refresh**: Refresh notes list
- **Swipe Actions**: Quick pin/delete on note cards
- **Long Press**: Context menus for additional options

### PWA Installation
1. Open the app in Safari (iOS) or Chrome (Android)
2. Tap "Add to Home Screen"
3. Use as a standalone app

## 🔧 Technical Details

### Data Storage
- Uses localStorage for persistence
- Automatic fallback handling for quota exceeded
- JSON format for easy export/import

### Performance
- Debounced auto-save (1 second delay)
- Virtual scrolling for large note lists
- Optimized search with indexing

### Browser Support
- Modern browsers with ES6+ support
- iOS Safari 12+
- Chrome 80+
- Firefox 75+

## 🎨 Customization

### Adding New Categories
Edit `NOTE_CATEGORIES` in `notes-manager.js`:
```javascript
const NOTE_CATEGORIES = [
    { id: 'general', name: 'General', icon: '📝', color: '#007AFF' },
    { id: 'custom', name: 'Custom', icon: '🎯', color: '#FF6B6B' }
];
```

### Theme Customization
Override CSS variables in your stylesheet:
```css
:root {
    --accent-saffron: #FF9500;
    --glass-bg: rgba(255, 255, 255, 0.1);
    --blur-standard: 20px;
}
```

## 🔗 Integration Examples

### Adding Notes to Any Content
```javascript
// Create a contextual note
window.notesIntegration.createContextualNote(element);

// Quick note from selection
window.notesIntegration.quickNoteFromContext();
```

### Exporting Notes
```javascript
// Export to device
window.notesManager.exportToDevice();

// Get all notes as JSON
const allNotes = window.notesManager.getAllNotes();
```

## 🚨 Troubleshooting

### Storage Issues
If you see "Storage full" errors:
1. Delete some old notes
2. Export notes and clear storage
3. Check browser quota settings

### Performance Issues
For large numbers of notes:
1. Use search to filter
2. Pin important notes for quick access
3. Regularly export and clean up old notes

### Mobile Issues
- Ensure viewport meta tag is present
- Check safe area insets for notched devices
- Test in both portrait and landscape

## 📈 Future Enhancements

- [ ] Cloud sync support
- [ ] Rich text editor
- [ ] Image attachments
- [ ] Voice notes
- [ ] Collaboration features
- [ ] Advanced search filters
- [ ] Note templates
- [ ] Reminders and notifications

## 🤝 Contributing

1. Follow the existing code style
2. Test on multiple devices
3. Update documentation
4. Use semantic HTML
5. Ensure accessibility compliance

## 📄 License

This notes system is part of the Sikh App project and follows the same licensing terms.
