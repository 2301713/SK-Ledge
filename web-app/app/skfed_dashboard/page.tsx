"use client";

import LogoLoader from "@/components/LogoLoader";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import StatCard from "@/components/dashboard/ui/StatCard";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import { supabase } from "@/lib/supabase";
import BroadcastMemoModal from "@/components/dashboard/BroadcastMemoModal";
import { useAuthStore } from "@/lib/useAuthStore";
import {
  Building2,
  Megaphone,
  FileText,
  ChevronRight,
  TrendingUp,
  FolderKanban,
  CircleAlert,
  BadgeCheck,
} from "lucide-react";

export default function SKFederationDashboard() {
  const {
    currentUser,
    isLoading,
    setCurrentUser,
    setIsLoading,
    isModalOpen,
    setIsModalOpen,
  } = useAuthStore();
  const router = useRouter();
  const authAttemptedRef = useRef(false);

  // 1. AUTHENTICATION & ROLE PROTECTION
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          console.log("No authenticated user, redirecting to login");
          router.push("/login");
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, full_name, role_type, barangay")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError.message);
          setIsLoading(false);
          setTimeout(() => router.push("/login"), 100);
          return;
        }

        if (profileData) {
          if (profileData.role_type !== "SK_Federation") {
            console.warn("Unauthorized: User is not an SK Federation Official");
            setIsLoading(false);
            setTimeout(() => router.push("/unauthorized"), 100);
            return;
          }

          setCurrentUser({
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type,
            barangay: profileData.barangay || "City Wide",
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

    // Only fetch once per component mount
    if (!authAttemptedRef.current) {
      authAttemptedRef.current = true;
      fetchUserProfile();
    }
  }, [setCurrentUser, setIsLoading, router]);

  // UTILITY
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  // LOADING STATE
  if (isLoading) return <LogoLoader />;

  // UNAUTHORIZED / NULL STATE
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
            You do not have the required credentials to view the SK Federation
            Dashboard.
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

  const barangays = [
    { name: "San Jose", chairperson: "Chairperson Cruz", projects: 12, pill: "High Compliance" },
    { name: "Mabini", chairperson: "Chairperson Reyes", projects: 8, pill: "On Track" },
    { name: "Poblacion", chairperson: "Chairperson Santos", projects: 6, pill: "Review" },
  ];

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
          eyebrow="SK Federation"
          title="Federation Command"
          subtitle={`${today} · Monitor constituent performance and city-wide youth budget utilization.`}
          actions={
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_6px_16px_-6px_rgba(1,56,168,0.5)] transition hover:bg-primary/90"
            >
              <Megaphone className="h-4 w-4" />
              Broadcast Memo
            </button>
          }
        />

        {/* STAT ROW */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Constituent Barangays"
            value="24"
            icon={Building2}
            trend="100% active"
          />
          <StatCard
            label="City-Wide Projects"
            value="87"
            icon={FolderKanban}
            trend="Across all barangays"
          />
          <StatCard
            label="Total Youth Budget"
            value={formatCurrency(35000000)}
            icon={TrendingUp}
            variant="brand"
            trend="45% utilized · FY 2026"
          />
          <StatCard
            label="Avg Compliance"
            value="92%"
            icon={BadgeCheck}
            trend="City-wide performance"
          />
        </div>

        {/* OVERSIGHT + COMMUNICATION */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* BARANGAY OVERSIGHT */}
          <Card className="lg:col-span-2">
            <CardHeader
              eyebrow="Monitoring"
              title="Barangay Oversight"
              subtitle="Monitor constituent performance"
              action={
                <button className="inline-flex items-center gap-1 rounded-xl bg-secondary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary transition hover:bg-secondary-foreground/10">
                  View Directory <ChevronRight className="h-4 w-4" />
                </button>
              }
            />

            <div className="space-y-3">
              {barangays.map((b, i) => (
                <div
                  key={b.name}
                  className="group flex items-center justify-between rounded-2xl border border-border bg-secondary/40 p-4 transition-colors hover:bg-secondary"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white font-bold text-secondary-foreground shadow-sm transition-colors group-hover:text-primary">
                      B{i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary-foreground">
                        Barangay {b.name}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                        {b.chairperson}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`mb-1 inline-flex rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest ${
                        b.pill === "High Compliance"
                          ? "bg-success/10 text-success"
                          : b.pill === "On Track"
                            ? "bg-information/10 text-information"
                            : "bg-pending/10 text-pending"
                      }`}
                    >
                      {b.pill}
                    </span>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                      {b.projects} Active Projects
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* ACTIVE BROADCASTS */}
            <Card>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tertiary/20 text-tertiary">
                  <Megaphone className="h-5 w-5" />
                </div>
                <h2 className="text-base font-bold tracking-tight text-primary-foreground">
                  Active Broadcasts
                </h2>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-border bg-secondary/60 p-4">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary" />
                <p className="mb-1 text-xs font-bold text-primary-foreground">
                  Q3 Liquidation Deadline
                </p>
                <p className="text-xs font-medium leading-relaxed text-secondary-foreground">
                  All SK Treasurers must submit their reports to the BMO portal
                  by Friday.
                </p>
              </div>
            </Card>

            {/* FEDERATION VAULT */}
            <div className="rounded-3xl bg-primary-foreground p-6 text-white shadow-[0_8px_28px_-10px_rgba(15,23,42,0.5)] transition-all hover:shadow-[0_12px_36px_-10px_rgba(15,23,42,0.55)]">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-tertiary">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">Federation Vault</h2>
              <p className="mt-1 text-xs font-medium leading-relaxed text-white/60">
                Access standard LGU templates, CBYDP forms, and approved
                resolutions.
              </p>
              <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white/20">
                Open Vault <TrendingUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <BroadcastMemoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitSuccess={() => {
          console.log("Proposal successfully dispatched!");
        }}
      />
    </div>
  );
}
