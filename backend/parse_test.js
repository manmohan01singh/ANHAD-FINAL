const fs = require('fs');

const data = JSON.parse(fs.readFileSync('ytInitialData.json', 'utf8'));

const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
console.log('TABS:', tabs.map((t, idx) => ({ idx, title: t.tabRenderer?.title, selected: t.tabRenderer?.selected })));

// Let's find the Videos tab
const videosTab = tabs.find(t => t.tabRenderer?.title === 'Videos' || t.tabRenderer?.selected === true);
console.log('Videos Tab Found:', !!videosTab);

const content = videosTab?.tabRenderer?.content;
console.log('Content Keys:', content ? Object.keys(content) : null);

if (content?.richGridRenderer) {
    const contents = content.richGridRenderer.contents || [];
    console.log('richGridRenderer contents length:', contents.length);
    console.log('First content item keys:', contents[0] ? Object.keys(contents[0]) : null);
    
    // Check richItemRenderer content
    const firstItem = contents[0]?.richItemRenderer?.content;
    console.log('First richItem content keys:', firstItem ? Object.keys(firstItem) : null);
    if (firstItem?.videoRenderer) {
        console.log('Found videoRenderer!');
    }
}
