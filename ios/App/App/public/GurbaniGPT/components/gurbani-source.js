const LOCAL_API = 'http://localhost:3001/v2';
const PUBLIC_API = 'https://api.banidb.com/v2';
const CORS_PROXY = 'https://corsproxy.io/?';
const OFFLINE_CACHE_KEY = 'gurbanigpt_offline_verse';

function corsUrl(url) {
  return CORS_PROXY + encodeURIComponent(url);
}

// Use public API first; CORS proxy as fallback.
// Local API (localhost:3001) is skipped because it requires
// a separate database setup that most users won't have.
const API_ORDER = [PUBLIC_API];

class GurbaniSource {
  constructor() {
    this._cache = new Map();
    this._sessionVerses = [];
  }

  _cacheKey() {
    return Array.from(arguments).join(':');
  }

  _cached(key, ttl) {
    const entry = this._cache.get(key);
    if (entry && Date.now() - entry.ts < ttl) return entry.data;
    return null;
  }

  _setCache(key, data) {
    if (this._cache.size >= 200) {
      const first = this._cache.keys().next().value;
      this._cache.delete(first);
    }
    this._cache.set(key, { data, ts: Date.now() });
  }

  async _fetch(path) {
    const bases = API_ORDER;
    const errors = [];
    for (const base of bases) {
      try {
        const url = `${base}${path}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (res.ok) return await res.json();
        errors.push(`${url}: ${res.status}`);
      } catch (e) {
        errors.push(`${base}: ${e.message}`);
        continue;
      }
    }

    // Fallback: try CORS proxy with public API
    try {
      const proxyUrl = corsUrl(`${PUBLIC_API}${path}`);
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return await res.json();
    } catch {
    }

    return null;
  }

  async getRandomVerse(sourceId) {
    sourceId = sourceId || 'G';
    const cacheKey = this._cacheKey('random', sourceId);
    const cached = this._cached(cacheKey, 120000);
    const verses = cached || await this._fetchRandom(sourceId, cacheKey);
    if (!verses || verses.length === 0) return null;
    return this._pickUnique(verses);
  }

  async _fetchRandom(sourceId, cacheKey) {
    const data = await this._fetch(`/random/${sourceId}`);
    if (data && data.verses) {
      this._setCache(cacheKey, data.verses);
      return data.verses;
    }
    return null;
  }

  _pickUnique(verses) {
    const available = verses.filter(function(v) { return !this._sessionVerses.includes(v.verseId || v.verseId); }, this);
    const pool = available.length > 0 ? available : verses;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick && pick.verseId) {
      this._sessionVerses.push(pick.verseId);
      if (this._sessionVerses.length > 50) this._sessionVerses.shift();
    }
    return this._normalizeVerse(pick);
  }

  async search(query, type, source) {
    type = type !== undefined ? type : 3;
    const cacheKey = this._cacheKey('search', query, type, source || '');
    const cached = this._cached(cacheKey);
    if (cached) return cached;

    let path = '/search/' + encodeURIComponent(query) + '?searchtype=' + type + '&results=15';
    if (source) path += '&source=' + source;
    const data = await this._fetch(path);
    const verses = data && data.verses ? data.verses.map(this._normalizeVerse.bind(this)) : [];
    this._setCache(cacheKey, verses);
    return verses;
  }

  async getShabad(shabadId) {
    if (!shabadId) return null;
    const cacheKey = this._cacheKey('shabad', shabadId);
    const cached = this._cached(cacheKey);
    if (cached) return cached;

    const data = await this._fetch('/shabads/' + shabadId);
    if (!data) return null;
    this._setCache(cacheKey, data);
    return data;
  }

  async getHukamnama() {
    const cacheKey = this._cacheKey('hukamnama');
    const cached = this._cached(cacheKey, 300000);
    if (cached) return cached;

    const data = await this._fetch('/hukamnamas');
    if (!data) return null;
    this._setCache(cacheKey, data, 300000);
    return data;
  }

  _normalizeVerse(v) {
    if (!v) return null;
    return {
      verseId: v.verseId,
      shabadId: v.shabadId,
      unicode: v.verse ? v.verse.unicode || '' : '',
      gurmukhi: v.verse ? v.verse.gurmukhi || '' : '',
      english: v.translation ? v.translation.en ? v.translation.en.bdb || v.translation.en.ms || '' : '' : '',
      punjabi: v.translation ? v.translation.pu ? v.translation.pu.bdb ? v.translation.pu.bdb.unicode || '' : v.translation.pu.ss ? v.translation.pu.ss.unicode || '' : '' : '' : '',
      pageNo: v.pageNo,
      lineNo: v.lineNo,
      writer: v.writer ? v.writer.english || '' : '',
      writerGurmukhi: v.writer ? v.writer.gurmukhi || v.writer.unicode || '' : '',
      source: v.source ? v.source.english || '' : '',
      sourceGurmukhi: v.source ? v.source.unicode || v.source.gurmukhi || '' : '',
    };
  }

  clearSession() {
    this._cache.clear();
    this._sessionVerses = [];
  }

  cacheLastVerse(verse) {
    if (!verse) return;
    try {
      localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(verse));
    } catch {}
  }

  getCachedVerse() {
    try {
      const d = localStorage.getItem(OFFLINE_CACHE_KEY);
      return d ? JSON.parse(d) : null;
    } catch { return null; }
  }

  clearOfflineCache() {
    try { localStorage.removeItem(OFFLINE_CACHE_KEY); } catch {}
  }
}

export function initGurbaniSource() {
  return new GurbaniSource();
}
