import React, { useState, useEffect } from 'react';
import { subscribeWaterLog, addWater, resetWater } from '../services/scheduleService';
import { DailyWaterLog } from '../types';
import { Droplets, Plus, RotateCcw, Award } from 'lucide-react';

interface WaterTrackerProps {
  userId: string;
  date: string;
  targetMl?: number;
}

export const WaterTracker: React.FC<WaterTrackerProps> = ({
  userId,
  date,
  targetMl = 2500,
}) => {
  const [log, setLog] = useState<DailyWaterLog | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeWaterLog(userId, date, (data) => {
      setLog(data);
    });
    return () => unsub();
  }, [userId, date]);

  const currentAmount = log?.amountMl || 0;
  const currentTarget = log?.targetMl || targetMl;
  const percentage = Math.min(100, Math.round((currentAmount / currentTarget) * 100));

  const handleAdd = async (amount: number) => {
    setLoading(true);
    try {
      await addWater(userId, date, amount, currentTarget);
    } catch (err) {
      console.error('Failed to log water:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset water progress for this date?')) return;
    try {
      await resetWater(userId, date, currentTarget);
    } catch (err) {
      console.error('Failed to reset water:', err);
    }
  };

  return (
    <div id="water-tracker" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <Droplets className="w-5 h-5 fill-cyan-500 text-cyan-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Water Hydration Tracker</h2>
            <p className="text-xs text-slate-500">Date: {date}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Main Stats Display */}
      <div className="bg-cyan-50/50 border border-cyan-100 rounded-2xl p-6 text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-700">Today's Water</span>
        <div className="text-3xl sm:text-4xl font-black text-cyan-950 my-2">
          {currentAmount} <span className="text-lg sm:text-xl font-normal text-slate-500">/ {currentTarget} ml</span>
        </div>

        {/* Hydration Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-3.5 mt-3 overflow-hidden">
          <div
            className="h-full bg-cyan-500 transition-all duration-500 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="block text-xs font-semibold text-cyan-800 mt-2">
          {percentage}% of daily hydration target achieved
        </span>
      </div>

      {/* Quick Add Buttons */}
      <div>
        <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Log Intake
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            id="btn-add-water-250"
            disabled={loading}
            onClick={() => handleAdd(250)}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/30 text-slate-800 font-semibold text-sm rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-cyan-600" />
            <span>+250 ml</span>
          </button>

          <button
            type="button"
            id="btn-add-water-500"
            disabled={loading}
            onClick={() => handleAdd(500)}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/30 text-slate-800 font-semibold text-sm rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-cyan-600" />
            <span>+500 ml</span>
          </button>

          <button
            type="button"
            id="btn-add-water-750"
            disabled={loading}
            onClick={() => handleAdd(750)}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/30 text-slate-800 font-semibold text-sm rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-cyan-600" />
            <span>+750 ml</span>
          </button>

          <button
            type="button"
            id="btn-add-water-1000"
            disabled={loading}
            onClick={() => handleAdd(1000)}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+1000 ml</span>
          </button>
        </div>
      </div>
    </div>
  );
};
