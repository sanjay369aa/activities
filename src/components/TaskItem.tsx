import React from 'react';
import { Task, TaskCategory } from '../types';
import { formatTime12h } from '../utils/dateUtils';
import { getReminderLabel } from '../services/reminderService';
import { getTaskSticker } from '../utils/stickerUtils';
import { Check, MoreVertical, Edit2, Trash2, Clock, Calendar, Bell } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  isCompleted: boolean;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const CATEGORY_COLORS: Record<TaskCategory, { bg: string; text: string; dot: string }> = {
  Personal: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  Study: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  College: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  Exercise: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Food: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  Sleep: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  Other: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500' },
};

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  isCompleted,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const catBadge = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.Other;
  const sticker = getTaskSticker(task.title, task.category);

  return (
    <div
      id={`task-item-${task.id}`}
      className={`group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl transition-all duration-200 ${
        isCompleted
          ? 'bg-white/50 border border-slate-200/50 opacity-60'
          : 'peaceful-card hover:bg-white/95 border-white/80 hover:border-indigo-200/90 shadow-2xs hover:shadow-md hover:shadow-indigo-500/10'
      }`}
    >
      {/* Checkbox and Task Details */}
      <div className="flex items-start gap-3 sm:gap-3.5 flex-1 min-w-0">
        {/* Large touch-friendly Checkbox */}
        <button
          type="button"
          aria-label={`Mark ${task.title} as ${isCompleted ? 'incomplete' : 'complete'}`}
          onClick={() => onToggle(task)}
          className={`shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center border-2 transition-all cursor-pointer ${
            isCompleted
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
              : 'border-slate-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/40'
          }`}
        >
          {isCompleted && <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />}
        </button>

        {/* Cute Routine Sticker Pill */}
        <div
          className={`shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-base sm:text-lg border transition-transform duration-200 group-hover:scale-105 select-none ${
            isCompleted
              ? 'bg-slate-100 border-slate-200 opacity-60 grayscale'
              : `${sticker.bgLight} ${sticker.borderColor} shadow-2xs`
          }`}
          title={sticker.label}
        >
          {sticker.emoji}
        </div>

        {/* Task Title and Metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
            <span
              className={`text-sm sm:text-base font-semibold leading-snug transition-all ${
                isCompleted
                  ? 'line-through text-slate-400 font-normal'
                  : 'text-slate-800'
              }`}
            >
              {task.title}
            </span>

            {/* Sticker Pill Tag */}
            <span
              className={`hidden sm:inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                isCompleted
                  ? 'bg-slate-100 text-slate-400'
                  : `${sticker.bgLight} ${sticker.textColor}`
              }`}
            >
              {sticker.label}
            </span>

            {/* Time label */}
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium ${
                isCompleted
                  ? 'text-slate-400 bg-slate-100'
                  : 'text-slate-600 bg-slate-100'
              }`}
            >
              <Clock className="w-3 h-3 text-slate-400" />
              {formatTime12h(task.time)}
            </span>

            {/* Category badge */}
            <span
              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${catBadge.bg} ${catBadge.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${catBadge.dot}`} />
              {task.category}
            </span>

            {/* Repeat indicator badge */}
            {task.repeat !== 'daily' && (
              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded capitalize">
                {task.repeat}
              </span>
            )}

            {/* Reminder indicator badge */}
            {task.reminder?.enabled && (
              <span
                className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  isCompleted
                    ? 'text-slate-400 bg-slate-100'
                    : 'text-indigo-600 bg-indigo-50 border border-indigo-100'
                }`}
                title={`Reminder: ${getReminderLabel(task.reminder)}`}
              >
                <Bell className="w-2.5 h-2.5" />
                <span>{getReminderLabel(task.reminder)}</span>
              </span>
            )}
          </div>

          {task.description && (
            <p
              className={`text-xs mt-0.5 line-clamp-1 ${
                isCompleted ? 'text-slate-400 line-through' : 'text-slate-500'
              }`}
            >
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Options Menu Button */}
      <div className="relative shrink-0 ml-2" ref={menuRef}>
        <button
          type="button"
          id={`task-options-${task.id}`}
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Task options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onEdit(task);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              Edit Task
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onDelete(task.id);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              Delete Task
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
