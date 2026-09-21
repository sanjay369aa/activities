import React from 'react';
import {
  Home,
  ListTodo,
  Calendar,
  Droplets,
  Utensils,
  Camera,
  BarChart3,
  Sparkles,
  Settings,
} from 'lucide-react';

export type NavTab =
  | 'home'
  | 'schedule'
  | 'calendar'
  | 'water'
  | 'food'
  | 'scan'
  | 'progress'
  | 'ai'
  | 'settings';

export type PeacefulTheme = 'morning' | 'zen' | 'sunset' | 'twilight';

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  peacefulTheme?: PeacefulTheme;
  onThemeChange?: (theme: PeacefulTheme) => void;
}

const THEME_OPTIONS: { id: PeacefulTheme; label: string; emoji: string }[] = [
  { id: 'morning', label: 'Morning Calm', emoji: '🌸' },
  { id: 'zen', label: 'Zen Meadow', emoji: '🍃' },
  { id: 'sunset', label: 'Sunset Glow', emoji: '🌅' },
  { id: 'twilight', label: 'Night Serenity', emoji: '🌌' },
];

const NAV_ITEMS: { id: NavTab; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
  { id: 'schedule', label: 'My Schedule', icon: <ListTodo className="w-4 h-4" /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
  { id: 'water', label: 'Water', icon: <Droplets className="w-4 h-4" /> },
  { id: 'food', label: 'Food', icon: <Utensils className="w-4 h-4" /> },
  { id: 'scan', label: 'Scan Food', icon: <Camera className="w-4 h-4" /> },
  { id: 'progress', label: 'Progress', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'ai', label: 'AI Assistant', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
];

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  peacefulTheme = 'morning',
  onThemeChange,
}) => {
  const [themeMenuOpen, setThemeMenuOpen] = React.useState(false);
  const currentTheme = THEME_OPTIONS.find((t) => t.id === peacefulTheme) || THEME_OPTIONS[0];

  return (
    <>
      {/* Desktop / Tablet Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-indigo-100/80 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div
            onClick={() => onTabChange('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-base shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              ✓
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight block leading-tight flex items-center gap-1.5">
                <span>My Daily Schedule</span>
                <span className="text-xs text-indigo-500" title="Peaceful daily rituals">🌿</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Routine & Checklist</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Peaceful Atmosphere Theme Dropdown */}
            {onThemeChange && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setThemeMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 hover:bg-white border border-indigo-100/90 text-slate-700 shadow-2xs transition-all cursor-pointer"
                  title="Change peaceful atmosphere"
                >
                  <span className="text-sm">{currentTheme.emoji}</span>
                  <span className="hidden sm:inline-block text-[11px] font-medium text-slate-600">
                    {currentTheme.label}
                  </span>
                </button>

                {themeMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-indigo-100 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                      Calm Atmosphere
                    </div>
                    {THEME_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          onThemeChange(opt.id);
                          setThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left ${
                          peacefulTheme === opt.id
                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-base">{opt.emoji}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Desktop Nav Pills */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-tab-${item.id}`}
                    type="button"
                    onClick={() => onTabChange(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Scrollable for compact access) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 shadow-lg flex items-center overflow-x-auto gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center shrink-0 min-w-[62px] py-1.5 px-1 rounded-xl text-[10px] font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'text-indigo-600 font-bold bg-indigo-50/80'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="mb-0.5">{item.icon}</div>
              <span className="truncate max-w-[64px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
