const fs = require('fs');
const path = require('path');

const files = ['lighthouse-local-3001-after.json', 'lighthouse-ios-homepage-after.json'];
files.forEach(f => {
    const filePath = path.join('c:/Users/Manmohan Singh/OneDrive/Desktop/letsdoit/ANHAD-FINAL/artifacts', f);
    if (!fs.existsSync(filePath)) {
        console.log(`File ${f} does not exist`);
        return;
    }
    console.log(`\n========================================`);
    console.log(`FILE: ${f}`);
    console.log(`========================================`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const audit = data.audits['long-tasks'];
    if (audit && audit.details && audit.details.items) {
        console.log(`Long tasks count: ${audit.details.items.length}`);
        audit.details.items.slice(0, 10).forEach((item, idx) => {
            console.log(`Task ${idx + 1}:`);
            console.log(`  Duration: ${item.duration} ms`);
            console.log(`  Start Time: ${item.startTime} ms`);
            // check if there are sub-details or URLs
            if (item.url) console.log(`  URL: ${item.url}`);
        });
    } else {
        console.log('No long tasks found or different structure.');
    }
});
