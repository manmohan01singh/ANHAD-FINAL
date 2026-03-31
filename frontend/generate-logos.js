/**
 * Logo Generator Script
 * Generates all required logo sizes and formats from newlogo-removebg-preview.png
 * Run with: node generate-logos.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const INPUT_LOGO = path.join(__dirname, 'newlogo-removebg-preview.png');
const ASSETS_DIR = path.join(__dirname, 'assets');
const ANDROID_ASSETS_DIR = path.join(__dirname, '../android/app/src/main/assets/public/assets');

// Logo configurations
const LOGO_CONFIGS = [
  // Favicon sizes
  { name: 'favicon-16x16.png', size: 16, format: 'png' },
  { name: 'favicon-32x32.png', size: 32, format: 'png' },
  
  // Apple touch icon
  { name: 'apple-touch-icon.png', size: 180, format: 'png' },
  
  // App logos (various sizes)
  { name: 'app-logo.png', size: 512, format: 'png' },
  { name: 'app-logo.webp', size: 512, format: 'webp' },
  { name: 'app-logo-96.png', size: 96, format: 'png' },
  { name: 'app-logo-128.png', size: 128, format: 'png' },
  { name: 'app-logo-144.png', size: 144, format: 'png' },
  { name: 'app-logo-384.png', size: 384, format: 'png' },
  
  // PWA icons
  { name: 'pwa-icon-192.png', size: 192, format: 'png' },
  { name: 'pwa-icon-512.png', size: 512, format: 'png' },
  
  // Pure logo (transparent background)
  { name: 'pure-logo.png', size: 512, format: 'png' },
  { name: 'pure-logo.webp', size: 512, format: 'webp' },
];

async function generateLogos() {
  console.log('🎨 Starting logo generation...\n');
  
  // Check if input file exists
  if (!fs.existsSync(INPUT_LOGO)) {
    console.error(`❌ Error: Input logo not found at ${INPUT_LOGO}`);
    process.exit(1);
  }
  
  // Ensure directories exist
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const config of LOGO_CONFIGS) {
    try {
      const outputPath = path.join(ASSETS_DIR, config.name);
      
      await sharp(INPUT_LOGO)
        .resize(config.size, config.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toFormat(config.format, {
          quality: 100,
          compressionLevel: 9
        })
        .toFile(outputPath);
      
      console.log(`✅ Generated: ${config.name} (${config.size}x${config.size})`);
      successCount++;
      
      // Also copy to Android assets if directory exists
      if (fs.existsSync(ANDROID_ASSETS_DIR)) {
        const androidPath = path.join(ANDROID_ASSETS_DIR, config.name);
        fs.copyFileSync(outputPath, androidPath);
        console.log(`   📱 Copied to Android assets`);
      }
      
    } catch (error) {
      console.error(`❌ Error generating ${config.name}:`, error.message);
      errorCount++;
    }
  }
  
  // Generate favicon.ico (multi-size)
  try {
    const faviconSizes = [16, 32, 48];
    const faviconBuffers = await Promise.all(
      faviconSizes.map(size =>
        sharp(INPUT_LOGO)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toBuffer()
      )
    );
    
    // Note: For proper .ico generation, you'd need a library like 'to-ico'
    // For now, we'll just use the 32x32 PNG as favicon.ico
    const faviconPath = path.join(__dirname, 'favicon.ico');
    await sharp(INPUT_LOGO)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(faviconPath);
    
    console.log(`✅ Generated: favicon.ico`);
    successCount++;
    
  } catch (error) {
    console.error(`❌ Error generating favicon.ico:`, error.message);
    errorCount++;
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`\n🎉 Logo generation complete!`);
}

// Run the generator
generateLogos().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
