/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD Share Card Generator
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates beautiful shareable cards with Gurbani verses.
 * Uses Canvas API to create images that can be shared or downloaded.
 * 
 * Usage:
 *   AnhadShare.createCard({
 *     gurmukhi: 'ਵਾਹਿਗੁਰੂ',
 *     transliteration: 'Waheguru',
 *     translation: 'Wonderful Lord',
 *     source: 'Ang 1'
 *   }).then(imageUrl => {
 *     // Use the image URL
 *   });
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // CARD TEMPLATES
    // ═══════════════════════════════════════════════════════════════════════════

    const TEMPLATES = {
        golden: {
            name: 'Golden Divine',
            bg: ['#D4A03A', '#B8860B', '#8B6914'],
            textColor: '#FFFFFF',
            accentColor: 'rgba(255,255,255,0.3)'
        },
        midnight: {
            name: 'Midnight Blue',
            bg: ['#1E3A5F', '#0F2444', '#0A1929'],
            textColor: '#FFFFFF',
            accentColor: 'rgba(100,180,255,0.3)'
        },
        serenity: {
            name: 'Serenity',
            bg: ['#8B5CF6', '#7C3AED', '#5B21B6'],
            textColor: '#FFFFFF',
            accentColor: 'rgba(255,255,255,0.2)'
        },
        sunrise: {
            name: 'Sunrise',
            bg: ['#F97316', '#EA580C', '#C2410C'],
            textColor: '#FFFFFF',
            accentColor: 'rgba(255,255,255,0.3)'
        },
        nature: {
            name: 'Nature',
            bg: ['#22C55E', '#16A34A', '#15803D'],
            textColor: '#FFFFFF',
            accentColor: 'rgba(255,255,255,0.2)'
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // CANVAS CREATION
    // ═══════════════════════════════════════════════════════════════════════════

    async function createCard(options) {
        const {
            gurmukhi = '',
            transliteration = '',
            translation = '',
            source = '',
            template = 'golden',
            width = 1080,
            height = 1350
        } = options;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const tmpl = TEMPLATES[template] || TEMPLATES.golden;

        // Draw gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, tmpl.bg[0]);
        gradient.addColorStop(0.5, tmpl.bg[1]);
        gradient.addColorStop(1, tmpl.bg[2]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Draw decorative elements
        drawDecorations(ctx, width, height, tmpl);

        // Draw content
        await drawContent(ctx, {
            gurmukhi,
            transliteration,
            translation,
            source,
            width,
            height,
            tmpl
        });

        // Draw branding
        drawBranding(ctx, width, height, tmpl);

        return canvas.toDataURL('image/png');
    }

    function drawDecorations(ctx, width, height, tmpl) {
        // Top-right decorative circle
        ctx.fillStyle = tmpl.accentColor;
        ctx.beginPath();
        ctx.arc(width - 80, 120, 180, 0, Math.PI * 2);
        ctx.fill();

        // Bottom-left decorative circle
        ctx.beginPath();
        ctx.arc(100, height - 150, 200, 0, Math.PI * 2);
        ctx.fill();

        // Subtle pattern overlay
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.arc(
                Math.random() * width,
                Math.random() * height,
                Math.random() * 50 + 20,
                0, Math.PI * 2
            );
            ctx.fill();
        }

        // Top border design
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(80, 80);
        ctx.lineTo(width - 80, 80);
        ctx.stroke();

        // Bottom border design
        ctx.beginPath();
        ctx.moveTo(80, height - 80);
        ctx.lineTo(width - 80, height - 80);
        ctx.stroke();
    }

    async function drawContent(ctx, options) {
        const { gurmukhi, transliteration, translation, source, width, height, tmpl } = options;
        const centerX = width / 2;

        let yPos = 280;

        // ੴ Symbol at top
        ctx.fillStyle = tmpl.textColor;
        ctx.font = 'bold 60px "Noto Sans Gurmukhi", serif';
        ctx.textAlign = 'center';
        ctx.fillText('ੴ', centerX, yPos);

        yPos += 120;

        // Gurmukhi text
        if (gurmukhi) {
            ctx.font = 'bold 52px "Noto Sans Gurmukhi", serif';
            ctx.fillStyle = tmpl.textColor;

            // Word wrap for long text
            const lines = wrapText(ctx, gurmukhi, width - 160);
            lines.forEach(line => {
                ctx.fillText(line, centerX, yPos);
                yPos += 70;
            });
        }

        yPos += 40;

        // Transliteration
        if (transliteration) {
            ctx.font = 'italic 32px Inter, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            const lines = wrapText(ctx, transliteration, width - 160);
            lines.forEach(line => {
                ctx.fillText(line, centerX, yPos);
                yPos += 45;
            });
        }

        yPos += 30;

        // Divider
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - 100, yPos);
        ctx.lineTo(centerX + 100, yPos);
        ctx.stroke();

        yPos += 50;

        // Translation
        if (translation) {
            ctx.font = '28px Inter, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            const lines = wrapText(ctx, translation, width - 180);
            lines.forEach(line => {
                ctx.fillText(line, centerX, yPos);
                yPos += 40;
            });
        }

        yPos += 40;

        // Source
        if (source) {
            ctx.font = '24px Inter, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fillText(`— ${source} —`, centerX, yPos);
        }
    }

    function drawBranding(ctx, width, height, tmpl) {
        const bottomY = height - 100;
        const centerX = width / 2;

        // Khanda symbol placeholder (circle)
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.arc(centerX, bottomY - 30, 25, 0, Math.PI * 2);
        ctx.fill();

        // App name
        ctx.font = 'bold 28px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.textAlign = 'center';
        ctx.fillText('ANHAD', centerX, bottomY + 20);

        // Tagline
        ctx.font = '18px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText('Divine Gurbani Experience', centerX, bottomY + 48);
    }

    function wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SHARE FUNCTIONALITY
    // ═══════════════════════════════════════════════════════════════════════════

    async function share(options) {
        const imageUrl = await createCard(options);

        // Convert data URL to blob
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'gurbani-shabad.png', { type: 'image/png' });

        // Check if Web Share API is available
        if (navigator.share && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'Gurbani from ANHAD',
                    text: options.translation || 'Divine wisdom from Guru Granth Sahib'
                });
                return { success: true, method: 'native' };
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            }
        }

        // Fallback: Download image
        return download(imageUrl, 'gurbani-shabad.png');
    }

    function download(imageUrl, filename = 'gurbani-shabad.png') {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return { success: true, method: 'download' };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PREVIEW MODAL
    // ═══════════════════════════════════════════════════════════════════════════

    function showPreview(options) {
        return new Promise(async (resolve) => {
            const imageUrl = await createCard(options);

            // Create modal
            const modal = document.createElement('div');
            modal.id = 'anhadShareModal';
            modal.innerHTML = `
                <style>
                    #anhadShareModal {
                        position: fixed;
                        inset: 0;
                        z-index: 10000;
                        background: rgba(0,0,0,0.8);
                        backdrop-filter: blur(10px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                        animation: fadeIn 0.3s ease;
                    }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    .share-modal__content {
                        max-width: 360px;
                        width: 100%;
                        background: white;
                        border-radius: 24px;
                        overflow: hidden;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                        animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                    }
                    @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
                    .share-modal__preview {
                        width: 100%;
                        aspect-ratio: 4/5;
                        object-fit: cover;
                    }
                    .share-modal__actions {
                        padding: 20px;
                        display: flex;
                        gap: 12px;
                    }
                    .share-modal__btn {
                        flex: 1;
                        padding: 14px;
                        border: none;
                        border-radius: 14px;
                        font-size: 15px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    .share-modal__btn--share {
                        background: linear-gradient(135deg, #D4A03A, #B8860B);
                        color: white;
                    }
                    .share-modal__btn--cancel {
                        background: #f1f1f1;
                        color: #666;
                    }
                    .share-modal__btn:active { transform: scale(0.95); }
                </style>
                <div class="share-modal__content">
                    <img class="share-modal__preview" src="${imageUrl}" alt="Share Preview">
                    <div class="share-modal__actions">
                        <button class="share-modal__btn share-modal__btn--cancel" id="cancelShare">Cancel</button>
                        <button class="share-modal__btn share-modal__btn--share" id="confirmShare">
                            <i class="fas fa-share"></i> Share
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Click outside to close
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    resolve({ cancelled: true });
                }
            });

            // Cancel button
            document.getElementById('cancelShare').addEventListener('click', () => {
                modal.remove();
                resolve({ cancelled: true });
            });

            // Share button
            document.getElementById('confirmShare').addEventListener('click', async () => {
                const result = await share(options);
                modal.remove();
                resolve(result);
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EXPOSE API
    // ═══════════════════════════════════════════════════════════════════════════

    window.AnhadShare = {
        createCard,
        share,
        download,
        showPreview,
        TEMPLATES: Object.keys(TEMPLATES)
    };

    console.log('📤 ANHAD Share Card Generator loaded');
})();
