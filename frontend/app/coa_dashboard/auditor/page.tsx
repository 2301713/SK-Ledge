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
          .select("id, username, role_type, full_name, barangay")
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
            barangay: profileData.barangay || "COA/DILG",
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
          barangay={currentUser.barangay}
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

          <div className="grid gap-2 text-right">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">
              Current role
            </span>
            <p className="text-sm font-black text-slate-900">
              {currentUser?.role_type.replace(/_/g, " ")}
            </p>
            <p className="text-xs text-slate-500">{currentUser?.barangay}</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <section className="grid gap-4 xl:grid-cols-[1.8fr_0.9fr]">
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-bold">
                      Audit readiness
                    </p>
                    <h2 className="text-2xl font-black text-slate-900 mt-2">
                      Transaction integrity overview
                    </h2>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                    <ShieldCheck className="w-4 h-4" />
                    Verified by blockchain
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500 font-bold">
                      Verified cases
                    </p>
                    <p className="mt-4 text-3xl font-black text-slate-900">
                      2,150
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      Completed review cycles with compliant receipts.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500 font-bold">
                      Flagged issues
                    </p>
                    <p className="mt-4 text-3xl font-black text-amber-700">
                      18
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      Transactions requiring follow-up or clarification.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500 font-bold">
                      Projects audited
                    </p>
                    <p className="mt-4 text-3xl font-black text-slate-900">
                      12
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      Active project reviews currently in progress.
                    </p>
                  </div>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-bold">
                        Auditor profile
                      </p>
                      <h3 className="text-xl font-black text-slate-900 mt-3">
                        {currentUser?.full_name}
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        {currentUser?.role_type.replace(/_/g, " ")}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-100 px-4 py-3 text-slate-700 text-sm font-semibold">
                      COA Access
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500 font-bold">
                        Barangay
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {currentUser?.barangay}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500 font-bold">
                        Access level
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        Full audit review
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-bold">
                    Quick actions
                  </p>
                  <div className="mt-4 space-y-3">
                    <button className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors">
                      Start new audit review
                    </button>
                    <button className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
                      Export audit summary
                    </button>
                  </div>
                </div>
              </aside>
            </section>

            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab("transactions")}
                className={`px-6 py-3 rounded-2xl text-sm font-bold transition-colors ${
                  activeTab === "transactions"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Transaction Audit
              </button>
              <button
                onClick={() => setActiveTab("projects")}
                className={`px-6 py-3 rounded-2xl text-sm font-bold transition-colors ${
                  activeTab === "projects"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Project Oversight
              </button>
            </div>

            {activeTab === "transactions" && (
              <section className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">
                      Audit stream
                    </h2>
                    <p className="text-sm text-slate-500 mt-2">
                      Filter and review the latest transactions with compliance
                      status.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full sm:w-56 rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    >
                      <option value="all">All statuses</option>
                      <option value="verified">Verified</option>
                      <option value="pending">Pending</option>
                      <option value="flagged">Flagged</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">
                            {tx.category}
                          </p>
                          <h3 className="text-lg font-black text-slate-900 mt-2 truncate">
                            {tx.vendor}
                          </h3>
                          <p className="text-sm text-slate-500 mt-2">
                            Transaction date:{" "}
                            {new Date(tx.date).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusColor(
                              tx.status,
                            )}`}
                          >
                            {tx.status.charAt(0).toUpperCase() +
                              tx.status.slice(1)}
                          </span>
                          <div className="rounded-2xl bg-white border border-slate-200 px-3 py-1 text-sm text-slate-700">
                            ₱{tx.amount.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm text-slate-600">
                        <div className="rounded-2xl bg-white border border-slate-200 p-3">
                          <p className="font-semibold text-slate-900">
                            Receipt files
                          </p>
                          <p className="mt-2">{tx.receiptCount}</p>
                        </div>
                        <div className="rounded-2xl bg-white border border-slate-200 p-3">
                          <p className="font-semibold text-slate-900">
                            Project ID
                          </p>
                          <p className="mt-2">{tx.projectId || "Unassigned"}</p>
                        </div>
                        <div className="rounded-2xl bg-white border border-slate-200 p-3">
                          <p className="font-semibold text-slate-900">
                            Blockchain hash
                          </p>
                          <p className="mt-2 font-mono text-xs break-all">
                            {tx.blockchainHash}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === "projects" && (
              <section className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">
                      Project oversight
                    </h2>
                    <p className="text-sm text-slate-500 mt-2">
                      Review current project compliance and budget progress.
                    </p>
                  </div>
                  <button className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors">
                    Export project audit
                  </button>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-bold">
                            {project.status.replace(/-/g, " ")}
                          </p>
                          <h3 className="mt-3 text-lg font-black text-slate-900">
                            {project.name}
                          </h3>
                        </div>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                          {project.complianceScore}% compliant
                        </span>
                      </div>

                      <div className="mt-5 space-y-4 text-sm text-slate-600">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-white border border-slate-200 p-4">
                            <p className="font-semibold text-slate-900">
                              Budget
                            </p>
                            <p className="mt-2">
                              ₱{project.budget.toLocaleString()}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white border border-slate-200 p-4">
                            <p className="font-semibold text-slate-900">
                              Spent
                            </p>
                            <p className="mt-2">
                              ₱{project.spent.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                            <span>Utilization</span>
                            <span>
                              {Math.round(
                                (project.spent / project.budget) * 100,
                              )}
                              %
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-600"
                              style={{
                                width: `${(project.spent / project.budget) * 100}%`,
                              }}
                            />
                          </div>
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
