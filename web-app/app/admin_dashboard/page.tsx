"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/useAuthStore";
import Link from "next/link";
import React from "react";
import { Users, CheckCircle2, Clock, AlertCircle } from "lucide-react";


interface DashboardStats {
  totalAccounts: number;
  pendingAccounts: number;
  approvedAccounts: number;
  rejectedAccounts: number;
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
          .select("id, approval_status");

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
  }, [router, setCurrentUser, setIsLoading, setUserProfile]);

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
        <div className="mb-12">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            Admin Dashboard
          </p>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            System Overview
          </h1>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 mb-12 grid-cols-1 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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

        {/* Action Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-2">
            Account Management
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Manage and review user accounts for SK-Ledge portal access.
          </p>
          <Link
            href="/admin_dashboard/accounts"
            className="inline-flex items-center px-6 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Go to Account Management
          </Link>
        </div>
      </main>
    </div>
  );
}
