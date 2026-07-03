/* ── Wisdom Retrieval & Ranking Pipeline ──
   The heart of ANHAD.
   Orchestrates: listen → see the illusion → reflect → recall → score by transformation → select → explain.
   Every stage is independently replaceable (embeddings, vector search, local models, etc).

   This pipeline does not ask "what matches the query?"
   It asks: "What illusion is this person trapped in? What truth is Guru Sahib inviting them toward?" */

const DEFAULT_WEIGHTS = {
  transformationDepth: 0.50,
  wisdomConceptMatch: 0.25,
  keywordMatch:   0.15,
  authority:      0.10,
};

const DEFAULT_RELEVANCE_THRESHOLD = 0.30;

export function initWisdomRetrieval(deps, options) {
  const { rag, intentAnalyzer, conceptExpander, wisdomReasoner } = deps;
  const weights = (options && options.weights) ? { ...DEFAULT_WEIGHTS, ...options.weights } : { ...DEFAULT_WEIGHTS };
  const RELEVANCE_THRESHOLD = (options && options.threshold != null) ? options.threshold : DEFAULT_RELEVANCE_THRESHOLD;

  /* ── ShabadHistory — tracks recently shown Shabads for diversity ──
     - Stores last 50 shabad IDs with timestamps
     - Stores last 20 theme/concept names
     - Provides penalty scores for ranking */
  function createShabadHistory() {
    const MAX_SHABADS = 50;
    const MAX_THEMES = 30;
    const PENALTY_RECENT = 0.35;
    const PENALTY_THEME = 0.20;
    const DECAY_HOURS = 48;

    let shownShabads = [];
    let shownThemes = [];

    /* Load from localStorage if available */
    try {
      const saved = localStorage.getItem('anhad_shabad_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.shownShabads) shownShabads = parsed.shownShabads;
        if (parsed.shownThemes) shownThemes = parsed.shownThemes;
      }
    } catch {}

    function save() {
      try {
        localStorage.setItem('anhad_shabad_history', JSON.stringify({ shownShabads, shownThemes }));
      } catch {}
    }

    /* Record a shabad that was shown to the user */
    function record(shabadId, concepts) {
      if (shabadId) {
        shownShabads.unshift({ id: shabadId, ts: Date.now(), concepts: concepts || [] });
        if (shownShabads.length > MAX_SHABADS) shownShabads.length = MAX_SHABADS;
      }
      if (concepts) {
        for (const c of concepts) {
          const conceptName = typeof c === 'string' ? c : (c.concept || '');
          if (conceptName) {
            shownThemes.unshift({ theme: conceptName, ts: Date.now() });
          }
        }
        if (shownThemes.length > MAX_THEMES) shownThemes.length = MAX_THEMES;
      }
      save();
    }

    /* Get diversity penalty for a candidate verse (0 to 1) */
    function getDiversityPenalty(candidate) {
      const id = candidate.shabadId || candidate.verseId || '';
      if (!id) return 0;
      let penalty = 0;

      // 1. Recently used shabad penalty
      const recentEntry = shownShabads.find(function(e) { return e.id === id; });
      if (recentEntry) {
        const hoursAgo = (Date.now() - recentEntry.ts) / 3600000;
        if (hoursAgo < DECAY_HOURS) {
          penalty += PENALTY_RECENT * (1 - hoursAgo / DECAY_HOURS);
        }
      }

      // 2. Recent theme penalty — check if candidate's gurmukhi/english contains recently shown themes
      const combined = (candidate.unicode + ' ' + candidate.english + ' ' + candidate.punjabi + ' ' + (candidate.gurmukhi || '')).toLowerCase();
      for (const entry of shownThemes.slice(0, 15)) {
        if (combined.includes(entry.theme.toLowerCase())) {
          const hoursAgo = (Date.now() - entry.ts) / 3600000;
          if (hoursAgo < 24) {
            penalty += PENALTY_THEME * 0.3;
            break;
          }
        }
      }

      // 3. Same-source penalty (same writer/raag repeated recently)
      if (candidate.writer) {
        const recentWriter = shownShabads.slice(0, 10).some(function(e) {
          return e.concepts && e.concepts.some(function(c) {
            return typeof c === 'object' && c.writer === candidate.writer;
          });
        });
        if (recentWriter) penalty += 0.08;
      }

      return Math.min(penalty, 1);
    }

    /* Get novelty bonus for unexplored concepts (how fresh is this candidate) */
    function getNoveltyBonus(candidate, expansion) {
      let bonus = 0;
      const combined = (candidate.unicode + ' ' + candidate.english + ' ' + candidate.punjabi + ' ' + (candidate.gurmukhi || '')).toLowerCase();

      // Bonus 1: Unexplored wisdom concept
      if (expansion && expansion.concepts) {
        for (const ec of expansion.concepts) {
          const conceptName = ec.concept || '';
          if (conceptName) {
            const recentlyShown = shownThemes.slice(0, 10).some(function(t) { return t.theme === conceptName; });
            if (!recentlyShown) bonus += 0.05;
          }
        }
      }

      // Bonus 2: Different writer than recent
      if (candidate.writer) {
        const recentWriters = shownShabads.slice(0, 8).map(function(e) {
          return e.concepts && e.concepts[0] && typeof e.concepts[0] === 'object' ? e.concepts[0].writer : null;
        }).filter(Boolean);
        if (recentWriters.length > 0 && !recentWriters.includes(candidate.writer)) {
          bonus += 0.06;
        }
      }

      // Bonus 3: Different raag than recent
      if (candidate.raag) {
        const recentRaags = shownShabads.slice(0, 5).map(function(e) {
          return e.concepts && e.concepts[0] && typeof e.concepts[0] === 'object' ? e.concepts[0].raag : null;
        }).filter(Boolean);
        if (recentRaags.length > 0 && !recentRaags.includes(candidate.raag)) {
          bonus += 0.04;
        }
      }

      return Math.min(bonus, 0.3);
    }

    /* Get journey progression count for a concept (how many times this theme has been shown) */
    function getThemeDepth(conceptName) {
      return shownThemes.filter(function(t) { return t.theme === conceptName; }).length;
    }

    function getRecentIds() {
      return shownShabads.slice(0, 20).map(function(e) { return e.id; });
    }

    return { record, getDiversityPenalty, getNoveltyBonus, getThemeDepth, getRecentIds };
  }

  /* Create the history tracker — shared across all calls */
  const shabadHistory = createShabadHistory();

  /* ── Conversation Mode Detection ──
     Two-pass classification:
     Pass 1: Fast pattern match (crisis, greeting, casual, translation)
     Pass 2: Semantic check (Gurmat keywords → spiritual, even if starts with "what is")
     This determines whether Gurbani retrieval runs at all. */
  const CONVERSATION_PATTERNS = {
    crisis: [
      'suicide', 'kill myself', 'end my life', 'want to die', 'better off dead',
      'self-harm', 'hurt myself', 'can\'t go on', 'no reason to live',
    ],
    factual_inquiry: [
      'what is', 'what are', 'who is', 'who was', 'when did', 'where is', 'how to',
      'definition', 'meaning of', 'translate', 'tell me about', 'explain',
      'what does', 'how does', 'why does', 'history of', 'origin',
    ],
    translation_request: [
      'what does', 'mean in', 'translate', 'how do you say', 'in punjabi',
      'in english', 'meaning of', 'word for', 'gurmukhi for',
    ],
    greeting: [
      'hi', 'hello', 'hey', 'waheguru', 'sat sri akal', 'sat sri akaal',
      'namaste', 'good morning', 'good evening', 'kaise ho', 'ki haal',
    ],
    casual_chat: [
      'how are you', 'what can you do', 'who are you', 'tell me about yourself',
      'what\'s up', 'kya kar rahe ho',
    ],
  };

  /* Gurmat keywords — if the user asks about any of these, it's spiritual even if phrased as a question */
  const GURMAT_KEYWORDS = [
    'hukam', 'simran', 'naam', 'gurbani', 'guru', 'shabad', 'bani', 'ik onkar',
    'waheguru', 'gurmat', 'seva', 'sangat', 'ardas', 'hukamnama',
    'sikh', 'sikhi', 'kirtan', 'gurmukhi', 'anhad', 'chardi kala',
    'chardi', 'sabar', 'sahaj', 'bharosa', 'nadar', 'kirpa',
    'nitnem', 'paath', 'rehat', 'maryada', 'kaur', 'singh',
    'gurpurab', 'gurudwara', 'gurughar', 'satguru', 'gurdev',
    'dukh', 'sukh', 'haumai', 'maya', 'moh', 'lobh', 'krodh',
    'kaam', 'ahankar', 'nimrata', 'santokh', 'vand chhakna',
    'kirt karo', 'kirt karni', 'jap', 'jaap', 'simar',
    'dasam', 'sri guru', 'guru granth', 'sggs', 'ang',
  ];

  function stageConversationMode(text) {
    const lower = text.toLowerCase().trim();
    const wordCount = lower.split(/\s+/).filter(Boolean).length;

    // Crisis — always detect first
    for (const kw of CONVERSATION_PATTERNS.crisis) {
      if (lower.includes(kw)) {
        return { type: 'crisis', needsGurbani: true, label: 'Crisis support', runPipeline: true };
      }
    }

    // Greeting — detect if message is very short or pure greeting
    for (const kw of CONVERSATION_PATTERNS.greeting) {
      if (lower === kw || lower.startsWith(kw + ' ') || lower.endsWith(' ' + kw) || lower === ('waheguru ' + kw).trim()) {
        return { type: 'greeting', needsGurbani: false, label: 'Greeting', runPipeline: false };
      }
    }

    // Casual chat
    for (const kw of CONVERSATION_PATTERNS.casual_chat) {
      if (lower.includes(kw)) {
        return { type: 'casual_chat', needsGurbani: false, label: 'Casual chat', runPipeline: false };
      }
    }

    // Pass 1: Fast pattern scores
    let factualScore = 0;
    for (const kw of CONVERSATION_PATTERNS.factual_inquiry) {
      if (lower.startsWith(kw + ' ') || lower.startsWith(kw)) factualScore++;
    }
    let translationScore = 0;
    for (const kw of CONVERSATION_PATTERNS.translation_request) {
      if (lower.includes(kw) && lower.includes(' ') && wordCount < 15) translationScore++;
    }

    // Pure translation (short, has translation words, no Gurmat)
    if (translationScore > 0 && wordCount <= 10) {
      return { type: 'translation_request', needsGurbani: false, label: 'Translation request', runPipeline: false };
    }

    // Pass 2: Gurmat keyword check — overrides factual classification
    // "What is Hukam?" has factual_score=1 but Gurmat keyword "hukam" → spiritual
    const gurmatMatchCount = GURMAT_KEYWORDS.filter(function(k) { return lower.includes(k); }).length;
    if (gurmatMatchCount > 0 && wordCount <= 20) {
      return { type: 'spiritual_seeking', needsGurbani: true, label: 'Gurbani concept query', runPipeline: true, gurmatMatchCount };
    }

    // Pure factual (has question words, no Gurmat)
    if (factualScore > 0 && wordCount <= 20) {
      return { type: 'factual_inquiry', needsGurbani: false, label: 'Factual inquiry', runPipeline: false };
    }

    // Short non-personal messages without Gurmat → factual
    if (wordCount <= 3 && !lower.includes('i ') && !lower.includes('my ') && !lower.includes('me ')) {
      return { type: 'factual_inquiry', needsGurbani: false, label: 'Short query (likely factual)', runPipeline: false };
    }

    // Personal messages or longer — check for Gurmat keywords for override
    if (gurmatMatchCount > 0) {
      return { type: 'spiritual_seeking', needsGurbani: true, label: 'Personal with Gurbani context', runPipeline: true };
    }

    // Default: spiritual seeking — full pipeline
    return { type: 'spiritual_seeking', needsGurbani: true, label: 'Spiritual seeking', runPipeline: true };
  }

  async function retrieve(text, history) {
    const trace = { input: text, stages: [], timestamp: Date.now() };

    // Stage 0: Conversation Mode
    const mode = stageConversationMode(text);
    trace.stages.push({ name: 'conversation_mode', output: mode });

    if (!mode.needsGurbani) {
      // Still run detection (for context) but skip retrieval
      const detection = await stageDetection(text, history, trace);
      trace.primary = null;
      trace.related = [];
      trace.belowThreshold = [];
      return {
        needsGurbani: false,
        mode: mode.type,
        primary: null,
        related: [],
        belowThreshold: [],
        threshold: RELEVANCE_THRESHOLD,
        detection,
        wisdom: null,
        expansion: { concepts: [], primaryTheme: 'N/A', searchHint: '' },
        trace,
      };
    }

    // Full pipeline for spiritual/crisis queries
    const detection = await stageDetection(text, history, trace);
    const humanNeed = wisdomReasoner.inferHumanNeed(text, detection);
    trace.stages.push({ name: 'human_need', output: humanNeed });
    const wisdom = await stageWisdom(detection, trace);
    const expansion = await stageExpansion(detection, wisdom, trace);

    // Multi-Query Expansion (6 parallel search queries from concepts + wisdom)
    const queries = buildMultiQueries(text, expansion, wisdom);
    trace.stages.push({ name: 'multi_query', queries });

    // Counterfactual search — search anti-concepts for contrast
    const counterfactualQueries = buildCounterfactualQueries(wisdom, expansion);

    // Recall: fetch all candidates from all queries
    const rawCandidates = await stageMultiRecall(queries, trace);
    const counterfactualCandidates = counterfactualQueries.length > 0
      ? await stageMultiRecall(counterfactualQueries, trace)
      : [];
    trace.stages[trace.stages.length - 1].counterfactualFetched = counterfactualCandidates.length;

    // Merge and deduplicate
    const allCandidates = mergeCandidates(rawCandidates, counterfactualCandidates);

    // Ensure minimum 30 candidates for diversity — add fallback queries if needed
    const beforeFallback = allCandidates.length;
    const sufficientCandidates = await ensureCandidateCount(allCandidates, queries, expansion, text, trace);
    const fallbackAdded = Math.max(0, sufficientCandidates.length - beforeFallback);
    trace.stages.push({ name: 'diversity_prep', candidatesTotal: sufficientCandidates.length, fallbackAdded });

    // Cross-ranking: score against all queries, not just one
    const ranked = stageCrossRanking(sufficientCandidates, text, queries, wisdom, expansion, trace);

    // Self-verification gate
    const verified = stageSelfVerification(ranked, wisdom, humanNeed, trace);

    // Selection
    const selected = stageSelection(verified, wisdom, trace);

    // Build human-need context
    const needContext = {
      primaryNeed: humanNeed.primaryNeed,
      needStatement: humanNeed.needStatement,
      secondaryNeeds: humanNeed.secondaryNeeds,
    };

    // Add primary/related data to trace for debug panel
    trace.primary = selected.primary;
    trace.related = selected.related;
    trace.belowThreshold = selected.belowThreshold;

    return {
      needsGurbani: true,
      mode: mode.type,
      primary: selected.primary,
      related: selected.related,
      belowThreshold: selected.belowThreshold,
      threshold: RELEVANCE_THRESHOLD,
      detection,
      wisdom,
      expansion,
      humanNeed: needContext,
      trace,
    };
  }

  /* ── Multi-Query Builder ──
     Generate diverse search queries from concepts + wisdom context.
     Queries are deduplicated by word overlap (>60% overlap = dropped). */
  function queriesOverlap(a, b) {
    const wordsA = a.toLowerCase().split(/\s+/).filter(function(w) { return w.length > 3; });
    const wordsB = b.toLowerCase().split(/\s+/).filter(function(w) { return w.length > 3; });
    if (wordsA.length === 0 || wordsB.length === 0) return false;
    const shorter = wordsA.length <= wordsB.length ? wordsA : wordsB;
    const longer = wordsA.length <= wordsB.length ? wordsB : wordsA;
    const overlapCount = shorter.filter(function(w) { return longer.includes(w); }).length;
    return (overlapCount / shorter.length) > 0.6;
  }

  function addDiverseQuery(queries, query, type, weight) {
    for (const existing of queries) {
      if (queriesOverlap(existing.query, query)) return false;
    }
    queries.push({ query, type, weight });
    return true;
  }

  function buildMultiQueries(text, expansion, wisdom) {
    const queries = [];

    // 1. Primary concept query (from expansion)
    const conceptWords = expansion.concepts.slice(0, 3).map(function(c) { return c.concept; });
    if (conceptWords.length > 0) {
      addDiverseQuery(queries, conceptWords.join(' '), 'concept', 1.0);
    }

    // 2. Wisdom concept query
    if (wisdom && wisdom.wisdomConcepts) {
      addDiverseQuery(queries, wisdom.wisdomConcepts.slice(0, 4).join(' '), 'wisdom', 0.9);
    }

    // 3. Truth keyword query
    if (wisdom && wisdom.truth) {
      const truthWords = wisdom.truth.statement.toLowerCase().split(/\s+/)
        .filter(function(w) { return w.length > 4 && !['your', 'that', 'this', 'from', 'have', 'been', 'with', 'what', 'when', 'their', 'which', 'being', 'about'].includes(w); })
        .slice(0, 4);
      if (truthWords.length > 0) {
        addDiverseQuery(queries, truthWords.join(' '), 'truth', 0.8);
      }
    }

    // 4. Raw text keywords
    const rawWords = text.toLowerCase().split(/\s+/)
      .filter(function(w) { return w.length > 3; })
      .slice(0, 4);
    if (rawWords.length > 0) {
      addDiverseQuery(queries, rawWords.join(' '), 'keyword', 0.5);
    }

    // 5. Emotion + concept hybrid
    if (expansion.experience && expansion.experience.emotions.length > 0) {
      const emoConcepts = expansion.concepts.slice(0, 2).map(function(c) { return c.concept; });
      const emotionWords = expansion.experience.emotions.slice(0, 2);
      addDiverseQuery(queries, [...emotionWords, ...emoConcepts].join(' '), 'emotion_hybrid', 0.7);
    }

    // 6. Life situation query
    if (expansion.experience && expansion.experience.situation) {
      const sitWords = expansion.experience.situation.toLowerCase().split(/\s+/);
      const sitConcepts = expansion.concepts.slice(0, 2).map(function(c) { return c.concept; });
      addDiverseQuery(queries, [...sitWords, ...sitConcepts].join(' '), 'situation', 0.6);
    }

    // Fill remaining slots with concept variations
    if (queries.length < 3) {
      for (const c of expansion.concepts) {
        if (queries.length >= 6) break;
        addDiverseQuery(queries, c.concept, 'single_concept', 0.5);
      }
    }

    return queries.slice(0, 6);
  }

  /* ── Counterfactual Query Builder ──
     Search for what the opposite of the wisdom concept looks like.
     Used for contrast retrieval — finding verses that represent the illusion. */
  function buildCounterfactualQueries(wisdom, expansion) {
    if (!wisdom) return [];
    const antiConcepts = {
      hukam: ['manmukh', 'haumai', 'ahankar'],
      bharosa: ['duvidha', 'bharam', 'khot'],
      simran: ['bharam', 'maya', 'lobh'],
      sabar: ['krodh', 'veer', 'utavla'],
      chardi_kala: ['nirash', 'udash', 'dil'],
      haumai: ['manmukh', 'ahankar', 'kaam'],
      nadar: ['krodh', 'nirday'],
      sangat: ['manmukh', 'durat', 'kubeer'],
    };
    const queries = [];
    const seen = new Set();
    const conceptList = wisdom.wisdomConcepts || expansion.concepts.map(function(c) { return c.concept; });
    for (const c of conceptList) {
      const anti = antiConcepts[c];
      if (anti) {
        for (const a of anti) {
          if (!seen.has(a)) {
            queries.push({ query: a, type: 'counterfactual', weight: 0.3, antiConcept: c });
            seen.add(a);
          }
        }
      }
    }
    return queries.slice(0, 3);
  }

  /* ── Multi-Recall ──
     Fetch candidates for each query in parallel */
  async function stageMultiRecall(queries, trace) {
    const results = await Promise.all(queries.map(function(q) {
      return rag.search(q.query).then(function(result) {
        return { queryType: q.type, query: q.query, verses: (result && result.verses ? result.verses : []) };
      });
    }));
    trace.stages.push({ name: 'multi_recall', numQueries: queries.length, results: results.map(function(r) { return { queryType: r.queryType, count: r.verses.length }; }) });
    return results;
  }

  /* ── Merge & Deduplicate ── */
  function mergeCandidates(primaryResults, counterfactualResults) {
    const seen = new Set();
    const merged = [];

    // Process primary queries first (highest relevance)
    for (const result of primaryResults) {
      for (const v of result.verses) {
        const id = v.verseId || v.shabadId || v.unicode;
        if (id && !seen.has(id)) {
          merged.push({ ...v, _queryType: result.queryType, _query: result.query });
          seen.add(id);
        }
      }
    }

    // Then counterfactual (marked as such)
    for (const result of counterfactualResults) {
      for (const v of result.verses) {
        const id = v.verseId || v.shabadId || v.unicode;
        if (id && !seen.has(id)) {
          merged.push({ ...v, _queryType: result.queryType, _query: result.query, _counterfactual: true });
          seen.add(id);
        }
      }
    }

    return merged;
  }

  /* ── Stage 1: Listen ── */
  async function stageDetection(text, history, trace) {
    const result = intentAnalyzer.detect(text, history);
    trace.stages.push({ name: 'detection', input: text, output: result });
    return result;
  }

  /* ── Stage 2: Wisdom ── */
  async function stageWisdom(detection, trace) {
    const result = wisdomReasoner.analyze(detection);
    trace.stages.push({
      name: 'wisdom',
      input: detection,
      output: {
        illusion: result.primaryIllusion.illusion,
        truth: result.truth.statement,
        transformation: result.transformation,
        clarity: result.clarity,
      },
    });
    return result;
  }

  /* ── Stage 3: Reflect ── */
  async function stageExpansion(detection, wisdom, trace) {
    const result = conceptExpander.expandWithWisdom(detection, wisdom);
    const experience = conceptExpander.detectExperience(trace.input);
    trace.stages.push({ name: 'expansion', input: { detection, wisdom }, output: { ...result, experience } });
    return { ...result, experience };
  }

  /* ── Ensure Minimum Candidate Count ──
     If we have fewer than 30 candidates, generate fallback queries from
     the wisdom knowledge graph to get more diverse candidates.
     This ensures the diversity clustering has enough material to work with. */
  async function ensureCandidateCount(candidates, existingQueries, expansion, originalText, trace) {
    if (candidates.length >= 30) return candidates;
    const existingQueryTexts = new Set(existingQueries.map(function(q) { return q.query.toLowerCase(); }));
    const fallbackQueries = [];

    // Generate diverse fallback queries from wisdom concepts
    if (expansion && expansion.concepts) {
      const conceptNames = expansion.concepts.map(function(c) { return c.concept; }).filter(Boolean);
      const added = new Set();
      for (const name of conceptNames) {
        const parts = name.replace(/_/g, ' ').split(/\s+/).filter(Boolean);
        for (const p of parts) {
          if (p.length > 3 && !existingQueryTexts.has(p.toLowerCase()) && !added.has(p)) {
            fallbackQueries.push({ query: p, type: 'fallback_concept', weight: 0.4 });
            added.add(p);
            if (fallbackQueries.length >= 4) break;
          }
        }
        if (fallbackQueries.length >= 4) break;
      }
    }

    // Add wisdom illusion/truth words as fallback
    if (expansion && expansion.experience && expansion.experience.situation) {
      const sitWords = expansion.experience.situation.toLowerCase().split(/\s+/).filter(function(w) {
        return w.length > 4 && !existingQueryTexts.has(w);
      }).slice(0, 3);
      for (const w of sitWords) {
        fallbackQueries.push({ query: w, type: 'fallback_situation', weight: 0.35 });
      }
    }

    // Generic Gurmat concept fallbacks (if still not enough)
    if (candidates.length + fallbackQueries.length < 20) {
      const genericConcepts = ['hukam', 'simran', 'naam', 'sach', 'sabar', 'seva', 'sahaj', 'bharosa'];
      for (const gc of genericConcepts) {
        if (!existingQueryTexts.has(gc) && fallbackQueries.every(function(fq) { return !fq.query.toLowerCase().includes(gc); })) {
          fallbackQueries.push({ query: gc, type: 'fallback_generic', weight: 0.25 });
          if (fallbackQueries.length >= 6) break;
        }
      }
    }

    if (fallbackQueries.length === 0) return candidates;

    const fallbackResults = await stageMultiRecall(fallbackQueries, trace);
    const merged = mergeCandidates(fallbackResults, []);
    // Only add verses not already in candidates
    const existingIds = new Set(candidates.map(function(c) { return c.verseId || c.shabadId || c.unicode; }));
    for (const v of merged) {
      const id = v.verseId || v.shabadId || v.unicode;
      if (id && !existingIds.has(id)) {
        candidates.push(v);
        existingIds.add(id);
      }
    }
    return candidates;
  }

  /* ── Stage 4: Cross-Ranking ──
     Each Shabad is scored against ALL queries, not just the one that found it.
     Uses contrastive anti-concept scoring:
     - Matches BOTH concept and anti-concept → teaching by contrast (bonus)
     - Matches ONLY anti-concept → wrong direction (penalty)
     - Matches neither → neutral */
  function stageCrossRanking(candidates, text, queries, wisdom, expansion, trace) {
    const scored = candidates.map(function(c) {
      const combinedText = (c.unicode + ' ' + c.gurmukhi + ' ' + c.english + ' ' + c.punjabi).toLowerCase();

      const transformScore = wisdomReasoner.scoreTransformation(combinedText, wisdom, expansion);
      const wisdomConceptScore = scoreWisdomConcepts(combinedText, wisdom, expansion);
      const keywordScore = scoreKeywordMatch(combinedText, text);
      const authorityScore = scoreAuthority(c);

      // Cross-query relevance: how many queries does this verse match?
      const crossQueryScore = scoreCrossQueryRelevance(combinedText, queries);

      // Contrastive anti-concept scoring
      const conceptScore = Math.max(transformScore, wisdomConceptScore);
      const antiScore = scoreAntiConcepts(combinedText, wisdom);
      // Bonus for teaching by contrast (matches both concept + anti)
      const contrastBonus = Math.min(conceptScore, antiScore) * 0.15;
      // Penalty for only matching anti (wrong direction)
      const antiPenalty = Math.max(0, antiScore - conceptScore) * 0.2;

      // Diversity — penalize recently shown shabads, reward unexplored territory
      const diversityPenalty = shabadHistory.getDiversityPenalty(c);
      const noveltyBonus = shabadHistory.getNoveltyBonus(c, expansion);

      const total = (
        transformScore * weights.transformationDepth +
        wisdomConceptScore * weights.wisdomConceptMatch +
        keywordScore * weights.keywordMatch +
        authorityScore * weights.authority +
        crossQueryScore * 0.1
      ) + contrastBonus - antiPenalty + noveltyBonus - diversityPenalty;

      return {
        ...c,
        scores: {
          transformation: Math.round(transformScore * 100) / 100,
          wisdomConcept: Math.round(wisdomConceptScore * 100) / 100,
          keyword: Math.round(keywordScore * 100) / 100,
          authority: Math.round(authorityScore * 100) / 100,
          crossQuery: Math.round(crossQueryScore * 100) / 100,
          anti: antiScore !== undefined ? Math.round(antiScore * 100) / 100 : 0,
          total: Math.round(total * 100) / 100,
        },
      };
    });

    scored.sort(function(a, b) { return b.scores.total - a.scores.total; });

    trace.stages.push({
      name: 'cross_ranking',
      scored: scored.slice(0, 10).map(function(c) {
        return { verseId: c.verseId, scores: c.scores, excerpt: (c.unicode || '').slice(0, 40) };
      }),
    });

    return scored;
  }

  /* ── Cross-Query Relevance: how many of the generated queries does this verse address? ── */
  function scoreCrossQueryRelevance(candidateText, queries) {
    if (!queries || queries.length === 0) return 0;
    let matchCount = 0;
    for (const q of queries) {
      const queryWords = q.query.toLowerCase().split(/\s+/).filter(function(w) { return w.length > 3; });
      for (const w of queryWords) {
        if (candidateText.includes(w)) { matchCount++; break; }
      }
    }
    return Math.min(matchCount / queries.length, 1);
  }

  /* ── Wisdom Concept Match ── */
  function scoreWisdomConcepts(text, wisdom, expansion) {
    let score = 0;
    if (!wisdom) return 0;

    if (wisdom.wisdomConcepts) {
      for (const wc of wisdom.wisdomConcepts) {
        const normalized = wc.replace(/_/g, ' ');
        if (text.includes(normalized) || text.includes(wc)) score += 0.3;
      }
    }

    const truthWords = wisdom.truth.statement.toLowerCase().split(/\s+/).filter(function(w) {
      return w.length > 4 && !['your', 'that', 'this', 'from', 'have', 'been', 'with', 'what', 'when', 'their', 'which'].includes(w);
    });
    const uniqueTruth = [...new Set(truthWords)].slice(0, 6);
    for (const tw of uniqueTruth) {
      if (text.includes(tw)) score += 0.15;
    }

    const transWords = wisdom.transformation.toLowerCase().split(/\s+/).filter(function(w) { return w.length > 5; });
    const uniqueTrans = [...new Set(transWords)].slice(0, 5);
    for (const tw of uniqueTrans) {
      if (text.includes(tw)) score += 0.1;
    }

    return Math.min(score, 1);
  }

  /* ── Keyword Match ── */
  function scoreKeywordMatch(candidateText, searchText) {
    const lower = searchText.toLowerCase();
    const words = lower.split(/\s+/).filter(function(w) { return w.length > 3; });
    if (words.length === 0) return 0;
    let matches = 0;
    for (const w of words) {
      if (candidateText.includes(w)) matches++;
    }
    return Math.min(matches / words.length, 1);
  }

  /* ── Anti-Concept Score ──
     How much does this verse match the opposite of the wisdom concept?
     Used for contrastive scoring — a verse that matches BOTH concept and anti-concept
     is teaching by contrast (valuable), but one that only matches anti is irrelevant. */
  function scoreAntiConcepts(text, wisdom) {
    if (!wisdom || !wisdom.wisdomConcepts) return 0;
    const antiMap = {
      hukam: ['manmukh', 'haumai', 'ahankar', 'manmukh'],
      bharosa: ['duvidha', 'bharam', 'khot', 'nash'],
      simran: ['bharam', 'maya', 'lobh', 'trisna'],
      sabar: ['krodh', 'veer', 'utavla', 'dil'],
      chardi_kala: ['nirash', 'udash', 'dil'],
      haumai: ['manmukh', 'ahankar', 'kaam', 'krodh'],
      nadar: ['krodh', 'nirday', 'khot'],
      sangat: ['manmukh', 'durat', 'kubeer', 'nishtar'],
    };
    let score = 0;
    for (const wc of wisdom.wisdomConcepts) {
      const anti = antiMap[wc];
      if (anti) {
        for (const a of anti) {
          if (text.includes(a)) score += 0.25;
        }
      }
    }
    return Math.min(score, 1);
  }

  /* ── Need-Verification Score ──
     Does the candidate verse actually address the user's inferred human need?
     Maps needs to confirmation keywords found in Gurbani. */
  const NEED_KEYWORDS = {
    'control-release': ['hukam', 'raza', 'bhana', 'hukmi', 'chalai', 'sach'],
    trust: ['bharosa', 'visvasi', 'tai', 'sach', 'sada', 'sherna'],
    comfort: ['sukh', 'shanti', 'dukh', 'daras', 'sadar', 'seetal'],
    peace: ['shanti', 'sukh', 'chaint', 'sehej', 'sahaj', 'shanti'],
    connection: ['sangat', 'ik_onkar', 'prem', 'sadh', 'ek', 'ham'],
    forgiveness: ['khima', 'nadar', 'midar', 'mafi', 'muaf', 'bakhshis'],
    grace: ['nadar', 'kirpa', 'mehar', 'mihar', 'daya', 'prasadi'],
    hope: ['asa', 'umeed', 'bharosa', 'chardi', 'tai'],
    wisdom: ['gurmat', 'vichar', 'gur', 'sabad', 'sach', 'bujhi'],
    guidance: ['guru', 'satguru', 'gur', 'sabad', 'hukam'],
    expression: ['shukar', 'dan', 'seva', 'vand', 'kirt'],
    understanding: ['vichar', 'gurmat', 'sabad', 'sun', 'bujh'],
    healing: ['nadar', 'kirpa', 'sabar', 'sukh', 'simran'],
    strength: ['chardi', 'bharosa', 'simran', 'naam', 'bal'],
    calm: ['simran', 'sahaj', 'seetal', 'shanti', 'hukam'],
    acceptance: ['hukam', 'raza', 'sabar', 'bhana', 'sehej'],
    release: ['khima', 'hukam', 'nadar', 'chhad', 'tyag'],
    faith: ['bharosa', 'visvasi', 'tai', 'sach', 'sada'],
    love: ['prem', 'bhakti', 'ik_onkar', 'pyar', 'lal'],
    humility: ['nimrata', 'seva', 'haumai', 'garib', 'niman'],
    gratitude: ['shukar', 'dhan', 'seva', 'santokh', 'dan'],
  };

  function verifyNeedMatch(candidate, humanNeed) {
    if (!humanNeed || !humanNeed.primaryNeed) return -1;
    const text = (candidate.unicode + ' ' + candidate.english + ' ' + candidate.punjabi + ' ' + (candidate.gurmukhi || '')).toLowerCase();
    const keywords = NEED_KEYWORDS[humanNeed.primaryNeed];
    if (!keywords || keywords.length === 0) return -1;
    const matches = keywords.filter(function(k) { return text.includes(k); }).length;
    return matches / keywords.length;
  }

  /* ── Authority Score ── */
  function scoreAuthority(candidate) {
    let score = 0;
    if (candidate.source && (candidate.source.toLowerCase().includes('guru granth') || (candidate.sourceGurmukhi || '').toLowerCase().includes('guru'))) score += 0.5;
    if (candidate.pageNo >= 1 && candidate.pageNo <= 1430) score += 0.3;
    if (candidate.writer) score += 0.2;
    return Math.min(score, 1);
  }

  /* ── Self-Verification Gate ──
     Two-layer verification:
     1. Need-match: does the top candidate address the user's inferred human need?
     2. Score threshold: does it meet the base quality threshold?
     If either fails, re-rank with boosted transformation weight. */
  function stageSelfVerification(ranked, wisdom, humanNeed, trace) {
    if (ranked.length === 0) return ranked;

    const top = ranked[0];
    const topScore = top.scores.total;

    // Layer 1: Need-match verification
    let needMatch = -1;
    if (humanNeed && humanNeed.primaryNeed) {
      needMatch = verifyNeedMatch(top, humanNeed);
    }

    const needPassed = needMatch === -1 || needMatch >= 0.15;
    const thresholdPassed = topScore >= RELEVANCE_THRESHOLD;

    if (thresholdPassed && needPassed) {
      // Both checks passed
      trace.stages.push({
        name: 'self_verification',
        topScoreBefore: topScore,
        threshold: RELEVANCE_THRESHOLD,
        boosted: false,
        needMatch: needMatch >= 0 ? Math.round(needMatch * 100) + '%' : 'unchecked',
        verdict: 'passed',
      });
      return ranked;
    }

    // Verification failed — boost transformation weight and re-rank
    const reRanked = ranked.map(function(c) {
      const combinedText = (c.unicode + ' ' + c.gurmukhi + ' ' + c.english + ' ' + c.punjabi).toLowerCase();
      const transformScore = wisdomReasoner.scoreTransformation(combinedText, wisdom, null);
      const boostedTransform = Math.min(transformScore * 1.3, 1);
      const adjustedTotal = (
        boostedTransform * 0.60 +
        (c.scores.wisdomConcept || 0) * 0.25 +
        (c.scores.keyword || 0) * 0.10 +
        (c.scores.authority || 0) * 0.05
      );
      const candidateNeedMatch = humanNeed ? verifyNeedMatch(c, humanNeed) : -1;
      // Add need-match bonus to push relevant candidates higher
      const needBonus = candidateNeedMatch > 0.15 ? 0.1 : 0;
      return {
        ...c,
        scores: {
          ...c.scores,
          transformation: Math.round(boostedTransform * 100) / 100,
          total: Math.round((adjustedTotal + needBonus) * 100) / 100,
          _selfVerified: false,
          _boosted: true,
          _needMatch: candidateNeedMatch >= 0 ? Math.round(candidateNeedMatch * 100) : -1,
        },
      };
    });
    reRanked.sort(function(a, b) { return b.scores.total - a.scores.total; });

    trace.stages.push({
      name: 'self_verification',
      topScoreBefore: topScore,
      threshold: RELEVANCE_THRESHOLD,
      boosted: true,
      needMatchBefore: needMatch >= 0 ? Math.round(needMatch * 100) + '%' : 'unchecked',
      topScoreAfter: reRanked[0].scores.total,
      needMatchAfter: reRanked[0].scores._needMatch >= 0 ? reRanked[0].scores._needMatch + '%' : 'unchecked',
    });

    return reRanked;
  }

  /* ── Stage 5: Selection ──
     Cluster candidates by theme, rank clusters (not verses), weighted random
     within 5% score band to avoid always picking the same Shabad.
     Records selected Shabad in history for future diversity. */
  function stageSelection(ranked, wisdom, trace) {
    const aboveThreshold = ranked.filter(function(c) { return c.scores.total >= RELEVANCE_THRESHOLD; });
    const belowThreshold = ranked.filter(function(c) { return c.scores.total < RELEVANCE_THRESHOLD; });

    let primary = null;
    let related = [];
    let selectedClusterTheme = 'none';
    const recentIds = shabadHistory.getRecentIds();

    if (aboveThreshold.length > 0) {
      /* Cluster by theme */
      const clusters = {};
      for (const c of aboveThreshold) {
        let theme = 'general';
        if (c._queryType === 'counterfactual') {
          theme = 'contrast_' + (c.antiConcept || 'general');
        } else if (c.scores.transformation > 0.4) {
          theme = 'transformation';
        } else if (c.scores.wisdomConcept > 0.3) {
          theme = 'wisdom_concept';
        } else if (c.scores.crossQuery > 0.3) {
          theme = 'cross_relevant';
        } else if (c._queryType) {
          theme = c._queryType;
        }
        if (!clusters[theme]) clusters[theme] = [];
        clusters[theme].push(c);
      }

      /* Rank clusters by highest score in each */
      const clusterScores = Object.keys(clusters).map(function(key) {
        const maxScore = Math.max.apply(null, clusters[key].map(function(c) { return c.scores.total; }));
        return { theme: key, maxScore, candidates: clusters[key] };
      });
      clusterScores.sort(function(a, b) { return b.maxScore - a.maxScore; });
      selectedClusterTheme = clusterScores[0].theme;
      const topCluster = clusterScores[0].candidates;

      /* Within top cluster: filter to top 5% score band */
      const topScore = Math.max.apply(null, topCluster.map(function(c) { return c.scores.total; }));
      const threshold5pct = topScore * 0.95;

      /* Prefer candidates not recently shown */
      let pickPool = topCluster.filter(function(c) {
        const id = c.shabadId || c.verseId;
        return c.scores.total >= threshold5pct && !recentIds.includes(id);
      });
      if (pickPool.length < 2) {
        pickPool = topCluster.filter(function(c) { return c.scores.total >= threshold5pct; });
      }

      /* Weighted random: higher score = higher weight, but bottom still has a chance */
      const minScoreInPool = Math.min.apply(null, pickPool.map(function(c) { return c.scores.total; }));
      const range = Math.max(topScore - minScoreInPool, 0.01);
      const weights = pickPool.map(function(c) {
        return 0.3 + 0.7 * ((c.scores.total - minScoreInPool) / range);
      });
      const totalWeight = weights.reduce(function(a, b) { return a + b; }, 0);
      let rand = Math.random() * totalWeight;
      let pickedIdx = 0;
      for (let i = 0; i < weights.length; i++) {
        rand -= weights[i];
        if (rand <= 0) { pickedIdx = i; break; }
      }
      primary = pickPool[pickedIdx];

      /* Pick related shabads */
      const seenShabads = new Set([primary.shabadId || primary.verseId]);
      for (const c of pickPool) {
        const id = c.shabadId || c.verseId;
        if (c !== primary && id && !seenShabads.has(id) && related.length < 2) {
          related.push(c);
          seenShabads.add(id);
        }
      }
      if (related.length < 2) {
        for (let ci = 1; ci < clusterScores.length && related.length < 2; ci++) {
          for (const c of clusterScores[ci].candidates) {
            const id = c.shabadId || c.verseId;
            if (id && !seenShabads.has(id) && related.length < 2) {
              related.push(c);
              seenShabads.add(id);
            }
          }
        }
      }
    }

    /* Record primary in history so diversity system knows it was shown */
    if (primary) {
      const concepts = [];
      if (wisdom && wisdom.wisdomConcepts) {
        for (const wc of wisdom.wisdomConcepts) {
          concepts.push({ concept: wc });
        }
      }
      shabadHistory.record(primary.shabadId || primary.verseId, concepts.length > 0 ? concepts : [{ concept: 'general' }]);
    }

    const rationale = primary ? buildRationale(primary, wisdom) : buildEmptyRationale(wisdom);

    trace.stages.push({
      name: 'selection',
      threshold: RELEVANCE_THRESHOLD,
      aboveThresholdCount: aboveThreshold.length,
      primary: primary ? { verseId: primary.verseId, shabadId: primary.shabadId, totalScore: primary.scores.total, transformScore: primary.scores.transformation } : null,
      clusterTheme: selectedClusterTheme,
      illusion: wisdom ? wisdom.primaryIllusion.illusion : 'none detected',
      truth: wisdom ? wisdom.truth.statement : '',
      rationale,
    });

    return { primary, related, belowThreshold, rationale };
  }

  function buildRationale(primary, wisdom) {
    const transform = Math.round(primary.scores.transformation * 100);
    const concept = Math.round(primary.scores.wisdomConcept * 100);
    const keyword = Math.round(primary.scores.keyword * 100);
    const authority = Math.round(primary.scores.authority * 100);
    let reason = 'Selected for transformative depth (' + transform + '%)';

    if (wisdom) {
      reason += '. Addresses the illusion: "' + wisdom.primaryIllusion.illusion.slice(0, 80) + '..."';
      reason += '. Guides toward: ' + wisdom.transformation.slice(0, 60) + '...';
    }

    reason += ' | Scores: concept=' + concept + '%, keyword=' + keyword + '%, authority=' + authority + '%.';
    return reason;
  }

  function buildEmptyRationale(wisdom) {
    if (!wisdom) return 'No candidate met the relevance threshold.';
    return 'No Shabad strongly addresses the identified illusion "' + wisdom.primaryIllusion.illusion.slice(0, 60) + '..." above the relevance threshold. The system will rely on general wisdom.';
  }

  return { retrieve };
}
