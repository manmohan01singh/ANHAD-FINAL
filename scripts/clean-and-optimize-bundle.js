const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sharp = require('sharp');
const ffmpeg = require('ffmpeg-static');

const ROOT = path.join(__dirname, '..');
const FRONTEND = path.join(ROOT, 'frontend');

async function run() {
    console.log('🚀 Starting Anhad Bundle Optimization...');

    // 1. Archive monolithic 93MB banis file
    const dataArchiveDir = path.join(ROOT, 'data-archive');
    if (!fs.existsSync(dataArchiveDir)) fs.mkdirSync(dataArchiveDir, { recursive: true });
    
    const monolithicBani = path.join(FRONTEND, 'data', 'all-banis-offline.json');
    if (fs.existsSync(monolithicBani)) {
        fs.renameSync(monolithicBani, path.join(dataArchiveDir, 'all-banis-offline.json'));
        console.log('✅ Moved all-banis-offline.json (93MB) to data-archive/');
    }

    // 2. Archive 42MB PDF
    const pdfArchiveDir = path.join(ROOT, 'pdf-archive');
    if (!fs.existsSync(pdfArchiveDir)) fs.mkdirSync(pdfArchiveDir, { recursive: true });

    const sarblohPdf = path.join(FRONTEND, 'nitnem', 'category', 'Complete-Sri-Sarbloh-Granth-Sahib-Ji-Steek.pdf');
    if (fs.existsSync(sarblohPdf)) {
        fs.renameSync(sarblohPdf, path.join(pdfArchiveDir, 'Complete-Sri-Sarbloh-Granth-Sahib-Ji-Steek.pdf'));
        console.log('✅ Moved Complete-Sri-Sarbloh-Granth-Sahib-Ji-Steek.pdf (42MB) to pdf-archive/');
    }

    // 3. Remove duplicate nitnem/data/banis-chunks
    const dupChunks = path.join(FRONTEND, 'nitnem', 'data', 'banis-chunks');
    if (fs.existsSync(dupChunks)) {
        fs.rmSync(dupChunks, { recursive: true, force: true });
        console.log('✅ Removed duplicate frontend/nitnem/data/banis-chunks (25MB)');
    }

    // 4. Remove unused homepage-hero
    const unusedHomepageHero = path.join(FRONTEND, 'assets', 'homepage-hero');
    if (fs.existsSync(unusedHomepageHero)) {
        fs.rmSync(unusedHomepageHero, { recursive: true, force: true });
        console.log('✅ Removed unused frontend/assets/homepage-hero (17MB)');
    }

    // 5. Remove unreferenced 3MB raw source PNGs in HERO CARD IMAGES
    const heroCardImages = path.join(FRONTEND, 'assets', 'HERO CARD IMAGES');
    if (fs.existsSync(heroCardImages)) {
        const rawHeroFiles = [
            'DAY AMRITVELA KIRTAN CARD IMAGE.png',
            'DAY AMRITVELA KIRTAN CARD IMAGE.avif',
            'DAY DARABR SAHIB CARD IMAGE.png',
            'DAY DARABR SAHIB CARD IMAGE.avif',
            'DAY WAHEGURU SIMRAN CARD IMAGE.png',
            'DAY WAHEGURU SIMRAN CARD IMAGE.avif',
            'EVENEING AMRITVELA KIRTAN CARD IMAGE .png',
            'EVENEING AMRITVELA KIRTAN CARD IMAGE .avif',
            'EVENEING DARBAR SAHIB CARD IMAGE .png',
            'EVENEING DARBAR SAHIB CARD IMAGE .avif',
            'EVENEING WAHEGURU SIMRAN CARD IMAGE .png.png',
            'EVENEING WAHEGURU SIMRAN CARD IMAGE .png.avif',
            'MORNING AMRITVELA KIRTAN CARD IMAGE .png',
            'MORNING AMRITVELA KIRTAN CARD IMAGE .avif',
            'MORNING DARBAR SAHIB CARD IMAGE .png',
            'MORNING DARBAR SAHIB CARD IMAGE .avif',
            'MORNING WAHEGURU SIMRAN CARD IMAGE .png',
            'MORNING WAHEGURU SIMRAN CARD IMAGE .avif',
            'NIGHT AMRITVELA KIRTAN  CARDimage.png',
            'NIGHT AMRITVELA KIRTAN  CARDimage.avif',
            'NIGHT DARBAR SAHIB CARDimage.png',
            'NIGHT DARBAR SAHIB CARDimage.avif',
            'NIGHT WAHEGURU SIMRAN CARD IMAGE.png',
            'NIGHT WAHEGURU SIMRAN CARD IMAGE.avif',
            'night clouds darbar sahib card.png',
            'night clouds darbar sahib card.avif',
            'night clouds waheguru simran card.png',
            'night clouds waheguru simran card.avif',
            'nights clouds  amritvela kirtan.png',
            'nights clouds  amritvela kirtan.avif',
            'new morning bg.png',
            'new morning bg.avif',
            'new night bg.png',
            'new night bg.avif',
            'anhad new logo.png',
            'anhad new logo.avif'
        ];
        rawHeroFiles.forEach(f => {
            const p = path.join(heroCardImages, f);
            if (fs.existsSync(p)) fs.unlinkSync(p);
        });
        console.log('✅ Cleaned raw uncompressed PNGs from HERO CARD IMAGES (~45MB saved)');
    }

    // 6. Remove unreferenced large mockup images
    const unreferencedFiles = [
        path.join(FRONTEND, 'Darbar-sahib-AMRITVELA.png'),
        path.join(FRONTEND, 'assets', 'darbar-sahib-amritvela-morning.png'),
        path.join(FRONTEND, 'assets', 'darbar-sahib-amritvela-morning.avif'),
        path.join(FRONTEND, 'assets', 'marigold_top_arch.png'),
        path.join(FRONTEND, 'assets', 'marigold_top_arch.avif'),
        path.join(FRONTEND, 'assets', 'marigold_bottom.png'),
        path.join(FRONTEND, 'assets', 'marigold_bottom.avif'),
        path.join(FRONTEND, 'assets', 'marigold_corner.png'),
        path.join(FRONTEND, 'assets', 'marigold_corner.avif'),
        path.join(FRONTEND, 'assets', 'lotus_grace_arch.png'),
        path.join(FRONTEND, 'assets', 'lotus_grace_arch.avif'),
        path.join(FRONTEND, 'assets', 'lotus_top_arch.png'),
        path.join(FRONTEND, 'assets', 'lotus_top_arch.avif'),
        path.join(FRONTEND, 'assets', 'lotus_bottom.png'),
        path.join(FRONTEND, 'assets', 'lotus_bottom.avif'),
        path.join(FRONTEND, 'assets', 'royal_rose_arch.png'),
        path.join(FRONTEND, 'assets', 'royal_rose_arch.avif'),
        path.join(FRONTEND, 'assets', 'blue_blossom_top_arch.png'),
        path.join(FRONTEND, 'assets', 'blue_blossom_top_arch.avif'),
        path.join(FRONTEND, 'assets', 'blue_blossom_bottom.png'),
        path.join(FRONTEND, 'assets', 'blue_blossom_bottom.avif'),
        path.join(FRONTEND, 'assets', 'guru-greeting-hero.png'),
        path.join(FRONTEND, 'assets', 'guru-greeting-hero-dark.png'),
        path.join(FRONTEND, 'NitnemTracker', 'HUKAMNAMA-SAHIB.png'),
        path.join(FRONTEND, 'NitnemTracker', 'data', 'image.png'),
        path.join(FRONTEND, '1000171105-modified (1).png'),
        path.join(FRONTEND, 'guruimages', 'ChatGPT Image Aug 30, 2026, 01_19_55 PM.png'),
        path.join(FRONTEND, 'guruimages', 'gurutegbahadursahebji_backup.jpeg'),
        path.join(FRONTEND, 'guruimages', 'gurutegbahadursahebji_backup.avif')
    ];
    unreferencedFiles.forEach(f => {
        if (fs.existsSync(f)) {
            fs.unlinkSync(f);
            console.log(`✅ Removed unreferenced: ${path.basename(f)}`);
        }
    });

    // 7. Compress images with sharp (Guru avatar icons, creator image, nitnem image)
    const guruIconsDir = path.join(FRONTEND, 'assets', 'icons');
    if (fs.existsSync(guruIconsDir)) {
        const iconFiles = fs.readdirSync(guruIconsDir).filter(f => f.startsWith('guru-') && f.endsWith('.png'));
        for (const f of iconFiles) {
            const p = path.join(guruIconsDir, f);
            const inputBuf = fs.readFileSync(p);
            const buf = await sharp(inputBuf)
                .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
                .png({ quality: 80, compressionLevel: 9, effort: 7 })
                .toBuffer();
            fs.writeFileSync(p, buf);
            console.log(`🎨 Optimized Guru icon: ${f} -> ${(buf.length / 1024).toFixed(1)} KB`);
        }
    }

    // Optimize creator image and other large images
    const imagesToCompress = [
        path.join(FRONTEND, 'Journey', 'image.png'),
        path.join(FRONTEND, 'about', 'image.png'),
        path.join(FRONTEND, 'nitnem', 'css', 'image.png'),
        path.join(FRONTEND, 'assets', 'icons', 'sahibzade.png'),
        path.join(FRONTEND, 'assets', 'icons', 'guru-har-krishan-portrait.png'),
        path.join(FRONTEND, 'assets', 'icons', 'guru-tegh-bahadur-portrait.png'),
        path.join(FRONTEND, 'assets', 'khanda-gold.png'),
        path.join(FRONTEND, 'assets', 'khanda-symbol.png'),
        path.join(FRONTEND, 'assets', 'magical-simran.png'),
        path.join(FRONTEND, 'assets', 'golden_marigold_corner.png'),
        path.join(FRONTEND, 'assets', 'royal_rose_corner.png'),
        path.join(FRONTEND, 'assets', 'lotus_grace_corner.png'),
        path.join(FRONTEND, 'assets', 'blue_blossom_corner.png')
    ];
    for (const img of imagesToCompress) {
        if (fs.existsSync(img)) {
            const inputBuf = fs.readFileSync(img);
            const buf = await sharp(inputBuf)
                .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
                .png({ quality: 80, compressionLevel: 9, effort: 7 })
                .toBuffer();
            fs.writeFileSync(img, buf);
            console.log(`🎨 Compressed: ${path.basename(img)} -> ${(buf.length / 1024).toFixed(1)} KB`);
        }
    }

    // 8. Compress high bitrate audio files with ffmpeg
    const audioFiles = [
        { file: path.join(FRONTEND, 'Audio', 'audio4.mpeg'), bitrate: '96k' },
        { file: path.join(FRONTEND, 'Audio', 'audio5.mpeg'), bitrate: '128k' },
        { file: path.join(FRONTEND, 'Audio', 'audio6.mpeg'), bitrate: '128k' }
    ];
    for (const a of audioFiles) {
        if (fs.existsSync(a.file)) {
            const tmpFile = `${a.file}.tmp.mp3`;
            execSync(`"${ffmpeg}" -y -i "${a.file}" -b:a ${a.bitrate} -ar 44100 "${tmpFile}"`, { stdio: 'ignore' });
            if (fs.existsSync(tmpFile)) {
                fs.unlinkSync(a.file);
                fs.renameSync(tmpFile, a.file);
                const stat = fs.statSync(a.file);
                console.log(`🎵 Compressed audio: ${path.basename(a.file)} -> ${(stat.size / 1048576).toFixed(2)} MB`);
            }
        }
    }

    // 9. Remove stray dev scripts from frontend
    function cleanDevFiles(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (entry.name === '__tests__') {
                    fs.rmSync(fullPath, { recursive: true, force: true });
                    console.log(`🧹 Removed test dir: ${fullPath}`);
                } else {
                    cleanDevFiles(fullPath);
                }
            } else if (
                entry.name.endsWith('.py') ||
                entry.name.endsWith('.ps1') ||
                entry.name.endsWith('.bat') ||
                entry.name.endsWith('.bak') ||
                (entry.name.endsWith('.md') && !entry.name.includes('LICENSE')) ||
                entry.name.endsWith('.test.js') ||
                (entry.name.endsWith('.txt') && entry.name !== 'robots.txt')
            ) {
                fs.unlinkSync(fullPath);
                console.log(`🧹 Removed dev file: ${entry.name}`);
            }
        }
    }
    cleanDevFiles(FRONTEND);

    console.log('✨ Asset cleanup and optimization complete!');
}

run().catch(err => {
    console.error('❌ Error during optimization:', err);
    process.exit(1);
});
