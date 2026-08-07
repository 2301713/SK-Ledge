"use client";

import LogoLoader from "@/components/LogoLoader";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import StatCard from "@/components/dashboard/ui/StatCard";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "@/lib/useAuthStore";
import { Filter, Download, Landmark, PiggyBank, Receipt, Gauge } from "lucide-react";

const STATUS_PILL: Record<string, string> = {
  "On Track": "bg-success/10 text-success",
  "In Progress": "bg-ongoing/10 text-ongoing",
  "Near Limit": "bg-pending/10 text-pending",
  Pending: "bg-secondary text-secondary-foreground",
};

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

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return "bg-success";
    if (percentage < 75) return "bg-ongoing";
    if (percentage < 90) return "bg-pending";
    return "bg-danger";
  };

  const formatM = (amount: number) => `₱${(amount / 1000000).toFixed(2)}M`;

  if (isLoading) return <LogoLoader />;

  return (
    <div className="flex min-h-screen gap-4 bg-background p-4 selection:bg-tertiary selection:text-primary">
      {currentUser && (
        <SideBar
          userName={currentUser.full_name}
          roleType={currentUser.role_type}
          barangay={currentUser.barangay}
        />
      )}

      <main className="min-w-0 flex-1 space-y-6 py-2 animate-fadein">
        <TopBar
          userName={currentUser?.full_name ?? "SK Official"}
          userEmail={currentUser?.email}
          hideSearch
        />

        <PageHeader
          eyebrow="ABYIP"
          title="Budget Ceilings"
          subtitle="Annual Barangay Youth Investment Plan — monitor budget allocations across categories."
          actions={
            <label className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-secondary-foreground shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                Fiscal Year
              </span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="cursor-pointer bg-transparent text-sm font-bold text-primary-foreground outline-none"
              >
                <option value="2022">2022</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
              </select>
            </label>
          }
        />

        {/* OVERVIEW STATS */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Allocation"
            value={formatM(totalAllocation)}
            icon={Landmark}
            variant="brand"
            trend="Across all categories"
          />
          <StatCard
            label="Total Spent"
            value={formatM(totalSpent)}
            icon={Receipt}
            trend={`${overallPercentage}% utilization`}
          />
          <StatCard
            label="Available Funds"
            value={formatM(availableFunds)}
            icon={PiggyBank}
            trend="Remaining budget"
          />
          <div className="flex flex-col gap-4 rounded-3xl border border-border bg-white p-6 text-primary-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-secondary-foreground">
                Budget Health
              </p>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary-foreground">
                <Gauge className="h-5 w-5" />
              </div>
            </div>
            <div>
              <span className="text-4xl font-bold tracking-tight">
                {overallPercentage}%
              </span>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full ${getProgressColor(overallPercentage)} transition-all`}
                    style={{ width: `${Math.min(overallPercentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="text-xs font-medium text-secondary-foreground">
              Overall fund utilization
            </p>
          </div>
        </div>

        {/* BUDGET BREAKDOWN */}
        <Card>
          <CardHeader
            eyebrow="Allocations"
            title="Budget Category Breakdown"
            subtitle="Detailed allocation and spending per category"
            action={
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-secondary">
                  <Filter className="h-4 w-4" />
                  Filter
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-[0_6px_16px_-6px_rgba(1,56,168,0.5)] transition hover:bg-primary/90">
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            }
          />

          <div className="space-y-3">
            {budgetCeilings.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-border bg-secondary/40 p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-primary-foreground">
                      {item.category}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        STATUS_PILL[item.status] ?? "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-4 text-xs text-secondary-foreground">
                    <span>
                      Allocation:{" "}
                      <span className="font-bold text-primary-foreground">
                        ₱{item.allocation.toLocaleString()}
                      </span>
                    </span>
                    <span>
                      Spent:{" "}
                      <span className="font-bold text-primary-foreground">
                        ₱{item.spent.toLocaleString()}
                      </span>
                    </span>
                  </div>

                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full ${getProgressColor(item.percentage)} transition-all`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-primary-foreground">
                    {item.percentage}%
                  </p>
                  <p className="mt-1 text-[10px] text-secondary-foreground">
                    ₱{(item.allocation - item.spent).toLocaleString()} left
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ALLOCATION DISTRIBUTION */}
        <Card>
          <CardHeader
            eyebrow="Proportion"
            title="Allocation Distribution"
            subtitle="Budget proportion across categories"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {budgetCeilings.map((item) => {
              const allocationPercentage =
                (item.allocation / totalAllocation) * 100;
              return (
                <div key={item.id} className="rounded-2xl bg-secondary/40 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-bold text-primary-foreground">
                      {item.category}
                    </p>
                    <span className="text-sm font-bold text-primary">
                      {allocationPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${allocationPercentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </main>
    </div>
  );
}
