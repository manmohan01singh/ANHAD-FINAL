const BANIDB_API = 'http://localhost:3001/v2';
const BANIDB_FALLBACK = 'https://api.banidb.com/v2';
const CORS_PROXY = 'https://corsproxy.io/?';
const CACHE_TTL = 3600000;
const CACHE_KEY = 'gurbanigpt_rag_cache';

// Use public API first; CORS proxy as fallback.
// Local API (localhost:3001) is skipped because it requires
// a separate database setup that most users won't have.
const RAG_API_ORDER = [BANIDB_FALLBACK];

const GURMUKHI_RANGE = /[\u0A00-\u0A7F]/;
const DEVANAGARI_RANGE = /[\u0900-\u097F]/;

const CONCEPT_GRAPH = {
  naamsimran: { en: ['simran', 'naam', 'jap', 'bhajan', 'har naam', 'waheguru', 'smaran', 'sumiran', 'dhyaan', 'sehej', 'anand', 'sachiara'], pa: ['ਨਾਮ', 'ਸਿਮਰਨ', 'ਜਪ', 'ਭਜਨ', 'ਹਰਿ', 'ਵਾਹਿਗੁਰੂ', 'ਧਿਆਨ', 'ਸਹਜ', 'ਅਨੰਦ', 'ਸਿਮਰਣ'] },
  mind: { en: ['mann', 'mun', 'man', 'surti', 'chit', 'budh', 'vichar', 'haumai', 'ahankaar', 'ego', 'maya', 'moh', 'tanakhah'], pa: ['ਮਨ', 'ਸੁਰਤਿ', 'ਚਿਤ', 'ਬੁਧਿ', 'ਵਿਚਾਰ', 'ਹਉਮੈ', 'ਅਹੰਕਾਰ', 'ਮਾਇਆ', 'ਮੋਹ'] },
  maya: { en: ['maya', 'moh', 'attachment', 'trishna', 'lobh', 'vikaar', 'kaam', 'krodh', 'dhan'], pa: ['ਮਾਇਆ', 'ਮੋਹ', 'ਤ੍ਰਿਸ਼ਨਾ', 'ਲੋਭ', 'ਵਿਕਾਰ', 'ਕਾਮ', 'ਕ੍ਰੋਧ', 'ਧਨ'] },
  separation: { en: ['viraha', 'birha', 'separation', 'judaai', 'door', 'doori', 'prabh ki doori'], pa: ['ਵਿਰਹ', 'ਬਿਰਹ', 'ਜੁਦਾਈ', 'ਦੂਰ', 'ਦੂਰੀ'] },
  grace: { en: ['kirpa', 'mehar', 'daya', 'karsan', 'gurparsaad', 'gurprasadi', 'nadar', 'nadri', 'bakhsh', 'mihar'], pa: ['ਕਿਰਪਾ', 'ਮਿਹਰ', 'ਦਇਆ', 'ਗੁਰਪ੍ਰਸਾਦ', 'ਨਦਰ', 'ਨਦਰੀ', 'ਬਖਸ਼'] },
  hukam: { en: ['hukam', 'raza', 'bhana', 'mohar', 'kaaraj', 'sach', 'razi', 'mukaddar', 'taqdeer', 'bhaag'], pa: ['ਹੁਕਮ', 'ਰਜ਼ਾ', 'ਭਾਣਾ', 'ਸਚ', 'ਰਜ਼ੀ', 'ਮੁਕੱਦਰ', 'ਤਕਦੀਰ', 'ਭਾਗ'] },
  humility: { en: ['nimrata', 'namrata', 'garibi', 'seva', 'vinay', 'vadahai'], pa: ['ਨਿਮਰਤਾ', 'ਗਰੀਬੀ', 'ਸੇਵਾ', 'ਵਿਨੈ'] },
  sangat: { en: ['sangat', 'sadh sangat', 'satsangat', 'sang', 'sathi', 'sajjan', 'prem', 'pyaar'], pa: ['ਸੰਗਤ', 'ਸਾਧ ਸੰਗਤ', 'ਸਤਸੰਗ', 'ਸੰਗ', 'ਸਾਥੀ', 'ਸੱਜਣ', 'ਪ੍ਰੇਮ', 'ਪਿਆਰ'] },
  love: { en: ['prem', 'pyar', 'bhagti', 'bhakti', 'rasna', 'sachiara', 'lal'], pa: ['ਪ੍ਰੇਮ', 'ਪਿਆਰ', 'ਭਗਤੀ', 'ਭਗਤ', 'ਰਸਨਾ', 'ਲਾਲ'] },
  discipline: { en: ['nemat', 'sikhya', 'hath', 'tat', 'jog', 'kamai', 'tan', 'sehaj'], pa: ['ਨੇਮ', 'ਸਿਖਿਆ', 'ਹਠ', 'ਤਤ', 'ਜੋਗ', 'ਕਮਾਈ', 'ਤਨ', 'ਸਹਜ'] },
  fear: { en: ['bhau', 'dar', 'bhaiya', 'dhar', 'sankat', 'bipat', 'kasht', 'dukh', 'roag', 'kal'], pa: ['ਭਉ', 'ਡਰ', 'ਭੈ', 'ਸੰਕਟ', 'ਬਿਪਤ', 'ਕਸ਼ਟ', 'ਦੁਖ', 'ਰੋਗ', 'ਕਾਲ'] },
  peace: { en: ['sukh', 'shaanti', 'chaint', 'santokh', 'tripta', 'shakti', 'anand', 'sehaj'], pa: ['ਸੁਖ', 'ਸ਼ਾਂਤੀ', 'ਚੈਨ', 'ਸੰਤੋਖ', 'ਤ੍ਰਿਪਤ', 'ਅਨੰਦ', 'ਸਹਜ'] },
  death: { en: ['maut', 'jam', 'kaal', 'marnu', 'parpanch', 'chhut'], pa: ['ਮੌਤ', 'ਜਮ', 'ਕਾਲ', 'ਮਰਣ', 'ਪਰਪੰਚ'] },
  soul: { en: ['jiv', 'atma', 'parmatma', 'jot', 'swas', 'saans', 'rooh'], pa: ['ਜੀਵ', 'ਆਤਮਾ', 'ਪਰਮਾਤਮਾ', 'ਜੋਤ', 'ਸੁਆਸ', 'ਸਾਹ', 'ਰੂਹ'] },
  guru: { en: ['guru', 'gur', 'satguru', 'gurdev', 'gursikh', 'sikh'], pa: ['ਗੁਰੂ', 'ਗੁਰ', 'ਸਤਿਗੁਰੂ', 'ਗੁਰਦੇਵ', 'ਗੁਰਸਿਖ', 'ਸਿਖ'] },
  forgiveness: { en: ['khima', 'mafi', 'bakhsh', 'muaf'], pa: ['ਖਿਮਾ', 'ਮਾਫੀ', 'ਬਖਸ਼', 'ਮੁਆਫ'] },
  simran: { en: ['simran', 'naam jap', 'jaap', 'japna'], pa: ['ਸਿਮਰਨ', 'ਨਾਮ ਜਪ', 'ਜਾਪ', 'ਜਪਣ'] },
};

