/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DIRECT FILE DOM AUDIT ANALYZER v2.0
 * 
 * Direct AST/Regex scanner that inspects every JS and HTML file in frontend/
 * to produce the mandatory pre-implementation DOM Audit Report.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.js') || file.endsWith('.html')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function runDomAudit() {
  const frontendDir = path.join(__dirname, '../frontend');
  const allFiles = getAllFiles(frontendDir);

  const methodCounts = {
    innerHTML: 0,
    outerHTML: 0,
    insertAdjacentHTML: 0,
    DOMParser: 0,
    createElement: 0,
    cloneNode: 0,
    appendChild: 0,
    replaceChild: 0,
    replaceChildren: 0,
    removeChild: 0,
    remove: 0
  };

  const fileStats = {};
  const detailedFindings = [];

  const patterns = [
    { name: 'innerHTML', regex: /\.innerHTML\s*=/g },
    { name: 'outerHTML', regex: /\.outerHTML\s*=/g },
    { name: 'insertAdjacentHTML', regex: /\.insertAdjacentHTML\s*\(/g },
    { name: 'DOMParser', regex: /DOMParser\s*\(/g },
    { name: 'createElement', regex: /document\.createElement\s*\(/g },
    { name: 'cloneNode', regex: /\.cloneNode\s*\(/g },
    { name: 'appendChild', regex: /\.appendChild\s*\(/g },
    { name: 'replaceChild', regex: /\.replaceChild\s*\(/g },
    { name: 'replaceChildren', regex: /\.replaceChildren\s*\(/g },
    { name: 'removeChild', regex: /\.removeChild\s*\(/g },
    { name: 'remove', regex: /\.remove\s*\(\s*\)/g }
  ];

  allFiles.forEach(filePath => {
    const relativePath = filePath.replace(/.*\\frontend\\/, 'frontend/').replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((lineText, index) => {
      const lineNum = index + 1;

      patterns.forEach(p => {
        if (lineText.match(p.regex)) {
          methodCounts[p.name]++;

          if (!fileStats[relativePath]) {
            fileStats[relativePath] = { total: 0, innerHTML: 0, createElement: 0, destructive: 0 };
          }
          fileStats[relativePath].total++;
          if (p.name === 'innerHTML') fileStats[relativePath].innerHTML++;
          if (p.name === 'createElement') fileStats[relativePath].createElement++;

          const isDestructive = ['innerHTML', 'outerHTML', 'replaceChildren', 'removeChild', 'remove'].includes(p.name);
          if (isDestructive) fileStats[relativePath].destructive++;

          const isNavTarget = relativePath.includes('smooth-navigation') || relativePath.includes('index.html') || relativePath.includes('shared-nav') || relativePath.includes('anhad-nav');

          detailedFindings.push({
            file: relativePath,
            line: lineNum,
            method: p.name,
            snippet: lineText.trim().substring(0, 110),
            isDestructive,
            isNavTarget
          });
        }
      });
    });
  });

  console.log('\n===============================================================');
  console.log('         DOM MANIPULATION DIRECT AUDIT RESULTS                 ');
  console.log('===============================================================');
  console.log('Total DOM Manipulation Sites Found:', detailedFindings.length);
  
  console.log('\nMethod Frequency Breakdown:');
  console.table(methodCounts);

  const topFiles = Object.keys(fileStats)
    .map(f => ({ file: f, ...fileStats[f] }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);

  console.log('\nTop 15 Files with Highest DOM Manipulation Intensity:');
  console.table(topFiles);

  // Filter high-impact navigation targets
  const navImpactItems = detailedFindings.filter(d => d.isNavTarget && d.isDestructive);
  console.log(`\nHigh-Impact Navigation Target Sites Found: ${navImpactItems.length}`);

  fs.writeFileSync(
    path.join(__dirname, '../dom_audit_detailed.json'),
    JSON.stringify({ methodCounts, fileStats, navImpactItems, detailedFindings: detailedFindings.slice(0, 100) }, null, 2)
  );

  console.log('\n✅ Detailed DOM Audit saved to dom_audit_detailed.json');
}

runDomAudit();
