/**
 * Text Formatter Utility for Gurbani
 */

class TextFormatter {
    /**
     * Convert Padchhed to Larivaar
     */
    static toLarivaar(text) {
        return text.replace(/\s+/g, '');
    }

    /**
     * Convert Larivaar to Padchhed (with word breaks)
     */
    static toPadchhed(text) {
        // This is a simplified version - proper Padchhed requires dictionary lookup
        return text;
    }

    /**
     * Highlight search term in text
     */
    static highlight(text, term) {
        if (!term) return text;
        const regex = new RegExp(`(${term})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    /**
     * Remove special characters for comparison
     */
    static normalize(text) {
        return text.replace(/[॥।,.\s]/g, '').toLowerCase();
    }

    /**
     * Format line number
     */
    static formatLineNumber(num) {
        return String(num).padStart(3, '0');
    }

    /**
     * Convert Gurmukhi numerals to Western
     */
    static gurmukhiToWestern(text) {
        const gurmukhiNumerals = '੦੧੨੩੪੫੬੭੮੯';
        const westernNumerals = '0123456789';

        return text.split('').map(char => {
            const idx = gurmukhiNumerals.indexOf(char);
            return idx >= 0 ? westernNumerals[idx] : char;
        }).join('');
    }

    /**
     * Convert Western numerals to Gurmukhi
     */
    static westernToGurmukhi(num) {
        const gurmukhiNumerals = '੦੧੨੩੪੫੬੭੮੯';
        return String(num).split('').map(char => {
            const idx = parseInt(char);
            return !isNaN(idx) ? gurmukhiNumerals[idx] : char;
        }).join('');
    }

    /**
     * Truncate text with ellipsis
     */
    static truncate(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    /**
     * Get first letter of each word for search
     */
    static getFirstLetters(text) {
        return text.split(/\s+/).map(word => word.charAt(0)).join('');
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextFormatter;
}
