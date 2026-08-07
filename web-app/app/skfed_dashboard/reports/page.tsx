"use client";

import LogoLoader from "@/components/LogoLoader";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import StatCard from "@/components/dashboard/ui/StatCard";
import DonutGauge from "@/components/dashboard/ui/DonutGauge";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "@/lib/useAuthStore";
import { BRAND, SUCCESS, PENDING, DANGER } from "@/components/dashboard/ui/chartColors";
import {
  FileDown,
  FilePieChart,
  Users2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  TrendingUp,
} from "lucide-react";

export default function SKFederationDashboard() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 1. AUTHENTICATION & ROLE PROTECTION
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
        }

        if (profileData) {
          if (profileData.role_type !== "SK_Federation") {
            console.warn("Unauthorized: User is not an SK Federation Official");
            router.push("/unauthorized");
            return;
          }

          setCurrentUser({
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type,
            barangay: profileData.barangay || "Province Wide",
            email: profileData.email,
            approval_status: profileData.approval_status,
          });
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  // LOADING STATE
  if (isLoading) return <LogoLoader />;

  // UNAUTHORIZED / NULL STATE
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
          hideSearch
        />

        <PageHeader
          eyebrow="SK Federation"
          title="Oversight Reports"
          subtitle="City-wide analytics engine & performance matrix."
          actions={
            <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_6px_16px_-6px_rgba(1,56,168,0.5)] transition hover:bg-primary/90">
              <FileDown className="h-4 w-4" />
              Generate City-Wide LGU Report
            </button>
          }
        />

        {/* STAT ROW */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            label="Projects Completed"
            value="248"
            icon={TrendingUp}
            variant="brand"
            trend="Across the federation"
          />
          <StatCard
            label="Youth Beneficiaries"
            value="14.2k"
            icon={Users2}
            trend="City-wide outreach"
          />
          <StatCard
            label="Total Fund"
            value="₱16.6M"
            icon={FilePieChart}
            trend="FY 2026 allocation"
          />
        </div>

        {/* BUDGET ALLOCATION BREAKDOWN */}
        <Card>
          <CardHeader
            eyebrow="Budget Allocation"
            title="City-Wide Financial Breakdown"
            subtitle="Fund distribution across priority programs"
            action={
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                FY 2026
              </span>
            }
          />

          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[auto_1fr]">
            <DonutGauge
              centerValue="16.6M"
              centerLabel="Total Fund"
              segments={[
                { label: "Sports & Dev", value: 40, color: BRAND },
                { label: "Education", value: 30, color: SUCCESS },
                { label: "Health & Env", value: 20, color: PENDING },
                { label: "Governance", value: 10, color: DANGER },
              ]}
            />

            <div className="space-y-3">
              {[
                { color: BRAND, label: "Sports & Development", pct: "40%", budget: "₱6.64M" },
                { color: SUCCESS, label: "Education / Scholarships", pct: "30%", budget: "₱4.98M" },
                { color: PENDING, label: "Health & Environment", pct: "20%", budget: "₱3.32M" },
                { color: DANGER, label: "Governance & Admin", pct: "10%", budget: "₱1.66M" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-border bg-secondary/40 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-primary-foreground">
                      {item.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-primary-foreground">
                      {item.pct}
                    </span>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                      {item.budget}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* COMPLIANCE MATRIX */}
        <Card>
          <CardHeader
            eyebrow="Compliance"
            title="Barangay Compliance Matrix"
            subtitle="Submission status and impact scoring per barangay"
            action={
              <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                Live
              </div>
            }
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                  <th className="p-4">Barangay Name</th>
                  <th className="p-4 text-center">Submitted CBYDP</th>
                  <th className="p-4 text-center">Submitted ABYIP</th>
                  <th className="p-4 text-center">On-time Liquidation</th>
                  <th className="p-4">Impact Score</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                <tr className="transition-colors hover:bg-secondary/50">
                  <td className="p-4 font-bold text-primary-foreground">
                    Barangay San Jose
                  </td>
                  <td className="p-4 text-center">
                    <CheckCircle2 className="mx-auto text-success" size={20} />
                  </td>
                  <td className="p-4 text-center">
                    <CheckCircle2 className="mx-auto text-success" size={20} />
                  </td>
                  <td className="p-4 text-center">
                    <XCircle className="mx-auto text-danger/60" size={20} />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-full max-w-24 overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: "65%" }}
                        />
                      </div>
                      <span className="text-xs font-bold text-primary-foreground">
                        65%
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-primary transition hover:bg-primary hover:text-white">
                      <ExternalLink size={14} />
                      Drill-Down
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
