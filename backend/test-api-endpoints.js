/**
 * Test Banidb API Endpoints
 * This script tests various endpoints to find the best way to extract all Gurbani
 */

const https = require('https');

const API_BASE = 'https://api.banidb.com/v2';

// Function to fetch data from API
function fetchAPI(endpoint) {
    return new Promise((resolve, reject) => {
        const url = `${API_BASE}${endpoint}`;
        console.log(`Fetching: ${url}`);
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    console.log(`Response keys:`, Object.keys(parsed));
                    if (parsed.verses) {
                        console.log(`Verses count: ${parsed.verses.length}`);
                        if (parsed.verses.length > 0) {
                            console.log(`Sample verse:`, JSON.stringify(parsed.verses[0], null, 2));
                        }
                    }
                    resolve(parsed);
                } catch (e) {
                    console.error(`Parse error: ${e.message}`);
                    reject(e);
                }
            });
        }).on('error', (error) => {
            console.error(`HTTP error: ${error.message}`);
            reject(error);
        });
    });
}

async function testEndpoints() {
    console.log('=== Testing Banidb API Endpoints ===\n');
    
    // Test 1: Search with empty query
    console.log('\n--- Test 1: Search with empty query ---');
    try {
        await fetchAPI('/search/?searchtype=1&source=G');
    } catch (e) {
        console.error('Failed:', e.message);
    }
    
    // Test 2: Get Ang 1 from SGGS
    console.log('\n--- Test 2: Get Ang 1 from SGGS ---');
    try {
        await fetchAPI('/ang/G/1');
    } catch (e) {
        console.error('Failed:', e.message);
    }
    
    // Test 3: Get random shabad
    console.log('\n--- Test 3: Get random shabad ---');
    try {
        await fetchAPI('/random');
    } catch (e) {
        console.error('Failed:', e.message);
    }
    
    // Test 4: Search with "ਹ" (common letter)
    console.log('\n--- Test 4: Search with "ਹ" ---');
    try {
        await fetchAPI('/search/ਹ?searchtype=1&source=G&results=10');
    } catch (e) {
        console.error('Failed:', e.message);
    }
    
    // Test 5: Get all shabads endpoint
    console.log('\n--- Test 5: Get all shabads ---');
    try {
        await fetchAPI('/shabads');
    } catch (e) {
        console.error('Failed:', e.message);
    }
    
    console.log('\n=== Tests Complete ===');
}

testEndpoints().catch(console.error);
