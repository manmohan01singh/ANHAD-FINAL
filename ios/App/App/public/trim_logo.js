const sharp = require('sharp');
const fs = require('fs');

async function processLogo() {
  const inputPath = 'c:/right/ANHAD/frontend/assets/app-logo.png';
  const outPath = 'c:/right/ANHAD/frontend/assets/trim-test.png';
  
  // 1. Let's see if trim can automatically crop the edges away
  const info = await sharp(inputPath)
    .trim({ threshold: 50 })
    .toFile(outPath);
  
  console.log("Trim info:", info);
}

processLogo();
