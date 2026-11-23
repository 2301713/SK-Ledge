"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { getSyncGaps, reconcileLedger, type LedgerSyncGap } from "@/lib/syncRecord";
import { useToast } from "@/lib/useToast";

interface ReconcileResponse {
  message: string;
  reconciled: number;
  gapsPersisted: boolean;
}

const GAPS_QUERY_KEY = ["ledger-sync-gaps"];

const shortAddress = (address: string) =>
  `${address.slice(0, 6)}…${address.slice(-4)}`;

const REASON_LABELS: Record<LedgerSyncGap["reason"], string> = {
  unsupported_record_type: "unsupported record type",
  official_not_bound: "signing wallet has no bound profile",
};

export default function SyncLedgerButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPanelDismissed, setIsPanelDismissed] = useState(false);
  const toast = useToast();
  const queryClient = useQueryClient();

  const gapsQuery = useQuery({
    queryKey: GAPS_QUERY_KEY,
    queryFn: async () => {
      const result = (await getSyncGaps()) as unknown as { gaps: LedgerSyncGap[] };
      return result.gaps ?? [];
    },
  });

  const sync = async () => {
    setIsSyncing(true);
    try {
      const result = (await reconcileLedger()) as unknown as ReconcileResponse;
      queryClient.invalidateQueries();
      setIsPanelDismissed(false);

      toast.success(
        `Reconciled ${result.reconciled} ledger record${
          result.reconciled === 1 ? "" : "s"
        } from the chain.`,
      );

      if (!result.gapsPersisted) {
        toast.warning("Records were mirrored, but the gap list could not be saved.");
      }
    } catch (error) {
      toast.error(
        (error as { message?: string }).message || "Ledger reconciliation failed.",
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const gaps = isPanelDismissed ? [] : (gapsQuery.data ?? []);

  return (
    <div className="flex w-full flex-col items-stretch gap-2 sm:items-end">
      <button
        type="button"
        onClick={sync}
        disabled={isSyncing}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
        {isSyncing ? "Reconciling…" : "Reconcile ledger"}
      </button>

      {gaps.length > 0 && (
        <div className="w-full max-w-sm rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-bold text-amber-900">
              Not mirrored on-chain records ({gaps.length})
            </p>
            <button
              type="button"
              onClick={() => setIsPanelDismissed(true)}
              className="text-[11px] font-semibold text-amber-800 underline-offset-2 hover:underline"
            >
              Dismiss
            </button>
          </div>
          <ul className="mt-2 space-y-1">
            {gaps.map((gap) => (
              <li key={`${gap.id}-${gap.reason}`} className="text-[11px] text-amber-900">
                <span className="font-semibold">#{gap.id}</span>{" "}
                {gap.recordType} · {shortAddress(gap.official)} —{" "}
                {REASON_LABELS[gap.reason] ?? gap.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
