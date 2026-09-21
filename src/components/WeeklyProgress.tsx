import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { getWeekDates, parseISODate, formatISODate } from '../utils/dateUtils';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { BarChart3, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';

interface WeeklyProgressProps {
  userId: string;
  allTasks: Task[];
  onSelectDate: (date: string) => void;
}

export const WeeklyProgress: React.FC<WeeklyProgressProps> = ({
  userId,
  allTasks,
  onSelectDate,
}) => {
  const [completionsMap, setCompletionsMap] = useState<Record<string, number>>({});
  const weekDates = getWeekDates();

  useEffect(() => {
    async function loadWeekData() {
      if (!userId) return;
      try {
        const compRef = collection(db, 'dailyCompletions');
        const q = query(compRef, where('userId', '==', userId));
        const snap = await getDocs(q);

        const map: Record<string, number> = {};
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.completed) {
            map[d.date] = (map[d.date] || 0) + 1;
          }
        });
        setCompletionsMap(map);
      } catch (err) {
        console.error('Failed loading weekly completions:', err);
      }
    }
    loadWeekData();
  }, [userId]);

  // Compute daily percentages for the current week
  const weekData = weekDates.map((dateStr) => {
    const d = parseISODate(dateStr);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const dayOfWeek = d.getDay();

    const eligibleTasks = allTasks.filter((t) => {
      if (t.startDate && dateStr < t.startDate) return false;
      if (t.repeat === 'weekdays' && (dayOfWeek === 0 || dayOfWeek === 6)) return false;
      if (t.repeat === 'weekends' && dayOfWeek >= 1 && dayOfWeek <= 5) return false;
      if (t.repeat === 'once' && t.startDate !== dateStr) return false;
      return true;
    });

    const total = eligibleTasks.length;
    const completed = completionsMap[dateStr] || 0;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      dateStr,
      dayName,
      shortName: dayName.slice(0, 3),
      total,
      completed,
      pct,
    };
  });

  const totalPercentageSum = weekData.reduce((acc, curr) => acc + curr.pct, 0);
  const weeklyAverage = Math.round(totalPercentageSum / 7);

  return (
    <div id="weekly-progress-view" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Weekly Analytics</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">Current Week Performance</h2>
          <p className="text-xs text-slate-500">
            Track your completion consistency day-by-day to maintain healthy habits.
          </p>
        </div>

        {/* Weekly Average Pill */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 px-5 text-center sm:text-right">
          <span className="block text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
            Weekly Average
          </span>
          <span className="text-2xl font-black text-indigo-900">{weeklyAverage}%</span>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          Weekly Completion Rates (Mon – Sun)
        </h3>

        {/* Vertical Bars Container */}
        <div className="flex items-end justify-between gap-2 sm:gap-6 h-56 pt-8 pb-2 px-2 border-b border-slate-100">
          {weekData.map((item) => {
            const isToday = item.dateStr === formatISODate();
            return (
              <div
                key={item.dateStr}
                onClick={() => onSelectDate(item.dateStr)}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
              >
                {/* Tooltip / Label on top of bar */}
                <span className="text-[11px] font-bold text-slate-700 mb-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  {item.pct}%
                </span>

                {/* The visual Bar */}
                <div className="w-full max-w-[42px] bg-slate-100 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                  <div
                    className={`w-full transition-all duration-500 rounded-t-lg ${
                      item.pct >= 80
                        ? 'bg-emerald-500 group-hover:bg-emerald-600'
                        : item.pct > 0
                        ? 'bg-indigo-500 group-hover:bg-indigo-600'
                        : 'bg-transparent'
                    }`}
                    style={{ height: `${Math.max(item.pct, 4)}%` }}
                  />
                </div>

                {/* Day name below bar */}
                <div className="mt-3 text-center">
                  <span
                    className={`block text-xs font-semibold uppercase ${
                      isToday ? 'text-indigo-600 font-bold' : 'text-slate-600'
                    }`}
                  >
                    {item.shortName}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {item.completed}/{item.total}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Structured Day-by-Day List (as requested in spec: Monday 80%, Tuesday 60%...) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Detailed Breakdown</h3>
        <div className="space-y-3">
          {weekData.map((day) => (
            <div
              key={day.dateStr}
              onClick={() => onSelectDate(day.dateStr)}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50/50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
                  {day.shortName}
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-800">{day.dayName}</span>
                  <span className="text-xs text-slate-400 ml-2">({day.dateStr})</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500">
                  {day.completed} of {day.total} tasks
                </span>
                <span
                  className={`text-sm font-bold min-w-10 text-right ${
                    day.pct >= 80 ? 'text-emerald-600' : 'text-slate-800'
                  }`}
                >
                  {day.pct}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
