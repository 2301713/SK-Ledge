"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar"; // Ensure path is correct
import { INITIAL_PROJECTS } from "@/lib/dummyData";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "../types";
import {
  ClipboardCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  AlertCircle,
  FileText,
} from "lucide-react";

export default function BMOReviewPage() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
          .select("id, username, full_name, role_type, barangay")
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

  // 2. Filter projects (Pending status + Search Query)
  const pendingProjects = INITIAL_PROJECTS.filter(
    (p) => p.status === "Pending",
  );

  const filteredProjects = pendingProjects.filter((p) =>
    (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Helper for currency formatting
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount || 0);
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
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* SIDEBAR */}
      <SideBar
        userName={currentUser.full_name}
        roleType={currentUser.role_type}
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8 lg:p-12 space-y-8">
          {/* HEADER SECTION */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 text-primary rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                <AlertCircle size={14} strokeWidth={3} />
                Action Required
              </div>
              <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                <ClipboardCheck className="text-primary" size={32} />
                Budget Alignment Queue
              </h1>
              <p className="text-slate-500 font-medium mt-2 max-w-2xl">
                Review pending SK project proposals, verify their legal
                compliance, and align them with the Annual Barangay Youth
                Investment Program (ABYIP).
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Pending Reviews
                </p>
                <p className="text-2xl font-black text-slate-900 leading-none mt-1">
                  {pendingProjects.length}
                </p>
              </div>
              <div className="w-px h-10 bg-slate-200"></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Total Value
                </p>
                <p className="text-2xl font-black text-primary leading-none mt-1">
                  {formatCurrency(
                    pendingProjects.reduce(
                      (sum, p) => sum + (p.budget || 0),
                      0,
                    ),
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTER BAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus-within:ring-2 ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
              <Search className="text-slate-400 mr-3" size={18} />
              <input
                type="text"
                placeholder="Search by project name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full font-medium placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* PROJECT LIST */}
          <div className="space-y-4">
            {filteredProjects.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-12 text-center flex flex-col items-center justify-center">
                <FileText className="text-slate-300 mb-4" size={48} />
                <h3 className="text-lg font-black text-slate-900">
                  Inbox Zero!
                </h3>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  There are no pending project proposals requiring budget
                  alignment at this time.
                </p>
              </div>
            ) : (
              filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  {/* Left: Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-tertiary/5 text-tertiary px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Clock size={12} /> Pending Review
                      </span>
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <MapPin size={12} />{" "}
                        {project.barangay || "Barangay info missing"}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                      {project.name}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium mt-2 line-clamp-2">
                      {project.description ||
                        "No detailed description provided by the SK official."}
                    </p>
                  </div>

                  {/* Middle */}
                  <div className="lg:w-48 bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Requested Budget
                    </p>
                    <p className="text-lg font-black text-slate-900">
                      {formatCurrency(project.budget)}
                    </p>
                  </div>

                  {/* Right */}
                  <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                    <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-sm shadow-primary/20">
                      <CheckCircle2 size={16} /> Align & Approve
                    </button>
                    <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-colors">
                      <XCircle size={16} /> Return to SK
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
