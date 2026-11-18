-- A correction supersedes its predecessor on-chain; the reports need that flag to
-- avoid counting a corrected record as current.
alter table public.allocations
  add column if not exists superseded boolean not null default false;
alter table public.expenses
  add column if not exists superseded boolean not null default false;
alter table public.awards
  add column if not exists superseded boolean not null default false;

-- Records that cannot be mirrored (unknown record type, or a signing wallet with
-- no bound profile) used to live only in the sync response. Persist them so the
-- gap survives a page reload instead of vanishing.
create table if not exists public.ledger_sync_gaps (
  id uuid primary key default gen_random_uuid(),
  contract_address text not null,
  blockchain_record_id bigint not null,
  record_type text not null,
  official_address text not null,
  reason text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (contract_address, blockchain_record_id)
);

-- No policies are added: only the service role may read or write these rows.
alter table public.ledger_sync_gaps enable row level security;
