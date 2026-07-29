"use client";

import LogoLoader from "@/components/LogoLoader";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/useAuthStore";
import { Check, X, Loader2, Search } from "lucide-react";

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
      // Let the user know exactly why it failed (e.g., RLS Block, Network issues)
      alert(
        `Failed to update status: ${(error as Error).message || "Database permission denied."}`,
      );
    } finally {
      setBusyId(null);
    }
  };

  const pendingAccounts = accounts.filter((account) => {
    return normalizeStatus(account.approval_status) === "pending";
  });

  const filteredAccounts = pendingAccounts.filter((account) => {
    const query = search.toLowerCase();
    return [
      account.full_name,
      account.username,
      account.email,
      account.role_type,
      account.barangay,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  if (isLoading) return <LogoLoader />;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {currentUser && (
        <SideBar
          userName={currentUser.full_name}
          roleType={currentUser.role_type}
          barangay={currentUser.barangay}
        />
      )}

      <main className="flex-1 p-8 lg:p-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              Account Management
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              User Accounts
            </h1>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Pending account reviews
              </h2>
              <p className="text-sm text-slate-500">
                Approve or reject new access requests from SK-Ledge users.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Barangay
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-slate-500"
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
                      <tr key={account.id} className="hover:bg-slate-50">
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-900">
                            {account.full_name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {account.email}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {account.role_type}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {account.barangay || "N/A"}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${status === "approved" ? "bg-emerald-100 text-emerald-700" : status === "rejected" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}
                          >
                            {status || "pending"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() =>
                                handleStatusChange(account.id, "approved")
                              }
                              disabled={busyId === account.id || isFinalized}
                              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
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
        </section>
      </main>
    </div>
  );
}
