-- Direct one-off Hubtel payment for the monthly subscription fee (separate
-- from the wallet top-up path). subscription_payments needs its own
-- reference column to correlate the pending row with Hubtel's callback,
-- mirroring wallet_transactions.hubtel_reference — hubtel_transaction_id is
-- reserved for the confirmed Hubtel-side id once the callback arrives.
alter table public.subscription_payments add column if not exists hubtel_reference text;
create index if not exists idx_subscription_payments_hubtel_reference on public.subscription_payments (hubtel_reference);

-- Completes a pending direct subscription payment: verifies the reference
-- and amount match what we recorded when initiating it (same trust model as
-- credit_wallet_from_topup — the Hubtel callback is not otherwise verifiable),
-- then activates/extends the subscription by one period from whichever is
-- later: its current period end or now (so an early renewal doesn't lose the
-- remaining paid time, and a lapsed one starts a fresh 30 days from today).
create or replace function public.complete_subscription_payment(
  p_client_reference text,
  p_amount numeric,
  p_hubtel_transaction_id text
)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_payment public.subscription_payments%rowtype;
  v_sub public.subscriptions%rowtype;
  v_new_period_end timestamptz;
begin
  select * into v_payment from public.subscription_payments
  where hubtel_reference = p_client_reference and status = 'pending'
  for update;

  if not found then
    return false;
  end if;

  if abs(v_payment.amount - p_amount) > 0.01 then
    update public.subscription_payments set status = 'failed' where id = v_payment.id;
    return false;
  end if;

  select * into v_sub from public.subscriptions where id = v_payment.subscription_id for update;
  if not found then
    return false;
  end if;

  v_new_period_end := greatest(v_sub.current_period_end, now()) + interval '30 days';

  update public.subscription_payments
  set status = 'completed', hubtel_transaction_id = p_hubtel_transaction_id, period_end = v_new_period_end
  where id = v_payment.id;

  update public.subscriptions
  set status = 'active', current_period_end = v_new_period_end
  where id = v_sub.id;

  perform public.notify_user(
    v_sub.user_id, 'payment', 'Subscription Payment Received',
    'GH₵' || p_amount || ' received. Your subscription is active until ' || to_char(v_new_period_end, 'YYYY-MM-DD') || '.',
    '/subscription', null
  );

  return true;
end;
$$;

-- Marks a pending direct subscription payment as failed (Hubtel callback
-- reported a failure/cancellation) without touching the subscription row.
create or replace function public.fail_subscription_payment(p_client_reference text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.subscription_payments set status = 'failed'
  where hubtel_reference = p_client_reference and status = 'pending';
end;
$$;
