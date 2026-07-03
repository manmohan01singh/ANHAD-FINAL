/* ── Reflection Module with 3-Layer Wisdom Knowledge Graph ──
   Layer 1: Human Experience → Human Need
   Layer 2: Human Need → Gurmat Concept
   Layer 3: Gurmat Concept → Search Hints
   Designed to be replaced by embeddings, vector search, or fine-tuned models. */

/* ── LAYER 1: Human Experience → Human Need ── */
const EXPERIENCE_NEED_MAP = {
  exam: { needs: ['confidence', 'calm', 'trust', 'perspective'], emotions: ['anxiety', 'fear'], situation: 'Exam pressure' },
  failure: { needs: ['hope', 'self-worth', 'acceptance', 'guidance'], emotions: ['shame', 'sadness', 'guilt'], situation: 'Dealing with failure' },
  success: { needs: ['humility', 'gratitude', 'perspective'], emotions: ['pride', 'joy'], situation: 'Success' },
  relationship: { needs: ['love', 'patience', 'forgiveness', 'trust'], emotions: ['love', 'anger', 'sadness'], situation: 'Relationship' },
  marriage: { needs: ['commitment', 'patience', 'love', 'understanding'], emotions: ['trust', 'love', 'anxiety'], situation: 'Marriage' },
  breakup: { needs: ['healing', 'acceptance', 'self-love', 'hope'], emotions: ['sadness', 'grief', 'anger', 'loneliness'], situation: 'End of relationship' },
  death: { needs: ['comfort', 'acceptance', 'faith', 'hope'], emotions: ['grief', 'sadness', 'fear'], situation: 'Dealing with death' },
  money: { needs: ['security', 'contentment', 'trust', 'generosity'], emotions: ['anxiety', 'fear'], situation: 'Financial concern' },
  job: { needs: ['purpose', 'security', 'patience', 'trust'], emotions: ['anxiety', 'fear', 'hopelessness'], situation: 'Work/Career' },
  health: { needs: ['strength', 'patience', 'acceptance', 'faith'], emotions: ['fear', 'sadness', 'anger'], situation: 'Health struggle' },
  loneliness: { needs: ['connection', 'belonging', 'divine love', 'sangat'], emotions: ['loneliness', 'sadness', 'despair'], situation: 'Loneliness' },
  anger: { needs: ['peace', 'understanding', 'forgiveness', 'release'], emotions: ['anger', 'frustration'], situation: 'Anger' },
  guilt: { needs: ['forgiveness', 'self-compassion', 'grace', 'release'], emotions: ['guilt', 'shame', 'sadness'], situation: 'Guilt' },
  confusion: { needs: ['clarity', 'guidance', 'understanding', 'wisdom'], emotions: ['confusion', 'anxiety'], situation: 'Confusion/Uncertainty' },
  anxiety: { needs: ['calm', 'trust', 'control-release', 'peace'], emotions: ['anxiety', 'fear'], situation: 'Anxiety/Worry' },
  sadness: { needs: ['comfort', 'hope', 'acceptance', 'peace'], emotions: ['sadness', 'grief'], situation: 'Sadness' },
  gratitude: { needs: ['expression', 'connection', 'service'], emotions: ['gratitude', 'joy'], situation: 'Gratitude' },
  seeking: { needs: ['wisdom', 'understanding', 'direction', 'truth'], emotions: ['curiosity', 'confusion'], situation: 'Spiritual seeking' },
};

