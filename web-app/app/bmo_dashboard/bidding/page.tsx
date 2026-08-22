"use client";

import LogoLoader from "@/components/LogoLoader";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import { Card } from "@/components/dashboard/ui/Card";
import StatusBadge from "@/components/dashboard/ui/StatusBadge";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "@/lib/useAuthStore";
import { SK_LEDGE_ABI, CONTRACT_ADDRESS } from "@/lib/contractConfig";
import { syncRecord } from "@/lib/syncRecord";

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Gavel,
  Loader2,
  Trophy,
} from "lucide-react";

interface VendorEmbed {
  company_name: string | null;
}

interface BidRow {
  id: string;
  project_id: string;
  vendor_id: string | null;
  contract_title: string | null;
  amount_php: number;
  timeline: string | null;
  proposal_url: string | null;
  status: string;
  submitted_on: string | null;
  created_at: string;
  vendors: VendorEmbed | null;
}

interface ProjectRow {
  id: string;
  name: string;
  category: string;
  budget: number;
  status: string;
  location: string | null;
  barangay: string | null;
  is_open_for_bidding: boolean;
  bid_deadline: string | null;
  winning_bid_id: string | null;
  winning_bidder_name: string | null;
  award_tx_hash: string | null;
  created_at: string;
}

type DisplayStatus = "Accepting Bids" | "Evaluation" | "Awarded";