const INTENT_PATTERNS = {
  comfort: { en: ['sad', 'lonely', 'crying', 'hurt', 'pain', 'loss', 'grief', 'depressed', 'anxious', 'afraid', 'worried', 'tired', 'hopeless', 'udaas', 'dukh'], pa: ['ਦੁਖ', 'ਦਰਦ', 'ਉਦਾਸ', 'ਦਿਲ', 'ਰੋਣਾ', 'ਡਰ', 'ਚਿੰਤਾ', 'ਤਕਲੀਫ'] },
  discipline: { en: ['lazy', 'procrastinate', 'discipline', 'routine', 'consistency', 'motivate', 'focus', 'distracted', 'susti'], pa: ['ਆਲਸ', 'ਸੁਸਤੀ', 'ਕੋਸ਼ਿਸ਼', 'ਨੇਮ', 'ਪਾਲਣਾ'] },
  meaning: { en: ['meaning', 'purpose', 'why', 'life', 'truth', 'reality', 'god', 'existence', 'soul', 'spiritual', 'artha', 'question'], pa: ['ਅਰਥ', 'ਜੀਵਨ', 'ਸੱਚ', 'ਪ੍ਰਮਾਤਮਾ', 'ਆਤਮਾ', 'ਸਵਾਲ', 'ਕਿਉਂ'] },
  distress: { en: ['emergency', 'urgent', 'panic', 'desperate', 'angry', 'frustrated', 'rage', 'hate', 'suicide', 'hurt myself', 'painful', 'dread', 'fear', 'gussa', 'fire'], pa: ['ਗੁੱਸਾ', 'ਗੁਸਾ', 'ਗੁੱਸੇ', 'ਡਰ', 'ਡਰਦਾ', 'ਮਰਨਾ', 'ਮੌਤ', 'ਦਰਦ'] },
  simran: { en: ['simran', 'naam', 'jap', 'meditation', 'chant', 'remember', 'waheguru', 'breath', 'swas', 'mantra'], pa: ['ਸਿਮਰਨ', 'ਨਾਮ', 'ਜਪ', 'ਵਾਹਿਗੁਰੂ', 'ਮੰਤਰ', 'ਸੁਆਸ', 'ਜਾਪ'] },
  nitnem: { en: ['nitnem', 'path', 'prayer', 'bani', 'rehras', 'sukhmani', 'japji', 'sohil', 'ardas'], pa: ['ਨਿਤਨੇਮ', 'ਪਾਠ', 'ਅਰਦਾਸ', 'ਬਾਣੀ', 'ਰਹਿਰਾਸ', 'ਸੁਖਮਨੀ', 'ਜਪੁਜੀ', 'ਸੋਹਿਲਾ'] },
  gratitude: { en: ['thank', 'grateful', 'bless', 'kirpa', 'mehar', 'daya', 'shukar'], pa: ['ਸ਼ੁਕਰ', 'ਮਿਹਰ', 'ਕਿਰਪਾ', 'ਬਰਕਤ'] },
  patience: { en: ['wait', 'patient', 'sabar', 'dhairya', 'slow', 'time', 'process', 'gradual'], pa: ['ਸਬਰ', 'ਧੀਰਜ', 'ਇੰਤਜ਼ਾਰ'] },
};

