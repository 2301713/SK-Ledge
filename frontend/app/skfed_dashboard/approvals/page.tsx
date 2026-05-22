"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/useAuthStore";
import { useToast } from "@/lib/useToast";
import {
  CheckSquare,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
} from "lucide-react";

interface PendingUser {
  id: string;
  username: string;
  full_name: string;
  role_type: string;
  barangay: string;
  created_at: string;
  approval_status: string;
}

export default function ApprovalsPage() {
  const { currentUser, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  const toast = useToast();

  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!currentUser || currentUser.role_type !== "SK_Federation")) {
      router.push("/login");
      return;
    }

    if (currentUser) {
      fetchPendingUsers();
    }
  }, [currentUser, authLoading, router]);

  const fetchPendingUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("approval_status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPendingUsers(data || []);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      toast.error("Failed to load pending users.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string, fullName: string) => {
    setActionLoadingId(id);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ approval_status: "approved" })
        .eq("id", id);

      if (error) throw error;
      
      toast.success(`${fullName} has been approved.`);
      setPendingUsers((prev) => prev.filter((user) => user.id !== id));
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error("Failed to approve user.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string, fullName: string) => {
    setActionLoadingId(id);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ approval_status: "rejected" })
        .eq("id", id);

      if (error) throw error;
      
      toast.success(`${fullName} has been rejected.`);
      setPendingUsers((prev) => prev.filter((user) => user.id !== id));
    } catch (error) {
      console.error("Error rejecting user:", error);
      toast.error("Failed to reject user.");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (authLoading || !currentUser) return null;

  return (
    <div className="flex min-h-screen bg-secondary selection:bg-tertiary selection:text-primary">
      <SideBar
        userName={currentUser.full_name}
        roleType={currentUser.role_type}
        barangay={currentUser.barangay}
      />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        {/* TOP NAVBAR */}
        <header className="h-24 px-10 flex items-center justify-between shrink-0 bg-white/50 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-20">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Account Approvals
            </h1>
            <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <CheckSquare className="w-3.5 h-3.5 text-primary" /> Review Pending Registrations
            </div>
          </div>
        </header>

        <div className="px-10 py-10 space-y-8 max-w-6xl mx-auto w-full">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Pending Accounts
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {pendingUsers.length} users awaiting approval
                </p>
              </div>
            </div>

            <div className="p-8">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                  <p className="text-sm font-bold uppercase tracking-widest">Loading accounts...</p>
                </div>
              ) : pendingUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CheckSquare className="w-12 h-12 mb-4 text-slate-300" />
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-500">All caught up!</p>
                  <p className="text-xs mt-1">There are no pending accounts to review.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:border-primary/30 transition-colors group gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">
                            {user.full_name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            @{user.username}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-6 text-sm">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Role</p>
                          <p className="font-semibold text-slate-700">{user.role_type.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Barangay</p>
                          <p className="font-semibold text-slate-700">{user.barangay}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2 sm:mt-0">
                          <button
                            onClick={() => handleApprove(user.id, user.full_name)}
                            disabled={actionLoadingId === user.id}
                            className="flex items-center gap-1.5 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-700 font-bold rounded-xl transition-colors disabled:opacity-50"
                          >
                            {actionLoadingId === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(user.id, user.full_name)}
                            disabled={actionLoadingId === user.id}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-700 font-bold rounded-xl transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
