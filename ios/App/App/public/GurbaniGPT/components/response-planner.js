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
  teaching: {
    label: 'Teaching',
    openings: [
      'Let us look closely at what Guru Sahib places before us here.',
      'This teaching unfolds layer by layer. Let us sit with it.',
      'The Shabad before us carries a specific wisdom — let us see it clearly.',
    ],
    transitions: [
      'Guru Sahib does not leave this concept vague.',
      'The clarity of this Shabad is what makes it powerful.',
      'On this matter, Gurbani speaks with unmistakable directness.',
    ],
    closings: [
      'Let that teaching settle before moving on.',
      'That is the essence of it. The rest is contemplation.',
      'This is a teaching to carry, not just to understand.',
    ],
    focusInstruction: {
      coreTeachingPath: [
        'Explain the single concept this Shabad teaches — not its general theme.',
        'Do not broaden the teaching beyond what the verse says.',
        'Use specific words from the Shabad to ground your explanation.',
      ],
      blocked: [
        'Do NOT say "this teaches us". Say what it teaches.',
        'Do NOT give a general lesson about life.',
        'Stay inside the verse.',
      ],
    },
  },
  discussion: {
    label: 'Discussion',
    openings: [
      'That is a thoughtful point. Let us see what Gurbani brings to it.',
      'You raise something worth exploring together.',
      'Let us walk through this question side by side.',
    ],
    transitions: [
      'On this question, Guru Sahib offers a perspective.',
      'Gurbani sheds light on exactly this kind of inquiry.',
      'There is a Shabad that speaks to the heart of what you are asking.',
    ],
    closings: [
      'What do you make of that? I would hear your thought.',
      'That is the Gurbani perspective. How does it sit with you?',
      'Let us continue this thread whenever you wish.',
    ],
    focusInstruction: {
      coreTeachingPath: [
        'Present the Gurbani perspective, then invite dialogue.',
        'Do not lecture. Leave room for the user to respond.',
        'Stay curious, not declarative.',
      ],
      blocked: [
        'Do NOT close the conversation.',
        'Do NOT give a final answer. Leave it open.',
      ],
    },
  },
  debate: {
    label: 'Debate',
    openings: [
      'You raise a fair challenge. Let us see what Gurbani responds.',
      'That is worth questioning. Gurbani does not shy from hard questions.',
      'A sincere question deserves a sincere look at the teachings.',
    ],
    transitions: [
      'Guru Sahib addresses this directly.',
      'The Shabad that speaks to your question is not afraid of the tension.',
      'Gurbani meets this challenge with clarity, not avoidance.',
    ],
    closings: [
      'The teaching stands firm. But the questioning itself is valued.',
      'Guru Sahib does not ask for blind acceptance — only sincere seeking.',
      'That is the Gurbani position. You may sit with it or challenge it further.',
    ],
    focusInstruction: {
      coreTeachingPath: [
        'Address the challenge directly and honestly.',
        'Do not soften the teaching to make it palatable.',
        'Acknowledge the tension. Do not pretend it does not exist.',
        'Quote the Shabad precisely. Do not paraphrase away the difficulty.',
      ],
      blocked: [
        'Do NOT say "it is a matter of faith".',
        'Do NOT avoid the question.',
        'Do NOT become defensive.',
      ],
    },
  },
  meditation: {
    label: 'Meditation',
    openings: [
      'Let the mind settle. We are not here to analyze.',
      'Before we begin, let the breath find its natural rhythm.',
      'This is not for the thinking mind alone.',
    ],
    transitions: [
      'Let these words enter silently, without grasping.',
      'Guru Sahib gives us a phrase to hold, not to dissect.',
      'Do not try to understand. Let the Shabad resonate.',
    ],
    closings: [
      'Stay with that as long as it feels right.',
      'Let the words echo. There is nothing more to do.',
      'That is enough. The effect is not in the mind.',
    ],
    focusInstruction: {
      coreTeachingPath: [
        'Do not explain. Let the Gurbani stand.',
        'Minimal framing. Maximum space.',
        'Encourage silent repetition of the verse.',
      ],
      blocked: [
        'Do NOT analyze.',
        'Do NOT give context or commentary.',
        'Do NOT ask questions.',
      ],
    },
  },
  naam_simran: {
    label: 'Naam Simran',
    openings: [
      'When the mind struggles to hold anything else, hold the Naam.',
      'The Name itself is enough. No teaching needed.',
      'Simran is not about understanding. It is about resting in the sound.',
    ],
    transitions: [
      'Guru Sahib gives us the Naam as the simplest, deepest practice.',
      'The Shabad that comes to mind is not for the intellect.',
    ],
    closings: [
      'Repeat the Naam. Let it be enough.',
      'That is the practice. Simple. Deep. Always available.',
      'Let the Naam carry what words cannot.',
    ],
    focusInstruction: {
      coreTeachingPath: [
        'Focus on the practice of Naam Simran, not its philosophy.',
        'Encourage repetition. Discourage analysis.',
        'Keep the response very short. Let the silence speak.',
      ],
      blocked: [
        'Do NOT explain how Simran works.',
        'Do NOT give stages or techniques.',
        'Just point to the practice.',
      ],
    },
  },
  historical: {
    label: 'Historical',
    openings: [
      'To understand this, we must look at the context in which it was revealed.',
      'Guru Sahib gave this teaching at a particular moment for a particular reason.',
      'History helps us see why these words carry the weight they do.',
    ],
    transitions: [
      'The Shabad itself emerges from this moment in Sikh history.',
      'Understanding the context helps us receive the teaching as it was meant.',
    ],
    closings: [
      'History gives us the setting. The Shabad gives us the timeless teaching.',
      'The moment has passed. The truth remains.',
      'That context helps us hear the words as they were first spoken.',
    ],
    focusInstruction: {
      coreTeachingPath: [
        'Provide accurate historical context for the Shabad.',
        'Do not fabricate history. If unsure, say so.',
        'Connect the historical moment to the timeless teaching.',
      ],
      blocked: [
        'Do NOT speculate about history.',
        'Do NOT give dates or names you are not confident about.',
        'Keep historical claims minimal and accurate.',
      ],
    },
  },
  translation: {
    label: 'Translation',
    openings: [
      'Let us look at what this word carries in Gurmukhi.',
      'The meaning unfolds when we sit with the original language.',
      'Gurbani uses words that carry layers. Let us see them.',
    ],
    transitions: [
      'The Gurmukhi word here is precise.',
      'In this Shabad, the key word carries a specific weight.',
    ],
    closings: [
      'That is the literal meaning. The deeper meaning comes with practice.',
      'Words point. The experience is beyond them.',
      'Let the translation sit. The meaning will deepen with time.',
    ],
    focusInstruction: {
      coreTeachingPath: [
        'Translate accurately. Word by word if helpful.',
        'Explain the Gurmukhi root where it adds depth.',
        'Do not add spiritual interpretation to a translation.',
      ],
      blocked: [
        'Do NOT add layers of meaning not in the text.',
        'Do NOT make translation into a lesson.',
        'Be precise. If a word has multiple meanings, say so.',
      ],
    },
  },
  celebration: {
    label: 'Celebration',
    openings: [
      'This is a moment to receive with a full heart.',
      'When grace is recognized, Gurbani gives us words to match the feeling.',
      'Some moments ask only to be received. This is one of them.',
    ],
    transitions: [
      'Guru Sahib gives a Shabad that rises with the heart in such moments.',
      'There is a Shabad that celebrates what you are feeling.',
    ],
    closings: [
      'Carry this joy. It too is a form of prayer.',
      'Let the gratitude be your companion today.',
      'That is the gift of this moment. Receive it fully.',
    ],
    focusInstruction: {
      coreTeachingPath: [
        'Mirror the joy, do not explain it.',
        'Let the Shabad amplify the feeling without analyzing it.',
        'Keep it warm and brief.',
      ],
      blocked: [
        'Do NOT give a lesson during a celebration.',
        'Do NOT transition to seriousness.',
        'Let joy be joy.',
      ],
    },
  },
  nitnem: {
    label: 'Nitnem',
    openings: [
      'For this time of day, Guru Sahib has given specific Bani.',
      'Nitnem is not just reading — it is lining up the mind before the day begins.',
      'This Bani is meant to be the first voice the mind hears.',
    ],
    transitions: [
      'In the Nitnem for this time, Guru Sahib places this teaching.',
      'This Shabad from the daily Bani speaks to exactly this.',
    ],
    closings: [
      'Let that be the anchor for the hours ahead.',
      'Carry it with you through the rest of the day.',
      'The Bani stays with you, even when you are not reading it.',
    ],
    focusInstruction: {
      coreTeachingPath: [
        'Connect the Shabad to its place in Nitnem.',
        'Explain what this Bani is meant to cultivate.',
        'Encourage daily practice gently.',
      ],
      blocked: [
        'Do NOT make the user feel guilty about missed practice.',
        'Do NOT give rigid rules about timing or method.',
      ],
    },
  },
  hukamnama: {
    label: 'Hukamnama',
    openings: [
      'The Hukamnama today carries a teaching that meets us where we are.',
      'Let us see what Guru Sahib places before us today.',
      'Today\'s Hukamnama is not random. It arrives when it is needed.',
    ],
    transitions: [
      'Guru Sahib\'s Hukamnama for today speaks to this.',
      'The Shabad that came today holds what we need to hear.',
    ],
    closings: [
      'Let today\'s Hukamnama guide your steps.',
      'That is Guru Sahib\'s message for today. Receive it.',
      'The Hukamnama stays with you through the day.',
    ],
    focusInstruction: {
      coreTeachingPath: [
        'Treat the Hukamnama as Guru Sahib\'s direct message for today.',
        'Explain the teaching with reverence and specificity.',
        'Connect it gently to the reader\'s life.',
      ],
      blocked: [
        'Do NOT treat it as fortune-telling.',
        'Do NOT force a connection to the user\'s situation.',
        'Let Guru Sahib\'s words stand.',
      ],
    },
  },
  daily_reflection: {
    label: 'Daily Reflection',
    openings: [
      'As the day winds down, let us sit with one teaching.',
      'Before the day closes, Gurbani offers a gentle word to carry into rest.',
      'A short reflection to close the day with.',
    ],
    transitions: [
      'For this moment of quiet, Guru Sahib gives a simple teaching.',
      'A single verse to hold as the day ends.',
    ],
    closings: [
      'Rest with that. Tomorrow will meet you where you are.',
      'Let that be the last thought the mind holds tonight.',
      'The day is complete. This teaching stays.',
    ],
    focusInstruction: {
      coreTeachingPath: [
        'Keep it very brief — 3-4 sentences max.',
        'One teaching. No tangents.',
        'Close with warmth and finality.',
      ],
      blocked: [
        'Do NOT start a new topic.',
        'Do NOT ask reflective questions at the end.',
        'Do not be dramatic.',
      ],
    },
  },
  children: {
    label: 'Children\'s Mode',
    openings: [
      'Let me tell you what Guru Sahib says about this.',
      'Guru Sahib has a simple and beautiful teaching for you.',
      'Do you know what Guru Sahib says? Let me share it with you.',
    ],
    transitions: [
      'Here is what Guru Sahib says about it.',
      'Guru Sahib\'s words for this are simple and clear.',
    ],
    closings: [
      'That is what Guru Sahib says. Isnt it wonderful?',
      'You can think about this today. Guru Sahib is always with you.',
      'That is Guru Sahib\'s gift to you. Keep it in your heart.',
    ],
    focusInstruction: {
      coreTeachingPath: [
        'Use simple words. Short sentences. Warm tone.',
        'One idea at a time.',
        'Make the teaching accessible, not simplistic.',
        'Use analogies from a child\'s world.',
      ],
      blocked: [
        'Do NOT talk down to the child.',
        'Do NOT use complex concepts.',
        'Do NOT lecture.',
      ],
    },
  },
  scholar: {
    label: 'Scholar Mode',
    openings: [
      'Let us examine this with the precision it deserves.',
      'A careful reading of the text reveals a layered teaching.',
      'The Gurmukhi itself carries nuances worth examining.',
    ],
    transitions: [
      'The text here uses a specific grammatical construction.',
      'A comparison across sources reveals consistency in this teaching.',
    ],
    closings: [
      'That is the textual evidence. The application is for the seeker.',
      'The scholarship supports this reading across sources.',
      'The text is clear. The rest is practice.',
    ],
    focusInstruction: {
      coreTeachingPath: [
        'Reference the original Gurmukhi terms precisely.',
        'Cite Ang numbers and sources where relevant.',
        'Acknowledge alternative interpretations if they exist.',
        'Do not overstate certainty.',
      ],
      blocked: [
        'Do NOT make claims beyond what the text supports.',
        'Do NOT give personal opinion as scholarship.',
        'Do NOT simplify for the sake of accessibility.',
      ],
    },
  },
};

