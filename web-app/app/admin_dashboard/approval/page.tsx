"use client";

import LogoLoader from "@/components/LogoLoader";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import TopBar from "@/components/dashboard/ui/TopBar";
import PageHeader from "@/components/dashboard/ui/PageHeader";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import StatusBadge from "@/components/dashboard/ui/StatusBadge";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/useAuthStore";
import { Check, Loader2, X } from "lucide-react";

interface AccountRow {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role_type: string;
  barangay: string;
  approval_status: string;
}

export default function AccountsPage() {
  const router = useRouter();
  const {
    currentUser,
    isLoading,
    setCurrentUser,
    setIsLoading,
    setUserProfile,
  } = useAuthStore();

  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const authAttemptedRef = useRef(false);

  useEffect(() => {
    const loadUser = async () => {
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

        if (profileError || !profileData) {
          router.push("/login");
          return;
        }

        if (profileData.role_type !== "Admin") {
          router.push("/unauthorized");
          return;
        }

        const profile = {
          id: profileData.id,
          username: profileData.username,
          full_name: profileData.full_name || profileData.username,
          role_type: profileData.role_type,
          barangay: profileData.barangay || "N/A",
          email: profileData.email,
          approval_status: profileData.approval_status,
        };

        setCurrentUser(profile);
        setUserProfile(profile);

        const { data: accountRows, error: accountsError } = await supabase
          .from("profiles")
          .select(
            "id, username, full_name, role_type, barangay, email, approval_status",
          )
          .order("full_name", { ascending: true });

        if (accountsError) throw accountsError;
        setAccounts((accountRows as AccountRow[]) || []);
      } catch (error) {
        console.error("Failed to load admin dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authAttemptedRef.current) {
      authAttemptedRef.current = true;
      loadUser();
    }
  }, [router, setCurrentUser, setIsLoading, setUserProfile]);

  const normalizeStatus = (value?: string | null) => {
    const normalized = value?.toString().trim().toLowerCase();
    if (!normalized || normalized === "null" || normalized === "undefined") {
      return "pending";
    }
    return normalized;
  };

  const handleStatusChange = async (
    id: string,
    status: "approved" | "rejected",
  ) => {
    setBusyId(id);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ approval_status: status })
        .eq("id", id);

      if (error) throw error;

      setAccounts((prev) =>
        prev.map((account) =>
          account.id === id ? { ...account, approval_status: status } : account,
        ),
      );

      alert(`Account has been successfully ${status}!`);
    } catch (error: unknown) {
      console.error("Failed to update account status:", error);
      alert(
        `Failed to update status: ${(error as Error).message || "Database permission denied."}`,
      );
    } finally {
      setBusyId(null);
    }
  };

  const pendingAccounts = accounts.filter(
    (account) => normalizeStatus(account.approval_status) === "pending",
  );

  const filteredAccounts = useMemo(() => {
    const query = search.toLowerCase();
    if (!query) return pendingAccounts;
    return pendingAccounts.filter((account) =>
      [
        account.full_name,
        account.username,
        account.email,
        account.role_type,
        account.barangay,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [pendingAccounts, search]);

  if (isLoading) return <LogoLoader />;

  return (
    <div className="flex min-h-screen gap-4 bg-background p-4">
      {currentUser && (
        <SideBar
          userName={currentUser.full_name}
          roleType={currentUser.role_type}
          barangay={currentUser.barangay}
        />
      )}

      <main className="min-w-0 flex-1 space-y-6 py-2 animate-fadein">
        <TopBar
          userName={currentUser?.full_name ?? "Admin"}
          userEmail={currentUser?.email}
          searchValue={search}
          onSearchChange={setSearch}
        />

        <PageHeader
          eyebrow="Account Management"
          title="User Accounts"
          subtitle={`${pendingAccounts.length} account(s) pending your review.`}
        />

        <Card>
          <CardHeader
            eyebrow="Queue"
            title="Pending account reviews"
            subtitle="Approve or reject new access requests from SK-Ledge users."
          />

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-3 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-secondary-foreground">
                    Name
                  </th>
                  <th className="px-3 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-secondary-foreground">
                    Role
                  </th>
                  <th className="px-3 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-secondary-foreground">
                    Barangay
                  </th>
                  <th className="px-3 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-secondary-foreground">
                    Status
                  </th>
                  <th className="px-3 py-3 text-right text-[11px] font-bold uppercase tracking-[0.16em] text-secondary-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-10 text-center text-sm text-secondary-foreground"
                    >
                      No pending account reviews at the moment.
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((account) => {
                    const status = normalizeStatus(account.approval_status);
                    const isFinalized =
                      status === "approved" || status === "rejected";

                    return (
                      <tr
                        key={account.id}
                        className="transition hover:bg-secondary/40"
                      >
                        <td className="px-3 py-4">
                          <p className="font-semibold text-primary-foreground">
                            {account.full_name}
                          </p>
                          <p className="text-xs text-secondary-foreground">
                            {account.email}
                          </p>
                        </td>
                        <td className="px-3 py-4 text-primary-foreground">
                          {account.role_type}
                        </td>
                        <td className="px-3 py-4 text-primary-foreground">
                          {account.barangay || "N/A"}
                        </td>
                        <td className="px-3 py-4">
                          <StatusBadge status={status} showDot />
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() =>
                                handleStatusChange(account.id, "approved")
                              }
                              disabled={busyId === account.id || isFinalized}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-success px-3 py-2 text-xs font-bold text-white transition hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {busyId === account.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                handleStatusChange(account.id, "rejected")
                              }
                              disabled={busyId === account.id || isFinalized}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-danger px-3 py-2 text-xs font-bold text-white transition hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {busyId === account.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
