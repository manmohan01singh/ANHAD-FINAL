// lib/notifications.js

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
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

export function scheduleDailyReminder(time, currentAng) {
  const [hours, minutes] = time.split(':').map(Number);

  const now = new Date();
  const reminderTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0
  );

  if (reminderTime <= now) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }

  const delay = reminderTime.getTime() - now.getTime();

  const timeoutId = setTimeout(() => {
    sendReminderNotification(currentAng);
    scheduleDailyReminder(time, currentAng);
  }, delay);

  localStorage.setItem('reminder_timeout_id', timeoutId.toString());

  return timeoutId;
}

export function cancelDailyReminder() {
  const timeoutId = localStorage.getItem('reminder_timeout_id');
  if (timeoutId) {
    clearTimeout(parseInt(timeoutId));
    localStorage.removeItem('reminder_timeout_id');
  }
}

async function sendReminderNotification(currentAng) {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const encouragingMessages = getEncouragingMessages(currentAng);
  const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];

  const notification = new Notification('ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖਾਲਸਾ', {
    body: randomMessage,
    icon: '/assets/favicon.svg',
    badge: '/assets/favicon.svg',
    tag: 'sehaj-paath-reminder',
    vibrate: [100, 50, 100],
    data: { url: '/sehaj-paath', angNumber: currentAng },
  });

  notification.onclick = (event) => {
    event.preventDefault();
    window.focus();
    window.location.href = `/sehaj-paath?ang=${currentAng}`;
  };
}

function getEncouragingMessages(currentAng) {
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

  if (currentAng >= 715 && currentAng <= 720) {
    messages.push(`Amazing! You're halfway through Sri Guru Granth Sahib Ji!`);
  }

  if (currentAng >= 1400) {
    messages.push(`So close to completing Sehaj Paath! Only ${remaining} Angs left!`);
  }

  return messages;
}
