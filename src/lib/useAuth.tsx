import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type AppRole = 'admin' | 'coordinator' | 'viewer';

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
  is_active: boolean;
}

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isCoordinator: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    let active = true;
    setLoading(true);
    supabase
      .from('profiles')
      .select('id, email, full_name, role, is_active')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) {
          setProfile(data as Profile | null);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isCoordinator = profile?.role === 'admin' || profile?.role === 'coordinator';

  return (
    <AuthContext.Provider value={{ session, profile, loading, isCoordinator, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
