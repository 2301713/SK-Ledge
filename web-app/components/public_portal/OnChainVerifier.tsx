"use client";

import { useState } from "react";
import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, SK_LEDGE_ABI } from "@/lib/contractConfig";
import { ShieldCheck, RefreshCw, ExternalLink, Loader2 } from "lucide-react";

type OnChainRecord = {
  id: bigint;
  official: string;
  barangay: string;
  amount: bigint;
  timestamp: bigint;
  purpose: string;
  recordType: string;
};

export default function OnChainVerifier() {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    data: records,
    isLoading,
    refetch,
    isRefetching,
  } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: SK_LEDGE_ABI,
    functionName: "getAllRecords",
  });

  const totalAllocations = records
    ? records.filter((r: OnChainRecord) => r.recordType === "Allocation").length
    : 0;
  const totalExpenses = records
    ? records.filter((r: OnChainRecord) => r.recordType === "Expense").length
    : 0;
  const totalAmount = records
    ? records.reduce((sum: bigint, r: OnChainRecord) => sum + r.amount, 0n)
    : 0n;

  return (
    <section className="px-6 mb-12">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="px-7 py-5 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.15em] mb-0.5">
                  Blockchain Verification
                </p>
                <h2 className="text-base font-bold text-white">
                  On-Chain Record Explorer
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => refetch()}
                disabled={isLoading || isRefetching}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
              >
                {isExpanded ? "Collapse" : "View Records"}
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="px-7 py-4 grid grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Total Records On-Chain
              </p>
              <p className="text-2xl font-black text-white">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                ) : (
                  records?.length ?? 0
                )}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Allocations / Expenses
              </p>
              <p className="text-2xl font-black text-white">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                ) : (
                  `${totalAllocations} / ${totalExpenses}`
                )}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Total Tracked Amount
              </p>
              <p className="text-2xl font-black text-emerald-400">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                ) : (
                  `₱${Number(totalAmount).toLocaleString()}`
                )}
              </p>
            </div>
          </div>

          {/* Expanded Records Table */}
          {isExpanded && (
            <div className="px-7 pb-5">
              {isLoading ? (
                <div className="text-center py-8 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Loading on-chain records...</p>
                </div>
              ) : !records || records.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700">
                  <p className="text-sm">No records found on-chain yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-700">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-800">
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Barangay
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Purpose
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Official
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Verified
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {[...records]
                        .reverse()
                        .map((record: OnChainRecord) => (
                          <tr
                            key={String(record.id)}
                            className="hover:bg-slate-800/50 transition-colors"
                          >
                            <td className="px-4 py-3 text-sm font-mono text-slate-300">
                              #{String(record.id)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  record.recordType === "Allocation"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-amber-500/20 text-amber-400"
                                }`}
                              >
                                {record.recordType}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-300">
                              {record.barangay}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-400 max-w-[200px] truncate">
                              {record.purpose}
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-white text-right font-mono">
                              ₱{Number(record.amount).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-xs font-mono text-slate-500">
                              {record.official.slice(0, 6)}...{record.official.slice(-4)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                On-Chain
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Contract Info Footer */}
          <div className="px-7 py-3 bg-slate-800/50 border-t border-slate-700 flex items-center justify-between">
            <p className="text-[10px] text-slate-500 font-mono">
              Contract: {CONTRACT_ADDRESS}
            </p>
            <a
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              View on Etherscan
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
