const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const ROOTS = ['frontend/assets', 'frontend/images', 'frontend/guruimages', 'frontend/Homepage'];
const SOURCE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const AVIF_QUALITY = 58;

async function walk(dir) {
    let entries;
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
        return [];
    }

    const files = [];
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...await walk(fullPath));
        } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
            files.push(fullPath);
        }
    }
    return files;
}

async function exists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function writeAvifIfSmaller(inputPath) {
    const outputPath = inputPath.replace(/\.(png|jpe?g|webp)$/i, '.avif');
    if (await exists(outputPath)) return { status: 'skipped' };

    const input = await fs.stat(inputPath);
    const tempPath = `${outputPath}.tmp`;

    await sharp(inputPath, { animated: false })
        .rotate()
        .avif({
            quality: AVIF_QUALITY,
            effort: 6,
            chromaSubsampling: '4:2:0'
        })
        .toFile(tempPath);

    const output = await fs.stat(tempPath);
    if (output.size >= input.size * 0.98) {
        await fs.unlink(tempPath);
        return { status: 'skipped' };
    }

    await fs.rename(tempPath, outputPath);
    return { status: 'created', savedBytes: input.size - output.size };
}

async function main() {
    const totals = { created: 0, skipped: 0, failed: 0, savedBytes: 0 };

    for (const root of ROOTS) {
        for (const filePath of await walk(root)) {
            try {
                const result = await writeAvifIfSmaller(filePath);
                totals[result.status] += 1;
                totals.savedBytes += result.savedBytes || 0;
            } catch (error) {
                totals.failed += 1;
                console.warn(`[image-opt] ${filePath}: ${error.message}`);
            }
        }
    }

    console.log(JSON.stringify({
        created: totals.created,
        skipped: totals.skipped,
        failed: totals.failed,
        savedMB: Number((totals.savedBytes / 1048576).toFixed(2))
    }, null, 2));
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
