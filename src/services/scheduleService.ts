import { Task, TaskCompletion, DailyWaterLog, MealLog } from '../types';

// Storage Keys Helper
const getKeys = (userId: string) => ({
  tasks: `peaceful_schedule_tasks_${userId}`,
  completions: `peaceful_schedule_completions_${userId}`,
  water: `peaceful_schedule_water_${userId}`,
  meals: `peaceful_schedule_meals_${userId}`,
});

// Event dispatcher for reactive updates
function dispatchStoreEvent(key: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('peaceful_store_update', { detail: { key } }));
  }
}

// Helper to read/write JSON safely
function getLocal<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    dispatchStoreEvent(key);
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

// ----------------------------------------------------
// TASKS
// ----------------------------------------------------

export function subscribeUserTasks(
  userId: string,
  onUpdate: (tasks: Task[]) => void,
  _onError?: (err: any) => void
): () => void {
  const { tasks: tasksKey } = getKeys(userId);

  const fetchAndNotify = () => {
    const allTasks = getLocal<Task[]>(tasksKey, []);
    allTasks.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    onUpdate(allTasks);
  };

  // Immediate initial load
  fetchAndNotify();

  const handleUpdate = (e: Event) => {
    const customEvt = e as CustomEvent;
    if (!customEvt.detail || customEvt.detail.key === tasksKey) {
      fetchAndNotify();
    }
  };

  window.addEventListener('peaceful_store_update', handleUpdate);
  window.addEventListener('storage', fetchAndNotify);

  return () => {
    window.removeEventListener('peaceful_store_update', handleUpdate);
    window.removeEventListener('storage', fetchAndNotify);
  };
}

export async function createTask(taskData: Omit<Task, 'id'>): Promise<string> {
  const { tasks: tasksKey } = getKeys(taskData.userId);
  const tasks = getLocal<Task[]>(tasksKey, []);
  const newId = 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  const newTask: Task = {
    ...taskData,
    id: newId,
  };
  tasks.push(newTask);
  setLocal(tasksKey, tasks);
  return newId;
}

export async function createBatchTasks(tasks: Omit<Task, 'id'>[]): Promise<void> {
  if (tasks.length === 0) return;
  const userId = tasks[0].userId;
  const { tasks: tasksKey } = getKeys(userId);
  const existing = getLocal<Task[]>(tasksKey, []);

  const newItems: Task[] = tasks.map((t, idx) => ({
    ...t,
    id: 'task_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 7),
  }));

  setLocal(tasksKey, [...existing, ...newItems]);
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
  // Locate which user owns this or search keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('peaceful_schedule_tasks_')) {
      const tasks = getLocal<Task[]>(key, []);
      const idx = tasks.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        tasks[idx] = { ...tasks[idx], ...updates };
        setLocal(key, tasks);
        break;
      }
    }
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('peaceful_schedule_tasks_')) {
      const tasks = getLocal<Task[]>(key, []);
      const filtered = tasks.filter((t) => t.id !== taskId);
      if (filtered.length !== tasks.length) {
        setLocal(key, filtered);
        break;
      }
    }
  }
}

// ----------------------------------------------------
// COMPLETIONS
// ----------------------------------------------------

export function subscribeCompletionsForDate(
  userId: string,
  date: string,
  onUpdate: (completions: Record<string, boolean>) => void
): () => void {
  const { completions: compKey } = getKeys(userId);

  const fetchAndNotify = () => {
    const map = getLocal<Record<string, Record<string, boolean>>>(compKey, {});
    onUpdate(map[date] || {});
  };

  fetchAndNotify();

  const handleUpdate = (e: Event) => {
    const customEvt = e as CustomEvent;
    if (!customEvt.detail || customEvt.detail.key === compKey) {
      fetchAndNotify();
    }
  };

  window.addEventListener('peaceful_store_update', handleUpdate);
  window.addEventListener('storage', fetchAndNotify);

  return () => {
    window.removeEventListener('peaceful_store_update', handleUpdate);
    window.removeEventListener('storage', fetchAndNotify);
  };
}

export async function toggleTaskCompletion(
  userId: string,
  taskId: string,
  date: string,
  currentStatus: boolean
): Promise<boolean> {
  const { completions: compKey } = getKeys(userId);
  const map = getLocal<Record<string, Record<string, boolean>>>(compKey, {});
  if (!map[date]) {
    map[date] = {};
  }
  const nextStatus = !currentStatus;
  map[date][taskId] = nextStatus;
  setLocal(compKey, map);
  return nextStatus;
}

// ----------------------------------------------------
// WATER TRACKER
// ----------------------------------------------------

