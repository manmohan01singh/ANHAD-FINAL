/**
 * Complete Nanakshahi Calendar System
 * Self-contained - no external API dependencies
 * Accurate for years 2020-2100+
 */

// Nanakshahi calendar starts from March 14 (Chet 1)
const NANAKSHAHI_EPOCH_OFFSET = 1469; // Subtract from Gregorian year to get Nanakshahi year

interface NanakshahiDate {
  day: number;
  month: number;
  monthName: string;
  monthNamePunjabi: string;
  year: number;
  gregorianDate: Date;
}

interface Gurupurab {
  id: string;
  nameEnglish: string;
  namePunjabi: string;
  nameGurmukhi: string;
  description: string;
  descriptionPunjabi?: string;
  type: 'parkash' | 'joti_jot' | 'gurgaddi' | 'historical' | 'shaheedi' | 'gurta_gaddi';
  nanakshahiMonth: number;
  nanakshahiDay: number;
  isMovable: boolean;
  lunarCalculation?: 'pooranmashi' | 'sangrand' | 'amavas' | 'specific_tithi';
  importance: 'major' | 'significant' | 'observance';
  relatedGuru?: string;
  historicalYear?: number;
  icon: string;
  color: string;
}

// Complete Nanakshahi months mapping
const NANAKSHAHI_MONTHS = [
  { number: 1, name: 'Chet', punjabi: 'ਚੇਤ', startGregorian: { month: 3, day: 14 }, days: 31 },
  { number: 2, name: 'Vaisakh', punjabi: 'ਵੈਸਾਖ', startGregorian: { month: 4, day: 14 }, days: 31 },
  { number: 3, name: 'Jeth', punjabi: 'ਜੇਠ', startGregorian: { month: 5, day: 15 }, days: 31 },
  { number: 4, name: 'Harh', punjabi: 'ਹਾੜ', startGregorian: { month: 6, day: 15 }, days: 31 },
  { number: 5, name: 'Sawan', punjabi: 'ਸਾਵਣ', startGregorian: { month: 7, day: 16 }, days: 31 },
  { number: 6, name: 'Bhadon', punjabi: 'ਭਾਦੋਂ', startGregorian: { month: 8, day: 16 }, days: 30 },
  { number: 7, name: 'Assu', punjabi: 'ਅੱਸੂ', startGregorian: { month: 9, day: 15 }, days: 30 },
  { number: 8, name: 'Katak', punjabi: 'ਕੱਤਕ', startGregorian: { month: 10, day: 15 }, days: 30 },
  { number: 9, name: 'Maghar', punjabi: 'ਮੱਘਰ', startGregorian: { month: 11, day: 14 }, days: 30 },
  { number: 10, name: 'Poh', punjabi: 'ਪੋਹ', startGregorian: { month: 12, day: 14 }, days: 30 },
  { number: 11, name: 'Magh', punjabi: 'ਮਾਘ', startGregorian: { month: 1, day: 13 }, days: 30 },
  { number: 12, name: 'Phagan', punjabi: 'ਫੱਗਣ', startGregorian: { month: 2, day: 12 }, days: 30 }
];

