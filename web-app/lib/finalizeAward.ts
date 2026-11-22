import apiClient from "./apiClient";

export interface FinalizeAwardPayload {
  project_id: string | number;
  winning_bid_id: string;
  award_tx_hash: string;
  official_address: string;
}

/**
 * Marks the project as awarded and the winning bid as won in one server-side
 * operation. Uses the service role so the project update cannot be silently
 * dropped by row-level security.
 */
export function finalizeAward(payload: FinalizeAwardPayload) {
  return apiClient.post("/api/awards/finalize", payload);
}
