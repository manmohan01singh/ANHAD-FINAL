/* ── Deep Listening Module ──
   Understands the person beyond their words.
   Detects surface intent, emotional state, and deeper need.
   Designed to be replaced by fine-tuned classifiers or LLM calls. */

const INTENT = {
  SEEKING_COMFORT: 'seeking_comfort',
  SEEKING_KNOWLEDGE: 'seeking_knowledge',
  CRISIS: 'crisis',
  GRATITUDE: 'gratitude',
  CURIOSITY: 'curiosity',
  PRACTICAL_GUIDANCE: 'practical_guidance',
  SKEPTICISM: 'skepticism',
  GREETING: 'greeting',
  SHARING: 'sharing',
  REFLECTION: 'reflection',
  CONFESSION: 'confession',
  ANGER: 'anger',
};

const EMOTION = {
  ANXIETY: 'anxiety',
  FEAR: 'fear',
  SADNESS: 'sadness',
  ANGER: 'anger',
  TRUST: 'trust',
  JOY: 'joy',
  GRATITUDE: 'gratitude',
  PEACE: 'peace',
  CONFUSION: 'confusion',
  HOPE: 'hope',
  DESPAIR: 'despair',
  LONELINESS: 'loneliness',
  GUILT: 'guilt',
  PRIDE: 'pride',
  GRIEF: 'grief',
  SHAME: 'shame',
  NEUTRAL: 'neutral',
};

const INTENT_PATTERNS = [
  { intent: INTENT.CRISIS, patterns: ['suicide', 'kill myself', 'end my life', 'want to die', 'hurt myself', 'self harm', 'can\'t go on', 'no reason to live', 'better off dead'], weight: 1.0 },
  { intent: INTENT.SEEKING_COMFORT, patterns: ['sad', 'lonely', 'crying', 'hurt', 'pain', 'loss', 'grief', 'depressed', 'heartbroken', 'betrayed', 'alone', 'abandoned', 'nobody', 'empty', 'broken'], weight: 0.9 },
  { intent: INTENT.ANGER, patterns: ['angry', 'furious', 'frustrated', 'rage', 'hate', 'annoyed', 'irritated', 'mad at', 'fed up', 'sick of'], weight: 0.8 },
  { intent: INTENT.SEEKING_KNOWLEDGE, patterns: ['what is', 'explain', 'meaning of', 'tell me about', 'how does', 'why does', 'what does', 'define', 'teach me', 'concept of'], weight: 0.7 },
  { intent: INTENT.PRACTICAL_GUIDANCE, patterns: ['exam', 'test', 'interview', 'job', 'career', 'relationship', 'money', 'health', 'family', 'parent', 'marriage', 'work', 'study', 'pressure', 'stress', 'worry about'], weight: 0.8 },
  { intent: INTENT.GRATITUDE, patterns: ['thank', 'grateful', 'blessed', 'shukar', 'thankful', 'gratitude', 'kirpa', 'mehar'], weight: 0.7 },
  { intent: INTENT.CURIOSITY, patterns: ['wonder', 'curious', 'tell me', 'share', 'i want to know', 'curious about', 'interested in'], weight: 0.5 },
  { intent: INTENT.SKEPTICISM, patterns: ['but', 'how can', 'prove', 'doubt', 'not sure', 'i don\'t believe', 'skeptical', 'doesn\'t make sense', 'really'], weight: 0.5 },
  { intent: INTENT.SHARING, patterns: ['i have been', 'i am going', 'i just', 'today i', 'recently', 'lately', 'i wanted to share', 'i feel', 'i think', 'i believe'], weight: 0.4 },
  { intent: INTENT.CONFESSION, patterns: ['i did', 'i made', 'mistake', 'regret', 'sorry', 'i feel guilty', 'i shouldn\'t have', 'i wish i hadn\'t'], weight: 0.6 },
  { intent: INTENT.GREETING, patterns: ['hello', 'hi', 'hey', 'waheguru', 'sat sri akaal', 'namaste', 'good morning', 'good evening'], weight: 0.3 },
];