export function subscribeWaterLog(
  userId: string,
  date: string,
  onUpdate: (log: DailyWaterLog | null) => void
): () => void {
  const { water: waterKey } = getKeys(userId);

  const fetchAndNotify = () => {
    const waterMap = getLocal<Record<string, DailyWaterLog>>(waterKey, {});
    onUpdate(waterMap[date] || null);
  };

  fetchAndNotify();

  const handleUpdate = (e: Event) => {
    const customEvt = e as CustomEvent;
    if (!customEvt.detail || customEvt.detail.key === waterKey) {
      fetchAndNotify();
    }
  };

  window.addEventListener('peaceful_store_update', handleUpdate);
  window.addEventListener('storage', fetchAndNotify);

  return () => {
    window.removeEventListener('peaceful_store_update', handleUpdate);
    window.removeEventListener('storage', fetchAndNotify);
  };
}

export async function addWater(
  userId: string,
  date: string,
  addMl: number,
  targetMl: number = 2500
): Promise<void> {
  const { water: waterKey } = getKeys(userId);
  const waterMap = getLocal<Record<string, DailyWaterLog>>(waterKey, {});
  const current = waterMap[date]?.amountMl || 0;
  const newAmount = Math.max(0, current + addMl);

  waterMap[date] = {
    userId,
    date,
    amountMl: newAmount,
    targetMl,
    updatedAt: new Date().toISOString(),
  };

  setLocal(waterKey, waterMap);
}

export async function resetWater(
  userId: string,
  date: string,
  targetMl: number = 2500
): Promise<void> {
  const { water: waterKey } = getKeys(userId);
  const waterMap = getLocal<Record<string, DailyWaterLog>>(waterKey, {});

  waterMap[date] = {
    userId,
    date,
    amountMl: 0,
    targetMl,
    updatedAt: new Date().toISOString(),
  };

  setLocal(waterKey, waterMap);
}

// ----------------------------------------------------
// MEALS TRACKER
// ----------------------------------------------------

export function subscribeMealLogs(
  userId: string,
  date: string,
  onUpdate: (meals: MealLog[]) => void
): () => void {
  const { meals: mealsKey } = getKeys(userId);

  const fetchAndNotify = () => {
    const allMeals = getLocal<MealLog[]>(mealsKey, []);
    const dateMeals = allMeals.filter((m) => m.date === date);
    onUpdate(dateMeals);
  };

  fetchAndNotify();

  const handleUpdate = (e: Event) => {
    const customEvt = e as CustomEvent;
    if (!customEvt.detail || customEvt.detail.key === mealsKey) {
      fetchAndNotify();
    }
  };

  window.addEventListener('peaceful_store_update', handleUpdate);
  window.addEventListener('storage', fetchAndNotify);

  return () => {
    window.removeEventListener('peaceful_store_update', handleUpdate);
    window.removeEventListener('storage', fetchAndNotify);
  };
}

export async function addMealLog(mealData: Omit<MealLog, 'id'>): Promise<string> {
  const { meals: mealsKey } = getKeys(mealData.userId);
  const allMeals = getLocal<MealLog[]>(mealsKey, []);
  const newId = 'meal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const newMeal: MealLog = {
    ...mealData,
    id: newId,
  };
  allMeals.push(newMeal);
  setLocal(mealsKey, allMeals);
  return newId;
}

export async function deleteMealLog(mealId: string): Promise<void> {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('peaceful_schedule_meals_')) {
      const meals = getLocal<MealLog[]>(key, []);
      const filtered = meals.filter((m) => m.id !== mealId);
      if (filtered.length !== meals.length) {
        setLocal(key, filtered);
        break;
      }
    }
  }
}

// ----------------------------------------------------
// STREAKS CALCULATION
// ----------------------------------------------------

export async function calculateUserStreak(
  userId: string,
  allTasks: Task[],
  targetRate: number = 80
): Promise<{ currentStreak: number; bestStreak: number }> {
  try {
    const { completions: compKey } = getKeys(userId);
    const dateCompletions = getLocal<Record<string, Record<string, boolean>>>(compKey, {});

    const today = new Date();
    let currentStreak = 0;
    let tempStreak = 0;
    let bestStreak = 0;

    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const eligibleTasks = allTasks.filter((t) => {
        if (t.startDate && dateStr < t.startDate) return false;
        const dayOfWeek = d.getDay();
        if (t.repeat === 'weekdays' && (dayOfWeek === 0 || dayOfWeek === 6)) return false;
        if (t.repeat === 'weekends' && dayOfWeek >= 1 && dayOfWeek <= 5) return false;
        if (t.repeat === 'once' && t.startDate !== dateStr) return false;
        return true;
      });

      if (eligibleTasks.length === 0) continue;

      const dayMap = dateCompletions[dateStr] || {};
      const completedCount = Object.values(dayMap).filter(Boolean).length;
      const rate = (completedCount / eligibleTasks.length) * 100;
      const passed = rate >= targetRate;

      if (passed) {
        tempStreak++;
        if (i === 0 || i === 1) {
          currentStreak = tempStreak;
        }
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
        }
      } else {
        if (i === 0) continue;
        tempStreak = 0;
      }
    }

    return {
      currentStreak: Math.max(currentStreak, tempStreak),
      bestStreak: Math.max(bestStreak, currentStreak),
    };
  } catch (err) {
    console.error('Failed to compute streak:', err);
    return { currentStreak: 0, bestStreak: 0 };
  }
}
