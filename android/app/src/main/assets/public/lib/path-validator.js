/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PATH VALIDATOR & FIXER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This utility validates navigation paths and fixes common path errors.
 * Include this script early on any page that needs path validation.
 * 
 * Usage:
 *   PathValidator.validateAllLinks();  // Check all links on page
 *   PathValidator.fixLink(element);    // Fix a specific link
 */

const PathValidator = {
    // Correct paths for common navigation (relative to frontend/)
    CORRECT_PATHS: {
        // From index.html (frontend root)
        '/': {
            'hukamnama': './Hukamnama/daily-hukamnama.html',
            'daily-hukamnama': './Hukamnama/daily-hukamnama.html',
            'nitnem': './nitnem/indexbani.html',
            'nitnem-tracker': './NitnemTracker/nitnem-tracker.html',
            'sehaj-paath': './SehajPaath/sehaj-paath.html',
            'calendar': './Calendar/Gurupurab-Calendar.html',
            'reminders': './reminders/smart-reminders.html',
            'naam-abhyas': './NaamAbhyas/naam-abhyas.html',
            'gurbani-khoj': './SehajPaath/gurbani-search.html'
        },
        // From any subfolder (relative to parent)
        'subfolder': {
            'index': '../index.html',
            'home': '../index.html',
            'hukamnama': '../Hukamnama/daily-hukamnama.html',
            'daily-hukamnama': '../Hukamnama/daily-hukamnama.html',
            'nitnem': '../nitnem/indexbani.html',
            'nitnem-tracker': '../NitnemTracker/nitnem-tracker.html',
            'sehaj-paath': '../SehajPaath/sehaj-paath.html',
            'calendar': '../Calendar/Gurupurab-Calendar.html',
            'reminders': '../reminders/smart-reminders.html',
            'naam-abhyas': '../NaamAbhyas/naam-abhyas.html',
            'gurbani-khoj': '../SehajPaath/gurbani-search.html'
        }
    },

    /**
     * Detect current path context (root or subfolder)
     */
    getContext() {
        const path = window.location.pathname;
        // If path contains a subfolder after /frontend/
        if (/\/frontend\/[^\/]+\//.test(path) ||
            /\/(SehajPaath|Hukamnama|NitnemTracker|Calendar|reminders|NaamAbhyas|nitnem)\//.test(path)) {
            return 'subfolder';
        }
        return '/';
    },

    /**
     * Extract page identifier from href
     */
    getPageIdentifier(href) {
        if (!href) return null;

        // Normalize the href
        const normalizedHref = href.toLowerCase()
            .replace(/\.html$/, '')
            .replace(/^(\.\.\/|\.\/)*/, '')
            .replace(/^(frontend\/)?/, '');

        // Map to known identifiers
        const mappings = {
            'index': 'home',
            'hukamnama/daily-hukamnama': 'daily-hukamnama',
            'nitnem/indexbani': 'nitnem',
            'nitnemtracker/nitnem-tracker': 'nitnem-tracker',
            'sehajpaath/sehaj-paath': 'sehaj-paath',
            'calendar/gurupurab-calendar': 'calendar',
            'reminders/smart-reminders': 'reminders',
            'naamabhyas/naam-abhyas': 'naam-abhyas',
            'sehajpaath/gurbani-search': 'gurbani-khoj'
        };

        for (const [pattern, id] of Object.entries(mappings)) {
            if (normalizedHref.includes(pattern)) {
                return id;
            }
        }

        // Try simple name extraction
        const match = normalizedHref.match(/([^\/]+)$/);
        return match ? match[1] : null;
    },

    /**
     * Check if a path is valid (can be resolved)
     */
    async isValidPath(href) {
        if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
            return true; // Special cases, not file paths
        }

        try {
            // Try HEAD request to check if file exists
            const response = await fetch(href, { method: 'HEAD', mode: 'same-origin' });
            return response.ok;
        } catch (error) {
            return false;
        }
    },

    /**
     * Get correct path for a page
     */
    getCorrectPath(pageId) {
        const context = this.getContext();
        return this.CORRECT_PATHS[context]?.[pageId] || null;
    },

    /**
     * Fix a single link element
     */
    fixLink(element) {
        if (!element || !element.hasAttribute('href')) return false;

        const originalHref = element.getAttribute('href');
        const pageId = this.getPageIdentifier(originalHref);

        if (!pageId) return false;

        const correctPath = this.getCorrectPath(pageId);
        if (correctPath && correctPath !== originalHref) {
            element.setAttribute('href', correctPath);
            console.log(`[PathValidator] Fixed: ${originalHref} → ${correctPath}`);
            return true;
        }

        return false;
    },

    /**
     * Add click handler to prevent navigation to broken links
     */
    addClickGuard(element) {
        element.addEventListener('click', async (e) => {
            const href = element.getAttribute('href');

            // Skip special hrefs
            if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
                return;
            }

            // Check if path is valid
            const isValid = await this.isValidPath(href);

            if (!isValid) {
                e.preventDefault();
                console.warn(`[PathValidator] Blocked broken link: ${href}`);

                // Try to fix and retry
                if (this.fixLink(element)) {
                    const newHref = element.getAttribute('href');
                    console.log(`[PathValidator] Redirecting to fixed path: ${newHref}`);
                    window.location.href = newHref;
                } else {
                    // Show error to user
                    this.showError(`Page not found: ${href}`);
                }
            }
        });
    },

    /**
     * Show error message
     */
    showError(message) {
        // Try to use existing toast system
        if (typeof showToast === 'function') {
            showToast(message, 'error');
        } else {
            console.error(message);
            alert(message);
        }
    },

    /**
     * Validate all links on the current page
     */
    async validateAllLinks() {
        const links = document.querySelectorAll('a[href]');
        const results = {
            total: links.length,
            valid: 0,
            invalid: 0,
            fixed: 0,
            errors: []
        };

        console.log(`[PathValidator] Checking ${links.length} links...`);

        for (const link of links) {
            const href = link.getAttribute('href');

            // Skip special hrefs
            if (!href || href.startsWith('#') || href.startsWith('javascript:') ||
                href.startsWith('mailto:') || href.startsWith('tel:') ||
                href.startsWith('http://') || href.startsWith('https://')) {
                results.valid++;
                continue;
            }

            const isValid = await this.isValidPath(href);

            if (isValid) {
                results.valid++;
            } else {
                results.invalid++;

                // Try to fix
                if (this.fixLink(link)) {
                    results.fixed++;
                } else {
                    results.errors.push({
                        element: link,
                        href: href,
                        text: link.textContent?.trim() || '[No text]'
                    });
                }
            }
        }

        console.log(`[PathValidator] Results:`, results);

        if (results.errors.length > 0) {
            console.warn('[PathValidator] Unfixable broken links:',
                results.errors.map(e => `${e.text}: ${e.href}`));
        }

        return results;
    },

    /**
     * Auto-fix navigation paths on page load
     */
    autoFix() {
        // Find all navigation links
        const navLinks = document.querySelectorAll(
            '.nav-item a, .nav-link, .back-btn, [data-nav], .bento-card, .feature-card a'
        );

        let fixed = 0;
        navLinks.forEach(link => {
            if (this.fixLink(link)) {
                fixed++;
            }
        });

        if (fixed > 0) {
            console.log(`[PathValidator] Auto-fixed ${fixed} navigation links`);
        }
    },

    /**
     * Initialize path validation
     */
    init() {
        // Auto-fix on load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.autoFix());
        } else {
            this.autoFix();
        }

        console.log('[PathValidator] Initialized');
    }
};

