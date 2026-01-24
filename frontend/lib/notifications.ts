// lib/notifications.ts

interface NotificationPayload {
  title: string;
  body: string;
  icon: string;
  badge: string;
  tag: string;
  data: {
    url: string;
    angNumber: number;
  };
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

// Schedule daily reminder
export function scheduleDailyReminder(time: string, currentAng: number) {
  // Parse time string "HH:MM"
  const [hours, minutes] = time.split(':').map(Number);
  
  // Calculate next reminder time
  const now = new Date();
  const reminderTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0
  );
  
  // If time has passed today, schedule for tomorrow
  if (reminderTime <= now) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }
  
  const delay = reminderTime.getTime() - now.getTime();
  
  // Store timeout ID for cancellation
  const timeoutId = setTimeout(() => {
    sendReminderNotification(currentAng);
    // Reschedule for next day
    scheduleDailyReminder(time, currentAng);
  }, delay);
  
  // Store timeout ID
  localStorage.setItem('reminder_timeout_id', timeoutId.toString());
  
  return timeoutId;
}

// Cancel scheduled reminder
export function cancelDailyReminder() {
  const timeoutId = localStorage.getItem('reminder_timeout_id');
  if (timeoutId) {
    clearTimeout(parseInt(timeoutId));
    localStorage.removeItem('reminder_timeout_id');
  }
}

// Send reminder notification
async function sendReminderNotification(currentAng: number) {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;
  
  const messages = getEncouragingMessages(currentAng);
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  
  const notification = new Notification('ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖਾਲਸਾ', {
    body: randomMessage,
    icon: '/icons/khanda-192.png',
    badge: '/icons/badge-72.png',
    tag: 'sehaj-paath-reminder',
    vibrate: [100, 50, 100],
    data: {
      url: '/sehaj-paath',
      angNumber: currentAng,
    },
    actions: [
      { action: 'read', title: 'Continue Reading' },
      { action: 'later', title: 'Remind Later' },
    ],
  } as NotificationOptions);
  
  notification.onclick = (event) => {
    event.preventDefault();
    window.focus();
    window.location.href = `/sehaj-paath?ang=${currentAng}`;
  };
}

// Encouraging messages based on progress
function getEncouragingMessages(currentAng: number): string[] {
  const percent = ((currentAng / 1430) * 100).toFixed(0);
  const remaining = 1430 - currentAng;
  
  const messages = [
    `Continue your spiritual journey from Ang ${currentAng}. You're ${percent}% complete!`,
    `ਗੁਰੂ ਸਾਹਿਬ awaits you at Ang ${currentAng}. Just ${remaining} Angs remaining.`,
    `Take a moment for Gurbani. You left off at Ang ${currentAng}.`,
    `Your Sehaj Paath journey continues at Ang ${currentAng}. Keep going!`,
    `Waheguru's blessings await at Ang ${currentAng}. Continue reading today.`,
    `You're making wonderful progress! Continue from Ang ${currentAng}.`,
  ];
  
  // Add milestone messages
  if (currentAng >= 715 && currentAng <= 720) {
    messages.push(`Amazing! You're halfway through Sri Guru Granth Sahib Ji! 🙏`);
  }
  
  if (currentAng >= 1400) {
    messages.push(`So close to completing Sehaj Paath! Only ${remaining} Angs left! 🎉`);
  }
  
  return messages;
}

// Service Worker registration for background notifications
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('ServiceWorker registered:', registration);
      return registration;
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
    }
  }
}
