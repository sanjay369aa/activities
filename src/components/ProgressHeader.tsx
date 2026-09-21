import React from 'react';
import { Flame, Award, CheckCircle2, TrendingUp } from 'lucide-react';

interface ProgressHeaderProps {
  userName: string;
  greeting: string;
  completedCount: number;
  totalCount: number;
  currentStreak: number;
  bestStreak: number;
  targetCompletionRate: number;
}

export const ProgressHeader: React.FC<ProgressHeaderProps> = ({
  userName,
  greeting,
  completedCount,
  totalCount,
  currentStreak,
  bestStreak,
  targetCompletionRate,
}) => {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const remainingCount = Math.max(0, totalCount - completedCount);
  const targetMet = percentage >= targetCompletionRate && totalCount > 0;

  return (
    <div
      id="progress-header"
      className="relative overflow-hidden peaceful-card rounded-3xl p-5 sm:p-6 mb-6"
    >
      {/* Aesthetic Peaceful ambient blur highlights */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-200/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top row: Greeting & Streak Badge */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-50">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {greeting}, {userName}!
            </h1>
            <span className="text-lg" title="Peace & focus">✨</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {totalCount === 0
              ? 'Ready to plan your day? Add your first task below.'
              : `${completedCount} of ${totalCount} tasks completed (${percentage}%)`}
          </p>
        </div>

        {/* Streak Pill */}
        <div className="flex items-center gap-3 bg-amber-50/90 border border-amber-200/80 px-4 py-2 rounded-2xl text-amber-900 shadow-2xs">
          <div className="flex items-center gap-1.5 font-bold text-sm">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
            <span>{currentStreak} Day Streak</span>
          </div>
          <div className="text-slate-300">|</div>
          <div className="text-xs text-amber-800/80 font-medium">
            Best: <span className="font-semibold text-amber-900">{bestStreak}d</span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Stats */}
      <div className="relative z-10 mt-4">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <div className="flex items-center gap-1.5 text-slate-700">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            <span>Today's Progress: {percentage}%</span>
            {targetMet && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full ml-1.5 shadow-2xs">
                Target Met (≥{targetCompletionRate}%)
              </span>
            )}
          </div>
          <span className="text-slate-500 font-medium">
            {completedCount} / {totalCount} completed
          </span>
        </div>

        {/* Outer Bar */}
        <div className="w-full bg-slate-100/90 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-200/60">
          <div
            className={`h-full transition-all duration-500 ease-out rounded-full shadow-2xs ${
              percentage === 100
                ? 'bg-linear-to-r from-emerald-500 to-teal-500'
                : percentage >= targetCompletionRate
                ? 'bg-linear-to-r from-indigo-500 to-purple-600'
                : 'bg-linear-to-r from-indigo-500 to-indigo-600'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* 3 Metric Pills with Stickers: Completed, Remaining, Total */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mt-4 pt-1">
          <div className="relative overflow-hidden bg-white/90 border border-emerald-100/90 rounded-2xl p-3 text-center shadow-2xs group hover:border-emerald-200 transition-colors">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <span className="text-sm">🎯</span>
              <span className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider">Done</span>
            </div>
            <span className="text-lg sm:text-2xl font-black text-emerald-600">{completedCount}</span>
          </div>

          <div className="relative overflow-hidden bg-white/90 border border-amber-100/90 rounded-2xl p-3 text-center shadow-2xs group hover:border-amber-200 transition-colors">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <span className="text-sm">⏳</span>
              <span className="text-[11px] text-amber-700 font-bold uppercase tracking-wider">Pending</span>
            </div>
            <span className="text-lg sm:text-2xl font-black text-amber-600">{remainingCount}</span>
          </div>

          <div className="relative overflow-hidden bg-white/90 border border-indigo-100/90 rounded-2xl p-3 text-center shadow-2xs group hover:border-indigo-200 transition-colors">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <span className="text-sm">📋</span>
              <span className="text-[11px] text-indigo-700 font-bold uppercase tracking-wider">Total</span>
            </div>
            <span className="text-lg sm:text-2xl font-black text-slate-800">{totalCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
