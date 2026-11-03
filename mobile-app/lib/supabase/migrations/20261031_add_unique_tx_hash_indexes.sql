-- Migration: Add unique index constraints on blockchain_tx_hash for duplicate prevention
-- NOTE: Review before running in production.

CREATE UNIQUE INDEX IF NOT EXISTS idx_allocations_blockchain_tx_hash 
ON public.allocations (blockchain_tx_hash);

CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_blockchain_tx_hash 
ON public.expenses (blockchain_tx_hash);

CREATE UNIQUE INDEX IF NOT EXISTS idx_awards_blockchain_tx_hash 
ON public.awards (blockchain_tx_hash);