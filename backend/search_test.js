const axios = require('axios');

async function searchChannelsViaScrap(query) {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAg%253D%253D`;
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
    if (!jsonMatch) throw new Error('No initial data in search');
    
    const data = JSON.parse(jsonMatch[1]);
    const items = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
    
    const results = [];
    for (const item of items) {
        const channel = item.channelRenderer;
        if (channel) {
            const channelId = channel.channelId;
            const channelName = channel.title?.simpleText || channel.title?.runs?.[0]?.text || '';
            const thumbnail = channel.thumbnail?.thumbnails?.[0]?.url;
            const subsText = channel.subscriberCountText?.simpleText || channel.subscriberCountText?.runs?.[0]?.text || '';
            
            const baseUrl = channel.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl || '';
            let channelHandle = null;
            if (baseUrl.includes('/@')) {
                channelHandle = '@' + baseUrl.split('/@')[1];
            }
            
            results.push({
                channelId,
                channelName,
                channelHandle,
                thumbnail: thumbnail ? (thumbnail.startsWith('//') ? 'https:' + thumbnail : thumbnail) : null,
                subscriberCount: subsText.replace(' subscribers', '').trim()
            });
        }
    }
    return results;
}

searchChannelsViaScrap('amritvela trust')
    .then(res => console.log('SUCCESS:', res))
    .catch(err => console.error('ERROR:', err.message));
