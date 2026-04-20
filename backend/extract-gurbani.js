/**
 * Extract All Gurbani Data from Banidb API
 * This script fetches all Gurbani from all sources and saves to JSON
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_BASE = 'https://api.banidb.com/v2';
const OUTPUT_FILE = path.join(__dirname, 'gurbani-data.json');

const SOURCES = {
    'G': 'Sri Guru Granth Sahib Ji',
    'D': 'Sri Dasam Granth Sahib Ji',
    'B': 'Bhai Gurdas Ji',
    'N': 'Bhai Nand Lal Ji'
};

// Function to fetch data from API
function fetchAPI(endpoint) {
    return new Promise((resolve, reject) => {
        const url = `${API_BASE}${endpoint}`;
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

// Function to get all verses from a source by iterating through Angs
async function getAllVersesFromSource(source) {
    console.log(`Fetching from source ${source} (${SOURCES[source]})...`);
    
    let allVerses = [];
    
    // Define Ang ranges for each source
    const angRanges = {
        'G': { start: 1, end: 1430 },  // SGGS has 1430 Angs
        'D': { start: 1, end: 1429 },   // Dasam Granth
        'B': { start: 1, end: 20 },     // Bhai Gurdas Vaaran (approximate)
        'N': { start: 1, end: 10 }      // Bhai Nand Lal (approximate)
    };
    
    const range = angRanges[source] || { start: 1, end: 100 };
    
    for (let ang = range.start; ang <= range.end; ang++) {
        try {
            const data = await fetchAPI(`/ang/${source}/${ang}`);
            
            if (data.verses && data.verses.length > 0) {
                // Add source info to each verse
                const versesWithSource = data.verses.map(verse => ({
                    ...verse,
                    _source: source,
                    _sourceName: SOURCES[source]
                }));
                allVerses = allVerses.concat(versesWithSource);
                
                console.log(`  Ang ${ang}: ${data.verses.length} verses (Total: ${allVerses.length})`);
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 50));
            
        } catch (error) {
            console.error(`Error fetching Ang ${ang} for source ${source}:`, error.message);
            // Continue to next Ang even if one fails
        }
    }
    
    console.log(`Total verses from ${source}: ${allVerses.length}`);
    return allVerses;
}

// Main function to extract all Gurbani
async function extractAllGurbani() {
    console.log('Starting Gurbani extraction...\n');
    
    const allData = {
        metadata: {
            extractedAt: new Date().toISOString(),
            sources: SOURCES,
            totalVerses: 0
        },
        verses: []
    };
    
    // Fetch from all sources
    for (const source of Object.keys(SOURCES)) {
        const verses = await getAllVersesFromSource(source);
        allData.verses = allData.verses.concat(verses);
    }
    
    allData.metadata.totalVerses = allData.verses.length;
    
    // Save to JSON file
    console.log(`\nSaving ${allData.verses.length} total verses to ${OUTPUT_FILE}...`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allData, null, 2));
    console.log('Extraction complete!');
    
    // Print summary
    console.log('\n=== Summary ===');
    console.log(`Total verses extracted: ${allData.verses.length}`);
    console.log(`File size: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Output file: ${OUTPUT_FILE}`);
}

// Run the extraction
extractAllGurbani().catch(console.error);
