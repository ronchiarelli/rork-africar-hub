-- GoCar Hub — Phase A schema: enums, core tables, trigger-maintained aggregates, RLS.
-- Booking/payment/KYC *mutation* RPCs are added in later migrations (Phase B/C);
-- this migration only allows the narrow client writes described inline below.

create extension if not exists pgcrypto;

-- ── Enums ────────────────────────────────────────────────────────────────

create type public.user_role as enum ('customer', 'fleet_owner', 'dealership', 'admin');
create type public.verification_status as enum ('none', 'pending', 'approved', 'rejected');
create type public.booking_status as enum ('pending', 'approved', 'active', 'completed', 'cancelled');
create type public.payment_status as enum ('unpaid', 'processing', 'paid', 'failed', 'refunded');
create type public.fleet_status as enum ('active', 'maintenance', 'rented', 'inactive');
create type public.kyc_doc_type as enum ('ghana_card', 'passport', 'drivers_license', 'selfie');
create type public.kyc_status as enum ('not_uploaded', 'uploaded', 'verified', 'rejected');
create type public.lead_status as enum ('new', 'contacted', 'converted', 'lost');
create type public.listing_type as enum ('sale', 'featured');
create type public.listing_status as enum ('active', 'sold', 'draft');
create type public.transmission_type as enum ('Automatic', 'Manual');
create type public.fuel_type as enum ('Petrol', 'Diesel', 'Hybrid', 'Electric');
create type public.sale_condition as enum ('New', 'Foreign Used', 'Locally Used');
create type public.notification_type as enum ('booking', 'payment', 'promo', 'kyc', 'system');
create type public.wallet_tx_type as enum ('credit', 'debit');
create type public.wallet_tx_status as enum ('completed', 'pending', 'failed');
create type public.role_app_status as enum ('pending', 'approved', 'rejected');

-- ── Tables ───────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null,
  phone text,
  avatar text,
  role public.user_role not null default 'customer',
  is_verified boolean not null default false,
  verification_status public.verification_status not null default 'none',
  is_suspended boolean not null default false,
  total_bookings int not null default 0,
  member_since timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  logo text,
  car_count int not null default 0
);

create table public.cars (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id),
  brand text not null,
  model text not null,
  year int not null,
  category text not null,
  image text not null,
  images text[] not null default '{}',
  price_per_day numeric not null,
  price_per_week numeric not null,
  location text not null,
  seats int not null,
  transmission public.transmission_type not null,
  fuel_type public.fuel_type not null,
  horsepower int not null,
  has_ac boolean not null default true,
  rating numeric not null default 0,
  review_count int not null default 0,
  is_available boolean not null default true,
  description text,
  features text[] not null default '{}',
  owner_name text,
  owner_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_cars_brand on public.cars (brand);
create index idx_cars_location on public.cars (location);
create index idx_cars_is_available on public.cars (is_available);
create index idx_cars_owner on public.cars (owner_id);

create table public.sale_cars (
  id uuid primary key default gen_random_uuid(),
  dealer_id uuid references public.profiles(id),
  brand text not null,
  model text not null,
  year int not null,
  category text not null,
  image text not null,
  images text[] not null default '{}',
  sale_price numeric not null,
  mileage int not null,
  location text not null,
  fuel_type public.fuel_type not null,
  transmission public.transmission_type not null,
  condition public.sale_condition not null,
  dealer_name text,
  dealer_phone text,
  dealer_avatar text,
  is_featured boolean not null default false,
  views int not null default 0,
  description text,
  features text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index idx_sale_cars_dealer on public.sale_cars (dealer_id);

create table public.dealer_listings (
  id uuid primary key default gen_random_uuid(),
  dealer_id uuid references public.profiles(id),
  sale_car_id uuid not null references public.sale_cars(id) on delete cascade,
  listing_type public.listing_type not null default 'sale',
  asking_price numeric not null,
  views int not null default 0,
  leads int not null default 0,
  status public.listing_status not null default 'active',
  created_at timestamptz not null default now()
);
create index idx_dealer_listings_dealer on public.dealer_listings (dealer_id);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  dealer_listing_id uuid not null references public.dealer_listings(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  car_model text,
  message text,
  status public.lead_status not null default 'new',
  created_at timestamptz not null default now()
);
create index idx_leads_listing on public.leads (dealer_listing_id);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id),
  customer_id uuid not null references public.profiles(id),
  pickup_date date not null,
  return_date date not null,
  pickup_location text not null,
  total_days int not null,
  subtotal numeric not null,
  service_fee numeric not null,
  insurance_fee numeric not null,
  total_price numeric not null,
  status public.booking_status not null default 'pending',
  payment_status public.payment_status not null default 'unpaid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (return_date >= pickup_date)
);
create index idx_bookings_customer on public.bookings (customer_id);
create index idx_bookings_car on public.bookings (car_id);
create index idx_bookings_status on public.bookings (status);

