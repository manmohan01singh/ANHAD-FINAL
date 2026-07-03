/* ── Wisdom Reasoning Engine ──
   The soul of ANHAD.
   Does not search for verses. Sees through illusions.
   Reveals the Gurmat truth the user needs to encounter.
   Maps every human struggle to its corresponding inner transformation. */

const ILLUSIONS = [
  {
    id: 'haumai_control',
    illusion: 'You believe your worth and safety depend on controlling outcomes. The harder you grip, the more anxious you become.',
    patterns: ['control', 'outcome', 'result', 'perfect', 'must', 'should', 'need to', 'have to', 'fail', 'success', 'achieve', 'prove', 'deserve', 'worth', 'enough', 'compare', 'better than', 'best', 'try hard', 'effort', 'performance', 'accomplish'],
    triggers: { intent: ['practical_guidance', 'seeking_comfort', 'anxiety'], emotion: ['anxiety', 'fear', 'shame', 'pride'] },
    gurmatTruth: { statement: 'Hukam — one divine will flows through all. Your effort is yours. The result belongs to Waheguru. Lasting peace comes not from getting everything right, but from surrendering the need to.', gurbaniHint: 'Hukam' },
    transformation: 'From gripping control to surrendered effort. From proving your worth to resting in your inherent worth as a jot (light) of the One.',
    concepts: ['hukam', 'bharosa', 'chardi_kala', 'nimrata', 'raza'],
    seekerTest: 'Do you believe that if you fail, you are less? If yes, this illusion is active.',
  },
  {
    id: 'maya_attachment',
    illusion: 'You believe your happiness depends on someone or something that could be taken away.',
    patterns: ['miss', 'lost', 'leave', 'gone', 'without', 'attachment', 'cling', 'can\'t let go', 'move on', 'heartbroken', 'betrayed', 'abandoned', 'divorce', 'breakup', 'leave me', 'don\'t want to lose', 'hold on', 'possessive', 'jealous'],
    triggers: { intent: ['seeking_comfort', 'grief'], emotion: ['sadness', 'grief', 'loneliness', 'fear'] },
    gurmatTruth: { statement: 'Maya is that which appears real but passes. Love is eternal when rooted in the One who never leaves. Attachment to the temporary brings pain. Love without attachment brings peace.', gurbaniHint: 'Moh, Maya' },
    transformation: 'From clinging to loving freely. From \"I need you to be happy\" to \"I am complete, and I share love from that completeness.\"',
    concepts: ['moh', 'viraha', 'prem', 'sabar', 'ik_onkar'],
    seekerTest: 'Would your peace shatter if this person or thing were gone? If yes, attachment has become bondage.',
  },
  {
    id: 'dukh_as_punishment',
    illusion: 'You believe your pain is punishment — that you deserve to suffer, or that Waheguru has abandoned you.',
    patterns: ['why me', 'punishment', 'deserve this', 'karma', 'waheguru why', 'god why', 'unfair', 'blame', 'guilty', 'regret', 'mistake', 'sin', 'wrong', 'bad person', 'curse', 'suffer', 'punished'],
    triggers: { intent: ['seeking_comfort', 'confession', 'crisis'], emotion: ['guilt', 'shame', 'sadness', 'despair', 'anger'] },
    gurmatTruth: { statement: 'Dukh is a teacher, not a punishment. Pain is not Waheguru turning away — it is the world shaking you awake. Nadar (grace) flows even in the darkest moment, perhaps most of all then.', gurbaniHint: 'Dukh daru sukh rog, Nadar' },
    transformation: 'From seeing pain as punishment to seeing it as purification. From self-blame to self-compassion rooted in divine mercy.',
    concepts: ['dukh', 'nadar', 'kirpa', 'sabar', 'hukam'],
    seekerTest: 'Do you believe you are being punished? That you brought this on yourself? If yes, you are trapped in guilt, not truth.',
  },
  {
    id: 'separation_loneliness',
    illusion: 'You believe you are fundamentally alone — that no one understands, and you must face life by yourself.',
    patterns: ['alone', 'lonely', 'nobody', 'no one', 'understands', 'isolated', 'different', 'left out', 'forgotten', 'ignored', 'invisible', 'disconnected'],
    triggers: { intent: ['seeking_comfort'], emotion: ['loneliness', 'sadness', 'despair'] },
    gurmatTruth: { statement: 'Ik Onkar — there is only One. You have never been separate. The feeling of aloneness is the ego forgetting its source. Sangat is the medicine — holy company reminds you that you belong to the One.', gurbaniHint: 'Ik Onkar, Sangat' },
    transformation: 'From feeling alone to knowing oneness. From seeking belonging outside to realizing you have always belonged.',
    concepts: ['ik_onkar', 'sangat', 'prem', 'guru'],
    seekerTest: 'Do you feel no one truly knows you? That you are alone in your experience? If yes, the illusion of separation is active.',
  },
  {
    id: 'identity_maya',
    illusion: 'You believe you are your body, your thoughts, your emotions — and when they change or end, so do you.',
    patterns: ['who am i', 'identity', 'aging', 'old', 'body', 'looks', 'appearance', 'die', 'death', 'after death', 'mortal', 'fear of death', 'age', 'lost myself', 'not myself', 'change'],
    triggers: { intent: ['seeking_knowledge', 'curiosity'], emotion: ['fear', 'confusion', 'sadness'] },
    gurmatTruth: { statement: 'You are not the body that ages or the mind that wavers. You are the jot — the eternal light within. As Guru Sahib says, the soul is of the same essence as the Supreme. Death is a change of garment, not the end of the weaver.', gurbaniHint: 'Jot, Atma' },
    transformation: 'From identifying with the temporary to resting in the eternal. From fear of death to the peace of knowing what never dies.',
    concepts: ['atma', 'jot', 'soul', 'hukam', 'guru'],
    seekerTest: 'Does the thought of aging or dying disturb your peace? If yes, you are identified with the body, not the soul.',
  },
  {
    id: 'scarcity_fear',
    illusion: 'You believe there is not enough — not enough money, time, love, opportunity — and you must constantly struggle to secure your share.',
    patterns: ['money', 'financial', 'debt', 'loan', 'poor', 'enough', 'scarcity', 'lack', 'struggle', 'survive', 'rent', 'bills', 'expensive', 'can\'t afford', 'no money', 'broke', 'worried about', 'secure'],
    triggers: { intent: ['practical_guidance', 'seeking_comfort'], emotion: ['anxiety', 'fear'] },
    gurmatTruth: { statement: 'Waheguru is the Giver. The same hand that feeds the sparrow feeds you. Santokh (contentment) is not about having less — it is the deep knowing that what you have is exactly what you need for this moment.', gurbaniHint: 'Santokh, Data' },
    transformation: 'From scrambling in scarcity to resting in abundance. From fear of lack to trust in the One who provides.',
    concepts: ['santokh', 'shukar', 'vand_chhakna', 'bharosa', 'kirpa'],
    seekerTest: 'Do you believe you will never have enough? Are you constantly worried about lack? If yes, trust has not yet entered.',
  },
  {
    id: 'victim_powerlessness',
    illusion: 'You believe life happens to you — that you have no choice, no power, and others are responsible for your pain.',
    patterns: ['always happens', 'never works', 'victim', 'blame', 'fault', 'they did', 'they made', 'helpless', 'can\'t change', 'stuck', 'no option', 'forced', 'have no choice', 'powerless', 'against me', 'universe', 'unlucky'],
    triggers: { intent: ['seeking_comfort', 'anger'], emotion: ['anger', 'despair', 'sadness'] },
    gurmatTruth: { statement: 'Hukam does not mean passivity. Within divine will, you have the power to choose your response. No one can take your inner freedom. The Guru teaches that the mind can rise above any circumstance — this is Chardi Kala.', gurbaniHint: 'Chardi Kala, Hukam' },
    transformation: 'From feeling victimized to claiming your inner power. From blaming life to participating in life with conscious choice.',
    concepts: ['chardi_kala', 'hukam', 'seva', 'haumai'],
    seekerTest: 'Do you feel life is against you? That you have no choice? If yes, you have given your power away.',
  },
  {
    id: 'permanence_denial',
    illusion: 'You believe things should stay the same — that change is a threat rather than the nature of existence.',
    patterns: ['change', 'different', 'used to', 'before', 'how it was', 'everything changes', 'can\'t accept', 'not the same', 'moving on', 'let go', 'transition', 'uncertain', 'unknown', 'future'],
    triggers: { intent: ['seeking_comfort', 'curiosity', 'practical_guidance'], emotion: ['anxiety', 'fear', 'sadness'] },
    gurmatTruth: { statement: 'Everything changes — this is the nature of Maya. Only the One is unchanging. Peace comes not from resisting change but from anchoring your awareness in that which never changes. The soul does not shift with the seasons.', gurbaniHint: 'Sach, Hukam' },
    transformation: 'From resisting change to flowing with it. From needing certainty to trusting the One who holds all change.',
    concepts: ['hukam', 'sabar', 'sach', 'bharosa', 'chardi_kala'],
    seekerTest: 'Are you afraid of the unknown? Do you cling to how things were? If yes, you are fighting the flow of Hukam.',
  },
  {
    id: 'guru_distance',
    illusion: 'You believe the Guru\'s wisdom is ancient, distant, or irrelevant to your modern life.',
    patterns: ['ancient', 'old', 'relevance', 'modern', 'today', 'different time', 'not applicable', 'outdated', 'relevant', 'current', 'real world', 'practical', 'does it apply', 'how does this help', 'what would guru know'],
    triggers: { intent: ['skepticism', 'curiosity', 'seeking_knowledge'], emotion: ['confusion', 'neutral'] },
    gurmatTruth: { statement: 'The Shabad is eternal — not bound by time. Guru Sahib spoke to all of humanity, in every age. The same wisdom that guided Bhagat Kabir in 15th-century Banaras guides your life today because the human condition has not changed: we still love, lose, struggle, wonder, and seek.', gurbaniHint: 'Shabad, Guru' },
    transformation: 'From seeing Gurbani as a historical text to experiencing it as a living, contemporary guide.',
    concepts: ['guru', 'sabad', 'gurmat', 'vichar'],
    seekerTest: 'Do you wonder if ancient wisdom can solve modern problems? If yes, the illusion of distance is active.',
  },
  {
    id: 'haumai_pride',
    illusion: 'You believe your achievements make you superior, your failures make you inferior, and your identity is built on comparison.',
    patterns: ['better than', 'superior', 'inferior', 'beat', 'win', 'lose', 'competition', 'rival', 'enemy', 'opponent', 'rank', 'position', 'status', 'image', 'reputation', 'pride', 'ego', 'humble'],
    triggers: { intent: ['seeking_comfort', 'anger'], emotion: ['pride', 'anger', 'shame'] },
    gurmatTruth: { statement: 'Haumai (ego) is the root of all suffering. The soul does not compete — it simply is. True honor is not in being better than others but in recognizing the same light in all. As Guru Sahib says, the whole world is one flame — how can one flame be greater than another?', gurbaniHint: 'Haumai, Nimrata' },
    transformation: 'From comparison to unity. From prideful achievement to humble service. From \"I am this\" to \"I am That.\"',
    concepts: ['haumai', 'nimrata', 'seva', 'sangat', 'ik_onkar'],
    seekerTest: 'Does being compared disturb your peace? Do you feel the need to be seen as better? If yes, haumai is active.',
  },
  {
    id: 'illusion_knowing',
    illusion: 'You believe you already understand — that you have nothing new to learn, or that you can figure it all out with your intellect alone.',
    patterns: ['already know', 'understand', 'figured', 'intellect', 'logic', 'rational', 'reason', 'explain', 'prove', 'convince', 'argument', 'debate', 'theory'],
    triggers: { intent: ['skepticism', 'seeking_knowledge'], emotion: ['confusion', 'pride', 'neutral'] },
    gurmatTruth: { statement: 'True wisdom is not collected — it is received. The intellect is a tool, not the source. Gurmat begins where the intellect ends — in humility, in openness, in the willingness to be transformed. The first step of wisdom is admitting you do not know.', gurbaniHint: 'Gurmat, Vichar' },
    transformation: 'From intellectual accumulation to receptive wisdom. From knowing about to experiencing.',
    concepts: ['gurmat', 'nimrata', 'guru', 'simran', 'sabad'],
    seekerTest: 'Do you approach Gurbani to prove or to learn? If you seek to validate what you already believe, the mind is closed.',
  },
  {
    id: 'despair_hopelessness',
    illusion: 'You believe nothing will ever change — that your suffering is permanent, and there is no point in hoping.',
    patterns: ['hopeless', 'pointless', 'nothing matters', 'give up', 'can\'t go on', 'no reason', 'empty', 'meaningless', 'why bother', 'never change', 'always the same', 'tired', 'exhausted', 'done'],
    triggers: { intent: ['crisis', 'seeking_comfort', 'despair'], emotion: ['despair', 'sadness', 'loneliness'] },
    gurmatTruth: { statement: 'The night is always longest before dawn. Chardi Kala is not about ignoring pain — it is the soul\'s unshakeable knowing that this too shall pass, that Waheguru\'s mercy is vaster than your current suffering. Even in the darkest cave, the sun continues to shine outside.', gurbaniHint: 'Chardi Kala, Asa' },
    transformation: 'From hopelessness to the patience of dawn. From \"nothing matters\" to \"everything matters, but nothing is permanent.\"',
    concepts: ['chardi_kala', 'asa', 'hukam', 'sabar', 'kirpa', 'simran'],
    seekerTest: 'Do you believe things will never get better? If yes, hope has not yet been rediscovered.',
  },
];

