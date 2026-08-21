"use client";

import { useState } from "react";
import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, SK_LEDGE_ABI } from "@/lib/contractConfig";
import ApproveRecordModal from "@/components/ApproveRecordModal";
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

export default function RecordApprovalsPage() {
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

  const { data: records, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SK_LEDGE_ABI,
    functionName: "getAllRecords",
  });

  const formattedRecords = ((records as RecordItem[]) || []).map((r) => ({
    id: Number(r.id),
    barangay: r.barangay,
    amount: formatEther(r.amount),
    purpose: r.purpose,
    status: r.approved ? "APPROVED" : "PENDING",
    date: new Date(Number(r.timestamp) * 1000).toISOString().split("T")[0],
  }));

  const filteredRecords = formattedRecords.filter((rec) => {
    const matchesFilter = filter === "ALL" || rec.status === filter;
    const matchesSearch =
      rec.barangay.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.id.toString().includes(searchTerm) ||
      rec.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    ALL: formattedRecords.length,
    PENDING: formattedRecords.filter((r) => r.status === "PENDING").length,
    APPROVED: formattedRecords.filter((r) => r.status === "APPROVED").length,
    REJECTED: formattedRecords.filter((r) => r.status === "REJECTED").length,
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40 p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-900 tracking-tight">
              Record Approvals
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Review and authorize pending blockchain ledger entries.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search records by Barangay or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 pl-10 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all font-medium"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-2xl self-start md:self-auto text-xs font-semibold">
            {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  filter === tab
                    ? "bg-white text-blue-700 shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>{tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  filter === tab ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-600"
                }`}>
                  {counts[tab]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-blue-100/60 text-blue-900 font-bold uppercase text-[11px] tracking-wider border-b border-blue-200/60">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Barangay</th>
                <th className="px-5 py-3.5">Amount (ETH)</th>
                <th className="px-5 py-3.5">Purpose</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Loading blockchain records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    No records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-900">#{row.id}</td>
                    <td className="px-5 py-4 font-semibold text-slate-800">{row.barangay}</td>
                    <td className="px-5 py-4 text-slate-800 font-bold">{row.amount} ETH</td>
                    <td className="px-5 py-4 text-slate-600 max-w-xs truncate">{row.purpose}</td>
                    <td className="px-5 py-4 text-slate-500 text-xs">{row.date}</td>
                    <td className="px-5 py-4">
                      {row.status === "APPROVED" && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600 text-white">
                          APPROVED
                        </span>
                      )}
                      {row.status === "PENDING" && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white">
                          PENDING
                        </span>
                      )}
                      {row.status === "REJECTED" && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-600 text-white">
                          REJECTED
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => setSelectedRecordId(row.id)}
                        className="bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRecordId !== null && (
        <ApproveRecordModal
          recordId={selectedRecordId}
          onClose={() => setSelectedRecordId(null)}
        />
      )}
    </div>
  );
}