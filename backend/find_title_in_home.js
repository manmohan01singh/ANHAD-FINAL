const fs = require('fs');
const html = fs.readFileSync('channelHome.html', 'utf8');

// Search for any title tag
const titleM = html.match(/<title>([^<]+)<\/title>/i) || html.match(/<title\s+[^>]*>([^<]+)<\/title>/i);
console.log('Title match:', titleM ? titleM[1] : 'NONE');

// Search for title keys in WIZ_global_data or ytInitialData
console.log('Includes ytInitialData:', html.includes('ytInitialData'));

// Search for canonical or vanityUrl in lowercase
console.log('Includes canonical:', html.toLowerCase().includes('canonical'));
console.log('Includes vanity:', html.toLowerCase().includes('vanity'));
console.log('Includes @:', html.includes('@'));

// Let's print occurrences of "canonical"
const canonicals = [];
let idx = 0;
while ((idx = html.indexOf('canonical', idx)) !== -1) {
    canonicals.push(html.substring(idx - 50, idx + 100));
    idx += 9;
    if (canonicals.length > 5) break;
}
console.log('Canonicals around:', canonicals);
