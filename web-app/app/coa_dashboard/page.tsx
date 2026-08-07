"use client";

import LogoLoader from "@/components/LogoLoader";
import { useEffect, useRef } from "react";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import StatCard from "@/components/dashboard/ui/StatCard";
import AccountsBarChart from "@/components/dashboard/ui/AccountsBarChart";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/useAuthStore";
import {
  CheckSquare,
  FileText,
  TrendingUp,
  AlertCircle,
  Wallet,
  BadgeCheck,
  PiggyBank,
  CircleAlert,
} from "lucide-react";

export default function COADashboard() {
  const { currentUser, isLoading, setCurrentUser, setIsLoading } =
    useAuthStore();
  const router = useRouter();
  const authAttemptedRef = useRef(false);

  // For the overview chart/KPIs
  const pendingApprovalCount = 3;
  const pendingDisbursementCount = 2;
  const totalRequestsYTD = 1204;
  const urgentFlags = 5;

  useEffect(() => {
    const fetchUserProfile = async () => {
      // If user data is already loaded from login, skip auth check
      if (currentUser && currentUser.role_type === "COA") {
        setIsLoading(false);
        return;
      }

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
            "id, username, full_name, role_type, barangay,email, approval_status",
          )
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError.message);
          setIsLoading(false);
          setTimeout(() => router.push("/login"), 100);
          return;
        }

        if (profileData) {
          // Verify that this user is actually a COA
          if (profileData.role_type !== "COA") {
            console.warn("Unauthorized access: User is not a COA");
            setIsLoading(false);
            setTimeout(() => router.push("/unauthorized"), 100);
            return;
          }

          setCurrentUser({
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type as "COA",
            barangay: profileData.barangay || "No Barangay Assigned",
            email: profileData.email,
            approval_status: profileData.approval_status,
          });
        } else {
          // No profile data found
          console.warn("No profile data found for user");
          setIsLoading(false);
          setTimeout(() => router.push("/login"), 100);
          return;
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
        setIsLoading(false);
        setTimeout(() => router.push("/login"), 100);
      }
    };

    // Only fetch once per component mount
    if (!authAttemptedRef.current) {
      authAttemptedRef.current = true;
      fetchUserProfile();
    }
  }, [currentUser, setCurrentUser, setIsLoading, router]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  if (isLoading) return <LogoLoader />;

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-white rounded-4xl shadow-xl border border-border p-10 text-center">
          <div className="h-16 w-16 bg-danger/10 text-danger rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">
              <CircleAlert />
            </span>
          </div>
          <h2 className="text-2xl font-black text-primary mb-3 tracking-tight">
            Access Restricted
          </h2>
          <p className="text-sm text-secondary-foreground mb-8 leading-relaxed">
            You do not have the required credentials to view the COA Dashboard.
          </p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="w-full rounded-xl bg-primary py-4 text-sm font-bold text-white transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen gap-4 bg-background p-4 selection:bg-tertiary selection:text-primary">
      <SideBar
        userName={currentUser.full_name}
        roleType={currentUser.role_type}
        barangay={currentUser.barangay}
      />

      <main className="min-w-0 flex-1 space-y-6 py-2 animate-fadein">
        <TopBar
          userName={currentUser.full_name}
          userEmail={currentUser.email}
          hideSearch
        />

        <PageHeader
          eyebrow="Commission on Audit"
          title="Audit Overview"
          subtitle={`${today} · ${pendingApprovalCount} pending approvals and ${pendingDisbursementCount} pending disbursements across municipal jurisdictions.`}
          actions={
            <>
              <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_6px_16px_-6px_rgba(1,56,168,0.5)] transition hover:bg-primary/90">
                <CheckSquare className="h-4 w-4" />
                Review Approvals
              </button>
              <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-secondary">
                <FileText className="h-4 w-4" />
                Review Disbursements
              </button>
            </>
          }
        />

        {/* STAT ROW */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Pending Approvals"
            value={pendingApprovalCount}
            icon={CheckSquare}
            variant="brand"
            trend="Across municipal jurisdictions"
            trendIcon={TrendingUp}
          />
          <StatCard
            label="Pending Disbursements"
            value={pendingDisbursementCount}
            icon={FileText}
            trend="Awaiting audit review"
          />
          <StatCard
            label="Total Requests YTD"
            value={totalRequestsYTD.toLocaleString()}
            icon={TrendingUp}
            trend="Last sync: 2h ago"
          />
          <StatCard
            label="Urgent Flags"
            value={urgentFlags}
            icon={AlertCircle}
            trend="Require immediate follow-up"
          />
        </div>

        {/* CHART + FINANCIAL SUMMARY */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              eyebrow="Volume Analysis"
              title="Pending Request Volume"
              subtitle="Approvals vs disbursements awaiting action"
              action={
                <span className="rounded-lg border border-border bg-secondary/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                  Last 7d
                </span>
              }
            />
            <AccountsBarChart
              data={[
                { label: "Approvals", value: pendingApprovalCount },
                { label: "Disbursements", value: pendingDisbursementCount },
              ]}
              highlightIndex={0}
              unit="pending"
            />
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader eyebrow="Financial" title="Budget Overview" />
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tertiary/20 text-tertiary">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold tracking-tight text-primary-foreground">
                      {formatCurrency(120000)}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                      Total Budget
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold tracking-tight text-primary-foreground">
                      {formatCurrency(45000)}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                      Approved
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <PiggyBank className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold tracking-tight text-primary-foreground">
                      {formatCurrency(75000)}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                      Remaining
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
