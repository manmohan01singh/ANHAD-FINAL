const sharp = require('sharp');
const fs = require('fs');

async function processLogo() {
  const inputPath = 'c:/right/ANHAD/frontend/assets/app-logo.png';
  const outPngPath = 'c:/right/ANHAD/frontend/assets/pure-logo.png';
  const outWebpPath = 'c:/right/ANHAD/frontend/assets/pure-logo.webp';

  // The golden square is approx at x=56, y=50, width=387, height=387
  // Let's create a rounded rectangle mask for 387x387 with corner radius 80
  const width = 387;
  const height = 387;
  const r = 80;
  
  const mask = Buffer.from(`
    <svg width="${width}" height="${height}">
      <rect x="0" y="0" width="${width}" height="${height}" rx="${r}" ry="${r}" fill="#fff" />
    </svg>
  `);

  try {
    const cropped = sharp(inputPath).extract({ left: 56, top: 48, width: 387, height: 387 });
    
    // Apply rounded mask to remove any remaining gray corner pixels
    const masked = cropped.composite([{
      input: mask,
      blend: 'dest-in'
    }]);

    await masked.png().toFile(outPngPath);
    await masked.webp({ quality: 90, alphaQuality: 100 }).toFile(outWebpPath);
    
    console.log("Successfully extracted pure logo with completely transparent background!");
  } catch (err) {
    console.error("Error processing:", err);
  }
}

processLogo();