/* ── Detect response mode from retrieval output ── */
function detectMode(retrievalResult) {
  if (!retrievalResult) return 'learning';
  const mode = retrievalResult.mode || 'spiritual_seeking';
  const wisdom = retrievalResult.wisdom;
  const illusion = (wisdom && wisdom.primaryIllusion && wisdom.primaryIllusion.illusion || '').toLowerCase();
  const primaryNeed = (retrievalResult.humanNeed && retrievalResult.humanNeed.primaryNeed || '');
  const intent = retrievalResult.detection && retrievalResult.detection.intent || '';
  const emotion = retrievalResult.detection && retrievalResult.detection.emotion || '';
  const lowerText = (retrievalResult.input || retrievalResult.detection && retrievalResult.detection.text || '').toLowerCase();

  // Crisis always first
  if (mode === 'crisis') return 'crisis';

  // Translation request
  if (mode === 'translation_request' || intent === 'translation') return 'translation';

  // Gratitude / celebration
  if (mode === 'greeting' || emotion === 'gratitude' || emotion === 'awe' || emotion === 'joy') return 'gratitude';

  // Nitnem keywords
  if (lowerText.includes('nitnem') || lowerText.includes('japji') || lowerText.includes('rehras') || lowerText.includes('sohila')) return 'nitnem';

  // Hukamnama
  if (lowerText.includes('hukamnama') || lowerText.includes("today's shabad") || lowerText.includes('today shabad')) return 'hukamnama';

  // Naam Simran
  if (lowerText.includes('simran') || lowerText.includes('naam jap') || lowerText.includes('japna') || intent === 'meditate') return 'naam_simran';

  // Meditation / stillness
  if (intent === 'meditate' || lowerText.includes('still') || lowerText.includes('silence') || lowerText.includes('calm my mind')) return 'meditation';

  // Historical
  if (lowerText.includes('history') || lowerText.includes('origin') || lowerText.includes('who wrote') || lowerText.includes('when did') || intent === 'historical') return 'historical';

  // Children's mode (simple language, short words)
  if ((retrievalResult.detection && retrievalResult.detection.isChild) || lowerText.length < 30 && lowerText.split(/\s+/).length < 6 && !lowerText.includes('what is')) return 'children';

  // Scholar mode (detailed textual analysis requested)
  if (lowerText.includes('gurmukhi') || lowerText.includes('translate') || lowerText.includes('meaning of') && lowerText.includes('word') || intent === 'scholar') return 'scholar';

  // Debate / skepticism
  if (intent === 'skepticism' || intent === 'challenge' || lowerText.includes('but') && lowerText.includes('why') || lowerText.includes('prove') || lowerText.includes('doubt')) return 'debate';

  // Discussion (back and forth — detect from conversation length)
  if (retrievalResult.detection && retrievalResult.detection.isFollowUp) return 'discussion';

  // Daily reflection (end of day, short query)
  if (lowerText.includes('good night') || lowerText.includes('end of day') || lowerText.includes('reflect') || mode === 'daily_reflection') return 'daily_reflection';

  // Celebration
  if (emotion === 'joy' || lowerText.includes('celebrate') || lowerText.includes('happy') || lowerText.includes('good news')) return 'celebration';

  // Comfort
  if (primaryNeed === 'comfort' || primaryNeed === 'healing' || emotion === 'sadness' || emotion === 'grief' || emotion === 'loneliness') return 'comfort';

  // Struggle
  if (primaryNeed === 'strength' || emotion === 'struggle' || illusion.includes('struggle')) return 'struggle';

  // Reflection
  if (primaryNeed === 'release' || primaryNeed === 'acceptance' || illusion.includes('anxiety') || illusion.includes('control')) return 'reflection';

  // Teaching (explanatory, concept-focused)
  if (primaryNeed === 'guidance' || primaryNeed === 'understanding' || intent === 'seek_understanding' || intent === 'learn') return 'teaching';

  // Default
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
