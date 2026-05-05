"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "../types";
import { LegendItemProps } from "../types";
import {
  FileDown,
  FilePieChart,
  Users2,
  BarChart3,
  ShieldCheck,
  Filter,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";

export default function SKFederationDashboard() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 1. AUTHENTICATION & ROLE PROTECTION
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
          if (profileData.role_type !== "SK_Fed") {
            console.warn("Unauthorized: User is not an SK Federation Official");
            router.push("/unauthorized");
            return;
          }

          setCurrentUser({
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type,
            barangay: profileData.barangay || "City Wide",
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

  // UTILITY
  const formatCurrency = (budget: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(budget);
  };

  // LOADING STATE
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="h-16 w-16 bg-tertiary rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-600/30 mb-6 animate-bounce">
          FED
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Initializing Command Center...
        </p>
      </div>
    );
  }

  // UNAUTHORIZED / NULL STATE
  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen bg-[#f8fafc] selection:bg-blue-200 selection:text-blue-900">
      {/* SIDEBAR */}
      <SideBar
        userName={currentUser.full_name}
        roleType={currentUser.role_type}
        barangay={currentUser.barangay}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        <div className="p-10 space-y-8 animate-in fade-in duration-500">
          {/* HEADER & EXPORT CONTROLS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-none">
                Oversight Reports
              </h2>
              <p className="text-slate-500 italic text-sm font-medium mt-2">
                City-Wide Analytics Engine & Performance Matrix
              </p>
            </div>
            <button className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#002855] transition shadow-lg shadow-blue-900/20">
              <FileDown size={18} />
              Generate City-Wide LGU Report
            </button>
          </div>

          {/* TOP ANALYTICS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. City-Wide Financial Breakdown */}
            <div className="lg:col-span-2 bg-white p-8 rounded-4xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase text-xs tracking-widest">
                  <BarChart3 size={16} className="text-primary" />
                  Budget Allocation Breakdown
                </h3>
                <span className="text-[10px] bg-blue-50 text-primary px-3 py-1 rounded-full font-black">
                  FY 2026
                </span>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-12">
                {/* Visual Doughnut Chart */}
                <div className="relative w-44 h-44 rounded-full border-18 border-blue-600 border-t-green-500 border-l-yellow-400 border-r-rose-500 flex items-center justify-center shadow-inner">
                  <div className="text-center">
                    <p className="text-2xl font-black text-slate-800 leading-none">
                      16.6M
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                      Total Fund
                    </p>
                  </div>
                </div>
                {/* Legend System */}
                <div className="flex-1 space-y-4 w-full">
                  <LegendItem
                    color="bg-blue-600"
                    label="Sports & Development"
                    percentage="40%"
                    budget={formatCurrency(6640000)}
                  />
                  <LegendItem
                    color="bg-green-500"
                    label="Education / Scholarships"
                    percentage="30%"
                    budget={formatCurrency(4980000)}
                  />
                  <LegendItem
                    color="bg-yellow-400"
                    label="Health & Environment"
                    percentage="20%"
                    budget={formatCurrency(3320000)}
                  />
                  <LegendItem
                    color="bg-rose-500"
                    label="Governance & Admin"
                    percentage="10%"
                    budget={formatCurrency(3320000)}
                  />
                </div>
              </div>
            </div>

            {/* 2. Project Impact Metrics */}
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-4xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-primary mb-4">
                  <FilePieChart size={24} />
                </div>
                <h4 className="text-4xl font-black text-slate-800 leading-none">
                  248
                </h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                  Projects Completed
                </p>
              </div>
              <div className="bg-white p-8 rounded-4xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-4">
                  <Users2 size={24} />
                </div>
                <h4 className="text-4xl font-black text-slate-800 leading-none">
                  14.2k
                </h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                  Youth Beneficiaries
                </p>
              </div>
            </div>
          </div>

          {/* 3. COMPLIANCE MATRIX */}
          <div className="bg-white rounded-4xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                <ShieldCheck size={18} className="text-green-600" />
                Barangay Compliance Matrix
              </h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-slate-200 rounded-xl transition text-slate-400">
                  <Filter size={18} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase">
                  <tr>
                    <th className="p-6">Barangay Name</th>
                    <th className="p-6 text-center">Submitted CBYDP</th>
                    <th className="p-6 text-center">Submitted ABYIP</th>
                    <th className="p-6 text-center">On-time Liquidation</th>
                    <th className="p-6 text-center">Impact Score</th>
                    <th className="p-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {/* Example row - Repeat this for data mapping */}
                  <tr className="hover:bg-slate-50 transition-colors group">
                    <td className="p-6 font-bold text-slate-700">
                      Barangay San Jose
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex justify-center">
                        <CheckCircle2 className="text-green-500" size={20} />
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex justify-center">
                        <CheckCircle2 className="text-green-500" size={20} />
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex justify-center">
                        <XCircle className="text-rose-400" size={20} />
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full"
                          style={{ width: "65%" }}
                        ></div>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <button className="text-primary font-black text-[10px] uppercase flex items-center gap-1 ml-auto hover:bg-primary hover:text-white px-3 py-2 rounded-lg transition-all">
                        <ExternalLink size={14} />
                        Barangay Drill-Down
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  function LegendItem({ color, label, percentage, budget }: LegendItemProps) {
    const displayBudget =
      typeof budget === "number" ? formatCurrency(budget) : budget;

    return (
      <div className="flex items-center justify-between group">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${color} shadow-sm`}></div>
          <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition">
            {label}
          </span>
        </div>
        <div className="text-right">
          <span className="text-sm font-black text-slate-800">
            {percentage}
          </span>
          <p className="text-[9px] text-slate-400 font-bold leading-none">
            {displayBudget}
          </p>
        </div>
      </div>
    );
  }
}
