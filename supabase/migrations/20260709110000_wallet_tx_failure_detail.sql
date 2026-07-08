-- Temporary diagnostic column: captures the raw Hubtel response (or parse
-- error) when a top-up initiation fails, so failures can be inspected via
-- SQL without needing the project's log analytics pipeline.
alter table public.wallet_transactions add column if not exists failure_detail text;
