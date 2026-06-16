"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import { supabase } from "@/lib/supabase";
import { ProcurementProject } from "../types";
import { procurementProjects } from "../types";
import { UserAccount } from "@/lib/useAuthStore";

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  Gavel,
  Search,
  Trophy,
} from "lucide-react";

export default function BMOReviewPage() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProcurementProject>(
    procurementProjects[0],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // 1. Authenticate and protect the page
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
          .select(
            "id, username, full_name, role_type, barangay, email, approval_status",
          )
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError.message);
        }

        if (profileData) {
          if (profileData.role_type !== "BMO") {
            router.push("/unauthorized");
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
        <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-tertiary font-black text-xl shadow-xl shadow-primary/30 mb-6 animate-bounce">
          BMO
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Loading Dashboard...
        </p>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <SideBar
        userName={currentUser.full_name}
        roleType={currentUser.role_type}
      />

      <main className="flex-1">
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
          {/* LEFT PANEL */}
          <div className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col h-screen overflow-hidden shrink-0">
            <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Gavel className="w-5 h-5 text-primary" />
                BAC Control Room
              </h1>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">
                Procurement Management
              </p>

              <div className="mt-4 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-2">
                <Search className="w-4 h-4 text-slate-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="bg-transparent border-none outline-none text-sm w-full text-slate-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Filter className="w-4 h-4 text-slate-400 cursor-pointer hover:text-primary transition" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {procurementProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`p-3 rounded-xl cursor-pointer transition-all border ${
                    selectedProject.id === project.id
                      ? "bg-primary/5 border-primary/10 shadow-sm"
                      : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {project.id}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                        project.status === "Evaluation"
                          ? "bg-orange-100 text-orange-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight mb-1">
                    {project.title}
                  </h3>
                  <div className="flex items-center justify-between text-[12px] text-slate-500">
                    <span>{project.barangay}</span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3" /> {project.deadline}
                      </span>
                      <span className="text-[12px] font-bold text-slate-700">
                        {formatCurrency(project.abc)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="flex-1 h-screen overflow-y-auto bg-slate-50/50 p-6">
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Header Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                      {selectedProject.id}
                    </span>
                    <span className="px-2 py-0.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1">
                      <Building2 className="w-3 h-3" />{" "}
                      {selectedProject.barangay}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    {selectedProject.title}
                  </h2>
                  <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                    Approved Budget (ABC):{" "}
                    <span className="text-slate-900 font-black">
                      {formatCurrency(selectedProject.abc)}
                    </span>
                  </p>
                </div>

                {/* Workflow Action Button based on status */}
                <div>
                  {selectedProject.status === "Accepting Bids" ? (
                    <button className="px-6 py-3 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 border border-orange-200 shadow-sm">
                      <AlertCircle className="w-4 h-4" /> Close Bidding &
                      Evaluate
                    </button>
                  ) : (
                    <button className="px-6 py-3 bg-slate-100 text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest cursor-not-allowed flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Bidding Closed
                    </button>
                  )}
                </div>
              </div>

              {/* Vendor Bids Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                      Vendor Submissions
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {selectedProject.bids.length} Active Bids
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-4 py-3">Vendor</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Bid</th>
                        <th className="px-4 py-3">Variance</th>
                        <th className="px-4 py-3 text-center">Docs</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {selectedProject.bids
                        .sort((a, b) => a.bidAmount - b.bidAmount)
                        .map((bid, index) => {
                          const variance = selectedProject.abc - bid.bidAmount;
                          const isOverBudget = variance < 0;
                          const isLowestEligible =
                            index === 0 && !isOverBudget && bid.documentsValid;

                          return (
                            <tr
                              key={bid.id}
                              className={`hover:bg-slate-50 transition-colors ${isLowestEligible ? "bg-primary/5" : ""}`}
                            >
                              <td className="px-4 py-3">
                                <p className="font-black text-sm text-slate-900 flex items-center gap-2">
                                  {bid.vendorName}
                                  {isLowestEligible && (
                                    <span
                                      className="bg-yellow-100 text-yellow-700 p-1 rounded-full"
                                      title="Lowest Calculated Bid"
                                    >
                                      <Trophy className="w-3 h-3" />
                                    </span>
                                  )}
                                </p>
                              </td>
                              <td className="px-4 py-3 text-sm font-bold text-slate-500">
                                {bid.dateSubmitted}
                              </td>
                              <td className="px-4 py-3">
                                <p
                                  className={`font-black text-sm ${isOverBudget ? "text-red-600" : "text-slate-900"}`}
                                >
                                  {formatCurrency(bid.bidAmount)}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`text-[11px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest ${isOverBudget ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}
                                >
                                  {isOverBudget
                                    ? "Over Budget"
                                    : `-${formatCurrency(variance)}`}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  className={`p-2 rounded-lg transition-colors ${bid.documentsValid ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "bg-slate-100 text-slate-400"}`}
                                >
                                  <FileText className="w-4 h-4 mx-auto" />
                                </button>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  disabled={
                                    isOverBudget ||
                                    selectedProject.status !== "Evaluation"
                                  }
                                  className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-widest transition-colors ${selectedProject.status === "Evaluation" && !isOverBudget ? "bg-primary text-white hover:bg-primary/90 shadow" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                                >
                                  Award
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                  {selectedProject.bids.length === 0 && (
                    <div className="p-6 text-center text-slate-400 text-sm font-bold">
                      No bids submitted yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
