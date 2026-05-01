const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const pngToIco = require('png-to-ico');

// Configuration
const SOURCE_LOGO = path.join(__dirname, 'assets', 'icon-1024x1024.png');
const ASSETS_DIR = path.join(__dirname, 'assets');
const ASSETS_ICONS_DIR = path.join(__dirname, 'assets', 'icons');
const RESOURCES_DIR = path.join(__dirname, '..', 'resources');
const ANDROID_ICON_DIR = path.join(RESOURCES_DIR, 'android', 'icon');
const ANDROID_RES_DIR = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

// PWA icon sizes
const PWA_SIZES = [16, 32, 72, 96, 128, 144, 152, 180, 192, 256, 384, 512, 1024];

// Android icon densities (standard sizes for mipmap)
const ANDROID_DENSITIES = {
  'ldpi': 36,
  'mdpi': 48,
  'hdpi': 72,
  'xhdpi': 96,
  'xxhdpi': 144,
  'xxxhdpi': 192
};

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function trimLogo(inputPath) {
  console.log('🔧 Trimming transparent edges from logo...');
  const trimmed = await sharp(inputPath)
    .trim({ threshold: 10 })
    .toBuffer();
  return trimmed;
}

async function generatePWAIcons(trimmedLogo) {
  console.log('🎨 Generating PWA icons...');
  
  for (const size of PWA_SIZES) {
    const outputPath = path.join(ASSETS_DIR, `icon-${size}x${size}.png`);
    await sharp(trimmedLogo)
      .resize(size, size, {
        kernel: sharp.kernel.lanczos3,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(outputPath);
    console.log(`  ✅ Generated ${size}x${size}`);
  }

  // Generate app-logo variants (legacy naming)
  const legacySizes = [96, 128, 144, 384];
  for (const size of legacySizes) {
    const outputPath = path.join(ASSETS_DIR, `app-logo-${size}.png`);
    await sharp(trimmedLogo)
      .resize(size, size, {
        kernel: sharp.kernel.lanczos3,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(outputPath);
    console.log(`  ✅ Generated app-logo-${size}.png`);
  }

  // Generate pwa-icon variants
  const pwaSizes = [192, 512];
  for (const size of pwaSizes) {
    const outputPath = path.join(ASSETS_DIR, `pwa-icon-${size}.png`);
    await sharp(trimmedLogo)
      .resize(size, size, {
        kernel: sharp.kernel.lanczos3,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(outputPath);
    console.log(`  ✅ Generated pwa-icon-${size}.png`);
  }

  // Generate main app-logo.png (512x512)
  const mainLogoPath = path.join(ASSETS_DIR, 'app-logo.png');
  await sharp(trimmedLogo)
    .resize(512, 512, {
      kernel: sharp.kernel.lanczos3,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(mainLogoPath);
  console.log(`  ✅ Generated app-logo.png`);

  // Generate apple-touch-icon (180x180)
  const appleTouchPath = path.join(ASSETS_DIR, 'apple-touch-icon.png');
  await sharp(trimmedLogo)
    .resize(180, 180, {
      kernel: sharp.kernel.lanczos3,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(appleTouchPath);
  console.log(`  ✅ Generated apple-touch-icon.png`);

  // Generate favicon variants
  const favicon16Path = path.join(ASSETS_DIR, 'favicon-16x16.png');
  await sharp(trimmedLogo)
    .resize(16, 16, {
      kernel: sharp.kernel.lanczos3,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(favicon16Path);
  console.log(`  ✅ Generated favicon-16x16.png`);

  const favicon32Path = path.join(ASSETS_DIR, 'favicon-32x32.png');
  await sharp(trimmedLogo)
    .resize(32, 32, {
      kernel: sharp.kernel.lanczos3,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(favicon32Path);
  console.log(`  ✅ Generated favicon-32x32.png`);

  // Generate pure-logo.png (for legacy compatibility)
  const pureLogoPath = path.join(ASSETS_DIR, 'pure-logo.png');
  await sharp(trimmedLogo)
    .resize(512, 512, {
      kernel: sharp.kernel.lanczos3,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(pureLogoPath);
  console.log(`  ✅ Generated pure-logo.png`);
}

async function generateCapacitorIcons(trimmedLogo) {
  console.log('📱 Generating Capacitor icons...');
  
  // Generate main icon.png (1024x1024 for Capacitor to process)
  const mainIconPath = path.join(RESOURCES_DIR, 'icon.png');
  await sharp(trimmedLogo)
    .resize(1024, 1024, {
      kernel: sharp.kernel.lanczos3,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(mainIconPath);
  console.log(`  ✅ Generated resources/icon.png (1024x1024)`);

  // Generate Android density-specific icons
  ensureDir(ANDROID_ICON_DIR);
  for (const [density, size] of Object.entries(ANDROID_DENSITIES)) {
    const outputPath = path.join(ANDROID_ICON_DIR, `drawable-${density}-icon.png`);
    await sharp(trimmedLogo)
      .resize(size, size, {
        kernel: sharp.kernel.lanczos3,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(outputPath);
    console.log(`  ✅ Generated android/icon/drawable-${density}-icon.png (${size}x${size})`);
  }
}

async function generateSplashScreen(trimmedLogo) {
  console.log('🌊 Generating splash screen...');
  
  // Get trimmed logo dimensions
  const logoMeta = await sharp(trimmedLogo).metadata();
  const logoSize = Math.min(logoMeta.width, logoMeta.height);
  
  // Splash screen size (Capacitor standard)
  const splashSize = 2732;
  
  // Calculate logo size (40% of splash screen)
  const scaledLogoSize = Math.floor(splashSize * 0.4);
  
  // Create black background
  const background = {
    create: {
      width: splashSize,
      height: splashSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 255 }
    }
  };
  
  // Resize logo to fit
  const resizedLogo = await sharp(trimmedLogo)
    .resize(scaledLogoSize, scaledLogoSize, {
      kernel: sharp.kernel.lanczos3,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();
  
  // Composite logo centered on black background
  const splashPath = path.join(RESOURCES_DIR, 'splash.png');
  await sharp(background)
    .composite([{
      input: resizedLogo,
      gravity: 'center'
    }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(splashPath);
  console.log(`  ✅ Generated resources/splash.png (${splashSize}x${splashSize})`);
}

async function generateAndroidMipmapIcons(trimmedLogo) {
  console.log('🤖 Generating Android mipmap icons...');
  
  for (const [density, size] of Object.entries(ANDROID_DENSITIES)) {
    const mipmapDir = path.join(ANDROID_RES_DIR, `mipmap-${density}`);
    ensureDir(mipmapDir);
    
    // Generate ic_launcher.png
    const launcherPath = path.join(mipmapDir, 'ic_launcher.png');
    await sharp(trimmedLogo)
      .resize(size, size, {
        kernel: sharp.kernel.lanczos3,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(launcherPath);
    
    // Generate ic_launcher_foreground.png
    const fgPath = path.join(mipmapDir, 'ic_launcher_foreground.png');
    await sharp(trimmedLogo)
      .resize(size, size, {
        kernel: sharp.kernel.lanczos3,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(fgPath);
    
    // Generate ic_launcher_round.png
    const roundPath = path.join(mipmapDir, 'ic_launcher_round.png');
    await sharp(trimmedLogo)
      .resize(size, size, {
        kernel: sharp.kernel.lanczos3,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(roundPath);
    
    console.log(`  ✅ Generated mipmap-${density} icons (${size}x${size})`);
  }
}

async function generateAssetsIconsDir(trimmedLogo) {
  console.log('📁 Generating assets/icons/ directory icons...');
  ensureDir(ASSETS_ICONS_DIR);
  
  const iconSizes = [72, 152, 192, 512, 1024];
  for (const size of iconSizes) {
    const outputPath = path.join(ASSETS_ICONS_DIR, `icon-${size}x${size}.png`);
    await sharp(trimmedLogo)
      .resize(size, size, {
        kernel: sharp.kernel.lanczos3,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(outputPath);
    console.log(`  ✅ Generated icons/icon-${size}x${size}.png`);
  }
}

async function generateFavicon(trimmedLogo) {
  console.log('🔖 Generating favicon.ico...');
  
  // Generate 256x256 PNG for ICO conversion
  const faviconPngPath = path.join(ASSETS_DIR, 'favicon-256.png');
  await sharp(trimmedLogo)
    .resize(256, 256, {
      kernel: sharp.kernel.lanczos3,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png({ compressionLevel: 9 })
    .toFile(faviconPngPath);
  
  try {
    const icoBuffer = await pngToIco(faviconPngPath);
    const icoPath = path.join(ASSETS_DIR, 'favicon.ico');
    fs.writeFileSync(icoPath, icoBuffer);
    console.log('  ✅ Generated favicon.ico');
  } catch (e) {
    console.log('  ⚠️  png-to-ico not available, skipping favicon.ico generation');
  }
  
  // Clean up temp file
  if (fs.existsSync(faviconPngPath)) fs.unlinkSync(faviconPngPath);
}

async function generateWebPVariants(trimmedLogo) {
  console.log('🌐 Generating WebP variants...');
  
  // app-logo.webp
  const appLogoWebpPath = path.join(ASSETS_DIR, 'app-logo.webp');
  await sharp(trimmedLogo)
    .resize(512, 512, {
      kernel: sharp.kernel.lanczos3,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .webp({ quality: 90 })
    .toFile(appLogoWebpPath);
  console.log('  ✅ Generated app-logo.webp');
  
  // pure-logo.webp
  const pureLogoWebpPath = path.join(ASSETS_DIR, 'pure-logo.webp');
  await sharp(trimmedLogo)
    .resize(512, 512, {
      kernel: sharp.kernel.lanczos3,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .webp({ quality: 90 })
    .toFile(pureLogoWebpPath);
  console.log('  ✅ Generated pure-logo.webp');
}

async function main() {
  console.log('🚀 Starting logo generation with ULTIMATE POWER!\n');
  
  try {
    // Check if source logo exists
    if (!fs.existsSync(SOURCE_LOGO)) {
      throw new Error(`Source logo not found: ${SOURCE_LOGO}`);
    }
    
    // Ensure directories exist
    ensureDir(ASSETS_DIR);
    ensureDir(ASSETS_ICONS_DIR);
    ensureDir(RESOURCES_DIR);
    ensureDir(ANDROID_ICON_DIR);
    
    // Step 1: Trim transparent edges
    const trimmedLogo = await trimLogo(SOURCE_LOGO);
    console.log('✅ Logo trimmed successfully\n');
    
    // Step 2: Generate PWA icons
    await generatePWAIcons(trimmedLogo);
    console.log('✅ PWA icons generated successfully\n');
    
    // Step 3: Generate Capacitor icons
    await generateCapacitorIcons(trimmedLogo);
    console.log('✅ Capacitor icons generated successfully\n');
    
    // Step 4: Generate splash screen
    await generateSplashScreen(trimmedLogo);
    console.log('✅ Splash screen generated successfully\n');
    
    // Step 5: Generate Android mipmap icons
    await generateAndroidMipmapIcons(trimmedLogo);
    console.log('✅ Android mipmap icons generated successfully\n');
    
    // Step 6: Generate assets/icons/ directory icons
    await generateAssetsIconsDir(trimmedLogo);
    console.log('✅ Assets/icons/ icons generated successfully\n');
    
    // Step 7: Generate favicon
    await generateFavicon(trimmedLogo);
    console.log('✅ Favicon generated successfully\n');
    
    // Step 8: Generate WebP variants
    await generateWebPVariants(trimmedLogo);
    console.log('✅ WebP variants generated successfully\n');
    
    console.log('🎉 ALL LOGOS GENERATED SUCCESSFULLY WITH ULTIMATE POWER!');
    console.log('\n📋 Summary:');
    console.log(`   - ${PWA_SIZES.length} PWA icon sizes`);
    console.log(`   - 1 main Capacitor icon (1024x1024)`);
    console.log(`   - ${Object.keys(ANDROID_DENSITIES).length} Android density icons`);
    console.log(`   - ${Object.keys(ANDROID_DENSITIES).length} Android mipmap density sets`);
    console.log(`   - 5 assets/icons/ variants`);
    console.log(`   - 1 splash screen (2732x2732)`);
    console.log(`   - 1 favicon.ico`);
    console.log(`   - 2 WebP variants`);
    console.log('   - All generated with lanczos3 resampler for maximum quality');
    
  } catch (error) {
    console.error('❌ Error generating logos:', error);
    process.exit(1);
  }
}

main();

