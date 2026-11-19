CREATE UNIQUE INDEX IF NOT EXISTS allocations_blockchain_tx_hash_unique
  ON public.allocations (lower(blockchain_tx_hash))
  WHERE blockchain_tx_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS expenses_blockchain_tx_hash_unique
  ON public.expenses (lower(blockchain_tx_hash))
  WHERE blockchain_tx_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS awards_blockchain_tx_hash_unique
  ON public.awards (lower(blockchain_tx_hash))
  WHERE blockchain_tx_hash IS NOT NULL;
