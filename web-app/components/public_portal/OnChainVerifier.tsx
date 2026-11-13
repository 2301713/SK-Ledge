"use client";

import { useState } from "react";
import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, LEGACY_CONTRACT_ADDRESS, SK_LEDGE_ABI } from "@/lib/contractConfig";
import { parseExpensePurpose } from "@/lib/formatExpensePurpose";
import {
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Loader2,
  Database,
  Wallet,
  FileStack,
} from "lucide-react";

type OnChainRecord = {
  id: bigint;
  official: string;
  barangay: string;
  amount: bigint;
  timestamp: bigint;
  purpose: string;
  recordType: string;
  deployment: "Current" | "Legacy";
};

export default function OnChainVerifier() {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    data: currentRecords,
    isLoading: currentLoading,
    refetch: refetchCurrent,
    isRefetching: isRefetchingCurrent,
  } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: SK_LEDGE_ABI,
    functionName: "getAllRecords",
  });

  const {
    data: legacyRecords,
    isLoading: legacyLoading,
    refetch: refetchLegacy,
    isRefetching: isRefetchingLegacy,
  } = useReadContract({
    address: LEGACY_CONTRACT_ADDRESS as `0x${string}`,
    abi: SK_LEDGE_ABI,
    functionName: "getAllRecords",
  });

  const isLoading = currentLoading || legacyLoading;
  const isRefetching = isRefetchingCurrent || isRefetchingLegacy;
  const refetch = () => {
    refetchCurrent();
    refetchLegacy();
  };

  const records: OnChainRecord[] = [
    ...((currentRecords as OnChainRecord[] | undefined) ?? []).map((r) => ({
      ...r,
      deployment: "Current" as const,
    })),
    ...((legacyRecords as OnChainRecord[] | undefined) ?? []).map((r) => ({
      ...r,
      deployment: "Legacy" as const,
    })),
  ];

  const totalAllocations = records.filter(
    (r: OnChainRecord) => r.recordType === "Allocation",
  ).length;
  const totalExpenses = records.filter(
    (r: OnChainRecord) => r.recordType === "Expense",
  ).length;
  const totalAmount = records.reduce(
    (sum: bigint, r: OnChainRecord) => sum + r.amount,
    BigInt(0),
  );

  const deploymentBadge = (deployment: "Current" | "Legacy") => (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
        deployment === "Current"
          ? "bg-primary/10 text-primary"
          : "bg-secondary text-secondary-foreground"
      }`}
    >
      {deployment}
    </span>
  );

  return (
    <section className="px-4 sm:px-6 mb-12">
      <div className="max-w-7xl mx-auto">
        <div className="animate-rise overflow-hidden rounded-3xl border border-border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)] motion-reduce:animate-none">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-5 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-success/20 bg-success/10">
                <ShieldCheck className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="mb-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Blockchain Verification
                </p>
                <h2 className="text-base font-bold text-primary-foreground">
                  On-Chain Record Explorer
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                disabled={isLoading || isRefetching}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-secondary disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 active:scale-95"
              >
                {isExpanded ? "Collapse" : "View Records"}
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-3 sm:px-7">
            <div className="flex items-start justify-between rounded-2xl border border-border bg-secondary/30 p-4">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                  Total Records On-Chain
                </p>
                <p className="text-2xl font-black text-primary-foreground tabular-nums">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-secondary-foreground" />
                  ) : (
                    records.length
                  )}
                </p>
              </div>
              <Database className="h-5 w-5 text-primary/40" />
            </div>
            <div className="flex items-start justify-between rounded-2xl border border-border bg-secondary/30 p-4">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                  Allocations / Expenses
                </p>
                <p className="text-2xl font-black text-primary-foreground tabular-nums">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-secondary-foreground" />
                  ) : (
                    `${totalAllocations} / ${totalExpenses}`
                  )}
                </p>
              </div>
              <FileStack className="h-5 w-5 text-primary/40" />
            </div>
            <div className="flex items-start justify-between rounded-2xl border border-border bg-secondary/30 p-4">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                  Total Tracked Amount
                </p>
                <p className="text-2xl font-black text-success tabular-nums">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-secondary-foreground" />
                  ) : (
                    `₱${(Number(totalAmount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  )}
                </p>
              </div>
              <Wallet className="h-5 w-5 text-success/40" />
            </div>
          </div>

          {/* Expanded Records Table */}
          {isExpanded && (
            <div className="px-6 pb-5 sm:px-7">
              {isLoading ? (
                <div className="text-center py-8 text-secondary-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Loading on-chain records...</p>
                </div>
              ) : records.length === 0 ? (
                <div className="text-center py-8 text-secondary-foreground bg-secondary/40 rounded-2xl border border-border">
                  <p className="text-sm">No records found on-chain yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-border">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-secondary/40">
                        <th className="px-4 py-3 text-[10px] font-bold text-secondary-foreground uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-secondary-foreground uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-secondary-foreground uppercase tracking-wider">
                          Barangay
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-secondary-foreground uppercase tracking-wider">
                          Purpose
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-secondary-foreground uppercase tracking-wider text-right">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-secondary-foreground uppercase tracking-wider">
                          Official
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-secondary-foreground uppercase tracking-wider">
                          Deployment
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-secondary-foreground uppercase tracking-wider">
                          Verified
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[...records]
                        .reverse()
                        .map((record: OnChainRecord) => {
                          const parsed = parseExpensePurpose(record.purpose);
                          return (
                          <tr
                            key={`${record.deployment}-${String(record.id)}`}
                            className="hover:bg-secondary/40 transition-colors"
                          >
                            <td className="px-4 py-3 text-sm font-mono text-primary-foreground">
                              #{String(record.id)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  record.recordType === "Allocation"
                                    ? "bg-primary/10 text-primary"
                                    : "bg-tertiary/30 text-primary-foreground"
                                }`}
                              >
                                {record.recordType}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-primary-foreground">
                              {record.barangay}
                            </td>
                            <td className="px-4 py-3 text-sm text-secondary-foreground max-w-50 truncate">
                              <span className="font-medium text-primary-foreground">
                                {parsed.description}
                              </span>
                              {parsed.vendor && (
                                <span className="block text-xs text-secondary-foreground">
                                  Vendor: {parsed.vendor}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-primary-foreground text-right font-mono">
                              ₱{(Number(record.amount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-xs font-mono text-secondary-foreground">
                              {record.official.slice(0, 6)}...{record.official.slice(-4)}
                            </td>
                            <td className="px-4 py-3">
                              {deploymentBadge(record.deployment)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                On-Chain
                              </span>
                            </td>
                          </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Contract Info Footer */}
          <div className="flex flex-col justify-between gap-2 border-t border-border bg-secondary/20 px-6 py-3 sm:flex-row sm:items-center sm:px-7">
            <div className="space-y-1">
              <p className="text-[10px] text-secondary-foreground font-mono">
                Current: {CONTRACT_ADDRESS}
              </p>
              <p className="text-[10px] text-secondary-foreground font-mono">
                Legacy: {LEGACY_CONTRACT_ADDRESS}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-[10px] text-secondary-foreground font-semibold uppercase tracking-widest">
                Aggregated across both deployments
              </span>
              <a
                href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 font-medium transition-colors"
              >
                View on Etherscan
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
