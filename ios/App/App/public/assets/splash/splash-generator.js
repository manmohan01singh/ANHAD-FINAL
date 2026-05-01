/**
 * ANHAD - Splash Screen Generator
 * Run this script in the browser console to generate splash screen images
 * Or use an online tool like https://progressier.com/pwa-icons-and-ios-splash-screen-generator
 */

const splashScreenSizes = [
    { width: 750, height: 1334, name: 'apple-splash-750-1334.png', device: 'iPhone SE/6s/7/8' },
    { width: 1242, height: 2208, name: 'apple-splash-1242-2208.png', device: 'iPhone 6s+/7+/8+' },
    { width: 1125, height: 2436, name: 'apple-splash-1125-2436.png', device: 'iPhone X/XS/11 Pro' },
    { width: 828, height: 1792, name: 'apple-splash-828-1792.png', device: 'iPhone XR/11' },
    { width: 1242, height: 2688, name: 'apple-splash-1242-2688.png', device: 'iPhone XS Max/11 Pro Max' },
    { width: 1080, height: 2340, name: 'apple-splash-1080-2340.png', device: 'iPhone 12 mini' },
    { width: 1170, height: 2532, name: 'apple-splash-1170-2532.png', device: 'iPhone 12/13/14' },
    { width: 1284, height: 2778, name: 'apple-splash-1284-2778.png', device: 'iPhone 12/13 Pro Max' },
    { width: 1179, height: 2556, name: 'apple-splash-1179-2556.png', device: 'iPhone 14 Pro' },
    { width: 1290, height: 2796, name: 'apple-splash-1290-2796.png', device: 'iPhone 14/15 Pro Max' },
    { width: 1536, height: 2048, name: 'apple-splash-1536-2048.png', device: 'iPad Mini/Air' },
    { width: 1668, height: 2224, name: 'apple-splash-1668-2224.png', device: 'iPad Pro 10.5"' },
    { width: 1668, height: 2388, name: 'apple-splash-1668-2388.png', device: 'iPad Pro 11"' },
    { width: 2048, height: 2732, name: 'apple-splash-2048-2732.png', device: 'iPad Pro 12.9"' }
];

const iconSizes = [
    { size: 72, name: 'icon-72x72.png' },
    { size: 96, name: 'icon-96x96.png' },
    { size: 120, name: 'icon-120x120.png' },
    { size: 128, name: 'icon-128x128.png' },
    { size: 144, name: 'icon-144x144.png' },
    { size: 152, name: 'icon-152x152.png' },
    { size: 180, name: 'icon-180x180.png' },
    { size: 192, name: 'icon-192x192.png' },
    { size: 384, name: 'icon-384x384.png' },
    { size: 512, name: 'icon-512x512.png' }
];

/**
 * Generate a splash screen canvas
 */
function generateSplash(width, height, bgColor = '#020205', logoUrl = '/assets/app-logo.png') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Load and draw logo (centered)
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const logoSize = Math.min(width, height) * 0.3;
            const x = (width - logoSize) / 2;
            const y = (height - logoSize) / 2 - height * 0.05;

            ctx.drawImage(img, x, y, logoSize, logoSize);

            // App name
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.floor(width * 0.08)}px -apple-system, BlinkMacSystemFont, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('ANHAD', width / 2, y + logoSize + height * 0.08);

            // Tagline
            ctx.fillStyle = '#888888';
            ctx.font = `${Math.floor(width * 0.035)}px -apple-system, BlinkMacSystemFont, sans-serif`;
            ctx.fillText('ਅਨਹਦ • Divine Gurbani', width / 2, y + logoSize + height * 0.12);

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
            // Fallback without logo
            ctx.fillStyle = '#f7c634';
            ctx.font = `bold ${Math.floor(width * 0.12)}px -apple-system, BlinkMacSystemFont, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('ੴ', width / 2, height * 0.45);

            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.floor(width * 0.08)}px -apple-system, BlinkMacSystemFont, sans-serif`;
            ctx.fillText('ANHAD', width / 2, height * 0.55);

            resolve(canvas.toDataURL('image/png'));
        };
        img.src = logoUrl;
    });
}

/**
 * Download all splash screens
 */
async function downloadAllSplashScreens() {
    for (const screen of splashScreenSizes) {
        console.log(`Generating ${screen.device}...`);
        const dataUrl = await generateSplash(screen.width, screen.height);

        const link = document.createElement('a');
        link.download = screen.name;
        link.href = dataUrl;
        link.click();

        await new Promise(r => setTimeout(r, 500)); // Delay between downloads
    }
    console.log('All splash screens generated!');
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { splashScreenSizes, iconSizes, generateSplash, downloadAllSplashScreens };
}

console.log('Splash Screen Generator loaded. Run downloadAllSplashScreens() to generate.');
