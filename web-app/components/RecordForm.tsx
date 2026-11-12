"use client";

import { useState, useEffect, useRef } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { CONTRACT_ADDRESS, SK_LEDGE_ABI } from "@/lib/contractConfig";
import { useToast } from "@/lib/useToast";
import { syncRecord } from "@/lib/syncRecord";
import {
  BATANGAS_BARANGAY_IDENTITIES,
  canonicalizeBarangay,
} from "@/lib/batangasBarangays";

interface RecordFormProps {
  onSuccessRefresh?: () => void;
}

type RecordType = "Expense" | "Allocation" | "Award";

interface PendingSubmission {
  recordType: RecordType;
  address?: string;
  barangay: string;
  amount: number;
  purpose: string;
}

export function RecordForm({ onSuccessRefresh }: RecordFormProps) {
  const [barangay, setBarangay] = useState("");
  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState("");
  const [recordType, setRecordType] = useState<RecordType>("Expense");
  const [formError, setFormError] = useState("");
  const pendingSubmission = useRef<PendingSubmission | null>(null);

  const { isConnected, address, chain } = useAccount();
  const toast = useToast();

  const {
    data: hash,
    error: writeError,
    isPending: isAwaitingWallet,
    writeContract,
    reset: resetWriteContract,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    resetWriteContract();

    const canonicalBarangay = canonicalizeBarangay(barangay);
    if (!canonicalBarangay) {
      return setFormError("Select a valid barangay and municipality.");
    }

    const trimmedPurpose = purpose.trim();
    if (!trimmedPurpose) return setFormError("Purpose is required.");
    
    // Check exact UTF-8 byte length to match Solidity's MAX_PURPOSE_BYTES = 256
    const purposeByteLength = new TextEncoder().encode(trimmedPurpose).length;
    if (purposeByteLength > 256) {
      return setFormError(`Purpose is too long (${purposeByteLength}/256 bytes). Please shorten it.`);
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return setFormError("Please enter a valid positive amount.");
    }

    try {
      pendingSubmission.current = {
        recordType,
        address,
        barangay: canonicalBarangay,
        amount: Math.round(Number(amount) * 100),
        purpose: trimmedPurpose,
      };
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: SK_LEDGE_ABI,
        functionName: "addRecord",
        args: [
          canonicalBarangay,
          BigInt(Math.round(Number(amount) * 100)),
          trimmedPurpose,
          recordType,
        ],
      });
    } catch (err) {
      console.error("Submission failed:", err);
      pendingSubmission.current = null;
      toast.error("Failed to submit record. Please try again.");
    }
  };

  const isProcessing = isAwaitingWallet || isConfirming;

  useEffect(() => {
    const submission = pendingSubmission.current;
    if (isConfirmed && hash && submission) {
      pendingSubmission.current = null;
      syncRecord({
        type: submission.recordType.toLowerCase() as
          | "expense"
          | "allocation"
          | "award",
        blockchain_tx_hash: hash,
        contract_address: CONTRACT_ADDRESS,
        official_address: submission.address || "",
        barangay: submission.barangay,
        amount: submission.amount,
        purpose: submission.purpose,
      })
        .then(() => {
          if (onSuccessRefresh) onSuccessRefresh();
          setPurpose("");
          setAmount("");
          toast.success("Record successfully logged and synced!");
        })
        .catch((err) => {
          console.error("Sync failed:", err);
          toast.error("Recorded on-chain, but syncing to the database failed.");
        });
    }
  }, [isConfirmed, hash, onSuccessRefresh, toast]);

  // UX Guard 1: Disconnected
  if (!isConnected) {
    return (
      <div className="p-6 text-center border rounded-md bg-gray-50 border-gray-200">
        <p className="text-gray-600 font-medium">Wallet Disconnected</p>
        <p className="text-sm text-gray-500 mt-1">Please connect your wallet to submit a record.</p>
      </div>
    );
  }

  // UX Guard 2: Wrong Network
  if (chain?.id !== sepolia.id) {
    return (
      <div className="p-6 text-center border rounded-md bg-amber-50 border-amber-200">
        <p className="text-amber-800 font-medium">Wrong Network Detected</p>
        <p className="text-sm text-amber-700 mt-1">
          Please switch your wallet network to <b>Sepolia</b> to continue.
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
        <select
          id="barangay"
          disabled={isProcessing}
          className="p-2 border rounded-md"
          value={barangay}
          onChange={(e) => setBarangay(e.target.value)}
          required
        >
          <option value="" disabled>
            Select a barangay
          </option>
          {BATANGAS_BARANGAY_IDENTITIES.map((identity) => (
            <option key={identity.canonical} value={identity.canonical}>
              {identity.barangay}, {identity.municipality}
            </option>
          ))}
        </select>
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
          onChange={(e) => {
            const value = e.target.value;
            if (
              value === "Expense" ||
              value === "Allocation" ||
              value === "Award"
            ) {
              setRecordType(value);
            }
          }}
        >
          <option value="Expense">Expense</option>
          <option value="Allocation">Allocation</option>
          <option value="Award">Award</option>
        </select>
      </div>

      {formError && <p className="text-sm text-red-600 font-medium">{formError}</p>}

      {writeError && (
        <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md border border-red-200">
          {writeError.message.toLowerCase().includes("user rejected")
            ? "Transaction signature was rejected by user."
            : writeError.message.toLowerCase().includes("insufficient funds")
            ? "Insufficient funds for gas."
            : "Error executing transaction. Please check inputs and try again."}
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
          ? "Awaiting Wallet Signature..."
          : isConfirming
            ? "Confirming on Sepolia..."
            : "Submit Record"}
      </button>

      {isConfirmed && hash && (
        <div className="p-3 mt-4 text-sm text-green-800 bg-green-100 rounded-md border border-green-200">
          <span className="font-semibold block mb-1">Transaction Confirmed!</span>
          <a
            href={`https://sepolia.etherscan.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-700 underline hover:text-green-900"
          >
            View on Sepolia Etherscan ↗
          </a>
        </div>
      )}
    </form>
  );
}