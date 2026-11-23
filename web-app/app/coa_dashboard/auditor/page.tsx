"use client";

import LogoLoader from "@/components/LogoLoader";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import StatCard from "@/components/dashboard/ui/StatCard";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import StatusBadge from "@/components/dashboard/ui/StatusBadge";
import ProposalPreviewModal from "@/components/bidding/ProposalPreviewModal";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "@/lib/useAuthStore";
import { useRecordsSync } from "@/lib/useRecordsSync";
import type { LedgerRecord } from "@/lib/records";
import { VerifiedTransaction, ProjectStatus } from "../types";
import { downloadTablePdf } from "@/lib/reportPdf";
import {
  ShieldCheck,
  Search,
  BadgeCheck,
  MapPin,
  Lock,
  Download,
  FileText,
  Loader2,
} from "lucide-react";

const RECORD_TYPE_LABELS: Record<LedgerRecord["record_type"], string> = {
  allocation: "Fund Allocation",
  expense: "Expense",
  award: "Contract Award",
};

interface ProjectRow {
  id: string | number;
  name: string | null;
  budget: number | string | null;
  status: string | null;
  barangay: string | null;
  created_at: string | null;
  dateProposed: string | null;
}

function toAuditStatus(record: LedgerRecord): VerifiedTransaction["status"] {
  const compliance = String(record.compliance_status ?? "")
    .trim()
    .toLowerCase();

  if (compliance === "flagged") return "flagged";
  if (compliance === "pending docs" || compliance === "pending")
    return "pending";
  if (
    compliance === "clean" ||
    compliance === "verified" ||
    compliance === "approved"
  )
    return "verified";

  return record.blockchain_tx_hash ? "verified" : "pending";
}

function shortenHash(hash: string | null | undefined): string {
  if (!hash) return "Off-chain";
  return hash.length > 14
    ? `${hash.slice(0, 6)}...${hash.slice(-4)}`
    : hash;
}

function normalizeProjectStatus(
  status: string | null,
): ProjectStatus["status"] {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase();

  if (normalized === "completed") return "completed";
  if (
    normalized === "on hold" ||
    normalized === "on-hold" ||
    normalized === "onhold"
  )
    return "on-hold";

  return "active";
}

interface BidProposalRow {
  id: string;
  project_id: string;
  contract_title: string | null;
  amount_php: number;
  status: string;
  submitted_on: string | null;
  created_at: string;
  proposal_url: string;
  vendor_name: string | null;
}

