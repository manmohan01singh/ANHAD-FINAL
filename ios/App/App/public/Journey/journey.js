// Journey Page JavaScript

// Load version from version.json
async function loadVersion() {
    try {
        const response = await fetch('../version.json');
        const data = await response.json();
        const versionElement = document.getElementById('version');
        if (versionElement && data.version) {
            versionElement.textContent = data.version;
        }
    } catch (error) {
        console.error('Error loading version:', error);
    }
}

// Apply theme on page load
function applyTheme() {
    const savedTheme = localStorage.getItem('anhad_theme') || 'auto';
    let effectiveTheme = savedTheme;
    if (savedTheme === 'auto') {
        let timeOfDay = localStorage.getItem('anhad_forced_time_of_day');
        if (timeOfDay && ['morning', 'day', 'evening', 'night'].includes(timeOfDay)) {
            effectiveTheme = (timeOfDay === 'night') ? 'dark' : 'light';
        } else {
            const hour = new Date().getHours();
            effectiveTheme = (hour >= 5 && hour < 20) ? 'light' : 'dark';
        }
    }
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    document.documentElement.setAttribute('data-theme-mode', savedTheme);
    if (effectiveTheme === 'dark') {
        document.documentElement.classList.add('dark', 'dark-mode');
        document.body.classList.add('dark-mode');
    } else {
        document.documentElement.classList.remove('dark', 'dark-mode');
        document.body.classList.remove('dark-mode');
    }
}

// Animate elements on scroll
function observeElements() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Observe all content sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach((section) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });

    // Observe timeline items
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-30px)';
        item.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(item);
    });

    // Observe stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        card.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
        observer.observe(card);
    });
}

// Animate numbers (for stats)
function animateNumbers() {
    const statValues = document.querySelectorAll('.stat-value');
    statValues.forEach((stat) => {
        const text = stat.textContent;
        const number = parseInt(text);
        
        if (!isNaN(number)) {
            let current = 0;
            const increment = number / 50;
            const timer = setInterval(() => {
                current += increment;
                if (current >= number) {
                    stat.textContent = number;
                    clearInterval(timer);
                } else {
                    stat.textContent = Math.floor(current);
                }
            }, 30);
        }
    });
}

// Smooth scroll to sections
function smoothScrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Add parallax effect to cover section
function addParallaxEffect() {
    const coverSection = document.querySelector('.cover-section');
    if (!coverSection) return;

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxSpeed = 0.5;
        
        if (scrolled < coverSection.offsetHeight) {
            coverSection.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
        }
    });
}

// Add floating animation to logo
function addLogoAnimation() {
    const logo = document.querySelector('.logo-large');
    if (!logo) return;

    let direction = 1;
    let position = 0;
    
    setInterval(() => {
        position += direction * 0.5;
        if (position >= 10 || position <= -10) {
            direction *= -1;
        }
        logo.style.transform = `translateY(${position}px)`;
    }, 50);
}

// Update contact buttons with actual links
function updateContactLinks() {
    // You can update these with your actual contact information
    const emailBtn = document.querySelector('a[href^="mailto:"]');
    if (emailBtn) {
        // emailBtn.href = 'mailto:your-email@example.com';
    }
}

// Track user interactions (optional analytics)
function trackInteraction(eventName, data = {}) {
    console.log('User Interaction:', eventName, data);
    // You can integrate with analytics here if needed
}

// Add click tracking to contact buttons
function setupContactTracking() {
    const contactButtons = document.querySelectorAll('.contact-btn');
    contactButtons.forEach((button) => {
        button.addEventListener('click', (e) => {
            const buttonText = button.textContent.trim();
            trackInteraction('contact_button_click', { button: buttonText });
        });
    });
}

// Back button functionality
function setupBackButton() {
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            trackInteraction('back_button_click');
            // If there's no history, go to home
            if (window.history.length <= 1) {
                window.location.href = '../index.html';
            } else {
                window.history.back();
            }
        });
    }
}

// Add keyboard navigation
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // ESC key to go back
        if (e.key === 'Escape') {
            window.history.back();
        }
    });
}

// Update streak display from UnifiedStats
function updateStreakDisplay() {
    const streakEl = document.getElementById('nitnemStreak') ||
                     document.querySelector('.quick-card__streak') ||
                     document.querySelector('[data-streak]');
    if (!streakEl) return;

    let streak = 0;
    try {
        if (window.UnifiedStats) {
            streak = window.UnifiedStats.getStreaks().nitnem || 0;
        } else {
            const sd = localStorage.getItem('anhad_streak_data');
            if (sd) { const p = JSON.parse(sd); streak = p.current || p.currentStreak || 0; }
        }
    } catch(e) {}

    if (streak > 0) {
        streakEl.innerHTML = `🔥 ${streak} day${streak > 1 ? 's' : ''}`;
    }
}

// Initialize page
function init() {
    console.log('🙏 Journey page loaded - Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh');
    
    // Theme is already applied by inline IIFE in <head>
    // applyTheme() still available as fallback for dynamic changes
    applyTheme();
    
    // Load version
    loadVersion();
    
    // Setup observers and animations
    observeElements();
    
    // Update streak if any streak element exists on page
    updateStreakDisplay();

    // Setup interactions
    setupBackButton();
    setupContactTracking();
    setupKeyboardNavigation();
    updateContactLinks();
    
    // Add effects
    addParallaxEffect();
    
    // Track page view
    trackInteraction('journey_page_view');

    // Listen for live streak changes
    window.addEventListener('statsInitialized', updateStreakDisplay);
    window.addEventListener('statsChanged', updateStreakDisplay);
    window.addEventListener('streakUpdated', updateStreakDisplay);
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Handle visibility change (for PWA)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log('Journey page visible again');
    }
});

// Service Worker registration check
if ('serviceWorker' in navigator) {
    console.log('Service Worker support detected');
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadVersion,
        applyTheme,
        trackInteraction
    };
}
