import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/lib/queries/profile';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Set right after a fresh sign-up + auto-login. The root layout's auth
  // guard immediately redirects a newly-logged-in user away from
  // register.tsx to Home, so a "just registered" welcome modal can't live
  // as local state on the register screen — it would unmount before ever
  // rendering. Home reads this flag instead, once, then clears it.
  const [justRegisteredRole, setJustRegisteredRole] = useState<'customer' | 'fleet_owner' | 'dealership' | null>(null);

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

  const register = useCallback(async (name: string, email: string, phone: string | undefined, password: string, requestedRole?: 'fleet_owner' | 'dealership') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone: phone ?? null, requested_role: requestedRole } },
    });
    if (error) throw error;
    return { needsEmailConfirmation: !data.session, userId: data.user?.id };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const markJustRegistered = useCallback((role: 'customer' | 'fleet_owner' | 'dealership') => {
    setJustRegisteredRole(role);
  }, []);

  const clearJustRegistered = useCallback(() => {
    setJustRegisteredRole(null);
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
    justRegisteredRole,
    markJustRegistered,
    clearJustRegistered,
  }), [session, currentRole, profile, isLoading, isProfileLoading, isLoggedIn, login, register, logout, justRegisteredRole, markJustRegistered, clearJustRegistered]);
});
