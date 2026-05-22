"use client";

import { useEffect, useState } from "react";
import SideBar from "@/components/dashboard/SideBar";
import { supabase } from "@/lib/supabase";
import { pendingDisbursements } from "../types";
import { useRouter } from "next/navigation";
import { UserAccount } from "@/lib/useAuthStore";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Filter,
  MoreHorizontal,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

export default function DisbursementsPage() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          console.error("No active user session found.");
          router.push("/login");
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            "id, username, role_type, full_name, barangay, email, approval_status",
          )
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError.message);
          return;
        }

        if (profileData) {
          if (profileData.role_type !== "COA") {
            console.warn("Unauthorized access: User is not a COA member.");
            router.push("/unauthorized");
            return;
          }

          const profile = {
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type,
            barangay: profileData.barangay || "No Barangay Assigned",
            email: profileData.email,
            approval_status: profileData.approval_status,
          };

          setCurrentUser(profile as UserAccount);
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-tertiary font-black text-xl shadow-xl shadow-primary/30 mb-6 animate-bounce">
          COA
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Loading Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background selection:bg-tertiary selection:text-primary">
      {currentUser && (
        <SideBar
          userName={currentUser.full_name}
          roleType={currentUser.role_type}
          barangay={currentUser.barangay}
        />
      )}

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
        {/* HEADER */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-10 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <ShieldCheck size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                COA Audit Ledger
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">
                Pending Disbursements Review
              </p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">
              <Filter size={14} /> Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">
              <Download size={14} /> Export Report
            </button>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-8 z-10">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* SEARCH AND QUICK FILTERS */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="w-full md:w-96 flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus-within:ring-2 ring-emerald-500/20 focus-within:border-emerald-500 transition-all shadow-sm">
                <Search className="text-slate-400 mr-3" size={18} />
                <input
                  type="text"
                  placeholder="Search DV Number or Payee..."
                  className="bg-transparent border-none outline-none text-sm w-full font-medium text-slate-800 placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mr-2">
                  Quick Views:
                </span>
                <button className="px-3 py-1.5 bg-slate-800 text-white rounded-md text-xs font-bold">
                  All Pending
                </button>
                <button className="px-3 py-1.5 bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 rounded-md text-xs font-bold flex items-center gap-1">
                  <AlertTriangle size={12} /> Flagged
                </button>
              </div>
            </div>

            {/* AUDIT TABLE CONTAINER */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/80 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        DV Reference
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Payee / Entity
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Category
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">
                        Docs Status
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">
                        Audit Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingDisbursements.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Column 1: DV Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded text-slate-500 group-hover:text-emerald-600 transition-colors">
                              <FileText size={16} />
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-sm tracking-tight">
                                {item.id}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                                {item.dateSubmitted}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Payee */}
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800 text-sm">
                            {item.payee}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 mt-0.5 flex items-center gap-1">
                            {item.brgy}
                          </p>
                        </td>

                        {/* Column 3: Category */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600">
                            {item.category}
                          </span>
                        </td>

                        {/* Column 4: Amount */}
                        <td className="px-6 py-4 text-right">
                          <span className="font-black text-slate-900 tracking-tight text-sm">
                            {formatCurrency(item.amount)}
                          </span>
                        </td>

                        {/* Column 5: Compliance Status */}
                        <td className="px-6 py-4 text-center">
                          {item.compliance === "Clean" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                              <CheckCircle2 size={12} /> Clean
                            </span>
                          )}
                          {item.compliance === "Flagged" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-widest border border-rose-200">
                              <XCircle size={12} /> Flagged
                            </span>
                          )}
                          {item.compliance === "Pending Docs" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-200">
                              <AlertTriangle size={12} /> Incomplete
                            </span>
                          )}
                        </td>

                        {/* Column 6: Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                              title="Review Vouchers"
                            >
                              <Eye size={18} />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
                              <MoreHorizontal size={18} />
                            </button>
                            <button className="ml-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm">
                              Audit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pendingDisbursements.length === 0 && (
                  <div className="p-12 text-center flex flex-col items-center justify-center border-t border-slate-100">
                    <ShieldCheck size={40} className="text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-slate-500">
                      No pending disbursements found.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
