"use client";

import LogoLoader from "@/components/LogoLoader";
import { useState, useEffect } from "react";
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
    KNOWN_BARANGAYS.map((b) => ({
      address: CONTRACT_ADDRESS,
      abi: SK_LEDGE_ABI,
      functionName: "allocationCeilings",
      args: [b],
    }));

  const allocatedCalls: ContractFunctionParameters<typeof SK_LEDGE_ABI>[] =
    KNOWN_BARANGAYS.map((b) => ({
      address: CONTRACT_ADDRESS,
      abi: SK_LEDGE_ABI,
      functionName: "getAllocated",
      args: [b],
    }));

  const { data: ceilingsData } = useReadContracts({
    contracts: ceilingCalls,
  });
  const { data: allocatedData } = useReadContracts({
    contracts: allocatedCalls,
  });

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

        <SetCeilingForm />

        <Card>
          <CardHeader
            eyebrow="On-Chain Data"
            title="Active Barangay Ceilings & Allocations"
            subtitle="Real-time breakdown of allocation limits and spent funds on-chain"
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                <tr>
                  <th className="px-5 py-3.5">Barangay</th>
                  <th className="px-5 py-3.5">Allocated Amount</th>
                  <th className="px-5 py-3.5">Ceiling Cap</th>
                  <th className="px-5 py-3.5">Utilization Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {KNOWN_BARANGAYS.map((barangay, index) => {
                  const ceilingItem = ceilingsData?.[index] as
                    | { result?: bigint }
                    | undefined;
                  const allocatedItem = allocatedData?.[index] as
                    | { result?: bigint }
                    | undefined;

                  const ceilingRaw = ceilingItem?.result ?? BigInt(0);
                  const allocatedRaw = allocatedItem?.result ?? BigInt(0);

                  const ceilingPeso =
                    Number(ceilingRaw) / 100;
                  const allocatedPeso =
                    Number(allocatedRaw) / 100;

                  const percentage =
                    ceilingPeso > 0
                      ? Math.min(
                          Math.round((allocatedPeso / ceilingPeso) * 100),
                          100,
                        )
                      : 0;

                  let progressColor = "bg-success";
                  if (percentage >= 90) progressColor = "bg-danger";
                  else if (percentage >= 70) progressColor = "bg-pending";

                  return (
                    <tr
                      key={barangay}
                      className="transition-colors hover:bg-secondary/50"
                    >
                      <td className="px-5 py-4 font-bold text-primary-foreground">
                        {barangay}
                      </td>
                      <td className="px-5 py-4 font-semibold text-primary-foreground">
                        ₱{allocatedPeso.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 font-semibold text-primary-foreground">
                        {ceilingPeso > 0
                          ? `₱${ceilingPeso.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "Not Set"}
                      </td>
                      <td className="px-5 py-4 min-w-[220px]">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-secondary-foreground">
                              {percentage}% used
                            </span>
                            <span className="text-secondary-foreground">
                              ₱{allocatedPeso.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /{" "}
                              {ceilingPeso > 0
                                ? `₱${ceilingPeso.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : "₱0"}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                              style={{ width: `${percentage}%` }}
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
        </Card>
      </main>
    </div>
  );
}
