-- Platform-wide subscription rate is now configurable by an admin instead of
-- hardcoded 150 throughout the schema. Bumps the current rate to GH₵250/month
-- and updates every existing subscription (trialing, active, past_due, and
-- cancelled) to bill at the new rate going forward.

create table public.platform_settings (
  id boolean primary key default true,
  subscription_monthly_rate numeric not null default 250,
  updated_at timestamptz not null default now(),
  constraint platform_settings_singleton check (id)
);

insert into public.platform_settings (id, subscription_monthly_rate) values (true, 250);

update public.subscriptions set amount = 250, updated_at = now();

alter table public.platform_settings enable row level security;
grant select on public.platform_settings to authenticated;
create policy "platform_settings_select" on public.platform_settings for select using (true);

-- New trial subscriptions now pick up whatever rate is currently configured.
create or replace function public.start_trial_subscription(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_rate numeric;
begin
  select subscription_monthly_rate into v_rate from public.platform_settings limit 1;

  insert into public.subscriptions (user_id, status, amount, trial_ends_at, current_period_end)
  values (p_user_id, 'trialing', coalesce(v_rate, 250), now() + interval '14 days', now() + interval '14 days')
  on conflict (user_id) do nothing;

  insert into public.wallets (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;
end;
$$;

-- Admin-only: changes the platform rate and applies it to every existing
-- subscription so the next renewal (attempt_subscription_renewal reads
-- subscriptions.amount per-row) bills at the new rate too.
create or replace function public.admin_set_subscription_rate(p_rate numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can update the subscription rate';
  end if;
  if p_rate is null or p_rate <= 0 then
    raise exception 'Rate must be a positive number';
  end if;

  update public.platform_settings set subscription_monthly_rate = p_rate, updated_at = now();
  update public.subscriptions set amount = p_rate, updated_at = now();
end;
$$;

grant execute on function public.admin_set_subscription_rate(numeric) to authenticated;
