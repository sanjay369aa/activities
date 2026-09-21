import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Sparkles, Mail, ArrowRight, ShieldCheck, Check } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { signInWithGoogle, signInWithGmail } = useAuth();
  const [gmailInput, setGmailInput] = useState('sanjayramchowdary25@gmail.com');
  const [nameInput, setNameInput] = useState('Sanjay Ram');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleQuick = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!gmailInput.trim()) {
      setError('Please enter your Gmail address');
      return;
    }
    setLoading(true);
    try {
      await signInWithGmail(gmailInput, nameInput);
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in with Gmail');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="auth-modal"
      className="relative min-h-screen bg-peaceful-morning flex items-center justify-center p-4 sm:p-6 text-slate-800 overflow-hidden"
    >
      {/* Peaceful Floating Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-300/30 rounded-full blur-3xl animate-gentle-drift" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-300/30 rounded-full blur-3xl animate-gentle-drift-delayed" />
        <div className="absolute top-1/2 left-1/3 w-60 h-60 bg-pink-200/25 rounded-full blur-3xl" />
        <div className="absolute top-24 left-[14%] text-2xl opacity-40 select-none animate-gentle-drift">
          🌸
        </div>
        <div className="absolute top-44 right-[12%] text-3xl opacity-35 select-none animate-gentle-drift-delayed">
          ☁️
        </div>
        <div className="absolute bottom-24 right-1/4 text-2xl opacity-40 select-none animate-gentle-drift">
          🌿
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md peaceful-card rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-2xl animate-bounce">🌸</span>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <CheckCircle className="w-8 h-8" />
            </div>
            <span className="text-2xl animate-bounce">🌿</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Daily Schedule</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Sign in with your Gmail account to manage daily routines, track hydration, and preserve streaks.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
            {error}
          </div>
        )}

        {/* 1-Click Fast Google Sign-in */}
        <div className="space-y-3">
          <button
            id="btn-google-login"
            type="button"
            onClick={handleGoogleQuick}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 rounded-2xl text-sm font-semibold text-slate-800 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            {/* Google G Logo */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Quick One-Tap Account Chip */}
          <div
            onClick={handleGoogleQuick}
            className="group flex items-center justify-between p-2.5 px-3.5 bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-100/90 rounded-2xl cursor-pointer transition-all"
            title="Click to sign in instantly"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                S
              </div>
              <div className="truncate text-left">
                <span className="block text-xs font-semibold text-slate-800 truncate">
                  Sanjay Ram
                </span>
                <span className="block text-[11px] text-slate-500 truncate">
                  sanjayramchowdary25@gmail.com
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform shrink-0 flex items-center gap-1">
              <span>Quick Login</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200/80"></div>
          </div>
          <div className="relative flex justify-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="bg-white/80 backdrop-blur-xs px-3 rounded-full">
              or use another Gmail
            </span>
          </div>
        </div>

        {/* Gmail Form */}
        <form onSubmit={handleGmailSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Gmail Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="input-gmail"
                type="email"
                required
                value={gmailInput}
                onChange={(e) => setGmailInput(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white/90 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Your Name (Optional)
            </label>
            <input
              id="input-name"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="e.g. Sanjay"
              className="w-full px-3.5 py-2.5 text-sm bg-white/90 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          <button
            id="btn-gmail-signin"
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{loading ? 'Connecting...' : 'Sign In with Gmail'}</span>
          </button>
        </form>

        {/* Peaceful Security Badge */}
        <div className="mt-5 pt-4 border-t border-indigo-50 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Works instantly on Vercel with zero database setup</span>
        </div>
      </div>
    </div>
  );
};
