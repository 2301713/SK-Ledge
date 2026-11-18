-- The contract exposes record state but not the transaction that created each
-- record, and provider log-range limits make backfilling hashes unreliable.
-- Reconciled rows therefore may not carry a hash; records created through the
-- app still store one.
alter table public.allocations alter column blockchain_tx_hash drop not null;
alter table public.expenses alter column blockchain_tx_hash drop not null;
alter table public.awards alter column blockchain_tx_hash drop not null;
