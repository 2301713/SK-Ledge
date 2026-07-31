"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type ProjectStatus = "Approved" | "Pending" | "Rejected";

// Kumpletong type definition na may optional fallbacks para hindi mag-error si TypeScript
export type Project = {
  id: string;
  name: string;
  category: string;
  status: ProjectStatus;
  budget: number;
  proposedBy: string;
  dateProposed: string;
  description?: string;
  barangay?: string;
  // Dagdag na optional fields para sa database fallbacks
  created_at?: string;
  date_proposed?: string;
  title?: string;
  project_name?: string;
  amount?: number;
  transaction_hash?: string;
  tx_hash?: string;
};

export default function TransparencyLedger() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("dateProposed", { ascending: false });

        if (error) throw error;
        setProjects(data || []);
      } catch (err: any) {
        console.error("Error fetching projects:", err);
        setError("Error loading project ledger data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse">
        Loading projects from database...
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-rose-500">{error}</div>;
  }

  if (projects.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm">
        No projects recorded yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
      <table className="min-w-full text-sm text-left divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-6 py-4 font-semibold text-slate-700">Date</th>
            <th scope="col" className="px-6 py-4 font-semibold text-slate-700">Project Name</th>
            <th scope="col" className="px-6 py-4 font-semibold text-slate-700">Category</th>
            <th scope="col" className="px-6 py-4 font-semibold text-slate-700">Budget</th>
            <th scope="col" className="px-6 py-4 font-semibold text-slate-700">Status</th>
            <th scope="col" className="px-6 py-4 font-semibold text-slate-700">Verification</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {projects.map((project) => {
            const rawDate = project.dateProposed || project.date_proposed || project.created_at;
            const dateStr = rawDate ? new Date(rawDate).toLocaleDateString() : "N/A";
            
            const projectName = project.name || project.title || project.project_name || "Untitled Project";
            const projectBudget = project.budget ?? project.amount ?? 0;
            const hashVal = project.transaction_hash || project.tx_hash;

            return (
              <tr key={project.id} className="transition-colors hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                  {dateStr}
                </td>

                <td className="px-6 py-4 font-bold text-slate-900">
                  {projectName}
                </td>

                <td className="px-6 py-4 text-slate-600">
                  {project.category || "General"}
                </td>

                <td className="px-6 py-4 font-bold text-slate-900">
                  ₱{projectBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      project.status === "Approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : project.status === "Rejected"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {project.status || "Pending"}
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  {hashVal ? (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${hashVal}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      Verify on Etherscan
                      <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Pending Blockchain Sync</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}