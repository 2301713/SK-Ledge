"use client";

import LogoLoader from "@/components/LogoLoader";
import { useEffect, useRef, useState } from "react";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import StatCard from "@/components/dashboard/ui/StatCard";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/useAuthStore";
import AllocateFundsForm from "@/components/AllocateFundsForm";
import {
  Plus,
  ChevronRight,
  CheckCircle2,
  Clock,
  FolderKanban,
  PiggyBank,
  Receipt,
  TrendingUp,
  Wallet,
  CircleAlert,
  FileText,
} from "lucide-react";

export default function SKDashboard() {
  const { currentUser, isLoading, setCurrentUser, setIsLoading } = useAuthStore();
  const router = useRouter();
  const authAttemptedRef = useRef(false);
  const [projects, setProjects] = useState<
    { id: string; name: string; category: string; status: string; budget: number }[]
  >([]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (
        currentUser &&
        (currentUser.role_type === "SK_Chairperson" ||
          currentUser.role_type === "SK_Treasurer")
      ) {
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
          if (
            profileData.role_type !== "SK_Chairperson" &&
            profileData.role_type !== "SK_Treasurer"
          ) {
            console.warn("Unauthorized access: User is not an SK Official");
            setIsLoading(false);
            setTimeout(() => router.push("/unauthorized"), 100);
            return;
          }

          setCurrentUser({
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type,
            barangay: profileData.barangay || "No Barangay Assigned",
            email: profileData.email,
            approval_status: profileData.approval_status,
          });

          setIsLoading(false);
        } else {
          console.warn("No profile data found");
          setIsLoading(false);
          setTimeout(() => router.push("/login"), 100);
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
        setIsLoading(false);
        setTimeout(() => router.push("/login"), 100);
      }
    };

    if (!authAttemptedRef.current) {
      authAttemptedRef.current = true;
      fetchUserProfile();
    }
  }, [setCurrentUser, setIsLoading, router, currentUser]);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching projects:", error.message);
        return;
      }

      if (data) {
        setProjects(
          data.map((item) => ({
            id: String(item.id),
            name: item.name || "Unnamed Project",
            category: item.category || "General Fund",
            status: (item.status as string) || "Pending",
            budget: Number(item.budget) || 0,
          })),
        );
      }
    };

    fetchProjects();
  }, []);

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
            You do not have the required credentials or an active session to
            view this official dashboard.
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

  const totalAllocated = 1250000;
  const totalSpent = 165000;
  const percentageSpent = (totalSpent / totalAllocated) * 100;
  const availableFunds = totalAllocated - totalSpent;
  const pendingCount = projects.filter((p) => p.status === "Pending").length;
  const approvedCount = projects.filter((p) => p.status === "Approved").length;
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
          eyebrow={`Barangay ${currentUser.barangay}`}
          title={`Welcome back, ${currentUser.full_name.split(" ")[0]}!`}
          subtitle={`${today} · ${pendingCount} project(s) pending approval and the fiscal year budget is operating at optimal capacity.`}
          actions={
            <>
              <button
                onClick={() => router.push("/sk_dashboard/projects")}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_6px_16px_-6px_rgba(1,56,168,0.5)] transition hover:bg-primary/90"
              >
            <Plus className="h-4 w-4" />
            Propose New Project
          </button>
              <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-secondary">
                <FileText className="h-4 w-4" />
                View Ledger
              </button>
            </>
          }
        />

        {/* STAT ROW */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Allocation"
            value={formatCurrency(totalAllocated)}
            icon={Wallet}
            variant="brand"
            trend={`${projects.length} projects proposed`}
            trendIcon={FolderKanban}
          />
          <StatCard
            label="Total Spent"
            value={formatCurrency(totalSpent)}
            icon={Receipt}
            trend={`${percentageSpent.toFixed(0)}% utilized`}
            trendIcon={TrendingUp}
          />
          <StatCard
            label="Available Funds"
            value={formatCurrency(availableFunds)}
            icon={PiggyBank}
            trend="Remaining for the fiscal year"
          />
          <StatCard
            label="Pending Reviews"
            value={pendingCount}
            icon={Clock}
            trend={`${approvedCount} approved so far`}
            trendIcon={CheckCircle2}
          />
        </div>

        {/* ALLOCATE FUNDS */}
        <Card>
          <CardHeader
            eyebrow="Blockchain"
            title="Budget Allocation"
            subtitle="Record official SK funds directly on the Sepolia ledger"
          />
          <div className="max-w-xl">
            <AllocateFundsForm />
          </div>
        </Card>

        {/* ACTIVE PROPOSALS */}
        <Card>
          <CardHeader
            eyebrow="Ledger"
            title="Active Proposals"
            subtitle="Recent entries in the ledger"
            action={
              <button className="inline-flex items-center gap-1 rounded-xl bg-secondary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary transition hover:bg-secondary-foreground/10">
                View All <ChevronRight className="h-4 w-4" />
              </button>
            }
          />

          <div className="space-y-4">
            {projects.map((p) => (
              <div
                key={p.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-border bg-secondary/40 p-5 transition-all group hover:bg-secondary"
              >
                <div className="flex items-center gap-5 md:w-1/3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-white text-secondary-foreground shadow-sm transition-colors group-hover:text-primary">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-primary-foreground leading-tight transition-colors group-hover:text-primary">
                      {p.name}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                      ID: PRJ-
                      {p.id.length > 8
                        ? p.id.slice(0, 8).toUpperCase()
                        : p.id.padStart(4, "0")}
                    </p>
                  </div>
                </div>

                <div className="md:w-1/4">
                  <span className="inline-flex rounded-lg border border-border bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-secondary-foreground shadow-sm">
                    {p.category}
                  </span>
                </div>

                <div className="md:w-1/4">
                  <span
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${
                      p.status === "Approved"
                        ? "bg-success/10 text-success"
                        : p.status === "Pending"
                          ? "bg-pending/10 text-pending"
                          : "bg-danger/10 text-danger"
                    }`}
                  >
                    {p.status === "Approved" && (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    {p.status === "Pending" && (
                      <Clock className="h-3.5 w-3.5" />
                    )}
                    {p.status}
                  </span>
                </div>

                <div className="text-left md:text-right md:w-1/4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                    Budget
                  </p>
                  <span className="text-lg font-bold tracking-tight text-primary-foreground">
                    {formatCurrency(p.budget)}
                  </span>
                </div>
              </div>
            ))}

            {projects.length === 0 && (
              <div className="p-12 text-center border-2 border-dashed border-border rounded-3xl">
                <FolderKanban className="h-12 w-12 text-secondary-foreground/30 mx-auto mb-4" />
                <p className="text-sm font-bold text-secondary-foreground">
                  No active projects found.
                </p>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