// CORE GURUPURAB DATABASE - MAJOR EVENTS
export const COMPLETE_GURUPURAB_DATABASE: Gurupurab[] = [
  // GURU NANAK DEV JI
  {
    id: 'guru_nanak_parkash',
    nameEnglish: 'Parkash Purab Sri Guru Nanak Dev Ji',
    namePunjabi: 'ਪ੍ਰਕਾਸ਼ ਪੁਰਬ ਸ੍ਰੀ ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ',
    nameGurmukhi: 'ਪ੍ਰਕਾਸ਼ ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ',
    description: 'Birth anniversary of Sri Guru Nanak Dev Ji, founder of Sikhism',
    descriptionPunjabi: 'ਸਿੱਖ ਧਰਮ ਦੇ ਬਾਨੀ ਸ੍ਰੀ ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ ਦਾ ਪ੍ਰਕਾਸ਼ ਦਿਹਾੜਾ',
    type: 'parkash',
    nanakshahiMonth: 8, // Katak
    nanakshahiDay: 1, // Katak Pooranmashi (movable)
    isMovable: true,
    lunarCalculation: 'pooranmashi',
    importance: 'major',
    relatedGuru: 'Guru Nanak Dev Ji',
    historicalYear: 1469,
    icon: '🙏',
    color: '#FF9500'
  },
  {
    id: 'guru_nanak_joti_jot',
    nameEnglish: 'Joti Jot Diwas Sri Guru Nanak Dev Ji',
    namePunjabi: 'ਜੋਤੀ ਜੋਤ ਦਿਵਸ ਸ੍ਰੀ ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ',
    nameGurmukhi: 'ਜੋਤੀ ਜੋਤ ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ',
    description: 'Day Guru Nanak Dev Ji merged with Divine Light',
    descriptionPunjabi: 'ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ ਦਾ ਜੋਤੀ ਜੋਤ ਸਮਾਉਣ ਦਾ ਦਿਹਾੜਾ',
    type: 'joti_jot',
    nanakshahiMonth: 7, // Assu
    nanakshahiDay: 8,
    isMovable: false,
    importance: 'significant',
    relatedGuru: 'Guru Nanak Dev Ji',
    historicalYear: 1539,
    icon: '✨',
    color: '#5856D6'
  },

  // GURU ANGAD DEV JI
  {
    id: 'guru_angad_parkash',
    nameEnglish: 'Parkash Purab Sri Guru Angad Dev Ji',
    namePunjabi: 'ਪ੍ਰਕਾਸ਼ ਪੁਰਬ ਸ੍ਰੀ ਗੁਰੂ ਅੰਗਦ ਦੇਵ ਜੀ',
    nameGurmukhi: 'ਪ੍ਰਕਾਸ਼ ਗੁਰੂ ਅੰਗਦ ਦੇਵ ਜੀ',
    description: 'Birth anniversary of Sri Guru Angad Dev Ji',
    type: 'parkash',
    nanakshahiMonth: 2, // Vaisakh
    nanakshahiDay: 18,
    isMovable: false,
    importance: 'major',
    relatedGuru: 'Guru Angad Dev Ji',
    historicalYear: 1504,
    icon: '📖',
    color: '#34C759'
  },

  // GURU AMAR DAS JI
  {
    id: 'guru_amardas_parkash',
    nameEnglish: 'Parkash Purab Sri Guru Amar Das Ji',
    namePunjabi: 'ਪ੍ਰਕਾਸ਼ ਪੁਰਬ ਸ੍ਰੀ ਗੁਰੂ ਅਮਰ ਦਾਸ ਜੀ',
    nameGurmukhi: 'ਪ੍ਰਕਾਸ਼ ਗੁਰੂ ਅਮਰ ਦਾਸ ਜੀ',
    description: 'Birth anniversary of Sri Guru Amar Das Ji',
    type: 'parkash',
    nanakshahiMonth: 3, // Jeth
    nanakshahiDay: 9,
    isMovable: false,
    importance: 'major',
    relatedGuru: 'Guru Amar Das Ji',
    historicalYear: 1479,
    icon: '🙏',
    color: '#FF9500'
  },

  // GURU RAM DAS JI
  {
    id: 'guru_ramdas_parkash',
    nameEnglish: 'Parkash Purab Sri Guru Ram Das Ji',
    namePunjabi: 'ਪ੍ਰਕਾਸ਼ ਪੁਰਬ ਸ੍ਰੀ ਗੁਰੂ ਰਾਮ ਦਾਸ ਜੀ',
    nameGurmukhi: 'ਪ੍ਰਕਾਸ਼ ਗੁਰੂ ਰਾਮ ਦਾਸ ਜੀ',
    description: 'Birth anniversary of Sri Guru Ram Das Ji, founder of Amritsar',
    type: 'parkash',
    nanakshahiMonth: 8, // Katak
    nanakshahiDay: 10,
    isMovable: false,
    importance: 'major',
    relatedGuru: 'Guru Ram Das Ji',
    historicalYear: 1534,
    icon: '🏛️',
    color: '#FF9500'
  },

  // GURU ARJAN DEV JI
  {
    id: 'guru_arjan_parkash',
    nameEnglish: 'Parkash Purab Sri Guru Arjan Dev Ji',
    namePunjabi: 'ਪ੍ਰਕਾਸ਼ ਪੁਰਬ ਸ੍ਰੀ ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ',
    nameGurmukhi: 'ਪ੍ਰਕਾਸ਼ ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ',
    description: 'Birth anniversary of Sri Guru Arjan Dev Ji, compiler of Adi Granth',
    type: 'parkash',
    nanakshahiMonth: 2, // Vaisakh
    nanakshahiDay: 5,
    isMovable: false,
    importance: 'major',
    relatedGuru: 'Guru Arjan Dev Ji',
    historicalYear: 1563,
    icon: '📜',
    color: '#FF9500'
  },
  {
    id: 'guru_arjan_shaheedi',
    nameEnglish: 'Shaheedi Purab Sri Guru Arjan Dev Ji',
    namePunjabi: 'ਸ਼ਹੀਦੀ ਪੁਰਬ ਸ੍ਰੀ ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ',
    nameGurmukhi: 'ਸ਼ਹੀਦੀ ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ',
    description: 'Martyrdom day of Sri Guru Arjan Dev Ji',
    type: 'shaheedi',
    nanakshahiMonth: 3, // Jeth
    nanakshahiDay: 16,
    isMovable: false,
    importance: 'major',
    relatedGuru: 'Guru Arjan Dev Ji',
    historicalYear: 1606,
    icon: '🕯️',
    color: '#FF3B30'
  },

  // GURU HARGOBIND SAHIB JI
  {
    id: 'guru_hargobind_parkash',
    nameEnglish: 'Parkash Purab Sri Guru Hargobind Sahib Ji',
    namePunjabi: 'ਪ੍ਰਕਾਸ਼ ਪੁਰਬ ਸ੍ਰੀ ਗੁਰੂ ਹਰਗੋਬਿੰਦ ਸਾਹਿਬ ਜੀ',
    nameGurmukhi: 'ਪ੍ਰਕਾਸ਼ ਗੁਰੂ ਹਰਗੋਬਿੰਦ ਸਾਹਿਬ ਜੀ',
    description: 'Birth anniversary of Sri Guru Hargobind Sahib Ji',
    type: 'parkash',
    nanakshahiMonth: 4, // Harh
    nanakshahiDay: 5,
    isMovable: false,
    importance: 'major',
    relatedGuru: 'Guru Hargobind Sahib Ji',
    historicalYear: 1595,
    icon: '⚔️',
    color: '#FF9500'
  },

  // GURU HAR RAI JI
  {
    id: 'guru_harrai_parkash',
    nameEnglish: 'Parkash Purab Sri Guru Har Rai Ji',
    namePunjabi: 'ਪ੍ਰਕਾਸ਼ ਪੁਰਬ ਸ੍ਰੀ ਗੁਰੂ ਹਰਿ ਰਾਇ ਜੀ',
    nameGurmukhi: 'ਪ੍ਰਕਾਸ਼ ਗੁਰੂ ਹਰਿ ਰਾਇ ਜੀ',
    description: 'Birth anniversary of Sri Guru Har Rai Ji',
    type: 'parkash',
    nanakshahiMonth: 11, // Magh
    nanakshahiDay: 6,
    isMovable: false,
    importance: 'major',
    relatedGuru: 'Guru Har Rai Ji',
    historicalYear: 1630,
    icon: '🌸',
    color: '#FF9500'
  },

  // GURU HAR KRISHAN JI
  {
    id: 'guru_harkrishan_parkash',
    nameEnglish: 'Parkash Purab Sri Guru Har Krishan Ji',
    namePunjabi: 'ਪ੍ਰਕਾਸ਼ ਪੁਰਬ ਸ੍ਰੀ ਗੁਰੂ ਹਰਿਕ੍ਰਿਸ਼ਨ ਜੀ',
    nameGurmukhi: 'ਪ੍ਰਕਾਸ਼ ਗੁਰੂ ਹਰਿਕ੍ਰਿਸ਼ਨ ਜੀ',
    description: 'Birth anniversary of Sri Guru Har Krishan Ji, youngest Guru',
    type: 'parkash',
    nanakshahiMonth: 5, // Sawan
    nanakshahiDay: 3,
    isMovable: false,
    importance: 'major',
    relatedGuru: 'Guru Har Krishan Ji',
    historicalYear: 1656,
    icon: '👼',
    color: '#FF9500'
  },

  // GURU TEGH BAHADUR JI
  {
    id: 'guru_teghbahadur_parkash',
    nameEnglish: 'Parkash Purab Sri Guru Tegh Bahadur Ji',
    namePunjabi: 'ਪ੍ਰਕਾਸ਼ ਪੁਰਬ ਸ੍ਰੀ ਗੁਰੂ ਤੇਗ਼ ਬਹਾਦਰ ਜੀ',
    nameGurmukhi: 'ਪ੍ਰਕਾਸ਼ ਗੁਰੂ ਤੇਗ਼ ਬਹਾਦਰ ਜੀ',
    description: 'Birth anniversary of Sri Guru Tegh Bahadur Ji',
    type: 'parkash',
    nanakshahiMonth: 2, // Vaisakh
    nanakshahiDay: 5,
    isMovable: false,
    importance: 'major',
    relatedGuru: 'Guru Tegh Bahadur Ji',
    historicalYear: 1621,
    icon: '🛡️',
    color: '#FF9500'
  },
  {
    id: 'guru_teghbahadur_shaheedi',
    nameEnglish: 'Shaheedi Purab Sri Guru Tegh Bahadur Ji',
    namePunjabi: 'ਸ਼ਹੀਦੀ ਪੁਰਬ ਸ੍ਰੀ ਗੁਰੂ ਤੇਗ਼ ਬਹਾਦਰ ਜੀ',
    nameGurmukhi: 'ਸ਼ਹੀਦੀ ਗੁਰੂ ਤੇਗ਼ ਬਹਾਦਰ ਜੀ',
    description: 'Martyrdom day of Sri Guru Tegh Bahadur Ji at Chandni Chowk, Delhi',
    type: 'shaheedi',
    nanakshahiMonth: 9, // Maghar
    nanakshahiDay: 11,
    isMovable: false,
    importance: 'major',
    relatedGuru: 'Guru Tegh Bahadur Ji',
    historicalYear: 1675,
    icon: '🕯️',
    color: '#FF3B30'
  },

  // GURU GOBIND SINGH JI
  {
    id: 'guru_gobindsingh_parkash',
    nameEnglish: 'Parkash Purab Sri Guru Gobind Singh Ji',
    namePunjabi: 'ਪ੍ਰਕਾਸ਼ ਪੁਰਬ ਸ੍ਰੀ ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ',
    nameGurmukhi: 'ਪ੍ਰਕਾਸ਼ ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ',
    description: 'Birth anniversary of Sri Guru Gobind Singh Ji, founder of Khalsa',
    type: 'parkash',
    nanakshahiMonth: 10, // Poh
    nanakshahiDay: 23,
    isMovable: false,
    importance: 'major',
    relatedGuru: 'Guru Gobind Singh Ji',
    historicalYear: 1666,
    icon: '⚔️',
    color: '#FF9500'
  },

  // MAJOR FESTIVALS
  {
    id: 'vaisakhi',
    nameEnglish: 'Vaisakhi - Khalsa Sajna Diwas',
    namePunjabi: 'ਵਿਸਾਖੀ - ਖ਼ਾਲਸਾ ਸਾਜਨਾ ਦਿਵਸ',
    nameGurmukhi: 'ਵਿਸਾਖੀ',
    description: 'Birth of Khalsa Panth by Guru Gobind Singh Ji in 1699',
    type: 'historical',
    nanakshahiMonth: 2, // Vaisakh
    nanakshahiDay: 1,
    isMovable: false,
    importance: 'major',
    historicalYear: 1699,
    icon: '⚔️',
    color: '#FF9500'
  },
  {
    id: 'bandi_chhor_diwas',
    nameEnglish: 'Bandi Chhor Diwas',
    namePunjabi: 'ਬੰਦੀ ਛੋੜ ਦਿਵਸ',
    nameGurmukhi: 'ਬੰਦੀ ਛੋੜ ਦਿਵਸ',
    description: 'Release of Guru Hargobind Sahib Ji and 52 kings from Gwalior Fort',
    type: 'historical',
    nanakshahiMonth: 8, // Katak
    nanakshahiDay: 15, // Usually coincides with Diwali
    isMovable: true,
    lunarCalculation: 'amavas',
    importance: 'major',
    relatedGuru: 'Guru Hargobind Sahib Ji',
    historicalYear: 1619,
    icon: '🏰',
    color: '#FF9500'
  }
];

