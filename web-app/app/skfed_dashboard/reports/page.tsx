"use client";

import LogoLoader from "@/components/LogoLoader";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import StatCard from "@/components/dashboard/ui/StatCard";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "@/lib/useAuthStore";
import { useRecordsSync } from "@/lib/useRecordsSync";
import { canonicalizeBarangay } from "@/lib/batangasBarangays";

import { BRAND, SUCCESS, PENDING, DANGER } from "@/components/dashboard/ui/chartColors";
import { FileDown, FilePieChart, Users2, TrendingUp } from "lucide-react";

interface ReportProject {
  id: string;
  name: string;
  category: string;
  budget: number;
  status: string;
  barangay: string;
}

interface ReportOfficial {
  id: string;
  full_name: string;
  role_type: string;
  barangay: string;
}

interface CategorySegment {
  label: string;
  amount: number;
  value: number;
  color: string;
}

interface ComplianceRow {
  barangay: string;
  projects: number;
  awarded: number;
  allocated: number;
  spent: number;
  utilization: number;
}

const CATEGORY_COLORS = [BRAND, SUCCESS, PENDING, DANGER, "#94A3B8"];

const formatCompactPeso = (amount: number) =>
  amount >= 1_000_000
    ? `₱${(amount / 1_000_000).toFixed(1)}M`
    : `₱${Math.round(amount).toLocaleString("en-PH")}`;

function FundBreakdownChart({
  segments,
  total,
}: {
  segments: CategorySegment[];
  total: number;
}) {
  const radius = 46;
  const activeSegments = segments.filter((segment) => segment.amount > 0);

  const pointOnCircle = (angleDeg: number) => {
    const radians = ((angleDeg - 90) * Math.PI) / 180;
    return [50 + radius * Math.cos(radians), 50 + radius * Math.sin(radians)];
  };

  // Each slice starts where the slices before it end, so compute the running
  // angle up front instead of mutating a counter inside `map`.
  const slices = activeSegments.map((segment, index) => {
    const startAngle =
      total > 0
        ? (activeSegments
            .slice(0, index)
            .reduce((sum, previous) => sum + previous.amount, 0) /
            total) *
          360
        : 0;
    const share = total > 0 ? segment.amount / total : 0;
    const endAngle = startAngle + share * 360;
    const [x1, y1] = pointOnCircle(startAngle);
    const [x2, y2] = pointOnCircle(endAngle);
    const path =
      share >= 0.9999
        ? null
        : `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 ${
            endAngle - startAngle > 180 ? 1 : 0
          } 1 ${x2} ${y2} Z`;

    return { ...segment, share, path };
  });

  return (
    <div className="mx-auto h-44 w-44 shrink-0 sm:h-52 sm:w-52">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <circle cx="50" cy="50" r={radius} fill="#E2E8F0" />
        {slices.map((slice) =>
          slice.path ? (
            <path
              key={slice.label}
              d={slice.path}
              fill={slice.color}
              stroke="#FFFFFF"
              strokeWidth={0.8}
              strokeLinejoin="round"
            >
              <title>{`${slice.label}: ${formatCompactPeso(
                slice.amount,
              )} (${Math.round(slice.share * 100)}%)`}</title>
            </path>
          ) : (
            <circle
              key={slice.label}
              cx="50"
              cy="50"
              r={radius}
              fill={slice.color}
            >
              <title>{`${slice.label}: ${formatCompactPeso(
                slice.amount,
              )} (${Math.round(slice.share * 100)}%)`}</title>
            </circle>
          ),
        )}
      </svg>
    </div>
  );
}

