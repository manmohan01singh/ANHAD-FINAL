/**
 * Split large all-banis-offline.json into smaller chunks for faster loading
 * Run with: node split-banis.js
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, 'all-banis-offline.json');
const OUTPUT_DIR = path.join(__dirname, 'banis-chunks');

// Nitnem banis (most commonly used - should be preloaded)
const NITNEM_BANIS = [1, 2, 3, 4, 5, 6, 7, 9, 10, 21, 22, 23, 24, 25, 26];

// Popular banis (should be preloaded)
const POPULAR_BANIS = [31, 36, 27, 33, 34, 35, 30, 90];

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Load the full JSON
console.log('Loading all-banis-offline.json...');
const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
console.log(`Loaded ${Object.keys(data.banis).length} banis`);

// Create nitnem bundle (small, fast load)
console.log('Creating nitnem bundle...');
const nitnemBundle = {
  version: data.version,
  lastUpdated: data.lastUpdated,
  totalBanis: NITNEM_BANIS.length,
  banis: {}
};

NITNEM_BANIS.forEach(id => {
  if (data.banis[id]) {
    nitnemBundle.banis[id] = data.banis[id];
  }
});

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'nitnem-banis.json'),
  JSON.stringify(nitnemBundle, null, 2),
  'utf8'
);
console.log(`✓ Created nitnem-banis.json (${(Buffer.byteLength(JSON.stringify(nitnemBundle)) / 1024).toFixed(2)} KB)`);

// Create popular bundle
console.log('Creating popular bundle...');
const popularBundle = {
  version: data.version,
  lastUpdated: data.lastUpdated,
  totalBanis: POPULAR_BANIS.length,
  banis: {}
};

POPULAR_BANIS.forEach(id => {
  if (data.banis[id]) {
    popularBundle.banis[id] = data.banis[id];
  }
});

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'popular-banis.json'),
  JSON.stringify(popularBundle, null, 2),
  'utf8'
);
console.log(`✓ Created popular-banis.json (${(Buffer.byteLength(JSON.stringify(popularBundle)) / 1024).toFixed(2)} KB)`);

// Split remaining banis into chunks by ID ranges
const allIds = Object.keys(data.banis).map(Number).sort((a, b) => a - b);
const chunkedIds = [];

// Remove nitnem and popular from remaining
const remainingIds = allIds.filter(id => 
  !NITNEM_BANIS.includes(id) && !POPULAR_BANIS.includes(id)
);

// Split into chunks of 10 banis each
const CHUNK_SIZE = 10;
for (let i = 0; i < remainingIds.length; i += CHUNK_SIZE) {
  chunkedIds.push(remainingIds.slice(i, i + CHUNK_SIZE));
}

console.log(`Creating ${chunkedIds.length} chunks for remaining banis...`);
chunkedIds.forEach((ids, index) => {
  const chunk = {
    version: data.version,
    lastUpdated: data.lastUpdated,
    totalBanis: ids.length,
    banis: {}
  };

  ids.forEach(id => {
    if (data.banis[id]) {
      chunk.banis[id] = data.banis[id];
    }
  });

  const chunkFileName = `chunk-${index + 1}-${ids[0]}-${ids[ids.length - 1]}.json`;
  fs.writeFileSync(
    path.join(OUTPUT_DIR, chunkFileName),
    JSON.stringify(chunk, null, 2),
    'utf8'
  );
  console.log(`✓ Created ${chunkFileName} (${(Buffer.byteLength(JSON.stringify(chunk)) / 1024).toFixed(2)} KB)`);
});

// Create index file
console.log('Creating index...');
const index = {
  version: data.version,
  lastUpdated: data.lastUpdated,
  totalBanis: data.totalBanis,
  chunks: {
    nitnem: 'nitnem-banis.json',
    popular: 'popular-banis.json',
    chunks: chunkedIds.map((ids, index) => ({
      file: `chunk-${index + 1}-${ids[0]}-${ids[ids.length - 1]}.json`,
      ids: ids,
      range: `${ids[0]}-${ids[ids.length - 1]}`
    }))
  },
  baniIndex: {}
};

// Create bani ID to chunk mapping
Object.keys(data.banis).forEach(id => {
  const numId = parseInt(id);
  if (NITNEM_BANIS.includes(numId)) {
    index.baniIndex[id] = 'nitnem-banis.json';
  } else if (POPULAR_BANIS.includes(numId)) {
    index.baniIndex[id] = 'popular-banis.json';
  } else {
    // Find which chunk
    const chunkIndex = chunkedIds.findIndex(ids => ids.includes(numId));
    if (chunkIndex !== -1) {
      index.baniIndex[id] = `chunk-${chunkIndex + 1}-${chunkedIds[chunkIndex][0]}-${chunkedIds[chunkIndex][chunkedIds[chunkIndex].length - 1]}.json`;
    }
  }
});

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'index.json'),
  JSON.stringify(index, null, 2),
  'utf8'
);
console.log(`✓ Created index.json`);

console.log('\n=== Summary ===');
console.log(`Total banis: ${data.totalBanis}`);
console.log(`Nitnem bundle: ${NITNEM_BANIS.length} banis`);
console.log(`Popular bundle: ${POPULAR_BANIS.length} banis`);
console.log(`Chunked banis: ${remainingIds.length} banis in ${chunkedIds.length} chunks`);
console.log(`Output directory: ${OUTPUT_DIR}`);
