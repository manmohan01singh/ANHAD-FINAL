const MILESTONE_PATTERNS = [
  { keyword: 'japji', event: 'Started Japji Sahib' },
  { keyword: 'nitnem', event: 'Began Nitnem' },
  { keyword: 'simran', event: 'Began Simran practice' },
  { keyword: 'hukam', event: 'Explored Hukam' },
  { keyword: 'ardas', event: 'Learned Ardas' },
  { keyword: 'sangat', event: 'Joined Sangat' },
  { keyword: 'seva', event: 'Started Seva' },
  { keyword: 'naam', event: 'Connected with Naam' },
  { keyword: 'gurmat', event: 'Studied Gurmat' },
  { keyword: 'waheguru', event: 'Connected with Waheguru' },
  { keyword: 'sahaj', event: 'Experienced Sahaj' },
  { keyword: 'chardi kala', event: 'Embraced Chardi Kala' },
  { keyword: 'guru granth', event: 'Read Guru Granth Sahib' },
  { keyword: 'kirtan', event: 'Experienced Kirtan' },
  { keyword: 'amrit', event: 'Took Amrit' },
  { keyword: 'rehat', event: 'Learned Rehat' },
  { keyword: 'gurpurab', event: 'Celebrated Gurpurab' },
];

export function createJourneyMemory(store) {
  function load() {
    const data = store.load();
    return {
      milestones: (data && data.journey && data.journey.milestones) || [],
      conceptsExplored: (data && data.journey && data.journey.conceptsExplored) || [],
      topicsCovered: (data && data.journey && data.journey.topicsCovered) || [],
      totalSessions: (data && data.journey && data.journey.totalSessions) || 0,
      totalMessages: (data && data.journey && data.journey.totalMessages) || 0,
    };
  }

  function save(journey) {
    const data = store.load() || {};
    data.journey = journey;
    store.save(data);
  }

  function detectMilestones(text, role) {
    if (role !== 'user') return [];
    const journey = load();
    const lower = text.toLowerCase();
    const found = [];
    for (const m of MILESTONE_PATTERNS) {
      if (lower.includes(m.keyword)) {
        const exists = journey.milestones.some(function(e) { return e.event === m.event; });
        if (!exists) {
          journey.milestones.push({ event: m.event, ts: Date.now() });
          found.push(m.event);
        }
      }
    }
    if (found.length > 0) save(journey);
    return found;
  }

  function recordConcept(concept) {
    const journey = load();
    if (!journey.conceptsExplored.includes(concept)) {
      journey.conceptsExplored.push(concept);
      save(journey);
    }
  }

  function incrementMessages() {
    const journey = load();
    journey.totalMessages++;
    save(journey);
  }

  function incrementSessions() {
    const journey = load();
    journey.totalSessions++;
    save(journey);
  }

  function get() { return load(); }

  return { detectMilestones, recordConcept, incrementMessages, incrementSessions, get };
}
