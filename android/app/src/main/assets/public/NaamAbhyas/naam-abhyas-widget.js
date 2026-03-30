/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NAAM ABHYAS WIDGET - For Nitnem Tracker Integration
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This widget displays Naam Abhyas stats on the Nitnem Tracker page
 * with proper light/dark theme support and real-time updates.
 * 
 * Usage: Include this script on any page where you want to show the widget,
 * then call: NaamAbhyasWidget.render('containerId');
 */

const NaamAbhyasWidget = {
    STORAGE_KEY: 'naam_abhyas_history',
    CONFIG_KEY: 'naam_abhyas_config',
    _container: null,
    _observer: null,

    /**
     * Load Naam Abhyas history from localStorage
     */
    loadHistory() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : this.getDefaultHistory();
        } catch (error) {
            console.error('[NaamAbhyasWidget] Error loading history:', error);
            return this.getDefaultHistory();
        }
    },

    /**
     * Load Naam Abhyas config from localStorage
     */
    loadConfig() {
        try {
            const stored = localStorage.getItem(this.CONFIG_KEY);
            return stored ? JSON.parse(stored) : this.getDefaultConfig();
        } catch (error) {
            return this.getDefaultConfig();
        }
    },

    getDefaultHistory() {
        return {
            totalSessions: 0,
            totalTimeSeconds: 0,
            currentStreak: 0,
            longestStreak: 0,
            completedSessions: 0,
            skippedSessions: 0,
            sessions: [],
            scheduleHistory: {}
        };
    },

    getDefaultConfig() {
        return {
            enabled: false,
            duration: 2,
            activeHours: { start: 5, end: 22 }
        };
    },

    /**
     * Get today's stats
     */
    getTodayStats() {
        const history = this.loadHistory();
        const config = this.loadConfig();
        const today = new Date().toLocaleDateString('en-CA');

        // Count today's completed and remaining
        const todaySchedule = history.scheduleHistory?.[today] || {};
        let completed = 0;
        let total = 0;

        const startHour = config.activeHours?.start || 5;
        const endHour = config.activeHours?.end || 22;

        for (let hour = startHour; hour <= endHour; hour++) {
            total++;
            if (todaySchedule[hour]?.status === 'completed') {
                completed++;
            }
        }

        const remaining = total - completed;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            completed,
            remaining,
            total,
            percentage,
            currentStreak: history.currentStreak || 0,
            totalSessions: history.totalSessions || history.completedSessions || 0,
            enabled: config.enabled
        };
    },

    /**
     * Detect current theme - Fixed to properly detect Nitnem Tracker themes
     */
    isLightMode() {
        // Check multiple sources for theme - BOTH html and body
        const bodyTheme = document.body.getAttribute('data-theme');
        const htmlTheme = document.documentElement.getAttribute('data-theme');
        const bodyClasses = document.body.classList;
        const htmlClasses = document.documentElement.classList;

        // First, explicitly check for DARK mode (more reliable)
        if (bodyTheme === 'dark' || htmlTheme === 'dark') return false;
        if (bodyClasses.contains('theme-dark') || htmlClasses.contains('theme-dark')) return false;
        if (bodyClasses.contains('dark-mode') || htmlClasses.contains('dark-mode')) return false;

        // Then check for explicit light mode
        if (bodyTheme === 'light' || htmlTheme === 'light') return true;
        if (bodyClasses.contains('theme-light') || htmlClasses.contains('theme-light')) return true;
        if (bodyClasses.contains('light-mode') || htmlClasses.contains('light-mode')) return true;

        // Check computed background color as fallback
        const bgColor = getComputedStyle(document.body).backgroundColor;
        if (bgColor) {
            const rgb = bgColor.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
                const brightness = (parseInt(rgb[0]) + parseInt(rgb[1]) + parseInt(rgb[2])) / 3;
                return brightness > 127;
            }
        }

        // Default to dark mode (safer for visibility)
        return false;
    },

    /**
     * Format time in human-readable format
     */
    formatDuration(seconds) {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    },

    /**
     * Get theme-aware colors
     */
    getColors(isLight) {
        if (isLight) {
            return {
                // Light mode - DARK readable text
                text: '#1c1c1e',
                textSecondary: 'rgba(60, 60, 67, 0.9)',
                textTertiary: 'rgba(60, 60, 67, 0.7)',
                textMuted: 'rgba(60, 60, 67, 0.5)',
                bg: 'linear-gradient(135deg, rgba(255, 149, 0, 0.12), rgba(88, 86, 214, 0.08))',
                glassBg: 'rgba(255, 255, 255, 0.7)',
                border: 'rgba(0, 0, 0, 0.08)',
                statBg: 'rgba(0, 0, 0, 0.04)',
                progressBg: 'rgba(0, 0, 0, 0.08)',
                shadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                buttonShadow: '0 4px 15px rgba(255, 149, 0, 0.25)'
            };
        } else {
            return {
                // Dark mode
                text: '#ffffff',
                textSecondary: 'rgba(255, 255, 255, 0.7)',
                textTertiary: 'rgba(255, 255, 255, 0.6)',
                textMuted: 'rgba(255, 255, 255, 0.4)',
                bg: 'linear-gradient(135deg, rgba(255, 149, 0, 0.15), rgba(88, 86, 214, 0.1))',
                glassBg: 'rgba(255, 255, 255, 0.08)',
                border: 'rgba(255, 255, 255, 0.1)',
                statBg: 'rgba(255, 255, 255, 0.08)',
                progressBg: 'rgba(255, 255, 255, 0.1)',
                shadow: 'none',
                buttonShadow: '0 4px 15px rgba(255, 149, 0, 0.3)'
            };
        }
    },

    /**
     * Render the widget into a container
     */
    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`[NaamAbhyasWidget] Container #${containerId} not found`);
            return;
        }

        this._container = container;
        const stats = this.getTodayStats();
        const history = this.loadHistory();
        const isLight = this.isLightMode();
        const colors = this.getColors(isLight);

        const progressGradient = stats.percentage >= 100
            ? 'linear-gradient(135deg, #30D158 0%, #28B94C 100%)'
            : 'linear-gradient(135deg, #FF9500 0%, #E68600 100%)';

        container.innerHTML = `
            <div class="naam-widget" style="
                background: ${colors.bg};
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid ${colors.border};
                border-radius: 20px;
                padding: 20px;
                margin-bottom: 16px;
                box-shadow: ${colors.shadow};
                transition: all 0.3s ease;
            ">
                <div class="naam-widget-header" style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 16px;
                ">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="
                            width: 44px;
                            height: 44px;
                            background: linear-gradient(135deg, #FF9500, #E68600);
                            border-radius: 12px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 1.25rem;
                            box-shadow: 0 4px 12px rgba(255, 149, 0, 0.3);
                        ">🙏</div>
                        <div>
                            <div style="font-weight: 600; color: ${colors.text}; font-size: 1.05rem;">Naam Abhyas</div>
                            <div style="font-size: 0.8rem; color: ${colors.textSecondary};">
                                ${stats.enabled ? 'Hourly Reminders Active' : 'Tap to Enable'}
                            </div>
                        </div>
                    </div>
                    ${stats.currentStreak > 0 ? `
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 4px;
                            padding: 6px 12px;
                            background: rgba(255, 149, 0, 0.2);
                            border-radius: 20px;
                            font-size: 0.85rem;
                            color: ${colors.text};
                        ">
                            <span>🔥</span>
                            <span style="font-weight: 600;">${stats.currentStreak}</span>
                        </div>
                    ` : ''}
                </div>

                ${stats.enabled ? `
                    <div class="naam-widget-stats" style="
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 12px;
                        margin-bottom: 16px;
                    ">
                        <div style="
                            background: ${colors.statBg};
                            border-radius: 12px;
                            padding: 14px 12px;
                            text-align: center;
                        ">
                            <div style="font-size: 1.5rem; font-weight: 700; color: #30D158;">${stats.completed}</div>
                            <div style="font-size: 0.75rem; color: ${colors.textSecondary}; font-weight: 500;">Completed</div>
                        </div>
                        <div style="
                            background: ${colors.statBg};
                            border-radius: 12px;
                            padding: 14px 12px;
                            text-align: center;
                        ">
                            <div style="font-size: 1.5rem; font-weight: 700; color: #FF9500;">${stats.remaining}</div>
                            <div style="font-size: 0.75rem; color: ${colors.textSecondary}; font-weight: 500;">Remaining</div>
                        </div>
                        <div style="
                            background: ${colors.statBg};
                            border-radius: 12px;
                            padding: 14px 12px;
                            text-align: center;
                        ">
                            <div style="font-size: 1.5rem; font-weight: 700; color: #5856D6;">${stats.percentage}%</div>
                            <div style="font-size: 0.75rem; color: ${colors.textSecondary}; font-weight: 500;">Progress</div>
                        </div>
                    </div>

                    <div class="naam-widget-progress" style="margin-bottom: 16px;">
                        <div style="
                            height: 8px;
                            background: ${colors.progressBg};
                            border-radius: 4px;
                            overflow: hidden;
                        ">
                            <div style="
                                height: 100%;
                                width: ${stats.percentage}%;
                                background: ${progressGradient};
                                border-radius: 4px;
                                transition: width 0.5s ease;
                            "></div>
                        </div>
                    </div>
                ` : `
                    <div style="
                        background: ${colors.statBg};
                        border-radius: 12px;
                        padding: 20px;
                        text-align: center;
                        margin-bottom: 16px;
                    ">
                        <p style="color: ${colors.textSecondary}; margin-bottom: 8px; font-size: 0.9rem;">
                            Get hourly reminders to remember Vaheguru throughout the day
                        </p>
                    </div>
                `}

                <a href="../NaamAbhyas/naam-abhyas.html" style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 14px 24px;
                    background: linear-gradient(135deg, #FF9500, #E68600);
                    border-radius: 12px;
                    color: #fff;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all 0.3s ease;
                    box-shadow: ${colors.buttonShadow};
                ">
                    ${stats.enabled ? 'View Full Details' : 'Enable Naam Abhyas'}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </a>

                ${stats.totalSessions > 0 ? `
                    <div style="
                        text-align: center;
                        margin-top: 12px;
                        font-size: 0.8rem;
                        color: ${colors.textMuted};
                    ">
                        Total: ${stats.totalSessions} sessions • ${this.formatDuration(history.totalTimeSeconds || 0)} in meditation
                    </div>
                ` : ''}
            </div>
        `;

        // Add hover effect
        const link = container.querySelector('a');
        if (link) {
            link.addEventListener('mouseenter', () => {
                link.style.transform = 'translateY(-2px)';
                link.style.boxShadow = '0 8px 25px rgba(255, 149, 0, 0.4)';
            });
            link.addEventListener('mouseleave', () => {
                link.style.transform = '';
                link.style.boxShadow = colors.buttonShadow;
            });
        }
    },

    /**
     * Initialize auto-update (updates every minute) with theme observation
     */
    startAutoUpdate(containerId, intervalMs = 60000) {
        this.render(containerId);

        // Update on theme changes
        this.observeThemeChanges(containerId);

        this._updateInterval = setInterval(() => {
            this.render(containerId);
        }, intervalMs);
    },

    /**
     * Observe theme changes to re-render with correct colors
     */
    observeThemeChanges(containerId) {
        // Use MutationObserver to watch for class/attribute changes on body and html
        if (this._observer) {
            this._observer.disconnect();
        }

        this._observer = new MutationObserver(() => {
            this.render(containerId);
        });

        this._observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class', 'data-theme']
        });

        this._observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class', 'data-theme']
        });
    },

    /**
     * Stop auto-update
     */
    stopAutoUpdate() {
        if (this._updateInterval) {
            clearInterval(this._updateInterval);
            this._updateInterval = null;
        }
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NaamAbhyasWidget;
}