/* ── LAYER 2: Human Need → Gurmat Concept ── */
const NEED_CONCEPT_MAP = {
  confidence: [{ concept: 'hukam', weight: 0.9, theme: 'Trust in Hukam gives true confidence' }, { concept: 'bharosa', weight: 0.8, theme: 'Faith in Waheguru steady the mind' }, { concept: 'chardi_kala', weight: 0.6, theme: 'Rise with optimism' }],
  calm: [{ concept: 'hukam', weight: 0.85, theme: 'Surrender brings peace' }, { concept: 'simran', weight: 0.8, theme: 'Simran stills the mind' }, { concept: 'sahaj', weight: 0.7, theme: 'Natural ease through Naam' }],
  trust: [{ concept: 'bharosa', weight: 0.9, theme: 'Trust in the One' }, { concept: 'hukam', weight: 0.85, theme: 'Nothing happens without Hukam' }, { concept: 'raza', weight: 0.7, theme: 'Contentment in Divine Will' }],
  perspective: [{ concept: 'hukam', weight: 0.8, theme: 'See the bigger picture' }, { concept: 'chardi_kala', weight: 0.7, theme: 'This too shall pass' }],
  hope: [{ concept: 'asa', weight: 0.9, theme: 'Divine hope never dies' }, { concept: 'chardi_kala', weight: 0.85, theme: 'Eternal optimism' }, { concept: 'mehar', weight: 0.7, theme: 'Grace is flowing' }],
  acceptance: [{ concept: 'hukam', weight: 0.9, theme: 'Accept what is' }, { concept: 'sabar', weight: 0.8, theme: 'Patience in acceptance' }, { concept: 'raza', weight: 0.75, theme: 'Contentment' }],
  guidance: [{ concept: 'gurmat', weight: 0.9, theme: 'Guru\'s wisdom' }, { concept: 'sabad', weight: 0.8, theme: 'Shabad as guide' }, { concept: 'guru', weight: 0.7, theme: 'Guru\'s light' }],
  humility: [{ concept: 'nimrata', weight: 0.9, theme: 'True humility' }, { concept: 'haumai', weight: 0.8, theme: 'Ego dissolves' }, { concept: 'seva', weight: 0.7, theme: 'Service humbles' }],
  gratitude: [{ concept: 'shukar', weight: 0.9, theme: 'Thankfulness' }, { concept: 'seva', weight: 0.7, theme: 'Gratitude in action' }, { concept: 'santokh', weight: 0.6, theme: 'Contentment' }],
  forgiveness: [{ concept: 'khima', weight: 0.9, theme: 'Forgiveness frees' }, { concept: 'nadar', weight: 0.8, theme: 'Grace covers all' }, { concept: 'haumai', weight: 0.6, theme: 'Ego blocks forgiveness' }],
  peace: [{ concept: 'shanti', weight: 0.9, theme: 'Inner peace' }, { concept: 'simran', weight: 0.85, theme: 'Simran brings peace' }, { concept: 'sahaj', weight: 0.7, theme: 'Effortless peace' }],
  love: [{ concept: 'prem', weight: 0.9, theme: 'Divine love' }, { concept: 'bhakti', weight: 0.8, theme: 'Devotion' }, { concept: 'ik_onkar', weight: 0.6, theme: 'Love is the thread' }],
  patience: [{ concept: 'sabar', weight: 0.9, theme: 'Patience in waiting' }, { concept: 'hukam', weight: 0.7, theme: 'Trust the timing' }, { concept: 'dhiraj', weight: 0.6, theme: 'Forbearance' }],
  strength: [{ concept: 'chardi_kala', weight: 0.9, theme: 'Unconquerable spirit' }, { concept: 'simran', weight: 0.8, theme: 'Naam is strength' }, { concept: 'guru', weight: 0.7, theme: 'Guru\'s grace empowers' }],
  connection: [{ concept: 'sangat', weight: 0.9, theme: 'Holy company' }, { concept: 'ik_onkar', weight: 0.85, theme: 'One with all' }, { concept: 'prem', weight: 0.7, theme: 'Love connects' }],
  belonging: [{ concept: 'ik_onkar', weight: 0.9, theme: 'You belong to the One' }, { concept: 'sangat', weight: 0.85, theme: 'Find your sangat' }, { concept: 'guru', weight: 0.7, theme: 'Guru\'s family' }],
  wisdom: [{ concept: 'gurmat', weight: 0.9, theme: 'Gurmat wisdom' }, { concept: 'sabad', weight: 0.8, theme: 'Shabad enlightens' }, { concept: 'vichar', weight: 0.7, theme: 'Contemplation' }],
  grace: [{ concept: 'nadar', weight: 0.95, theme: 'Grace is always present' }, { concept: 'kirpa', weight: 0.9, theme: 'Mercy' }, { concept: 'mehar', weight: 0.8, theme: 'Blessing' }],
  healing: [{ concept: 'simran', weight: 0.8, theme: 'Simran heals' }, { concept: 'nadar', weight: 0.75, theme: 'Grace heals' }, { concept: 'sabar', weight: 0.7, theme: 'Healing takes time' }],
  purpose: [{ concept: 'seva', weight: 0.85, theme: 'Purpose through service' }, { concept: 'hukam', weight: 0.7, theme: 'Your role in Hukam' }, { concept: 'kirt_karni', weight: 0.6, theme: 'Work as purpose' }],
  'control-release': [{ concept: 'hukam', weight: 0.95, theme: 'Release control to Hukam' }, { concept: 'haumai', weight: 0.8, theme: 'Let go of ego\'s grip' }, { concept: 'bharosa', weight: 0.75, theme: 'Trust dissolves control' }],
  'self-worth': [{ concept: 'ik_onkar', weight: 0.9, theme: 'Your worth is the jot within' }, { concept: 'nadar', weight: 0.8, theme: 'Grace says you are enough' }, { concept: 'haumai', weight: 0.5, theme: 'Worth is not ego' }],
  expression: [{ concept: 'kirt_karni', weight: 0.7, theme: 'Express through honest work' }, { concept: 'seva', weight: 0.6, theme: 'Express through service' }],
  service: [{ concept: 'seva', weight: 0.9, theme: 'Service is the highest' }, { concept: 'vand_chhakna', weight: 0.7, theme: 'Share and consume together' }],
  understanding: [{ concept: 'vichar', weight: 0.9, theme: 'Contemplation brings understanding' }, { concept: 'gurmat', weight: 0.8, theme: 'Gurmat illuminates' }],
  'self-love': [{ concept: 'ik_onkar', weight: 0.85, theme: 'You are the same light as the One' }, { concept: 'nadar', weight: 0.75, theme: 'Grace loves you' }],
  direction: [{ concept: 'guru', weight: 0.9, theme: 'Guru shows the way' }, { concept: 'gurmat', weight: 0.8, theme: 'Follow Gurmat' }],
  contentment: [{ concept: 'santokh', weight: 0.9, theme: 'True contentment' }, { concept: 'shukar', weight: 0.8, theme: 'Gratitude' }],
  generosity: [{ concept: 'vand_chhakna', weight: 0.9, theme: 'Share generously' }, { concept: 'dan', weight: 0.8, theme: 'Give freely' }],
  'divine love': [{ concept: 'prem', weight: 0.9, theme: 'Love of the One' }, { concept: 'ik_onkar', weight: 0.85, theme: 'One Being' }],
  sangat: [{ concept: 'sangat', weight: 0.95, theme: 'Holy company lifts the soul' }, { concept: 'ik_onkar', weight: 0.7, theme: 'Oneness in sangat' }],
  release: [{ concept: 'khima', weight: 0.8, theme: 'Release through forgiveness' }, { concept: 'hukam', weight: 0.7, theme: 'Release to Hukam' }],
  'self-compassion': [{ concept: 'nadar', weight: 0.9, theme: 'Have compassion on yourself as Grace does' }, { concept: 'kirpa', weight: 0.85, theme: 'Extend mercy inward' }],
  faith: [{ concept: 'bharosa', weight: 0.9, theme: 'Faith in the One' }, { concept: 'hukam', weight: 0.85, theme: 'Faith in Hukam' }],
  commitment: [{ concept: 'kirt_karni', weight: 0.7, theme: 'Commitment to honest living' }, { concept: 'sabar', weight: 0.6, theme: 'Patience in commitment' }],
};

