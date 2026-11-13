"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Wallet,
  Download,
  ChevronRight,
  CheckCircle2,
  FileText,
  Mic,
  MapPin,
  Tag,
  Layers,
  Radio,
  Headset,
  FileStack,
  ShieldCheck,
  Loader2,
  Inbox,
} from "lucide-react";
import PortalNav from "../../components/public_portal/PortalNav";
import StatCard from "../../components/bidding/StatCard";
import StatusBadge from "../../components/bidding/StatusBadge";
import FilterGroup from "../../components/bidding/FilterGroup";
import TimelineItem from "../../components/bidding/TimelineItem";
import RequestModal from "../../components/bidding/RequestModal";
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
  const daysLeft = row.bid_deadline
    ? Math.ceil((new Date(row.bid_deadline).getTime() - Date.now()) / DAY_MS)
    : 0;

  return {
    id: row.id,
    name: row.name,
    location: row.location || row.barangay || "",
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

const marketplaceStats = (
  projectCount: number,
  openBidsCount: number,
): {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  color: string;
}[] => [
  {
    icon: Layers,
    label: "Marketplace Status",
    value: String(projectCount),
    sub: "Total published bid opportunities",
    color: "text-primary",
  },
  {
    icon: Radio,
    label: "Open for Submission",
    value: String(openBidsCount),
    sub: "Procurements accepting proposals",
    color: "text-success",
  },
  {
    icon: Headset,
    label: "Vendor Readiness",
    value: "24/7",
    sub: "Tender documents available online",
    color: "text-tertiary",
  },
];

export default function BiddingPortal() {
  const [projects, setProjects] = useState<BiddingProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<BiddingProject | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [vendorCompany, setVendorCompany] = useState("");
  const [vendorEmail, setVendorEmail] = useState("");
  const [vendorNote, setVendorNote] = useState("");
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await supabase
          .from("projects")
          .select("*")
          .eq("is_open_for_bidding", true)
          .order("created_at", { ascending: false });

        if (data) setProjects((data as ProjectRow[]).map(toBiddingProject));
      } catch (err) {
        console.error("Failed to load bidding projects:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Derived: fall back to the first project when nothing valid is selected
  const activeProject =
    selectedProject && projects.some((p) => p.id === selectedProject.id)
      ? selectedProject
      : projects[0] ?? null;

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const openBidsCount = projects.filter(
    (project) => project.status === "Accepting Bids",
  ).length;
  const awardedCount = projects.filter(
    (project) => project.status === "Awarded",
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
              <div className="mx-3 h-5 w-px bg-border" />
              <Mic className="h-4 w-4 cursor-pointer text-secondary-foreground transition hover:text-primary" />
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-border bg-white px-4 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <FilterGroup label="Status" value="All" />
              <span className="h-6 w-px bg-border" />
              <FilterGroup label="Barangay" value="All" />
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

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 sm:px-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-8">
            {/* MARKETPLACE SNAPSHOT */}
            <div className="animate-rise overflow-hidden rounded-3xl border border-border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)] motion-reduce:animate-none">
              <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {marketplaceStats(projects.length, openBidsCount).map(
                  (stat) => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} className="p-5 sm:p-6">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-widest text-secondary-foreground">
                            {stat.label}
                          </p>
                          <Icon className={`h-4 w-4 ${stat.color}`} />
                        </div>
                        <p
                          className={`mt-3 text-3xl font-black tabular-nums ${stat.color}`}
                        >
                          {stat.value}
                        </p>
                        <p className="mt-1.5 text-xs text-secondary-foreground">
                          {stat.sub}
                        </p>
                      </div>
                    );
                  },
                )}
              </div>
            </div>

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
                      filteredProjects.map((project, idx) => {
                        const isActive = activeProject?.id === project.id;
                        return (
                          <tr
                            key={project.id}
                            onClick={() => setSelectedProject(project)}
                            className={`cursor-pointer transition-colors ${
                              isActive
                                ? "bg-primary/[0.04]"
                                : "hover:bg-secondary/40"
                            }`}
                          >
                            <td className="relative px-6 py-4">
                              {isActive && (
                                <span className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-primary" />
                              )}
                              <span className="text-xs font-bold tabular-nums text-secondary-foreground">
                                {String(idx + 1).padStart(2, "0")}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p
                                className={`text-sm font-bold leading-tight transition-colors ${
                                  isActive
                                    ? "text-primary"
                                    : "text-primary-foreground"
                                }`}
                              >
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
                              <span
                                className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                                  isActive
                                    ? "border-primary/20 bg-primary/10 text-primary"
                                    : "border-border bg-white text-secondary-foreground"
                                }`}
                              >
                                <ChevronRight size={16} />
                              </span>
                            </td>
                          </tr>
                        );
                      })
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
                      Try a different project name or barangay.
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

          {/* DETAIL PANEL */}
          <aside className="xl:col-span-4">
            <div
              className="animate-rise overflow-hidden rounded-3xl border border-border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)] motion-reduce:animate-none xl:sticky xl:top-28"
              style={{ animationDelay: "160ms" }}
            >
              {!activeProject ? (
                <div className="flex min-h-100 flex-col items-center justify-center px-6 py-16 text-center">
                  {isLoading ? (
                    <>
                      <Loader2 className="mb-3 h-6 w-6 animate-spin text-primary" />
                      <p className="text-sm font-bold text-secondary-foreground">
                        Loading procurements...
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-secondary">
                        <Inbox className="h-5 w-5 text-secondary-foreground" />
                      </div>
                      <p className="text-sm font-bold text-secondary-foreground">
                        Select a project from the bidding ledger.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* PANEL HEADER */}
                  <div className="relative border-b border-border bg-gradient-to-br from-primary/[0.07] via-white to-white px-6 py-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                      Selected Procurement
                    </p>
                    <h2 className="mt-2 text-xl font-black leading-tight tracking-tight text-primary-foreground">
                      {activeProject.name}
                    </h2>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                        <MapPin className="h-3 w-3" />
                        {activeProject.location.split(";")[0] || "—"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                        <Tag className="h-3 w-3" />
                        {activeProject.location.split(";")[1] || "General"}
                      </span>
                    </div>

                    <div className="mt-4">
                      <StatusBadge status={activeProject.status} />
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-border bg-white/90 p-3">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-secondary-foreground">
                          Approved Budget
                        </p>
                        <p className="mt-1 text-sm font-black tabular-nums text-primary-foreground">
                          ₱{" "}
                          {activeProject.abc.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border bg-white/90 p-3">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-secondary-foreground">
                          Deadline
                        </p>
                        <p className="mt-1 text-sm font-black text-primary-foreground">
                          {activeProject.deadline}
                        </p>
                        {activeProject.daysLeft > 0 && (
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-pending">
                            {activeProject.daysLeft} days left
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary-foreground">
                      Scope of Work
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-secondary-foreground">
                      {activeProject.description}
                    </p>

                    <div className="relative mt-8 space-y-7">
                      <div className="absolute bottom-2 left-[7px] top-2 w-px bg-border" />
                      <TimelineItem
                        label="Pre-Bid Conference"
                        date="Upon publication"
                        active
                      />
                      <TimelineItem
                        label="Bid Opening & Evaluation"
                        date={activeProject.opening}
                        active={
                          activeProject.status === "Evaluation" ||
                          activeProject.status === "Awarded"
                        }
                        isInactive={activeProject.status === "Accepting Bids"}
                      />
                      <TimelineItem
                        label="Notice of Award"
                        isStar={activeProject.status === "Awarded"}
                        isInactive={activeProject.status !== "Awarded"}
                      />
                    </div>

                    {activeProject.status === "Awarded" && (
                      <div className="relative mt-8 overflow-hidden rounded-2xl border border-tertiary/30 bg-tertiary/10 p-5">
                        <h4 className="mb-2 text-[10px] font-black uppercase tracking-widest text-secondary-foreground">
                          Winning Bidder Reveal
                        </h4>
                        <div className="mb-3 h-px w-full bg-border" />
                        <p className="text-[10px] font-bold uppercase text-secondary-foreground">
                          Winning Bidder:{" "}
                          <span className="text-primary-foreground">
                            {activeProject.winner || "Pending publication"}
                          </span>
                        </p>
                        {activeProject.awardTxHash && (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${activeProject.awardTxHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex break-all text-[10px] font-bold uppercase text-primary hover:underline"
                          >
                            Verified on-chain — View transaction
                          </a>
                        )}
                      </div>
                    )}

                    {/* VENDOR PARTICIPATION */}
                    <div className="mt-8 rounded-2xl border border-border bg-secondary/25 p-5">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-secondary-foreground">
                            Vendor Participation
                          </p>
                          <h3 className="mt-1 text-lg font-black text-primary-foreground">
                            Submit your proposal
                          </h3>
                        </div>
                        <span className="shrink-0 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-success">
                          Open Now
                        </span>
                      </div>

                      <ol className="space-y-3 text-xs leading-relaxed text-secondary-foreground">
                        {[
                          "Download the bid documents and review the scope.",
                          "Prepare your technical and financial proposal package.",
                          "Submit before the deadline through the SK procurement office.",
                        ].map((step, index) => (
                          <li key={step} className="flex gap-3">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-black text-primary">
                              {index + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>

                      <button
                        type="button"
                        onClick={() => setIsRequestModalOpen(true)}
                        className="mt-5 w-full rounded-xl bg-primary py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 active:scale-95"
                      >
                        Request Bid Package
                      </button>
                    </div>

                    <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white py-3.5 text-[11px] font-black uppercase tracking-widest text-primary-foreground transition hover:border-primary/30 hover:bg-secondary hover:text-primary active:scale-95">
                      <Download size={16} strokeWidth={2.5} />
                      Download Bidding Documents
                    </button>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>

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
