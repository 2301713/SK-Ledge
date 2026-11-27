"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Wallet,
  ChevronRight,
  CheckCircle2,
  FileText,
  MapPin,
  FileStack,
  ShieldCheck,
  Inbox,
} from "lucide-react";
import PortalNav from "../../components/public_portal/PortalNav";
import StatCard from "../../components/bidding/StatCard";
import StatusBadge from "../../components/bidding/StatusBadge";
import FilterGroup from "../../components/bidding/FilterGroup";
import RequestModal from "../../components/bidding/RequestModal";
import ProcurementDetailModal from "../../components/bidding/ProcurementDetailModal";
import { supabase } from "@/lib/supabase";
import type { BiddingProject } from "./types";

interface ProjectRow {
  id: string;
  name: string;
  category: string;
  budget: number;
  status: string;
  location: string | null;
  barangay: string | null;
  description: string | null;
  bid_deadline: string | null;
  winning_bidder_name: string | null;
  award_tx_hash: string | null;
  created_at: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** A project can cover several barangays, stored semicolon-separated. */
const splitBarangays = (value: string): string[] =>
  value
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

const uniqueSorted = (values: string[]): string[] =>
  Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));

const formatDate = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const toBiddingProject = (row: ProjectRow): BiddingProject => {
  const status =
    row.status === "Awarded"
      ? "Awarded"
      : row.status === "Evaluation"
        ? "Evaluation"
        : "Accepting Bids";
  // Only Approved projects reach this board, so any other status is already
  // excluded by the query and would not be publicly biddable.
  const daysLeft = row.bid_deadline
    ? Math.ceil((new Date(row.bid_deadline).getTime() - Date.now()) / DAY_MS)
    : 0;

  return {
    id: row.id,
    name: row.name,
    location: row.location || row.barangay || "",
    barangay: row.barangay || row.location || "",
    abc: Number(row.budget),
    status,
    deadline: formatDate(row.bid_deadline),
    daysLeft: status === "Accepting Bids" ? Math.max(0, daysLeft) : 0,
    description:
      row.description ||
      "No project description was provided for this procurement.",
    opening: formatDate(row.bid_deadline),
    winner: row.winning_bidder_name ?? undefined,
    awardTxHash: row.award_tx_hash ?? undefined,
  };
};

