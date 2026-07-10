-- Extends the customer<->owner/dealer chat to also support enquiries from
-- any user (customer, fleet_owner, or dealership) to admin/support, reusing
-- the same conversations/chat_messages tables and realtime plumbing rather
-- than building a parallel support-ticket system.

-- Notifies every admin account — used for support enquiries, where any
-- admin should be able to pick up and answer, not just whichever admin
-- happened to be recorded as the conversation's counterpart.
create or replace function public.notify_all_admins(
  p_type public.notification_type,
  p_title text,
  p_message text,
  p_action_route text default null,
  p_action_params jsonb default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_admin record;
begin
  for v_admin in select id from public.profiles where role = 'admin' loop
    perform public.notify_user(v_admin.id, p_type, p_title, p_message, p_action_route, p_action_params);
  end loop;
end;
$$;

-- get_or_create_conversation now also allows: any non-admin role -> admin
-- (a support enquiry), and admin -> any non-admin role (admin replying/
-- reaching out first). Two admins messaging each other is still rejected —
-- that's not a defined use case here.
create or replace function public.get_or_create_conversation(
  p_other_user_id uuid,
  p_context_type text default null,
  p_context_id uuid default null,
  p_context_label text default null
)
returns public.conversations
language plpgsql security definer set search_path = public as $$
declare
  v_me_role public.user_role;
  v_other_role public.user_role;
  v_customer_id uuid;
  v_counterpart_id uuid;
  v_conv public.conversations%rowtype;
begin
  if p_other_user_id is null or p_other_user_id = auth.uid() then
    raise exception 'Cannot start a conversation with yourself';
  end if;

  select role into v_me_role from public.profiles where id = auth.uid();
  select role into v_other_role from public.profiles where id = p_other_user_id;

  if v_me_role is null or v_other_role is null then
    raise exception 'User not found';
  end if;

  if v_me_role = 'admin' and v_other_role = 'admin' then
    raise exception 'Admins cannot start a conversation with each other';
  elsif v_other_role = 'admin' then
    v_customer_id := auth.uid();
    v_counterpart_id := p_other_user_id;
  elsif v_me_role = 'admin' then
    v_customer_id := p_other_user_id;
    v_counterpart_id := auth.uid();
  elsif v_me_role = 'customer' and v_other_role in ('fleet_owner', 'dealership') then
    v_customer_id := auth.uid();
    v_counterpart_id := p_other_user_id;
  elsif v_me_role in ('fleet_owner', 'dealership') and v_other_role = 'customer' then
    v_customer_id := p_other_user_id;
    v_counterpart_id := auth.uid();
  else
    raise exception 'This conversation is not allowed';
  end if;

  insert into public.conversations (customer_id, counterpart_id, context_type, context_id, context_label, last_message_at)
  values (v_customer_id, v_counterpart_id, p_context_type, p_context_id, p_context_label, now())
  on conflict (customer_id, counterpart_id) do update
    set context_type = coalesce(excluded.context_type, public.conversations.context_type),
        context_id = coalesce(excluded.context_id, public.conversations.context_id),
        context_label = coalesce(excluded.context_label, public.conversations.context_label)
  returning * into v_conv;

  return v_conv;
end;
$$;

-- Starts (or returns the existing) support conversation for the caller,
-- pairing them with the platform's longest-standing admin account. Any
-- admin can still see and reply to it (send_message below no longer
-- restricts sending to just the two original participants when either
-- side of the thread is an admin), so this doesn't depend on that specific
-- admin being available.
create or replace function public.start_support_conversation()
returns public.conversations
language plpgsql security definer set search_path = public as $$
declare
  v_admin_id uuid;
begin
  select id into v_admin_id from public.profiles where role = 'admin' order by created_at asc limit 1;
  if v_admin_id is null then
    raise exception 'No support admin is available right now';
  end if;

  return public.get_or_create_conversation(v_admin_id, 'support', null, 'Support Enquiry');
end;
$$;

grant execute on function public.start_support_conversation() to authenticated;

-- Any admin (not just the two recorded participants) can send in a
-- conversation, so a shared support inbox works even though the schema
-- only stores one fixed admin id per thread. Recipient still resolves
-- correctly: if the sender isn't the enquiring user (customer_id), the
-- message goes to them regardless of which admin sent it.
create or replace function public.send_message(p_conversation_id uuid, p_body text)
returns public.chat_messages
language plpgsql security definer set search_path = public as $$
declare
  v_conv public.conversations%rowtype;
  v_recipient_id uuid;
  v_sender_name text;
  v_msg public.chat_messages%rowtype;
  v_is_participant boolean;
begin
  if trim(coalesce(p_body, '')) = '' then
    raise exception 'Message cannot be empty';
  end if;

  select * into v_conv from public.conversations where id = p_conversation_id;
  if not found then
    raise exception 'Conversation not found';
  end if;

  v_is_participant := auth.uid() in (v_conv.customer_id, v_conv.counterpart_id) or public.is_admin();
  if not v_is_participant then
    raise exception 'Not a participant in this conversation';
  end if;

  v_recipient_id := case when auth.uid() = v_conv.customer_id then v_conv.counterpart_id else v_conv.customer_id end;

  insert into public.chat_messages (conversation_id, sender_id, body)
  values (p_conversation_id, auth.uid(), trim(p_body))
  returning * into v_msg;

  update public.conversations set last_message_at = v_msg.created_at where id = p_conversation_id;

  select name into v_sender_name from public.profiles where id = auth.uid();

  if v_conv.context_type = 'support' and v_recipient_id != auth.uid() and auth.uid() = v_conv.customer_id then
    -- The enquiring user messaged in; make sure every admin sees it, not
    -- just whichever one is recorded as this thread's counterpart.
    perform public.notify_all_admins(
      'system', coalesce(v_sender_name, 'New message') || ' (Support)',
      left(trim(p_body), 120),
      '/chat', jsonb_build_object('id', p_conversation_id)
    );
  else
    perform public.notify_user(
      v_recipient_id, 'system', coalesce(v_sender_name, 'New message'),
      left(trim(p_body), 120),
      '/chat', jsonb_build_object('id', p_conversation_id)
    );
  end if;

  return v_msg;
end;
$$;

-- Admins already bypass RLS on conversations/chat_messages selects, but
-- mark_conversation_read was still scoped to the two fixed participants —
-- widen it the same way so any admin can clear unread state on a support
-- thread they've read.
create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.chat_messages
  set is_read = true
  where conversation_id = p_conversation_id
    and sender_id != auth.uid()
    and is_read = false
    and exists (
      select 1 from public.conversations c
      where c.id = p_conversation_id
        and (c.customer_id = auth.uid() or c.counterpart_id = auth.uid() or public.is_admin())
    );
end;
$$;
