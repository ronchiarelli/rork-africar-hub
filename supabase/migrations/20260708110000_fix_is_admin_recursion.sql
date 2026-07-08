-- Critical fix: is_admin() queries public.profiles, but was not SECURITY
-- DEFINER — so that internal query was itself subject to profiles' own RLS
-- policy ("id = auth.uid() OR is_admin()"), which calls is_admin() again.
-- This recursion was masked in every prior test because the other branch of
-- whatever OR expression called is_admin() happened to already be satisfied
-- (e.g. checking one's own row, or running inside an already-SECURITY-DEFINER
-- function that bypasses RLS entirely). The moment a genuine non-admin,
-- non-self-row check forces is_admin() to fully evaluate, Postgres does not
-- guarantee short-circuit evaluation order inside RLS-qualified expressions,
-- so it can call itself unboundedly and crash with "stack depth limit
-- exceeded" instead of cleanly returning false.
--
-- Fix: make is_admin() SECURITY DEFINER so its internal lookup bypasses RLS
-- on profiles entirely — this is the standard pattern for RLS helper
-- functions that need to read the very table their result gates.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