const EMOTION_PATTERNS = [
  { emotion: EMOTION.ANXIETY, patterns: ['anxious', 'nervous', 'worried', 'panic', 'restless', 'uneasy', 'dread', 'overthinking', 'can\'t sleep', 'racing', 'tense'], weight: 1.0 },
  { emotion: EMOTION.FEAR, patterns: ['scared', 'afraid', 'terrified', 'frightened', 'fear', 'horrified', 'intimidated'], weight: 1.0 },
  { emotion: EMOTION.SADNESS, patterns: ['sad', 'unhappy', 'miserable', 'gloomy', 'down', 'low', 'blue', 'heartache', 'tears', 'crying', 'weep', 'melancholy'], weight: 0.9 },
  { emotion: EMOTION.ANGER, patterns: ['angry', 'furious', 'frustrated', 'rage', 'irritated', 'annoyed', 'bitter', 'hostile', 'fury'], weight: 0.9 },
  { emotion: EMOTION.GRATITUDE, patterns: ['thankful', 'grateful', 'blessed', 'appreciate', 'gratitude', 'shukar', 'thank you'], weight: 0.8 },
  { emotion: EMOTION.HOPE, patterns: ['hope', 'hopeful', 'optimistic', 'looking forward', 'better', 'improve', 'positive', 'believe'], weight: 0.6 },
  { emotion: EMOTION.DESPAIR, patterns: ['hopeless', 'despair', 'pointless', 'meaningless', 'nothing matters', 'give up', 'can\'t do this', 'exhausted', 'tired of it all'], weight: 1.0 },
  { emotion: EMOTION.LONELINESS, patterns: ['alone', 'lonely', 'isolated', 'abandoned', 'no one', 'nobody', 'left out', 'forgotten', 'ignored'], weight: 0.9 },
  { emotion: EMOTION.GUILT, patterns: ['guilty', 'regret', 'remorse', 'ashamed', 'i should have', 'i shouldn\'t', 'my fault', 'blame'], weight: 0.8 },
  { emotion: EMOTION.PRIDE, patterns: ['proud', 'accomplished', 'achieved', 'succeeded', 'better than', 'superior'], weight: 0.5 },
  { emotion: EMOTION.GRIEF, patterns: ['lost', 'death', 'died', 'passed away', 'grief', 'mourning', 'funeral', 'bereave', 'miss them', 'departed'], weight: 1.0 },
  { emotion: EMOTION.SHAME, patterns: ['ashamed', 'humiliated', 'embarrassed', 'disgraced', 'mortified', 'shameful'], weight: 0.8 },
  { emotion: EMOTION.CONFUSION, patterns: ['confused', 'uncertain', 'don\'t understand', 'unclear', 'perplexed', 'puzzled', 'lost', 'not sure'], weight: 0.5 },
  { emotion: EMOTION.JOY, patterns: ['happy', 'joyful', 'delighted', 'wonderful', 'beautiful', 'amazing', 'great', 'fantastic', 'love it', 'celebrate'], weight: 0.6 },
  { emotion: EMOTION.PEACE, patterns: ['peaceful', 'calm', 'content', 'serene', 'tranquil', 'at ease', 'quiet', 'settled', 'balanced'], weight: 0.5 },
  { emotion: EMOTION.TRUST, patterns: ['trust', 'faith', 'believe', 'confidence', 'rely', 'depend', 'surrender', 'bharosa'], weight: 0.5 },
];

