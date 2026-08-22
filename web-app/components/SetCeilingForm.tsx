"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESS, SK_LEDGE_ABI } from "@/lib/contractConfig";

export default function SetCeilingForm() {
  const [barangay, setBarangay] = useState("");
  const [ceiling, setCeiling] = useState("");

  const { data: hash, writeContract, isPending, error } = useWriteContract();

  // Hihintayin nito ang tunay na confirmation ng transaction mula sa blockchain
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barangay || !ceiling) return;

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SK_LEDGE_ABI,
      functionName: "setAllocationCeiling",
      args: [barangay, BigInt(Math.round(Number(ceiling) * 100))],
      gas: BigInt(500000),
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-700 text-white rounded-xl shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Ceiling Configuration</h2>
            <p className="text-xs text-slate-500">Update funding limits per barangay</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Barangay Name
          </label>
          <input
            type="text"
            value={barangay}
            onChange={(e) => setBarangay(e.target.value)}
            placeholder="e.g. San Luis"
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Ceiling Amount (PHP)
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              value={ceiling}
              onChange={(e) => setCeiling(e.target.value)}
              placeholder="e.g. 10"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20 pr-16"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              PHP
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || isConfirming}
          className="w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
        >
          {isPending || isConfirming ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isConfirming ? "Confirming on Blockchain..." : "Broadcasting Transaction..."}
            </>
          ) : (
            "Update Ceiling"
          )}
        </button>

        {isConfirmed && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Allocation ceiling successfully confirmed on blockchain!
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800 font-medium">
            <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="break-words">
              {error.message.includes("User rejected")
                ? "Transaction was rejected in MetaMask."
                : "Transaction failed. Please ensure your wallet address is authorized as Contract Owner or Federation Official."}
            </span>
          </div>
        )}
      </form>
    </div>
  );
}