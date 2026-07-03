import { createMemoryStore } from './MemoryStore.js';
import { createConversationMemory } from './ConversationMemory.js';
import { createJourneyMemory } from './JourneyMemory.js';
import { createPreferenceMemory } from './PreferenceMemory.js';
import { createSummaryMemory } from './SummaryMemory.js';

export function initMemory() {
  const store = createMemoryStore();
  const conversation = createConversationMemory(store);
  const journey = createJourneyMemory(store);
  const preferences = createPreferenceMemory(store);
  const summary = createSummaryMemory(store);

  conversation.init();

  function reset() {
    const data = store.load();
    if (data) {
      data.history = [];
      data.journey = { milestones: [], conceptsExplored: [], topicsCovered: [], totalSessions: 0, totalMessages: 0 };
      data.summary = '';
      data.lastSessionTopic = '';
      data.summaryMessageCount = 0;
      store.save(data);
    }
    conversation.clear();
  }

  function getFullState() {
    return {
      conversation: conversation.get(),
      journey: journey.get(),
      summary: summary.getSummary(),
      preferences: {
        theme: preferences.getTheme(),
        groqKey: preferences.getGroqKey(),
        chime: preferences.getChime(),
      },
    };
  }

  return {
    conversation,
    journey,
    preferences,
    summary,
    reset,
    getFullState,
  };
}