const SUBTEXT_MAP = {
  [INTENT.SEEKING_COMFORT]: 'needs to feel seen and held before receiving guidance',
  [INTENT.CRISIS]: 'needs immediate human connection and crisis support — spiritual reflection comes after safety',
  [INTENT.ANGER]: 'needs the anger acknowledged as valid before exploring what lies beneath it — usually hurt or fear',
  [INTENT.SEEKING_KNOWLEDGE]: 'seeks conceptual understanding — needs clarity, not brevity',
  [INTENT.PRACTICAL_GUIDANCE]: 'wants wisdom applied to a real-life situation — needs bridge between Gurbani and modern life',
  [INTENT.GRATITUDE]: 'wants to share joy — receive it simply, do not over-teach',
  [INTENT.CURIOSITY]: 'open and exploring — needs gentle invitation, not a lecture',
  [INTENT.SKEPTICISM]: 'needs honest engagement with doubt — Gurmat welcomes questions',
  [INTENT.SHARING]: 'wants to be heard — listen first, respond after',
  [INTENT.CONFESSION]: 'carries guilt — needs compassion and the reminder of Nadar (Grace)',
  [INTENT.GREETING]: 'opening a connection — match their warmth, then let them lead',
  [INTENT.REFLECTION]: 'processing something — hold space, do not fill it',
};

export function initIntentAnalyzer() {
  function detect(text, history) {
    const lower = text.toLowerCase().trim();
    if (!lower) return { intent: INTENT.REFLECTION, emotion: EMOTION.NEUTRAL, subtext: 'silence — hold space', confidence: 0.3 };

    /* ── Resolve pronouns using last user message ── */
    const PRONOUNS = ['this', 'that', 'it', 'its', 'they', 'them', 'their'];
    const hasPronoun = PRONOUNS.some(function(p) { return lower.split(/\s+/).includes(p) || lower.endsWith(p); });
    let resolvedContext = '';
    if (hasPronoun && history && history.length > 0) {
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role === 'user') {
          const lastUserText = history[i].content.toLowerCase();
          const lastWords = lastUserText.split(/\s+/).filter(function(w) { return w.length > 4 && !PRONOUNS.includes(w); }).slice(-5);
          if (lastWords.length > 0) {
            resolvedContext = lastWords.join(' ');
          }
          break;
        }
      }
    }
    const augmentedInput = resolvedContext ? lower + ' ' + resolvedContext : lower;

    const intentScores = {};
    let topIntent = INTENT.GREETING;
    let topIntentScore = 0;

    for (const entry of INTENT_PATTERNS) {
      let score = 0;
      for (const p of entry.patterns) {
        if (augmentedInput.includes(p)) score += entry.weight * (p.length / augmentedInput.length);
      }
      if (score > 0) {
        intentScores[entry.intent] = (intentScores[entry.intent] || 0) + score;
      }
    }

    for (const [intent, score] of Object.entries(intentScores)) {
      if (score > topIntentScore) {
        topIntent = intent;
        topIntentScore = score;
      }
    }

    // CRISIS overrides all — always check first
    if (INTENT_PATTERNS[0].patterns.some(p => lower.includes(p))) {
      topIntent = INTENT.CRISIS;
      topIntentScore = 1.0;
    }

    const emotionScores = {};
    let topEmotion = EMOTION.NEUTRAL;
    let topEmotionScore = 0;

    for (const entry of EMOTION_PATTERNS) {
      let score = 0;
      for (const p of entry.patterns) {
        if (augmentedInput.includes(p)) score += entry.weight * (p.length / augmentedInput.length);
      }
      if (score > 0) {
        emotionScores[entry.emotion] = (emotionScores[entry.emotion] || 0) + score;
      }
    }

    for (const [emotion, score] of Object.entries(emotionScores)) {
      if (score > topEmotionScore) {
        topEmotion = emotion;
        topEmotionScore = score;
      }
    }

    const subtext = SUBTEXT_MAP[topIntent] || 'general inquiry — respond with warmth and clarity';
    const confidence = Math.min(topIntentScore + topEmotionScore, 1);

    return {
      intent: topIntent,
      emotion: topEmotion,
      subtext,
      confidence,
      scores: { intent: topIntentScore, emotion: topEmotionScore },
    };
  }

  return { detect, INTENT, EMOTION };
}
