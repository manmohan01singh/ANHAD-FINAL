const fs = require('fs');

const data = JSON.parse(fs.readFileSync('ytInitialData.json', 'utf8'));
const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
const videosTab = tabs.find(t => t.tabRenderer?.title === 'Videos');
const content = videosTab?.tabRenderer?.content;
const contents = content?.richGridRenderer?.contents || [];

const parsed = [];
for (const item of contents) {
    const lockup = item.richItemRenderer?.content?.lockupViewModel;
    if (lockup) {
        // Let's dump the top level keys of lockup
        const videoId = lockup.contentId;
        const contentType = lockup.contentType;
        
        // Let's find where the title is
        // We can inspect metadata or contentImage or accessibility label
        const label = lockup.rendererContext?.accessibilityContext?.label || '';
        
        // Let's see if we can find metadataViewModel
        const meta = lockup.metadata?.metadataViewModel;
        const title = meta?.title?.content || '';
        
        // Let's look for duration
        const duration = lockup.contentImage?.lockupThumbnailViewModel?.overlay?.thumbnailOverlayTimeStatusRenderer?.text?.runs?.[0]?.text || '';
        
        // Let's print out what we found
        parsed.push({
            videoId,
            contentType,
            title,
            duration,
            label,
            metaKeys: lockup.metadata ? Object.keys(lockup.metadata) : null,
            imageKeys: lockup.contentImage ? Object.keys(lockup.contentImage) : null
        });
    }
}

console.log('PARSED:', JSON.stringify(parsed.slice(0, 3), null, 2));
