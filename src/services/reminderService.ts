import { Task, TaskReminder } from '../types';

export interface ActiveAlert {
  id: string;
  taskId: string;
  taskTitle: string;
  taskTime: string;
  reminderType: 'push' | 'in-app' | 'both';
  message: string;
  timestamp: string;
}

// Play pleasant web audio chime for reminder
export function playChimeSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Play two-tone bell chime (E5 -> B5)
    const now = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.15); // B5
    gain2.gain.setValueAtTime(0.18, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.9);
  } catch (e) {
    // Ignore audio autoplay policy blocks
  }
}

// Request notification permission if push notification is selected
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission();
  }
  return Notification.permission;
}

// Send browser push notification
export function sendBrowserPushNotification(title: string, body: string, iconUrl = '/icon.svg') {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  try {
    new Notification(title, {
      body,
      icon: iconUrl,
      badge: iconUrl,
      tag: `schedule-reminder-${Date.now()}`,
    });
  } catch (err) {
    console.warn('Could not display system push notification:', err);
  }
}

// Calculate trigger time in minutes from midnight
export function calculateMinutesFromMidnight(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Format reminder summary text
export function getReminderLabel(reminder?: TaskReminder): string | null {
  if (!reminder || !reminder.enabled) return null;
  const typeText =
    reminder.type === 'push'
      ? 'Push'
      : reminder.type === 'in-app'
      ? 'In-App'
      : 'Push & In-App';

  if (reminder.customTime) {
    return `Alert at ${reminder.customTime} (${typeText})`;
  }
  if (reminder.minutesBefore === 0) {
    return `At time (${typeText})`;
  }
  return `${reminder.minutesBefore}m before (${typeText})`;
}