export function initWisdomReasoner() {

  function analyze(detection) {
    const { intent, emotion, subtext, text } = detection;
    const lower = (text || '').toLowerCase();
    const matches = [];

    for (const illusion of ILLUSIONS) {
      let score = 0;

      // Pattern match
      const patternMatches = illusion.patterns.filter(function(p) { return lower.includes(p); }).length;
      if (patternMatches > 0) score += patternMatches * 0.15;

      // Intent match
      if (detection.intent && illusion.triggers.intent) {
        for (const ti of illusion.triggers.intent) {
          if (detection.intent.includes(ti) || ti === detection.intent) { score += 0.2; break; }
        }
      }

      // Emotion match
      if (detection.emotion && illusion.triggers.emotion) {
        for (const te of illusion.triggers.emotion) {
          if (detection.emotion.includes(te) || te === detection.emotion) { score += 0.3; break; }
        }
      }

      // Subtext resonance — check if subtext keywords appear in the illusion description
      if (subtext) {
        const subLower = subtext.toLowerCase();
        const illWords = (illusion.illusion + ' ' + illusion.transformation).toLowerCase().split(/\s+/);
        const subWords = subLower.split(/\s+/);
        for (const sw of subWords) {
          if (sw.length > 3 && illWords.includes(sw)) score += 0.05;
        }
      }

      if (score > 0) {
        matches.push({ illusion: illusion, score: Math.min(score, 1), patternMatches });
      }
    }

    matches.sort(function(a, b) { return b.score - a.score; });

    const primary = matches.length > 0 ? matches[0] : null;

    if (!primary) {
      // Fallback for no clear illusion: use general human seeking
      const fallbackIndex = ILLUSIONS.findIndex(function(i) { return i.id === 'separation_loneliness'; });
      const fallback = ILLUSIONS[fallbackIndex >= 0 ? fallbackIndex : 0];
      return {
        primaryIllusion: { ...fallback, score: 0.2 },
        secondaryIllusions: [],
        truth: fallback.gurmatTruth,
        transformation: fallback.transformation,
        wisdomConcepts: fallback.concepts,
        seekerTest: fallback.seekerTest,
        clarity: 'unclear',
      };
    }

    const secondary = matches.slice(1, 3).map(function(m) { return { ...m.illusion, score: m.score }; });

    return {
      primaryIllusion: { ...primary.illusion, score: primary.score },
      secondaryIllusions: secondary,
      truth: primary.illusion.gurmatTruth,
      transformation: primary.illusion.transformation,
      wisdomConcepts: primary.illusion.concepts,
      seekerTest: primary.illusion.seekerTest,
      clarity: primary.score > 0.5 ? 'clear' : 'emerging',
    };
  }

  /* Score a Shabad's transformative relevance — not its keyword match */
  function scoreTransformation(shabadText, wisdom, expansion) {
    if (!wisdom) return 0;
    const searchText = (shabadText || '').toLowerCase();
    let score = 0;

    // Score 1: Does it directly address the root illusion?
    const illusionKeywords = wisdom.primaryIllusion.illusion.toLowerCase().split(/\s+/).filter(function(w) { return w.length > 4; });
    for (const w of illusionKeywords) {
      if (searchText.includes(w)) score += 0.15;
    }

    // Score 2: Does it contain the transformative concepts?
    for (const concept of wisdom.wisdomConcepts) {
      if (searchText.includes(concept.replace(/_/g, ' ')) || searchText.includes(concept)) {
        score += 0.25;
      }
    }

    // Score 3: Does it offer the antidote (truth)?
    const truthWords = wisdom.truth.statement.toLowerCase().split(/\s+/).filter(function(w) { return w.length > 4 && !['your', 'that', 'this', 'from', 'have', 'been', 'with', 'what', 'when', 'their'].includes(w); });
    for (const w of truthWords.slice(0, 8)) {
      if (searchText.includes(w)) score += 0.1;
    }

    // Score 4: Does it speak to the transformation path?
    const transformWords = wisdom.transformation.toLowerCase().split(/\s+/).filter(function(w) { return w.length > 4; });
    for (const w of transformWords.slice(0, 6)) {
      if (searchText.includes(w)) score += 0.1;
    }

    // Score 5: Context relevance from expansion
    if (expansion && expansion.concepts) {
      for (const ec of expansion.concepts) {
        if (searchText.includes(ec.concept.replace(/_/g, ' '))) {
          score += 0.1;
        }
      }
    }

    return Math.min(score, 1);
  }

  function getSeekerQuestion() {
    return 'Before continuing, ask yourself: "What is the one belief keeping me from peace right now?" Let that be the door.';
  }

  /* ── Human Need Inference ──
     Maps emotion + intent → deeper human need.
     Used by expansion to steer concept selection toward what the person truly needs. */
  const EMOTION_NEED_MAP = {
    anxiety: 'control-release',
    fear: 'trust',
    sadness: 'comfort',
    anger: 'release',
    loneliness: 'connection',
    guilt: 'forgiveness',
    shame: 'grace',
    grief: 'comfort',
    despair: 'hope',
    confusion: 'wisdom',
    frustration: 'peace',
    hopelessness: 'hope',
    pride: 'humility',
    joy: 'gratitude',
    gratitude: 'expression',
    love: 'connection',
    trust: 'faith',
  };

  const INTENT_NEED_MAP = {
    seeking_comfort: 'comfort',
    seeking_knowledge: 'wisdom',
    practical_guidance: 'guidance',
    crisis: 'hope',
    gratitude: 'expression',
    skepticism: 'understanding',
    confession: 'forgiveness',
    anger: 'release',
    greeting: 'connection',
    casual: 'connection',
    spiritual_seeking: 'wisdom',
  };

  function inferHumanNeed(text, detection) {
    const primaryEmotion = detection && (detection.emotion || detection.primaryEmotion);
    const primaryIntent = detection && (detection.intent || detection.primaryIntent);
    const subtext = detection && detection.subtext;

    const emotionNeed = EMOTION_NEED_MAP[primaryEmotion] || null;
    const intentNeed = INTENT_NEED_MAP[primaryIntent] || null;

    const needs = [];
    if (emotionNeed && !needs.includes(emotionNeed)) needs.push(emotionNeed);
    if (intentNeed && !needs.includes(intentNeed)) needs.push(intentNeed);

    // Scan subtext for additional need keywords
    if (subtext) {
      const subLower = subtext.toLowerCase();
      const needKeywords = {
        control: 'control-release', trust: 'trust', peace: 'peace', heal: 'healing',
        hope: 'hope', guidance: 'guidance', forgiveness: 'forgiveness', strength: 'strength',
        wisdom: 'wisdom', connection: 'connection', acceptance: 'acceptance', calm: 'calm',
        release: 'release', grace: 'grace',
      };
      for (const [keyword, need] of Object.entries(needKeywords)) {
        if (subLower.includes(keyword) && !needs.includes(need)) {
          needs.push(need);
        }
      }
    }

    // Fallback
    if (needs.length === 0) {
      const defaultNeed = 'wisdom';
      return { primaryNeed: defaultNeed, secondaryNeeds: [], needStatement: 'Seeking understanding and wisdom.' };
    }

    const primaryNeed = needs[0];
    const secondaryNeeds = needs.slice(1);

    // Build a human-readable need statement
    const needDescriptions = {
      'control-release': 'Releasing the need for control and finding peace in surrender',
      trust: 'Rebuilding trust — in Waheguru, in life, in yourself',
      comfort: 'Finding comfort and solace in divine presence',
      peace: 'Restoring inner peace',
      connection: 'Feeling connected — to others, to the Divine, to yourself',
      forgiveness: 'Receiving and offering forgiveness',
      grace: 'Resting in divine grace and mercy',
      hope: 'Rediscovering hope when things feel dark',
      wisdom: 'Receiving clarity and understanding',
      guidance: 'Direction and practical wisdom for life\'s decisions',
      expression: 'Expressing gratitude or devotion',
      understanding: 'Deeper comprehension of spiritual truths',
      healing: 'Healing from emotional or spiritual pain',
      strength: 'Inner strength to face challenges',
      calm: 'Calming the restless mind',
      acceptance: 'Accepting what cannot be changed',
      release: 'Releasing anger, guilt, or past hurt',
      faith: 'Strengthening faith and trust',
      love: 'Experiencing and sharing divine love',
      humility: 'Cultivating humility and letting go of ego',
      gratitude: 'Cultivating thankfulness',
    };

    const statement = needDescriptions[primaryNeed] || 'Seeking spiritual understanding';

    return { primaryNeed, secondaryNeeds, needStatement: statement };
  }

  return { analyze, scoreTransformation, getSeekerQuestion, inferHumanNeed };
}
