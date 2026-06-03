const axios = require('axios');

async function scrapeYouTubeChannelInfo(input) {
    input = (input || '').trim();
    let url;
    if (input.startsWith('http')) {
        url = input.split('?')[0];
    } else if (input.startsWith('@')) {
        url = `https://www.youtube.com/${input}`;
    } else if (/^UC[0-9a-zA-Z_-]{22}$/.test(input)) {
        url = `https://www.youtube.com/channel/${input}`;
    } else {
        url = `https://www.youtube.com/@${input}`;
    }

    const resp = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml'
        },
        timeout: 10000
    });
    const html = resp.data;

    const nameM = html.match(/<meta property="og:title" content="([^"]+)"/);
    const channelName = nameM ? nameM[1].replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"') : null;

    const idM = html.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/);
    const channelId = idM ? idM[1] : null;

    const hM = html.match(/"vanityUrl":"(@[a-zA-Z0-9._-]+)"/) ||
                html.match(/"canonicalChannelUrl":"https:\/\/www\.youtube\.com\/(@[^"]+)"/);
    const channelHandle = hM ? hM[1] : null;

    return { channelId, channelHandle, channelName };
}

scrapeYouTubeChannelInfo('UC6U4oR4O2Q-4YV3ZkX6o66Q')
    .then(res => console.log('INFO:', res))
    .catch(err => console.error(err));
