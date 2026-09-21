// Date and time utility functions for My Daily Schedule

export function formatISODate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDisplayDate(dateStr: string): string {
  const date = parseISODate(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function formatShortDate(dateStr: string): string {
  const date = parseISODate(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function getGreeting(hour: number = new Date().getHours()): string {
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function formatTime12h(time24: string): string {
  if (!time24) return '';
  const [hourStr, minuteStr] = time24.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr ? minuteStr.padStart(2, '0') : '00';
  if (isNaN(hour)) return time24;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12; // 0 becomes 12
  return `${hour}:${minute} ${ampm}`;
}

export type TimeOfDay = 'Morning' | 'Afternoon' | 'Evening' | 'Night';

export function getTimeOfDay(time24: string): TimeOfDay {
  if (!time24) return 'Morning';
  const hour = parseInt(time24.split(':')[0], 10);
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
}

export function isTaskScheduledForDate(
  repeat: 'daily' | 'weekdays' | 'weekends' | 'once',
  taskStartDate: string | undefined,
  targetDate: string
): boolean {
  if (taskStartDate && targetDate < taskStartDate) {
    return false;
  }

  if (repeat === 'once') {
    return taskStartDate === targetDate;
  }

  const date = parseISODate(targetDate);
  const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday

  if (repeat === 'daily') {
    return true;
  }
  if (repeat === 'weekdays') {
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  }
  if (repeat === 'weekends') {
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  return true;
}

export function getPastDates(daysCount: number = 7, referenceDate: string = formatISODate()): string[] {
  const dates: string[] = [];
  const ref = parseISODate(referenceDate);
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(ref);
    d.setDate(ref.getDate() - i);
    dates.push(formatISODate(d));
  }
  return dates;
}

export function getWeekDates(referenceDate: string = formatISODate()): string[] {
  const current = parseISODate(referenceDate);
  // Get Monday as start of week
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  const monday = new Date(current.setDate(diff));

  const week: string[] = [];
  for (let i = 0; i < 7; i++) {
    const next = new Date(monday);
    next.setDate(monday.getDate() + i);
    week.push(formatISODate(next));
  }
  return week;
}
