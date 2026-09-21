import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { Navigation, NavTab, PeacefulTheme } from './components/Navigation';
import { ProgressHeader } from './components/ProgressHeader';
import { TodayChecklist } from './components/TodayChecklist';
import { TaskModal } from './components/TaskModal';
import { AIScheduleModal } from './components/AIScheduleModal';
import { CalendarView } from './components/CalendarView';
import { WeeklyProgress } from './components/WeeklyProgress';
import { WaterTracker } from './components/WaterTracker';
import { FoodTracker } from './components/FoodTracker';
import { ScanFoodPage } from './components/ScanFoodPage';
import { SettingsPage } from './components/SettingsPage';
import { MasterScheduleView } from './components/MasterScheduleView';
import { AlertNotificationBanner } from './components/AlertNotificationBanner';
import {
  ActiveAlert,
  playChimeSound,
  sendBrowserPushNotification,
  calculateMinutesFromMidnight,
} from './services/reminderService';
import {
  subscribeUserTasks,
  subscribeCompletionsForDate,
  toggleTaskCompletion,
  createTask,
  createBatchTasks,
  updateTask,
  deleteTask,
  calculateUserStreak,
} from './services/scheduleService';
import { Task } from './types';
import { formatISODate, getGreeting, isTaskScheduledForDate } from './utils/dateUtils';
import { Loader2 } from 'lucide-react';

const DEFAULT_SAMPLE_TASKS = [
  { title: 'Wake up', time: '06:00', category: 'Personal', repeat: 'daily', description: 'Fresh start to the day' },
  { title: 'Drink Water', time: '06:15', category: 'Food', repeat: 'daily', description: '500ml room temperature water' },
  { title: 'Exercise', time: '06:30', category: 'Exercise', repeat: 'daily', description: 'Morning cardio & stretching' },
  { title: 'Breakfast', time: '07:30', category: 'Food', repeat: 'daily', description: 'Nutritious high-protein meal' },
  { title: 'College', time: '08:30', category: 'College', repeat: 'weekdays', description: 'Lectures and coursework' },
  { title: 'Study Python', time: '17:00', category: 'Study', repeat: 'daily', description: 'Practice 2 coding problems' },
  { title: 'Dinner', time: '20:00', category: 'Food', repeat: 'daily', description: 'Light meal with family' },
  { title: 'Reading', time: '21:00', category: 'Study', repeat: 'daily', description: 'Read 15 pages' },
  { title: 'Sleep', time: '22:30', category: 'Sleep', repeat: 'daily', description: 'Wind down and rest' },
];

