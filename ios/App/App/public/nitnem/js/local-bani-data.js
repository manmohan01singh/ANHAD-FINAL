/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LOCAL BANI DATA - Fallback for missing API content
 * Note: Sarbloh Granth Banis (IDs 201-205) now use PDF viewer instead
 * PDF Viewer: pdf-viewer.html
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const LocalBaniData = {
    // Sarbloh Granth Banis are now served via PDF viewer
    // See: frontend/nitnem/pdf-viewer.html
    // PDF Source: https://www.vidhia.com/Bani/Complete-Sri-Sarbloh-Granth-Sahib-Ji-Steek.pdf
    
    // Placeholder for future local Banis if needed
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocalBaniData;
}
