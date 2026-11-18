-- PostgREST can only resolve ON CONFLICT against a non-partial unique index.
-- NULL record ids remain distinct under a plain unique index, so rows written
-- before reconciliation existed are unaffected.
drop index if exists public.allocations_chain_record_key;
drop index if exists public.expenses_chain_record_key;
drop index if exists public.awards_chain_record_key;

create unique index allocations_chain_record_key
  on public.allocations (contract_address, blockchain_record_id);

create unique index expenses_chain_record_key
  on public.expenses (contract_address, blockchain_record_id);

create unique index awards_chain_record_key
  on public.awards (contract_address, blockchain_record_id);
