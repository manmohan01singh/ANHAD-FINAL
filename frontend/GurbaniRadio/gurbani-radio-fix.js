/* ═══════════════════════════════════════════════════════════════════════════════
   GURBANI RADIO - CRITICAL FIXES
   1. Cache busting and force reload
   2. Footer button functionality
   ═══════════════════════════════════════════════════════════════════════════════ */

(function() {
    'use strict';

    // ═══ CACHE BUSTING ═══
    // Force clear cache on load
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => {
                if (name.includes('gurbani-radio')) {
                    caches.delete(name);
                }
            });
        });
    }

    // Clear localStorage cache flags
    const cacheKeys = Object.keys(localStorage).filter(key => 
        key.includes('gurbani-radio') || key.includes('radio-cache')
    );
    cacheKeys.forEach(key => localStorage.removeItem(key));

    // Set version to force reload
    const CURRENT_VERSION = '2.0.1';
    const storedVersion = localStorage.getItem('gurbani-radio-version');
    
    if (storedVersion !== CURRENT_VERSION) {
        console.log('🔄 New version detected, clearing cache...');
        localStorage.setItem('gurbani-radio-version', CURRENT_VERSION);
        
        // Force hard reload once
        if (!sessionStorage.getItem('radio-reloaded')) {
            sessionStorage.setItem('radio-reloaded', 'true');
            window.location.reload(true);
        }
    }

    // ═══ FOOTER BUTTON FUNCTIONALITY ═══
    document.addEventListener('DOMContentLoaded', function() {
        
        // Get button elements
        const favBtn = document.getElementById('favBtn');
        const shareBtn = document.getElementById('shareBtn');
        const playlistBtn = document.getElementById('playlistBtn');

        if (!favBtn || !shareBtn || !playlistBtn) {
            console.error('❌ Footer buttons not found');
            return;
        }

        console.log('✅ Footer buttons initialized');

        // ═══ FAVORITE BUTTON ═══
        let isFavorited = localStorage.getItem('gurbani-radio-favorited') === 'true';
        
        function updateFavoriteUI() {
            const icon = favBtn.querySelector('i');
            if (isFavorited) {
                icon.className = 'fas fa-heart';
                favBtn.classList.add('active');
            } else {
                icon.className = 'far fa-heart';
                favBtn.classList.remove('active');
            }
        }
        
        updateFavoriteUI();

        favBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            isFavorited = !isFavorited;
            localStorage.setItem('gurbani-radio-favorited', isFavorited);
            updateFavoriteUI();
            
            // Show feedback
            showToast(isFavorited ? '❤️ Added to favorites' : '💔 Removed from favorites');
            
            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        });

        // ═══ SHARE BUTTON ═══
        shareBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const shareData = {
                title: 'Gurbani Radio | ANHAD',
                text: 'Listen to Live Kirtan from Sri Darbar Sahib and Amritvela Kirtan 24/7',
                url: window.location.href
            };

            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                    showToast('✅ Shared successfully');
                } else {
                    // Fallback: Copy to clipboard
                    await navigator.clipboard.writeText(window.location.href);
                    showToast('📋 Link copied to clipboard');
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Share failed:', err);
                    // Fallback: Copy to clipboard
                    try {
                        await navigator.clipboard.writeText(window.location.href);
                        showToast('📋 Link copied to clipboard');
                    } catch (clipErr) {
                        showToast('❌ Share failed');
                    }
                }
            }
            
            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        });

        // ═══ PLAYLIST BUTTON ═══
        playlistBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Toggle playlist view
            playlistBtn.classList.toggle('active');
            
            // Show playlist modal (you can customize this)
            showPlaylistModal();
            
            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        });

        // ═══ HELPER FUNCTIONS ═══
        function showToast(message) {
            // Remove existing toast
            const existingToast = document.querySelector('.action-toast');
            if (existingToast) {
                existingToast.remove();
            }

            // Create toast
            const toast = document.createElement('div');
            toast.className = 'action-toast';
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%) translateY(20px);
                padding: 12px 24px;
                background: rgba(0, 0, 0, 0.9);
                backdrop-filter: blur(20px);
                color: white;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                z-index: 10000;
                opacity: 0;
                transition: all 0.3s ease;
                pointer-events: none;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
            `;
            
            document.body.appendChild(toast);
            
            // Animate in
            setTimeout(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateX(-50%) translateY(0)';
            }, 10);
            
            // Animate out
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(-50%) translateY(20px)';
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        }

        function showPlaylistModal() {
            // Remove existing modal
            const existingModal = document.querySelector('.playlist-modal');
            if (existingModal) {
                existingModal.remove();
                playlistBtn.classList.remove('active');
                return;
            }

            // Create modal
            const modal = document.createElement('div');
            modal.className = 'playlist-modal';
            modal.innerHTML = `
                <div class="playlist-overlay"></div>
                <div class="playlist-content">
                    <div class="playlist-header">
                        <h3>🎵 Playlist</h3>
                        <button class="playlist-close">✕</button>
                    </div>
                    <div class="playlist-body">
                        <div class="playlist-item active">
                            <i class="fas fa-broadcast-tower"></i>
                            <div>
                                <div class="playlist-title">Darbar Sahib Live</div>
                                <div class="playlist-subtitle">Sri Harmandir Sahib Ji</div>
                            </div>
                            <i class="fas fa-play-circle"></i>
                        </div>
                        <div class="playlist-item">
                            <i class="fas fa-moon"></i>
                            <div>
                                <div class="playlist-title">Amritvela Kirtan</div>
                                <div class="playlist-subtitle">24/7 Peaceful Kirtan</div>
                            </div>
                            <i class="fas fa-play-circle"></i>
                        </div>
                    </div>
                </div>
            `;
            
            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .playlist-modal {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    display: flex;
                    align-items: flex-end;
                    animation: modalFadeIn 0.3s ease;
                }
                
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .playlist-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(10px);
                }
                
                .playlist-content {
                    position: relative;
                    width: 100%;
                    max-width: 500px;
                    margin: 0 auto;
                    background: var(--bg-elevated);
                    border-radius: 24px 24px 0 0;
                    padding: 24px;
                    animation: modalSlideUp 0.3s ease;
                    box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.5);
                }
                
                @keyframes modalSlideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                
                .playlist-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                
                .playlist-header h3 {
                    font-size: 20px;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0;
                }
                
                .playlist-close {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border: none;
                    background: var(--surface-1);
                    color: var(--text-secondary);
                    font-size: 20px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                
                .playlist-close:active {
                    transform: scale(0.9);
                }
                
                .playlist-body {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .playlist-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px;
                    background: var(--surface-1);
                    border-radius: 16px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .playlist-item:active {
                    transform: scale(0.98);
                }
                
                .playlist-item.active {
                    background: linear-gradient(145deg, var(--gold-primary), var(--gold-dark));
                    color: var(--bg-dark);
                }
                
                .playlist-item > i:first-child {
                    font-size: 24px;
                    width: 40px;
                    text-align: center;
                }
                
                .playlist-item > div {
                    flex: 1;
                }
                
                .playlist-title {
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                
                .playlist-subtitle {
                    font-size: 13px;
                    opacity: 0.7;
                }
                
                .playlist-item > i:last-child {
                    font-size: 24px;
                    opacity: 0.5;
                }
            `;
            document.head.appendChild(style);
            
            document.body.appendChild(modal);
            
            // Close handlers
            const closeBtn = modal.querySelector('.playlist-close');
            const overlay = modal.querySelector('.playlist-overlay');
            
            function closeModal() {
                modal.style.animation = 'modalFadeOut 0.3s ease';
                setTimeout(() => {
                    modal.remove();
                    playlistBtn.classList.remove('active');
                }, 300);
            }
            
            closeBtn.addEventListener('click', closeModal);
            overlay.addEventListener('click', closeModal);
            
            // Playlist item clicks
            const items = modal.querySelectorAll('.playlist-item');
            items.forEach((item, index) => {
                item.addEventListener('click', function() {
                    // Switch stream based on selection
                    const streamBtns = document.querySelectorAll('.stream-btn');
                    if (streamBtns[index]) {
                        streamBtns[index].click();
                    }
                    closeModal();
                });
            });
        }

        // ═══ ENSURE BUTTONS ARE VISIBLE ═══
        // Force visibility check
        setTimeout(() => {
            const footerActions = document.querySelector('.footer-actions');
            if (footerActions) {
                footerActions.style.display = 'flex';
                footerActions.style.visibility = 'visible';
                footerActions.style.opacity = '1';
                console.log('✅ Footer actions visibility ensured');
            }
        }, 100);
    });

    // ═══ PREVENT CACHE ON PAGE NAVIGATION ═══
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            console.log('🔄 Page restored from cache, reloading...');
            window.location.reload();
        }
    });

    // ═══ META TAG FOR CACHE CONTROL ═══
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Cache-Control';
    meta.content = 'no-cache, no-store, must-revalidate';
    document.head.appendChild(meta);

    const pragma = document.createElement('meta');
    pragma.httpEquiv = 'Pragma';
    pragma.content = 'no-cache';
    document.head.appendChild(pragma);

    const expires = document.createElement('meta');
    expires.httpEquiv = 'Expires';
    expires.content = '0';
    document.head.appendChild(expires);

    console.log('✅ Gurbani Radio fixes loaded');
})();
