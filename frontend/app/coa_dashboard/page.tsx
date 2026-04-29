"use client";

import { useEffect, useState } from "react";
import SideBar from "@/components/SideBar";
import { supabase } from "@/lib/supabase";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { ApprovalRequest, UserAccount } from "./types";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export default function COADashboard() {
  // AUTH STATE
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // DATA STATE
  const [approvalsData, setApprovalsData] = useState<ApprovalRequest[]>([
    {
      id: 1,
      department: "HR",
      purpose: "Hiring (2 staff)",
      amount: "₱15,000",
      status: "Pending",
    },
    {
      id: 2,
      department: "IT",
      purpose: "Computer Maintenance",
      amount: "₱10,000",
      status: "Pending",
    },
    {
      id: 3,
      department: "Engineering",
      purpose: "Road Repair",
      amount: "₱20,000",
      status: "Pending",
    },
  ]);

  // GET USER DATA
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          console.error("No active user session found.");
          setIsLoading(false);
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("username, role_type, full_name, barangay")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError.message);
        }

        if (profileData) {
          setCurrentUser({
            name: profileData.full_name || profileData.username,
            role: profileData.role_type,
            barangay: profileData.barangay || "N/A",
          });
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const pendingApprovalCount = approvalsData.filter(
    (a) => a.status === "Pending",
  ).length;
  const pendingDisbursementCount = 2;

  // HANDLERS
  const handleApprove = (id: number) => {
    setApprovalsData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Approved" } : item,
      ),
    );
  };

  // CHART CONFIG
  const chartData = {
    labels: ["Approvals", "Disbursements"],
    datasets: [
      {
        label: "Pending Volume",
        data: [pendingApprovalCount, pendingDisbursementCount],
        backgroundColor: ["#0f172a", "#d97706"],
        borderRadius: 6,
        barThickness: 40,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 12,
        titleFont: { family: "Inter, sans-serif", size: 13 },
        bodyFont: { family: "Inter, sans-serif", size: 12 },
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: "#64748b",
          font: { size: 11, weight: 600 },
        },
        grid: { color: "#f1f5f9", drawBorder: false },
      },
      x: {
        ticks: { color: "#64748b", font: { size: 11, weight: 600 } },
        grid: { display: false, drawBorder: false },
      },
    },
  };

  // LOADING STATE
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="h-14 w-14 bg-primary rounded-xl flex items-center justify-center text-tertiary font-black text-3xl shadow-lg shadow-primary/20 mb-6 animate-pulse">
          B
        </div>
        <p className="text-[11px] font-bold text-secondary-foreground uppercase tracking-widest animate-pulse">
          Initializing COA Dashboard...
        </p>
      </div>
    );
  }

  // ERROR / UNAUTHORIZED STATE
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-primary/5 border border-border p-8 text-center">
          <div className="h-12 w-12 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-danger text-xl">⚠️</span>
          </div>
          <h2 className="text-xl font-extrabold text-primary mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-secondary-foreground mb-6">
            You do not have the required credentials to access the Commission on
            Audit dashboard.
          </p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition-all hover:bg-primary/90"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD
  return (
    <div className="flex min-h-screen bg-background selection:bg-tertiary selection:text-primary">
      {/* UNIVERSAL SIDEBAR */}
      <SideBar
        userName={currentUser.name}
        roleType={currentUser.role}
        barangay={currentUser.barangay}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Subtle Background Elements */}
        <div className="absolute top-[-20%] right-[-10%] w-160 h-160 bg-tertiary/5 rounded-full blur-3xl pointer-events-none z-0"></div>

        {/* HEADER */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-border px-8 flex items-center justify-between z-10 shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold text-primary tracking-tight flex items-center gap-2">
              <span className="text-tertiary text-2xl">•</span>
              COA Overview
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground mt-0.5">
              Municipal Budget Monitoring
            </p>
          </div>
          {/* Optional Action Button for COA (e.g., Export Report) */}
          <button className="bg-white border border-border text-primary px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide hover:bg-gray-50 hover:shadow-sm transition-all active:scale-95 flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export Ledger
          </button>
        </header>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 z-10">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* KPI CARDS */}
            <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <MetricCard
                label="Total Budget"
                value="₱120,000"
                accentColor="bg-primary"
              />
              <MetricCard
                label="Approved Budget"
                value="₱45,000"
                accentColor="bg-tertiary"
              />
              <MetricCard
                label="Remaining Budget"
                value="₱75,000"
                accentColor="bg-primary"
              />
              <MetricCard
                label="Pending Approvals"
                value={pendingApprovalCount.toString()}
                accentColor="bg-[#f57f17]" // Warning/Amber
              />
              <MetricCard
                label="Pending Disbursements"
                value={pendingDisbursementCount.toString()}
                accentColor="bg-tertiary"
              />
            </section>

            {/* DASHBOARD GRID (Graph + Side Cards) */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* CHART */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-border shadow-sm">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground mb-6">
                  Budget Action Overview
                </h3>
                <div className="relative h-64 w-full">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </div>

              {/* SIDE INFO */}
              <div className="flex flex-col gap-4">
                <MetricCard
                  label="Total Requests YTD"
                  value="1,204"
                  accentColor="bg-primary"
                />
                <MetricCard
                  label="System Status"
                  value="Operational"
                  valueColor="text-[#2e7d32]" // Green
                  accentColor="bg-[#2e7d32]"
                />
                <MetricCard
                  label="Last Audit Sync"
                  value="2h ago"
                  valueColor="text-primary"
                  accentColor="bg-border"
                />
              </div>
            </section>

            {/* COMBINED TABLES SECTION */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* APPROVALS TABLE */}
              <section className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-border bg-gray-50/50 flex justify-between items-center">
                  <h2 className="text-base font-bold text-primary">
                    Pending Approvals
                  </h2>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                    Action Required
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white border-b border-border">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                          Department
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                          Purpose
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {approvalsData.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-primary/2 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <span className="font-bold text-primary text-sm">
                              {item.department}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-secondary-foreground">
                              {item.purpose}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-primary tracking-tight">
                              {item.amount}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleApprove(item.id)}
                              disabled={item.status === "Approved"}
                              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                                item.status === "Approved"
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                  : "bg-primary text-white hover:bg-primary/90 hover:shadow-md active:scale-95"
                              }`}
                            >
                              {item.status === "Approved"
                                ? "Approved"
                                : "Approve"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* DISBURSEMENTS TABLE */}
              <section className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-border bg-gray-50/50 flex justify-between items-center">
                  <h2 className="text-base font-bold text-primary">
                    Pending Disbursements
                  </h2>
                  <button className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground hover:text-primary transition-colors">
                    View Ledger &rarr;
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white border-b border-border">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                          Project
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                          Department
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground text-right">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      <tr className="hover:bg-primary/2 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="font-bold text-primary text-sm group-hover:text-tertiary transition-colors">
                            Office Supplies
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
                            Admin
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-primary tracking-tight">
                            ₱5,000
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-primary/2 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="font-bold text-primary text-sm group-hover:text-tertiary transition-colors">
                            Fuel Allocation
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
                            Engineering
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-primary tracking-tight">
                            ₱8,000
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- REUSABLE COMPONENTS ---

function MetricCard({
  label,
  value,
  valueColor = "text-primary",
  accentColor = "bg-primary",
}: {
  label: string;
  value: string;
  valueColor?: string;
  accentColor?: string;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-border shadow-sm relative overflow-hidden group flex flex-col justify-center">
      <div
        className={`absolute top-0 left-0 w-1.5 h-full ${accentColor}`}
      ></div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground mb-1 ml-2">
        {label}
      </p>
      <h2
        className={`text-2xl md:text-3xl font-extrabold tracking-tight ml-2 ${valueColor}`}
      >
        {value}
      </h2>
    </div>
  );
}
