CREATE UNIQUE INDEX allocations_blockchain_tx_hash_unique
  ON public.allocations (lower(blockchain_tx_hash))
  WHERE blockchain_tx_hash IS NOT NULL;

CREATE UNIQUE INDEX expenses_blockchain_tx_hash_unique
  ON public.expenses (lower(blockchain_tx_hash))
  WHERE blockchain_tx_hash IS NOT NULL;

CREATE UNIQUE INDEX awards_blockchain_tx_hash_unique
  ON public.awards (lower(blockchain_tx_hash))
  WHERE blockchain_tx_hash IS NOT NULL;
