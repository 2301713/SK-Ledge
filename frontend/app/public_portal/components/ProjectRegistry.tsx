import { Search } from "lucide-react";
import { Project } from "../types";
import StatusBadge from "./StatusBadge";

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
    <section className="px-6 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="bg-secondary rounded-2xl border border-black/20 overflow-hidden">
          {/* Table Header */}
          <div className="px-7 py-5 border-b border-white/8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-1">
                Registry
              </p>
              <h2 className="text-base font-bold text-primary">
                Project Registry
              </h2>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
              <input
                type="text"
                placeholder="Search project, barangay, category…"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-secondary border border-black/20 hover:border-black/40 rounded-xl text-xs text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 outline-none transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/6">
                  <th className="px-7 py-3.5 text-[10px] font-bold text-primary uppercase tracking-[0.12em]">
                    Project
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-primary uppercase tracking-[0.12em]">
                    Location
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-primary uppercase tracking-[0.12em]">
                    Date
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-primary uppercase tracking-[0.12em] text-right">
                    Budget
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-primary uppercase tracking-[0.12em] text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-7 py-14 text-center text-sm text-slate-600"
                    >
                      No projects match your search.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((p, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-white/4 last:border-0 hover:bg-white/3 transition-all group"
                    >
                      <td className="px-7 py-4">
                        <p className="text-sm font-semibold text-primary group-hover:text-tertiary transition-colors">
                          {p.name}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {p.category}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400 font-medium">
                        {p.barangay}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {p.date}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono font-bold text-right text-white tabular-nums">
                        {p.budget}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          <div className="px-7 py-4 border-t border-white/6">
            <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest">
              Showing {filteredProjects.length} of{" "}
              {filteredProjects.length === 0 ? "0" : "9"} records
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
