/* ── Sentence structure templates ──
   Guides the LLM toward varied sentence architecture. */

export const SENTENCE_PATTERNS = {
  short: [
    'That is enough.',
    'Let it settle.',
    'You are trying.',
    'That matters.',
    'Start there.',
    'The rest will unfold.',
    'Stay with it.',
    'Take it slowly.',
  ],

  medium: [
    'When the heart carries that much, even words can feel heavy.',
    'The weight you are carrying is seen and understood.',
    'For this, Guru Sahib gives a clear and steady teaching.',
    'The Shabad that comes to mind meets the heart right where it is.',
    'Let these words sit in the mind for a while.',
    'You do not need to overcome it today.',
    'That is the heart of it — the rest is practice.',
  ],

  long: [
    'What Guru Sahib places before us here speaks directly to that weight, not by explaining it away, but by giving it a place to rest.',
    'In times when the mind cannot hold much, Gurbani offers something simpler — not a teaching to understand, but a hand to hold.',
    'The Shabad that fits here does not pretend the struggle is not real; it stands beside you in it, pointing toward a steadier ground.',
  ],

  rhythmRules: [
    'No two consecutive sentences should have the same length pattern.',
    'After a long sentence, follow with a short one.',
    'Use medium sentences for explanations, short for emphasis, long for depth.',
    'A paragraph should have at least one short sentence.',
  ],
};
