/* ── ConversationStore ──
   Holds all conversation state that chat.js previously owned as local variables.
   Single source of truth for what's currently happening. */

export function createConversationStore() {
  let history = [];
  let streaming = false;
  let abortCtrl = null;
  let sessionId = Date.now().toString();
  let fullResponseText = '';
  let currentMsgEl = null;
  let gurbaniBlockData = null;

  function getHistory() { return history; }
  function setHistory(h) { history = h; }
  function pushHistory(msg) { history.push(msg); }
  function getLastHistory() { return history.length > 0 ? history[history.length - 1] : null; }

  function isStreaming() { return streaming; }
  function setStreaming(s) { streaming = s; }

  function getAbortCtrl() { return abortCtrl; }
  function setAbortCtrl(c) { abortCtrl = c; }

  function getSessionId() { return sessionId; }
  function setSessionId(id) { sessionId = id; }

  function getFullResponse() { return fullResponseText; }
  function setFullResponse(t) { fullResponseText = t; }
  function appendToResponse(t) { fullResponseText += t; }

  function getCurrentMsgEl() { return currentMsgEl; }
  function setCurrentMsgEl(el) { currentMsgEl = el; }

  function getGurbaniBlock() { return gurbaniBlockData; }
  function setGurbaniBlock(b) { gurbaniBlockData = b; }

  function resetResponse() {
    fullResponseText = '';
    currentMsgEl = null;
    gurbaniBlockData = null;
  }

  function clearAll() {
    history = [];
    streaming = false;
    abortCtrl = null;
    fullResponseText = '';
    currentMsgEl = null;
    gurbaniBlockData = null;
  }

  return {
    getHistory, setHistory, pushHistory, getLastHistory,
    isStreaming, setStreaming,
    getAbortCtrl, setAbortCtrl,
    getSessionId, setSessionId,
    getFullResponse, setFullResponse, appendToResponse,
    getCurrentMsgEl, setCurrentMsgEl,
    getGurbaniBlock, setGurbaniBlock,
    resetResponse, clearAll,
  };
}
