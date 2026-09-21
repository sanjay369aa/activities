import React, { useState } from 'react';
import { Task } from '../types';
import { getTimeOfDay, TimeOfDay, formatDisplayDate } from '../utils/dateUtils';
import { TaskItem } from './TaskItem';
import { Plus, Sparkles, Calendar as CalendarIcon, CheckCheck, Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TodayChecklistProps {
  date: string;
  isToday: boolean;
  tasks: Task[];
  completions: Record<string, boolean>;
  onToggleTask: (task: Task) => void;
  onAddTask: () => void;
  onOpenAIModal: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const TIME_OF_DAY_ICONS: Record<TimeOfDay, React.ReactNode> = {
  Morning: <Sunrise className="w-4 h-4 text-amber-500" />,
  Afternoon: <Sun className="w-4 h-4 text-orange-500" />,
  Evening: <Sunset className="w-4 h-4 text-rose-500" />,
  Night: <Moon className="w-4 h-4 text-indigo-500" />,
};

export const TodayChecklist: React.FC<TodayChecklistProps> = ({
  date,
  isToday,
  tasks,
  completions,
  onToggleTask,
  onAddTask,
  onOpenAIModal,
  onEditTask,
  onDeleteTask,
}) => {
  // Group tasks by TimeOfDay
  const groupedTasks: Record<TimeOfDay, Task[]> = {
    Morning: [],
    Afternoon: [],
    Evening: [],
    Night: [],
  };

  tasks.forEach((t) => {
    const group = getTimeOfDay(t.time);
    groupedTasks[group].push(t);
  });

  const order: TimeOfDay[] = ['Morning', 'Afternoon', 'Evening', 'Night'];

  const handleTaskToggleWithCelebration = (task: Task) => {
    const wasCompleted = !!completions[task.id];
    onToggleTask(task);

    // If checking off the last task, trigger subtle celebratory confetti
    if (!wasCompleted) {
      const remainingUnchecked = tasks.filter((t) => t.id !== task.id && !completions[t.id]);
      if (remainingUnchecked.length === 0 && tasks.length > 0) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#10b981', '#f59e0b'],
        });
      }
    }
  };

  return (
    <div id="today-checklist-container" className="space-y-6">
      {/* Action Bar / Date Banner */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 peaceful-card p-4 sm:p-5 rounded-3xl">
        {/* Subtle peaceful decorative glowing orbs */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-200/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-purple-200/25 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-linear-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-sm shadow-indigo-500/20">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/80">
                {isToday ? 'TODAY' : 'HISTORICAL DATE'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">
                {formatDisplayDate(date)}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 flex items-center gap-2">
              <span>{isToday ? "Today's Schedule Checklist" : `Schedule for ${date}`}</span>
              <span className="hidden sm:inline-block text-base" title="Peaceful day ahead">🌱</span>
            </h2>
          </div>
        </div>

        {/* Buttons: Add Task & AI Assistant */}
        <div className="relative z-10 flex items-center gap-2">
          <button
            id="btn-ai-assistant-header"
            type="button"
            onClick={onOpenAIModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-indigo-50/80 text-indigo-700 text-xs font-semibold rounded-xl transition-all cursor-pointer border border-indigo-200/80 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Routine</span>
          </button>

          <button
            id="btn-add-task-header"
            type="button"
            onClick={onAddTask}
            className="flex items-center gap-1.5 px-4 py-2 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/20 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Empty State with peaceful stickers */}
      {tasks.length === 0 ? (
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-md rounded-3xl border border-indigo-100/90 p-8 sm:p-10 text-center shadow-xs">
          {/* Aesthetic Calm background orbs */}
          <div className="absolute top-0 right-1/4 w-40 h-40 bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />

          {/* Floating peaceful stickers banner */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 select-none">
            <span className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-xl shadow-2xs rotate-[-4deg]">
              🌅
            </span>
            <span className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-cyan-50 border border-cyan-200/80 flex items-center justify-center text-xl shadow-2xs rotate-[2deg]">
              💧
            </span>
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-linear-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 scale-105">
              <CheckCheck className="w-7 h-7" />
            </div>
            <span className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-xl shadow-2xs rotate-[-3deg]">
              ✨
            </span>
            <span className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-xl shadow-2xs rotate-[5deg]">
              🌙
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900">Your Peaceful Schedule Awaits</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6 leading-relaxed">
            Organize daily rituals like morning hydration, deep focus sessions, study routines, and calming evening rest.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onAddTask}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-linear-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm shadow-indigo-600/20 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add First Task
            </button>
            <button
              onClick={onOpenAIModal}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-xl hover:bg-indigo-50/70 transition-all cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Generate with Gemini
            </button>
          </div>
        </div>
      ) : (
        /* Grouped Sections: Morning, Afternoon, Evening, Night */
        <div className="space-y-6">
          {order.map((group) => {
            const groupTasks = groupedTasks[group];
            if (groupTasks.length === 0) return null;

            const groupCompletedCount = groupTasks.filter((t) => !!completions[t.id]).length;

            return (
              <div key={group} className="space-y-2.5">
                {/* Group Header with cute sticker badge */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg select-none">
                      {group === 'Morning' && '🌅'}
                      {group === 'Afternoon' && '☀️'}
                      {group === 'Evening' && '🌆'}
                      {group === 'Night' && '🌙'}
                    </span>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                      {group} Routine
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-indigo-700 bg-white/80 px-2.5 py-0.5 rounded-full border border-indigo-100/60 shadow-2xs">
                    {groupCompletedCount} / {groupTasks.length} done
                  </span>
                </div>

                {/* Task Items */}
                <div className="space-y-2">
                  {groupTasks.map((t) => (
                    <TaskItem
                      key={t.id}
                      task={t}
                      isCompleted={!!completions[t.id]}
                      onToggle={handleTaskToggleWithCelebration}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
