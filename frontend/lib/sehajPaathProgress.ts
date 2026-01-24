// lib/sehajPaathProgress.ts

export interface ReadingSession {
  date: string; // ISO date string
  startAng: number;
  endAng: number;
  duration: number; // minutes
  completed: boolean;
}

export interface SehajPaathProgress {
  currentAng: number;
  lastReadDate: string;
  startDate: string;
  completedAngs: number[];
  totalReadingTime: number; // minutes
  sessions: ReadingSession[];
  bookmarks: Bookmark[];
  settings: ReaderSettings;
  streak: {
    current: number;
    longest: number;
    lastDate: string;
  };
  completions: number; // times completed full SGGS
}

export interface Bookmark {
  id: string;
  angNumber: number;
  lineNumber?: number;
  name: string;
  createdAt: string;
  color: string;
}

export interface ReaderSettings {
  theme: 'light' | 'dark' | 'sepia' | 'night';
  fontSize: number; // 16-40
  fontFamily: 'noto' | 'raaj' | 'anmol';
  script: 'gurmukhi' | 'roman' | 'both';
  showTranslation: boolean;
  translationLang: 'english' | 'punjabi' | 'spanish';
  larivaar: boolean;
  larivaarAssist: boolean; // highlights word boundaries
  vishraam: boolean; // show pause marks
  autoScroll: boolean;
  autoScrollSpeed: number; // 1-10
  screenAwake: boolean;
  dailyGoal: number; // Angs per day
  reminderEnabled: boolean;
  reminderTime: string; // HH:MM
}

const STORAGE_KEY = 'sehaj_paath_progress';

// Default settings
const defaultSettings: ReaderSettings = {
  theme: 'dark',
  fontSize: 24,
  fontFamily: 'noto',
  script: 'gurmukhi',
  showTranslation: true,
  translationLang: 'english',
  larivaar: false,
  larivaarAssist: false,
  vishraam: true,
  autoScroll: false,
  autoScrollSpeed: 5,
  screenAwake: true,
  dailyGoal: 5,
  reminderEnabled: true,
  reminderTime: '05:00',
};

// Default progress
const defaultProgress: SehajPaathProgress = {
  currentAng: 1,
  lastReadDate: '',
  startDate: '',
  completedAngs: [],
  totalReadingTime: 0,
  sessions: [],
  bookmarks: [],
  settings: defaultSettings,
  streak: {
    current: 0,
    longest: 0,
    lastDate: '',
  },
  completions: 0,
};

// Load progress from storage
export function loadProgress(): SehajPaathProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultProgress, ...parsed, settings: { ...defaultSettings, ...parsed.settings } };
    }
  } catch (error) {
    console.error('Failed to load progress:', error);
  }
  return { ...defaultProgress };
}

// Save progress to storage
export function saveProgress(progress: SehajPaathProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
}

// Update current Ang
export function updateCurrentAng(angNumber: number): void {
  const progress = loadProgress();
  const today = new Date().toISOString().split('T')[0];
  
  // Update streak
  const lastDate = progress.streak.lastDate;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  if (lastDate === yesterday) {
    progress.streak.current += 1;
  } else if (lastDate !== today) {
    progress.streak.current = 1;
  }
  
  if (progress.streak.current > progress.streak.longest) {
    progress.streak.longest = progress.streak.current;
  }
  
  progress.streak.lastDate = today;
  progress.currentAng = angNumber;
  progress.lastReadDate = today;
  
  if (!progress.startDate) {
    progress.startDate = today;
  }
  
  // Mark Ang as completed
  if (!progress.completedAngs.includes(angNumber)) {
    progress.completedAngs.push(angNumber);
  }
  
  // Check if completed full SGGS
  if (progress.completedAngs.length === 1430) {
    progress.completions += 1;
    progress.completedAngs = []; // Reset for next round
  }
  
  saveProgress(progress);
}

// Add bookmark
export function addBookmark(angNumber: number, name: string, lineNumber?: number): Bookmark {
  const progress = loadProgress();
  const bookmark: Bookmark = {
    id: Date.now().toString(),
    angNumber,
    lineNumber,
    name,
    createdAt: new Date().toISOString(),
    color: getRandomBookmarkColor(),
  };
  
  progress.bookmarks.push(bookmark);
  saveProgress(progress);
  return bookmark;
}

// Remove bookmark
export function removeBookmark(bookmarkId: string): void {
  const progress = loadProgress();
  progress.bookmarks = progress.bookmarks.filter(b => b.id !== bookmarkId);
  saveProgress(progress);
}

// Update settings
export function updateSettings(settings: Partial<ReaderSettings>): void {
  const progress = loadProgress();
  progress.settings = { ...progress.settings, ...settings };
  saveProgress(progress);
}

// Get reading statistics
export function getStatistics() {
  const progress = loadProgress();
  const completedCount = progress.completedAngs.length;
  const percentComplete = (completedCount / 1430) * 100;
  
  // Calculate estimated completion
  const daysActive = progress.sessions.length || 1;
  const avgAngsPerDay = completedCount / daysActive;
  const remainingAngs = 1430 - completedCount;
  const estimatedDaysRemaining = Math.ceil(remainingAngs / (avgAngsPerDay || progress.settings.dailyGoal));
  const estimatedCompletionDate = new Date(Date.now() + estimatedDaysRemaining * 86400000);
  
  return {
    currentAng: progress.currentAng,
    completedAngs: completedCount,
    percentComplete: percentComplete.toFixed(1),
    totalReadingTime: progress.totalReadingTime,
    currentStreak: progress.streak.current,
    longestStreak: progress.streak.longest,
    completions: progress.completions,
    estimatedCompletionDate: estimatedCompletionDate.toLocaleDateString(),
    avgAngsPerDay: avgAngsPerDay.toFixed(1),
  };
}

// Get Angs read today
export function getTodaysProgress() {
  const progress = loadProgress();
  const today = new Date().toISOString().split('T')[0];
  const todaysSessions = progress.sessions.filter(s => s.date === today);
  
  const angsToday = todaysSessions.reduce((acc, s) => acc + (s.endAng - s.startAng + 1), 0);
  const goalProgress = (angsToday / progress.settings.dailyGoal) * 100;
  
  return {
    angsRead: angsToday,
    goal: progress.settings.dailyGoal,
    percentOfGoal: Math.min(goalProgress, 100).toFixed(0),
    goalMet: angsToday >= progress.settings.dailyGoal,
  };
}

function getRandomBookmarkColor(): string {
  const colors = ['#FF9500', '#FF2D55', '#5856D6', '#34C759', '#007AFF', '#FFBE0B'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Get weekly reading data for analytics
export function getWeeklyReadingData() {
  const progress = loadProgress();
  const today = new Date();
  const weekData = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const daySessions = progress.sessions.filter(s => s.date === dateStr);
    const angsRead = daySessions.reduce((acc, s) => acc + (s.endAng - s.startAng + 1), 0);
    
    weekData.push({
      date: dateStr,
      label: date.toLocaleDateString('en', { weekday: 'short' }),
      angs: angsRead,
    });
  }
  
  return weekData;
}