export default function App() {
  const { user, preferences, loading: authLoading, updateUserPreferences } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedDate, setSelectedDate] = useState<string>(formatISODate());

  // Firestore Live State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [tasksLoading, setTasksLoading] = useState(true);

  // Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Streaks
  const [streakData, setStreakData] = useState({ currentStreak: 0, bestStreak: 0 });

  // In-App Alert Reminders
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);
  const triggeredAlertsRef = React.useRef<Set<string>>(new Set());
  // Map of taskId -> snooze trigger timestamp in milliseconds
  const [snoozedTasks, setSnoozedTasks] = useState<Record<string, number>>({});

  const todayStr = formatISODate();
  const isToday = selectedDate === todayStr;

  // Peaceful Atmosphere Theme state
  const [peacefulTheme, setPeacefulTheme] = useState<PeacefulTheme>(() => {
    return (localStorage.getItem('preferred_peaceful_theme') as PeacefulTheme) || 'morning';
  });

  const handleThemeChange = (newTheme: PeacefulTheme) => {
    setPeacefulTheme(newTheme);
    localStorage.setItem('preferred_peaceful_theme', newTheme);
  };

  const themeBgClasses: Record<PeacefulTheme, string> = {
    morning: 'bg-peaceful-morning',
    zen: 'bg-peaceful-zen',
    sunset: 'bg-peaceful-sunset',
    twilight: 'bg-peaceful-twilight text-slate-100',
  };

  // Subscribe to user tasks
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setTasksLoading(false);
      return;
    }

    const unsubTasks = subscribeUserTasks(
      user.uid,
      async (userTasks) => {
        // If brand new user with 0 tasks, seed initial recommended schedule
        if (userTasks.length === 0 && !sessionStorage.getItem(`seeded_${user.uid}`)) {
          sessionStorage.setItem(`seeded_${user.uid}`, 'true');
          const seedPayload = DEFAULT_SAMPLE_TASKS.map((t) => ({
            ...t,
            category: t.category as any,
            repeat: t.repeat as any,
            userId: user.uid,
            createdAt: new Date().toISOString(),
            startDate: todayStr,
          }));
          await createBatchTasks(seedPayload);
          return;
        }

        setTasks(userTasks);
        setTasksLoading(false);

        // Recalculate streak
        const streak = await calculateUserStreak(
          user.uid,
          userTasks,
          preferences?.targetCompletionRate || 80
        );
        setStreakData(streak);
      },
      (err) => {
        console.error('Error in tasks stream:', err);
        setTasksLoading(false);
      }
    );

    return () => unsubTasks();
  }, [user, preferences?.targetCompletionRate]);

  // Subscribe to completions for selectedDate
  useEffect(() => {
    if (!user) {
      setCompletions({});
      return;
    }

    const unsubComp = subscribeCompletionsForDate(user.uid, selectedDate, (map) => {
      setCompletions(map);
    });

    return () => unsubComp();
  }, [user, selectedDate]);

  // Periodic Reminder Engine (checks every 15 seconds for tasks with reminders or snoozes due today)
  useEffect(() => {
    if (!user || tasks.length === 0) return;

    const checkReminders = () => {
      const now = new Date();
      const nowMs = now.getTime();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTotalMin = currentHours * 60 + currentMinutes;
      const today = formatISODate(now);

      // 1. Check snoozed tasks whose timer has elapsed
      Object.entries(snoozedTasks).forEach(([taskId, snoozeUntilMs]) => {
        if (nowMs >= snoozeUntilMs) {
          const targetTask = tasks.find((t) => t.id === taskId);
          if (targetTask && !completions[taskId]) {
            const triggerKey = `snooze_${taskId}_${snoozeUntilMs}`;
            if (!triggeredAlertsRef.current.has(triggerKey)) {
              triggeredAlertsRef.current.add(triggerKey);
              playChimeSound();
              sendBrowserPushNotification(
                `Snooze Reminder: ${targetTask.title}`,
                `10-minute snooze elapsed. Time for: ${targetTask.title} (${targetTask.time})`
              );
              const newAlert: ActiveAlert = {
                id: triggerKey,
                taskId: targetTask.id,
                taskTitle: `${targetTask.title} (Snoozed)`,
                taskTime: targetTask.time,
                reminderType: targetTask.reminder?.type || 'both',
                message: targetTask.description || 'Snooze timer expired. Ready to tackle this now?',
                timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };
              setActiveAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== triggerKey)]);
            }
          }
          // Remove from snoozed list
          setSnoozedTasks((prev) => {
            const next = { ...prev };
            delete next[taskId];
            return next;
          });
        }
      });

      // 2. Check scheduled tasks for today
      tasks.forEach((t) => {
        // Skip if task has no reminder enabled
        if (!t.reminder?.enabled) return;

        // Skip if not scheduled for today or already completed or currently actively snoozed
        if (!isTaskScheduledForDate(t.repeat, t.startDate, today)) return;
        if (completions[t.id]) return;
        if (snoozedTasks[t.id] && nowMs < snoozedTasks[t.id]) return;

        // Calculate trigger minute
        let triggerMinute: number;
        if (t.reminder.customTime) {
          triggerMinute = calculateMinutesFromMidnight(t.reminder.customTime);
        } else {
          const taskMinute = calculateMinutesFromMidnight(t.time);
          triggerMinute = taskMinute - (t.reminder.minutesBefore || 0);
        }

        // Trigger if we are within the current active minute
        if (currentTotalMin === triggerMinute) {
          const triggerKey = `${today}_${t.id}_${triggerMinute}`;
          if (triggeredAlertsRef.current.has(triggerKey)) return;
          triggeredAlertsRef.current.add(triggerKey);

          const alertType = t.reminder.type || 'both';

          // 1. Browser Push Notification
          if (alertType === 'push' || alertType === 'both') {
            sendBrowserPushNotification(
              `Reminder: ${t.title}`,
              `Time for your task: ${t.title} (${t.time}). ${t.description || ''}`
            );
          }

          // 2. In-App Alert & Sound
          if (alertType === 'in-app' || alertType === 'both') {
            playChimeSound();
            const newAlert: ActiveAlert = {
              id: triggerKey,
              taskId: t.id,
              taskTitle: t.title,
              taskTime: t.time,
              reminderType: alertType,
              message: t.description || 'Time to complete this scheduled activity!',
              timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setActiveAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== triggerKey)]);
          }
        }
      });
    };

    // Run initial check and set interval
    checkReminders();
    const interval = setInterval(checkReminders, 15000);
    return () => clearInterval(interval);
  }, [user, tasks, completions, snoozedTasks]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-peaceful-morning flex items-center justify-center p-4">
        <div className="peaceful-card p-6 rounded-3xl flex flex-col items-center gap-3 shadow-lg">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-xs font-semibold text-slate-700">Connecting your peaceful space...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  // Filter tasks scheduled for selected date
  const scheduledTasks = tasks.filter((t) =>
    isTaskScheduledForDate(t.repeat, t.startDate, selectedDate)
  );

  const completedCount = scheduledTasks.filter((t) => !!completions[t.id]).length;
  const totalCount = scheduledTasks.length;

  // Handlers
  const handleToggleTask = async (task: Task) => {
    if (!user) return;
    const current = !!completions[task.id];
    // Optimistic local update
    setCompletions((prev) => ({ ...prev, [task.id]: !current }));
    await toggleTaskCompletion(user.uid, task.id, selectedDate, current);

    // Refresh streak
    const updatedStreak = await calculateUserStreak(
      user.uid,
      tasks,
      preferences?.targetCompletionRate || 80
    );
    setStreakData(updatedStreak);
  };

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    if (editingTask) {
      await updateTask(editingTask.id, taskData);
    } else {
      await createTask({
        ...taskData,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        startDate: selectedDate,
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this task from your routine?')) return;
    await deleteTask(taskId);
  };

  const handleAddAITasks = async (newTasks: Omit<Task, 'id' | 'userId' | 'createdAt'>[]) => {
    if (!user) return;
    const batchData = newTasks.map((t) => ({
      ...t,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      startDate: selectedDate,
    }));
    await createBatchTasks(batchData);
  };

  const displayName =
    preferences?.displayName || user.displayName || user.email?.split('@')[0] || 'Friend';

  return (
    <div className={`relative min-h-screen ${themeBgClasses[peacefulTheme]} text-slate-800 pb-20 lg:pb-12 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900 transition-colors duration-500`}>
      {/* Peaceful Ambient Aesthetic Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Soft pastel ambient gradient light orbs */}
        <div className="absolute -top-24 -left-24 w-[32rem] h-[32rem] bg-indigo-300/30 rounded-full blur-3xl animate-gentle-drift" />
        <div className="absolute top-1/4 -right-24 w-[30rem] h-[30rem] bg-purple-300/25 rounded-full blur-3xl animate-gentle-drift-delayed" />
        <div className="absolute top-2/3 left-10 w-[28rem] h-[28rem] bg-teal-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 w-[30rem] h-[30rem] bg-rose-200/30 rounded-full blur-3xl" />

        {/* Floating Peaceful Atmosphere Stickers */}
        <div className="absolute top-20 left-[12%] text-2xl opacity-40 select-none animate-gentle-drift pointer-events-none">
          🌸
        </div>
        <div className="absolute top-44 right-[10%] text-3xl opacity-35 select-none animate-gentle-drift-delayed pointer-events-none">
          ☁️
        </div>
        <div className="absolute top-2/3 right-[6%] text-2xl opacity-40 select-none animate-gentle-drift pointer-events-none">
          🌿
        </div>
        <div className="absolute top-3/4 left-[8%] text-2xl opacity-35 select-none animate-gentle-drift-delayed pointer-events-none">
          ✨
        </div>
        <div className="absolute bottom-28 right-1/3 text-2xl opacity-35 select-none animate-gentle-drift pointer-events-none">
          🌱
        </div>

        {/* Subtle dot pattern texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#4f46e5_1px,transparent_1px)]"
          style={{ backgroundSize: '24px 24px' }}
        />
      </div>

      {/* Top Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        peacefulTheme={peacefulTheme}
        onThemeChange={handleThemeChange}
      />

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Tab 1: HOME (Focus on Today's Checklist & Progress) */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            <ProgressHeader
              userName={displayName}
              greeting={getGreeting()}
              completedCount={completedCount}
              totalCount={totalCount}
              currentStreak={streakData.currentStreak}
              bestStreak={streakData.bestStreak}
              targetCompletionRate={preferences?.targetCompletionRate || 80}
            />

            <TodayChecklist
              date={selectedDate}
              isToday={isToday}
              tasks={scheduledTasks}
              completions={completions}
              onToggleTask={handleToggleTask}
              onAddTask={() => {
                setEditingTask(null);
                setTaskModalOpen(true);
              }}
              onOpenAIModal={() => setAiModalOpen(true)}
              onEditTask={(t) => {
                setEditingTask(t);
                setTaskModalOpen(true);
              }}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        )}

        {/* Tab 2: MY SCHEDULE (Master Routine) */}
        {activeTab === 'schedule' && (
          <MasterScheduleView
            tasks={tasks}
            onAddTask={() => {
              setEditingTask(null);
              setTaskModalOpen(true);
            }}
            onEditTask={(t) => {
              setEditingTask(t);
              setTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onOpenAIModal={() => setAiModalOpen(true)}
          />
        )}

        {/* Tab 3: CALENDAR (Historical Dates) */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <CalendarView
              userId={user.uid}
              selectedDate={selectedDate}
              allTasks={tasks}
              onSelectDate={(d) => {
                setSelectedDate(d);
                setActiveTab('home');
              }}
            />
          </div>
        )}

        {/* Tab 4: WATER TRACKER */}
        {activeTab === 'water' && (
          <WaterTracker
            userId={user.uid}
            date={selectedDate}
            targetMl={preferences?.waterTargetMl || 2500}
          />
        )}

        {/* Tab 5: FOOD TRACKER */}
        {activeTab === 'food' && (
          <FoodTracker
            userId={user.uid}
            date={selectedDate}
            onNavigateToScan={() => setActiveTab('scan')}
          />
        )}

        {/* Tab 6: SCAN FOOD (Gemini Vision) */}
        {activeTab === 'scan' && (
          <ScanFoodPage
            userId={user.uid}
            date={selectedDate}
            onSaved={() => setActiveTab('food')}
          />
        )}

        {/* Tab 7: PROGRESS (Weekly & Analytics) */}
        {activeTab === 'progress' && (
          <WeeklyProgress
            userId={user.uid}
            allTasks={tasks}
            onSelectDate={(d) => {
              setSelectedDate(d);
              setActiveTab('home');
            }}
          />
        )}

        {/* Tab 8: AI ASSISTANT (Dedicated view opening modal directly) */}
        {activeTab === 'ai' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4">
            <h2 className="text-xl font-bold text-slate-900">AI Schedule Assistant</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Ask Gemini to design a personalized daily routine based on your schedule, classes, and study goals.
            </p>
            <button
              type="button"
              onClick={() => setAiModalOpen(true)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Open AI Routine Generator
            </button>
          </div>
        )}

        {/* Tab 9: SETTINGS */}
        {activeTab === 'settings' && (
          <SettingsPage
            preferences={preferences}
            onUpdate={updateUserPreferences}
            onTriggerTestAlert={() => {
              const testAlert: ActiveAlert = {
                id: `test_alert_${Date.now()}`,
                taskId: tasks[0]?.id || 'test_task',
                taskTitle: tasks[0]?.title || 'Practice Mindfulness & Focus',
                taskTime: tasks[0]?.time || '10:00',
                reminderType: 'both',
                message: 'Take a gentle breath, hydrate, and prepare for your next scheduled activity.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };
              setActiveAlerts((prev) => [testAlert, ...prev]);
            }}
          />
        )}
      </main>

      {/* Alert Notification Banner for Due Reminders */}
      <AlertNotificationBanner
        alerts={activeAlerts}
        onDismiss={(alertId) =>
          setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId))
        }
        onSnooze={(alertId, minutes = 10) => {
          const alert = activeAlerts.find((a) => a.id === alertId);
          if (alert) {
            const snoozeTarget = Date.now() + minutes * 60 * 1000;
            setSnoozedTasks((prev) => ({
              ...prev,
              [alert.taskId]: snoozeTarget,
            }));
          }
          setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
        }}
        onCompleteTask={async (taskId) => {
          const targetTask = tasks.find((t) => t.id === taskId);
          if (targetTask) {
            await handleToggleTask(targetTask);
          }
          setActiveAlerts((prev) => prev.filter((a) => a.taskId !== taskId));
        }}
      />

      {/* Add / Edit Task Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialTask={editingTask}
      />

      {/* AI Routine Generator Modal */}
      <AIScheduleModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onAddTasks={handleAddAITasks}
      />
    </div>
  );
}
