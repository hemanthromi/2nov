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
  /** Can edit tasks/categories/people/import for this app (bvp_access grant, or admin). */
  isCoordinator: boolean;
  /** Can manage who has access to this app (bvp_access grant, or global admin). */
  isBvpAdmin: boolean;
  signOut: () => Promise<void>;
  refreshAccess: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [isBvpAdmin, setIsBvpAdmin] = useState(false);
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
        setIsCoordinator(false);
        setIsBvpAdmin(false);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadAccess(userId: string) {
    const [profileRes, coordinatorRes, adminRes] = await Promise.all([
      supabase.from('profiles').select('id, email, full_name, role, is_active').eq('id', userId).maybeSingle(),
      supabase.rpc('bvp_is_coordinator'),
      supabase.rpc('bvp_is_bvp_admin'),
    ]);
    setProfile(profileRes.data as Profile | null);
    setIsCoordinator(Boolean(coordinatorRes.data));
    setIsBvpAdmin(Boolean(adminRes.data));
    setLoading(false);
  }

  useEffect(() => {
    if (!session?.user) return;
    setLoading(true);
    loadAccess(session.user.id);
  }, [session?.user?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshAccess = async () => {
    if (session?.user) await loadAccess(session.user.id);
  };

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, isCoordinator, isBvpAdmin, signOut, refreshAccess }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
