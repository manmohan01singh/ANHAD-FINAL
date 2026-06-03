const fs = require('fs');

const data = JSON.parse(fs.readFileSync('ytInitialData.json', 'utf8'));
const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
const videosTab = tabs.find(t => t.tabRenderer?.title === 'Videos');
const content = videosTab?.tabRenderer?.content;
const contents = content?.richGridRenderer?.contents || [];

const meta = contents[0]?.richItemRenderer?.content?.lockupViewModel?.metadata?.lockupMetadataViewModel;
console.log('meta keys:', Object.keys(meta));
console.log('meta.title:', JSON.stringify(meta.title, null, 2));
console.log('meta.metadata:', JSON.stringify(meta.metadata, null, 2));
