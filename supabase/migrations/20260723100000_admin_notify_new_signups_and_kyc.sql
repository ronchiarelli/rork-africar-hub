-- Admins were never notified about two events they need to act on:
-- (1) a new user registering, (2) a KYC document being submitted for
-- review. Both currently only surface if an admin happens to open the
-- dashboard's Users/KYC tabs and looks — there's no push/in-app nudge,
-- unlike support chat messages which already use notify_all_admins().
-- Reusing that same helper (and therefore the same car-horn push sound
-- already wired up for it) for both new events here.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_requested_role text;
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

  v_requested_role := new.raw_user_meta_data->>'requested_role';
  if v_requested_role in ('fleet_owner', 'dealership') then
    insert into public.role_applications (user_id, requested_role)
    values (new.id, v_requested_role::public.user_role);
  end if;

  perform public.notify_all_admins(
    'system', 'New User Signed Up',
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), new.email, 'A new user') ||
      case when v_requested_role in ('fleet_owner', 'dealership')
        then ' joined and applied as ' || replace(v_requested_role, '_', ' ')
        else ' joined as a customer'
      end,
    '/admin-dashboard', jsonb_build_object('tab', 'Users')
  );

  return new;
end;
$$;

-- Notifies every admin the moment a customer/owner/dealer uploads (or
-- re-uploads after a rejection) a KYC document, so the KYC tab's review
-- queue doesn't go unnoticed. Deliberately a separate trigger function from
-- sync_kyc_pending_on_upload (which flips the profile status) so each
-- trigger keeps a single job, consistent with the rest of this table's
-- trigger history.
create or replace function public.notify_admins_on_kyc_upload()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_user_name text;
begin
  if new.status = 'uploaded' then
    select name into v_user_name from public.profiles where id = new.user_id;
    perform public.notify_all_admins(
      'kyc', 'KYC Document Submitted',
      coalesce(nullif(v_user_name, ''), 'A user') || ' submitted ' || coalesce(new.label, new.type::text) || ' for review',
      '/admin-dashboard', jsonb_build_object('tab', 'KYC')
    );
  end if;
  return new;
end;
$$;

create trigger kyc_documents_notify_admin
  after insert or update on public.kyc_documents
  for each row execute function public.notify_admins_on_kyc_upload();