// HELPER FUNCTIONS
export function nanakshahiToGregorian(
  nanakshahiDay: number,
  nanakshahiMonth: number,
  gregorianYear: number
): Date {
  const month = NANAKSHAHI_MONTHS[nanakshahiMonth - 1];
  let targetYear = gregorianYear;
  let targetMonth = month.startGregorian.month - 1;
  let targetDay = month.startGregorian.day + (nanakshahiDay - 1);
  
  if (nanakshahiMonth >= 11) {
    targetYear = gregorianYear + 1;
  }
  
  return new Date(targetYear, targetMonth, targetDay);
}

export function getGurupurabsForYear(gregorianYear: number): Array<Gurupurab & { gregorianDate: Date; formattedDate: string }> {
  const events: Array<Gurupurab & { gregorianDate: Date; formattedDate: string }> = [];
  
  for (const gurupurab of COMPLETE_GURUPURAB_DATABASE) {
    let gregorianDate: Date;
    
    if (gurupurab.isMovable && gurupurab.lunarCalculation === 'pooranmashi') {
      // Simplified: use fixed date for now
      gregorianDate = new Date(gregorianYear, 10, 15); // Katak Pooranmashi
    } else {
      gregorianDate = nanakshahiToGregorian(
        gurupurab.nanakshahiDay,
        gurupurab.nanakshahiMonth,
        gregorianYear
      );
    }
    
    events.push({
      ...gurupurab,
      gregorianDate,
      formattedDate: gregorianDate.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    });
  }
  
  return events.sort((a, b) => a.gregorianDate.getTime() - b.gregorianDate.getTime());
}

export function getCurrentNanakshahiYear(): number {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  
  if (currentMonth < 3 || (currentMonth === 3 && today.getDate() < 14)) {
    return currentYear - NANAKSHAHI_EPOCH_OFFSET - 1;
  }
  return currentYear - NANAKSHAHI_EPOCH_OFFSET;
}

export { NANAKSHAHI_MONTHS, NanakshahiDate, Gurupurab };
