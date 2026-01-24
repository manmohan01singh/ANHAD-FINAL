// lib/banidb.ts

const BANIDB_API_BASE = 'https://api.banidb.com/v2';

export interface GurbaniLine {
  lineNo: number;
  gurmukhi: string;
  transliteration: string;
  translation: {
    english: string;
    punjabi?: string;
    spanish?: string;
  };
  shabadId: number;
  pageNo: number;
  lineId: number;
  firstLetters: string;
  vishraam?: {
    spiType: string;
    position: number;
  }[];
}

export interface AngResponse {
  pageNo: number;
  source: {
    sourceId: string;
    gurmukhi: string;
    english: string;
    pageNo: number;
  };
  totalPages: number;
  page: GurbaniLine[];
}

// Cache for storing fetched Angs
const angCache = new Map<number, AngResponse>();

// Fetch single Ang from BaniDB
export async function fetchAng(angNumber: number): Promise<AngResponse> {
  // Check cache first
  if (angCache.has(angNumber)) {
    return angCache.get(angNumber)!;
  }
  
  // Check IndexedDB cache
  const cachedAng = await getAngFromDB(angNumber);
  if (cachedAng) {
    angCache.set(angNumber, cachedAng);
    return cachedAng;
  }
  
  // Fetch from API
  try {
    const response = await fetch(
      `${BANIDB_API_BASE}/angs/${angNumber}/G`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Ang ${angNumber}`);
    }
    
    const data: AngResponse = await response.json();
    
    // Cache in memory
    angCache.set(angNumber, data);
    
    // Cache in IndexedDB for offline
    await saveAngToDB(data);
    
    // Prefetch adjacent Angs
    prefetchAdjacentAngs(angNumber);
    
    return data;
  } catch (error) {
    console.error('BaniDB API Error:', error);
    throw error;
  }
}

// Prefetch adjacent Angs for smooth navigation
async function prefetchAdjacentAngs(currentAng: number) {
  const angsToPrefetch = [
    currentAng - 1,
    currentAng + 1,
    currentAng + 2,
  ].filter(ang => ang >= 1 && ang <= 1430);
  
  for (const ang of angsToPrefetch) {
    if (!angCache.has(ang)) {
      // Fetch in background without blocking
      fetchAng(ang).catch(() => {});
    }
  }
}

// IndexedDB operations
const DB_NAME = 'SehajPaathDB';
const DB_VERSION = 1;
const STORE_NAME = 'angs';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'pageNo' });
      }
    };
  });
}

async function getAngFromDB(angNumber: number): Promise<AngResponse | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(angNumber);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch {
    return null;
  }
}

async function saveAngToDB(ang: AngResponse): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(ang);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('Failed to cache Ang:', error);
  }
}

// Search within SGGS
export async function searchGurbani(query: string, type: 'firstLetter' | 'gurmukhi' | 'english' = 'gurmukhi') {
  const response = await fetch(
    `${BANIDB_API_BASE}/search/${encodeURIComponent(query)}?type=${type}&source=G`,
    {
      headers: { 'Accept': 'application/json' },
    }
  );
  
  if (!response.ok) throw new Error('Search failed');
  return response.json();
}

// Get random Hukamnama
export async function getRandomHukam(): Promise<AngResponse> {
  const randomAng = Math.floor(Math.random() * 1430) + 1;
  return fetchAng(randomAng);
}