// Auto-initialize
PathValidator.init();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PathValidator;
}

class AppIntegrityChecker {
    constructor() {
        this.criticalPaths = [
            { path: './index.html', name: 'Home' },
            { path: './style.css', name: 'Main Styles' },
            { path: './script.js', name: 'Main Script' },
            { path: './nitnem/indexbani.html', name: 'Nitnem Index' },
            { path: './nitnem/japji-sahib.html', name: 'Japji Sahib' },
            { path: './NitnemTracker/nitnem-tracker.html', name: 'Tracker' },
            { path: './NaamAbhyas/naam-abhyas.html', name: 'Naam Abhyas' },
            { path: './SehajPaath/sehaj-paath.html', name: 'Sehaj Paath' },
            { path: './SehajPaath/gurbani-search.html', name: 'Gurbani Search' },
            { path: './Calendar/Gurupurab-Calendar.html', name: 'Calendar' },
            { path: './Hukamnama/daily-hukamnama.html', name: 'Hukamnama' },
            { path: './reminders/smart-reminders.html', name: 'Reminders' },
            { path: './Notes/notes.html', name: 'Notes' }
        ];
    }

    async validateAllPaths() {
        const results = [];

        for (const item of this.criticalPaths) {
            try {
                const response = await fetch(item.path, { method: 'HEAD' });
                results.push({
                    ...item,
                    exists: response.ok,
                    status: response.status
                });
            } catch (error) {
                results.push({
                    ...item,
                    exists: false,
                    error: error.message
                });
            }
        }

        const broken = results.filter(r => !r.exists);
        if (broken.length > 0) {
            console.warn('Broken paths detected:', broken);
        }

        return results;
    }

    // Auto-fix relative paths based on current location
    fixRelativePath(targetPath) {
        const currentPath = window.location.pathname;
        const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));

        // Determine depth
        const depth = (currentDir.match(/\//g) || []).length;

        // Build correct relative path
        if (targetPath.startsWith('./')) {
            return targetPath;
        } else if (targetPath.startsWith('../')) {
            return targetPath;
        } else if (targetPath.startsWith('/')) {
            // Absolute path - convert to relative
            return '..' + '/..'.repeat(depth - 1) + targetPath;
        }

        return targetPath;
    }
}

window.integrityChecker = new AppIntegrityChecker();

// Run on load (development only)
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    window.integrityChecker.validateAllPaths().then(results => {
        console.log('Path validation:', results);
    });
}
