const fs = require('fs');
const html = fs.readFileSync('channelHome.html', 'utf8');

console.log('Includes @SGPCSriAmritsar:', html.includes('@SGPCSriAmritsar'));
console.log('Includes @sgpcsriamritsar:', html.toLowerCase().includes('sgpcsriamritsar'));
console.log('Includes sgpc:', html.toLowerCase().includes('sgpc'));

const match = html.match(/"canonicalChannelUrl":"(https:\/\/www\.youtube\.com\/@[^"]+)"/i);
console.log('canonicalChannelUrl match:', match ? match[1] : 'NONE');

const match2 = html.match(/"browseEndpoint":{\s*"browseId":"UC6U4oR4O2Q-4YV3ZkX6o66Q",\s*"canonicalBaseUrl":"\/([^"]+)"/);
console.log('browseEndpoint match:', match2 ? match2[1] : 'NONE');
