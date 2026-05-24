/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD GUIDED ONBOARDING SYSTEM — Premium Glassmorphic Edition
 * Spotlight-highlights critical elements, advances on click-anywhere
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const TOUR_KEY = 'anhad_onboarding_completed';

    // Don't run if already completed or if on desktop/non-main screens
    if (localStorage.getItem(TOUR_KEY) === 'true') {
        return;
    }

    // Step definitions
    const steps = [
        {
            selector: '#homeBackBtn',
            title: 'ੴ Enter Gurdwara Sahib',
            text: 'Tap the Radio icon to enter the Gurdwara Sahib welcome screen and play virtual live Kirtan & Simran.',
            position: 'bottom-left'
        },
        {
            selector: '#themeToggleBtn',
            title: '✨ Three Magic Themes',
            text: 'We have three gorgeous themes! Click here to cycle between Light, Dark, and Dynamic Time-of-Day auto modes.',
            position: 'bottom-right'
        },
        {
            selector: '.hero-carousel',
            title: '🎵 Virtual Live Streams',
            text: 'Swipe left/right and tap the play buttons to listen to live streams synchronized across all devices in real time.',
            position: 'center'
        },
        {
            selector: '#mainNav',
            title: '📈 Your Devotion Journey',
            text: 'Read daily Nitnem, start Sehaj Paath, view your personal stats, active days, and streaks here.',
            position: 'top-center'
        }
    ];

    let currentStepIndex = 0;
    let overlay = null;
    let spotlight = null;
    let popover = null;
    let tapPrompt = null;

    // Inject Glassmorphic styles dynamically
    function injectStyles() {
        const style = document.createElement('style');
        style.id = 'anhad-onboarding-styles';
        style.textContent = `
            .anhad-tour-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.4);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                z-index: 999999;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: auto;
            }
            .anhad-tour-overlay.active {
                opacity: 1;
            }
            .anhad-tour-spotlight {
                position: absolute;
                box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.65);
                border-radius: 16px;
                z-index: 1000000;
                transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                pointer-events: none;
            }
            .anhad-tour-popover {
                position: absolute;
                background: rgba(255, 255, 255, 0.85);
                backdrop-filter: blur(20px) saturate(190%);
                -webkit-backdrop-filter: blur(20px) saturate(190%);
                border: 1px solid rgba(255, 255, 255, 0.4);
                box-shadow: 
                    0 8px 32px rgba(139, 105, 20, 0.12),
                    inset 0 1px 0 rgba(255, 255, 255, 0.6);
                border-radius: 20px;
                padding: 18px 22px;
                width: 280px;
                z-index: 1000001;
                transform: scale(0.9) translateY(10px);
                opacity: 0;
                transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                color: #3D2914;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                box-sizing: border-box;
            }
            html.dark-mode .anhad-tour-popover,
            [data-theme="dark"] .anhad-tour-popover {
                background: rgba(28, 28, 31, 0.85);
                border-color: rgba(255, 255, 255, 0.08);
                color: #FAF8F5;
                box-shadow: 
                    0 8px 32px rgba(0, 0, 0, 0.4),
                    inset 0 1px 0 rgba(255, 255, 255, 0.05);
            }
            .anhad-tour-popover.active {
                transform: scale(1) translateY(0);
                opacity: 1;
            }
            .anhad-tour-popover-title {
                font-weight: 800;
                font-size: 15px;
                margin-bottom: 6px;
                color: #D4943A;
            }
            .anhad-tour-popover-text {
                font-size: 13px;
                line-height: 1.45;
                opacity: 0.9;
                margin-bottom: 14px;
            }
            .anhad-tour-popover-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .anhad-tour-popover-dots {
                display: flex;
                gap: 5px;
            }
            .anhad-tour-popover-dot {
                width: 5px;
                height: 5px;
                border-radius: 50%;
                background: rgba(0, 0, 0, 0.15);
                transition: all 0.3s ease;
            }
            html.dark-mode .anhad-tour-popover-dot,
            [data-theme="dark"] .anhad-tour-popover-dot {
                background: rgba(255, 255, 255, 0.15);
            }
            .anhad-tour-popover-dot.active {
                background: #D4943A;
                transform: scale(1.2);
            }
            .anhad-tour-popover-btn {
                border: none;
                background: linear-gradient(135deg, #D4943A 0%, #B8860B 100%);
                color: white;
                padding: 6px 12px;
                border-radius: 10px;
                font-weight: 700;
                font-size: 11.5px;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(212, 148, 58, 0.2);
                transition: all 0.3s ease;
            }
            .anhad-tour-popover-btn:active {
                transform: scale(0.95);
            }
            .anhad-tour-skip-btn {
                border: none;
                background: transparent;
                color: #8E8E93;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                padding: 4px;
                transition: color 0.2s ease;
            }
            .anhad-tour-skip-btn:hover {
                color: #D4943A;
            }
            .anhad-tour-tap-anywhere {
                position: fixed;
                bottom: calc(120px + env(safe-area-inset-bottom, 24px));
                left: 50%;
                transform: translateX(-50%);
                color: rgba(255, 255, 255, 0.85);
                text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
                font-size: 12px;
                font-weight: 600;
                letter-spacing: 0.5px;
                z-index: 1000000;
                pointer-events: none;
                animation: tourPulse 2s infinite;
                background: rgba(0, 0, 0, 0.4);
                padding: 6px 16px;
                border-radius: 14px;
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            @keyframes tourPulse {
                0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(0.98); }
                50% { opacity: 1; transform: translateX(-50%) scale(1.02); }
            }
            
            /* Highlight animation for targets */
            .anhad-tour-highlight-target {
                position: relative;
                z-index: 1000002 !important;
                pointer-events: none !important;
                box-shadow: 0 0 15px rgba(212, 148, 58, 0.6) !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize overlay layers
    function initOverlay() {
        overlay = document.createElement('div');
        overlay.className = 'anhad-tour-overlay';
        
        spotlight = document.createElement('div');
        spotlight.className = 'anhad-tour-spotlight';
        
        popover = document.createElement('div');
        popover.className = 'anhad-tour-popover';
        
        tapPrompt = document.createElement('div');
        tapPrompt.className = 'anhad-tour-tap-anywhere';
        tapPrompt.textContent = '👆 Tap anywhere to continue';
        
        document.body.appendChild(overlay);
        document.body.appendChild(spotlight);
        document.body.appendChild(popover);
        document.body.appendChild(tapPrompt);

        // Click overlay/anywhere to advance
        overlay.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            advanceTour();
        });
    }

    // Positions and displays the popover & spotlight
    function renderStep() {
        if (currentStepIndex >= steps.length) {
            endTour();
            return;
        }

        const step = steps[currentStepIndex];
        const element = document.querySelector(step.selector);

        // Fallback bounds if element not found or not visible
        let rect = { top: window.innerHeight / 2 - 50, left: window.innerWidth / 2 - 100, width: 200, height: 100 };
        
        if (element) {
            rect = element.getBoundingClientRect();
            // Remove previous active classes from targets
            document.querySelectorAll('.anhad-tour-highlight-target').forEach(el => {
                el.classList.remove('anhad-tour-highlight-target');
            });
            // Temporarily raise Z-index of highlighted target
            element.classList.add('anhad-tour-highlight-target');
        }

        // Apply spotlight with breathing room padding
        const padding = 8;
        const spotlightTop = rect.top + window.scrollY - padding;
        const spotlightLeft = rect.left + window.scrollX - padding;
        const spotlightWidth = rect.width + (padding * 2);
        const spotlightHeight = rect.height + (padding * 2);

        spotlight.style.top = `${spotlightTop}px`;
        spotlight.style.left = `${spotlightLeft}px`;
        spotlight.style.width = `${spotlightWidth}px`;
        spotlight.style.height = `${spotlightHeight}px`;

        // Configure popover content
        popover.innerHTML = `
            <div class="anhad-tour-popover-title">${step.title}</div>
            <div class="anhad-tour-popover-text">${step.text}</div>
            <div class="anhad-tour-popover-footer">
                <div class="anhad-tour-popover-dots">
                    ${steps.map((_, i) => `<span class="anhad-tour-popover-dot ${i === currentStepIndex ? 'active' : ''}"></span>`).join('')}
                </div>
                <div>
                    <button class="anhad-tour-skip-btn" id="tourSkipBtn">Skip</button>
                    <button class="anhad-tour-popover-btn" id="tourNextBtn">${currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}</button>
                </div>
            </div>
        `;

        // Arrow click handlers
        popover.querySelector('#tourSkipBtn').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            endTour();
        });

        popover.querySelector('#tourNextBtn').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            advanceTour();
        });

        // Position popover intelligently relative to spotlighted element
        popover.classList.remove('active');
        
        // Let browser repaint, then position and fade in
        setTimeout(() => {
            const popoverWidth = 280;
            const popoverHeight = popover.offsetHeight || 130;
            let popoverTop = 0;
            let popoverLeft = 0;

            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;

            if (step.position === 'bottom-left') {
                popoverTop = spotlightTop + spotlightHeight + 12;
                popoverLeft = Math.max(16, spotlightLeft);
            } else if (step.position === 'bottom-right') {
                popoverTop = spotlightTop + spotlightHeight + 12;
                popoverLeft = Math.min(screenWidth - popoverWidth - 16, spotlightLeft + spotlightWidth - popoverWidth);
            } else if (step.position === 'top-center') {
                popoverTop = spotlightTop - popoverHeight - 16;
                popoverLeft = (screenWidth - popoverWidth) / 2;
            } else { // Center/Fallback
                popoverTop = spotlightTop + spotlightHeight + 16;
                popoverLeft = (screenWidth - popoverWidth) / 2;
                // If it goes off screen bottom, place it above
                if (popoverTop + popoverHeight > screenHeight - 60) {
                    popoverTop = spotlightTop - popoverHeight - 16;
                }
            }

            // Boundary checks
            popoverTop = Math.max(16, Math.min(screenHeight - popoverHeight - 20, popoverTop));
            popoverLeft = Math.max(12, Math.min(screenWidth - popoverWidth - 12, popoverLeft));

            popover.style.top = `${popoverTop}px`;
            popover.style.left = `${popoverLeft}px`;
            popover.classList.add('active');
        }, 50);
    }

    function advanceTour() {
        currentStepIndex++;
        if (currentStepIndex >= steps.length) {
            endTour();
        } else {
            renderStep();
        }
    }

    function startTour() {
        console.log('🚀 Starting ANHAD Guided Onboarding Tour...');
        injectStyles();
        initOverlay();
        
        // Fade in overlay
        setTimeout(() => {
            overlay.classList.add('active');
            renderStep();
        }, 100);
    }

    function endTour() {
        console.log('🏁 Tour completed. Saving state...');
        localStorage.setItem(TOUR_KEY, 'true');
        
        // Fade out overlay
        if (overlay) overlay.classList.remove('active');
        if (popover) popover.classList.remove('active');
        if (tapPrompt) tapPrompt.style.opacity = '0';
        
        // Remove active target highlights
        document.querySelectorAll('.anhad-tour-highlight-target').forEach(el => {
            el.classList.remove('anhad-tour-highlight-target');
        });

        // Cleanup DOM after transitions
        setTimeout(() => {
            if (overlay) overlay.remove();
            if (spotlight) spotlight.remove();
            if (popover) popover.remove();
            if (tapPrompt) tapPrompt.remove();
            
            const style = document.getElementById('anhad-onboarding-styles');
            if (style) style.remove();
        }, 400);
    }

    // Auto-start only when DOM is loaded and after home page scripts settle
    window.addEventListener('DOMContentLoaded', () => {
        // Only run on the main home screen (index.html), not sub-pages
        const isMainPage = window.location.pathname.endsWith('index.html') || 
                           window.location.pathname.endsWith('/') || 
                           document.getElementById('guruSlider') !== null;
                           
        if (isMainPage) {
            setTimeout(startTour, 1200); // 1.2s delay for seamless intro
        }
    });

})();
