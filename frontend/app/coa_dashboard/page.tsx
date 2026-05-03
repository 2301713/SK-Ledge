"use client";

import { useEffect, useState } from "react";
import SideBar from "@/components/dashboard/SideBar";
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
import { UserAccount } from "./types";
import {
  Calendar,
  Activity,
  TrendingUp,
  CheckSquare,
  FileText,
  AlertCircle,
  CircleAlert,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export default function COADashboard() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // For the overview chart/KPIs
  const pendingApprovalCount = 3;
  const pendingDisbursementCount = 2;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setIsLoading(false);
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, full_name, role_type, barangay")
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError.message);
        }

        if (profileData) {
          setCurrentUser({
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type as "Chairman" | "Treasurer",
            barangay: profileData.barangay || "No Barangay Assigned",
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

  const chartData = {
    labels: ["Approvals", "Disbursements"],
    datasets: [
      {
        label: "Pending Volume",
        data: [pendingApprovalCount, pendingDisbursementCount],
        backgroundColor: ["#003366", "#D4AF37"], // primary and tertiary
        borderRadius: 8,
        barThickness: 48,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#003366",
        padding: 16,
        titleFont: { size: 14, weight: "bold" as const },
        bodyFont: { size: 13 },
        cornerRadius: 12,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: "#94a3b8",
          font: { size: 12, weight: "bold" as const },
        },
        grid: { color: "#f1f5f9", drawTicks: false },
        border: { display: false },
      },
      x: {
        ticks: {
          color: "#64748b",
          font: { size: 12, weight: "bold" as const },
        },
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-tertiary font-black text-3xl shadow-xl shadow-primary/30 mb-6 animate-bounce">
          COA
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Loading Workspace...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-4xl shadow-xl border border-slate-200 p-10 text-center">
          <div className="h-16 w-16 bg-danger/10 text-danger rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">
              <CircleAlert />
            </span>
          </div>
          <h2 className="text-2xl font-black text-primary mb-3 tracking-tight">
            Access Restricted
          </h2>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">
            You do not have the required credentials to view the COA Dashboard.
          </p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="w-full rounded-xl bg-primary py-4 text-sm font-bold text-white transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] selection:bg-tertiary selection:text-primary">
      <SideBar
        userName={currentUser.full_name}
        roleType={currentUser.role_type}
        barangay={currentUser.barangay}
      />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        {/* TOP NAVBAR */}
        <header className="h-24 px-10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-500 uppercase tracking-widest">
            <Calendar className="w-4 h-4 text-tertiary" />
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary/30 transition-all shadow-sm">
              <Activity className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="px-10 pb-12 space-y-8 max-w-[1400px] mx-auto w-full">
          {/* WELCOME BANNER (Massive, engaging) */}
          <section className="bg-slate-900 rounded-[2.5rem] p-12 relative overflow-hidden text-white shadow-xl shadow-slate-900/20 border border-slate-800">
            {/* Abstract Decorative Elements */}
            <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none z-0">
              <div className="absolute -top-32 -right-20 w-[500px] h-[500px] bg-tertiary/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-40 right-20 w-[400px] h-[400px] bg-primary/30 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 w-full lg:w-2/3">
              <p className="text-tertiary font-bold tracking-widest uppercase text-xs mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Action Required
              </p>
              <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
                Commission on Audit <br /> Overview
              </h2>
              <p className="text-white/70 text-lg leading-relaxed max-w-xl">
                There are currently{" "}
                <strong className="text-white">
                  {pendingApprovalCount} pending approvals
                </strong>{" "}
                and{" "}
                <strong className="text-white">
                  {pendingDisbursementCount} pending disbursements
                </strong>{" "}
                across all municipal jurisdictions.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <button className="bg-tertiary text-primary px-8 py-4 rounded-2xl text-sm font-black tracking-wide hover:bg-white hover:shadow-xl hover:shadow-white/10 transition-all active:scale-95 flex items-center gap-3">
                  <CheckSquare className="w-5 h-5" />
                  Review Approvals
                </button>
                <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-2xl text-sm font-bold tracking-wide hover:bg-white/20 transition-all active:scale-95 flex items-center gap-3">
                  <FileText className="w-5 h-5" />
                  Review Disbursements
                </button>
              </div>
            </div>
          </section>

          {/* ASYMMETRICAL CHART & METRICS */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* MAIN CHART CARD */}
            <div className="lg:col-span-2 bg-white rounded-4xl p-8 border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Volume Analysis
                  </h3>
                  <p className="text-2xl font-black text-primary tracking-tight">
                    Pending Requests Overview
                  </p>
                </div>
                <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-500">
                  Last 7 Days
                </div>
              </div>

              <div className="relative flex-1 min-h-[300px] w-full">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* SYSTEM STATS STACK */}
            <div className="flex flex-col gap-8">
              <div className="bg-white rounded-4xl p-8 border border-slate-200 shadow-sm flex-1 flex flex-col justify-center group hover:border-tertiary/50 transition-all relative overflow-hidden">
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-tertiary/10 rounded-full blur-2xl group-hover:bg-tertiary/20 transition-colors pointer-events-none"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-tertiary/20 flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-4xl font-black text-primary tracking-tight mb-1">
                  1,204
                </p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Total Requests YTD
                </p>
              </div>

              <div className="bg-white rounded-4xl p-8 border border-slate-200 shadow-sm flex-1 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg">
                    Last Sync: 2h ago
                  </span>
                </div>
                <p className="text-xl font-black text-primary tracking-tight mb-1">
                  Operational
                </p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  System Status
                </p>
              </div>
            </div>
          </section>

          {/* QUICK FINANCIAL OVERVIEW - HORIZONTAL ROW */}
          <section className="bg-primary rounded-[2.5rem] p-8 md:p-10 border border-primary shadow-xl shadow-primary/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Financial Overview
                </h2>
                <p className="text-xs font-bold text-tertiary uppercase tracking-widest mt-1">
                  Aggregate Municipal Budget
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">
                  Total Budget
                </p>
                <p className="text-3xl font-black text-white tracking-tight">
                  ₱120,000
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">
                  Approved Budget
                </p>
                <p className="text-3xl font-black text-tertiary tracking-tight">
                  ₱45,000
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">
                  Remaining Budget
                </p>
                <p className="text-3xl font-black text-white tracking-tight">
                  ₱75,000
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
