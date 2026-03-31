/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AUDIO COORDINATOR — Ensures Only One Audio Source Plays at a Time
 * 
 * This coordinator manages multiple audio systems (Darbar Live, Amritvela Kirtan)
 * and ensures mutual exclusion - only one can play at any given time.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const registeredPlayers = new Map();
    let currentlyPlaying = null;

    const AudioCoordinator = {
        /**
         * Register an audio player with the coordinator
         * @param {string} id - Unique identifier for the player (e.g., 'darbar', 'amritvela')
         * @param {Object} player - Player object with pause() method
         */
        register(id, player) {
            if (!id || !player || typeof player.pause !== 'function') {
                console.error('[AudioCoordinator] Invalid player registration:', id);
                return;
            }

            registeredPlayers.set(id, player);
            console.log(`[AudioCoordinator] Registered player: ${id}`);
        },

        /**
         * Unregister a player
         * @param {string} id - Player identifier
         */
        unregister(id) {
            registeredPlayers.delete(id);
            if (currentlyPlaying === id) {
                currentlyPlaying = null;
            }
            console.log(`[AudioCoordinator] Unregistered player: ${id}`);
        },

        /**
         * Notify coordinator that a player is about to play
         * This will pause all other players
         * @param {string} id - Player identifier that wants to play
         */
        requestPlay(id) {
            if (!registeredPlayers.has(id)) {
                console.warn(`[AudioCoordinator] Unknown player requesting play: ${id}`);
                return;
            }

            // If this player is already playing, do nothing
            if (currentlyPlaying === id) {
                return;
            }

            // Pause all other players
            registeredPlayers.forEach((player, playerId) => {
                if (playerId !== id) {
                    try {
                        player.pause();
                        console.log(`[AudioCoordinator] Paused ${playerId} to allow ${id} to play`);
                    } catch (e) {
                        console.error(`[AudioCoordinator] Error pausing ${playerId}:`, e);
                    }
                }
            });

            currentlyPlaying = id;
            console.log(`[AudioCoordinator] Now playing: ${id}`);
        },

        /**
         * Notify coordinator that a player has paused
         * @param {string} id - Player identifier that paused
         */
        notifyPause(id) {
            if (currentlyPlaying === id) {
                currentlyPlaying = null;
                console.log(`[AudioCoordinator] ${id} paused`);
            }
        },

        /**
         * Get the currently playing player ID
         * @returns {string|null} - ID of currently playing player or null
         */
        getCurrentlyPlaying() {
            return currentlyPlaying;
        },

        /**
         * Pause all registered players
         */
        pauseAll() {
            registeredPlayers.forEach((player, playerId) => {
                try {
                    player.pause();
                } catch (e) {
                    console.error(`[AudioCoordinator] Error pausing ${playerId}:`, e);
                }
            });
            currentlyPlaying = null;
            console.log('[AudioCoordinator] Paused all players');
        },

        /**
         * Get list of registered player IDs
         * @returns {Array<string>} - Array of player IDs
         */
        getRegisteredPlayers() {
            return Array.from(registeredPlayers.keys());
        }
    };

    // Expose globally
    window.AudioCoordinator = AudioCoordinator;

    console.log('[AudioCoordinator] Initialized');
})();