export default function BiddingPortal() {
  const [projects, setProjects] = useState<BiddingProject[]>([]);
  const [awardedCount, setAwardedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<BiddingProject | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [barangayFilter, setBarangayFilter] = useState("All");
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [vendorCompany, setVendorCompany] = useState("");
  const [vendorEmail, setVendorEmail] = useState("");
  const [vendorNote, setVendorNote] = useState("");
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const [{ data }, { count }] = await Promise.all([
          supabase
            .from("projects")
            .select("*")
            .eq("status", "Approved")
            .eq("is_open_for_bidding", true)
            .order("created_at", { ascending: false }),
          supabase
            .from("projects")
            .select("id", { count: "exact", head: true })
            .eq("status", "Awarded"),
        ]);

        if (data) setProjects((data as ProjectRow[]).map(toBiddingProject));
        setAwardedCount(count ?? 0);
      } catch (err) {
        console.error("Failed to load bidding projects:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);



  const statusOptions = useMemo(
    () => ["All", ...uniqueSorted(projects.map((project) => project.status))],
    [projects],
  );

  const barangayOptions = useMemo(
    () => [
      "All",
      ...uniqueSorted(
        projects.flatMap((project) => splitBarangays(project.barangay)),
      ),
    ],
    [projects],
  );

  const filteredProjects = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        !term ||
        project.name.toLowerCase().includes(term) ||
        project.location.toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === "All" || project.status === statusFilter;
      const matchesBarangay =
        barangayFilter === "All" ||
        splitBarangays(project.barangay).includes(barangayFilter);

      return matchesSearch && matchesStatus && matchesBarangay;
    });
  }, [projects, searchQuery, statusFilter, barangayFilter]);

  const openBidsCount = projects.filter(
    (project) => project.status === "Accepting Bids",
  ).length;
  const totalBudgetPosted = useMemo(
    () =>
      projects.reduce((sum, project) => sum + (project.abc || 0), 0),
    [projects],
  );

  const handleRequestClose = () => {
    setIsRequestModalOpen(false);
    setRequestSubmitted(false);
  };

  const handleRequestSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestSubmitted(true);
    setVendorName("");
    setVendorCompany("");
    setVendorEmail("");
    setVendorNote("");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background pb-16 text-primary-foreground selection:bg-tertiary selection:text-primary">
      {/* AMBIENT BACKDROP */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-primary/[0.07] via-background to-background"
      />
      <div
        aria-hidden
        className="ledger-grid pointer-events-none absolute inset-x-0 top-0 h-72 opacity-60"
      />

      <div className="relative">
        <PortalNav />

        {/* HEADER */}
        <section className="mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl animate-in-left motion-reduce:animate-none">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary motion-reduce:animate-none" />
                Live Procurement Board
              </div>
              <h1 className="mt-5 text-3xl font-black leading-[1.05] tracking-tight sm:text-4xl">
                Official <span className="text-primary">SK</span> Procurement &
                Bidding
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-secondary-foreground">
                Every solicitation, bid, and award is published in the open —
                ensuring 100% transparency in local youth governance and public
                spending.
              </p>
            </div>

            <div
              className="flex flex-wrap items-center gap-2 animate-in-right motion-reduce:animate-none"
              style={{ animationDelay: "100ms" }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Open board
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Sepolia verified
              </span>
            </div>
          </div>

          {/* SEARCH + FILTERS */}
          <div
            className="mt-8 flex flex-wrap items-center gap-3 animate-rise motion-reduce:animate-none"
            style={{ animationDelay: "120ms" }}
          >
            <div className="flex min-w-[240px] flex-1 items-center rounded-2xl border border-border bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <Search className="mr-3 h-4 w-4 text-secondary-foreground" />
              <input
                type="text"
                placeholder='Search a project or barangay, e.g. "Youth Center"'
                className="w-full border-none bg-transparent text-sm text-primary-foreground outline-none placeholder:text-secondary-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-border bg-white px-4 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <FilterGroup
                label="Status"
                value={statusFilter}
                options={statusOptions}
                onChange={setStatusFilter}
                disabled={isLoading}
              />
              <span className="h-6 w-px bg-border" />
              <FilterGroup
                label="Barangay"
                value={barangayFilter}
                options={barangayOptions}
                onChange={setBarangayFilter}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* STATS */}
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              icon={<FileText size={20} className="text-primary" />}
              label="ACTIVE SOLICITATIONS"
              value={`${openBidsCount} Projects`}
              lineColor="bg-primary"
              delayMs={0}
            />
            <StatCard
              icon={<Wallet size={20} className="text-tertiary" />}
              label="TOTAL BUDGET POSTED"
              value={`₱ ${totalBudgetPosted.toLocaleString("en-US")}`}
              lineColor="bg-tertiary"
              isActive
              delayMs={70}
            />
            <StatCard
              icon={<CheckCircle2 size={20} className="text-success" />}
              label="RECENTLY AWARDED"
              value={`${awardedCount} Projects`}
              subtitle="on the ledger"
              lineColor="bg-success"
              delayMs={140}
            />
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
          {/* BIDDING LEDGER */}
          <div
            className="animate-rise overflow-hidden rounded-3xl border border-border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)] motion-reduce:animate-none"
            style={{ animationDelay: "90ms" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-secondary">
                  <FileStack className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-secondary-foreground">
                    Bidding Ledger
                  </p>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-primary-foreground">
                      Open solicitations
                    </h2>
                    <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
                      {filteredProjects.length}
                    </span>
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Updated live
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-secondary/40 text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                  <tr>
                    <th className="px-6 py-3.5">#</th>
                    <th className="px-6 py-3.5">Project</th>
                    <th className="px-6 py-3.5">P Value</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Deadline</th>
                    <th className="px-6 py-3.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <tr key={`skeleton-${index}`}>
                        <td colSpan={6} className="px-6 py-4">
                          <div className="h-10 animate-pulse rounded-xl bg-secondary" />
                        </td>
                      </tr>
                    ))
                  ) : (
                    filteredProjects.map((project, idx) => (
                      <tr
                        key={project.id}
                        onClick={() => setSelectedProject(project)}
                        className="cursor-pointer transition-colors hover:bg-secondary/40"
                      >
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold tabular-nums text-secondary-foreground">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold leading-tight text-primary-foreground transition-colors">
                            {project.name}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                            <MapPin className="h-3 w-3" />
                            {project.location.split(";")[0]}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold tabular-nums text-primary-foreground">
                          ₱{" "}
                          {project.abc.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={project.status} />
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-primary-foreground">
                            {project.deadline}
                          </p>
                          {project.daysLeft > 0 && (
                            <p className="mt-1 inline-flex rounded-md bg-pending/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pending">
                              {project.daysLeft} days left
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-secondary-foreground transition">
                            <ChevronRight size={16} />
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {!isLoading && filteredProjects.length === 0 && (
                <div className="flex flex-col items-center justify-center border-t border-border px-6 py-14 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-secondary">
                    <Inbox className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <p className="text-sm font-bold text-primary-foreground">
                    No open procurement projects found
                  </p>
                  <p className="mt-1 text-xs text-secondary-foreground">
                    Try a different keyword, status, or barangay.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-secondary/20 px-6 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-secondary-foreground">
                Showing {filteredProjects.length} solicitations
              </p>
              <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-secondary-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Synced from Supabase
              </p>
            </div>
          </div>
        </div>
      </div>

      <ProcurementDetailModal
        key={selectedProject?.id ?? "none"}
        visible={selectedProject !== null}
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onRequestPackage={() => setIsRequestModalOpen(true)}
      />

      <RequestModal
        visible={isRequestModalOpen}
        onClose={handleRequestClose}
        onSubmit={handleRequestSubmit}
        requestSubmitted={requestSubmitted}
        vendorName={vendorName}
        vendorCompany={vendorCompany}
        vendorEmail={vendorEmail}
        vendorNote={vendorNote}
        onVendorNameChange={setVendorName}
        onVendorCompanyChange={setVendorCompany}
        onVendorEmailChange={setVendorEmail}
        onVendorNoteChange={setVendorNote}
      />
    </div>
  );
}
