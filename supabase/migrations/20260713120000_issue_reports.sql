-- Lets a customer report a problem with a car on a booking that's been
-- approved (or further along: active/completed) — mirrors the
-- reviews_insert_own_completed_booking pattern but allows the wider set of
-- post-approval statuses, since a car issue can surface any time after
-- pickup, not just once the trip is fully over. Notifies the car's owner
-- and all admins so someone actually follows up.

create table public.issue_reports (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  car_id uuid not null references public.cars(id),
  customer_id uuid not null references public.profiles(id),
  category text not null,
  description text not null,
  photo_url text,
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved')),
  created_at timestamptz not null default now()
);
create index idx_issue_reports_booking on public.issue_reports (booking_id);
create index idx_issue_reports_car on public.issue_reports (car_id);

alter table public.issue_reports enable row level security;

-- read: reporting customer, the car's owner, or admin (mirrors bookings_select).
grant select, insert on public.issue_reports to authenticated;

create policy "issue_reports_select" on public.issue_reports for select
  using (
    customer_id = auth.uid() or public.is_admin() or exists (
      select 1 from public.cars c where c.id = car_id and c.owner_id = auth.uid()
    )
  );

create policy "issue_reports_insert_own_eligible_booking" on public.issue_reports for insert
  with check (
    customer_id = auth.uid() and exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.customer_id = auth.uid()
        and b.car_id = issue_reports.car_id
        and b.status in ('approved', 'active', 'completed')
    )
  );

-- Notify the car's owner and all admins when a customer reports an issue.
create or replace function public.notify_on_issue_report()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_car public.cars%rowtype;
  v_customer_name text;
begin
  select * into v_car from public.cars where id = new.car_id;
  select name into v_customer_name from public.profiles where id = new.customer_id;

  if v_car.owner_id is not null then
    perform public.notify_user(
      v_car.owner_id, 'booking',
      'Issue Reported',
      coalesce(v_customer_name, 'A customer') || ' reported an issue with your ' ||
        v_car.brand || ' ' || v_car.model || ': ' || left(new.description, 100),
      '/booking-detail', jsonb_build_object('id', new.booking_id)
    );
  end if;

  perform public.notify_all_admins(
    'system', 'Car Issue Reported',
    coalesce(v_customer_name, 'A customer') || ' reported a "' || new.category || '" issue on a ' ||
      v_car.brand || ' ' || v_car.model,
    '/booking-detail', jsonb_build_object('id', new.booking_id)
  );

  return new;
end;
$$;

create trigger trg_issue_report_insert_notify
  after insert on public.issue_reports
  for each row execute function public.notify_on_issue_report();
