import React, { useState } from 'react';
import { Task, TaskCategory, TaskRepeat, TaskReminder, ReminderType } from '../types';
import { requestNotificationPermission } from '../services/reminderService';
import { X, Clock, Tag, Repeat, FileText, Check, Bell, BellRing, Smartphone, Monitor } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  initialTask?: Task | null;
}

const CATEGORIES: TaskCategory[] = [
  'Personal',
  'Study',
  'College',
  'Exercise',
  'Food',
  'Sleep',
  'Other',
];

const REPEAT_OPTIONS: { id: TaskRepeat; label: string }[] = [
  { id: 'daily', label: 'Every Day' },
  { id: 'weekdays', label: 'Weekdays Only (Mon-Fri)' },
  { id: 'weekends', label: 'Weekends Only (Sat-Sun)' },
  { id: 'once', label: 'One Time (Today Only)' },
];

const TIMING_PRESETS = [
  { value: 0, label: 'At exact time' },
  { value: 5, label: '5 min before' },
  { value: 10, label: '10 min before' },
  { value: 15, label: '15 min before' },
  { value: 30, label: '30 min before' },
  { value: 60, label: '1 hour before' },
];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
}) => {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [time, setTime] = useState(initialTask?.time || '08:00');
  const [category, setCategory] = useState<TaskCategory>(initialTask?.category || 'Personal');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [repeat, setRepeat] = useState<TaskRepeat>(initialTask?.repeat || 'daily');

  // Reminder states
  const [reminderEnabled, setReminderEnabled] = useState(initialTask?.reminder?.enabled ?? false);
  const [reminderType, setReminderType] = useState<ReminderType>(initialTask?.reminder?.type || 'both');
  const [minutesBefore, setMinutesBefore] = useState<number>(initialTask?.reminder?.minutesBefore ?? 5);
  const [customTime, setCustomTime] = useState<string>(initialTask?.reminder?.customTime || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if initialTask changes
  React.useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setTime(initialTask.time);
      setCategory(initialTask.category);
      setDescription(initialTask.description || '');
      setRepeat(initialTask.repeat);
      setReminderEnabled(initialTask.reminder?.enabled ?? false);
      setReminderType(initialTask.reminder?.type || 'both');
      setMinutesBefore(initialTask.reminder?.minutesBefore ?? 5);
      setCustomTime(initialTask.reminder?.customTime || '');
    } else {
      setTitle('');
      setTime('08:00');
      setCategory('Personal');
      setDescription('');
      setRepeat('daily');
      setReminderEnabled(false);
      setReminderType('both');
      setMinutesBefore(5);
      setCustomTime('');
    }
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleToggleReminder = async (enabled: boolean) => {
    setReminderEnabled(enabled);
    if (enabled && (reminderType === 'push' || reminderType === 'both')) {
      await requestNotificationPermission();
    }
  };

  const handleReminderTypeChange = async (type: ReminderType) => {
    setReminderType(type);
    if (type === 'push' || type === 'both') {
      await requestNotificationPermission();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a task name');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const reminderPayload: TaskReminder | undefined = reminderEnabled
        ? {
            enabled: true,
            type: reminderType,
            minutesBefore,
            customTime: customTime || undefined,
          }
        : undefined;

      await onSave({
        title: title.trim(),
        time,
        category,
        description: description.trim(),
        repeat,
        reminder: reminderPayload,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="task-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div
        id="task-modal-content"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {initialTask ? 'Edit Task' : 'Add Daily Task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Task Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Task Name *
            </label>
            <input
              id="input-task-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Study Python, Morning Jog, Drink Water"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
          </div>

          {/* Time & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Scheduled Time
              </label>
              <input
                id="input-task-time"
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Category
              </label>
              <select
                id="select-task-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Repeat Option */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-slate-400" />
              Repeat Schedule
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REPEAT_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setRepeat(opt.id)}
                  className={`p-2.5 text-xs text-left rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    repeat === opt.id
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-medium'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span>{opt.label}</span>
                  {repeat === opt.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Customizable Task Reminder Section */}
          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${reminderEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Task Reminder</span>
                  <span className="text-[11px] text-slate-500">Get alerted when it's time for this activity</span>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                id="toggle-task-reminder"
                onClick={() => handleToggleReminder(!reminderEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  reminderEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    reminderEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {reminderEnabled && (
              <div className="pt-2 border-t border-slate-200/60 space-y-3 animate-in fade-in duration-150">
                {/* Reminder Type Selection */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Alert Delivery Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleReminderTypeChange('push')}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        reminderType === 'push'
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5 mx-auto mb-1 text-indigo-600" />
                      <span className="text-[11px] block">Push Notice</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReminderTypeChange('in-app')}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        reminderType === 'in-app'
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5 mx-auto mb-1 text-indigo-600" />
                      <span className="text-[11px] block">In-App Alert</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReminderTypeChange('both')}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        reminderType === 'both'
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <BellRing className="w-3.5 h-3.5 mx-auto mb-1 text-indigo-600" />
                      <span className="text-[11px] block">Both Types</span>
                    </button>
                  </div>
                </div>

                {/* Reminder Timing Preset */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    When to remind
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5">
                    {TIMING_PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset.value}
                        onClick={() => {
                          setMinutesBefore(preset.value);
                          setCustomTime('');
                        }}
                        className={`py-1.5 px-2 text-[11px] rounded-lg border transition-all cursor-pointer ${
                          minutesBefore === preset.value && !customTime
                            ? 'bg-indigo-600 border-indigo-600 text-white font-medium'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Or Custom Reminder Time */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                      Or Specific Custom Alert Time (Optional)
                    </label>
                    {customTime && (
                      <button
                        type="button"
                        onClick={() => setCustomTime('')}
                        className="text-[10px] text-indigo-600 hover:underline"
                      >
                        Reset to preset
                      </button>
                    )}
                  </div>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    placeholder="Specific time"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Overrides minutes before if specified.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Description / Notes (Optional)
            </label>
            <textarea
              id="input-task-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Chapter 4 data structures, drink 500ml before breakfast..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-submit-task"
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : initialTask ? 'Update Task' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
