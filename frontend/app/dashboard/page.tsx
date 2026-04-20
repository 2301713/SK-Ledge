"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/SideBar";
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

        // Fetching the newly added full_name and barangay columns
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

  // Loading & Error States
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-medium">Loading Dashboard...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-red-500 font-medium">
          Access Denied. Please log in.
        </p>
      </div>
    );
  }

  // MAIN DASHBOARD
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={currentUser} />

      <main className="flex-1">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-700">
            {currentUser.barangay} Dashboard
          </h1>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            + New Project
          </button>
        </header>

        <div className="p-8">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-slate-500 text-sm font-medium">
                Total Allocated Budget
              </h3>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                ₱ 1,250,000.00
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-slate-500 text-sm font-medium">
                Project Expenditure
              </h3>
              <p className="text-3xl font-bold text-indigo-600 mt-1">
                ₱ 165,000.00
              </p>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Budget
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {projects.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.category}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          p.status === "Approved"
                            ? "bg-green-100 text-green-700"
                            : p.status === "Pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-700">
                      {formatCurrency(p.budget)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </div>
  );
}
