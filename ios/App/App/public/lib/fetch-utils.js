/**
 * ═══════════════════════════════════════════════════════════════
 * FETCH UTILS — Timeout-aware fetch wrapper
 * Uses AbortSignal.timeout() for automatic request cancellation
 * ═══════════════════════════════════════════════════════════════
 */
(function () {
    'use strict';

    const DEFAULT_TIMEOUT_MS = 8000;

    /**
     * fetch() with an automatic AbortSignal timeout.
     * @param {string|Request} url
     * @param {RequestInit} [options]
     * @param {number} [timeoutMs]
     * @returns {Promise<Response>}
     */
    async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            return response;
        } catch (err) {
            if (err.name === 'AbortError') {
                throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
            }
            throw err;
        } finally {
            clearTimeout(tid);
        }
    }

    window.fetchWithTimeout = fetchWithTimeout;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { fetchWithTimeout };
    }
})();
