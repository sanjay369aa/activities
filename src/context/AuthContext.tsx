import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { UserPreferences } from '../types';

interface AuthContextType {
  user: User | null;
  preferences: UserPreferences | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserPreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setPreferences(snap.data() as UserPreferences);
          } else {
            const defaultPrefs: UserPreferences = {
              userId: currentUser.uid,
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Friend',
              targetCompletionRate: 80,
              waterTargetMl: 2500,
            };
            await setDoc(userDocRef, defaultPrefs);
            setPreferences(defaultPrefs);
          }
        } catch (err) {
          console.error('Error fetching user preferences:', err);
        }
      } else {
        setPreferences(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
      const defaultPrefs: UserPreferences = {
        userId: cred.user.uid,
        displayName: name || 'Friend',
        targetCompletionRate: 80,
        waterTargetMl: 2500,
      };
      await setDoc(doc(db, 'users', cred.user.uid), defaultPrefs);
      setPreferences(defaultPrefs);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateUserPreferences = async (newPrefs: Partial<UserPreferences>) => {
    if (!user) return;
    const updated = {
      ...(preferences || {
        userId: user.uid,
        displayName: user.displayName || 'Friend',
        targetCompletionRate: 80,
        waterTargetMl: 2500,
      }),
      ...newPrefs,
    };
    await setDoc(doc(db, 'users', user.uid), updated, { merge: true });
    setPreferences(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        preferences,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
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
