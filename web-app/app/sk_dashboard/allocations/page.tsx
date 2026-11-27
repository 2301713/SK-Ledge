"use client";

import LogoLoader from "@/components/LogoLoader";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import StatCard from "@/components/dashboard/ui/StatCard";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "@/lib/useAuthStore";
import { useReadContract } from "wagmi";
import {
  Coins,
  Landmark,
  PiggyBank,
  Receipt,
  ExternalLink,
  Loader2,
  Sliders,
} from "lucide-react";
import { CONTRACT_ADDRESS, SK_LEDGE_ABI } from "@/lib/contractConfig";
import AllocateFundsForm from "@/components/AllocateFundsForm";
import { canonicalizeBarangay } from "@/lib/batangasBarangays";
import { useRecordsSync } from "@/lib/useRecordsSync";

const formatPeso = (amount: number) =>
  `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function AllocationsPage() {
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

        if (!profileData) return;

        // Recording allocations is an SK Treasurer responsibility.
        if (profileData.role_type !== "SK_Treasurer") {
          console.warn(
            "Unauthorized access: only the SK Treasurer can record allocations.",
          );
          router.push("/unauthorized");
          return;
        }

        const canonicalBarangay = canonicalizeBarangay(
          profileData.barangay ?? "",
        );
        if (!canonicalBarangay) {
          console.warn(
            "Unauthorized access: the profile has no canonical barangay.",
          );
          router.push("/unauthorized");
          return;
        }

        setCurrentUser({
          id: profileData.id,
          username: profileData.username,
          full_name: profileData.full_name || profileData.username,
          role_type: profileData.role_type,
          barangay: canonicalBarangay,
          email: profileData.email,
          approval_status: profileData.approval_status,
        } as UserAccount);
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const barangay = currentUser?.barangay ?? null;

  const { records: allocationRecords, isLoading: recordsLoading } =
    useRecordsSync({
      type: "allocation",
      barangay: barangay ?? undefined,
      enabled: Boolean(currentUser),
      limit: 200,
    });

  const { data: ceilingRaw } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SK_LEDGE_ABI,
    functionName: "allocationCeilings",
    args: barangay ? [barangay] : undefined,
    query: { enabled: Boolean(barangay) },
  });

  const { data: allocatedRaw } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SK_LEDGE_ABI,
    functionName: "getAllocated",
    args: barangay ? [barangay] : undefined,
    query: { enabled: Boolean(barangay) },
  });

  const ceilingPeso = ceilingRaw ? Number(ceilingRaw) / 100 : 0;
  const allocatedPeso = allocatedRaw ? Number(allocatedRaw) / 100 : 0;
  const remainingPeso = ceilingPeso - allocatedPeso;

  const sortedRecords = useMemo(
    () =>
      [...allocationRecords].sort((a, b) => {
        const left = new Date(a.created_at ?? 0).getTime();
        const right = new Date(b.created_at ?? 0).getTime();
        return right - left;
      }),
    [allocationRecords],
  );

  if (isLoading) return <LogoLoader />;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row gap-4 bg-background p-4 selection:bg-tertiary selection:text-primary">
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
          title="Fund Allocations"
          subtitle="Record ABYIP fund allocations for your barangay directly on the Sepolia ledger."
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <StatCard
            label="Barangay"
            value={barangay ?? "Not assigned"}
            icon={Landmark}
            trend="Your allocation scope"
          />
          <StatCard
            label="Allocated On-Chain"
            value={formatPeso(allocatedPeso)}
            icon={Coins}
            variant="brand"
            trend="Total recorded allocations"
          />
          <StatCard
            label="Ceiling"
            value={ceilingPeso > 0 ? formatPeso(ceilingPeso) : "Not set"}
            icon={Sliders}
            trend="Live allocation cap"
          />
          <StatCard
            label="Remaining"
            value={ceilingPeso > 0 ? formatPeso(remainingPeso) : "—"}
            icon={PiggyBank}
            trend="Headroom before the cap"
          />
        </div>

        <Card>
          <CardHeader
            eyebrow="Blockchain"
            title="Allocate Funds"
            subtitle="Each allocation is signed on-chain and mirrored into the reporting tables."
          />
          <AllocateFundsForm assignedBarangay={barangay} />
        </Card>

        <Card>
          <CardHeader
            eyebrow="Ledger"
            title="Recorded Allocations"
            subtitle="Allocations synced from the contract for your barangay."
            action={
              <Link
                href="/sk_dashboard/ceiling"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-secondary"
              >
                <Sliders className="h-4 w-4" />
                Manage ceiling
              </Link>
            }
          />

          {recordsLoading && sortedRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-tertiary" />
              <p className="text-sm font-bold text-secondary-foreground">
                Fetching synced allocations...
              </p>
            </div>
          ) : sortedRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Receipt className="mb-3 h-10 w-10 text-secondary-foreground/30" />
              <p className="text-sm font-bold text-secondary-foreground">
                No allocations recorded yet
              </p>
              <p className="mt-1 text-xs text-secondary-foreground">
                Allocations you sign above appear here after they sync.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                  <tr>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Program / Purpose</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Ledger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedRecords.map((record, index) => (
                    <tr
                      key={
                        record.id ??
                        `${record.blockchain_tx_hash ?? "allocation"}-${index}`
                      }
                      className="transition-colors hover:bg-secondary/50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-xs font-semibold text-secondary-foreground">
                        {formatDate(record.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-primary-foreground">
                          {record.purpose || "Untitled allocation"}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-black text-primary">
                        {formatPeso(Number(record.amount) / 100)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        {record.blockchain_tx_hash ? (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${record.blockchain_tx_hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary underline-offset-2 hover:underline"
                          >
                            View transaction
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <span className="text-xs text-secondary-foreground">
                            Not available
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
