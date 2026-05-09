"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "../types";
import { useToast } from "@/lib/useToast";
import {
  Calculator,
  DollarSign,
  TrendingUp,
  Save,
  AlertCircle,
  CheckCircle2,
  Target,
  PieChart,
  Heart,
  Leaf,
  Scale,
  GraduationCap,
} from "lucide-react";

interface BudgetCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  allocated: number;
  description: string;
  color: string;
}

export default function ABYIPPage() {
  const router = useRouter();
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalBudget] = useState(150000); // Default ABYIP budget
  const [isSaving, setIsSaving] = useState(false);

  const [categories, setCategories] = useState<BudgetCategory[]>([
    {
      id: "sports-dev",
      name: "Sports & Development",
      icon: <Target className="w-5 h-5" />,
      allocated: 0,
      description: "Youth sports programs and community development",
      color: "bg-blue-500",
    },
    {
      id: "education",
      name: "Education",
      icon: <GraduationCap className="w-5 h-5" />,
      allocated: 0,
      description: "Educational materials and scholarship programs",
      color: "bg-green-500",
    },
    {
      id: "health",
      name: "Health",
      icon: <Heart className="w-5 h-5" />,
      allocated: 0,
      description: "Health awareness and medical assistance programs",
      color: "bg-red-500",
    },
    {
      id: "environment",
      name: "Environment",
      icon: <Leaf className="w-5 h-5" />,
      allocated: 0,
      description: "Environmental protection and sustainability",
      color: "bg-emerald-500",
    },
    {
      id: "governance",
      name: "Governance",
      icon: <Scale className="w-5 h-5" />,
      allocated: 0,
      description: "Youth participation and governance training",
      color: "bg-purple-500",
    },
  ]);

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
          .select("id, username, role_type, full_name, barangay")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError.message);
          return;
        }

        if (profileData) {
          if (
            !["SK_Chairperson", "SK_Treasurer"].includes(profileData.role_type)
          ) {
            console.warn(
              "Unauthorized access: Only SK officials can access ABYIP planning.",
            );
            router.push("/unauthorized");
            return;
          }

          const profile = {
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            role_type: profileData.role_type,
            barangay: profileData.barangay || "No Barangay Assigned",
          };

          setCurrentUser(profile as UserAccount);
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const allocatedTotal = categories.reduce(
    (sum, cat) => sum + cat.allocated,
    0,
  );
  const remainingBudget = totalBudget - allocatedTotal;
  const allocationPercentage =
    totalBudget > 0 ? (allocatedTotal / totalBudget) * 100 : 0;

  const handleAllocationChange = (categoryId: string, amount: number) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, allocated: Math.max(0, amount) }
          : cat,
      ),
    );
  };

  const handleSave = async () => {
    if (allocatedTotal > totalBudget) {
      toast.error("Total allocation exceeds available budget!");
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Save to Supabase/blockchain
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("ABYIP budget plan saved successfully!");
    } catch {
      toast.error("Failed to save budget plan. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-tertiary font-black text-xl shadow-xl shadow-primary/30 mb-6 animate-bounce">
          SK
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Loading ABYIP Planner...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background selection:bg-tertiary selection:text-primary">
      {currentUser && (
        <SideBar
          userName={currentUser.full_name}
          roleType={currentUser.role_type}
          barangay={currentUser.barangay}
        />
      )}

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
        {/* HEADER */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-10 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <Calculator size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                ABYIP Budget Planner
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">
                Annual Barangay Youth Investment Program • 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving || allocatedTotal > totalBudget}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {isSaving ? "Saving..." : "Save Plan"}
            </button>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 z-10">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* BUDGET OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-600">
                      Total Budget
                    </p>
                    <p className="text-2xl font-black text-slate-900">
                      ₱{totalBudget.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-600">
                      Allocated
                    </p>
                    <p className="text-2xl font-black text-slate-900">
                      ₱{allocatedTotal.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      {allocationPercentage.toFixed(1)}% of budget
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`bg-white p-6 rounded-2xl border shadow-sm ${
                  remainingBudget < 0 ? "border-red-200" : "border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`p-2 rounded-lg ${
                      remainingBudget < 0
                        ? "bg-red-50 text-red-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {remainingBudget < 0 ? (
                      <AlertCircle size={20} />
                    ) : (
                      <CheckCircle2 size={20} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-600">
                      Remaining
                    </p>
                    <p
                      className={`text-2xl font-black ${
                        remainingBudget < 0 ? "text-red-600" : "text-slate-900"
                      }`}
                    >
                      ₱{Math.abs(remainingBudget).toLocaleString()}
                    </p>
                    <p
                      className={`text-xs ${
                        remainingBudget < 0 ? "text-red-500" : "text-slate-500"
                      }`}
                    >
                      {remainingBudget < 0 ? "Over budget!" : "Available"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* BUDGET ALLOCATION FORM */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <PieChart size={20} />
                  Budget Allocation by Category
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Distribute your ABYIP budget across youth development programs
                </p>
              </div>

              <div className="p-6 space-y-6">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-6 p-4 bg-slate-50/50 rounded-xl border border-slate-100"
                  >
                    <div
                      className={`p-3 rounded-lg ${category.color} text-white`}
                    >
                      {category.icon}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900">
                        {category.name}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {category.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-500">
                        ₱
                      </span>
                      <input
                        type="number"
                        value={category.allocated || ""}
                        onChange={(e) =>
                          handleAllocationChange(
                            category.id,
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        placeholder="0"
                        min="0"
                      />
                    </div>

                    <div className="text-right min-w-20">
                      <p className="text-sm font-bold text-slate-900">
                        {totalBudget > 0
                          ? ((category.allocated / totalBudget) * 100).toFixed(
                              1,
                            )
                          : 0}
                        %
                      </p>
                      <p className="text-xs text-slate-500">of total</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ALLOCATION SUMMARY */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-black text-slate-900 mb-4">
                Allocation Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories
                  .filter((cat) => cat.allocated > 0)
                  .sort((a, b) => b.allocated - a.allocated)
                  .map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded ${category.color} text-white`}
                        >
                          {category.icon}
                        </div>
                        <span className="text-sm font-bold text-slate-900">
                          {category.name}
                        </span>
                      </div>
                      <span className="text-sm font-black text-slate-900">
                        ₱{category.allocated.toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
              {categories.every((cat) => cat.allocated === 0) && (
                <p className="text-sm text-slate-500 text-center py-4">
                  No budget allocated yet. Start by entering amounts above.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
