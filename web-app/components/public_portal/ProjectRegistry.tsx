import { Search, ExternalLink, ScrollText, Inbox } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { StatusType } from "../../app/public_portal/types";

export interface Project {
  id?: string;
  name?: string;
  title?: string;
  category?: string;
  barangay?: string;
  location?: string;
  date?: string;
  dateProposed?: string;
  date_proposed?: string;
  created_at?: string;
  budget?: number | string;
  amount?: number | string;
  status?: string;
  transaction_hash?: string;
  tx_hash?: string;
}

interface ProjectRegistryProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filteredProjects: Project[];
}

export default function ProjectRegistry({
  searchQuery,
  onSearchChange,
  filteredProjects,
}: ProjectRegistryProps) {
  return (
    <section id="project-registry" className="scroll-mt-24 px-4 pb-12 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="animate-rise overflow-hidden rounded-3xl border border-border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)] motion-reduce:animate-none">
          {/* Table Header */}
          <div className="flex flex-col justify-between gap-4 border-b border-border px-6 py-5 md:flex-row md:items-center sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-secondary">
                <ScrollText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-secondary-foreground">
                  Registry
                </p>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-primary-foreground">
                    Project Registry
                  </h2>
                  <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
                    {filteredProjects.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary-foreground" />
              <input
                type="text"
                placeholder="Search project, barangay, category…"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white text-xs text-primary-foreground placeholder:text-secondary-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="px-7 py-3.5 text-[10px] font-bold text-secondary-foreground uppercase tracking-[0.12em]">
                    Project
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-secondary-foreground uppercase tracking-[0.12em]">
                    Location
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-secondary-foreground uppercase tracking-[0.12em]">
                    Date
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-secondary-foreground uppercase tracking-[0.12em] text-right">
                    Budget
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-secondary-foreground uppercase tracking-[0.12em] text-center">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-secondary-foreground uppercase tracking-[0.12em] text-center">
                    Blockchain
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-7 py-14 text-center">
                      <div className="mx-auto flex max-w-xs flex-col items-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-secondary">
                          <Inbox className="h-5 w-5 text-secondary-foreground" />
                        </div>
                        <p className="text-sm font-bold text-primary-foreground">
                          No projects found
                        </p>
                        <p className="mt-1 text-xs text-secondary-foreground">
                          Try a different project name, barangay, or category.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((p, idx) => {
                    const projectName = p.name || p.title || "Untitled Project";
                    const projectCategory = p.category || "General";
                    const location = p.barangay || p.location || "N/A";

                    const rawDate =
                      p.dateProposed ||
                      p.date ||
                      p.date_proposed ||
                      p.created_at;
                    const formattedDate = rawDate
                      ? new Date(rawDate).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })
                      : "N/A";

                    const rawBudget = p.budget ?? p.amount ?? 0;
                    const formattedBudget =
                      typeof rawBudget === "number"
                        ? `₱${rawBudget.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : String(rawBudget).startsWith("₱")
                          ? rawBudget
                          : `₱${rawBudget}`;

                    const txHash = p.transaction_hash || p.tx_hash;

                    return (
                      <tr
                        key={p.id || idx}
                        className="border-b border-border last:border-0 hover:bg-secondary/40 transition-all group"
                      >
                        {/* Project Name & Category */}
                        <td className="px-7 py-4">
                          <p className="text-sm font-semibold text-primary-foreground group-hover:text-primary transition-colors">
                            {projectName}
                          </p>
                          <p className="text-xs text-secondary-foreground mt-0.5">
                            {projectCategory}
                          </p>
                        </td>

                        {/* Location */}
                        <td className="px-6 py-4 text-sm text-secondary-foreground font-medium">
                          {location}
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-sm text-secondary-foreground">
                          {formattedDate}
                        </td>

                        {/* Budget */}
                        <td className="px-6 py-4 text-sm font-mono font-bold text-right text-primary-foreground tabular-nums">
                          {formattedBudget}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center">
                          <StatusBadge
                            status={(p.status as StatusType) || "Pending"}
                          />
                        </td>

                        {/* Etherscan Verification */}
                        <td className="px-6 py-4 text-center">
                          {txHash ? (
                            <a
                              href={`https://sepolia.etherscan.io/tx/${txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary transition-colors hover:border-primary/30 hover:bg-primary/10"
                            >
                              Verify
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground/70">
                              Pending Sync
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          <div className="flex items-center justify-between border-t border-border bg-secondary/20 px-6 py-4 sm:px-7">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-secondary-foreground">
              Showing {filteredProjects.length} records
            </p>
            <p className="hidden items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-secondary-foreground sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Synced from Supabase
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
