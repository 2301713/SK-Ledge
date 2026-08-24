"use client";

import LogoLoader from "@/components/LogoLoader";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import StatCard from "@/components/dashboard/ui/StatCard";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import StatusBadge from "@/components/dashboard/ui/StatusBadge";
import { useAuthStore } from "@/lib/useAuthStore";
import { INITIAL_PROJECTS } from "@/lib/dummyData";
import { supabase } from "@/lib/supabase";
import {
  ShieldCheck,
  MapPin,
  Activity,
  FileText,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  CircleAlert,
  Landmark,
} from "lucide-react";

export default function BMODashboard() {
  const { currentUser, isLoading, setCurrentUser, setIsLoading } =
    useAuthStore();
  const router = useRouter();
  const authAttemptedRef = useRef(false);

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
          return;
        }

        if (profileData) {
          if (profileData.role_type !== "BMO") {
            console.warn("Unauthorized access: User is not a BMO member.");
            setIsLoading(false);
            router.push("/unauthorized");
            return;
          }

          setCurrentUser({
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type as "BMO",
            barangay: profileData.barangay || "No Barangay Assigned",
            email: profileData.email,
            approval_status: profileData.approval_status,
          });
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
        setIsLoading(false);
      }
    };

    // Only fetch once per component mount
    if (!authAttemptedRef.current) {
      authAttemptedRef.current = true;
      fetchUserProfile();
    }
  }, [router, setCurrentUser, setIsLoading]);

  const pendingProjects = INITIAL_PROJECTS.filter(
    (p) => p.status === "Pending",
  );

  const pendingCount = pendingProjects.length;

  const totalValue = INITIAL_PROJECTS.reduce(
    (acc, curr) => acc + curr.budget,
    0,
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount || 0);
  };

  if (isLoading) return <LogoLoader />;

  // Prevent rendering if currentUser failed to load
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
            You do not have the required credentials to view the BMO Dashboard.
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

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
          eyebrow="Budget Management Office"
          title={`Welcome back, ${currentUser.full_name.split(" ")[0]}!`}
          subtitle={`${today} · ${pendingCount} project(s) pending budget alignment and the fiscal year budget is in a healthy position.`}
          actions={
            <>
              <button
                onClick={() => router.push("/bmo_dashboard/review")}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_6px_16px_-6px_rgba(1,56,168,0.5)] transition hover:bg-primary/90"
              >
                <ClipboardCheck className="h-4 w-4" />
                Review Queue
              </button>
              <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-secondary">
                <Landmark className="h-4 w-4" />
                View Ledger
              </button>
            </>
          }
        />

        {/* STAT ROW */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            label="Pending Alignment"
            value={pendingCount}
            icon={ClipboardCheck}
            variant="brand"
            trend="Requests awaiting review"
          />
          <StatCard
            label="Total Managed"
            value={formatCurrency(totalValue)}
            icon={Landmark}
            trend="Overall LGU youth budget"
          />
          <StatCard
            label="Utilization Rate"
            value="68%"
            icon={Activity}
            trend="Live utilization across barangays"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* REVIEW QUEUE */}
          <Card className="lg:col-span-2">
            <CardHeader
              eyebrow="Action Center"
              title="Project Review Queue"
              subtitle="Proposals awaiting BMO budget alignment"
              action={
                <button
                  onClick={() => router.push("/bmo_dashboard/review")}
                  className="rounded-xl bg-secondary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary transition hover:bg-secondary-foreground/10"
                >
                  View All
                </button>
              }
            />

            {pendingProjects.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm font-bold text-secondary-foreground">
                  Inbox zero — no pending proposals.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex flex-col gap-4 rounded-2xl border border-border bg-secondary/40 p-5 transition-colors hover:bg-secondary md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <StatusBadge status="pending" showDot />
                        <span className="text-[11px] font-semibold text-secondary-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {project.barangay || "Barangay info missing"}
                        </span>
                      </div>
                      <h3 className="truncate text-sm font-bold text-primary-foreground">
                        {project.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-secondary-foreground">
                        {project.description ||
                          "No detailed description provided by the SK official."}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                          Requested
                        </p>
                        <p className="text-lg font-bold tracking-tight text-primary">
                          {formatCurrency(project.budget)}
                        </p>
                      </div>
                      <button
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success transition hover:bg-success hover:text-white"
                        title="Align & Approve"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </button>
                      <button
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger transition hover:bg-danger hover:text-white"
                        title="Return to SK"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* SIDEBAR COLUMN */}
          <div className="space-y-6">
            {/* DOCUMENT VERIFICATION VAULT */}
            <div className="rounded-3xl bg-primary-foreground p-6 text-white shadow-[0_8px_28px_-10px_rgba(15,23,42,0.5)]">
              <div className="mb-4 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-tertiary" />
                <h3 className="text-base font-bold tracking-tight">
                  Document Verification Vault
                </h3>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-tertiary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        Q2_Liquidation_Report.pdf
                      </p>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">
                        Awaiting BMO verification
                      </p>
                    </div>
                  </div>
                  <button className="shrink-0 rounded-xl bg-tertiary px-4 py-2 text-xs font-bold text-primary transition hover:bg-white">
                    Open Vault
                  </button>
                </div>
              </div>
            </div>

            {/* BARANGAY DIRECTORY */}
            <Card>
              <CardHeader eyebrow="Monitoring" title="Barangay Directory" />
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-3.5">
                  <span className="text-sm font-bold text-primary-foreground">
                    San Miguel
                  </span>
                  <span className="h-2.5 w-2.5 rounded-full bg-success" />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-3.5">
                  <span className="text-sm font-bold text-primary-foreground">
                    Poblacion Uno
                  </span>
                  <span className="h-2.5 w-2.5 rounded-full bg-pending" />
                </div>
              </div>
            </Card>

            {/* COMPLIANCE LEDGER */}
            <Card>
              <CardHeader eyebrow="Audit Trail" title="Compliance Ledger" />
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-success bg-white">
                    <span className="h-2 w-2 rounded-full bg-success" />
                  </span>
                  <div>
                    <p className="text-xs font-bold leading-tight text-primary-foreground">
                      BMO Approved Project Alignment
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-secondary-foreground">
                      2 mins ago
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-border bg-white">
                    <span className="h-2 w-2 rounded-full bg-border" />
                  </span>
                  <div>
                    <p className="text-xs font-bold leading-tight text-secondary-foreground">
                      New Liquidation Uploaded
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-secondary-foreground">
                      1 hour ago
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Subtle Bottom Accent */}
        <p className="pt-2 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-secondary-foreground/50">
          SK-Ledge Smart Auditing System • Fiscal Year 2026
        </p>
      </main>
    </div>
  );
}
