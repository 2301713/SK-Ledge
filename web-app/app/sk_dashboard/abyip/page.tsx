"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "../../coa_dashboard/types";
import { Filter, Download, DollarSign } from "lucide-react";

export default function ABYIPPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("2024");

  // Mock ABYIP budget ceiling data
  const [budgetCeilings] = useState([
    {
      id: "1",
      category: "Infrastructure",
      allocation: 500000,
      spent: 320000,
      percentage: 64,
      status: "In Progress",
    },
    {
      id: "2",
      category: "Health & Wellness",
      allocation: 250000,
      spent: 185000,
      percentage: 74,
      status: "On Track",
    },
    {
      id: "3",
      category: "Education & Skills",
      allocation: 300000,
      spent: 98000,
      percentage: 33,
      status: "Pending",
    },
    {
      id: "4",
      category: "Environmental Programs",
      allocation: 180000,
      spent: 152000,
      percentage: 84,
      status: "Near Limit",
    },
    {
      id: "5",
      category: "Community Services",
      allocation: 220000,
      spent: 110000,
      percentage: 50,
      status: "On Track",
    },
    {
      id: "6",
      category: "Youth Development",
      allocation: 280000,
      spent: 245000,
      percentage: 88,
      status: "Near Limit",
    },
  ]);

  const totalAllocation = budgetCeilings.reduce(
    (sum, item) => sum + item.allocation,
    0,
  );
  const totalSpent = budgetCeilings.reduce((sum, item) => sum + item.spent, 0);
  const overallPercentage = Math.round((totalSpent / totalAllocation) * 100);
  const availableFunds = totalAllocation - totalSpent;

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
            !["SK_Chairperson", "SK_Treasurer"].includes(profileData.role_type)
          ) {
            console.warn(
              "Unauthorized access: Only SK officials can access this dashboard.",
            );
            router.push("/unauthorized");
            return;
          }

          const profile = {
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type,
            barangay: profileData.barangay || "SK",
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
      case "On Track":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Near Limit":
        return "bg-orange-100 text-orange-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return "bg-green-500";
    if (percentage < 75) return "bg-blue-500";
    if (percentage < 90) return "bg-orange-500";
    return "bg-red-500";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-tertiary font-black text-xl shadow-xl shadow-primary/30 mb-6 animate-bounce">
          SK
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Loading ABYIP Dashboard...
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
            <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-sm">
              <DollarSign size={28} strokeWidth={2.3} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                ABYIP Budget Ceilings
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Annual Budget Year Implementation Plan - Monitor budget
                allocations across departments
              </p>
            </div>
          </div>

          <div className="grid gap-2 text-right">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">
              Fiscal Year
            </span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-900"
            >
              <option value="2022">2022</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* OVERVIEW STATS */}
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  Total Allocation
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  ₱{(totalAllocation / 1000000).toFixed(2)}M
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Across all categories
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  Total Spent
                </p>
                <p className="mt-2 text-2xl font-black text-primary">
                  ₱{(totalSpent / 1000000).toFixed(2)}M
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {overallPercentage}% utilization
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  Available Funds
                </p>
                <p className="mt-2 text-2xl font-black text-green-600">
                  ₱{(availableFunds / 1000000).toFixed(2)}M
                </p>
                <p className="text-xs text-slate-500 mt-2">Remaining budget</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  Budget Health
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(overallPercentage)} transition-all`}
                      style={{ width: `${Math.min(overallPercentage, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {overallPercentage}%
                  </span>
                </div>
              </div>
            </section>

            {/* BUDGET BREAKDOWN TABLE */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Budget Category Breakdown
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Detailed allocation and spending per category
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filter
                  </button>
                  <button className="px-4 py-2 rounded-lg bg-primary text-sm font-bold text-white hover:bg-primary/90 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {budgetCeilings.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-slate-900">
                          {item.category}
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getStatusColor(
                            item.status,
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-600">
                        <span>
                          Allocation:{" "}
                          <span className="font-bold text-slate-900">
                            ₱{item.allocation.toLocaleString()}
                          </span>
                        </span>
                        <span>
                          Spent:{" "}
                          <span className="font-bold text-slate-900">
                            ₱{item.spent.toLocaleString()}
                          </span>
                        </span>
                      </div>

                      <div className="mt-2 w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getProgressColor(item.percentage)} transition-all`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-slate-900">
                        {item.percentage}%
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        ₱{(item.allocation - item.spent).toLocaleString()} left
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* BUDGET ALLOCATION PIE CHART SECTION */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Allocation Distribution
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Budget proportion across categories
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {budgetCeilings.map((item) => {
                  const allocationPercentage =
                    (item.allocation / totalAllocation) * 100;
                  return (
                    <div key={item.id} className="rounded-lg bg-slate-50 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-slate-900">
                          {item.category}
                        </p>
                        <span className="text-sm font-black text-primary">
                          {allocationPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${allocationPercentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
