"use client";

import LogoLoader from "@/components/LogoLoader";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import StatCard from "@/components/dashboard/ui/StatCard";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "@/lib/useAuthStore";
import {
  Download,
  Landmark,
  PiggyBank,
  Receipt,
  Gauge,
  Coins,
  ArrowRight,
} from "lucide-react";
import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, SK_LEDGE_ABI } from "@/lib/contractConfig";
import { canonicalizeBarangay } from "@/lib/batangasBarangays";
import { useRecordsSync } from "@/lib/useRecordsSync";
import { downloadTablePdf } from "@/lib/reportPdf";
import Select from "@/components/ui/Select";

interface AbiypProject {
  id: string;
  name: string;
  category: string;
  budget: number;
  status: string;
  year: number | null;
}

interface CategoryBudget {
  id: string;
  category: string;
  allocation: number;
  spent: number;
  percentage: number;
  status: string;
}

const CURRENT_YEAR = new Date().getFullYear();

const statusForUtilization = (percentage: number) => {
  if (percentage >= 90) return "Near Limit";
  if (percentage >= 50) return "In Progress";
  if (percentage > 0) return "On Track";
  return "Pending";
};

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
  const [selectedYear, setSelectedYear] = useState<string>(String(CURRENT_YEAR));
  const [projects, setProjects] = useState<AbiypProject[]>([]);

  const { records: expenseRecords } = useRecordsSync({
    type: "expense",
    enabled: Boolean(currentUser),
    limit: 500,
  });

  // On-chain reads using Wagmi
  const barangay = currentUser?.barangay
    ? canonicalizeBarangay(currentUser.barangay)
    : null;

  const { data: ceilingRaw } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SK_LEDGE_ABI,
    functionName: "allocationCeilings",
    args: barangay ? [barangay] : undefined,
    query: { enabled: !!barangay },
  });

  const { data: allocatedRaw } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SK_LEDGE_ABI,
    functionName: "getAllocated",
    args: barangay ? [barangay] : undefined,
    query: { enabled: !!barangay },
  });

  // Convert raw centavo BigInts to pesos
  const onChainCeiling = ceilingRaw ? Number(ceilingRaw) / 100 : 0;
  const onChainAllocated = allocatedRaw ? Number(allocatedRaw) / 100 : 0;
  const onChainRemaining = onChainCeiling - onChainAllocated;
  const onChainUtilization =
    onChainCeiling > 0
      ? Math.round((onChainAllocated / onChainCeiling) * 100)
      : 0;

  const budgetCeilings = useMemo<CategoryBudget[]>(() => {
    const year = Number(selectedYear);
    const categories = new Map<string, { allocation: number; spent: number }>();
    const ensureCategory = (category: string) => {
      let entry = categories.get(category);
      if (!entry) {
        entry = { allocation: 0, spent: 0 };
        categories.set(category, entry);
      }
      return entry;
    };

    const projectsThisYear = projects.filter(
      (project) => project.year === year,
    );

    for (const project of projectsThisYear) {
      ensureCategory(project.category).allocation += project.budget;
    }

    const categoryByProject = new Map<string, string>();
    for (const project of projects) {
      categoryByProject.set(project.id, project.category);
    }

    for (const record of expenseRecords) {
      if (!record.created_at) continue;
      if (new Date(record.created_at).getFullYear() !== year) continue;

      const projectId =
        typeof record.project_id === "string" ? record.project_id : null;
      // Expenses store their own category; fall back to the linked project's
      // category, then to an explicit bucket for unsorted spending.
      const storedCategory =
        typeof record.category === "string" && record.category.trim().length > 0
          ? record.category.trim()
          : null;
      const category =
        storedCategory ??
        (projectId ? categoryByProject.get(projectId) : undefined) ??
        "Uncategorized";
      const amount = Number(record.amount);
      ensureCategory(category).spent +=
        (Number.isFinite(amount) ? amount : 0) / 100;
    }

    return Array.from(categories.entries())
      .map(([category, entry]) => {
        const percentage =
          entry.allocation > 0
            ? Math.round((entry.spent / entry.allocation) * 100)
            : entry.spent > 0
              ? 100
              : 0;

        return {
          id: category,
          category,
          allocation: entry.allocation,
          spent: entry.spent,
          percentage,
          status: statusForUtilization(percentage),
        };
      })
      .sort(
        (a, b) => b.allocation - a.allocation || b.spent - a.spent,
      );
  }, [projects, expenseRecords, selectedYear]);

  const projectSpending = useMemo(() => {
    const year = Number(selectedYear);
    const spentByProject = new Map<string, number>();

    for (const record of expenseRecords) {
      if (!record.created_at) continue;
      if (new Date(record.created_at).getFullYear() !== year) continue;

      const projectId =
        typeof record.project_id === "string" ||
        typeof record.project_id === "number"
          ? String(record.project_id)
          : null;
      if (!projectId) continue;

      const amount = Number(record.amount);
      spentByProject.set(
        projectId,
        (spentByProject.get(projectId) ?? 0) +
          (Number.isFinite(amount) ? amount : 0) / 100,
      );
    }

    return projects
      .filter((project) => project.year === year)
      .map((project) => ({
        ...project,
        spent: spentByProject.get(project.id) ?? 0,
      }))
      .sort(
        (a, b) => b.budget - a.budget || a.name.localeCompare(b.name),
      );
  }, [projects, expenseRecords, selectedYear]);

  const exportCategoryBreakdown = () => {
    downloadTablePdf({
      fileName: `abyip-category-breakdown-${selectedYear}.pdf`,
      title: `ABYIP Category Breakdown ${selectedYear}`,
      subtitle: [
        `Generated: ${new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" })}`,
        `${budgetCeilings.length} categories`,
      ],
      head: [
        "Category",
        "Allocation (PHP)",
        "Spent (PHP)",
        "Utilization (%)",
        "Status",
      ],
      rows: budgetCeilings.map((item) => [
        item.category,
        item.allocation.toFixed(2),
        item.spent.toFixed(2),
        item.percentage,
        item.status,
      ]),
      rightAligned: [1, 2, 3],
    });
  };

  const totalAllocation = budgetCeilings.reduce(
    (sum, item) => sum + item.allocation,
    0,
  );

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

          if (profileData.approval_status !== "approved") {
            router.push("/unauthorized");
            return;
          }

          const canonicalBarangay = canonicalizeBarangay(
            profileData.barangay ?? "",
          );
          if (!canonicalBarangay) {
            router.push("/unauthorized");
            return;
          }

          const profile = {
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type,
            barangay: canonicalBarangay,
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

  useEffect(() => {
    if (!currentUser) return;

    let active = true;
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(
          "id, name, category, budget, status, fiscal_year, created_at, dateProposed",
        )
        .eq("barangay", currentUser.barangay);

      if (!active) return;

      if (error) {
        console.error("Error fetching ABYIP projects:", error.message);
        return;
      }

      setProjects(
        (data ?? []).map((project) => {
          const proposedAt = project.dateProposed || project.created_at;
          const fallbackYear = proposedAt
            ? new Date(proposedAt).getFullYear()
            : null;
          const fiscalYear =
            typeof project.fiscal_year === "number"
              ? project.fiscal_year
              : fallbackYear;

          return {
            id: String(project.id),
            name: project.name || "Unnamed project",
            category: project.category || "Uncategorized",
            budget: Number(project.budget) || 0,
            status: (project.status as string) || "Proposed",
            year: Number.isFinite(fiscalYear) ? fiscalYear : null,
          };
        }),
      );
    };

    fetchProjects();
    return () => {
      active = false;
    };
  }, [currentUser]);

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return "bg-success";
    if (percentage < 75) return "bg-ongoing";
    if (percentage < 90) return "bg-pending";
    return "bg-danger";
  };

  const formatM = (amount: number) => `₱${(amount / 1000000).toFixed(2)}M`;

  const formatPeso = (amount: number) =>
    `₱${amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

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
              <Select
                plain
                wrapperClassName="w-auto"
                aria-label="Fiscal year"
                value={selectedYear}
                onChange={(year) => setSelectedYear(year)}
              >
                {Array.from(
                  { length: 5 },
                  (_, index) => CURRENT_YEAR - index,
                ).map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </Select>
            </label>
          }
        />

        {/* OVERVIEW STATS (REPLACED WITH ON-CHAIN DATA) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Allocation"
            value={formatM(onChainCeiling)}
            icon={Landmark}
            variant="brand"
            trend="Across all categories"
          />
          <StatCard
            label="Total Spent"
            value={formatM(onChainAllocated)}
            icon={Receipt}
            trend={`${onChainUtilization}% utilization`}
          />
          <StatCard
            label="Available Funds"
            value={formatM(onChainRemaining)}
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
                {onChainUtilization}%
              </span>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full ${getProgressColor(onChainUtilization)} transition-all`}
                    style={{ width: `${Math.min(onChainUtilization, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="text-xs font-medium text-secondary-foreground">
              Overall fund utilization
            </p>
          </div>
        </div>

        {/* BUDGET ALLOCATION */}
        <Card>
          <CardHeader
            eyebrow="Blockchain"
            title="Budget Allocation"
            subtitle="Allocations are signed on the dedicated Fund Allocations screen"
          />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="flex flex-col justify-between gap-5 rounded-3xl border border-border bg-secondary/40 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-primary-foreground">
                    Allocations have their own screen
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-secondary-foreground">
                    {currentUser?.role_type === "SK_Treasurer"
                      ? `Sign new ABYIP allocations for ${barangay ?? "your barangay"} and review the allocations recorded on the Sepolia ledger on the Fund Allocations page.`
                      : `ABYIP allocations for ${barangay ?? "your barangay"} are recorded by your SK Treasurer and shown here as a planning reference.`}
                  </p>
                </div>
              </div>

              {currentUser?.role_type === "SK_Treasurer" && (
                <Link
                  href="/sk_dashboard/allocations"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-[0_6px_16px_-6px_rgba(1,56,168,0.5)] transition hover:bg-primary/90 active:scale-[0.98]"
                >
                  Open Fund Allocations
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
            <aside className="flex flex-col gap-5 rounded-3xl border border-border bg-secondary/40 p-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-foreground">
                  Live Budget
                </p>
                <p className="mt-1 text-lg font-bold tracking-tight text-primary-foreground">
                  {currentUser?.barangay ?? "No Barangay"}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                  <span className="text-xs font-semibold text-secondary-foreground">
                    Ceiling
                  </span>
                  <span className="text-sm font-bold text-primary-foreground">
                    {formatPeso(onChainCeiling)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                  <span className="text-xs font-semibold text-secondary-foreground">
                    Allocated
                  </span>
                  <span className="text-sm font-bold text-primary">
                    {formatPeso(onChainAllocated)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                  <span className="text-xs font-semibold text-secondary-foreground">
                    Remaining
                  </span>
                  <span className="text-sm font-bold text-primary-foreground">
                    {formatPeso(onChainRemaining)}
                  </span>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-secondary-foreground">
                    Utilization
                  </span>
                  <span className="text-xs font-bold text-primary-foreground">
                    {onChainUtilization}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full rounded-full ${getProgressColor(onChainUtilization)} transition-all duration-700`}
                    style={{ width: `${Math.min(onChainUtilization, 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] font-medium text-secondary-foreground">
                  Budget usage across categories
                </p>
              </div>
            </aside>
          </div>
        </Card>

        {/* ABYIP PROJECTS */}
        <Card>
          <CardHeader
            eyebrow="ABYIP"
            title={`Projects — ${selectedYear}`}
            subtitle="Each project's proposed amount, current approval status, and linked expenses"
          />

          {projectSpending.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-secondary/40 p-6 text-center text-xs font-medium text-secondary-foreground">
              No projects recorded for {selectedYear} yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                    <th className="py-2 pr-4">Project</th>
                    <th className="py-2 pr-4">Category</th>
                    <th className="py-2 pr-4 text-right">Approved</th>
                    <th className="py-2 pr-4 text-right">Spent</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projectSpending.map((project) => (
                    <tr key={project.id} className="border-b border-border/60 last:border-0">
                      <td className="py-3 pr-4 font-semibold text-primary-foreground">
                        {project.name}
                      </td>
                      <td className="py-3 pr-4 text-secondary-foreground">
                        {project.category}
                      </td>
                      <td className="py-3 pr-4 text-right font-bold text-primary-foreground">
                        {formatPeso(project.budget)}
                      </td>
                      <td className="py-3 pr-4 text-right text-secondary-foreground">
                        {formatPeso(project.spent)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            ["Approved", "Open for Bidding", "Awarded", "Completed"].includes(
                              project.status,
                            )
                              ? "bg-success/10 text-success"
                              : project.status === "Rejected"
                                ? "bg-danger/10 text-danger"
                                : "bg-pending/10 text-pending"
                          }`}
                        >
                          {project.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* BUDGET BREAKDOWN */}
        <Card>
          <CardHeader
            eyebrow="Allocations"
            title="Budget Category Breakdown"
            subtitle="Detailed allocation and spending per category"
            action={
              <button
                type="button"
                onClick={exportCategoryBreakdown}
                disabled={budgetCeilings.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-[0_6px_16px_-6px_rgba(1,56,168,0.5)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            }
          />

          <div className="space-y-3">
            {budgetCeilings.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border bg-secondary/40 p-6 text-center text-xs font-medium text-secondary-foreground">
                No projects or expenses recorded for {selectedYear} yet.
              </p>
            )}
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
                        {formatPeso(item.allocation)}
                      </span>
                    </span>
                    <span>
                      Spent:{" "}
                      <span className="font-bold text-primary-foreground">
                        {formatPeso(item.spent)}
                      </span>
                    </span>
                  </div>

                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full ${getProgressColor(item.percentage)} transition-all`}
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-primary-foreground">
                    {item.percentage}%
                  </p>
                  <p className="mt-1 text-[10px] text-secondary-foreground">
                    {formatPeso(Math.max(item.allocation - item.spent, 0))} left
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
                totalAllocation > 0
                  ? (item.allocation / totalAllocation) * 100
                  : 0;
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