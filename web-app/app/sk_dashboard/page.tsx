"use client";

import { useEffect, useRef } from "react";
import SideBar from "@/components/dashboard/SideBar";
import { INITIAL_PROJECTS } from "@/lib/dummyData";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/useAuthStore";
import ProposeProjectModal from "@/components/dashboard/ProposeProjectModal";
import {
  Plus,
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
  const {
    currentUser,
    isLoading,
    setCurrentUser,
    setIsLoading,
    isModalOpen,
    setIsModalOpen,
  } = useAuthStore();
  const router = useRouter();
  const authAttemptedRef = useRef(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      // If user data is already loaded from login, skip auth check
      if (
        currentUser &&
        (currentUser.role_type === "SK_Chairperson" ||
          currentUser.role_type === "SK_Treasurer")
      ) {
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
            "id, username, full_name, role_type, barangay, email, approval_status",
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
          if (
            profileData.role_type !== "SK_Chairperson" &&
            profileData.role_type !== "SK_Treasurer"
          ) {
            console.warn("Unauthorized access: User is not an SK Official");
            setIsLoading(false);
            setTimeout(() => router.push("/unauthorized"), 100);
            return;
          }

          setCurrentUser({
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type,
            barangay: profileData.barangay || "No Barangay Assigned",
            email: profileData.email,
            approval_status: profileData.approval_status,
          });
        } else {
          console.warn("No profile data found");
          setIsLoading(false);
          setTimeout(() => router.push("/login"), 100);
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
        setIsLoading(false);
        setTimeout(() => router.push("/login"), 100);
      } finally {
        // Only set loading to false if we have a valid user
        // Note: Loading is already set to false in error cases above
      }
    };

    // Only fetch once per component mount
    if (!authAttemptedRef.current) {
      authAttemptedRef.current = true;
      fetchUserProfile();
    }
  }, [setCurrentUser, setIsLoading, router, currentUser]);

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

        <div className="px-8 pb-12 space-y-8 max-w-7xl mx-auto w-full">
          {/* WELCOME BANNER (Compact, engaging) */}
          <section className="bg-primary rounded-4xl p-8 md:p-10 relative overflow-hidden text-white shadow-xl shadow-primary/20 border border-primary">
            {/* Abstract Decorative Elements */}
            <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none z-0">
              <div className="absolute -top-28 -right-16 w-28 h-28 bg-white/5 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-32 right-16 w-24 h-24 bg-tertiary/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)] items-center">
              <div>
                <p className="text-tertiary font-bold tracking-widest uppercase text-[11px] mb-3">
                  Barangay {currentUser.barangay}
                </p>
                <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight leading-tight">
                  Welcome back, <br /> {currentUser.full_name.split(" ")[0]}!
                </h2>
                <p className="text-white/75 text-base md:text-lg leading-relaxed max-w-xl">
                  You have{" "}
                  <strong className="text-white">
                    3 projects pending approval
                  </strong>{" "}
                  and the fiscal year budget is currently operating at optimal
                  capacity.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-sm font-black tracking-wide hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Propose New Project
                  </button>
                  <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-2xl text-sm font-bold tracking-wide hover:bg-white/20 transition-all active:scale-95 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    View Ledger
                  </button>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-4xl border border-white/15 bg-white/10 p-5 shadow-inner shadow-white/10">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-3">
                    Current Fiscal Summary
                  </p>
                  <p className="text-3xl font-black text-white">
                    {formatCurrency(totalAllocated)}
                  </p>
                  <p className="text-sm text-white/75 mt-2">
                    {percentageSpent.toFixed(0)}% used •{" "}
                    {formatCurrency(totalAllocated - totalSpent)} remaining
                  </p>
                </div>
                <div className="rounded-4xl border border-white/15 bg-white/10 p-5 shadow-inner shadow-white/10">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-3">
                    Approval Queue
                  </p>
                  <p className="text-3xl font-black text-white">4 pending</p>
                  <p className="text-sm text-white/75 mt-2">
                    Projects in the review queue are ready for your next action.
                  </p>
                </div>
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
