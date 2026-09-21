import React from 'react';
import { ActiveAlert } from '../services/reminderService';
import { BellRing, Check, X, Clock, TimerReset, Sparkles } from 'lucide-react';
import { formatTime12h } from '../utils/dateUtils';

interface AlertNotificationBannerProps {
  alerts: ActiveAlert[];
  onDismiss: (alertId: string) => void;
  onSnooze: (alertId: string, minutes?: number) => void;
  onCompleteTask: (taskId: string) => void;
}

export const AlertNotificationBanner: React.FC<AlertNotificationBannerProps> = ({
  alerts,
  onDismiss,
  onSnooze,
  onCompleteTask,
}) => {
  if (alerts.length === 0) return null;

  return (
    <aside
      aria-label="Task reminders"
      className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm sm:max-w-md w-full space-y-3 pointer-events-none"
    >
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="pointer-events-auto relative overflow-hidden rounded-3xl p-5 border border-indigo-200/80 shadow-2xl shadow-indigo-900/10 transition-all duration-300 animate-in slide-in-from-top-4 backdrop-blur-xl bg-linear-to-br from-white/95 via-indigo-50/70 to-purple-50/60"
        >
          {/* Aesthetic Calm Ambient Glow Blobs */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-purple-300/30 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-300/25 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-teal-200/20 rounded-full blur-xl pointer-events-none" />

          {/* Top Row: Tag, Time & Close */}
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Pulsing Bell Icon */}
              <div className="relative flex items-center justify-center">
                <span className="absolute inline-flex h-full w-full rounded-2xl bg-indigo-400 opacity-30 animate-ping" />
                <div className="relative w-10 h-10 rounded-2xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
                  <BellRing className="w-5 h-5 animate-pulse" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 uppercase tracking-widest bg-white/80 border border-indigo-100 px-2 py-0.5 rounded-full shadow-2xs">
                    <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                    Routine Alert
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {alert.timestamp || 'Now'}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 leading-snug tracking-tight mt-1 truncate max-w-[210px] sm:max-w-[240px]">
                  {alert.taskTitle}
                </h4>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(alert.id)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-xl transition-colors cursor-pointer"
              aria-label="Close alert"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Middle Row: Scheduled Details */}
          <div className="relative z-10 mt-2.5 pl-13">
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-white/70 px-2.5 py-1 rounded-xl border border-slate-200/60">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>Scheduled for {formatTime12h(alert.taskTime)}</span>
            </div>

            {alert.message && (
              <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed font-normal">
                {alert.message}
              </p>
            )}
          </div>

          {/* Action Row with SNOOZE 10m, MARK DONE & DISMISS */}
          <div className="relative z-10 mt-4 pt-3 border-t border-indigo-100/60 flex items-center justify-between gap-2">
            {/* Snooze 10m button */}
            <button
              type="button"
              id={`snooze-alert-${alert.id}`}
              onClick={() => onSnooze(alert.id, 10)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-slate-700 hover:text-indigo-700 border border-slate-200/90 hover:border-indigo-300 text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer group"
              title="Remind me again in 10 minutes"
            >
              <TimerReset className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              <span>Snooze 10m</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onDismiss(alert.id)}
                className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-white/60 rounded-xl transition-colors cursor-pointer"
              >
                Dismiss
              </button>

              <button
                type="button"
                onClick={() => onCompleteTask(alert.taskId)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Mark Done</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </aside>
  );
};