const toDisplayStatus = (status: string): DisplayStatus => {
  if (status === "Awarded") return "Awarded";
  if (status === "Evaluation") return "Evaluation";
  return "Accepting Bids";
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function BMOBiddingPage() {
  const router = useRouter();
  const { address } = useAccount();

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [bids, setBids] = useState<BidRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedBidId, setSelectedBidId] = useState<string | null>(null);

  // Derived: fall back to the first project when nothing valid is selected
  const activeProjectId =
    selectedProjectId && projects.some((p) => p.id === selectedProjectId)
      ? selectedProjectId
      : projects[0]?.id ?? null;
  const selectedProject =
    projects.find((p) => p.id === activeProjectId) ?? null;

  const { data: isAuthorized } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SK_LEDGE_ABI,
    functionName: "isAuthorizedOfficial",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: txHash, writeContract, isPending } = useWriteContract();
  const { isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const loadProjects = useCallback(async () => {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("is_open_for_bidding", true)
      .order("created_at", { ascending: false });

    if (data) setProjects(data as ProjectRow[]);
  }, []);

  const loadBids = useCallback(async (projectId: string) => {
    const { data } = await supabase
      .from("bids")
      .select("*, vendors(company_name)")
      .eq("project_id", projectId)
      .order("amount_php", { ascending: true });

    if (data) setBids(data as unknown as BidRow[]);
    else setBids([]);
  }, []);

  // 1. Authenticate and protect the page
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
          if (
            !["BMO", "SK_Chairperson", "SK_Treasurer"].includes(
              profileData.role_type,
            )
          ) {
            router.push("/unauthorized");
            return;
          }

          setCurrentUser({
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type,
            barangay: profileData.barangay || "No Barangay Assigned",
            email: profileData.email,
            approval_status: profileData.approval_status,
          });

          await loadProjects();
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [router, loadProjects]);

  // 2. Load bids for the selected project
  useEffect(() => {
    const fetchBids = async () => {
      if (!activeProjectId) {
        setBids([]);
        return;
      }
      await loadBids(activeProjectId);
    };

    fetchBids();
  }, [activeProjectId, loadBids]);

  const handleCloseBidding = async () => {
    if (!selectedProject) return;
    setIsUpdatingStatus(true);
    await supabase
      .from("projects")
      .update({ status: "Evaluation" })
      .eq("id", selectedProject.id);
    await loadProjects();
    setIsUpdatingStatus(false);
  };

  const initiateAward = (bid: BidRow) => {
    if (!selectedProject) return;
    if (!isAuthorized) {
      alert(
        "Your connected wallet is not authorized as an SK Official on-chain.",
      );
      return;
    }
    setSelectedBidId(bid.id);
    const vendorName =
      bid.vendors?.company_name || bid.contract_title || "Vendor";
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SK_LEDGE_ABI,
      functionName: "addRecord",
      args: [
        selectedProject.location || selectedProject.barangay || "Barangay",
        BigInt(Math.round(Number(bid.amount_php) * 100)),
        `Award: ${selectedProject.name} to ${vendorName}`,
        "Award",
      ],
    });
  };

  // 4. Finalize the award once the on-chain transaction confirms
  useEffect(() => {
    if (!isTxConfirmed || !txHash || !selectedBidId || !selectedProject) return;

    const finalizeAwardInDb = async () => {
      const winningBid = bids.find((b) => b.id === selectedBidId);
      if (!winningBid) return;

      const vendorName =
        winningBid.vendors?.company_name ||
        winningBid.contract_title ||
        "Unknown Vendor";

      await supabase
        .from("projects")
        .update({
          winning_bid_id: winningBid.id,
          winning_bidder_name: vendorName,
          award_tx_hash: txHash,
          status: "Awarded",
        })
        .eq("id", selectedProject.id);

      await supabase.from("bids").update({ status: "won" }).eq("id", winningBid.id);
      await supabase
        .from("bids")
        .update({ status: "lost" })
        .eq("project_id", selectedProject.id)
        .neq("id", winningBid.id);

      await syncRecord({
        type: "award",
        user_id: currentUser?.id ?? "",
        blockchain_tx_hash: txHash,
        contract_address: CONTRACT_ADDRESS,
        official_address: address ?? "",
        barangay: selectedProject.location || selectedProject.barangay || "",
        amount: Math.round(Number(winningBid.amount_php) * 100),
        purpose: `Award: ${selectedProject.name} to ${vendorName}`,
        project_id: selectedProject.id,
      }).catch((err) => console.error("Failed to sync award record:", err));

      setSelectedBidId(null);
      await loadProjects();
      await loadBids(selectedProject.id);
    };

    finalizeAwardInDb();
  }, [
    bids,
    isTxConfirmed,
    loadBids,
    loadProjects,
    selectedBidId,
    selectedProject,
    txHash,
    address,
    currentUser,
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) return <LogoLoader />;

  if (!currentUser) return null;

  const displayStatus = selectedProject
    ? toDisplayStatus(selectedProject.status)
    : "Accepting Bids";

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
          eyebrow="Procurement Management"
          title="BAC Control Room"
          subtitle="Manage active procurements, evaluate vendor submissions, and award the lowest calculated responsive bid."
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
          {/* LEFT PANEL: PROJECT LIST */}
          <Card className="h-fit lg:max-h-[calc(100vh-14rem)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Gavel className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight text-primary-foreground">
                  Active Procurements
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                  {filteredProjects.length} project(s)
                </p>
              </div>
            </div>

            <div className="thin-scrollbar space-y-2 overflow-y-auto pr-1 lg:max-h-[calc(100vh-22rem)]">
              {filteredProjects.map((project) => {
                const isSelected = activeProjectId === project.id;
                const projectStatus = toDisplayStatus(project.status);
                return (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${
                      isSelected
                        ? "border-primary/20 bg-primary/5 shadow-sm"
                        : "border-border bg-white hover:border-secondary-foreground/30 hover:bg-secondary/40"
                    }`}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                        {project.category || "Procurement"}
                      </span>
                      <StatusBadge
                        status={
                          projectStatus === "Evaluation"
                            ? "evaluation"
                            : projectStatus === "Accepting Bids"
                              ? "pending"
                              : "approved"
                        }
                      />
                    </div>
                    <h3 className="mb-1 text-sm font-bold leading-tight text-primary-foreground">
                      {project.name}
                    </h3>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-secondary-foreground">
                        {project.location || project.barangay || "—"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[11px] text-secondary-foreground">
                          <Clock className="h-3 w-3" />{" "}
                          {formatDate(project.bid_deadline)}
                        </span>
                        <span className="text-xs font-bold text-primary-foreground">
                          {formatCurrency(Number(project.budget))}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredProjects.length === 0 && (
                <div className="p-6 text-center text-sm font-bold text-secondary-foreground">
                  No open procurements found.
                </div>
              )}
            </div>
          </Card>

          {/* RIGHT PANEL: SELECTED PROJECT */}
          <div className="space-y-6">
            {!selectedProject ? (
              <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                  <Gavel className="h-7 w-7 text-secondary-foreground" />
                </div>
                <p className="text-sm font-bold text-primary-foreground">
                  No procurements open for bidding
                </p>
                <p className="max-w-sm text-sm text-secondary-foreground">
                  Projects marked &quot;Open for Bidding&quot; by SK Officials
                  will appear here.
                </p>
              </Card>
            ) : (
              <>
                {/* Header Card */}
                <Card>
                  <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-lg border border-border bg-secondary/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                          {selectedProject.category || "Procurement"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                          <Building2 className="h-3 w-3" />
                          {selectedProject.location ||
                            selectedProject.barangay ||
                            "—"}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold tracking-tight text-primary-foreground">
                        {selectedProject.name}
                      </h2>
                      <p className="mt-1 text-sm font-medium text-secondary-foreground">
                        Approved Budget (ABC):{" "}
                        <span className="font-bold text-primary-foreground">
                          {formatCurrency(Number(selectedProject.budget))}
                        </span>
                      </p>
                    </div>

                    {/* Workflow Action Button based on status */}
                    <div>
                      {displayStatus === "Accepting Bids" ? (
                        <button
                          onClick={handleCloseBidding}
                          disabled={isUpdatingStatus}
                          className="inline-flex items-center gap-2 rounded-xl border border-pending/30 bg-pending/10 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-pending transition hover:bg-pending/20 disabled:opacity-50"
                        >
                          {isUpdatingStatus ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <AlertCircle className="h-4 w-4" />
                          )}
                          Close Bidding &amp; Evaluate
                        </button>
                      ) : displayStatus === "Evaluation" ? (
                        <button className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-border bg-secondary px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-secondary-foreground">
                          <CheckCircle2 className="h-4 w-4" />
                          Bidding Closed
                        </button>
                      ) : (
                        <button className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-success">
                          <Trophy className="h-4 w-4" />
                          Awarded
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedProject.award_tx_hash && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${selectedProject.award_tx_hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-success/10 px-4 py-2 text-xs font-bold text-success transition hover:bg-success/20"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Award recorded on-chain — View transaction
                    </a>
                  )}
                </Card>

                {/* Vendor Bids Table */}
                <Card>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-primary-foreground">
                        Vendor Submissions
                      </h3>
                      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-secondary-foreground">
                        {bids.length} Active Bids
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                          <th className="px-4 py-3">Vendor</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Bid</th>
                          <th className="px-4 py-3">Variance</th>
                          <th className="px-4 py-3 text-center">Docs</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-sm">
                        {bids.map((bid, index) => {
                          const abc = Number(selectedProject.budget);
                          const variance = abc - Number(bid.amount_php);
                          const isOverBudget = variance < 0;
                          const documentsValid = !!bid.proposal_url;
                          const isWon =
                            bid.status === "won" ||
                            String(selectedProject.winning_bid_id ?? "") ===
                              String(bid.id);
                          const isLowestEligible =
                            index === 0 && !isOverBudget && documentsValid;

                          return (
                            <tr
                              key={bid.id}
                              className={`transition-colors hover:bg-secondary/50 ${
                                isWon
                                  ? "bg-success/10"
                                  : isLowestEligible
                                    ? "bg-success/5"
                                    : ""
                              }`}
                            >
                              <td className="px-4 py-3">
                                <p className="flex items-center gap-2 text-sm font-bold text-primary-foreground">
                                  {bid.vendors?.company_name ||
                                    bid.contract_title ||
                                    "Unknown Vendor"}
                                  {(isLowestEligible || isWon) && (
                                    <span
                                      className="rounded-full bg-tertiary p-1 text-primary"
                                      title={
                                        isWon
                                          ? "Winning Bid"
                                          : "Lowest Calculated Bid"
                                      }
                                    >
                                      <Trophy className="h-3 w-3" />
                                    </span>
                                  )}
                                </p>
                              </td>
                              <td className="px-4 py-3 text-sm font-bold text-secondary-foreground">
                                {formatDate(
                                  bid.submitted_on || bid.created_at,
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <p
                                  className={`text-sm font-bold ${
                                    isOverBudget
                                      ? "text-danger"
                                      : "text-primary-foreground"
                                  }`}
                                >
                                  {formatCurrency(Number(bid.amount_php))}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-lg px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest ${
                                    isOverBudget
                                      ? "bg-danger/10 text-danger"
                                      : "bg-success/10 text-success"
                                  }`}
                                >
                                  {isOverBudget
                                    ? "Over Budget"
                                    : `-${formatCurrency(variance)}`}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {bid.proposal_url ? (
                                  <a
                                    href={bid.proposal_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="View Proposal Document"
                                    className="inline-block rounded-xl bg-information/10 p-2 text-information transition-colors hover:bg-information/20"
                                  >
                                    <FileText className="mx-auto h-4 w-4" />
                                  </a>
                                ) : (
                                  <span className="inline-block rounded-xl bg-secondary p-2 text-secondary-foreground">
                                    <FileText className="mx-auto h-4 w-4" />
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => initiateAward(bid)}
                                  disabled={
                                    isOverBudget ||
                                    displayStatus !== "Evaluation" ||
                                    (isPending &&
                                      selectedBidId === bid.id) ||
                                    !!selectedProject.award_tx_hash
                                  }
                                  className={`rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                                    displayStatus === "Evaluation" &&
                                    !isOverBudget &&
                                    !selectedProject.award_tx_hash
                                      ? "bg-primary text-white shadow-sm hover:bg-primary/90"
                                      : "cursor-not-allowed bg-secondary text-secondary-foreground"
                                  }`}
                                >
                                  {isPending && selectedBidId === bid.id ? (
                                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                                  ) : isWon ? (
                                    "Won"
                                  ) : (
                                    "Award"
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {bids.length === 0 && (
                      <div className="p-6 text-center text-sm font-bold text-secondary-foreground">
                        No bids submitted yet.
                      </div>
                    )}
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
