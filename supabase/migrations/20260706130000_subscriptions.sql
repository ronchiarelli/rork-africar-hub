-- Business model pivot: booking is no longer tied to an in-app payment (fleet
-- owners/dealers share payment details with customers directly, off-platform).
-- Instead, fleet_owner/dealership accounts pay a flat monthly platform
-- subscription (GH₵150/month, 14-day free trial), collected via Hubtel.
-- Subscription status gates whether their cars/listings are publicly visible
-- and whether they can access their dashboard.

-- Booking no longer tracks payment state at all.
alter table public.bookings drop column if exists payment_status;
drop type if exists public.payment_status;

-- ── Subscriptions ────────────────────────────────────────────────────────

create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'cancelled');
create type public.subscription_payment_status as enum ('pending', 'completed', 'failed');

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.subscription_status not null default 'trialing',
  amount numeric not null default 150,
  currency text not null default 'GHS',
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  hubtel_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);
create index idx_subscriptions_user on public.subscriptions (user_id);

create table public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  amount numeric not null,
  status public.subscription_payment_status not null default 'pending',
  hubtel_transaction_id text,
  period_start timestamptz not null default now(),
  period_end timestamptz,
  created_at timestamptz not null default now()
);
create index idx_subscription_payments_sub on public.subscription_payments (subscription_id);

create trigger trg_subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- A subscription is "in good standing" while trialing or active AND its
-- current period (trial or paid) hasn't lapsed. This is evaluated live from
-- current_period_end rather than a background job flipping status, so a
-- lapsed subscription is caught immediately without needing a cron trigger.
create or replace function public.owner_subscription_active(p_owner_id uuid)
returns boolean language sql stable as $$
  select p_owner_id is null or exists (
    select 1 from public.subscriptions s
    where s.user_id = p_owner_id
      and s.status in ('trialing', 'active')
      and s.current_period_end is not null
      and s.current_period_end >= now()
  );
$$;

-- Starts a 14-day free trial subscription for a newly approved fleet_owner
-- or dealership account. Called by the admin role-approval RPC (Phase B).
create or replace function public.start_trial_subscription(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions (user_id, status, amount, trial_ends_at, current_period_end)
  values (p_user_id, 'trialing', 150, now() + interval '14 days', now() + interval '14 days')
  on conflict (user_id) do nothing;
end;
$$;

-- ── RLS ──────────────────────────────────────────────────────────────────

alter table public.subscriptions enable row level security;
alter table public.subscription_payments enable row level security;

-- Read-only for the owning user; all writes happen via SECURITY DEFINER RPCs
-- / the Hubtel webhook Edge Function (service role), never direct client writes.
grant select on public.subscriptions to authenticated;
grant select on public.subscription_payments to authenticated;

create policy "subscriptions_select_own_or_admin" on public.subscriptions for select
  using (user_id = auth.uid() or public.is_admin());
create policy "subscription_payments_select_own_or_admin" on public.subscription_payments for select
  using (
    public.is_admin() or exists (
      select 1 from public.subscriptions s where s.id = subscription_id and s.user_id = auth.uid()
    )
  );

-- ── Gate public visibility of listings on the owner's subscription ────────
-- Replaces the Phase A "always public" policies: a fleet_owner/dealer's cars
-- and sale listings only show up once their subscription is in good standing
-- (or for admin-seeded inventory with no owner_id/dealer_id at all).

drop policy if exists "cars_select_public" on public.cars;
create policy "cars_select_visible" on public.cars for select
  using (public.owner_subscription_active(owner_id) or public.is_admin() or owner_id = auth.uid());

drop policy if exists "sale_cars_select_public" on public.sale_cars;
create policy "sale_cars_select_visible" on public.sale_cars for select
  using (public.owner_subscription_active(dealer_id) or public.is_admin() or dealer_id = auth.uid());

drop policy if exists "dealer_listings_select_public" on public.dealer_listings;
create policy "dealer_listings_select_visible" on public.dealer_listings for select
  using (public.owner_subscription_active(dealer_id) or public.is_admin() or dealer_id = auth.uid());
