const axios = require('axios');
const fs = require('fs');

async function debugScrape() {
    const url = 'https://www.youtube.com/@SGPCSriAmritsar/videos';
    const resp = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html'
        },
        timeout: 15000
    });
    const html = resp.data;
    const jsonMatch = html.match(/var ytInitialData = ({.*?});/);
    if (!jsonMatch) {
        console.log('No ytInitialData found!');
        return;
    }
    
    const json = JSON.parse(jsonMatch[1]);
    fs.writeFileSync('ytInitialData.json', JSON.stringify(json, null, 2));
    console.log('Saved ytInitialData.json');
}

debugScrape();
