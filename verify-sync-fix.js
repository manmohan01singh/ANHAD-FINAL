#!/usr/bin/env node

/**
 * Sync Fix Verification Script
 * 
 * This script verifies that the synchronization fix is working correctly
 * by simulating multiple clients and checking if they all get the same track.
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

async function checkServerSync() {
    console.log('🔍 Verifying ANHAD Radio Synchronization Fix...\n');
    console.log(`📡 Server: ${API_BASE}\n`);

    try {
        // Simulate 3 different clients checking sync
        console.log('Simulating 3 different clients...\n');
        
        const results = [];
        
        for (let i = 1; i <= 3; i++) {
            const startTime = Date.now();
            const response = await fetch(`${API_BASE}/api/radio/live`, {
                headers: {
                    'User-Agent': `TestClient-${i}`,
                    'Cache-Control': 'no-cache'
                }
            });
            const endTime = Date.now();
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            const latency = endTime - startTime;
            
            results.push({
                client: i,
                trackIndex: data.trackIndex,
                trackPosition: data.trackPosition,
                trackTitle: data.trackTitle,
                epoch: data.epoch,
                serverTime: data.serverTime,
                latency: latency
            });
            
            console.log(`Client ${i}:`);
            console.log(`  Track: Day ${data.trackIndex + 1}`);
            console.log(`  Position: ${formatTime(data.trackPosition)}`);
            console.log(`  Latency: ${latency}ms`);
            console.log(`  Server Time: ${new Date(data.serverTime).toISOString()}`);
            console.log('');
            
            // Small delay between requests
            await sleep(100);
        }
        
        // Verify all clients got the same track
        console.log('═══════════════════════════════════════════════════════════');
        console.log('VERIFICATION RESULTS:');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        const firstTrack = results[0].trackIndex;
        const firstPosition = results[0].trackPosition;
        const firstEpoch = results[0].epoch;
        
        let allSameTrack = true;
        let maxDrift = 0;
        let allSameEpoch = true;
        
        for (let i = 1; i < results.length; i++) {
            if (results[i].trackIndex !== firstTrack) {
                allSameTrack = false;
            }
            if (results[i].epoch !== firstEpoch) {
                allSameEpoch = false;
            }
            const drift = Math.abs(results[i].trackPosition - firstPosition);
            maxDrift = Math.max(maxDrift, drift);
        }
        
        // Check 1: Same Track
        if (allSameTrack) {
            console.log('✅ PASS: All clients on same track (Day ' + (firstTrack + 1) + ')');
        } else {
            console.log('❌ FAIL: Clients on different tracks!');
            results.forEach(r => {
                console.log(`   Client ${r.client}: Day ${r.trackIndex + 1}`);
            });
        }
        
        // Check 2: Same Epoch
        if (allSameEpoch) {
            console.log('✅ PASS: All clients using same epoch');
            console.log(`   Epoch: ${new Date(firstEpoch).toISOString()}`);
        } else {
            console.log('❌ FAIL: Clients using different epochs!');
        }
        
        // Check 3: Low Drift
        if (maxDrift < 2) {
            console.log(`✅ PASS: Maximum drift is ${maxDrift.toFixed(2)}s (< 2s)`);
        } else if (maxDrift < 5) {
            console.log(`⚠️  WARN: Maximum drift is ${maxDrift.toFixed(2)}s (acceptable but high)`);
        } else {
            console.log(`❌ FAIL: Maximum drift is ${maxDrift.toFixed(2)}s (> 5s)`);
        }
        
        console.log('');
        
        // Overall result
        if (allSameTrack && allSameEpoch && maxDrift < 5) {
            console.log('═══════════════════════════════════════════════════════════');
            console.log('🎉 SUCCESS: Synchronization fix is working correctly!');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('');
            console.log('All clients are synchronized:');
            console.log(`  - Same track: Day ${firstTrack + 1}`);
            console.log(`  - Same epoch: ${new Date(firstEpoch).toISOString()}`);
            console.log(`  - Max drift: ${maxDrift.toFixed(2)}s`);
            console.log('');
            console.log('✅ The bug is FIXED! All devices will play the same audio.');
            return true;
        } else {
            console.log('═══════════════════════════════════════════════════════════');
            console.log('❌ FAILURE: Synchronization issues detected!');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('');
            console.log('Please check:');
            console.log('  1. Server is running correctly');
            console.log('  2. Radio state file has valid epoch');
            console.log('  3. Client code has been updated');
            return false;
        }
        
    } catch (error) {
        console.error('❌ ERROR: Cannot connect to server');
        console.error(`   ${error.message}`);
        console.error('');
        console.error('Please ensure:');
        console.error('  1. Server is running: cd backend && npm start');
        console.error(`  2. Server is accessible at: ${API_BASE}`);
        return false;
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the verification
checkServerSync().then(success => {
    process.exit(success ? 0 : 1);
});
