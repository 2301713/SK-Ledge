"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/useAuthStore";
import React from "react";
import { Users, CheckCircle2, Clock, AlertCircle } from "lucide-react";


interface DashboardStats {
  totalAccounts: number;
  pendingAccounts: number;
  approvedAccounts: number;
  rejectedAccounts: number;
}

interface ApprovedAccount {
  id: string;
  username: string | null;
  full_name: string | null;
  role_type: string | null;
  barangay: string | null;
  email: string | null;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const {
    currentUser,
    isLoading,
    setCurrentUser,
    setIsLoading,
    setUserProfile,
  } = useAuthStore();

  const [stats, setStats] = React.useState<DashboardStats>({
    totalAccounts: 0,
    pendingAccounts: 0,
    approvedAccounts: 0,
    rejectedAccounts: 0,
  });

  const [approvedAccounts, setApprovedAccounts] = React.useState<
    ApprovedAccount[]
  >([]);
  const authAttemptedRef = useRef(false);

  useEffect(() => {
    const loadUser = async () => {
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

        if (profileError || !profileData) {
          router.push("/login");
          return;
        }

        if (profileData.role_type !== "Admin") {
          router.push("/unauthorized");
          return;
        }

        const profile = {
          id: profileData.id,
          username: profileData.username,
          full_name: profileData.full_name || profileData.username,
          role_type: profileData.role_type,
          barangay: profileData.barangay || "N/A",
          email: profileData.email,
          approval_status: profileData.approval_status,
        };

        setCurrentUser(profile);
        setUserProfile(profile);

        // Fetch account statistics
        const { data: allAccounts, error: accountsError } = await supabase
          .from("profiles")
          .select(
            "id, approval_status, username, full_name, role_type, barangay, email",
          );

        if (!accountsError && allAccounts) {
          const pending = allAccounts.filter(
            (a) => a.approval_status === "pending",
          ).length;
          const approved = allAccounts.filter(
            (a) => a.approval_status === "approved",
          ).length;
          const rejected = allAccounts.filter(
            (a) => a.approval_status === "rejected",
          ).length;

          setStats({
            totalAccounts: allAccounts.length,
            pendingAccounts: pending,
            approvedAccounts: approved,
            rejectedAccounts: rejected,
          });

          setApprovedAccounts(
            allAccounts
              .filter((account) => account.approval_status === "approved")
              .map((account) => ({
                id: account.id,
                username: account.username,
                full_name: account.full_name,
                role_type: account.role_type,
                barangay: account.barangay,
                email: account.email,
              })),
          );
        }
      } catch (error) {
        console.error("Failed to load admin dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authAttemptedRef.current) {
      authAttemptedRef.current = true;
      loadUser();
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-tertiary shadow-xl">
            <span className="text-xl font-black">SK</span>
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            Loading admin console...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {currentUser && (
        <SideBar
          userName={currentUser.full_name}
          roleType={currentUser.role_type}
          barangay={currentUser.barangay}
        />
      )}

      <main className="flex-1 p-8 lg:p-10">
        <div className="mb-12 animate-fadein">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            Admin Dashboard
          </p>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            System Overview
          </h1>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 mb-12 grid-cols-1 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm animate-fadein">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.2em]">
                  Total Accounts
                </p>
                <p className="text-3xl font-black text-primary mt-2">
                  {stats.totalAccounts}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm animate-fadein">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.2em]">
                  Pending
                </p>
                <p className="text-3xl font-black text-amber-600 mt-2">
                  {stats.pendingAccounts}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm animate-fadein">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.2em]">
                  Approved
                </p>
                <p className="text-3xl font-black text-emerald-600 mt-2">
                  {stats.approvedAccounts}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm animate-fadein">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.2em]">
                  Rejected
                </p>
                <p className="text-3xl font-black text-rose-600 mt-2">
                  {stats.rejectedAccounts}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-rose-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm mb-12 animate-fadein">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                Approved Accounts
              </p>
              <h2 className="text-2xl font-black text-slate-900">
                Approved Users
              </h2>
            </div>
            <p className="text-sm text-slate-600">
              Showing {approvedAccounts.length} approved account(s).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600 uppercase tracking-[0.16em]">
                    Name
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600 uppercase tracking-[0.16em]">
                    Username
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600 uppercase tracking-[0.16em]">
                    Role
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600 uppercase tracking-[0.16em]">
                    Barangay
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600 uppercase tracking-[0.16em]">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {approvedAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {account.full_name || "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {account.username || "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {account.role_type || "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {account.barangay || "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {account.email || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
