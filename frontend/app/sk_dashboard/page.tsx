"use client";

import { useEffect, useState } from "react";
import SideBar from "@/components/dashboard/SideBar";
import { UserAccount } from "./types";
import { INITIAL_PROJECTS } from "@/lib/dummyData";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import ProposeProjectModal from "@/components/dashboard/ProposeProjectModal"; // Make sure this path is correct!
import {
  Plus,
  Wallet,
  TrendingUp,
  ChevronRight,
  Activity,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
  Folder,
  CircleAlert,
} from "lucide-react";

export default function SKDashboard() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
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
          .select("id, username, full_name, role_type, barangay")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError.message);
        }

        if (profileData) {
          if (
            profileData.role_type !== "SK_Chairperson" &&
            profileData.role_type !== "SK_Treasurer"
          ) {
            console.warn("Unauthorized access: User is not an SK Official");
            router.push("/unauthorized");
            return;
          }

          setCurrentUser({
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type,
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
  }, [router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-tertiary font-black text-3xl shadow-xl shadow-primary/30 mb-6 animate-bounce">
          SK
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
            You do not have the required credentials or an active session to
            view this official dashboard.
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

  // Calculate some dummy metrics for the UI
  const totalAllocated = 1250000;
  const totalSpent = 165000;
  const percentageSpent = (totalSpent / totalAllocated) * 100;

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
          {/* WELCOME BANNER (Massive, engaging) */}
          <section className="bg-primary rounded-[2.5rem] p-12 relative overflow-hidden text-white shadow-xl shadow-primary/20 border border-primary">
            {/* Abstract Decorative Elements */}
            <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none z-0">
              <div className="absolute -top-32 -right-20 w-125 h-125 bg-white/5 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-40 right-20 w-100 h-100 bg-tertiary/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 w-full lg:w-2/3">
              <p className="text-tertiary font-bold tracking-widest uppercase text-xs mb-3">
                Barangay {currentUser.barangay}
              </p>
              <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
                Welcome back, <br /> {currentUser.full_name.split(" ")[0]}!
              </h2>
              <p className="text-white/70 text-lg leading-relaxed max-w-xl">
                You have{" "}
                <strong className="text-white">
                  3 projects pending approval
                </strong>{" "}
                and the fiscal year budget is currently operating at optimal
                capacity.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 text-white px-8 py-4 rounded-2xl text-sm font-black tracking-wide hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-3"
                >
                  <Plus className="w-5 h-5" />
                  Propose New Project
                </button>
                <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-2xl text-sm font-bold tracking-wide hover:bg-white/20 transition-all active:scale-95 flex items-center gap-3">
                  <FileText className="w-5 h-5" />
                  View Ledger
                </button>
              </div>
            </div>
          </section>

          {/* METRICS GRID */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LARGE BUDGET CARD (Span 2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-4xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Total Allocated Budget (FY 2024)
                  </h3>
                  <p className="text-4xl md:text-5xl font-black text-primary tracking-tight">
                    {formatCurrency(totalAllocated)}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                  <Wallet className="w-6 h-6 text-tertiary" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-3">
                  <span className="text-sm font-bold text-slate-600">
                    Budget Utilization
                  </span>
                  <span className="text-xl font-black text-primary">
                    {percentageSpent.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                  <div
                    className="h-full bg-primary rounded-full relative"
                    style={{ width: `${percentageSpent}%` }}
                  >
                    <div className="absolute right-0 top-0 bottom-0 w-10 bg-linear-to-r from-transparent to-white/30 rounded-full"></div>
                  </div>
                </div>
                <div className="mt-3 flex justify-between text-xs font-bold text-slate-400">
                  <span>{formatCurrency(totalSpent)} Spent</span>
                  <span>
                    {formatCurrency(totalAllocated - totalSpent)} Remaining
                  </span>
                </div>
              </div>
            </div>

            {/* QUICK STATS STACK */}
            <div className="flex flex-col gap-8">
              <div className="bg-white rounded-4xl p-8 border border-slate-200 shadow-sm flex-1 flex flex-col justify-center group hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="px-3 py-1 bg-success/10 text-success text-[10px] font-black uppercase tracking-widest rounded-lg">
                    On Track
                  </span>
                </div>
                <p className="text-3xl font-black text-primary tracking-tight mb-1">
                  12
                </p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Active Projects
                </p>
              </div>

              <div className="bg-slate-900 rounded-4xl p-8 shadow-sm flex-1 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-tertiary/20 rounded-full blur-2xl group-hover:bg-tertiary/40 transition-colors"></div>
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-tertiary">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-black text-white tracking-tight mb-1 relative z-10">
                  4
                </p>
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest relative z-10">
                  Awaiting Approval
                </p>
              </div>
            </div>
          </section>

          {/* CARD-ROW LEDGER LIST */}
          <section className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-black text-primary tracking-tight">
                  Active Proposals
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Recent entries in the ledger
                </p>
              </div>
              <button className="text-xs font-black text-primary hover:text-tertiary transition-colors uppercase tracking-widest flex items-center gap-1 bg-slate-50 px-4 py-2 rounded-xl">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {INITIAL_PROJECTS.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-5 md:p-6 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-2xl transition-all group gap-4"
                >
                  <div className="flex items-center gap-5 md:w-1/3">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shrink-0 shadow-sm">
                      <Folder className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-black text-primary text-base group-hover:text-tertiary transition-colors leading-tight mb-1">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        ID: PRJ-{p.id.padStart(4, "0")}
                      </p>
                    </div>
                  </div>

                  <div className="md:w-1/4">
                    <span className="inline-flex px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-500 shadow-sm">
                      {p.category}
                    </span>
                  </div>

                  <div className="md:w-1/4">
                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                        p.status === "Approved"
                          ? "bg-success/10 text-success"
                          : p.status === "Pending"
                            ? "bg-pending/10 text-pending"
                            : "bg-danger/10 text-danger"
                      }`}
                    >
                      {p.status === "Approved" && (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      {p.status === "Pending" && (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      {p.status}
                    </span>
                  </div>

                  <div className="text-left md:text-right md:w-1/4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Budget
                    </p>
                    <span className="font-black text-primary text-lg tracking-tight">
                      {formatCurrency(p.budget)}
                    </span>
                  </div>
                </div>
              ))}

              {INITIAL_PROJECTS.length === 0 && (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                  <Folder className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-sm font-bold text-slate-500">
                    No active projects found.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
        <ProposeProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmitSuccess={() => {
            console.log("Proposal successfully dispatched!");
          }}
        />
      </main>
    </div>
  );
}
