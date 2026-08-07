/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LIGHTHOUSE SINGLE SOURCE OF TRUTH AUDIT ANALYZER
 * 
 * Parses ./lighthouse-report.json to extract:
 * - Overall Performance, Accessibility, Best Practices, SEO scores
 * - Core Web Vitals (FCP, LCP, TBT, CLS, Speed Index)
 * - Every failing audit & opportunity with exact URLs, bytes, ms savings
 * - Render-blocking resources
 * - Unused CSS / Unused JS
 * - Image delivery & sizing
 * - Long tasks & main-thread execution
 * - Non-composited animations
 * - BFCache failures
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

const reportPath = path.join(__dirname, '../lighthouse-report.json');

function analyzeLighthouse() {
  console.log('\n===============================================================');
  console.log('       LIGHTHOUSE SINGLE SOURCE OF TRUTH ANALYSIS               ');
  console.log('===============================================================\n');

  if (!fs.existsSync(reportPath)) {
    console.error('❌ Error: lighthouse-report.json not found');
    return;
  }

  const raw = fs.readFileSync(reportPath, 'utf8');
  const lh = JSON.parse(raw);

  const categories = lh.categories || {};
  const audits = lh.audits || {};

  const summary = {
    fetchTime: lh.fetchTime,
    finalUrl: lh.finalUrl,
    scores: {
      performance: Math.round((categories.performance?.score || 0) * 100),
      accessibility: Math.round((categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
      seo: Math.round((categories.seo?.score || 0) * 100)
    },
    metrics: {
      firstContentfulPaint: audits['first-contentful-paint']?.displayValue || audits['first-contentful-paint']?.numericValue + ' ms',
      largestContentfulPaint: audits['largest-contentful-paint']?.displayValue || audits['largest-contentful-paint']?.numericValue + ' ms',
      totalBlockingTime: audits['total-blocking-time']?.displayValue || audits['total-blocking-time']?.numericValue + ' ms',
      cumulativeLayoutShift: audits['cumulative-layout-shift']?.displayValue || audits['cumulative-layout-shift']?.numericValue,
      speedIndex: audits['speed-index']?.displayValue || audits['speed-index']?.numericValue + ' ms'
    },
    opportunities: [],
    diagnostics: []
  };

  // Extract Opportunities & Diagnostics
  Object.keys(audits).forEach(key => {
    const a = audits[key];
    if (a.score !== null && a.score < 1.0) {
      const item = {
        id: a.id,
        title: a.title,
        description: a.description,
        score: a.score,
        displayValue: a.displayValue || '',
        detailsType: a.details?.type,
        items: []
      };

      if (a.details && a.details.items) {
        item.items = a.details.items.slice(0, 10).map(it => {
          return {
            url: it.url ? it.url.split('/').pop() : undefined,
            fullUrl: it.url,
            totalBytes: it.totalBytes || it.wastedBytes,
            wastedBytes: it.wastedBytes,
            wastedMs: it.wastedMs,
            label: it.label || it.selector || it.source
          };
        });
      }

      if (a.details?.type === 'opportunity' || a.numericValue > 0) {
        summary.opportunities.push(item);
      } else {
        summary.diagnostics.push(item);
      }
    }
  });

  console.log('📊 LIGHTHOUSE SCORES:');
  console.log('• Performance Score:', summary.scores.performance, '/ 100');
  console.log('• Accessibility Score:', summary.scores.accessibility, '/ 100');
  console.log('• Best Practices Score:', summary.scores.bestPractices, '/ 100');
  console.log('• SEO Score:', summary.scores.seo, '/ 100');

  console.log('\n⏱️ CORE WEB VITALS (Directly Measured by Lighthouse):');
  console.log('• First Contentful Paint (FCP):', summary.metrics.firstContentfulPaint);
  console.log('• Largest Contentful Paint (LCP):', summary.metrics.largestContentfulPaint);
  console.log('• Total Blocking Time (TBT):', summary.metrics.totalBlockingTime);
  console.log('• Cumulative Layout Shift (CLS):', summary.metrics.cumulativeLayoutShift);
  console.log('• Speed Index:', summary.metrics.speedIndex);

  console.log('\n⚠️ TOP LIGHTHOUSE OPPORTUNITIES & ISSUES DETECTED:');
  summary.opportunities.forEach((op, index) => {
    console.log(`\n${index + 1}. [${op.id}] ${op.title} (Score: ${op.score})`);
    if (op.displayValue) console.log(`   Impact: ${op.displayValue}`);
    if (op.items && op.items.length > 0) {
      op.items.forEach(it => {
        if (it.url || it.label) console.log(`   - File/Selector: ${it.url || it.label} ${it.wastedBytes ? `(Wasted: ${Math.round(it.wastedBytes/1024)} KB)` : ''}`);
      });
    }
  });

  fs.writeFileSync(
    path.join(__dirname, '../lighthouse-parsed-summary.json'),
    JSON.stringify(summary, null, 2)
  );

  console.log('\n✅ Parsed summary exported to lighthouse-parsed-summary.json\n');
}

analyzeLighthouse();
