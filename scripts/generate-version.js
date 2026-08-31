/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Version Generator Script for ANHAD PWA
 * Generates version.json with timestamp for deployment tracking
 * Run this before each deployment to trigger automatic updates
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

// Get git info if available
function getGitInfo() {
  try {
    const { execSync } = require('child_process');
    const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    return { commitHash, branch };
  } catch (e) {
    return { commitHash: 'unknown', branch: 'unknown' };
  }
}

// Generate version info
const versionInfo = {
  version: '1.1.16',
  buildTime: new Date().toISOString(),
  timestamp: Date.now(),
  ...getGitInfo()
};

// Write to frontend directory
const outputPath = path.join(__dirname, '..', 'frontend', 'version.json');

fs.writeFileSync(outputPath, JSON.stringify(versionInfo, null, 2));

console.log('✅ Version file generated:', outputPath);
console.log('📦 Version:', versionInfo.version);
console.log('🕐 Build Time:', versionInfo.buildTime);
console.log('🔀 Branch:', versionInfo.branch);
console.log('🔢 Commit:', versionInfo.commitHash);
