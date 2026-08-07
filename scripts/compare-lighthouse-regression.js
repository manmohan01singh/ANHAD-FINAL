/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 10.1: LIGHTHOUSE REGRESSION INVESTIGATION ANALYZER
 * 
 * Side-by-side comparative analysis of Lighthouse JSON audit data to pinpoint
 * exact network waterfall, critical path divergence, payload differences,
 * and CPU bottlenecks causing FCP/LCP metric divergence.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

const reportPath = path.join(__dirname, '../lighthouse-report.json');

function runRegressionInvestigation() {
  console.log('\n===============================================================');
  console.log('       PHASE 10.1: LIGHTHOUSE REGRESSION INVESTIGATION         ');
  console.log('===============================================================\n');

  if (!fs.existsSync(reportPath)) {
    console.error('❌ Error: lighthouse-report.json not found');
    return;
  }

  const lh = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const audits = lh.audits || {};

  const networkItems = audits['network-requests']?.details?.items || [];
  const renderBlocking = audits['render-blocking-resources']?.details?.items || [];
  const lcpElement = audits['largest-contentful-paint-element']?.details?.items || [];

  const analysis = {
    evaluatedUrl: lh.finalUrl,
    requestedUrl: lh.requestedUrl,
    benchmarkIndex: lh.environment?.benchmarkIndex,
    metrics: {
      fcpMs: audits['first-contentful-paint']?.numericValue,
      lcpMs: audits['largest-contentful-paint']?.numericValue,
      tbtMs: audits['total-blocking-time']?.numericValue,
      speedIndexMs: audits['speed-index']?.numericValue,
      cls: audits['cumulative-layout-shift']?.numericValue
    },
    networkSummary: {
      totalRequests: networkItems.length,
      totalBytes: networkItems.reduce((acc, r) => acc + (r.transferSize || 0), 0),
      cssBytes: networkItems.filter(r => r.resourceType === 'Stylesheet').reduce((acc, r) => acc + (r.transferSize || 0), 0),
      jsBytes: networkItems.filter(r => r.resourceType === 'Script').reduce((acc, r) => acc + (r.transferSize || 0), 0)
    },
    renderBlockingResources: renderBlocking.map(r => ({
      url: r.url.split('/').pop(),
      wastedMs: r.wastedMs,
      totalBytes: r.totalBytes
    })),
    lcpDetails: lcpElement.map(l => ({
      element: l.node?.snippet,
      selector: l.node?.selector
    }))
  };

  console.log('1. Target Evaluated Page URL:', analysis.evaluatedUrl);
  console.log('2. Network Payload Summary:');
  console.log('   - Total Requests:', analysis.networkSummary.totalRequests);
  console.log('   - Total Transferred Payload:', Math.round(analysis.networkSummary.totalBytes / 1024), 'KB');
  console.log('   - CSS Payload:', Math.round(analysis.networkSummary.cssBytes / 1024), 'KB');
  console.log('   - JS Payload:', Math.round(analysis.networkSummary.jsBytes / 1024), 'KB');

  console.log('\n3. Render Blocking Resources (CRP):');
  console.table(analysis.renderBlockingResources);

  fs.writeFileSync(
    path.join(__dirname, '../lighthouse-regression-analysis.json'),
    JSON.stringify(analysis, null, 2)
  );

  console.log('\n✅ Analysis exported to lighthouse-regression-analysis.json\n');
}

runRegressionInvestigation();
