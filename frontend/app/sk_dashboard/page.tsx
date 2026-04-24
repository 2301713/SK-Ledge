"use client";

import { useEffect, useState } from "react";
import SideBar from "@/components/SideBar"; // Ensure this matches your exact file name casing
import { UserAccount, Project } from "./types";
import { supabase } from "@/lib/supabase";

export default function SKDashboard() {
  // STATE
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dummy projects
  const projects: Project[] = [
    {
      id: "1",
      name: "Youth Basketball League",
      category: "Sports",
      status: "Approved",
      budget: 45000,
    },
    {
      id: "2",
      name: "SK Scholarship Grant",
      category: "Education",
      status: "Pending",
      budget: 120000,
    },
  ];

  // GET USER DATA
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          console.error("No active user session found.");
          setIsLoading(false);
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("username, role_type, full_name, barangay")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError.message);
        }

        if (profileData) {
          setCurrentUser({
            name: profileData.full_name || profileData.username,
            role: profileData.role_type as "Chairman" | "Treasurer",
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
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  // LOADING STATE
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="h-14 w-14 bg-primary rounded-xl flex items-center justify-center text-tertiary font-black text-3xl shadow-lg shadow-primary/20 mb-6 animate-pulse">
          B
        </div>
        <p className="text-[11px] font-bold text-secondary-foreground uppercase tracking-widest animate-pulse">
          Initializing Dashboard...
        </p>
      </div>
    );
  }

  // ERROR / UNAUTHORIZED STATE
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-primary/5 border border-border p-8 text-center">
          <div className="h-12 w-12 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-danger text-xl">⚠️</span>
          </div>
          <h2 className="text-xl font-extrabold text-primary mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-secondary-foreground mb-6">
            You do not have the required credentials or an active session to
            view this official dashboard.
          </p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition-all hover:bg-primary/90"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD
  return (
    <div className="flex min-h-screen bg-background font-sans selection:bg-tertiary selection:text-primary">
      {/* SIDEBAR */}
      <SideBar
        userName={currentUser.name}
        roleType={currentUser.role}
        barangay={currentUser.barangay}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Subtle Background Elements */}
        <div className="absolute top-[-20%] right-[-10%] w-160 h-160 bg-tertiary/5 rounded-full blur-3xl pointer-events-none z-0"></div>

        {/* HEADER */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-border px-8 flex items-center justify-between z-10 shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold text-primary tracking-tight flex items-center gap-2">
              <span className="text-tertiary text-2xl">•</span>
              Barangay {currentUser.barangay}
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground mt-0.5">
              Official SK Dashboard
            </p>
          </div>
          <button className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Project
          </button>
        </header>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 z-10">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* METRICS GRID */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1 */}
              <div className="bg-white p-6 rounded-2xl border border-border shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground mb-2 ml-2">
                  Total Allocated Budget
                </h3>
                <p className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight ml-2">
                  ₱ 1,250,000.00
                </p>
                {/* Decorative background icon */}
                <svg
                  className="absolute right-[-5%] bottom-[-10%] w-32 h-32 text-primary/5 group-hover:scale-110 transition-transform duration-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              </div>

              {/* Card 2 */}
              <div className="bg-white p-6 rounded-2xl border border-border shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-tertiary"></div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground mb-2 ml-2">
                  Project Expenditure YTD
                </h3>
                <p className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight ml-2">
                  ₱ 165,000.00
                </p>
                <div className="mt-2 ml-2 flex items-center gap-2 text-xs font-semibold text-danger">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                    <polyline points="17 18 23 18 23 12"></polyline>
                  </svg>
                  <span>13.2% of allocation used</span>
                </div>
              </div>
            </section>

            {/* LEDGER TABLE */}
            <section className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-border bg-gray-50/50 flex justify-between items-center">
                <h2 className="text-base font-bold text-primary">
                  Active Project Ledger
                </h2>
                <button className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground hover:text-primary transition-colors">
                  View Full History &rarr;
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                        Project Name
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                        Category
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                        Approval Status
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground text-right">
                        Allocated Budget
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {projects.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-primary/2 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold text-primary text-sm group-hover:text-tertiary transition-colors">
                            {p.name}
                          </p>
                          <p className="text-xs text-secondary-foreground mt-0.5 font-medium">
                            ID: PRJ-{p.id.padStart(4, "0")}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
                            {p.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                              p.status === "Approved"
                                ? "bg-[#e8f5e9] text-[#2e7d32] border-[#a5d6a7]" // Refined Green
                                : p.status === "Pending"
                                  ? "bg-[#fff8e1] text-[#f57f17] border-[#ffe082]" // Refined Yellow/Gold
                                  : "bg-[#ffebee] text-[#c62828] border-[#ef9a9a]" // Refined Red
                            }`}
                          >
                            {p.status === "Approved" && (
                              <span className="mr-1.5 text-lg leading-none">
                                •
                              </span>
                            )}
                            {p.status === "Pending" && (
                              <span className="mr-1.5 text-lg leading-none animate-pulse">
                                •
                              </span>
                            )}
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-primary tracking-tight">
                            {formatCurrency(p.budget)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {/* Empty State / Fill Row if needed */}
                    {projects.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-12 text-center text-sm font-medium text-secondary-foreground"
                        >
                          No active projects found for this barangay.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
