-- In-app chat between customers and fleet_owner/dealership users, replacing
-- the WhatsApp deep-link contact flow. One conversation per (customer,
-- counterpart) pair regardless of which car/booking/listing prompted it —
-- matches how a normal messaging inbox works, and avoids fragmenting a
-- relationship into many near-duplicate threads. The context fields just
-- track what the conversation is *currently* about, for display purposes.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  counterpart_id uuid not null references public.profiles(id) on delete cascade,
  context_type text,
  context_id uuid,
  context_label text,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  unique (customer_id, counterpart_id)
);
create index idx_conversations_customer on public.conversations (customer_id);
create index idx_conversations_counterpart on public.conversations (counterpart_id);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_chat_messages_conversation on public.chat_messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.chat_messages enable row level security;

grant select on public.conversations to authenticated;
grant select on public.chat_messages to authenticated;

-- Reads only — all writes go through the RPCs below so we can validate
-- participants/roles and fire the notify_user side effect in one place.
create policy "conversations_select_participant" on public.conversations for select
  using (customer_id = auth.uid() or counterpart_id = auth.uid() or public.is_admin());
create policy "chat_messages_select_participant" on public.chat_messages for select
  using (
    public.is_admin() or exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.customer_id = auth.uid() or c.counterpart_id = auth.uid())
    )
  );

-- Finds the existing thread between the caller and the other user, or
-- starts one. Always exactly one customer and one fleet_owner/dealership
-- per conversation (chat is customer <-> owner/dealer, never peer-to-peer
-- between two customers or two owners) — the roles determine which side of
-- customer_id/counterpart_id the caller lands on regardless of who
-- initiated contact first.
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

  if v_me_role = 'customer' then
    if v_other_role not in ('fleet_owner', 'dealership') then
      raise exception 'Customers can only message fleet owners or dealers';
    end if;
    v_customer_id := auth.uid();
    v_counterpart_id := p_other_user_id;
  elsif v_me_role in ('fleet_owner', 'dealership') then
    if v_other_role != 'customer' then
      raise exception 'Owners and dealers can only message customers';
    end if;
    v_customer_id := p_other_user_id;
    v_counterpart_id := auth.uid();
  else
    raise exception 'This account type cannot use chat';
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

grant execute on function public.get_or_create_conversation(uuid, text, uuid, text) to authenticated;

-- Sends a message and notifies the recipient (in-app + push, via the
-- existing notify_user infra). Only exposed via RPC (no direct insert
-- grant) so the participant check and notification always happen together.
create or replace function public.send_message(p_conversation_id uuid, p_body text)
returns public.chat_messages
language plpgsql security definer set search_path = public as $$
declare
  v_conv public.conversations%rowtype;
  v_recipient_id uuid;
  v_sender_name text;
  v_msg public.chat_messages%rowtype;
begin
  if trim(coalesce(p_body, '')) = '' then
    raise exception 'Message cannot be empty';
  end if;

  select * into v_conv from public.conversations where id = p_conversation_id;
  if not found then
    raise exception 'Conversation not found';
  end if;

  if auth.uid() not in (v_conv.customer_id, v_conv.counterpart_id) then
    raise exception 'Not a participant in this conversation';
  end if;

  v_recipient_id := case when auth.uid() = v_conv.customer_id then v_conv.counterpart_id else v_conv.customer_id end;

  insert into public.chat_messages (conversation_id, sender_id, body)
  values (p_conversation_id, auth.uid(), trim(p_body))
  returning * into v_msg;

  update public.conversations set last_message_at = v_msg.created_at where id = p_conversation_id;

  select name into v_sender_name from public.profiles where id = auth.uid();
  perform public.notify_user(
    v_recipient_id, 'system', coalesce(v_sender_name, 'New message'),
    left(trim(p_body), 120),
    '/chat', jsonb_build_object('id', p_conversation_id)
  );

  return v_msg;
end;
$$;

grant execute on function public.send_message(uuid, text) to authenticated;

-- Marks every message the caller didn't send as read, for the unread badge.
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
      where c.id = p_conversation_id and (c.customer_id = auth.uid() or c.counterpart_id = auth.uid())
    );
end;
$$;

grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- Lets a lead be linked back to the customer who raised it (only known when
-- they were logged in at the time), so the dealer can open a chat with them
-- directly instead of only having name/phone for a WhatsApp/call deep link.
alter table public.leads add column if not exists customer_id uuid references public.profiles(id);
