"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import StatCard from "@/components/dashboard/ui/StatCard";
import LogoLoader from "@/components/LogoLoader";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import DonutGauge from "@/components/dashboard/ui/DonutGauge";
import {
  AVATAR_PALETTE,
  DANGER,
  PENDING,
  SUCCESS,
} from "@/components/dashboard/ui/chartColors";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/useAuthStore";
import { downloadTablePdf } from "@/lib/reportPdf";
import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

interface DashboardStats {
  totalAccounts: number;
  pendingAccounts: number;
  approvedAccounts: number;
  rejectedAccounts: number;
}

interface AccountRow {
  id: string;
  username: string | null;
  full_name: string | null;
  role_type: string | null;
  barangay: string | null;
  email: string | null;
  approval_status?: string | null;
}

const ROLE_ABBREV: Record<string, string> = {
  Admin: "AD",
  COA: "COA",
  SK_Chairperson: "SKC",
  SK_Treasurer: "SKT",
  SK_Federation: "SKF",
  Vendor: "VEN",
};

const roleAbbrev = (role: string) => ROLE_ABBREV[role] ?? role.slice(0, 3);

const APPROVED_PAGE_SIZE = 8;

export default function AdminDashboardPage() {
  const router = useRouter();
  const {
    currentUser,
    isLoading,
    setCurrentUser,
    setIsLoading,
    setUserProfile,
  } = useAuthStore();

  const [stats, setStats] = React.useState<DashboardStats>({
    totalAccounts: 0,
    pendingAccounts: 0,
    approvedAccounts: 0,
    rejectedAccounts: 0,
  });

  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [approvedAccounts, setApprovedAccounts] = useState<AccountRow[]>([]);
  const [search, setSearch] = useState("");
  const [approvedPage, setApprovedPage] = useState(1);
  const authAttemptedRef = useRef(false);

  useEffect(() => {
    const loadUser = async () => {
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

        if (profileError || !profileData) {
          router.push("/login");
          return;
        }

        if (profileData.role_type !== "Admin") {
          router.push("/unauthorized");
          return;
        }

        const profile = {
          id: profileData.id,
          username: profileData.username,
          full_name: profileData.full_name || profileData.username,
          role_type: profileData.role_type,
          barangay: profileData.barangay || "N/A",
          email: profileData.email,
          approval_status: profileData.approval_status,
        };

        setCurrentUser(profile);
        setUserProfile(profile);

        // Fetch account statistics
        const { data: allAccounts, error: accountsError } = await supabase
          .from("profiles")
          .select(
            "id, approval_status, username, full_name, role_type, barangay, email",
          );

        if (!accountsError && allAccounts) {
          const pending = allAccounts.filter(
            (a) => a.approval_status === "pending",
          ).length;
          const approved = allAccounts.filter(
            (a) => a.approval_status === "approved",
          ).length;
          const rejected = allAccounts.filter(
            (a) => a.approval_status === "rejected",
          ).length;

          setStats({
            totalAccounts: allAccounts.length,
            pendingAccounts: pending,
            approvedAccounts: approved,
            rejectedAccounts: rejected,
          });

          setAccounts(allAccounts);

          // Administrators run the platform rather than transact on it, so
          // they are left out of the approved-accounts directory.
          const approvedRows = allAccounts
            .filter(
              (account) =>
                account.approval_status === "approved" &&
                account.role_type !== "Admin",
            )
            .map((account) => ({
              id: account.id,
              username: account.username,
              full_name: account.full_name,
              role_type: account.role_type,
              barangay: account.barangay,
              email: account.email,
            }));
          setApprovedAccounts(approvedRows);
        }
      } catch (error) {
        console.error("Failed to load admin dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authAttemptedRef.current) {
      authAttemptedRef.current = true;
      loadUser();
    }
  }, [router, setCurrentUser, setIsLoading, setUserProfile]);

  const roleDistribution = useMemo(() => {
    const map = new Map<string, number>();
    accounts.forEach((account) => {
      const role = account.role_type || "Unknown";
      // Administrator accounts are operational, so they stay out of the role
      // breakdown that describes the platform's users.
      if (role === "Admin") return;
      map.set(role, (map.get(role) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [accounts]);

  const filteredApproved = useMemo(() => {
    const query = search.toLowerCase();
    if (!query) return approvedAccounts;
    return approvedAccounts.filter((account) =>
      [account.full_name, account.username, account.email, account.role_type]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [approvedAccounts, search]);

  // Reset the page during render instead of in an effect, so changing the
  // search never paints a stale page number first (see React's "adjusting
  // state when props change" pattern).
  const [previousSearch, setPreviousSearch] = useState(search);
  if (previousSearch !== search) {
    setPreviousSearch(search);
    setApprovedPage(1);
  }

  const approvedTotalPages = Math.max(
    1,
    Math.ceil(filteredApproved.length / APPROVED_PAGE_SIZE),
  );
  const approvedCurrentPage = Math.min(approvedPage, approvedTotalPages);
  const approvedStartIndex = (approvedCurrentPage - 1) * APPROVED_PAGE_SIZE;
  const pagedApproved = filteredApproved.slice(
    approvedStartIndex,
    approvedStartIndex + APPROVED_PAGE_SIZE,
  );

  const pct = (numerator: number, denominator: number) =>
    denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;

  const exportDirectory = () => {
    downloadTablePdf({
      fileName: `sk-ledge-approved-accounts-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`,
      title: "SK-Ledge Approved Accounts",
      subtitle: [
        `Generated: ${new Date().toLocaleString("en-PH", {
          timeZone: "Asia/Manila",
          dateStyle: "long",
          timeStyle: "short",
        })}`,
        `Accounts listed: ${approvedAccounts.length}`,
        "Scope: approved accounts, administrators excluded",
      ],
      head: ["Name", "Username", "Role", "Barangay", "Email"],
      rows: approvedAccounts.map((account) => [
        account.full_name || "—",
        account.username || "—",
        (account.role_type || "—").replace("_", " "),
        account.barangay || "—",
        account.email || "—",
      ]),
      notes: [
        "Generated locally from the SK-Ledge account directory. Administrator accounts are excluded because they operate the platform rather than transact on it.",
      ],
    });
  };

  if (isLoading) return <LogoLoader />;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row gap-2 bg-background p-2 sm:gap-4 sm:p-4">
      {currentUser && (
        <SideBar
          userName={currentUser.full_name}
          roleType={currentUser.role_type}
          barangay={currentUser.barangay}
        />
      )}

      <main className="min-w-0 flex-1 space-y-6 py-2 animate-fadein">
        <TopBar
          userName={currentUser?.full_name ?? "Admin"}
          userEmail={currentUser?.email}
          searchValue={search}
          onSearchChange={setSearch}
        />

        <PageHeader
          eyebrow="Admin Dashboard"
          title="System Overview"
          subtitle="Manage user accounts, approvals, and access across the SK-Ledge platform."
          actions={
            <button
              onClick={exportDirectory}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-secondary"
            >
              <Download className="h-4 w-4" />
              Export Data
            </button>
          }
        />

        {/* STAT ROW */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4">
          <StatCard
            label="Total Accounts"
            value={stats.totalAccounts}
            icon={Users}
            variant="brand"
            trend={`${stats.approvedAccounts} approved accounts`}
            trendIcon={TrendingUp}
          />
          <StatCard
            label="Pending"
            value={stats.pendingAccounts}
            icon={Clock}
            trend={`${pct(stats.pendingAccounts, stats.totalAccounts)}% of all accounts`}
            trendIcon={AlertCircle}
          />
          <StatCard
            label="Approved"
            value={stats.approvedAccounts}
            icon={CheckCircle2}
            trend={`${pct(stats.approvedAccounts, stats.totalAccounts)}% of all accounts`}
            trendIcon={TrendingUp}
          />
          <StatCard
            label="Rejected"
            value={stats.rejectedAccounts}
            icon={AlertCircle}
            trend={`${pct(stats.rejectedAccounts, stats.totalAccounts)}% of all accounts`}
            trendIcon={TrendingDown}
          />
        </div>

        {/* BOTTOM ROW */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
          <Card className="lg:col-span-8">
            <CardHeader
              eyebrow="Directory"
              title="Approved Accounts"
              subtitle={
                filteredApproved.length > 0
                  ? `Showing ${approvedStartIndex + 1}–${Math.min(
                      approvedStartIndex + APPROVED_PAGE_SIZE,
                      filteredApproved.length,
                    )} of ${filteredApproved.length} approved account(s).`
                  : "No approved accounts match the current search."
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-3 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-secondary-foreground">
                      Name
                    </th>
                    <th className="px-3 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-secondary-foreground">
                      Username
                    </th>
                    <th className="px-3 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-secondary-foreground">
                      Role
                    </th>
                    <th className="px-3 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-secondary-foreground">
                      Barangay
                    </th>
                    <th className="px-3 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-secondary-foreground">
                      Email
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pagedApproved.map((account, index) => (
                    <tr key={account.id} className="transition hover:bg-secondary/40">
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                            style={{
                              backgroundColor:
                                AVATAR_PALETTE[
                                  (approvedStartIndex + index) %
                                    AVATAR_PALETTE.length
                                ],
                            }}
                          >
                            {(account.full_name || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                          <span className="font-semibold text-primary-foreground">
                            {account.full_name || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-primary-foreground">
                        {account.username || "—"}
                      </td>
                      <td className="px-3 py-3.5 text-primary-foreground">
                        {account.role_type || "—"}
                      </td>
                      <td className="px-3 py-3.5 text-primary-foreground">
                        {account.barangay || "—"}
                      </td>
                      <td className="px-3 py-3.5 text-primary-foreground">
                        {account.email || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredApproved.length === 0 && (
                <p className="py-8 text-center text-sm text-secondary-foreground">
                  No approved accounts match your search.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] font-medium text-secondary-foreground">
                Page {approvedCurrentPage} of {approvedTotalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setApprovedPage(Math.max(1, approvedCurrentPage - 1))
                  }
                  disabled={approvedCurrentPage <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setApprovedPage(
                      Math.min(approvedTotalPages, approvedCurrentPage + 1),
                    )
                  }
                  disabled={approvedCurrentPage >= approvedTotalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-4 lg:col-span-4 lg:gap-6">
            <Card>
              <CardHeader eyebrow="Status" title="Approval Progress" />
              <DonutGauge
                segments={[
                  {
                    label: "Approved",
                    value: stats.approvedAccounts,
                    color: SUCCESS,
                  },
                  {
                    label: "Pending",
                    value: stats.pendingAccounts,
                    color: PENDING,
                  },
                  {
                    label: "Rejected",
                    value: stats.rejectedAccounts,
                    color: DANGER,
                  },
                ]}
                centerValue={`${pct(stats.approvedAccounts, stats.totalAccounts)}%`}
                centerLabel="approved"
              />
            </Card>

            <Card>
              <CardHeader eyebrow="Breakdown" title="By Role" />
              <div className="space-y-3">
                {roleDistribution.map((role, index) => (
                  <div
                    key={role.label}
                    className="flex items-center gap-3"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold text-white"
                      style={{
                        backgroundColor:
                          AVATAR_PALETTE[index % AVATAR_PALETTE.length],
                      }}
                    >
                      {roleAbbrev(role.label)}
                    </span>
                    <span className="flex-1 truncate text-sm font-medium text-primary-foreground">
                      {role.label.replace("_", " ")}
                    </span>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground">
                      {role.value}
                    </span>
                  </div>
                ))}
                {roleDistribution.length === 0 && (
                  <p className="py-4 text-center text-sm text-secondary-foreground">
                    No accounts yet.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
