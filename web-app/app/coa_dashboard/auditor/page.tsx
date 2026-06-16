"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "../types";
import { VerifiedTransaction, ProjectStatus } from "../types";
import { ShieldCheck, Search } from "lucide-react";

export default function AuditorPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"transactions" | "projects">(
    "transactions",
  );

  // Mock data
  const [transactions] = useState<VerifiedTransaction[]>([
    {
      id: "1",
      amount: 25000,
      vendor: "ABC Construction",
      category: "Infrastructure",
      date: "2024-01-15",
      status: "verified",
      blockchainHash: "0x1234...abcd",
      receiptCount: 3,
      projectId: "proj-001",
    },
    {
      id: "2",
      amount: 15000,
      vendor: "Office Supplies Inc",
      category: "Office Supplies",
      date: "2024-01-20",
      status: "verified",
      blockchainHash: "0x5678...efgh",
      receiptCount: 1,
    },
    {
      id: "3",
      amount: 50000,
      vendor: "Tech Solutions Ltd",
      category: "Technology",
      date: "2024-01-25",
      status: "flagged",
      blockchainHash: "0x9abc...ijkl",
      receiptCount: 2,
      projectId: "proj-002",
    },
  ]);

  const [projects] = useState<ProjectStatus[]>([
    {
      id: "proj-001",
      name: "Barangay Road Repair",
      budget: 100000,
      spent: 75000,
      status: "active",
      lastAudit: "2024-01-20",
      complianceScore: 95,
    },
    {
      id: "proj-002",
      name: "Community Center Upgrade",
      budget: 200000,
      spent: 120000,
      status: "active",
      lastAudit: "2024-01-18",
      complianceScore: 88,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
          if (
            !["COA", "COA_Auditor", "DILG_Official"].includes(
              profileData.role_type,
            )
          ) {
            console.warn(
              "Unauthorized access: Only auditors can access this dashboard.",
            );
            router.push("/unauthorized");
            return;
          }

          const profile = {
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type,
            barangay: profileData.barangay || "COA",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "flagged":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-tertiary font-black text-xl shadow-xl shadow-primary/30 mb-6 animate-bounce">
          COA
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Loading Auditor Dashboard...
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
        />
      )}

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
        <header className="h-24 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-10 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-700 shadow-sm">
              <ShieldCheck size={28} strokeWidth={2.3} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Auditor Verification
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Track compliance, verify transactions, and review project audits
                in a unified COA dashboard.
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <section className="grid gap-3 lg:grid-cols-[1.6fr_0.9fr] items-start">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 min-h-40 h-full flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                      Audit readiness
                    </p>
                    <h2 className="text-lg font-extrabold text-slate-900 mt-1">
                      Transaction integrity
                    </h2>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    <ShieldCheck className="w-4 h-4" />
                    Verified
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 min-h-27.5 flex flex-col justify-between">
                    <p className="text-[10px] uppercase text-slate-500 font-bold">
                      Verified
                    </p>
                    <p className="mt-2 text-2xl font-black text-slate-900">
                      2,150
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Completed review cycles
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 min-h-27.5 flex flex-col justify-between">
                    <p className="text-[10px] uppercase text-slate-500 font-bold">
                      Flagged
                    </p>
                    <p className="mt-2 text-2xl font-black text-amber-700">
                      18
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Require follow-up
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 min-h-27.5 flex flex-col justify-between">
                    <p className="text-[10px] uppercase text-slate-500 font-bold">
                      Projects
                    </p>
                    <p className="mt-2 text-2xl font-black text-slate-900">
                      12
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Active reviews
                    </p>
                  </div>
                </div>
              </div>

              <aside className="space-y-3 self-stretch h-full">
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase text-slate-500 font-semibold">
                        Auditor
                      </p>
                      <h3 className="text-sm font-black text-slate-900 mt-1">
                        {currentUser?.full_name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {currentUser?.role_type.replace(/_/g, " ")}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-100 px-3 py-1 text-slate-700 text-xs font-semibold">
                      COA
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2">
                    <div className="rounded-lg bg-slate-50 p-2 text-sm">
                      <p className="text-[10px] uppercase text-slate-500 font-bold">
                        Barangay
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {currentUser?.barangay}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2 text-sm">
                      <p className="text-[10px] uppercase text-slate-500 font-bold">
                        Access
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        Full review
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </section>

            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("transactions")}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition ${activeTab === "transactions" ? "bg-primary text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                >
                  Transactions
                </button>
                <button
                  onClick={() => setActiveTab("projects")}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition ${activeTab === "projects" ? "bg-primary text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                >
                  Projects
                </button>
              </div>

              <div className="rounded-xl bg-slate-50 px-3 py-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/80"
                >
                  Start audit
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Export
                </button>
              </div>
            </div>

            {activeTab === "transactions" && (
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Audit stream
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Filter latest transactions
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full max-w-lg">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm"
                    >
                      <option value="all">All</option>
                      <option value="verified">Verified</option>
                      <option value="pending">Pending</option>
                      <option value="flagged">Flagged</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase text-slate-500 font-semibold">
                          {tx.category}
                        </p>
                        <h3 className="text-sm font-black text-slate-900 truncate">
                          {tx.vendor}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {new Date(tx.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusColor(tx.status)}`}
                        >
                          {tx.status}
                        </div>
                        <div className="text-sm font-black text-slate-900">
                          ₱{tx.amount.toLocaleString()}
                        </div>
                        <button className="px-2 py-1 bg-primary text-white rounded-md text-xs font-bold hover:bg-primary/90 transition-colors">
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === "projects" && (
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Project oversight
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Review project compliance and budgets
                    </p>
                  </div>
                  <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white">
                    Export
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[10px] uppercase text-slate-500 font-bold">
                            {project.status.replace(/-/g, " ")}
                          </p>
                          <h3 className="mt-2 text-sm font-black text-slate-900">
                            {project.name}
                          </h3>
                        </div>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                          {project.complianceScore}%
                        </span>
                      </div>

                      <div className="mt-3 text-sm text-slate-600 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-lg bg-white border border-slate-200 p-2">
                          <p className="font-semibold text-slate-900">Budget</p>
                          <p className="mt-1">
                            ₱{project.budget.toLocaleString()}
                          </p>
                        </div>
                        <div className="rounded-lg bg-white border border-slate-200 p-2">
                          <p className="font-semibold text-slate-900">Spent</p>
                          <p className="mt-1">
                            ₱{project.spent.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
