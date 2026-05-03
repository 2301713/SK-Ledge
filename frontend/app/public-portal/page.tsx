"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import { Project, StatusType } from "./types";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
);

const projectsData: Project[] = [
  {
    name: "Youth Leadership Summit",
    barangay: "Bauan",
    chair: "J. Reyes",
    date: "Mar 2024",
    budget: "₱85,000",
    category: "Youth Development",
    status: "done",
  },
  {
    name: "SK Basketball League",
    barangay: "San Jose",
    chair: "M. Santos",
    date: "Feb 2024",
    budget: "₱60,000",
    category: "Sports & Recreation",
    status: "ongoing",
  },
  {
    name: "Free Medical & Dental Mission",
    barangay: "Sorosoro Karsada",
    chair: "A. Cruz",
    date: "Jan 2024",
    budget: "₱45,000",
    category: "Health",
    status: "ongoing",
  },
  {
    name: "Anti-Drug Campaign Seminar",
    barangay: "Alangilan",
    chair: "C. Garcia",
    date: "Dec 2023",
    budget: "₱30,000",
    category: "Peace & Order",
    status: "done",
  },
  {
    name: "Tree Planting & Clean-Up Drive",
    barangay: "Cuta",
    chair: "L. Torres",
    date: "Dec 2023",
    budget: "₱25,000",
    category: "Environment",
    status: "done",
  },
  {
    name: "Nutrition & Health Awareness",
    barangay: "Lemery",
    chair: "F. Ramos",
    date: "Oct 2023",
    budget: "₱35,000",
    category: "Health",
    status: "done",
  },
  {
    name: "Kabataan Film Festival",
    barangay: "San Pascual",
    chair: "G. Lim",
    date: "Oct 2023",
    budget: "₱55,000",
    category: "Arts & Culture",
    status: "pending",
  },
  {
    name: "Youth Entrepreneurship Forum",
    barangay: "As-is",
    chair: "J. Reyes",
    date: "Sep 2023",
    budget: "₱68,000",
    category: "Livelihood",
    status: "ongoing",
  },
  {
    name: "Sports Equipment Procurement",
    barangay: "Cupang",
    chair: "M. Santos",
    date: "Aug 2023",
    budget: "₱50,000",
    category: "Sports & Recreation",
    status: "pending",
  },
];

export default function PublicDashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = useMemo(() => {
    return projectsData.filter((p) => {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.barangay.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  // Modernized Chart Colors based on brand
  const chartColors = [
    "#003366",
    "#FFCC00",
    "#10B981",
    "#3B82F6",
    "#F59E0B",
    "#6366F1",
    "#EC4899",
  ];

  return (
    <div className="min-h-screen bg-background text-primary-foreground selection:bg-tertiary selection:text-primary">
      {/* HEADER / NAV */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center text-tertiary font-bold text-xl shadow-lg shadow-primary/20">
            SK
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight text-primary">
              SK-Ledge
            </h1>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500">
              Batangas Province Transparency Hub
            </p>
          </div>
        </div>
        <Link
          href="/login"
          className="bg-primary text-white hover:bg-primary/90 px-6 py-2 rounded-full text-sm font-semibold transition-all hover:shadow-md active:scale-95"
        >
          Access Portal
        </Link>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        {/* HERO SECTION */}
        <section className="mb-10">
          <h2 className="text-3xl font-extrabold text-primary mb-2">
            Public Expenditure Dashboard
          </h2>
          <p className="text-secondary-foreground max-w-2xl">
            Real-time monitoring of the Annual Barangay Youth Investment Program
            (ABYIP). Ensuring every centavo counts for the Batangueño youth.
          </p>
        </section>

        {/* METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
          <MetricCard
            label="Active Projects"
            value="24"
            sub="Cycle 2023-2024"
            accent="border-primary"
          />
          <MetricCard
            label="Ongoing"
            value="8"
            sub="Execution phase"
            valueColor="text-ongoing"
            accent="border-ongoing"
          />
          <MetricCard
            label="Completed"
            value="13"
            sub="Validated records"
            valueColor="text-success"
            accent="border-success"
          />
          <MetricCard
            label="Total ABYIP Budget"
            value="₱4.2M"
            sub="Annual Allocation"
            accent="border-tertiary"
          />
        </div>

        {/* ANALYTICS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-border">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6">
              Fund Distribution
            </h3>
            <div className="h-64">
              <Pie
                data={{
                  labels: [
                    "Youth Dev",
                    "Sports",
                    "Health",
                    "Livelihood",
                    "Env",
                    "Peace",
                    "Arts",
                  ],
                  datasets: [
                    {
                      data: [1, 2, 2, 1, 1, 1, 1],
                      backgroundColor: chartColors,
                      borderWidth: 0,
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: { usePointStyle: true, padding: 20 },
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-border">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6">
              Disbursement Trend (Quarterly)
            </h3>
            <div className="h-64">
              <Bar
                data={{
                  labels: [
                    "Q1 2023",
                    "Q2 2023",
                    "Q3 2023",
                    "Q4 2023",
                    "Q1 2024",
                  ],
                  datasets: [
                    {
                      label: "Disbursed (₱)",
                      data: [320000, 480000, 610000, 890000, 600000],
                      backgroundColor: "#003366",
                      borderRadius: 6,
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { display: false } },
                    y: { border: { display: false } },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
            <h2 className="text-lg font-bold text-primary">Project Registry</h2>
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search by project, barangay..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2 bg-white border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-slate-500 bg-slate-50/80">
                  <th className="px-6 py-4 font-bold">
                    Project Identification
                  </th>
                  <th className="px-6 py-4 font-bold">Location</th>
                  <th className="px-6 py-4 font-bold">Implementation Date</th>
                  <th className="px-6 py-4 font-bold text-right">Budget</th>
                  <th className="px-6 py-4 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map((p, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-primary/2 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-primary">
                        {p.name}
                      </p>
                      <p className="text-xs text-secondary-foreground">
                        {p.category}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-primary-foreground font-medium">
                      {p.barangay}
                    </td>
                    <td className="px-6 py-4 text-sm text-secondary-foreground">
                      {p.date}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-right font-bold text-primary">
                      {p.budget}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  valueColor = "text-primary",
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-colors relative overflow-hidden flex flex-col justify-between">
      <div className={`absolute top-0 left-0 w-full border-t-[3px] ${accent}`}></div>
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 mt-1">
          {label}
        </p>
        <p className={`text-2xl md:text-3xl font-extrabold ${valueColor} tracking-tight`}>
          {value}
        </p>
      </div>
      <p className="text-[10px] text-slate-400 font-medium mt-3 uppercase tracking-wider">
        {sub}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: StatusType }) {
  const config = {
    ongoing: "bg-ongoing/10 text-ongoing border-ongoing/20",
    done: "bg-success/10 text-success border-success/20",
    pending: "bg-pending/10 text-pending border-pending/20",
  };

  const labels = { ongoing: "Ongoing", done: "Completed", pending: "Pending" };

  return (
    <span
      className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest ${config[status] || "bg-slate-100"}`}
    >
      {labels[status] || status}
    </span>
  );
}
