/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD STORAGE LOCK — Atomic localStorage Operations with Conflict Resolution
 * Prevents concurrent write conflicts between tabs
 * ═══════════════════════════════════════════════════════════════════════════════
 */
(function () {
    'use strict';

    if (window.AnhadStorageLock) return;

    class StorageLock {
        constructor() {
            this.tabId = this._generateTabId();
            this.heldLocks = new Set();
            this.defaultTimeout = 5000;

            // Cleanup locks on pagehide
            window.addEventListener('pagehide', () => this._releaseAllLocks());
            window.addEventListener('beforeunload', () => this._releaseAllLocks());
        }

        _generateTabId() {
            return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        _getLockKey(key) {
            return `_lock:${key}`;
        }

        /**
         * Acquire lock for a key
         * @param {string} key — localStorage key to lock
         * @param {number} timeout — Lock timeout in ms
         * @returns {boolean} — true if lock acquired
         */
        acquire(key, timeout = this.defaultTimeout) {
            const lockKey = this._getLockKey(key);
            const now = Date.now();
            const lockValue = `${now}:${this.tabId}`;

            try {
                // Check existing lock
                const existing = localStorage.getItem(lockKey);
                if (existing) {
                    const [timestamp, tabId] = existing.split(':');
                    const lockAge = now - parseInt(timestamp);

                    // If lock is stale, break it
                    if (lockAge < timeout && tabId !== this.tabId) {
                        return false; // Lock held by another tab
                    }
                }

                // Try to acquire
                localStorage.setItem(lockKey, lockValue);

                // Verify we got it (atomic check)
                const verify = localStorage.getItem(lockKey);
                if (verify === lockValue) {
                    this.heldLocks.add(key);
                    return true;
                }

                return false;
            } catch (e) {
                console.error('[StorageLock] Error acquiring lock:', e);
                return false;
            }
        }

        /**
         * Release lock for a key
         */
        release(key) {
            const lockKey = this._getLockKey(key);

            try {
                const existing = localStorage.getItem(lockKey);
                if (existing) {
                    const [, tabId] = existing.split(':');
                    if (tabId === this.tabId) {
                        localStorage.removeItem(lockKey);
                        this.heldLocks.delete(key);
                    }
                }
            } catch (e) {
                console.error('[StorageLock] Error releasing lock:', e);
            }
        }

        /**
         * Execute function with lock protection
         * @param {string} key — localStorage key
         * @param {Function} fn — Function to execute (receives current value)
         * @param {number} timeout — Lock timeout
         * @returns {any} — Result of fn
         */
        withLock(key, fn, timeout = this.defaultTimeout) {
            if (!this.acquire(key, timeout)) {
                throw new Error(`Could not acquire lock for ${key}`);
            }

            try {
                // Read current value
                const currentValue = localStorage.getItem(key);
                const parsed = currentValue ? JSON.parse(currentValue) : null;

                // Execute function
                const result = fn(parsed);

                // Write back if result provided
                if (result !== undefined) {
                    localStorage.setItem(key, JSON.stringify(result));
                }

                return result;
            } finally {
                this.release(key);
            }
        }

        /**
         * Atomic compare-and-swap operation
         * @param {string} key — localStorage key
         * @param {any} expectedValue — Expected current value
         * @param {any} newValue — New value to set
         * @returns {boolean} — true if swap succeeded
         */
        compareAndSwap(key, expectedValue, newValue) {
            if (!this.acquire(key)) {
                return false;
            }

            try {
                const current = localStorage.getItem(key);
                const parsed = current ? JSON.parse(current) : null;

                // Deep equality check
                if (JSON.stringify(parsed) === JSON.stringify(expectedValue)) {
                    localStorage.setItem(key, JSON.stringify(newValue));
                    return true;
                }

                return false;
            } catch (e) {
                console.error('[StorageLock] CAS error:', e);
                return false;
            } finally {
                this.release(key);
            }
        }

        _releaseAllLocks() {
            const locks = Array.from(this.heldLocks);
            locks.forEach(key => this.release(key));
        }

        /**
         * Get lock status for debugging
         */
        getStatus() {
            return {
                tabId: this.tabId,
                heldLocks: Array.from(this.heldLocks)
            };
        }
    }

    // Create singleton
    window.AnhadStorageLock = new StorageLock();

    console.log('[StorageLock] Initialized');
})();