create table public.fleet_vehicles (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete cascade,
  owner_id uuid not null references public.profiles(id),
  status public.fleet_status not null default 'active',
  total_earnings numeric not null default 0,
  total_trips int not null default 0,
  next_maintenance date,
  created_at timestamptz not null default now(),
  unique (car_id)
);
create index idx_fleet_vehicles_owner on public.fleet_vehicles (owner_id);

create table public.kyc_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.kyc_doc_type not null,
  label text,
  status public.kyc_status not null default 'not_uploaded',
  storage_path text,
  uploaded_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  unique (user_id, type)
);

create table public.wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance numeric not null default 0,
  currency text not null default 'GHS',
  updated_at timestamptz not null default now()
);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(user_id) on delete cascade,
  type public.wallet_tx_type not null,
  amount numeric not null,
  description text,
  status public.wallet_tx_status not null default 'completed',
  related_booking_id uuid references public.bookings(id),
  hubtel_reference text,
  created_at timestamptz not null default now()
);
create index idx_wallet_tx_wallet on public.wallet_transactions (wallet_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  action_route text,
  action_params jsonb,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on public.notifications (user_id, is_read);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  car_id uuid not null references public.cars(id),
  customer_id uuid not null references public.profiles(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (booking_id)
);
create index idx_reviews_car on public.reviews (car_id);

create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  car_id uuid not null references public.cars(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, car_id)
);

create table public.role_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  requested_role public.user_role not null,
  status public.role_app_status not null default 'pending',
  note text,
  created_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz
);
create index idx_role_applications_user on public.role_applications (user_id);

-- ── Helper functions ─────────────────────────────────────────────────────

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_cars_updated_at before update on public.cars
  for each row execute function public.set_updated_at();
create trigger trg_bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

