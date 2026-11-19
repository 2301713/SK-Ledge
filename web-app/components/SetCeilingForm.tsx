"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESS, SK_LEDGE_ABI } from "@/lib/contractConfig";
import { Settings, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  BATANGAS_BARANGAY_IDENTITIES,
  canonicalizeBarangay,
} from "@/lib/batangasBarangays";

const inputClass =
  "w-full rounded-xl border border-border bg-white py-3 pl-10 pr-3 text-sm font-bold text-primary-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

interface SetCeilingFormProps {
  /** The signed-in SK Chairperson's assigned barangay. */
  barangay: string | null;
}

export default function SetCeilingForm({ barangay }: SetCeilingFormProps) {
  const [ceiling, setCeiling] = useState("");
  const canonicalBarangay = barangay ? canonicalizeBarangay(barangay) : null;
  const identity = canonicalBarangay
    ? BATANGAS_BARANGAY_IDENTITIES.find(
        (item) => item.canonical === canonicalBarangay,
      )
    : undefined;

  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canonicalBarangay || !ceiling) return;

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SK_LEDGE_ABI,
      functionName: "setAllocationCeiling",
      args: [canonicalBarangay, BigInt(Math.round(Number(ceiling) * 100))],
      gas: BigInt(500000),
    });
  };

  if (!canonicalBarangay) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs font-medium text-danger">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Your profile has no valid barangay assigned, so a ceiling cannot be
          set. Ask an admin to assign your barangay first.
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
            Barangay Name
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Settings className="h-5 w-5 text-secondary-foreground" />
            </div>
            <select
              value={canonicalBarangay}
              disabled
              aria-describedby="ceiling-barangay-note"
              className={`${inputClass} cursor-not-allowed bg-secondary/60 text-secondary-foreground`}
            >
              <option value={canonicalBarangay}>
                {identity
                  ? `${identity.barangay}, ${identity.municipality}`
                  : canonicalBarangay}
              </option>
            </select>
          </div>
          <p
            id="ceiling-barangay-note"
            className="text-[10px] font-medium text-secondary-foreground"
          >
            Locked to your assigned barangay.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
            Ceiling Amount (PHP)
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-sm font-bold text-secondary-foreground">
                ₱
              </span>
            </div>
            <input
              type="number"
              step="any"
              value={ceiling}
              onChange={(e) => setCeiling(e.target.value)}
              placeholder="e.g. 100000"
              required
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending || isConfirming}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold tracking-wide text-white shadow-[0_6px_16px_-6px_rgba(1,56,168,0.5)] transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-95 disabled:cursor-not-allowed disabled:bg-secondary-foreground/30 md:w-auto"
      >
        {isPending || isConfirming ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {isConfirming ? "Confirming on Blockchain..." : "Broadcasting..."}
          </>
        ) : (
          "Update Ceiling"
        )}
      </button>

      {isConfirmed && (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3.5 text-xs font-medium text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Allocation ceiling successfully confirmed on blockchain!
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs font-medium text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="break-words">
            {error.message.includes("User rejected")
              ? "Transaction was rejected in MetaMask."
              : "Transaction failed. Please ensure your wallet address is authorized as Contract Owner or Federation Official."}
          </span>
        </div>
      )}
    </form>
  );
}
