"use client";

import LogoLoader from "@/components/LogoLoader";
import { useEffect, useState } from "react";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import StatCard from "@/components/dashboard/ui/StatCard";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import StatusBadge from "@/components/dashboard/ui/StatusBadge";
import { supabase } from "@/lib/supabase";
import { pendingDisbursements } from "../types";
import { useRouter } from "next/navigation";
import { UserAccount } from "@/lib/useAuthStore";
import {
  Download,
  Eye,
  FileText,
  MoreHorizontal,
  ShieldCheck,
  BadgeCheck,
  AlertTriangle,
  FileClock,
} from "lucide-react";

export default function DisbursementsPage() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "clean" | "flagged" | "pending docs"
  >("all");
  const router = useRouter();

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
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const cleanCount = pendingDisbursements.filter(
    (item) => item.compliance === "Clean",
  ).length;
  const flaggedCount = pendingDisbursements.filter(
    (item) => item.compliance === "Flagged",
  ).length;
  const incompleteCount = pendingDisbursements.filter(
    (item) => item.compliance === "Pending Docs",
  ).length;

  const filtered = pendingDisbursements.filter((item) => {
    const matchesSearch =
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.payee.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || item.compliance === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) return <LogoLoader />;

  if (!currentUser) return null;

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
          subtitle="Review vouchers, verify supporting documents, and conduct audit actions."
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
              ["clean", "Clean"],
              ["flagged", "Flagged"],
              ["pending docs", "Incomplete"],
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
          </div>
        </Card>
      </main>
    </div>
  );
}
