-- Push notification infrastructure. Builds on the existing (write-side-empty)
-- notifications table: a single notify_user() helper both inserts the
-- in-app notification row AND fires an Expo push via pg_net, so every
-- call site only has to reason about one function.

create extension if not exists pg_net;

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null,
  platform text not null default 'unknown',
  created_at timestamptz not null default now(),
  unique (user_id, token)
);
create index idx_push_tokens_user on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;
grant select, insert, delete on public.push_tokens to authenticated;

create policy "push_tokens_select_own" on public.push_tokens for select
  using (user_id = auth.uid());
create policy "push_tokens_insert_own" on public.push_tokens for insert
  with check (user_id = auth.uid());
create policy "push_tokens_delete_own" on public.push_tokens for delete
  using (user_id = auth.uid());

-- Inserts the in-app notification and fires an async push to every device
-- registered for this user, via Expo's push API. net.http_post is
-- fire-and-forget (queued for a background worker), so this never blocks
-- or fails the caller's transaction on a slow/unreachable push endpoint.
-- Not exposed to clients — only ever called from other SECURITY DEFINER
-- RPCs/triggers below, never directly, since a client could otherwise spam
-- arbitrary notifications at any user_id.
create or replace function public.notify_user(
  p_user_id uuid,
  p_type public.notification_type,
  p_title text,
  p_message text,
  p_action_route text default null,
  p_action_params jsonb default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_token record;
begin
  if p_user_id is null then
    return;
  end if;

  insert into public.notifications (user_id, type, title, message, action_route, action_params)
  values (p_user_id, p_type, p_title, p_message, p_action_route, p_action_params);

  for v_token in select token from public.push_tokens where user_id = p_user_id loop
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Accept', 'application/json'),
      body := jsonb_build_object(
        'to', v_token.token,
        'title', p_title,
        'body', p_message,
        'data', jsonb_build_object('route', p_action_route, 'params', p_action_params)
      )
    );
  end loop;
end;
$$;

-- Notify the car's owner when a customer requests a booking.
create or replace function public.create_booking(
  p_car_id uuid,
  p_pickup_date date,
  p_return_date date,
  p_pickup_location text
)
returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  v_car public.cars%rowtype;
  v_days int;
  v_subtotal numeric;
  v_service_fee numeric;
  v_insurance_fee numeric;
  v_total numeric;
  v_booking public.bookings%rowtype;
  v_customer_kyc public.verification_status;
  v_customer_name text;
begin
  select verification_status into v_customer_kyc from public.profiles where id = auth.uid();
  if v_customer_kyc not in ('pending', 'approved') then
    raise exception 'Please complete KYC verification before booking a car';
  end if;

  if p_return_date < p_pickup_date then
    raise exception 'return_date must be on or after pickup_date';
  end if;

  select * into v_car from public.cars where id = p_car_id and is_available = true;
  if not found then
    raise exception 'Car not available';
  end if;

  if not public.owner_subscription_active(v_car.owner_id) then
    raise exception 'This car is not currently bookable';
  end if;

  if exists (
    select 1 from public.bookings b
    where b.car_id = p_car_id
      and b.status in ('pending', 'approved', 'active')
      and b.pickup_date <= p_return_date
      and b.return_date >= p_pickup_date
  ) then
    raise exception 'Car is already booked for those dates';
  end if;

  v_days := greatest(1, (p_return_date - p_pickup_date));
  v_subtotal := v_car.price_per_day * v_days;
  v_service_fee := round(v_subtotal * 0.10, 2);
  v_insurance_fee := round(v_subtotal * 0.05, 2);
  v_total := v_subtotal + v_service_fee + v_insurance_fee;

  insert into public.bookings (
    car_id, customer_id, pickup_date, return_date, pickup_location,
    total_days, subtotal, service_fee, insurance_fee, total_price, status
  ) values (
    p_car_id, auth.uid(), p_pickup_date, p_return_date, p_pickup_location,
    v_days, v_subtotal, v_service_fee, v_insurance_fee, v_total, 'pending'
  ) returning * into v_booking;

  select name into v_customer_name from public.profiles where id = auth.uid();
  perform public.notify_user(
    v_car.owner_id,
    'booking',
    'New Booking Request',
    coalesce(v_customer_name, 'A customer') || ' wants to book your ' || v_car.brand || ' ' || v_car.model,
    '/booking-detail',
    jsonb_build_object('id', v_booking.id)
  );

  return v_booking;
end;
$$;

-- Notify the customer when their booking is approved or declined.
create or replace function public.fleet_owner_review_booking(
  p_booking_id uuid,
  p_decision text
)
returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  v_booking public.bookings%rowtype;
  v_is_owner boolean;
begin
  if p_decision not in ('approved', 'cancelled') then
    raise exception 'decision must be approved or cancelled';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id;
  if not found then
    raise exception 'Booking not found';
  end if;

  select exists (
    select 1 from public.cars c where c.id = v_booking.car_id and c.owner_id = auth.uid()
  ) into v_is_owner;

  if not (v_is_owner or public.is_admin()) then
    raise exception 'Not authorized to review this booking';
  end if;

  if v_booking.status != 'pending' then
    raise exception 'Only pending bookings can be reviewed';
  end if;

  update public.bookings set status = p_decision::public.booking_status
  where id = p_booking_id
  returning * into v_booking;

  perform public.notify_user(
    v_booking.customer_id,
    'booking',
    case when p_decision = 'approved' then 'Booking Approved' else 'Booking Declined' end,
    case when p_decision = 'approved'
      then 'Your booking request has been approved. The owner will share payment details with you directly.'
      else 'Your booking request was declined.'
    end,
    '/booking-detail',
    jsonb_build_object('id', v_booking.id)
  );

  return v_booking;
