/* ── Debug Panel — Developer Transparency ──
   Floating DevTools overlay showing retrieval pipeline internals.
   Toggle with Ctrl+Shift+D.
   Self-contained — injects its own styles dynamically. */

const STYLES = '\
#anhad-debug {\
  all: initial;\
  position: fixed;\
  bottom: 0;\
  right: 0;\
  width: 420px;\
  max-height: 60vh;\
  background: #0c0a09;\
  border: 1px solid rgba(200, 154, 58, 0.2);\
  border-radius: 12px 12px 0 0;\
  z-index: 9999;\
  font-family: "SF Mono", "Cascadia Code", "Consolas", monospace;\
  font-size: 11px;\
  line-height: 1.5;\
  color: #e6dcc8;\
  overflow: hidden;\
  display: none;\
  box-shadow: 0 -8px 40px rgba(0,0,0,0.6);\
  flex-direction: column;\
}\
#anhad-debug.open { display: flex; }\
#anhad-debug-hdr {\
  display: flex;\
  align-items: center;\
  justify-content: space-between;\
  padding: 8px 12px;\
  background: rgba(200, 154, 58, 0.08);\
  border-bottom: 1px solid rgba(200, 154, 58, 0.15);\
  cursor: pointer;\
  user-select: none;\
  flex-shrink: 0;\
}\
#anhad-debug-hdr span { color: #c89a3a; font-size: 10px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }\
#anhad-debug-hdr button {\
  background: none;\
  border: none;\
  color: rgba(230, 220, 200, 0.4);\
  cursor: pointer;\
  font-size: 14px;\
  padding: 0 4px;\
}\
#anhad-debug-hdr button:hover { color: #e6dcc8; }\
#anhad-debug-body {\
  overflow-y: auto;\
  padding: 8px 12px;\
  flex: 1;\
}\
.anhad-debug-section {\
  margin-bottom: 8px;\
  border-bottom: 1px solid rgba(200, 154, 58, 0.08);\
  padding-bottom: 8px;\
}\
.anhad-debug-section:last-child { border-bottom: none; margin-bottom: 0; }\
.anhad-debug-label {\
  color: rgba(200, 154, 58, 0.6);\
  font-size: 9px;\
  text-transform: uppercase;\
  letter-spacing: 0.5px;\
  margin-bottom: 4px;\
}\
.anhad-debug-value {\
  color: #cdc4ae;\
  word-break: break-word;\
}\
.anhad-debug-value strong { color: #e6dcc8; font-weight: 600; }\
.anhad-debug-score {\
  display: inline-block;\
  padding: 1px 5px;\
  border-radius: 3px;\
  font-size: 10px;\
  font-weight: 600;\
  margin-left: 4px;\
}\
.anhad-debug-score.high { background: rgba(34, 197, 94, 0.2); color: #22c55e; }\
.anhad-debug-score.med { background: rgba(234, 179, 8, 0.2); color: #eab308; }\
.anhad-debug-score.low { background: rgba(239, 68, 68, 0.2); color: #ef4444; }\
.anhad-debug-json {\
  font-size: 10px;\
  color: rgba(230, 220, 200, 0.5);\
  white-space: pre-wrap;\
  word-break: break-all;\
  max-height: 100px;\
  overflow: hidden;\
}\
.anhad-debug-candidate {\
  display: flex;\
  align-items: center;\
  justify-content: space-between;\
  padding: 3px 0;\
  border-bottom: 1px solid rgba(255,255,255,0.04);\
}\
.anhad-debug-candidate:last-child { border-bottom: none; }\
.anhad-debug-candidate.selected { background: rgba(200, 154, 58, 0.08); margin: 0 -4px; padding: 3px 4px; border-radius: 4px; }\
.anhad-debug-candidate .excerpt { color: rgba(230, 220, 200, 0.6); flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 10px; }\
.anhad-debug-candidate .badge { font-size: 9px; padding: 1px 4px; border-radius: 3px; margin-left: 6px; flex-shrink: 0; }\
.anhad-debug-info { color: rgba(230, 220, 200, 0.4); font-style: italic; font-size: 10px; }\
';

