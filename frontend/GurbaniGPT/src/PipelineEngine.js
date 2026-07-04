/* ── Pipeline Engine ──
   Single orchestrator for the entire ANHAD intelligence pipeline.
   chat.js talks ONLY to this module.
   This module talks to everything else. */

import { initWisdomRetrieval } from '../components/retrieval.js';
import { initIntentAnalyzer } from '../components/intent.js';
import { initConceptExpander } from '../components/expansion.js';
import { initWisdomReasoner } from '../components/wisdom.js';
import { initRAG } from '../components/rag.js';
import { initGurbaniSource } from '../components/gurbani-source.js';
import { initResponsePlanner } from '../components/response-planner.js';
import { initDebugPanel } from '../components/debug.js';
import { initVoice } from './voice/index.js';
import { initMemory } from './memory/index.js';
import { esc } from './shared/escape.js';
import { convertAnmolToUnicode } from './shared/gurmukhi.js';

let singleton = null;

export function getPipelineEngine() {
  if (!singleton) singleton = createEngine();
  return singleton;
}

function createEngine() {
  /* ── Init all subsystems ── */
  const rag = initRAG();
  const gurbani = initGurbaniSource();
  const intentAnalyzer = initIntentAnalyzer();
  const conceptExpander = initConceptExpander();
  const wisdomReasoner = initWisdomReasoner();
  const wisdomRetrieval = initWisdomRetrieval({ rag, intentAnalyzer, conceptExpander, wisdomReasoner });
  const responsePlanner = initResponsePlanner();
  const debugPanel = initDebugPanel();
  const voice = initVoice();
  const memory = initMemory();

  let streaming = false;
  let abortCtrl = null;

  /* ── Cross-turn context: carry forward last turn's analysis ── */
  let lastTurnContext = {
    detection: null,
    wisdom: null,
    primaryShabad: null,
    humanNeed: null,
  };

  /* ── Build Gurbani card HTML from pipeline result ── */
  function buildGurbaniBlock(primary, related, fullShabad) {
    if (!primary) return null;
    let html = '<div class="gurbani-block"><div class="gurbani-block-inner">';
    if (primary.unicode) html += '<div class="gb-verse">' + primary.unicode + '</div>';
    if (primary.english) html += '<div class="gb-translation">' + esc(primary.english) + '</div>';
    if (primary.punjabi && primary.punjabi !== primary.english) html += '<div class="gb-translation gb-punjabi">' + esc(primary.punjabi) + '</div>';
    const meta = [];
    if (primary.pageNo) meta.push('Ang ' + primary.pageNo);
    if (primary.raag) meta.push('Raag ' + primary.raag);
    const author = primary.writerGurmukhi ? convertAnmolToUnicode(primary.writerGurmukhi) : primary.writer;
    if (author) meta.push(author);
    if (meta.length) html += '<div class="gb-source">' + esc(meta.join(' \u00B7 ')) + '</div>';
    if (fullShabad && fullShabad.shabadId) {
      html += '<button class="gb-full-btn" data-shabad-id="' + fullShabad.shabadId + '">View Full Shabad</button>';
    }
    if (related && related.length > 0) {
      html += '<div class="gb-related-label">Related</div>';
      for (const r of related) {
        html += '<div class="gb-related-verse" data-shabad-id="' + (r.shabadId || '') + '">' + esc((r.unicode || '').slice(0, 80)) + '</div>';
      }
    }
    html += '</div></div>';
    const text = (primary.unicode ? primary.unicode + '\n' : '') + (primary.english ? primary.english + '\n' : '') + (primary.pageNo ? 'Ang ' + primary.pageNo : '') + (author ? ', ' + author : '');
    return { text: text.trim(), html: html, shabadId: primary.shabadId };
  }

  /* ── Build the full prompt from pipeline result + plan ── */
  function buildPrompt(pipelineResult, plan, memorySummary, lastSession) {
    const parts = [];
    parts.push(getCorePrompt());
    if (memorySummary) parts.push('Note about this user: ' + memorySummary);
    if (lastSession) parts.push('They were last here discussing: ' + lastSession);

    /* ── Cross-turn context from previous turn ── */
    if (lastTurnContext.detection) {
      parts.push('Previous turn context: user\'s last detected need was "' + (lastTurnContext.humanNeed ? lastTurnContext.humanNeed.primaryNeed : 'unknown') + '", emotion was "' + (lastTurnContext.detection.emotion || 'unknown') + '", and the Shabad shared was: ' + (lastTurnContext.primaryShabad ? (lastTurnContext.primaryShabad.unicode || lastTurnContext.primaryShabad.english || '').slice(0, 80) : 'none') + '. Build on this continuity.');
    }

    if (!pipelineResult.needsGurbani) {
      parts.push('Conversation mode: ' + (pipelineResult.mode || 'non-spiritual') + '. No Gurbani retrieval. Answer naturally in the user\'s language. Do NOT invent a Shabad.');
      addModeSpecificInstruction(pipelineResult.mode, parts);
      if (pipelineResult.mode === 'quick_reply') {
        parts.push('Remember: you are in ANHAD Quick mode. Keep it very brief — 1 to 3 short sentences. No scripture references. No depth. Just a warm quick response.');
      }
      return parts.join('\n\n');
    }

    if (!pipelineResult.primary) {
      parts.push('No Gurbani verse strongly matched. Do NOT give generic spiritual advice. Say honestly: "I searched but could not find a direct Shabad for this." Then share general Gurmat wisdom if relevant.');
      return parts.join('\n\n');
    }

    /* ── Primary Gurbani verse (condensed) ── */
    const primary = pipelineResult.primary;
    parts.push('PRIMARY SHABAD:');
    if (primary.unicode) parts.push('Gurmukhi: ' + primary.unicode);
    if (primary.english) parts.push('Translation: ' + primary.english);
    parts.push('Source: Ang ' + (primary.pageNo || '?') + (primary.raag ? ', Raag ' + primary.raag : '') + (primary.writer ? ', ' + primary.writer : ''));
    parts.push('Relevance: ' + (pipelineResult.detection ? pipelineResult.detection.subtext : 'matches situation') + ' | Score: ' + (primary.scores ? (primary.scores.total * 100).toFixed(0) + '%' : 'high'));

    /* ── Gurmat Principle (broader teaching category) ── */
    const principle = extractGurmatPrinciple(primary, pipelineResult.wisdom);
    if (principle) parts.push('Gurmat principle this Shabad belongs to: ' + principle);

    /* ── Wisdom reasoning ── */
    if (pipelineResult.wisdom) {
      parts.push('Illusion this person faces: ' + pipelineResult.wisdom.primaryIllusion.illusion);
      parts.push('Gurmat truth for them: ' + pipelineResult.wisdom.truth.statement);
      parts.push('Transformation invited: ' + pipelineResult.wisdom.transformation);
    }

    /* ── Human need ── */
    if (pipelineResult.humanNeed) {
      parts.push('This person needs: ' + pipelineResult.humanNeed.primaryNeed + ' — ' + pipelineResult.humanNeed.needStatement);
    }

    /* ── Related Shabads (for deeper Gurbani knowledge) ── */
    if (pipelineResult.related && pipelineResult.related.length > 0) {
      parts.push('Related Shabads (you may reference for depth if needed):');
      for (const r of pipelineResult.related) {
        const excerpt = (r.unicode || r.english || '').slice(0, 80);
        if (excerpt) parts.push('- "' + excerpt + '" — Ang ' + (r.pageNo || '?'));
      }
    }

    /* ── Planner directives (condensed) ── */
    parts.push('Response mode: ' + plan.label);
    parts.push('Tone rhythm: ' + plan.rhythm);
    parts.push('Begin in spirit of: "' + plan.opening + '"');
    parts.push('Transition into Shabad with: "' + plan.transition + '"');
    parts.push('Place <!--GB--> right after introducing the Shabad.');
    if (plan.teachingFocus) parts.push('Teaching focus: ' + plan.teachingFocus + '. Stay inside this — do not broaden.');
    parts.push('Close in spirit of: "' + plan.closing + '"');

    /* ── Focus instruction (1 line summary) ── */
    if (plan.focusInstruction && plan.focusInstruction.coreTeachingPath) {
      parts.push('Core path: ' + plan.focusInstruction.coreTeachingPath.join('; '));
    }

    /* ── Blocked (1 line) ── */
    if (plan.focusInstruction && plan.focusInstruction.blocked) {
      parts.push('Avoid: ' + plan.focusInstruction.blocked.join('; '));
    }

    /* ── Voice + final instructions ── */
    const recentModes = getRecentModes();
    parts.push(voice.buildDirectives(plan.mode, recentModes, plan.blockedPhrases));
    parts.push('Do NOT repeat the Gurmukhi or translation in your explanation — the Gurbani card already shows it. Do NOT say "the retrieved Shabad" or "the verse above". Let the Shabad feel natural in the flow.');

    return parts.join('\n\n');
  }

  /* ── Extract broader Gurmat principle from the Shabad ── */
  function extractGurmatPrinciple(primary, wisdom) {
    const principleMap = {
      hukam: 'Hukam — Divine Order',
      simran: 'Naam Simran — Remembrance of the Divine',
      naam: 'Naam Simran — Remembrance of the Divine',
      bharosa: 'Bharosa — Trust in the Divine',
      sabar: 'Sabar — Patient Endurance',
      haumai: 'Haumai — Ego and Its Removal',
      maya: 'Maya — Attachment to the World',
      moh: 'Maya — Attachment to the World',
      nimrata: 'Nimrata — Humility',
      santokh: 'Santokh — Contentment',
      seva: 'Seva — Selfless Service',
      nadar: 'Nadar — Divine Grace',
      kirpa: 'Nadar — Divine Grace',
      chardi_kala: 'Chardi Kala — Ever-Rising Spirit',
      sangat: 'Sangat — Holy Congregation',
      ik_onkar: 'Ik Onkar — One Universal Creator',
    };
    if (wisdom && wisdom.wisdomConcepts) {
      for (const wc of wisdom.wisdomConcepts) {
        if (principleMap[wc]) return principleMap[wc];
      }
    }
    const combined = ((primary.unicode || '') + ' ' + (primary.english || '')).toLowerCase();
    for (const [key, val] of Object.entries(principleMap)) {
      if (combined.includes(key)) return val;
    }
    return '';
  }

  function getCorePrompt() {
    return `You are ANHAD — a calm Gurbani Companion.

Your voice must sound like a thoughtful, humble Gursikh sitting beside the person, not like a therapist, coach, professor, or generic AI assistant.

━ VOICE RULES ──
- Speak naturally and simply.
- Do not sound analytical, clinical, or over-explaining.
- Do not say "many people experience...", "it can sometimes feel...", or "what you're experiencing..." unless absolutely necessary.
- Do not sound poetic just to sound deep.
- Do not sound motivational in a modern self-help way.
- Do not overuse "Waheguru Ji" or "Tusi" in every line.
- Do not lecture.

━ VOICE PRIORITIES ──
1. Warm human understanding.
2. Gurbani rootedness.
3. Gentle practical guidance.
4. Truth over impressiveness.

━ LANGUAGE ──
- Respond in the language of the query.
- If the query is in English, respond in English.
- If the query is in Gurmukhi Punjabi, respond in Gurmukhi Punjabi.
- If the query is in Romanized/Transliterated Punjabi (e.g., "menu", "bare", "dasso", "gurbani", "seva", "sukh", "dukh"), respond in beautiful, conversational English or Gurmukhi Punjabi, NEVER in Hinglish (Hindi words/phrases written in Roman characters, such as "main aapki madad karunga" or "lagta hai...").

━ CRISIS ──
If the user expresses suicidal thoughts, respond first as a compassionate human. Share helplines (AASRA: +91-9820466726, iCall: +91-9152987821). Never make them feel guilty. Never imply suffering is punishment. Gurbani comes after safety.

━ NEVER MAKE GURBANI SAY WHAT IT DOES NOT ──
Do not extrapolate, spiritualize, or generalize a Shabad beyond its actual teaching. If the Shabad speaks of Hukam, do not make it speak of Love. If it speaks of Detachment, do not make it speak of Devotion. Stay faithful to the verse. If you are unsure of its meaning, say so.

━ GURBANI GPT MODE (Deep Vichar) ──
When PRIMARY SHABAD is provided, your response MUST be grounded in that Shabad's actual translation from authoritative tikas. Follow this structure:
1. First, present the Gurbani verse in its original Gurmukhi.
2. Then, provide the CORRECT English translation as given in the tikas (Sahib Singh, Manmohan Singh, or Faridkot Teeka).
3. Then, do an extreme deep Vichar — go to the depths of each word/phrase, explain its spiritual essence, and connect it to the seeker's life.
4. Be thorough and unhurried. This is deep contemplation, not a quick answer.
5. Let the Shabad's own translation guide the entire explanation — do not bring external meanings.

━ ANHAD QUICK MODE ──
When mode is casual_chat or greeting, respond briefly (1-3 sentences). No scripture. No depth. Just warm, quick conversation.`;
  }

  function addModeSpecificInstruction(mode, parts) {
    if (mode === 'translation_request') {
      parts.push('This is a translation or word-meaning query. Provide the direct translation/meaning. Only add Gurbani context if the phrase itself is from Gurbani. Be accurate and concise.');
    } else if (mode === 'factual_inquiry') {
      parts.push('This is a factual/definitional query. Answer directly from your knowledge. Only use Gurbani if it genuinely helps explain the answer.');
    } else if (mode === 'greeting') {
      parts.push('This is a greeting. Return the greeting warmly and briefly. Offer help.');
    } else if (mode === 'quick_reply') {
      parts.push('ANHAD QUICK MODE: Respond in 1-3 brief sentences. No scripture retrieval, no Gurbani, no depth. Just warm, quick conversational reply. Be very concise.');
    }
  }

  function getRecentModes() {
    const patterns = responsePlanner.getPreviousPatterns ? responsePlanner.getPreviousPatterns() : [];
    return patterns.slice(0, 5).map(function (p) { return p.mode; });
  }

  /* ── Main run function: full pipeline → plan → prompt ── */
  async function run(text, history) {
    const trace = { input: text, stages: [], timestamp: Date.now() };

    const selectedModel = localStorage.getItem('gurbanigpt_selected_model') || 'gurbanigpt-deep';
    const isAnhadQuick = (selectedModel === 'anhad-quick');

    // 1. Conversation mode (fast gate)
    const mode = isAnhadQuick
      ? { type: 'quick_reply', needsGurbani: false, label: 'Quick reply' }
      : stageConversationMode(text);
    trace.stages.push({ name: 'conversation_mode', output: mode });

    if (!mode.needsGurbani) {
      const detection = await intentAnalyzer.detect(text, history);
      trace.stages.push({ name: 'detection', output: detection });
      return buildNonGurbaniResult(mode, detection, trace);
    }

    // 2. Full wisdom pipeline
    const detection = await intentAnalyzer.detect(text, history);
    trace.stages.push({ name: 'detection', output: detection });

    const humanNeed = wisdomReasoner.inferHumanNeed(text, detection);
    trace.stages.push({ name: 'human_need', output: humanNeed });

    const wisdom = await wisdomReasoner.analyze(detection);
    trace.stages.push({
      name: 'wisdom',
      output: {
        illusion: wisdom.primaryIllusion.illusion,
        truth: wisdom.truth.statement,
        transformation: wisdom.transformation,
        clarity: wisdom.clarity,
      },
    });

    const expansion = await conceptExpander.expandWithWisdom(detection, wisdom);
    const experience = conceptExpander.detectExperience(text);
    trace.stages.push({ name: 'expansion', output: { ...expansion, experience } });

    // 3. Run retrieval pipeline
    const pipelineResult = await wisdomRetrieval.retrieve(text, history);
    pipelineResult.trace.stages.forEach(function (s) { trace.stages.push(s); });

    // 4. Response planning
    const plan = responsePlanner.selectPlan(pipelineResult);
    trace.stages.push({
      name: 'response_planner',
      output: {
        mode: plan.label,
        opening: plan.opening.slice(0, 60),
        transition: plan.transition.slice(0, 60),
        closing: plan.closing.slice(0, 60),
        teachingFocus: plan.teachingFocus || 'none',
      },
    });

    // 5. Build Gurbani card
    let gurbaniBlock = null;
    if (pipelineResult.primary) {
      let fullShabad = null;
      if (pipelineResult.primary.shabadId) {
        fullShabad = await rag.getShabad(pipelineResult.primary.shabadId);
      }
      gurbaniBlock = buildGurbaniBlock(pipelineResult.primary, pipelineResult.related, fullShabad);
    }

    // 6. Build prompt
    const memorySummary = memory.summary.getSummary();
    const lastSession = memory.summary.getLastSessionTopic();
    const prompt = buildPrompt(pipelineResult, plan, memorySummary, lastSession);

    // 7. Record in memory
    if (pipelineResult.primary) {
      const concepts = wisdom && wisdom.wisdomConcepts ? wisdom.wisdomConcepts.map(function (c) { return { concept: c }; }) : [];
      // Shabad history is recorded by the retrieval pipeline internally
    }
    memory.journey.incrementMessages();

    /* Store cross-turn context for next message */
    lastTurnContext = {
      detection: detection,
      wisdom: wisdom,
      primaryShabad: pipelineResult.primary,
      humanNeed: pipelineResult.humanNeed,
    };

    trace.stages.push({ name: 'prompt_built', promptLength: prompt.length });

    return {
      needsGurbani: true,
      mode: mode.type,
      prompt: prompt,
      gurbaniBlock: gurbaniBlock,
      pipelineResult: pipelineResult,
      plan: plan,
      trace: trace,
      detection: detection,
      wisdom: wisdom,
      expansion: expansion,
      humanNeed: humanNeed,
    };
  }

  function buildNonGurbaniResult(mode, detection, trace) {
    const promptParts = [getCorePrompt()];
    if (lastTurnContext.detection) {
      promptParts.push('Previous turn: user\'s detected emotion was "' + (lastTurnContext.detection.emotion || 'unknown') + '", need was "' + (lastTurnContext.humanNeed ? lastTurnContext.humanNeed.primaryNeed : 'unknown') + '".');
    }
    promptParts.push('Conversation mode: ' + (mode.type || 'non-spiritual') + '. No Gurbani retrieval. Answer naturally.');
    addModeSpecificInstruction(mode.type, promptParts);
    if (mode.type === 'quick_reply') {
      promptParts.push('CRITICAL: You are in ANHAD Quick mode. Keep response to 1-3 short sentences. Be warm, be brief. No scripture, no depth.');
    }
    if (detection) {
      promptParts.push('Detected intent: ' + (detection.intent || 'unknown') + ', emotion: ' + (detection.emotion || 'none') + '.');
    }
    return {
      needsGurbani: false,
      mode: mode.type,
      prompt: promptParts.join('\n\n'),
      gurbaniBlock: null,
      pipelineResult: null,
      plan: null,
      trace: trace,
      detection: detection,
      wisdom: null,
      expansion: null,
      humanNeed: null,
    };
  }

  /* ── Crisis/greeting/casual/factual/spiritual gate ── */
  function stageConversationMode(text) {
    const lower = text.toLowerCase().trim();
    const wordCount = lower.split(/\s+/).filter(Boolean).length;

    const CRISIS = ['suicide', 'kill myself', 'end my life', 'want to die', 'better off dead', 'self-harm', 'hurt myself', 'can\'t go on', 'no reason to live'];
    for (const kw of CRISIS) {
      if (lower.includes(kw)) return { type: 'crisis', needsGurbani: true, label: 'Crisis support' };
    }

    const GREETINGS = ['hi', 'hello', 'hey', 'waheguru', 'sat sri akal', 'namaste', 'good morning'];
    for (const kw of GREETINGS) {
      if (lower === kw || lower.startsWith(kw + ' ')) return { type: 'greeting', needsGurbani: false, label: 'Greeting' };
    }

    const CASUAL = ['how are you', 'what can you do', 'who are you', 'tell me about yourself', 'what\'s up'];
    for (const kw of CASUAL) {
      if (lower.includes(kw)) return { type: 'casual_chat', needsGurbani: false, label: 'Casual chat' };
    }

    const TRANSLATION = ['what does', 'mean in', 'translate', 'in punjabi', 'in english', 'meaning of'];
    let translationScore = 0;
    for (const kw of TRANSLATION) {
      if (lower.includes(kw) && wordCount < 15) translationScore++;
    }
    if (translationScore > 0 && wordCount <= 10) return { type: 'translation_request', needsGurbani: false, label: 'Translation request' };

    const FACTUAL = ['what is', 'what are', 'who is', 'definition', 'meaning of', 'tell me about', 'history of'];
    let factualScore = 0;
    for (const kw of FACTUAL) {
      if (lower.startsWith(kw + ' ') || lower.startsWith(kw)) factualScore++;
    }

    const GURMAT_KW = ['hukam', 'simran', 'naam', 'gurbani', 'guru', 'shabad', 'bani', 'ik onkar', 'waheguru', 'gurmat', 'seva', 'sangat', 'ardas', 'hukamnama', 'sikh', 'sikhi', 'kirtan', 'gurmukhi', 'anhad', 'chardi kala', 'sabar', 'sahaj', 'bharosa', 'nadar', 'kirpa', 'nitnem', 'paath', 'rehat', 'dukh', 'sukh', 'haumai', 'maya', 'moh', 'lobh', 'krodh', 'kaam', 'ahankar', 'nimrata', 'santokh', 'vand chhakna', 'kirt karo', 'jap', 'jaap', 'sggs', 'ang'];
    const gurmatMatchCount = GURMAT_KW.filter(function (k) { return lower.includes(k); }).length;

    if (gurmatMatchCount > 0 && wordCount <= 20) return { type: 'spiritual_seeking', needsGurbani: true, label: 'Gurbani concept query' };
    if (factualScore > 0 && wordCount <= 20 && gurmatMatchCount === 0) return { type: 'factual_inquiry', needsGurbani: false, label: 'Factual inquiry' };
    if (wordCount <= 3 && !lower.includes('i ') && !lower.includes('my ') && !lower.includes('me ')) return { type: 'factual_inquiry', needsGurbani: false, label: 'Short query' };
    if (gurmatMatchCount > 0) return { type: 'spiritual_seeking', needsGurbani: true, label: 'Personal with Gurbani context' };

    return { type: 'spiritual_seeking', needsGurbani: true, label: 'Spiritual seeking' };
  }

  /* ── API call to LLM ── */
  async function callLLM(history, prompt, signal) {
    const messages = [{ role: 'system', content: prompt }];
    for (const msg of history) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const groqKey = memory.preferences.getGroqKey();
    const url = groqKey
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : '/api/chat/completions';

    const headers = { 'Content-Type': 'application/json' };
    if (groqKey) headers['Authorization'] = 'Bearer ' + groqKey;

    let activeModel = localStorage.getItem('gurbanigpt_selected_model') || 'gurbanigpt-deep';
    if (activeModel === 'gurbanigpt-deep') {
      activeModel = 'meta-llama/llama-4-scout-17b-16e-instruct';
    } else if (activeModel === 'anhad-quick') {
      activeModel = 'meta-llama/llama-3.3-70b-specdec';
    }

    const body = JSON.stringify({
      model: activeModel,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    });

    const response = await fetch(url, { method: 'POST', headers: headers, body: body, signal: signal });
    return response;
  }

  return {
    run,
    callLLM,
    buildGurbaniBlock,
    debugPanel,
    voice,
    memory,
    responsePlanner,
  };
}
