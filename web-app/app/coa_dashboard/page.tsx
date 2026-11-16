"use client";

import LogoLoader from "@/components/LogoLoader";
import { useEffect, useMemo, useRef, useState } from "react";
import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, SK_LEDGE_ABI } from "@/lib/contractConfig";
import { sumAmountCentavos } from "@/lib/records";
import { useRecordsSync } from "@/lib/useRecordsSync";
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

type OnChainRecord = {
  id: bigint;
  barangay: string;
  amount: bigint;
  timestamp: bigint;
  recordType: string;
  approved: boolean;
};

const URGENT_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const URGENT_CUTOFF_MS = Date.now() - URGENT_AGE_MS;

export default function COADashboard() {
  const { currentUser, isLoading, setCurrentUser, setIsLoading } =
    useAuthStore();
  const router = useRouter();
  const authAttemptedRef = useRef(false);
  const [projects, setProjects] = useState<{ id: string; budget: number }[]>([]);

  const { records, isLoading: isRecordsLoading, lastSyncedAt } = useRecordsSync({
    enabled: Boolean(currentUser),
    limit: 500,
  });

  const { data: onChainRecords, isLoading: isChainLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SK_LEDGE_ABI,
    functionName: "getAllRecords",
    query: { enabled: Boolean(currentUser) },
  });

  useEffect(() => {
    if (!currentUser) return;

    let active = true;
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, budget");

      if (!active) return;

      if (error) {
        console.error("Error fetching audit projects:", error.message);
        return;
      }

      setProjects(
        (data ?? []).map((project) => ({
          id: String(project.id),
          budget: Number(project.budget) || 0,
        })),
      );
    };

    fetchProjects();
    return () => {
      active = false;
    };
  }, [currentUser]);

  const overview = useMemo(() => {
    const chainRecords = (onChainRecords ?? []) as readonly OnChainRecord[];
    const pendingRecords = chainRecords.filter((record) => !record.approved);
    const urgentRecords = pendingRecords.filter(
      (record) => Number(record.timestamp) * 1000 < URGENT_CUTOFF_MS,
    );

    const currentYear = new Date().getFullYear();
    const requestsYTD = records.filter((record) => {
      if (!record.created_at) return false;
      return new Date(record.created_at).getFullYear() === currentYear;
    });

    const totalBudget = projects.reduce(
      (sum, project) => sum + project.budget,
      0,
    );
    const approvedAmount = sumAmountCentavos(records, "award") / 100;

    return {
      pendingApprovals: pendingRecords.length,
      pendingDisbursements: records.filter(
        (record) => record.record_type === "expense",
      ).length,
      totalRequestsYTD: requestsYTD.length,
      urgentFlags: urgentRecords.length,
      totalBudget,
      approvedAmount,
      remainingBudget: Math.max(totalBudget - approvedAmount, 0),
    };
  }, [onChainRecords, records, projects]);

  const pendingApprovalCount = overview.pendingApprovals;
  const pendingDisbursementCount = overview.pendingDisbursements;
  const totalRequestsYTD = overview.totalRequestsYTD;
  const urgentFlags = overview.urgentFlags;

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

          setIsLoading(false);
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
  }, [setCurrentUser, setIsLoading, router]);

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
            value={isChainLoading ? "—" : pendingApprovalCount}
            icon={CheckSquare}
            variant="brand"
            trend="Across municipal jurisdictions"
            trendIcon={TrendingUp}
          />
          <StatCard
            label="Pending Disbursements"
            value={isRecordsLoading ? "—" : pendingDisbursementCount}
            icon={FileText}
            trend="Awaiting audit review"
          />
          <StatCard
            label="Total Requests YTD"
            value={isRecordsLoading ? "—" : totalRequestsYTD.toLocaleString()}
            icon={TrendingUp}
            trend={
              lastSyncedAt
                ? `Last sync: ${lastSyncedAt.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}`
                : "Awaiting first sync"
            }
          />
          <StatCard
            label="Urgent Flags"
            value={isChainLoading ? "—" : urgentFlags}
            icon={AlertCircle}
            trend="Pending approvals over 7 days old"
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
                  Live
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
                      {formatCurrency(overview.totalBudget)}
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
                      {formatCurrency(overview.approvedAmount)}
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
                      {formatCurrency(overview.remainingBudget)}
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
