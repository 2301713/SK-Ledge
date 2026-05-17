"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import { supabase } from "@/lib/supabase";
import BroadcastMemoModal from "@/components/dashboard/BroadcastMemoModal";
import { useAuthStore } from "@/lib/useAuthStore";
import {
  Building2,
  Megaphone,
  PieChart,
  Activity,
  FileText,
  Calendar,
  ChevronRight,
  TrendingUp,
  CircleAlert,
} from "lucide-react";

export default function SKFederationDashboard() {
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

  // 1. AUTHENTICATION & ROLE PROTECTION
  useEffect(() => {
    const fetchUserProfile = async () => {
      // If user data is already loaded from login, skip auth check
      if (currentUser && currentUser.role_type === "SK_Federation") {
        setIsLoading(false);
        return;
      }

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          console.log("No authenticated user, redirecting to login");
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
          setIsLoading(false);
          setTimeout(() => router.push("/login"), 100);
          return;
        }

        if (profileData) {
          if (profileData.role_type !== "SK_Federation") {
            console.warn("Unauthorized: User is not an SK Federation Official");
            setIsLoading(false);
            setTimeout(() => router.push("/unauthorized"), 100);
            return;
          }

          setCurrentUser({
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type,
            barangay: profileData.barangay || "City Wide",
          });
          setIsLoading(false);
        } else {
          console.warn("No profile data found");
          setIsLoading(false);
          setTimeout(() => router.push("/login"), 100);
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
  }, [setCurrentUser, setIsLoading, router]);

  // UTILITY
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  // LOADING STATE
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-tertiary font-black text-xl shadow-xl shadow-primary/30 mb-6 animate-bounce">
          FED
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Loading Dashboard...
        </p>
      </div>
    );
  }

  // UNAUTHORIZED / NULL STATE
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
            You do not have the required credentials to view the SK Federation
            Dashboard.
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
    <div className="flex min-h-screen bg-secondary selection:bg-tertiary selection:text-primary">
      {/* SIDEBAR */}
      <SideBar
        userName={currentUser.full_name}
        roleType={currentUser.role_type}
        barangay={currentUser.barangay}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        {/* TOP NAVBAR */}
        <header className="h-24 px-10 flex items-center justify-between shrink-0 bg-white/50 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-20">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Federation Command
            </h1>
            <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-secondary text-primary font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              <Megaphone className="w-4 h-4" /> Broadcast Memo
            </button>
          </div>
        </header>

        <div className="px-10 py-10 space-y-8 max-w-400 mx-auto w-full">
          {/* CITY-WIDE ANALYTICS GRID */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Metric 1 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 bg-secondary text-primary text-[10px] font-black uppercase tracking-widest rounded-lg">
                  100% Active
                </span>
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900 tracking-tight">
                  24
                </p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Constituent Barangays
                </p>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900 tracking-tight">
                  87
                </p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  City-Wide Projects
                </p>
              </div>
            </div>

            {/* Metric 3 (Spans 2 columns for Budget) */}
            <div className="lg:col-span-2 bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-transform group-hover:scale-110 duration-700"></div>
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-primary" /> Total City
                    Youth Budget
                  </h3>
                </div>
                <div>
                  <p className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                    {formatCurrency(35000000)}
                  </p>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-4">
                    <div className="h-full bg-primary rounded-full w-[45%] relative">
                      <div className="absolute right-0 top-0 bottom-0 w-10 bg-linear-to-r from-transparent to-white/30 rounded-full"></div>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-3">
                    45% Utilized • FY 2026
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SPLIT SECTION: OVERSIGHT & COMMUNICATION */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT: Barangay Directory / Leaderboard (Takes up 2/3) */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Barangay Oversight
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Monitor constituent performance
                  </p>
                </div>
                <button className="text-xs font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-widest flex items-center gap-1 bg-secondary px-4 py-2 rounded-xl">
                  View Directory <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Mock Table/List */}
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-slate-300 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 font-black shadow-sm group-hover:text-primary transition-colors">
                        B{i}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          Barangay{" "}
                          {i === 1
                            ? "San Jose"
                            : i === 2
                              ? "Mabini"
                              : "Poblacion"}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Chairperson Cruz
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-secondary text-primary mb-1">
                        High Compliance
                      </span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        12 Active Projects
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Announcements & Shared Resources (Takes up 1/3) */}
            <div className="flex flex-col gap-8">
              {/* Broadcasts */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-tertiary/20 flex items-center justify-center text-tertiary">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Active Broadcasts
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-secondary border border-secondary/70 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary"></div>
                    <p className="text-xs font-black text-primary mb-1">
                      Q3 Liquidation Deadline
                    </p>
                    <p className="text-[10px] font-medium text-primary/80 leading-relaxed">
                      All SK Treasurers must submit their reports to the BMO
                      portal by Friday.
                    </p>
                  </div>
                </div>
              </div>

              {/* Resource Vault Quick Access */}
              <div className="bg-linear-to-br from-primary to-tertiary rounded-3xl shadow-lg p-8 relative overflow-hidden group cursor-pointer hover:shadow-xl hover:shadow-tertiary/20 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>
                <FileText className="w-8 h-8 text-white/50 mb-4" />
                <h2 className="text-lg font-black text-white tracking-tight mb-1">
                  Federation Vault
                </h2>
                <p className="text-white/70 font-medium text-xs mb-6">
                  Access standard LGU templates, CBYDP forms, and approved
                  resolutions.
                </p>
                <button className="w-full py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                  Open Vault <TrendingUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
      <BroadcastMemoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitSuccess={() => {
          console.log("Proposal successfully dispatched!");
          // Optional: You could add a toast notification here
        }}
      />
    </div>
  );
}
