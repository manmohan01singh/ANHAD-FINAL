const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../frontend/css/trendora-premium.css');
const content = fs.readFileSync(cssPath, 'utf8');

const regex = /\.greeting[^{]*\{[^}]*\}/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(match[0]);
}
