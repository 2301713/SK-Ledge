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
import { UserAccount } from "./types";

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
          .select("username, role_type, full_name, barangay")
          .eq("id", user.id)
          .single();

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

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-primary/5 border border-border p-8 text-center">
          <h2 className="text-xl font-extrabold text-primary mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-secondary-foreground mb-6">
            You do not have the required credentials.
          </p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background selection:bg-tertiary selection:text-primary">
      <SideBar
        userName={currentUser.name}
        roleType={currentUser.role}
        barangay={currentUser.barangay}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="absolute top-[-20%] right-[-10%] w-160 h-160 bg-tertiary/5 rounded-full blur-3xl pointer-events-none z-0"></div>

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
        </header>

        <div className="flex-1 overflow-y-auto p-8 z-10">
          <div className="max-w-7xl mx-auto space-y-8">
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
                accentColor="bg-[#f57f17]"
              />
              <MetricCard
                label="Pending Disbursements"
                value={pendingDisbursementCount.toString()}
                accentColor="bg-tertiary"
              />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-border shadow-sm">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground mb-6">
                  Budget Action Overview
                </h3>
                <div className="relative h-64 w-full">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <MetricCard
                  label="Total Requests YTD"
                  value="1,204"
                  accentColor="bg-primary"
                />
                <MetricCard
                  label="System Status"
                  value="Operational"
                  valueColor="text-[#2e7d32]"
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
          </div>
        </div>
      </main>
    </div>
  );
}

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
    <div className="bg-white p-5 rounded-2xl border border-border shadow-sm relative overflow-hidden flex flex-col justify-center">
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
