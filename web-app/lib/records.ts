export const RECORD_TYPES = ["allocation", "expense", "award"] as const;

export type RecordType = (typeof RECORD_TYPES)[number];

export const RECORD_TABLES: Record<RecordType, string> = {
  allocation: "allocations",
  expense: "expenses",
  award: "awards",
};

export function isRecordType(value: unknown): value is RecordType {
  return (
    typeof value === "string" &&
    (RECORD_TYPES as readonly string[]).includes(value)
  );
}

/**
 * Ledger rows as stored in Supabase. `amount` is in centavos, matching the
 * on-chain representation; divide by 100 before displaying pesos.
 */
export interface LedgerRecord {
  /** Absent on public-scope responses, which only select display columns. */
  id?: string;
  record_type: RecordType;
  amount: number;
  user_id?: string | null;
  blockchain_tx_hash?: string | null;
  contract_address?: string | null;
  official_address?: string | null;
  barangay?: string | null;
  purpose?: string | null;
  project_id?: string | null;
  created_at?: string | null;
  // Present on expense rows.
  payee?: string | null;
  category?: string | null;
  dv_number?: string | null;
  reference_number?: string | null;
  date_submitted?: string | null;
  compliance_status?: string | null;
  [key: string]: unknown;
}

export function sumAmountCentavos(
  records: readonly LedgerRecord[],
  type: RecordType,
): number {
  return records.reduce((total, record) => {
    if (record.record_type !== type) {
      return total;
    }

    const amount = Number(record.amount);
    return total + (Number.isFinite(amount) ? amount : 0);
  }, 0);
}
