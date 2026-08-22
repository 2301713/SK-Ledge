"use client";

import LogoLoader from "@/components/LogoLoader";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import StatusBadge from "@/components/dashboard/ui/StatusBadge";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "@/lib/useAuthStore";
import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, SK_LEDGE_ABI } from "@/lib/contractConfig";
import ApproveRecordModal from "@/components/ApproveRecordModal";
import { Search } from "lucide-react";

interface RecordItem {
  id: bigint;
  official: string;
  barangay: string;
  amount: bigint;
  timestamp: bigint;
  purpose: string;
  recordType: string;
  approved: boolean;
  approvedBy: string;
}

export default function RecordApprovalsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

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
              "Unauthorized access: Only SK Chairperson can approve records.",
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
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const { data: records, isLoading: isLoadingRecords } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SK_LEDGE_ABI,
    functionName: "getAllRecords",
  });

  const formattedRecords = ((records as RecordItem[]) || []).map((r) => ({
    id: Number(r.id),
    barangay: r.barangay,
    amount: Number(r.amount) / 100,
    purpose: r.purpose,
    status: r.approved ? "APPROVED" : "PENDING",
    date: new Date(Number(r.timestamp) * 1000).toISOString().split("T")[0],
  }));

  const filteredRecords = formattedRecords.filter((rec) => {
    const matchesFilter = filter === "ALL" || rec.status === filter;
    const matchesSearch =
      rec.barangay.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.id.toString().includes(searchTerm) ||
      rec.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    ALL: formattedRecords.length,
    PENDING: formattedRecords.filter((r) => r.status === "PENDING").length,
    APPROVED: formattedRecords.filter((r) => r.status === "APPROVED").length,
  };

  const formatPeso = (amount: number) =>
    `₱${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  if (isLoadingProfile) return <LogoLoader />;

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
          title="Record Approvals"
          subtitle="Review and authorize pending blockchain ledger entries."
        />

        <Card>
          <CardHeader
            eyebrow="On-Chain Review"
            title="Ledger Records"
            subtitle="Live records pulled from the Sepolia ledger"
          />

          {/* SEARCH + FILTERS */}
          <div className="mb-6 flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-foreground" />
              <input
                type="text"
                placeholder="Search by Barangay or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-primary-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div className="flex items-center gap-1 self-start rounded-2xl bg-secondary/70 p-1 text-xs font-semibold md:self-auto">
              {(["ALL", "PENDING", "APPROVED"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`rounded-xl px-3.5 py-2 transition-all ${
                    filter === tab
                      ? "bg-white font-bold text-primary shadow-sm"
                      : "text-secondary-foreground hover:text-primary-foreground"
                  }`}
                >
                  <span>
                    {tab === "ALL"
                      ? "All"
                      : tab.charAt(0) + tab.slice(1).toLowerCase()}
                  </span>
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                      filter === tab
                        ? "bg-primary/10 text-primary"
                        : "bg-white text-secondary-foreground"
                    }`}
                  >
                    {counts[tab]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            {isLoadingRecords ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-secondary-foreground">
                <p className="text-sm">Loading blockchain records...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                <p className="text-sm font-bold text-primary-foreground">
                  No records found
                </p>
                <p className="text-xs text-secondary-foreground">
                  {formattedRecords.length === 0
                    ? "No records found on the ledger yet."
                    : "No records match the selected filter."}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                  <tr>
                    <th className="px-5 py-3.5">ID</th>
                    <th className="px-5 py-3.5">Barangay</th>
                    <th className="px-5 py-3.5">Purpose</th>
                    <th className="px-5 py-3.5 text-right">Amount</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRecords.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-secondary/50"
                    >
                      <td className="px-5 py-4 font-mono text-sm font-bold text-primary-foreground">
                        #{row.id}
                      </td>
                      <td className="px-5 py-4 font-semibold text-primary-foreground">
                        {row.barangay}
                      </td>
                      <td className="max-w-xs truncate px-5 py-4 text-secondary-foreground">
                        {row.purpose}
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-sm font-bold text-primary-foreground">
                        {formatPeso(row.amount)}
                      </td>
                      <td className="px-5 py-4 text-xs text-secondary-foreground">
                        {row.date}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => setSelectedRecordId(row.id)}
                          className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </main>

      {selectedRecordId !== null && (
        <ApproveRecordModal
          recordId={selectedRecordId}
          onClose={() => setSelectedRecordId(null)}
        />
      )}
    </div>
  );
}
