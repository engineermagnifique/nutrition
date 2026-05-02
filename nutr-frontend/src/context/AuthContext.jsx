import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { authService } from '../services/auth.service';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setProfileLoading(true);
        try {
          const res = await authService.getProfile();
          setProfile(res.data);
        } catch {
          setProfile(null);
        } finally {
          setProfileLoading(false);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshProfile = async () => {
    if (!firebaseUser) return;
    try {
      const res = await authService.getProfile();
      setProfile(res.data);
    } catch {
      setProfile(null);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const value = {
    firebaseUser,
    profile,
    loading: loading || profileLoading,
    isAuthenticated: !!firebaseUser,
    isProfileComplete: !!profile,
    isEmailVerified: profile?.email_verified ?? false,
    role: profile?.role ?? null,
    logout,
    refreshProfile,
    setProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
