const fs = require('fs');
const path = require('path');

const files = ['sggs.html', 'dasam.html', 'sarbloh.html', 'nitnem.html'];
const categoryDir = path.join(__dirname, 'frontend', 'nitnem', 'category');

files.forEach(file => {
    const filePath = path.join(categoryDir, file);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }
    const html = fs.readFileSync(filePath, 'utf8');
    console.log(`Checking links/resources in ${file}:`);

    // Find stylesheet links
    const linkRegex = /<link\s+[^>]*href="([^"]+)"[^>]*>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
        const href = match[1];
        if (href.startsWith('http') || href.startsWith('//')) {
            console.log(`  - Remote: ${href}`);
            continue;
        }

        // Resolve path relative to category html directory
        const resolvedPath = path.resolve(categoryDir, href.split('?')[0]);
        const exists = fs.existsSync(resolvedPath);
        console.log(`  - Local: ${href} -> Resolved: ${resolvedPath} [${exists ? 'OK' : 'MISSING'}]`);
    }

    // Find Script src links
    const scriptRegex = /<script\s+[^>]*src="([^"]+)"[^>]*>/gi;
    while ((match = scriptRegex.exec(html)) !== null) {
        const src = match[1];
        if (src.startsWith('http') || src.startsWith('//')) {
            continue;
        }
        const resolvedPath = path.resolve(categoryDir, src.split('?')[0]);
        const exists = fs.existsSync(resolvedPath);
        console.log(`  - JS: ${src} -> Resolved: ${resolvedPath} [${exists ? 'OK' : 'MISSING'}]`);
    }
});
