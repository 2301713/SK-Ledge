"use client";

import { useEffect, useRef } from "react";
import SideBar from "@/components/dashboard/SideBar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/useAuthStore";
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
  const { currentUser, isLoading, setCurrentUser, setIsLoading } =
    useAuthStore();
  const router = useRouter();
  const authAttemptedRef = useRef(false);

  // For the overview chart/KPIs
  const pendingApprovalCount = 3;
  const pendingDisbursementCount = 2;

  useEffect(() => {
    const fetchUserProfile = async () => {
      // If user data is already loaded from login, skip auth check
      if (currentUser && currentUser.role_type === "COA") {
        setIsLoading(false);
        return;
      }

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push("/login");
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            "id, username, full_name, role_type, barangay,email, approval_status",
          )
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError.message);
          setIsLoading(false);
          setTimeout(() => router.push("/login"), 100);
          return;
        }

        if (profileData) {
          // Verify that this user is actually a COA
          if (profileData.role_type !== "COA") {
            console.warn("Unauthorized access: User is not a COA");
            setIsLoading(false);
            setTimeout(() => router.push("/unauthorized"), 100);
            return;
          }

          setCurrentUser({
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type as "COA",
            barangay: profileData.barangay || "No Barangay Assigned",
            email: profileData.email,
            approval_status: profileData.approval_status,
          });
        } else {
          // No profile data found
          console.warn("No profile data found for user");
          setIsLoading(false);
          setTimeout(() => router.push("/login"), 100);
          return;
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
        setIsLoading(false);
        setTimeout(() => router.push("/login"), 100);
      }
    };

    // Only fetch once per component mount
    if (!authAttemptedRef.current) {
      authAttemptedRef.current = true;
      fetchUserProfile();
    }
  }, [currentUser, setCurrentUser, setIsLoading, router]);

  const chartData = {
    labels: ["Approvals", "Disbursements"],
    datasets: [
      {
        label: "Pending Volume",
        data: [pendingApprovalCount, pendingDisbursementCount],
        backgroundColor: ["#003366", "#D4AF37"],
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
        <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-tertiary font-black text-xl shadow-xl shadow-primary/30 mb-6 animate-bounce">
          COA
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Loading Dashboard...
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

        <div className="px-10 pb-12 space-y-8 max-w-350 mx-auto w-full">
          {/* WELCOME BANNER (Compact) */}
          <section className="bg-slate-900 rounded-2xl p-6 md:p-8 relative overflow-hidden text-white shadow-md shadow-slate-900/10 border border-slate-800">
            {/* Decorative accents (smaller) */}
            <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none z-0">
              <div className="absolute -top-20 -right-12 w-28 h-28 bg-tertiary/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 right-12 w-20 h-20 bg-primary/30 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 w-full lg:w-4/5">
              <p className="text-tertiary font-semibold uppercase tracking-wider text-[11px] mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Action Required
              </p>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-2 leading-snug">
                Commission on Audit Overview
              </h2>
              <p className="text-white/70 text-sm leading-snug max-w-2xl">
                There are{" "}
                <strong className="text-white">
                  {pendingApprovalCount} pending approvals
                </strong>{" "}
                and{" "}
                <strong className="text-white">
                  {pendingDisbursementCount} pending disbursements
                </strong>{" "}
                across municipal jurisdictions.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button className="bg-tertiary text-primary px-4 py-2 rounded-xl text-xs font-bold hover:bg-white hover:shadow transition-all active:scale-95 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  Review Approvals
                </button>
                <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-white/15 transition-all active:scale-95 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Review Disbursements
                </button>
              </div>
            </div>
          </section>

          {/* ASYMMETRICAL CHART & METRICS (Compact) */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* MAIN CHART CARD (compact) */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Volume Analysis
                  </h3>
                  <p className="text-lg md:text-xl font-extrabold text-primary tracking-tight">
                    Pending Requests
                  </p>
                </div>
                <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-semibold text-slate-500">
                  Last 7d
                </div>
              </div>

              <div className="relative flex-1 min-h-40 w-full">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* SYSTEM STATS STACK (compact) */}
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 w-full">
                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-tertiary/20 flex items-center justify-center text-tertiary">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-primary">1,204</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                      Total Requests YTD
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center text-success">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-primary">
                      Operational
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                      Last Sync: 2h ago
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-primary">5</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                      Urgent Flags
                    </p>
                  </div>
                </div>
              </div>

              {/* Compact financial tiles (styled like other stat cards) */}
              <div>
                <div className="flex flex-col gap-2">
                  <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-tertiary/20 flex items-center justify-center text-tertiary">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-extrabold text-primary">
                        ₱120,000
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                        Total Budget
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center text-success">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-extrabold text-primary">
                        ₱45,000
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                        Approved
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-extrabold text-primary">
                        ₱75,000
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                        Remaining
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