export default function AuditorPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "transactions" | "projects" | "proposals"
  >("transactions");
  const [proposals, setProposals] = useState<BidProposalRow[]>([]);
  const [isProposalsLoading, setIsProposalsLoading] = useState(true);
  const [proposalsError, setProposalsError] = useState("");
  const [proposalSearch, setProposalSearch] = useState("");
  const [proposalPreview, setProposalPreview] = useState<{
    url: string;
    vendorName: string;
  } | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const {
    records,
    isLoading: isLedgerLoading,
    error: ledgerError,
  } = useRecordsSync({ limit: 200 });

  const [projectRows, setProjectRows] = useState<ProjectRow[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);

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

  useEffect(() => {
    if (!currentUser) return;

    let active = true;

    const loadProposals = async () => {
      const { data, error } = await supabase
        .from("bids")
        .select(
          "id, project_id, contract_title, amount_php, status, submitted_on, created_at, proposal_url, vendor_name",
        )
        .not("proposal_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!active) return;

      if (error) {
        console.error("Failed to load bid proposals:", error.message);
        setProposalsError("Failed to load bid proposals.");
      } else {
        setProposals((data as unknown as BidProposalRow[]) ?? []);
        setProposalsError("");
      }

      setIsProposalsLoading(false);
    };

    loadProposals();

    return () => {
      active = false;
    };
  }, [currentUser]);

  useEffect(() => {
    let active = true;

    const loadProjects = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, budget, status, barangay, created_at, dateProposed")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!active) return;

      if (error) {
        console.error("Failed to load audited projects:", error.message);
        setProjectRows([]);
      } else {
        setProjectRows((data as unknown as ProjectRow[]) ?? []);
      }

      setIsProjectsLoading(false);
    };

    loadProjects();

    return () => {
      active = false;
    };
  }, []);

  const filteredProposals = proposals.filter((bid) => {
    const query = proposalSearch.toLowerCase();
    const vendor = (bid.vendor_name || "").toLowerCase();
    const title = (bid.contract_title || "").toLowerCase();
    return vendor.includes(query) || title.includes(query);
  });

  const transactions = useMemo<VerifiedTransaction[]>(() => {
    return records.map((record) => {
      const amountCentavos = Number(record.amount);

      return {
        id: String(
          record.id ?? `${record.record_type}-${record.created_at ?? ""}`,
        ),
        amount: Number.isFinite(amountCentavos) ? amountCentavos / 100 : 0,
        vendor:
          record.payee ||
          record.purpose ||
          RECORD_TYPE_LABELS[record.record_type],
        category: record.category || RECORD_TYPE_LABELS[record.record_type],
        date: record.created_at ?? "",
        status: toAuditStatus(record),
        blockchainHash: shortenHash(record.blockchain_tx_hash),
        receiptCount: 0,
        projectId: record.project_id ? String(record.project_id) : undefined,
      };
    });
  }, [records]);

  const projects = useMemo<ProjectStatus[]>(() => {
    const awardSpendByProject = new Map<string, number>();
    const expensesByBarangay = new Map<
      string,
      { verified: number; total: number }
    >();
    const lastAuditByBarangay = new Map<string, string>();

    for (const record of records) {
      const createdAt = record.created_at ?? "";
      const amount = Number(record.amount);
      const amountPesos = Number.isFinite(amount) ? amount / 100 : 0;

      if (record.record_type === "award" && record.project_id) {
        const key = String(record.project_id);
        awardSpendByProject.set(
          key,
          (awardSpendByProject.get(key) ?? 0) + amountPesos,
        );
      }

      if (record.record_type === "expense" && record.barangay) {
        const entry = expensesByBarangay.get(record.barangay) ?? {
          verified: 0,
          total: 0,
        };
        entry.total += 1;
        if (toAuditStatus(record) === "verified") {
          entry.verified += 1;
        }
        expensesByBarangay.set(record.barangay, entry);
      }

      if (record.barangay && createdAt) {
        const previous = lastAuditByBarangay.get(record.barangay);
        if (!previous || Date.parse(createdAt) > Date.parse(previous)) {
          lastAuditByBarangay.set(record.barangay, createdAt);
        }
      }
    }

    return projectRows.map((row) => {
      const auditDate = row.barangay
        ? lastAuditByBarangay.get(row.barangay)
        : undefined;
      const expenseStats = row.barangay
        ? expensesByBarangay.get(row.barangay)
        : undefined;

      return {
        id: String(row.id),
        name: row.name ?? `Project ${row.id}`,
        budget: Number(row.budget) || 0,
        spent: awardSpendByProject.get(String(row.id)) ?? 0,
        status: normalizeProjectStatus(row.status),
        lastAudit: auditDate
          ? new Date(auditDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "No audit yet",
        complianceScore:
          expenseStats && expenseStats.total > 0
            ? Math.round((expenseStats.verified / expenseStats.total) * 100)
            : null,
      };
    });
  }, [projectRows, records]);

  const verifiedCount = transactions.filter(
    (tx) => tx.status === "verified",
  ).length;
  const flaggedCount = transactions.filter(
    (tx) => tx.status === "flagged",
  ).length;

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportTransactions = () => {
    const stamp = new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" });

    downloadTablePdf({
      fileName: `coa-audit-transactions_${new Date().toISOString().slice(0, 10)}.pdf`,
      title: "COA Audit Transactions",
      subtitle: [`Generated: ${stamp}`, `${filteredTransactions.length} transactions`],
      head: ["Date", "Vendor", "Category", "Status", "Amount (PHP)", "Reference"],
      rows: filteredTransactions.map((tx) => [
        tx.date,
        tx.vendor,
        tx.category,
        tx.status,
        tx.amount.toFixed(2),
        tx.blockchainHash,
      ]),
      rightAligned: [4],
    });
  };

  const exportProjects = () => {
    const stamp = new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" });

    downloadTablePdf({
      fileName: `coa-project-oversight_${new Date().toISOString().slice(0, 10)}.pdf`,
      title: "COA Project Oversight",
      subtitle: [`Generated: ${stamp}`, `${projects.length} projects`],
      head: [
        "Project",
        "Status",
        "Budget (PHP)",
        "Awarded (PHP)",
        "Compliance (%)",
        "Last audit",
      ],
      rows: projects.map((project) => [
        project.name,
        project.status,
        project.budget.toFixed(2),
        project.spent.toFixed(2),
        project.complianceScore ?? "",
        project.lastAudit,
      ]),
      rightAligned: [2, 3, 4],
    });
  };

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
            value={String(verifiedCount)}
            icon={BadgeCheck}
            variant="brand"
            trend="Completed review cycles"
          />
          <StatCard
            label="Flagged"
            value={String(flaggedCount)}
            icon={ShieldCheck}
            trend="Require follow-up"
          />
          <StatCard
            label="Projects"
            value={String(projects.length)}
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
                <p className="mt-2 text-2xl font-bold text-success">
                  {verifiedCount}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                  Flagged
                </p>
                <p className="mt-2 text-2xl font-bold text-danger">
                  {flaggedCount}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                  Projects
                </p>
                <p className="mt-2 text-2xl font-bold text-primary-foreground">
                  {projects.length}
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
                ["proposals", "Bid Proposals"],
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
            <button
              type="button"
              onClick={exportTransactions}
              disabled={filteredTransactions.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-secondary-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
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

            {isLedgerLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-tertiary" />
                <p className="text-sm font-bold text-secondary-foreground">
                  Fetching ledger records...
                </p>
              </div>
            ) : ledgerError ? (
              <div className="p-10 text-center text-sm font-bold text-danger">
                {ledgerError}
              </div>
            ) : (
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
                  {records.length === 0
                    ? "No ledger records yet. Entries appear here once SK records sync on-chain."
                    : "No transactions match your filters."}
                </div>
              )}
            </div>
            )}
          </Card>
        )}

        {activeTab === "projects" && (
          <Card>
            <CardHeader
              eyebrow="Project Oversight"
              title="Compliance & Budget Review"
              subtitle="Review project compliance and budgets"
              action={
                <button
                  type="button"
                  onClick={exportProjects}
                  disabled={projects.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </button>
              }
            />

            {isProjectsLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-tertiary" />
                <p className="text-sm font-bold text-secondary-foreground">
                  Loading projects...
                </p>
              </div>
            ) : projects.length === 0 ? (
              <div className="p-10 text-center text-sm font-bold text-secondary-foreground">
                No projects found for audit review.
              </div>
            ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((project) => {
                const utilization =
                  project.budget > 0
                    ? Math.round((project.spent / project.budget) * 100)
                    : 0;
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
                        {project.complianceScore === null
                          ? "No records"
                          : `${project.complianceScore}%`}
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
            )}
          </Card>
        )}

        {activeTab === "proposals" && (
          <Card>
            <CardHeader
              eyebrow="Procurement Audit"
              title="Bid Proposals"
              subtitle="Vendor submissions with inline proposal document review"
              action={
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-foreground" />
                  <input
                    type="text"
                    placeholder="Search vendor or project..."
                    value={proposalSearch}
                    onChange={(e) => setProposalSearch(e.target.value)}
                    className="w-64 rounded-xl border border-border bg-white py-2 pl-9 pr-3 text-sm text-primary-foreground outline-none transition placeholder:text-secondary-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              }
            />

            <div className="overflow-x-auto">
              {isProposalsLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-tertiary" />
                  <p className="text-sm font-bold text-secondary-foreground">
                    Fetching bid proposals...
                  </p>
                </div>
              ) : proposalsError ? (
                <div className="p-10 text-center text-sm font-bold text-danger">
                  {proposalsError}
                </div>
              ) : filteredProposals.length === 0 ? (
                <div className="flex flex-col items-center justify-center border-t border-border p-12 text-center">
                  <FileText className="mb-3 h-10 w-10 text-secondary-foreground/30" />
                  <p className="text-sm font-bold text-secondary-foreground">
                    No bid proposals found.
                  </p>
                  <p className="mt-1 text-xs text-secondary-foreground">
                    Proposals appear here once vendors submit bids with an
                    attached document.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                      <th className="px-4 py-3">Vendor</th>
                      <th className="px-4 py-3">Project / Contract</th>
                      <th className="px-4 py-3 text-right">Bid Amount</th>
                      <th className="px-4 py-3">Submitted</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Document</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredProposals.map((bid) => (
                      <tr
                        key={bid.id}
                        className="transition-colors hover:bg-secondary/50"
                      >
                        <td className="px-4 py-4 text-sm font-bold text-primary-foreground">
                          {bid.vendor_name || "Unknown Vendor"}
                        </td>
                        <td className="px-4 py-4 text-sm text-secondary-foreground">
                          {bid.contract_title ||
                            `Project ${String(bid.project_id).slice(0, 8)}`}
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-bold tabular-nums text-primary-foreground">
                          {formatCurrency(Number(bid.amount_php))}
                        </td>
                        <td className="px-4 py-4 text-xs text-secondary-foreground">
                          {new Date(
                            bid.submitted_on || bid.created_at,
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={bid.status} />
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setProposalPreview({
                                url: bid.proposal_url,
                                vendorName: bid.vendor_name || "Vendor",
                              })
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm transition hover:bg-primary/90"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Preview
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        )}
      </main>

      {proposalPreview && (
        <ProposalPreviewModal
          proposalUrl={proposalPreview.url}
          vendorName={proposalPreview.vendorName}
          onClose={() => setProposalPreview(null)}
        />
      )}
    </div>
  );
}
