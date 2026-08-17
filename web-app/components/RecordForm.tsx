"use client";

import { useState, useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { CONTRACT_ADDRESS, SK_LEDGE_ABI } from "@/lib/contractConfig";
import { useAuthStore } from "@/lib/useAuthStore";
import { useToast } from "@/lib/useToast";
import { syncRecord } from "@/lib/syncRecord";

export function RecordForm() {
  const [barangay, setBarangay] = useState("");
  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState("");
  const [recordType, setRecordType] = useState("Expense");
  const [formError, setFormError] = useState("");

  const { isConnected, address } = useAccount();
  const { currentUser } = useAuthStore();
  const toast = useToast();
  const {
    data: hash,
    error: writeError,
    isPending: isAwaitingWallet,
    writeContract,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!barangay.trim()) return setFormError("Barangay is required.");
    if (!purpose.trim()) return setFormError("Purpose is required.");
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return setFormError("Please enter a valid positive amount.");
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: SK_LEDGE_ABI,
        functionName: "addRecord",
        args: [barangay, BigInt(amount), purpose, recordType],
      });
    } catch (err) {
      console.error("Submission failed:", err);
    }
  };

  const isProcessing = isAwaitingWallet || isConfirming;

  useEffect(() => {
    if (isConfirmed && hash) {
      syncRecord({
        type: recordType.toLowerCase() as "expense" | "allocation",
        user_id: currentUser?.id || "",
        blockchain_tx_hash: hash,
        contract_address: CONTRACT_ADDRESS,
        official_address: address || "",
        barangay,
        amount: Number(amount),
        purpose,
      }).catch((err) => {
        console.error("Sync failed:", err);
        toast.error("Recorded on-chain, but syncing to the database failed.");
      });
    }
  }, [isConfirmed, hash, recordType, currentUser, address, barangay, amount, purpose, toast]);

  if (!isConnected) {
    return (
      <div className="p-6 text-center border rounded-md bg-gray-50">
        <p className="text-gray-600">
          Please connect your wallet to submit a record.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md p-6 space-y-4 border rounded-md shadow-sm"
    >
      <h2 className="text-xl font-semibold">Log Financial Record</h2>

      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium" htmlFor="barangay">
          Barangay
        </label>
        <input
          id="barangay"
          disabled={isProcessing}
          className="p-2 border rounded-md"
          value={barangay}
          onChange={(e) => setBarangay(e.target.value)}
          placeholder="e.g., Barangay San Jose"
        />
      </div>

      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium" htmlFor="purpose">
          Purpose
        </label>
        <input
          id="purpose"
          disabled={isProcessing}
          className="p-2 border rounded-md"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="e.g., Council Meeting Snacks"
        />
      </div>

      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium" htmlFor="amount">
          Amount (PHP)
        </label>
        <input
          id="amount"
          disabled={isProcessing}
          className="p-2 border rounded-md"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="25000"
        />
      </div>

      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium" htmlFor="type">
          Type
        </label>
        <select
          id="type"
          disabled={isProcessing}
          className="p-2 border rounded-md bg-white"
          value={recordType}
          onChange={(e) => setRecordType(e.target.value)}
        >
          <option value="Expense">Expense</option>
          <option value="Allocation">Allocation</option>
        </select>
      </div>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      {writeError && (
        <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
          {writeError.message.includes("User rejected")
            ? "Transaction signature was rejected."
            : "Error executing transaction. See console for details."}
        </div>
      )}

      <button
        type="submit"
        disabled={isProcessing}
        className={`w-full py-2 px-4 text-white font-medium rounded-md transition-colors ${
          isProcessing
            ? "bg-blue-300 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isAwaitingWallet
          ? "Awaiting Signature..."
          : isConfirming
            ? "Processing on Chain..."
            : "Submit Record"}
      </button>

      {isConfirmed && (
        <div className="p-3 mt-4 text-sm text-green-800 bg-green-100 rounded-md">
          Transaction successfully confirmed!
          <a
            href={`https://sepolia.etherscan.io/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
            className="block mt-1 underline"
          >
            View on Block Explorer
          </a>
        </div>
      )}
    </form>
  );
}
