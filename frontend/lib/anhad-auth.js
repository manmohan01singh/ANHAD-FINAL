/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD AUTHENTICATION & IDENTITY ARCHITECTURE v1.0
 * ═══════════════════════════════════════════════════════════════════════════════
 * Supports frictionless Guest mode by default with seamless Google Sign-In
 * and cross-device profile synchronization. Least-data principle compliant.
 */

(function(window) {
  'use strict';

  if (window.AnhadAuth) return;

  const PROFILE_KEY = 'anhad_user_profile';
  const GUEST_ID_KEY = 'anhad_guest_id';

  function getGuestId() {
    let id = localStorage.getItem(GUEST_ID_KEY);
    if (!id) {
      id = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(GUEST_ID_KEY, id);
    }
    return id;
  }

  function getProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          // Normalize isAnonymous and isGuest so they are always in sync
          const isAnon = parsed.isAnonymous !== undefined ? Boolean(parsed.isAnonymous) : (parsed.isGuest !== undefined ? Boolean(parsed.isGuest) : false);
          parsed.isAnonymous = isAnon;
          parsed.isGuest = isAnon;
          return parsed;
        }
      }
    } catch (e) {}

    const guestId = getGuestId();
    return {
      uid: guestId,
      displayName: 'Guest Sevadar',
      username: '',
      isAnonymous: true,
      isGuest: true,
      createdAt: new Date().toISOString(),
      privacy: {
        showOnLeaderboard: false,
        displayNameOnly: true
      }
    };
  }

  function setProfile(profile) {
    if (profile) {
      const isAnon = Boolean(profile.isAnonymous);
      profile.isAnonymous = isAnon;
      profile.isGuest = isAnon;
    }
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent('anhad_auth_changed', { detail: { profile } }));
    window.dispatchEvent(new CustomEvent('anhad_auth_state_changed', { detail: { profile } }));
  }

  function isAuthenticated() {
    const p = getProfile();
    return !p.isAnonymous && !p.isGuest && !!p.uid;
  }

  function isProfileComplete() {
    const p = getProfile();
    if (!isAuthenticated()) return false;
    const hasUsername = Boolean(p.username && p.username.trim().length >= 3);
    const hasDisplayName = Boolean(p.displayName && p.displayName.trim().length >= 2 && p.displayName !== 'Guest Sevadar');
    return hasUsername && hasDisplayName;
  }

  async function syncUserProfileWithBackend(profile) {
    if (!profile || profile.isAnonymous) return;
    try {
      let headers = { 'Content-Type': 'application/json' };
      const token = await getIdToken();
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      } else if (profile.uid) {
        headers['Authorization'] = 'Bearer ' + profile.uid;
      }
      await fetch('/api/user/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          uid: profile.uid,
          displayName: profile.displayName,
          username: profile.username || undefined,
          streak: profile.streak || 0,
          preferences: profile.privacy || {}
        })
      });
    } catch (e) {
      console.warn('[AnhadAuth] Profile backend sync note:', e.message);
    }
  }

  async function getIdToken(forceRefresh = false) {
    if (window.AnhadFirebase && typeof window.AnhadFirebase.getIdToken === 'function') {
      const token = await window.AnhadFirebase.getIdToken(forceRefresh);
      if (token) return token;
    }
    const profile = getProfile();
    return (!profile.isAnonymous && profile.idToken) ? profile.idToken : null;
  }

  async function signInWithGoogle(credentialToken) {
    try {
      let uid = null;
      let displayName = 'Gursikh';
      let email = null;
      let photoURL = null;
      let idToken = null;

      // 1. Try Firebase Web SDK Google Sign-In
      if (window.AnhadFirebase && typeof window.AnhadFirebase.signInWithGoogle === 'function' && !credentialToken) {
        const fbResult = await window.AnhadFirebase.signInWithGoogle();
        if (fbResult.ok && fbResult.user) {
          uid = fbResult.user.uid;
          displayName = fbResult.user.displayName || displayName;
          email = fbResult.user.email;
          photoURL = fbResult.user.photoURL;
          idToken = fbResult.idToken;
        } else if (fbResult.pendingRedirect) {
          return { ok: true, pendingRedirect: true };
        } else if (!fbResult.ok) {
          return {
            ok: false,
            error: fbResult.error || 'Google Sign-In failed',
            code: fbResult.code,
            isInvalidApiKey: fbResult.isInvalidApiKey
          };
        }
      }

      // 2. Direct credential token support (e.g. tests or One Tap)
      if (!uid && credentialToken) {
        uid = credentialToken.uid || ('user_' + Date.now());
        displayName = credentialToken.name || credentialToken.displayName || displayName;
        email = credentialToken.email || null;
        photoURL = credentialToken.picture || credentialToken.photoURL || null;
        idToken = credentialToken.idToken || ('token_' + Date.now());
      }

      // 3. Fallback mock if neither supplied
      if (!uid) {
        uid = 'user_' + Date.now();
      }

      // Preserve existing username if already saved on device
      const existing = getProfile();
      const existingUsername = (!existing.isAnonymous && existing.uid === uid) ? existing.username : '';

      const profile = {
        uid,
        displayName,
        username: existingUsername,
        email,
        photoURL,
        idToken,
        isAnonymous: false,
        isGuest: false,
        createdAt: existing.createdAt || new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        privacy: {
          showOnLeaderboard: true,
          displayNameOnly: true
        }
      };

      setProfile(profile);
      await syncUserProfileWithBackend(profile);

      return { ok: true, profile };
    } catch (err) {
      console.error('[AnhadAuth] Google Sign-in error:', err);
      return { ok: false, error: err.message };
    }
  }

  async function signInWithGoogleRedirect() {
    if (window.AnhadFirebase && typeof window.AnhadFirebase.signInWithGoogleRedirect === 'function') {
      return await window.AnhadFirebase.signInWithGoogleRedirect();
    }
    return { ok: false, error: 'Firebase redirect sign-in unavailable.' };
  }

  async function signInWithEmail(email, password) {
    if (!email || !password) {
      return { ok: false, error: 'Email and password are required.' };
    }
    try {
      if (window.AnhadFirebase && typeof window.AnhadFirebase.signInWithEmail === 'function') {
        const fbResult = await window.AnhadFirebase.signInWithEmail(email, password);
        if (!fbResult.ok) {
          return { ok: false, error: fbResult.error || 'Sign in failed.' };
        }
        const existing = getProfile();
        const profile = {
          uid: fbResult.user.uid,
          displayName: fbResult.user.displayName || 'Gursikh Sangat',
          username: existing.username || '',
          email: fbResult.user.email,
          photoURL: fbResult.user.photoURL,
          idToken: fbResult.idToken,
          isAnonymous: false,
          isGuest: false,
          createdAt: existing.createdAt || new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          privacy: {
            showOnLeaderboard: true,
            displayNameOnly: true
          }
        };
        setProfile(profile);
        await syncUserProfileWithBackend(profile);
        return { ok: true, profile };
      }
      return { ok: false, error: 'Firebase Auth is not available.' };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function signUpWithEmail(email, password, displayName) {
    if (!email || !password) {
      return { ok: false, error: 'Email and password are required.' };
    }
    try {
      if (window.AnhadFirebase && typeof window.AnhadFirebase.signUpWithEmail === 'function') {
        const fbResult = await window.AnhadFirebase.signUpWithEmail(email, password, displayName);
        if (!fbResult.ok) {
          return { ok: false, error: fbResult.error || 'Sign up failed.' };
        }
        const profile = {
          uid: fbResult.user.uid,
          displayName: displayName || fbResult.user.displayName || 'Gursikh Sangat',
          username: '',
          email: fbResult.user.email,
          photoURL: fbResult.user.photoURL,
          idToken: fbResult.idToken,
          isAnonymous: false,
          isGuest: false,
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          privacy: {
            showOnLeaderboard: true,
            displayNameOnly: true
          }
        };
        setProfile(profile);
        await syncUserProfileWithBackend(profile);
        return { ok: true, profile };
      }
      
      // Fallback dev account creation if Firebase Auth client is unconfigured
      const uid = 'dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const profile = {
        uid,
        displayName: displayName || 'Gursikh Sangat',
        username: '',
        email,
        photoURL: null,
        idToken: 'dev_token_' + uid,
        isAnonymous: false,
        isGuest: false,
        isDevAccount: true,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        privacy: { showOnLeaderboard: true, displayNameOnly: true }
      };
      setProfile(profile);
      await syncUserProfileWithBackend(profile);
      return { ok: true, profile };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function updateProfile(updates = {}) {
    const current = getProfile();
    const updated = {
      ...current,
      displayName: updates.displayName !== undefined ? updates.displayName.trim() : current.displayName,
      username: updates.username !== undefined ? updates.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') : current.username,
      lastActiveAt: new Date().toISOString()
    };
    setProfile(updated);
    await syncUserProfileWithBackend(updated);
    return updated;
  }

  async function signInWithDevAccount(customName, customEmail) {
    const existing = getProfile();
    const uid = 'dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const displayName = customName || 'Gursikh Sangat';
    const email = customEmail || 'sevadar@anhad.local';
    const profile = {
      uid,
      displayName,
      username: existing.username || '',
      email,
      photoURL: null,
      idToken: 'dev_token_' + Date.now(),
      isAnonymous: false,
      isGuest: false,
      isDevAccount: true,
      createdAt: existing.createdAt || new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      privacy: {
        showOnLeaderboard: true,
        displayNameOnly: true
      }
    };
    setProfile(profile);
    await syncUserProfileWithBackend(profile);
    return { ok: true, profile };
  }

  async function signOut() {
    if (window.AnhadFirebase && typeof window.AnhadFirebase.signOut === 'function') {
      try { await window.AnhadFirebase.signOut(); } catch (e) {}
    }
    localStorage.removeItem(PROFILE_KEY);
    const guestProfile = getProfile();
    window.dispatchEvent(new CustomEvent('anhad_auth_changed', { detail: { profile: guestProfile } }));
    window.dispatchEvent(new CustomEvent('anhad_auth_state_changed', { detail: { profile: guestProfile } }));
    return true;
  }

  function deleteAccount() {
    signOut();
    localStorage.removeItem(GUEST_ID_KEY);
    return true;
  }

  // Auto-sync when Firebase Auth finishes (e.g. after redirect or popup)
  if (typeof window !== 'undefined' && window.AnhadFirebase && typeof window.AnhadFirebase.onAuthStateChanged === 'function') {
    window.AnhadFirebase.onAuthStateChanged(async (fbUser) => {
      if (fbUser && !fbUser.isAnonymous) {
        const current = getProfile();
        if (current.isAnonymous || current.uid !== fbUser.uid) {
          try {
            const token = await fbUser.getIdToken();
            const updatedProfile = {
              ...current,
              uid: fbUser.uid,
              displayName: fbUser.displayName || current.displayName || 'Gursikh',
              email: fbUser.email || current.email,
              photoURL: fbUser.photoURL || current.photoURL,
              idToken: token,
              isAnonymous: false,
              isGuest: false,
              lastActiveAt: new Date().toISOString()
            };
            setProfile(updatedProfile);
            syncUserProfileWithBackend(updatedProfile);
          } catch (e) {
            console.warn('[AnhadAuth] Firebase state sync error:', e);
          }
        }
      }
    });
  }

  // Pre-sync stored authenticated profile with backend on startup
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      try {
        const p = getProfile();
        if (p && !p.isAnonymous && p.uid) {
          syncUserProfileWithBackend(p);
        }
      } catch (e) {}
    }, 500);
  }

  window.AnhadAuth = {
    getProfile,
    setProfile,
    isAuthenticated,
    isProfileComplete,
    signInWithGoogle,
    signInWithGoogleRedirect,
    signInWithEmail,
    signUpWithEmail,
    signInWithDevAccount,
    updateProfile,
    syncUserProfileWithBackend,
    getIdToken,
    signOut,
    deleteAccount,
    getGuestId
  };
})(typeof window !== 'undefined' ? window : globalThis);