-- New auth user -> profile row + wallet row (role always starts as 'customer';
-- never trust client-supplied role at signup time).
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
  insert into public.wallets (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-create a fleet_vehicles row whenever a fleet_owner-owned car is added.
create or replace function public.create_fleet_vehicle_for_car()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.owner_id is not null then
    insert into public.fleet_vehicles (car_id, owner_id)
    values (new.id, new.owner_id)
    on conflict (car_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger trg_car_insert_fleet_vehicle
  after insert on public.cars
  for each row execute function public.create_fleet_vehicle_for_car();

-- Trigger-maintained aggregates (keeps client-facing shapes matching types/car.ts
-- exactly, instead of pushing every screen to compute joins/aggregates itself).

create or replace function public.refresh_brand_car_count(p_brand text)
returns void language sql security definer set search_path = public as $$
  update public.brands set car_count = (
    select count(*) from public.cars where brand = p_brand and is_available = true
  ) where name = p_brand;
$$;

create or replace function public.cars_brand_count_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'DELETE' then
    perform public.refresh_brand_car_count(OLD.brand);
    return OLD;
  else
    perform public.refresh_brand_car_count(NEW.brand);
    if TG_OP = 'UPDATE' and OLD.brand is distinct from NEW.brand then
      perform public.refresh_brand_car_count(OLD.brand);
    end if;
    return NEW;
  end if;
end;
$$;

create trigger trg_cars_brand_count
  after insert or update or delete on public.cars
  for each row execute function public.cars_brand_count_trigger();

create or replace function public.refresh_car_rating(p_car_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.cars set
    rating = coalesce((select round(avg(rating)::numeric, 1) from public.reviews where car_id = p_car_id), 0),
    review_count = (select count(*) from public.reviews where car_id = p_car_id)
  where id = p_car_id;
$$;

create or replace function public.reviews_car_rating_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'DELETE' then
    perform public.refresh_car_rating(OLD.car_id);
    return OLD;
  else
    perform public.refresh_car_rating(NEW.car_id);
    return NEW;
  end if;
end;
$$;

create trigger trg_reviews_car_rating
  after insert or update or delete on public.reviews
  for each row execute function public.reviews_car_rating_trigger();

create or replace function public.refresh_fleet_vehicle_stats(p_car_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.fleet_vehicles set
    total_earnings = coalesce((select sum(total_price) from public.bookings where car_id = p_car_id and status = 'completed'), 0),
    total_trips = coalesce((select count(*) from public.bookings where car_id = p_car_id and status = 'completed'), 0)
  where car_id = p_car_id;
$$;

create or replace function public.bookings_fleet_stats_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.refresh_fleet_vehicle_stats(NEW.car_id);
  if TG_OP = 'UPDATE' and OLD.car_id is distinct from NEW.car_id then
    perform public.refresh_fleet_vehicle_stats(OLD.car_id);
  end if;
  return NEW;
end;
$$;

create trigger trg_bookings_fleet_stats
  after insert or update of status, car_id on public.bookings
  for each row execute function public.bookings_fleet_stats_trigger();

create or replace function public.refresh_dealer_listing_leads(p_listing_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.dealer_listings set leads = (
    select count(*) from public.leads where dealer_listing_id = p_listing_id
  ) where id = p_listing_id;
$$;

create or replace function public.leads_count_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'DELETE' then
    perform public.refresh_dealer_listing_leads(OLD.dealer_listing_id);
    return OLD;
  else
    perform public.refresh_dealer_listing_leads(NEW.dealer_listing_id);
    return NEW;
  end if;
end;
$$;

create trigger trg_leads_count
  after insert or update or delete on public.leads
  for each row execute function public.leads_count_trigger();

create or replace function public.refresh_profile_booking_count(p_user_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.profiles set total_bookings = (
    select count(*) from public.bookings where customer_id = p_user_id
  ) where id = p_user_id;
$$;

create or replace function public.bookings_profile_count_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'DELETE' then
    perform public.refresh_profile_booking_count(OLD.customer_id);
    return OLD;
  else
    perform public.refresh_profile_booking_count(NEW.customer_id);
    return NEW;
  end if;
end;
$$;

create trigger trg_bookings_profile_count
  after insert or delete on public.bookings
  for each row execute function public.bookings_profile_count_trigger();

-- ── Row Level Security ──────────────────────────────────────────────────
-- Supabase grants broad default privileges to anon/authenticated on new
-- tables; revoke everything first, then grant back only the narrow,
-- column-scoped access described per table below. Anything not explicitly
-- granted here is only mutable via SECURITY DEFINER RPCs added in later
-- migrations (Phase B/C) — e.g. bookings.total_price, wallets.balance,
-- kyc_documents.status, profiles.role are never client-writable directly.

revoke all on all tables in schema public from anon, authenticated;

alter table public.profiles enable row level security;
alter table public.brands enable row level security;
alter table public.cars enable row level security;
alter table public.sale_cars enable row level security;
alter table public.dealer_listings enable row level security;
alter table public.leads enable row level security;
alter table public.bookings enable row level security;
alter table public.fleet_vehicles enable row level security;
alter table public.kyc_documents enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.role_applications enable row level security;

-- profiles: read own or admin; self-service update limited to display fields.
grant select on public.profiles to authenticated;
grant update (name, phone, avatar) on public.profiles to authenticated;
create policy "profiles_select" on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles for update
  using (id = auth.uid());

-- brands: public read only (admin/seed-managed).
grant select on public.brands to anon, authenticated;
create policy "brands_select_public" on public.brands for select using (true);

-- cars: public read; writes scoped to the owning fleet_owner or admin.
grant select on public.cars to anon, authenticated;
grant insert, update, delete on public.cars to authenticated;
create policy "cars_select_public" on public.cars for select using (true);
create policy "cars_insert_owner" on public.cars for insert
  with check (owner_id = auth.uid() or public.is_admin());
create policy "cars_update_owner" on public.cars for update
  using (owner_id = auth.uid() or public.is_admin());
create policy "cars_delete_owner" on public.cars for delete
  using (owner_id = auth.uid() or public.is_admin());

-- sale_cars: public read; writes scoped to the owning dealer or admin.
grant select on public.sale_cars to anon, authenticated;
grant insert, update, delete on public.sale_cars to authenticated;
create policy "sale_cars_select_public" on public.sale_cars for select using (true);
create policy "sale_cars_insert_owner" on public.sale_cars for insert
  with check (dealer_id = auth.uid() or public.is_admin());
create policy "sale_cars_update_owner" on public.sale_cars for update
  using (dealer_id = auth.uid() or public.is_admin());
create policy "sale_cars_delete_owner" on public.sale_cars for delete
  using (dealer_id = auth.uid() or public.is_admin());

-- dealer_listings: public read; writes scoped to the owning dealer or admin.
grant select on public.dealer_listings to anon, authenticated;
grant insert, update, delete on public.dealer_listings to authenticated;
create policy "dealer_listings_select_public" on public.dealer_listings for select using (true);
create policy "dealer_listings_insert_owner" on public.dealer_listings for insert
  with check (dealer_id = auth.uid() or public.is_admin());
create policy "dealer_listings_update_owner" on public.dealer_listings for update
  using (dealer_id = auth.uid() or public.is_admin());
create policy "dealer_listings_delete_owner" on public.dealer_listings for delete
  using (dealer_id = auth.uid() or public.is_admin());

-- leads: dealer can read/update leads for their own listings; anyone
-- (including anon marketplace visitors) can create a lead by contacting a dealer.
grant select on public.leads to authenticated;
grant insert on public.leads to anon, authenticated;
grant update (status) on public.leads to authenticated;
create policy "leads_select_dealer_or_admin" on public.leads for select
  using (
    public.is_admin() or exists (
      select 1 from public.dealer_listings dl where dl.id = dealer_listing_id and dl.dealer_id = auth.uid()
    )
  );
create policy "leads_insert_open" on public.leads for insert with check (true);
create policy "leads_update_dealer" on public.leads for update
  using (
    public.is_admin() or exists (
      select 1 from public.dealer_listings dl where dl.id = dealer_listing_id and dl.dealer_id = auth.uid()
    )
  );

-- bookings: customer/owner/admin can read; customer can only self-cancel a
-- pending booking (status column only) — creation is via RPC in Phase B.
grant select on public.bookings to authenticated;
grant update (status) on public.bookings to authenticated;
create policy "bookings_select" on public.bookings for select
  using (
    customer_id = auth.uid() or public.is_admin() or exists (
      select 1 from public.cars c where c.id = car_id and c.owner_id = auth.uid()
    )
  );
create policy "bookings_cancel_own" on public.bookings for update
  using (customer_id = auth.uid() and status = 'pending')
  with check (status = 'cancelled');

-- fleet_vehicles: owner/admin read; owner/admin can update status/maintenance
-- date only (earnings/trips are trigger-maintained, never client-writable).
grant select on public.fleet_vehicles to authenticated;
grant update (status, next_maintenance) on public.fleet_vehicles to authenticated;
create policy "fleet_vehicles_select_owner" on public.fleet_vehicles for select
  using (owner_id = auth.uid() or public.is_admin());
create policy "fleet_vehicles_update_owner" on public.fleet_vehicles for update
  using (owner_id = auth.uid() or public.is_admin());

-- kyc_documents: read own or admin. Upload/review flow (Storage + status
-- transitions) is added in the Phase B migration.
grant select on public.kyc_documents to authenticated;
create policy "kyc_select_own_or_admin" on public.kyc_documents for select
  using (user_id = auth.uid() or public.is_admin());

-- wallets / wallet_transactions: read-only for now; all balance mutations
-- happen via SECURITY DEFINER RPCs added in Phase C (never direct client writes).
grant select on public.wallets to authenticated;
grant select on public.wallet_transactions to authenticated;
create policy "wallets_select_own" on public.wallets for select
  using (user_id = auth.uid());
create policy "wallet_tx_select_own" on public.wallet_transactions for select
  using (wallet_id = auth.uid());

-- notifications: read own, can mark read; system/trigger-generated only (no insert grant).
grant select on public.notifications to authenticated;
grant update (is_read) on public.notifications to authenticated;
create policy "notifications_select_own" on public.notifications for select
  using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications for update
  using (user_id = auth.uid());

-- reviews: public read; a customer may review a car only via their own completed booking.
grant select on public.reviews to anon, authenticated;
grant insert on public.reviews to authenticated;
create policy "reviews_select_public" on public.reviews for select using (true);
create policy "reviews_insert_own_completed_booking" on public.reviews for insert
  with check (
    customer_id = auth.uid() and exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.customer_id = auth.uid()
        and b.car_id = reviews.car_id and b.status = 'completed'
    )
  );

-- favorites: full self-service CRUD scoped to the caller.
grant select, insert, delete on public.favorites to authenticated;
create policy "favorites_select_own" on public.favorites for select
  using (user_id = auth.uid());
create policy "favorites_insert_own" on public.favorites for insert
  with check (user_id = auth.uid());
create policy "favorites_delete_own" on public.favorites for delete
  using (user_id = auth.uid());

-- role_applications: user can read/create their own request; approval is an
-- admin-only RPC added in Phase B (never a direct client update of status).
grant select, insert on public.role_applications to authenticated;
create policy "role_apps_select_own_or_admin" on public.role_applications for select
  using (user_id = auth.uid() or public.is_admin());
create policy "role_apps_insert_own" on public.role_applications for insert
  with check (user_id = auth.uid());
