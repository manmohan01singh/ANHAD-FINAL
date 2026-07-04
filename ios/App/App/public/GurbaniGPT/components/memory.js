const MEM_STORE = 'gurbanigpt_memory_v2';

const SUMMARY_INTERVAL = 20;

export function initMemory() {
  let data = load();

  function defaults() {
    return {
      firstVisit: Date.now(),
      lastActive: Date.now(),
      totalSessions: 0,
      totalMessages: 0,
      summary: null,
      journey: [],
      lastSessionTopic: null,
      awaitingSummary: false,
    };
  }

  function load() {
    try { return JSON.parse(localStorage.getItem(MEM_STORE)) || defaults(); }
    catch { return defaults(); }
  }

  function save() {
    try { localStorage.setItem(MEM_STORE, JSON.stringify(data)); } catch {}
  }

  function shouldSummarize() {
    return data.totalMessages > 0 && data.totalMessages % SUMMARY_INTERVAL === 0 && !data.awaitingSummary;
  }

  function markSummarizing() {
    data.awaitingSummary = true;
    save();
  }

  function storeSummary(text) {
    data.summary = text;
    data.awaitingSummary = false;
    save();
  }

  function addMilestone(event) {
    if (data.journey.some(m => m.event === event)) return;
    const week = Math.floor((Date.now() - data.firstVisit) / (7 * 86400000)) + 1;
    data.journey.push({ event, week, date: new Date().toLocaleDateString('en-IN') });
    save();
  }

  function detectMilestones(text, role) {
    const lower = text.toLowerCase();
    const milestones = [
      { words: ['japji', 'japji sahib'], event: 'Started exploring Japji Sahib' },
      { words: ['nitnem'], event: 'Began daily Nitnem practice' },
      { words: ['meaning', 'arth', 'explain', 'understand'], event: 'Started learning meanings of Gurbani' },
      { words: ['hukam'], event: 'Asked about Hukam (Divine Will)' },
      { words: ['sggs', 'guru granth', 'granth sahib'], event: 'Reading Sri Guru Granth Sahib' },
      { words: ['simran', 'naam jap', 'jap'], event: 'Started Naam Simran practice' },
      { words: ['seva', 'service'], event: 'Engaged in Seva (selfless service)' },
      { words: ['ardas'], event: 'Learned about Ardas' },
      { words: ['amrit', 'amrit sanchar'], event: 'Asked about Amrit Sanchar' },
      { words: ['kirtan', 'keertan'], event: 'Started listening to Kirtan' },
      { words: ['sangat'], event: 'Connected with Sangat' },
      { words: ['mool mantar'], event: 'Studied Mool Mantar' },
      { words: ['sukhmani'], event: 'Reading Sukhmani Sahib' },
      { words: ['rehras'], event: 'Started Rehras Sahib' },
      { words: ['guru', 'guru sahib'], event: 'Deepening Guru connection' },
      { words: ['maya', 'attachment', 'detach'], event: 'Explored detachment from Maya' },
      { words: ['chardi kala'], event: 'Embracing Chardi Kala' },
    ];
    if (role !== 'user') return;
    for (const m of milestones) {
      if (m.words.some(w => lower.includes(w))) {
        addMilestone(m.event);
      }
    }
  }

  function markSessionEnd() {
    data.lastSessionTopic = data.summary || null;
    save();
  }

  function markMessage() {
    data.totalMessages++;
    data.lastActive = Date.now();
    save();
  }

  function markNewSession() {
    data.totalSessions++;
    if (!data.journey.length) addMilestone('Began the spiritual journey with ANHAD');
    save();
  }

  function getStats() {
    return {
      sessions: data.totalSessions,
      messages: data.totalMessages,
      journey: data.journey,
      lastSession: data.lastSessionTopic,
      summary: data.summary,
      awaitingSummary: data.awaitingSummary,
    };
  }

  function getSummary() {
    return data.summary;
  }

  function getJourney() {
    return data.journey;
  }

  function getLastSessionTopic() {
    return data.lastSessionTopic;
  }

  function reset() {
    data = defaults();
    save();
  }

  function getKey() {
    try { return localStorage.getItem('gurbanigpt_groq_key') || ''; } catch { return ''; }
  }

  function setKey(key) {
    try { localStorage.setItem('gurbanigpt_groq_key', key); } catch {}
  }

  return {
    shouldSummarize,
    markSummarizing,
    storeSummary,
    detectMilestones,
    markSessionEnd,
    markMessage,
    markNewSession,
    getStats,
    getSummary,
    getJourney,
    getLastSessionTopic,
    reset,
    getKey,
    setKey,
  };
}
