/* ── Response Planner ──
   Sits between retrieval and generation.
   Selects response structure, varies openings/transitions/closings,
   prevents repetitive phrasing, and forces Shabad-specific focus. */

const PATTERN_KEY = 'anhad_response_patterns';
const MAX_PATTERNS = 25;

const BLOCKED_PHRASES = [
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
];

const MODE_STRUCTURES = {
  comfort: {
    label: 'Comfort',
    openings: [
      'This weighs on you. That is real and it matters.',
      'When the heart carries that much, even words can feel heavy.',
      'The weight you are carrying — it is seen and understood.',
      'There are moments that words cannot reach easily.',
    ],
    transitions: [
      'What Guru Sahib places before us here speaks to that very weight.',
      'In times like these, Guru Sahib gives words that hold what we cannot.',
      'This teaching arrives as a hand reaching through the hurt.',
      'The Shabad that comes to mind meets the heart right where it is.',
    ],
    closings: [
      'The rest can wait. Stay with these words as long as needed.',
      'This is enough for now. Let it settle.',
      'That is where the teaching leaves us — held, not hurried.',
      'Let that sit. When you are ready, it will still be here.',
    ],
    focusInstruction: {
      coreTeachingPath: [
        'Identify the single core teaching of this specific Shabad (not the general theme).',
        'Explain only what this verse says about that teaching.',
        'Do NOT add layers about peace, trust, calm, love, or release unless the Shabad explicitly speaks of them.',
        'If the Shabad speaks of Hukam, explain Hukam. If it speaks of Haumai, explain Haumai. Stay inside the verse.',
      ],
      blocked: [
        'Do NOT say "you are not alone". Do NOT say "take a deep breath".',
        'Do NOT begin with generic comfort language.',
        'Let the Gurbani do the comforting, not your summary of it.',
      ],
    },
  },
  learning: {
    label: 'Learning',
    openings: [
      'That is a fine question. Let us look at what Gurbani says.',
      'The way you ask it tells me you want to understand from within.',
      'This is one of those questions Gurbani answers by turning the mind inward.',
    ],
    transitions: [
      'For this, Guru Sahib gives a clear teaching.',
      'The Shabad that speaks to this question is direct and steady.',
      'On this matter, Gurbani is not vague.',
    ],
    closings: [
      'Let that settle, and if more questions come, bring them.',
      'That is the heart of it. The rest is practice.',
      'Understanding grows slowly. This is a solid place to start.',
      'Let these words sit in the mind for a while.',
    ],
    focusInstruction: {
      coreTeachingPath: [
        'Explain the core concept of this specific Shabad — what does it teach about this topic.',
        'Do NOT use the Shabad as a springboard for general spirituality.',
        'If the question is "what is Hukam", explain Hukam from this verse, not from every verse you know.',
      ],
      blocked: [
        'Do NOT say "Guru Sahib tells us". Do NOT say "the Guru teaches us".',
        'Do NOT begin with "What a beautiful question" or similar filler.',
        'Answer directly, then let the verse carry the depth.',
      ],
    },
  },
  reflection: {
    label: 'Reflection',
    openings: [
      'Pause on that question. It matters more than you think.',
      'You are not asking for information — you are asking for orientation.',
      'Let that question sit for a moment before we turn to Gurbani.',
      'The fact you are asking tells me part of you already knows.',
    ],
    transitions: [
      'Guru Sahib speaks to exactly this kind of turning.',
      'This is where Gurbani steps in — not to answer, but to show.',
      'The Shabad that rises here does not explain. It reveals.',
    ],
    closings: [
      'Sit with that. The answer will come in living it, not thinking it.',
      'Let that resonate. Come back to it throughout the day.',
      'That is enough for the mind to work with.',
      'Take it slowly. Reflection is not about arriving.',
    ],
    focusInstruction: {
      coreTeachingPath: [
        'Draw out the single insight this verse offers — do not summarize.',
        'Let the Shabad ask something of the reader.',
        'End with a gentle open question or invitation to sit with the teaching.',
      ],
      blocked: [
        'Do NOT explain the Shabad to death. Leave space.',
        'Do NOT conclude or resolve. Reflection is meant to stay open.',
        'Do NOT use "I thought of this Shabad because...".',
      ],
    },
  },
  practical_guidance: {
    label: 'Practical Guidance',
    openings: [
      'When the path is not clear, Gurbani does not ask us to stand still.',
      'You want to know what to do. That itself is a step.',
      'The question is not what to think, but how to move.',
    ],
    transitions: [
      'For action, Guru Sahib gives a steady hand.',
      'This teaching is not for the mind alone — it is for the step ahead.',
      'The Shabad that fits here points toward a way.',
    ],
    closings: [
      'Start there. The rest will unfold.',
      'Do not overthink it. Take one step, then another.',
      'Try this today. See what shifts.',
      'That is the way forward — one step, held by Hukam.',
    ],
    focusInstruction: {
      coreTeachingPath: [
        'Extract the single actionable teaching from this verse.',
        'Do not make it abstract. Connect it to an ordinary situation.',
        'Explain what the Shabad asks of the person, not just what it says.',
        'Be specific: if it is about seva, what kind of seva? If Hukam, what does surrender look like today?',
      ],
      blocked: [
        'Do NOT say "trust yourself" or "listen to your heart".',
        'Do NOT become a coach or motivational speaker.',
        'Keep it grounded. No abstractions.',
      ],
    },
  },
  crisis: {
    label: 'Crisis Support',
    openings: [
      'I am here. You are not required to say anything more.',
      'Let us sit together in this moment. Nothing else matters right now.',
      'You do not need to figure anything out. Just be here.',
    ],
    transitions: [
      'When words fail, Guru Sahib gives something simpler.',
      'If the mind cannot hold much right now, let these few words hold it.',
      'This is not a teaching to understand. It is a hand to hold.',
    ],
    closings: [
      'You are not expected to feel better. Just stay.',
      'That is enough for now. I am here when you need to speak again.',
      'No need to respond. Just let these words be with you.',
    ],
    focusInstruction: {
      coreTeachingPath: [
        'Keep it very brief. Do not explain.',
        'Let the Shabad speak for itself with minimal framing.',
        'Safety first. Helplines before Gurbani if indicated.',
        'Do NOT ask reflective questions during crisis.',
      ],
      blocked: [
        'Do NOT ask "how does this make you feel" or "what do you think".',
        'Do NOT analyze. Do NOT philosophize.',
        'Do NOT say "you are not alone" — simply be present.',
      ],
    },
  },
  gratitude: {
    label: 'Gratitude',
    openings: [
      'Gratitude is itself a form of prayer.',
      'When the heart recognizes grace, Gurbani gives it language.',
      'Thankfulness opens the door wider than asking ever could.',
      'It is a gift to see grace in the ordinary.',
    ],
    transitions: [
      'Guru Sahib gives words for exactly this kind of thankfulness.',
      'There is a Shabad that rises when the heart is full.',
      'For this feeling of recognition, Gurbani offers a mirror.',
    ],
    closings: [
      'Let that gratitude carry through the rest of the day.',
      'That is the beauty of it — grace recognized, grace returned.',
      'Carry this with you. It changes how the day feels.',
    ],
    focusInstruction: {
      coreTeachingPath: [
        'Let the Shabad mirror the thankfulness back to the reader.',
        'Do not over-explain. Gratitude does not need analysis.',
        'Keep the response warm, short, and honest.',
      ],
      blocked: [
        'Do not turn gratitude into a lesson.',
        'Do not say "this is a beautiful reminder".',
        'Let the Shabad and the thankfulness stand next to each other without commentary.',
      ],
    },
  },
  struggle: {
    label: 'Struggle',
    openings: [
      'When the path feels uphill, even staying still takes effort.',
      'The struggle you describe is not weakness — it is part of the journey.',
      'You are trying. That itself matters more than you might think.',
    ],
    transitions: [
      'For the one who is trying, Guru Sahib gives strength — not loud, but steady.',
      'This teaching is for the one who feels stuck.',
      'The Shabad that comes to mind does not pretend the struggle is not real.',
    ],
    closings: [
      'You do not need to overcome it today. Just stay with it.',
      'That is enough. One breath, one step, one moment.',
      'The struggle is not the end of the story. Keep going.',
    ],
    focusInstruction: {
      coreTeachingPath: [
        'Validate the effort without making it about resilience.',
        'Let the Shabad reframe the struggle through Gurmat, not self-help.',
        'Keep it grounded in the specific teaching of this verse.',
      ],
      blocked: [
        'Do NOT say "you are stronger than you think".',
        'Do NOT say "this too shall pass" or similar cliches.',
        'Do NOT become a cheerleader.',
      ],
    },
  },
};

