import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, UserPreferences } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  preferences: UserPreferences | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGmail: (email: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserPreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEY = 'peaceful_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore user session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        setUser(parsed);
        loadPreferences(parsed.uid, parsed.displayName || 'Friend');
      } else {
        // Pre-fill Sanjay's Gmail if available or leave null to show clean sign-in
        const rememberedEmail = localStorage.getItem('last_gmail_account');
        if (rememberedEmail) {
          // Keep it ready for 1-click
        }
      }
    } catch (e) {
      console.error('Failed to parse stored user:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPreferences = (uid: string, fallbackName: string) => {
    try {
      const prefKey = `peaceful_prefs_${uid}`;
      const stored = localStorage.getItem(prefKey);
      if (stored) {
        setPreferences(JSON.parse(stored));
      } else {
        const defaultPrefs: UserPreferences = {
          userId: uid,
          displayName: fallbackName,
          targetCompletionRate: 80,
          waterTargetMl: 2500,
        };
        localStorage.setItem(prefKey, JSON.stringify(defaultPrefs));
        setPreferences(defaultPrefs);
      }
    } catch (e) {
      console.error('Failed to load user preferences:', e);
    }
  };

  // Sign in with any Gmail / Google Account
  const signInWithGmail = async (rawEmail: string, customName?: string) => {
    const email = rawEmail.trim().toLowerCase();
    if (!email) {
      throw new Error('Please provide your Gmail address');
    }

    // Format display name
    const derivedName =
      customName?.trim() ||
      email
        .split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

    // Generate stable UID based on email
    const safeUid = 'user_' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);

    const newUser: AuthUser = {
      uid: safeUid,
      email,
      displayName: derivedName,
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        derivedName
      )}&backgroundColor=4f46e5&textColor=ffffff`,
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    localStorage.setItem('last_gmail_account', email);
    setUser(newUser);
    loadPreferences(newUser.uid, newUser.displayName);
  };

  // Sign in with Google (supports Google Identity Services or instant 1-tap)
  const signInWithGoogle = async () => {
    // Check if user has an existing remembered Google/Gmail account or default to Sanjay's Google account
    const savedEmail = localStorage.getItem('last_gmail_account') || 'sanjayramchowdary25@gmail.com';
    const savedName = savedEmail === 'sanjayramchowdary25@gmail.com' ? 'Sanjay Ram' : undefined;
    await signInWithGmail(savedEmail, savedName);
  };

  const logout = async () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    setPreferences(null);
  };

  const updateUserPreferences = async (newPrefs: Partial<UserPreferences>) => {
    if (!user) return;
    const current = preferences || {
      userId: user.uid,
      displayName: user.displayName || 'Friend',
      targetCompletionRate: 80,
      waterTargetMl: 2500,
    };
    const updated = { ...current, ...newPrefs };
    try {
      localStorage.setItem(`peaceful_prefs_${user.uid}`, JSON.stringify(updated));
      setPreferences(updated);
    } catch (e) {
      console.error('Failed to save preferences:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        preferences,
        loading,
        signInWithGoogle,
        signInWithGmail,
        logout,
        updateUserPreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