/* ── LAYER 3: Gurmat Concept → Search Hints ── */
const CONCEPT_SEARCH_MAP = {
  hukam: { keywords: ['hukam', 'raza', 'bhana', 'hukmi', 'hukme'], writers: ['Guru Nanak', 'Guru Arjan'], raags: ['Asa', 'Suhi', 'Gauri'], sourceId: 'G' },
  bharosa: { keywords: ['bharosa', 'bharvas', 'visvasi', 'trust', 'faith', 'sherna'], writers: ['Guru Arjan', 'Guru Nanak'], raags: ['Suhi', 'Bilaval'], sourceId: 'G' },
  simran: { keywords: ['simran', 'simar', 'simri', 'jap', 'japia', 'naam', 'smaran'], writers: ['Guru Amar Das', 'Guru Ram Das'], raags: ['Asa', 'Gauri'], sourceId: 'G' },
  sabar: { keywords: ['sabar', 'dheeraj', 'dheer', 'seetal', 'dhiraj'], writers: ['Guru Arjan', 'Guru Nanak'], raags: ['Gauri', 'Asa'], sourceId: 'G' },
  nadar: { keywords: ['nadar', 'nadri', 'karsan', 'prasadi'], writers: ['Guru Arjan', 'Guru Amar Das'], raags: ['Gauri', 'Ramkali'], sourceId: 'G' },
  kirpa: { keywords: ['kirpa', 'daya', 'mehar', 'mihar'], writers: ['Guru Arjan', 'Guru Ram Das'], raags: ['Gauri', 'Bilaval'], sourceId: 'G' },
  chardi_kala: { keywords: ['chardi', 'kala', 'chadhi', 'chadia'], writers: ['Guru Arjan'], raags: ['Gauri', 'Suhi'], sourceId: 'G' },
  asa: { keywords: ['asa', 'aas', 'asra', 'umeed'], writers: ['Guru Nanak', 'Guru Arjan'], raags: ['Asa'], sourceId: 'G' },
  nimrata: { keywords: ['nimrata', 'nimana', 'garib', 'vinay'], writers: ['Guru Amar Das', 'Guru Nanak'], raags: ['Ramkali', 'Suhi'], sourceId: 'G' },
  haumai: { keywords: ['haumai', 'haume', 'ahankar', 'maya', 'manmukh'], writers: ['Guru Nanak', 'Guru Amar Das'], raags: ['Asa', 'Ramkali'], sourceId: 'G' },
  sangat: { keywords: ['sangat', 'satsang', 'sadh', 'sajjan', 'sang'], writers: ['Guru Amar Das', 'Guru Arjan'], raags: ['Gauri', 'Bilaval'], sourceId: 'G' },
  seva: { keywords: ['seva', 'sewak', 'sewak', 'vand', 'chhakna'], writers: ['Guru Amar Das', 'Guru Nanak'], raags: ['Asa', 'Suhi'], sourceId: 'G' },
  ik_onkar: { keywords: ['ik', 'onkar', 'ek', 'onkaari', 'so', 'ham'], writers: ['Guru Nanak'], raags: ['Asa', 'Suhi'], sourceId: 'G' },
  santokh: { keywords: ['santokh', 'santokhia', 'santokhi'], writers: ['Guru Arjan'], raags: ['Gauri', 'Suhi'], sourceId: 'G' },
  shukar: { keywords: ['shukar', 'shukar', 'dhanvad', 'dhan'], writers: ['Guru Arjan', 'Guru Nanak'], raags: ['Asa', 'Suhi'], sourceId: 'G' },
  khima: { keywords: ['khima', 'mafi', 'muaf', 'bakhsh'], writers: ['Guru Arjan'], raags: ['Gauri'], sourceId: 'G' },
  prem: { keywords: ['prem', 'pyar', 'preeti', 'lal', 'mitar'], writers: ['Guru Arjan', 'Guru Nanak'], raags: ['Asa', 'Suhi'], sourceId: 'G' },
  guru: { keywords: ['guru', 'gur', 'satguru', 'gurdev', 'gurparsad'], writers: ['Guru Nanak', 'Guru Arjan'], raags: ['Asa', 'Gauri'], sourceId: 'G' },
  shanti: { keywords: ['shanti', 'sukh', 'chaint', 'sehej', 'seetal'], writers: ['Guru Arjan', 'Guru Nanak'], raags: ['Gauri', 'Suhi'], sourceId: 'G' },
  sahaj: { keywords: ['sahaj', 'sahj', 'sehej'], writers: ['Guru Arjan', 'Guru Nanak'], raags: ['Suhi', 'Bilaval'], sourceId: 'G' },
  gurmat: { keywords: ['gurmat', 'gurmati', 'gur', 'vichar'], writers: ['Guru Arjan', 'Guru Nanak'], raags: ['Gauri', 'Asa'], sourceId: 'G' },
  sabad: { keywords: ['sabad', 'shabad', 'bani', 'gurbani'], writers: ['Guru Nanak', 'Guru Arjan'], raags: ['Asa', 'Suhi'], sourceId: 'G' },
  raza: { keywords: ['raza', 'razi', 'bhana'], writers: ['Guru Arjan', 'Guru Nanak'], raags: ['Suhi', 'Gauri'], sourceId: 'G' },
  mehar: { keywords: ['mehar', 'mihar', 'kirpa'], writers: ['Guru Arjan', 'Guru Ram Das'], raags: ['Gauri', 'Bilaval'], sourceId: 'G' },
  moh: { keywords: ['moh', 'maya', 'moha', 'trishna', 'lobh'], writers: ['Guru Nanak', 'Guru Amar Das'], raags: ['Asa', 'Ramkali'], sourceId: 'G' },
  bhakti: { keywords: ['bhakti', 'bhagti', 'bhajan'], writers: ['Guru Arjan', 'Guru Nanak'], raags: ['Asa', 'Suhi'], sourceId: 'G' },
  dhiraj: { keywords: ['dhiraj', 'dheer', 'dheeraj'], writers: ['Guru Arjan', 'Guru Nanak'], raags: ['Gauri', 'Suhi'], sourceId: 'G' },
  vichar: { keywords: ['vichar', 'vichardia', 'soch'], writers: ['Guru Arjan', 'Guru Nanak'], raags: ['Gauri'], sourceId: 'G' },
  kirt_karni: { keywords: ['kirt', 'karni', 'kamai', 'udham'], writers: ['Guru Arjan', 'Guru Nanak'], raags: ['Suhi', 'Bilaval'], sourceId: 'G' },
  vand_chhakna: { keywords: ['vand', 'chhakna', 'vand kee'], writers: ['Guru Amar Das'], raags: ['Gauri'], sourceId: 'G' },
  dan: { keywords: ['dan', 'datu', 'data'], writers: ['Guru Arjan', 'Guru Nanak'], raags: ['Asa'], sourceId: 'G' },
};

