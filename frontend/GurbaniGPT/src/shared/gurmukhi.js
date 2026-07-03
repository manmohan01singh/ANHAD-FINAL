const DIRECT_MAP = {
  'BweI gurdws': 'ਭਾਈ ਗੁਰਦਾਸ',
  'BweI gurdws jI': 'ਭਾਈ ਗੁਰਦਾਸ ਜੀ',
  'guru nwnk dyv': 'ਗੁਰੂ ਨਾਨਕ ਦੇਵ',
  'guru AMgd dyv': 'ਗੁਰੂ ਅੰਗਦ ਦੇਵ',
  'guru Amrdws': 'ਗੁਰੂ ਅਮਰਦਾਸ',
  'guru rwmdws': 'ਗੁਰੂ ਰਾਮਦਾਸ',
  'guru arjn dyv': 'ਗੁਰੂ ਅਰਜਨ ਦੇਵ',
  'guru qyg bhwdr': 'ਗੁਰੂ ਤੇਗ ਬਹਾਦਰ',
  'guru gobiMd isMG': 'ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ',
  'kbIr jI': 'ਕਬੀਰ ਜੀ',
  'PrId jI': 'ਫ਼ਰੀਦ ਜੀ',
  'nwmdyv jI': 'ਨਾਮਦੇਵ ਜੀ',
  'rivdws jI': 'ਰਵਿਦਾਸ ਜੀ',
  'syK PrId': 'ਸ਼ੇਖ਼ ਫ਼ਰੀਦ',
};

const CHAR_MAP = {
  'a': 'ੳ', 'A': 'ਅ', 's': 'ਸ', 'S': 'ਸ਼', 'h': 'ਹ', 'H': '੍ਹ',
  'k': 'ਕ', 'K': 'ਖ਼', 'g': 'ਗ', 'G': 'ਘ', 'c': 'ਚ', 'C': 'ਛ',
  'j': 'ਜ', 'J': 'ਝ', 't': 'ਟ', 'T': 'ਠ', 'd': 'ਡ', 'D': 'ਢ',
  'x': 'ਣ', 'q': 'ਤ', 'Q': 'ਥ', 'n': 'ਨ', 'p': 'ਪ', 'P': 'ਫ',
  'b': 'ਬ', 'B': 'ਭ', 'm': 'ਮ', 'y': 'ਯ', 'r': 'ਰ', 'R': '੍ਰ',
  'l': 'ਲ', 'L': 'ਲ਼', 'v': 'ਵ', 'V': 'ੜ', 'w': 'ਾ', 'W': 'ਾਂ',
  'i': 'ਿ', 'I': 'ੀ', 'u': 'ੁ', 'U': 'ੂ', 'e': 'ੲ', 'o': 'ੋ',
  'q': 'ੌ', '@': 'ੱ', 'M': 'ੰ', 'N': 'ਂ', 'z': 'ਜ਼', 'Z': 'ਗ਼',
  ')': 'ਫ਼', '|': '।', '\\': '।',
  '1': '੧', '2': '੨', '3': '੩', '4': '੪', '5': '੫',
  '6': '੬', '7': '੭', '8': '੮', '9': '੯', '0': '੦',
};

export function convertAnmolToUnicode(str) {
  if (!str) return '';
  const trimmed = str.trim();
  if (DIRECT_MAP[trimmed]) return DIRECT_MAP[trimmed];
  let res = '';
  for (let idx = 0; idx < str.length; idx++) {
    const char = str[idx];
    if (char === 'i') {
      let lookahead = idx + 1;
      if (lookahead < str.length) {
        const nextChar = str[lookahead];
        res += (CHAR_MAP[nextChar] || nextChar) + 'ਿ';
        idx++;
        continue;
      }
    }
    res += CHAR_MAP[char] || char;
  }
  return res;
}
