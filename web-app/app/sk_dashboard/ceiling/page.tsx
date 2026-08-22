"use client";

import { useReadContracts } from "wagmi";
import { CONTRACT_ADDRESS, SK_LEDGE_ABI } from "@/lib/contractConfig";
import SetCeilingForm from "@/components/SetCeilingForm";
import { formatEther } from "viem";

const KNOWN_BARANGAYS = ["San Luis", "Balagtas", "Batangas", "Poblacion 1", "Poblacion 2"];

export default function CeilingPage() {
  const ceilingCalls = KNOWN_BARANGAYS.map((b) => ({
    address: CONTRACT_ADDRESS,
    abi: SK_LEDGE_ABI,
    functionName: "allocationCeilings",
    args: [b],
  }));

  const allocatedCalls = KNOWN_BARANGAYS.map((b) => ({
    address: CONTRACT_ADDRESS,
    abi: SK_LEDGE_ABI,
    functionName: "getAllocated",
    args: [b],
  }));

  const { data: ceilingsData } = useReadContracts({ contracts: ceilingCalls as any });
  const { data: allocatedData } = useReadContracts({ contracts: allocatedCalls as any });

  return (
    <div className="space-y-8 p-6 sm:p-10 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Manage Allocation <span className="text-blue-700">Ceilings</span>
        </h1>
        <p className="text-slate-500 text-sm sm:text-base">
          Set maximum funding thresholds per barangay directly on the ledger for full governance transparency.
        </p>
      </div>

      <SetCeilingForm />

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="bg-slate-50/80 p-6 border-b border-slate-200/80">
          <h2 className="text-lg font-bold text-slate-900">Active Barangay Ceilings & Allocations</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time breakdown of allocation limits and spent funds on-chain</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-blue-50/60 text-blue-900 font-bold uppercase text-[11px] tracking-wider border-b border-blue-100">
              <tr>
                <th className="px-6 py-4">Barangay</th>
                <th className="px-6 py-4">Allocated Amount</th>
                <th className="px-6 py-4">Ceiling Cap</th>
                <th className="px-6 py-4">Utilization Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {KNOWN_BARANGAYS.map((barangay, index) => {
                const ceilingItem = ceilingsData?.[index] as { result?: bigint } | undefined;
                const allocatedItem = allocatedData?.[index] as { result?: bigint } | undefined;

                const ceilingRaw = ceilingItem?.result ?? BigInt(0);
                const allocatedRaw = allocatedItem?.result ?? BigInt(0);

                const ceilingEth = parseFloat(formatEther(ceilingRaw));
                const allocatedEth = parseFloat(formatEther(allocatedRaw));

                const percentage = ceilingEth > 0 ? Math.min(Math.round((allocatedEth / ceilingEth) * 100), 100) : 0;

                let progressColor = "bg-emerald-500";
                if (percentage >= 90) progressColor = "bg-rose-500";
                else if (percentage >= 70) progressColor = "bg-amber-500";

                return (
                  <tr key={barangay} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{barangay}</td>
                    <td className="px-6 py-4 text-slate-800">{allocatedEth.toFixed(2)} ETH</td>
                    <td className="px-6 py-4 text-slate-800">{ceilingEth > 0 ? `${ceilingEth.toFixed(2)} ETH` : "Not Set"}</td>
                    <td className="px-6 py-4 min-w-[220px]">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-600">{percentage}% used</span>
                          <span className="text-slate-400">{allocatedEth.toFixed(2)} / {ceilingEth > 0 ? ceilingEth.toFixed(2) : "0"} ETH</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-500 ${progressColor}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}