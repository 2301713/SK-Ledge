"use client";

import LogoLoader from "@/components/LogoLoader";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import StatCard from "@/components/dashboard/ui/StatCard";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "@/lib/useAuthStore";
import { useReadContracts } from "wagmi";
import type { ContractFunctionParameters } from "viem";
import { CONTRACT_ADDRESS, SK_LEDGE_ABI } from "@/lib/contractConfig";
import SetCeilingForm from "@/components/SetCeilingForm";
import {
  Building2,
  ShieldCheck,
  Wallet,
  Zap,
  Loader2,
} from "lucide-react";

const formatPeso = (amount: number) =>
  `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function CeilingPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [barangayList, setBarangayList] = useState<string[]>([]);

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

          setCurrentUser({
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type,
            barangay: profileData.barangay || "SK",
            email: profileData.email,
            approval_status: profileData.approval_status,
          } as UserAccount);
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  useEffect(() => {
    const fetchBarangays = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("barangay");

      if (!error && data) {
        const unique = [
          ...new Set(
            data
              .map((r: { barangay: string | null }) => r.barangay)
              .filter(
                (b): b is string =>
                  typeof b === "string" &&
                  b.trim().length > 0 &&
                  b.trim().toUpperCase() !== "N/A",
              ),
          ),
        ].sort();
        setBarangayList(unique);
      }
    };

    fetchBarangays();
  }, []);

  const ceilingCalls: ContractFunctionParameters<typeof SK_LEDGE_ABI>[] =
    barangayList.map((barangay) => ({
      address: CONTRACT_ADDRESS,
      abi: SK_LEDGE_ABI,
      functionName: "allocationCeilings",
      args: [barangay],
    }));

  const allocatedCalls: ContractFunctionParameters<typeof SK_LEDGE_ABI>[] =
    barangayList.map((barangay) => ({
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
    return barangayList.map((barangay, index) => {
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
  }, [barangayList, ceilingsData, allocatedData]);

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

        <PageHeader
          eyebrow="SK Officials"
          title="Allocation Ceilings"
          subtitle="Set maximum funding thresholds per barangay directly on the ledger for full governance transparency."
        />

        {/* STAT ROW */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <StatCard
            label="Total Barangays"
            value={barangayList.length}
            icon={Building2}
            trend="Registered locations"
          />
          <StatCard
            label="Configured Ceilings"
            value={`${configuredCount} / ${barangayList.length}`}
            icon={ShieldCheck}
            trend="Active funding limits"
          />
          <StatCard
            label="Total Ceiling"
            value={formatPeso(totalCeiling)}
            icon={Wallet}
            variant="brand"
            trend="Combined funding cap"
          />
          <StatCard
            label="Overall Utilization"
            value={`${averageUtilization}%`}
            icon={Zap}
            trend="Allocated vs ceiling"
          />
        </div>

        {/* SET CEILING FORM */}
        <Card>
          <CardHeader
            eyebrow="Configuration"
            title="Set Ceiling"
            subtitle="Configure maximum funding limits for each barangay."
          />

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
        </Card>

        {/* ON-CHAIN DATA TABLE */}
        <Card>
          <CardHeader
            eyebrow="On-Chain Data"
            title="Active Barangay Ceilings & Allocations"
            subtitle="Real-time breakdown of allocation limits and current allocated funds from the blockchain ledger."
          />

          <div className="overflow-x-auto">
            {ceilingsLoading || allocatedLoading || barangayList.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-tertiary" />
                <p className="text-sm font-bold text-secondary-foreground">
                  Fetching live blockchain data...
                </p>
              </div>
            ) : barangayData.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Building2 className="mb-3 h-10 w-10 text-secondary-foreground/30" />
                <p className="text-sm font-bold text-secondary-foreground">
                  No barangays found
                </p>
                <p className="mt-1 text-xs text-secondary-foreground">
                  Register SK officials with barangay assignments to get started.
                </p>
              </div>
            ) : (
              <>
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                    <tr>
                      <th className="px-5 py-3.5">Barangay</th>
                      <th className="px-5 py-3.5">Allocated Amount</th>
                      <th className="px-5 py-3.5">Ceiling Cap</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="min-w-[240px] px-5 py-3.5">
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
                        statusClass =
                          "border-danger/20 bg-danger/10 text-danger";
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
                          className="transition-colors hover:bg-secondary/50"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-xs font-black text-secondary-foreground">
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

                          <td className="px-5 py-4">
                            <p className="font-bold text-primary-foreground">
                              {formatPeso(item.allocatedPeso)}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            {item.isConfigured ? (
                              <span className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground">
                                {formatPeso(item.ceilingPeso)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">
                                Not Set
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
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

                          <td className="px-5 py-4">
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

                <div className="flex flex-col gap-2 border-t border-border bg-secondary/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[10px] font-medium text-secondary-foreground">
                    Showing{" "}
                    <span className="font-bold text-primary-foreground">
                      {barangayList.length}
                    </span>{" "}
                    registered barangays
                  </p>

                  <div className="flex items-center gap-2 text-[10px] font-medium text-secondary-foreground">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    Data retrieved from blockchain ledger
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
