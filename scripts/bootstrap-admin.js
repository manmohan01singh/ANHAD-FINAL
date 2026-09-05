#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD SECURE ADMIN BOOTSTRAP CLI TOOL
 * ═══════════════════════════════════════════════════════════════════════════════
 * Assigns the custom claim `admin: true` to a specific Firebase user account.
 * 
 * SECURITY RULES:
 * 1. Strictly a server-side CLI tool — NEVER exposed as an HTTP route.
 * 2. Requires server-side Firebase Admin credentials (via environment variables
 *    or GOOGLE_APPLICATION_CREDENTIALS).
 * 3. Never contains hardcoded UIDs, tokens, or private keys.
 * 
 * USAGE:
 *   node scripts/bootstrap-admin.js <USER_FIREBASE_UID>
 * 
 * AFTER ASSIGNING:
 *   The target user must refresh their Firebase ID token in the client:
 *     await firebase.auth().currentUser.getIdToken(true); // forceRefresh = true
 *   before administrative endpoints will accept the new token claim.
 */

'use strict';

const path = require('path');
const firebaseAdmin = require('../backend/lib/firebase-admin');

async function main() {
  const targetUid = process.argv[2];

  if (!targetUid || targetUid.trim().length === 0) {
    console.error('');
    console.error('❌ ERROR: Missing target Firebase UID.');
    console.error('Usage: node scripts/bootstrap-admin.js <USER_FIREBASE_UID>');
    console.error('Example: node scripts/bootstrap-admin.js abc123def456ghi789');
    console.error('');
    process.exit(1);
  }

  const cleanUid = targetUid.trim();

  // Basic UID validation
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(cleanUid)) {
    console.error('❌ ERROR: Invalid UID format. UIDs must be 1-128 alphanumeric, dash, or underscore characters.');
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  👑 ANHAD SECURE ADMIN BOOTSTRAP TOOL');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Target UID: ${cleanUid}`);
  console.log(`  Project ID: ${firebaseAdmin.getProjectId()}`);
  console.log('');

  if (!firebaseAdmin.isInitialized()) {
    console.warn('⚠️ WARNING: Firebase Admin is running without cloud credentials.');
    console.warn('  Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY');
    console.warn('  or GOOGLE_APPLICATION_CREDENTIALS are set in your environment.');
    console.warn('');
  }

  try {
    console.log('[1/2] Assigning custom claim { admin: true }...');
    const result = await firebaseAdmin.setAdminCustomClaim(cleanUid, true);
    console.log('✅ [2/2] Admin custom claim successfully assigned!');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  IMPORTANT NEXT STEP FOR TARGET USER:');
    console.log('  Because claims are cryptographically baked into the ID token JWT,');
    console.log('  the user must refresh their token before accessing admin routes:');
    console.log('');
    console.log('    const freshToken = await user.getIdToken(true);');
    console.log('');
    console.log('  Once refreshed, the ID token will contain `{ admin: true }`.');
    console.log('═══════════════════════════════════════════════════════════════');
    process.exit(0);
  } catch (err) {
    console.error('❌ FAILED to assign admin custom claim:', err.message);
    process.exit(1);
  }
}

main();
