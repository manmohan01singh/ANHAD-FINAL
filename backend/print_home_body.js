const fs = require('fs');
const html = fs.readFileSync('channelHome.html', 'utf8');

// Find body text
const bodyM = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
if (bodyM) {
    const text = bodyM[1].replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log('Body Text length:', text.length);
    console.log('Body Text (first 1000):', text.substring(0, 1000));
} else {
    console.log('No body found!');
}
