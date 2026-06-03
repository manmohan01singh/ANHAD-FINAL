const fs = require('fs');
const html = fs.readFileSync('channelHome.html', 'utf8');

const matches = html.match(/<link rel="canonical" href="([^"]+)"/);
console.log('Canonical Link:', matches ? matches[1] : 'NONE');

const ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/);
console.log('OG URL:', ogUrl ? ogUrl[1] : 'NONE');

const idM = html.match(/"channelId":"([^"]+)"/);
console.log('ChannelID:', idM ? idM[1] : 'NONE');

const vanity = html.match(/"vanityUrl":"([^"]+)"/);
console.log('Vanity:', vanity ? vanity[1] : 'NONE');