/* ── Detect response mode from retrieval output ── */
function detectMode(retrievalResult) {
  if (!retrievalResult) return 'learning';
  const mode = retrievalResult.mode || 'spiritual_seeking';
  if (mode === 'crisis') return 'crisis';
  const wisdom = retrievalResult.wisdom;
  if (!wisdom) return 'learning';
  const illusion = (wisdom.primaryIllusion && wisdom.primaryIllusion.illusion || '').toLowerCase();
  const transformation = (wisdom.transformation || '').toLowerCase();
  const primaryNeed = (retrievalResult.humanNeed && retrievalResult.humanNeed.primaryNeed || '');
  const intent = retrievalResult.detection && retrievalResult.detection.intent || '';
  const emotion = retrievalResult.detection && retrievalResult.detection.emotion || '';
  if (mode === 'crisis') return 'crisis';
  if (mode === 'greeting') return 'gratitude';
  if (primaryNeed === 'comfort' || primaryNeed === 'healing' || emotion === 'sadness' || emotion === 'grief') return 'comfort';
  if (primaryNeed === 'strength' || emotion === 'struggle' || illusion.includes('struggle')) return 'struggle';
  if (primaryNeed === 'guidance' || primaryNeed === 'understanding' || intent === 'seek_understanding' || intent === 'learn') return 'learning';
  if (emotion === 'gratitude' || emotion === 'awe' || mode === 'gratitude') return 'gratitude';
  if (primaryNeed === 'release' || primaryNeed === 'acceptance' || illusion.includes('anxiety') || illusion.includes('control')) return 'reflection';
  return 'learning';
}

