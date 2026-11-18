-- Mirror authoritative on-chain ledger state into the reporting tables so the
-- database can always be reconciled against the contract.
alter table public.allocations
  add column if not exists blockchain_record_id bigint,
  add column if not exists approved boolean not null default false,
  add column if not exists approved_by text,
  add column if not exists approval_count integer not null default 0,
  add column if not exists voided boolean not null default false,
  add column if not exists void_reason text,
  add column if not exists predecessor_id bigint,
  add column if not exists synced_at timestamptz not null default now();

alter table public.expenses
  add column if not exists blockchain_record_id bigint,
  add column if not exists approved boolean not null default false,
  add column if not exists approved_by text,
  add column if not exists approval_count integer not null default 0,
  add column if not exists voided boolean not null default false,
  add column if not exists void_reason text,
  add column if not exists predecessor_id bigint,
  add column if not exists synced_at timestamptz not null default now();

alter table public.awards
  add column if not exists blockchain_record_id bigint,
  add column if not exists approved boolean not null default false,
  add column if not exists approved_by text,
  add column if not exists approval_count integer not null default 0,
  add column if not exists voided boolean not null default false,
  add column if not exists void_reason text,
  add column if not exists predecessor_id bigint,
  add column if not exists synced_at timestamptz not null default now();

-- The contract does not carry PSGC identifiers, so an expense cannot always be
-- mapped to a reference barangay row. The column is unused by the app today.
alter table public.expenses alter column barangay_id drop not null;

create unique index if not exists allocations_chain_record_key
  on public.allocations (contract_address, blockchain_record_id)
  where blockchain_record_id is not null;

create unique index if not exists expenses_chain_record_key
  on public.expenses (contract_address, blockchain_record_id)
  where blockchain_record_id is not null;

create unique index if not exists awards_chain_record_key
  on public.awards (contract_address, blockchain_record_id)
  where blockchain_record_id is not null;
