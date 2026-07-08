-- Wallet is now scoped to fleet_owner/dealership accounts only, specifically
-- to prepay their GH₵150/month platform subscription. Customers no longer
-- get an automatic wallet row (there's nothing in-app for them to spend it
-- on since bookings are settled directly with the owner).

-- Stop creating a wallet for every new signup — it now happens alongside
-- start_trial_subscription() instead, i.e. only for approved fleet_owner /
-- dealership accounts.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    new.raw_user_meta_data->>'phone',
    'customer'
  );
  return new;
end;
$$;

create or replace function public.start_trial_subscription(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions (user_id, status, amount, trial_ends_at, current_period_end)
  values (p_user_id, 'trialing', 150, now() + interval '14 days', now() + interval '14 days')
  on conflict (user_id) do nothing;

  insert into public.wallets (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;
end;
$$;

-- Auto-debit renewal: tries to fund the next month from wallet balance.
-- Leaves the subscription's current_period_end untouched (still lapsed, so
-- owner_subscription_active() correctly treats it as inactive) when the
-- wallet doesn't have enough — no destructive action, just no renewal.
create or replace function public.attempt_subscription_renewal(p_subscription_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_sub public.subscriptions%rowtype;
  v_wallet public.wallets%rowtype;
begin
  select * into v_sub from public.subscriptions where id = p_subscription_id for update;
  if not found then
    return false;
  end if;

  if v_sub.current_period_end is not null and v_sub.current_period_end > now() then
    return true; -- not due yet
  end if;

  select * into v_wallet from public.wallets where user_id = v_sub.user_id for update;

  if not found or v_wallet.balance < v_sub.amount then
    update public.subscriptions set status = 'past_due' where id = p_subscription_id;
    return false;
  end if;

  update public.wallets set balance = balance - v_sub.amount, updated_at = now()
  where user_id = v_sub.user_id;

  insert into public.wallet_transactions (wallet_id, type, amount, description, status)
  values (v_sub.user_id, 'debit', v_sub.amount, 'GoCar Hub subscription renewal', 'completed');

  update public.subscriptions
  set status = 'active', current_period_end = greatest(current_period_end, now()) + interval '30 days'
  where id = p_subscription_id;

  insert into public.subscription_payments (subscription_id, amount, status, period_start, period_end)
  values (p_subscription_id, v_sub.amount, 'completed', now(), now() + interval '30 days');

  return true;
end;
$$;

-- Runs across every subscription currently due; scheduled via pg_cron below.
create or replace function public.run_subscription_renewals()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  for v_id in
    select id from public.subscriptions
    where status in ('trialing', 'active', 'past_due')
      and current_period_end is not null
      and current_period_end <= now()
  loop
    perform public.attempt_subscription_renewal(v_id);
  end loop;
end;
$$;

create extension if not exists pg_cron;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'daily-subscription-renewal') then
    perform cron.schedule(
      'daily-subscription-renewal',
      '0 3 * * *',
      $cron$select public.run_subscription_renewals();$cron$
    );
  end if;
end;
$$;
