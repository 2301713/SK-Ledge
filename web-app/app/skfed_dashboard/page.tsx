"use client";

import LogoLoader from "@/components/LogoLoader";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import StatCard from "@/components/dashboard/ui/StatCard";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import { supabase } from "@/lib/supabase";
import BroadcastMemoModal from "@/components/dashboard/BroadcastMemoModal";
import { useAuthStore } from "@/lib/useAuthStore";
import { useRecordsSync } from "@/lib/useRecordsSync";
import { sumAmountCentavos } from "@/lib/records";
import { canonicalizeBarangay } from "@/lib/batangasBarangays";
import {
  MEMO_AUDIENCE_LABELS,
  MEMO_PRIORITY_LABELS,
  type FederationMemo,
} from "@/lib/memos";
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

interface FederationProject {
  id: string;
  name: string;
  status: string;
  budget: number;
  barangay: string;
  is_open_for_bidding: boolean;
  bid_deadline: string | null;
}

interface FederationOfficial {
  id: string;
  full_name: string;
  role_type: string;
  barangay: string;
}

interface BarangayRow {
  name: string;
  chairperson: string;
  activeProjects: number;
  totalProjects: number;
  awardedProjects: number;
  pill: "High Compliance" | "On Track" | "Review";
}

const CLOSED_PROJECT_STATUSES = new Set(["Awarded", "Completed", "Rejected"]);

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
  const [projects, setProjects] = useState<FederationProject[]>([]);
  const [officials, setOfficials] = useState<FederationOfficial[]>([]);
  const [memos, setMemos] = useState<FederationMemo[]>([]);
  const [memosLoading, setMemosLoading] = useState(true);

  const { records } = useRecordsSync({
    enabled: Boolean(currentUser),
    limit: 500,
  });

  const loadMemos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("federation_memos")
        .select("id, sender_id, subject, body, priority, audience, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        throw new Error(error.message);
      }

      setMemos((data ?? []) as FederationMemo[]);
    } catch (err) {
      console.error("Failed to load federation memos:", err);
    } finally {
      setMemosLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      void loadMemos();
    }
  }, [currentUser, loadMemos]);

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

  useEffect(() => {
    if (!currentUser) return;

    let active = true;
    const fetchFederationData = async () => {
      const [projectsResult, officialsResult] = await Promise.all([
        supabase
          .from("projects")
          .select(
            "id, name, status, budget, barangay, is_open_for_bidding, bid_deadline",
          ),
        supabase
          .from("profiles")
          .select("id, full_name, role_type, barangay")
          .in("role_type", ["SK_Chairperson", "SK_Treasurer"]),
      ]);

      if (!active) return;

      if (projectsResult.error) {
        console.error(
          "Error fetching federation projects:",
          projectsResult.error.message,
        );
      } else {
        setProjects(
          (projectsResult.data ?? []).map((project) => ({
            id: String(project.id),
            name: project.name || "Unnamed project",
            status: (project.status as string) || "Proposed",
            budget: Number(project.budget) || 0,
            barangay:
              canonicalizeBarangay(project.barangay ?? "") ??
              project.barangay ??
              "Unassigned",
            is_open_for_bidding: Boolean(project.is_open_for_bidding),
            bid_deadline: project.bid_deadline ?? null,
          })),
        );
      }

      if (officialsResult.error) {
        console.error(
          "Error fetching SK officials:",
          officialsResult.error.message,
        );
      } else {
        setOfficials(
          (officialsResult.data ?? []).map((official) => ({
            id: String(official.id),
            full_name: official.full_name || official.role_type || "SK Official",
            role_type: official.role_type || "",
            barangay:
              canonicalizeBarangay(official.barangay ?? "") ??
              official.barangay ??
              "Unassigned",
          })),
        );
      }
    };

    fetchFederationData();
    return () => {
      active = false;
    };
  }, [currentUser]);

  const barangays = useMemo<BarangayRow[]>(() => {
    const chairpersonByBarangay = new Map<string, string>();
    for (const official of officials) {
      if (
        official.role_type === "SK_Chairperson" &&
        !chairpersonByBarangay.has(official.barangay)
      ) {
        chairpersonByBarangay.set(official.barangay, official.full_name);
      }
    }

    const rows = new Map<string, BarangayRow>();
    const ensureRow = (name: string) => {
      let row = rows.get(name);
      if (!row) {
        row = {
          name,
          chairperson: chairpersonByBarangay.get(name) ?? "No chairperson on file",
          activeProjects: 0,
          totalProjects: 0,
          awardedProjects: 0,
          pill: "Review",
        };
        rows.set(name, row);
      }
      return row;
    };

    for (const official of officials) {
      ensureRow(official.barangay);
    }

    for (const project of projects) {
      const row = ensureRow(project.barangay);
      row.totalProjects += 1;
      if (project.status === "Awarded") {
        row.awardedProjects += 1;
      }
      if (!CLOSED_PROJECT_STATUSES.has(project.status)) {
        row.activeProjects += 1;
      }
    }

    return Array.from(rows.values())
      .map((row) => {
        const awardedRatio =
          row.totalProjects > 0 ? row.awardedProjects / row.totalProjects : 0;
        const pill: BarangayRow["pill"] =
          awardedRatio >= 0.6
            ? "High Compliance"
            : awardedRatio >= 0.25
              ? "On Track"
              : "Review";
        return { ...row, pill };
      })
      .sort((a, b) => b.totalProjects - a.totalProjects);
  }, [officials, projects]);

  const federationStats = useMemo(() => {
    const totalAllocated = sumAmountCentavos(records, "allocation") / 100;
    const totalSpent = sumAmountCentavos(records, "expense") / 100;
    const utilization =
      totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;
    const scored = barangays.filter((row) => row.totalProjects > 0);
    const avgCompliance =
      scored.length > 0
        ? Math.round(
            scored.reduce(
              (sum, row) =>
                sum + (row.awardedProjects / row.totalProjects) * 100,
              0,
            ) / scored.length,
          )
        : 0;

    return {
      totalAllocated,
      utilization,
      avgCompliance,
      barangayCount: barangays.length,
      projectCount: projects.length,
    };
  }, [records, barangays, projects]);

  const openBidding = useMemo(() => {
    return [...projects]
      .filter(
        (project) =>
          project.is_open_for_bidding &&
          !CLOSED_PROJECT_STATUSES.has(project.status),
      )
      .sort((a, b) => {
        const aTime = a.bid_deadline ? Date.parse(a.bid_deadline) : Infinity;
        const bTime = b.bid_deadline ? Date.parse(b.bid_deadline) : Infinity;
        return aTime - bTime;
      })
      .slice(0, 2);
  }, [projects]);

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
            value={federationStats.barangayCount}
            icon={Building2}
            trend="Barangays with SK records"
          />
          <StatCard
            label="City-Wide Projects"
            value={federationStats.projectCount}
            icon={FolderKanban}
            trend="Across all barangays"
          />
          <StatCard
            label="Total Youth Budget"
            value={formatCurrency(federationStats.totalAllocated)}
            icon={TrendingUp}
            variant="brand"
            trend={`${federationStats.utilization}% utilized · Live ledger`}
          />
          <StatCard
            label="Avg Compliance"
            value={`${federationStats.avgCompliance}%`}
            icon={BadgeCheck}
            trend="Awarded share across barangays"
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
              {barangays.length === 0 && (
                <p className="rounded-2xl border border-dashed border-border bg-secondary/40 p-6 text-center text-xs font-medium text-secondary-foreground">
                  No barangay records yet. Registered SK officials and projects
                  will appear here automatically.
                </p>
              )}
              {barangays.slice(0, 6).map((b, i) => (
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
                      {b.activeProjects} Active Projects
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
                  Open Bidding Notices
                </h2>
              </div>

              <div className="space-y-3">
                {openBidding.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-border bg-secondary/40 p-4 text-xs font-medium leading-relaxed text-secondary-foreground">
                    No projects are open for bidding right now.
                  </p>
                )}
                {openBidding.map((project) => (
                  <div
                    key={project.id}
                    className="relative overflow-hidden rounded-2xl border border-border bg-secondary/60 p-4"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary" />
                    <p className="mb-1 text-xs font-bold text-primary-foreground">
                      {project.name}
                    </p>
                    <p className="text-xs font-medium leading-relaxed text-secondary-foreground">
                      {project.barangay} ·{" "}
                      {project.bid_deadline
                        ? `Bids close ${new Date(
                            project.bid_deadline,
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}`
                        : "No deadline set"}
                    </p>
                  </div>
                ))}
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

        {/* BROADCAST MEMO LOG */}
        <Card>
          <CardHeader
            eyebrow="Communications"
            title="Broadcast Memo Log"
            subtitle="Published federation memos, newest first."
            action={
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                {memos.length}
              </span>
            }
          />

          {memosLoading ? (
            <p className="py-8 text-center text-xs font-medium text-secondary-foreground">
              Loading memos…
            </p>
          ) : memos.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-secondary">
                <Megaphone className="h-5 w-5 text-secondary-foreground" />
              </div>
              <p className="text-sm font-bold text-primary-foreground">
                No memos published yet
              </p>
              <p className="mt-1 text-xs text-secondary-foreground">
                Published broadcasts will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {memos.map((memo) => (
                <div
                  key={memo.id}
                  className="rounded-2xl border border-border bg-secondary/30 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                          memo.priority === "urgent"
                            ? "bg-danger/10 text-danger"
                            : memo.priority === "event"
                              ? "bg-information/10 text-information"
                              : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {MEMO_PRIORITY_LABELS[memo.priority]}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-secondary-foreground">
                        {MEMO_AUDIENCE_LABELS[memo.audience]}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-secondary-foreground">
                      {new Date(memo.created_at).toLocaleString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-primary-foreground">
                    {memo.subject}
                  </p>
                  <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs leading-relaxed text-secondary-foreground">
                    {memo.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>

      <BroadcastMemoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitSuccess={() => {
          void loadMemos();
        }}
      />
    </div>
  );
}
