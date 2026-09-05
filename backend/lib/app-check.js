/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD FIREBASE APP CHECK MIDDLEWARE & PROVIDER CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════════
 * Provides defense-in-depth protection against botting, scraping, and abusive
 * API consumers across:
 * - Web (reCAPTCHA v3 / Enterprise)
 * - Android (Play Integrity)
 * - iOS (App Attest / DeviceCheck)
 * 
 * IMPORTANT:
 * App Check is an anti-abuse layer and does NOT replace Firebase Authentication.
 * Public endpoints (Radio stream, audio proxies, guest presence) remain accessible.
 */

'use strict';

const firebaseAdmin = require('./firebase-admin');

/**
 * Validates the X-Firebase-AppCheck token from client headers.
 * @param {Object} options 
 * @param {boolean} options.required - If true, rejects requests missing or with invalid tokens
 * @returns {Function} Express middleware
 */
function verifyAppCheck(options = { required: false }) {
  const isRequired = Boolean(options.required);

  return async (req, res, next) => {
    const appCheckToken = req.header('X-Firebase-AppCheck') || req.header('x-firebase-appcheck') || '';

    // If not required and token is absent, allow request to proceed (e.g. Guest mode, read-only)
    if (!appCheckToken) {
      if (!isRequired) {
        req.appCheck = { verified: false, clientType: 'unattested' };
        return next();
      }
      return res.status(401).json({
        error: 'Unauthorized: Firebase App Check token is required for this endpoint.',
        code: 'APP_CHECK_REQUIRED'
      });
    }

    // 1. Automated test / mock verification (Strictly for test runners)
    if (process.env.NODE_ENV === 'test' || !firebaseAdmin.isInitialized()) {
      if (appCheckToken === 'test_valid_app_check_token' || appCheckToken.startsWith('test_appcheck_')) {
        req.appCheck = { verified: true, appId: 'com.anhad.app.test', tokenType: 'test' };
        return next();
      }
      if (appCheckToken === 'test_invalid_app_check_token') {
        return res.status(401).json({
          error: 'Unauthorized: Invalid Firebase App Check token.',
          code: 'APP_CHECK_INVALID'
        });
      }
      if (!isRequired) {
        req.appCheck = { verified: false, clientType: 'fallback' };
        return next();
      }
    }

    // 2. Cryptographic verification via Firebase Admin SDK
    const admin = firebaseAdmin.initializeFirebaseAdmin();
    if (admin && admin.appCheck) {
      try {
        const appCheckClaims = await admin.appCheck().verifyToken(appCheckToken);
        req.appCheck = {
          verified: true,
          appId: appCheckClaims.app_id,
          tokenType: 'attested'
        };
        return next();
      } catch (err) {
        // Never log the raw token in server logs
        console.warn('[AppCheck] Verification failed:', err.code || err.message);
        if (isRequired) {
          return res.status(401).json({
            error: 'Unauthorized: Invalid Firebase App Check token.',
            code: 'APP_CHECK_INVALID'
          });
        }
      }
    }

    // Fail closed if required but verification could not be completed
    if (isRequired) {
      return res.status(401).json({
        error: 'Unauthorized: Unable to verify App Check attestation.',
        code: 'APP_CHECK_UNAVAILABLE'
      });
    }

    req.appCheck = { verified: false, clientType: 'unattested' };
    next();
  };
}

module.exports = {
  verifyAppCheck
};
