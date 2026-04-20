"use client";

import { useState } from "react";
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

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
);

// TYPES & INTERFACES
type StatusType = "ongoing" | "done" | "pending";

interface Project {
  name: string;
  barangay: string;
  chair: string;
  date: string;
  budget: string;
  category: string;
  status: StatusType;
}

// SAMPLE DATA
const projectsData: Project[] = [
  {
    name: "Youth Leadership Summit",
    barangay: "Sta. Cruz",
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
    barangay: "Poblacion",
    chair: "A. Cruz",
    date: "Jan 2024",
    budget: "₱45,000",
    category: "Health",
    status: "ongoing",
  },
  {
    name: "Anti-Drug Campaign Seminar",
    barangay: "Maligaya",
    chair: "C. Garcia",
    date: "Dec 2023",
    budget: "₱30,000",
    category: "Peace & Order",
    status: "done",
  },
  {
    name: "Tree Planting & Clean-Up Drive",
    barangay: "Rizal",
    chair: "L. Torres",
    date: "Dec 2023",
    budget: "₱25,000",
    category: "Environment",
    status: "done",
  },
  {
    name: "Nutrition & Health Awareness",
    barangay: "Pag-asa",
    chair: "F. Ramos",
    date: "Oct 2023",
    budget: "₱35,000",
    category: "Health",
    status: "done",
  },
  {
    name: "Kabataan Film Festival",
    barangay: "Maliwanag",
    chair: "G. Lim",
    date: "Oct 2023",
    budget: "₱55,000",
    category: "Arts & Culture",
    status: "pending",
  },
  {
    name: "Youth Entrepreneurship Forum",
    barangay: "Sta. Cruz",
    chair: "J. Reyes",
    date: "Sep 2023",
    budget: "₱68,000",
    category: "Livelihood",
    status: "ongoing",
  },
  {
    name: "Sports Equipment Procurement",
    barangay: "San Jose",
    chair: "M. Santos",
    date: "Aug 2023",
    budget: "₱50,000",
    category: "Sports & Recreation",
    status: "pending",
  },
];

export default function PublicDashboard() {
  // STATES
  const [searchQuery, setSearchQuery] = useState("");

  // FILTER LOGIC
  const filteredProjects = projectsData.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.barangay.toLowerCase().includes(q) ||
      p.chair.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  // STATUS BADGE STYLES
  const getStatusStyles = (status: StatusType) => {
    switch (status) {
      case "ongoing":
        return "bg-blue-100 text-blue-800";
      case "done":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: StatusType) => {
    switch (status) {
      case "ongoing":
        return "Ongoing";
      case "done":
        return "Completed";
      case "pending":
        return "Pending Approval";
      default:
        return status;
    }
  };

  // CHART CONFIGS
  const pieData = {
    labels: [
      "Youth Development",
      "Sports",
      "Health",
      "Livelihood",
      "Environment",
      "Peace & Order",
      "Arts & Culture",
    ],
    datasets: [
      {
        data: [1, 2, 2, 1, 1, 1, 1],
        backgroundColor: [
          "#3b82f6",
          "#10b981",
          "#f59e0b",
          "#ec4899",
          "#06b6d4",
          "#f97316",
          "#84cc16",
        ],
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  const barData = {
    labels: ["Q1 2023", "Q2 2023", "Q3 2023", "Q4 2023", "Q1 2024"],
    datasets: [
      {
        label: "Disbursed (₱)",
        data: [320000, 480000, 610000, 890000, 600000],
        backgroundColor: "#3b82f6",
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* NAV */}
      <nav className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold">SK-Ledge</h1>
          <p className="text-xs text-gray-500">
            Sangguniang Kabataan Fund Transparency Portal
          </p>
        </div>
        <Link
          href="/login"
          className="bg-blue-600 text-white border-none rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Login
        </Link>
      </nav>

      {/* MAIN */}
      <main className="max-w-275 mx-auto p-6">
        {/* METRIC CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <MetricCard
            label="Total Projects"
            value="24"
            sub="ABYIP 2023 – 2024"
          />
          <MetricCard
            label="Ongoing"
            value="8"
            sub="currently active"
            valueColor="text-yellow-600"
          />
          <MetricCard
            label="Completed"
            value="13"
            sub="fully documented"
            valueColor="text-green-600"
          />
          <MetricCard
            label="Total ABYIP Budget"
            value="₱4.2M"
            sub="10% SK fund allocation"
          />
          <MetricCard
            label="Total Disbursed"
            value="₱2.9M"
            sub="69% of allocation"
          />
          <MetricCard label="Barangays" value="10" sub="enrolled in SK-Ledge" />
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Projects by Fund Category
            </h3>
            <div className="relative w-full h-55">
              <Pie
                data={pieData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "bottom" } },
                }}
              />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Disbursement per Quarter
            </h3>
            <div className="relative w-full h-55">
              <Bar
                data={barData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-200 gap-3">
            <h2 className="text-sm font-semibold">SK Project List</h2>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 w-full sm:w-62.5"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Project Name
                  </th>
                  <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Barangay
                  </th>
                  <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Chairperson
                  </th>
                  <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((p, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3 text-sm">{p.name}</td>
                      <td className="p-3 text-sm">{p.barangay}</td>
                      <td className="p-3 text-sm">{p.chair}</td>
                      <td className="p-3 text-sm">{p.date}</td>
                      <td className="p-3 text-sm">{p.budget}</td>
                      <td className="p-3 text-sm text-gray-600">
                        {p.category}
                      </td>
                      <td className="p-3 text-sm">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(p.status)}`}
                        >
                          {getStatusLabel(p.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-6 text-center text-sm text-gray-500"
                    >
                      {`No projects found matching "${searchQuery}"`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-gray-50 border-top border-gray-200 text-xs text-gray-500">
            Showing {filteredProjects.length} project(s)
          </div>
        </div>
      </main>
    </div>
  );
}

// REUSABLE COMPONENT FOR METRIC CARDS
function MetricCard({
  label,
  value,
  sub,
  valueColor = "text-gray-900",
}: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="text-[11px] text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </div>
      <div className={`text-2xl font-semibold ${valueColor}`}>{value}</div>
      <div className="text-[11px] text-gray-500 mt-1">{sub}</div>
    </div>
  );
}
