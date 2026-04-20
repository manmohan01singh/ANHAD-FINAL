/**
 * Script to fetch all banis from BaniDB API and store in JSON for offline reading
 * Run with: node fetch-all-banis.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'https://api.banidb.com/v2';
const OUTPUT_FILE = path.join(__dirname, 'all-banis-offline.json');

// Bani IDs to fetch (from bani-catalog.json)
const BANI_IDS = [
  // Nitnem
  1, 2, 3, 4, 5, 6, 7, 9, 10, 21, 22, 23, 24, 25, 26,
  // SGGS Popular
  31, 36, 27, 33, 34, 35, 30,
  // SGGS Vaars (86-107)
  86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107,
  // SGGS Raags (55-76)
  55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76,
  // SGGS Special
  11, 38, 39, 46, 77, 78,
  // Dasam Granth
  4, 6, 7, 9, 5, 8, 12, 13, 19, 28, 29, 53,
  // Additional common banis
  14, 15, 16, 17, 18, 20, 32, 37, 40, 41, 42, 43, 44, 45, 47, 48, 49, 50, 51, 52, 54, 79, 80, 81, 82, 83, 84, 85
];

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function fetchBani(baniId) {
  const url = `${API_BASE_URL}/banis/${baniId}`;
  console.log(`Fetching Bani ${baniId}...`);
  
  try {
    const data = await fetchJSON(url);
    console.log(`✓ Successfully fetched Bani ${baniId}: ${data.baniName || data.gurmukhiUni || 'Unknown'}`);
    return data;
  } catch (error) {
    console.error(`✗ Failed to fetch Bani ${baniId}:`, error.message);
    return null;
  }
}

async function fetchAllBanis() {
  console.log('Starting to fetch all banis from BaniDB API...');
  console.log(`Total banis to fetch: ${BANI_IDS.length}\n`);
  
  const allBanis = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    totalBanis: BANI_IDS.length,
    banis: {}
  };
  
  let successCount = 0;
  let failCount = 0;
  
  for (const baniId of BANI_IDS) {
    const baniData = await fetchBani(baniId);
    
    if (baniData) {
      allBanis.banis[baniId] = baniData;
      successCount++;
    } else {
      failCount++;
    }
    
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  allBanis.successCount = successCount;
  allBanis.failCount = failCount;
  
  console.log(`\n=== Summary ===`);
  console.log(`Successfully fetched: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Total: ${BANI_IDS.length}`);
  
  // Write to JSON file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allBanis, null, 2), 'utf8');
  console.log(`\n✓ All banis saved to: ${OUTPUT_FILE}`);
  
  return allBanis;
}

// Run the script
fetchAllBanis().catch(console.error);
