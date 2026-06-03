const axios = require('axios');
const fs = require('fs');

async function debugHome() {
    const url = 'https://www.youtube.com/channel/UC6U4oR4O2Q-4YV3ZkX6o66Q/videos';
    const resp = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html'
        },
        timeout: 10000
    });
    fs.writeFileSync('channelHome.html', resp.data);
    console.log('Saved channelHome.html');
}

debugHome();
