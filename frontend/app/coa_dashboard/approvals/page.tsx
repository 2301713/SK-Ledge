"use client";

import { useEffect, useState } from "react";
import SideBar from "@/components/dashboard/SideBar";
import { supabase } from "@/lib/supabase";
import { ApprovalRequest, UserAccount } from "../types";
import { dummyApprovals } from "@/lib/dummyData";

export default function ApprovalsPage() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // DATA STATE
  const [approvalsData, setApprovalsData] =
    useState<ApprovalRequest[]>(dummyApprovals);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
          setIsLoading(false);
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, full_name, role_type, barangay")
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError.message);
        }

        if (profileData) {
          setCurrentUser({
            id: profileData.id,
            username: profileData.username,

            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type as "Chairman" | "Treasurer",
            barangay: profileData.barangay || "No Barangay Assigned",
          });
        }
      } catch (err) {
        console.error("Error loading profile", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  const handleApprove = (id: number) => {
    setApprovalsData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Approved" } : item,
      ),
    );
  };

  if (isLoading) return <div className="min-h-screen bg-background" />; // Simplified loading for brevity

  return (
    <div className="flex min-h-screen bg-background selection:bg-tertiary selection:text-primary">
      {currentUser && (
        <SideBar
          userName={currentUser.full_name}
          roleType={currentUser.role_type}
          barangay={currentUser.barangay}
        />
      )}

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="absolute top-[-20%] right-[-10%] w-160 h-160 bg-tertiary/5 rounded-full blur-3xl pointer-events-none z-0"></div>

        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-border px-8 flex items-center justify-between z-10 shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold text-primary tracking-tight">
              Pending Approvals
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground mt-0.5">
              Review and Approve Budget Requests
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 z-10">
          <div className="max-w-5xl mx-auto space-y-8">
            <section className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-border bg-gray-50/50 flex justify-between items-center">
                <h2 className="text-base font-bold text-primary">
                  Pending Approvals
                </h2>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                  Action Required
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                        Department
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                        Purpose
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {approvalsData.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-primary/2 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <span className="font-bold text-primary text-sm">
                            {item.department}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-secondary-foreground">
                            {item.purpose}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-primary tracking-tight">
                            {item.amount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleApprove(item.id)}
                            disabled={item.status === "Approved"}
                            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                              item.status === "Approved"
                                ? "bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200"
                                : "bg-primary text-white hover:bg-primary/90 hover:shadow-md active:scale-95"
                            }`}
                          >
                            {item.status === "Approved"
                              ? "Approved"
                              : "Approve"}
                          </button>
                        </td>
                      </tr>
                    ))}
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
