export const V = {
  notEmpty: function(t) { return t.trim().length > 0; },
  notTooLong: function(t) { return t.length <= 2000; },
  notDuplicate: function(t, h) { return h.length === 0 || h[h.length - 1]?.content !== t.trim(); },
  isOnline: function() { return navigator.onLine; },
  notStreaming: function(s) { return !s; },
  isSafe: function(t) { return !/(.)\1{15,}/i.test(t); },
  historyCap: function(h) { return h.length <= 38; },
  ttsAvail: function() { return 'speechSynthesis' in window; },
  shareAvail: function() { return !!navigator.share; },
  noAbuse: function(t) { return !/^\s*[!@#$%^&*()\-_=+[\]{}|;':",.<>?\/\\`~]{10,}/.test(t); },
};
