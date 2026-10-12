/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD CLIENT FIREBASE WEB INTEGRATION
 * ═══════════════════════════════════════════════════════════════════════════════
 * Production-grade Firebase Web client for:
 * - Web / PWA
 * - Capacitor Android & iOS
 * - Electron Desktop
 * 
 * Provides authenticated Google Sign-In, Firebase ID token retrieval,
 * and seamless fallback for frictionless Guest mode.
 */

(function(window) {
  'use strict';

  if (window.AnhadFirebase) return;

  const getStoredApiKey = () => {
    try {
      return window.ANHAD_FIREBASE_API_KEY || localStorage.getItem('anhad_firebase_api_key') || "AIzaSyB-E2ywcCux1nvoAUyPK58CESv2qID2esE";
    } catch(e) {
      return "AIzaSyB-E2ywcCux1nvoAUyPK58CESv2qID2esE";
    }
  };

  // Firebase Web Configuration for project: anhad-4bf78
  // NOTE: Firebase Web API key is an application identifier, not a server secret.
  const FIREBASE_CONFIG = {
    apiKey: getStoredApiKey(),
    authDomain: "anhad-4bf78.firebaseapp.com",
    projectId: "anhad-4bf78",
    storageBucket: "anhad-4bf78.firebasestorage.app",
    messagingSenderId: "447388316124",
    appId: "1:447388316124:web:5eea6006bea62df6dc5f19",
    measurementId: "G-2KV59GB5XT"
  };

  let app = null;
  let auth = null;
  let currentUser = null;
  let cachedIdToken = null;
  let tokenExpiry = 0;
  const authListeners = new Set();

  function init() {
    try {
      if (window.firebase && window.firebase.apps && !app) {
        if (!window.firebase.apps.length) {
          app = window.firebase.initializeApp(FIREBASE_CONFIG);
        } else {
          app = window.firebase.app();
        }
        if (window.firebase.auth) {
          auth = window.firebase.auth();
          if (typeof auth.getRedirectResult === 'function') {
            auth.getRedirectResult().then(res => {
              if (res && res.user) {
                console.log('[AnhadFirebase] Redirect sign-in success for user:', res.user.uid);
                currentUser = res.user;
                res.user.getIdToken().then(t => {
                  cachedIdToken = t;
                  tokenExpiry = Date.now() + 55 * 60 * 1000;
                  authListeners.forEach(cb => {
                    try { cb(res.user); } catch (e) { console.error(e); }
                  });
                });
              }
            }).catch(redirectErr => {
              if (redirectErr.code && redirectErr.code !== 'auth/null-user') {
                console.warn('[AnhadFirebase] Redirect result notice:', redirectErr.message);
              }
            });
          }
          auth.onAuthStateChanged(user => {
            currentUser = user;
            if (user) {
              user.getIdToken().then(t => {
                cachedIdToken = t;
                tokenExpiry = Date.now() + 55 * 60 * 1000;
              });
            } else {
              cachedIdToken = null;
              tokenExpiry = 0;
            }
            authListeners.forEach(cb => {
              try { cb(user); } catch (e) { console.error('[AnhadFirebase] Listener error:', e); }
            });
          });
        }
        console.log('[AnhadFirebase] Firebase Web SDK initialized for project:', FIREBASE_CONFIG.projectId);
      }
    } catch (err) {
      console.warn('[AnhadFirebase] SDK initialization note:', err.message);
    }
  }

  /**
   * Get the current user's fresh Firebase ID Token.
   * Returns null if unauthenticated (Guest mode).
   */
  async function getIdToken(forceRefresh = false) {
    if (!auth || !auth.currentUser) {
      // Check if user has cached test/mock token
      return null;
    }

    try {
      if (!forceRefresh && cachedIdToken && Date.now() < tokenExpiry) {
        return cachedIdToken;
      }
      const token = await auth.currentUser.getIdToken(forceRefresh);
      cachedIdToken = token;
      tokenExpiry = Date.now() + 55 * 60 * 1000;
      return token;
    } catch (err) {
      console.warn('[AnhadFirebase] Failed to fetch ID token:', err.message);
      return null;
    }
  }

  /**
   * Perform Google Sign-In with popup or redirect.
   * Works on Desktop, PWA, and WebView.
   */
  /**
   * Perform Google Sign-In with full-page redirect (no popups needed).
   */
  async function signInWithGoogleRedirect() {
    if (!auth) {
      init();
    }
    if (auth && window.firebase && window.firebase.auth) {
      const provider = new window.firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      try {
        await auth.signInWithRedirect(provider);
        return { ok: true, pendingRedirect: true };
      } catch (err) {
        console.error('[AnhadFirebase] Redirect error:', err);
        return { ok: false, error: err.message, code: err.code };
      }
    }
    return { ok: false, error: 'Firebase Auth is not ready.' };
  }

  async function signInWithGoogle() {
    if (!auth) {
      init();
    }

    if (auth && window.firebase && window.firebase.auth) {
      const provider = new window.firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');

      try {
        // Prefer popup on desktop/PWA; fallback to redirect if popup fails or on mobile
        let result;
        try {
          result = await auth.signInWithPopup(provider);
        } catch (popupErr) {
          if (popupErr.code === 'auth/popup-blocked' || 
              popupErr.code === 'auth/cancelled-popup-request' ||
              popupErr.code === 'auth/popup-closed-by-user') {
            console.log('[AnhadFirebase] Popup note (' + popupErr.code + '). Setting canUseRedirect.');
            return {
              ok: false,
              code: popupErr.code,
              error: popupErr.code === 'auth/popup-closed-by-user'
                ? 'Sign-in popup was closed before finalizing.'
                : 'Sign-in popup was blocked by browser.',
              canUseRedirect: true
            };
          }
          throw popupErr;
        }

        const user = result.user;
        const token = await user.getIdToken();
        cachedIdToken = token;
        tokenExpiry = Date.now() + 55 * 60 * 1000;

        return {
          ok: true,
          user: {
            uid: user.uid,
            displayName: user.displayName || 'Gursikh Sangat',
            email: user.email,
            photoURL: user.photoURL
          },
          idToken: token
        };
      } catch (err) {
        console.error('[AnhadFirebase] Google Sign-In error:', err);
        const isInvalidKey = err.code === 'auth/api-key-not-valid' || 
                             err.code === 'auth/invalid-api-key' ||
                             (err.message && err.message.includes('api-key-not-valid'));
        if (err.code === 'auth/unauthorized-domain') {
          const host = (typeof window !== 'undefined' && window.location && window.location.hostname) || 'your domain';
          return {
            ok: false,
            code: 'auth/unauthorized-domain',
            error: `Domain "${host}" is not authorized in Firebase Console. Please add "${host}" to Firebase Console ➔ Authentication ➔ Settings ➔ Authorized domains.`,
            isUnauthorizedDomain: true,
            domain: host
          };
        }
        return {
          ok: false,
          error: isInvalidKey 
            ? 'Firebase Web API key is not valid or not yet configured for project anhad-4bf78.' 
            : (err.message || 'Google Sign-In failed'),
          code: err.code,
          isInvalidApiKey: isInvalidKey
        };
      }

    }

    // Fallback if full SDK script has not finished loading
    console.warn('[AnhadFirebase] Firebase Web SDK script not yet loaded. Using secure client bridge.');
    return { ok: false, error: 'Firebase Auth is initializing or offline.' };
  }

  async function signOut() {
    cachedIdToken = null;
    tokenExpiry = 0;
    currentUser = null;
    if (auth) {
      try {
        await auth.signOut();
      } catch (e) {
        console.warn('[AnhadFirebase] Sign out error:', e);
      }
    }
    return true;
  }

  function onAuthStateChanged(callback) {
    authListeners.add(callback);
    if (currentUser !== null) {
      callback(currentUser);
    }
    return () => authListeners.delete(callback);
  }

  /**
   * Sign in with Email and Password.
   */
  async function signInWithEmail(email, password) {
    if (!auth) {
      init();
    }
    if (auth && window.firebase && window.firebase.auth) {
      try {
        const result = await auth.signInWithEmailAndPassword(email, password);
        const user = result.user;
        const token = await user.getIdToken();
        cachedIdToken = token;
        tokenExpiry = Date.now() + 55 * 60 * 1000;
        return {
          ok: true,
          user: {
            uid: user.uid,
            displayName: user.displayName || 'Gursikh Sangat',
            email: user.email,
            photoURL: user.photoURL
          },
          idToken: token
        };
      } catch (err) {
        return { ok: false, error: err.message, code: err.code };
      }
    }
    return { ok: false, error: 'Firebase Auth is initializing or offline.' };
  }

  /**
   * Create account with Email and Password.
   */
  async function signUpWithEmail(email, password, displayName) {
    if (!auth) {
      init();
    }
    if (auth && window.firebase && window.firebase.auth) {
      try {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        const user = result.user;
        if (displayName && user.updateProfile) {
          try {
            await user.updateProfile({ displayName });
          } catch (e) {}
        }
        const token = await user.getIdToken();
        cachedIdToken = token;
        tokenExpiry = Date.now() + 55 * 60 * 1000;
        return {
          ok: true,
          user: {
            uid: user.uid,
            displayName: displayName || user.displayName || 'Gursikh Sangat',
            email: user.email,
            photoURL: user.photoURL
          },
          idToken: token
        };
      } catch (err) {
        return { ok: false, error: err.message, code: err.code };
      }
    }
    return { ok: false, error: 'Firebase Auth is initializing or offline.' };
  }

  function setApiKey(newKey) {
    if (!newKey || typeof newKey !== 'string') return false;
    const clean = newKey.trim();
    if (clean === FIREBASE_CONFIG.apiKey && app) return true;
    try { localStorage.setItem('anhad_firebase_api_key', clean); } catch (e) {}
    window.ANHAD_FIREBASE_API_KEY = clean;
    FIREBASE_CONFIG.apiKey = clean;
    if (window.firebase && window.firebase.apps && window.firebase.apps.length) {
      try {
        const current = window.firebase.app();
        if (current && typeof current.delete === 'function') {
          current.delete().then(() => {
            app = null;
            auth = null;
            init();
          }).catch(() => { init(); });
          return true;
        }
      } catch(e) {}
    }
    init();
    return true;
  }


  const AnhadFirebase = {
    init,
    signInWithGoogle,
    signInWithGoogleRedirect,
    signInWithEmail,
    signUpWithEmail,
    getIdToken,
    signOut,
    onAuthStateChanged,
    setApiKey,
    getConfig: () => ({ ...FIREBASE_CONFIG }),
    getCurrentUser: () => currentUser || (auth ? auth.currentUser : null)
  };

  // Attempt auto-init
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  window.AnhadFirebase = AnhadFirebase;
})(typeof window !== 'undefined' ? window : globalThis);
