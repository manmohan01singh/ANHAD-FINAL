const fs = require('fs');

const data = JSON.parse(fs.readFileSync('ytInitialData.json', 'utf8'));
const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
const videosTab = tabs.find(t => t.tabRenderer?.title === 'Videos');
const content = videosTab?.tabRenderer?.content;
const contents = content?.richGridRenderer?.contents || [];

const lockup = contents[0]?.richItemRenderer?.content?.lockupViewModel;
console.log('contentImage keys:', Object.keys(lockup.contentImage));
console.log('thumbnailViewModel keys:', Object.keys(lockup.contentImage.thumbnailViewModel));
console.log('overlays:', JSON.stringify(lockup.contentImage.thumbnailViewModel.overlays, null, 2));
