export type TaskCategory =
  | 'Personal'
  | 'Study'
  | 'College'
  | 'Exercise'
  | 'Food'
  | 'Sleep'
  | 'Other';

export type TaskRepeat = 'daily' | 'weekdays' | 'weekends' | 'once';

export type ReminderType = 'push' | 'in-app' | 'both';

export interface TaskReminder {
  enabled: boolean;
  type: ReminderType; // 'push', 'in-app', or 'both'
  minutesBefore: number; // 0 (at time), 5, 10, 15, 30, 60
  customTime?: string; // Optional custom alert time "HH:mm"
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  time: string; // HH:mm format e.g. "06:00" or "18:30"
  category: TaskCategory;
  description?: string;
  repeat: TaskRepeat;
  createdAt: string;
  startDate?: string; // YYYY-MM-DD
  reminder?: TaskReminder;
}

export interface TaskCompletion {
  id?: string;
  userId: string;
  taskId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedAt: string;
}

export interface DailyWaterLog {
  userId: string;
  date: string; // YYYY-MM-DD
  amountMl: number;
  targetMl: number;
  updatedAt: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  foodName: string;
  portion?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  notes?: string;
  loggedAt: string;
  source?: 'manual' | 'ai-scan';
}

export interface UserPreferences {
  userId: string;
  displayName: string;
  targetCompletionRate: number; // e.g. 80 for 80%
  waterTargetMl: number; // default 2500
  theme?: 'light' | 'dark';
}
