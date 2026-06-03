const axios = require('axios');

async function searchChannelsViaScrap(query) {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAg%253D%253D`;
    try {
        const resp = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html'
            },
            timeout: 10000
        });
        const html = resp.data;
        const jsonMatch = html.match(/var ytInitialData = ({.*?});/);
        if (!jsonMatch) return [];
        const data = JSON.parse(jsonMatch[1]);
        const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
        
        const results = [];
        for (const item of contents) {
            const ch = item.channelRenderer;
            if (ch && ch.channelId) {
                results.push({
                    channelId: ch.channelId,
                    channelName: ch.title?.simpleText || '',
                    channelHandle: ch.subscriberCountText?.simpleText || '',
                    thumbnail: 'https:' + ch.thumbnail?.thumbnails?.[0]?.url
                });
            }
        }
        return results;
    } catch(e) {
        console.error(e);
        return [];
    }
}

searchChannelsViaScrap("Bhai Ranjit Singh Dhadrianwale").then(res => {
    console.log(res);
});
