const axios = require('axios');

async function scrapeChannelVideos(channelId, channelHandle) {
    const url = channelHandle 
        ? `https://www.youtube.com/${channelHandle}/videos` 
        : `https://www.youtube.com/channel/${channelId}/videos`;
    console.log('Fetching:', url);
    try {
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
            console.log('ytInitialData not found!');
            return [];
        }

        const data = JSON.parse(jsonMatch[1]);
        const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
        const videosTab = tabs.find(t => t.tabRenderer?.title === 'Videos' || t.tabRenderer?.selected === true);
        const content = videosTab?.tabRenderer?.content;
        
        let items = [];
        if (content?.richGridRenderer) {
            items = content.richGridRenderer.contents || [];
        } else if (content?.sectionListRenderer) {
            items = content.sectionListRenderer.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.gridRenderer?.items || [];
        }

        console.log(`Found ${items.length} items in raw data.`);
        const videos = [];
        for (const item of items) {
            const lockup = item.richItemRenderer?.content?.lockupViewModel;
            const video = item.richItemRenderer?.content?.videoRenderer || item.videoRenderer;
            
            if (lockup && lockup.contentId) {
                const videoId = lockup.contentId;
                const meta = lockup.metadata?.lockupMetadataViewModel;
                const title = meta?.title?.content || lockup.rendererContext?.accessibilityContext?.label?.split(' | ')[0] || 'Video';
                videos.push({ videoId, title });
            } else if (video && video.videoId) {
                const videoId = video.videoId;
                const title = video.title?.runs?.[0]?.text || video.title?.simpleText || 'Video';
                videos.push({ videoId, title });
            }
        }
        console.log(`Successfully parsed ${videos.length} videos.`);
        return videos;
    } catch(e) {
        console.error('Error:', e.message);
        return [];
    }
}

scrapeChannelVideos('UC2AHnxSbmtaKrk74noBMv-Q', '@amritvelatv');
