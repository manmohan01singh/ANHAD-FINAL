const FORBIDDEN = [
  'I thought of this Shabad',
  'Guru Sahib reminds us',
  "you're not alone",
  'take a deep breath',
  'this Shabad reminds us',
  'Guru Sahib says',
  'the Guru teaches us',
  'let this verse',
  'sit with this',
  'in this beautiful Shabad',
  'Guru Sahib tells us',
  'trust yourself',
  'listen to your heart',
  'you can do this',
  'you are stronger than you think',
  'this too shall pass',
  'many people experience',
  'it can sometimes feel',
  'what you\'re experiencing',
];

let lastUsed = [];

export function getForbiddenPhrases() {
  return FORBIDDEN;
}

export function getRecentlyUsed(count) {
  return lastUsed.slice(0, count || 3);
}

export function markUsed(phrase) {
  if (!lastUsed.includes(phrase)) {
    lastUsed.unshift(phrase);
    if (lastUsed.length > 20) lastUsed.length = 20;
  }
}

export function resetRecentlyUsed() {
  lastUsed = [];
}
