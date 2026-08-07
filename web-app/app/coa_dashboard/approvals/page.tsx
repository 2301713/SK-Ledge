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
import { ApprovalRequest, UserAccount } from "../types";
import { dummyApprovals } from "@/lib/dummyData";
import { Check, CheckSquare, ClipboardList } from "lucide-react";
import { useAuthStore } from "@/lib/useAuthStore";
import { useRouter } from "next/navigation";

export default function ApprovalsPage() {
  const {
    currentUser,
    isLoading,
    setCurrentUser,
    setIsLoading,
    setUserProfile,
  } = useAuthStore();
  const router = useRouter();

  const [approvalsData, setApprovalsData] =
    useState<ApprovalRequest[]>(dummyApprovals);

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

  const handleApprove = (id: number) => {
    setApprovalsData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Approved" } : item,
      ),
    );
  };

  const pendingCount = approvalsData.filter(
    (item) => item.status === "Pending",
  ).length;
  const approvedCount = approvalsData.length - pendingCount;

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
            trend="Awaiting authorization"
          />
          <StatCard
            label="Authorized"
            value={approvedCount}
            icon={CheckSquare}
            trend="Released to the ledger"
          />
          <StatCard
            label="Total Requests"
            value={approvalsData.length}
            icon={Check}
            trend="In the review queue"
          />
        </div>

        {/* APPROVALS TABLE */}
        <Card>
          <CardHeader
            eyebrow="Awaiting Authorization"
            title="Latest Requests"
            subtitle="Requests pending COA review"
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {approvalsData.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-secondary/50"
                  >
                    <td className="px-4 py-4 align-middle">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-tight text-primary-foreground">
                          {item.department}
                        </span>
                        <span className="text-[11px] font-semibold text-secondary-foreground">
                          Ref: #00{item.id}
                        </span>
                      </div>
                    </td>
                    <td className="max-w-xl px-4 py-4 align-middle">
                      <span className="line-clamp-2 text-sm font-medium text-secondary-foreground leading-tight">
                        {item.purpose}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span className="text-base font-bold tabular-nums text-primary">
                        {item.amount}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-3">
                        <StatusBadge status={item.status} />
                        <button
                          onClick={() => handleApprove(item.id)}
                          disabled={item.status === "Approved"}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                            item.status === "Approved"
                              ? "cursor-not-allowed border border-border bg-secondary text-secondary-foreground"
                              : "bg-primary text-white shadow-sm hover:bg-primary/90"
                          }`}
                        >
                          {item.status === "Approved" ? (
                            <span className="flex items-center gap-1.5">
                              <Check className="h-4 w-4" strokeWidth={3} />
                              Released
                            </span>
                          ) : (
                            "Authorize"
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-2 border-t border-border pt-4 flex justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
              sk-ledge // Internal Audit
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest italic text-secondary-foreground">
              Confidential Enterprise Data
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
