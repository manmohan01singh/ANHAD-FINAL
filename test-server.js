const http = require('http');

console.log('Testing local server on port 3000...');

const checkUrl = (url) => {
    return new Promise((resolve) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                console.log(`URL: ${url} -> Status: ${res.statusCode}, Length: ${data.length}`);
                if (res.statusCode === 200 && data.includes('<title>')) {
                    const titleMatch = data.match(/<title>([^<]*)<\/title>/i);
                    console.log(`  Title: ${titleMatch ? titleMatch[1].trim() : 'Unknown'}`);
                }
                resolve({ status: res.statusCode, length: data.length });
            });
        }).on('error', (err) => {
            console.log(`URL: ${url} -> Error: ${err.message}`);
            resolve({ error: err.message });
        });
    });
};

async function run() {
    await checkUrl('http://localhost:3000/nitnem/category/nitnem.html');
    await checkUrl('http://localhost:3000/css/theme-variables.css');
    await checkUrl('http://localhost:3000/nitnem/css/category.css');
    await checkUrl('http://localhost:3000/guruimages/gurugobindsinghji.jpeg');
    await checkUrl('http://localhost:3000/assets/sggs-transparent.webp');
}

run();
