"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/SideBar";
import { useAuthStore } from "@/lib/useAuthStore";
import { INITIAL_PROJECTS } from "@/lib/dummyData";
import { supabase } from "@/lib/supabase";
import {
  ShieldCheck,
  MapPin,
  History,
  FileText,
  CheckCircle2,
  XCircle,
  CircleAlert,
} from "lucide-react";

export default function BMODashboard() {
  const { currentUser, isLoading, setCurrentUser, setIsLoading } =
    useAuthStore();
  const router = useRouter();
  const authAttemptedRef = useRef(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      // If user data is already loaded from login, skip auth check
      if (currentUser && currentUser.role_type === "BMO") {
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
          return;
        }

        if (profileData) {
          if (profileData.role_type !== "BMO") {
            console.warn("Unauthorized access: User is not a BMO member.");
            setIsLoading(false);
            router.push("/unauthorized");
            return;
          }

          setCurrentUser({
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type as "BMO",
            barangay: profileData.barangay || "No Barangay Assigned",
            email: profileData.email,
            approval_status: profileData.approval_status,
          });
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
        setIsLoading(false);
      }
    };

    // Only fetch once per component mount
    if (!authAttemptedRef.current) {
      authAttemptedRef.current = true;
      fetchUserProfile();
    }
  }, [router, setCurrentUser, setIsLoading, currentUser]);

  const pendingCount = INITIAL_PROJECTS.filter(
    (p) => p.status === "Pending",
  ).length;

  const totalValue = INITIAL_PROJECTS.reduce(
    (acc, curr) => acc + curr.budget,
    0,
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-tertiary font-black text-xl shadow-xl shadow-primary/30 mb-6 animate-bounce">
          BMO
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Loading Dashboard...
        </p>
      </div>
    );
  }

  // Prevent rendering if currentUser failed to load
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
            You do not have the required credentials to view the BMO Dashboard.
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
      <Sidebar
        userName={currentUser.full_name}
        roleType={currentUser.role_type}
      />

      <main className="flex-1 p-10 overflow-y-auto">
        {/* 1. HEADER SECTION & HIGH-LEVEL METRICS */}
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-primary tracking-tight">
              BMO Overview
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Welcome back,{" "}
              <span className="text-primary font-bold border-b-2 border-tertiary pb-0.5">
                {currentUser.full_name}
              </span>
            </p>
          </div>

          <div className="hidden md:block text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              System Access
            </p>
            <p className="text-sm font-bold text-slate-600">
              Authorized Personnel Only
            </p>
          </div>
        </header>

        {/* WELCOME BANNER (Compact, engaging) */}
        <section className="relative overflow-hidden rounded-4xl border border-primary/30 bg-primary/95 p-6 md:p-8 text-white shadow-lg shadow-primary/15 mb-10">
          <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute -top-20 -right-12 w-24 h-24 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-28 right-12 w-20 h-20 bg-tertiary/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.9fr)] items-start">
            <div className="space-y-4">
              <p className="text-tertiary font-semibold uppercase tracking-[0.3em] text-[10px]">
                Barangay {currentUser.barangay}
              </p>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-snug">
                Welcome back, <br /> {currentUser.full_name.split(" ")[0]}!
              </h2>
              <p className="max-w-xl text-sm text-white/80 leading-relaxed">
                You have{" "}
                <strong className="text-white">
                  1 project pending approval
                </strong>
                , and the current budget is in a healthy position.
              </p>
            </div>
          </div>
        </section>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {/* Card 1: Pending Alignment */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="absolute inset-y-0 left-0 w-1 bg-tertiary"></div>
            <div className="flex items-start justify-between gap-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pending Alignment
              </p>
              {pendingCount > 0 && (
                <span className="relative inline-flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </div>
            <h2 className="mt-4 text-4xl font-black text-[#0B3B78] tracking-tight">
              {pendingCount}
            </h2>
            <p className="mt-2 text-xs uppercase tracking-wider text-slate-400">
              Requests awaiting review
            </p>
          </div>

          {/* Card 2: Total Managed */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Managed
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-xl font-bold text-[#0B3B78]">₱</span>
              <h2 className="text-4xl font-black text-[#0B3B78] tracking-tight">
                {totalValue.toLocaleString()}
              </h2>
            </div>
            <p className="mt-2 text-xs uppercase tracking-wider text-slate-400">
              Overall LGU Youth Budget
            </p>
          </div>

          {/* Card 3: System Status */}
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm transition hover:shadow-md">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Utilization Rate
            </p>
            <div className="mt-4">
              <div className="flex items-end justify-between gap-2">
                <h2 className="text-4xl font-black text-primary tracking-tight">
                  68%
                </h2>
                <span className="rounded-full bg-tertiary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-tertiary">
                  Live
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[68%] rounded-full bg-green-500 transition-all"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* 2. THE REVIEW QUEUE (ACTION CENTER) - Main Content */}
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-black text-primary">
                  Project Review Queue
                </h3>
                <button className="text-xs font-bold text-primary bg-secondary px-4 py-2 rounded-full hover:bg-slate-100">
                  View All Pipeline
                </button>
              </div>
              <div className="p-0">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                    <tr>
                      <th className="px-8 py-4">Project / Barangay</th>
                      <th className="px-8 py-4">Requested</th>
                      <th className="px-8 py-4 text-center">Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {/* Map your incoming proposals here */}
                    <tr className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <p className="font-bold text-slate-900 text-sm">
                          Youth Sports Program
                        </p>
                        <p className="text-xs text-slate-400">
                          Barangay San Miguel
                        </p>
                      </td>
                      <td className="px-8 py-6 font-bold text-primary">
                        ₱150,000
                      </td>
                      <td className="px-8 py-6 flex justify-center gap-2">
                        <button className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all">
                          <CheckCircle2 size={18} />
                        </button>
                        <button className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all">
                          <XCircle size={18} />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. LIQUIDATION & DOCUMENT VAULT */}
            <div className="bg-primary p-8 rounded-[2.5rem] shadow-xl text-white">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="text-tertiary" />
                <h3 className="text-xl font-black tracking-tight">
                  Document Verification Vault
                </h3>
              </div>
              <div className="bg-white/5 rounded-3xl p-6 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <FileText className="text-tertiary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm tracking-tight">
                      Q2_Liquidation_Report.pdf
                    </p>
                    <p className="text-[10px] text-slate-300 uppercase font-medium tracking-wider">
                      Awaiting BMO Verification
                    </p>
                  </div>
                </div>
                <button className="px-6 py-2 bg-tertiary text-primary font-bold rounded-xl text-sm hover:scale-103 transition-transform cursor-pointer">
                  Open Vault
                </button>
              </div>
            </div>
          </section>

          {/* 3 & 5. SIDEBAR MONITORING (Directory & Audit) */}
          <section className="space-y-8">
            {/* 3. Barangay Directory */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-lg font-black text-primary mb-6 flex items-center gap-2">
                <MapPin size={18} className="text-tertiary" /> Barangay
                Directory
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-sm font-bold text-slate-700">
                    San Miguel
                  </span>
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-sm font-bold text-slate-700">
                    Poblacion Uno
                  </span>
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                </div>
              </div>
            </div>

            {/* 5. Audit Trail */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-lg font-black text-primary mb-6 flex items-center gap-2">
                <History size={18} className="text-tertiary" /> Compliance
                Ledger
              </h3>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.25 before:w-0.5 before:bg-slate-100">
                <div className="relative pl-8">
                  <div className="absolute left-0 top-1 w-5 h-5 bg-white border-2 border-green-500 rounded-full z-10"></div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    BMO Approved Project Alignment
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase font-medium">
                    2 mins ago
                  </p>
                </div>
                <div className="relative pl-8">
                  <div className="absolute left-0 top-1 w-5 h-5 bg-white border-2 border-slate-200 rounded-full z-10"></div>
                  <p className="text-xs font-bold text-slate-500 leading-tight">
                    New Liquidation Uploaded
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase font-medium">
                    1 hour ago
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Subtle Bottom Accent */}
        <div className="mt-12 opacity-30 border-t border-slate-200 pt-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] text-center">
            SK-Ledge Smart Auditing System • Fiscal Year 2026
          </p>
        </div>
      </main>
    </div>
  );
}
