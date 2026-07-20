-- Security Advisor: set_updated_at had no fixed search_path, leaving it
-- theoretically susceptible to search_path hijacking (a caller-controlled
-- schema shadowing an object this SECURITY DEFINER-adjacent trigger
-- function resolves unqualified). It only touches NEW.updated_at so the
-- practical risk here was low, but pinning search_path costs nothing and
-- matches every other function in this schema.
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
