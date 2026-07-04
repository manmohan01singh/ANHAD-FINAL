/* ── GurbaniRenderer ──
   Injects Gurbani cards into the message stream and manages reading history.
   Separated from message rendering because it has different concerns (pipeline data, history). */

import { esc } from '../../shared/escape.js';
import { convertAnmolToUnicode } from '../../shared/gurmukhi.js';

export function createGurbaniRenderer() {
  function renderCard(primary, related, fullShabad) {
    if (!primary) return null;
    let html = '<div class="gurbani-block"><div class="gurbani-block-inner">';

    if (primary.unicode) html += '<div class="gb-verse">' + primary.unicode + '</div>';
    if (primary.english) html += '<div class="gb-translation">' + esc(primary.english) + '</div>';
    if (primary.punjabi && primary.punjabi !== primary.english) html += '<div class="gb-translation gb-punjabi">' + esc(primary.punjabi) + '</div>';

    const meta = [];
    if (primary.pageNo) meta.push('Ang ' + primary.pageNo);
    if (primary.raag) meta.push('Raag ' + primary.raag);
    const author = primary.writerGurmukhi ? convertAnmolToUnicode(primary.writerGurmukhi) : primary.writer;
    if (author) meta.push(author);
    if (meta.length) html += '<div class="gb-source">' + esc(meta.join(' \u00B7 ')) + '</div>';

    if (fullShabad && fullShabad.shabadId) {
      html += '<button class="gb-full-btn" data-shabad-id="' + fullShabad.shabadId + '">View Full Shabad</button>';
    }

    if (related && related.length > 0) {
      html += '<div class="gb-related-label">Related</div>';
      for (const r of related) {
        html += '<div class="gb-related-verse" data-shabad-id="' + (r.shabadId || '') + '">' + esc((r.unicode || '').slice(0, 80)) + '</div>';
      }
    }

    html += '</div></div>';
    return html;
  }

  function injectCard(container, html) {
    if (!container || !html) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    container.appendChild(wrapper.firstElementChild);
  }

  return { renderCard, injectCard };
}
