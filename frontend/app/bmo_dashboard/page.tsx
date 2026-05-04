"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/SideBar";
import { UserAccount } from "./types";
import { INITIAL_PROJECTS } from "@/lib/dummyData";
import { supabase } from "@/lib/supabase";
import {
  ShieldCheck,
  MapPin,
  History,
  FileText,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function BMODashboard() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
          if (profileData.role_type !== "BMO") {
            console.warn("Unauthorized access: User is not a BMO");
            router.push("/unauthorized");
            return;
          }

          setCurrentUser({
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type as "BMO",
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

  const pendingCount = INITIAL_PROJECTS.filter(
    (p) => p.status === "Pending",
  ).length;

  const totalValue = INITIAL_PROJECTS.reduce(
    (acc, curr) => acc + curr.budget,
    0,
  );

  // Show a loading state while fetching from Supabase
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 bg-primary rounded-full animate-pulse"></div>
      </div>
    );
  }

  // Prevent rendering if currentUser failed to load
  if (!currentUser) return null;

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
            <h1 className="text-4xl font-black text-[#0B3B78] tracking-tight">
              BMO Overview
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Welcome back,{" "}
              <span className="text-[#0B3B78] font-bold border-b-2 border-tertiary pb-0.5">
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

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Card 1: Pending Alignment */}
          <div className="relative group bg-white p-8 rounded-4xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden transition-all hover:shadow-xl">
            <div className="absolute top-0 left-0 w-2 h-full bg-tertiary"></div>
            <div className="flex justify-between items-start">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Pending Alignment
              </p>
              {pendingCount > 0 && (
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </div>
            <h2 className="text-5xl font-black text-[#0B3B78] mt-4 tracking-tighter">
              {pendingCount}
            </h2>
            <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase">
              Requests awaiting review
            </p>
          </div>

          {/* Card 2: Total Managed */}
          <div className="bg-white p-8 rounded-4xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all hover:shadow-xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Total Managed
            </p>
            <div className="flex items-baseline gap-1 mt-4">
              <span className="text-2xl font-bold text-[#0B3B78]">₱</span>
              <h2 className="text-5xl font-black text-[#0B3B78] tracking-tighter">
                {totalValue.toLocaleString()}
              </h2>
            </div>
            <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">
              Overall LGU Youth Budget
            </p>
          </div>

          {/* Card 3: System Status (With Utilization Logic placeholder) */}
          <div className="bg-white/70 backdrop-blur-md p-8 rounded-4xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white transition-all hover:shadow-xl flex flex-col justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Utilization Rate
            </p>
            <div className="mt-4">
              <div className="flex items-end justify-between mb-2">
                <h2 className="text-4xl font-black text-[#0B3B78] tracking-tighter">
                  68%
                </h2>
                <span className="text-[10px] font-bold text-green-600 mb-1">
                  LIVE SECURE
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[68%] transition-all"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* 2. THE REVIEW QUEUE (ACTION CENTER) - Main Content */}
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-black text-[#0B3B78]">
                  Project Review Queue
                </h3>
                <button className="text-xs font-bold text-[#0B3B78] bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100">
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
                      <td className="px-8 py-6 font-bold text-[#0B3B78]">
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
            <div className="bg-[#0B3B78] p-8 rounded-[2.5rem] shadow-xl text-white">
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
                    <p className="text-xs text-blue-200 opacity-70">
                      Awaiting BMO Verification
                    </p>
                  </div>
                </div>
                <button className="px-6 py-2 bg-tertiary text-[#0B3B78] font-bold rounded-xl text-sm hover:scale-105 transition-transform">
                  Open Vault
                </button>
              </div>
            </div>
          </section>

          {/* 3 & 5. SIDEBAR MONITORING (Directory & Audit) */}
          <section className="space-y-8">
            {/* 3. Barangay Directory */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-lg font-black text-[#0B3B78] mb-6 flex items-center gap-2">
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
              <h3 className="text-lg font-black text-[#0B3B78] mb-6 flex items-center gap-2">
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
