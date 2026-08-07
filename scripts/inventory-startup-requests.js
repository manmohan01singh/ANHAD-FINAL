/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 11: STEP 1 - STARTUP REQUEST INVENTORY & CRP SCANNER
 * 
 * Extracts complete inventory of startup requests from lighthouse-report.json:
 * - URL, File, Size, Transfer Size, Initiator, Priority, Blocking/Non-blocking
 * - Ranks resources by startup impact.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

const reportPath = path.join(__dirname, '../lighthouse-report.json');

function buildInventory() {
  console.log('\n===============================================================');
  console.log('       PHASE 11: STARTUP REQUEST INVENTORY & CRP AUDIT          ');
  console.log('===============================================================\n');

  if (!fs.existsSync(reportPath)) {
    console.error('❌ Error: lighthouse-report.json not found');
    return;
  }

  const lh = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const audits = lh.audits || {};

  const networkItems = audits['network-requests']?.details?.items || [];

  const inventory = networkItems.map((r, i) => {
    const filename = r.url.split('/').pop().split('?')[0] || r.url;
    return {
      rank: i + 1,
      filename: filename,
      fullUrl: r.url,
      resourceType: r.resourceType,
      transferSizeKB: Math.round((r.transferSize || 0) / 1024 * 10) / 10,
      resourceSizeKB: Math.round((r.resourceSize || 0) / 1024 * 10) / 10,
      priority: r.priority,
      networkRequestTimeMs: Math.round(r.networkRequestTime),
      networkEndTimeMs: Math.round(r.networkEndTime),
      durationMs: Math.round(r.networkEndTime - r.networkRequestTime),
      isBlocking: r.priority === 'High' || r.priority === 'VeryHigh' || r.resourceType === 'Document' || r.resourceType === 'Stylesheet'
    };
  });

  const summary = {
    totalRequests: inventory.length,
    totalTransferSizeKB: Math.round(inventory.reduce((a, b) => a + b.transferSizeKB, 0)),
    blockingRequestsCount: inventory.filter(i => i.isBlocking).length,
    largeAssets: inventory.filter(i => i.transferSizeKB > 20).slice(0, 15)
  };

  console.log('1. Total Startup Network Requests:', summary.totalRequests);
  console.log('2. Total Transferred Payload:', summary.totalTransferSizeKB, 'KB');
  console.log('3. Blocking Requests Count:', summary.blockingRequestsCount);
  console.log('\nTop Payload Assets (>20 KB):');
  console.table(summary.largeAssets);

  fs.writeFileSync(
    path.join(__dirname, '../startup-inventory-data.json'),
    JSON.stringify({ summary, inventory }, null, 2)
  );

  console.log('\n✅ Inventory saved to startup-inventory-data.json\n');
}

buildInventory();
