/* ── Rhythm advisor: suggests sentence cadence based on mode + repetition ── */

export function getRhythmSuggestion(currentMode, recentModes) {
  const sameModeCount = recentModes.filter(function(m) { return m === currentMode; }).length;

  if (sameModeCount >= 3) {
    return 'Use shorter sentences. Fewer clauses. More space between ideas. After every long sentence, follow with a very short one.';
  }
  if (sameModeCount >= 2) {
    return 'Vary sentence length actively — some short (3-6 words), some medium (10-15), some long (20+). Avoid three sentences of the same rhythm in a row.';
  }
  if (currentMode === 'crisis' || currentMode === 'comfort') {
    return 'Use mostly short to medium sentences. Keep clauses simple. Let silence exist between ideas.';
  }
  if (currentMode === 'teaching' || currentMode === 'scholar') {
    return 'Medium sentences for explanation. Short for emphasis. Long only when the teaching requires it.';
  }
  return 'Write naturally varied sentences. No two consecutive responses should have the same cadence.';
}

export function checkSentenceVariety(sentences) {
  if (!sentences || sentences.length < 3) return { score: 0.5, issues: ['Too few sentences to evaluate'] };
  const lengths = sentences.map(function(s) { return s.split(/\s+/).length; });
  let varietyScore = 0;
  for (let i = 1; i < lengths.length; i++) {
    const diff = Math.abs(lengths[i] - lengths[i - 1]);
    if (diff > 3) varietyScore++;
  }
  const score = Math.min(varietyScore / (lengths.length - 1), 1);
  const issues = [];
  if (score < 0.3) issues.push('Sentences are too uniform in length');
  const avgLen = lengths.reduce(function(a, b) { return a + b; }, 0) / lengths.length;
  if (avgLen > 25) issues.push('Average sentence length too high: ' + Math.round(avgLen) + ' words');
  if (avgLen < 6) issues.push('Average sentence length too low: ' + Math.round(avgLen) + ' words');
  return { score: Math.round(score * 100) / 100, avgLength: Math.round(avgLen), issues };
}
