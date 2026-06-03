const fs = require('fs');

const html = fs.readFileSync('channelHome.html', 'utf8');
const jsonMatch = html.match(/var ytInitialData = ({.*?});/);
if (!jsonMatch) {
    console.log('No ytInitialData!');
    return;
}

const data = JSON.parse(jsonMatch[1]);
const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
console.log('TABS:', tabs.map((t, idx) => ({ idx, title: t.tabRenderer?.title, selected: t.tabRenderer?.selected })));

const videosTab = tabs.find(t => t.tabRenderer?.title === 'Videos' || t.tabRenderer?.selected === true);
console.log('Videos tab found:', !!videosTab);
if (videosTab) {
    const content = videosTab.tabRenderer?.content;
    console.log('content keys:', content ? Object.keys(content) : null);
    if (content?.richGridRenderer) {
        console.log('richGridRenderer contents length:', content.richGridRenderer.contents?.length);
    }
}
