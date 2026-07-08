-- Atomic, idempotent wallet credit for a confirmed Hubtel top-up. Called
-- only by the hubtel-callback Edge Function using the service role key
-- (never exposed to authenticated/anon clients) after independently
-- matching the callback against a real pending transaction by reference
-- and amount — see supabase/functions/hubtel-callback/index.ts for the
-- full trust model and its documented limitations (Hubtel's checkout
-- callback has no official signature verification).
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
    return false; -- unknown reference, or already processed (idempotent no-op)
  end if;

  if abs(v_tx.amount - p_amount) > 0.01 then
    update public.wallet_transactions set status = 'failed' where id = v_tx.id;
    return false; -- amount mismatch — do not credit, flag for investigation
  end if;

  update public.wallet_transactions
  set status = 'completed', description = description || ' (Hubtel txn ' || coalesce(p_hubtel_transaction_id, 'n/a') || ')'
  where id = v_tx.id;

  update public.wallets set balance = balance + p_amount, updated_at = now()
  where user_id = v_tx.wallet_id;

  return true;
end;
$$;
