/**
 * ═══════════════════════════════════════════════════════════════════
 * GURBANI QUOTES DATABASE
 * Sacred verses from Sri Guru Granth Sahib Ji
 * ═══════════════════════════════════════════════════════════════════
 */

const GURBANI_QUOTES = [
  {
    gurmukhi: "ਰਾਤਿ ਕਾ ਨਾਮੁ ਜਪਿ ਦਿਨਸੁ ਰਾਤਿ",
    english: "Chant the Lord's Name, day and night",
    source: "Sri Guru Granth Sahib Ji, Ang 185"
  },
  {
    gurmukhi: "ਸਤਿਨਾਮੁ ਜਪਿ ਵਡਭਾਗੀਆ",
    english: "Meditate on the True Name, most fortunate ones",
    source: "Sri Guru Granth Sahib Ji, Ang 386"
  },
  {
    gurmukhi: "ਸਿਮਰਿ ਸਿਮਰਿ ਸਿਮਰਿ ਸੁਖੁ ਪਾਵਉ",
    english: "Remember, remember, remember in meditation, and find peace",
    source: "Sri Guru Granth Sahib Ji, Ang 263"
  },
  {
    gurmukhi: "ਹਰਿ ਕਾ ਨਾਮੁ ਧਿਆਇ ਮਨ ਮੇਰੇ",
    english: "Meditate on the Name of the Lord, O my mind",
    source: "Sri Guru Granth Sahib Ji, Ang 10"
  },
  {
    gurmukhi: "ਨਾਮੁ ਜਪਹੁ ਮੇਰੇ ਸਾਜਨਾ",
    english: "Chant the Naam, O my friends",
    source: "Sri Guru Granth Sahib Ji, Ang 319"
  },
  {
    gurmukhi: "ਵਾਹਿਗੁਰੂ ਵਾਹਿਗੁਰੂ ਵਾਹਿਗੁਰੂ ਵਾਹਿ ਜੀਉ",
    english: "Waheguru, Waheguru, Waheguru, Wondrous Guru",
    source: "Sri Guru Granth Sahib Ji, Ang 515"
  },
  {
    gurmukhi: "ਨਾਮ ਬਿਨਾ ਸੁਖੁ ਪਾਇਆ ਨਾ ਜਾਇ",
    english: "Without the Naam, peace cannot be obtained",
    source: "Sri Guru Granth Sahib Ji, Ang 1136"
  },
  {
    gurmukhi: "ਏਕੁ ਨਾਮੁ ਹੁਕਮੁ ਹੈ ਨਾਨਕ ਸਤਿਗੁਰਿ ਦੀਆ ਬੁਝਾਇ ਜੀਉ",
    english: "The One Name is the Lord's Command; Nanak has been taught this by the True Guru",
    source: "Sri Guru Granth Sahib Ji, Ang 72"
  },
  {
    gurmukhi: "ਗੁਰ ਕਾ ਸਬਦੁ ਰਤੰਨੁ ਹੈ ਹੀਰੇ ਜਿਤੁ ਜੜਾਉ",
    english: "The Word of the Guru's Shabad is a jewel, studded with diamonds",
    source: "Sri Guru Granth Sahib Ji, Ang 1279"
  },
  {
    gurmukhi: "ਸਚੁ ਨਾਮੁ ਮੇਰਾ ਆਧਾਰੋ",
    english: "The True Name is my only support",
    source: "Sri Guru Granth Sahib Ji, Ang 1"
  },
  {
    gurmukhi: "ਨਾਮੁ ਜਪੀਐ ਮਨ ਸੁਖੁ ਪਾਈਐ",
    english: "Chant the Naam, and the mind finds peace",
    source: "Sri Guru Granth Sahib Ji, Ang 565"
  },
  {
    gurmukhi: "ਸਤਿਗੁਰ ਕਾ ਭਾਣਾ ਮੰਨਿ ਲੈ",
    english: "Accept the Will of the True Guru",
    source: "Sri Guru Granth Sahib Ji, Ang 920"
  },
  {
    gurmukhi: "ਹਰਿ ਹਰਿ ਨਾਮੁ ਅੰਮ੍ਰਿਤੁ ਮੀਠਾ",
    english: "The Name of the Lord, Har, Har, is sweet Ambrosial Nectar",
    source: "Sri Guru Granth Sahib Ji, Ang 318"
  },
  {
    gurmukhi: "ਜਪਿ ਮਨ ਸਤਿਨਾਮੁ ਸਦਾ ਸਤਿਨਾਮੁ",
    english: "Meditate, O my mind, on the True Name, Sat Naam, forever",
    source: "Sri Guru Granth Sahib Ji, Ang 670"
  },
  {
    gurmukhi: "ਨਾਨਕ ਨਾਮੁ ਮਿਲੈ ਵਡਿਆਈ",
    english: "O Nanak, through the Naam, glorious greatness is obtained",
    source: "Sri Guru Granth Sahib Ji, Ang 1"
  },
  {
    gurmukhi: "ਏਕੋ ਨਾਮੁ ਧਿਆਇ",
    english: "Meditate on the One Name",
    source: "Sri Guru Granth Sahib Ji, Ang 296"
  },
  {
    gurmukhi: "ਨਾਮੁ ਜਪਤ ਤਿਸੁ ਸੁਖੁ ਹੋਇ",
    english: "Chanting the Naam, one finds peace",
    source: "Sri Guru Granth Sahib Ji, Ang 295"
  },
  {
    gurmukhi: "ਗੁਰਮੁਖਿ ਨਾਮੁ ਜਪਹੁ ਮਨ ਮੇਰੇ",
    english: "As Gurmukh, chant the Naam, O my mind",
    source: "Sri Guru Granth Sahib Ji, Ang 88"
  },
  {
    gurmukhi: "ਨਾਮੁ ਰਤਨੁ ਨਿਧਾਨੁ ਹੈ",
    english: "The Naam is the treasure of jewels",
    source: "Sri Guru Granth Sahib Ji, Ang 1173"
  },
  {
    gurmukhi: "ਸਾਚਾ ਨਾਮੁ ਮੇਰਾ ਆਧਾਰੋ",
    english: "The True Name is my only support",
    source: "Sri Guru Granth Sahib Ji, Ang 8"
  },
  {
    gurmukhi: "ਜਪਿ ਗੋਬਿੰਦ ਗੋਪਾਲ ਲਾਲ",
    english: "Meditate on the Lord of the Universe, the Beloved",
    source: "Sri Guru Granth Sahib Ji, Ang 192"
  },
  {
    gurmukhi: "ਨਾਮੁ ਪਦਾਰਥੁ ਮਨਿ ਵਸੈ",
    english: "May the treasure of the Naam abide within my mind",
    source: "Sri Guru Granth Sahib Ji, Ang 289"
  },
  {
    gurmukhi: "ਸਿਮਰਿ ਸਿਮਰਿ ਸਿਮਰਿ ਪ੍ਰਭੁ ਸੋਇ",
    english: "Remember, remember, remember God in meditation",
    source: "Sri Guru Granth Sahib Ji, Ang 295"
  },
  {
    gurmukhi: "ਨਾਮੁ ਨਿਧਾਨੁ ਜੀਅ ਕੈ ਸੰਗਿ",
    english: "The treasure of the Naam is with the soul",
    source: "Sri Guru Granth Sahib Ji, Ang 1136"
  },
  {
    gurmukhi: "ਗੋਬਿੰਦ ਨਾਮੁ ਰਿਦੈ ਧਿਆਈਐ",
    english: "Meditate within your heart on the Name of the Lord of the Universe",
    source: "Sri Guru Granth Sahib Ji, Ang 295"
  }
];

// Get random quote
function getRandomQuote() {
  const index = Math.floor(Math.random() * GURBANI_QUOTES.length);
  return GURBANI_QUOTES[index];
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GURBANI_QUOTES, getRandomQuote };
}
