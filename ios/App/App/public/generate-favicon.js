const fs = require('fs');
const path = require('path');
const pngToIco = require('png-to-ico').default;

const SOURCE_PNG = path.join(__dirname, 'assets', 'app-logo.png');
const OUTPUT_ICO = path.join(__dirname, 'favicon.ico');

async function generateFavicon() {
  console.log('🔧 Generating favicon.ico from PNG...');
  
  try {
    const buffer = await pngToIco(SOURCE_PNG);
    fs.writeFileSync(OUTPUT_ICO, buffer);
    console.log('✅ favicon.ico generated successfully!');
  } catch (error) {
    console.error('❌ Error generating favicon.ico:', error);
    process.exit(1);
  }
}

generateFavicon();