let instance = null;

export function initDebugPanel() {
  if (instance) return instance;

  const panel = document.createElement('div');
  panel.id = 'anhad-debug';

  const style = document.createElement('style');
  style.textContent = STYLES;
  document.head.appendChild(style);

  panel.innerHTML = '\
    <div id="anhad-debug-hdr">\
      <span>ANHAD Debug Pipeline</span>\
      <button id="anhad-debug-close">\u2715</button>\
    </div>\
    <div id="anhad-debug-body">\
      <div class="anhad-debug-info">Waiting for pipeline data...</div>\
    </div>\
  ';

  document.body.appendChild(panel);

  const header = panel.querySelector('#anhad-debug-hdr');
  const closeBtn = panel.querySelector('#anhad-debug-close');

  let onClose = null;

  header.addEventListener('click', function(e) {
    if (e.target === closeBtn) return;
    panel.classList.toggle('open');
  });

  closeBtn.addEventListener('click', function() {
    panel.classList.remove('open');
    if (onClose) onClose();
  });

  function open() { panel.classList.add('open'); }
  function close() { panel.classList.remove('open'); }
  function toggle() { panel.classList.toggle('open'); }
  function isOpen() { return panel.classList.contains('open'); }
  function setOnClose(fn) { onClose = fn; }

  function render(trace) {
    const body = panel.querySelector('#anhad-debug-body');
    if (!body) return;

    body.innerHTML = '';

    if (!trace) {
      body.innerHTML = '<div class="anhad-debug-info">No pipeline data yet. Send a message to see the retrieval pipeline in action.</div>';
      return;
    }

    // Input section
    addSection(body, 'Input', '<div class="anhad-debug-value">' + escapeHtml(trace.input || '') + '</div>');

    // Conversation Mode section
    const convMode = trace.stages ? trace.stages.find(function(s) { return s.name === 'conversation_mode'; }) : null;
    if (convMode && convMode.output) {
      const m = convMode.output;
      addSection(body, 'Conversation Mode', '\
        <div class="anhad-debug-value"><strong>Type:</strong> ' + (m.type || '?') + ' <span class="anhad-debug-score ' + (m.needsGurbani ? 'high' : 'low') + '">' + (m.needsGurbani ? 'Gurbani' : 'Skip') + '</span></div>\
        <div class="anhad-debug-value" style="opacity:0.7">' + (m.label || '') + '</div>\
      ');
    }

    // Detection section
    const detectionStage = trace.stages ? trace.stages.find(function(s) { return s.name === 'detection'; }) : null;
    if (detectionStage && detectionStage.output) {
      const d = detectionStage.output;
      addSection(body, 'Detection', '\
        <div class="anhad-debug-value"><strong>Intent:</strong> ' + d.intent + ' <span class="anhad-debug-score ' + (d.confidence > 0.6 ? 'high' : d.confidence > 0.3 ? 'med' : 'low') + '">' + Math.round(d.confidence * 100) + '%</span></div>\
        <div class="anhad-debug-value"><strong>Emotion:</strong> ' + d.emotion + '</div>\
        <div class="anhad-debug-value"><strong>Subtext:</strong> ' + d.subtext + '</div>\
      ');
    }

    // Human Need section
    const humanNeedStage = trace.stages ? trace.stages.find(function(s) { return s.name === 'human_need'; }) : null;
    if (humanNeedStage && humanNeedStage.output) {
      const h = humanNeedStage.output;
      addSection(body, 'Human Need', '\
        <div class="anhad-debug-value"><strong>Primary need:</strong> ' + (h.primaryNeed || '?') + '</div>\
        <div class="anhad-debug-value" style="opacity:0.7;font-size:10px">' + escapeHtml(h.needStatement || '') + '</div>\
        ' + (h.secondaryNeeds && h.secondaryNeeds.length > 0 ? '<div class="anhad-debug-value" style="font-size:10px;opacity:0.5"><strong>Secondary:</strong> ' + h.secondaryNeeds.join(', ') + '</div>' : '') + '\
      ');
    }

    // Wisdom section
    const wisdomStage = trace.stages ? trace.stages.find(function(s) { return s.name === 'wisdom'; }) : null;
    if (wisdomStage && wisdomStage.output) {
      const w = wisdomStage.output;
      addSection(body, 'Wisdom Reasoning', '\
        <div class="anhad-debug-value" style="color:var(--accent-bright)"><strong>Illusion:</strong> ' + escapeHtml(w.illusion || '') + '</div>\
        <div class="anhad-debug-value" style="margin-top:4px"><strong>Truth:</strong> ' + escapeHtml(w.truth || '') + '</div>\
        <div class="anhad-debug-value" style="margin-top:4px;opacity:0.7"><strong>Transformation:</strong> ' + escapeHtml(w.transformation || '') + '</div>\
        <div class="anhad-debug-value" style="margin-top:2px"><strong>Clarity:</strong> ' + (w.clarity || 'unclear') + '</div>\
      ');
    }

    // Expansion section
    const expansionStage = trace.stages ? trace.stages.find(function(s) { return s.name === 'expansion'; }) : null;
    if (expansionStage && expansionStage.output) {
      const e = expansionStage.output;
      let conceptsHtml = '';
      for (const c of e.concepts || []) {
        conceptsHtml += '<div class="anhad-debug-value">\u2022 ' + c.theme + ' <span class="anhad-debug-score ' + (c.weight > 0.7 ? 'high' : c.weight > 0.4 ? 'med' : 'low') + '">' + Math.round(c.weight * 100) + '%</span></div>';
      }
      addSection(body, 'Expansion', '\
        <div class="anhad-debug-value"><strong>Theme:</strong> ' + e.primaryTheme + '</div>\
        ' + conceptsHtml + '\
        ' + (e.lifeSituation ? '<div class="anhad-debug-value"><strong>Situation:</strong> ' + e.lifeSituation.situation + '</div>' : '') + '\
        ' + (e.wisdomContext ? '<div class="anhad-debug-value" style="margin-top:4px;font-size:10px;opacity:0.7"><strong>Wisdom:</strong> ' + escapeHtml(e.wisdomContext.transformation.slice(0, 100)) + '</div>' : '') + '\
      ');
    }

    // Multi-Query section
    const multiQueryStage = trace.stages ? trace.stages.find(function(s) { return s.name === 'multi_query'; }) : null;
    if (multiQueryStage && multiQueryStage.queries) {
      let queriesHtml = '';
      for (const q of multiQueryStage.queries) {
        queriesHtml += '<div class="anhad-debug-value" style="font-size:10px">\u2022 <strong>[' + q.type + ']</strong> ' + escapeHtml(q.query) + ' <span class="anhad-debug-score ' + (q.weight > 0.7 ? 'high' : q.weight > 0.4 ? 'med' : 'low') + '">' + Math.round(q.weight * 100) + '%</span></div>';
      }
      addSection(body, 'Multi-Query <span style="font-weight:400;opacity:0.5">(' + multiQueryStage.queries.length + ' queries)</span>', queriesHtml);
    }

    // Multi-Recall section
    const multiRecallStage = trace.stages ? trace.stages.find(function(s) { return s.name === 'multi_recall'; }) : null;
    if (multiRecallStage && multiRecallStage.results) {
      let resultsHtml = '';
      let totalCandidates = 0;
      for (const r of multiRecallStage.results) {
        resultsHtml += '<div class="anhad-debug-value" style="font-size:10px">\u2022 [' + r.queryType + '] ' + r.count + ' candidates</div>';
        totalCandidates += r.count;
      }
      if (multiRecallStage.counterfactualFetched != null) {
        resultsHtml += '<div class="anhad-debug-value" style="font-size:10px;opacity:0.6">\u2022 Counterfactual: ' + multiRecallStage.counterfactualFetched + ' candidates</div>';
      }
      addSection(body, 'Multi-Recall <span style="font-weight:400;opacity:0.5">(' + totalCandidates + ' total)</span>', resultsHtml);
    }

    // Cross-Ranking section (contrastive scoring)
    const crossRankingStage = trace.stages ? trace.stages.find(function(s) { return s.name === 'cross_ranking'; }) : null;
    if (crossRankingStage) {
      let candidatesHtml = '';
      for (const c of (crossRankingStage.scored || []).slice(0, 8)) {
        const isSelected = trace.primary && (trace.primary.verseId === c.verseId || trace.primary.shabadId === c.shabadId);
        const antiScore = c.scores.anti;
        const hasAnti = antiScore != null && antiScore > 0;
        candidatesHtml += '\
          <div class="anhad-debug-candidate ' + (isSelected ? 'selected' : '') + '">\
            <span class="excerpt">' + escapeHtml(c.excerpt || '') + '</span>\
            <span class="badge anhad-debug-score ' + (c.scores.total > 0.6 ? 'high' : c.scores.total > 0.3 ? 'med' : 'low') + '">' + Math.round(c.scores.total * 100) + '%</span>\
            ' + (hasAnti ? '<span class="badge" style="background:rgba(239,68,68,0.15);color:#ef4444;font-size:8px">A:' + Math.round(antiScore * 100) + '%</span>' : '') + '\
          </div>';
      }
      addSection(body, 'Cross-Ranking <span style="font-weight:400;opacity:0.5">(top ' + Math.min((crossRankingStage.scored || []).length, 8) + ')</span>', candidatesHtml);
    }

    // Self-Verification section
    const selfVerStage = trace.stages ? trace.stages.find(function(s) { return s.name === 'self_verification'; }) : null;
    if (selfVerStage) {
      let verHtml = '<div class="anhad-debug-value"><strong>Top score before:</strong> ' + Math.round((selfVerStage.topScoreBefore || 0) * 100) + '%</div>';
      verHtml += '<div class="anhad-debug-value"><strong>Threshold:</strong> ' + Math.round((selfVerStage.threshold || 0) * 100) + '%</div>';
      if (selfVerStage.needMatchBefore != null) {
        verHtml += '<div class="anhad-debug-value"><strong>Need match:</strong> ' + selfVerStage.needMatchBefore + '</div>';
      }
      if (selfVerStage.boosted) {
        verHtml += '<div class="anhad-debug-value"><strong>Boosted:</strong> Yes <span class="anhad-debug-score med">adjusted</span></div>';
        verHtml += '<div class="anhad-debug-value"><strong>Score after:</strong> ' + Math.round((selfVerStage.topScoreAfter || 0) * 100) + '%</div>';
        if (selfVerStage.needMatchAfter != null) {
          verHtml += '<div class="anhad-debug-value"><strong>Need match after:</strong> ' + selfVerStage.needMatchAfter + '</div>';
        }
      } else {
        verHtml += '<div class="anhad-debug-value"><strong>Verdict:</strong> <span style="color:#22c55e">passed</span></div>';
      }
      addSection(body, 'Self-Verification', verHtml);
    }

    // Selection section
    const selectionStage = trace.stages ? trace.stages.find(function(s) { return s.name === 'selection'; }) : null;
    if (selectionStage) {
      const s = selectionStage;
      addSection(body, 'Selection', '\
        <div class="anhad-debug-value"><strong>Threshold:</strong> ' + (s.threshold || 0) * 100 + '%</div>\
        <div class="anhad-debug-value"><strong>Above threshold:</strong> ' + (s.aboveThresholdCount || 0) + '</div>\
        <div class="anhad-debug-value"><strong>Cluster:</strong> ' + (s.clusterTheme || 'none') + '</div>\
        <div class="anhad-debug-value"><strong>Primary:</strong> ' + (s.primary ? (s.primary.shabadId || s.primary.verseId || 'none') + ' \u2014 score ' + (s.primary.totalScore || 0) * 100 + '% (transform: ' + (s.primary.transformScore || 0) * 100 + '%)' : 'none selected') + '</div>\
        ' + (s.illusion ? '<div class="anhad-debug-value" style="font-size:10px;opacity:0.7;margin-top:2px"><strong>Illusion:</strong> ' + escapeHtml(s.illusion.slice(0, 120)) + '</div>' : '') + '\
        <div class="anhad-debug-value" style="font-size:10px;opacity:0.5;margin-top:2px">' + escapeHtml(s.rationale || '') + '</div>\
      ');
    }

    // Related section
    if (trace.related && trace.related.length > 0) {
      let relatedHtml = '';
      for (const r of trace.related) {
        relatedHtml += '<div class="anhad-debug-value">\u2022 ' + (r.shabadId || r.verseId || '?') + ' <span class="anhad-debug-score med">' + Math.round(r.scores.total * 100) + '%</span></div>';
      }
      addSection(body, 'Related References', relatedHtml);
    }

    // Below threshold
    if (trace.belowThreshold && trace.belowThreshold.length > 0) {
      addSection(body, 'Below Threshold <span style="font-weight:400;opacity:0.5">(' + trace.belowThreshold.length + ')</span>', '<div class="anhad-debug-info">' + Math.min(trace.belowThreshold.length, 3) + ' candidates did not meet threshold. Lowest: ' + Math.round(trace.belowThreshold[trace.belowThreshold.length - 1].scores.total * 100) + '%</div>');
    }

    // Response Planner section
    const plannerStage = trace.stages ? trace.stages.find(function(s) { return s.name === 'response_planner'; }) : null;
    if (plannerStage) {
      const p = plannerStage.output;
      addSection(body, 'Response Plan', '\
        <div class="anhad-debug-value"><strong>Mode:</strong> ' + (p.mode || '') + '</div>\
        <div class="anhad-debug-value" style="font-size:11px"><strong>Opening:</strong> ' + escapeHtml(p.opening || '') + '</div>\
        <div class="anhad-debug-value" style="font-size:11px"><strong>Transition:</strong> ' + escapeHtml(p.transition || '') + '</div>\
        <div class="anhad-debug-value" style="font-size:11px"><strong>Closing:</strong> ' + escapeHtml(p.closing || '') + '</div>\
        <div class="anhad-debug-value" style="font-size:10px;opacity:0.7"><strong>Focus:</strong> ' + escapeHtml(p.teachingFocus || 'none') + '</div>\
      ');
    }

    // Primary verse data
    if (trace.primary) {
      addSection(body, 'Primary Gurbani', '\
        <div class="anhad-debug-value" style="font-family:\'Noto Sans Gurmukhi\',serif;font-size:13px">' + escapeHtml(trace.primary.unicode || '') + '</div>\
        <div class="anhad-debug-value" style="opacity:0.7">' + escapeHtml(trace.primary.english || '') + '</div>\
        <div class="anhad-debug-value" style="font-size:10px;opacity:0.5">Ang ' + (trace.primary.pageNo || '?') + (trace.primary.writer ? ' \u00B7 ' + trace.primary.writer : '') + '</div>\
      ');
    }
  }

  function addSection(parent, label, content) {
    const section = document.createElement('div');
    section.className = 'anhad-debug-section';
    section.innerHTML = '<div class="anhad-debug-label">' + label + '</div>' + content;
    parent.appendChild(section);
  }

  function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  instance = { open, close, toggle, render, isOpen, setOnClose };
  return instance;
}
