const fs = require('fs');
const path = require('path');

const files = [
    'frontend/nitnem/category/sggs.html',
    'frontend/nitnem/category/dasam.html',
    'frontend/nitnem/category/nitnem.html'
];

files.forEach(relPath => {
    const filePath = path.join(__dirname, relPath);
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping: ${filePath} (not found)`);
        return;
    }
    let html = fs.readFileSync(filePath, 'utf8');

    // Replace ../../../guruimages/ with ../../guruimages/
    const originalCount = (html.match(/\.\.\/\.\.\/\.\.\/guruimages\//g) || []).length;
    if (originalCount > 0) {
        html = html.replace(/\.\.\/\.\.\/\.\.\/guruimages\//g, '../../guruimages/');
        fs.writeFileSync(filePath, html, 'utf8');
        console.log(`Updated ${relPath}: Replaced ${originalCount} instances of guruimages path.`);
    } else {
        console.log(`No instances to replace in ${relPath}`);
    }
});
