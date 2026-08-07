const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, '../frontend');

function getAllJsFiles(dirPath, files = []) {
  fs.readdirSync(dirPath).forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      files = getAllJsFiles(fullPath, files);
    } else if (file.endsWith('.js') || file.endsWith('.html')) {
      files.push(fullPath);
    }
  });
  return files;
}

const files = getAllJsFiles(frontendDir);
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('location.replace') || content.includes('location.href') || content.includes('location.assign')) {
    const rel = f.replace(/.*\\frontend\\/, 'frontend/').replace(/\\/g, '/');
    const matches = content.split('\n').map((l, i) => ({ line: i + 1, text: l.trim() })).filter(m => m.text.includes('location.'));
    console.log(`\nFile: ${rel}`);
    matches.forEach(m => console.log(`  Line ${m.line}: ${m.text.substring(0, 100)}`));
  }
});
