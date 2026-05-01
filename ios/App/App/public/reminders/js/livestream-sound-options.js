/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LIVE STREAM SOUND OPTIONS - UI Component
 * 
 * Adds live stream options to the alarm sound selector
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const SOUND_OPTIONS = [
        // Live Streams Section
        {
            id: 'live-darbar',
            name: 'Live Darbar Sahib',
            subtitle: 'Sri Harmandir Sahib Ji • 24/7',
            icon: '🕌',
            type: 'live',
            badge: 'LIVE',
            description: 'Real-time Kirtan from Golden Temple'
        },
        {
            id: 'live-amritvela',
            name: 'Live Amritvela Kirtan',
            subtitle: 'Curated Smagam Tracks',
            icon: '🌅',
            type: 'live',
            badge: 'LIVE',
            description: 'Continuous Amritvela Kirtan'
        },
        // Regular Audio Files
        {
            id: 'audio1',
            name: 'Waheguru Bell',
            subtitle: 'Gentle chime',
            icon: '🔔',
            type: 'audio'
        },
        {
            id: 'audio2',
            name: 'Mool Mantar',
            subtitle: 'Sacred recitation',
            icon: '📿',
            type: 'audio'
        },
        {
            id: 'audio3',
            name: 'Kirtan Gentle',
            subtitle: 'Soft melody',
            icon: '🎵',
            type: 'audio'
        },
        {
            id: 'audio4',
            name: 'Peaceful Night',
            subtitle: 'Calming tone',
            icon: '🌙',
            type: 'audio'
        },
        {
            id: 'audio5',
            name: 'Morning Raga',
            subtitle: 'Uplifting melody',
            icon: '🌄',
            type: 'audio'
        },
        {
            id: 'audio6',
            name: 'Simple Bell',
            subtitle: 'Classic alarm',
            icon: '⏰',
            type: 'audio'
        }
    ];

    /**
     * Generate HTML for sound options
     */
    function generateSoundOptionsHTML(selectedId = 'audio1') {
        let html = '';

        // Live Streams Section
        html += '<div class="sound-section">';
        html += '<div class="sound-section-header">📻 Live Streams</div>';
        
        SOUND_OPTIONS.filter(opt => opt.type === 'live').forEach(option => {
            const isActive = option.id === selectedId ? 'active' : '';
            html += `
                <div class="sound-option ${isActive}" data-sound="${option.id}" data-type="${option.type}">
                    <div class="sound-icon">${option.icon}</div>
                    <div class="sound-info">
                        <div class="sound-name">
                            ${option.name}
                            ${option.badge ? `<span class="sound-badge">${option.badge}</span>` : ''}
                        </div>
                        <div class="sound-subtitle">${option.subtitle}</div>
                        ${option.description ? `<div class="sound-description">${option.description}</div>` : ''}
                    </div>
                    <button class="sound-preview-btn" data-audio="${option.id}" aria-label="Preview">
                        <span class="preview-icon">ℹ️</span>
                    </button>
                </div>
            `;
        });
        html += '</div>';

        // Regular Audio Files Section
        html += '<div class="sound-section">';
        html += '<div class="sound-section-header">🔔 Audio Files</div>';
        
        SOUND_OPTIONS.filter(opt => opt.type === 'audio').forEach(option => {
            const isActive = option.id === selectedId ? 'active' : '';
            html += `
                <div class="sound-option ${isActive}" data-sound="${option.id}" data-type="${option.type}">
                    <div class="sound-icon">${option.icon}</div>
                    <div class="sound-info">
                        <div class="sound-name">${option.name}</div>
                        <div class="sound-subtitle">${option.subtitle}</div>
                    </div>
                    <button class="sound-preview-btn" data-audio="${option.id}" aria-label="Preview">
                        ▶
                    </button>
                </div>
            `;
        });
        html += '</div>';

        return html;
    }

    /**
     * Initialize sound selector in a sheet
     */
    function initializeSoundSelector(containerId, selectedId = 'audio1', onSelect) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Sound selector container not found:', containerId);
            return;
        }

        // Generate and insert HTML
        container.innerHTML = generateSoundOptionsHTML(selectedId);

        // Add event listeners
        container.querySelectorAll('.sound-option').forEach(option => {
            option.addEventListener('click', function() {
                // Remove active from all
                container.querySelectorAll('.sound-option').forEach(opt => 
                    opt.classList.remove('active')
                );
                
                // Add active to clicked
                this.classList.add('active');
                
                const soundId = this.dataset.sound;
                const soundType = this.dataset.type;
                
                // Haptic feedback
                if (navigator.vibrate) navigator.vibrate(10);
                
                // Callback
                if (onSelect) onSelect(soundId, soundType);
            });
        });

        // Preview button handlers
        container.querySelectorAll('.sound-preview-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const audioId = this.dataset.audio;
                const option = SOUND_OPTIONS.find(opt => opt.id === audioId);
                
                if (option && option.type === 'live') {
                    // Show info for live streams
                    if (window.Toast) {
                        window.Toast.show(
                            `${option.icon} ${option.name} - Will start when alarm fires`,
                            'info',
                            3000
                        );
                    }
                } else {
                    // Preview audio file
                    if (window.AudioManager && window.AudioManager.preview) {
                        window.AudioManager.preview(audioId, this);
                    }
                }
            });
        });
    }

    /**
     * Get sound option info by ID
     */
    function getSoundInfo(soundId) {
        return SOUND_OPTIONS.find(opt => opt.id === soundId) || SOUND_OPTIONS[2]; // Default to audio1
    }

    // Export to global scope
    window.LiveStreamSoundOptions = {
        options: SOUND_OPTIONS,
        generateHTML: generateSoundOptionsHTML,
        initialize: initializeSoundSelector,
        getInfo: getSoundInfo
    };

    console.log('🎵 [LiveStreamSoundOptions] Loaded with', SOUND_OPTIONS.length, 'options');

})();
