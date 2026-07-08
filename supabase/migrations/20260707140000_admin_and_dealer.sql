-- Admin approval RPCs (KYC review, role upgrade approval) and the
-- dealer_listings auto-creation trigger (mirrors create_fleet_vehicle_for_car:
-- a dealer only ever inserts into sale_cars; the marketing/lead-tracking
-- wrapper row in dealer_listings is maintained transparently).

create or replace function public.admin_review_kyc(
  p_doc_id uuid,
  p_decision text, -- 'verified' or 'rejected'
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
    update public.profiles set verification_status = 'rejected' where id = v_doc.user_id;
  else
    select count(*) into v_total from public.kyc_documents where user_id = v_doc.user_id;
    select count(*) into v_verified from public.kyc_documents where user_id = v_doc.user_id and status = 'verified';
    if v_total >= 4 and v_verified >= 4 then
      update public.profiles set verification_status = 'approved', is_verified = true where id = v_doc.user_id;
    else
      update public.profiles set verification_status = 'pending' where id = v_doc.user_id;
    end if;
  end if;
end;
$$;

grant execute on function public.admin_review_kyc(uuid, text, text) to authenticated;

create or replace function public.admin_approve_role(
  p_user_id uuid,
  p_decision text -- 'approved' or 'rejected'
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
  end if;
end;
$$;

grant execute on function public.admin_approve_role(uuid, text) to authenticated;

-- Auto-create a dealer_listings wrapper whenever a dealer lists a sale_car,
-- so leads (which attach to dealer_listings) and view/lead tracking have
-- somewhere real to live without the client ever touching that table.
create or replace function public.create_dealer_listing_for_sale_car()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.dealer_id is not null then
    insert into public.dealer_listings (dealer_id, sale_car_id, listing_type, asking_price, status)
    values (new.dealer_id, new.id, 'sale', new.sale_price, 'active');
  end if;
  return new;
end;
$$;

create trigger trg_sale_car_insert_dealer_listing
  after insert on public.sale_cars
  for each row execute function public.create_dealer_listing_for_sale_car();
