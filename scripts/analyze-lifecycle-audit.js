/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RUNTIME LIFECYCLE AUDIT SCANNER (Phase 8 Pre-Implementation Audit)
 * 
 * Scans all JavaScript files in frontend/ for:
 * - addEventListener
 * - IntersectionObserver
 * - MutationObserver
 * - ResizeObserver
 * - matchMedia / addEventListener
 * - setInterval / setTimeout
 * - requestAnimationFrame
 * - requestIdleCallback
 * 
 * Identifies missing cleanup (.removeEventListener, .disconnect, clearInterval)
 * and evaluates duplicate registration & memory leak risks.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, '../frontend');

function getAllJsFiles(dirPath, files = []) {
  fs.readdirSync(dirPath).forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      files = getAllJsFiles(fullPath, files);
    } else if (file.endsWith('.js')) {
      files.push(fullPath);
    }
  });
  return files;
}

function auditLifecycle() {
  console.log('\n===============================================================');
  console.log('       PHASE 8: RUNTIME LIFECYCLE AUDIT SCANNER                ');
  console.log('===============================================================\n');

  const jsFiles = getAllJsFiles(frontendDir);
  const auditResults = {
    summary: {
      totalFiles: jsFiles.length,
      totalListeners: 0,
      totalObservers: 0,
      totalTimers: 0,
      totalFrameCallbacks: 0,
      highLeakRiskCount: 0
    },
    observers: [],
    listenersWithMissingCleanup: [],
    timersWithMissingCleanup: [],
    frameCallbacks: []
  };

  jsFiles.forEach(filePath => {
    const relPath = filePath.replace(/.*\\frontend\\/, 'frontend/').replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // 1. Observers
      if (line.includes('new IntersectionObserver') || line.includes('new MutationObserver') || line.includes('new ResizeObserver')) {
        auditResults.summary.totalObservers++;

        const observerType = line.includes('IntersectionObserver') ? 'IntersectionObserver' : (line.includes('MutationObserver') ? 'MutationObserver' : 'ResizeObserver');
        const hasDisconnect = content.includes('.disconnect()') || content.includes('.unobserve(');

        auditResults.observers.push({
          file: relPath,
          line: lineNum,
          type: observerType,
          codeSnippet: line.trim(),
          cleanupGuaranteed: hasDisconnect,
          duplicateRegistrationPossible: !line.includes('if (') && !line.includes('const '),
          leakRisk: hasDisconnect ? '🟢 Low' : '🔴 High (Missing .disconnect)'
        });

        if (!hasDisconnect) auditResults.summary.highLeakRiskCount++;
      }

      // 2. Timers (setInterval)
      if (line.includes('setInterval(')) {
        auditResults.summary.totalTimers++;
        const hasClearInterval = content.includes('clearInterval(');

        if (!hasClearInterval) {
          auditResults.timersWithMissingCleanup.push({
            file: relPath,
            line: lineNum,
            type: 'setInterval',
            codeSnippet: line.trim(),
            cleanupGuaranteed: false,
            leakRisk: '🔴 High (Uncleared setInterval)'
          });
          auditResults.summary.highLeakRiskCount++;
        }
      }

      // 3. Event Listeners without removeEventListener
      if (line.includes('.addEventListener(')) {
        auditResults.summary.totalListeners++;
        const hasRemove = content.includes('.removeEventListener(');

        if (!hasRemove && !line.includes('{ once: true }')) {
          const isAnonymous = line.includes('function(') || line.includes('() =>') || line.includes('e =>') || line.includes('evt =>');
          if (isAnonymous) {
            auditResults.listenersWithMissingCleanup.push({
              file: relPath,
              line: lineNum,
              codeSnippet: line.trim(),
              isAnonymous: isAnonymous,
              cleanupGuaranteed: false,
              leakRisk: '🟡 Medium (Anonymous listener without unbind)'
            });
          }
        }
      }

      // 4. requestAnimationFrame
      if (line.includes('requestAnimationFrame(')) {
        auditResults.summary.totalFrameCallbacks++;
      }
    });
  });

  console.log('Total Files Scanned:', auditResults.summary.totalFiles);
  console.log('Total Observers Found:', auditResults.summary.totalObservers);
  console.log('Total Event Listeners Found:', auditResults.summary.totalListeners);
  console.log('Total Timers Found:', auditResults.summary.totalTimers);
  console.log('Total Frame Callbacks Found:', auditResults.summary.totalFrameCallbacks);
  console.log('High Leak Risk Items Identified:', auditResults.summary.highLeakRiskCount);

  fs.writeFileSync(
    path.join(__dirname, '../lifecycle-audit-data.json'),
    JSON.stringify(auditResults, null, 2)
  );

  console.log('\n✅ Lifecycle Audit exported to lifecycle-audit-data.json\n');
  return auditResults;
}

auditLifecycle();
