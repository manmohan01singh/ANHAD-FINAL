import { CONSTITUTION } from './constitution/VoiceConstitution.js';
import { getForbiddenPhrases, getRecentlyUsed, markUsed } from './phrases/ForbiddenPhrases.js';
import { PREFERRED_PATTERNS } from './phrases/PreferredPhrases.js';
import { SENTENCE_PATTERNS } from './phrases/SentenceTemplates.js';
import { getRhythmSuggestion, checkSentenceVariety } from './rhythm/ConversationRhythm.js';
import { validateVoiceCompliance, getVoiceDirectives } from './StyleValidator.js';
import { COMPANION } from './personality/companion.js';
import { TEACHER } from './personality/teacher.js';
import { SCHOLAR } from './personality/scholar.js';
import { GUIDE } from './personality/guide.js';

const PERSONALITIES = { companion: COMPANION, teacher: TEACHER, scholar: SCHOLAR, guide: GUIDE };

export function initVoice() {
  function selectPersonality(mode) {
    if (mode === 'crisis') return COMPANION;
    if (mode === 'teaching' || mode === 'learning') return TEACHER;
    if (mode === 'scholar' || mode === 'translation') return SCHOLAR;
    if (mode === 'reflection') return GUIDE;
    return COMPANION;
  }

  function buildDirectives(mode, recentModes, blockedPhrases) {
    const personality = selectPersonality(mode);
    const rhythm = getRhythmSuggestion(mode, recentModes);
    const directives = getVoiceDirectives(mode, personality.id);

    let result = directives + '\n';
    result += 'Rhythm: ' + rhythm + '\n';
    result += 'Warmth level: ' + personality.warmth + '/5\n';
    result += 'Sentence style: ' + personality.sentenceLength + '\n';

    if (blockedPhrases && blockedPhrases.length > 0) {
      result += 'Especially avoid this turn: ' + blockedPhrases.slice(0, 4).join(', ') + '\n';
    }

    return result;
  }

  function checkResponse(text) {
    return validateVoiceCompliance(text);
  }

  function getForbidden() {
    return getForbiddenPhrases();
  }

  return {
    buildDirectives,
    checkResponse,
    getForbidden,
    getRecentlyUsed: getRecentlyUsed,
    markUsed: markUsed,
    personalities: PERSONALITIES,
  };
}
