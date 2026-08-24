"use client";

import LogoLoader from "@/components/LogoLoader";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "@/lib/useAuthStore";
import { useReadContracts } from "wagmi";
import type { ContractFunctionParameters } from "viem";
import { CONTRACT_ADDRESS, SK_LEDGE_ABI } from "@/lib/contractConfig";
import SetCeilingForm from "@/components/SetCeilingForm";

const KNOWN_BARANGAYS = [
  "San Luis",
  "Balagtas",
  "Batangas",
  "Poblacion 1",
  "Poblacion 2",
];

const formatPeso = (amount: number) =>
  `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function CeilingPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          if (profileData.role_type !== "SK_Chairperson") {
            console.warn(
              "Unauthorized access: Only SK Chairperson can manage ceilings.",
            );
            router.push("/unauthorized");
            return;
          }

          const profile = {
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type,
            barangay: profileData.barangay || "SK",
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

  const ceilingCalls: ContractFunctionParameters<typeof SK_LEDGE_ABI>[] =
    KNOWN_BARANGAYS.map((barangay) => ({
      address: CONTRACT_ADDRESS,
      abi: SK_LEDGE_ABI,
      functionName: "allocationCeilings",
      args: [barangay],
    }));

  const allocatedCalls: ContractFunctionParameters<typeof SK_LEDGE_ABI>[] =
    KNOWN_BARANGAYS.map((barangay) => ({
      address: CONTRACT_ADDRESS,
      abi: SK_LEDGE_ABI,
      functionName: "getAllocated",
      args: [barangay],
    }));

  const { data: ceilingsData, isLoading: ceilingsLoading } = useReadContracts({
    contracts: ceilingCalls,
  });

  const { data: allocatedData, isLoading: allocatedLoading } =
    useReadContracts({
      contracts: allocatedCalls,
    });

  const barangayData = useMemo(() => {
    return KNOWN_BARANGAYS.map((barangay, index) => {
      const ceilingItem = ceilingsData?.[index] as
        | { result?: bigint }
        | undefined;

      const allocatedItem = allocatedData?.[index] as
        | { result?: bigint }
        | undefined;

      const ceilingRaw = ceilingItem?.result ?? BigInt(0);
      const allocatedRaw = allocatedItem?.result ?? BigInt(0);

      const ceilingPeso = Number(ceilingRaw) / 100;
      const allocatedPeso = Number(allocatedRaw) / 100;

      const percentage =
        ceilingPeso > 0
          ? Math.min(Math.round((allocatedPeso / ceilingPeso) * 100), 100)
          : 0;

      return {
        barangay,
        ceilingPeso,
        allocatedPeso,
        percentage,
        isConfigured: ceilingPeso > 0,
      };
    });
  }, [ceilingsData, allocatedData]);

  const totalCeiling = useMemo(
    () =>
      barangayData.reduce((total, barangay) => total + barangay.ceilingPeso, 0),
    [barangayData],
  );

  const totalAllocated = useMemo(
    () =>
      barangayData.reduce(
        (total, barangay) => total + barangay.allocatedPeso,
        0,
      ),
    [barangayData],
  );

  const configuredCount = useMemo(
    () => barangayData.filter((barangay) => barangay.isConfigured).length,
    [barangayData],
  );

  const averageUtilization =
    totalCeiling > 0
      ? Math.min(Math.round((totalAllocated / totalCeiling) * 100), 100)
      : 0;

  if (isLoading) return <LogoLoader />;

  return (
    <div className="flex min-h-screen gap-4 bg-background p-4 selection:bg-tertiary selection:text-primary">
      {currentUser && (
        <SideBar
          userName={currentUser.full_name}
          roleType={currentUser.role_type}
          barangay={currentUser.barangay}
        />
      )}

      <main className="min-w-0 flex-1 space-y-6 py-2 animate-fadein">
        <TopBar
          userName={currentUser?.full_name ?? "SK Official"}
          userEmail={currentUser?.email}
          hideSearch
        />

        {/* ================= PAGE HEADER ================= */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] via-transparent to-indigo-500/[0.05]" />

          {/* Binigyan ng pt-6 sm:pt-8 para hindi magupit ang "SK Officials" text sa taas */}
          <div className="relative pt-6 sm:pt-8">
            <PageHeader
              eyebrow="SK Officials"
              title="Allocation Ceilings"
              subtitle="Set maximum funding thresholds per barangay directly on the ledger for full governance transparency."
            />

            <div className="px-6 pb-6 sm:px-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/5 px-3 py-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-50" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
                </span>

                <span className="text-[10px] font-bold uppercase tracking-wider text-success">
                  Blockchain Ledger Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= STAT SUMMARY ================= */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Total Barangays */}
          <div className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-card to-blue-50/40 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/[0.06]" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-secondary-foreground">
                  Total Barangays
                </p>

                <p className="mt-2 text-3xl font-black tracking-tight text-primary-foreground">
                  {KNOWN_BARANGAYS.length}
                </p>

                <p className="mt-1 text-xs text-secondary-foreground">
                  Registered locations
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-transform duration-200 group-hover:scale-105">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Configured Ceilings */}
          <div className="group relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-card to-indigo-50/40 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-500/[0.06]" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-secondary-foreground">
                  Configured Ceilings
                </p>

                <p className="mt-2 text-3xl font-black tracking-tight text-primary-foreground">
                  {configuredCount}
                  <span className="ml-1 text-sm font-semibold text-secondary-foreground">
                    / {KNOWN_BARANGAYS.length}
                  </span>
                </p>

                <p className="mt-1 text-xs text-secondary-foreground">
                  Active funding limits
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition-transform duration-200 group-hover:scale-105">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Ceiling */}
          <div className="group relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-card to-violet-50/40 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-500/[0.06]" />

            <div className="relative flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-secondary-foreground">
                  Total Ceiling
                </p>

                <p className="mt-2 truncate text-2xl font-black tracking-tight text-primary-foreground">
                  {formatPeso(totalCeiling)}
                </p>

                <p className="mt-1 text-xs text-secondary-foreground">
                  Combined funding cap
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition-transform duration-200 group-hover:scale-105">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 12v-2m0 2c-1.11 0-2.08-.402-2.599-1M12 18c1.657 0 3-.895 3-2s-1.343-2-3-2-3-.895-3-2 1.343-2 3-2m0 8c-1.11 0-2.08-.402-2.599-1M12 6c-1.11 0-2.08.402-2.599 1"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Utilization */}
          <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-card to-emerald-50/40 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/[0.06]" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-secondary-foreground">
                  Overall Utilization
                </p>

                <p className="mt-2 text-3xl font-black tracking-tight text-primary-foreground">
                  {averageUtilization}%
                </p>

                <p className="mt-1 text-xs text-secondary-foreground">
                  Allocated vs ceiling
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-transform duration-200 group-hover:scale-105">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SET CEILING ================= */}
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-gradient-to-r from-secondary/60 via-card to-card p-6 sm:p-7">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </div>

              <div>
                <h2 className="text-lg font-black text-primary-foreground">
                  Ceiling Configuration
                </h2>

                <p className="mt-0.5 text-xs text-secondary-foreground">
                  Configure maximum funding limits for each barangay.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-7">
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M12 22a10 10 0 100-20 10 10 0 000 20z"
                  />
                </svg>
              </div>

              <div>
                <p className="text-xs font-bold text-blue-900">
                  Allocation control
                </p>

                <p className="mt-0.5 text-xs leading-5 text-blue-700/80">
                  Set a maximum funding threshold to help prevent allocations
                  from exceeding the approved barangay ceiling.
                </p>
              </div>
            </div>

            <SetCeilingForm />
          </div>
        </section>

        {/* ================= ON-CHAIN DATA ================= */}
        <Card>
          <CardHeader
            eyebrow="On-Chain Data"
            title="Active Barangay Ceilings & Allocations"
            subtitle="Real-time breakdown of allocation limits and current allocated funds from the blockchain ledger."
          />

          {/* Table Toolbar */}
          <div className="flex flex-col gap-3 border-b border-border bg-secondary/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                Live Ledger Records
              </span>
            </div>

            {(ceilingsLoading || allocatedLoading) && (
              <div className="flex items-center gap-2 text-xs font-semibold text-secondary-foreground">
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Syncing blockchain data...
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border bg-secondary/30 text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                <tr>
                  <th className="px-5 py-4">Barangay</th>
                  <th className="px-5 py-4">Allocated Amount</th>
                  <th className="px-5 py-4">Ceiling Cap</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="min-w-[240px] px-5 py-4">
                    Utilization Progress
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {barangayData.map((item) => {
                  let progressColor = "bg-success";
                  let statusClass =
                    "border-success/20 bg-success/10 text-success";
                  let statusText = "Healthy";

                  if (item.percentage >= 90) {
                    progressColor = "bg-danger";
                    statusClass = "border-danger/20 bg-danger/10 text-danger";
                    statusText = "Near Limit";
                  } else if (item.percentage >= 70) {
                    progressColor = "bg-pending";
                    statusClass =
                      "border-pending/20 bg-pending/10 text-pending";
                    statusText = "Moderate";
                  }

                  if (!item.isConfigured) {
                    statusClass =
                      "border-border bg-secondary text-secondary-foreground";
                    statusText = "Not Set";
                  }

                  return (
                    <tr
                      key={item.barangay}
                      className="group transition-colors duration-150 hover:bg-secondary/40"
                    >
                      {/* Barangay */}
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-xs font-black text-blue-700 transition-transform duration-200 group-hover:scale-105">
                            {item.barangay.charAt(0)}
                          </div>

                          <div>
                            <p className="font-bold text-primary-foreground">
                              {item.barangay}
                            </p>

                            <p className="mt-0.5 text-[10px] font-medium text-secondary-foreground">
                              Barangay allocation
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Allocated */}
                      <td className="px-5 py-5">
                        <p className="font-bold text-primary-foreground">
                          {formatPeso(item.allocatedPeso)}
                        </p>
                      </td>

                      {/* Ceiling */}
                      <td className="px-5 py-5">
                        {item.isConfigured ? (
                          <span className="inline-flex items-center rounded-full border border-blue-200/70 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                            {formatPeso(item.ceilingPeso)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">
                            Not Set
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-bold ${statusClass}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.isConfigured
                                ? item.percentage >= 90
                                  ? "bg-danger"
                                  : item.percentage >= 70
                                    ? "bg-pending"
                                    : "bg-success"
                                : "bg-secondary-foreground"
                            }`}
                          />

                          {statusText}
                        </span>
                      </td>

                      {/* Utilization */}
                      <td className="px-5 py-5">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs font-semibold text-secondary-foreground">
                              {item.percentage}% used
                            </span>

                            <span className="text-[10px] font-medium text-secondary-foreground">
                              {formatPeso(item.allocatedPeso)} /{" "}
                              {item.isConfigured
                                ? formatPeso(item.ceilingPeso)
                                : "₱0.00"}
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-secondary">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
                              style={{
                                width: `${item.percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="flex flex-col gap-2 border-t border-border bg-secondary/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] font-medium text-secondary-foreground">
              Showing{" "}
              <span className="font-bold text-primary-foreground">
                {KNOWN_BARANGAYS.length}
              </span>{" "}
              registered barangays
            </p>

            <div className="flex items-center gap-2 text-[10px] font-medium text-secondary-foreground">
              <span className="h-2 w-2 rounded-full bg-success" />
              Data retrieved from blockchain ledger
            </div>
          </div>
        </Card>

        {/* ================= FOOTER ================= */}
        <div className="flex items-center justify-center gap-2 pb-3 text-[10px] font-medium text-secondary-foreground">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z"
            />
          </svg>
          SK-Ledge • Allocation Governance
        </div>
      </main>
    </div>
  );
}