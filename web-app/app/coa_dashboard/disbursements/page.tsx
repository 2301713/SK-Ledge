"use client";

import LogoLoader from "@/components/LogoLoader";
import { useEffect, useRef, useState } from "react";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import StatCard from "@/components/dashboard/ui/StatCard";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import StatusBadge from "@/components/dashboard/ui/StatusBadge";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/useAuthStore";
import {
  Download,
  Eye,
  FileText,
  MoreHorizontal,
  ShieldCheck,
  BadgeCheck,
  AlertTriangle,
  FileClock,
  Loader2,
  CircleAlert,
} from "lucide-react";

interface SupabaseExpense {
  id: string;
  dv_number?: string;
  reference_number?: string;
  payee?: string;
  category?: string;
  purpose?: string;
  amount: number;
  date_submitted?: string;
  created_at?: string;
  compliance_status?: string;
  barangay?: string;
}

export interface DisbursementItem {
  id: string;
  payee: string;
  category: string;
  amount: number;
  dateSubmitted: string;
  compliance: "Clean" | "Flagged" | "Pending Docs";
  brgy: string;
}

type StatusFilter = "all" | "Clean" | "Flagged" | "Pending Docs";

const mapCompliance = (
  rawStatus?: string,
): DisbursementItem["compliance"] => {
  const status = (rawStatus || "Pending Docs").toLowerCase();
  if (status.includes("clean") || status.includes("approved")) return "Clean";
  if (status.includes("flag") || status.includes("rejected")) return "Flagged";
  return "Pending Docs";
};

export default function DisbursementsPage() {
  const { currentUser, isLoading, setCurrentUser, setIsLoading } =
    useAuthStore();
  const [disbursements, setDisbursements] = useState<DisbursementItem[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
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
          setIsLoading(false);
          setTimeout(() => router.push("/login"), 100);
          return;
        }

        if (profileData) {
          if (profileData.role_type !== "COA") {
            console.warn("Unauthorized access: User is not a COA member.");
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
          console.warn("No profile data found for user");
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
  }, [setCurrentUser, setIsLoading, router]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchDisbursements = async () => {
      try {
        setIsDataLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("expenses")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        if (data) {
          setDisbursements(
            data.map((item: SupabaseExpense): DisbursementItem => {
              const rawAmount =
                typeof item.amount === "number"
                  ? item.amount
                  : parseFloat(String(item.amount ?? "0"));
              const pesoAmount =
                (Number.isFinite(rawAmount) ? rawAmount : 0) / 100;

              const rawDate =
                item.date_submitted ||
                item.created_at ||
                new Date().toISOString();
              const dateSubmitted = new Date(rawDate).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                },
              );

              const dvRef =
                item.dv_number ||
                item.reference_number ||
                (item.id ? `DV-${item.id.slice(0, 8).toUpperCase()}` : "DV-N/A");

              return {
                id: dvRef,
                payee: item.payee || item.purpose || "N/A",
                category: item.category || "General MOOE",
                amount: pesoAmount,
                dateSubmitted,
                compliance: mapCompliance(item.compliance_status),
                brgy: item.barangay || "Unassigned Brgy",
              };
            }),
          );
        }
      } catch (err) {
        console.error("Error fetching disbursements:", err);
        setError("Failed to load disbursement records from Supabase.");
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchDisbursements();
  }, [currentUser]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const cleanCount = disbursements.filter(
    (item) => item.compliance === "Clean",
  ).length;
  const flaggedCount = disbursements.filter(
    (item) => item.compliance === "Flagged",
  ).length;
  const incompleteCount = disbursements.filter(
    (item) => item.compliance === "Pending Docs",
  ).length;

  const filtered = disbursements.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.id.toLowerCase().includes(query) ||
      item.payee.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.brgy.toLowerCase().includes(query);
    const matchesStatus =
      statusFilter === "all" || item.compliance === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            You do not have the required credentials to view COA
            Disbursements.
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
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <PageHeader
          eyebrow="Audit Ledger"
          title="Pending Disbursements"
          subtitle="Review live blockchain-verified vouchers, verify supporting documents, and conduct audit actions."
          actions={
            <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-secondary">
              <Download className="h-4 w-4" />
              Export Report
            </button>
          }
        />

        {/* STAT ROW */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            label="Clean"
            value={cleanCount}
            icon={BadgeCheck}
            variant="brand"
            trend="Compliant vouchers"
          />
          <StatCard
            label="Flagged"
            value={flaggedCount}
            icon={AlertTriangle}
            trend="Require follow-up"
          />
          <StatCard
            label="Incomplete Docs"
            value={incompleteCount}
            icon={FileClock}
            trend="Pending documents"
          />
        </div>

        {/* QUICK FILTERS */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["all", "All Pending"],
              ["Clean", "Clean"],
              ["Flagged", "Flagged"],
              ["Pending Docs", "Incomplete"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest transition ${
                statusFilter === key
                  ? "bg-primary text-white shadow-sm"
                  : "border border-border bg-white text-secondary-foreground hover:bg-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* AUDIT TABLE */}
        <Card>
          <CardHeader
            eyebrow="Voucher Review"
            title="Disbursement Ledger"
            subtitle="Latest pending disbursements awaiting audit"
          />

          <div className="overflow-x-auto">
            {isDataLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-tertiary" />
                <p className="text-sm font-bold text-secondary-foreground">
                  Fetching live disbursement records...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <CircleAlert className="mb-3 h-10 w-10 text-danger" />
                <p className="text-sm font-bold text-danger">{error}</p>
              </div>
            ) : (
              <>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                      <th className="px-4 py-3">DV Reference</th>
                      <th className="px-4 py-3">Payee / Entity</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-center">Docs Status</th>
                      <th className="px-4 py-3 text-right">Audit Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((item) => (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-secondary/50"
                      >
                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-secondary-foreground">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold tracking-tight text-primary-foreground">
                                {item.id}
                              </p>
                              <p className="text-[11px] font-semibold text-secondary-foreground">
                                {item.dateSubmitted}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <p className="text-sm font-bold text-primary-foreground">
                            {item.payee}
                          </p>
                          <p className="mt-0.5 text-[11px] text-secondary-foreground">
                            {item.brgy}
                          </p>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <span className="inline-flex rounded-lg border border-border bg-secondary/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                            {item.category}
                          </span>
                        </td>

                        <td className="px-4 py-4 align-middle text-right">
                          <span className="text-sm font-bold tracking-tight text-primary-foreground tabular-nums">
                            {formatCurrency(item.amount)}
                          </span>
                        </td>

                        <td className="px-4 py-4 align-middle text-center">
                          <StatusBadge status={item.compliance} />
                        </td>

                        <td className="px-4 py-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="rounded-xl p-2 text-secondary-foreground transition hover:bg-success/10 hover:text-success"
                              title="Review Vouchers"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="rounded-xl p-2 text-secondary-foreground transition hover:bg-secondary">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            <button className="rounded-xl bg-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm transition hover:bg-primary/90">
                              Audit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center border-t border-border p-12 text-center">
                    <ShieldCheck className="mb-3 h-10 w-10 text-secondary-foreground/30" />
                    <p className="text-sm font-bold text-secondary-foreground">
                      No disbursements match your filters.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
