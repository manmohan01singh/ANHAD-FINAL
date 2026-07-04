export function detectLang(text) {
  if (!text) return 'English';
  if (/[\u0A00-\u0A7F]/.test(text)) return 'Punjabi';
  if (/[\u0900-\u097F]/.test(text)) return 'Hindi';
  const lower = text.toLowerCase();
  const gurmukhiWords = ['hukam', 'simran', 'naam', 'gurbani', 'guru', 'shabad', 'bani', 'waheguru', 'ardas'];
  const matchCount = gurmukhiWords.filter(function(w) { return lower.includes(w); }).length;
  if (matchCount >= 2) return 'Punjabi';
  return 'English';
}
