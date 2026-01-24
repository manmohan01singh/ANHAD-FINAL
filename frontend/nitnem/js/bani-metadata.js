/**
 * Bani Metadata - Proper Structure Mapping
 * Prevents wrong labels like "Chhant" or "Savaiyya" on Japji Sahib
 * @version 2.1.0
 */

const BaniMetadata = {
    // ═══════════════════════════════════════════════════════════════
    // NITNEM BANIS
    // ═══════════════════════════════════════════════════════════════
    2: {
        id: 2,
        nameGurmukhi: 'ਜਪੁਜੀ ਸਾਹਿਬ',
        nameEnglish: 'Japji Sahib',
        author: 'ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ',
        authorEnglish: 'Guru Nanak Dev Ji',
        source: 'sggs',
        category: 'nitnem',
        subcategory: 'morning',
        structure: 'pauri',           // Display as "Pauri X of 38"
        totalUnits: 38,
        hideVerseType: true,          // DON'T show Chhant/Savaiyya - WRONG!
        estimatedTime: '18-22 min',
        description: 'The cornerstone of Sikh morning prayers',
        icon: '☀️'
    },

    4: {
        id: 4,
        nameGurmukhi: 'ਜਾਪੁ ਸਾਹਿਬ',
        nameEnglish: 'Jaap Sahib',
        author: 'ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ',
        authorEnglish: 'Guru Gobind Singh Ji',
        source: 'dasam',
        category: 'nitnem',
        subcategory: 'morning',
        structure: 'verse',           // Display as "Verse X of 199"
        totalUnits: 199,
        showChhandType: true,         // OK to show Chhand names here
        estimatedTime: '15-18 min',
        description: 'Praise of the Almighty with 199 divine names',
        icon: '⚔️'
    },

    6: {
        id: 6,
        nameGurmukhi: 'ਤ੍ਵ ਪ੍ਰਸਾਦਿ ਸਵੱਯੇ',
        nameEnglish: 'Tav Prasad Savaiye',
        author: 'ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ',
        authorEnglish: 'Guru Gobind Singh Ji',
        source: 'dasam',
        category: 'nitnem',
        subcategory: 'morning',
        structure: 'savaiya',         // Display as "Savaiya X of 10"
        totalUnits: 10,
        hideVerseType: true,
        estimatedTime: '4-5 min',
        description: 'Ten Savaiye rejecting ritualism',
        icon: '🙏'
    },

    7: {
        id: 7,
        nameGurmukhi: 'ਤ੍ਵ ਪ੍ਰਸਾਦਿ ਸਵੱਯੇ (ਦੀਨਨ ਕੀ)',
        nameEnglish: 'Tav Prasad Savaiye (Deenan Ki)',
        author: 'ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ',
        authorEnglish: 'Guru Gobind Singh Ji',
        source: 'dasam',
        category: 'nitnem',
        subcategory: 'morning',
        structure: 'savaiya',
        totalUnits: 10,
        hideVerseType: true,
        estimatedTime: '3-4 min',
        icon: '🙏'
    },

    9: {
        id: 9,
        nameGurmukhi: 'ਚੌਪਈ ਸਾਹਿਬ',
        nameEnglish: 'Chaupai Sahib',
        author: 'ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ',
        authorEnglish: 'Guru Gobind Singh Ji',
        source: 'dasam',
        category: 'nitnem',
        subcategory: 'morning',
        structure: 'verse',
        totalUnits: 27,
        hideVerseType: true,
        estimatedTime: '5-7 min',
        description: 'Prayer for divine protection',
        icon: '📿'
    },

    10: {
        id: 10,
        nameGurmukhi: 'ਅਨੰਦੁ ਸਾਹਿਬ',
        nameEnglish: 'Anand Sahib',
        author: 'ਗੁਰੂ ਅਮਰਦਾਸ ਜੀ',
        authorEnglish: 'Guru Amar Das Ji',
        source: 'sggs',
        category: 'nitnem',
        subcategory: 'morning',
        structure: 'pauri',
        totalUnits: 40,
        hideVerseType: true,
        estimatedTime: '12-15 min',
        description: 'The Song of Bliss',
        icon: '🎵'
    },

    21: {
        id: 21,
        nameGurmukhi: 'ਰਹਰਾਸਿ ਸਾਹਿਬ',
        nameEnglish: 'Rehras Sahib',
        author: 'ਸਮੂਹਿਕ',
        authorEnglish: 'Multiple Gurus',
        source: 'sggs',
        category: 'nitnem',
        subcategory: 'evening',
        structure: 'verse',
        hideVerseType: true,
        estimatedTime: '18-22 min',
        description: 'Evening prayer for gratitude',
        icon: '🌅'
    },

    23: {
        id: 23,
        nameGurmukhi: 'ਸੋਹਿਲਾ ਸਾਹਿਬ',
        nameEnglish: 'Sohila Sahib',
        author: 'ਸਮੂਹਿਕ',
        authorEnglish: 'Multiple Gurus',
        source: 'sggs',
        category: 'nitnem',
        subcategory: 'night',
        structure: 'shabad',
        totalUnits: 5,
        hideVerseType: true,
        estimatedTime: '5-7 min',
        description: 'Bedtime prayer for peaceful rest',
        icon: '🌙'
    },

    // ═══════════════════════════════════════════════════════════════
    // SGGS POPULAR BANIS
    // ═══════════════════════════════════════════════════════════════
    31: {
        id: 31,
        nameGurmukhi: 'ਸੁਖਮਨੀ ਸਾਹਿਬ',
        nameEnglish: 'Sukhmani Sahib',
        author: 'ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ',
        authorEnglish: 'Guru Arjan Dev Ji',
        source: 'sggs',
        category: 'sggs',
        structure: 'ashtpadi',        // Display as "Ashtpadi X of 24"
        totalUnits: 24,
        showSalok: true,              // Show "Salok" before each Ashtpadi
        hideVerseType: true,
        estimatedTime: '90-120 min',
        description: 'The Psalm of Peace - 24 sections of 8 verses each',
        icon: '🕊️'
    },

    36: {
        id: 36,
        nameGurmukhi: 'ਦੁਖ ਭੰਜਨੀ ਸਾਹਿਬ',
        nameEnglish: 'Dukh Bhanjani Sahib',
        author: 'ਸਮੂਹਿਕ',
        authorEnglish: 'Multiple Authors',
        source: 'sggs',
        category: 'sggs',
        structure: 'shabad',
        hideVerseType: true,
        estimatedTime: '25-30 min',
        description: 'Collection of Shabads for healing',
        icon: '💚'
    },

    90: {
        id: 90,
        nameGurmukhi: 'ਆਸਾ ਦੀ ਵਾਰ',
        nameEnglish: 'Asa Di Vaar',
        author: 'ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ',
        authorEnglish: 'Guru Nanak Dev Ji',
        source: 'sggs',
        category: 'sggs',
        structure: 'pauri',
        totalUnits: 24,
        hideVerseType: true,
        estimatedTime: '45-60 min',
        description: 'The morning ballad in Raag Asa',
        icon: '🌄'
    },

    27: {
        id: 27,
        nameGurmukhi: 'ਬਾਰਹ ਮਾਹਾ',
        nameEnglish: 'Barah Maha',
        author: 'ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ',
        authorEnglish: 'Guru Arjan Dev Ji',
        source: 'sggs',
        category: 'sggs',
        structure: 'month',
        totalUnits: 12,
        hideVerseType: true,
        estimatedTime: '20-25 min',
        description: 'Spiritual journey through 12 months',
        icon: '📅'
    },

    30: {
        id: 30,
        nameGurmukhi: 'ਸਲੋਕ ਮਹਲਾ ੯',
        nameEnglish: 'Salok Mahalla 9',
        author: 'ਗੁਰੂ ਤੇਗ ਬਹਾਦੁਰ ਜੀ',
        authorEnglish: 'Guru Tegh Bahadur Ji',
        source: 'sggs',
        category: 'sggs',
        structure: 'salok',
        totalUnits: 57,
        hideVerseType: true,
        estimatedTime: '12-15 min',
        description: 'Wisdom verses on detachment',
        icon: '📿'
    },

    33: {
        id: 33,
        nameGurmukhi: 'ਬਾਵਨ ਅਖਰੀ',
        nameEnglish: 'Bavan Akhri',
        author: 'ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ',
        authorEnglish: 'Guru Arjan Dev Ji',
        source: 'sggs',
        category: 'sggs',
        structure: 'verse',
        hideVerseType: true,
        estimatedTime: '25-30 min',
        description: '52 verses on the alphabet',
        icon: '📖'
    },

    34: {
        id: 34,
        nameGurmukhi: 'ਸਿਧ ਗੋਸਟਿ',
        nameEnglish: 'Sidh Gosht',
        author: 'ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ',
        authorEnglish: 'Guru Nanak Dev Ji',
        source: 'sggs',
        category: 'sggs',
        structure: 'verse',
        hideVerseType: true,
        estimatedTime: '30-40 min',
        description: 'Discourse with the Yogis',
        icon: '🧘'
    },

    22: {
        id: 22,
        nameGurmukhi: 'ਆਰਤੀ',
        nameEnglish: 'Aarti',
        author: 'ਸਮੂਹਿਕ',
        authorEnglish: 'Multiple Authors',
        source: 'sggs',
        category: 'sggs',
        structure: 'shabad',
        hideVerseType: true,
        estimatedTime: '8-10 min',
        icon: '🪔'
    },

    3: {
        id: 3,
        nameGurmukhi: 'ਸ਼ਬਦ ਹਜ਼ਾਰੇ',
        nameEnglish: 'Shabad Hazare',
        author: 'ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ',
        authorEnglish: 'Guru Arjan Dev Ji',
        source: 'sggs',
        category: 'sggs',
        structure: 'shabad',
        hideVerseType: true,
        estimatedTime: '10-12 min',
        icon: '💎'
    },

    // ═══════════════════════════════════════════════════════════════
    // DASAM GRANTH BANIS
    // ═══════════════════════════════════════════════════════════════
    29: {
        id: 29,
        nameGurmukhi: 'ਅਕਾਲ ਉਸਤਤ',
        nameEnglish: 'Akal Ustat',
        author: 'ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ',
        authorEnglish: 'Guru Gobind Singh Ji',
        source: 'dasam',
        category: 'dasam',
        structure: 'verse',
        showChhandType: true,
        estimatedTime: '60-90 min',
        description: 'Praise of the Timeless One',
        icon: '⚔️'
    },

    13: {
        id: 13,
        nameGurmukhi: 'ਚੰਡੀ ਦੀ ਵਾਰ',
        nameEnglish: 'Chandi Di Vaar',
        author: 'ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ',
        authorEnglish: 'Guru Gobind Singh Ji',
        source: 'dasam',
        category: 'dasam',
        structure: 'pauri',
        showChhandType: true,
        estimatedTime: '30-40 min',
        description: 'Ballad of the Divine Mother',
        icon: '🗡️'
    },

    5: {
        id: 5,
        nameGurmukhi: 'ਸ਼ਬਦ ਹਜ਼ਾਰੇ ਪਾਤਿਸ਼ਾਹੀ ੧੦',
        nameEnglish: 'Shabad Hazare Patshahi 10',
        author: 'ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ',
        authorEnglish: 'Guru Gobind Singh Ji',
        source: 'dasam',
        category: 'dasam',
        structure: 'shabad',
        hideVerseType: true,
        estimatedTime: '10-12 min',
        icon: '💎'
    },

    // ═══════════════════════════════════════════════════════════════
    // OTHER
    // ═══════════════════════════════════════════════════════════════
    24: {
        id: 24,
        nameGurmukhi: 'ਅਰਦਾਸ',
        nameEnglish: 'Ardas',
        author: 'ਖ਼ਾਲਸਾ ਪੰਥ',
        authorEnglish: 'Khalsa Panth',
        source: 'tradition',
        category: 'other',
        structure: 'verse',
        hideVerseType: true,
        estimatedTime: '5-7 min',
        description: 'The Sikh Prayer',
        icon: '🙏'
    }
};

