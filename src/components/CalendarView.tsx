import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { getPastDates, formatDisplayDate, parseISODate, formatISODate } from '../utils/dateUtils';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar as CalendarIcon, CheckCircle2, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface CalendarViewProps {
  userId: string;
  selectedDate: string;
  allTasks: Task[];
  onSelectDate: (date: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  userId,
  selectedDate,
  allTasks,
  onSelectDate,
}) => {
  const [completionsByDate, setCompletionsByDate] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Default to showing past 14 days up to today + upcoming 3 days
  const todayStr = formatISODate();
  const pastDays = getPastDates(14, todayStr);
  const nextDays = [1, 2, 3].map((offset) => {
    const d = parseISODate(todayStr);
    d.setDate(d.getDate() + offset);
    return formatISODate(d);
  });
  const visibleDates = [...pastDays, ...nextDays];

  useEffect(() => {
    async function loadCompletions() {
      if (!userId) return;
      try {
        const compRef = collection(db, 'dailyCompletions');
        const q = query(compRef, where('userId', '==', userId));
        const snap = await getDocs(q);

        const map: Record<string, number> = {};
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.completed) {
            map[data.date] = (map[data.date] || 0) + 1;
          }
        });
        setCompletionsByDate(map);
      } catch (err) {
        console.error('Failed to load past completions:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCompletions();
  }, [userId]);

  return (
    <div id="calendar-view" className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <CalendarIcon className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Calendar & History</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">Review Past & Upcoming Days</h2>
          <p className="text-xs text-slate-500">
            Click any day to inspect your completed checklist and productivity rate for that date.
          </p>
        </div>

        {/* Date Selector input for quick jumping */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Jump to date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && onSelectDate(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
        </div>
      </div>

      {/* Grid of Days */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {visibleDates.map((dateStr) => {
          const dateObj = parseISODate(dateStr);
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === todayStr;
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const monthName = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          // Calculate eligible tasks on that day
          const dayOfWeek = dateObj.getDay();
          const dayTasks = allTasks.filter((t) => {
            if (t.startDate && dateStr < t.startDate) return false;
            if (t.repeat === 'weekdays' && (dayOfWeek === 0 || dayOfWeek === 6)) return false;
            if (t.repeat === 'weekends' && dayOfWeek >= 1 && dayOfWeek <= 5) return false;
            if (t.repeat === 'once' && t.startDate !== dateStr) return false;
            return true;
          });

          const total = dayTasks.length;
          const completed = completionsByDate[dateStr] || 0;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              className={`relative flex flex-col items-center p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20'
                  : isToday
                  ? 'bg-white border-indigo-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {isToday && (
                <span className="absolute -top-2 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                  Today
                </span>
              )}

              <span className="text-[11px] font-semibold uppercase text-slate-400">
                {dayName}
              </span>
              <span className="text-sm font-bold text-slate-800 my-0.5">{monthName}</span>

              {/* Progress pill */}
              <div className="mt-2 w-full pt-2 border-t border-slate-100 flex flex-col items-center">
                <span className="text-xs font-medium text-slate-600">
                  {completed}/{total} done
                </span>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      pct >= 80 ? 'bg-emerald-500' : pct > 0 ? 'bg-indigo-500' : 'bg-transparent'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
