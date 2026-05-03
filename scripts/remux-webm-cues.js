const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD WEBM REMUXER (ANDROID SEEKING FIX)
 * ═══════════════════════════════════════════════════════════════════════════════
 * This script fixes WebM files for Android by moving the Cues element (seek index)
 * to the FRONT of the file. This enables instant seeking without downloading
 * the entire file from byte 0.
 * 
 * Logic:
 * 1. Downloads WebM from R2
 * 2. Re-muxes (no re-encoding) with -cues_to_front 1
 * 3. Saves locally (User can upload manually or add R2 keys to .env)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Configuration
const R2_BASE_URL = process.env.R2_BASE_URL || 'https://pub-525228169e0c44e38a67c306ba1a458c.r2.dev';
const OUTPUT_DIR = path.join(__dirname, '..', 'fixed_webm_android');
const TOTAL_DAYS = 40;

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('===============================================================');
console.log('🛠️  WEBM REMUXER: MOVING CUES TO FRONT FOR ANDROID SEEKING');
console.log('===============================================================');
console.log(`Input Source: ${R2_BASE_URL}`);
console.log(`Output Dir:   ${OUTPUT_DIR}`);
console.log('===============================================================\n');

/**
 * Downloads a file from URL to local path
 */
function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Download failed: ${response.statusCode} for ${url}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

/**
 * Re-muxes WebM to move Cues index to the front
 * Uses: ffmpeg -i input.webm -c copy -reserve_index_space 1024K -cues_to_front 1 output.webm
 */
function remuxWebM(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        console.log(`⚙️  Re-muxing: Moving Cues to front...`);
        
        const ffmpeg = spawn('ffmpeg', [
            '-y',
            '-i', inputPath,
            '-c', 'copy',                // Stream copy (no re-encoding, zero quality loss)
            '-reserve_index_space', '1024K', // Reserve space at start for index
            '-cues_to_front', '1',       // MOVE CUES TO FRONT
            outputPath
        ]);

        let errorLog = '';
        ffmpeg.stderr.on('data', (data) => {
            errorLog += data.toString();
        });

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`FFmpeg failed (code ${code}): ${errorLog}`));
            }
        });
    });
}

async function processFile(day) {
    const filename = `day-${day}.webm`;
    const url = `${R2_BASE_URL}/${filename}`;
    const tempInput = path.join(OUTPUT_DIR, `temp_${filename}`);
    const finalOutput = path.join(OUTPUT_DIR, filename);

    console.log(`\n▶️  [${day}/${TOTAL_DAYS}] Processing ${filename}...`);

    try {
        // 1. Download
        process.stdout.write('📥 Downloading... ');
        await downloadFile(url, tempInput);
        console.log('Done.');

        // 2. Remux
        await remuxWebM(tempInput, finalOutput);

        // 3. Cleanup temp
        fs.unlinkSync(tempInput);
        
        console.log(`✅ SUCCESS: ${filename} is now optimized for Android!`);
    } catch (err) {
        console.error(`❌ ERROR: Failed to process ${filename}`);
        console.error(`   ${err.message}`);
        if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
    }
}

async function run() {
    const start = Date.now();
    
    for (let i = 1; i <= TOTAL_DAYS; i++) {
        await processFile(i);
    }

    const duration = ((Date.now() - start) / 1000 / 60).toFixed(2);
    console.log('\n===============================================================');
    console.log(`🎉 FINISHED! Processed ${TOTAL_DAYS} files in ${duration} minutes.`);
    console.log('===============================================================');
    console.log('NEXT STEPS:');
    console.log('1. Verify the files in the "fixed_webm_android" folder.');
    console.log('2. Upload these files to your Cloudflare R2 bucket.');
    console.log('3. Android will now seek INSTANTLY without downloading the whole file!');
    console.log('===============================================================\n');
}

// Start the process
run().catch(err => {
    console.error('CRITICAL ERROR:', err);
});
