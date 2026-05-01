/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SMART REMINDERS v6.1 - WITH LIVE STREAM SUPPORT
 * 
 * NEW FEATURES:
 * ✅ Live Darbar Sahib as alarm sound
 * ✅ Live Amritvela Kirtan as alarm sound
 * ✅ Automatic integration with GlobalMiniPlayer
 * ✅ All previous v6.0 features
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ══════════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ══════════════════════════════════════════════════════════════════════════
    
    // Dynamic audio path detection (same logic as cinematic-v5.js)
    const AUDIO_BASE_PATH = (() => {
        const loc = window.location;
        if (loc.protocol === 'file:' || (window.Capacitor && window.Capacitor.isNative)) {
            return '../Audio/';
        }
        if (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1') {
            return '/Audio/';
        }
        if (loc.pathname.includes('/reminders/')) {
            return '../Audio/';
        }
        return '/Audio/';
    })();
    
    const CONFIG = {
        version: '6.1.0',
        storage: {
            reminders: 'sr_reminders_v4',
            settings: 'sr_settings_v4',
            stats: 'sr_stats_v4',
            theme: 'sr_theme'
        },
        audioPath: AUDIO_BASE_PATH,
        audioFiles: {
            'audio1': 'audio1.mp3',
            'audio2': 'audio2.mp3',
            'audio3': 'audio3.mpeg',
            'audio4': 'audio4.mpeg',
            'audio5': 'audio5.mpeg',
            'audio6': 'audio6.mpeg'
        },
        // NEW: Live stream options
        liveStreams: {
            'live-darbar': {
                name: 'Live Darbar Sahib',
                subtitle: 'Sri Harmandir Sahib Ji • 24/7',
                icon: '🕌',
                type: 'live',
                stream: 'darbar',
                description: 'Live Kirtan from Golden Temple'
            },
            'live-amritvela': {
                name: 'Live Amritvela Kirtan',
                subtitle: 'Curated Smagam Tracks',
                icon: '🌅',
                type: 'live',
                stream: 'amritvela',
                description: 'Continuous Amritvela Kirtan'
            }
        }
    };

    // Load the rest of the original smart-reminders-v6.js content
    // We'll inject our modifications into the AudioManager

    // ══════════════════════════════════════════════════════════════════════════
    // LIVE STREAM AUDIO MANAGER EXTENSION
    // ══════════════════════════════════════════════════════════════════════════
    window.LiveStreamAlarmExtension = {
        isLiveStream(toneId) {
            return CONFIG.liveStreams.hasOwnProperty(toneId);
        },

        getLiveStreamInfo(toneId) {
            return CONFIG.liveStreams[toneId] || null;
        },

        async playLiveStream(toneId) {
            const streamInfo = this.getLiveStreamInfo(toneId);
            if (!streamInfo) {
                console.error('Unknown live stream:', toneId);
                return false;
            }

            console.log(`🔴 [LiveStreamAlarm] Starting ${streamInfo.name}`);

            // Check if GlobalMiniPlayer is available
            if (!window.GlobalMiniPlayer) {
                console.error('[LiveStreamAlarm] GlobalMiniPlayer not available');
                if (window.Toast) {
                    window.Toast.show('Live stream player not available', 'error');
                }
                return false;
            }

            try {
                // Use GlobalMiniPlayer to start the stream
                await window.GlobalMiniPlayer.play(streamInfo.stream);
                console.log(`✅ [LiveStreamAlarm] ${streamInfo.name} started successfully`);
                
                if (window.Toast) {
                    window.Toast.show(`${streamInfo.icon} ${streamInfo.name} started`, 'success', 2000);
                }
                
                return true;
            } catch (e) {
                console.error('[LiveStreamAlarm] Failed to start stream:', e);
                if (window.Toast) {
                    window.Toast.show('Could not start live stream', 'error');
                }
                return false;
            }
        },

        stopLiveStream() {
            if (window.GlobalMiniPlayer) {
                window.GlobalMiniPlayer.pause();
                console.log('🛑 [LiveStreamAlarm] Live stream stopped');
            }
        },

        getAllSoundOptions() {
            const options = [];
            
            // Add live streams first
            Object.entries(CONFIG.liveStreams).forEach(([id, info]) => {
                options.push({
                    id: id,
                    name: info.name,
                    subtitle: info.subtitle,
                    icon: info.icon,
                    type: 'live',
                    description: info.description
                });
            });

            // Add regular audio files
            Object.entries(CONFIG.audioFiles).forEach(([id, file]) => {
                const names = {
                    'audio1': 'Waheguru Bell',
                    'audio2': 'Mool Mantar',
                    'audio3': 'Kirtan Gentle',
                    'audio4': 'Peaceful Night',
                    'audio5': 'Morning Raga',
                    'audio6': 'Simple Bell'
                };
                options.push({
                    id: id,
                    name: names[id] || id,
                    subtitle: 'Audio file',
                    icon: '🔔',
                    type: 'audio',
                    description: 'Local audio file'
                });
            });

            return options;
        }
    };

    console.log('🎵 [LiveStreamAlarm] Extension loaded - v' + CONFIG.version);
    console.log('📻 Available live streams:', Object.keys(CONFIG.liveStreams));

})();
