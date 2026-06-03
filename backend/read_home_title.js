const fs = require('fs');
const html = fs.readFileSync('channelHome.html', 'utf8');

const title = html.match(/<title>([^<]+)<\/title>/);
console.log('TITLE:', title ? title[1] : 'NONE');
console.log('HTML length:', html.length);
console.log('HTML first 800 chars:', html.substring(0, 800));
