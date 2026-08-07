"use client";

import LogoLoader from "@/components/LogoLoader";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import StatCard from "@/components/dashboard/ui/StatCard";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import StatusBadge from "@/components/dashboard/ui/StatusBadge";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "@/lib/useAuthStore";
import { VerifiedTransaction, ProjectStatus } from "../types";
import {
  ShieldCheck,
  Search,
  BadgeCheck,
  MapPin,
  Lock,
  Download,
  Play,
} from "lucide-react";

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

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  if (isLoading) return <LogoLoader />;

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen gap-4 bg-background p-4 selection:bg-tertiary selection:text-primary">
      <SideBar
        userName={currentUser.full_name}
        roleType={currentUser.role_type}
      />

      <main className="min-w-0 flex-1 space-y-6 py-2 animate-fadein">
        <TopBar
          userName={currentUser.full_name}
          userEmail={currentUser.email}
          hideSearch
        />

        <PageHeader
          eyebrow="Commission on Audit"
          title="Auditor Verification"
          subtitle="Track compliance, verify transactions, and review project audits in a unified dashboard."
        />

        {/* STAT ROW */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            label="Verified"
            value="2,150"
            icon={BadgeCheck}
            variant="brand"
            trend="Completed review cycles"
          />
          <StatCard
            label="Flagged"
            value="18"
            icon={ShieldCheck}
            trend="Require follow-up"
          />
          <StatCard
            label="Projects"
            value="12"
            icon={MapPin}
            trend="Active reviews"
          />
        </div>

        {/* AUDITOR PROFILE + TABS */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-secondary-foreground">
                  Audit readiness
                </p>
                <h2 className="mt-1 text-lg font-bold tracking-tight text-primary-foreground">
                  Transaction integrity
                </h2>
              </div>
              <StatusBadge status="verified" showDot />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                  Verified
                </p>
                <p className="mt-2 text-2xl font-bold text-success">2,150</p>
              </div>
              <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                  Flagged
                </p>
                <p className="mt-2 text-2xl font-bold text-danger">18</p>
              </div>
              <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                  Projects
                </p>
                <p className="mt-2 text-2xl font-bold text-primary-foreground">
                  12
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Auditor" title="Profile" />
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                  Name
                </p>
                <p className="mt-1 text-sm font-bold text-primary-foreground">
                  {currentUser.full_name}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                  Role
                </p>
                <p className="mt-1 text-sm font-bold text-primary-foreground">
                  {currentUser.role_type.replace(/_/g, " ")}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                  Barangay
                </p>
                <p className="mt-1 text-sm font-bold text-primary-foreground">
                  {currentUser.barangay}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2 text-xs font-bold text-success">
                <Lock className="h-3.5 w-3.5" />
                Full audit access
              </div>
            </div>
          </Card>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {(
              [
                ["transactions", "Transactions"],
                ["projects", "Projects"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  activeTab === key
                    ? "bg-primary text-white shadow-sm"
                    : "border border-border bg-white text-secondary-foreground hover:bg-secondary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-sm transition hover:bg-primary/90">
              <Play className="h-3.5 w-3.5" />
              Start audit
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-secondary-foreground transition hover:bg-secondary">
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>

        {activeTab === "transactions" && (
          <Card>
            <CardHeader
              eyebrow="Audit Stream"
              title="Latest Transactions"
              subtitle="Filter latest verified and flagged entries"
              action={
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-foreground" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-52 rounded-xl border border-border bg-white py-2 pl-9 pr-3 text-sm text-primary-foreground outline-none transition placeholder:text-secondary-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-border bg-white px-3 py-2 text-sm text-primary-foreground outline-none transition focus:border-primary"
                  >
                    <option value="all">All</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="flagged">Flagged</option>
                  </select>
                </div>
              }
            />

            <div className="space-y-3">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/40 p-4 transition-colors hover:bg-secondary"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                      {tx.category}
                    </p>
                    <h3 className="truncate text-sm font-bold text-primary-foreground">
                      {tx.vendor}
                    </h3>
                    <p className="text-xs text-secondary-foreground">
                      {new Date(tx.date).toLocaleDateString()} · {tx.blockchainHash}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={tx.status} />
                    <span className="text-sm font-bold tabular-nums text-primary-foreground">
                      {formatCurrency(tx.amount)}
                    </span>
                    <button className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary/90">
                      Review
                    </button>
                  </div>
                </div>
              ))}

              {filteredTransactions.length === 0 && (
                <div className="p-10 text-center text-sm font-bold text-secondary-foreground">
                  No transactions match your filters.
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === "projects" && (
          <Card>
            <CardHeader
              eyebrow="Project Oversight"
              title="Compliance & Budget Review"
              subtitle="Review project compliance and budgets"
              action={
                <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-sm transition hover:bg-primary/90">
                  <Download className="h-3.5 w-3.5" />
                  Export
                </button>
              }
            />

            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((project) => {
                const utilization = Math.round(
                  (project.spent / project.budget) * 100,
                );
                return (
                  <div
                    key={project.id}
                    className="rounded-2xl border border-border bg-secondary/40 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <StatusBadge status={project.status} />
                        <h3 className="mt-2 text-sm font-bold text-primary-foreground">
                          {project.name}
                        </h3>
                        <p className="mt-1 text-[11px] text-secondary-foreground">
                          Last audit: {project.lastAudit}
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-information/10 px-3 py-1 text-xs font-bold text-information">
                        {project.complianceScore}%
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-secondary-foreground">
                          Utilization
                        </span>
                        <span className="font-bold text-primary-foreground">
                          {utilization}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${utilization}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-border bg-white p-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                          Budget
                        </p>
                        <p className="mt-1 text-sm font-bold text-primary-foreground">
                          {formatCurrency(project.budget)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border bg-white p-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                          Spent
                        </p>
                        <p className="mt-1 text-sm font-bold text-primary-foreground">
                          {formatCurrency(project.spent)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
