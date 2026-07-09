import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/lib/queries/profile';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const { data: profile, isLoading: isProfileLoading } = useProfile(session?.user.id);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const register = useCallback(async (name: string, email: string, phone: string, password: string, requestedRole?: 'fleet_owner' | 'dealership') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone, requested_role: requestedRole } },
    });
    if (error) throw error;
    return { needsEmailConfirmation: !data.session, userId: data.user?.id };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const isLoggedIn = !!session;
  const currentRole = profile?.role ?? 'customer';

  return useMemo(() => ({
    session,
    currentRole,
    currentUser: profile,
    isLoading: isLoading || (isLoggedIn && isProfileLoading),
    isLoggedIn,
    login,
    register,
    logout,
  }), [session, currentRole, profile, isLoading, isProfileLoading, isLoggedIn, login, register, logout]);
});
