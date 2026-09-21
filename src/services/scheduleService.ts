import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Task, TaskCompletion, DailyWaterLog, MealLog } from '../types';

// Real-time task listener for user's master schedule
export function subscribeUserTasks(
  userId: string,
  onUpdate: (tasks: Task[]) => void,
  onError?: (err: any) => void
) {
  const tasksRef = collection(db, 'tasks');
  const q = query(tasksRef, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const tasks: Task[] = [];
      snapshot.forEach((docSnap) => {
        tasks.push({ id: docSnap.id, ...docSnap.data() } as Task);
      });
      // Sort tasks chronologically by time
      tasks.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      onUpdate(tasks);
    },
    (error) => {
      console.error('Error fetching tasks:', error);
      if (onError) onError(error);
    }
  );
}

// Real-time completions listener for a specific date (or range)
export function subscribeCompletionsForDate(
  userId: string,
  date: string,
  onUpdate: (completions: Record<string, boolean>) => void
) {
  const compRef = collection(db, 'dailyCompletions');
  const q = query(compRef, where('userId', '==', userId), where('date', '==', date));

  return onSnapshot(q, (snapshot) => {
    const map: Record<string, boolean> = {};
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as TaskCompletion;
      if (data.completed) {
        map[data.taskId] = true;
      }
    });
    onUpdate(map);
  });
}

// Toggle completion of a task on a specific date
export async function toggleTaskCompletion(
  userId: string,
  taskId: string,
  date: string,
  currentStatus: boolean
) {
  // Document ID scheme: `${userId}_${date}_${taskId}` for fast idempotent updates
  const docId = `${userId}_${date}_${taskId}`;
  const docRef = doc(db, 'dailyCompletions', docId);

  const newStatus = !currentStatus;
  await setDoc(
    docRef,
    {
      userId,
      taskId,
      date,
      completed: newStatus,
      completedAt: newStatus ? new Date().toISOString() : '',
    },
    { merge: true }
  );
  return newStatus;
}

// Create a single task
export async function createTask(taskData: Omit<Task, 'id'>): Promise<string> {
  const colRef = collection(db, 'tasks');
  const docRef = await addDoc(colRef, taskData);
  return docRef.id;
}

// Batch create tasks (e.g. from AI assistant or template)
export async function createBatchTasks(tasks: Omit<Task, 'id'>[]) {
  const batch = writeBatch(db);
  const colRef = collection(db, 'tasks');
  for (const t of tasks) {
    const newDocRef = doc(colRef);
    batch.set(newDocRef, t);
  }
  await batch.commit();
}

// Update task details
export async function updateTask(taskId: string, updates: Partial<Task>) {
  const taskRef = doc(db, 'tasks', taskId);
  await updateDoc(taskRef, updates);
}

// Delete task
export async function deleteTask(taskId: string) {
  const taskRef = doc(db, 'tasks', taskId);
  await deleteDoc(taskRef);
}

// Water tracker listeners and updates
export function subscribeWaterLog(
  userId: string,
  date: string,
  onUpdate: (log: DailyWaterLog | null) => void
) {
  const docId = `${userId}_${date}`;
  const docRef = doc(db, 'waterLogs', docId);
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate(snapshot.data() as DailyWaterLog);
    } else {
      onUpdate(null);
    }
  });
}

export async function addWater(userId: string, date: string, addMl: number, targetMl: number = 2500) {
  const docId = `${userId}_${date}`;
  const docRef = doc(db, 'waterLogs', docId);
  
  // Read existing or create
  const q = await getDocs(query(collection(db, 'waterLogs'), where('userId', '==', userId), where('date', '==', date)));
  let currentAmount = 0;
  if (!q.empty) {
    currentAmount = (q.docs[0].data() as DailyWaterLog).amountMl || 0;
  }

  const newAmount = Math.max(0, currentAmount + addMl);
  await setDoc(docRef, {
    userId,
    date,
    amountMl: newAmount,
    targetMl,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export async function resetWater(userId: string, date: string, targetMl: number = 2500) {
  const docId = `${userId}_${date}`;
  const docRef = doc(db, 'waterLogs', docId);
  await setDoc(docRef, {
    userId,
    date,
    amountMl: 0,
    targetMl,
    updatedAt: new Date().toISOString(),
  });
}

// Meal tracker functions
export function subscribeMealLogs(
  userId: string,
  date: string,
  onUpdate: (meals: MealLog[]) => void
) {
  const colRef = collection(db, 'meals');
  const q = query(colRef, where('userId', '==', userId), where('date', '==', date));
  return onSnapshot(q, (snapshot) => {
    const meals: MealLog[] = [];
    snapshot.forEach((snap) => {
      meals.push({ id: snap.id, ...snap.data() } as MealLog);
    });
    onUpdate(meals);
  });
}

export async function addMealLog(mealData: Omit<MealLog, 'id'>): Promise<string> {
  const colRef = collection(db, 'meals');
  const res = await addDoc(colRef, mealData);
  return res.id;
}

export async function deleteMealLog(mealId: string) {
  const docRef = doc(db, 'meals', mealId);
  await deleteDoc(docRef);
}

// Calculate streak across dates
export async function calculateUserStreak(
  userId: string,
  allTasks: Task[],
  targetRate: number = 80
): Promise<{ currentStreak: number; bestStreak: number }> {
  try {
    const compRef = collection(db, 'dailyCompletions');
    const q = query(compRef, where('userId', '==', userId));
    const snap = await getDocs(q);

    // Group completions by date -> count
    const dateCompletions: Record<string, Set<string>> = {};
    snap.forEach((d) => {
      const item = d.data() as TaskCompletion;
      if (item.completed) {
        if (!dateCompletions[item.date]) {
          dateCompletions[item.date] = new Set();
        }
        dateCompletions[item.date].add(item.taskId);
      }
    });

    // Check consecutive days starting yesterday/today backwards
    const today = new Date();
    let currentStreak = 0;
    let tempStreak = 0;
    let bestStreak = 0;

    // Evaluate last 60 days
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Eligible tasks for this date
      const eligibleTasks = allTasks.filter((t) => {
        if (t.startDate && dateStr < t.startDate) return false;
        const dayOfWeek = d.getDay();
        if (t.repeat === 'weekdays' && (dayOfWeek === 0 || dayOfWeek === 6)) return false;
        if (t.repeat === 'weekends' && dayOfWeek >= 1 && dayOfWeek <= 5) return false;
        if (t.repeat === 'once' && t.startDate !== dateStr) return false;
        return true;
      });

      if (eligibleTasks.length === 0) {
        // If no tasks on this day, skip or keep streak
        continue;
      }

      const completedCount = dateCompletions[dateStr]?.size || 0;
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
        if (i === 0) {
          // Today not finished yet, don't break streak if yesterday was completed
          continue;
        }
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
