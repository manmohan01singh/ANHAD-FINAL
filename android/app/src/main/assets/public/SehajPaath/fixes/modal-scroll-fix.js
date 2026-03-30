/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MODAL SCROLL FIX - Prevents Settings Panel Freeze
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Problem: When opening the settings modal, the screen freezes and users cannot:
 * - Scroll inside the settings panel
 * - Interact with any settings
 * - Close the panel
 * 
 * Root Causes:
 * 1. Body scroll lock not properly handling modal content scroll
 * 2. Missing touch-action CSS properties
 * 3. Passive event listener issues
 */

class ModalScrollFix {
    constructor() {
        this.scrollPosition = 0;
        this.bodyLocked = false;
        this.init();
    }

    init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Apply fixes to all modals
        this.fixAllModals();

        // Observe for dynamically added modals
        this.observeModals();

        console.log('✅ Modal scroll fix initialized');
    }

    fixAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => this.fixModal(modal));
    }

    fixModal(modal) {
        if (!modal) return;

        const modalBody = modal.querySelector('.modal-body');
        const modalContent = modal.querySelector('.modal-content');

        // Fix modal body scroll
        if (modalBody) {
            // Allow touch scroll inside modal body
            modalBody.addEventListener('touchmove', (e) => {
                e.stopPropagation(); // Stop propagation but DON'T prevent default
            }, { passive: true });

            // Handle scroll boundaries
            modalBody.addEventListener('touchstart', (e) => {
                this.handleTouchStart(e, modalBody);
            }, { passive: true });
        }

        // Add open/close observers
        this.observeModalState(modal);
    }

    handleTouchStart(e, scrollableElement) {
        // Store initial scroll position for boundary detection
        scrollableElement._scrollTop = scrollableElement.scrollTop;
        scrollableElement._scrollHeight = scrollableElement.scrollHeight;
        scrollableElement._clientHeight = scrollableElement.clientHeight;
        scrollableElement._startY = e.touches[0].clientY;
    }

    observeModalState(modal) {
        // Create mutation observer for class changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (modal.classList.contains('active')) {
                        this.onModalOpen(modal);
                    } else {
                        this.onModalClose();
                    }
                }
            });
        });

        observer.observe(modal, { attributes: true });
    }

    onModalOpen(modal) {
        // Save scroll position
        this.scrollPosition = window.scrollY || window.pageYOffset;

        // Lock body
        document.body.style.position = 'fixed';
        document.body.style.top = `-${this.scrollPosition}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
        this.bodyLocked = true;

        // Ensure modal body can scroll
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.scrollTop = 0;
        }

        console.log('📱 Modal opened, body locked');
    }

    onModalClose() {
        if (!this.bodyLocked) return;

        // Restore body
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');

        // Restore scroll position
        window.scrollTo(0, this.scrollPosition);
        this.bodyLocked = false;

        console.log('📱 Modal closed, body unlocked');
    }

    observeModals() {
        // Watch for new modals being added
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.classList && node.classList.contains('modal')) {
                            this.fixModal(node);
                        }
                        // Also check children
                        const modals = node.querySelectorAll ? node.querySelectorAll('.modal') : [];
                        modals.forEach(modal => this.fixModal(modal));
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }
}

// Enhanced Modal Management - Override default behavior
(function () {
    'use strict';

    // Store original functions if they exist
    const originalOpenModal = window.openModal;
    const originalCloseModal = window.closeAllModals || window.closeModal;

    // Create enhanced open modal function
    window.openModalSafe = function (modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // Save scroll position BEFORE modifying body
        const scrollPos = window.scrollY || window.pageYOffset;
        modal._savedScrollPosition = scrollPos;

        // Add active class
        modal.classList.add('active');

        // Lock body scroll properly
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollPos}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');

        // Focus the modal for accessibility
        const firstFocusable = modal.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            setTimeout(() => firstFocusable.focus(), 100);
        }
    };

    window.closeModalSafe = function (modalId) {
        const modal = modalId ? document.getElementById(modalId) : document.querySelector('.modal.active');
        if (!modal) return;

        const scrollPos = modal._savedScrollPosition || 0;

        // Remove active class
        modal.classList.remove('active');

        // Restore body scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');

        // Restore scroll position
        window.scrollTo(0, scrollPos);
    };

    window.closeAllModalsSafe = function () {
        document.querySelectorAll('.modal.active').forEach(modal => {
            const scrollPos = modal._savedScrollPosition || 0;
            modal.classList.remove('active');
        });

        // Restore body
        const lastModal = document.querySelector('.modal');
        const scrollPos = lastModal ? (lastModal._savedScrollPosition || 0) : 0;

        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');

        window.scrollTo(0, scrollPos);
    };
})();

// Initialize the fix
window.modalScrollFix = new ModalScrollFix();