const EXPERIENCE_PATTERNS = [
  { keywords: ['exam', 'test', 'study', 'result', 'grade', 'fail', 'pass', 'performance'], keys: ['exam', 'failure'] },
  { keywords: ['job', 'career', 'interview', 'work', 'promotion', 'salary', 'profession', 'office', 'colleague', 'boss'], keys: ['job', 'purpose'] },
  { keywords: ['relationship', 'partner', 'love', 'boyfriend', 'girlfriend', 'husband', 'wife', 'marriage', 'divorce', 'breakup', 'betrayed', 'trust', 'commitment'], keys: ['relationship', 'marriage', 'breakup'] },
  { keywords: ['death', 'died', 'passed away', 'funeral', 'loss', 'grief', 'mourn', 'bereavement'], keys: ['death', 'sadness'] },
  { keywords: ['money', 'financial', 'debt', 'loan', 'poor', 'rich', 'wealth', 'bills', 'expensive', 'broke', 'afford'], keys: ['money', 'security'] },
  { keywords: ['health', 'sick', 'ill', 'disease', 'hospital', 'pain', 'surgery', 'medical', 'cancer', 'diagnosis'], keys: ['health', 'sadness'] },
  { keywords: ['alone', 'lonely', 'nobody', 'isolated', 'disconnected', 'no one', 'forgotten'], keys: ['loneliness', 'connection'] },
  { keywords: ['angry', 'furious', 'frustrated', 'irritated', 'annoyed', 'mad', 'rage', 'frustration'], keys: ['anger', 'peace'] },
  { keywords: ['guilty', 'regret', 'sorry', 'mistake', 'ashamed', 'guilt', 'remorse', 'blame'], keys: ['guilt', 'forgiveness'] },
  { keywords: ['sad', 'unhappy', 'depressed', 'down', 'low', 'heavy', 'crying', 'tears', 'heartbroken'], keys: ['sadness', 'healing'] },
  { keywords: ['anxious', 'anxiety', 'nervous', 'worry', 'panic', 'stress', 'overthink', 'restless', 'tense'], keys: ['anxiety', 'calm'] },
  { keywords: ['confused', 'confusion', 'uncertain', 'not sure', 'don\'t understand', 'unclear', 'puzzled', 'lost'], keys: ['confusion', 'guidance'] },
  { keywords: ['grateful', 'thankful', 'blessed', 'gratitude', 'appreciate', 'shukar', 'thank you'], keys: ['gratitude', 'connection'] },
  { keywords: ['meaning', 'purpose', 'why', 'what is', 'explain', 'tell me about', 'concept', 'teach me'], keys: ['seeking', 'wisdom'] },
];

