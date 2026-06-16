"use client";

import { useEffect, useState } from "react";
import SideBar from "@/components/dashboard/SideBar";
import { supabase } from "@/lib/supabase";
import { ApprovalRequest, UserAccount } from "../types";
import { dummyApprovals } from "@/lib/dummyData";
import { Check } from "lucide-react";
import { useAuthStore } from "@/lib/useAuthStore";
import { useRouter } from "next/navigation";

export default function ApprovalsPage() {
  const {
    currentUser,
    isLoading,
    setCurrentUser,
    setIsLoading,
    setUserProfile,
  } = useAuthStore();
  const router = useRouter();

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
          console.error("No active user session found.");
          router.push("/login");
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            "id, username, role_type, full_name, barangay, email, approval_status",
          )
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError.message);
          return;
        }

        if (profileData) {
          if (profileData.role_type !== "COA") {
            console.warn("Unauthorized access: User is not a COA member.");
            router.push("/unauthorized");
            return;
          }

          const profile = {
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type,
            barangay: profileData.barangay || "No Barangay Assigned",
            email: profileData.email,
            approval_status: profileData.approval_status,
          };

          setCurrentUser(profile as UserAccount);
          setUserProfile(profile);
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [router, setCurrentUser, setIsLoading, setUserProfile]);

  const handleApprove = (id: number) => {
    setApprovalsData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Approved" } : item,
      ),
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-tertiary font-black text-xl shadow-xl shadow-primary/30 mb-6 animate-bounce">
          COA
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Loading Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background selection:bg-tertiary selection:text-primary">
      {currentUser && (
        <SideBar
          userName={currentUser.full_name}
          roleType={currentUser.role_type}
          barangay={currentUser.barangay}
        />
      )}

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-secondary relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary z-20" />

        <header className="h-24 bg-white border-b border-slate-200 px-10 flex items-center justify-between z-10 shrink-0 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-primary rounded-full" />
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                Financial Control{" "}
                <span className="text-primary/60 font-light">/</span> Approvals
              </h1>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em] pl-5">
              Management Ledger & Expenditure Oversight
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right mr-4 border-r pr-4 border-slate-200">
              <p className="text-[10px] uppercase font-bold text-slate-400">
                Total Pending
              </p>
              <p className="text-lg font-black text-primary leading-none">
                {approvalsData.length}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 z-10">
          <div className="max-w-6xl mx-auto">
            <section className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                    Awaiting Authorization
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Latest requests awaiting COA review
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 text-left">
                        Department
                      </th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 text-left">
                        Purpose
                      </th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 text-left">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {approvalsData.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50 transition-colors duration-150"
                      >
                        <td className="px-4 py-4 align-middle">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-sm tracking-tight uppercase">
                              {item.department}
                            </span>
                            <span className="text-[11px] text-slate-400 font-semibold">
                              Ref: #00{item.id}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-middle max-w-xl">
                          <span className="text-sm font-medium text-slate-600 leading-tight line-clamp-2">
                            {item.purpose}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <span className="text-base font-black text-primary tabular-nums">
                            {item.amount}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-3">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${item.status === "Approved" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                            >
                              {item.status === "Approved"
                                ? "Approved"
                                : "Pending"}
                            </span>

                            <button
                              onClick={() => handleApprove(item.id)}
                              disabled={item.status === "Approved"}
                              className={`inline-flex items-center px-3 py-1.5 text-[11px] rounded-md font-black uppercase tracking-widest transition-colors duration-150 border-2 ${item.status === "Approved" ? "bg-transparent text-emerald-500 border-emerald-500/20 cursor-not-allowed" : "bg-primary text-white border-primary hover:bg-primary/90 hover:border-primary/90 shadow-sm"}`}
                            >
                              {item.status === "Approved" ? (
                                <span className="flex items-center gap-2">
                                  <Check className="w-4 h-4" strokeWidth={3} />
                                  Released
                                </span>
                              ) : (
                                "Authorize"
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between text-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  sk-ledge // Internal Audit v2.4
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase italic">
                  Confidential Enterprise Data
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
