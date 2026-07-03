import { CONSTITUTION } from './constitution/VoiceConstitution.js';
import { getForbiddenPhrases } from './phrases/ForbiddenPhrases.js';
import { checkSentenceVariety } from './rhythm/ConversationRhythm.js';

export function validateVoiceCompliance(text) {
  if (!text) return { passed: false, violations: ['Empty text'] };
  const lower = text.toLowerCase();
  const violations = [];

  // Check forbidden phrases from constitution
  for (const phrase of CONSTITUTION.forbidden) {
    if (lower.includes(phrase.toLowerCase())) {
      violations.push('Contains forbidden phrase: "' + phrase + '"');
    }
  }

  // Check forbidden phrases list
  for (const phrase of getForbiddenPhrases()) {
    if (lower.includes(phrase.toLowerCase())) {
      violations.push('Contains blocked phrase: "' + phrase + '"');
    }
  }

  // Check sentence variety
  const sentences = text.split(/[.!?]+/).filter(Boolean).map(function(s) { return s.trim(); });
  const variety = checkSentenceVariety(sentences);

  return {
    passed: violations.length === 0,
    violations: violations,
    sentenceVariety: variety,
    sentenceCount: sentences.length,
  };
}

export function getVoiceDirectives(mode, personality) {
  const p = personality || 'companion';
  const directives = [
    '--- ANHAD VOICE DIRECTIVES ---',
    'Identity: ' + CONSTITUTION.identity,
    'Tone: ' + CONSTITUTION.tone.warmth,
    'Honesty: ' + CONSTITUTION.tone.honesty,
    'Structure: Opening → Understanding → ' + CONSTITUTION.structure.transition + ' → <!--GB--> → Teaching → Connection → Closing.',
    'Forbidden phrases to avoid this turn: ' + CONSTITUTION.forbidden.slice(0, 4).join(', '),
    'Do NOT sound like a therapist, coach, professor, or self-help speaker.',
    'Let Gurbani carry the depth. You explain, you do not replace.',
    'Personality variant: ' + p,
  ];
  return directives.join('\n');
}