export function initConceptExpander() {
  /* Detect human experience from text */
  function detectExperience(text) {
    const lower = text.toLowerCase();
    let best = null;
    let maxMatches = 0;
    for (const pattern of EXPERIENCE_PATTERNS) {
      const matches = pattern.keywords.filter(function(k) { return lower.includes(k); }).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        best = pattern;
      }
    }
    if (best && maxMatches > 0) {
      const experiences = best.keys.map(function(k) { return EXPERIENCE_NEED_MAP[k]; }).filter(Boolean);
      const needs = [];
      const emotions = [];
      for (const exp of experiences) {
        for (const n of exp.needs) { if (!needs.includes(n)) needs.push(n); }
        for (const e of exp.emotions) { if (!emotions.includes(e)) emotions.push(e); }
      }
      return { experiences: best.keys, needs, emotions, situation: experiences[0] ? experiences[0].situation : '' };
    }
    return null;
  }

  /* Expand from detection — walks Layer 1 → Layer 2 */
  function expand(detection) {
    const { intent, emotion, subtext, text } = detection;
    const concepts = [];
    const seen = new Set();

    // Layer 1 → Layer 2: Experience → Need → Concept
    const experience = detectExperience(text || '');
    if (experience) {
      for (const need of experience.needs) {
        const needConcepts = NEED_CONCEPT_MAP[need] || [];
        for (const c of needConcepts) {
          if (!seen.has(c.concept)) {
            concepts.push({ ...c, source: 'human_need' });
            seen.add(c.concept);
          }
        }
      }
    }

    // Fallback: emotion → concept (if no experience detected)
    if (concepts.length === 0 && emotion) {
      const emotionNeedMap = {
        anxiety: 'calm', fear: 'trust', sadness: 'comfort', anger: 'peace',
        loneliness: 'connection', guilt: 'forgiveness', shame: 'grace',
        grief: 'comfort', despair: 'hope', confusion: 'wisdom',
        gratitude: 'gratitude', pride: 'humility', joy: 'gratitude',
        love: 'love', hopelessness: 'hope', frustration: 'peace',
      };
      const need = emotionNeedMap[emotion];
      if (need) {
        const needConcepts = NEED_CONCEPT_MAP[need] || [];
        for (const c of needConcepts) {
          if (!seen.has(c.concept)) {
            concepts.push({ ...c, source: 'emotion_need' });
            seen.add(c.concept);
          }
        }
      }
    }

    concepts.sort(function(a, b) { return b.weight - a.weight; });
    return {
      concepts: concepts.slice(0, 5),
      primaryTheme: concepts.length > 0 ? concepts[0].theme : 'General Gurbani wisdom',
      searchHint: concepts.slice(0, 3).map(function(c) { return c.concept; }).join(' '),
      experience,
    };
  }

  /* Expand with wisdom context */
  function expandWithWisdom(detection, wisdom) {
    const base = expand(detection);
    const concepts = [...base.concepts];
    const seen = new Set(concepts.map(function(c) { return c.concept; }));

    if (wisdom && wisdom.wisdomConcepts) {
      for (const wc of wisdom.wisdomConcepts) {
        if (!seen.has(wc)) {
          const searchEntry = CONCEPT_SEARCH_MAP[wc];
          concepts.push({
            concept: wc,
            weight: 0.9,
            theme: searchEntry ? searchEntry.keywords.join(', ') : wc,
            source: 'wisdom',
          });
          seen.add(wc);
        }
      }
    }

    concepts.sort(function(a, b) { return b.weight - a.weight; });

    return {
      concepts: concepts.slice(0, 6),
      primaryTheme: wisdom ? wisdom.truth.statement.slice(0, 80) : base.primaryTheme,
      searchHint: concepts.slice(0, 4).map(function(c) { return c.concept; }).join(' '),
      wisdomContext: wisdom ? {
        illusion: wisdom.primaryIllusion.illusion,
        truth: wisdom.truth.statement,
        transformation: wisdom.transformation,
      } : null,
      experience: base.experience,
    };
  }

  /* Get search hints for a concept (Layer 3) */
  function getSearchHints(concepts) {
    const hints = [];
    for (const c of concepts) {
      const entry = CONCEPT_SEARCH_MAP[c];
      if (entry) {
        hints.push(...entry.keywords);
      }
    }
    return [...new Set(hints)].slice(0, 6);
  }

  /* Legacy support — detectLifeSituation still works but delegates to new system */
  function detectLifeSituation(text) {
    return detectExperience(text);
  }

  return { expand, expandWithWisdom, detectExperience, detectLifeSituation, getSearchHints, EXPERIENCE_NEED_MAP, NEED_CONCEPT_MAP, CONCEPT_SEARCH_MAP };
}
