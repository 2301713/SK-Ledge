import { Search, ExternalLink } from "lucide-react";
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
    <section className="px-4 sm:px-6 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-3xl border border-border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)] overflow-hidden">
          {/* Table Header */}
          <div className="px-7 py-5 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold text-secondary-foreground uppercase tracking-[0.15em] mb-1">
                Registry
              </p>
              <h2 className="text-base font-bold text-primary-foreground">
                Project Registry
              </h2>
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
                    <td
                      colSpan={6}
                      className="px-7 py-14 text-center text-sm text-secondary-foreground"
                    >
                      No projects match your search.
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
                              className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                            >
                              Verify
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[11px] text-secondary-foreground italic">
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
          <div className="px-7 py-4 border-t border-border bg-secondary/20">
            <p className="text-[10px] text-secondary-foreground font-semibold uppercase tracking-widest">
              Showing {filteredProjects.length} records
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
