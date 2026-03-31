const fs = require('fs');
const path = require('path');

const files = [
    'frontend/lib/background-audio-loader.js',
    'frontend/js/audio-core.js',
    'frontend/GurbaniRadio/gurbani-radio.js',
    'frontend/GurbaniRadio/gurbani-radio-new.js'
];

const capacitorCheck = `// For Capacitor apps, always use production URL
                if (window.Capacitor) return 'https://anhad-final.onrender.com';
                
                `;

files.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        
        // Add Capacitor check after "try {" in URL resolution functions
        const patterns = [
            {
                search: /(\s+try\s*{\s*\n)(\s+const port = window\.location\.port;)/g,
                replace: `$1${capacitorCheck}$2`
            }
        ];
        
        patterns.forEach(({search, replace}) => {
            if (content.match(search)) {
                content = content.replace(search, replace);
                console.log(`✓ Fixed: ${file}`);
            }
        });
        
        fs.writeFileSync(file, content, 'utf8');
    } catch (e) {
        console.error(`✗ Error fixing ${file}:`, e.message);
    }
});

console.log('\n✓ All files processed');
