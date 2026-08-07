"use client";

import LogoLoader from "@/components/LogoLoader";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import { Card } from "@/components/dashboard/ui/Card";
import StatusBadge from "@/components/dashboard/ui/StatusBadge";
import { supabase } from "@/lib/supabase";
import { ProcurementProject } from "../types";
import { procurementProjects } from "../types";
import { UserAccount } from "@/lib/useAuthStore";

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Gavel,
  Trophy,
} from "lucide-react";

export default function BMOReviewPage() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProcurementProject>(
    procurementProjects[0],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

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
          if (profileData.role_type !== "BMO") {
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

  const filteredProjects = procurementProjects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
                const isSelected = selectedProject.id === project.id;
                return (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${
                      isSelected
                        ? "border-primary/20 bg-primary/5 shadow-sm"
                        : "border-border bg-white hover:border-secondary-foreground/30 hover:bg-secondary/40"
                    }`}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                        {project.id}
                      </span>
                      <StatusBadge
                        status={
                          project.status === "Evaluation"
                            ? "evaluation"
                            : project.status === "Accepting Bids"
                              ? "pending"
                              : "approved"
                        }
                      />
                    </div>
                    <h3 className="mb-1 text-sm font-bold leading-tight text-primary-foreground">
                      {project.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-secondary-foreground">
                        {project.barangay}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[11px] text-secondary-foreground">
                          <Clock className="h-3 w-3" /> {project.deadline}
                        </span>
                        <span className="text-xs font-bold text-primary-foreground">
                          {formatCurrency(project.abc)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredProjects.length === 0 && (
                <div className="p-6 text-center text-sm font-bold text-secondary-foreground">
                  No projects match your search.
                </div>
              )}
            </div>
          </Card>

          {/* RIGHT PANEL: SELECTED PROJECT */}
          <div className="space-y-6">
            {/* Header Card */}
            <Card>
              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-lg border border-border bg-secondary/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                      {selectedProject.id}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                      <Building2 className="h-3 w-3" />
                      {selectedProject.barangay}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-primary-foreground">
                    {selectedProject.title}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-secondary-foreground">
                    Approved Budget (ABC):{" "}
                    <span className="font-bold text-primary-foreground">
                      {formatCurrency(selectedProject.abc)}
                    </span>
                  </p>
                </div>

                {/* Workflow Action Button based on status */}
                <div>
                  {selectedProject.status === "Accepting Bids" ? (
                    <button className="inline-flex items-center gap-2 rounded-xl border border-pending/30 bg-pending/10 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-pending transition hover:bg-pending/20">
                      <AlertCircle className="h-4 w-4" />
                      Close Bidding & Evaluate
                    </button>
                  ) : (
                    <button className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-border bg-secondary px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-secondary-foreground">
                      <CheckCircle2 className="h-4 w-4" />
                      Bidding Closed
                    </button>
                  )}
                </div>
              </div>
            </Card>

            {/* Vendor Bids Table */}
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary-foreground">
                    Vendor Submissions
                  </h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-widest text-secondary-foreground">
                    {selectedProject.bids.length} Active Bids
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
                    {selectedProject.bids
                      .slice()
                      .sort((a, b) => a.bidAmount - b.bidAmount)
                      .map((bid, index) => {
                        const variance = selectedProject.abc - bid.bidAmount;
                        const isOverBudget = variance < 0;
                        const isLowestEligible =
                          index === 0 && !isOverBudget && bid.documentsValid;

                        return (
                          <tr
                            key={bid.id}
                            className={`transition-colors hover:bg-secondary/50 ${
                              isLowestEligible ? "bg-success/5" : ""
                            }`}
                          >
                            <td className="px-4 py-3">
                              <p className="flex items-center gap-2 text-sm font-bold text-primary-foreground">
                                {bid.vendorName}
                                {isLowestEligible && (
                                  <span
                                    className="rounded-full bg-tertiary p-1 text-primary"
                                    title="Lowest Calculated Bid"
                                  >
                                    <Trophy className="h-3 w-3" />
                                  </span>
                                )}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-secondary-foreground">
                              {bid.dateSubmitted}
                            </td>
                            <td className="px-4 py-3">
                              <p
                                className={`text-sm font-bold ${
                                  isOverBudget
                                    ? "text-danger"
                                    : "text-primary-foreground"
                                }`}
                              >
                                {formatCurrency(bid.bidAmount)}
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
                              <button
                                className={`rounded-xl p-2 transition-colors ${
                                  bid.documentsValid
                                    ? "bg-information/10 text-information hover:bg-information/20"
                                    : "bg-secondary text-secondary-foreground"
                                }`}
                              >
                                <FileText className="mx-auto h-4 w-4" />
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                disabled={
                                  isOverBudget ||
                                  selectedProject.status !== "Evaluation"
                                }
                                className={`rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                                  selectedProject.status === "Evaluation" &&
                                  !isOverBudget
                                    ? "bg-primary text-white shadow-sm hover:bg-primary/90"
                                    : "cursor-not-allowed bg-secondary text-secondary-foreground"
                                }`}
                              >
                                Award
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                {selectedProject.bids.length === 0 && (
                  <div className="p-6 text-center text-sm font-bold text-secondary-foreground">
                    No bids submitted yet.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
