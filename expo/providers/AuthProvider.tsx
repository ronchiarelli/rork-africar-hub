import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/lib/queries/profile';

// supabase.functions.invoke() surfaces a non-2xx as a generic
// FunctionsHttpError and buries the JSON body on .context — which is where
// our real message ("Too many incorrect PIN attempts…") lives.
async function readFunctionError(error: unknown, fallback: string): Promise<string> {
  const ctx = (error as { context?: Response })?.context;
  if (ctx && typeof ctx.json === 'function') {
    try {
      const body = await ctx.json();
      if (body?.error) return body.error as string;
    } catch {
      // non-JSON body; fall through
    }
  }
  return (error as { message?: string })?.message ?? fallback;
}

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

  // Phone + PIN goes through an Edge Function rather than
  // signInWithPassword, because the per-account lockout that makes a
  // 6-digit PIN viable can only be enforced server-side. The function
  // returns the token pair, which we hand to setSession so the rest of the
  // app sees an ordinary Supabase session.
  const loginWithPin = useCallback(async (phone: string, pin: string) => {
    const { data, error } = await supabase.functions.invoke<{ access_token: string; refresh_token: string; error?: string }>(
      'phone-pin-auth',
      { body: { action: 'login', phone, pin } }
    );
    if (error) throw new Error(await readFunctionError(error, 'Could not sign in.'));
    if (!data?.access_token) throw new Error(data?.error ?? 'Could not sign in.');
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
    if (sessionError) throw sessionError;
  }, []);

  const registerWithPin = useCallback(async (name: string, phone: string, pin: string) => {
    const { data, error } = await supabase.functions.invoke<{ access_token: string; refresh_token: string; error?: string }>(
      'phone-pin-auth',
      { body: { action: 'register', phone, pin, name } }
    );
    if (error) throw new Error(await readFunctionError(error, 'Could not create your account.'));
    if (!data?.access_token) throw new Error(data?.error ?? 'Could not create your account.');
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
    if (sessionError) throw sessionError;
  }, []);

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
    loginWithPin,
    register,
    registerWithPin,
    logout,
    justRegisteredRole,
    markJustRegistered,
    clearJustRegistered,
  }), [session, currentRole, profile, isLoading, isProfileLoading, isLoggedIn, login, loginWithPin, register, registerWithPin, logout, justRegisteredRole, markJustRegistered, clearJustRegistered]);
});
