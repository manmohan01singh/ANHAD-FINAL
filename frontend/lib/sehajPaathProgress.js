// lib/sehajPaathProgress.js

const STORAGE_KEY = 'sehaj_paath_progress';

const defaultSettings = {
  theme: 'light',
  fontSize: 24,
  fontFamily: 'noto',
  gurmukhiFont: 'noto-sans',
  gurmukhiWeight: 400,
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
  showProgressPill: false,
  focusMode: false,
};

const defaultProgress = {
  currentAng: 1,
  lastReadDate: '',
  startDate: '',
  completedAngs: [],
  totalReadingTime: 0,
  sessions: [],
  bookmarks: [],
  settings: { ...defaultSettings },
  streak: { current: 0, longest: 0, lastDate: '' },
  completions: 0,
};

export function loadProgress() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...defaultProgress,
        ...parsed,
        settings: { ...defaultSettings, ...(parsed.settings || {}) },
      };
    }
  } catch (error) {
    console.error('Failed to load progress:', error);
  }
  return { ...defaultProgress, settings: { ...defaultSettings } };
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
}

export function updateCurrentAng(angNumber) {
  const progress = loadProgress();
  const today = new Date().toISOString().split('T')[0];

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

  if (!progress.completedAngs.includes(angNumber)) {
    progress.completedAngs.push(angNumber);
  }

  if (progress.completedAngs.length === 1430) {
    progress.completions += 1;
    progress.completedAngs = [];
  }

  saveProgress(progress);
}

export function addBookmark(angNumber, name, lineNumber) {
  const progress = loadProgress();
  const bookmark = {
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

export function removeBookmark(bookmarkId) {
  const progress = loadProgress();
  progress.bookmarks = progress.bookmarks.filter((b) => b.id !== bookmarkId);
  saveProgress(progress);
}

export function updateSettings(settingsPartial) {
  const progress = loadProgress();
  progress.settings = { ...progress.settings, ...settingsPartial };
  saveProgress(progress);
}

export function getStatistics() {
  const progress = loadProgress();
  const completedCount = progress.completedAngs.length;
  const percentComplete = (completedCount / 1430) * 100;

  const daysActive = progress.sessions.length || 1;
  const avgAngsPerDay = completedCount / daysActive;
  const remainingAngs = 1430 - completedCount;
  const estimatedDaysRemaining = Math.ceil(
    remainingAngs / (avgAngsPerDay || progress.settings.dailyGoal)
  );
  const estimatedCompletionDate = new Date(
    Date.now() + estimatedDaysRemaining * 86400000
  );

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

export function getTodaysProgress() {
  const progress = loadProgress();
  const today = new Date().toISOString().split('T')[0];
  const todaysSessions = progress.sessions.filter((s) => s.date === today);

  const angsToday = todaysSessions.reduce(
    (acc, s) => acc + (s.endAng - s.startAng + 1),
    0
  );
  const goalProgress = (angsToday / progress.settings.dailyGoal) * 100;

  return {
    angsRead: angsToday,
    goal: progress.settings.dailyGoal,
    percentOfGoal: Math.min(goalProgress, 100).toFixed(0),
    goalMet: angsToday >= progress.settings.dailyGoal,
  };
}

function getRandomBookmarkColor() {
  const colors = ['#FF9500', '#FF2D55', '#5856D6', '#34C759', '#007AFF', '#FFBE0B'];
  return colors[Math.floor(Math.random() * colors.length)];
}
