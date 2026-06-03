const fs = require('fs');

const data = JSON.parse(fs.readFileSync('ytInitialData.json', 'utf8'));
const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
const videosTab = tabs.find(t => t.tabRenderer?.title === 'Videos');
const content = videosTab?.tabRenderer?.content;
const contents = content?.richGridRenderer?.contents || [];

const firstItem = contents[0]?.richItemRenderer?.content?.lockupViewModel;
console.log('lockupMetadataViewModel:', JSON.stringify(firstItem.metadata?.lockupMetadataViewModel, null, 2));
console.log('thumbnailViewModelOverlay:', JSON.stringify(firstItem.contentImage?.thumbnailViewModel?.overlays, null, 2));
