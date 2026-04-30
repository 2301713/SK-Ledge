"use client";

import { useEffect, useState } from "react";
import SideBar from "@/components/SideBar";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "../types";

export default function DisbursementsPage() {
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
          setIsLoading(false);
          return;
        }

        const { data: profileData } = await supabase
          .from("profiles")
          .select("username, role_type, full_name, barangay")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setCurrentUser({
            name: profileData.full_name || profileData.username,
            role: profileData.role_type,
            barangay: profileData.barangay || "N/A",
          });
        }
      } catch (err) {
        console.error("Error loading profile", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  if (isLoading) return <div className="min-h-screen bg-background" />;

  return (
    <div className="flex min-h-screen bg-background selection:bg-tertiary selection:text-primary">
      {currentUser && (
        <SideBar
          userName={currentUser.name}
          roleType={currentUser.role}
          barangay={currentUser.barangay}
        />
      )}

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="absolute top-[-20%] right-[-10%] w-160 h-160 bg-tertiary/5 rounded-full blur-3xl pointer-events-none z-0"></div>

        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-border px-8 flex items-center justify-between z-10 shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold text-primary tracking-tight">
              Pending Disbursements
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground mt-0.5">
              Review Budget Disbursements
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 z-10">
          <div className="max-w-5xl mx-auto space-y-8">
            <section className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-border bg-gray-50/50 flex justify-between items-center">
                <h2 className="text-base font-bold text-primary">
                  Pending Disbursements
                </h2>
                <button className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground hover:text-primary transition-colors">
                  View Ledger &rarr;
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                        Project
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                        Department
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground text-right">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    <tr className="hover:bg-primary/2 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-bold text-primary text-sm group-hover:text-tertiary transition-colors">
                          Office Supplies
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
                          Admin
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-primary tracking-tight">
                          ₱5,000
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-primary/2 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-bold text-primary text-sm group-hover:text-tertiary transition-colors">
                          Fuel Allocation
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
                          Engineering
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-primary tracking-tight">
                          ₱8,000
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
