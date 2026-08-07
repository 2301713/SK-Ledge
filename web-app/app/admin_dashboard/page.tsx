"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import StatCard from "@/components/dashboard/ui/StatCard";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import AccountsBarChart from "@/components/dashboard/ui/AccountsBarChart";
import DonutGauge from "@/components/dashboard/ui/DonutGauge";
import {
  AVATAR_PALETTE,
  DANGER,
  PENDING,
  SUCCESS,
} from "@/components/dashboard/ui/chartColors";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/useAuthStore";
import React from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Plus,
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

interface LatestUser {
  id: string;
  full_name: string;
  role_type: string;
  barangay: string;
}

const ROLE_ABBREV: Record<string, string> = {
  Admin: "AD",
  COA: "COA",
  BMO: "BMO",
  SK_Chairperson: "SKC",
  SK_Treasurer: "SKT",
  SK_Federation: "SKF",
};

const roleAbbrev = (role: string) => ROLE_ABBREV[role] ?? role.slice(0, 3);

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
  const [latestUsers, setLatestUsers] = useState<LatestUser[]>([]);
  const [search, setSearch] = useState("");
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

          const approvedRows = allAccounts
            .filter((account) => account.approval_status === "approved")
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

        // Best-effort: most recently created users (falls back to name order)
        const { data: recent, error: recentError } = await supabase
          .from("profiles")
          .select("id, full_name, role_type, barangay, created_at")
          .order("created_at", { ascending: false })
          .limit(6);

        if (!recentError && recent && recent.length > 0) {
          setLatestUsers(
            recent.map((r) => ({
              id: r.id,
              full_name: r.full_name || "Unnamed",
              role_type: r.role_type || "Unknown",
              barangay: r.barangay || "N/A",
            })),
          );
        } else {
          const fallback = (allAccounts as AccountRow[])
            .slice()
            .sort((a, b) =>
              (a.full_name || "").localeCompare(b.full_name || ""),
            )
            .slice(0, 6)
            .map((a) => ({
              id: a.id,
              full_name: a.full_name || "Unnamed",
              role_type: a.role_type || "Unknown",
              barangay: a.barangay || "N/A",
            }));
          setLatestUsers(fallback);
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

  const pct = (numerator: number, denominator: number) =>
    denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;

  const exportCsv = () => {
    const header = ["Name", "Username", "Role", "Barangay", "Email"];
    const rows = approvedAccounts.map((account) => [
      account.full_name ?? "",
      account.username ?? "",
      account.role_type ?? "",
      account.barangay ?? "",
      account.email ?? "",
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "approved-accounts.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-tertiary shadow-xl">
            <span className="text-xl font-black">SK</span>
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary-foreground">
            Loading admin console...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen gap-4 bg-background p-4">
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
            <>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_6px_16px_-6px_rgba(1,56,168,0.5)] transition hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Invite User
              </Link>
              <button
                onClick={exportCsv}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-secondary"
              >
                <Download className="h-4 w-4" />
                Export Data
              </button>
            </>
          }
        />

        {/* STAT ROW */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
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

        {/* ANALYTICS ROW */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-5">
            <CardHeader
              eyebrow="Insights"
              title="Account Analytics"
              subtitle="Registered users by role"
            />
            <AccountsBarChart data={roleDistribution} highlightIndex={0} />
          </Card>

          {/* Pending Reviews — brand anchor card */}
          <div className="flex flex-col justify-between rounded-3xl bg-gradient-to-br from-primary to-[#012a86] p-6 text-white shadow-[0_8px_28px_-10px_rgba(1,56,168,0.5)] lg:col-span-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                Pending Reviews
              </p>
              <p className="mt-3 text-5xl font-bold tracking-tight">
                {stats.pendingAccounts}
              </p>
              <p className="mt-2 text-sm text-white/70">
                Accounts waiting for your approval.
              </p>
            </div>
            <Link
              href="/admin_dashboard/approval"
              className="mt-6 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-white/90"
            >
              Review Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <Card className="lg:col-span-4">
            <CardHeader
              eyebrow="Recent"
              title="Latest Users"
              action={
                <Link
                  href="/admin_dashboard/approval"
                  className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline"
                >
                  View all
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <div className="space-y-3">
              {latestUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-secondary/50"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                    style={{
                      backgroundColor:
                        AVATAR_PALETTE[index % AVATAR_PALETTE.length],
                    }}
                  >
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-primary-foreground">
                      {user.full_name}
                    </p>
                    <p className="truncate text-xs text-secondary-foreground">
                      {user.role_type.replace("_", " ")} · {user.barangay}
                    </p>
                  </div>
                </div>
              ))}
              {latestUsers.length === 0 && (
                <p className="py-6 text-center text-sm text-secondary-foreground">
                  No users yet.
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* BOTTOM ROW */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-8">
            <CardHeader
              eyebrow="Directory"
              title="Approved Accounts"
              subtitle={`Showing ${filteredApproved.length} of ${approvedAccounts.length} approved account(s).`}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
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
                  {filteredApproved.map((account, index) => (
                    <tr key={account.id} className="transition hover:bg-secondary/40">
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                            style={{
                              backgroundColor:
                                AVATAR_PALETTE[
                                  index % AVATAR_PALETTE.length
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
          </Card>

          <div className="flex flex-col gap-6 lg:col-span-4">
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
