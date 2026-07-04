export function createSummaryMemory(store) {
  let awaitingSummary = false;

  function load() {
    const data = store.load();
    return {
      summary: (data && data.summary) || '',
      lastSessionTopic: (data && data.lastSessionTopic) || '',
      summaryMessageCount: (data && data.summaryMessageCount) || 0,
    };
  }

  function save(summaryData) {
    const data = store.load() || {};
    data.summary = summaryData.summary;
    data.lastSessionTopic = summaryData.lastSessionTopic;
    data.summaryMessageCount = summaryData.summaryMessageCount;
    store.save(data);
  }

  function shouldSummarize(messageCount) {
    return messageCount > 0 && messageCount % 20 === 0 && !awaitingSummary;
  }

  function markSummarizing() { awaitingSummary = true; }

  function storeSummary(text) {
    const s = load();
    s.summary = text;
    s.summaryMessageCount = 0;
    awaitingSummary = false;
    save(s);
  }

  function getSummary() { return load().summary; }
  function getLastSessionTopic() { return load().lastSessionTopic; }
  function markSessionEnd(topic) {
    const s = load();
    s.lastSessionTopic = topic || s.summary.slice(0, 80);
    save(s);
  }
  function incrementMessageCount() {
    const s = load();
    s.summaryMessageCount++;
    save(s);
  }

  return { shouldSummarize, markSummarizing, storeSummary, getSummary, getLastSessionTopic, markSessionEnd, incrementMessageCount };
}
