import React, { useState } from 'react';
import { Task, TaskCategory } from '../types';
import { formatTime12h } from '../utils/dateUtils';
import { getReminderLabel } from '../services/reminderService';
import { getTaskSticker } from '../utils/stickerUtils';
import { Plus, Edit2, Trash2, Clock, Sparkles, Filter, Bell } from 'lucide-react';

interface MasterScheduleViewProps {
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenAIModal: () => void;
}

const CATEGORY_STICKERS: Record<string, { label: string; sticker: string }> = {
  all: { label: 'All Routines', sticker: '🌈' },
  Personal: { label: 'Personal', sticker: '🌸' },
  Study: { label: 'Study', sticker: '📘' },
  College: { label: 'College', sticker: '🎒' },
  Exercise: { label: 'Exercise', sticker: '⚡' },
  Food: { label: 'Food & Meals', sticker: '🥗' },
  Sleep: { label: 'Sleep & Rest', sticker: '🌙' },
  Other: { label: 'Other', sticker: '⭐' },
};

export const MasterScheduleView: React.FC<MasterScheduleViewProps> = ({
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onOpenAIModal,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredTasks = tasks.filter((t) => {
    if (filterCategory === 'all') return true;
    return t.category === filterCategory;
  });

  return (
    <div id="master-schedule-view" className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden peaceful-card p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Soft background orb */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-purple-200/30 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Master Schedule & Daily Routines</h2>
            <span className="text-base" title="Peaceful planning">🌿</span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Define recurring rituals. They appear automatically on your daily checklist every morning.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAIModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/90 hover:bg-white text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200/80 shadow-2xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Schedule</span>
          </button>
          <button
            type="button"
            onClick={onAddTask}
            className="flex items-center gap-1.5 px-4 py-2 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Routine Task</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs with Cute Stickers */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 text-xs select-none scrollbar-none">
        <span className="text-slate-500 font-bold flex items-center gap-1 shrink-0 px-1">
          <Filter className="w-3.5 h-3.5 text-indigo-600" /> Filter:
        </span>
        {Object.entries(CATEGORY_STICKERS).map(([catKey, info]) => {
          const isSelected = filterCategory === catKey;
          return (
            <button
              key={catKey}
              onClick={() => setFilterCategory(catKey)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'peaceful-card text-slate-700 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <span>{info.sticker}</span>
              <span>{info.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tasks Table / Cards */}
      {filteredTasks.length === 0 ? (
        <div className="peaceful-card rounded-3xl p-8 text-center text-slate-500 text-xs space-y-2">
          <div className="text-3xl mb-1">🌱</div>
          <p className="font-semibold text-slate-700">No routine tasks found in this category.</p>
          <p className="text-slate-400">Click "Add Routine Task" to build your peaceful daily template.</p>
        </div>
      ) : (
        <div className="peaceful-card rounded-3xl divide-y divide-indigo-50/80 overflow-hidden">
          {filteredTasks.map((t) => {
            const sticker = getTaskSticker(t.title, t.category);
            return (
              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 text-center shrink-0">
                    <span className="block text-xs font-bold text-slate-800">{formatTime12h(t.time)}</span>
                    <span className="block text-[10px] text-slate-400 uppercase">{t.repeat}</span>
                  </div>

                  {/* Sticker emoji */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border ${sticker.bgLight} ${sticker.borderColor} shadow-2xs`}
                    title={sticker.label}
                  >
                    {sticker.emoji}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-slate-900">{t.title}</h3>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider">
                        {sticker.label}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {t.category}
                      </span>
                      {t.reminder?.enabled && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 font-medium"
                          title={getReminderLabel(t.reminder) || 'Reminder'}
                        >
                          <Bell className="w-2.5 h-2.5" />
                          <span>{getReminderLabel(t.reminder)}</span>
                        </span>
                      )}
                    </div>
                    {t.description && <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEditTask(t)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Edit Task"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteTask(t.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