export function initRAG() {
  function getCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; }
    catch { return {}; }
  }

  function setCache(key, data) {
    const cache = getCache();
    cache[key] = { data, ts: Date.now() };
    try {
      const entries = Object.entries(cache).sort((a, b) => b[1].ts - a[1].ts);
      if (entries.length > 200) entries.splice(200);
      localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch {}
  }

  function getFromCache(key) {
    const cache = getCache();
    const entry = cache[key];
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
    return null;
  }

  function hasGurmukhi(t) { return GURMUKHI_RANGE.test(t); }
  function hasDevanagari(t) { return DEVANAGARI_RANGE.test(t); }

  function detectLang(text) {
    if (hasGurmukhi(text)) return 'gurmukhi';
    if (hasDevanagari(text)) return 'hindi';
    const lower = text.toLowerCase();
    const paWords = ['tusi', 'tuhada', 'ki', 'hai', 'ji', 'da', 'di', 'de', 'nu', 'vich', 'naal', 'te', 'vi', 'v', 'hon', 'kar', 'ho', 'nahi', 'bahut', 'boht', 'saara', 'apna', 'jeevan', 'zindagi', 'sapna', 'mehnat', 'raah', 'raaz', 'shanti', 'santushti', 'banne', 'ichha', 'purti', 'samjho', 'mahiva'];
    const paCount = paWords.filter(w => lower.includes(w)).length;
    const hiWords = ['aap', 'aapka', 'aapki', 'kya', 'hai', 'hain', 'ka', 'ki', 'ke', 'mein', 'ko', 'se', 'par', 'aur', 'yeh', 'woh', 'bahut', 'karo', 'ho', 'nahi', 'apna', 'jeevan'];
    const hiCount = hiWords.filter(w => lower.includes(w)).length;
    if (paCount > hiCount && paCount >= 2) return 'punjabi-rom';
    if (hiCount > 0) return 'hindi-rom';
    return 'english';
  }

  async function searchAPI(query, type = 3) {
    const cacheKey = `s:${query}:${type}`;
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    const bases = RAG_API_ORDER;
    for (const base of bases) {
      try {
        const url = base + '/search/' + encodeURIComponent(query) + '?searchtype=' + type + '&results=15';
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        if (!data || !data.verses) continue;
        const verses = data.verses || [];
        setCache(cacheKey, verses);
        return verses;
      } catch { continue; }
    }

    // Fallback: CORS proxy
    try {
      const proxyUrl = CORS_PROXY + encodeURIComponent(BANIDB_FALLBACK + '/search/' + encodeURIComponent(query) + '?searchtype=' + type + '&results=15');
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        const verses = data.verses || [];
        setCache(cacheKey, verses);
        return verses;
      }
    } catch {}

    return [];
  }

  async function getShabad(shabadId) {
    if (!shabadId) return null;
    const cacheKey = `sh:${shabadId}`;
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    const bases = RAG_API_ORDER;
    for (const base of bases) {
      try {
        const res = await fetch(base + '/shabads/' + shabadId);
        if (!res.ok) continue;
        const d = await res.json();
        setCache(cacheKey, d);
        return d;
      } catch { continue; }
    }

    // Fallback: CORS proxy
    try {
      const proxyUrl = CORS_PROXY + encodeURIComponent(BANIDB_FALLBACK + '/shabads/' + shabadId);
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const d = await res.json();
        setCache(cacheKey, d);
        return d;
      }
    } catch {}

    return null;
  }

  function expandQuery(text) {
    const lower = text.toLowerCase();
    const lang = detectLang(text);
    const intents = [];
    const concepts = [];
    const searchTerms = [];

    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      const matched = [...(patterns.en || []), ...(patterns.pa || [])].some(p => lower.includes(p));
      if (matched) intents.push(intent);
    }

    for (const [concept, terms] of Object.entries(CONCEPT_GRAPH)) {
      const matched = [...(terms.en || []), ...(terms.pa || [])].some(t => lower.includes(t));
      if (matched) {
        concepts.push(concept);
        searchTerms.push(concept);
        if (terms.en) searchTerms.push(...terms.en.filter(t => t.length > 3));
        if (terms.pa) searchTerms.push(...terms.pa);
      }
    }

    const words = lower.split(/\s+/).filter(w => w.length > 3);
    searchTerms.push(...words);

    return {
      lang,
      intents: [...new Set(intents)],
      concepts: [...new Set(concepts)],
      words: [...new Set(words)],
      searchTerms: [...new Set(searchTerms)].filter(Boolean),
    };
  }

  function scoreVerse(verse, analysis) {
    let score = 0;
    const searchText = [
      verse.translation?.en?.bdb || '',
      verse.translation?.en?.ms || '',
      verse.translation?.en?.ssk || '',
      verse.verse?.gurmukhi || '',
      verse.verse?.unicode || '',
    ].join(' ').toLowerCase();

    for (const intent of analysis.intents) {
      if (searchText.includes(intent)) score += 20;
    }
    for (const concept of analysis.concepts) {
      if (searchText.includes(concept)) score += 15;
    }
    for (const word of analysis.words) {
      if (searchText.includes(word)) score += 10;
    }
    if (verse.source?.sourceId === 'G') score += 5;
    if (verse.pageNo >= 1 && verse.pageNo <= 1430) score += 3;

    return Math.min(score, 100);
  }

  async function search(text) {
    const analysis = expandQuery(text);
    const terms = analysis.searchTerms.slice(0, 6);
    const searchType = analysis.lang === 'gurmukhi' ? 2 : 3;

    if (terms.length === 0) {
      const words = text.split(/\s+/).filter(w => w.length > 3);
      if (words.length > 0) terms.push(...words.slice(0, 3));
    }

    const promises = terms.map(t => searchAPI(t, searchType));
    if (analysis.lang === 'punjabi-rom' || analysis.lang === 'hindi-rom') {
      promises.push(...terms.slice(0, 2).map(t => searchAPI(t, 4)));
    }
    const results = await Promise.all(promises);

    const verseMap = new Map();
    results.forEach((verses, idx) => {
      const weight = 1 + (terms.length - idx) * 0.15;
      (verses || []).forEach(v => {
        if (!v.verseId) return;
        const existing = verseMap.get(v.verseId);
        const base = scoreVerse(v, analysis);
        const weighted = Math.round(base * weight);
        if (existing) {
          existing.score += weighted;
        } else {
          v.score = weighted;
          verseMap.set(v.verseId, v);
        }
      });
    });

    const ranked = [...verseMap.values()]
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 10);

    const selections = ranked.slice(0, 3).map(v => ({
      unicode: v.verse?.unicode || '',
      gurmukhi: v.verse?.gurmukhi || '',
      english: v.translation?.en?.bdb || v.translation?.en?.ms || '',
      punjabi: v.translation?.pu?.bdb?.unicode || v.translation?.pu?.ss?.unicode || '',
      pageNo: v.pageNo,
      lineNo: v.lineNo,
      shabadId: v.shabadId,
      writer: v.writer?.english || '',
      writerGurmukhi: v.writer?.gurmukhi || v.writer?.unicode || '',
      source: v.source?.english || '',
      sourceGurmukhi: v.source?.unicode || v.source?.gurmukhi || '',
      score: v.score || 0,
    }));

    return {
      analysis,
      totalFound: ranked.length,
      verses: selections,
    };
  }

  function formatResponse(ragResult) {
    if (!ragResult || !ragResult.verses || ragResult.verses.length === 0) return null;
    let text = '';
    for (const v of ragResult.verses) {
      text += `\n---\n`;
      if (v.unicode) text += `${v.unicode}\n`;
      if (v.english) text += `${v.english}\n`;
      text += `(Ang ${v.pageNo || '?'}, ${v.writerGurmukhi || v.writer || ''})\n`;
    }
    return text;
  }

  return {
    search,
    formatResponse,
    expandQuery,
    getShabad,
    detectLang,
  };
}