export default function SKFederationDashboard() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<ReportProject[]>([]);
  const [officials, setOfficials] = useState<ReportOfficial[]>([]);
  const router = useRouter();

  const { records } = useRecordsSync({
    enabled: Boolean(currentUser),
    limit: 500,
  });

  // 1. AUTHENTICATION & ROLE PROTECTION
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push("/login");
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            "id, username, full_name, role_type, barangay, email, approval_status",
          )
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError.message);
        }

        if (profileData) {
          if (profileData.role_type !== "SK_Federation") {
            console.warn("Unauthorized: User is not an SK Federation Official");
            router.push("/unauthorized");
            return;
          }

          setCurrentUser({
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type,
            barangay: profileData.barangay || "Province Wide",
            email: profileData.email,
            approval_status: profileData.approval_status,
          });
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
    const fetchReportData = async () => {
      const [projectsResult, officialsResult] = await Promise.all([
        supabase
          .from("projects")
          .select("id, name, category, budget, status, barangay"),
        supabase
          .from("profiles")
          .select("id, full_name, role_type, barangay")
          .in("role_type", ["SK_Chairperson", "SK_Treasurer"]),
      ]);

      if (!active) return;

      if (projectsResult.error) {
        console.error(
          "Error fetching report projects:",
          projectsResult.error.message,
        );
      } else {
        setProjects(
          (projectsResult.data ?? []).map((project) => ({
            id: String(project.id),
            name: project.name || "Unnamed project",
            category: project.category || "Uncategorized",
            budget: Number(project.budget) || 0,
            status: (project.status as string) || "Proposed",
            barangay:
              canonicalizeBarangay(project.barangay ?? "") ??
              project.barangay ??
              "Unassigned",
          })),
        );
      }

      if (officialsResult.error) {
        console.error(
          "Error fetching SK officials:",
          officialsResult.error.message,
        );
      } else {
        setOfficials(
          (officialsResult.data ?? []).map((official) => ({
            id: String(official.id),
            full_name:
              official.full_name || official.role_type || "SK Official",
            role_type: official.role_type || "",
            barangay:
              canonicalizeBarangay(official.barangay ?? "") ??
              official.barangay ??
              "Unassigned",
          })),
        );
      }
    };

    fetchReportData();
    return () => {
      active = false;
    };
  }, [currentUser]);

  const reportSummary = useMemo(() => {
    const approvedProjects = projects.filter((project) =>
      ["Approved", "Open for Bidding", "Awarded", "Completed"].includes(
        project.status,
      ),
    ).length;
    const totalFund = projects.reduce(
      (sum, project) => sum + project.budget,
      0,
    );

    const categoryTotals = new Map<string, number>();
    for (const project of projects) {
      categoryTotals.set(
        project.category,
        (categoryTotals.get(project.category) ?? 0) + project.budget,
      );
    }

    const ranked = Array.from(categoryTotals.entries())
      .filter(([, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1]);

    const top = ranked.slice(0, 4);
    const otherTotal = ranked.slice(4).reduce((sum, [, amount]) => sum + amount, 0);

    const segments: CategorySegment[] = top.map(([label, amount], index) => ({
      label,
      amount,
      value: amount,
      color: CATEGORY_COLORS[index] ?? CATEGORY_COLORS[CATEGORY_COLORS.length - 1],
    }));

    if (otherTotal > 0) {
      segments.push({
        label: "Other Programs",
        amount: otherTotal,
        value: otherTotal,
        color: CATEGORY_COLORS[4],
      });
    }

    return {
      approvedProjects,
      totalFund,
      segments,
      officialsCount: officials.length,
    };
  }, [projects, officials]);

  const complianceMatrix = useMemo<ComplianceRow[]>(() => {
    const rows = new Map<string, ComplianceRow>();
    const ensureRow = (barangay: string) => {
      let row = rows.get(barangay);
      if (!row) {
        row = {
          barangay,
          projects: 0,
          awarded: 0,
          allocated: 0,
          spent: 0,
          utilization: 0,
        };
        rows.set(barangay, row);
      }
      return row;
    };

    for (const project of projects) {
      const row = ensureRow(project.barangay);
      row.projects += 1;
      if (project.status === "Awarded" || project.status === "Completed") {
        row.awarded += 1;
      }
    }

    for (const record of records) {
      const barangay =
        canonicalizeBarangay(record.barangay ?? "") ??
        record.barangay ??
        "Unassigned";
      const row = ensureRow(barangay);
      const amount = Number(record.amount);
      const pesos = (Number.isFinite(amount) ? amount : 0) / 100;

      if (record.record_type === "allocation") {
        row.allocated += pesos;
      } else if (record.record_type === "expense") {
        row.spent += pesos;
      }
    }

    return Array.from(rows.values())
      .map((row) => ({
        ...row,
        utilization:
          row.allocated > 0
            ? Math.round((row.spent / row.allocated) * 100)
            : 0,
      }))
      .sort((a, b) => b.allocated - a.allocated || b.projects - a.projects);
  }, [projects, records]);

  // jsPDF is large, so it is only fetched when the report is downloaded.
  const exportCityWideReport = async () => {
    const { downloadTablePdf } = await import("@/lib/reportPdf");

    downloadTablePdf({
      fileName: `skfed-city-wide-report_${new Date().toISOString().slice(0, 10)}.pdf`,
      title: "SK-Ledge City-Wide Federation Report",
      subtitle: [
        `Scope: ${complianceMatrix.length} barangay${complianceMatrix.length === 1 ? "" : "s"}`,
        `Generated by: ${currentUser?.full_name ?? "SK Federation"}`,
        `Generated at: ${new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" })}`,
      ],
      head: [
        "Barangay",
        "Projects",
        "Awarded",
        "Allocated (PHP)",
        "Spent (PHP)",
        "Utilization (%)",
      ],
      rows: complianceMatrix.map((row) => [
        row.barangay,
        row.projects,
        row.awarded,
        row.allocated.toFixed(2),
        row.spent.toFixed(2),
        row.utilization,
      ]),
      rightAligned: [1, 2, 3, 4, 5],
    });
  };

  // LOADING STATE
  if (isLoading) return <LogoLoader />;

  // UNAUTHORIZED / NULL STATE
  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row gap-4 bg-background p-4 selection:bg-tertiary selection:text-primary">
      <SideBar
        userName={currentUser.full_name}
        roleType={currentUser.role_type}
        barangay={currentUser.barangay}
      />

      <main className="min-w-0 flex-1 space-y-6 py-2 animate-fadein">
        <TopBar
          userName={currentUser.full_name}
          userEmail={currentUser.email}
          hideSearch
        />

        <PageHeader
          eyebrow="SK Federation"
          title="Oversight Reports"
          subtitle="City-wide analytics engine & performance matrix."
          actions={
            <button
              type="button"
              onClick={() => void exportCityWideReport()}
              disabled={complianceMatrix.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_6px_16px_-6px_rgba(1,56,168,0.5)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileDown className="h-4 w-4" />
              Download City-Wide Report (PDF)
            </button>
          }
        />

        {/* STAT ROW */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            label="Approved Projects"
            value={reportSummary.approvedProjects}
            icon={TrendingUp}
            variant="brand"
            trend="Across the federation"
          />
          <StatCard
            label="SK Officials Onboarded"
            value={reportSummary.officialsCount}
            icon={Users2}
            trend="Chairpersons and treasurers"
          />
          <StatCard
            label="Total Fund"
            value={formatCompactPeso(reportSummary.totalFund)}
            icon={FilePieChart}
            trend="Across all registered projects"
          />
        </div>

        {/* BUDGET ALLOCATION BREAKDOWN */}
        <Card>
          <CardHeader
            eyebrow="Budget Allocation"
            title="City-Wide Financial Breakdown"
            subtitle="Fund distribution across priority programs"
            action={
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                FY 2026
              </span>
            }
          />

          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[auto_1fr]">
            <FundBreakdownChart
              segments={reportSummary.segments}
              total={reportSummary.totalFund}
            />

            <div className="space-y-3">
              {reportSummary.segments.length === 0 && (
                <p className="rounded-2xl border border-dashed border-border bg-secondary/40 p-6 text-center text-xs font-medium text-secondary-foreground">
                  No project budgets have been registered yet.
                </p>
              )}
              {reportSummary.segments.map((item) => {
                const share =
                  reportSummary.totalFund > 0
                    ? (item.amount / reportSummary.totalFund) * 100
                    : 0;
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl border border-border bg-secondary/40 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium text-primary-foreground">
                        {item.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-primary-foreground">
                        {share.toFixed(0)}%
                      </span>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                        {formatCompactPeso(item.amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
