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

    const imgM = html.match(/<meta property="og:image" content="(https:\/\/yt3\.[^"]+)"/) ||
                 html.match(/"thumbnail":\{"thumbnails":\[\{"url":"(https:\/\/yt3\.[^"?]+)/);
    const thumbnail = imgM ? imgM[1] : null;

    const subsM = html.match(/"subscriberCountText":\{"simpleText":"([^"]+)"\}/) ||
                  html.match(/"([0-9.,]+[KMB]?) subscribers"/);
    const subscriberCount = subsM ? subsM[1] : null;

    return { channelId, channelHandle, channelName, thumbnail, subscriberCount };
}

async function scrapeChannelVideos(channelId, channelHandle) {
    if (!channelHandle) {
        try {
            console.log('Resolving handle for ID:', channelId);
            const info = await scrapeYouTubeChannelInfo(channelId);
            if (info && info.channelHandle) {
                channelHandle = info.channelHandle;
                console.log('Resolved handle to:', channelHandle);
            }
        } catch (e) {
            console.warn('Failed to resolve handle:', e.message);
        }
    }

    const url = channelHandle 
        ? `https://www.youtube.com/${channelHandle}/videos` 
        : `https://www.youtube.com/channel/${channelId}/videos`;

    try {
        console.log('Fetching videos URL:', url);
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
        if (!jsonMatch) return [];

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

        console.log('Items length:', items.length);

        const videos = [];
        for (const item of items) {
            const lockup = item.richItemRenderer?.content?.lockupViewModel;
            const video = item.richItemRenderer?.content?.videoRenderer || item.videoRenderer;
            
            if (lockup && lockup.contentId) {
                const videoId = lockup.contentId;
                const meta = lockup.metadata?.lockupMetadataViewModel;
                const title = meta?.title?.content || lockup.rendererContext?.accessibilityContext?.label?.split(' | ')[0] || 'Video';
                
                let duration = '';
                const overlays = lockup.contentImage?.thumbnailViewModel?.overlays || [];
                for (const ov of overlays) {
                    const status = ov.thumbnailOverlayTimeStatusRenderer;
                    if (status) {
                        duration = status.text?.runs?.[0]?.text || status.text?.simpleText || '';
                    }
                }
                
                let views = '';
                let publishedTime = '';
                const rows = meta?.metadata?.contentMetadataViewModel?.metadataRows || [];
                if (rows.length > 0) {
                    const parts = rows[0].metadataParts || [];
                    if (parts.length > 0) views = parts[0].text?.content || '';
                    if (parts.length > 1) publishedTime = parts[1].text?.content || '';
                }
                
                const thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                videos.push({ videoId, title, thumbnail, duration, views, publishedTime });
            } else if (video && video.videoId) {
                const videoId = video.videoId;
                const title = video.title?.runs?.[0]?.text || video.title?.simpleText || 'Video';
                const duration = video.lengthText?.simpleText || '';
                const views = video.viewCountText?.simpleText || video.viewCountText?.runs?.[0]?.text || '';
                const publishedTime = video.publishedTimeText?.simpleText || '';
                const thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                videos.push({ videoId, title, thumbnail, duration, views, publishedTime });
            }
        }
        return videos;
    } catch(e) {
        console.warn(`Failed for ${channelId}:`, e.message);
        return [];
    }
}

scrapeChannelVideos('UC6U4oR4O2Q-4YV3ZkX6o66Q', null)
    .then(res => console.log('Parsed videos count:', res.length, 'First video:', res[0]))
    .catch(err => console.error(err));
