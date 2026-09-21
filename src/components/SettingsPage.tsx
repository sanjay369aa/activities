import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPreferences } from '../types';
import {
  requestNotificationPermission,
  playChimeSound,
  sendBrowserPushNotification,
} from '../services/reminderService';
import {
  Settings as SettingsIcon,
  LogOut,
  Check,
  Sliders,
  ShieldCheck,
  Database,
  Target,
  Droplets,
  Bell,
  Volume2,
} from 'lucide-react';

interface SettingsPageProps {
  preferences: UserPreferences | null;
  onUpdate: (prefs: Partial<UserPreferences>) => Promise<void>;
  onTriggerTestAlert?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  preferences,
  onUpdate,
  onTriggerTestAlert,
}) => {
  const { user, logout } = useAuth();
  const [displayName, setDisplayName] = useState(preferences?.displayName || '');
  const [targetCompletionRate, setTargetCompletionRate] = useState(
    preferences?.targetCompletionRate || 80
  );
  const [waterTargetMl, setWaterTargetMl] = useState(preferences?.waterTargetMl || 2500);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdate({
        displayName: displayName.trim(),
        targetCompletionRate: Number(targetCompletionRate),
        waterTargetMl: Number(waterTargetMl),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="settings-page" className="max-w-2xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">User Settings & Preferences</h2>
            <p className="text-xs text-slate-500">Configure your daily targets, streak rules, and account.</p>
          </div>
        </div>
      </div>

      {saved && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Your settings have been saved and synced to Firebase.</span>
        </div>
      )}

      {/* Profile & Target Form */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span>Routine & Target Goals</span>
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Your Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            Used in the daily dashboard greeting (e.g. "Good Morning, {displayName || 'Sanjay'}")
          </span>
        </div>

        {/* Target Completion % for Streaks */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              Daily Streak Target
            </span>
            <span className="text-indigo-600 font-bold">{targetCompletionRate}%</span>
          </label>
          <input
            type="range"
            min={40}
            max={100}
            step={5}
            value={targetCompletionRate}
            onChange={(e) => setTargetCompletionRate(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1">
            <span>40% (Flexible)</span>
            <span>80% (Standard)</span>
            <span>100% (Strict)</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Completing this percentage of scheduled tasks on a date counts towards increasing your active streak.
          </span>
        </div>

        {/* Daily Water Target */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-cyan-600" />
            Daily Water Hydration Goal (ml)
          </label>
          <input
            type="number"
            min={500}
            max={6000}
            step={100}
            value={waterTargetMl}
            onChange={(e) => setWaterTargetMl(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">Default target is 2500 ml (~8 glasses).</span>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </form>

      {/* Reminders & Notifications Control Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-600" />
          <span>Task Reminders & Notification Setup</span>
        </h3>

        <p className="text-xs text-slate-500">
          Reminders notify you before or during each task with audio chimes and system notifications.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={async () => {
              const res = await requestNotificationPermission();
              alert(`Browser push notification permission is: ${res}`);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4 text-indigo-600" />
            <span>Enable Push Notifications</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playChimeSound();
              sendBrowserPushNotification(
                'Test Reminder Alert',
                'Your task reminders and chimes are working properly!'
              );
              if (onTriggerTestAlert) {
                onTriggerTestAlert();
              }
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-700 transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-indigo-600" />
            <span>Test Sound & Live Alert Banner</span>
          </button>
        </div>
      </div>

      {/* Account Info & Logout */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Account & Security</span>
        </h3>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Firebase UID:</span>
            <span className="font-mono text-[11px] text-slate-700">{user?.uid}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Email:</span>
            <span className="font-medium text-slate-800">{user?.email || 'N/A'}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => logout()}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of My Account</span>
        </button>
      </div>
    </div>
  );
};