// ═══════════════════════════════════════════════════════════════
// CATEGORY DEFINITIONS
// ═══════════════════════════════════════════════════════════════
const BaniCategories = {
    nitnem: {
        id: 'nitnem',
        nameGurmukhi: 'ਨਿਤਨੇਮ',
        nameEnglish: 'Nitnem',
        description: 'Daily Prayers',
        icon: '📿',
        subcategories: {
            morning: {
                nameGurmukhi: 'ਅੰਮ੍ਰਿਤ ਵੇਲਾ',
                nameEnglish: 'Morning',
                icon: '🌅',
                banis: [2, 4, 6, 7, 9, 10]
            },
            evening: {
                nameGurmukhi: 'ਸੰਧਿਆ',
                nameEnglish: 'Evening',
                icon: '🌆',
                banis: [21]
            },
            night: {
                nameGurmukhi: 'ਰਾਤ',
                nameEnglish: 'Night',
                icon: '🌙',
                banis: [23]
            }
        }
    },

    sggs: {
        id: 'sggs',
        nameGurmukhi: 'ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ',
        nameEnglish: 'Sri Guru Granth Sahib Ji',
        description: '1430 Ang, The Eternal Guru',
        icon: '📕',
        popular: [31, 36, 90, 27, 3, 22],
        all: [2, 3, 10, 21, 22, 23, 27, 30, 31, 33, 34, 35, 36, 90]
    },

    dasam: {
        id: 'dasam',
        nameGurmukhi: 'ਸ੍ਰੀ ਦਸਮ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ',
        nameEnglish: 'Sri Dasam Granth Sahib Ji',
        description: 'Compositions of Guru Gobind Singh Ji',
        icon: '📗',
        nitnemBanis: [4, 6, 7, 9],
        all: [4, 5, 6, 7, 8, 9, 12, 13, 19, 28, 29, 53]
    }
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get metadata for a Bani by ID
 */
function getBaniMeta(baniId) {
    return BaniMetadata[baniId] || null;
}

/**
 * Should we show verse type labels for this Bani?
 */
function shouldShowVerseType(baniId) {
    const meta = BaniMetadata[baniId];
    if (!meta) return false;
    return meta.showChhandType === true && meta.hideVerseType !== true;
}

/**
 * Get the correct unit label for this Bani
 * Returns: "Pauri", "Verse", "Ashtpadi", "Savaiya", etc.
 */
function getUnitLabel(baniId) {
    const meta = BaniMetadata[baniId];
    if (!meta) return 'Verse';

    const labels = {
        'pauri': 'Pauri',
        'verse': 'Verse',
        'ashtpadi': 'Ashtpadi',
        'savaiya': 'Savaiya',
        'salok': 'Salok',
        'shabad': 'Shabad',
        'month': 'Month'
    };

    return labels[meta.structure] || 'Verse';
}

/**
 * Format progress string: "Pauri 5 of 38"
 */
function formatProgress(baniId, current, total) {
    const label = getUnitLabel(baniId);
    const meta = BaniMetadata[baniId];
    const actualTotal = meta?.totalUnits || total;
    return `${label} ${current} of ${actualTotal}`;
}

/**
 * Get Banis by category
 */
function getBanisByCategory(categoryId) {
    return Object.values(BaniMetadata).filter(b => b.category === categoryId);
}

/**
 * Get Nitnem Banis by time of day
 */
function getNitnemByTime(time) {
    const nitnem = BaniCategories.nitnem.subcategories[time];
    if (!nitnem) return [];
    return nitnem.banis.map(id => BaniMetadata[id]).filter(Boolean);
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BaniMetadata, BaniCategories, getBaniMeta, shouldShowVerseType, getUnitLabel, formatProgress, getBanisByCategory, getNitnemByTime };
}
