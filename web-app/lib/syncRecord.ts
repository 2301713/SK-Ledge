import apiClient from "./apiClient";

export interface SyncRecordPayload {
  type: "expense" | "allocation" | "award";
  blockchain_tx_hash: string;
  contract_address: string;
  official_address: string;
  barangay: string;
  amount: number;
  purpose: string;
  project_id?: string;
}

export function syncRecord(payload: SyncRecordPayload) {
  return apiClient.post("/api/sync-record", payload);
}

/**
 * Pulls authoritative approval/void state from the contract into the reporting
 * tables. Best-effort: the chain remains the source of truth.
 */
export function reconcileLedger() {
  return apiClient.post("/api/reconcile-ledger", {});
}

export interface LedgerSyncGap {
  id: number;
  recordType: string;
  official: string;
  reason: "unsupported_record_type" | "official_not_bound";
  firstSeenAt: string;
  lastSeenAt: string;
}

/** On-chain records the reporting tables could not mirror, persisted server-side. */
export function getSyncGaps() {
  return apiClient.get("/api/reconcile-ledger");
}