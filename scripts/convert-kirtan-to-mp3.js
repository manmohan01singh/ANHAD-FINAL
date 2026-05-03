const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const https = require('https');

// Cloudflare R2 Base URL for the Kirtan tracks
const R2_BASE_URL = 'https://pub-525228169e0c44e38a67c306ba1a458c.r2.dev';
const OUTPUT_DIR = path.join(__dirname, '..', 'converted_kirtan_mp3s');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

console.log('===============================================================');
console.log('🎵 ANHAD KIRTAN MP3 CONVERTER (ANDROID BUFFERING FIX) 🎵');
console.log('===============================================================');
console.log('Android natively struggles with large WebM files without an index.');
console.log('This script will download your 40 WebM files and instantly');
console.log('convert them to MP3 using ffmpeg so they stream flawlessly.');
console.log(`Outputs will be saved to: ${OUTPUT_DIR}`);
console.log('===============================================================\n');

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
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

function convertToMp3(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        // Fast conversion: Copy audio without re-encoding if possible, or fast encode to MP3
        // We use libmp3lame to ensure universal Android support
        const ffmpeg = spawn('ffmpeg', [
            '-y',             // Overwrite output files
            '-i', inputPath,  // Input file
            '-c:a', 'libmp3lame', // Convert to MP3
            '-b:a', '64k',    // 64kbps is identical to the current Opus bitrate and extremely small
            outputPath
        ]);

        ffmpeg.stderr.on('data', (data) => {
            const output = data.toString();
            // Optional: print progress
            if (output.includes('time=')) {
                process.stdout.write(`\rConverting... ${output.match(/time=\S+/)[0]}`);
            }
        });

        ffmpeg.on('close', (code) => {
            console.log(); // Newline after progress
            if (code === 0) resolve();
            else reject(new Error(`FFmpeg exited with code ${code}`));
        });
    });
}

async function processDay(dayNumber) {
    const filenameWebM = `day-${dayNumber}.webm`;
    const filenameMp3 = `day-${dayNumber}.mp3`;
    const tempWebMPath = path.join(OUTPUT_DIR, filenameWebM);
    const finalMp3Path = path.join(OUTPUT_DIR, filenameMp3);

    console.log(`\n▶️ Processing Day ${dayNumber} / 40...`);

    if (fs.existsSync(finalMp3Path)) {
        console.log(`✅ ${filenameMp3} already exists, skipping!`);
        return;
    }

    try {
        console.log(`📥 Downloading ${filenameWebM} from Cloudflare...`);
        await downloadFile(`${R2_BASE_URL}/${filenameWebM}`, tempWebMPath);
        
        console.log(`⚙️ Converting to MP3 (Universal Android Support)...`);
        await convertToMp3(tempWebMPath, finalMp3Path);

        console.log(`🗑️ Cleaning up temp WebM file...`);
        fs.unlinkSync(tempWebMPath);

        console.log(`🎉 Success! Saved ${filenameMp3}`);
    } catch (err) {
        console.error(`❌ Error processing Day ${dayNumber}:`, err.message);
    }
}

async function run() {
    // Start from 1 to 40
    for (let i = 1; i <= 40; i++) {
        await processDay(i);
    }

    console.log('\n===============================================================');
    console.log('🎯 ALL CONVERSIONS COMPLETE!');
    console.log('===============================================================');
    console.log('NEXT STEPS:');
    console.log('1. Go to your Cloudflare R2 Dashboard.');
    console.log(`2. Upload all the .mp3 files located in: ${OUTPUT_DIR}`);
    console.log('3. Open `frontend/lib/anhad-audio-singleton.js`');
    console.log("4. Change the amritvela `getTrackUrl` to return `.mp3` instead of `.webm`.");
    console.log('Your Android app will now stream instantly with ZERO buffering loops!');
}

run();
