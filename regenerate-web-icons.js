// Node.js script to regenerate all web icons from app-logo-384.png
const fs = require('fs');
const path = require('path');

const sharp = require('sharp');

const sourceDir = path.join(__dirname, 'frontend', 'assets');
const sourceLogo = path.join(sourceDir, 'app-logo-384.png');

// Icon sizes needed for web/PWA
const iconSizes = [
  16, 32, 72, 96, 120, 128, 144, 152, 180, 192, 256, 384, 512, 1024
];

async function generateIcons() {
  console.log('🎨 Regenerating ALL web icons from app-logo-384.png...\n');
  
  if (!fs.existsSync(sourceLogo)) {
    console.error('❌ Source logo not found:', sourceLogo);
    process.exit(1);
  }

  console.log('✅ Source logo found:', sourceLogo);
  console.log(`📦 Generating ${iconSizes.length} icon sizes...\n`);

  for (const size of iconSizes) {
    const outputPath = path.join(sourceDir, `icon-${size}x${size}.png`);
    
    try {
      await sharp(sourceLogo)
        .resize(size, size, {
          kernel: sharp.kernel.lanczos3,
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ quality: 100, compressionLevel: 9 })
        .toFile(outputPath);
      
      console.log(`✅ Generated: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Failed to generate icon-${size}x${size}.png:`, error.message);
    }
  }

  // Generate favicon.ico (using 32x32 as base)
  try {
    const faviconPath = path.join(sourceDir, 'favicon.ico');
    await sharp(sourceLogo)
      .resize(32, 32, {
        kernel: sharp.kernel.lanczos3,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(path.join(sourceDir, 'favicon-temp.png'));
    
    // Copy as ICO (sharp doesn't support ICO, so we use PNG)
    fs.copyFileSync(path.join(sourceDir, 'favicon-temp.png'), faviconPath);
    fs.unlinkSync(path.join(sourceDir, 'favicon-temp.png'));
    console.log('✅ Generated: favicon.ico');
  } catch (error) {
    console.error('❌ Failed to generate favicon.ico:', error.message);
  }

  // Generate apple-touch-icon.png (180x180)
  try {
    const appleTouchIconPath = path.join(sourceDir, 'apple-touch-icon.png');
    await sharp(sourceLogo)
      .resize(180, 180, {
        kernel: sharp.kernel.lanczos3,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(appleTouchIconPath);
    
    console.log('✅ Generated: apple-touch-icon.png');
  } catch (error) {
    console.error('❌ Failed to generate apple-touch-icon:', error.message);
  }

  // Generate favicon variants
  try {
    await sharp(sourceLogo)
      .resize(16, 16, { kernel: sharp.kernel.lanczos3, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ quality: 100 })
      .toFile(path.join(sourceDir, 'favicon-16x16.png'));
    console.log('✅ Generated: favicon-16x16.png');

    await sharp(sourceLogo)
      .resize(32, 32, { kernel: sharp.kernel.lanczos3, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ quality: 100 })
      .toFile(path.join(sourceDir, 'favicon-32x32.png'));
    console.log('✅ Generated: favicon-32x32.png');
  } catch (error) {
    console.error('❌ Failed to generate favicon variants:', error.message);
  }

  // Generate PWA specific icons
  try {
    await sharp(sourceLogo)
      .resize(192, 192, { kernel: sharp.kernel.lanczos3, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ quality: 100 })
      .toFile(path.join(sourceDir, 'pwa-icon-192.png'));
    console.log('✅ Generated: pwa-icon-192.png');

    await sharp(sourceLogo)
      .resize(512, 512, { kernel: sharp.kernel.lanczos3, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ quality: 100 })
      .toFile(path.join(sourceDir, 'pwa-icon-512.png'));
    console.log('✅ Generated: pwa-icon-512.png');
  } catch (error) {
    console.error('❌ Failed to generate PWA icons:', error.message);
  }

  console.log('\n✅ ALL WEB ICONS REGENERATED SUCCESSFULLY!');
  console.log(`📁 Output directory: ${sourceDir}`);
  console.log('\n🚀 Next steps:');
  console.log('   1. Verify icons in frontend/assets/');
  console.log('   2. Run: npx cap sync android');
  console.log('   3. Run: npx cap sync ios');
  console.log('   4. Deploy to web server\n');
}

generateIcons().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