/* ── Pick a variant that was not used recently ── */
function pickVariant(variants, previousUsed, blockedPhrases) {
  if (!variants || variants.length === 0) return '';
  const available = variants.filter(function(v) {
    if (!previousUsed || previousUsed.length === 0) return true;
    const lastFew = previousUsed.slice(0, 3);
    for (const used of lastFew) {
      if (v === used) return false;
    }
    return true;
  });
  if (available.length === 0) {
    const idx = Math.floor(Math.random() * variants.length);
    return variants[idx];
  }
  const idx = Math.floor(Math.random() * available.length);
  return available[idx];
}

/* ── Track previously used patterns ── */
function getPreviousPatterns() {
  try {
    const data = localStorage.getItem(PATTERN_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function savePatterns(patterns) {
  try {
    localStorage.setItem(PATTERN_KEY, JSON.stringify(patterns));
  } catch {}
}

function recordUsedPattern(openings, transitions, closings, mode) {
  const patterns = getPreviousPatterns();
  patterns.push({
    ts: Date.now(),
    mode,
    opening: openings,
    transition: transitions,
    closing: closings,
  });
  if (patterns.length > MAX_PATTERNS) {
    patterns.splice(0, patterns.length - MAX_PATTERNS);
  }
  savePatterns(patterns);
}

/* ── Shabad-specific focus extraction ── */
function extractTeachingFocus(primary, wisdom) {
  if (!primary) return '';
  const combined = (primary.english || '').toLowerCase() + ' ' + (primary.unicode || '').toLowerCase() + ' ' + (primary.punjabi || '').toLowerCase();
  const concepts = wisdom && wisdom.wisdomConcepts ? wisdom.wisdomConcepts : [];
  const found = concepts.filter(function(c) { return combined.includes(c.replace(/_/g, ' ')); });
  if (found.length > 0) return found[0].replace(/_/g, ' ');
  return '';
}

/* ── Main planner function ── */
export function initResponsePlanner() {

  function selectPlan(retrievalResult) {
    const mode = detectMode(retrievalResult);
    const structure = MODE_STRUCTURES[mode] || MODE_STRUCTURES.learning;
    const prevPatterns = getPreviousPatterns();
    const recentPatterns = prevPatterns.filter(function(p) { return p.mode === mode; }).slice(0, 5);
    const previousUsedOpenings = recentPatterns.map(function(p) { return p.opening; }).filter(Boolean);
    const previousUsedTransitions = recentPatterns.map(function(p) { return p.transition; }).filter(Boolean);
    const previousUsedClosings = recentPatterns.map(function(p) { return p.closing; }).filter(Boolean);
    const opening = pickVariant(structure.openings, previousUsedOpenings);
    const transition = pickVariant(structure.transitions, previousUsedTransitions);
    const closing = pickVariant(structure.closings, previousUsedClosings);
    const teachingFocus = extractTeachingFocus(retrievalResult ? retrievalResult.primary : null, retrievalResult ? retrievalResult.wisdom : null);
    const recentModes = prevPatterns.slice(0, 5).map(function(p) { return p.mode; });
    const prevBlockedPhrases = BLOCKED_PHRASES.slice();
    const recentlyUsedBlocked = [];
    for (const p of prevPatterns.slice(0, 10)) {
      for (const bp of BLOCKED_PHRASES) {
        const key = bp + '_' + p.mode;
        if (p.opening === bp || p.transition === bp || p.closing === bp) {
          if (!recentlyUsedBlocked.includes(key)) recentlyUsedBlocked.push(key);
        }
      }
    }

    const plan = {
      mode,
      label: structure.label,
      opening,
      transition,
      closing,
      teachingFocus,
      focusInstruction: structure.focusInstruction,
      rhythm: getRhythmSuggestion(mode, recentModes),
      blockedPhrases: BLOCKED_PHRASES.filter(function(bp) {
        const key = bp + '_' + mode;
        return !recentlyUsedBlocked.includes(key);
      }),
    };

    // Record these choices so they won't repeat soon
    recordUsedPattern(opening, transition, closing, mode);

    return plan;
  }

  function getBlockedPhrases() {
    return BLOCKED_PHRASES;
  }

  return { selectPlan, getBlockedPhrases };
}

/* ── Vary sentence rhythm based on recent modes ── */
function getRhythmSuggestion(currentMode, recentModes) {
  const sameModeCount = recentModes.filter(function(m) { return m === currentMode; }).length;
  if (sameModeCount >= 3) {
    return 'Use shorter sentences. Fewer clauses. More space between ideas.';
  }
  if (sameModeCount >= 2) {
    return 'Vary sentence length — some short, some longer. Avoid three sentences of the same rhythm in a row.';
  }
  return 'Write naturally varied sentences. No two consecutive responses should have the same cadence.';
}
