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
  user_id?: string; // Optional: Session identity is now securely resolved server-side
}

export function syncRecord(payload: SyncRecordPayload) {
  return apiClient.post("/api/sync-record", payload);
}