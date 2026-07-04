export function createConversationMemory(store) {
  const MAX_MESSAGES = 40;
  let history = [];
  let sessionId = Date.now().toString();

  function init() {
    const data = store.load();
    if (data && data.history) history = data.history;
    return history;
  }

  function save() {
    const data = store.load() || {};
    data.history = history;
    store.save(data);
  }

  function push(msg) {
    history.push(msg);
    if (history.length > MAX_MESSAGES) history = history.slice(-MAX_MESSAGES);
    save();
  }

  function get() { return history; }
  function set(h) { history = h; save(); }
  function clear() { history = []; sessionId = Date.now().toString(); save(); }
  function getSessionId() { return sessionId; }
  function setSessionId(id) { sessionId = id; }
  function getLast() { return history.length > 0 ? history[history.length - 1] : null; }
  function getLastUserMessage() {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === 'user') return history[i].content;
    }
    return '';
  }

  return { init, save, push, get, set, clear, getSessionId, setSessionId, getLast, getLastUserMessage };
}
