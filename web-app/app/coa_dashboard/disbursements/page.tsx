"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface SupabaseExpense {
  id: string;
  dv_number?: string;
  reference_number?: string;
  payee?: string;
  category?: string;
  purpose?: string;
  amount: number;
  date_submitted?: string;
  created_at?: string;
  compliance_status?: string;
  barangay?: string;
}

export interface DisbursementItem {
  id: string;
  payee: string;
  category: string;
  amount: number;
  dateSubmitted: string;
  compliance: "Clean" | "Flagged" | "Pending Docs";
  brgy: string;
}

export default function COADisbursementsPage() {
  const [disbursements, setDisbursements] = useState<DisbursementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    async function fetchDisbursements() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("expenses")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        if (data) {
          const mappedData: DisbursementItem[] = data.map((item: SupabaseExpense) => {
            const rawAmount = typeof item.amount === "number" ? item.amount : parseFloat(item.amount || "0");
            const finalAmount = rawAmount > 10000000 ? rawAmount / 100 : rawAmount;

            const rawStatus = (item.compliance_status || "Pending Docs").toLowerCase();
            let compliance: "Clean" | "Flagged" | "Pending Docs" = "Pending Docs";
            if (rawStatus.includes("clean") || rawStatus.includes("approved")) {
              compliance = "Clean";
            } else if (rawStatus.includes("flag") || rawStatus.includes("rejected")) {
              compliance = "Flagged";
            } else if (rawStatus.includes("pending") || rawStatus.includes("incomplete")) {
              compliance = "Pending Docs";
            }

            const rawDate = item.date_submitted || item.created_at || new Date().toISOString();
            const dateSubmitted = new Date(rawDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            const dvRef =
              item.dv_number ||
              item.reference_number ||
              (item.id ? `DV-${item.id.slice(0, 8).toUpperCase()}` : "DV-N/A");

            return {
              id: dvRef,
              payee: item.payee || item.purpose || "N/A",
              category: item.category || "General MOOE",
              amount: finalAmount,
              dateSubmitted,
              compliance,
              brgy: item.barangay || "Unassigned Brgy",
            };
          });

          setDisbursements(mappedData);
        }
      } catch (err: unknown) {
        console.error(
          "Error fetching disbursements:",
          err instanceof Error ? err.message : err,
        );
        setError("Failed to load disbursement records from Supabase.");
      } finally {
        setLoading(false);
      }
    }

    fetchDisbursements();
  }, []);

  const cleanCount = disbursements.filter((d) => d.compliance === "Clean").length;
  const flaggedCount = disbursements.filter((d) => d.compliance === "Flagged").length;
  const incompleteCount = disbursements.filter((d) => d.compliance === "Pending Docs").length;

  const filteredDisbursements = disbursements.filter((item) => {
    const matchesSearch =
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.payee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brgy.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "All" || item.compliance === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              COA Disbursements Audit
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
              COA Portal
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time blockchain-verified financial compliance oversight for Barangay SK Councils.
          </p>
        </div>
      </div>

      {/* Dynamic Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Clean Card */}
        <div className="p-5 rounded-xl border border-emerald-100 bg-white shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Clean Audits</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{cleanCount}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Flagged Card */}
        <div className="p-5 rounded-xl border border-rose-100 bg-white shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-rose-500" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Flagged Items</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{flaggedCount}</p>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pending Docs Card */}
        <div className="p-5 rounded-xl border border-amber-100 bg-white shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-amber-500" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Incomplete Docs</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{incompleteCount}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search and Status Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search reference, payee, category, or barangay..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="w-full md:w-auto flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Filter Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          >
            <option value="All">All Compliance Statuses</option>
            <option value="Clean">Clean</option>
            <option value="Flagged">Flagged</option>
            <option value="Pending Docs">Pending Docs</option>
          </select>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            <p className="text-sm font-medium">Fetching disbursement audit records...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-600 bg-rose-50/50">
            <p className="font-semibold">{error}</p>
          </div>
        ) : filteredDisbursements.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="font-medium text-slate-700">No disbursement records found.</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search keyword or compliance status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">DV Reference</th>
                  <th className="px-5 py-3.5">Payee / Entity</th>
                  <th className="px-5 py-3.5">Barangay</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                  <th className="px-5 py-3.5">Submitted</th>
                  <th className="px-5 py-3.5">Docs Status</th>
                  <th className="px-5 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDisbursements.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-indigo-600">
                      {item.id}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-900">{item.payee}</td>
                    <td className="px-5 py-4 text-slate-600">{item.brgy}</td>
                    <td className="px-5 py-4 text-slate-500">{item.category}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900 text-right">
                      ₱{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">{item.dateSubmitted}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          item.compliance === "Clean"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : item.compliance === "Flagged"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {item.compliance}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 rounded-md transition-colors">
                        Review Docs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}