end;
$$;

-- Notify the user when a KYC document is verified/rejected (or revoked).
create or replace function public.admin_review_kyc(
  p_doc_id uuid,
  p_decision text,
  p_rejection_reason text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_doc public.kyc_documents%rowtype;
  v_total int;
  v_verified int;
begin
  if not public.is_admin() then
    raise exception 'Only admins can review KYC documents';
  end if;
  if p_decision not in ('verified', 'rejected') then
    raise exception 'decision must be verified or rejected';
  end if;

  select * into v_doc from public.kyc_documents where id = p_doc_id;
  if not found then
    raise exception 'Document not found';
  end if;

  update public.kyc_documents
  set status = p_decision::public.kyc_status,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      rejection_reason = case when p_decision = 'rejected' then p_rejection_reason else null end
  where id = p_doc_id;

  if p_decision = 'rejected' then
    update public.profiles set verification_status = 'rejected', is_verified = false where id = v_doc.user_id;
    perform public.notify_user(
      v_doc.user_id, 'kyc', 'Verification Update',
      coalesce(v_doc.label, 'A document') || ' was not approved' || (case when p_rejection_reason is not null then ': ' || p_rejection_reason else '.' end),
      '/kyc-verification', null
    );
  else
    select count(*) into v_total from public.kyc_documents where user_id = v_doc.user_id;
    select count(*) into v_verified from public.kyc_documents where user_id = v_doc.user_id and status = 'verified';
    if v_total >= 4 and v_verified >= 4 then
      update public.profiles set verification_status = 'approved', is_verified = true where id = v_doc.user_id;
      perform public.notify_user(
        v_doc.user_id, 'kyc', 'Verification Approved',
        'Your identity verification is complete. You can now book or list vehicles.',
        null, null
      );
    else
      update public.profiles set verification_status = 'pending' where id = v_doc.user_id;
    end if;
  end if;
end;
$$;

-- Notify the user when their role upgrade application is approved/rejected.
create or replace function public.admin_approve_role(
  p_user_id uuid,
  p_decision text
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_app public.role_applications%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Only admins can review role applications';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'decision must be approved or rejected';
  end if;

  select * into v_app from public.role_applications
  where user_id = p_user_id and status = 'pending'
  order by created_at desc limit 1;

  if not found then
    raise exception 'No pending role application for this user';
  end if;

  update public.role_applications
  set status = p_decision::public.role_app_status, reviewed_by = auth.uid(), reviewed_at = now()
  where id = v_app.id;

  if p_decision = 'approved' then
    update public.profiles set role = v_app.requested_role where id = p_user_id;
    if v_app.requested_role in ('fleet_owner', 'dealership') then
      perform public.start_trial_subscription(p_user_id);
    end if;
    perform public.notify_user(
      p_user_id, 'system', 'Account Upgraded',
      'Your ' || replace(v_app.requested_role::text, '_', ' ') || ' application has been approved!',
      null, null
    );
  else
    perform public.notify_user(
      p_user_id, 'system', 'Application Update',
      'Your role upgrade application was not approved.',
      null, null
    );
  end if;
end;
$$;

-- Notify the dealer when a customer contacts them about a sale listing.
create or replace function public.notify_dealer_on_lead()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_dealer_id uuid;
begin
  select dealer_id into v_dealer_id from public.dealer_listings where id = new.dealer_listing_id;
  if v_dealer_id is not null then
    perform public.notify_user(
      v_dealer_id, 'system', 'New Lead',
      new.customer_name || ' is interested in your ' || coalesce(new.car_model, 'listing'),
      '/dealer-dashboard', null
    );
  end if;
  return new;
end;
$$;

create trigger trg_lead_insert_notify
  after insert on public.leads
  for each row execute function public.notify_dealer_on_lead();

-- Notify the user when a wallet top-up completes.
create or replace function public.credit_wallet_from_topup(
  p_client_reference text,
  p_amount numeric,
  p_hubtel_transaction_id text
)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_tx public.wallet_transactions%rowtype;
begin
  select * into v_tx from public.wallet_transactions
  where hubtel_reference = p_client_reference and status = 'pending'
  for update;

  if not found then
    return false;
  end if;

  if abs(v_tx.amount - p_amount) > 0.01 then
    update public.wallet_transactions set status = 'failed' where id = v_tx.id;
    return false;
  end if;

  update public.wallet_transactions
  set status = 'completed', description = description || ' (Hubtel txn ' || coalesce(p_hubtel_transaction_id, 'n/a') || ')'
  where id = v_tx.id;

  update public.wallets set balance = balance + p_amount, updated_at = now()
  where user_id = v_tx.wallet_id;

  perform public.notify_user(
    v_tx.wallet_id, 'payment', 'Wallet Topped Up',
    'GH₵' || p_amount || ' has been added to your wallet.',
    '/wallet', null
  );

  return true;
end;
$$;
