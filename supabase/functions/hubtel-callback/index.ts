// Public callback Hubtel POSTs to after a checkout completes. Deploy with:
//   supabase functions deploy hubtel-callback --no-verify-jwt
// (--no-verify-jwt is required: Hubtel's callback carries no Supabase JWT.)
//
// TRUST MODEL / KNOWN LIMITATION: Hubtel's checkout callback has no official
// signature/HMAC verification mechanism (confirmed against public docs and
// community integration reports as of writing). This handler does NOT trust
// the callback body on its own. It only credits money when ALL of the
// following hold:
//   1. The ClientReference matches a transaction WE created and is still
//      'pending' (rejects unknown/forged references and replay of an
//      already-processed one — see credit_wallet_from_topup's row lock).
//   2. The Amount in the callback matches the amount we recorded when we
//      initiated the transaction (rejects amount tampering).
//   3. The reported status indicates success.
// This does not (yet) call Hubtel back to independently re-verify the
// transaction server-to-server — that status-check endpoint's exact path
// needs confirming against the Hubtel account's own developer docs before
// adding it here as a second layer of defense.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUCCESS_STATUSES = new Set(['success', 'paid', 'completed']);

Deno.serve(async (req: Request) => {
  try {
    const body = await req.json().catch(() => ({}));

    // Hubtel's callback field casing has varied across integration reports
    // (PascalCase in some, camelCase in others) — read both defensively.
    const clientReference = body.ClientReference ?? body.clientReference ?? body.Data?.ClientReference;
    const amount = Number(body.Amount ?? body.amount ?? body.Data?.Amount);
    const status = String(body.Status ?? body.status ?? body.Data?.Status ?? '').toLowerCase();
    const hubtelTransactionId = body.CheckoutId ?? body.checkoutId ?? body.SalesInvoiceId ?? null;

    if (!clientReference || !Number.isFinite(amount)) {
      // Malformed/unrecognized payload — acknowledge receipt so Hubtel
      // doesn't retry indefinitely, but do nothing else.
      return new Response('ok', { status: 200 });
    }

    // References we generate are prefixed by which flow created them —
    // 'topup_' for wallet top-ups, 'sub_' for direct subscription payments —
    // so the same callback can route to the right table/RPC for either.
    const isSubscriptionPayment = String(clientReference).startsWith('sub_');

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (!SUCCESS_STATUSES.has(status)) {
      // Failed/cancelled payment — mark it so, no credit.
      if (isSubscriptionPayment) {
        await adminClient.rpc('fail_subscription_payment', { p_client_reference: clientReference });
      } else {
        await adminClient
          .from('wallet_transactions')
          .update({ status: 'failed' })
          .eq('hubtel_reference', clientReference)
          .eq('status', 'pending');
      }
      return new Response('ok', { status: 200 });
    }

    if (isSubscriptionPayment) {
      await adminClient.rpc('complete_subscription_payment', {
        p_client_reference: clientReference,
        p_amount: amount,
        p_hubtel_transaction_id: String(hubtelTransactionId ?? ''),
      });
    } else {
      await adminClient.rpc('credit_wallet_from_topup', {
        p_client_reference: clientReference,
        p_amount: amount,
        p_hubtel_transaction_id: String(hubtelTransactionId ?? ''),
      });
    }

    // Always 200 — Hubtel doesn't need our internal accept/reject reason,
    // and returning non-2xx just triggers callback retries.
    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response('ok', { status: 200 });
  }
});
