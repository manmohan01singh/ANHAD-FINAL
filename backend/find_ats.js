const fs = require('fs');
const html = fs.readFileSync('channelHome.html', 'utf8');

const matches = [];
let idx = 0;
while ((idx = html.indexOf('@', idx)) !== -1) {
    matches.push(html.substring(idx - 20, idx + 40).replace(/\n/g, ' '));
    idx += 1;
    if (matches.length > 20) break;
}
console.log('Occurrences of @:', matches);
