/**
 * Achievements Engine Component
 * Gamification for spiritual reading
 */

class AchievementsEngine {
    constructor() {
        this.achievements = this.getAchievementsList();
        this.unlocked = this.loadUnlocked();
        this.checkAchievements();
    }

    getAchievementsList() {
        return [
            { id: 'first_read', name: 'First Steps', desc: 'Read your first Ang', icon: '🌱', condition: (stats) => stats.totalAngsRead >= 1 },
            { id: 'ang_10', name: 'Getting Started', desc: 'Read 10 Angs', icon: '📖', condition: (stats) => stats.totalAngsRead >= 10 },
            { id: 'ang_50', name: 'Dedicated Reader', desc: 'Read 50 Angs', icon: '📚', condition: (stats) => stats.totalAngsRead >= 50 },
            { id: 'ang_100', name: 'Century', desc: 'Read 100 Angs', icon: '💯', condition: (stats) => stats.totalAngsRead >= 100 },
            { id: 'ang_500', name: 'Half Way', desc: 'Read 500 Angs', icon: '🌟', condition: (stats) => stats.totalAngsRead >= 500 },
            { id: 'ang_1000', name: 'Milestone', desc: 'Read 1000 Angs', icon: '🏆', condition: (stats) => stats.totalAngsRead >= 1000 },
            { id: 'paath_complete', name: 'Sehaj Paath Complete', desc: 'Complete a full Paath', icon: '👑', condition: (stats) => stats.completedPaaths >= 1 },
            { id: 'streak_3', name: 'Consistent', desc: '3 day reading streak', icon: '🔥', condition: (stats) => stats.currentStreak >= 3 },
            { id: 'streak_7', name: 'Week Warrior', desc: '7 day reading streak', icon: '💪', condition: (stats) => stats.currentStreak >= 7 },
            { id: 'streak_14', name: 'Fortnight', desc: '14 day reading streak', icon: '⭐', condition: (stats) => stats.currentStreak >= 14 },
            { id: 'streak_30', name: 'Monthly Master', desc: '30 day reading streak', icon: '🎖️', condition: (stats) => stats.currentStreak >= 30 },
            { id: 'streak_100', name: 'Legendary', desc: '100 day reading streak', icon: '💎', condition: (stats) => stats.currentStreak >= 100 },
            { id: 'bookmark_5', name: 'Collector', desc: 'Save 5 bookmarks', icon: '🔖', condition: (stats) => stats.bookmarks >= 5 },
            { id: 'bookmark_20', name: 'Curator', desc: 'Save 20 bookmarks', icon: '📌', condition: (stats) => stats.bookmarks >= 20 },
            { id: 'early_bird', name: 'Amritvela Reader', desc: 'Read at Amritvela (4-6 AM)', icon: '🌅', condition: (stats) => stats.amritvelaReads >= 1 },
            { id: 'night_owl', name: 'Night Devotion', desc: 'Read after 10 PM', icon: '🌙', condition: (stats) => stats.nightReads >= 1 },
            { id: 'mool_mantar', name: 'Beginning', desc: 'Read Ang 1 (Mool Mantar)', icon: '🙏', condition: (stats) => stats.readAngs?.includes?.(1) },
            { id: 'anand_sahib', name: 'Bliss', desc: 'Reach Anand Sahib (Ang 917)', icon: '😊', condition: (stats) => stats.maxAngReached >= 917 }
        ];
    }

    loadUnlocked() {
        try {
            return JSON.parse(localStorage.getItem('sehajPaathAchievements') || '[]');
        } catch {
            return [];
        }
    }

    saveUnlocked() {
        localStorage.setItem('sehajPaathAchievements', JSON.stringify(this.unlocked));
    }

    getStats() {
        try {
            const stats = JSON.parse(localStorage.getItem('sehajPaathStats') || '{}');
            const bookmarks = JSON.parse(localStorage.getItem('sehajPaathBookmarks') || '[]');
            const completed = JSON.parse(localStorage.getItem('completedPaaths') || '[]');
            const state = JSON.parse(localStorage.getItem('sehajPaathState') || '{}');

            return {
                totalAngsRead: stats.totalAngsRead || 0,
                currentStreak: stats.currentStreak || 0,
                longestStreak: stats.longestStreak || 0,
                bookmarks: bookmarks.length,
                completedPaaths: completed.length,
                maxAngReached: state.currentPaath?.currentAng || 1,
                amritvelaReads: stats.amritvelaReads || 0,
                nightReads: stats.nightReads || 0,
                readAngs: stats.readAngs || []
            };
        } catch {
            return {};
        }
    }

    checkAchievements() {
        const stats = this.getStats();
        const newlyUnlocked = [];

        this.achievements.forEach(achievement => {
            if (!this.unlocked.includes(achievement.id) && achievement.condition(stats)) {
                this.unlocked.push(achievement.id);
                newlyUnlocked.push(achievement);
            }
        });

        if (newlyUnlocked.length > 0) {
            this.saveUnlocked();
            newlyUnlocked.forEach(a => this.showUnlockNotification(a));
        }

        return newlyUnlocked;
    }

    showUnlockNotification(achievement) {
        const toast = document.getElementById('achievementToast');
        if (toast) {
            const titleEl = document.getElementById('achievementTitle');
            const nameEl = document.getElementById('achievementName');

            if (titleEl) titleEl.textContent = 'Achievement Unlocked!';
            if (nameEl) nameEl.textContent = `${achievement.icon} ${achievement.name}`;

            toast.classList.add('show');

            if (typeof haptics !== 'undefined') {
                haptics.achievement();
            }

            setTimeout(() => toast.classList.remove('show'), 4000);
        }
    }

    getUnlocked() {
        return this.achievements.filter(a => this.unlocked.includes(a.id));
    }

    getLocked() {
        return this.achievements.filter(a => !this.unlocked.includes(a.id));
    }

    getProgress() {
        return {
            unlocked: this.unlocked.length,
            total: this.achievements.length,
            percent: Math.round((this.unlocked.length / this.achievements.length) * 100)
        };
    }

    isUnlocked(id) {
        return this.unlocked.includes(id);
    }

    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const progress = this.getProgress();
        const unlocked = this.getUnlocked();
        const locked = this.getLocked();

        container.innerHTML = `
            <div class="achievements-container">
                <div class="achievements-header">
                    <h3>🏆 Achievements</h3>
                    <span class="achievements-progress">${progress.unlocked}/${progress.total}</span>
                </div>
                
                <div class="achievements-progress-bar">
                    <div class="progress-fill" style="width: ${progress.percent}%"></div>
                </div>
                
                <div class="achievements-grid">
                    ${unlocked.map(a => `
                        <div class="achievement-card unlocked">
                            <span class="achievement-icon">${a.icon}</span>
                            <span class="achievement-name">${a.name}</span>
                            <span class="achievement-desc">${a.desc}</span>
                        </div>
                    `).join('')}
                    ${locked.map(a => `
                        <div class="achievement-card locked">
                            <span class="achievement-icon">🔒</span>
                            <span class="achievement-name">???</span>
                            <span class="achievement-desc">${a.desc}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AchievementsEngine;
}
