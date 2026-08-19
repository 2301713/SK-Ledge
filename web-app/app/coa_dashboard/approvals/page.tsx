"use client";

import LogoLoader from "@/components/LogoLoader";
import { useState, useEffect } from "react";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import StatCard from "@/components/dashboard/ui/StatCard";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import StatusBadge from "@/components/dashboard/ui/StatusBadge";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "../types";
import { Check, CheckSquare, ClipboardList, Loader2, ShieldCheck, ExternalLink } from "lucide-react";
import { useAuthStore } from "@/lib/useAuthStore";
import { useRouter } from "next/navigation";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { CONTRACT_ADDRESS, SK_LEDGE_ABI } from "@/lib/contractConfig";
import { ConnectButton } from "@/components/ConnectButton";
import { useToast } from "@/lib/useToast";

type OnChainRecord = {
  id: bigint;
  official: string;
  barangay: string;
  amount: bigint;
  timestamp: bigint;
  purpose: string;
  recordType: string;
  approved: boolean;
  approvedBy: string;
};

const FILTERS: { value: "all" | "pending" | "approved"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
];

export default function ApprovalsPage() {
  const {
    currentUser,
    isLoading,
    setCurrentUser,
    setIsLoading,
    setUserProfile,
  } = useAuthStore();
  const router = useRouter();
  const toast = useToast();

  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const {
    data: hash,
    isPending: isWritePending,
    isError: isWriteError,
    error: writeError,
    writeContract,
  } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } =
    useWaitForTransactionReceipt({ hash });

  // Read all records from contract
  const {
    data: allRecords,
    isLoading: recordsLoading,
    refetch,
  } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: SK_LEDGE_ABI,
    functionName: "getAllRecords",
  });

  // Read contract owner
  const { data: contractOwner } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: SK_LEDGE_ABI,
    functionName: "owner",
  });

  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null); // record ID being processed

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
          setUserProfile(profile);
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [router, setCurrentUser, setIsLoading, setUserProfile]);

  const records = (allRecords as OnChainRecord[] | undefined) ?? [];

  // Filter by barangay (COA user's barangay from profile)
  const barangayRecords = currentUser?.barangay
    ? records.filter((r) => r.barangay === currentUser.barangay)
    : records;

  // Filter by status
  const filteredRecords = barangayRecords.filter((r) => {
    if (filter === "pending") return !r.approved;
    if (filter === "approved") return r.approved;
    return true;
  });

  const pendingCount = barangayRecords.filter((r) => !r.approved).length;
  const approvedCount = barangayRecords.filter((r) => r.approved).length;

  // Check if current user is contract owner
  const isOwner =
    address && contractOwner
      ? address.toLowerCase() === (contractOwner as string).toLowerCase()
      : false;

  const isWrongNetwork = chainId !== sepolia.id;

  const handleApproval = (recordId: number, approve: boolean) => {
    if (!isConnected) return;
    if (chainId !== sepolia.id) {
      switchChain({ chainId: sepolia.id });
      return;
    }
    setActionLoading(recordId);
    writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: SK_LEDGE_ABI,
      functionName: "setRecordApproval",
      args: [BigInt(recordId), approve],
    });
  };

  // Refetch after tx confirms
  useEffect(() => {
    if (isTxSuccess) {
      refetch();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActionLoading(null);
      toast.success("Approval recorded on-chain.");
    }
  }, [isTxSuccess, refetch, toast]);

  // Reset loading + show error if the tx fails
  useEffect(() => {
    if (isWriteError) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActionLoading(null);
      toast.error(
        writeError?.message ?? "Transaction failed. Please try again.",
      );
    }
  }, [isWriteError, writeError, toast]);

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
          userName={currentUser?.full_name ?? "COA Official"}
          userEmail={currentUser?.email}
          hideSearch
        />

        <PageHeader
          eyebrow="Commission on Audit"
          title="Approvals"
          subtitle="Management ledger & expenditure oversight — authorize requests awaiting COA review."
        />

        {/* STAT ROW */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            label="Total Pending"
            value={pendingCount}
            icon={ClipboardList}
            variant="brand"
            trend="Awaiting COA review"
          />
          <StatCard
            label="Approved"
            value={approvedCount}
            icon={CheckSquare}
            trend="Released to the ledger"
          />
          <StatCard
            label="Total Records"
            value={barangayRecords.length}
            icon={Check}
            trend={`In ${currentUser?.barangay ?? "barangay"} queue`}
          />
        </div>

        {/* APPROVALS TABLE */}
        <Card>
          <CardHeader
            eyebrow="On-Chain Review"
            title="Latest Requests"
            subtitle="Live records pulled from the Sepolia ledger"
          />

          {!isConnected ? (
            <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-primary-foreground">
                  Connect your wallet to review approvals
                </p>
                <p className="mt-1 text-xs text-secondary-foreground">
                  Approve/reject actions are signed and recorded on the Sepolia
                  testnet.
                </p>
              </div>
              <ConnectButton />
            </div>
          ) : isWrongNetwork ? (
            <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
              <p className="text-sm font-bold text-danger">
                Wrong network detected
              </p>
              <p className="text-xs text-secondary-foreground">
                Switch to Sepolia to read and authorize on-chain records.
              </p>
              <button
                onClick={() => switchChain({ chainId: sepolia.id })}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-primary/90"
              >
                Switch to Sepolia
              </button>
            </div>
          ) : (
            <>
              {/* FILTER TABS */}
              <div className="flex items-center gap-2 px-6 pt-2">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                      filter === f.value
                        ? "bg-primary text-white shadow-sm"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                {recordsLoading ? (
                  <div className="flex flex-col items-center gap-3 px-6 py-16 text-secondary-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="text-sm">Loading on-chain records...</p>
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                    <p className="text-sm font-bold text-primary-foreground">
                      No records found
                    </p>
                    <p className="text-xs text-secondary-foreground">
                      {barangayRecords.length === 0
                        ? `No records found for ${currentUser?.barangay ?? "your barangay"} yet.`
                        : "No records match the selected filter."}
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Barangay</th>
                        <th className="px-4 py-3">Purpose</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3">Official</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[...filteredRecords].reverse().map((record) => (
                        <tr
                          key={Number(record.id)}
                          className="transition-colors hover:bg-secondary/50"
                        >
                          <td className="px-4 py-4">
                            <span className="font-mono text-sm">#{String(record.id)}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                record.recordType === "Allocation"
                                  ? "bg-primary/10 text-primary"
                                  : record.recordType === "Expense"
                                    ? "bg-tertiary/30 text-primary-foreground"
                                    : "bg-secondary text-secondary-foreground"
                              }`}
                            >
                              {record.recordType}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm">{record.barangay}</td>
                          <td className="max-w-xs truncate px-4 py-4 text-sm">{record.purpose}</td>
                          <td className="px-4 py-4 text-right font-mono text-sm font-bold">
                            ₱
                            {(Number(record.amount) / 100).toLocaleString(
                              undefined,
                              { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                            )}
                          </td>
                          <td className="px-4 py-4 font-mono text-xs text-secondary-foreground">
                            {record.official.slice(0, 6)}...{record.official.slice(-4)}
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge status={record.approved ? "Approved" : "Pending"} />
                          </td>
                          <td className="px-4 py-4 text-right">
                            {isOwner ? (
                              <div className="flex items-center justify-end gap-2">
                                {record.approved ? (
                                  <button
                                    onClick={() =>
                                      handleApproval(Number(record.id), false)
                                    }
                                    disabled={
                                      actionLoading === Number(record.id) ||
                                      isWritePending ||
                                      isTxConfirming
                                    }
                                    className="inline-flex items-center gap-1 rounded-xl border border-border bg-secondary px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
                                  >
                                    {actionLoading === Number(record.id) ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      "Reject"
                                    )}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      handleApproval(Number(record.id), true)
                                    }
                                    disabled={
                                      actionLoading === Number(record.id) ||
                                      isWritePending ||
                                      isTxConfirming
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                                  >
                                    {actionLoading === Number(record.id) ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      "Approve"
                                    )}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] italic text-secondary-foreground">
                                Owner only
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="mt-2 flex justify-between border-t border-border pt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                  sk-ledge // Internal Audit
                </p>
                <a
                  href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] font-medium text-primary transition-colors hover:text-primary/80"
                >
                  View on Etherscan
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
