// ═══════════════════════════════════════════════════════════════════════════════
// ANHAD Backend - Cloudflare Worker
// Replaces Express server with edge-deployed serverless functions
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════
const CONFIG = {
  R2_BASE_URL: 'https://pub-525228169e0c44e38a67c306ba1a458c.r2.dev',
  BANIDB_BASE_URL: 'https://api.banidb.com/v2',
  HUKAMNAMA_URL: 'https://api.banidb.com/v2/hukamnamas/today',
  EPOCH: 1704067200000, // Jan 1, 2024 - Virtual Live epoch
  DEFAULT_TRACK_DURATION: 3600, // 1 hour fallback
  TOTAL_TRACKS: 40,
};

// ═══════════════════════════════════════════════════════════════════════════════
// PLAYLIST DATA (40 tracks)
// ═══════════════════════════════════════════════════════════════════════════════
const PLAYLIST = [
  { title: 'Amritvela Simran', artist: 'Bhai Joginder Singh', duration: 3600, filename: 'day-1.webm' },
  { title: 'Asa Di Var', artist: 'Bhai Harjinder Singh', duration: 3600, filename: 'day-2.webm' },
  { title: 'Japji Sahib Kirtan', artist: 'Bhai Balbir Singh', duration: 3600, filename: 'day-3.webm' },
  { title: 'Anand Sahib', artist: 'Bhai Joginder Singh', duration: 3600, filename: 'day-4.webm' },
  { title: 'Rehraas Sahib', artist: 'Bhai Harjinder Singh', duration: 3600, filename: 'day-5.webm' },
  { title: 'Kirtan Sohila', artist: 'Bhai Balbir Singh', duration: 3600, filename: 'day-6.webm' },
  { title: 'Sukhmani Sahib', artist: 'Bhai Joginder Singh', duration: 3600, filename: 'day-7.webm' },
  { title: 'Basant Ki Var', artist: 'Bhai Harjinder Singh', duration: 3600, filename: 'day-8.webm' },
  { title: 'Todi Mahalla 1', artist: 'Bhai Balbir Singh', duration: 3600, filename: 'day-9.webm' },
  { title: 'Gauri Mahalla 5', artist: 'Bhai Joginder Singh', duration: 3600, filename: 'day-10.webm' },
  { title: 'Asa Mahalla 1', artist: 'Bhai Harjinder Singh', duration: 3600, filename: 'day-11.webm' },
  { title: 'Gujri Mahalla 3', artist: 'Bhai Balbir Singh', duration: 3600, filename: 'day-12.webm' },
  { title: 'Sri Mahalla 1', artist: 'Bhai Joginder Singh', duration: 3600, filename: 'day-13.webm' },
  { title: 'Majh Mahalla 1', artist: 'Bhai Harjinder Singh', duration: 3600, filename: 'day-14.webm' },
  { title: 'Gauri Sukhmani', artist: 'Bhai Balbir Singh', duration: 3600, filename: 'day-15.webm' },
  { title: 'Asa Ki Var', artist: 'Bhai Joginder Singh', duration: 3600, filename: 'day-16.webm' },
  { title: 'Tilang Mahalla 5', artist: 'Bhai Harjinder Singh', duration: 3600, filename: 'day-17.webm' },
  { title: 'Suhi Mahalla 5', artist: 'Bhai Balbir Singh', duration: 3600, filename: 'day-18.webm' },
  { title: 'Bilaval Mahalla 5', artist: 'Bhai Joginder Singh', duration: 3600, filename: 'day-19.webm' },
  { title: 'Gond Mahalla 5', artist: 'Bhai Harjinder Singh', duration: 3600, filename: 'day-20.webm' },
  { title: 'Ramkali Mahalla 5', artist: 'Bhai Balbir Singh', duration: 3600, filename: 'day-21.webm' },
  { title: 'Nat Narayan', artist: 'Bhai Joginder Singh', duration: 3600, filename: 'day-22.webm' },
  { title: 'Maajh Mahalla 5', artist: 'Bhai Harjinder Singh', duration: 3600, filename: 'day-23.webm' },
  { title: 'Dhanasri Mahalla 5', artist: 'Bhai Balbir Singh', duration: 3600, filename: 'day-24.webm' },
  { title: 'Sarang Mahalla 5', artist: 'Bhai Joginder Singh', duration: 3600, filename: 'day-25.webm' },
  { title: 'Malar Mahalla 5', artist: 'Bhai Harjinder Singh', duration: 3600, filename: 'day-26.webm' },
  { title: 'Kalyan Mahalla 5', artist: 'Bhai Balbir Singh', duration: 3600, filename: 'day-27.webm' },
  { title: 'Vadhans Mahalla 5', artist: 'Bhai Joginder Singh', duration: 3600, filename: 'day-28.webm' },
  { title: 'Bhairav Mahalla 5', artist: 'Bhai Harjinder Singh', duration: 3600, filename: 'day-29.webm' },
  { title: 'Bhairon Mahalla 5', artist: 'Bhai Balbir Singh', duration: 3600, filename: 'day-30.webm' },
  { title: 'Asavari Mahalla 5', artist: 'Bhai Joginder Singh', duration: 3600, filename: 'day-31.webm' },
  { title: 'Devgandhari', artist: 'Bhai Harjinder Singh', duration: 3600, filename: 'day-32.webm' },
  { title: 'Jaijaiwanti', artist: 'Bhai Balbir Singh', duration: 3600, filename: 'day-33.webm' },
  { title: 'Tukhari', artist: 'Bhai Joginder Singh', duration: 3600, filename: 'day-34.webm' },
  { title: 'Kedara', artist: 'Bhai Harjinder Singh', duration: 3600, filename: 'day-35.webm' },
  { title: 'Jaitsri', artist: 'Bhai Balbir Singh', duration: 3600, filename: 'day-36.webm' },
  { title: 'Tilang Ki傅', artist: 'Bhai Joginder Singh', duration: 3600, filename: 'day-37.webm' },
  { title: 'Raagmala', artist: 'Bhai Harjinder Singh', duration: 3600, filename: 'day-38.webm' },
  { title: 'Simran Meditation', artist: 'Bhai Balbir Singh', duration: 3600, filename: 'day-39.webm' },
  { title: 'Amritvela Special', artist: 'Bhai Joginder Singh', duration: 3600, filename: 'day-40.webm' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════
function getTotalPlaylistDuration() {
  return PLAYLIST.reduce((acc, track) => acc + (track.duration || CONFIG.DEFAULT_TRACK_DURATION), 0);
}

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Mulberry32 PRNG - EXACT match to server.js regenerateShuffleOrder
function mulberry32(seed) {
  return function() {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function regenerateShuffleOrder(cycle, epoch) {
  const order = Array.from({ length: PLAYLIST.length }, (_, i) => i);
  const seed = (epoch || 0) + cycle * 2654435761;
  const rng = mulberry32(seed);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIRTUAL LIVE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
// Virtual Live with persistent epoch (loads from KV like radio-state.json)
async function getLiveEpoch(env) {
  // Try to load existing epoch from KV (like radio-state.json)
  if (env.CACHE) {
    try {
      const saved = await env.CACHE.get('radio:epoch');
      if (saved) {
        return parseInt(saved, 10);
      }
    } catch (e) {
      // KV miss, use fallback
    }
  }
  // Return fallback epoch (same as original server.js fallback)
  return 1704067200000; // Jan 1, 2024
}

async function getCurrentLivePosition(env) {
  const now = Date.now();
  const epoch = await getLiveEpoch(env);
  const elapsedMs = now - epoch;
  const elapsedSeconds = elapsedMs / 1000;
  const totalPlaylistDuration = getTotalPlaylistDuration();
  const cycle = Math.floor(elapsedSeconds / totalPlaylistDuration);
  const positionInPlaylist = ((elapsedSeconds % totalPlaylistDuration) + totalPlaylistDuration) % totalPlaylistDuration;
  const shuffleOrder = regenerateShuffleOrder(cycle, epoch);

  let accumulated = 0;
  for (let i = 0; i < PLAYLIST.length; i++) {
    const actualTrackIndex = shuffleOrder[i];
    const trackDuration = PLAYLIST[actualTrackIndex].duration || CONFIG.DEFAULT_TRACK_DURATION;
    if (accumulated + trackDuration > positionInPlaylist) {
      const trackPosition = positionInPlaylist - accumulated;
      return {
        trackIndex: actualTrackIndex,
        shufflePosition: i,
        trackPosition: Math.max(0, trackPosition),
        totalElapsed: elapsedSeconds,
        playlistDuration: totalPlaylistDuration,
        playlistCycle: cycle,
        trackFilename: PLAYLIST[actualTrackIndex].filename,
        serverTime: now,
      };
    }
    accumulated += trackDuration;
  }

  return {
    trackIndex: 0,
    shufflePosition: 0,
    trackPosition: 0,
    totalElapsed: elapsedSeconds,
    playlistDuration: totalPlaylistDuration,
    playlistCycle: cycle,
    trackFilename: PLAYLIST[0].filename,
    serverTime: now,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORS HEADERS
// ═══════════════════════════════════════════════════════════════════════════════
function getCorsHeaders(origin) {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://anhadnaam.vercel.app',
    'https://anhad.vercel.app',
    'https://anhad.pages.dev',
  ];
  
  const corsOrigin = (!origin || allowedOrigins.includes(origin)) ? origin || '*' : allowedOrigins[0];
  
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json',
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// API ROUTE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

// Ping/Health check
async function handlePing(request) {
  return new Response(JSON.stringify({ 
    status: 'ok', 
    timestamp: Date.now(),
    service: 'ANHAD Backend',
  }), {
    headers: getCorsHeaders(request.headers.get('origin')),
  });
}

// Radio Live - Current track position
async function handleRadioLive(request, env) {
  const livePos = await getCurrentLivePosition(env);
  const track = PLAYLIST[livePos.trackIndex];
  
  return new Response(JSON.stringify({
    trackIndex: livePos.trackIndex,
    trackPosition: Math.round(livePos.trackPosition * 100) / 100,
    trackFilename: track.filename,
    title: track.title,
    artist: track.artist,
    playlistCycle: livePos.playlistCycle,
    serverTime: livePos.serverTime,
    trackUrl: `${CONFIG.R2_BASE_URL}/${track.filename}`,
  }), {
    headers: getCorsHeaders(request.headers.get('origin')),
  });
}

// Radio Status - Full broadcast info
async function handleRadioStatus(request, env) {
  const livePos = await getCurrentLivePosition(env);
  const track = PLAYLIST[livePos.trackIndex];
  
  return new Response(JSON.stringify({
    status: 'broadcasting',
    epoch: CONFIG.EPOCH,
    epochDate: new Date(CONFIG.EPOCH).toISOString(),
    uptime: formatTime(livePos.totalElapsed),
    currentTrack: {
      index: livePos.trackIndex,
      title: track.title,
      artist: track.artist,
      position: formatTime(livePos.trackPosition),
      duration: formatTime(track.duration || CONFIG.DEFAULT_TRACK_DURATION),
    },
    playlist: {
      totalTracks: PLAYLIST.length,
      totalDuration: formatTime(livePos.playlistDuration),
      cycle: livePos.playlistCycle,
    },
    serverTime: new Date().toISOString(),
  }), {
    headers: getCorsHeaders(request.headers.get('origin')),
  });
}

// BaniDB Proxy - Forward requests with caching
async function handleBaniDB(request, env) {
  const url = new URL(request.url);
  const banidbPath = url.pathname.replace('/api/banidb', '');
  const queryString = url.search;
  const targetUrl = `${CONFIG.BANIDB_BASE_URL}${banidbPath}${queryString}`;
  
  // Try KV cache first for GET requests
  if (request.method === 'GET' && env.CACHE) {
    const cacheKey = `banidb:${banidbPath}${queryString}`;
    try {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        return new Response(cached, {
          headers: {
            ...getCorsHeaders(request.headers.get('origin')),
            'X-Cache': 'HIT',
          },
        });
      }
    } catch (e) {
      // Cache miss or error, proceed to fetch
    }
  }
  
  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ANHAD-Gurbani-App/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`BaniDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    const responseBody = JSON.stringify(data);
    
    // Cache successful GET responses
    if (request.method === 'GET' && env.CACHE) {
      const cacheKey = `banidb:${banidbPath}${queryString}`;
      try {
        // Cache for 1 hour (3600 seconds)
        await env.CACHE.put(cacheKey, responseBody, { expirationTtl: 3600 });
      } catch (e) {
        // Cache write error, ignore
      }
    }
    
    return new Response(responseBody, {
      headers: {
        ...getCorsHeaders(request.headers.get('origin')),
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch from BaniDB',
      message: error.message,
    }), {
      status: 500,
      headers: getCorsHeaders(request.headers.get('origin')),
    });
  }
}

// Hukamnama - Today hukamnama with caching
async function handleHukamnama(request, env) {
  const cacheKey = 'hukamnama:today';
  
  // Try KV cache first
  if (env.CACHE) {
    try {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        return new Response(cached, {
          headers: {
            ...getCorsHeaders(request.headers.get('origin')),
            'X-Cache': 'HIT',
          },
        });
      }
    } catch (e) {
      // Cache miss
    }
  }
  
  try {
    const response = await fetch(CONFIG.HUKAMNAMA_URL, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ANHAD-Gurbani-App/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Hukamnama API error: ${response.status}`);
    }
    
    const data = await response.json();
    const responseBody = JSON.stringify(data);
    
    // Cache for 6 hours (21600 seconds)
    if (env.CACHE) {
      try {
        await env.CACHE.put(cacheKey, responseBody, { expirationTtl: 21600 });
      } catch (e) {
        // Cache write error, ignore
      }
    }
    
    return new Response(responseBody, {
      headers: {
        ...getCorsHeaders(request.headers.get('origin')),
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch Hukamnama',
      message: error.message,
    }), {
      status: 500,
      headers: getCorsHeaders(request.headers.get('origin')),
    });
  }
}

// Audio Stream - Redirect to R2 (no bandwidth cost)
async function handleAudio(request) {
  const url = new URL(request.url);
  const filename = url.pathname.split('/').pop();
  
  if (!/^day-\d{1,2}\.webm$/.test(filename)) {
    return new Response(JSON.stringify({ error: 'Invalid audio filename' }), {
      status: 400,
      headers: getCorsHeaders(request.headers.get('origin')),
    });
  }
  
  // Redirect to R2 - zero bandwidth cost for us
  const r2Url = `${CONFIG.R2_BASE_URL}/${filename}`;
  
  return Response.redirect(r2Url, 302);
}

// Tracks list
async function handleTracks(request) {
  return new Response(JSON.stringify({
    tracks: PLAYLIST,
    baseUrl: CONFIG.R2_BASE_URL,
    totalDuration: getTotalPlaylistDuration(),
  }), {
    headers: getCorsHeaders(request.headers.get('origin')),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN WORKER EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const origin = request.headers.get('origin');
    
    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(origin),
      });
    }
    
    // Route matching
    try {
      // Health/Ping
      if (pathname === '/ping' || pathname === '/health') {
        return handlePing(request);
      }
      
      // Radio APIs
      if (pathname === '/api/radio/live') {
        return handleRadioLive(request);
      }
      
      if (pathname === '/api/radio/status') {
        return handleRadioStatus(request);
      }
      
      if (pathname === '/api/tracks') {
        return handleTracks(request);
      }
      
      // Hukamnama
      if (pathname === '/api/hukamnama' || pathname === '/hukamnama') {
        return handleHukamnama(request, env);
      }
      
      // BaniDB Proxy
      if (pathname.startsWith('/api/banidb')) {
        return handleBaniDB(request, env);
      }
      
      // Audio redirect
      if (pathname.startsWith('/audio/')) {
        return handleAudio(request);
      }
      
      // R2 test
      if (pathname === '/test-r2') {
        return new Response(JSON.stringify({
          success: true,
          r2Url: CONFIG.R2_BASE_URL,
          message: 'R2 bucket configured',
        }), {
          headers: getCorsHeaders(origin),
        });
      }
      
      // 404 Not Found
      return new Response(JSON.stringify({
        error: 'Not Found',
        path: pathname,
        available: [
          '/ping',
          '/api/radio/live',
          '/api/radio/status',
          '/api/tracks',
          '/api/hukamnama',
          '/api/banidb/*',
          '/audio/*',
        ],
      }), {
        status: 404,
        headers: getCorsHeaders(origin),
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
      }), {
        status: 500,
        headers: getCorsHeaders(origin),
      });
    }
  },
};
