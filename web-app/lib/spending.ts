import { canonicalizeBarangay } from "./batangasBarangays";

export type LedgerAmountType = "allocation" | "expense" | "award";

export interface LedgerAmountEntry {
  /** `Allocation`/`Expense`/`Award` on-chain, or snake_case from Supabase. */
  type: string | null | undefined;
  barangay: string | null | undefined;
  /** Centavos. Accepts the contract's bigint and the database's number/string. */
  amount: number | bigint | string | null | undefined;
  voided?: boolean | null;
}

/**
 * Sum the non-voided amounts of one record type for a barangay, in centavos.
 *
 * Both the contract ledger (`getAllRecords` returns `recordType`/`voided`) and
 * the Supabase-synced records (`record_type`) feed this, so the dashboard
 * totals and the expense ceiling guard can never drift apart. Unknown or
 * ambiguous barangay names contribute nothing, matching the contract's
 * canonical-barangay requirement.
 */
export function sumBarangayCentavos(
  entries: readonly LedgerAmountEntry[],
  type: LedgerAmountType,
  barangay: string | null | undefined,
): number {
  const targetBarangay = barangay ? canonicalizeBarangay(barangay) : null;
  if (!targetBarangay) {
    return 0;
  }

  return entries.reduce((total, entry) => {
    if (entry.voided) {
      return total;
    }

    if (String(entry.type ?? "").trim().toLowerCase() !== type) {
      return total;
    }

    if (!entry.barangay || canonicalizeBarangay(entry.barangay) !== targetBarangay) {
      return total;
    }

    const amount = Number(entry.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return total;
    }

    return total + Math.round(amount);
  }, 0);
}
