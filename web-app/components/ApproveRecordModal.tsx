// web-app/components/ApproveRecordModal.tsx
"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESS, SK_LEDGE_ABI } from "@/lib/contractConfig";
import { formatEther } from "viem";

interface RecordItem {
  id: bigint;
  official: string;
  barangay: string;
  amount: bigint;
  timestamp: bigint;
  purpose: string;
  recordType: string;
  approved: boolean;
  approvedBy: string;
}

interface ApproveRecordModalProps {
  recordId: number | bigint;
  onClose: () => void;
}

export default function ApproveRecordModal({ recordId, onClose }: ApproveRecordModalProps) {
  const { data: records, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SK_LEDGE_ABI,
    functionName: "getAllRecords",
  });

  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const allRecords = (records as RecordItem[]) || [];
  const record = allRecords.find((r) => Number(r.id) === Number(recordId));

  const handleAction = (approved: boolean) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SK_LEDGE_ABI,
      functionName: "setRecordApproval",
      args: [BigInt(recordId), approved],
    });
  };

  const isProcessing = isPending || isConfirming;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden space-y-6 p-6 sm:p-8 relative">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Review Record #{recordId.toString()}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Authorize or reject this allocation entry on the blockchain.
          </p>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium">
            Fetching record details from ledger...
          </div>
        ) : !record ? (
          <div className="py-8 text-center text-xs text-rose-500 font-semibold">
            Record details not found on-chain.
          </div>
        ) : (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 font-medium text-slate-700">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Barangay:</span>
                <span className="font-bold text-slate-900">{record.barangay}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Requested Amount:</span>
                <span className="font-bold text-blue-700">{formatEther(record.amount)} ETH</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Submitted By:</span>
                <span className="font-mono text-[11px] text-slate-800 break-all">{record.official}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 block">Purpose / Details:</span>
                <p className="text-slate-800 bg-white p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                  {record.purpose}
                </p>
              </div>
            </div>

            {isConfirmed && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold text-center">
                Transaction confirmed! Status updated on-chain.
              </div>
            )}

            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-semibold text-center break-words">
                {error.message.includes("User rejected")
                  ? "Transaction canceled in wallet."
                  : "Only Authorized Contract Owners can approve/reject records."}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleAction(false)}
                disabled={isProcessing}
                className="flex-1 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold py-3 px-4 rounded-2xl transition-all disabled:opacity-50 text-xs sm:text-sm shadow-md"
              >
                Reject Entry
              </button>
              <button
                onClick={() => handleAction(true)}
                disabled={isProcessing}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3 px-4 rounded-2xl transition-all disabled:opacity-50 text-xs sm:text-sm shadow-md"
              >
                {isProcessing ? "Processing..." : "Approve Entry"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}