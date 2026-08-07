/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LIGHTHOUSE DEEP AUDIT INSPECTOR
 * 
 * Deeply audits every single Lighthouse metric:
 * - Render-blocking resources
 * - Unused CSS / Unused JS
 * - Image delivery & sizing
 * - Long tasks & main-thread breakdown
 * - Non-composited animations
 * - BFCache failure causes
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

const reportPath = path.join(__dirname, '../lighthouse-report.json');

function deepInspect() {
  if (!fs.existsSync(reportPath)) return;
  const lh = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const audits = lh.audits || {};

  const auditKeys = [
    'render-blocking-resources',
    'unused-css-rules',
    'unused-javascript',
    'modern-image-formats',
    'uses-optimized-images',
    'uses-responsive-images',
    'efficient-animated-content',
    'non-composited-animations',
    'bf-cache',
    'dom-size',
    'long-tasks',
    'bootup-time',
    'user-timings'
  ];

  const deepResults = {};

  auditKeys.forEach(key => {
    if (audits[key]) {
      deepResults[key] = {
        title: audits[key].title,
        score: audits[key].score,
        displayValue: audits[key].displayValue,
        explanation: audits[key].explanation,
        items: (audits[key].details?.items || []).slice(0, 10)
      };
    }
  });

  fs.writeFileSync(
    path.join(__dirname, '../lighthouse-deep-audit.json'),
    JSON.stringify(deepResults, null, 2)
  );

  console.log('✅ Deep Audit Details exported to lighthouse-deep-audit.json');
}

deepInspect();
